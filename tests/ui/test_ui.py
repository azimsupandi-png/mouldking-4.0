"""UI tests for app/src/main/assets/index.html in headless Chromium.

A fake MK6Bridge stands in for Android, so the real-hub code paths run.
Run:  python tests/ui/test_ui.py      (needs: pip install playwright; python -m playwright install chromium)
Exit code 0 = all passed.
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = 'file://' + os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'index.html')
STUB = """
window.__calls=[];window.__bt=true;
window.MK6Bridge={start:function(m){__calls.push('start:'+m)},send:function(f){__calls.push('send')},stop:function(){__calls.push('stop')},
 haptic:function(k){__calls.push('haptic:'+k)},tilt:function(){},immersive:function(){},battery:function(){return 84},btOn:function(){return __bt},
 btSettings:function(){__calls.push('btSettings')},exportFile:function(){__calls.push('export')},importFile:function(){__calls.push('import')},
 pickWallpaper:function(){},autoBackup:function(){},pinModel:function(){},shortcuts:function(){},
 stats:function(){return JSON.stringify({mode:'single',hubs:1,ok:120,fail:2,frames:130,watchdog:0,up:65000,lastFrameAgo:40,tx:1,err:4,errAgo:5000})},
 theme:function(l){__calls.push('theme:'+l)},textZoom:function(p){__calls.push('zoom:'+p)},shareFile:function(n,j,t){window.__share=[n,j];__calls.push('share')}};"""
RESULTS = []
def check(name, ok, info=''):
    RESULTS.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name + ('' if ok else '  -> ' + repr(info)))

async def page(b, w=390, h=844, touch=False):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=touch, is_mobile=touch)
    pg = await ctx.new_page()
    pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
    await pg.add_init_script(STUB)
    await pg.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    await pg.goto(HTML)
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('gSkip').click()")
    return ctx, pg

W = "new Promise(r=>setTimeout(()=>r(%s),400))"

async def t_click_everything(b):
    errs = []
    total = 0
    for v in ['home', 'drive', 'models', 'medit', 'tpl', 'settings', 'hub', 'safety', 'backup', 'm-tilt', 'm-pad', 'm-app', 'm-log']:
        ctx, pg = await page(b)
        await pg.evaluate("mk6Go('home');document.getElementById('hConn').click();onHubState('ready')")
        for _ in range(2):
            await pg.evaluate(f"mk6Go('{v}')")
            await pg.wait_for_timeout(120)
            n = await pg.evaluate("(()=>{const bs=[...document.querySelectorAll('main button, main input[type=checkbox], main summary')].filter(e=>e.offsetParent&&!e.disabled&&e.id!=='lockBtn'&&e.id!=='playerBtn');window.__q=bs;return bs.length})()")
            for i in range(n):
                await pg.evaluate(f"(()=>{{const e=window.__q[{i}];if(e&&e.isConnected&&e.offsetParent){{e.dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}));e.dispatchEvent(new PointerEvent('pointerup',{{bubbles:true}}));e.click()}}}})()")
                total += 1
            await pg.wait_for_timeout(250)
            await pg.evaluate("['#dashTpl','#jcDlg','#lxDlg','#guide','#player'].forEach(q=>{var e=document.querySelector(q);if(e)e.hidden=true})")
        errs += [v + ': ' + e for e in pg.errors]
        await ctx.close()
    check(f'click every control on 13 screens ({total} clicks) without JS errors', not errs and total > 100, errs[:5])

async def t_hub_paths(b):
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('home');__calls=[];document.getElementById('hConn').click()")
    check('Connect calls MK6Bridge.start', 'start:0' in await pg.evaluate("__calls.join(',')"))
    r = await pg.evaluate("onHubState('connecting');onHubState('ready');" + W % "[document.documentElement.dataset.v,document.querySelector('#v2Pill .ptx').textContent]")
    check('ready opens Drive and the pill shows Hub active', r == ['drive', 'Hub active'], r)
    r = await pg.evaluate("__calls=[];new Promise(r=>setTimeout(()=>r(__calls.filter(c=>c=='send').length),1200))")
    check('idle keep-alive sends at most ~1 frame/s at zero', r <= 3, r)
    r = await pg.evaluate("mk6Go('home');onHubState('error');" + W % "[...document.querySelectorAll('#hAlerts h2')].map(e=>e.textContent)")
    check('lost link shows Connection lost alert', 'Connection lost' in r, r)
    r = await pg.evaluate("onHubState('off');__bt=true;onAppEvent('bt1');" + W % "document.querySelector('#v2Pill .ptx').textContent")
    check('Bluetooth back on clears the stale message', r == 'Connect hub', r)
    r = await pg.evaluate("__calls=[];mk6Go('settings');document.getElementById('sPrac').click();mk6Go('home');document.getElementById('hConn').click();" + W % "__calls.filter(c=>c.startsWith('start')||c=='send').length")
    check('practice mode never calls the hub', r == 0, r)
    r = await pg.evaluate("onAppEvent('watchdog');document.querySelector('.toast').textContent")
    check('watchdog event shows the safety-stop message', 'Safety stop' in r, r)
    check('no JS errors (hub paths)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_hold(b):
    ctx, pg = await page(b, touch=True)
    cdp = await ctx.new_cdp_session(pg)
    async def touch(sel, ms, move=6):
        await pg.locator(sel).first.evaluate("e=>e.scrollIntoView({block:'center'})")
        await pg.wait_for_timeout(200)
        bx = await pg.locator(sel).first.bounding_box(); x = bx['x'] + bx['width'] / 2; y = bx['y'] + bx['height'] / 2
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
        await pg.wait_for_timeout(120)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x + move, 'y': y + move}]})
        await pg.wait_for_timeout(ms)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        await pg.wait_for_timeout(250)
    await pg.evaluate("mk6Go('home');__calls=[]")
    await touch('#hPS .psb', 50)
    check('Home START/STOP short tap does not connect', 'start' not in await pg.evaluate("__calls.join(',')"))
    await pg.evaluate("__calls=[]")
    await touch('#hPS .psb', 650)
    check('Home START/STOP hold (finger wobble) connects', 'start:0' in await pg.evaluate("__calls.join(',')"))
    await pg.evaluate("onHubState('ready')")
    await pg.wait_for_timeout(500)
    await pg.evaluate("mk6Go('drive');document.getElementById('bdEdit').click();document.getElementById('bdTPS').click();document.getElementById('bdAdd').click();document.getElementById('bdEdit').click();__calls=[]")
    await touch('#boardGrid .psb', 650)
    check('board START/STOP widget hold disconnects', 'stop' in await pg.evaluate("__calls.join(',')"))
    check('no JS errors (hold)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_idle(b):
    ctx, pg = await page(b)
    bad = {}
    for v in ['home', 'models', 'settings', 'hub']:
        n = await pg.evaluate(f"mk6Go('{v}');new Promise(r=>setTimeout(()=>{{let n=0;const o=new MutationObserver(m=>n+=m.length);o.observe(document.body,{{subtree:true,childList:true,characterData:true,attributes:true}});setTimeout(()=>{{o.disconnect();r(n)}},2000)}},4000))")
        if n > 4: bad[v] = n
    check('idle screens make no repeated DOM writes', not bad, bad)
    check('idle update rate drops to 4 Hz', await pg.evaluate("mk6Rate()") == 250)
    await pg.evaluate("document.dispatchEvent(new PointerEvent('pointerdown'));document.dispatchEvent(new PointerEvent('pointerup'))")
    check('first touch wakes the 20 Hz loop at once', await pg.evaluate("mk6Rate()") == 50)
    await ctx.close()

async def t_screens(b):
    ctx, pg = await page(b, 360, 740)
    await pg.evaluate("var l=document.getElementById('lang');l.value='ms';l.dispatchEvent(new Event('change'))")
    over = {}
    for v in ['home', 'drive', 'models', 'settings', 'hub', 'tpl', 'medit']:
        r = await pg.evaluate(f"mk6Go('{v}');new Promise(r=>setTimeout(()=>r([...document.querySelectorAll('body *')].filter(e=>{{const q=e.getBoundingClientRect();return e.offsetParent&&q.width>0&&q.right>document.documentElement.clientWidth+1}}).length),300))")
        if r: over[v] = r
    check('no horizontal overflow at 360 px (Malay)', not over, over)
    await ctx.close()

async def t_features(b):
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('tpl');document.querySelector('[data-wiz=exc]').click()")
    r = await pg.evaluate("mk6Go('models');document.querySelectorAll('#mList .v2-mcard').length")
    check('models gallery lists both models + new card', r == 3, r)
    r = await pg.evaluate("var q=document.getElementById('mSearch');q.value='exc';q.dispatchEvent(new Event('input'));document.querySelectorAll('#mList .v2-mcard').length")
    check('model search filters', r == 1, r)
    r = await pg.evaluate("q.value='';q.dispatchEvent(new Event('input'));var m=document.querySelectorAll('#mList .v2-mmain')[0];m.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));new Promise(r=>setTimeout(()=>{m.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));m.click();r(document.documentElement.dataset.v)},750))")
    check('long press on a model opens its settings', r == 'medit', r)
    r = await pg.evaluate("mk6Go('hub');document.querySelector('#hubSlots .btn').click();" + W % "[document.getElementById('hub1').value,document.querySelectorAll('#chTest .v2-knob-b').length]")
    check('Hub: Add second hub gives 12 test knobs', r == ['1', 12], r)
    r = await pg.evaluate("document.querySelector('#hubSlots .btn').click();" + W % "document.getElementById('hub1').value")
    check('Hub: Remove second hub', r == '-1', r)
    r = await pg.evaluate("mk6Go('m-app');document.getElementById('lockBtn').click();mk6Go('drive');" + W % "[getComputedStyle(document.getElementById('recCard')).display,getComputedStyle(document.querySelector('[data-tab=models]')).display]")
    check('lock mode hides Record and the Models tab', r == ['none', 'none'], r)
    r = await pg.evaluate("mk6Go('hub');[mk6Back(),document.documentElement.dataset.v,mk6Back(),document.documentElement.dataset.v,mk6Back()]")
    check('Android Back goes up, then Home, then leaves', r == [True, 'settings', True, 'home', False], r)
    check('no JS errors (features)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_graphics(b):
    ctx, pg = await page(b)
    await pg.wait_for_timeout(900)
    check('splash is removed after start', await pg.evaluate("!document.getElementById('v2Splash')"))
    r = await pg.evaluate("mk6Go('drive');new Promise(r=>setTimeout(()=>r([document.documentElement.classList.contains('v2-nohub'),[...document.querySelectorAll('#boardGrid > .bdw.v2-es')].length]),400))")
    check('no hub: widgets dimmed, E-Stop widget kept bright', r[0] and r[1] >= 1, r)
    await pg.evaluate("mk6Go('home');document.getElementById('hConn').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[...document.querySelectorAll('#hPS .pssvg path')].map(l=>l.getAttribute('stroke')).filter(c=>c&&c.indexOf('255,216,74')>=0||c==='#ffd84a').length")
    check('pairing: a yellow tail runs round the START/STOP ring', r >= 2, r)
    r = await pg.evaluate("onHubState('ready');new Promise(r=>setTimeout(()=>r([document.getElementById('v2Pill').classList.contains('v2-pulse'),document.documentElement.classList.contains('v2-nohub')]),400))")
    check('connected: pill pulses once, widgets undimmed', r == [True, False], r)
    await pg.evaluate("document.querySelector('[data-wiz=empty]').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var e=document.getElementById('bdEdit');if(e.getAttribute('aria-pressed')==='true')e.click()")
    r = await pg.evaluate("new Promise(r=>setTimeout(()=>r([!document.getElementById('v2BdEmpty').hidden,!document.getElementById('v2RecEmpty').hidden,!document.getElementById('v2SeqEmptyW').hidden]),400))")
    check('empty board / recordings / sequences show their empty states', r == [True, True, True], r)
    r = await pg.evaluate("document.querySelector('#v2SeqEmptyW .btn').click();new Promise(r=>setTimeout(()=>r(document.getElementById('v2SeqEmptyW').hidden),400))")
    check('New sequence from the empty state creates one', r, r)
    await pg.evaluate("mk6Go('settings');document.getElementById('sLight').click()")
    await pg.reload(); await pg.wait_for_function('window.mk6Ready===true', timeout=15000); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.documentElement.dataset.ui,getComputedStyle(document.querySelector('.v2-nav')).backgroundColor]")
    check('light theme switch is kept after restart', r == ['light', 'rgb(255, 255, 255)'], r)
    check('no JS errors (graphics)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_extras(b):
    ctx, pg = await page(b)
    await pg.evaluate("document.getElementById('hConn').click();onHubState('ready');mk6Go('hub');document.getElementById('hubDiag').open=true")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[...document.querySelectorAll('#diagList dt')].map(e=>e.textContent).join('|')+' :: '+[...document.querySelectorAll('#diagList dd')].map(e=>e.textContent).join('|')")
    check('diagnostics show send mode, counts and the last error', '1 hub' in r and '130' in r and 'internal Bluetooth error' in r and 'Error time' in r, r)
    await pg.evaluate("__calls=[];mk6Go('settings');document.getElementById('sText').click();document.getElementById('sHC').click();document.getElementById('sLight').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[__calls.filter(c=>/^(zoom|theme)/.test(c)).join(','),document.documentElement.hasAttribute('data-hc'),document.getElementById('sTextV').textContent]")
    check('text size, high contrast and status bar theme reach Android', 'zoom:115' in r[0] and 'theme:true' in r[0] and r[1] and r[2] == 'Large', r)
    await pg.evaluate("document.getElementById('sLight').click();document.getElementById('sHC').click()")
    r = await pg.evaluate("mk6Go('medit');document.getElementById('mShare').click();new Promise(r=>setTimeout(()=>{var s=window.__share;r(s?[s[0],JSON.parse(s[1]).profiles.length,!!JSON.parse(s[1]).profiles[0].cfg]:null)},300))")
    check('Share model sends one model as a .mk6.json file', r and r[0].endswith('.mk6.json') and r[1] == 1 and r[2], r)
    n0 = await pg.evaluate("document.querySelectorAll('#mList .v2-mcard:not(.v2-madd)').length||(mk6Go('models'),document.querySelectorAll('#mList .v2-mcard:not(.v2-madd)').length)")
    await pg.evaluate("onSharedModel(window.__share[1])")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.documentElement.dataset.v,[...document.querySelectorAll('#hAlerts h2')].map(h=>h.textContent).join('|')]")
    check('a received model file shows an Add card on Home', r[0] == 'home' and 'Model received' in r[1], r)
    await pg.evaluate("[...document.querySelectorAll('#hAlerts button')].find(b=>b.textContent==='Add to my models').click()")
    await pg.wait_for_timeout(300)
    n1 = await pg.evaluate("mk6Go('models');document.querySelectorAll('#mList .v2-mcard:not(.v2-madd)').length")
    check('Add to my models imports it', n1 == n0 + 1, [n0, n1])
    # a short recording, ticked as a quick button, replays from Quick actions
    await pg.evaluate("mk6Go('drive');document.getElementById('recBtn').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var r=document.querySelector('#boardGrid input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=60;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(500)
    await pg.evaluate("var r=document.querySelector('#boardGrid input[type=range]');r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('recBtn').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var q=document.getElementById('recQuick');q.checked=true;q.dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("(()=>{var b=document.querySelector('#quick .qrec');if(!b) return null;var vis=!document.getElementById('quickCard').hidden;b.click();return new Promise(r=>setTimeout(()=>r([vis,b.textContent,document.getElementById('playBtn').textContent]),150))})()")
    check('recording ticked as a quick button shows and plays', r and r[0] and r[1].startswith('\u25a0') and r[2] == 'Stop', r)
    check('no JS errors (extras)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for t in (t_hub_paths, t_hold, t_idle, t_screens, t_features, t_graphics, t_extras, t_click_everything):
            try:
                await t(b)
            except Exception as e:
                check(t.__name__ + ' ran', False, str(e)[:300])
        await b.close()
    failed = [n for n, ok in RESULTS if not ok]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
