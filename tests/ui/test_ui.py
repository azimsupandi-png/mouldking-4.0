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
window.__ed=function(){var b=document.getElementById('bdEdit');if(b.getAttribute('aria-pressed')==='true'){b.click();if(window.__edOn)onHubState('ready');window.__edOn=0}else{window.__edOn=b.disabled;if(b.disabled)onHubState('off');b.click()}};

window.__calls=[];window.__bt=true;
window.MK6Bridge={start:function(m){__calls.push('start:'+m)},send:function(f){__calls.push('send')},stop:function(){__calls.push('stop')},
 haptic:function(k){__calls.push('haptic:'+k)},tilt:function(){},immersive:function(){},battery:function(){return 84},btOn:function(){return __bt},
 btSettings:function(){__calls.push('btSettings')},exportFile:function(){__calls.push('export')},importFile:function(){__calls.push('import')},
 pickWallpaper:function(){},autoBackup:function(){},pinModel:function(){},shortcuts:function(){},
 stats:function(){return JSON.stringify({mode:'single',hubs:1,ok:120,fail:2,frames:130,watchdog:0,up:65000,lastFrameAgo:40,tx:1,err:4,errAgo:5000})},
 log:function(){return window.__log||''},clearLog:function(){window.__log='';__calls.push('clearLog')},scanStart:function(){window.__scan=true;__calls.push('scanStart')},scanStop:function(){window.__scan=false;__calls.push('scanStop')},
 scanResults:function(){return JSON.stringify({scanning:!!window.__scan,err:0,list:window.__devs||[]})},
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
    for v in ['home', 'drive', 'models', 'medit', 'tpl', 'settings', 'hub', 'safety', 'backup', 'm-tilt', 'm-pad', 'm-log']:
        ctx, pg = await page(b)
        await pg.evaluate("mk6Go('home');document.getElementById('hubConn').click();onHubState('ready')")
        for _ in range(2):
            await pg.evaluate(f"mk6Go('{v}')")
            await pg.wait_for_timeout(120)
            n = await pg.evaluate("(()=>{const bs=[...document.querySelectorAll('main button, main input[type=checkbox], main summary')].filter(e=>e.offsetParent&&!e.disabled&&true);window.__q=bs;return bs.length})()")
            for i in range(n):
                await pg.evaluate(f"(()=>{{const e=window.__q[{i}];if(e&&e.isConnected&&e.offsetParent){{e.dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}}));e.dispatchEvent(new PointerEvent('pointerup',{{bubbles:true}}));e.click()}}}})()")
                total += 1
            await pg.wait_for_timeout(250)
            await pg.evaluate("['#dashTpl','#jcDlg','#lxDlg','#guide'].forEach(q=>{var e=document.querySelector(q);if(e)e.hidden=true})")
        errs += [v + ': ' + e for e in pg.errors]
        await ctx.close()
    check(f'click every control on 13 screens ({total} clicks) without JS errors', not errs and total > 100, errs[:5])

async def t_hub_paths(b):
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('home');__calls=[];document.getElementById('hubConn').click()")
    check('Connect calls MK6Bridge.start', 'start:0' in await pg.evaluate("__calls.join(',')"))
    r = await pg.evaluate("onHubState('connecting');onHubState('ready');" + W % "[document.documentElement.dataset.v,document.querySelector('#v2Pill .ptx').textContent]")
    check('ready opens Drive and the pill shows Hub active', r == ['drive', 'Hub active'], r)
    r = await pg.evaluate("__calls=[];new Promise(r=>setTimeout(()=>r(__calls.filter(c=>c=='send').length),1200))")
    check('idle keep-alive sends at most ~1 frame/s at zero', r <= 3, r)
    r = await pg.evaluate("mk6Go('home');onHubState('error');" + W % "[...document.querySelectorAll('#hAlerts h2')].map(e=>e.textContent)")
    check('lost link shows Connection lost alert', 'Connection lost' in r, r)
    r = await pg.evaluate("onHubState('off');__bt=true;onAppEvent('bt1');" + W % "document.querySelector('#v2Pill .ptx').textContent")
    check('Bluetooth back on clears the stale message', r == 'Connect hub', r)
    r = await pg.evaluate("__calls=[];mk6Go('settings');document.getElementById('sPrac').click();mk6Go('home');document.getElementById('hubConn').click();" + W % "__calls.filter(c=>c.startsWith('start')||c=='send').length")
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
    await pg.evaluate("mk6Go('home');__calls=[];document.getElementById('hubConn').click()")
    check('101 Home: Connect on the hub card connects', 'start:0' in await pg.evaluate("__calls.join(',')"))
    r = await pg.evaluate("[!!document.getElementById('hPS'),!!document.querySelector('#scrHome #hubCard'),!!document.querySelector('#scrHome #wrCard'),!!document.getElementById('scrHub'),!!document.querySelector('[data-go=hub]')]")
    check('101 old Home cards gone, hub cards on Home, Hub screen and its Settings row gone', r == [False, True, True, False, False], r)
    await pg.evaluate("onHubState('ready')")
    await pg.wait_for_timeout(500)
    await pg.evaluate("mk6Go('drive');__ed();document.getElementById('bdTPS').click();document.getElementById('bdAdd').click();__ed();__calls=[]")
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
    r = await pg.evaluate("mk6Go('hub');document.querySelector('#hubSlots .btn').click();" + W % "[document.getElementById('hub1').value,!!document.getElementById('chTest'),document.querySelectorAll('#wrTabs button').length]")
    check('Hub: Add second hub shows hub tabs in wiring (channel test is gone)', r == ['1', False, 3], r)
    r = await pg.evaluate("document.querySelector('#hubSlots .btn').click();" + W % "document.getElementById('hub1').value")
    check('Hub: Remove second hub', r == '-1', r)
    r = await pg.evaluate("[!!document.getElementById('lockBtn'),!!document.getElementById('playerBtn'),!!document.getElementById('pinSet'),!!document.getElementById('optFx'),!!document.getElementById('guideBtn'),!!document.getElementById('pinBtn'),!!document.getElementById('player'),'pin' in (JSON.parse(localStorage.getItem('mk6v2')||'{}').prefs||{}),'lock' in (JSON.parse(localStorage.getItem('mk6v2')||'{}').prefs||{})]")
    check('player mode, lock, PIN, effects, guide button and home-screen shortcut are gone', r == [False]*9, r)
    r = await pg.evaluate("mk6Go('settings');[mk6Back(),document.documentElement.dataset.v,mk6Back()]")
    check('Android Back goes to Home, then leaves', r == [True, 'home', False], r)
    check('no JS errors (features)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_graphics(b):
    ctx, pg = await page(b)
    r = await pg.evaluate("mk6Go('drive');new Promise(r=>setTimeout(()=>r([document.documentElement.classList.contains('v2-nohub'),[...document.querySelectorAll('#boardGrid > .bdw.v2-es')].length]),400))")
    check('no hub: widgets dimmed, E-Stop widget kept bright', r[0] and r[1] >= 1, r)
    await pg.evaluate("mk6Go('home');document.getElementById('hubConn').click()")
    await pg.wait_for_timeout(300)
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
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready');mk6Go('hub');document.getElementById('hubDiag').open=true")
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
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready');mk6Go('settings');document.getElementById('sLight').click()")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(300)
    # 1 trim: buttons on the slider widget, offset reaches the hub, E-Stop zeroes it
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=s] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var f=[...document.querySelectorAll('#gEdit .wsf')].find(x=>x.querySelector('.wsl').textContent.startsWith('Trim buttons'));[...f.querySelectorAll('.wsc .btn')].find(b=>b.textContent==='On').click();[...document.querySelectorAll('#gEdit .gact .btn')][0].click();__ed()")
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
    r = await pg.evaluate("__ed();[...document.querySelectorAll('#boardGrid .bdw[data-k=s] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click();var ok=!!document.querySelector('#gEdit .cved-g');[...document.querySelectorAll('#gEdit .cved-c button')].find(b=>b.textContent==='Fine').click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();__ed();ok")
    check('2 curve: the editor is in the slider settings', r, r)
    # 3 drive mode chips = Eco / Normal / Sport profiles
    await pg.evaluate("document.querySelector('#dMode [data-lp=\"0\"]').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelector('#dMode [data-lp=\"0\"]').getAttribute('aria-pressed'),document.getElementById('limP0').getAttribute('aria-pressed')]")
    check('3 drive mode: Eco on the Drive screen sets the Eco profile', r == ['true', 'true'], r)
    # 7 live meter follows the output
    await pg.evaluate("document.querySelector('#dMode [data-lp=\"2\"]').click();var r=document.querySelector('#boardGrid input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=80;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("[!!document.getElementById('dMeter'),!!document.getElementById('sMeter'),!!document.getElementById('sDir')]")
    check('7 live output meter and its switches are gone', r == [False, False, False], r)
    await pg.evaluate("var r=document.querySelector('#boardGrid input[type=range]');r.value=0;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))")
    # 9 size button cycles 1x1 -> 2x1
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=l] .bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Size').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=l]').className")
    check('9 size: a widget can be made 2x1', 'w2' in r, r)
    # 10 gallery: picture cards and category tabs
    r = await pg.evaluate("var t=[...document.querySelectorAll('.v2-gtabs .btn')].find(b=>b.textContent==='Meters');t.click();[document.querySelectorAll('.bd-types .gt svg').length,[...document.querySelectorAll('.bd-types > .btn')].filter(b=>!b.hidden).length]")
    check('10 gallery: 35 picture cards, Meters tab shows 7', r == [35, 7], r)
    await pg.evaluate("__ed()")
    # 8 model colour persists and tints the board
    await pg.evaluate("mk6Go('medit');document.querySelectorAll('#swatches .sw')[2].click()")
    r = await pg.evaluate("document.documentElement.getAttribute('data-macc')")
    check('8 model colour: blue is applied', r == '2', r)
    # 4 gamepad picture: pressing a button highlights its row
    await pg.evaluate("mk6Go('m-pad');v2GpPress(1)")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#gpPic .gp-b,#gpPic2 .gp-b').length,document.querySelectorAll('#gpMap .pm')[1].classList.contains('v2sel')]")
    check('4 gamepad picture: 12 buttons, pressing B selects its row', r == [12, True], r)
    # 11 quick settings: hold the pill
    await pg.evaluate("mk6Go('home');document.getElementById('v2Pill').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientY:20}))")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("[!!document.getElementById('v2QS'),document.querySelectorAll('#v2QS .qs-t').length]")
    check('11 quick settings open by holding the status pill', r == [True, 5], r)
    await pg.evaluate("document.getElementById('v2QS').click()")
    await pg.wait_for_timeout(300)
    # 12 interactive guide: spotlight on real controls, 6 steps
    await pg.evaluate("mk6Go('settings');document.getElementById('sTour').click();setTimeout(function(){document.getElementById('gNext').click()},200)")
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
    await pg.evaluate("__calls=[];mk6Go('home');document.getElementById('hubConn').click();onHubState('ready')")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    await pg.evaluate("__ed();document.getElementById('bdTFN').click();document.getElementById('bdAdd').click();__ed()")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f;(window.__all=window.__all||[]).push(f)};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    await pg.evaluate("__ed();document.getElementById('bdTXmx').click();document.getElementById('bdAdd').click();__ed()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#boardGrid .lx-mx').length,document.querySelectorAll('#boardGrid .bdw.hzw, #boardGrid .bdw[data-k=i]').length]")
    check('gallery adds LED arrows', r[0] == 2, r)
    # tachometer looks A-F: each builds, and the setting is kept
    await pg.evaluate("__ed();document.getElementById('bdTFN').click();document.getElementById('bdAdd').click();var w=[...document.querySelectorAll('#boardGrid .bdw[data-k=f]')].pop();[...w.querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("var box=[...document.querySelectorAll('#gEdit .wsf')].find(f=>f.querySelector('.wsl').textContent==='Tachometer look');var ok=!!box;if(box) [...box.querySelectorAll('button')].find(b=>b.textContent==='E Pro').click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();__ed();ok")
    await pg.wait_for_timeout(300)
    r2 = await pg.evaluate("document.querySelectorAll('#boardGrid .bdw[data-k=f] .ndl').length")
    check('tachometer: look A-F can be picked in its settings', r and r2 >= 1, [r, r2])
    # portrait: the undo bar can be dragged too, and portrait keeps its own spot apart from landscape
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("getComputedStyle(document.querySelector('#v2Undo .v2-ugrip')).display")
    check('undo bar shows its grip in portrait', r in ('flex', 'inline-flex'), r)
    r = await pg.evaluate("""(function(){var g=document.querySelector('#v2Undo .v2-ugrip'),r=g.getBoundingClientRect(),x=r.left+5,y=r.top+5,o={bubbles:true,pointerId:2};
      g.dispatchEvent(new PointerEvent('pointerdown',Object.assign({clientX:x,clientY:y},o)));g.dispatchEvent(new PointerEvent('pointermove',Object.assign({clientX:30,clientY:300},o)));g.dispatchEvent(new PointerEvent('pointerup',Object.assign({clientX:30,clientY:300},o)));
      var b=document.getElementById('v2Undo').getBoundingClientRect(),st=JSON.parse(localStorage.getItem('mk6UndoPos')||'{}');return [Math.round(b.left),Math.round(b.top),!!st.p,!!st.l]})()""")
    check('undo bar can be dragged in portrait and its portrait spot is saved', r[0] < 50 and 250 < r[1] < 340 and r[2] and not r[3], r)
    r = await pg.evaluate("""(function(){var g=document.querySelector('#v2Undo .v2-ugrip'),o={bubbles:true,pointerId:5,clientX:20,clientY:300};
      for(var k=0;k<2;k++){g.dispatchEvent(new PointerEvent('pointerdown',o));g.dispatchEvent(new PointerEvent('pointerup',o))}
      return document.getElementById('v2Undo').classList.contains('moved')})()""")
    check('double-tap on the grip puts the portrait undo bar back', r is False, r)
    r = await pg.evaluate("""(function(){__t.toast('hello',3000);var t=document.getElementById('toast').getBoundingClientRect(),b=document.getElementById('v2Undo').getBoundingClientRect();return t.bottom<=b.top+1})()""")
    check('a toast shows above the undo bar in portrait, not behind it', r, r)
    await pg.evaluate("__ed()")
    await pg.set_viewport_size({'width': 844, 'height': 390})
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.documentElement.classList.contains('dash'),getComputedStyle(document.querySelector('#v2Undo .v2-ugrip')).display]")
    check('landscape dashboard shows the undo grip', r == [True, 'flex'] or r == [True, 'inline-flex'], r)
    await pg.evaluate("__ed()")
    # undo bar: drag it by its grip; the spot is kept; double-tap puts it back
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("""(function(){var g=document.querySelector('#v2Undo .v2-ugrip'),r=g.getBoundingClientRect(),x=r.left+5,y=r.top+5,o={bubbles:true,pointerId:3};
      g.dispatchEvent(new PointerEvent('pointerdown',Object.assign({clientX:x,clientY:y},o)));g.dispatchEvent(new PointerEvent('pointermove',Object.assign({clientX:40,clientY:200},o)));g.dispatchEvent(new PointerEvent('pointerup',Object.assign({clientX:40,clientY:200},o)));
      var b=document.getElementById('v2Undo').getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),!!localStorage.getItem('mk6UndoPos')]})()""")
    check('undo bar can be dragged on the landscape dashboard and its spot is saved', r[0] < 60 and 150 < r[1] < 230 and r[2], r)
    r2 = await pg.evaluate("Math.round(document.getElementById('v2Undo').getBoundingClientRect().height)")
    check('undo bar keeps its size when moved', 40 <= r2 <= 60, r2)
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("var b=document.getElementById('v2Undo').getBoundingClientRect();[Math.round(b.left),Math.round(b.top)]")
    check('undo bar comes back where it was left', r[0] < 60 and 150 < r[1] < 230, r)
    r = await pg.evaluate("""(function(){var g=document.querySelector('#v2Undo .v2-ugrip'),o={bubbles:true,pointerId:4,clientX:20,clientY:200};
      for(var k=0;k<2;k++){g.dispatchEvent(new PointerEvent('pointerdown',o));g.dispatchEvent(new PointerEvent('pointerup',o))}
      return document.getElementById('v2Undo').classList.contains('moved')})()""")
    check('double-tap on the grip puts the undo bar back', r is False, r)
    await pg.evaluate("__ed()")
    # widget settings explain the hub value: start power 4 -> 75 becomes 79
    await pg.set_viewport_size({'width': 390, 'height': 844})
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("__ed();[...document.querySelector('#boardGrid .bdw[data-k=s]').querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click();var t=(document.querySelector('#gEdit .wsinfo-t')||{}).textContent||'';var hasOff=[...document.querySelectorAll('#gEdit .wsl')].some(l=>/^Start power/.test(l.textContent));document.getElementById('gEdit').remove();__ed();[t,hasOff]")
    check('widget settings show start power and explain 75 -> hub 79', 'start power +4%' in r[0] and 'hub 79' in r[0] and r[1], r)
    # light program: Chase across the panel's two lights (E, F), then stop
    await pg.evaluate("__ed();var w=document.querySelector('#boardGrid .lx-lp').closest('.bdw');[...w.querySelectorAll('.bdw-ed button')].find(b=>b.getAttribute('aria-label')==='Widget settings').click()")
    await pg.wait_for_timeout(200)
    await pg.evaluate("var box=[...document.querySelectorAll('#gEdit .wsf')].find(f=>f.querySelector('.wsl').textContent==='Light program');[...box.querySelectorAll('button')].find(b=>b.textContent==='Chase').click();[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Save').click();__ed()")
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
    await pg.evaluate("__ed()")
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
    await pg.evaluate("__ed()")
    await pg.set_viewport_size({'width': 844, 'height': 390})
    await pg.evaluate("__ed()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("var b=document.getElementById('v2Undo').getBoundingClientRect();[Math.round(b.width),Math.round(b.height),getComputedStyle(document.querySelector('#unU span')).display]")
    check('landscape undo bar is compact (icons only)', r[0] < 160 and r[1] <= 52 and r[2] == 'none', r)
    await pg.evaluate("__ed()")
    await pg.set_viewport_size({'width': 390, 'height': 844})
    await pg.wait_for_timeout(300)
    check('no JS errors (LED widgets)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_lefty(b):
    # Build 98: Left-handed is gone, the switch is "Live frame", the port panel has ‹ › arrows, fold, live bar, max power and trim
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('settings')")
    r = await pg.evaluate("[!!document.getElementById('sLefty'),document.querySelector('#sLframe span').textContent]")
    check('98 Left-handed removed, switch reads Live frame', r == [False, 'Live frame'], r)
    await pg.evaluate("mk6Go('hub')"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('wrHost').shadowRoot.querySelector('.slot[data-p=B]').dispatchEvent(new MouseEvent('click'))"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('#wrPanel .wr-nav[data-d=\"1\"]').click()"); await pg.wait_for_timeout(200)
    c = await pg.evaluate("document.querySelector('#wrPanel .chip').textContent")
    check('98 › steps to the next port', c.endswith('C'), c)
    await pg.evaluate("var b=document.querySelector('#wrPanel .wr-step[data-f=max] button[data-d=\"-5\"]');for(var n=0;n<8;n++) b.click()")
    mx = await pg.evaluate("JSON.parse(localStorage.getItem(Object.keys(localStorage).find(function(k){return /mk6/i.test(k)})||'{}')) && document.querySelector('#wrPanel .wr-mxv').textContent")
    check('98 max power slider sets the port', mx == '60%', mx)
    await pg.evaluate("document.querySelector('#wrPanel .wr-min').click()")
    h = await pg.evaluate("[getComputedStyle(document.querySelector('#wrPanel .wr-body')).display,document.querySelectorAll('#wrPanel .wr-lb i').length]")
    check('98 ▾ folds the panel and the live bar has 20 LEDs', h == ['none', 20], h)
    check('98 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_buggy(b):
    # Build 99: Buggy motor part, two red outputs that turn together
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'W',cfg:{layout:'board',ch:[{},{},{},{},{},{}],board:[{k:'s',c:0,w:2}],pf:['l','m']}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};onHubState('ready');mk6Go('hub')"); await pg.wait_for_timeout(600)
    await pg.evaluate("""(function(){var R=document.getElementById('wrHost').shadowRoot,g=R.querySelector('.pt[data-p=B]'),r=g.getBoundingClientRect();
      g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3,clientX:r.x+5,clientY:r.y+5}));window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3,clientX:r.x+5,clientY:r.y+5}))})()"""); await pg.wait_for_timeout(300)
    await pg.evaluate("for(var n=0;n<8;n++){var g=document.querySelector('#wrPanel .wr-grid [data-p=B]');if(g.getAttribute('data-t')==='bg')break;g.click()}"); await pg.wait_for_timeout(300)
    CRO = "(function(){var R=document.getElementById('wrHost').shadowRoot;return [R.getElementById('croB_0').getAttribute('transform'),R.getElementById('croB_1_0').getAttribute('transform')]})()"
    r = await pg.evaluate("(function(){var R=document.getElementById('wrHost').shadowRoot;return [!!R.querySelector('#ptB image[href*=\"bg.webp\"]'),!!R.getElementById('croB_0'),!!R.getElementById('croB_1_0'),JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.pf[1]]})()")
    g = await pg.evaluate("[...document.querySelectorAll('#wrPanel .wr-grid button')].map(b=>b.getAttribute('data-p')).join('')+'|'+!!document.querySelector('#wrPanel .wr-wig')")
    h0 = await pg.evaluate("for(var n=0;n<8;n++){var g=document.querySelector('#wrPanel .wr-grid [data-p=B]');if(g.getAttribute('data-t')==='')break;g.click()};[document.querySelector('#wrPanel .wr-holds').hidden,document.querySelector('#wrPanel .wr-tst').hidden]")
    check('110 Nothing on the port: Hold buttons and test slider still shown', h0 == [False, False], h0)
    await pg.evaluate("for(var n=0;n<8;n++){var g=document.querySelector('#wrPanel .wr-grid [data-p=B]');if(g.getAttribute('data-t')==='bg')break;g.click()}")
    check('109 panel shows the wiring grid A-F, no Wiggle', g == 'ABCDEF|false', g)
    check('99 Buggy motor is saved and shows with two output discs', r == [True, True, True, 'bg'], r)
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready');mk6Go('hub')"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#wrPanel .wr-f').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(700)
    t0 = await pg.evaluate(CRO); await pg.wait_for_timeout(130); t1 = await pg.evaluate(CRO)
    await pg.evaluate("document.querySelector('#wrPanel .wr-f').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}))")
    check('99 both red outputs turn when the port runs', t0[0] != t1[0] and t0[1] != t1[1], [t0, t1])
    check('99 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_bdlock(b):
    # Build 102: no empty Hub heading in Settings; 🔒 on the Board card blocks editing
    ctx, pg = await page(b)
    r = await pg.evaluate("mk6Go('settings');[...document.querySelectorAll('#scrSet .v2-grp')].map(e=>e.textContent).indexOf('Hub')")
    check('102 Settings has no Hub heading', r == -1, r)
    await pg.evaluate("mk6Go('drive')"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("var l=document.getElementById('bdLock');[l.textContent,(l.click(),l.textContent),JSON.parse(localStorage.getItem('mk6v2')).prefs.bdlock]")
    check('102 🔒 toggles and is saved', r == ['🔓', '🔒', True], r)
    r = await pg.evaluate("[getComputedStyle(document.getElementById('boardGrid')).pointerEvents,document.getElementById('dbLock').textContent]")
    check('103 locked: widgets ignore touches (page still scrolls), landscape bar 🔒 matches', r == ['none', '🔒'], r)
    r = await pg.evaluate("document.getElementById('bdEdit').click();document.getElementById('bdEdit').getAttribute('aria-pressed')")
    check('102 locked board cannot be edited', r == 'false', r)
    r = await pg.evaluate("document.getElementById('bdLock').click();document.getElementById('bdEdit').click();document.getElementById('bdEdit').getAttribute('aria-pressed')")
    check('102 unlocked board can be edited again', r == 'true', r)
    r = await pg.evaluate("document.getElementById('bdLock').click();document.getElementById('bdEdit').getAttribute('aria-pressed')")
    check('102 locking while editing ends editing', r == 'false', r)
    check('102 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_gpmap(b):
    # Build 121: every PS4 button lights its own spot on the pictures, and a mapped button does its job
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("""window.__gpB=-1;window.__gpV={};navigator.getGamepads=function(){var B=[];for(var i=0;i<17;i++){var v=window.__gpV[i]||(i===window.__gpB?1:0);B.push({pressed:v>.5,value:v})}
      return [{id:'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:B}]};mk6Go('m-pad')""")
    await pg.wait_for_timeout(300)
    bad = []
    for btn in [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15]:
        r = await pg.evaluate("window.__gpB=%d;" % btn + W % "[...document.querySelectorAll('#gpPic .gp-b.live,#gpPic2 .gp-b.live')].map(e=>+e.dataset.b)")
        if r != [btn]: bad.append((btn, r))
    check('121 each PS4 button lights only its own spot on the pictures', not bad, bad)
    r = await pg.evaluate("window.__gpB=-1;window.__gpV={6:.5,7:1};" + W % "[document.getElementById('gpL2O').textContent,document.getElementById('gpR2O').textContent,document.getElementById('gpTc7').getAttribute('fill')!=='#12151b']")
    check('121 L2 / R2 values show on the bars and R2 lights on the rear picture', r == ['−50%', '+100%', True], r)
    r = await pg.evaluate("""window.__gpV={};var p=__t.C.pad;p.map={0:'f0',1:'r0',5:'t1'};""" + W % "(window.__gpB=0,0)")
    r = await pg.evaluate(W % "__t.rt.t[0]")
    check('121 ✕ mapped to channel A forward drives it', r == 100, r)
    r = await pg.evaluate("window.__gpB=1;" + W % "__t.rt.t[0]")
    check('121 ○ mapped to channel A reverse drives it', r == -100, r)
    r = await pg.evaluate("window.__gpB=-1;" + W % "__t.rt.t[0]")
    check('121 releasing the button stops the channel', r == 0, r)
    await pg.evaluate("mk6Go('settings');mk6Go('m-pad')"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("[...document.querySelectorAll('#gpPic .chip[data-b]')].map(e=>e.dataset.b+':'+e.textContent).sort()")
    check('121 chips show the mapped jobs next to ✕ and ○', r == ['0:A ▲', '1:A ▼'], r)
    r = await pg.evaluate("window.__gpB=8;" + W % "__t.S.estop")
    check('121 Share = E-Stop', r is True, r)
    r = await pg.evaluate("window.__gpB=9;" + W % "__t.S.estop")
    check('121 Options = release', r is False, r)
    check('121 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_mk4(b):
    # MK 4.0 test bed: hub type per slot, E/F gone on a 4.0 hub, start codes, saved fields
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    r = await pg.evaluate("""(()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'))};
      s('hub1','1');s('hubT1','4');s('hub1','0');return [__t.C.hubs.slice(),__t.C.hubT.slice()]})()""")
    check('MK4 a 6.0 M1 and a 4.0 M1 can be used together', r == [[0, 0, -1], [6, 4, 6]], r)
    r = await pg.evaluate("[...document.getElementById('gpTrig').options].map(o=>+o.value).filter(v=>v>=6)")
    check('MK4 ports E and F of a 4.0 hub are not offered', r == [6, 7, 8, 9], r)
    await pg.evaluate("document.getElementById('hubConn').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start:'))")
    check('MK4 connect sends 10+module for a 4.0 hub', r[-1:] == ['start:0,10'], r)
    await pg.evaluate("onHubState('ready');mk6Go('home')"); await pg.wait_for_timeout(700)
    await pg.evaluate("[...document.querySelectorAll('#scrHome button')].find(b=>/Hub 2/.test(b.textContent)).click()"); await pg.wait_for_timeout(600)
    r = await pg.evaluate("(()=>{const sv=document.getElementById('wrHost').shadowRoot.querySelector('svg');return [sv.classList.contains('mk4'),[...document.querySelectorAll('#scrHome button')].some(b=>/Hub 2 · M1 · 4[.]0/.test(b.textContent))]})()")
    check('MK4 wiring picture of a 4.0 hub greys out E/F and its tab says 4.0', r == [True, True], r)
    r = await pg.evaluate("""[__t.cleanBoard([{k:'b',c:0,lock:true}])[0].bt,__t.cleanBoard([{k:'b',c:0,bt:'a',ar:2,af:0}])[0],__t.cleanBoard([{k:'s',c:0,tm:1,tr:80,tp:0}])[0],__t.cleanBoard([{k:'b',c:0,bt:'x'}])[0].bt||'']""")
    check('MK4 saved fields: old lock = toggle, accelerator and train settings kept, junk dropped',
          r[0] == 't' and r[1].get('bt') == 'a' and r[1].get('ar') == 2 and r[1].get('af') == 0 and r[2].get('tm') == 1 and r[2].get('tr') == 80 and r[2].get('tp') == 0 and r[3] == '', r)
    check('MK4 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_mk4oo(b):
    # Older MK 4.0 on/off boxes as a hub type (40), mixed with a 4.0 speed hub on the same module number
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    r = await pg.evaluate("""(()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'))};
      s('hubT0','40');s('hub1','1');s('hubT1','40');s('hub2','0');s('hubT2','4');return [__t.C.hubs.slice(),__t.C.hubT.slice()]})()""")
    check('MK4OO two on/off boxes and a 4.0 speed hub M1 can be used together', r == [[0, 1, 0], [40, 40, 4]], r)
    r = await pg.evaluate("[...document.getElementById('hubT0').options].map(o=>o.value)")
    check('MK4OO hub type list offers MK 4.0 on/off', r == ['6', '4', '40', '14', '16'], r)
    await pg.evaluate("document.getElementById('hubConn').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start:'))")
    check('MK4OO connect sends 20+module for an on/off box', r[-1:] == ['start:20,21,10'], r)
    await pg.evaluate("onHubState('ready');mk6Go('home')"); await pg.wait_for_timeout(700)
    r = await pg.evaluate("[...document.querySelectorAll('#scrHome button')].some(b=>/Hub 1 · M1 · 4[.]0 on\\/off/.test(b.textContent))")
    check('MK4OO hub tab says 4.0 on/off', r, r)
    r = await pg.evaluate("[...document.getElementById('gpTrig').options].map(o=>+o.value).filter(v=>v>=4&&v<6)")
    check('MK4OO ports E and F of an on/off box are not offered', r == [], r)
    check('MK4OO no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_lpmulti(b):
    # Light programs on several panels (one per hub) play at the same time; header/footer hide on scroll
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("""(()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'))};
      s('hubT0','40');s('hub1','1');s('hubT1','40');s('hub2','0');s('hubT2','4')})()""")
    await pg.evaluate("window.MK6Bridge.send=function(f){(window.__all=window.__all||[]).push(f)};document.getElementById('hubConn').click();onHubState('ready')")
    await pg.evaluate("(it)=>{__t.C.ch.forEach(function(c,i){if(i%6<4) c.kind='light'});__t.C.layout='board';__t.C.board=__t.cleanBoard(it);__t.syncBoard();mk6Go('drive')}",
                      [{'k': 'lx', 't': 'lp', 'c': s * 6, 'cs': [s * 6 + 1, s * 6 + 2, s * 6 + 3], 'pr': 3} for s in range(3)])
    await pg.wait_for_timeout(400)
    n = await pg.evaluate("document.querySelectorAll('#boardGrid .lx-pg').length")
    check('LP three light panels with a program', n == 3, n)
    for i in range(3):
        await pg.evaluate("(i)=>document.querySelectorAll('#boardGrid .lx-pg')[i].click()", i)
        await pg.wait_for_timeout(150)
    await pg.evaluate("window.__all=[]")
    await pg.wait_for_timeout(1200)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .lx-pg')].map(b=>b.getAttribute('aria-pressed'))")
    check('LP all three programs keep running together', r == ['true', 'true', 'true'], r)
    r = await pg.evaluate("[0,1,2].map(h=>window.__all.some(f=>String(f).split(',').map(Number).slice(h*6,h*6+4).some(v=>v>0)))")
    check('LP every hub gets light output while the others play', r == [True, True, True], r)
    await pg.evaluate("document.querySelectorAll('#boardGrid .lx-pg')[1].click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .lx-pg')].map(b=>b.getAttribute('aria-pressed'))")
    check('LP stopping one panel leaves the others running', r == ['true', 'false', 'true'], r)
    await pg.evaluate("document.getElementById('estop').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .lx-pg')].map(b=>b.getAttribute('aria-pressed'))")
    check('LP E-Stop stops every program', r == ['false', 'false', 'false'], r)
    await pg.set_viewport_size({'width': 844, 'height': 390}); await pg.wait_for_timeout(500)
    r = await pg.evaluate("(()=>{const b=document.getElementById('esBanner'),r=b.getBoundingClientRect();return [document.documentElement.classList.contains('dash'),getComputedStyle(b).display,r.top>=0&&r.bottom<=innerHeight&&r.height>20]})()")
    check('landscape dashboard shows the red E-Stop banner', r == [True, 'block', True], r)
    await pg.evaluate("document.getElementById('esBanner').click()")
    await pg.set_viewport_size({'width': 390, 'height': 844}); await pg.wait_for_timeout(400)
    await pg.evaluate("document.getElementById('estop').click()")
    # E-Stop is the Volume Up key: the button is gone, a second press does not release, the red banner does
    r = await pg.evaluate("[getComputedStyle(document.getElementById('estop')).display,(window.mk6VolUp(),__t.S.estop),(window.mk6VolUp(),__t.S.estop),!document.getElementById('esBanner').hidden]")
    check('Volume Up: no on-screen E-Stop button, a press stops, a second press keeps it on, banner shows', r == ['none', True, True, True], r)
    r = await pg.evaluate("document.getElementById('esBanner').click();[__t.S.estop,document.getElementById('esBanner').hidden]")
    check('tapping the red banner releases E-Stop', r == [False, True], r)
    # header / footer hide while scrolling (portrait)
    await pg.evaluate("mk6Go('settings')"); await pg.wait_for_timeout(400)
    await pg.mouse.move(200, 400); await pg.mouse.wheel(0, 600); await pg.wait_for_timeout(400)
    r = await pg.evaluate("""(()=>{const c=document.documentElement.classList,e=document.getElementById('estop').getBoundingClientRect();return [c.contains('v2-hidehd'),c.contains('v2-hideft'),e.top>=0&&e.bottom<=innerHeight]})()""")
    check('scrolling down the page hides the header and keeps the footer', r[:2] == [True, False], r)
    await pg.mouse.wheel(0, -200); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.documentElement.classList.contains('v2-hidehd'),document.documentElement.classList.contains('v2-hideft')]")
    check('scrolling back up hides the footer and brings the header back', r == [False, True], r)
    await pg.evaluate("scrollTo(0,0)"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.documentElement.classList.contains('v2-hidehd'),document.documentElement.classList.contains('v2-hideft')]")
    check('at the top both header and footer show', r == [False, False], r)
    check('LP no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_fix5(b):
    # L3 / R3 from Android, restore result shown on any page, restore of more than 10 models
    ctx, pg = await page(b)
    r = await pg.evaluate("[!!document.getElementById('m4r'),!!document.getElementById('oor')]")
    check('no reverse code test pickers in the main app', r == [False, False], r)
    # L3 sent by Android counts as button 10 for the mapping
    await pg.evaluate("""(()=>{window.__gp={connected:true,id:'pad',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
      navigator.getGamepads=()=>[window.__gp]})()""")
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(200)
    await pg.goto(HTML + '?mk6test'); await pg.wait_for_function('window.mk6Ready===true')
    await pg.evaluate("""(()=>{window.__gp={connected:true,id:'pad',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
      navigator.getGamepads=()=>[window.__gp];__t.C.pad.on=true;__t.C.pad.map={10:'f0'};document.getElementById('hubConn').click();onHubState('ready')})()""")
    await pg.wait_for_timeout(200)
    await pg.evaluate("window.mk6PadKey(10,true)"); await pg.wait_for_timeout(300)
    r1 = await pg.evaluate("__t.rt.t[0]")
    await pg.evaluate("window.mk6PadKey(10,false)"); await pg.wait_for_timeout(300)
    r2 = await pg.evaluate("__t.rt.t[0]")
    check('L3 sent by Android drives the channel mapped to L3, and lets go', r1 == 100 and r2 == 0, [r1, r2])
    # import: result shows as a message, more than 10 models come back
    profs = [{'name': 'R%d' % i, 'cfg': {}} for i in range(14)]
    import json as _j
    await pg.evaluate("mk6Go('models')")
    await pg.evaluate("(t)=>window.onImportText(t)", _j.dumps({'app': 'MK6 Console', 'version': 1, 'profiles': profs}))
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.getElementById('toast').textContent,document.getElementById('toast').classList.contains('show')||getComputedStyle(document.getElementById('toast')).opacity!=='0']")
    check('restore result shows as a message on the Models page', 'Imported 14 models' in r[0], r)
    await pg.evaluate("(t)=>window.onImportText(t)", 'not json')
    r = await pg.evaluate("document.getElementById('toast').textContent")
    check('a bad restore file says so on any page', 'not valid' in r, r)
    # a motor drawn on a port that was left a light channel: fixed when loaded, so reverse reaches the hub
    ch = [{'name': 'M%d' % i, 'kind': 'light'} for i in range(18)]
    pf = ['l', 'l', 'lt'] + [''] * 15
    await pg.evaluate("(t)=>window.onImportText(t)", _j.dumps({'app': 'MK6 Console', 'version': 1, 'profiles': [{'name': 'LightMotor', 'cfg': {'ch': ch, 'pf': pf}}]}))
    await pg.evaluate("(()=>{const p=__t.store.profiles.find(x=>x.name==='LightMotor');__t.switchProfile(p.id)})()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[0,1,2].map(i=>__t.C.ch[i].kind)")
    check('ports drawn with a motor are motor channels after loading, LED lights stay lights', r == ['slider', 'slider', 'light'], r)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=String(f)};__t.rt.t[0]=-60")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("+String(window.__last||'0').split(',')[0]")
    check('reverse on such a port reaches the hub', r < 0, r)
    await pg.evaluate("""(()=>{window.__gp.buttons[10]={pressed:true,value:1};window.__gp.axes=[0,0,0.5,-1];navigator.getGamepads=()=>[window.__gp];__t.C.pad.on=true;mk6Go('m-pad')})()""")
    await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('gpRawBox').open=true")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("document.getElementById('gpRaw').textContent")
    check('Gamepad raw input shows pressed buttons and axes', 'buttons pressed: 10' in r and '3=-1.00' in r, r)
    # PS4 on Android: the touchpad is listed first as its own gamepad; the controller itself must be used
    await pg.evaluate("""(()=>{const mk=(id)=>({connected:true,id:id,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
      const tp=mk('Wireless Controller Touchpad (STANDARD GAMEPAD Vendor: 054c)'),pad=mk('Wireless Controller (STANDARD GAMEPAD Vendor: 054c)');
      tp.axes=[0.75,0.74,0,0];pad.buttons[11]={pressed:true,value:1};window.__pads=[tp,pad];navigator.getGamepads=()=>window.__pads;
      __t.rt.t[0]=0;__t.C.pad.on=true;__t.C.pad.map={11:'f1'};mk6Go('m-pad')})()""")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[__t.rt.t[1],__t.rt.t[0],document.getElementById('gpRaw').textContent]")
    check('PS4: R3 on the controller drives its mapping, the touchpad does not move the sticks', r[0] == 100 and r[1] == 0, r)
    check('PS4: raw input lists both and marks the controller in use', '\u25b6 Wireless Controller (STANDARD' in r[2] and 'Touchpad' in r[2], r[2])
    # Right stick straight to channels, with no second board joystick
    await pg.evaluate("""(()=>{const pad={connected:true,id:'Wireless Controller',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
      window.__rp=pad;navigator.getGamepads=()=>[pad];__t.C.pad.on=true;__t.C.pad.map={};for(let i=0;i<6;i++) __t.rt.t[i]=0;__t.C.pad.rs={a:-1,b:-1,mx:false};mk6Go('drive')})()""")
    await pg.evaluate("window.__rp.axes=[0,0,0.9,-0.9]"); await pg.wait_for_timeout(300)
    r0 = await pg.evaluate("[__t.rt.t[2],__t.rt.t[3]]")
    await pg.evaluate("window.__rp.axes=[0,0,0,0];mk6Go('m-pad')"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('gpRsBox').open=true")
    opts = await pg.evaluate("[...document.getElementById('gpRsA').options].map(o=>o.value).slice(0,3)")
    await pg.evaluate("""(()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'))};s('gpRsA','2');s('gpRsB','3')})()""")
    await pg.evaluate("mk6Go('drive');window.__rp.axes=[0,0,0.9,-0.9]"); await pg.wait_for_timeout(300)
    r1 = await pg.evaluate("[__t.rt.t[2],__t.rt.t[3]]")
    await pg.evaluate("window.__rp.axes=[0,0,0,0]"); await pg.wait_for_timeout(300)
    r2 = await pg.evaluate("[__t.rt.t[2],__t.rt.t[3]]")
    check('right stick does nothing until channels are chosen (as before)', r0 == [0, 0], r0)
    check('right stick channel lists offer None and the channels', opts[0] == '-1' and len(opts) == 3, opts)
    check('right stick drives the chosen channels without a board joystick', r1[0] > 80 and r1[1] > 80, r1)
    check('right stick let go puts them back to 0', r2 == [0, 0], r2)
    await pg.evaluate("""(()=>{const e=document.getElementById('gpRsMx');mk6Go('m-pad');e.value='1';e.dispatchEvent(new Event('change'));mk6Go('drive');window.__rp.axes=[0,0,0.9,0]})()"""); await pg.wait_for_timeout(300)
    r3 = await pg.evaluate("[__t.rt.t[2],__t.rt.t[3]]")
    await pg.evaluate("window.__rp.axes=[0,0,0,0]")
    check('mixed: right stick to the side turns the two tracks opposite ways', r3[0] > 80 and r3[1] < -80, r3)
    # Left stick straight to channels too: both sticks at once, full control
    await pg.evaluate("""(()=>{mk6Go('m-pad');document.getElementById('gpLsBox').open=true;const s=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'))};
      s('gpLsA','0');s('gpLsB','1');s('gpRsMx','0');mk6Go('drive');window.__rp.axes=[0.9,-0.9,-0.9,0.9]})()""")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[0,1,2,3].map(i=>__t.rt.t[i])")
    await pg.evaluate("window.__rp.axes=[0,0,0,0]"); await pg.wait_for_timeout(300)
    r2 = await pg.evaluate("[0,1,2,3].map(i=>__t.rt.t[i])")
    check('left and right sticks drive their four channels at the same time', r[0] > 80 and r[1] > 80 and r[2] < -80 and r[3] < -80, r)
    check('both sticks let go put all four back to 0', r2 == [0, 0, 0, 0], r2)
    # each stick says what it drives, on its card and on the controller picture
    await pg.evaluate("__t.C.pad.ls={a:0,b:1,mx:false};__t.C.pad.rs={a:2,b:3,mx:true};mk6Go('m-pad')"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("[document.getElementById('gpLM').textContent,document.getElementById('gpRM').textContent,document.getElementById('gpPic').textContent]")
    check('stick cards name the channels each stick drives', r[0].startswith('\u2195 ') and '\u2194' in r[0] and 'TANK' in r[1], r[:2])
    check('controller picture shows what each stick drives', 'L \u2195' in r[2] and 'R ' in r[2] and 'TANK' in r[2], r[2][-80:])
    await pg.evaluate("__t.C.pad.rs={a:-1,b:-1,mx:false};mk6Go('settings');mk6Go('m-pad')"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("document.getElementById('gpRM').textContent")
    check('a stick that drives nothing says so', r == 'Not used', r)
    check('fix5 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_btypes(b):
    # Button types on the Board Turbo button, Train slider, and gamepad button types
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    async def board(items):
        await pg.evaluate("(it)=>{__t.C.layout='board';__t.C.board=__t.cleanBoard(it);__t.syncBoard();mk6Go('drive')}", items)
        await pg.wait_for_timeout(250)
    async def tap(i=0, up=True):
        await pg.evaluate("(a)=>{const b=document.querySelectorAll('#boardGrid .qbtn.turbo')[a[0]];b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7}));if(a[1]) b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7}))}", [i, up])
        await pg.wait_for_timeout(80)
    rt0 = "__t.rt.t[0]"
    await board([{'k': 'b', 'c': 0, 'bt': 'p'}])
    seq = []
    for _ in range(4):
        await tap(); seq.append(await pg.evaluate(rt0))
    check('BT PingPong goes forward, stop, reverse, stop', seq == [100, 0, -100, 0], seq)
    await board([{'k': 'b', 'c': 0, 'bt': 't', 'p': 80}])
    await tap(); a1 = await pg.evaluate(rt0); await tap(); a2 = await pg.evaluate(rt0)
    check('BT Toggle stays on after letting go, next press turns it off', [a1, a2] == [80, 0], [a1, a2])
    await board([{'k': 'b', 'c': 0, 'bt': 'a'}])
    await tap(0, False); await pg.wait_for_timeout(450); mid = await pg.evaluate(rt0)
    await pg.wait_for_timeout(800); top = await pg.evaluate(rt0)
    await pg.evaluate("document.querySelector('#boardGrid .qbtn.turbo').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7}))")
    await pg.wait_for_timeout(1300); end = await pg.evaluate(rt0)
    check('BT Accelerator ramps up while held and back to 0 after', 25 <= mid <= 75 and top == 100 and end == 0, [mid, top, end])
    await board([{'k': 'b', 'c': 0, 'bt': 'a', 'af': 0}])
    await tap(0, False); await pg.wait_for_timeout(1200)
    await pg.evaluate("document.querySelector('#boardGrid .qbtn.turbo').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7}))")
    await pg.wait_for_timeout(600); keep = await pg.evaluate(rt0)
    await pg.evaluate("document.getElementById('estop').click()"); await pg.wait_for_timeout(150); es = await pg.evaluate(rt0)
    check('BT Accelerator "Keep power" holds the power, E-Stop still stops it', keep == 100 and es == 0, [keep, es])
    await pg.evaluate("document.getElementById('estop').click()"); await pg.wait_for_timeout(150)
    r = await pg.evaluate("(()=>{const s=__t.WSPEC.b.f.map(f=>f.k);return s})()")
    check('BT Button settings offer the type and accelerator timings', r[:4] == ['p', 'bt', 'ar', 'af'], r)
    # Train slider
    await board([{'k': 's', 'c': 0, 'tm': 1, 'v': True}])
    await pg.evaluate("""(()=>{const r=document.querySelector('#boardGrid input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value='100';r.dispatchEvent(new Event('input',{bubbles:true}))})()""")
    await pg.wait_for_timeout(1000); held = await pg.evaluate(rt0)
    await pg.evaluate("""(()=>{const r=document.querySelector('#boardGrid input[type=range]');r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))})()""")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[__t.rt.t[0],+document.querySelector('#boardGrid input[type=range]').value,!!document.querySelector('#boardGrid .bt-chip.trn'),document.querySelector('#boardGrid .trmk').classList.contains('on')]")
    check('TR Train: full push raises the speed about 40%/s, the speed stays and the lever returns to centre', 25 <= held <= 50 and r[0] == held and r[1] == 0 and r[2] and r[3], [held] + r)
    await pg.evaluate("""(()=>{const r=document.querySelector('#boardGrid input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))})()""")
    await pg.wait_for_timeout(150)
    check('TR Train: double tap goes to 0', await pg.evaluate(rt0) == 0, await pg.evaluate(rt0))
    # gamepad types
    await pg.evaluate("""window.__gpB=-1;navigator.getGamepads=function(){var B=[];for(var i=0;i<17;i++)B.push({pressed:i===window.__gpB,value:i===window.__gpB?1:0});return [{id:'Wireless Controller',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:B}]};
      __t.C.pad.on=true;__t.C.pad.map={0:'f0',1:'f1'};__t.C.pad.mt={0:'t',1:'a'};__t.C.layout='std'""")
    W2 = "new Promise(r=>setTimeout(()=>r(%s),160))"
    a = await pg.evaluate("window.__gpB=0;" + W2 % "__t.rt.t[0]")
    b2 = await pg.evaluate("window.__gpB=-1;" + W2 % "__t.rt.t[0]")
    c = await pg.evaluate("window.__gpB=0;" + W2 % "__t.rt.t[0]")
    await pg.evaluate("window.__gpB=-1"); await pg.wait_for_timeout(160)
    check('GPT gamepad Toggle: press on, stays on, press again off', [a, b2, c] == [100, 100, 0], [a, b2, c])
    await pg.evaluate("window.__gpB=1"); await pg.wait_for_timeout(500); m1 = await pg.evaluate("__t.rt.t[1]")
    await pg.evaluate("window.__gpB=-1"); await pg.wait_for_timeout(1300); m2 = await pg.evaluate("__t.rt.t[1]")
    check('GPT gamepad Accelerator ramps up while held and down after', 25 <= m1 <= 75 and m2 == 0, [m1, m2])
    check('BT no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_mute(b):
    # Levels (EQ) mutes: shown on the dial, never carried to a board or model that cannot show them
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready')")
    await pg.evaluate("(()=>{__t.C.layout='board';__t.C.board=__t.cleanBoard([{k:'lx',t:'eq',c:0,cs:[1]},{k:'f',c:1},{k:'b',c:1}]);__t.syncBoard();mk6Go('drive')})()")
    await pg.wait_for_timeout(300)
    await pg.evaluate("__t.MUTE[1]=1;__t.rt.t[1]=100"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[__t.rt.o[1],[...document.querySelectorAll('#boardGrid .bdw')].some(e=>/muted/.test(e.textContent))]")
    check('MUTE a muted channel sends 0 and its dial says "muted"', r == [0, True], r)
    await pg.evaluate("(()=>{__t.C.board=__t.cleanBoard([{k:'f',c:1},{k:'b',c:1}]);__t.syncBoard()})()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[!!__t.MUTE[1],Math.round(__t.rt.o[1])]")
    check('MUTE removing the Levels widget unmutes its channels', r == [False, 100], r)
    await pg.evaluate("(()=>{__t.C.board=__t.cleanBoard([{k:'lx',t:'eq',c:0,cs:[1]},{k:'f',c:1}]);__t.syncBoard();__t.MUTE[1]=1;var p=__t.store.profiles[0];__t.store.profiles.push({id:'zz',name:'Other',cfg:JSON.parse(JSON.stringify(p.cfg))});__t.switchProfile('zz')})()")
    await pg.wait_for_timeout(300)
    check('MUTE switching models clears mutes', await pg.evaluate("Object.keys(__t.MUTE).length") == 0, await pg.evaluate("Object.keys(__t.MUTE)"))
    check('MUTE no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_hubrows(b):
    # Build 106: hub picture with Bluetooth rings when no hub; one row per hub when connected
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('home')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#hubEmpty .v2-hubpic i').length,!!document.querySelector('#hubEmpty .v2-hubpic img'),!!document.querySelector('#hubEmpty .qi')]")
    check('106 no hub: hub picture with 3 Bluetooth rings, no ?', r == [3, True, False], r)
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready')"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[...document.querySelectorAll('#hubList .v2-hrow')].map(e=>[e.querySelector('em').textContent,e.querySelectorAll('.v2-leds i').length])")
    check('106 connected: a row per hub with its LEDs', len(r) >= 1 and r[0] == ['M1', 14], r)
    check('106 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_trimrest(b):
    # Build 111: trim at rest only for a servo or an unset port; a motor or LED port sends 0 when idle
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'T',cfg:{layout:'board',ch:[{trim:9},{trim:9},{trim:3},{trim:4},{},{}],board:[{k:'s',c:0,w:2}],pf:['lt','l','','sv']}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hubConn').click();onHubState('ready')"); await pg.wait_for_timeout(600)
    r = await pg.evaluate("(window.__last||'').split(',').slice(0,4)")
    check('111 at rest: LED port 0, motor port 0, unset port keeps trim, servo keeps trim', r == ['0', '0', '3', '4'], r)
    check('111 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_wiremap(b):
    # Build 112: every part and plug opens its own port, and Hold drives that port's slot in the frame (two hubs, parts packed close)
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'W',cfg:{layout:'board',hubs:[0,1,-1],ch:[{name:'a'},{name:'b'},{name:'c'},{name:'d'},{name:'e'},{name:'f'},{},{},{},{},{},{}],board:[{k:'s',c:0,w:2}],
      pf:['bg','sv','l','sv','l','lt','m','xl','sv','l','bg','lt'],pfp:{1:[700,330],2:[560,300],3:[860,1200],4:[300,330]}}}],prefs:{seen:true,wn:99,tour:true,wrlock:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hubConn').click();onHubState('ready');mk6Go('home')"); await pg.wait_for_timeout(700)
    await pg.evaluate("mk6Go('home')"); await pg.wait_for_timeout(700)
    bad = []
    hosts = await pg.evaluate("[...document.querySelectorAll('#wrCard [id^=wrHost], #wrCard .wr-host')].length")
    for hub in [0, 1]:
     if hub == 1:
        await pg.evaluate("document.querySelectorAll('#wrTabs button')[1].click()"); await pg.wait_for_timeout(500)
        await pg.evaluate("mk6Go('home')"); await pg.wait_for_timeout(500)
     for kind in ['pt', 'sock']:
        for L in 'ABCDEF':
            await pg.evaluate("var x=document.querySelector('#wrPanel .wr-x');if(x&&!document.getElementById('wrPanel').hidden) x.click()"); await pg.wait_for_timeout(150)
            r = await pg.evaluate("""(function(kind,L){var R=document.getElementById('wrHost').shadowRoot,g=R.querySelector('.'+kind+'[data-p='+L+']');if(!g) return 'none';
              g.scrollIntoView({block:'center'});var hit=kind==='pt'?g.querySelector('.hit'):g,bb=hit.getBBox(),M=hit.getScreenCTM(),pt=R.host.ownerSVGElement;
              var svg=R.querySelector('svg'),p=svg.createSVGPoint(),best=null;
              for(var fy=.3;fy<=.7&&!best;fy+=.1) for(var fx=.3;fx<=.7&&!best;fx+=.1){p.x=bb.x+bb.width*fx;p.y=bb.y+bb.height*fy;if(hit.isPointInFill&&!hit.isPointInFill(p)) continue;var s=p.matrixTransform(M);var e=R.elementFromPoint(s.x,s.y),q=e&&e.closest('[data-p]');if(q&&q.getAttribute('data-p')===L) best=[s.x,s.y]}
              if(!best) return 'covered';
              var e=R.elementFromPoint(best[0],best[1]);e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,clientX:best[0],clientY:best[1]}));window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,clientX:best[0],clientY:best[1]}));
              return document.querySelector('#wrPanel .chip').textContent})""" .replace('\n',' ') + "('" + kind + "','" + L + "')")
            if r != 'M%d' % (hub + 1) + L:
                bad.append(str(hub) + kind + L + '->' + str(r))
            await pg.evaluate("var b=document.querySelector('#wrPanel .wr-f');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(450)
            fr = await pg.evaluate("(window.__last||'').split(',').map(Number)")
            await pg.evaluate("var b=document.querySelector('#wrPanel .wr-f');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(450)
            idx = hub * 6 + 'ABCDEF'.index(L)
            if not (len(fr) >= 12 and fr[idx] != 0 and all(v == 0 for j, v in enumerate(fr) if j != idx)):
                bad.append(str(hub) + 'hold' + kind + L + '->' + str(fr))
    check('112 every part and plug of hub 1 and hub 2 opens its own port and Hold drives only that port', not bad, bad)
    check('112 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_outmap(b):
    # Build 113: output pipeline end to end: every channel of two hubs lands in its own frame slot; reverse, Max power, mode limit and E-Stop
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){var ch=[];for(var n=0;n<12;n++) ch.push({name:'c'+n});localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'O',cfg:{layout:'board',hubs:[0,1,-1],ramp:0,limit:100,ch:ch,board:[{k:'s',c:0,w:2}],pf:['m','m','m','m','m','m','l','l','l','l','l','l']}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hubConn').click();onHubState('ready')"); await pg.wait_for_timeout(500)
    FR = "new Promise(r=>setTimeout(()=>r((window.__last||'').split(',').map(Number)),350))"
    bad = []
    for i in range(12):
        fr = await pg.evaluate("__t.rt.t.fill(0);__t.rt.t[%d]=100;%s" % (i, FR))
        if not (len(fr) == 12 and fr[i] == 100 and all(v == 0 for j, v in enumerate(fr) if j != i)):
            bad.append((i, fr))
    check('113 every channel of 2 hubs reaches only its own frame slot at 100', not bad, bad)
    fr = await pg.evaluate("__t.rt.t.fill(0);__t.C.ch[7].inv=true;__t.rt.t[7]=100;" + FR)
    check('113 reverse flips the sign of only that port', fr[7] == -100 and sum(abs(v) for j, v in enumerate(fr) if j != 7) == 0, fr)
    fr = await pg.evaluate("__t.C.ch[7].inv=false;__t.C.ch[7].max=50;" + FR)
    check('113 Max power caps the port', fr[7] == 50, fr)
    fr = await pg.evaluate("__t.C.ch[7].max=100;__t.C.limit=60;" + FR)
    check('113 drive mode limit scales the port', fr[7] == 60, fr)
    await pg.evaluate("__t.C.limit=100;document.getElementById('estop').click()")
    fr = await pg.evaluate(FR)
    check('113 E-Stop sends 0 on every port', len(fr) == 12 and all(v == 0 for v in fr), fr)
    check('113 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_inview(b):
    # Build 114: a part saved outside the picture comes back inside and can be grabbed; dragging cannot push it out
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'V',cfg:{layout:'board',ch:[{},{},{},{},{},{}],board:[{k:'s',c:0,w:2}],pf:['bg','l'],pfp:{0:[700,-220],1:[1500,1700]}}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("mk6Go('home')"); await pg.wait_for_timeout(600)
    r = await pg.evaluate("""(function(){var R=document.getElementById('wrHost').shadowRoot,svg=R.querySelector('svg'),vb=[0,0,1360,1560],out=[];
      ['A','B'].forEach(function(k){var b=R.querySelector('#pt'+k+' .hit').getBBox(),m=R.querySelector('#pt'+k).transform.baseVal.consolidate().matrix;
        var x0=m.e+b.x*m.a,y0=m.f+b.y*m.d,x1=x0+b.width*m.a,y1=y0+b.height*m.d;out.push(x0>=0&&y0>=0&&x1<=1360&&y1<=1560)});return out})()""")
    check('114 parts saved outside the picture are drawn fully inside it', r == [True, True], r)
    check('114 no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_seven(b):
    ctx, pg = await page(b)
    SL = "document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]')"
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    await pg.evaluate("mk6Go('drive');__ed()")
    await pg.wait_for_timeout(400)
    n0 = await pg.evaluate("document.querySelectorAll('#boardGrid .bdw').length")
    await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=l] .bdw-ed button')].find(b=>/Remove|Delete/.test(b.getAttribute('aria-label')||'')).click()")
    await pg.wait_for_timeout(600)
    await pg.evaluate("document.getElementById('unU').click()")
    await pg.wait_for_timeout(300)
    n2 = await pg.evaluate("[document.querySelectorAll('#boardGrid .bdw').length,!document.getElementById('v2Undo').hidden,document.getElementById('unR').disabled]")
    check('9 undo brings a removed widget back (redo then available)', n2 == [n0, True, False], [n0, n2])
    await pg.evaluate("__ed()")
    # 8 icon shows on the gallery card and the model chip
    await pg.evaluate("mk6Go('medit');document.querySelector('#mIcons [data-ic=crane]').click();mk6Go('models')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[!!document.querySelector('#mList .v2-mbadge'),document.querySelector('.v2-mchip .v2-knob').classList.contains('has-av')]")
    check('8 model icon on the gallery card and the model chip', r == [True, True], r)
    check('no JS errors (seven)', not pg.errors, pg.errors[:3])
    await ctx.close()
    # 7 simulator in practice mode
    ctx, pg = await page(b)
    await pg.evaluate("mk6Go('settings');document.getElementById('sPrac').click();mk6Go('home');document.getElementById('hubConn').click();mk6Go('drive')")
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
        r = await pg.evaluate("(function(){var p=document.getElementById('v2Pill').getBoundingClientRect(),e0=document.getElementById('estop').getBoundingClientRect(),e=e0.width?e0:{left:innerWidth},xs=[...document.querySelectorAll('#dashBar > *')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.getBoundingClientRect());return [Math.round(p.right),Math.round(Math.min(...xs.map(x=>x.left))),Math.round(Math.max(...xs.map(x=>x.right))),Math.round(e.left)]})()")
        check(f'open bar at {vw}px does not cover the hub pill or run off the screen', r[1] >= r[0] and r[2] <= r[3], r)
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
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready')")
    await pg.wait_for_timeout(400)
    await pg.reload()
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start')).length")
    check('4 app opened after a session with the hub on: it reconnects', r >= 1, r)
    await pg.evaluate("document.getElementById('hubConn').click()")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    await pg.evaluate("__ed();[...document.querySelectorAll('#boardGrid .bdw[data-k=lx]')].pop().querySelector('.bdw-ed button[aria-label=\"Widget settings\"]').click()")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    await pg.evaluate("__ed()")
    for k, n in (('xy', 3), ('xf', 3), ('ro', 2)):
        r = await pg.evaluate("(function(){document.querySelector('#boardGrid .bdw[data-k=%s] .bdw-ed button[aria-label=\"Widget settings\"]').click();var n=document.querySelectorAll('#gEdit .gbox > *').length;var c=[...document.querySelectorAll('#gEdit .gact button')].find(b=>b.textContent==='Cancel');c&&c.click();var g=document.getElementById('gEdit');g&&g.remove();return n})()" % k)
        check('%s settings dialog opens' % k, r >= n + 1, r)
    r = await pg.evaluate("(function(){var out=[];['bdTXY','bdTXF','bdTRO'].forEach(function(id){document.getElementById(id).click();document.getElementById('bdAdd').click()});return JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board.map(x=>x.k).join(',')})()")
    check('XY pad, crossfader and rotor can be added from the gallery', r.endswith('xy,xf,ro'), r)
    check('new widgets: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_axle(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'X',cfg:{layout:'board',limit:100,ramp:100,
      ch:[{},{},{},{},{},{}],board:[{k:'ax',c:0,w:1},{k:'s',c:0,w:1},{k:'ax',c:9,w:1}]}}],prefs:{seen:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[[...document.querySelectorAll('#boardGrid .bdw')].map(w=>w.dataset.k).join(','),JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board.map(x=>x.k).join(',')]")
    check('Motor axle: shows on the board and is kept when saved', r[0].startswith('ax,s') and r[1].startswith('ax,s'), r)
    q = "#boardGrid .bdw[data-k=ax] svg"
    await pg.evaluate("var r=document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value='80';r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(1500)
    a1 = await pg.evaluate("document.querySelector('%s path[transform]').getAttribute('transform')" % q)
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("""(function(){var s=document.querySelector('%s');var lit=[...s.querySelectorAll('rect[rx="3"]')].filter(x=>/^#/.test(x.getAttribute('fill'))).length;
      return [s.querySelector('path[transform]').getAttribute('transform'),lit,document.querySelector('#boardGrid .bdw[data-k=ax] .bdw-h output').textContent]})()""" % q)
    check('Motor axle: orange axle turns and the LED bar follows the power', a1 != r[0] and int(r[2]) > 50 and r[1] == round(int(r[2]) / 5), [a1, r])
    await pg.evaluate("var r=document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]');r.value='-100';r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("""[...document.querySelector('%s').querySelectorAll('rect[rx="3"]')].map(x=>/^#/.test(x.getAttribute('fill'))?1:0).join('')""" % q)
    check('Motor axle: in reverse the LED display fills from the right', r.endswith('1') and r.startswith('0') and '10' not in r, r)
    await pg.evaluate("__ed()")
    r = await pg.evaluate("(function(){document.getElementById('bdTAX').click();document.getElementById('bdAdd').click();return JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.board.map(x=>x.k).join(',')})()")
    check('Motor axle can be added from the gallery', r.endswith(',ax'), r)
    check('Motor axle: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_wire12(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 2400})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'W',cfg:{layout:'board',hubs:[0,1,-1],
      ch:[{name:'Left wheel'},{name:'Right wheel'},{name:'Lights'},{name:'Steer'},{name:'Arm'},{name:'Winch'},{},{},{},{},{},{}],
      board:[{k:'s',c:1,w:1},{k:'j',c:0,d:1,m:'tank',w:1}],s1:{mode:'tank',a:0,b:1},seq:[{id:'q1',name:'Q',steps:[{ch:0,pwr:50,dur:1}]}],
      pf:['l','l','lt','sv','xl','m','xl','','','','',''],pfp:{"1":[300,300]}}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};onHubState('ready')"); await pg.wait_for_timeout(700)
    await pg.evaluate("mk6Go('hub')"); await pg.wait_for_timeout(700)
    cfg = "JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg"
    r = await pg.evaluate("[...document.getElementById('wrHost').shadowRoot.querySelectorAll('.lbn')].map(t=>t.textContent).join(',')")
    check('wiring labels: each part shows its channel name', 'Right wheel' in r and 'Arm' in r, r)
    tap = """(function(p){var R=document.getElementById('wrHost').shadowRoot,g=R.querySelector('.pt[data-p='+p+']'),r=g.getBoundingClientRect();
      g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3,clientX:r.x+5,clientY:r.y+5}));window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3,clientX:r.x+5,clientY:r.y+5}))})"""
    await pg.evaluate(tap + "('B')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelector('#wrPanel .wr-more').hidden,document.querySelector('#wrPanel .wr-cl').textContent,[...document.querySelectorAll('#wrPanel .wr-adds button')].filter(b=>!b.hidden).map(b=>b.dataset.w).join(',')]")
    check('port panel: extras show for a motor (cable length, add to board)', r[0] is False and r[1].endswith(' cm') and r[2] == 'ax,s,f', r)
    await pg.evaluate("document.querySelector('#wrPanel .wr-cbs button[data-l=\"50\"]').click();document.querySelector('#wrPanel .wr-sw').click();document.querySelector('#wrPanel .wr-adds button[data-w=ax]').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(function(){var c=" + cfg + ";return [c.pcl[1],c.ch[1].inv,c.board.map(x=>x.k+x.c).join(',')]})()")
    check('port panel: 50 cm cable, reverse and Add Motor axle are saved', r[0] == 50 and r[1] is True and r[2].endswith('ax1'), r)
    await pg.evaluate("var n=document.querySelector('#wrPanel .wr-pn');n.focus();n.value='  Big   wheel ';n.dispatchEvent(new Event('change',{bubbles:true}));n.blur()"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("(function(){var c=" + cfg + ";return [c.ch[1].name,[...document.getElementById('wrHost').shadowRoot.querySelectorAll('.lbn')].map(t=>t.textContent).indexOf('Big wheel')>=0,getComputedStyle(document.querySelector('#wrPanel .wr-test')).appearance]})()")
    check('port panel: renaming the channel saves it and updates the wiring label; test slider is custom styled', r == ['Big wheel', True, 'none'], r)
    await pg.evaluate("document.querySelector('#wrPanel .wr-sw').click()")
    await pg.evaluate("var t=document.querySelector('#wrPanel .wr-test');t.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));t.value='80';t.dispatchEvent(new Event('input',{bubbles:true}))"); await pg.wait_for_timeout(700)
    r1 = await pg.evaluate("Math.round(__t.rt.o[1])")
    await pg.evaluate("var t=document.querySelector('#wrPanel .wr-test');t.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))"); await pg.wait_for_timeout(900)
    r2 = await pg.evaluate("[Math.round(__t.rt.o[1]),document.querySelector('#wrPanel .wr-test').value]")
    check('port panel: test slider runs the port and letting go stops it', r1 > 0 and r2 == [0, '0'], [r1, r2])
    await pg.evaluate("document.querySelector('#wrPanel .wr-f').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(900)
    r = await pg.evaluate("document.getElementById('wrBud').textContent")
    await pg.evaluate("document.querySelector('#wrPanel .wr-f').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}))")
    check('power budget: a running motor shows its estimated current', '0.0 A' not in r.split('%')[0] and 'B0.' in r.replace(' ', ''), r[:120])
    r = await pg.evaluate(cfg + ".pfp['1']")
    await pg.evaluate("document.getElementById('wrTidy').click()"); await pg.wait_for_timeout(900)
    r2 = await pg.evaluate(cfg + ".pfp['1']===undefined")
    check('Tidy: moved parts go back to their own place', r == [300, 300] and r2 is True, [r, r2])
    await pg.evaluate("document.querySelector('#wrTabs .wr-allb').click()"); await pg.wait_for_timeout(700)
    r = await pg.evaluate("[document.querySelectorAll('#wrAll .wr-sub').length,document.getElementById('wrHost').hidden,JSON.parse(localStorage.getItem('mk6v2')).prefs.wrall]")
    check('All hubs: both hub pictures at once, choice kept', r == [2, True, True], r)
    await pg.evaluate("""(function(){var R=document.querySelector('#wrAll .wr-sub:nth-child(2) div:last-child').shadowRoot,g=R.querySelector('.pt[data-p=A]'),r=g.getBoundingClientRect();
      g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3,clientX:r.x+5,clientY:r.y+5}));window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3,clientX:r.x+5,clientY:r.y+5}))})()"""); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.getElementById('wrPanel').hidden,getComputedStyle(document.getElementById('wrPanel')).position,document.querySelector('#wrPanel .chip').textContent]")
    await pg.evaluate("document.querySelector('#wrPanel .wr-sw').click();document.querySelector('#wrPanel .wr-f').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(1200)
    r2 = await pg.evaluate("document.querySelector('#wrPanel .wr-pv').textContent")
    await pg.evaluate("document.querySelector('#wrPanel .wr-f').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}));document.querySelector('#wrPanel .wr-sw').click()"); await pg.wait_for_timeout(300)
    check('port panel floats over the page; with Reverse on, Hold forward shows the reversed power the hub gets', r == [False, 'fixed', 'M2A'] and r2.startswith('-'), [r, r2])
    await pg.evaluate("document.querySelectorAll('#wrTabs button')[0].click()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.getElementById('wrPanel').hidden,document.documentElement.classList.contains('wr-fl')]")
    check('leaving All hubs closes a panel opened from a picture that is no longer shown', r == [True, False], r)
    await pg.evaluate("document.querySelectorAll('#wrTabs button')[2].click()"); await pg.wait_for_timeout(500)
    await pg.evaluate("document.getElementById('wrChk').click()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.getElementById('wrChkBox').hidden,Math.round(__t.rt.o[0])]")
    await pg.wait_for_timeout(1400)
    r2 = await pg.evaluate("[...document.querySelectorAll('#wrChkBox button')].map(b=>b.dataset.a).join(',')")
    check('wiring check: runs the first port, then asks if it moved', r[0] is False and r[1] > 0 and r2 == 'y,n,r', [r, r2])
    await pg.evaluate("document.querySelector('#wrChkBox button[data-a=n]').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('#wrChkBox button[data-w=\"4\"]').click()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("(function(){var c=" + cfg + ";return [c.ch[0].name,c.ch[4].name,c.pf[0],c.pf[4],c.board.filter(x=>x.k==='j')[0].c,c.s1.a,c.seq[0].steps[0].ch]})()")
    check('wiring check: "No, that one moved" swaps the two ports with names, parts, widgets, sticks and sequences', r == ['Arm', 'Left wheel', 'xl', 'l', 4, 4, 4], r)
    await pg.evaluate("document.querySelector('#wrChkBox button[data-a=x]').click()")
    r = await pg.evaluate("!!document.getElementById('wrAuto')")
    check('Build board button is gone', r is False, r)
    check('wiring extras: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_clean91(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'Old',cfg:{layout:'joy',
      ch:[{name:'Drive'},{name:'Steer'},{name:'Lights',kind:'light'},{},{},{}],board:[]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    r = await pg.evaluate("(function(){mk6Go('drive');return [__t.C.layout,__t.C.board.map(x=>x.k).join(','),document.querySelectorAll('#boardGrid .bdw').length]})()")
    check('old Joystick layout model opens as a Board with starter widgets', r[0] == 'board' and r[1].startswith('s,s,l') and r[1].endswith(',e') and r[2] >= 4, r)
    await pg.evaluate("mk6Go('medit')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[!!document.querySelector('section.model details.adv'),!!document.getElementById('lStd'),!!document.getElementById('profWiz'),!!document.getElementById('profTest'),document.querySelectorAll('#mIcons svg.mi').length,document.querySelector('#mIcons [data-ic=car]').getBoundingClientRect().width]")
    check('model settings: no Advanced (layout, wizard, test hub); 6 picture icons at 56 px', r == [False, False, False, False, 6, 56], r)
    await pg.evaluate("document.querySelector('#mIcons [data-ic=tractor]').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("[__t.C.icon,document.querySelectorAll('.v2-av.ic svg.mi').length>0]")
    check('picked picture icon is saved and shown on the model knob', r == ['tractor', True], r)
    r = await pg.evaluate("""(function(){var o=localStorage.setItem;localStorage.setItem=function(k){if(k==='mk6v2'){var e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e}return o.apply(this,arguments)};
      document.querySelector('#mIcons [data-ic=car]').click();localStorage.setItem=o;return document.getElementById('toast').textContent})()""")
    check('a save that fails (storage full) is reported instead of lost quietly', 'storage is full' in r, r)
    r = await pg.evaluate("(function(){var id=__t.store.active;window.openModel('nope');return __t.store.active===id})()")
    check('openModel ignores unknown models', r is True, r)
    check('cleanup: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_autowire(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'New',cfg:{layout:'board',
      ch:[{},{},{},{},{},{}],board:[{k:'e',w:1}],pf:['','xl','','','','']}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("mk6Go('drive')"); await pg.wait_for_timeout(300)
    await pg.evaluate("__ed()")
    await pg.evaluate("document.getElementById('bdTST').click();document.getElementById('bdAdd').click()"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('bdTL').click();document.getElementById('bdAdd').click()"); await pg.wait_for_timeout(1000)
    r = await pg.evaluate("(function(){var c=JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg;return [c.board.map(x=>x.k+x.c).join(','),c.pf.slice(0,3).join(','),document.getElementById('toast').textContent]})()")
    check('hub wiring fills in by itself from new widgets (steering = Servo); a part already picked stays', r[1].startswith('sv,xl') and 'Servo' in r[2], r)
    check('auto wiring: no JS errors', not pg.errors, pg.errors[:3])
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
    await pg.evaluate("document.getElementById('sCB').click()")
    await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.documentElement.hasAttribute('data-cb'),getComputedStyle(document.documentElement).getPropertyValue('--ok').trim(),__t.store.prefs.cb]")
    check('P5: colour-blind palette switches the colours', r[0] and r[1].upper() == '#56B4E9' and r[2], r)
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive');__t.rt.t[0]=40;__t.rt.t[1]=-30")
    await pg.wait_for_timeout(800)
    r = await pg.evaluate("[...document.querySelectorAll('#boardGrid .bdw[data-k=s] .bdw-h output')].map(o=>o.textContent)")
    check('P5: values show direction arrows (always on)', len(r) == 2 and r[0].startswith('▲') and r[1].startswith('▼'), r)
    await pg.evaluate("document.getElementById('sHC').click()")
    r = await pg.evaluate("document.documentElement.hasAttribute('data-hc')")
    check('P5: outdoor high contrast turns on', r, r)
    # P3: duplicate onto the next free channel, undo
    await pg.evaluate("__t.rt.t[0]=0;__t.rt.t[1]=0;__ed()")
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
    await pg.evaluate("document.getElementById('hubConn').click();onHubState('ready');mk6Go('hub');document.getElementById('hubDiag').open=true")
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
    check('P8: safety score with the next step', r[0] == 55 and r[1].startswith('Next: Daily play time limit') and r[2] == 6, r)
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
    await pg.evaluate("window.__calls.length=0;mk6Go('settings');var e=document.getElementById('sNew');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.getElementById('sHC').click();document.getElementById('sHC').click()")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    await pg.evaluate("__ed();document.querySelector('#boardGrid .bdw[data-k=tl] .bdw-ed button[aria-label=\"Edit timeline\"]').click()")
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
    await pg.evaluate("__t.C.tl[0].lanes.push({c:3,pts:[[0,0,0],[2,0,0]]});mk6Go('drive');document.getElementById('dbEdit')?document.getElementById('dbEdit').click():__ed()")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[!!document.querySelector('#boardGrid .bdw[data-k=sw] svg image[href=\"img/swing-upper.webp\"]'),!!document.querySelector('#boardGrid .bdw[data-k=sw] svg image[href=\"img/swing-tracks.webp\"]')]")
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
    await pg.evaluate("window.MK6Bridge.send=function(f){};mk6Go('home');document.getElementById('hubConn').click();onHubState('ready');mk6Go('drive')")
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
    # light trails and two-finger fine control are gone: the joystick follows the finger 1:1
    jx = await pg.evaluate(r"""(function(){var p=document.querySelector('#boardGrid .bdw[data-k=j] .pad'),r=p.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      p.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:22,clientX:cx,clientY:cy}));
      p.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:22,clientX:cx+20,clientY:cy}));
      return new Promise(function(res){setTimeout(function(){var m=/translate\(([-\d.]+)px/.exec(p.querySelector('.knob').style.transform);res([m?+m[1]:null,!!p.querySelector('canvas.ptrail'),!!document.getElementById('sTrail'),!!document.getElementById('sFine')])},80)})})()""")
    check('light trails and fine control removed; joystick knob follows the finger 1:1', jx == [20, False, False, False], jx)
    await pg.evaluate("document.querySelector('#boardGrid .bdw[data-k=j] .pad').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:22}))")
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
    # dial turn
    await pg.evaluate("""(function(){var k=document.querySelectorAll('#boardGrid .dialk')[0],r=k.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2;
      k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:5,clientX:cx,clientY:cy-R}));
      for(var i=1;i<=10;i++){var a=-Math.PI/2+i*0.15;k.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:5,clientX:cx+R*Math.cos(a),clientY:cy+R*Math.sin(a)}))}})()""")
    await pg.wait_for_timeout(120)
    await pg.evaluate("var k=document.querySelectorAll('#boardGrid .dialk')[0];k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:5}))")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#boardGrid .dcomet').length,document.querySelectorAll('#boardGrid .dialk')[0].getAttribute('aria-valuenow')]")
    check('dial still turns; the comet tail is gone', r[0] == 0 and r[1] not in ('0', None), r)
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

async def t_ped(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'PE',cfg:{layout:'board',ch:[{},{},{},{},{},{}],
      board:[{k:'t',c:0,w:1},{k:'lx',t:'eq',c:0,w:1},{k:'j',c:0,d:1,w:2}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("mk6Go('drive')"); await pg.wait_for_timeout(300)
    await pg.evaluate("__ed()"); await pg.wait_for_timeout(300)
    vis = "[...document.querySelectorAll('#boardGrid>.bdw .bdw-ed')].filter(e=>getComputedStyle(e).display!=='none').length"
    r = await pg.evaluate(vis)
    check('upright edit: no tools shown until a widget is tapped', r == 0, r)
    await pg.evaluate("document.querySelectorAll('#boardGrid>.bdw')[1].click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("["+vis+",(function(){var e=document.querySelectorAll('#boardGrid>.bdw')[1].querySelector('.bdw-ed'),cs=getComputedStyle(e),b=e.querySelector('.btn').getBoundingClientRect();return [cs.position,Math.round(b.width),Math.round(b.height)]})(),document.querySelectorAll('#boardGrid>.bdw')[1].classList.contains('psel')]")
    check('upright edit: the tapped widget shows round 40 px tools over its corner', r[0] == 1 and r[1] == ['absolute', 40, 40] and r[2], r)
    await pg.evaluate("document.querySelectorAll('#boardGrid>.bdw')[1].click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate(vis)
    check('upright edit: tapping it again hides the tools', r == 0, r)
    check('upright edit: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_edlock(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'EL',cfg:{layout:'board',ch:[{},{},{},{},{},{}],board:[{k:'s',c:0,w:2}]}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){};mk6Go('drive')"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('bdEdit').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("[document.getElementById('bdEdit').textContent,!!document.querySelector('#boardGrid .bdw-ed')]")
    check('edit lock: with the hub stopped the upright board can be edited', r[0] == 'Done editing' and r[1], r)
    await pg.evaluate("onHubState('ready')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.getElementById('bdEdit').textContent,document.getElementById('bdEdit').disabled,!!document.querySelector('#boardGrid .bdw-ed')]")
    check('edit lock: starting the hub ends editing and locks the Edit button', r == ['Stop the hub to edit the board', True, False], r)
    await pg.evaluate("onHubState('off')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.getElementById('bdEdit').textContent,document.getElementById('bdEdit').disabled]")
    check('edit lock: stopping the hub unlocks it again', r == ['Edit board', False], r)
    check('edit lock: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_wire(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'W',cfg:{layout:'board',ch:[{},{},{},{},{},{}],board:[{k:'s',c:0,w:2}],pf:['l','bad','sv','lt','','xl']}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(f){window.__last=f};onHubState('ready');mk6Go('hub')"); await pg.wait_for_timeout(600)
    r = await pg.evaluate("(function(){var R=document.getElementById('wrHost').shadowRoot;return [!!R,R.querySelectorAll('.pt').length,JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.pf.slice(0,6).join(',')]})()")
    check('wiring: hub picture with a part on each set port, bad part names dropped', r[0] and r[1] == 4 and r[2] == 'l,,sv,lt,,xl', r)
    await pg.evaluate("document.getElementById('wrHost').shadowRoot.querySelector('.slot[data-p=B]').dispatchEvent(new MouseEvent('click'));for(var n=0;n<8;n++){var g=document.querySelector('#wrPanel .wr-grid [data-p=B]');if(g.getAttribute('data-t')==='xl')break;g.click()}"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.getElementById('wrPanel').hidden,document.querySelector('#wrPanel .chip').textContent,JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.pf[1],document.getElementById('wrHost').shadowRoot.querySelectorAll('.pt').length]")
    check('wiring: tap an empty port, tap its card to pick a part, it is saved and drawn', r == [False, 'B', 'xl', 5], r)
    await pg.evaluate("var b=document.querySelector('#wrPanel .wr-f');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(700)
    r = await pg.evaluate("[Math.round(__t.rt.o[1]),(window.__last||'').split(',')[1]]")
    check('wiring: hold forward runs that port', r[0] > 0, r)
    await pg.evaluate("var b=document.querySelector('#wrPanel .wr-f');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}))"); await pg.wait_for_timeout(900)
    r = await pg.evaluate("Math.round(__t.rt.o[1])")
    check('wiring: letting go stops it', r == 0, r)
    check('wiring: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_wirelock(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'W',cfg:{layout:'board',hubs:[0,1,-1],ch:[{},{},{},{},{},{},{},{},{},{},{},{}],board:[{k:'s',c:0,w:2}],pf:['l','m','','','','','xl']}}],prefs:{seen:true,wn:99,tour:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("window.MK6Bridge.send=function(){};onHubState('ready')"); await pg.wait_for_timeout(300)
    await pg.evaluate("mk6Go('hub')"); await pg.wait_for_timeout(700)
    await pg.evaluate("document.querySelectorAll('#wrTabs button')[1].click()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.querySelectorAll('#wrTabs button')[1].classList.contains('sel'),document.getElementById('wrHost').shadowRoot.querySelectorAll('.pt').length>0]")
    check('wiring tabs: switching to hub 2 shows its wiring', r == [True, True], r)
    r = await pg.evaluate("[document.getElementById('wrLock').getAttribute('aria-pressed'),document.getElementById('wrHost').shadowRoot.querySelector('svg').classList.contains('lk')]")
    check('wiring lock: on by default', r == ['true', True], r)
    bb = await pg.evaluate("(function(){var g=document.getElementById('wrHost').shadowRoot.querySelector('.hubg');g.scrollIntoView({block:'center'});var r=g.getBoundingClientRect();return [r.x+r.width*.5,r.y+r.height*.85]})()")
    await pg.mouse.move(bb[0], bb[1]); await pg.mouse.down(); await pg.mouse.move(bb[0]-40, bb[1]+40, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(300)
    r = await pg.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.pfp||{})")
    check('wiring lock: a drag while locked moves nothing', '"19"' not in r and '"18"' not in r, r)
    await pg.evaluate("document.getElementById('wrLock').click()"); await pg.wait_for_timeout(200)
    bb = await pg.evaluate("(function(){var g=document.getElementById('wrHost').shadowRoot.querySelector('.hubg');g.scrollIntoView({block:'center'});var r=g.getBoundingClientRect();return [r.x+r.width*.5,r.y+r.height*.85]})()")
    await pg.mouse.move(bb[0], bb[1]); await pg.mouse.down(); await pg.mouse.move(bb[0]-40, bb[1]+40, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
    r = await pg.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('mk6v2')).profiles[0].cfg.pfp||{})")
    check('wiring lock: unlocked, the hub can be dragged (saved for hub 2)', '"19"' in r, r)
    check('wiring lock: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_stage4(b):
    ctx, pg = await page(b)
    # Home has one Connect button; it opens the Connect sheet (no separate wizard button)
    r = await pg.evaluate("[!!document.getElementById('hubWiz'),document.getElementById('hubConn').hidden,!document.getElementById('hubGo').hidden]")
    check('Home shows one Connect button (wizard merged into it)', r == [False, True, True], r)
    await pg.evaluate("window.__devs=[{a:'AA:BB:CC:DD:EE:02',n:'YX-01',r:-40,c:5,ago:50,m:'',u:''}];document.getElementById('hubGo').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#wizSheet .wz-row').length,document.querySelectorAll('#wizSheet .wz-row select').length]")
    check('Connect sheet lists all three hubs with module and type', r == [3, 6], r)
    await pg.evaluate("[...document.querySelectorAll('#wizSheet .btn')].find(x=>x.textContent.indexOf('Find H4.0')===0).click()")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[...document.querySelectorAll('#wizSheet li')].map(l=>l.textContent)")
    check('Connect sheet scan lists the YX- hub', len(r) == 1 and 'YX-01' in r[0], r)
    await pg.evaluate("__calls.length=0;document.querySelector('#wizSheet li').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.getElementById('hubT1').value,document.getElementById('hub1').value,__calls.includes('scanStop'),!!document.getElementById('wizSheet'),(document.querySelectorAll('#wizSheet .wz-addr')[0]||{}).textContent||'']")
    check('picking the found hub puts it on a free hub row as H4.0 and keeps the sheet open', r[0] == '14' and r[1] == '0' and r[2] and r[3] and 'YX-01' in r[4], r)
    await pg.evaluate("__calls.length=0;[...document.querySelectorAll('#wizSheet .btn')].find(x=>x.textContent==='Connect').click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("[__calls.filter(c=>c.startsWith('start:')),!!document.getElementById('wizSheet')]")
    check('Connect in the sheet starts both hubs and closes it', r[0] == ['start:0,H4=AA:BB:CC:DD:EE:02'] and not r[1], r)
    await pg.evaluate("onHubState('stopped')")
    await ctx.close()
    ctx, pg = await page(b)
    await pg.evaluate("document.getElementById('hubGo').click()")
    await pg.evaluate("""(()=>{const set=(i,v)=>{const e=document.querySelectorAll('#wizSheet .wz-row select')[i];e.value=v;e.dispatchEvent(new Event('change'))};
      set(1,'40');set(2,'1');set(3,'40');set(4,'0');set(5,'4')})()""")
    r = await pg.evaluate("[[0,1,2].map(k=>+document.getElementById('hub'+k).value),[0,1,2].map(k=>+document.getElementById('hubT'+k).value)]")
    check('Connect sheet sets up two on/off boxes and a 4.0 hub', r == [[0, 1, 0], [40, 40, 4]], r)
    await pg.evaluate("__calls.length=0;[...document.querySelectorAll('#wizSheet .btn')].find(x=>x.textContent==='Connect').click()")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start:'))")
    check('Connect sheet starts 4.0 on/off M1, M2 and 4.0 M1', r == ['start:20,21,10'], r)
    await pg.evaluate("onHubState('stopped')")
    await pg.evaluate("document.getElementById('hubGo').click()")
    await pg.evaluate("(()=>{const e=document.querySelectorAll('#wizSheet .wz-row select')[1];e.value='16';e.dispatchEvent(new Event('change'))})()")
    r = await pg.evaluate("[...document.querySelectorAll('#wizSheet .btn')].find(x=>x.textContent==='Connect').disabled")
    check('Connect waits until an H hub has been found', r is True, r)
    check('Connect sheet: no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()
    # smart motors found by an H-hub become Motor M on empty ports
    ctx, pg = await page(b)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.evaluate("document.getElementById('gSkip') && document.getElementById('gSkip').click()")
    await pg.evaluate("document.getElementById('hubT0').value='14';document.getElementById('hubT0').dispatchEvent(new Event('change',{bubbles:true}));0")
    await pg.evaluate("window.__t.C.hubA[0]={a:'AA:BB:CC:DD:EE:03',n:'YX-01'};window.MK6Bridge.stats=function(){return JSON.stringify({mode:'single',hubs:1,ok:1,fail:0,frames:1,watchdog:0,up:1000,lastFrameAgo:10,tx:1,err:0,errAgo:-1,mods:[20],alive:[1],lat:60,smart:[[1,0,1,0]]})};document.getElementById('hubConn').click();onHubState('ready');mk6Go('hub')")
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("window.__t.C.pf.slice(0,4)")
    check('smart motors on ports A and C are set to Motor M', r == ['m', '', 'm', ''], r)
    r = await pg.evaluate("document.querySelectorAll('.cvset button, .cvpre button').length")
    check('no JS errors (stage 4)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_ctrl3(b):
    ctx, pg = await page(b)
    await pg.evaluate("window.MK6Bridge.hallConfig=function(j){window.__hc=j;__calls.push('hallConfig')}")
    # reverse top speed
    r = await pg.evaluate("(function(){var c=C.ch[0];c.max=100;c.rmax=40;return [powerFor(100,c,false),powerFor(100,c,true),motorGoal(0,-100,false),motorGoal(0,100,false)]})()") if False else None
    await pg.evaluate("document.querySelector('.rmax') && 0")
    r = await pg.evaluate("[document.querySelectorAll('.rmax').length,document.querySelectorAll('.rmp').length,document.querySelectorAll('.hmbox:not([hidden])').length]")
    check('channels have reverse speed and smoothing sliders, H-hub box hidden for a 6.0 hub', r[0] >= 6 and r[1] >= 6 and r[2] == 0, r)
    await pg.evaluate("var s=document.querySelector('.rmax');s.value=40;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("JSON.parse(localStorage.getItem('mk6v2')).models ? 1 : 1")
    # H6 hub in slot 1 with servo on port A
    await pg.evaluate("document.getElementById('hubT0').value='16';document.getElementById('hubT0').dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("document.querySelectorAll('.hmbox:not([hidden])').length")
    check("an H6.0 hub shows the smart motor box on its motor ports", r >= 4, r)
    await pg.evaluate("var m=document.querySelector('.hmbox .hm');m.value='1';m.dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(500)
    await pg.evaluate("document.getElementById('hStall').checked=false;document.getElementById('hStall').dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("window.__hc||''")
    check('servo and stall settings are sent to the app', '"stall":false' in r and '"servo":[{"h":0,"p":0,"lo":-90,"hi":90,"sp":50' in r, r)
    check('no JS errors (stage 3 controls)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_hhub(b):
    ctx, pg = await page(b)
    await pg.evaluate("window.__devs=[{a:'AA:BB:CC:DD:EE:01',n:'YX-02',r:-45,c:9,ago:50,m:'',u:''},{a:'11:22:33:44:55:66',n:'Other',r:-60,c:2,ago:90,m:'',u:''}];document.getElementById('hubT0').value='16';document.getElementById('hubT0').dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[C_dbg()]") if False else None
    await pg.evaluate("__calls.length=0;document.getElementById('hubConn').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[__calls.filter(c=>c.startsWith('start:')).length,!!document.querySelector('.toast,#toast')]")
    check('H6.0 hub without an address does not start the link', r[0] == 0, r)
    await pg.evaluate("document.querySelector('#hAddr button').click()")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[...document.querySelectorAll('#hFindList li')].map(l=>l.querySelector('b').textContent)")
    check('Find hub lists only YX- hubs', len(r) == 1 and r[0].startswith('YX-02'), r)
    await pg.evaluate("document.querySelector('#hFindList li').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.getElementById('hubT0').value,document.querySelector('#hAddr span').textContent,__calls.includes('scanStop')]")
    check('choosing a hub saves its address, sets H6.0 and stops the scan', r[0] == '16' and 'AA:BB:CC:DD:EE:01' in r[1] and r[2], r)
    await pg.evaluate("__calls.length=0;document.getElementById('hubConn').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start:'))")
    check('connect passes the hub as H6=address', r == ['start:H6=AA:BB:CC:DD:EE:01'], r)
    await pg.evaluate("onHubState('ready')")
    await pg.evaluate("document.getElementById('hub1').value='0';document.getElementById('hub1').dispatchEvent(new Event('change',{bubbles:true}))")
    await pg.wait_for_timeout(300)
    await pg.evaluate("__calls.length=0;onHubState('stopped');document.getElementById('hubConn').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("__calls.filter(c=>c.startsWith('start:'))")
    check('an H6.0 hub and a 6.0 hub start together in slot order', r == ['start:H6=AA:BB:CC:DD:EE:01,0'], r)
    check('no JS errors (H-hub)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_loginspect(b):
    ctx, pg = await page(b)
    await pg.evaluate("window.__log='12:00:00.000  Start requested: hubs 6.0 M1\\n12:00:00.050  Connect telegram: 6D 7B';window.__devs=[{a:'AA:BB:CC',n:'YX-01',r:-50,c:10,ago:100,m:'FFF0: 01 02',u:''},{a:'DD:EE:FF',n:'',r:-80,c:3,ago:200,m:'',u:''}];document.getElementById('hubConn').click();onHubState('ready');mk6Go('hub');document.getElementById('hubDiag').open=true;document.getElementById('logBox').open=true;document.getElementById('insBox').open=true")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("document.getElementById('connLog').textContent")
    check('connection log shows the native log lines', 'Start requested' in r and 'Connect telegram' in r, r)
    r = await pg.evaluate("[...document.querySelectorAll('#insList li')].map(l=>l.className+':'+l.querySelector('b').textContent)")
    check('inspector lists devices and marks a YX- hub', len(r) == 2 and r[0].startswith('hub:YX-01') and r[1].startswith(':(no name)'), r)
    await pg.evaluate("document.getElementById('insScan').click()")
    await pg.wait_for_timeout(700)
    r = await pg.evaluate("[__calls.includes('scanStart'),document.getElementById('insScan').textContent]")
    check('Scan starts the native scan and the button says Scanning', r[0] and 'Scanning' in r[1], r)
    await pg.evaluate("window.__copied=[];HTMLTextAreaElement.prototype.select=function(){window.__copied.push(this.value)};document.execCommand=function(){return true};document.getElementById('logCopy').click();document.getElementById('diagCopy').click()")
    r = await pg.evaluate("window.__copied")
    check('Copy log copies the log, Copy report adds it to the report', len(r) == 2 and r[0].startswith('12:00:00.000') and 'Connection log:' in r[1] and 'Start requested' in r[1] and 'Link:' in r[1], r)
    await pg.evaluate("document.getElementById('logClear').click()")
    await pg.wait_for_timeout(300)
    r = await pg.evaluate("[__calls.includes('clearLog'),document.getElementById('connLog').textContent]")
    check('Clear log empties the log', r[0] and 'Nothing yet' in r[1], r)
    await pg.evaluate("document.getElementById('insBox').open=false")
    r = await pg.evaluate("__calls.includes('scanStop')")
    check('closing the inspector stops the scan', r)
    check('no JS errors (log and inspector)', not pg.errors, pg.errors[:3])
    await ctx.close()

async def t_rings(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844})
    pg = await ctx.new_page(); pg.errors = []
    pg.on('pageerror', lambda e: pg.errors.append(str(e)))
    seed = """(function(){localStorage.setItem('mk6v2',JSON.stringify({active:'m1',profiles:[{id:'m1',name:'Big excavator',cfg:{layout:'board',limit:100,ramp:100,hubs:[0,1,2],hubT:[6,4,40],board:[{k:'s',c:0,w:1}]}},{id:'m2',name:'Tow truck',cfg:{icon:'truck'}},{id:'m3',name:'crane',cfg:{}}],prefs:{seen:true}}))})();"""
    await pg.add_init_script(STUB + seed)
    await pg.goto(HTML + '?mk6test')
    await pg.wait_for_function('window.mk6Ready===true', timeout=15000)
    await pg.wait_for_timeout(500)
    R = "[...document.querySelectorAll('#v2Pill .pring')].map(r=>r.querySelector('b').textContent+':'+r.getAttribute('data-st'))"
    r = await pg.evaluate(R)
    check('pill has one ring per hub, named by hub type', r == ['6.0:off', '4.0:off', 'O/O:off'], r)
    r = await pg.evaluate("getComputedStyle(document.querySelector('#v2Pill .pdot')).display")
    check('rings take the place of the status dot', r == 'none', r)
    await pg.evaluate("window.MK6Bridge.send=function(){};mk6Go('home');document.getElementById('hubConn').click()")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate(R)
    check('rings show pairing while the hub link starts', all(x.endswith(':busy') for x in r), r)
    await pg.evaluate("onHubState('ready');mk6Go('drive')")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate(R)
    check('rings turn active with the hub link', all(x.endswith(':on') for x in r), r)
    await pg.evaluate("var r=document.querySelector('#boardGrid .bdw[data-k=s] input[type=range]');r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));r.value=70;r.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("[...document.querySelectorAll('#v2Pill .pring')].map(r=>[r.getAttribute('data-lv')||'',parseInt(r.querySelector('.ra').getAttribute('stroke-dasharray'))])")
    check('the ring of the hub that runs fills with its output, the others stay empty', r[0][0] in ('g', 'o') and r[0][1] > 30 and r[1] == ['', 0] and r[2] == ['', 0], r)
    r = await pg.evaluate("[...document.querySelectorAll('.v2-mchip .v2-knob, #scrHome .v2-knob')].map(k=>k.textContent)")
    check('model without photo or icon shows its initials', len(r) > 0 and all(x == 'BE' for x in r), r)
    await pg.evaluate("__t.switchProfile('m3');mk6Go('home')")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("[[...document.querySelectorAll('.v2-mchip .v2-knob, #scrHome .v2-knob')].map(k=>k.textContent),[...document.querySelectorAll('#v2Pill .pring')].length]")
    check('one-word model gets its first two letters; a model on one hub gets one ring', r[0] and all(x == 'CR' for x in r[0]) and r[1] == 1, r)
    await pg.evaluate("__t.switchProfile('m2');mk6Go('home')")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("[...document.querySelectorAll('.v2-mchip .v2-knob, #scrHome .v2-knob')].map(k=>!!k.querySelector('svg.mi')&&!k.querySelector('.ini'))")
    check('a model icon still shows instead of initials', r and all(r), r)
    check('rings no JS errors', not pg.errors, pg.errors[:3])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for t in (t_stage4, t_ctrl3, t_hhub, t_loginspect, t_hub_paths, t_hold, t_idle, t_screens, t_features, t_graphics, t_extras, t_light_contrast, t_twelve, t_migrate_and_limit, t_lefty, t_buggy, t_bdlock, t_gpmap, t_mk4, t_mk4oo, t_lpmulti, t_fix5, t_rings, t_btypes, t_mute, t_hubrows, t_trimrest, t_wiremap, t_outmap, t_inview, t_seven, t_three, t_led, t_wup, t_xw, t_pro, t_pro2, t_drtl, t_swing, t_newdash, t_recx, t_chmap, t_upg, t_set2, t_ped, t_edlock, t_wire, t_wirelock, t_axle, t_wire12, t_clean91, t_autowire, t_open_relink, t_click_everything):
            try:
                await t(b)
            except Exception as e:
                check(t.__name__ + ' ran', False, str(e)[:300])
        await b.close()
    failed = [n for n, ok in RESULTS if not ok]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
