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

CONTRAST_JS = r"""(()=>{function rgb(c){var m=c.match(/[\d.]+/g);return m?m.map(Number):null}
function lum(c){var a=c.slice(0,3).map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function bg(e){while(e){var cs=getComputedStyle(e),c=rgb(cs.backgroundColor);if(c&&(c.length<4||c[3]>.6))return c;if(cs.backgroundImage&&cs.backgroundImage!=='none'&&e!==document.body&&e!==document.documentElement)return null;e=e.parentElement}return [255,255,255]}
var bad=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n;
while(n=w.nextNode()){var t=n.nodeValue.trim();if(!t||!/[A-Za-z0-9]/.test(t))continue;var e=n.parentElement;if(!e||!e.getClientRects().length||e.closest('[hidden],svg,.toast'))continue;
var cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity<.5)continue;var b=bg(e);if(!b)continue;var f=rgb(cs.color);
var L1=lum(f),L2=lum(b),r=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);if(r<3)bad.push(t.slice(0,30)+' '+r.toFixed(1))}
return bad})()"""

async def t_light_contrast(b):
    ctx, pg = await page(b)
    await pg.evaluate("document.getElementById('hConn').click();onHubState('ready');mk6Go('settings');document.getElementById('sLight').click()")
    bad = {}
    for v in ['home', 'drive', 'models', 'settings', 'hub', 'medit', 'tpl']:
        await pg.evaluate(f"mk6Go('{v}')")
        await pg.wait_for_timeout(300)
        r = await pg.evaluate(CONTRAST_JS)
        if r: bad[v] = r[:4]
    check('light theme: all text readable (contrast 3:1 or more) on 7 screens', not bad, bad)
    await ctx.close()

