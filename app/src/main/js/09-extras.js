  // ---- What's new, version and update check ----
  var CHANGES=[
    {b:136,items:[["fix", "Full screen off: no empty band above the phone's navigation buttons; the bottom bar sits right on them"]]},
    {b:135,items:[["new", "XY pad: drive mode, like the Stick. Car (X and Y go straight to the two channels) or Tank (up and down drive both motors, left and right turn)"]]},
    {b:134,items:[["better", "Stick, D-pad and XY pad: the titles show the widget and channel names again; the pair letters and values are gone"], ["new", "Stick and XY pad share one settings list: deadzone, sensitivity, power limit, axis lock, when you let go, swipe to other pairs and grid. The Stick also has drive mode (tank or car); the XY pad keeps its LED rails"], ["new", "D-pad: when you let go (stay where it is: tap the centre to stop) and swipe to other pairs"], ["better", "XY pad: the yellow arrows glow toward the push, and the pair dots sit just under the pad"]]},
    {b:133,items:[["better", "Stick, D-pad and XY pad: the title is now the channel chip and the port pair letters, glowing red; tap the letters for the next pair (AB, CD, EF). The pair bar at the bottom is gone, so the control gets more room"], ["better", "Sideways dashboard: the two channel values show in the title"], ["fix", "Sideways dashboard: nothing covers the bottom of the controls any more"]]},
    {b:132,items:[["fix", "Stick, D-pad and XY pad: the port pair switch moved to a small bar at the bottom of the widget (tap \u2039 \u203a or swipe the dots), so the title shows in full and the control is not switched by mistake"], ["fix", "Switching a pair while holding another control no longer freezes it"]]},
    {b:131,items:[["new", "Stick, D-pad and XY pad: swipe the title bar to move to the next port pair on the same hub (AB, CD, EF); red LEDs show the pair, empty pairs are skipped"]]},
    {b:128,items:[["better", "Version 1.3. Hub 4.0: plugs A and B sit a little further out so the push button and its LED stay visible"], ["better", "Hub 6.0 picture: push button ring drawn with the same line weight as the hub"]]},
    {b:127,items:[["better", "Wiring: motors turn faster on screen, and slow, medium and fast are clearly different"]]},
    {b:126,items:[["fix", "Wiring: one standard cable width on both hubs"]]},
    {b:125,items:[["fix", "Power budget: MK motors no longer show NaN; MK motors get the test slider, reverse, cable length and add-widget in the port panel"]]},
    {b:124,items:[["new", "Wiring: real hub 6.0 and 4.0 drawings with their own connectors, colour tags A\u2013F that match the dashboard chips, and four MK motors (M, L, XL, Servo)"], ["new", "Wiring: every part at true size on one stud scale; two connectors can be stacked on one port (same channel)"], ["new", "Blue hub LED blinks the hub number (M1 once, M2 twice, M3 three times) while the status shows Hub active"], ["better", "Top status pill shows one ring per hub; a model without a photo shows its initials; lighter wiring background"]]},
    {b:123,items:[["fix","E-Stop: the red banner (tap to release) shows on the landscape dashboard too"],["better","Gamepad: each stick shows what it drives (channels, up/down and left/right or tank) on its card and on the controller picture"]]},
    {b:122,items:[["new","Mould King 4.0 hubs: MK 4.0 (ports A\u2013D, 7 speed steps each way) and older MK 4.0 on/off boxes, mixed freely with 6.0 hubs; every hub drives its outputs at the same time"],["new","H4.0 and H6.0 hubs (YX-01, YX-02, YX-05, YX-06) with a direct Bluetooth connection, smart-motor servo mode and end stops (not yet tried on real hubs)"],["better","Home: one Connect button opens the Connect sheet with the type and module of all three hubs, Find H4.0 / H6.0 hubs and Connect"],["new","Board and gamepad buttons: Hold, Toggle, PingPong and Accelerator; Train mode for Board sliders; per channel its own reverse top speed and acceleration smoothing"],["better","E-Stop is the Volume Up key: one press stops every motor, tap the red banner to release (the on-screen button is gone)"],["new","Gamepad: left and right sticks can drive chosen channels directly (separate or tank mixing); PS4 / PS5 controllers are read from the controller, not its touchpad; Raw input view"],["fix","Light programs on several panels and hubs play at the same time; choosing a motor in Wiring makes the port a motor channel, so reverse works"],["fix","Restore shows its result on every page and brings back up to 30 models; a Levels mute no longer carries over to another model"],["better","Connection log with Copy and a Bluetooth inspector; in portrait the header and footer slide away while scrolling and the Undo / Redo bar can be moved"]]},
    {b:121,items:[["better","PS4 picture: symbols centred on each button's centre dot, D-pad spots on the key faces; blue light from the front of the pad when connected (no bar). Tilt gauge moves every frame with a glowing yellow triangle pointer; tilt sensor read twice as often"]]},
    {b:120,items:[["new","Gamepad: PS4 renders with live sticks, buttons and triggers; L1/R1 and L2/R2 on the rear view. Tilt steering: live LED gauge, set centre, sensitivity buttons, response curve with dead zone and expo"]]},
    {b:119,items:[["better","LED lights picture: the inside of the cable coil is see-through, so the background shows"]]},
    {b:118,items:[["better","Faster tab switching; the hub wiring animation is lighter and pauses for a hub picture scrolled off screen"]]},
    {b:117,items:[["better", "Removed for good: player mode, settings lock and PIN, Effects setting, Show guide button and Add model to home screen (Guided tour stays)"]]},
    {b:116,items:[["better","Settings: Effects, Show guide, Add model to home screen, Player mode, its power limit, Lock settings and PIN rows removed from Experience"]]},
    {b:115,items:[["better", "Settings: the App screen is gone; its options (effects, reconnect, full screen, guide, home-screen shortcut, player mode, lock and PIN) are now rows under Experience"]]},
    {b:114,items:[["fix", "Hub wiring: a part can no longer end up outside the picture (pushed off the hub past the edge); one that already did comes back inside so it can be dragged again"]]},
    {b:113,items:[["better", "Hub wiring and the output to the hub are rewritten: one clear path from each control to its hub port, one touch handler for the whole wiring picture, and new tests that check every port of every hub end to end"]]},
    {b:112,items:[["fix", "Hub wiring: a tap lands on the part you touch. Before, the clear corners of a part's picture could cover a neighbour, so tapping one part opened another port"], ["fix", "Changing the part on a port resets its trim to 0, so a trim left from the old part no longer drives the new one (the 9% on port B)"], ["better", "Port panel: Max power and trim use − and + buttons, so scrolling the panel can no longer change them by accident"]]},
    {b:111,items:[["fix", "A motor or light no longer gets power at rest from its trim: trim now only moves a servo's centre, and evens out a motor while it runs (this kept port B of Hub 1 at 9%)"]]},
    {b:110,items:[["fix", "Port panel: Hold reverse, Hold forward and the test slider stay on every port, also when it is set to Nothing"]]},
    {b:109,items:[["better", "Port panel: the part pictures, Wiggle and Stop are replaced by the hub's wiring: six port cards (A–F) with part and channel name. Tap a port to change its part"]]},
    {b:108,items:[["better", "Port panel: text follows the app's sizes, and the part pictures sit in two roomy rows of four"]]},
    {b:107,items:[["better", "Home hub card is compact: one slim line per hub, and its heading matches the other cards"], ["better", "Text sizes tidied across the app: odd in-between sizes now follow one scale"]]},
    {b:106,items:[["better", "Home, no hub: the ? is replaced by the hub with blue Bluetooth rings"], ["better", "Home hub card: one row for each hub with its own name, output LEDs and send rate"]]},
    {b:105,items:[["better", "LED bar and arc meter widgets: the white limit lines are gone"], ["better", "Hub wiring: the coloured outlines round the hub ports are gone; the running colour now shows only on the cables"]]},
    {b:104,items:[["better", "Landscape bar: the lock is just the 🔒/🔓 symbol, no oval around it"]]},
    {b:103,items:[["fix", "Landscape board: widgets are no longer squeezed by the Board heading"], ["better", "🔒 now locks the widgets against touches, so you can scroll the board in portrait or landscape without moving anything by mistake. In landscape the 🔒 replaces the Lock button in the top bar"]]},
    {b:102,items:[["better", "Settings: the empty Hub heading is gone"], ["new", "Board card: 🔒 locks the board so it cannot be edited by mistake; widgets still work. Tap again to unlock"]]},
    {b:101,items:[["better", "Home now holds the hub card, Hub wiring, power budget, link diagnostics and calibration. The old Home cards (START/STOP, Active model, Record and Sequences) are gone, and the Hub row in Settings with them"]]},
    {b:100,items:[["better", "Buggy motor is bigger and a deeper black in the hub wiring"]]},
    {b:99,items:[["new", "Hub wiring: new part Buggy motor (glossy black), its two red outputs turn together at the right angle when the port runs"]]},
    {b:98,items:[["better", "Settings: the switch is now just called Live frame, and Left-handed (landscape) is removed"], ["better", "Hub wiring panel is smaller: part types on one row, a ✕ to close and ▾ to fold it down to the name, live bar, Hold buttons and test slider"], ["new", "Hub wiring panel: ‹ › step to the next port, a live output bar under the name, Wiggle to find which part is on the port, and Max power and trim for that port"]]},
    {b:97,items:[["better", "Hub screen: Build board and Channel test are removed, with their code (test a port from its panel in Hub wiring)"]]},
    {b:96,items:[["better", "Settings: Light trails and Two-finger fine control are removed, with their code"]]},
    {b:95,items:[["new", "Hub wiring sketches itself while you build a board: each new widget fills in the part on its empty ports (drive = Motor L, steering = Servo, lever = Motor XL, lights = LED, others = Motor M). Parts you picked are never changed"]]},
    {b:94,items:[["better", "Cleaner app: unused code, old translations and two unused pictures removed (smaller, faster to load)"]]},
    {b:93,items:[["fix", "Fixed: the app could switch to another model by itself (other wiring, other hubs) when it came back from the background or Recents after a model shortcut had been used once; a shortcut now opens its model only when tapped"], ["better", "If the app's storage is full, a message now says changes are not being saved (before, they were lost quietly at the next start)"]]},
    {b:92,items:[["better", "Model icons: Google Material Symbols in gold (car, loader, forklift, truck, tractor, sailboat)"], ["new", "Hub wiring panel: tap the channel name to rename it"], ["better", "Hub wiring panel: the test slider has a yellow knob on a plain track, and part names fit their tiles"]]},
    {b:91,items:[["better", "Model settings: the Advanced part is gone (Standard / Joystick / Dual stick layouts, Setup wizard and Test hub). Every model drives with the Board; older models get a starter board"], ["better", "Settings: the Live output meter is gone, and values always show ▲/▼ for direction (the switch is gone)"], ["better", "Model icons are now detailed pictures: car, excavator, crane, truck, tractor and boat"]]},
    {b:90,items:[["better", "Hub wiring: the port panel floats above the page, with Hold and the test slider at the top, so a motor can be tested while the wiring stays in view"], ["fix", "Hub wiring: with Reverse direction on, the motor picture, the cable pulses and the panel value now show the reversed direction the hub really gets"], ["fix", "Hub wiring: a port panel left open from another model or from All hubs closes instead of showing the wrong hub"]]},
    {b:89,items:[['new', 'Hub wiring: Build board makes a board from what is plugged in (two drive motors become a tank joystick, servo a steering wheel, XL a lever, lights a toggle, plus E-Stop). Back on the board undoes it'], ['new', 'Power budget under the hub wiring: estimated current per port and per hub, warnings at high load and an estimate of play time left'], ['new', 'Check wiring: each port runs for a moment and the app asks if the right part moved; if not, pick the part that did and the two ports swap with their names, settings and widgets'], ['new', 'Hub wiring cables come alive: bright pulses run along a cable while its port has power, faster with more power and backwards in reverse'], ['new', 'Hub wiring labels show the channel name under the part'], ['new', 'Port panel: test slider (let go = stop), reverse direction switch, cable length (20 or 50 cm) and Add to board for that port'], ['new', 'Tidy: parts glide back to their own side of the hub so the cables are short and do not cross'], ['new', 'Cable length: a cable turns red when the part sits further away than its cable reaches (5 studs = 4 cm)'], ['new', 'All hubs: see every hub\'s wiring at once (side by side when the phone is sideways); the channel test then shows every hub']]},
    {b:88,items:[['better','Motor axle: full-width LED display, it fills left to right going forward and right to left in reverse']]},
    {b:87,items:[['new','New meter widget Motor axle: the orange axle spins with the power and an LED bar shows forward and reverse']]},
    {b:86,items:[['fix','Hub wiring: LED cable joins the white connector cleanly, no stray black cable']]},
    {b:85,items:[['better','Hub wiring: the lock button is just the 🔒/🔓 symbol, no box']]},
    {b:84,items:[['better','Channel test shows only the hub picked in Hub wiring'],['new','Hub wiring: lock button (on by default) so a stray touch cannot move the hub or parts; unlock to rearrange']]},
    {b:83,items:[['new','Hub wiring: drag the hub too; its plugs stay locked on it and the cables follow'],['fix','Hub wiring: no more light edge under the hub']]},
    {b:82,items:[['better','Hub wiring: the hub is now the real picture of the hub, sharper and unchanged in shape and look']]},
    {b:81,items:[['new','Hub wiring in 3D: the real hub shape drawn in the motor style, 3D plugs and 4-core cables. Drag any motor anywhere on the board; cables re-route themselves around the hub and the other parts']]},
    {b:80,items:[['better','Hub wiring: LED lights are shown without the grey plug and its cable; the hub cable goes straight to the white connector'],['fix','Hub wiring: the glow around a running plug is now a full frame (neighbouring plugs no longer cover it)']]},
    {b:79,items:[['new','Hub wiring: the Hub screen now shows your Mould King hub with its six ports. Tap a port to say what is plugged in (Motor M, L, XL, Servo or LED lights); plugs, cables and parts light up and turn with the real output, and you can hold to test each port']]},
    {b:77,items:[['better','Upright board: editing is only available while the hub is stopped; starting the hub ends editing']]},
    {b:76,items:[['better','Smoother and lighter: fewer layout reads in the paint loop, the frame log only updates while on screen, the effects monitor sleeps off the sideways board, and the swing angle pictures are 5× smaller']]},
    {b:75,items:[['fix','Arc meter: the 5-second mini graph now shows on the sideways board too, whenever it fits']]},
    {b:74,items:[['better','Edit mode upright: tap a widget to show its tools as round buttons over its corner, like the sideways board (no more cramped rows)']]},
    {b:71,items:[['new','Dial comet tail: the LED ring segments the dial just passed glow and fade in 0.4 s (with Light trails in Settings)'],['new','Swap widgets: in dashboard edit mode, drop a widget on another and they swap places and sizes (Back undoes it)'],['new','Match size: pick a widget, tap ▣ and then tap others to give them the same size where there is room'],['new','Double tap to 0: double tap the knob of a slider, dial or lever and it glides back to 0 (lever: to N)'],['new','E-Stop black box: the last 10 s of every channel are kept when E-Stop goes on; see them in Settings (last 3 stops)']]},
    {b:70,items:[['new','Joystick light trail: a short yellow tail follows the knob and fades in 0.4 s (Settings → Experience)'],['new','Live frames: the widget rim turns green while its motor runs, red at full stroke, and blinks red on E-Stop'],['new','Pinch to resize: in dashboard edit mode, pinch a widget with two fingers to resize it in grid steps (Back undoes it)'],['new','Two-finger fine control: rest a second finger on empty board space and sliders and joysticks move only 30% of your finger (20 / 30 / 50% or off in Settings)']]},
    {b:69,items:[['fix','Joystick glow as bright as the sliders: it no longer shrinks with the joystick size, and it is drawn above the knob shadow']]},
    {b:68,items:[['fix','One glow for every knob: sliders (flat and upright), joysticks and the ON switch now light up the same way; flat sliders draw their knob like the upright ones, so the glow is no longer cut off']]},
    {b:67,items:[['better','Channel letter: tap it any time, even while driving with the hub on; every widget with channels has one (double stick too). Cleaner chip look, ⇄ button removed']]},
    {b:66,items:[['new','Channels, every widget: tap the yellow channel letter while editing (or ⇄) to move a widget to another channel or hub; the named list shows who uses each channel']]},
    {b:65,items:[['fix','Graph: while recording, the extra channels keep their lines too, and stay after Stop']]},
    {b:64,items:[['new','New dashboard button (+) between Drive and Models: name it, pick a start, and it opens sideways in edit mode'],['better','Sharper model photos (512 px)']]},
    {b:57,items:[['new','Swing angle widget: the excavator seen from above turns with the estimated cab angle, slows near the limits and stops at them']]},
    {b:56,items:[['better','Timeline player: smaller play and stop signs, channel letters on each lane, a live dot on each curve and the repeat count'],['better','D/R switch removed']]},
    {b:52,items:[['new','Timeline: draw smooth moves for several channels on lanes, then play them with one button']]},
    {b:51,items:[['new','Search settings: type a word such as power or lock and jump straight to it'],
      ['new','My models: \u2605 favourites, sort by Favourites, Recent or A\u2013Z, and driving time on each card'],
      ['new','Safety score in Limits & auto-stop, with the next best step to turn on'],
      ['new','PIN for the settings lock and the play time limit'],
      ['better','Guided tour shows how to arrange the board, and can be replayed from Settings'],
      ['better','Softer button and switch movement, and a light vibration for taps, switches and success']]},
    {b:49,items:[['new','Live link centre: send-rate graph, a ring for each hub and an early warning when sending slows down'],
      ['new','Edit mode: ⧉ duplicates a widget onto the next free channel; ⊞ selects several widgets to move together'],
      ['new','Colour-blind colours (blue / orange) and ▲/▼ direction arrows on values'],
      ['better','High contrast is stronger for outdoor use; TalkBack reads each widget\'s name'],
      ['better','Pink alignment guides while moving widgets'],
      ['new','Check for updates, and this What\'s new list']]},
    {b:45,items:[['fix','Light program speed now changes while the program runs; Slow, Normal and Fast are clearly different']]},
    {b:44,items:[['better','Rotor: jet turbine or silver boat propeller'],['better','Crossfader: the master fader is the throttle and starts at 0']]},
    {b:42,items:[['new','New widgets: XY pad, crossfader and rotor']]},
    {b:41,items:[['better','Cleaner LED bar, LED meter and dial: extra value labels removed']]},
    {b:40,items:[['new','LED bars work both ways; tap a bar to mute it'],['new','Dial: fine turning, tap the centre for 0, and scene selector'],['new','LED matrix: draw your own icon and scroll it']]}
  ];
  function appInfo(){var o=null;try{o=NB&&NB.appInfo?JSON.parse(NB.appInfo()||'{}'):null}catch(_){o=null}
    if(!o||!(o.build>0)) o={name:'1.3',build:CHANGES[0].b,date:'',web:!NB||!NB.appInfo};return o}
  var WN_TAG={new:'NEW',better:'IMPROVED',fix:'FIXED'};
  function wnShow(upd){
    var old=document.getElementById('wnSheet');if(old) old.remove();
    var ai=appInfo(), ov=document.createElement('div');ov.id='wnSheet';ov.className='gedit';
    var bx=document.createElement('div');bx.className='gbox wn';bx.setAttribute('role','dialog');bx.setAttribute('aria-modal','true');ov.appendChild(bx);
    function mk(tag,txt,cls){var e=document.createElement(tag);if(txt!=null) e.textContent=txt;if(cls) e.className=cls;return e}
    bx.appendChild(mk('h3',upd?'Update available':'What\'s new'));
    bx.appendChild(mk('p',upd?('Build '+upd.build+' is ready. You have build '+ai.build+'.'):('Version '+ai.name+' · build '+ai.build+(ai.date?' · '+ai.date:'')),'wn-sub'));
    CHANGES.slice(0,upd?1:4).forEach(function(c){
      if(upd&&c.b<=ai.build) return;
      bx.appendChild(mk('div','Build '+c.b,'wn-b'));
      var ul=mk('ul');c.items.forEach(function(x){var li=mk('li');li.appendChild(mk('span',WN_TAG[x[0]],'wn-t '+x[0]));li.appendChild(mk('span',x[1]));ul.appendChild(li)});bx.appendChild(ul);
    });
    if(upd&&upd.notes&&!/^Build \d+\. Open MK6 Console/.test(upd.notes)){var nt=mk('p',upd.notes.slice(0,600),'note');nt.style.whiteSpace='pre-line';bx.appendChild(nt)}
    var row=mk('div',null,'rec-row');
    if(upd){var dl=mk('button','Download','btn pri');dl.type='button';dl.addEventListener('click',function(){try{NB.openUrl(upd.apk||upd.page)}catch(_){}ov.remove()});row.appendChild(dl)}
    var ok=mk('button',upd?'Later':'OK',upd?'btn':'btn pri');ok.type='button';ok.addEventListener('click',function(){ov.remove()});row.appendChild(ok);
    bx.appendChild(row);
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    document.body.appendChild(ov);try{ok.focus()}catch(_){}
  }
  var UPD={busy:false,quiet:false,found:null};
  window.onUpdate=function(js){
    UPD.busy=false;var d={};try{d=JSON.parse(js)||{}}catch(_){d={error:'bad'}}
    var ai=appInfo(), m=/build (\d+)/i.exec(d.name||''), nb=m?+m[1]:0;
    store.prefs.upAt=Date.now();save();
    if(d.error||!nb){if(!UPD.quiet) toast(d.error==='net'?'Could not check for updates. Is the internet on?':/^http 40[34]/.test(d.error||'')?'No build has been published for updates yet.':'Could not check for updates. Try again later.');verPaint();return}
    if(nb>ai.build){UPD.found={build:nb,apk:d.apk||'',page:d.page||'',notes:d.notes||''};verPaint();if(!UPD.quiet) wnShow(UPD.found)}
    else{UPD.found=null;verPaint();if(!UPD.quiet) toast('You have the newest build.')}
  };
  function updCheck(quiet){
    if(!(NB&&NB.checkUpdate)){if(!quiet) toast('Update check works in the Android app.');return}
    if(UPD.busy) return;UPD.busy=true;UPD.quiet=!!quiet;if(!quiet) toast('Checking for updates…');
    try{NB.checkUpdate()}catch(_){UPD.busy=false}
  }
  function verPaint(){
    var ai=appInfo();v2T($('#sVer'),'MK6 Console '+ai.name+' · build '+ai.build+(ai.date?' · '+ai.date:''));
    var u=$('#sUpdV');if(u){v2T(u,UPD.found?('Build '+UPD.found.build+' available'):'');u.className=UPD.found?'on':''}
  }
  v2Click('#sNew',function(){wnShow(null)});
  v2Click('#sUpd',function(){if(UPD.found) wnShow(UPD.found);else updCheck(false)});
  (function(){
    verPaint();
    var ai=appInfo(), seen=store.prefs.wn||0;
    if(ai.build>seen){store.prefs.wn=ai.build;save();if(seen>0&&!ai.web) setTimeout(function(){if(!document.getElementById('gEdit')) wnShow(null)},1200)}
    // a quiet check at most once a day; it only shows a note in Settings
    if(NB&&NB.checkUpdate&&Date.now()-(store.prefs.upAt||0)>864e5) setTimeout(function(){updCheck(true)},4000);
  })();

  // ---- Share one model as a file; open a model file sent by a friend ----
  function v2SafeName(n){return (String(n||'model').replace(/[^A-Za-z0-9 ._()-]+/g,'_').trim().slice(0,40)||'model')+'.mk6.json'}
  v2Click('#mShare',function(){
    var p=activeProfile();if(!p) return;
    var json=JSON.stringify({app:'mk6console',version:3,share:1,profiles:[{name:p.name,label:p.label||'',cfg:p.cfg}]});
    var fn=v2SafeName(profLbl(p));
    if(NB&&NB.shareFile){try{NB.shareFile(fn,json,tr('Share model'));return}catch(_){}}
    try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download=fn;document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);toast('Model saved as '+fn)}catch(_){toast('Could not share the model.')}
  });
  var v2Inbox=null;
  window.onSharedModel=function(text){
    var d=null;try{d=JSON.parse(text)}catch(_){}
    var list=d&&Array.isArray(d.profiles)?d.profiles:(d&&d.cfg?[d]:null);
    if(!list||!list.length){toast('That file is not an MK6 model.',3500);return}
    v2Inbox={text:text,name:String(list[0].name||'Model').slice(0,24),n:list.length};
    v2AlKey='';if(V2.v!=='home') v2Go('home');else v2Alerts();
  };
  v2Click('#sLight',function(){store.prefs.ui=store.prefs.ui==='light'?'dark':'light';save();v2Theme();});
  function v2Gfx(st){
    // 4 · no hub: dim the board widgets (not E-Stop / START-STOP) and tag them "No hub"
    v2Tog(R2,'v2-nohub',st!=='on');v2Tog(R2,'v2-editing',!!bdEditing);
    var nt=store.prefs.lang==='ms'?'Tiada hub':'No hub';if(R2._nt!==nt){R2._nt=nt;R2.style.setProperty('--v2nh',JSON.stringify(nt))}
    var bg=$('#boardGrid');if(bg){for(var q=0;q<bg.children.length;q++){var c=bg.children[q];if(!c._es){c._es=1;if(c.querySelector('.dw-es')) c.classList.add('v2-es')}}}
    // 5 · empty states
    var noBd=C.layout==='board'&&!C.board.length&&!bdEditing;
    if(v2E.bd){if(v2E.bd.hidden===noBd) v2E.bd.hidden=!noBd;v2Tog($('#boardCard'),'v2-none',noBd)}
    var noRec=!C.rec.length&&!S.rec;
    if(v2E.rec){if(v2E.rec.hidden===noRec) v2E.rec.hidden=!noRec;v2Tog($('#recCard'),'v2-none',noRec)}
    var noSeq=!C.seq.length;
    if(v2E.seq){if(v2E.seq.hidden===noSeq) v2E.seq.hidden=!noSeq;v2Tog($('#seqCard'),'v2-none',noSeq)}
    // 6 · theme
    v2Theme();
  }
  setInterval(function(){v2Paint();v2Live()},250);

  // ---- 6 · Landscape: driving only; Edit / Reset / Lock / Exit behind one "more" button ----
  (function(){
    var bar=$('#dashBar');if(!bar) return;
    var m=document.createElement('button');m.type='button';m.className='btn v2-dbmore';m.id='dbMore';m.setAttribute('aria-label','More');m.setAttribute('aria-expanded','false');m.innerHTML=v2Ic('more');
    m.addEventListener('click',function(){var o=!R2.classList.contains('v2-dbopen');R2.classList.toggle('v2-dbopen',o);m.setAttribute('aria-expanded',String(o))});
    bar.appendChild(m);
  })();

  // =====================================================================================
  // ---- 3 · Drive mode on the Drive screen: Eco / Normal / Sport (= the three power profiles) ----
  (function(){
    var row=$('#dMode');if(!row) return;
    Array.prototype.forEach.call(row.querySelectorAll('[data-lp]'),function(b){b.addEventListener('click',function(){
      var p=$('#limP'+b.getAttribute('data-lp'));if(p){p.click();v2Mode(true)}
    })});
  })();
  function v2Mode(force){
    var lm=store.prefs.lim,row=$('#dMode');if(!row) return;
    Array.prototype.forEach.call(row.querySelectorAll('[data-lp]'),function(b){var i=+b.getAttribute('data-lp');var on=C.limit===lm[i].l;if(b.getAttribute('aria-pressed')!==String(on)) b.setAttribute('aria-pressed',String(on))});
  }

  // ---- 5 · Play-time limit per day (parents: change it by holding the row for 2 s) ----
  var V2PLAYK='mk6play';
  function v2Today(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
  (function(){try{var o=JSON.parse(localStorage.getItem(V2PLAYK)||'null');if(o&&o.d===v2Today()){PLAY.used=+o.used||0;PLAY.extra=!!o.extra}}catch(_){}})();
  function v2PlaySave(){try{localStorage.setItem(V2PLAYK,JSON.stringify({d:v2Today(),used:Math.round(PLAY.used),extra:PLAY.extra}))}catch(_){}}
  function v2PlayLeft(){var lim=store.prefs.playLim||0;return lim?((lim+(PLAY.extra?5:0))*60000-PLAY.used):Infinity}
  function v2Clock(ms){var s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
  var v2PlaySaveAt=0;
  function v2PlayTick(){
    var now=Date.now(), lim=store.prefs.playLim||0;
    if(!lim){PLAY.f=1;PLAY.end=0;PLAY.last=now;return}
    if(PLAY.d!==v2Today()){PLAY.d=v2Today();if(PLAY.dset){PLAY.used=0;PLAY.extra=false;PLAY.warned=false;PLAY.end=0}PLAY.dset=1}
    var live=!!S.connected&&!document.hidden;
    if(live&&PLAY.last) PLAY.used+=Math.min(1000,now-PLAY.last);
    PLAY.last=now;
    var left=v2PlayLeft();
    if(left<=120000&&left>0&&!PLAY.warned&&live){PLAY.warned=true;toast('2 minutes of play time left.',4000);feedback('warn')}
    if(left<=0){
      if(!PLAY.end){PLAY.end=now;toast('Play time is up. Motors are slowing down.',4000)}
      PLAY.f=Math.max(0,1-(now-PLAY.end)/3000);
      if(PLAY.f===0&&S.connected){v2Conn();v2AlKey=''}
    }else{PLAY.f=1;PLAY.end=0}
    if(now-v2PlaySaveAt>5000){v2PlaySaveAt=now;v2PlaySave()}
  }
  setInterval(v2PlayTick,100);
  function v2PlayHold(el,fn){
    var t=0;function up(){clearTimeout(t);t=0;el.classList.remove('holding')}
    el.addEventListener('pointerdown',function(){up();el.classList.add('holding');t=setTimeout(function(){t=0;el.classList.remove('holding');feedback('hold');fn()},2000)});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){el.addEventListener(ev,function(){if(t) toast('Hold for 2 seconds to change (parents).',2500);up()})});
    el.addEventListener('click',function(e){e.preventDefault()});
  }
  (function(){var r=$('#sPlay');if(r) v2PlayHold(r,function(){(function(){
    var L=[0,10,20,30,45,60],i=L.indexOf(store.prefs.playLim||0);store.prefs.playLim=L[(i+1)%L.length];
    PLAY.used=0;PLAY.extra=false;PLAY.warned=false;PLAY.end=0;PLAY.f=1;v2PlaySave();save();v2Paint();
    toast(store.prefs.playLim?('Play time limit: '+store.prefs.playLim+' min a day.'):'Play time limit off.')})()})})();
  function v2PlayExtra(){if(PLAY.extra) return;PLAY.extra=true;PLAY.warned=false;PLAY.end=0;PLAY.f=1;v2PlaySave();v2AlKey='';toast('5 more minutes.')}

  v2Click('#sBb',function(){bbShow(0)});
  v2Click('#sLframe',function(){store.prefs.lframe=store.prefs.lframe===false;save();v2Paint()});

  // ---- 10 · Widget gallery: picture cards with categories instead of a list of names ----
  (function(){
    var box=document.querySelector('#bdEditor .bd-types');if(!box) return;
    var K={bdTS:'s',bdTJ:'j',bdTD:'d',bdTM:'m',bdTL:'l',bdTT:'t',bdTB:'b',bdTW:'w',bdTA:'a',bdTY:'y',bdTF:'f',bdTFN:'fn',bdTI:'i',bdTXmx:'xmx',bdTXeq:'xeq',bdTXts:'xts',bdTXgi:'xgi',bdTXlp:'xlp',bdTXtk:'xtk',bdTK:'k',bdTN:'n',bdTRS:'rs',bdTG:'g',bdTST:'st',bdTLV:'lv',bdTDP:'dp',bdTZ:'z',bdTE:'e',bdTPS:'ps',bdTXY:'xy',bdTXF:'xf',bdTRO:'ro',bdTAX:'ax',bdTSW:'sw',bdTTL:'tl'};
    var CAT={drive:['s','j','d','m','st','dp','n','g','lv','rs','y','xy','xf','tl','sw'],light:['l','t','b','w'],meter:['f','fn','i','k','z','ro','ax'],led:['xmx','xeq','xts','xgi','xlp','xtk'],safe:['e','ps','a']};
    box.classList.add('v2-gal2');
    Array.prototype.forEach.call(box.querySelectorAll('button'),function(b){
      var k=K[b.id];if(!k) return;b.setAttribute('data-cat',Object.keys(CAT).filter(function(c){return CAT[c].indexOf(k)>=0})[0]||'drive');
      var lb=document.createElement('span');lb.className='gl';while(b.firstChild) lb.appendChild(b.firstChild);
      var th=document.createElement('span');th.className='gt';th.innerHTML=v2KindIcon(k);
      b.appendChild(th);b.appendChild(lb);
    });
    var tabs=document.createElement('div');tabs.className='v2-gtabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Widget type');
    [['all','All'],['drive','Drive'],['light','Lights & buttons'],['meter','Meters'],['led','LED'],['safe','Safety']].forEach(function(c,n){
      var t=document.createElement('button');t.type='button';t.className='btn';t.textContent=c[1];t.setAttribute('aria-pressed',String(n===0));
      t.addEventListener('click',function(){Array.prototype.forEach.call(tabs.children,function(x){x.setAttribute('aria-pressed',String(x===t))});
        Array.prototype.forEach.call(box.querySelectorAll('button[data-cat]'),function(b){b.hidden=c[0]!=='all'&&b.getAttribute('data-cat')!==c[0]})});
      tabs.appendChild(t);
    });
    box.parentNode.insertBefore(tabs,box);
  })();

  // gallery pictures: one clear drawing per widget type (48 × 24)
  function v2KindIcon(k){
    var Y='#ffd84a',D='#0b0d11',S='#4a5260',G='#1D9E75',O='#EF9F27',R='#E24B4A',o='';
    function kn(x,y,r){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#3a414d" stroke="#0d1015" stroke-width=".6"/><circle cx="'+x+'" cy="'+y+'" r="'+(r*.45)+'" fill="'+Y+'"/>'}
    function ring(x,y,r,f,col){var n=12,s='';for(var q=0;q<n;q++){var a=(135+270*(q+.5)/n)*Math.PI/180,on=(q+.5)/n<=f;s+='<line x1="'+(x+(r-1.6)*Math.cos(a)).toFixed(1)+'" y1="'+(y+(r-1.6)*Math.sin(a)).toFixed(1)+'" x2="'+(x+r*Math.cos(a)).toFixed(1)+'" y2="'+(y+r*Math.sin(a)).toFixed(1)+'" stroke="'+(on?(col||G):'#3a414d')+'" stroke-width="1.6"/>'}return s}
    function pill(x,y,w,h,txt,f,c){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="'+(f||'#2a303b')+'" stroke="'+S+'" stroke-width=".4"/>'+(txt?'<text x="'+(x+w/2)+'" y="'+(y+h/2+1.6)+'" font-size="4.4" font-weight="900" text-anchor="middle" fill="'+(c||'#c5ccd6')+'">'+txt+'</text>':'')}
    switch(k){
      case 'xmx': (function(){var A=['00011000','00111100','01111110','11111111','00111100','00111100'];for(var r=0;r<6;r++)for(var q=0;q<8;q++)o+='<circle cx="'+(14.5+q*2.7)+'" cy="'+(5+r*2.8)+'" r="1.05" fill="'+(A[r][q]==='1'?Y:'#2a303b')+'"/>'})();break;
      case 'xeq': [7,4,2,9].forEach(function(v,j){for(var q=0;q<10;q++) o+='<rect x="'+(13+j*6)+'" y="'+(20.5-q*1.9)+'" width="4.4" height="1.3" fill="'+(q<v?(q>7?R:q>5?O:G):'#2a303b')+'"/>'});break;
      case 'xts': o='<path d="M15 7 l-7 5 7 5z" fill="#2a303b"/><path d="M33 7 l7 5 -7 5z" fill="'+O+'"/><circle cx="20" cy="12" r="1.3" fill="#2a303b"/><circle cx="24" cy="12" r="1.3" fill="'+O+'"/><circle cx="28" cy="12" r="1.3" fill="'+O+'"/>';break;
      case 'xgi': ['R','N','1','2','3'].forEach(function(t,j){o+='<rect x="'+(7+j*7)+'" y="5" width="6" height="10" rx="1.2" fill="'+(j===3?Y:'#1a1e25')+'"/><text x="'+(10+j*7)+'" y="12.6" font-size="5.5" font-weight="900" text-anchor="middle" fill="'+(j===3?'#1b1b1b':'#4a5260')+'">'+t+'</text>'});for(var q=0;q<7;q++) o+='<circle cx="'+(10+q*4.6)+'" cy="19" r="1" fill="'+(q<5?G:'#2a303b')+'"/>';break;
      case 'xlp': [[8,4,1],[25,4,1],[8,13,0],[25,13,1]].forEach(function(p){o+='<rect x="'+p[0]+'" y="'+p[1]+'" width="15" height="7" rx="2" fill="#1a1e25" stroke="'+S+'" stroke-width=".3"/><circle cx="'+(p[0]+3)+'" cy="'+(p[1]+3.5)+'" r="1.6" fill="'+(p[2]?Y:'#2a303b')+'"/>'});break;
      case 'xtk': o='<rect x="4" y="7" width="40" height="10" rx="2" fill="'+D+'" stroke="'+S+'" stroke-width=".4"/><text x="24" y="14.3" font-size="5.6" font-weight="900" text-anchor="middle" fill="'+Y+'" font-family="monospace">CRUISE 72%</text>';break;
      case 'fn': o='<circle cx="24" cy="13" r="10.5" fill="#07090c" stroke="#3a414d" stroke-width=".6"/>';(function(){for(var q=0;q<12;q++){var a0=(210-q*20)*Math.PI/180,a1=(210-q*20-15)*Math.PI/180,r=9;o+='<path d="M'+(24+r*Math.cos(a0)).toFixed(2)+' '+(13-r*Math.sin(a0)).toFixed(2)+'A'+r+' '+r+' 0 0 1 '+(24+r*Math.cos(a1)).toFixed(2)+' '+(13-r*Math.sin(a1)).toFixed(2)+'" fill="none" stroke-width="2" stroke="'+(q<6?G:q<8?O:q<9?R:'#2a303b')+'"/>'}})();o+='<line x1="24" y1="13" x2="29.5" y2="9" stroke="#e8e8ea" stroke-width="1.2" stroke-linecap="round"/><circle cx="24" cy="13" r="1.6" fill="#2a303b" stroke="#e8e8ea" stroke-width=".5"/>';break;
      case 's': o='<rect x="22.5" y="2" width="3" height="20" rx="1.5" fill="#3a414d"/>'+kn(24,10,3.6);break;
      case 'j': o='<circle cx="24" cy="12" r="10" fill="'+D+'" stroke="'+S+'" stroke-width=".5"/>'+kn(27,9,3.8);break;
      case 'd': o='<circle cx="13" cy="12" r="9" fill="'+D+'" stroke="'+S+'" stroke-width=".5"/>'+kn(13,12,3.2)+'<circle cx="35" cy="12" r="9" fill="'+D+'" stroke="'+S+'" stroke-width=".5"/>'+kn(35,12,3.2);break;
      case 'm': o='<rect x="15" y="2" width="3" height="20" rx="1.5" fill="#3a414d"/>'+kn(16.5,9,3)+'<rect x="30" y="2" width="3" height="20" rx="1.5" fill="#3a414d"/>'+kn(31.5,15,3);break;
      case 'l': o=pill(8,7,32,10,'',null)+'<circle cx="14" cy="12" r="3.4" fill="'+R+'"/>'+'<text x="27" y="13.6" font-size="4.4" font-weight="900" text-anchor="middle" fill="#c5ccd6">OFF</text>';break;
      case 't': o=pill(12,7,24,10,'','#ffc400')+'<circle cx="31" cy="12" r="3.6" fill="#1b1b1b"/>';break;
      case 'b': o=pill(8,6,32,12,'TURBO');break;
      case 'w': o=pill(4,7,12,10,'◀')+pill(18,7,12,10,'■','#ffc400','#c00')+pill(32,7,12,10,'▶');break;
      case 'a': o='<circle cx="24" cy="12" r="8.5" fill="none" stroke="'+S+'" stroke-width="1.2"/><path d="M24 7v5l3.4 2" stroke="'+Y+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>';break;
      case 'y': o='<path d="M8 20 L20 20 L34 5 L40 5" stroke="'+Y+'" stroke-width="1.6" fill="none"/>';break;
      case 'f': o=ring(24,14,10,.62);break;
      case 'i': for(var q=0;q<8;q++) o+='<rect x="'+(10+q*3.8)+'" y="5" width="2.6" height="14" rx=".6" fill="'+(q<4?G:q<6?O:q<7?R:'#3a414d')+'"/>';break;
      case 'k': o='<rect x="6" y="3" width="36" height="18" rx="2" fill="'+D+'" stroke="'+S+'" stroke-width=".4"/><polyline points="7,15 13,15 17,8 22,17 27,6 32,12 41,12" fill="none" stroke="'+G+'" stroke-width="1.1"/>';break;
      case 'n': o=ring(24,12,9,.55,Y)+kn(24,12,5.5);break;
      case 'rs': o=ring(24,12,9,1,'#3a414d')+'<circle cx="24" cy="12" r="5.5" fill="#3a414d"/><line x1="24" y1="12" x2="27.5" y2="8" stroke="'+Y+'" stroke-width="1.4"/>';for(var q2=0;q2<6;q2++){var a2=(210+q2*24)*Math.PI/180;o+='<circle cx="'+(24+11.5*Math.cos(a2)).toFixed(1)+'" cy="'+(12+11.5*Math.sin(a2)).toFixed(1)+'" r=".9" fill="'+(q2===2?Y:'#6b7280')+'"/>'}break;
      case 'g': o='<text x="24" y="16" font-size="12" font-weight="900" text-anchor="middle" fill="'+Y+'">D</text>'+pill(6,8,8,8,'R')+pill(34,8,8,8,'3');break;
      case 'st': o='<circle cx="24" cy="12" r="9" fill="none" stroke="#6b7280" stroke-width="2.4"/><circle cx="24" cy="12" r="2.6" fill="'+Y+'"/><path d="M15.2 12h6.2M26.6 12h6.2M24 14.6v6" stroke="#6b7280" stroke-width="2"/>';break;
      case 'lv': o='<rect x="22.5" y="3" width="3" height="18" rx="1.5" fill="#3a414d"/><text x="31" y="7" font-size="4" fill="#8a93a0">1</text><text x="31" y="13" font-size="4" fill="#8a93a0">N</text><text x="31" y="19" font-size="4" fill="#8a93a0">R</text>'+kn(24,9,3.2);break;
      case 'dp': o='<path d="M20 3h8v6h6v8h-6v6h-8v-6h-6V9h6z" fill="#2a303b" stroke="'+S+'" stroke-width=".5"/><path d="M24 5l2 3h-4z" fill="'+Y+'"/>';break;
      case 'xy': o='<rect x="14" y="2" width="20" height="20" rx="3" fill="'+D+'" stroke="'+S+'" stroke-width=".5"/><path d="M24 4v16M16 12h16" stroke="#2a303b" stroke-width=".5"/>'+kn(29,8,3.4);break;
      case 'xf': o='<rect x="5" y="4" width="4" height="16" rx="1" fill="#2a303b"/><rect x="5" y="10" width="4" height="10" rx="1" fill="'+G+'"/><rect x="39" y="4" width="4" height="16" rx="1" fill="#2a303b"/><rect x="39" y="13" width="4" height="7" rx="1" fill="'+G+'"/><rect x="12" y="10" width="24" height="5" rx="2.5" fill="'+D+'" stroke="'+S+'" stroke-width=".4"/>'+kn(20,12.5,3.4);break;
      case 'tl': o='<rect x="4" y="3" width="40" height="18" rx="3" fill="'+D+'" stroke="'+S+'" stroke-width=".5"/><path d="M7 15 C12 15 12 7 18 7 S24 13 30 13 S36 6 41 6" fill="none" stroke="'+Y+'" stroke-width="1.3"/><path d="M7 18 C14 18 16 11 24 11 S34 17 41 17" fill="none" stroke="#4DA3E0" stroke-width="1.1"/><path d="M21 4v16" stroke="#fff" stroke-width=".7"/>';break;
      case 'sw': o=ring(24,12,10,.35,Y)+'<rect x="20.5" y="9" width="7" height="8" rx="1.5" fill="'+Y+'"/><rect x="23" y="2.5" width="2" height="8" rx=".8" fill="'+Y+'" transform="rotate(35 24 13)"/>';break;
      case 'ax': o='<circle cx="24" cy="10.5" r="8.5" fill="#4a4e54" stroke="#0b0b0b" stroke-width=".7"/>';[[0,-4],[4,0],[0,4],[-4,0]].forEach(function(q){o+='<circle cx="'+(24+q[0])+'" cy="'+(10.5+q[1])+'" r="1.6" fill="#16181b" stroke="#c9ced6" stroke-width=".5"/>'});o+='<circle cx="24" cy="10.5" r="1.9" fill="#95571E"/><rect x="23.5" y="9.2" width="1" height="2.6" fill="#1b1208"/><rect x="22.7" y="10" width="2.6" height="1" fill="#1b1208"/>';for(var ax=0;ax<8;ax++) o+='<rect x="'+(14.4+ax*2.5+(ax>3?.6:0))+'" y="20.4" width="1.8" height="2.4" rx=".4" fill="'+(ax>3&&ax<7?(ax>5?PAL.o:PAL.g):'#2e3540')+'"/>';break;
      case 'ro': o='<circle cx="24" cy="12" r="10.5" fill="'+D+'" stroke="'+S+'" stroke-width=".6"/>';[0,120,240].forEach(function(a){o+='<path d="M24 12 L22.6 3.5 Q24 2.4 25.4 3.5Z" fill="#c9ced6" transform="rotate('+a+' 24 12)"/>'});o+='<circle cx="24" cy="12" r="2" fill="'+Y+'"/>';break;
      case 'z': o='<text x="24" y="15.5" font-size="8.5" font-weight="900" text-anchor="middle" fill="#e8e8ea">12:30</text>';break;
      case 'e': o='<circle cx="24" cy="12" r="9" fill="'+R+'"/><text x="24" y="13.6" font-size="4.4" font-weight="900" text-anchor="middle" fill="#fff">STOP</text>';break;
      case 'ps': o=ring(24,12,10,1,Y)+'<circle cx="24" cy="12" r="6.5" fill="#2a303b" stroke="'+Y+'" stroke-width=".6"/><text x="24" y="13.4" font-size="3.6" font-weight="900" text-anchor="middle" fill="#fff">START</text>';break;
    }
    return '<svg viewBox="0 0 48 24" aria-hidden="true">'+o+'</svg>';
  }
  // ---- 4 · Gamepad pictures (PS4 renders): front for the face buttons, back for L1/R1 and L2/R2 ----
  // render pixels: [x, y, hotspot radius, chip side (-1 left, 1 right, 2 below), chip y]
  // face buttons sit on the black centre dot of each cap in the render; D-pad keys on the middle of each key face
  var GPF={0:[765,216,32,1,226],1:[836,148,32,1,140],2:[691,147,32,1,312],3:[762,82,32,1,56],10:[304,262,52,2,668],11:[604,262,52,2,668],12:[161,96,30,-1,56],13:[158,195,30,-1,226],14:[107,141,30,-1,140],15:[211,141,30,-1,312]};
  var GPB={5:[130,296,30,-1,250],4:[742,296,30,1,250]}, GPT={7:[128,385],6:[743,385]};
  var GPSYM={0:'crs',1:'cir',2:'sq',3:'tri'}, GPSC={tri:'#4fd6a2',cir:'#ff6f73',crs:'#76a6ff',sq:'#ef8fd8'};
  function gpShort(a){if(!a) return '';var c0=a.charAt(0),i=+a.slice(1);
    if(a==='z') return tr2('Stop all');if(a==='R') return tr2('Record');if(a==='P') return tr2('Play');if(a==='rp') return tr2('Dial −');if(a==='rn') return tr2('Dial +');if(a==='rg') return tr2('Dial on/off');
    if(a.indexOf('s:')===0){var q=C.seq.filter(function(x){return x.id===a.slice(2)})[0];return '▶ '+(q?q.name:'').slice(0,12)}
    if(!C.ch[i]) return '';var t=tagOf(i);return c0==='l'?t+' '+tr2('light'):c0==='t'?t+' '+tr2('Turbo'):c0==='f'?t+' ▲':c0==='r'?t+' ▼':''}
  function gpSym(t,x,y,c){var a=' fill="none" stroke="'+c+'" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"',z=11;
    // triangle drawn around its centroid, so the centre dot sits in the middle of it
    if(t==='tri') return '<path d="M'+x+' '+(y-12)+' L'+(x+12)+' '+(y+6)+' L'+(x-12)+' '+(y+6)+' Z"'+a+'/>';
    if(t==='cir') return '<circle cx="'+x+'" cy="'+y+'" r="'+z+'"'+a+'/>';
    if(t==='crs') return '<path d="M'+(x-9)+' '+(y-9)+' L'+(x+9)+' '+(y+9)+' M'+(x+9)+' '+(y-9)+' L'+(x-9)+' '+(y+9)+'"'+a+'/>';
    return '<rect x="'+(x-9)+'" y="'+(y-9)+'" width="18" height="18" rx="2"'+a+'/>'}
  function gpChip(tx,ty,txt,fixed,sel,k){var w=Math.max(84,txt.length*17.5+40);
    return '<g class="chip"'+(k!=null?' data-b="'+k+'"':'')+'><rect x="'+(tx-w/2).toFixed(0)+'" y="'+(ty-25)+'" width="'+w.toFixed(0)+'" height="50" rx="25" fill="'+(sel?'#ffd84a':'#12151b')+'" stroke="'+(fixed?'#E24B4A':'#ffd84a')+'" stroke-width="2.5"/><text x="'+tx+'" y="'+(ty+10)+'" font-size="31" font-weight="600" text-anchor="middle" fill="'+(sel?'#2a1c00':fixed?'#ff8a88':'#ffd84a')+'">'+wesc(txt)+'</text></g>'}
  function gpChipX(side,w,x){return side<0?-196+w/2:side>0?1119-w/2:x}
  var GPSEL=-1;
  function v2GpDraw(){
    var host=$('#gpPic'),host2=$('#gpPic2');if(!host) return;var m=C.pad.map||{};
    var o='<svg viewBox="-200 -70 1323 850" aria-hidden="true"><defs><filter id="gpSh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000" flood-opacity=".75"/></filter></defs>';
    o+='<radialGradient id="gpGl" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#7cc4ff" stop-opacity=".85"/><stop offset=".45" stop-color="#3b9cff" stop-opacity=".35"/><stop offset="1" stop-color="#3b9cff" stop-opacity="0"/></radialGradient><ellipse id="gpGlow" cx="462" cy="22" rx="330" ry="80" fill="url(#gpGl)" opacity="0" style="transition:opacity .3s"/>';
    o+='<image href="img/ds4-front.webp" x="0" y="0" width="923" height="612" filter="url(#gpSh)"/>';
    Object.keys(GPSYM).forEach(function(b){var p=GPF[b];o+=gpSym(GPSYM[b],p[0],p[1],GPSC[GPSYM[b]])});
    var lines='',chips='';
    // fixed safety buttons
    [[8,271,60,'E-Stop'],[9,652,60,tr2('Release')]].forEach(function(q){var w=Math.max(84,q[3].length*17.5+40),tx=q[0]===8?q[1]-150:q[1]+150;
      lines+='<path d="M'+q[1]+' '+q[2]+' L'+tx+' -24" stroke="#5a6376" stroke-width="2" stroke-dasharray="5 5" fill="none"/>';chips+=gpChip(tx,-30,q[3],true,false)});
    var MTS={t:' · TOG',p:' · PP',a:' · ACC'};
    Object.keys(GPF).forEach(function(b){var p=GPF[b],sel=+b===GPSEL,t=gpShort(m[b]);if(t&&C.pad.mt&&C.pad.mt[b]) t+=MTS[C.pad.mt[b]];
      o+='<g class="gp-b'+(sel?' sel':'')+'" data-b="'+b+'"><circle class="rg" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(p[2]+3)+'"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(p[2]+12)+'" fill="transparent"/></g>';
      if(!t&&!sel) return;t=t||'+';var w=Math.max(84,t.length*17.5+40),tx=p[3]===2?(+b===10?p[0]-110:p[0]+110):gpChipX(p[3],w,p[0]),ty=p[4],ax=p[3]===2?tx:p[3]<0?tx+w/2:tx-w/2,ay=p[3]===2?ty-25:ty;
      lines+='<path d="M'+p[0]+' '+p[1]+' L'+ax+' '+ay+'" stroke="'+(sel?'#ffd84a':'#5a6376')+'" stroke-width="'+(sel?3:2)+'" fill="none"'+(sel?'':' stroke-dasharray="5 5"')+'/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+(sel?'#ffd84a':'#8a93a0')+'"/>';
      chips+=gpChip(tx,ty,t,false,sel,b)});
    stickLabelsPaint();
    // what each stick drives, in chips under the sticks
    [[0,304,262,200],[1,604,262,710]].forEach(function(q){var t=stickLabel(q[0]);if(!t) return;var w=Math.max(84,t.length*17.5+40),ty=748;
      lines+='<path d="M'+q[1]+' '+(q[2]+40)+' L'+q[3]+' '+(ty-25)+'" stroke="#5a6376" stroke-width="2" stroke-dasharray="5 5" fill="none"/>';
      chips+=gpChip(q[3],ty,(q[0]?'R ':'L ')+t,false,false)});
    host.innerHTML=o+lines+chips+'</svg>';
    if(host2){var o2='<svg viewBox="-200 -10 1271 470" aria-hidden="true"><defs><filter id="gpSh2" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".7"/></filter></defs><image href="img/ds4-back.webp" x="0" y="0" width="871" height="444" filter="url(#gpSh2)"/>',l2='',c2='';
      [[7,'R2'],[6,'L2']].forEach(function(q){var p=GPT[q[0]];o2+='<ellipse id="gpTg'+q[0]+'" cx="'+p[0]+'" cy="'+(p[1]+6)+'" rx="50" ry="66" fill="none" stroke="transparent" stroke-width="4"/>';
        var tx=q[0]===7?p[0]-150:p[0]+150,ch=C.pad.trig>=0&&C.ch[C.pad.trig]?tagOf(C.pad.trig)+(q[0]===7?' ▲':' ▼'):'';
        l2+='<path d="M'+p[0]+' '+p[1]+' L'+tx+' '+p[1]+'" stroke="#5a6376" stroke-width="2" stroke-dasharray="5 5" fill="none"/>';
        c2+='<g class="chip" data-t="1"><rect id="gpTc'+q[0]+'" x="'+(tx-48)+'" y="'+(p[1]-25)+'" width="96" height="50" rx="25" fill="#12151b" stroke="#5a6376" stroke-width="2.5"/><text x="'+tx+'" y="'+(p[1]+10)+'" font-size="30" font-weight="800" text-anchor="middle" fill="#c9ced6">'+q[1]+'</text></g>';
        if(ch) c2+='<text x="'+tx+'" y="'+(p[1]+56)+'" font-size="26" text-anchor="middle" fill="#ffd84a">'+wesc(ch)+'</text>'});
      Object.keys(GPB).forEach(function(b){var p=GPB[b],sel=+b===GPSEL,t=gpShort(m[b]);
        o2+='<g class="gp-b'+(sel?' sel':'')+'" data-b="'+b+'"><circle class="rg" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(p[2]+3)+'"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(p[2]+14)+'" fill="transparent"/></g>';
        var lab=(+b===4?'L1':'R1')+(t?' · '+t:''),w=Math.max(84,lab.length*17.5+40),tx=gpChipX(p[3],w,p[0])+(p[3]<0?0:152),ty=p[4];
        if(p[3]<0) tx=-196+w/2;else tx=1067-w/2;
        l2+='<path d="M'+p[0]+' '+p[1]+' L'+(p[3]<0?tx+w/2:tx-w/2)+' '+ty+'" stroke="'+(sel?'#ffd84a':'#5a6376')+'" stroke-width="'+(sel?3:2)+'" fill="none"'+(sel?'':' stroke-dasharray="5 5"')+'/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="'+(sel?'#ffd84a':'#8a93a0')+'"/>';
        c2+=gpChip(tx,ty,lab,false,sel,b)});
      host2.innerHTML=o2+l2+c2+'</svg>'}
    [host,host2].forEach(function(hh){if(!hh||hh._gpx) return;hh._gpx=1;hh.addEventListener('click',function(e){var t=e.target.closest('[data-b],[data-t]');if(!t) return;
      if(t.hasAttribute('data-t')){var sel=$('#gpTrig');if(sel){try{sel.scrollIntoView({block:'center',behavior:'smooth'});sel.focus()}catch(_){}}return}
      v2GpFocus(+t.getAttribute('data-b'),false)})});
    GPX.k=''}
  // live view: sticks, pressed buttons and triggers, straight from the gamepad
  var GPX={k:''};
  function gpxCol(f){return f>.8?'#E24B4A':f>.55?'#EF9F27':'#1D9E75'}
  // raw controller numbers (Gamepad › Raw input), only while that section is open
  function gpRawPaint(g){
    var bx=$('#gpRawBox'),el=$('#gpRaw');if(!bx||!el||!bx.open) return;
    var t;
    if(!g) t=tr2('No controller.');
    else{
      var on=[];(g.buttons||[]).forEach(function(b,i){if(b&&(b.pressed||b.value>.1)) on.push(i+(b.value>0&&b.value<1?'('+b.value.toFixed(2)+')':''))});
      Object.keys(GP.vk||{}).forEach(function(k){if(GP.vk[k]) on.push(k+'(Android)')});
      var all=padList();
      t=(all.length>1?all.map(function(p){return (p===g?'\u25b6 ':'  ')+(p.id||'').slice(0,40)}).join('\n')+'\n':'')+(g.id||'').slice(0,60)+'\nmapping: '+(g.mapping||'none')+'\n'+tr2('buttons pressed')+': '+(on.join(' ')||'-')+'\n'+tr2('axes')+': '+[].map.call(g.axes||[],function(v,i){return i+'='+(+v).toFixed(2)}).join('  ');
    }
    if(el.textContent!==t) el.textContent=t;
  }
  function gpxLive(g){
    gpRawPaint(g);
    var ax=g&&C.pad.on?(g.axes||[]):[],d=C.pad.dead/100;
    [['#gpL',0],['#gpR',2]].forEach(function(q){var p=$(q[0]);if(!p||!p.offsetWidth) return;var kn=p.querySelector('.knob'),dz=p.querySelector('.gpx-dz'),R=Math.max(8,(p.offsetWidth-kn.offsetWidth*0.6)/2-7);
      var x=+ax[q[1]]||0,y=+ax[q[1]+1]||0,m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
      var dzs=Math.round(kn.offsetWidth+2*R*d)+'px';if(dz.style.width!==dzs){dz.style.width=dzs;dz.style.height=dzs}
      var tr='translate('+(x*R).toFixed(1)+'px,'+(y*R).toFixed(1)+'px)';if(kn.style.transform!==tr){kn.style.transform=tr;kn.classList.toggle('rest',m<.02);kn.classList.toggle('kglow',m>.02);kn.style.setProperty('--g',Math.min(1,m).toFixed(2))}
      var v=$(q[0]+'V'),inDz=m>.02&&m<=d,t=inDz?tr2('dead zone')+' · 0':Math.round(padDz(x,d)*100)+' · '+Math.round(-padDz(y,d)*100);if(v.textContent!==t){v.textContent=t;v.classList.toggle('dz',inDz)}});
    var gl=$('#gpGlow');if(gl){var go=g?'1':'0';if(gl.getAttribute('opacity')!==go) gl.setAttribute('opacity',go)}
    var bt=g&&C.pad.on?g.buttons||[]:[],key='';
    PAD_BTNS.forEach(function(b){var x=bt[b];key+=((x&&(x.pressed||x.value>.5))||(g&&C.pad.on&&GP.vk[b]))?1:0});
    var l2=bt[6]?Math.round(bt[6].value*20):0,r2=bt[7]?Math.round(bt[7].value*20):0;key+='|'+l2+'|'+r2;
    if(GPX.k===key) return;GPX.k=key;
    PAD_BTNS.forEach(function(b,i){var on=key.charAt(i)==='1';Array.prototype.forEach.call(document.querySelectorAll('#gpPic .gp-b[data-b="'+b+'"],#gpPic2 .gp-b[data-b="'+b+'"]'),function(e){if(e.classList.contains('live')!==on) e.classList.toggle('live',on)})});
    [['#gpL2',l2,6,'−'],['#gpR2',r2,7,'+']].forEach(function(q){var bar=$(q[0]);if(!bar) return;if(!bar.children.length) for(var n=0;n<20;n++) bar.appendChild(document.createElement('i'));
      [].forEach.call(bar.children,function(c,j){var on=j<q[1];c.style.background=on?gpxCol((j+1)/20):'';c.style.boxShadow=on?'0 0 6px '+gpxCol((j+1)/20):''});
      $(q[0]+'O').textContent=(q[1]?q[3]:'')+(q[1]*5)+'%';
      var c=q[1]?gpxCol(q[1]/20):'transparent',el=$('#gpTg'+q[2]),tc=$('#gpTc'+q[2]);if(el){el.setAttribute('stroke',c);el.style.filter=q[1]?'drop-shadow(0 0 10px '+c+')':''}if(tc){tc.setAttribute('fill',q[1]?c:'#12151b');tc.setAttribute('stroke',q[1]?c:'#5a6376')}})}
  function v2GpFocus(b,press){
    var d=document.querySelector('#padCard details.adv');if(d) d.open=true;
    GPSEL=b;v2GpDraw();
    var rows=document.querySelectorAll('#gpMap .pm'),i=PAD_BTNS.indexOf(b),row=rows[i];
    Array.prototype.forEach.call(rows,function(r){r.classList.toggle('v2sel',r===row)});
    if(row){try{row.scrollIntoView({block:'center',behavior:'smooth'})}catch(_){}var sel=row.querySelector('select');if(sel&&!press) try{sel.focus()}catch(_){}}
    if(press) v2T($('#gpHint'),'Button '+BTN_NAMES[b]+' found: pick what it does.');
  }
  window.v2GpPress=function(b){if(V2.v==='m-pad'&&BTN_NAMES[b]) v2GpFocus(b,true)};
  (function(){var m=$('#gpMap');if(m) m.addEventListener('change',function(){v2GpDraw()})})();

  // ---- 11 · Quick settings: pull the status pill down (or hold it) ----
  var v2QS=null;
  function v2QuickOpen(){
    if(v2QS) return;
    var ov=document.createElement('div');ov.className='v2-qs';ov.id='v2QS';
    ov.innerHTML='<div class="qs-in" role="dialog" aria-label="Quick settings"><i class="qs-h" aria-hidden="true"></i><div class="qs-g"></div><button type="button" class="qs-es"></button></div>';
    var g=ov.querySelector('.qs-g');
    function tile(ic,label,on,fn,hold){
      var b=document.createElement('button');b.type='button';b.className='qs-t'+(on?' on':'');b.innerHTML=v2Ic(ic)+'<span></span>'+(hold?'<small></small>':'');
      b.querySelector('span').textContent=label;if(hold) b.querySelector('small').textContent='hold 2 s';
      if(hold) v2PlayHold(b,function(){fn();v2QuickClose()});else b.addEventListener('click',function(){fn();v2QuickClose()});
      g.appendChild(b);
    }
    tile('bt','Bluetooth',S.bt!==false,function(){$('#btBtn').click()});
    tile('cap','Practice',!!store.prefs.practice,function(){v2Practice(!store.prefs.practice)});
    tile('globe',store.prefs.lang==='ms'?'English':'Bahasa Melayu',false,function(){$('#sLang').click()});
    tile('sync',S.connected?'Disconnect':'Connect hub',!!S.connected,function(){v2Conn()});
    tile('vibe',store.prefs.ui==='light'?'Dark theme':'Light theme',false,function(){$('#sLight').click()});
    var es=ov.querySelector('.qs-es');
    if(S.estop){es.textContent='Release E-Stop (hold 1 s)';var t=0;es.addEventListener('pointerdown',function(){t=setTimeout(function(){setEstop(false);feedback('ok');v2QuickClose()},1000)});['pointerup','pointercancel','pointerleave'].forEach(function(ev){es.addEventListener(ev,function(){clearTimeout(t)})})}
    else{es.textContent='E-Stop';es.addEventListener('click',function(){setEstop(true);v2QuickClose()})}
    ov.addEventListener('click',function(e){if(e.target===ov) v2QuickClose()});
    var sy=0;ov.querySelector('.qs-h').addEventListener('pointerdown',function(e){sy=e.clientY});
    ov.addEventListener('pointerup',function(e){if(sy&&e.clientY-sy<-30) v2QuickClose();sy=0});
    document.body.appendChild(ov);v2QS=ov;requestAnimationFrame(function(){ov.classList.add('open')});feedback('ok');
  }
  function v2QuickClose(){if(!v2QS) return;var o=v2QS;v2QS=null;o.classList.remove('open');setTimeout(function(){o.remove()},180)}
  (function(){
    var pl=$('#v2Pill');if(!pl) return;var y0=0,t=0,fired=false;
    pl.addEventListener('pointerdown',function(e){y0=e.clientY;fired=false;clearTimeout(t);t=setTimeout(function(){fired=true;v2QuickOpen()},550)});
    pl.addEventListener('pointermove',function(e){if(y0&&!fired&&e.clientY-y0>26){fired=true;clearTimeout(t);v2QuickOpen()}});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){pl.addEventListener(ev,function(){clearTimeout(t);y0=0})});
    // a hold or pull opened the panel: do not also connect
    pl.addEventListener('click',function(e){if(fired){e.stopImmediatePropagation();e.preventDefault();fired=false}},true);
  })();

  // ---- 12 · Interactive guide: spotlight on the real controls, step by step ----
  var V2CO=[
    {t:'Welcome to MK6 Console',b:'Drive up to three Mould King 6.0 hubs from your phone. This guide shows the real buttons, step by step.',welcome:true},
    {v:'home',q:'#hubEmpty:not([hidden]), #hubCard',t:'Connect',b:'Turn the hub on, then tap Connect. Your hub, its wiring and the power budget are all here on Home.'},
    {v:'drive',q:'#boardGrid > .bdw:not(.v2-es):not([data-k=ps])',t:'Drive',b:'Move the controls to drive. Lift your finger and they go back to 0.'},
    {v:'drive',q:'#v2Pill',t:'E-Stop',b:'Press Volume Up to stop every motor at once. Tap the red banner to release.'},
    {v:'drive',q:'#bdEdit, #dbEdit',t:'Arrange the board',b:'Tap Edit to add, move or resize widgets. \u29C9 copies a widget, \u229E moves several together.'},
    {v:'drive',q:'#tabbar [data-tab=models]',t:'Your models',b:'Make your own board, start from a template, or share a model with a friend.'}
  ];
  var v2Co={i:0,el:null};
  function guideOpen(){v2Co.i=0;v2CoShow()}
  function guideClose(){
    if(v2Co.el){v2Co.el.remove();v2Co.el=null}
    if(!store.prefs.tour){store.prefs.tour=true;save()}
    if(!store.prefs.seen){store.prefs.seen=true;save()}
  }
  function guideRender(){if(v2Co.el) v2CoShow()}
  function v2CoShow(){
    var st=V2CO[v2Co.i];if(!st){guideClose();return}
    if(st.v&&V2.v!==st.v) v2Go(st.v);
    if(!v2Co.el){var ov=document.createElement('div');ov.id='guide';ov.className='v2-co';document.body.appendChild(ov);v2Co.el=ov}
    var ov=v2Co.el;ov.innerHTML='<div class="co-hole" hidden></div><i class="co-hand" hidden aria-hidden="true"></i><div class="co-card" role="dialog" aria-modal="true"><div class="co-dots"></div><b class="co-t"></b><p class="co-b"></p><div class="co-x"></div><div class="co-nav"><button type="button" class="btn" id="gSkip">Skip</button><span class="spacer"></span><button type="button" class="btn" id="gNext" aria-pressed="true"></button></div></div>';
    ov.querySelector('.co-t').textContent=st.t;ov.querySelector('.co-b').textContent=st.b;
    var dots=ov.querySelector('.co-dots');V2CO.forEach(function(_,n){var d=document.createElement('i');if(n===v2Co.i) d.className='on';dots.appendChild(d)});
    var nx=ov.querySelector('#gNext');nx.textContent=v2Co.i===V2CO.length-1?'Done':'Next';
    nx.addEventListener('click',function(){v2Co.i++;if(v2Co.i>=V2CO.length){guideClose();return}v2CoShow()});
    ov.querySelector('#gSkip').addEventListener('click',guideClose);
    if(st.welcome){
      var x=ov.querySelector('.co-x');
      [['en','English'],['ms','Bahasa Melayu']].forEach(function(l){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=l[1];b.setAttribute('aria-pressed',String(store.prefs.lang===l[0]));
        b.addEventListener('click',function(){if(store.prefs.lang!==l[0]){store.prefs.lang=l[0];save();applyLang();v2CoShow()}});x.appendChild(b)});
      var tw=document.createElement('button');tw.type='button';tw.className='btn';tw.textContent='Try without a hub';
      tw.addEventListener('click',function(){guideClose();v2Practice(true);if(!S.connected) v2Conn();v2Go('drive')});x.appendChild(tw);
      ov.classList.add('center');
    }else ov.classList.remove('center');
    setTimeout(v2CoPlace,140);
  }
  function v2CoPlace(){
    var ov=v2Co.el;if(!ov) return;var st=V2CO[v2Co.i],hole=ov.querySelector('.co-hole'),hand=ov.querySelector('.co-hand'),card=ov.querySelector('.co-card');
    var tg=null;if(st.q){var all=document.querySelectorAll(st.q);for(var ti=0;ti<all.length;ti++){if(all[ti].getClientRects().length){tg=all[ti];break}}}
    if(tg&&tg.getClientRects().length){
      try{tg.scrollIntoView({block:'center'})}catch(_){}
      var r=tg.getBoundingClientRect(),pad=8;
      hole.hidden=false;hole.style.left=(r.left-pad)+'px';hole.style.top=(r.top-pad)+'px';hole.style.width=(r.width+pad*2)+'px';hole.style.height=(r.height+pad*2)+'px';
      hole.style.borderRadius=Math.min(28,Math.max(r.width,r.height)/2+pad)+'px';
      hand.hidden=false;hand.style.left=(r.left+r.width*0.6)+'px';hand.style.top=(r.top+r.height*0.55)+'px';
      var below=r.top+r.height/2<innerHeight/2;
      card.style.top=below?Math.min(innerHeight-card.offsetHeight-12,r.bottom+18)+'px':'auto';card.style.bottom=below?'auto':Math.max(12,innerHeight-r.top+18)+'px';
    }else{hole.hidden=true;hand.hidden=true;card.style.top='';card.style.bottom=''}
  }
  window.addEventListener('resize',function(){if(v2Co.el) v2CoPlace()});
  // =====================================================================================
  // =====================================================================================
  // ---- 2 · Cruise: hold a control, tap Cruise, let go: the value stays until you touch that control again ----
  function v2Cruise(){
    if(CRZ.on){crzOff();toast('Cruise off. Held controls go back to 0.');v2CrzPaint();return}
    if(!S.connected){toast('Connect the hub first.');return}
    CRZ.on=true;CRZ.v={};feedback('ok');
    toast('Cruise on: a control you let go of keeps its value. Bring it back to the middle to stop it. Steering and lights still return.',5000);v2CrzPaint();
  }
  function v2CrzPaint(){
    var ks=Object.keys(CRZ.v),lab=CRZ.on?(ks.length?'Cruise \u00b7 '+ks.length:'Cruise on'):'Cruise';
    ['#dCruise','#dbCruise'].forEach(function(q){var b=$(q);if(!b) return;if(b.getAttribute('aria-pressed')!==String(CRZ.on)) b.setAttribute('aria-pressed',String(CRZ.on));var sp=b.querySelector('span')||b;v2T(sp,lab)});
    // widgets whose channel is being held by cruise show the held value
    var bg=$('#boardGrid');if(!bg) return;
    Array.prototype.forEach.call(bg.children,function(el){
      var c=el.getAttribute('data-c'),d=el.getAttribute('data-d'),v=null;
      if(c!=null&&CRZ.v[c]!=null&&rt.t[c]===0) v=CRZ.v[c];else if(d!=null&&CRZ.v[d]!=null&&rt.t[d]===0) v=CRZ.v[d];
      var tx=v==null?'':'CRUISE '+(v>0?'+':'')+Math.round(v);
      if((el.getAttribute('data-crz')||'')!==tx){if(tx) el.setAttribute('data-crz',tx);else el.removeAttribute('data-crz')}
    });
  }
  setInterval(function(){if(CRZ.on||document.querySelector('#boardGrid [data-crz]')) v2CrzPaint()},150);
  v2Click('#dCruise',v2Cruise);v2Click('#dbCruise',v2Cruise);

  // ---- 3 · Steering eases at speed (model settings) ----
  function v2SsGuess(){
    var st=-1,th=-1;C.board.forEach(function(it){if(typeof it.c!=='number') return;if(it.k==='st'&&st<0) st=it.c});
    C.board.forEach(function(it){if(typeof it.c!=='number'||it.c===st) return;if((it.k==='s'||it.k==='lv'||it.k==='g')&&th<0) th=it.c});
    var ix=activeIdx();if(st<0) st=ix[1]!=null?ix[1]:1;if(th<0) th=ix[0]!==st?ix[0]:(ix[1]||0);
    return {st:st,th:th};
  }
  function v2SsPaint(){
    if(!C.ss) C.ss={on:false,st:1,th:0,min:55};
    var on=!!(C.ss&&C.ss.on),b=$('#ssOn');if(!b) return;b.setAttribute('aria-checked',String(on));$('#ssRow').hidden=!on;
    ['#ssSt','#ssTh'].forEach(function(q,n){var sel=$(q),key=n?'th':'st',ix=activeIdx(),sig=ix.join(',');
      if(sel._sig!==sig){sel._sig=sig;sel.innerHTML='';ix.forEach(function(i){var o=document.createElement('option');o.value=i;o.textContent=tagOf(i)+' · '+(C.ch[i].name||'');sel.appendChild(o)})}
      if(String(sel.value)!==String(C.ss[key])) sel.value=String(C.ss[key])});
    Array.prototype.forEach.call(document.querySelectorAll('#ssMin .btn'),function(x){x.setAttribute('aria-pressed',String(+x.getAttribute('data-v')===C.ss.min))});
  }
  v2Click('#ssOn',function(){if(!C.ss.on){var g0=v2SsGuess();C.ss.st=g0.st;C.ss.th=g0.th}C.ss.on=!C.ss.on;save();v2SsPaint();feedback('ok')});
  ['#ssSt','#ssTh'].forEach(function(q,n){var e=$(q);if(e) e.addEventListener('change',function(){C.ss[n?'th':'st']=+e.value;save()})});
  Array.prototype.forEach.call(document.querySelectorAll('#ssMin .btn'),function(x){x.addEventListener('click',function(){C.ss.min=+x.getAttribute('data-v');save();v2SsPaint()})});

  // ---- 8 · Model icon & photo ----
  // model icons: Google Material Symbols, Rounded, filled (Apache License 2.0), drawn gold
  var V2MI={"car": "<path d=\"M200-204v44q0 16.67-11.74 28.33Q176.53-120 159.76-120q-16.76 0-28.26-11.67Q120-143.33 120-160v-304q0-4.67.5-9.33.5-4.67 2.5-9.67l78-236q6-19 21.75-30T258-760h444q19.5 0 35.25 11T759-719l78 236q2 5 2.5 9.67.5 4.66.5 9.33v304q0 16.67-11.74 28.33Q816.53-120 799.76-120 783-120 771-131.96T759-161v-43H200Zm3-330h554l-55-166H258l-55 166Zm82.76 220q23.24 0 38.74-15.75Q340-345.5 340-368q0-23.33-15.75-39.67Q308.5-424 286-424q-23.33 0-39.67 16.26Q230-391.47 230-368.24q0 23.24 16.26 38.74 16.27 15.5 39.5 15.5ZM675-314q23.33 0 39.67-15.75Q731-345.5 731-368q0-23.33-16.26-39.67Q698.47-424 675.24-424q-23.24 0-38.74 16.26-15.5 16.27-15.5 39.5 0 23.24 15.75 38.74Q652.5-314 675-314Z\"/>", "dig": "<path d=\"M150-170q-46.22 0-78.11-32.08Q40-234.17 40-280v-270q0-24.75 17.63-42.38Q75.25-610 100-610h230v-170q0-12.75 8.63-21.38Q347.25-810 360-810h177q45.42 0 77.21 32.08Q646-745.83 646-700l1 180h60v-60q0-11.79 4.6-22.84 4.61-11.05 12.4-19.16l41-42q11-11 26-9t22 16l124 233q8 15-.75 29.5T910-380H767q-24.75 0-42.37-17.63Q707-415.25 707-440v-20h-60v95q19 16 29.5 38.21T687-280q0 45.83-32.08 77.92Q622.83-170 577-170q-37 0-65.5-22T472-249H255q-11 35-39.5 57T150-170Zm-.19-60q20.81 0 35.5-14.32Q200-258.65 200-279.82q0-21.18-14.32-35.68-14.33-14.5-35.5-14.5-21.18 0-35.68 14.32-14.5 14.33-14.5 35.5 0 21.18 14.5 35.68t35.31 14.5Zm462.69-14.32q14.5-14.33 14.5-35.5 0-21.18-14.32-35.68-14.33-14.5-35.5-14.5-21.18 0-35.68 14.32-14.5 14.33-14.5 35.5 0 21.18 14.32 35.68 14.33 14.5 35.5 14.5 21.18 0 35.68-14.32ZM861-440l-84-154q-5 3-7.5 8t-2.5 11v135h94Zm-471-80h197v-180q0-21.25-14.37-35.63Q558.25-750 537-750H390v230Z\"/>", "crane": "<path d=\"M150-130q-45.83 0-77.92-32.08Q40-194.17 40-240q0-24.58 10.5-46.79T80-325v-165q0-12.75 8.63-21.38Q97.25-520 110-520h50v-210q0-12.75 8.63-21.38Q177.25-760 190-760h238q18.38 0 33.69 9.5Q477-741 484-724l170 400q7 15 11.5 30.95Q670-277.09 670-260q0 53.86-38.07 91.93Q593.86-130 540-130q-38.76 0-71.38-22T420-210H256q-10 35-39.5 57.5T150-130Zm740-40H770q-12.75 0-21.37-8.63Q740-187.25 740-200v-570q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v540h90q12.75 0 21.38 8.68 8.62 8.67 8.62 21.5 0 12.82-8.62 21.32-8.63 8.5-21.38 8.5Zm-704.5-34.32q14.5-14.33 14.5-35.5 0-21.18-14.32-35.68-14.33-14.5-35.5-14.5-21.18 0-35.68 14.32-14.5 14.33-14.5 35.5 0 21.18 14.32 35.68 14.33 14.5 35.5 14.5 21.18 0 35.68-14.32Zm404-6.06q20.5-20.38 20.5-49.5t-20.38-49.62q-20.38-20.5-49.5-20.5t-49.62 20.38q-20.5 20.38-20.5 49.5t20.38 49.62q20.38 20.5 49.5 20.5t49.62-20.38ZM343-391h217L429-700H220v180l123 129Z\"/>", "truck": "<path d=\"M140.5-195.42Q106-229.83 106-279H70q-12.75 0-21.37-8.63Q40-296.25 40-309v-431q0-24 18-42t42-18h519q24.75 0 42.38 17.62Q679-764.75 679-740v107h75q14.25 0 27 6.37 12.75 6.38 21 17.63l112 149q3 3.75 4.5 8.25T920-442v133q0 12.75-8.62 21.37Q902.75-279 890-279h-41q0 49-34.38 83.5t-83.5 34.5q-49.12 0-83.62-34.42Q613-229.83 613-279H342q0 49-34.38 83.5t-83.5 34.5q-49.12 0-83.62-34.42ZM265-238q17-17 17-41t-17-41q-17-17-41-17t-41 17q-17 17-17 41t17 41q17 17 41 17t41-17Zm507 0q17-17 17-41t-17-41q-17-17-41-17t-41 17q-17 17-17 41t17 41q17 17 41 17t41-17Zm-93-187h186L754-573h-75v148Z\"/>", "tractor": "<path d=\"M228-160q-78.02 0-133.01-55.61Q40-271.21 40-350.11 40-429 95.61-484.5q55.6-55.5 134.5-55.5 78.89 0 134.39 55.61 55.5 55.6 55.5 134.5 0 78.89-56.16 134.39Q307.68-160 228-160Zm2.12-120q-29.12 0-49.62-20.38-20.5-20.38-20.5-49.5t20.38-49.62q20.38-20.5 49.5-20.5t49.62 20.38q20.5 20.38 20.5 49.5t-20.38 49.62q-20.38 20.5-49.5 20.5ZM785.5-160q-56.5 0-96-38.66Q650-237.31 650-292q0-57.17 40.41-97.59Q730.83-430 788-430q54.69 0 93.34 39.54Q920-350.93 920-295q0 57-39 96t-95.5 39ZM145-599q-11.48 0-19.24-9-7.76-9-7.76-21t7.76-21q7.76-9 19.24-9h149q25.16 0 43.08 17.5Q355-624 360-599H145Zm177 341.12q38-37.88 38-92T322.12-442q-37.88-38-92-38T138-442.12q-38 37.88-38 92T137.88-258q37.88 38 92 38T322-257.88Zm516 16.06q22-21.83 22-53Q860-326 838.18-348q-21.83-22-53-22Q754-370 732-348.18q-22 21.83-22 53Q710-264 731.82-242q21.83 22 53 22Q816-220 838-241.82ZM448-320h174q15-63 63.5-100T791-457q20.27 0 40.14 5Q851-447 870-436v-223q0-24.75-17.62-42.38Q834.75-719 810-719H538l-49-49 53-53q4-3.82 4-8.91t-3.86-9.09q-3.85-4-9-4-5.14 0-9.14 4L401-716q-4 4-4 9.5t3.86 9.5q3.85 4 9 4 5.14 0 9.14-4l52-52 49 47.64V-597q0 41.66-28.5 71.33T421-496h-26q30 32 43.5 73.5T450-337q0 5-.5 8.5T448-320Z\"/>", "boat": "<path d=\"m161-467 228-331q5-7 11.5-9t13.5 0q7 2 11.5 7.5T430-786v336q0 13-8.5 21.5T400-420H186q-9 0-16-4.5T159-436q-4-7-3.5-15t5.5-16Zm392 47q-33 0-29-27.5t9-44.5q9-42 13-86t4-92q0-46-4-90t-13-87q-2-10 1-18.5t10-13.5q7-5 16-6t17 4q41 24 84.5 75t69.5 91q41 63 64.5 125T827-453q2 14-7 23.5t-23 9.5H553ZM360-196q-29 0-53.5-15T259-245q-5-4-9.5-5.5T240-252q-5 0-9.5 1.5T221-245q-12 10-25 18.5T169-213q-20-13-39.5-34.5T98-295q-7-15-.5-30t26.5-15h712q16 0 24.5 12.5T864-300q-8 23-30.5 48.5T791-213q-15-5-27.5-13.5T739-245q-5-4-9.5-5.5T720-252q-5 0-9.5 1.5T701-245q-23 19-47.5 34T600-196q-29 0-53.5-15T499-245q-5-4-9.5-5.5T480-252q-5 0-9.5 1.5T461-245q-23 19-47.5 34T360-196ZM480-80q-30 23-60.5 31.5T360-40q-29 0-59.5-8.5T240-80q-31 24-61.5 32T110-40q-13 0-21.5-8.5T80-70q0-19 12.5-24.5T120-100q29 0 55-11t49-27q4-2 7.5-3.5t8.5-1.5q5 0 8.5 1.5t7.5 3.5q24 16 49.5 27t54.5 11q29 0 55-11t49-27q4-2 7.5-3.5t8.5-1.5q5 0 8.5 1.5t7.5 3.5q24 16 49.5 27t54.5 11q29 0 55-11t49-27q2-1 16-5 4 0 16 5 23 16 49 27t55 11q15 0 27.5 5.5T880-70q0 19-12.5 24.5T840-40q-29 0-59.5-8.5T720-80q-30 23-60.5 31.5T600-40q-29 0-59.5-8.5T480-80Z\"/>"};
  var V2MIN={car:'Car',dig:'Loader',crane:'Forklift',truck:'Truck',tractor:'Tractor',boat:'Sailboat'};
  function v2MiSvg(k){return '<svg class="mi" viewBox="0 -960 960 960" aria-hidden="true">'+V2MI[k]+'</svg>'}
  function v2Avatar(cfg,big){
    if(cfg&&cfg.photo) return '<span class="v2-av'+(big?' big':'')+'"><img alt="" src="'+cfg.photo+'"></span>';
    if(cfg&&cfg.icon&&V2MI[cfg.icon]) return '<span class="v2-av ic'+(big?' big':'')+'">'+v2MiSvg(cfg.icon)+'</span>';
    // no photo or icon: the model's initials
    var ini=v2Ini(profLbl(activeProfile()||{}));
    return ini?'<span class="v2-av ini'+(big?' big':'')+'">'+ini+'</span>':'';
  }
  function v2Ini(n){
    var w=String(n||'').replace(/[^\p{L}\p{N} ]/gu,' ').trim().split(/\s+/).filter(Boolean);
    if(!w.length) return '';
    var s=w.length>1?w[0].charAt(0)+w[1].charAt(0):w[0].slice(0,2);
    return s.toUpperCase().replace(/[<>&"']/g,'');
  }
  (function(){
    var box=$('#mIcons');if(!box) return;
    [''].concat(Object.keys(V2MI)).forEach(function(k){
      var b=document.createElement('button');b.type='button';b.className='v2-icb';b.setAttribute('data-ic',k);b.setAttribute('aria-label',k?V2MIN[k]:'No icon');
      b.innerHTML=k?v2MiSvg(k):'<span class="v2-noic">—</span>';
      b.addEventListener('click',function(){C.icon=k;save();v2MiPaint();feedback('ok')});box.appendChild(b);
    });
  })();
  function v2MiPaint(){
    Array.prototype.forEach.call(document.querySelectorAll('#mIcons .v2-icb'),function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-ic')===(C.icon||'')))});
    var px=$('#mPhotoX');if(px) px.hidden=!C.photo;
    // the knob next to the model name shows the photo or icon
    var sig=(C.photo?C.photo.length:0)+'|'+(C.icon||'')+'|'+store.active+'|'+profLbl(activeProfile()||{});
    Array.prototype.forEach.call(document.querySelectorAll('.v2-mchip .v2-knob, #scrHome .v2-knob'),function(kn){
      if(kn._sig===sig) return;kn._sig=sig;var av=v2Avatar(C,!kn.classList.contains('sm'));kn.innerHTML=av?av:'';kn.classList.toggle('has-av',!!av)});
  }
  var v2PhotoWant=false;
  function v2PhotoSet(url){
    if(!url){toast('No image was chosen.');return}
    var img=new Image();img.onload=function(){
      // 512 px square, scaled down in halves for a sharp result (one big jump makes it soft)
      var S0=512,side=Math.min(img.width,img.height),sx=(img.width-side)/2,sy=(img.height-side)/2;
      var src=document.createElement('canvas');src.width=src.height=side;src.getContext('2d').drawImage(img,sx,sy,side,side,0,0,side,side);
      while(src.width/2>=S0){var h2=document.createElement('canvas');h2.width=h2.height=Math.round(src.width/2);var g2=h2.getContext('2d');g2.imageSmoothingEnabled=true;g2.imageSmoothingQuality='high';g2.drawImage(src,0,0,h2.width,h2.height);src=h2}
      var c=document.createElement('canvas'),n0=Math.min(S0,src.width);c.width=c.height=n0;var g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(src,0,0,n0,n0);
      var q=.88,du=c.toDataURL('image/jpeg',q);while(du.length>400000&&q>.5){q-=.08;du=c.toDataURL('image/jpeg',q)}
      C.photo=du;save();v2MiPaint();v2Models();toast('Photo set for this model.');
    };img.onerror=function(){toast('That image could not be read.')};img.src=url;
  }
  (function(){var ow=window.onWallpaper;window.onWallpaper=function(slot,url){if(slot==='m'||v2PhotoWant){v2PhotoWant=false;v2PhotoSet(url);return}return ow.apply(this,arguments)}})();
  v2Click('#mPhoto',function(){
    if(NB&&NB.pickWallpaper){v2PhotoWant=true;try{NB.pickWallpaper('m')}catch(e){v2PhotoWant=false;toast('Could not open the image picker.')}return}
    var f=document.createElement('input');f.type='file';f.accept='image/*';
    f.addEventListener('change',function(){var file=f.files&&f.files[0];if(!file) return;var u=URL.createObjectURL(file);v2PhotoSet(u);setTimeout(function(){URL.revokeObjectURL(u)},5000)});f.click();
  });
  v2Click('#mPhotoX',function(){C.photo='';save();v2MiPaint();v2Models();toast('Photo removed.')});

  // ---- 7 · Practice simulator: a virtual model drives on screen with your controls ----
  var V2SIM={x:.5,y:.6,a:-Math.PI/2,v:0,tr:[],raf:0,last:0};
  function v2SimOn(){return !!S.connected&&!RH()&&V2.v==='drive'&&!document.hidden&&!R2.classList.contains('dash')}
  function v2SimLoop(t){
    V2SIM.raf=0;var box=$('#dSim'),cv=$('#simCv');if(!box||!cv) return;
    var on=v2SimOn();if(box.hidden===on) box.hidden=!on;if(!on){V2SIM.last=0;return}
    var dt=V2SIM.last?Math.min(.05,(t-V2SIM.last)/1000):0;V2SIM.last=t;
    var W=cv.clientWidth,H=cv.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
    if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
    var g0=(C.ss&&C.ss.on)?{st:C.ss.st,th:C.ss.th}:v2SsGuess(),thr=(rt.o[g0.th]||0)/100,str=(rt.o[g0.st]||0)/100;
    V2SIM.v+=(thr*120-V2SIM.v)*Math.min(1,dt*3);
    V2SIM.a+=str*2.4*dt*(V2SIM.v/120)*(Math.abs(V2SIM.v)>2?1:0);
    V2SIM.x+=Math.cos(V2SIM.a)*V2SIM.v*dt/W;V2SIM.y+=Math.sin(V2SIM.a)*V2SIM.v*dt/H;
    V2SIM.x=(V2SIM.x+1)%1;V2SIM.y=(V2SIM.y+1)%1;
    if(Math.abs(V2SIM.v)>3){V2SIM.tr.push([V2SIM.x,V2SIM.y]);if(V2SIM.tr.length>90) V2SIM.tr.shift()}
    var c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
    c.strokeStyle='rgba(150,160,175,.10)';c.lineWidth=1;for(var gx=0;gx<W;gx+=28){c.beginPath();c.moveTo(gx+.5,0);c.lineTo(gx+.5,H);c.stroke()}for(var gy=0;gy<H;gy+=28){c.beginPath();c.moveTo(0,gy+.5);c.lineTo(W,gy+.5);c.stroke()}
    c.fillStyle='rgba(255,216,74,.35)';V2SIM.tr.forEach(function(p,n){if(n%3) return;c.beginPath();c.arc(p[0]*W,p[1]*H,1.4,0,7);c.fill()});
    var lit=false;for(var li=0;li<C.ch.length;li++) if(C.ch[li]&&C.ch[li].kind==='light'&&Math.abs(rt.o[li]||0)>1) lit=true;
    c.save();c.translate(V2SIM.x*W,V2SIM.y*H);c.rotate(V2SIM.a);
    var big=C.icon==='truck'||C.icon==='crane',L=big?40:30,Wd=big?18:16,col=ACC[C.accent||0];
    if(lit){var lg=c.createRadialGradient(L/2+16,0,2,L/2+16,0,30);lg.addColorStop(0,'rgba(255,240,180,.55)');lg.addColorStop(1,'rgba(255,240,180,0)');c.fillStyle=lg;c.beginPath();c.moveTo(L/2,-6);c.lineTo(L/2+44,-20);c.lineTo(L/2+44,20);c.lineTo(L/2,6);c.fill()}
    c.fillStyle='#111';[[-L/2+4,-Wd/2-3],[L/2-11,-Wd/2-3],[-L/2+4,Wd/2-1],[L/2-11,Wd/2-1]].forEach(function(p){c.fillRect(p[0],p[1],8,4)});
    c.fillStyle=col;c.beginPath();if(c.roundRect) c.roundRect(-L/2,-Wd/2,L,Wd,4);else c.rect(-L/2,-Wd/2,L,Wd);c.fill();
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(L/2-12,-Wd/2+3,7,Wd-6);
    if(C.icon==='dig'||C.icon==='crane'){c.strokeStyle='#e8e8ea';c.lineWidth=2.4;c.beginPath();c.moveTo(0,0);c.lineTo(L/2+10,-6);c.stroke()}
    c.restore();
    V2SIM.raf=requestAnimationFrame(v2SimLoop);
  }
  function v2SimKick(){if(!V2SIM.raf&&v2SimOn()) V2SIM.raf=requestAnimationFrame(v2SimLoop);else if(!v2SimOn()){var b=$('#dSim');if(b&&!b.hidden) b.hidden=true}}
  (function(){var cv=$('#simCv');if(cv) cv.addEventListener('click',function(){V2SIM.x=.5;V2SIM.y=.6;V2SIM.a=-Math.PI/2;V2SIM.v=0;V2SIM.tr=[]})})();

  // ---- 9 · Undo / Redo while editing the board (up to 20 steps) ----
  var V2UN={u:[],r:[],cur:null,on:false};
  (function(){
    var bar=document.createElement('div');bar.className='v2-undo';bar.id='v2Undo';bar.hidden=true;
    bar.innerHTML='<button type="button" class="btn" id="unU" aria-label="Undo"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6L4.5 10.5 9 15"/><path d="M5 10.5h9a5.5 5.5 0 0 1 0 11h-3"/></svg><span>Undo</span></button><button type="button" class="btn" id="unR" aria-label="Redo"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l4.5 4.5L15 15"/><path d="M19 10.5h-9a5.5 5.5 0 0 0 0 11h3"/></svg><span>Redo</span></button>';
    var grip=document.createElement('button');grip.type='button';grip.className='v2-ugrip';grip.setAttribute('aria-label','Move the undo bar');grip.title='Drag to move \u00b7 double-tap to put back';
    grip.innerHTML='<svg viewBox="0 0 12 20" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="4" r="1.6"/><circle cx="9" cy="4" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="9" cy="10" r="1.6"/><circle cx="3" cy="16" r="1.6"/><circle cx="9" cy="16" r="1.6"/></g></svg>';
    bar.insertBefore(grip,bar.firstChild);
    document.body.appendChild(bar);
    /* the bar can be dragged anywhere by its grip; the spot is kept per orientation; double-tap the grip to put it back */
    var UPK='mk6UndoPos';
    function upAll(){try{return JSON.parse(localStorage.getItem(UPK)||'{}')||{}}catch(_){return {}}}
    // portrait and the landscape dashboard each keep their own spot
    function upKey(){return document.documentElement.classList.contains('dash')?'l':'p'}
    function upCan(){return true}
    function upPlace(){
      bar.classList.toggle('canmove',upCan());var p=upCan()?upAll()[upKey()]:null;
      if(!p){bar.classList.remove('moved');bar.style.left='';bar.style.top='';return}
      var r=bar.getBoundingClientRect(),w=r.width||220,h=r.height||50;
      var x=Math.max(4,Math.min(window.innerWidth-w-4,p[0]*window.innerWidth)),y=Math.max(4,Math.min(window.innerHeight-h-4,p[1]*window.innerHeight));
      bar.classList.add('moved');bar.style.left=Math.round(x)+'px';bar.style.top=Math.round(y)+'px';
    }
    var dg=null,lastTap=0;
    grip.addEventListener('pointerdown',function(e){if(!upCan()) return;var r=bar.getBoundingClientRect();dg={dx:e.clientX-r.left,dy:e.clientY-r.top,moved:false};try{grip.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
    grip.addEventListener('pointermove',function(e){if(!dg) return;var r=bar.getBoundingClientRect();
      var x=Math.max(4,Math.min(window.innerWidth-r.width-4,e.clientX-dg.dx)),y=Math.max(4,Math.min(window.innerHeight-r.height-4,e.clientY-dg.dy));
      if(!dg.moved&&Math.abs(x-r.left)+Math.abs(y-r.top)<3) return;dg.moved=true;bar.classList.add('moved','dragging');bar.style.left=Math.round(x)+'px';bar.style.top=Math.round(y)+'px'});
    function upEnd(){if(!dg) return;var mv=dg.moved;dg=null;bar.classList.remove('dragging');
      if(mv){var r=bar.getBoundingClientRect(),all=upAll();all[upKey()]=[r.left/window.innerWidth,r.top/window.innerHeight];try{localStorage.setItem(UPK,JSON.stringify(all))}catch(_){}}
      else{var now=Date.now();if(now-lastTap<400){var a2=upAll();delete a2[upKey()];try{localStorage.setItem(UPK,JSON.stringify(a2))}catch(_){}upPlace();feedback('ok')}lastTap=now}}
    grip.addEventListener('pointerup',upEnd);grip.addEventListener('pointercancel',upEnd);
    window.addEventListener('resize',function(){setTimeout(upPlace,60)});
    try{new MutationObserver(function(){if(!bar.hidden) upPlace()}).observe(document.documentElement,{attributes:true,attributeFilter:['class']})}catch(_){}
    bar.upPlace=upPlace;
    function apply(js){V2UN.cur=js;var o;try{o=JSON.parse(js)}catch(_){return}C.board=o.b;if(o.c&&o.c.length===C.ch.length) C.ch=o.c;save();try{syncAll()}catch(_){syncBoard()}feedback('ok');v2UnPaint()}
    $('#unU').addEventListener('click',function(){v2UnCheck();if(!V2UN.u.length) return;V2UN.r.push(V2UN.cur);apply(V2UN.u.pop())});
    $('#unR').addEventListener('click',function(){v2UnCheck();if(!V2UN.r.length) return;V2UN.u.push(V2UN.cur);apply(V2UN.r.pop())});
  })();
  function v2UnCheck(){
    if(!bdEditing){if(V2UN.on){V2UN.on=false;V2UN.u=[];V2UN.r=[];V2UN.cur=null}return}
    var js=JSON.stringify({b:C.board,c:C.ch});
    if(!V2UN.on){V2UN.on=true;V2UN.cur=js;V2UN.u=[];V2UN.r=[];return}
    if(js!==V2UN.cur){V2UN.u.push(V2UN.cur);if(V2UN.u.length>20) V2UN.u.shift();V2UN.r=[];V2UN.cur=js}
  }
  function v2UnPaint(){
    var bar=$('#v2Undo');if(!bar) return;var show=!!bdEditing&&V2.v==='drive';if(bar.hidden===show){bar.hidden=!show;v2Tog(document.documentElement,'v2-unon',show);if(show&&bar.upPlace) bar.upPlace()}
    var mv=!!document.querySelector('#boardGrid .moving');if(bar.classList.contains('under')!==mv) bar.classList.toggle('under',mv);
    var u=$('#unU'),r=$('#unR');if(u.disabled!==!V2UN.u.length) u.disabled=!V2UN.u.length;if(r.disabled!==!V2UN.r.length) r.disabled=!V2UN.r.length;
  }
  setInterval(function(){v2UnCheck();v2UnPaint()},250);

  // ---- 12 · Focus mode (landscape): only the controls, E-Stop and a small status ----
  function v2Focus(){var on=!!store.prefs.focus;v2Tog(R2,'v2-focus',on);var b=$('#dbFocus');if(b&&b.getAttribute('aria-pressed')!==String(on)) b.setAttribute('aria-pressed',String(on))}
  v2Click('#dbFocus',function(){store.prefs.focus=!store.prefs.focus;save();v2Focus();feedback('ok');if(store.prefs.focus) toast('Focus mode. Tap the focus button at the top to leave.',3000)});

  // ---- 4 · Reconnect when the app is opened, if the hub link was on last time ----
  setTimeout(function(){
    if(store.prefs.relink&&store.prefs.linkOn&&RH()&&!S.connected&&S.bt!==false&&!S.estop&&!bdEditing&&store.prefs.seen){
      link.click();toast('Reconnecting the hub from last time. Motors are at zero.',4000);
    }
  },900);
  // =====================================================================================
  /* landscape bar: fits between the hub pill and E-Stop, never covers either */
  (function(){
    var bar=$('#dashBar');if(!bar) return;
    function fit(){
      var de=document.documentElement;
      if(!de.classList.contains('dash-l')){if(bar.style.left){bar.style.left='';bar.style.maxWidth='';bar.style.width=''}return}
      var p=$('#v2Pill'),e=$('#estop'),L=12,R=window.innerWidth-12;
      if(p){var pr=p.getBoundingClientRect();if(pr.width) L=pr.right+8}
      if(e){var er=e.getBoundingClientRect();if(er.width) R=er.left-8}
      var l=Math.round(L)+'px',w=Math.max(0,Math.round(R-L))+'px';
      if(bar.style.left!==l||bar.style.width!==w){bar.style.left=l;bar.style.width=w;bar.style.maxWidth=w}
    }
    window.addEventListener('resize',fit);
    try{new MutationObserver(fit).observe(document.documentElement,{attributes:true,attributeFilter:['class']})}catch(_){}
    try{var ro=new ResizeObserver(fit);['#v2Pill','#estop'].forEach(function(q){var el=$(q);if(el) ro.observe(el)})}catch(_){}
    setInterval(fit,1000);fit();
  })();
  // the first syncAll() runs before the board is set up; draw the board once everything exists
  try{syncBoard()}catch(_){}
  v2Theme();
  v2Go('home');
  applyLang();
  if(!store.prefs.seen) guideOpen();
  window.mk6Ready=true;

  // Update rate: 20 Hz while driving or touching, 4 Hz when idle, 1 Hz when the page is hidden (saves battery).
  var tkT=0,tkD=50;
  function tkBusy(){
    if(S.rec||S.play||ptrDown>0||bdEditing) return true;
    if(performance.now()-lastInput<3000) return true;
    if(tiltActive()||(C.pad&&C.pad.on&&GP.had)) return true;
    for(var i=0;i<NMAX;i++) if(isActive(i)&&C.ch[i].kind!=='light'&&(rt.t[i]!==0||Math.round(rt.o[i])!==0)) return true;
    return false;
  }
  function tkLoop(){
    clearTimeout(tkT);
    try{tick()}catch(e){}
    tkD=document.hidden?1000:(tkBusy()?50:250);
    tkT=setTimeout(tkLoop,tkD);
  }
  function tkWake(){if(tkD>50){tkD=50;tkLoop()}}
  document.addEventListener('visibilitychange',function(){if(!document.hidden) tkWake()});
  window.mk6Rate=function(){return tkD};
  tkLoop();
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 3 ---- */
try{
(function(){
  var sel='.pad, .bdw input[type=range], .pwr';
  document.addEventListener('pointerdown',function(e){var t=e.target&&e.target.closest&&e.target.closest(sel);if(t)t.classList.add('touch')},true);
  function off(){var l=document.querySelectorAll('.touch');for(var i=0;i<l.length;i++)l[i].classList.remove('touch')}
  document.addEventListener('pointerup',off,true);document.addEventListener('pointercancel',off,true);window.addEventListener('blur',off);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 4 ---- */
try{
(function(){
  // scale the joystick design with the pad: 300px single / 230px double = 1
  function fit(p){var w=p.offsetWidth;if(!w)return;var ref=p.closest('.bd-pads,.cols.dual,.pads')?230:300;p.style.setProperty('--s',(w/ref).toFixed(3))}
  var ro=window.ResizeObserver?new ResizeObserver(function(es){es.forEach(function(e){fit(e.target)})}):null;
  // new pads are registered with the ResizeObserver, which sizes them after layout (no forced layout on every DOM change)
  function scan(){var l=document.querySelectorAll('.pad');for(var i=0;i<l.length;i++){var p=l[i];if(!p._ro){p._ro=1;if(ro)ro.observe(p);else fit(p)}}}
  var scT=0;function scanSoon(){if(scT) return;scT=requestAnimationFrame(function(){scT=0;scan()})}
  // only look again when something that holds a pad was added (not on every text change)
  new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++){var nd=a[j];if(nd.nodeType===1&&(nd.classList.contains('pad')||nd.querySelector('.pad'))){scanSoon();return}}}}).observe(document.body,{childList:true,subtree:true});
  if(!ro) window.addEventListener('resize',function(){var l=document.querySelectorAll('.pad');for(var i=0;i<l.length;i++) fit(l[i])});
  scan();
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 5 ---- */
try{
(function(){
  // Hard lock: while a finger is on a joystick pad, the page must never scroll (some Android WebViews ignore touch-action)
  var lock=false;
  function onPad(e){var t=e.target;return !!(t&&t.closest&&t.closest('.pad'))}
  document.addEventListener('touchstart',function(e){lock=onPad(e);if(lock&&e.cancelable) e.preventDefault()},{passive:false,capture:true});
  document.addEventListener('touchmove',function(e){if((lock||onPad(e))&&e.cancelable) e.preventDefault()},{passive:false,capture:true});
  document.addEventListener('touchend',function(e){if(!e.touches||!e.touches.length) lock=false},{passive:true,capture:true});
  document.addEventListener('touchcancel',function(){lock=false},{passive:true,capture:true});
  // Second guard: while a joystick or a board slider is held, keep the page exactly where it was
  var held=0, hy=0, hx=0;
  function ctl(t){return !!(t&&t.closest&&t.closest('.pad, .bdw input[type=range], .pwr'))}
  document.addEventListener('pointerdown',function(e){if(ctl(e.target)){held++;hy=window.scrollY;hx=window.scrollX}},true);
  function rel(){held=0}
  document.addEventListener('pointerup',rel,true);document.addEventListener('pointercancel',rel,true);window.addEventListener('blur',rel);
  window.addEventListener('scroll',function(){if(held&&(window.scrollY!==hy||window.scrollX!==hx)) window.scrollTo(hx,hy)},{passive:true});
  // A range input that keeps focus makes Android WebView scroll it into view every time its value is
  // updated from code (e.g. a slider that mirrors a joystick). Never let sliders keep focus.
  function dropFocus(){var a=document.activeElement;if(a&&a.tagName==='INPUT'&&a.type==='range'){try{a.blur()}catch(_){}}}
  document.addEventListener('pointerup',function(){setTimeout(dropFocus,0)},true);
  document.addEventListener('pointercancel',function(){setTimeout(dropFocus,0)},true);
  document.addEventListener('pointerdown',function(e){if(e.target&&e.target.closest&&e.target.closest('.pad')) dropFocus()},true);
  document.addEventListener('focusin',function(e){var t=e.target;if(t&&t.tagName==='INPUT'&&t.type==='range'&&!held) setTimeout(function(){if(!held&&document.activeElement===t) dropFocus()},0)},true);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 6 ---- */
try{
(function(){
  // Slider glow follows the slider value: 0 = no glow, 100 = full glow. Sliders of the same channel match.
  function g(el){var mn=+el.min,mx=+el.max,v=+el.value;if(!(mx>mn))return;var z=mn<0?0:mn,span=Math.max(mx-z,z-mn)||1;
    var q=Math.min(1,Math.abs(v-z)/span).toFixed(2);if(el._g!==q){el._g=q;el.style.setProperty('--g',q)}}
  var AL=null,agen=-1,aT=0;
  function all(){var nw=Date.now();if(!AL||agen!==window.__bdGen||nw-aT>1000){agen=window.__bdGen;aT=nw;AL=document.querySelectorAll('.bdw input[type=range], .pwr')}for(var i=0;i<AL.length;i++)g(AL[i])}
  document.addEventListener('input',function(e){var t=e.target;if(t&&t.matches&&t.matches('.bdw input[type=range], .pwr'))g(t)},true);
  setInterval(all,80);all();
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 7 ---- */
try{
(function(){
  var SEL='.bdw input[type=range], .pwr';
  // Double-tap a slider: back to 0
  var last=null;
  document.addEventListener('pointerup',function(e){
    var t=e.target;if(!(t&&t.matches&&t.matches(SEL))) return;
    var now=Date.now();
    if(last&&last.el===t&&now-last.t<320&&Math.abs(e.clientX-last.x)<30&&Math.abs(e.clientY-last.y)<30){
      last=null;
      setTimeout(function(){if(+t.value!==0){t.value='0';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}))}},0);
      return;
    }
    last={el:t,t:now,x:e.clientX,y:e.clientY};
  },true);
  // Short vibration when a slider passes through 0 (follows the Vibration setting)
  function tick(){
    var hp=true;try{hp=JSON.parse(localStorage.getItem('mk6v2')||'{}').prefs.haptic!==false}catch(_){}
    if(!hp) return;
    var nb=window.MK6Bridge;
    if(nb&&nb.haptic){try{nb.haptic('tick')}catch(_){}}else if(navigator.vibrate){try{navigator.vibrate(13)}catch(_){}}
  }
  document.addEventListener('input',function(e){
    var t=e.target;if(!(t&&t.matches&&t.matches(SEL))) return;
    var v=+t.value, sg=v>0?1:v<0?-1:0, p=t._sg;
    if(p!==undefined&&p!==0&&sg!==p) tick();
    t._sg=sg;
  },true);
  document.addEventListener('pointerdown',function(e){var t=e.target;if(t&&t.matches&&t.matches(SEL)){var v=+t.value;t._sg=v>0?1:v<0?-1:0}},true);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 8 ---- */
try{
(function(){
  function p(el){var mn=+el.min||0,mx=+el.max||100,v=+el.value;var q=mx>mn?((v-mn)/(mx-mn)*100):0;var t=q.toFixed(1)+'%';if(el._p!==t){el._p=t;el.style.setProperty('--p',t)}}
  function all(){var l=document.querySelectorAll('main input[type=range]:not(.pwr)');for(var i=0;i<l.length;i++) if(!l[i].closest('.bdw')) p(l[i])}
  document.addEventListener('input',function(e){var t=e.target;if(t&&t.type==='range'&&!t.classList.contains('pwr')) p(t)},true);
  setInterval(all,300);all();
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 9 ---- */
try{
(function(){
  // Light the pad arrows by how hard each axis is pushed (reads the knob position, so it works for touch, gamepad and playback)
  function prep(p){if(p._parw) return;p._parw=1;['u','d','l','r'].forEach(function(k){var i=document.createElement('i');i.className='parw '+k;p.insertBefore(i,p.firstChild)})}
  var PL=null,pgen=-1,pT=0;
  function tick(){
    if(document.hidden) return;
    var nw0=Date.now();if(!PL||pgen!==window.__bdGen||nw0-pT>1000){pgen=window.__bdGen;pT=nw0;PL=document.querySelectorAll('.pad')}
    var l=PL;
    for(var n=0;n<l.length;n++){
      var p=l[n], kn=p.querySelector('.knob');if(!kn||!p.offsetWidth) continue;prep(p);
      var tr=kn.style.transform||'';if(p._tr===tr&&p._pk!==undefined) continue;p._tr=tr;var m=/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tr), dx=0, dy=0;
      if(m){dx=+m[1];dy=+m[2]}
      var now=Date.now();if(!p._R||now-p._Rt>1500){p._R=Math.max(8,(p.offsetWidth-kn.offsetWidth*0.6)/2-7);p._Rt=now}var R=p._R;
      var x=Math.max(-1,Math.min(1,dx/R)), y=Math.max(-1,Math.min(1,-dy/R));
      var v={pu:y>0?y:0,pd:y<0?-y:0,pr:x>0?x:0,pl:x<0?-x:0}, key='';
      for(var k in v){v[k]=v[k]<0.05?0:Math.min(1,0.25+v[k]*0.75);key+=v[k].toFixed(2)}
      if(p._pk===key) continue;p._pk=key;
      var ch=p.querySelectorAll(':scope>.parw');for(var c2=0;c2<ch.length;c2++){var cl=ch[c2].classList[1];ch[c2].style.opacity=v['p'+cl]}
    }
  }
  setInterval(tick,40);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 10 ---- */
try{
(function(){
  // Live performance HUD: long-press the "MK6 CONSOLE" title (about 1 second) to show or hide it.
  var el=null,on=false,raf=0,last=0,dts=[],timer=0,po=null,lo={n:0,dur:0,scr:0,rend:0,blk:0},dpr=window.devicePixelRatio||1,press=0;
  function loop(t){if(!on) return;if(last) dts.push(t-last);last=t;raf=requestAnimationFrame(loop)}
  function report(){
    if(!el) return;
    var n=dts.length,sum=0,mx=0,sl=0,i;
    for(i=0;i<n;i++){sum+=dts[i];if(dts[i]>mx)mx=dts[i];if(dts[i]>25)sl++}
    var s=dts.slice().sort(function(a,b){return a-b}),p95=n?s[Math.min(n-1,Math.floor(n*0.95))]:0,med=n?s[Math.floor(n/2)]:0;
    var fps=sum?Math.round(n*1000/sum):0;
    var t='fps '+fps+' (frame '+med.toFixed(1)+'ms)  p95 '+p95.toFixed(1)+'  max '+mx.toFixed(0)+'  slow '+sl;
    if(po){
      var k=lo.n||1;
      t+='\nlong frames '+lo.n+'  avg '+(lo.dur/k).toFixed(0)+'ms  script '+(lo.scr/k).toFixed(0)+'  render '+(lo.rend/k).toFixed(0)
    }else t+='\n(no long-frame timing on this WebView)';
    t+='\nlite level '+(window.mk6Lite?window.mk6Lite.get():0)+' (tap lite to reset)';t+='\n'+window.innerWidth+'x'+window.innerHeight+' @'+dpr.toFixed(2)+'  '+(document.documentElement.classList.contains('dash')?'dashboard':'page');
    el.textContent=t;dts=[];lo={n:0,dur:0,scr:0,rend:0,blk:0};
  }
  function start(){
    if(on) return;on=true;last=0;dts=[];
    el=document.createElement('div');el.id='perfHud';
    el.style.cssText='position:fixed;top:2px;left:50%;transform:translateX(-50%);z-index:99999;pointer-events:none;font:11px/1.35 monospace;white-space:pre;background:rgba(0,0,0,.78);color:#9fe870;padding:3px 8px;border-radius:6px;max-width:92vw';
    document.body.appendChild(el);
    var bar=document.createElement('div');bar.id='perfBar';
    bar.style.cssText='position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;gap:6px;font:12px monospace';
    var T={
      shadow:'*{box-shadow:none!important;text-shadow:none!important;filter:none!important}',
      thumb:'input[type=range]::-webkit-slider-thumb{background:#e8a020!important;border-radius:50%!important}',
      bg:'*{background-image:none!important}',
      vert:'.bdv,.vert{visibility:hidden!important}',
      glow:'*{--g:0!important;animation:none!important;transition:none!important}'
    };
    var lb=document.createElement('button');lb.textContent='lite';lb.style.cssText='pointer-events:auto;background:#222;color:#9fe870;border:1px solid #9fe870;border-radius:6px;padding:4px 8px;font:inherit';
    lb.addEventListener('click',function(e){e.stopPropagation();if(window.mk6Lite)window.mk6Lite.set(0)});bar.appendChild(lb);
    Object.keys(T).forEach(function(k){
      var b=document.createElement('button'),st=null;b.textContent=k;
      b.style.cssText='pointer-events:auto;background:#222;color:#9fe870;border:1px solid #9fe870;border-radius:6px;padding:4px 8px;font:inherit';
      b.addEventListener('click',function(e){e.stopPropagation();if(st){st.remove();st=null;b.style.background='#222'}else{st=document.createElement('style');st.textContent=T[k];document.head.appendChild(st);b.style.background='#365314'}});
      bar.appendChild(b)});
    document.body.appendChild(bar);
    try{po=new PerformanceObserver(function(l){l.getEntries().forEach(function(e){lo.n++;lo.dur+=e.duration;var sc=0;(e.scripts||[]).forEach(function(x){sc+=x.duration});lo.scr+=sc;if(e.renderStart) lo.rend+=Math.max(0,e.startTime+e.duration-e.renderStart)})});po.observe({type:'long-animation-frame',buffered:false})}catch(_){po=null}
    raf=requestAnimationFrame(loop);timer=setInterval(report,1000);
  }
  function stop(){
    on=false;cancelAnimationFrame(raf);clearInterval(timer);if(po){try{po.disconnect()}catch(_){}po=null}
    if(el&&el.parentNode) el.parentNode.removeChild(el);el=null;var pb=document.getElementById('perfBar');if(pb)pb.remove();document.querySelectorAll('style').forEach(function(x){if(/box-shadow:none!important;text-shadow|slider-thumb\{background:#e8a020|background-image:none!important\}$|visibility:hidden!important\}$|--g:0!important/.test(x.textContent)&&x.textContent.length<200)x.remove()});
  }
  var h=document.querySelector('.brand h1')||document.querySelector('.brand');
  if(h){
    h.addEventListener('pointerdown',function(){clearTimeout(press);press=setTimeout(function(){on?stop():start()},900)});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){h.addEventListener(ev,function(){clearTimeout(press)})});
  }
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 11 ---- */
try{
(function(){
  // Auto-lite: measure frame rate while the Dashboard is shown; if it stays low, drop effects one level at a time (max 3).
  var KEY='mk6lite',lvl=0,last=0,dts=[],t0=0,bad=0,root=document.documentElement,fxm='auto',autoLvl=0;
  try{lvl=Math.max(0,Math.min(3,parseInt(localStorage.getItem(KEY)||'0',10)||0))}catch(_){}
  autoLvl=lvl;
  function apply(){for(var i=1;i<=3;i++) root.classList.toggle('lite'+i,i<=lvl)}
  function save(){try{localStorage.setItem(KEY,String(lvl))}catch(_){}}
  function loop(t){
    // nothing to measure: check again in a second instead of running every frame
    if(fxm!=='auto'||document.hidden||!root.classList.contains('dash')||lvl>=3){last=0;t0=0;bad=0;dts=[];setTimeout(function(){requestAnimationFrame(loop)},1000);return}
    requestAnimationFrame(loop);
    if(last&&t-last<250) dts.push(t-last); last=t; if(!t0) t0=t;
    if(t-t0>=2500){
      var n=dts.length,s=dts.slice().sort(function(a,b){return a-b}),med=n?s[n>>1]:0;
      dts=[];t0=t;
      if(n>=15&&med>32){ if(++bad>=2){bad=0;lvl++;autoLvl=lvl;apply();save();window.dispatchEvent(new Event('mk6lite'))} } else bad=0;
    }
  }
  window.mk6Lite={get:function(){return lvl},set:function(n){lvl=Math.max(0,Math.min(3,n|0));autoLvl=lvl;bad=0;apply();save()}};
  apply();requestAnimationFrame(loop);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 12 ---- */
try{
(function(){
  var T=40,DX=0,DY=0,root=document.documentElement;
  function upd(i){
    var o=i._ok;if(!o) return;
    var hz=i.classList.contains('hsl'),kv=parseFloat(i.style.zoom)||1,Ts=T*kv;
    if(i._L==null||i._kv!==kv||REL){var rc=i.getBoundingClientRect();i._L=hz?rc.width:rc.height;i._kv=kv}
    var L=i._L;
    if(!L) return;
    var mn=+i.min,mx=+i.max,f=mx>mn?(i.value-mn)/(mx-mn):0.5;
    var k=hz?(((f-0.5)*(L-(T+5)*kv))).toFixed(1):(((0.5-f)*(L-(T+5)*kv))+DY*kv).toFixed(1);
    var sk=Ts.toFixed(1);
    if(i._sk!==sk){i._sk=sk;o.style.width=o.style.height=sk+'px';o.style.margin=(-Ts/2).toFixed(1)+'px 0 0 '+(-Ts/2).toFixed(1)+'px';i._yk=null}
    if(i._yk!==k){i._yk=k;o.style.transform=hz?'translate('+k+'px,0)':'translate('+(DX*kv)+'px,'+k+'px)'}
    var g=i.style.getPropertyValue('--g');if(i._gk!==g){i._gk=g;o.style.setProperty('--g',g||'0')}
  }
  // slider lengths are measured again after a resize and once a second (no layout read on every 40 ms pass)
  var REL=false,relT=0,LST=null,lgen=-1;
  window.addEventListener('resize',function(){relT=0});
  function scan(){
    if(!root.classList.contains('dash')||document.hidden) return;
    var nw=Date.now();REL=nw-relT>1000;if(REL) relT=nw;
    if(!LST||REL||lgen!==window.__bdGen){lgen=window.__bdGen;LST=document.querySelectorAll('.bdv input[type=range]:not(.ovr),input.hsl:not(.ovr)')}
    var l=LST;
    for(var n=0;n<l.length;n++){
      var i=l[n];
      if(!i._ok){var rc=i.cloneNode(false);rc.removeAttribute('id');rc.className=(rc.className?rc.className+' ':'')+'ovr';rc.tabIndex=-1;rc.setAttribute('aria-hidden','true');rc.value='0';i.parentNode.insertBefore(rc,i);var o=document.createElement('div');o.className=i.classList.contains('hsl')?'ovk ovh':'ovk';i.parentNode.appendChild(o);i._ok=o;i.addEventListener('input',function(){upd(this)})}
      upd(i);
    }
  }
  window.__ovk={set:function(x,y,t){DX=x;DY=y;T=t||T;document.querySelectorAll('.bdv input[type=range]:not(.ovr),input.hsl:not(.ovr)').forEach(function(i){i._yk=null;i._sk=null;i._L=null})}};
  setInterval(scan,40);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* Header and footer hide while scrolling (portrait pages, not the landscape dashboard):
   moving the page up (finger up) slides the header away and brings the footer back;
   moving it down slides the footer away and brings the header back. Near the top both show.
   E-Stop is the Volume Up key, so it works with the header away; the header stays put
   while an E-Stop or link-lost banner shows. */
(function(){
  var root=document.documentElement,bar=document.querySelector('header.bar'),lastY=window.scrollY||0,acc=0,raf=0;
  if(!bar) return;
  function setH(){root.style.setProperty('--barh',bar.offsetHeight+'px')}
  function alert(){var a=document.getElementById('esBanner'),b=document.getElementById('lostBanner');return (a&&!a.hidden)||(b&&!b.hidden)}
  function show(h,f){
    if(alert()) h=true;
    if(root.classList.contains('v2-hidehd')===!h&&root.classList.contains('v2-hideft')===!f) return;
    if(!h) setH();
    root.classList.toggle('v2-hidehd',!h);root.classList.toggle('v2-hideft',!f);
  }
  function step(){raf=0;
    if(!root.hasAttribute('data-v')||root.classList.contains('dash')){show(true,true);lastY=window.scrollY||0;acc=0;return}
    var y=window.scrollY||0,d=y-lastY;lastY=y;
    if(y<40){acc=0;show(true,true);return}
    if((d>0)!==(acc>0)) acc=0;acc+=d;
    if(acc>12) show(false,true);
    else if(acc<-12) show(true,false);
  }
  window.addEventListener('scroll',function(){if(!raf) raf=requestAnimationFrame(step)},{passive:true});
  window.addEventListener('resize',function(){setH();show(true,true)});
  // a new screen starts with both bars showing
  try{new MutationObserver(function(){show(true,true);lastY=window.scrollY||0;acc=0}).observe(root,{attributes:true,attributeFilter:['data-v']})}catch(_){}
  setH();
})();