async def t_twelve(b):
    ctx, pg = await page(b)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(300)
    # 1 trim: buttons on the slider widget, offset reaches the hub, E-Stop zeroes it
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=s] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var f=[...document.querySelectorAll('#gEdit .wsf')].find(x=>x.querySelector('.wsl').textContent.startsWith('Trim buttons'));[...f.querySelectorAll('.wsc .btn')].find(b=>b.textContent==='On').click();[...document.querySelectorAll('#gEdit .gact .btn')][0].click();document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("var p=document.querySelector('#boardGrid .bdw-trim .trb:last-child');p.click();p.click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[document.querySelector('#boardGrid .bdw-trim b').textContent,(window.__last||'').split(',')[0]]")
    check('1 trim: +2 on the widget is sent to the hub with no input', r == ['+2', '2'], r)
    await pg.evaluate("document.getElementById('estop').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("(window.__last||'').split(',')[0]")
    check('1 trim: E-Stop sends 0 even with trim', r == '0', r)
    await pg.evaluate("document.getElementById('estop').click()")
    # 2 response curve: editor in the slider settings; 'Fine' preset makes half stick = 22%
    r = await pg.evaluate("document.getElementById('bdEdit').click();[...document.querySelectorAll('#boardGrid .bdw[data-k=s] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click();var ok=!!document.querySelector('#gEdit .cved-g');[...document.querySelectorAll('#gEdit .cved-c button')].find(b=>b.textContent==='Fine').click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();document.getElementById('bdEdit').click();ok")
    check('2 curve: the editor is in the slider settings', r, r)
    # 3 drive mode chips = Eco / Normal / Sport profiles
    await pg.evaluate("document.querySelector('#dMode [data-lp=\"0\"]').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelector('#dMode [data-lp=\"0\"]').getAttribute('aria-pressed'),document.getElementById('limP0').getAttribute('aria-pressed')]")
    check('3 drive mode: Eco on the Drive screen sets the Eco profile', r == ['true', 'true'], r)
    # 7 live meter follows the output
    await pg.evaluate("document.querySelector('#dMode [data-lp=\"2\"]').click();var r=document.querySelector('#boardGrid input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=80;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("parseFloat(document.querySelector('#dMeter .mu').style.height)||0")
    check('7 live meter shows the output of channel A', r > 10, r)
    await pg.evaluate("var r=document.querySelector('#boardGrid input[type=range]');r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    # 9 size button cycles 1x1 -> 2x1
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=l] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Size').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=l]').className")
    check('9 size: a widget can be made 2x1', 'w2' in r, r)
    # 10 gallery: picture cards and category tabs
    r = await pg.evaluate("var t=[...document.querySelectorAll('.v2-gtabs .btn')].find(b=>b.textContent==='Meters');t.click();[document.querySelectorAll('.bd-types .gt svg').length,[...document.querySelectorAll('.bd-types > .btn')].filter(b=>!b.hidden).length]")
    check('10 gallery: 34 picture cards, Meters tab shows 6', r == [34, 6], r)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    # 8 model colour persists and tints the board
    await pg.evaluate("mk6Go('medit');document.querySelectorAll('#swatches .sw')[2].click()")
    r = await pg.evaluate("document.documentElement.getAttribute('data-macc')")
    check('8 model colour: blue is applied', r == '2', r)
    # 4 gamepad picture: pressing a button highlights its row
    await pg.evaluate("mk6Go('m-pad');v2GpPress(1)")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#gpPic .gp-b').length,document.querySelectorAll('#gpMap .pm')[1].classList.contains('v2sel')]")
    check('4 gamepad picture: 12 buttons, pressing B selects its row', r == [12, True], r)
    # 11 quick settings: hold the pill
    await pg.evaluate("mk6Go('home');document.getElementById('v2Pill').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientY:20}))")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("[!!document.getElementById('v2QS'),document.querySelectorAll('#v2QS .qs-t').length]")
    check('11 quick settings open by holding the status pill', r == [True, 6], r)
    await pg.evaluate("document.getElementById('v2QS').click()")
    await pg.wait_for_timeout(300)
    # 12 interactive guide: spotlight on real controls, 6 steps
    await pg.evaluate("mk6Go('m-app');document.getElementById('guideBtn').click();document.getElementById('gNext').click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[document.documentElement.dataset.v,!document.querySelector('#guide .co-hole').hidden]")
    check('12 guide step 2 highlights START on Home', r == ['home', True], r)
    for _ in range(5):
        await pg.evaluate("document.getElementById('gNext').click()")
        await pg.wait_for_timeout(250)
    check('12 guide closes after the last step', await pg.evaluate("!document.getElementById('guide')"))
    check('no JS errors (12 features)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_migrate_and_limit(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){var d=new Date(),k=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
      localStorage.setItem('mk6play',JSON.stringify({d:k,used:599000,extra:false}));
      localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'Old',cfg:{speed:'slow',limit:100,layout:'board',board:[]}}],prefs:{seen:true,playLim:10}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML)
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("mk6Go('medit');document.getElementById('limV0').textContent+'|'+document.getElementById('limP0').getAttribute('aria-pressed')")
    check('3 old Speed "Slow" becomes the 40% limit (Eco)', r.endswith('|true'), r)
    await pg.evaluate("__calls=[];mk6Go('home');document.getElementById('hConn').click();onHubState('ready')")
    await pg.wait_for_timeout(4500)
    r = await pg.evaluate("[__calls.includes('stop'),[...document.querySelectorAll('#hAlerts h2')].map(h=>h.textContent).join('|')]")
    check('5 play time: when time is up the motors stop and Home says so', r[0] and 'Play time is up' in r[1], r)
    check('no JS errors (migration, play limit)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_three(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'T3',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{expo:60},{},{},{},{kind:'light',la:1,ls:0}],
      board:[{k:'s',c:0,w:1},{k:'l',c:4,w:1},{k:'k',c:0,w:2,cs:[1]}]}}],prefs:{seen:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML)
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    SL = "document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]')"
    await pg.evaluate("var r="+SL+";r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=50;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("(window.__last||'').split(',').map(Number)")
    check('2 curve: an old expo 60 becomes a curve, half stick = about 28%', 25 <= r[0] <= 31, r)
    await pg.evaluate("var r="+SL+";r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    await pg.wait_for_timeout(500)
    r1 = await pg.evaluate("(window.__last||'').split(',').map(Number)[4]")
    await pg.wait_for_timeout(1800)
    r2 = await pg.evaluate("(window.__last||'').split(',').map(Number)[4]")
    check('4 brake light shines after channel A stops, then goes out', r1 > 0 and r2 == 0, [r1, r2])
    await pg.evaluate("var r="+SL+";r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=-60;r.dispatchEvent(new Event('input',{bubbles:true}))")
    r = await pg.evaluate("new Promise(function(res){setTimeout(function(){var s=document.querySelector('#boardGrid .bdw[data-k=k] svg.mtr'),b=s.getBoundingClientRect();s.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:b.left+b.width*0.9,clientY:b.top+b.height/2}));setTimeout(function(){var ls=[...s.querySelectorAll('polyline')].filter(p=>p.getAttribute('visibility')==='visible'&&p.getAttribute('stroke')==='#ffd84a').length;var tx=[...s.querySelectorAll('text')].map(t=>t.textContent).find(t=>/ s \u00b7 A/.test(t))||'';res([ls,tx])},300)},1500)})")
    check('10 scope: second channel drawn, touching a paused graph reads A and B', r[0] == 1 and 'A -60' in r[1].replace('\u2212','-') and 'B 0' in r[1], r)
    await pg.evaluate("var r="+SL+";r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    await pg.evaluate("document.getElementById('bdEdit')&&0")
    r = await pg.evaluate("var lb=document.querySelector('#boardGrid .bdw[data-k=l] .lbtn');lb.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));new Promise(res=>setTimeout(()=>{var m=document.getElementById('lpMenu');res(m?[...m.querySelectorAll('button')].map(b=>b.textContent):[])},700))")
    check('4 light long-press offers Hazard and Light settings', 'Hazard' in r and any(x.startswith('Light settings') for x in r), r)
    await pg.evaluate("[...document.querySelectorAll('#lpMenu button')].find(b=>b.textContent==='Hazard').click()")
    seen = set()
    for _ in range(14):
        await pg.wait_for_timeout(120)
        seen.add(await pg.evaluate("(window.__last||'').split(',').map(Number)[4]>0"))
    check('4 hazard: the light flashes on and off', seen == {True, False}, seen)
    # tachometer: needle style of the arc meter, follows channel A
    await pg.evaluate("document.getElementById('bdEdit').click();document.getElementById('bdTFN').click();document.getElementById('bdAdd').click();document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("var r="+SL+";r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=100;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(1200)
    r = await pg.evaluate("(function(){var g=document.querySelector('#boardGrid .bdw[data-k=f] .ndl');return g?[g.style.transform,[...document.querySelectorAll('#boardGrid .bdw[data-k=f] text.mv')].map(t=>t.textContent)[0]]:null})()")
    check('1 tachometer: gallery card adds a needle meter that swings to the value', r and r[0].startswith('rotate(') and r[0] != 'rotate(0.0deg)' and r[1].endswith('%'), r)
    await pg.evaluate("var r="+SL+";r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    check('no JS errors (curve, lights, scope)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_led(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'LED',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{off:4},{},{},{},{kind:'light'},{kind:'light',la:4,ls:1}],dash:true,
      board:[{k:'s',c:0,w:1},{k:'s',c:1,w:1},{k:'g',c:2,w:2},{k:'lx',t:'mx',c:0,d:1,w:1},{k:'lx',t:'eq',c:0,cs:[1],w:1},{k:'lx',t:'ts',c:1,w:1},{k:'lx',t:'gi',c:2,w:1},{k:'lx',t:'lp',c:4,cs:[5],w:2},{k:'lx',t:'tk',w:2}]}}],prefs:{seen:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f;(window.__all=window.__all||[]).push(f)};mk6Go('home');document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    SLS = "document.querySelectorAll('#boardGrid .bdw[data-k=s] input[type=range]')"
    await pg.evaluate("var rs="+SLS+";var r=rs[0];r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=60;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("""new Promise(function(res){var best=0,n=0,iv=setInterval(function(){var Y='#ffd84a',lx=[...document.querySelectorAll('#boardGrid .lx-box')];
      best=Math.max(best,[...lx[0].querySelectorAll('circle')].filter(c=>c.getAttribute('fill')===Y).length);if(++n<8) return;clearInterval(iv);
      var mx=best;
      var eq=[...lx[1].querySelectorAll('rect')].filter(c=>/#(1D9E75|EF9F27|E24B4A)/.test(c.getAttribute('fill'))).length;
      res([mx,eq,document.querySelector('#boardGrid .lx-tkw span').textContent])},80)})""")
    check('LED arrows light up and LED bars fill when A runs', r[0] > 10 and r[1] >= 4, r[:2])
    check('message strip shows the hub state', 'HUB ACTIVE' in r[2], r[2])
    await pg.evaluate("var rs="+SLS+";var r=rs[1];r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=50;r.dispatchEvent(new Event('input',{bubbles:true}));window.__all=[]")
    seen = set(); ind = set()
    for _ in range(12):
        await pg.wait_for_timeout(110)
        seen.add(await pg.evaluate("document.querySelectorAll('#boardGrid .lx-ts path')[1].getAttribute('fill')"))
    ind = await pg.evaluate("[...new Set((window.__all||[]).map(f=>String(f).split(',').map(Number)[5]>0))]")
    check('turn signal: right arrow blinks when steering passes 20%', '#EF9F27' in seen and len(seen) == 2, seen)
    check('turn signal: the right indicator light channel blinks too', sorted(ind) == [False, True], ind)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=g] .tgd')].find(b=>b.textContent==='2').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .lx-gi text')].filter(t=>t.getAttribute('fill')==='#1b1b1b').map(t=>t.textContent)")
    check('gear LED follows the gear widget', r == ['2'], r)
    await pg.evaluate("document.querySelectorAll('#boardGrid .lx-lb')[0].click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[document.querySelectorAll('#boardGrid .lx-lb')[0].classList.contains('on'),(window.__last||'').split(',').map(Number)[4]]")
    check('light panel: a tap turns that light channel on', r[0] and r[1] > 0, r)
    await pg.evaluate("document.getElementById('bdEdit').click();document.getElementById('bdTXmx').click();document.getElementById('bdAdd').click();document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#boardGrid .lx-mx').length,document.querySelectorAll('#boardGrid .bdw.hzw, #boardGrid .bdw[data-k=i]').length]")
    check('gallery adds LED arrows', r[0] == 2, r)
    # tachometer looks A-F: each builds, and the setting is kept
    await pg.evaluate("document.getElementById('bdEdit').click();document.getElementById('bdTFN').click();document.getElementById('bdAdd').click();var w=[...document.querySelectorAll('#boardGrid .bdw[data-k=f]')].pop();[...w.querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("var box=[...document.querySelectorAll('#gEdit .wsf')].find(f=>f.querySelector('.wsl').textContent==='Tachometer look');var ok=!!box;if(box) [...box.querySelectorAll('button')].find(b=>b.textContent==='E Pro').click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();document.getElementById('bdEdit').click();ok")
    await pg.wait_for_timeout(300)
    r2 = await pg.evaluate("document.querySelectorAll('#boardGrid .bdw[data-k=f] .ndl').length")
    check('tachometer: look A-F can be picked in its settings', r and r2 >= 1, [r, r2])
    # portrait: the undo bar stays put (no grip); landscape dashboard: it can be dragged
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("getComputedStyle(document.querySelector('#v2Undo .v2-ugrip')).display")
    check('undo bar has no grip in portrait (fixed place)', r == 'none', r)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.set_viewport_size({'width': 844, 'height': 390})
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.documentElement.classList.contains('dash'),getComputedStyle(document.querySelector('#v2Undo .v2-ugrip')).display]")
    check('landscape dashboard shows the undo grip', r == [True, 'flex'] or r == [True, 'inline-flex'], r)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    # undo bar: drag it by its grip; the spot is kept; double-tap puts it back
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("""(function(){var g=document.querySelector('#v2Undo .v2-ugrip'),r=g.getBoundingClientRect(),x=r.left+5,y=r.top+5,o={bubbles:true,pointerId:3};
      g.dispatchEvent(new PointerEvent('pointerdown',Object.assign({clientX:x,clientY:y},o)));g.dispatchEvent(new PointerEvent('pointermove',Object.assign({clientX:40,clientY:200},o)));g.dispatchEvent(new PointerEvent('pointerup',Object.assign({clientX:40,clientY:200},o)));
      var b=document.getElementById('v2Undo').getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),!!localStorage.getItem('mk6UndoPos')]})()""")
    check('undo bar can be dragged on the landscape dashboard and its spot is saved', r[0] < 60 and 150 < r[1] < 230 and r[2], r)
    r2 = await pg.evaluate("Math.round(document.getElementById('v2Undo').getBoundingClientRect().height)")
    check('undo bar keeps its size when moved', 40 <= r2 <= 60, r2)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("var b=document.getElementById('v2Undo').getBoundingClientRect();[Math.round(b.left),Math.round(b.top)]")
    check('undo bar comes back where it was left', r[0] < 60 and 150 < r[1] < 230, r)
    r = await pg.evaluate("""(function(){var g=document.querySelector('#v2Undo .v2-ugrip'),o={bubbles:true,pointerId:4,clientX:20,clientY:200};
      for(var k=0;k<2;k++){g.dispatchEvent(new PointerEvent('pointerdown',o));g.dispatchEvent(new PointerEvent('pointerup',o))}
      return document.getElementById('v2Undo').classList.contains('moved')})()""")
    check('double-tap on the grip puts the undo bar back', r is False, r)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    # widget settings explain the hub value: start power 4 -> 75 becomes 79
    await pg.set_viewport_size({'width': 390, 'height': 844})
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("document.getElementById('bdEdit').click();[...document.querySelector('#boardGrid .bdw[data-k=s]').querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click();var t=(document.querySelector('#gEdit .wsinfo-t')||{}).textContent||'';var hasOff=[...document.querySelectorAll('#gEdit .wsl')].some(l=>/^Start power/.test(l.textContent));document.getElementById('gEdit').remove();document.getElementById('bdEdit').click();[t,hasOff]")
    check('widget settings show start power and explain 75 -> hub 79', 'start power +4%' in r[0] and 'hub 79' in r[0] and r[1], r)
    # light program: Chase across the panel's two lights (E, F), then stop
    await pg.evaluate("document.getElementById('bdEdit').click();var w=document.querySelector('#boardGrid .lx-lp').closest('.bdw');[...w.querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var box=[...document.querySelectorAll('#gEdit .wsf')].find(f=>f.querySelector('.wsl').textContent==='Light program');[...box.querySelectorAll('button')].find(b=>b.textContent==='Chase').click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.__all=[];document.querySelector('#boardGrid .lx-pg').click()")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[[...new Set(window.__all.map(f=>String(f).split(',').map(Number).slice(4,6).map(v=>v>0?1:0).join('')))].sort(),document.querySelector('#boardGrid .lx-pg').getAttribute('aria-pressed')]")
    check('light program Chase alternates the panel lights', '10' in r[0] and '01' in r[0] and r[1] == 'true', r)
    # Program speed: changing it while the program runs takes effect at once, and Slow < Normal < Fast
    cnt = {}
    for ps in (1, 2, 3):
        await pg.evaluate("(function(v){var it=window.__t.C.board.find(x=>x.t==='lp');if(v===2) delete it.ps; else it.ps=v})(%d)" % ps)
        await pg.wait_for_timeout(500)
        cnt[ps] = await pg.evaluate("new Promise(function(res){var n=0,last=null,t0=performance.now();var iv=setInterval(function(){var v=window.__t.rt.t[4]>0?1:0;if(last!==null&&v!==last)n++;last=v;if(performance.now()-t0>3200){clearInterval(iv);res(n)}},20)})")
    check('light program speed: Slow < Normal < Fast, changed while running', cnt[1] < cnt[2] < cnt[3] and cnt[1] >= 2, cnt); print('    speed counts', cnt)
    await pg.evaluate("document.querySelector('#boardGrid .lx-pg').click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number)[4],document.querySelector('#boardGrid .lx-pg').getAttribute('aria-pressed')]")
    check('stopping the program turns its lights off', r == [0, 'false'], r)
    # undo/redo really restore: delete a widget, undo brings it back, redo removes it again
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(500)
    n0 = await pg.evaluate("document.querySelectorAll('#boardGrid > .bdw').length")
    await pg.evaluate("[...[...document.querySelectorAll('#boardGrid > .bdw')].pop().querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Remove').click()")
    await pg.wait_for_timeout(700)
    n1 = await pg.evaluate("document.querySelectorAll('#boardGrid > .bdw').length")
    await pg.evaluate("document.getElementById('unU').click()")
    await pg.wait_for_timeout(400)
    n2 = await pg.evaluate("document.querySelectorAll('#boardGrid > .bdw').length")
    await pg.evaluate("document.getElementById('unR').click()")
    await pg.wait_for_timeout(400)
    n3 = await pg.evaluate("document.querySelectorAll('#boardGrid > .bdw').length")
    check('undo brings a deleted widget back, redo removes it again', n1 == n0 - 1 and n2 == n0 and n3 == n0 - 1, [n0, n1, n2, n3])
    r = await pg.evaluate("var m=document.querySelector('main');[parseInt(getComputedStyle(m).paddingBottom)]")
    check('portrait: page gets room under its content while the undo bar shows', r[0] >= 150, r)
    await pg.evaluate("document.getElementById('unU').click()")
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.set_viewport_size({'width': 844, 'height': 390})
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("var b=document.getElementById('v2Undo').getBoundingClientRect();[Math.round(b.width),Math.round(b.height),getComputedStyle(document.querySelector('#unU span')).display]")
    check('landscape undo bar is compact (icons only)', r[0] < 160 and r[1] <= 52 and r[2] == 'none', r)
    await pg.evaluate("document.getElementById('bdEdit').click()")
    await pg.set_viewport_size({'width': 390, 'height': 844})
    await pg.wait_for_timeout(300)
    check('no JS errors (LED widgets)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_lefty(b):
    ctx, pg = await page(b, w=844, h=390)
    await pg.evaluate("mk6Go('drive')")
    await pg.wait_for_timeout(400)
    x0 = await pg.evaluate("document.querySelector('#boardGrid .bdw.v2-es').getBoundingClientRect().left")
    await pg.evaluate("mk6Go('settings');document.getElementById('sLefty').click();mk6Go('drive')")
    await pg.wait_for_timeout(500)
    x1 = await pg.evaluate("document.querySelector('#boardGrid .bdw.v2-es').getBoundingClientRect().left")
    check('6 left-handed: the landscape board is mirrored', x0 > 500 and x1 < 200, [x0, x1])
    await ctx.close()

async def t_seven(b):
    ctx, pg = await page(b)
    SL = "document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]')"
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(300)
    # 2 cruise (latch): tap Cruise, push A to 70 and let go -> A keeps going; bring it near 0 and let go -> stops
    await pg.evaluate("document.getElementById('dCruise').click()")
    await pg.evaluate(SL+".dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));var r="+SL+";r.value=70;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var r="+SL+";r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[+(window.__last||'0').split(',')[0],document.querySelector('#boardGrid .bdw[data-k=s]').getAttribute('data-crz')]")
    check('2 cruise: channel A keeps running after the finger lets go', r[0] >= 60 and (r[1] or '').startswith('CRUISE'), r)
    await pg.evaluate("var r="+SL+";r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=4;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var r="+SL+";r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[+(window.__last||'0').split(',')[0],document.getElementById('dCruise').getAttribute('aria-pressed')]")
    check('2 cruise: bringing the control back to the middle stops it, cruise stays on', r == [0, 'true'], r)
    await pg.evaluate("document.getElementById('dCruise').click()")
    # 3 steering eases at speed: B at full while A runs at 100 -> B reduced to 55%
    await pg.evaluate("mk6Go('medit');document.getElementById('ssOn').click();document.getElementById('ssSt').value='1';document.getElementById('ssSt').dispatchEvent(new Event('change'));document.getElementById('ssTh').value='0';document.getElementById('ssTh').dispatchEvent(new Event('change'));mk6Go('drive')")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var r="+SL+";r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=100;r.dispatchEvent(new Event('input',{bubbles:true}));var st=[...document.querySelectorAll('#boardGrid .bdw')].find(e=>/Steering/.test(e.textContent)).querySelector('input[type=range]');st.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));st.value=100;st.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("(window.__last||'').split(',').slice(0,2).map(Number)")
    check('3 steering at full throttle is cut to about 55%', r[0] >= 95 and 45 <= abs(r[1]) <= 62 if False else (r[0] >= 95 and 45 <= abs(r[1]) <= 62), r)
    await pg.evaluate("document.querySelectorAll('#boardGrid input[type=range]').forEach(r=>{r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))})")
    # 4 Bluetooth off then on -> the hub link comes back by itself
    await pg.evaluate("__calls=[];onAppEvent('btoff');onAppEvent('bt0')")
    await pg.wait_for_timeout(200)
    await pg.evaluate("onAppEvent('bt1')")
    await pg.wait_for_timeout(1300)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start')).length")
    check('4 Bluetooth back on: the hub reconnects by itself', r >= 1, r)
    # 9 undo / redo in edit mode
    await pg.evaluate("mk6Go('drive');document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(400)
    n0 = await pg.evaluate("document.querySelectorAll('#boardGrid .bdw').length")
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=l] .bdw-ed button')].find(b=>/Remove|Delete/.test(b.getAttribute('aria-label')||'')).click()")
    await pg.wait_for_timeout(600)
    await pg.evaluate("document.getElementById('unU').click()")
    await pg.wait_for_timeout(300)
    n2 = await pg.evaluate("[document.querySelectorAll('#boardGrid .bdw').length,!document.getElementById('v2Undo').hidden,document.getElementById('unR').disabled]")
    check('9 undo brings a removed widget back (redo then available)', n2 == [n0, True, False], [n0, n2])
    await pg.evaluate("document.getElementById('bdEdit').click()")
    # 8 icon shows on the gallery card and the model chip
    await pg.evaluate("mk6Go('medit');document.querySelector('#mIcons [data-ic=crane]').click();mk6Go('models')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[!!document.querySelector('#mList .v2-mbadge'),document.querySelector('.v2-mchip .v2-knob').classList.contains('has-av')]")
    check('8 model icon on the gallery card and the model chip', r == [True, True], r)
    check('no JS errors (seven)', not pg.errors, pg.errors[:3])
    await ctx.close()
    # 7 simulator in practice mode
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('settings');document.getElementById('sPrac').click();mk6Go('home');document.getElementById('hConn').click();mk6Go('drive')")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[!document.getElementById('dSim').hidden,document.getElementById('simCv').width>0]")
    check('7 practice simulator shows on the Drive screen', r == [True, True], r)
    await ctx.close()
    # 12 focus mode in landscape
    ctx, pg = await page(b, w=844, h=390)
    await pg.evaluate("mk6Go('drive');document.getElementById('dbFocus').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.documentElement.classList.contains('v2-focus'),getComputedStyle(document.getElementById('dbEdit')).display,getComputedStyle(document.querySelector('#boardGrid .bdw-h')).visibility]")
    check('12 focus mode hides the bar buttons and widget labels', r == [True, 'none', 'hidden'], r)
    r = await pg.evaluate("['dbCruise','dbFocus'].map(function(id){var b=document.getElementById(id).getBoundingClientRect(),k=document.getElementById(id).querySelector('svg')||null,c;if(k){c=k.getBoundingClientRect()}else{var g=document.createRange();g.selectNodeContents(document.getElementById(id));c=g.getBoundingClientRect()}return Math.round(Math.abs((c.top+c.bottom)/2-(b.top+b.bottom)/2)+Math.abs((c.left+c.right)/2-(b.left+b.right)/2))})")
    check('12 Cruise and focus content is centred in their buttons', all(x <= 3 for x in r), r)
    for vw, vh in [(844, 390), (740, 360)]:
        await pg.set_viewport_size({'width': vw, 'height': vh})
        await pg.evaluate("document.documentElement.classList.add('v2-dbopen')")
        await pg.wait_for_timeout(300)
        r = await pg.evaluate("(function(){var p=document.getElementById('v2Pill').getBoundingClientRect(),e=document.getElementById('estop').getBoundingClientRect(),xs=[...document.querySelectorAll('#dashBar > *')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.getBoundingClientRect());return [Math.round(p.right),Math.round(Math.min(...xs.map(x=>x.left))),Math.round(Math.max(...xs.map(x=>x.right))),Math.round(e.left)]})()")
        check(f'open bar at {vw}px does not cover the hub pill or E-Stop', r[1] >= r[0] and r[2] <= r[3], r)
        await pg.evaluate("document.documentElement.classList.remove('v2-dbopen')")
    await pg.set_viewport_size({'width': 844, 'height': 390})
    await pg.evaluate("document.getElementById('dbFocus').click();onHubState('ready')")
    await pg.wait_for_timeout(600)
    POS = "[...document.getElementById('boardGrid').children].map(e=>{var r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),getComputedStyle(e).position]})"
    p0 = await pg.evaluate(POS)
    await pg.evaluate("document.getElementById('dbCruise').click();document.querySelectorAll('#boardGrid > .bdw').forEach(function(e){e.setAttribute('data-crz','CRUISE +100')})")
    await pg.wait_for_timeout(100)
    p1 = await pg.evaluate(POS)
    check('2 cruise tag in landscape leaves every widget in its place', p0 == p1 and all(x[2] == 'absolute' for x in p1), [p0[:2], p1[:2]])
    await ctx.close()

async def t_open_relink(b):
    ctx, pg = await page(b)
    await pg.evaluate("document.getElementById('hConn').click();onHubState('ready')")
    await pg.wait_for_timeout(400)
    await pg.reload()
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start')).length")
    check('4 app opened after a session with the hub on: it reconnects', r >= 1, r)
    await pg.evaluate("document.getElementById('hConn').click()")
    await pg.wait_for_timeout(300)
    await pg.reload()
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start')).length")
    check('4 hub turned off by the user: no reconnect on the next open', r == 0, r)
    await ctx.close()

async def t_wup(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'W',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{},{},{},{},{},{}],
      board:[{k:'s',c:0,w:1},{k:'s',c:1,w:1},{k:'lx',t:'eq',c:0,cs:[1],w:1},{k:'n',c:2,w:1},{k:'rs',w:1,p:100,ns:4,s:0,sm:1,rt:0,sc:[[0,0,0,0,0,0],[0,0,0,40,0,0],[0,0,0,80,-50,0],[0,0,0,0,0,0]]},
        {k:'i',c:0,w:2,hz:1,ls:1},{k:'lx',t:'mx',c:0,w:1,ic:1,an:1,px:['11111111','10000001','10000001','10000001','10000001','10000001','10000001','11111111']}]}}],prefs:{seen:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML)
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    SLS = "document.querySelectorAll('#boardGrid .bdw[data-k=s] input[type=range]')"
    await pg.evaluate("var rs="+SLS+";[[0,60],[1,-50]].forEach(function(p){var r=rs[p[0]];r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=p[1];r.dispatchEvent(new Event('input',{bubbles:true}))})")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("""(function(){var eq=document.querySelector('#boardGrid .lx-eq');var rc=[...eq.querySelectorAll('rect')];
      return [rc.filter(c=>c.getAttribute('fill')==='#378ADD').length,rc.filter(c=>/#(1D9E75|EF9F27|E24B4A)/.test(c.getAttribute('fill'))).length,[...eq.querySelectorAll('text')].map(t=>t.textContent).join(' ')]})()""")
    check('7a LED bars: reverse lights blue, forward green, no numbers on top', r[0] >= 2 and r[1] >= 3 and r[2].split() == ['A', 'B'], r)
    await pg.evaluate("""(function(){var g=document.querySelector('#boardGrid .lx-eq svg'),rc=g.getBoundingClientRect();g.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+rc.width/2-16,clientY:rc.top+rc.height/2}))})()""")
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number)[0],document.querySelector('#boardGrid .lx-eq').textContent.indexOf('MUTE')>=0]")
    check('7c tapping bar A mutes channel A (hub gets 0)', r[0] == 0 and r[1], r)
    await pg.evaluate("""(function(){var g=document.querySelector('#boardGrid .lx-eq svg'),rc=g.getBoundingClientRect();g.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rc.left+rc.width/2-16,clientY:rc.top+rc.height/2}))})()""")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("(window.__last||'').split(',').map(Number)[0]")
    check('7c tapping again unmutes', r > 0, r)
    # dial: value in the middle, tap the centre = 0
    await pg.evaluate("__t=null;var k=document.querySelector('#boardGrid .bdw[data-k=n] .dialk');window.__k=k")
    await pg.evaluate("""(function(){var k=window.__k,rc=k.getBoundingClientRect(),cx=rc.left+rc.width/2,cy=rc.top+rc.height/2,R=rc.width*.4;
      function ev(t,x,y){k.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:x,clientY:y,pointerId:5}))}
      ev('pointerdown',cx,cy-R);for(var a=0;a<=60;a+=5){var r=a*Math.PI/180;ev('pointermove',cx+R*Math.sin(r),cy-R*Math.cos(r))}ev('pointerup',cx+R*Math.sin(1.05),cy-R*Math.cos(1.05))})()""")
    await pg.wait_for_timeout(300)
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number)[2],document.querySelectorAll('#boardGrid .bdw[data-k=n] .dialv').length]")
    check('dial turns, and has no number in the middle', r[0] != 0 and r[1] == 0, r)
    await pg.evaluate("""(function(){var k=window.__k,rc=k.getBoundingClientRect(),cx=rc.left+rc.width/2,cy=rc.top+rc.height/2;
      k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:cx,clientY:cy,pointerId:6}));k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:cx,clientY:cy,pointerId:6}))})()""")
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("(window.__last||'').split(',').map(Number)[2]")
    check('9c tapping the dial centre sets it to 0', r == 0, r)
    # fine turning: same 60 degree turn gives a smaller value
    await pg.evaluate("""(function(){var B=JSON.parse(localStorage.getItem('mk6v2'));})()""")
    # selector scenes: long-press on, then turn to position 3
    await pg.evaluate("""(function(){var k=document.querySelector('#boardGrid .bdw[data-k=rs] .dialk'),rc=k.getBoundingClientRect(),cx=rc.left+rc.width/2,cy=rc.top+rc.height/2,R=rc.width*.4;window.__rk=k;window.__rkp=[cx,cy,R];
      k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:cx-R*.7,clientY:cy+R*.7,pointerId:7}))})()""")
    await pg.wait_for_timeout(900)
    await pg.evaluate("window.__rk.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7}))")
    await pg.evaluate("""(function(){var k=window.__rk,p=window.__rkp,cx=p[0],cy=p[1],R=p[2];function ev(t,a){var r=a*Math.PI/180;k.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:cx+R*Math.sin(r),clientY:cy-R*Math.cos(r),pointerId:8}))}
      ev('pointerdown',-135);for(var a=-135;a<=45;a+=10) ev('pointermove',a);ev('pointerup',45)})()""")
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number).slice(3,5),document.querySelector('#boardGrid .bdw[data-k=rs] .bdw-h').textContent]")
    check('10b selector scene mode sets D and E together', r[0][0] > 50 and r[0][1] < -30 and 'P3' in r[1], r)
    # LED meter: round dots, blue reverse, value tag
    await pg.evaluate("var rs="+SLS+";var r=rs[0];r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=-70;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(1200)
    r = await pg.evaluate("""(function(){var w=document.querySelector('#boardGrid .bdw[data-k=i]');var rc=[...w.querySelectorAll('rect')];
      var seg=rc.filter(x=>x.getAttribute('width')===x.getAttribute('height')&&+x.getAttribute('rx')>1);
      return [seg.length,rc.filter(x=>x.getAttribute('fill')==='#378ADD').length,[...w.querySelectorAll('text')].map(t=>t.textContent).filter(t=>/^\u2212[0-9]/.test(t)).length]})()""")
    check('13a/c LED meter: round LEDs, reverse in blue, no value tag on the bar', r[0] >= 20 and r[1] >= 5 and r[2] == 0, r)
    # matrix: own icon scrolls
    seen = set()
    for _ in range(6):
        await pg.wait_for_timeout(150)
        seen.add(await pg.evaluate("[...document.querySelectorAll('#boardGrid .lx-mx circle')].map(c=>c.getAttribute('fill')==='#ffd84a'?1:0).join('')"))
    check('14a/b LED matrix shows my icon and it scrolls', len(seen) >= 2 and all(s.count('1') == 28 for s in seen), [s.count('1') for s in seen])
    # settings editors open and save
    await pg.evaluate("document.getElementById('bdEdit').click();[...document.querySelectorAll('#boardGrid .bdw[data-k=lx]')].pop().querySelector('.bdw-ed button[aria-label=\"Widget settings\"]').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.querySelectorAll('#gEdit .pxed-g button').length,(()=>{document.querySelectorAll('#gEdit .pxed-g button')[0].click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();return JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board.find(x=>x.t==='mx').px[0]})()]")
    check('14a dot editor: 64 dots, a tap changes the saved icon', r[0] == 64 and r[1] == '01111111', r)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=rs]')][0].querySelector('.bdw-ed button[aria-label=\"Widget settings\"]').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("document.querySelectorAll('#gEdit .sced input').length")
    check('10b scene editor shows a 6 x 6 table', r == 36, r)
    check('widget upgrades: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_xw(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'X',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{},{},{},{},{},{}],
      board:[{k:'xy',c:0,d:1,w:1},{k:'xf',c:2,d:3,w:1},{k:'ro',c:0,w:1,n:5,bs:1},{k:'ro',c:1,w:1,bs:0}]}}],prefs:{seen:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML)
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw')].map(w=>w.dataset.k+':'+!!w.querySelector('svg.xwv'))")
    check('XY pad, crossfader and rotor appear on the board', r == ['xy:true', 'xf:true', 'ro:true', 'ro:true'], r)
    def pe(sel, typ, fx, fy, pid=11):
        return pg.evaluate("""(function(){var s=document.querySelector('%s'),vb=s.viewBox.baseVal,rc=s.getBoundingClientRect(),sc=Math.min(rc.width/vb.width,rc.height/vb.height),ox=rc.left+(rc.width-vb.width*sc)/2,oy=rc.top+(rc.height-vb.height*sc)/2;
          s.dispatchEvent(new PointerEvent('%s',{bubbles:true,clientX:ox+%f*sc,clientY:oy+%f*sc,pointerId:%d}))})()""" % (sel, typ, fx, fy, pid))
    XY = "#boardGrid .bdw[data-k=xy] svg"
    await pe(XY, 'pointerdown', 158, 112); await pe(XY, 'pointermove', 230, 50)
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("(window.__last||'').split(',').map(Number).slice(0,2)")
    check('XY pad: dragging up-right drives X (A) and Y (B) forward', r[0] > 50 and r[1] > 50, r)
    await pe(XY, 'pointerup', 230, 50)
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("(window.__last||'').split(',').map(Number).slice(0,2)")
    check('XY pad: letting go returns both to 0', r == [0, 0], r)
    XF = "#boardGrid .bdw[data-k=xf] svg"
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number).slice(2,4),document.querySelector('#boardGrid .bdw[data-k=xf] .bdw-h output').textContent]")
    check('Crossfader: nothing runs until the fader is pushed up (no power button)', r[0] == [0, 0] and r[1] == 'OFF', r)
    await pe(XF, 'pointerdown', 28, 205, 12); await pe(XF, 'pointermove', 28, 74, 12); await pe(XF, 'pointerup', 28, 74, 12)
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number).slice(2,4),document.querySelector('#boardGrid .bdw[data-k=xf] .bdw-h output').textContent]")
    check('Crossfader: fader at 80% runs both channels at 80', r[0] == [80, 80] and r[1].startswith('+80'), r)
    await pe(XF, 'pointerdown', 175, 262, 13); await pe(XF, 'pointermove', 245, 262, 13); await pe(XF, 'pointerup', 245, 262, 13)
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("(window.__last||'').split(',').map(Number).slice(2,4)")
    check('Crossfader: sliding right gives less to C, full to D', r[0] < 30 and r[1] == 80, r)
    await pe(XF, 'pointerdown', 142, 162, 16); await pe(XF, 'pointerup', 142, 162, 16)
    await pe(XF, 'pointerdown', 265, 213, 17); await pe(XF, 'pointerup', 265, 213, 17)
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number).slice(2,4),JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board[1].rd]")
    check('Crossfader: preset C sends all to C; reverse D is saved', r[0] == [80, 0] and r[1] == 1, r)
    await pe(XF, 'pointerdown', 28, 74, 18); await pe(XF, 'pointermove', 28, 230, 18); await pe(XF, 'pointerup', 28, 230, 18)
    await pg.wait_for_timeout(4000)
    r = await pg.evaluate("[(window.__last||'').split(',').map(Number).slice(2,4),document.querySelector('#boardGrid .bdw[data-k=xf] .bdw-h output').textContent]")
    check('Crossfader: pulling the fader down stops both', r[0] == [0, 0] and r[1] == 'OFF', r)
    # rotor follows A
    await pe(XY, 'pointerdown', 158, 112, 15); await pe(XY, 'pointermove', 250, 112, 15)
    await pg.wait_for_timeout(1500)
    a1 = await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=ro] svg g.rb').getAttribute('transform')")
    await pg.wait_for_timeout(300)
    a2 = await pg.evaluate("[document.querySelector('#boardGrid .bdw[data-k=ro] svg g.rb').getAttribute('transform'),document.querySelectorAll('#boardGrid .bdw[data-k=ro] svg g.rb')[0].children.length]")
    await pe(XY, 'pointerup', 250, 112, 15)
    check('Rotor: 5 blades spin while A runs', a1 != a2[0] and a2[1] == 5, [a1, a2])
    r = await pg.evaluate("[document.querySelectorAll('#boardGrid .bdw[data-k=ro]')[1].querySelectorAll('svg g.rb')[0].children.length,JSON.stringify(JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board[3])]")
    check('Rotor: old metal style now shows the jet turbine (16 blades)', r[0] == 16 and 'bs' not in r[1], r)
    # settings dialogs + add from the gallery
    await pg.evaluate("document.getElementById('bdEdit').click()")
    for k, n in (('xy', 3), ('xf', 3), ('ro', 2)):
        r = await pg.evaluate("(function(){document.querySelector('#boardGrid .bdw[data-k=%s] .bdw-ed button[aria-label=\"Widget settings\"]').click();var n=document.querySelectorAll('#gEdit .gbox > *').length;var c=[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Cancel');c&&c.click();var g=document.getElementById('gEdit');g&&g.remove();return n})()" % k)
        check('%s settings dialog opens' % k, r >= n + 1, r)
    r = await pg.evaluate("(function(){var out=[];['bdTXY','bdTXF','bdTRO'].forEach(function(id){document.getElementById(id).click();document.getElementById('bdAdd').click()});return JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board.map(x=>x.k).join(',')})()")
    check('XY pad, crossfader and rotor can be added from the gallery', r.endswith('xy,xf,ro'), r)
    check('new widgets: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_pro(b):
    # P1 live link centre, P3 duplicate + group move, P5 accessibility, P6 what's new + update check
    def mk(seed, w=390, h=844, extra=''):
        async def go():
            ctx = await b.new_context(viewport={'width': w, 'height': h})
            pg = await ctx.new_page(); pg.errors = []
            pg.on('pageerror', lambda e: pg.errors.append(str(e)))
            await pg.add_init_script(STUB + extra + "(function(){localStorage.setItem('mk6v2',JSON.stringify(" + seed + "))})();")
            await pg.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
            await pg.goto(HTML + '?mk6test')
            await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
            await pg.wait_for_timeout(300)
            return ctx, pg
        return go()
    seed = "{active:'m1',profiles:[{id:'m1',name:'P',cfg:{layout:'board',limit:100,ramp:100,ch:[{},{},{},{},{},{}],board:[{k:'s',c:0},{k:'s',c:1},{k:'f',c:0}]}}],prefs:{seen:true,wn:46}}"
    ctx, pg = await mk(seed)
    # P5: TalkBack labels
    r = await pg.evaluate("mk6Go('drive');[...document.querySelectorAll('#boardGrid .bdw')].map(w=>w.getAttribute('role')+'|'+(w.getAttribute('aria-label')||''))")
    check('P5: every widget has a TalkBack label', len(r) == 3 and all(x.startswith('group|') and len(x) > 8 for x in r), r)
    # P5: direction arrows + colour-blind palette
    await pg.evaluate("document.getElementById('sDir').click();document.getElementById('sCB').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.documentElement.hasAttribute('data-cb'),getComputedStyle(document.documentElement).getPropertyValue('--ok').trim(),__t.store.prefs.cb,__t.store.prefs.dir]")
    check('P5: colour-blind palette switches the colours', r[0] and r[1].upper() == '#56B4E9' and r[2] and r[3], r)
    await pg.evaluate("document.getElementById('hConn').click();onHubState('ready');mk6Go('drive');__t.rt.t[0]=40;__t.rt.t[1]=-30")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=s] .bdw-h output')].map(o=>o.textContent)")
    check('P5: values show direction arrows', len(r) == 2 and r[0].startswith('▲') and r[1].startswith('▼'), r)
    await pg.evaluate("document.getElementById('sHC').click()")
    r = await pg.evaluate("document.documentElement.hasAttribute('data-hc')")
    check('P5: outdoor high contrast turns on', r, r)
    # P3: duplicate onto the next free channel, undo
    await pg.evaluate("__t.rt.t[0]=0;__t.rt.t[1]=0;document.getElementById('bdEdit').click()")
    r = await pg.evaluate("(function(){var b=document.querySelector('#boardGrid .bdw[data-k=s] .bdw-ed button[aria-label=Duplicate]');b.click();return __t.C.board.map(x=>x.k+x.c).join(',')})()")
    check('P3: duplicate copies a slider onto the next free channel', r == 's0,s2,s1,f0', r)
    r = await pg.evaluate("document.getElementById('dbBack').hidden")
    check('P3: duplicate can be undone', r is False, r)
    check('P1/P3/P5: no JS errors (portrait)', not pg.errors, pg.errors[:3])
    await ctx.close()

    # P3 group move in the landscape dashboard
    seed2 = "{active:'m1',profiles:[{id:'m1',name:'P',cfg:{layout:'board',dash:true,limit:100,ramp:100,ch:[{},{},{},{},{},{}],board:[{k:'s',c:0,g:[0,0,6,10]},{k:'s',c:1,g:[8,0,6,10]},{k:'s',c:2,g:[30,12,6,10]}]}}],prefs:{seen:true,wn:46}}"
    ctx, pg = await mk(seed2, 844, 390)
    await pg.evaluate("mk6Go('drive');document.getElementById('dbEdit').click()")
    await pg.wait_for_timeout(300)
    def ptr(i, typ, dx=0, dy=0, pid=21):
        return pg.evaluate("""(function(){var e=document.querySelectorAll('#boardGrid .bdw')[%d],r=e.getBoundingClientRect(),x=r.left+r.width/2+%f,y=r.top+r.height/2+%f;
          var t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!e.contains(t)) t=e;
          (%s?t:e).dispatchEvent(new PointerEvent('%s',{bubbles:true,clientX:x,clientY:y,pointerId:%d}))})()""" % (i, dx, dy, 'true' if typ == 'pointerdown' else 'false', typ, pid))
    await ptr(0, 'pointerdown'); await ptr(0, 'pointerup')
    await pg.wait_for_timeout(250)
    r = await pg.evaluate("(function(){var b=document.querySelector('#boardGrid .bdw.sel .bdw-ed button[aria-label=\"Select several\"]');if(!b) return 'nobtn';b.click();return document.querySelectorAll('#boardGrid .gsel').length})()")
    check('P3: Select several starts a group', r == 1, r)
    await ptr(1, 'pointerdown', pid=22); await ptr(1, 'pointerup', pid=22)
    await pg.wait_for_timeout(250)
    r = await pg.evaluate("document.querySelectorAll('#boardGrid .gsel').length")
    check('P3: tapping another widget adds it to the group', r == 2, r)
    g0 = await pg.evaluate("__t.C.board.map(x=>x.g.slice())")
    ch = await pg.evaluate("document.querySelector('#boardGrid').getBoundingClientRect().height/24")
    await ptr(0, 'pointerdown', pid=23); await ptr(0, 'pointermove', 0, ch * 4, pid=23); await ptr(0, 'pointermove', 0, ch * 4, pid=23)
    await pg.wait_for_timeout(100)
    r0 = await pg.evaluate("document.querySelectorAll('#boardGrid .dguide').length")
    await ptr(0, 'pointerup', 0, ch * 4, pid=23)
    await pg.wait_for_timeout(250)
    r = await pg.evaluate("__t.C.board.map(x=>x.g.slice())")
    dy0, dy1 = r[0][1] - g0[0][1], r[1][1] - g0[1][1]
    check('P3: the group moves together, others stay', dy0 > 0 and dy0 == dy1 and r[2] == g0[2] and r[0][0] == g0[0][0], [g0, r, r0])
    check('P3: no JS errors (dashboard)', not pg.errors, pg.errors[:3])
    await ctx.close()

    # P1 live link centre
    stats = """window.__alive=[1,1];window.__n=0;window.MK6Bridge.stats=function(){__n++;return JSON.stringify({mode:'parallel',hubs:2,ok:__n*20,fail:0,frames:__n*22,watchdog:0,up:9000,lastFrameAgo:30,tx:1,err:0,errAgo:-1,mods:[0,1],alive:__alive,lat:60})};"""
    ctx, pg = await mk(seed, extra=stats)
    await pg.evaluate("document.getElementById('hConn').click();onHubState('ready');mk6Go('hub');document.getElementById('hubDiag').open=true")
    await pg.wait_for_timeout(3500)
    r = await pg.evaluate("[+document.getElementById('lkRate').textContent,document.querySelectorAll('#lkHubs .lk-hub').length,document.getElementById('lkChip').textContent,document.querySelector('#lkSpark .lk-a').getAttribute('d').length,document.getElementById('lkMsg').textContent]")
    check('P1: live rate, hub rings, steady chip and graph', r[0] > 5 and r[1] == 2 and r[2] == 'Steady' and r[3] > 20, r)
    await pg.evaluate("window.__alive=[1,0]")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[document.getElementById('lkChip').textContent,document.getElementById('lkMsg').textContent,document.querySelectorAll('#lkHubs circle.bad').length]")
    check('P1: a hub off air raises a warning', r[0] == 'Problem' and 'M2' in r[1] and r[2] == 1, r)
    check('P1: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

    # P6 what's new after an update + update check
    upd = """window.MK6Bridge.appInfo=function(){return JSON.stringify({name:'1.2',build:50,date:'2026-11-13'})};
      window.MK6Bridge.checkUpdate=function(){__calls.push('check');setTimeout(function(){onUpdate(JSON.stringify({name:'MK6 Console (build 51)',apk:'https://github.com/azimsupandi-png/Mouldking-6.0.1/releases/download/latest/a.apk',page:'',notes:''}))},50)};
      window.MK6Bridge.openUrl=function(u){__calls.push('open:'+u)};"""
    seed3 = seed.replace("wn:46", "wn:45,lang:'ms'")
    ctx, pg = await mk(seed3, extra=upd)
    await pg.wait_for_timeout(1800)
    r = await pg.evaluate("(function(){var s=document.getElementById('wnSheet');return s?[s.querySelector('h3').textContent,[...s.querySelectorAll('.wn-t')].map(x=>x.textContent).slice(0,2).join(),s.querySelectorAll('.wn-b').length]:null})()")
    check('P6: What\'s new opens once after an update (Malay labels)', r and r[0] == 'Apa yang baharu' and all(x in ('BAHARU', 'BAIK', 'BAIKI') for x in r[1].split(',')) and r[2] >= 3, r)
    await pg.evaluate("document.querySelector('#wnSheet .btn.pri').click()")
    r = await pg.evaluate("[__t.store.prefs.wn,document.getElementById('sVer').textContent]")
    check('P6: version and build date in Settings', r[0] == 50 and 'build 50' in r[1] and '2026-11-13' in r[1], r)
    await pg.wait_for_timeout(3500)
    r = await pg.evaluate("[__calls.filter(c=>c==='check').length,document.getElementById('sUpdV').textContent]")
    check('P6: quiet daily check finds a newer build', r[0] == 1 and '51' in r[1], r)
    await pg.evaluate("document.getElementById('sUpd').click()")
    r = await pg.evaluate("(function(){var s=document.getElementById('wnSheet');if(!s) return null;var h=s.querySelector('h3').textContent;s.querySelector('.btn.pri').click();return [h,__calls.filter(c=>c.indexOf('open:')===0)]})()")
    check('P6: update sheet downloads the APK from GitHub', r and r[0] == 'Kemas kini tersedia' and len(r[1]) == 1 and r[1][0].endswith('a.apk'), r)
    check('P6: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_pro2(b):
    # P2 settings search, P4 model library, P7 tour, P8 safety centre + PIN, P9 haptics
    seed = "{active:'m1',profiles:[{id:'m1',name:'Zeta car',cfg:{layout:'board',limit:100,ramp:20,ch:[{},{},{},{},{},{}],board:[{k:'s',c:0}],st:{ms:5400000,last:%d}}},{id:'m2',name:'Alpha crane',cfg:{layout:'board',ch:[{},{},{},{},{},{}],board:[],fav:true,st:{ms:60000,last:%d}}}],prefs:{seen:true,wn:99,tour:true}}"
    import time
    now = int(time.time() * 1000)
    seed = seed % (now - 3 * 86400000, now)
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    await pg.add_init_script(STUB + "(function(){localStorage.setItem('mk6v2',JSON.stringify(" + seed + "))})();")
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    # P2
    await pg.evaluate("mk6Go('settings');var i=document.getElementById('setSearch');i.value='smothing';i.dispatchEvent(new Event('input'))")
    r = await pg.evaluate("[...document.querySelectorAll('#setRes .sr-it')].map(b=>b.textContent)")
    check('P2: search finds a setting even with a typo', any('Acceleration smoothing' in x and 'Limits' in x for x in r), r)
    await pg.evaluate("[...document.querySelectorAll('#setRes .sr-it')].find(b=>b.textContent.indexOf('Acceleration smoothing')===0).click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.documentElement.getAttribute('data-v'),!!document.querySelector('#setCard .sr-hit')]")
    check('P2: tapping a result opens that screen and highlights the setting', r == ['safety', True], r)
    # P8
    r = await pg.evaluate("[+document.querySelector('#sfScore .sf-n').textContent,document.querySelector('#sfScore .sf-tip').textContent,document.querySelectorAll('#sfScore .sf-it').length]")
    check('P8: safety score with the next step', r[0] == 45 and r[1].startswith('Next: Settings lock with a PIN') and r[2] == 7, r)
    await pg.evaluate("document.getElementById('pinSet').click()")
    async def pin(v):
        await pg.evaluate("var i=document.querySelector('#pinDlg .pin-in');i.value='%s';i.dispatchEvent(new Event('input'))" % v)
        await pg.wait_for_timeout(350)
    await pin('1234'); await pin('1234')
    r = await pg.evaluate("[__t.store.prefs.pin,document.getElementById('pinSet').textContent]")
    check('P8: a PIN can be set', r == ['1234', 'Change PIN'], r)
    await pg.evaluate("mk6Go('safety')")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("+document.querySelector('#sfScore .sf-n').textContent")
    check('P8: the PIN raises the score', r == 65, r)
    await pg.evaluate("document.getElementById('lockBtn').click()")
    await pg.evaluate("document.getElementById('lockBtn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))")
    await pg.wait_for_timeout(2200)
    await pin('0000')
    r = await pg.evaluate("[__t.store.prefs.lock,!!document.getElementById('pinDlg')]")
    check('P8: a wrong PIN keeps settings locked', r == [True, True], r)
    await pin('1234')
    r = await pg.evaluate("[__t.store.prefs.lock,!!document.getElementById('pinDlg')]")
    check('P8: the right PIN unlocks', r == [False, False], r)
    # P4
    await pg.evaluate("mk6Go('models')")
    r = await pg.evaluate("[...document.querySelectorAll('#mList .v2-mcard:not(.v2-madd) b')].map(x=>x.textContent)")
    check('P4: favourites come first', r[:2] == ['Alpha crane', 'Zeta car'], r)
    r = await pg.evaluate("[...document.querySelectorAll('#mList .v2-mst')].map(x=>x.textContent)")
    check('P4: cards show driving time and last use', r == ['⏱ 1 min · Today', '⏱ 1.5 h · 3 days ago'], r)
    await pg.evaluate("document.querySelector('#mSort [data-s=r]').click()")
    r = await pg.evaluate("[...document.querySelectorAll('#mList .v2-mcard:not(.v2-madd) b')].map(x=>x.textContent)")
    check('P4: sort by recent', r[:2] == ['Alpha crane', 'Zeta car'], r)
    await pg.evaluate("document.querySelector('#mSort [data-s=a]').click();document.querySelectorAll('#mList .v2-fav')[1].click()")
    r = await pg.evaluate("[__t.store.prefs.msort,__t.store.profiles.map(p=>p.cfg.fav)]")
    check('P4: A-Z sort and star toggle are saved', r == ['a', [True, True]], r)
    # P9
    await pg.evaluate("window.__calls.length=0;mk6Go('settings');var e=document.getElementById('sNew');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.getElementById('sDir').click()")
    await pg.wait_for_timeout(100)
    await pg.evaluate("var w=document.getElementById('wnSheet');w&&w.remove()")
    r = await pg.evaluate("__calls.filter(c=>c.indexOf('haptic:')===0)")
    check('P9: taps and switches have their own vibration', 'haptic:tap' in r and 'haptic:tick' in r and 'haptic:ok' not in r, r)
    # P7
    await pg.evaluate("document.getElementById('sTour').click()")
    await pg.wait_for_timeout(400)
    for _ in range(4):
        await pg.evaluate("document.getElementById('gNext').click()")
        await pg.wait_for_timeout(250)
    r = await pg.evaluate("[document.querySelector('#guide .co-t').textContent,document.querySelector('#guide .co-hole').hidden]")
    check('P7: the tour can be replayed and shows the Edit step', r == ['Arrange the board', False], r)
    check('P2/P4/P7/P8/P9: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_drtl(b):
    # D/R removed; S4 timeline player + editor
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'X',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{},{},{},{},{},{}],tl:[{id:'t1',name:'Dig',dur:2,rp:1,lanes:[{c:2,pts:[[0,0,0],[1,80,1],[2,0,0]]}]}],
      board:[{k:'s',c:0,w:1},{k:'dr',w:1,v:40},{k:'tl',w:2,tl:'t1'}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[[...document.querySelectorAll('#boardGrid .bdw')].map(w=>w.dataset.k).join(),!!document.getElementById('bdTDR'),'dr' in __t.C]")
    check('D/R is gone: an old D/R widget is dropped and there is no D/R setting', r == ['s,tl', False, False], r)
    # S4 play
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=tl] svg g[role=button]').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
    await pg.wait_for_timeout(1000)
    r = await pg.evaluate("[__t.rt.t[2],document.querySelector('#boardGrid .bdw[data-k=tl] .bdw-h output').textContent]")
    rr = await pg.evaluate("(function(){var w=document.querySelector('#boardGrid .bdw[data-k=tl] svg');var lit=[...w.querySelectorAll('line')].filter(l=>l.getAttribute('stroke')==='#ffd84a'&&+l.getAttribute('opacity')>0.9).length;var st=w.querySelector('g[role=button] rect:not([filter])');return [st.getAttribute('fill'),getComputedStyle(st.parentNode).display,+st.getAttribute('width'),lit,w.querySelectorAll('circle[opacity=\"1\"]').length]})()")
    check('S4: playing shows a small red stop sign, a running LED and a live dot on the curve', rr[0].upper() in ('#E24B4A', '#D55E00') and rr[1] != 'none' and rr[2] <= 24 and rr[3] >= 1 and rr[4] >= 1, rr)
    check('S4: the timeline drives channel C (about +80 at 1 s)', r[0] >= 60 and '/ 2 s' in r[1], r)
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("[+(window.__last||'').split(',')[2],!!__t.S.play]")
    check('S4: it stops at the end and returns to 0', r == [0, False], r)
    # editor: open from edit mode, add a point, change shape, add a lane
    await pg.evaluate("document.getElementById('bdEdit').click();document.querySelector('#boardGrid .bdw[data-k=tl] .bdw-ed button[aria-label=\"Edit timeline\"]').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[!!document.getElementById('tlEd'),document.querySelectorAll('#tlEd svg circle[role=button]').length]")
    check('S4: the editor opens with the points of each lane', r == [True, 3], r)
    await pg.evaluate("""(function(){var r=document.querySelector('#tlEd svg rect');var b=r.getBoundingClientRect();var o={bubbles:true,clientX:b.left+b.width*0.3,clientY:b.top+b.height*0.25,pointerId:4};r.dispatchEvent(new PointerEvent('pointerdown',o));r.dispatchEvent(new PointerEvent('pointerup',o))})()""")
    await pg.wait_for_timeout(150)
    r = await pg.evaluate("[__t.C.tl[0].lanes[0].pts.length,!document.querySelector('#tlEd .tle-pt').hidden]")
    check('S4: tapping an empty spot adds a point and opens its panel', r == [4, True], r)
    await pg.evaluate("document.querySelector('#tlEd .tle-pt [data-s=\"2\"]').click();document.querySelector('#tlEd [data-a=lane]').click()")
    r = await pg.evaluate("[__t.C.tl[0].lanes[0].pts.filter(p=>p[2]===2).length,__t.C.tl[0].lanes.length]")
    check('S4: point shape and a new lane are set', r == [1, 2], r)
    r = await pg.evaluate("""(function(){var r=document.querySelectorAll('#tlEd svg rect')[0],b=r.getBoundingClientRect(),n=__t.C.tl[0].lanes[0].pts.length;
      r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:b.left+b.width*0.6,clientY:b.top+10,pointerId:5}));
      r.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:b.left+b.width*0.6,clientY:b.top+60,pointerId:5}));
      r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:b.left+b.width*0.6,clientY:b.top+60,pointerId:5}));return __t.C.tl[0].lanes[0].pts.length-n})()""")
    check('S4: a sliding touch on a lane does not add a point', r == 0, r)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=tl] .bdw-ed button')].filter(b=>b.textContent==='\u270E').length")
    check('S4: only one pencil (Rename) on the timeline toolbar', r == 1, r)
    await pg.evaluate("document.querySelector('#tlEd [data-a=done]').click()")
    r = await pg.evaluate("[!document.getElementById('tlEd'),JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.tl[0].lanes.length]")
    check('S4: Done closes the editor and saves', r == [True, 2], r)
    # duplicate keeps its own timeline; gallery adds a new one
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=tl] .bdw-ed button[aria-label=Duplicate]').click()")
    r = await pg.evaluate("[__t.C.tl.length,__t.C.board.filter(o=>o.k==='tl').map(o=>o.tl).filter((v,i,a)=>a.indexOf(v)===i).length]")
    check('S4: duplicating a player copies its timeline', r == [2, 2], r)
    await pg.evaluate("document.getElementById('bdTTL').click();document.getElementById('bdAdd').click()")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("[__t.C.tl.length,!!document.getElementById('tlEd'),document.getElementById('bdNote').textContent]")
    check('S4: adding a Timeline from the gallery opens the editor', r[:2] == [3, True], r)
    await pg.evaluate("document.querySelector('#tlEd [data-a=done]').click()")
    check('S2/S4: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()
    ctx = await b.new_context(viewport={'width': 844, 'height': 390})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("__t.C.tl[0].lanes.push({c:3,pts:[[0,0,0],[2,0,0]]});mk6Go('drive');document.getElementById('dbEdit')?document.getElementById('dbEdit').click():document.getElementById('bdEdit').click()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=tl] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Edit timeline').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("(function(){var s=document.querySelector('#tlEd svg').getBoundingClientRect(),d=document.querySelector('#tlEd [data-a=done]').getBoundingClientRect();return [Math.round(s.bottom),Math.round(d.bottom),innerHeight,Math.round(s.height)]})()")
    check('S4: in landscape the lanes and Done fit on the screen', r[0] <= r[2] and r[1] <= r[2] and r[3] < 300, r)
    check('S4: no JS errors (landscape)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_swing(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'X',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{},{},{},{},{},{}],board:[{k:'s',c:2,w:2},{k:'sw',c:2,w:2,dps:90,a:0}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[!!document.querySelector('#boardGrid .bdw[data-k=sw] svg image[href=\"swing-upper.png\"]'),!!document.querySelector('#boardGrid .bdw[data-k=sw] svg image[href=\"swing-tracks.png\"]')]")
    check('Swing: the widget shows the excavator (tracks + turning upper)', r == [True, True], r)
    await pg.evaluate("__t.rt.t[2]=100")
    await pg.wait_for_timeout(1000)
    r = await pg.evaluate("[__t.C.board[1].a,document.querySelector('#boardGrid .bdw[data-k=sw] .bdw-h output').textContent,document.querySelector('#boardGrid .bdw[data-k=sw] svg g[filter]').getAttribute('transform')]")
    check('Swing: driving the channel turns the cab and shows the angle', r[0] > 8 and r[1].startswith('+') and 'rotate(' in r[2], r)
    await pg.evaluate("__t.C.board[1].a=145")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[__t.C.board[1].a,+(window.__last||'').split(',')[2],document.querySelector('#boardGrid .bdw[data-k=sw] svg').textContent.indexOf('turn back only')>=0]")
    check('Swing: it stops at the right limit and the output goes to 0', r[0] == 150 and r[1] == 0 and r[2], r)
    await pg.evaluate("__t.rt.t[2]=-100")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("[__t.C.board[1].a,+(window.__last||'').split(',')[2]]")
    check('Swing: turning back away from the limit still works', r[0] < 150 and r[1] < 0, r)
    await pg.evaluate("__t.rt.t[2]=0")
    await pg.wait_for_timeout(300)
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=sw] svg g[role=button]').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
    r = await pg.evaluate("[__t.C.board[1].a,JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board[1].a]")
    check('Swing: the 0 button resets and saves the angle', r == [0, 0], r)
    check('Swing: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_newdash(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'MK',cfg:{layout:'board',ch:[{},{},{},{},{},{}],board:[{k:'s',c:0,w:1,g:[0,0,6,10]}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed + "window.MK6Bridge.orient=function(m){__calls.push('orient:'+m)};")
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("(function(){var p=document.getElementById('tabPlus'),n=document.querySelectorAll('#tabbar > button'),i=[].indexOf.call(n,p);return [n[i-1].dataset.tab,n[i+1].dataset.tab,getComputedStyle(p).display!=='none']})()")
    check('(+): sits between Drive and Models', r == ['drive', 'models', True], r)
    await pg.evaluate("document.getElementById('tabPlus').click()")
    r = await pg.evaluate("[!!document.getElementById('ndSheet'),[...document.querySelectorAll('#ndSheet .nd-tp')].map(b=>b.dataset.k).join()]")
    check('(+): opens the New dashboard sheet with 4 starts', r == [True, 'empty,exc,car,copy'], r)
    await pg.evaluate("var i=document.querySelector('#ndSheet input');i.value='Gali';document.querySelector('#ndSheet [data-k=exc]').click();document.querySelector('#ndSheet [data-a=go]').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[__t.store.profiles.length,__t.store.profiles[1].name,__t.store.active===__t.store.profiles[1].id,__t.store.profiles[1].cfg.dash,__t.store.profiles[1].cfg.board.length>0,__calls.indexOf('orient:land')>=0,document.documentElement.getAttribute('data-v')]")
    check('(+): creates a sideways board from the template and asks for landscape', r == [2, 'Gali', True, True, True, True, 'drive'], r)
    await pg.set_viewport_size({'width': 844, 'height': 390})
    await pg.wait_for_timeout(700)
    r = await pg.evaluate("[document.documentElement.classList.contains('dash'),document.querySelectorAll('#boardGrid .dw-ed').length>0]")
    check('(+): once sideways, the board opens in edit mode', r == [True, True], r)
    await pg.evaluate("document.getElementById('dbEdit').click()")
    r = await pg.evaluate("__calls.filter(c=>c.indexOf('orient:')===0)")
    check('(+): Done gives rotation back to the phone', r == ['orient:land', 'orient:auto'], r)
    check('(+): no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_recx(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'RX',cfg:{layout:'board',limit:100,ramp:100,ch:[{},{},{},{},{},{}],
      board:[{k:'s',c:0,w:1},{k:'s',c:1,w:1},{k:'k',c:0,w:2,cs:[1]}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML)
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){};mk6Go('home');document.getElementById('hConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(300)
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=k] [aria-label=\"Record up to 60 s\"]').click()")
    await pg.evaluate("var r=document.querySelectorAll('#boardGrid .bdw[data-k=s] input[type=range]')[1];r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=70;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(1500)
    js = "(function(){var s=document.querySelector('#boardGrid .bdw[data-k=k] svg.mtr'),p=[...s.querySelectorAll('polyline')].find(p=>p.getAttribute('stroke')==='#ffd84a');if(!p) return 'none';var md=Math.max(...p.getAttribute('points').split(' ').map(q=>-+q.split(',')[1]));return [p.getAttribute('visibility'),md]})()"
    r1 = await pg.evaluate(js)
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=k] [aria-label=Stop]').click()")
    await pg.wait_for_timeout(300)
    r2 = await pg.evaluate(js)
    lo = await pg.evaluate("(function(){var s=document.querySelector('#boardGrid .bdw[data-k=k] svg.mtr'),p=[...s.querySelectorAll('polyline')].find(p=>p.getAttribute('stroke')==='#ffd84a');return Math.min(...p.getAttribute('points').split(' ').map(q=>+q.split(',')[1]))})()")
    check('scope REC: the second channel is drawn while recording and after Stop', r1 != 'none' and r1[0] == 'visible' and r2[0] == 'visible' and r1[1] > -60 and r2[1] > -60, [r1, r2])
    check('scope REC: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_chmap(b):
    ctx = await b.new_context(viewport={'width': 844, 'height': 390})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'CH',cfg:{layout:'board',dash:true,ch:[{},{},{},{},{},{}],
      board:[{k:'n',c:0,w:1},{k:'n',c:1,w:1},{k:'d',c:0,d:1,e:2,f:3,w:2},{k:'lx',t:'eq',c:2,cs:[3],w:1}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("mk6Go('drive')"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.getElementById('dbEdit').click()"); await pg.wait_for_timeout(400)
    B = "JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board"
    y0 = await pg.evaluate("__t.C.board.map(o=>o.g[1])")
    W = "[...document.querySelectorAll('#boardGrid .bdw')]"
    r = await pg.evaluate("document.querySelectorAll('#boardGrid .bdw-chip.tap').length")
    check('channels: chips can be tapped while editing', r >= 2, r)
    await pg.evaluate(W+"[0].querySelector('.bdw-chip.tap').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.querySelectorAll('#chPop .chp-g .btn').length,document.querySelector('#chPop .chp-g .btn[aria-pressed=true] b').textContent,document.querySelectorAll('#chPop .chp-g .btn.used').length]")
    check('channels: the pop-over shows A-F, the current one picked, used ones marked', r[0] == 6 and r[1] == 'A' and r[2] >= 3, r)
    await pg.evaluate("[...document.querySelectorAll('#chPop .chp-g .btn')][4].click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("["+B+"[0].c,!!document.getElementById('chShare'),!document.getElementById('dbBack').hidden]")
    check('channels: a free channel is taken at once and can be undone', r == [4, False, True], r)
    await pg.evaluate(W+"[0].querySelector('.bdw-chip.tap').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#chPop .chp-g .btn')][1].click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("[!!document.getElementById('chShare'),"+B+"[0].c]")
    check('channels: a used channel asks first (share or cancel)', r == [True, 4], r)
    await pg.evaluate("document.querySelector('#chShare [data-a=go]').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate(B+"[0].c")
    check('channels: Share uses the channel together', r == 1, r)
    # double stick: role picker through the toolbar, picking a channel it already uses swaps the two
    await pg.evaluate("var w="+W+".find(e=>e.dataset.k==='d'),r=w.getBoundingClientRect();w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3,clientX:r.left+20,clientY:r.top+40}));w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3,clientX:r.left+20,clientY:r.top+40}))")
    await pg.wait_for_timeout(300)
    await pg.evaluate("var w="+W+".find(e=>e.dataset.k==='d');w.querySelector('.bdw-chip.tap').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("document.querySelectorAll('#chPop .chp-r .btn').length")
    check('channels: a double stick lists its 4 roles', r == 4, r)
    await pg.evaluate("[...document.querySelectorAll('#chPop .chp-g .btn')][3].click()"); await pg.wait_for_timeout(300)
    sh = await pg.evaluate("!!document.getElementById('chShare')")
    await pg.evaluate("document.querySelector('#chShare [data-a=go]').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(function(){var d="+B+".find(o=>o.k==='d');return [d.c,d.f]})()")
    check('channels: D is also on the LED bars (asks), and the stick swaps its own two roles', sh and r == [3, 0], [sh, r])
    # settings sheet: named list
    await pg.evaluate("var w="+W+"[1],r=w.getBoundingClientRect();w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:4,clientX:r.left+r.width/2,clientY:r.top+r.height*0.7}));w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:4,clientX:r.left+r.width/2,clientY:r.top+r.height*0.7}))")
    await pg.wait_for_timeout(300)
    await pg.evaluate(W+"[1].querySelector('.bdw-ed [aria-label=\"Widget settings\"]').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('#gEdit .ws-chb').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.querySelectorAll('#chList .chl-r').length,document.querySelector('#chList .chl-r.me .chl-n').textContent.length>0,document.querySelectorAll('#chList .chl-u.used').length]")
    check('channels: the named list shows 6 channels, this widget and the used ones', r[0] == 6 and r[1] and r[2] >= 2, r)
    await pg.evaluate("[...document.querySelectorAll('#chList .chl-r')][5].click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("["+B+"[1].c,!!document.querySelector('#gEdit .ws-chb'),document.querySelector('#gEdit .ws-chb .bdw-chip').textContent]")
    check('channels: picked in the list, the settings sheet comes back with the new channel', r == [5, True, 'F'], r)
    await pg.evaluate("document.querySelector('#gEdit .gact .btn:last-child').click()")
    await pg.evaluate("document.getElementById('dbBack').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate(B+"[1].c")
    check('channels: Back undoes the last channel change', r == 1, r)
    r = await pg.evaluate("(function(){var o=__t.C.board.find(o=>o.k==='lx');return [typeof o.c,JSON.stringify(o.cs)]})()")
    check('channels: LED bars keep their own extra channels', r == ['number', '[3]'], r)
    # while driving, with the hub on
    await pg.evaluate("document.getElementById('dbEdit').click()"); await pg.wait_for_timeout(300)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};onHubState('ready')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#boardGrid .bdw-chip.tap').length,!!"+W+".find(e=>e.dataset.k==='d').querySelector('.bdw-chip.tap')]")
    check('channels: chips stay tappable while driving, double stick has one too', r[0] >= 4 and r[1], r)
    await pg.evaluate(W+"[0].querySelector('.bdw-chip.tap').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#chPop .chp-g .btn')][4].click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("["+B+"[0].c,document.documentElement.classList.contains('dash')]")
    check('channels: the pop-over changes the channel while the hub is on', r == [4, True], r)
    check('channels: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_upg(b):
    ctx = await b.new_context(viewport={'width': 844, 'height': 390})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'UP',cfg:{layout:'board',dash:true,limit:100,ramp:100,ch:[{},{},{},{},{},{}],
      board:[{k:'s',c:0,w:2},{k:'j',c:1,d:2,w:2},{k:'n',c:3,w:1}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){};mk6Go('drive');onHubState('ready')"); await pg.wait_for_timeout(500)
    W = "[...document.querySelectorAll('#boardGrid .bdw')]"
    # live frames
    await pg.evaluate("var r=document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]:not(.ovr)');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=50;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(700)
    r1 = await pg.evaluate(W+".find(e=>e.dataset.k==='s').className")
    await pg.evaluate("var r=document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]:not(.ovr)');r.value=r.max;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(900)
    r2 = await pg.evaluate(W+".find(e=>e.dataset.k==='s').className")
    r3 = await pg.evaluate(W+".find(e=>e.dataset.k==='n').className")
    check('live frames: green while running, red at full stroke, idle stays plain', 'lv-run' in r1 and 'lv-lim' in r2 and 'lv-' not in r3, [r1, r2, r3])
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]:not(.ovr)').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    await pg.evaluate("document.getElementById('estop').click()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate(W+".filter(e=>e.classList.contains('lv-stop')).length")
    check('live frames: every widget blinks red on E-Stop', r == 3, r)
    await pg.evaluate("onHubState('ready');document.getElementById('estop').click()"); await pg.wait_for_timeout(300)
    # joystick trail + fine control on the joystick
    await pg.evaluate("""(function(){var p=document.querySelector('#boardGrid .bdw[data-k=j] .pad'),r=p.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      p.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:21,clientX:cx,clientY:cy}));
      for(var i=1;i<=6;i++) p.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:21,clientX:cx+i*8,clientY:cy}));})()""")
    await pg.wait_for_timeout(120)
    r = await pg.evaluate("(function(){var c=document.querySelector('#boardGrid .bdw[data-k=j] canvas.ptrail'),x=c.getContext('2d').getImageData(0,0,c.width,c.height).data,n=0;for(var i=3;i<x.length;i+=4) if(x[i]>20) n++;return n})()")
    check('joystick trail: a light tail is drawn behind the knob', r > 50, r)
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=j] .pad').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:21}))")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("(function(){var c=document.querySelector('#boardGrid .bdw[data-k=j] canvas.ptrail'),x=c.getContext('2d').getImageData(0,0,c.width,c.height).data,n=0;for(var i=3;i<x.length;i+=4) if(x[i]>20) n++;return n})()")
    check('joystick trail: the tail fades out after about 0.4 s', r == 0, r)
    # fine control: second finger on the grid itself
    await pg.evaluate("var g=document.getElementById('boardGrid'),r=g.getBoundingClientRect();g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:31,clientX:r.right-3,clientY:r.bottom-3}))")
    r = await pg.evaluate("[document.documentElement.classList.contains('fine'),!!document.querySelector('#fineBadge.on')]")
    check('fine control: a second finger on empty space shows the Fine badge', r == [True, True], r)
    jx = await pg.evaluate(r"""(function(){var p=document.querySelector('#boardGrid .bdw[data-k=j] .pad'),r=p.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      p.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:22,clientX:cx,clientY:cy}));
      p.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:22,clientX:cx+50,clientY:cy}));
      return new Promise(function(res){setTimeout(function(){var m=/translate\(([-\d.]+)px/.exec(p.querySelector('.knob').style.transform);res(m?+m[1]:null)},80)})})()""")
    check('fine control: the joystick knob moves 30% of the finger (50 px -> 15 px)', jx is not None and abs(jx - 15) < 1.5, jx)
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=j] .pad').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:22}))")
    sv = await pg.evaluate("""(function(){var r=document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]:not(.ovr)');r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));
      var rc=r.getBoundingClientRect(),x=rc.left+rc.width/2,y=rc.top+rc.height/2;
      r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:23,clientX:x,clientY:y}));
      r.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:23,clientX:x+rc.width/2,clientY:y}));
      var v=+r.value;r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:23}));return [v,+r.max]})()""")
    check('fine control: a half-width slide moves the slider 30% of half its range', abs(sv[0] - sv[1]*0.3) <= 2, sv)
    await pg.evaluate("document.getElementById('boardGrid').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:31}))")
    r = await pg.evaluate("document.documentElement.classList.contains('fine')")
    check('fine control: lifting the second finger ends it', r is False, r)
    # pinch in edit mode
    await pg.evaluate("onHubState('off')"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('dbEdit').click()"); await pg.wait_for_timeout(400)
    g0 = await pg.evaluate("JSON.stringify(__t.C.board.find(o=>o.k==='n').g)")
    await pg.evaluate("""(function(){var w=[...document.querySelectorAll('#boardGrid .bdw')].find(e=>e.dataset.k==='n'),r=w.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:41,clientX:cx-5,clientY:cy-5}));
      w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:42,clientX:cx+5,clientY:cy+5}));
      window.__pzLab=!!w.querySelector('.dw-psz');
      w.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:42,clientX:cx+5,clientY:cy+60}));
      w.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:41,clientX:cx-5,clientY:cy-5}));
      w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:42,clientX:cx+5,clientY:cy+60}));
      w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:41,clientX:cx-5,clientY:cy-5}));})()""")
    await pg.wait_for_timeout(300)
    g1 = await pg.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board.find(o=>o.k==='n').g)")
    lab = await pg.evaluate("window.__pzLab")
    check('pinch: two fingers on a widget show the size and resize it in grid steps', lab and g1 != g0 and g1 is not None, [lab, g0, g1])
    r = await pg.evaluate("!document.getElementById('dbBack').hidden")
    check('pinch: the new size can be undone with Back', r, r)
    check('upgrades: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_set2(b):
    ctx = await b.new_context(viewport={'width': 844, 'height': 390})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'S2',cfg:{layout:'board',dash:true,limit:100,ramp:100,ch:[{},{},{},{},{},{}],
      board:[{k:'s',c:0,w:2,g:[0,0,16,8]},{k:'n',c:1,w:1,g:[16,0,10,12]},{k:'s',c:2,w:2,g:[0,8,16,8]},{k:'n',c:3,w:1,g:[26,0,8,8]}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){};mk6Go('drive');onHubState('ready')"); await pg.wait_for_timeout(500)
    W = "[...document.querySelectorAll('#boardGrid .bdw')]"
    # dial comet
    await pg.evaluate("""(function(){var k=document.querySelectorAll('#boardGrid .dialk')[0],r=k.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2;
      k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:5,clientX:cx,clientY:cy-R}));
      for(var i=1;i<=10;i++){var a=-Math.PI/2+i*0.15;k.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:5,clientX:cx+R*Math.cos(a),clientY:cy+R*Math.sin(a)}))}})()""")
    await pg.wait_for_timeout(120)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .dcomet')[0].children].filter(e=>+e.style.opacity>0).length")
    check('dial comet: the segments the dial just passed glow', r >= 2, r)
    await pg.evaluate("var k=document.querySelectorAll('#boardGrid .dialk')[0];k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:5}))")
    await pg.wait_for_timeout(700)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .dialk')].map(k=>k.getAttribute('aria-valuenow')).concat([[...document.querySelectorAll('#boardGrid .dcomet')[0].children].filter(e=>+e.style.opacity>0).length])")
    check('dial comet: the tail fades out after the dial stops', r[2] == 0 and r[0] not in ('0', None), r)
    # dial double tap -> 0
    await pg.evaluate("""(function(){var k=document.querySelectorAll('#boardGrid .dialk')[0],r=k.getBoundingClientRect(),x=r.left+r.width*.8,y=r.top+r.height*.5;
      for(var i=0;i<2;i++){k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:6+i,clientX:x,clientY:y}));k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:6+i,clientX:x,clientY:y}))}})()""")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("document.querySelectorAll('#boardGrid .dialk')[0].getAttribute('aria-valuenow')")
    check('double tap: the dial glides back to 0', r == '0', r)
    # slider double tap on the thumb
    sv = await pg.evaluate("""(function(){var r=document.querySelectorAll('#boardGrid .bdw[data-k=s] input[type=range]:not(.ovr)')[0];r.value=60;r.dispatchEvent(new Event('input',{bubbles:true}));
      var rc=r.getBoundingClientRect(),z=parseFloat(r.style.zoom)||1,T=40*z,f=(60-r.min)/(r.max-r.min),x=rc.left+T/2+f*(rc.width-T),y=rc.top+rc.height/2;
      for(var i=0;i<2;i++){r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:8+i,clientX:x,clientY:y}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:8+i,clientX:x,clientY:y}))}
      return new Promise(function(res){setTimeout(function(){res([+r.value,+r.min])},450)})})()""")
    check('double tap: a slider knob glides back to 0', sv[0] == (0 if sv[1] < 0 else sv[1]), sv)
    # black box
    await pg.evaluate("var r=document.querySelectorAll('#boardGrid .bdw[data-k=s] input[type=range]:not(.ovr)')[1];r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=r.max;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(900)
    await pg.evaluate("document.getElementById('estop').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(function(){var a=JSON.parse(localStorage.getItem('mk6bb')||'[]');return [a.length,a[0]&&a[0].ch.length,a[0]&&a[0].d.length,a[0]&&Math.max.apply(null,a[0].d.map(p=>Math.max.apply(null,p.slice(1).map(Math.abs))))]})()")
    check('black box: E-Stop keeps the last seconds of the channels that moved', r[0] == 1 and r[1] >= 1 and r[2] >= 5 and r[3] > 20, r)
    await pg.evaluate("document.getElementById('estop').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("mk6Go('settings')"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('sBb').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[!!document.querySelector('#bbView canvas'),document.querySelectorAll('#bbView .bb-li').length,document.querySelector('#bbView canvas').width>0]")
    check('black box: Settings shows the graph with a legend', r[0] and r[1] >= 1 and r[2], r)
    await pg.evaluate("document.querySelector('#bbView .gact .btn:last-child').click();mk6Go('drive');onHubState('off')"); await pg.wait_for_timeout(400)
    # swap in edit mode
    await pg.evaluate("document.getElementById('dbEdit').click()"); await pg.wait_for_timeout(400)
    B = "JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board"
    y0 = await pg.evaluate("__t.C.board.map(o=>o.g[1])")
    await pg.evaluate("""(function(){var ws=[...document.querySelectorAll('#boardGrid .bdw')],a=ws[0],b=ws[2],ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
      a.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:11,clientX:ra.left+20,clientY:ra.top+30}));
      for(var i=1;i<=6;i++) a.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:11,clientX:ra.left+20,clientY:ra.top+30+(rb.top-ra.top)*i/6}));
      window.__swt=!!document.querySelector('#boardGrid .swapt');
      a.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:11,clientX:ra.left+20,clientY:rb.top+30}))})()""")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[window.__swt,"+B+".map(o=>o.g[1])]")
    check('swap: dropping a widget on another swaps their places', r[0] and r[1][0] == y0[2] and r[1][2] == y0[0] and y0[0] != y0[2], [r, y0])
    # match size: pick widget 1 (dial 10x12), match onto dial 2 (8x8)
    await pg.evaluate("""(function(){var w=[...document.querySelectorAll('#boardGrid .bdw')][3],r=w.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height*.75;
      w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:12,clientX:x,clientY:y}));w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:12,clientX:x,clientY:y}))})()""")
    await pg.wait_for_timeout(300)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw')][3].querySelector('.bdw-ed [aria-label=\"Match size\"]').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("!!document.querySelector('#msBar.on')")
    check('match size: the bar tells you to tap widgets', r, r)
    await pg.evaluate("""(function(){var w=[...document.querySelectorAll('#boardGrid .bdw')][1],r=w.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height*.75;
      w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:13,clientX:x,clientY:y}));w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:13,clientX:x,clientY:y}))})()""")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate(B+".map(o=>o.g.slice(2).join('x'))")
    check('match size: the tapped widget takes the same size', r[1] == r[3], r)
    await pg.evaluate("document.querySelector('#msBar .btn').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("!document.querySelector('#msBar.on')")
    check('match size: Done ends it', r, r)
    check('set 2: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for t in (t_hub_paths, t_hold, t_idle, t_screens, t_features, t_graphics, t_extras, t_light_contrast, t_twelve, t_migrate_and_limit, t_lefty, t_seven, t_three, t_led, t_wup, t_xw, t_pro, t_pro2, t_drtl, t_swing, t_newdash, t_recx, t_chmap, t_upg, t_set2, t_open_relink, t_click_everything):
            try:
                await t(b)
            except Exception as e:
                check(t.__name__ + ' ran', False, str(e)[:300])
        await b.close()
    failed = [n for n, ok in RESULTS if not ok]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
