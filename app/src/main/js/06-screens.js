  /* ---------- Layout shell ("Lakaran UI v2"): Home cockpit, focused Drive, model gallery, icon settings, hub test; minimalist icons ---------- */
  var V2={v:'home'}, R2=document.documentElement;
  var V2IC={"home": "<path d=\"M3.5 10.8 12 3.6l8.5 7.2V19.5a1.3 1.3 0 0 1-1.3 1.3H15v-6.2H9v6.2H4.8a1.3 1.3 0 0 1-1.3-1.3z\"/>", "drive": "<circle cx=\"12\" cy=\"12\" r=\"8.6\"/><circle cx=\"12\" cy=\"12\" r=\"2.6\"/><path d=\"M12 14.6v6M9.6 11.1 3.6 9.6M14.4 11.1l6-1.5\"/>", "models": "<path d=\"M12 3.2 20 7.6v8.8L12 20.8l-8-4.4V7.6z\"/><path d=\"M4 7.6 12 12l8-4.4M12 12v8.8\"/>", "settings": "<path d=\"M21.02,10.21 L21.02,13.79 L18.96,13.39 L17.90,15.94 L19.65,17.11 L17.11,19.65 L15.94,17.90 L13.39,18.96 L13.79,21.02 L10.21,21.02 L10.61,18.96 L8.06,17.90 L6.89,19.65 L4.35,17.11 L6.10,15.94 L5.04,13.39 L2.98,13.79 L2.98,10.21 L5.04,10.61 L6.10,8.06 L4.35,6.89 L6.89,4.35 L8.06,6.10 L10.61,5.04 L10.21,2.98 L13.79,2.98 L13.39,5.04 L15.94,6.10 L17.11,4.35 L19.65,6.89 L17.90,8.06 L18.96,10.61Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>", "bt": "<path d=\"M7 7.2l10 9.6-5 4.2V3l5 4.2-10 9.6\"/>", "hub": "<rect x=\"6.5\" y=\"6.5\" width=\"11\" height=\"11\" rx=\"2.2\"/><rect x=\"9.5\" y=\"9.5\" width=\"5\" height=\"5\" rx=\"1\"/><path d=\"M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3\"/>", "shield": "<path d=\"M12 3.2l7.6 2.9v5.8c0 4.4-3.2 7.9-7.6 8.9-4.4-1-7.6-4.5-7.6-8.9V6.1z\"/><path d=\"M12 8.2v4.6M12 15.8v.1\"/>", "sync": "<path d=\"M19.5 11A7.5 7.5 0 0 0 6 6.6L4.5 8M4.5 4v4h4\"/><path d=\"M4.5 13A7.5 7.5 0 0 0 18 17.4l1.5-1.4M19.5 20v-4h-4\"/>", "vibe": "<rect x=\"8\" y=\"4\" width=\"8\" height=\"16\" rx=\"2\"/><path d=\"M11 17h2M4.5 9v6M19.5 9v6M2 11v2M22 11v2\"/>", "cap": "<path d=\"M2.8 9.2 12 4.5l9.2 4.7L12 13.9z\"/><path d=\"M6.8 11.4v4.3c0 1.5 2.3 3 5.2 3s5.2-1.5 5.2-3v-4.3M21.2 9.2v5\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"8.6\"/><path d=\"M3.4 12h17.2M12 3.4c2.4 2.4 3.4 5.3 3.4 8.6s-1 6.2-3.4 8.6c-2.4-2.4-3.4-5.3-3.4-8.6s1-6.2 3.4-8.6z\"/>", "rec": "<circle cx=\"12\" cy=\"12\" r=\"8.4\"/><circle cx=\"12\" cy=\"12\" r=\"3.6\"/>", "seq": "<path d=\"M4 6.5h10M4 12h10M4 17.5h6M15.5 14.5l5 3-5 3z\"/>", "pen": "<path d=\"M4 20h4.2L19.2 9a2.1 2.1 0 0 0-3-3L5.2 17z\"/><path d=\"M14.5 7.5l3 3\"/>", "unlink": "<path d=\"M9.5 14.5 7.4 16.6a3 3 0 0 1-4.2-4.2l3-3M14.5 9.5l2.1-2.1a3 3 0 0 1 4.2 4.2l-3 3M8 4.5v2.5M4.5 8H7M16 19.5V17M19.5 16H17\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "minus": "<path d=\"M5 12h14\"/>", "search": "<circle cx=\"10.8\" cy=\"10.8\" r=\"6.3\"/><path d=\"M15.6 15.6l4.6 4.6\"/>", "more": "<path d=\"M5.5 12h.1M12 12h.1M18.5 12h.1\" stroke-width=\"3\"/>", "chev": "<path d=\"M9.5 6l6 6-6 6\"/>", "down": "<path d=\"M6 9.5l6 6 6-6\"/>", "save": "<path d=\"M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14\"/>", "load": "<path d=\"M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14\"/>", "grid": "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\" rx=\"1.6\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\" rx=\"1.6\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\" rx=\"1.6\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\" rx=\"1.6\"/>", "tilt": "<rect x=\"7\" y=\"3.5\" width=\"10\" height=\"17\" rx=\"2\" transform=\"rotate(-18 12 12)\"/><path d=\"M3 18.5c1.5 1.3 3.2 2 5 2.2M21 5.5c-1.5-1.3-3.2-2-5-2.2\"/>", "pad": "<path d=\"M7 8h10a4 4 0 0 1 4 4.6l-.6 3.6a2.3 2.3 0 0 1-4 1l-1.8-2.2H9.4l-1.8 2.2a2.3 2.3 0 0 1-4-1L3 12.6A4 4 0 0 1 7 8z\"/><path d=\"M8 10.5v3M6.5 12h3M15.5 11.3h.1M17.5 13h.1\"/>", "list": "<path d=\"M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.1M4.5 12h.1M4.5 17.5h.1\"/>", "q": "<circle cx=\"12\" cy=\"12\" r=\"8.6\" stroke-dasharray=\"2.4 2.4\"/><path d=\"M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.6M12 16.8v.1\"/>"};
  function v2Ic(k,cls){return '<svg class="'+(cls||'ic')+'" viewBox="0 0 24 24" aria-hidden="true">'+(V2IC[k]||'')+'</svg>'}
  var V2PARENT={medit:'models',tpl:'models',safety:'settings',backup:'settings','m-tilt':'settings','m-pad':'settings','m-app':'settings','m-log':'settings'};
  var V2TITLE={medit:'Model settings',tpl:'Templates',safety:'Limits & auto-stop',backup:'Backup & restore','m-tilt':'Tilt steering','m-pad':'Gamepad','m-app':'App','m-log':'Frames sent'};
  var V2UI={};try{V2UI=JSON.parse(localStorage.getItem('mk6ui')||'{}')||{}}catch(_){V2UI={}}
  function v2UiSave(){try{localStorage.setItem('mk6ui',JSON.stringify(V2UI))}catch(_){}}
  function v2Tab(v){return (v==='home'||v==='drive')?v:(v==='models'||v==='medit'||v==='tpl')?'models':'settings'}
  function v2Go(v){
    if(v.indexOf('/')>0) v=v.split('/')[0];
    if(v==='hub') v='home'; // the hub cards now live on Home
    if(v==='m-app') v='settings'; // the App options now live under Settings › Experience
    V2.v=v;R2.setAttribute('data-v',v);
    var t=v2Tab(v);
    if(v!=='drive'&&bdEditing){var be=$('#bdEdit');if(be) be.click()}
    if(v!=='drive'&&CAM.st&&!CAM.rec) camStop(); // the phone's camera is never left on behind another page
    if(t!==v2LastTab) v2Motion(t);
    Array.prototype.forEach.call(document.querySelectorAll('#tabbar [data-tab]'),function(b){b.setAttribute('aria-pressed',String(b.dataset.tab===t))});
    var sub=!!V2PARENT[v];$('#subHead').hidden=!sub;if(sub) $('#subTitle').textContent=V2TITLE[v];
    $('#subDone').hidden=v!=='medit';
    try{window.scrollTo(0,0)}catch(_){}
    if(v==='models') v2Models();
    if(v==='safety') sfPaint(true);
    if(v==='home') v2Slots();
    if(v==='drive') v2Pick();
    if(v==='m-pad') v2GpDraw();
    if(v==='m-tilt'){TLX.k='';TLX.ck='';syncTiltUi()}
    v2Paint();
    try{window.dispatchEvent(new Event('resize'))}catch(_){}
  }
  window.mk6Go=v2Go;
  (function(){
    var orig=window.onAppEvent;
    window.onAppEvent=function(ev){
      if(ev==='watchdog'){toast('Safety stop: the app paused, so every motor was set to 0.',4000);feedback('lost');return}
      if(ev==='sharefail'){toast('That file could not be shared or opened.',3500);return}
      if(orig) return orig.apply(this,arguments);
    };
  })();
  // Android back button: close an open dialog, then go up one screen, then Home; only then leave the app
  window.mk6Back=function(){
    var dl=['#dashTpl','#jcDlg','#lxDlg'].map(function(q){return $(q)}).filter(function(e){return e&&!e.hidden});
    if(dl.length){dl[0].hidden=true;return true}
    if(TLE){tlClose();return true}
    var gd=['#pinDlg','#wnSheet','#gEdit'].map(function(q){return $(q)}).filter(Boolean);if(gd.length){gd[0].remove();return true}
    if(v2QS){v2QuickClose();return true}
    if(v2Co.el){guideClose();return true}
    if(bdEditing){var be=$('#bdEdit');if(be) be.click();return true}
    if(V2PARENT[V2.v]){v2Go(V2PARENT[V2.v]);return true}
    if(V2.v!=='home'){v2Go('home');return true}
    return false;
  };
  function v2Click(sel,fn){var e=$(sel);if(e) e.addEventListener('click',fn)}
  function v2Conn(){link.click()}
  var v2WasLive=!!S.connected;
  function v2Live(){
    var live=S.connected&&hubMsg!=='Pairing…';
    if(live&&!v2WasLive&&V2.v==='home') v2Go('drive');
    v2WasLive=live;
  }

  var V2ORD={home:0,drive:1,models:2,settings:3},v2LastTab='home';
  function v2Motion(t){
    var m=document.querySelector('main');if(!m) return;
    var dir=(V2ORD[t]||0)>=(V2ORD[v2LastTab]||0)?'r':'l';v2LastTab=t;
    // Web Animations restart the slide without forcing a full layout of the new screen first (that made tab switches slow)
    if(m.animate&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)){try{if(m._v2a) m._v2a.cancel();m._v2a=m.animate([{opacity:.4,transform:'translateX('+(dir==='r'?14:-14)+'px)'},{opacity:1,transform:'none'}],{duration:150,easing:'ease-out'})}catch(_){}}
  }
  function v2Tick(){if(store.prefs.haptic&&NB&&NB.haptic){try{NB.haptic('dial')}catch(_){}}}
  Array.prototype.forEach.call(document.querySelectorAll('#tabbar [data-tab]'),function(b){b.addEventListener('click',function(){
    if(V2.v!==b.dataset.tab) v2Tick();v2Go(b.dataset.tab)})});
  Array.prototype.forEach.call(document.querySelectorAll('[data-go]'),function(b){b.addEventListener('click',function(){v2Go(b.dataset.go)})});
  v2Click('#subBack',function(){v2Go(V2PARENT[V2.v]||'home')});
  v2Click('#subDone',function(){v2Go('drive')});
  v2Click('#dEdit',function(){v2Go('medit')});
  v2Click('#hubConn',v2Conn);
  v2Click('#hubOff',function(){if(S.connected) v2Conn()});
  // top bar: one pill = Bluetooth | status | battery; tap it to connect (or to open Bluetooth when it is off)
  (function(){
    var bi=document.querySelector('.bar-in');if(!bi) return;
    var b=document.createElement('button');b.type='button';b.id='v2Pill';b.className='v2-pill';b.setAttribute('data-st','off');b.setAttribute('data-bt','on');
    b.innerHTML=v2Ic('bt','ic pbt')+'<i class="pdv" aria-hidden="true"></i><i class="pdot" aria-hidden="true"></i><span class="prings" aria-hidden="true"></span><span class="ptx"></span><em class="pbat"></em>';
    b.addEventListener('click',function(){if(S.bt===false){$('#btBtn').click();return}v2Conn()});
    bi.insertBefore(b,bi.firstChild);
  })();

  // ---- 2 · Drive: model chip picker, quick record, Record / Sequences fold away ----
  function v2Pick(){
    var s=$('#dPick');if(!s) return;s.innerHTML='';
    store.profiles.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=profLbl(p);if(p.id===store.active) o.selected=true;s.appendChild(o)});
  }
  (function(){var s=$('#dPick');if(s) s.addEventListener('change',function(){if(s.value&&s.value!==store.active){switchProfile(s.value);v2Pick();v2Paint()}})})();
  v2Click('#dRec',function(){var r=$('#recBtn');if(r&&!r.disabled) r.click()});
  function v2Fold(card,key,ic,title){
    if(!card) return null;
    var h=document.createElement('button');h.type='button';h.className='v2-foldh';
    h.innerHTML=v2Ic(ic)+'<span></span><small></small>'+v2Ic('down','ic fc');
    h.querySelector('span').textContent=title;
    card.insertBefore(h,card.firstChild);card.classList.add('v2-fold');
    var open=V2UI[key]===true;card.classList.toggle('open',open);h.setAttribute('aria-expanded',String(open));
    h.addEventListener('click',function(){var o=!card.classList.contains('open');card.classList.toggle('open',o);h.setAttribute('aria-expanded',String(o));V2UI[key]=o;v2UiSave()});
    return h;
  }
  var v2FR=v2Fold($('#recCard'),'fRec','rec','Record & replay'), v2FS=v2Fold($('#seqCard'),'fSeq','seq','Sequences');
  

  // Hub module numbers and names (existing rows) sit on the Hub screen under "Hub numbers & names"
  (function(){var box=$('#hubRows');['#hub0','#hubN0'].forEach(function(q){var el=$(q);var row=el&&el.closest('.set-row');if(row&&box) box.appendChild(row)})})();
  v2Click('#hubName',function(){var d=$('#hubAdv');if(d) d.open=true;var n=$('#hubN0');if(n){try{n.scrollIntoView({block:'center'});n.focus()}catch(_){}}});

  // ---- 3 · Models: gallery cards with a sketch of each board ----
  function v2Ago(t){if(!t) return 'Not used yet';var d=Date.now()-t,day=864e5,a=new Date(t),b=new Date();
    if(a.toDateString()===b.toDateString()) return 'Today';var y=new Date(b.getTime()-day);if(a.toDateString()===y.toDateString()) return 'Yesterday';
    var n=Math.floor(d/day);if(n<7) return n+' days ago';if(n<30) return Math.floor(n/7)+(n<14?' week ago':' weeks ago');return Math.floor(n/30)+(n<60?' month ago':' months ago')}
  function v2Hrs(ms){var m=Math.round((ms||0)/60000);return m<60?m+' min':(m/60).toFixed(m<600?1:0)+' h'}
  function v2Stat(p){var st=(p.cfg&&p.cfg.st)||{};return '\u23F1 '+v2Hrs(st.ms)+' \u00b7 '+v2Ago(st.last)}
  function v2Sub(p){
    var c=p.cfg||{},h=(c.hubs||[]).filter(function(x){return x>=0}).length||1,w=(c.board||[]).length;
    return h+(h===1?' hub':' hubs')+' · '+w+(w===1?' widget':' widgets');
  }
  function v2Thumb(c){
    var o='<svg class="v2-th" viewBox="0 0 48 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    var Y=(c&&c.accent&&ACC[c.accent])||'#ffd84a',K='#3a414d',F='#1d222b';
    if(c.layout==='board'&&c.board&&c.board.length){
      c.board.forEach(function(it,ix){
        var g=it.g||[(ix%4)*12,Math.floor(ix/4)*8,12,8];
        var x=g[0]+.5,y=g[1]+.5,w=Math.max(1,g[2]-1),h=Math.max(1,g[3]-1),cx=x+w/2,cy=y+h/2,m=Math.min(w,h);
        o+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="1.3" fill="'+F+'" stroke="'+K+'" stroke-width=".3"/>';
        var k=it.k;
        if(k==='s'||k==='y'||k==='lv'){if(h>=w){o+='<rect x="'+(cx-.5)+'" y="'+(y+h*.15)+'" width="1" height="'+(h*.7)+'" rx=".5" fill="#0b0d11"/><circle cx="'+cx+'" cy="'+cy+'" r="'+Math.min(1.6,w*.22)+'" fill="'+Y+'"/>'}else{o+='<rect x="'+(x+w*.12)+'" y="'+(cy-.5)+'" width="'+(w*.76)+'" height="1" rx=".5" fill="#0b0d11"/><circle cx="'+cx+'" cy="'+cy+'" r="'+Math.min(1.6,h*.22)+'" fill="'+Y+'"/>'}}
        else if(k==='j'||k==='dp'||k==='xy'){o+='<circle cx="'+cx+'" cy="'+cy+'" r="'+m*.34+'" fill="#0b0d11" stroke="#4a5260" stroke-width=".3"/><circle cx="'+cx+'" cy="'+cy+'" r="'+m*.13+'" fill="'+Y+'"/>'}
        else if(k==='d'){[cx-w*.24,cx+w*.24].forEach(function(px){o+='<circle cx="'+px+'" cy="'+cy+'" r="'+Math.min(m*.34,w*.2)+'" fill="#0b0d11" stroke="#4a5260" stroke-width=".3"/><circle cx="'+px+'" cy="'+cy+'" r="'+Math.min(m*.13,w*.08)+'" fill="'+Y+'"/>'})}
        else if(k==='e'){o+='<circle cx="'+cx+'" cy="'+cy+'" r="'+m*.34+'" fill="#E24B4A"/>'}
        else if(k==='ps'){o+='<circle cx="'+cx+'" cy="'+cy+'" r="'+m*.32+'" fill="none" stroke="'+Y+'" stroke-width=".9" stroke-dasharray=".9 .6"/>'}
        else if(k==='f'||k==='n'||k==='rs'||k==='st'||k==='g'||k==='ro'||k==='ax'){var r=m*.3,cc=2*Math.PI*r;o+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2e3540" stroke-width=".8"/><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#1D9E75" stroke-width=".8" stroke-dasharray="'+(cc*.45)+' '+cc+'" transform="rotate(135 '+cx+' '+cy+')"/>'}
        else if(k==='i'||k==='k'||k==='m'){for(var q=0;q<6;q++){var bx=x+w*.14+q*(w*.72/6);o+='<rect x="'+bx+'" y="'+(y+h*.25)+'" width="'+(w*.72/6*.6)+'" height="'+(h*.5)+'" rx=".3" fill="'+(q<3?PAL.g:q<5?PAL.o:'#2e3540')+'"/>'}}
        else{o+='<rect x="'+(cx-w*.3)+'" y="'+(cy-Math.min(1.4,h*.18))+'" width="'+(w*.6)+'" height="'+Math.min(2.8,h*.36)+'" rx="'+Math.min(1.4,h*.18)+'" fill="#2a303b" stroke="#4a5260" stroke-width=".25"/>'+(k==='l'?'<circle cx="'+(cx-w*.2)+'" cy="'+cy+'" r=".7" fill="#E24B4A"/>':'')}
      });
    }else if(c.layout==='joy'||c.layout==='dual'){
      [16,32].forEach(function(px,ix){if(c.layout==='joy'&&ix) return;var qx=c.layout==='joy'?24:px;o+='<circle cx="'+qx+'" cy="12" r="7" fill="#0b0d11" stroke="#4a5260" stroke-width=".4"/><circle cx="'+qx+'" cy="12" r="2.6" fill="'+Y+'"/>'});
    }else{
      for(var q=0;q<6;q++){var bx=6+q*6.4;o+='<rect x="'+bx+'" y="3" width="1.2" height="18" rx=".6" fill="#0b0d11"/><circle cx="'+(bx+.6)+'" cy="'+(12+((q*7)%9-4))+'" r="1.6" fill="'+Y+'"/>'}
    }
    return o+'</svg>';
  }
  function v2Models(){
    var box=$('#mList');if(!box) return;
    var q=($('#mSearch').value||'').trim().toLowerCase();box.innerHTML='';var n=0;
    var ms0=store.prefs.msort||'f', list=store.profiles.slice();
    if(ms0==='f') list.sort(function(a,b){return ((b.cfg&&b.cfg.fav)?1:0)-((a.cfg&&a.cfg.fav)?1:0)||store.profiles.indexOf(a)-store.profiles.indexOf(b)});
    else if(ms0==='r') list.sort(function(a,b){return ((b.cfg&&b.cfg.st&&b.cfg.st.last)||0)-((a.cfg&&a.cfg.st&&a.cfg.st.last)||0)});
    else list.sort(function(a,b){return profLbl(a).localeCompare(profLbl(b))});
    var sb=$('#mSort');if(sb) Array.prototype.forEach.call(sb.children,function(b){b.setAttribute('aria-pressed',String(b.dataset.s===ms0))});
    list.forEach(function(p){
      var name=profLbl(p);if(q&&name.toLowerCase().indexOf(q)<0) return;n++;
      var card=document.createElement('div');card.className='v2-mcard'+(p.id===store.active?' v2on':'');card.style.setProperty('--mc',ACC[(p.cfg&&p.cfg.accent)||0]);
      var main=document.createElement('button');main.type='button';main.className='v2-mmain';
      main.innerHTML='<span class="v2-thw">'+(p.cfg&&p.cfg.photo?'<img class="v2-mph" alt="" src="'+p.cfg.photo+'">':v2Thumb(p.cfg||{}))+(p.cfg&&p.cfg.icon&&!p.cfg.photo?'<span class="v2-mbadge">'+v2MiSvg(p.cfg.icon)+'</span>':'')+'</span><b></b><small></small>';
      main.querySelector('b').textContent=name;main.querySelector('small').textContent=v2Sub(p);
      var lp=0,lpFired=false;
      main.addEventListener('pointerdown',function(){lpFired=false;clearTimeout(lp);lp=setTimeout(function(){lpFired=true;feedback('hold');if(p.id!==store.active) switchProfile(p.id);v2Go('medit')},600)});
      ['pointerup','pointercancel','pointerleave'].forEach(function(ev){main.addEventListener(ev,function(){clearTimeout(lp)})});
      main.addEventListener('contextmenu',function(e){e.preventDefault()});
      main.addEventListener('click',function(){if(lpFired){lpFired=false;return}if(p.id!==store.active) switchProfile(p.id);v2Go('drive')});
      var more=document.createElement('button');more.type='button';more.className='v2-ib v2-more';more.innerHTML=v2Ic('more');more.setAttribute('aria-label','Model settings');
      more.addEventListener('click',function(){if(p.id!==store.active) switchProfile(p.id);v2Go('medit')});
      var fav=document.createElement('button');fav.type='button';fav.className='v2-ib v2-fav'+(p.cfg&&p.cfg.fav?' on':'');fav.textContent=p.cfg&&p.cfg.fav?'\u2605':'\u2606';
      fav.setAttribute('aria-label',p.cfg&&p.cfg.fav?'Remove from favourites':'Add to favourites');fav.setAttribute('aria-pressed',String(!!(p.cfg&&p.cfg.fav)));
      fav.addEventListener('click',function(e){e.stopPropagation();if(!p.cfg) return;p.cfg.fav=!p.cfg.fav;save();feedback('tick');v2Models()});
      var stl=document.createElement('span');stl.className='v2-mst';stl.textContent=v2Stat(p);
      main.appendChild(stl);
      card.appendChild(main);card.appendChild(fav);card.appendChild(more);box.appendChild(card);
    });
    var add=document.createElement('button');add.type='button';add.className='v2-mcard v2-madd';
    add.innerHTML=v2Ic('plus','ic big')+'<b></b><small></small>';add.querySelector('b').textContent='New model';add.querySelector('small').textContent='Template or empty';
    add.addEventListener('click',function(){v2Go('tpl')});
    if(!q) box.appendChild(add);
    $('#mNone').hidden=n>0;
  }
  (function(){var s=$('#mSearch');if(s) s.addEventListener('input',v2Models);
    var sb=$('#mSort');if(sb) sb.addEventListener('click',function(e){var b=e.target.closest('button[data-s]');if(!b) return;store.prefs.msort=b.dataset.s;save();feedback('tick');v2Models()})})();
  var V2TPL={
    car:{name:'Car / Truck',ch:['Drive','Steering','Lights','Winch','Rear lights','Channel F'],light:[2,4]},
    exc:{name:'Excavator / crane',ch:['Left track','Right track','Boom','Bucket','Swing','Arm'],light:[]},
    dual:{name:'Dual stick car',ch:['Drive','Steering','Arm','Bucket','Lights','Channel F'],light:[4]},
    four:{name:'Robot (4 motors)',ch:['Motor 1','Motor 2','Motor 3','Motor 4','Channel E','Channel F'],light:[]},
    empty:{name:'My board',ch:null,light:[]}
  };
  function v2NewTpl(key){
    var t=V2TPL[key];if(!t) return;
    if(store.profiles.length>=MAX_MODELS){toast('Model list is full.');return}
    var cfg=baseCfg(t.ch||undefined);t.light.forEach(function(i){cfg.ch[i].kind='light'});
    cfg.layout='board';cfg.dash=true;cfg.board=[];cfg.hubs=C.hubs.slice();
    var p={id:uid(),name:t.name,cfg:sanitizeCfg(cfg)};store.profiles.push(p);switchProfile(p.id);
    if(DTPL[key]) dtplApply(DTPL[key],t.name);
    v2Go('drive');
    if(key==='empty'){var e=$('#bdEdit');if(e&&e.getAttribute('aria-pressed')!=='true') e.click()}
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-wiz]'),function(b){b.addEventListener('click',function(){v2NewTpl(b.dataset.wiz)})});
  // ---- (+) in the tab bar: a new dashboard, opened sideways in edit mode ----
  var NDASH=false, ND_FORCED=false;
  var NDT=[['empty','Empty','Arrange it yourself'],['exc','Excavator','2 sliders · dual stick'],['car','Car','Throttle · steering · lights'],['copy','Copy this board','Every widget of the current model']];
  function ndPrev(key){
    var B={empty:[],exc:[[2,4,14,32,'s'],[20,4,52,32,'j'],[76,4,14,32,'s']],car:[[2,4,22,32,'s'],[28,4,20,15,'l'],[28,21,20,15,'b'],[52,4,20,15,'t'],[76,4,18,15,'e'],[52,21,42,15,'h']]};
    var L=key==='copy'?(C.board||[]).filter(function(o){return o.g}).slice(0,12).map(function(o){return [o.g[0]/48*96+2,o.g[1]/24*36+2,o.g[2]/48*96-2,o.g[3]/24*36-2,'x']}):B[key]||[];
    var o='<svg viewBox="0 0 100 40" aria-hidden="true"><rect x=".5" y=".5" width="99" height="39" rx="5" fill="#0b0c0e" stroke="'+(key==='empty'?'#3a3f47':'#262a31')+'"'+(key==='empty'?' stroke-dasharray="3 2"':'')+'/>';
    L.forEach(function(b){o+='<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" rx="3" fill="#232831" stroke="#4a505b" stroke-width=".6"/>';
      var cx=b[0]+b[2]/2,cy=b[1]+b[3]/2;o+=b[4]==='s'||b[4]==='h'?'<rect x="'+(cx-(b[4]==='h'?b[2]/2-4:1.5))+'" y="'+(cy-(b[4]==='h'?1.5:b[3]/2-4))+'" width="'+(b[4]==='h'?b[2]-8:3)+'" height="'+(b[4]==='h'?3:b[3]-8)+'" rx="1.5" fill="#FFC400"/>':b[4]==='e'?'<circle cx="'+cx+'" cy="'+cy+'" r="4.5" fill="#E24B4A"/>':'<circle cx="'+cx+'" cy="'+cy+'" r="'+Math.min(b[2],b[3])*.28+'" fill="#FFC400"/>'});
    return o+'</svg>';
  }
  function ndShow(){
    if(store.profiles.length>=MAX_MODELS){toast('Model list is full.');return}
    var old=document.getElementById('ndSheet');if(old) old.remove();
    var ov=document.createElement('div');ov.id='ndSheet';ov.className='gedit nd';
    var bx=document.createElement('div');bx.className='gbox ndbox';bx.setAttribute('role','dialog');bx.setAttribute('aria-modal','true');ov.appendChild(bx);
    var n=store.profiles.length+1;
    bx.innerHTML='<h3></h3><p class="note nd-sub"></p><label class="nd-f"><span></span><input class="txt" maxlength="24"></label><div class="nd-l"></div><div class="nd-t"></div><p class="nd-rot"></p><div class="rec-row"><button class="btn" type="button" data-a="x"></button><button class="btn pri" type="button" data-a="go"></button></div>';
    bx.querySelector('h3').textContent='New dashboard';bx.querySelector('.nd-sub').textContent='A new board of its own, arranged sideways.';
    bx.querySelector('.nd-f span').textContent='Name';var inp=bx.querySelector('input');inp.value=(store.prefs.lang==='ms'?'Papan ':'Board ')+n;
    bx.querySelector('.nd-l').textContent='Start with';
    bx.querySelector('.nd-rot').textContent='The screen turns sideways and the board opens in edit mode.';
    bx.querySelector('[data-a=x]').textContent='Cancel';bx.querySelector('[data-a=go]').textContent='Create & arrange';
    var key='empty',tg=bx.querySelector('.nd-t');
    NDT.forEach(function(t){if(t[0]==='copy'&&!(C.board&&C.board.length)) return;var b=document.createElement('button');b.type='button';b.className='nd-tp';b.dataset.k=t[0];
      b.innerHTML=ndPrev(t[0])+'<b></b><small></small>';b.querySelector('b').textContent=t[1];b.querySelector('small').textContent=t[2];
      b.setAttribute('aria-pressed',String(t[0]===key));b.addEventListener('click',function(){key=t[0];[].forEach.call(tg.children,function(z){z.setAttribute('aria-pressed',String(z===b))});feedback('tick')});tg.appendChild(b)});
    bx.querySelector('[data-a=x]').addEventListener('click',function(){ov.remove()});
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    bx.querySelector('[data-a=go]').addEventListener('click',function(){var nm=inp.value.trim().slice(0,24)||('Board '+n);ov.remove();ndCreate(nm,key)});
    document.body.appendChild(ov);feedback('tap');
  }
  function ndCreate(name,key){
    if(store.profiles.length>=MAX_MODELS){toast('Model list is full.');return}
    var cfg;
    if(key==='copy'){cfg=JSON.parse(JSON.stringify(C));Object.keys(cfg).forEach(function(k){if(k.charAt(0)==='_') delete cfg[k]});delete cfg.st;delete cfg.fav}
    else{var t=V2TPL[key]||V2TPL.empty;cfg=baseCfg(t.ch||undefined);t.light.forEach(function(i){cfg.ch[i].kind='light'});cfg.board=[];cfg.hubs=C.hubs.slice()}
    cfg.layout='board';cfg.dash=true;
    var p={id:uid(),name:name,cfg:sanitizeCfg(cfg)};store.profiles.push(p);switchProfile(p.id);
    if(key!=='copy'&&DTPL[key]) dtplApply(DTPL[key],name);
    save();v2Go('drive');feedback('success');
    NDASH=true;if(NB&&NB.orient){try{NB.orient('land');ND_FORCED=true}catch(_){}}
    toast('"'+name+'" created. Turn the phone sideways to arrange it.',3500);
    setTimeout(ndTry,120);
  }
  // open the editor as soon as the sideways dashboard is showing
  function ndTry(){if(!NDASH||!dashOn()) return;NDASH=false;if(!bdEditing){var e=$('#dbEdit');if(e) e.click()}}
  function ndDone(){if(ND_FORCED){ND_FORCED=false;try{NB.orient('auto')}catch(_){}}}
  window.addEventListener('resize',function(){setTimeout(ndTry,250)});
  $('#dbEdit').addEventListener('click',function(){if(!bdEditing) ndDone()});
  $('#dbExit').addEventListener('click',ndDone);
  v2Click('#tabPlus',ndShow);
  v2Click('#tSave',function(){$('#exBtn').click()});
  v2Click('#tLoad',function(){$('#imBtn').click();if(!NB) v2Go('backup')});

  // ---- 4 · Settings: switches and values on the rows ----
  function v2Practice(on){
    if(!!store.prefs.practice===on) return;
    if(S.connected) v2Conn();
    if(S.connected){S.connected=false;hubMsg=''}
    hubMsg='';store.prefs.practice=on;save();paintLink();v2Paint();
    toast(on?'Practice mode: no hub is used, outputs are only shown.':'Practice mode off.');
  }
  function v2Fire(el){if(!el) return;try{el.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}}
  v2Click('#sPrac',function(){v2Practice(!store.prefs.practice)});
  v2Click('#sFb',function(){
    var on=!(store.prefs.sound||store.prefs.haptic);
    ['#optSound','#optHaptic'].forEach(function(q){var c=$(q);if(c&&c.checked!==on){c.checked=on;v2Fire(c)}});
    store.prefs.sound=on;store.prefs.haptic=on;save();v2Paint();if(on) feedback('ok');
  });
  // reconnect and full screen switches drive the stored checkboxes, so the old handlers keep doing the work
  [['#sRelink','#optRelink'],['#sFull','#optFull']].forEach(function(q){v2Click(q[0],function(){var c=$(q[1]);c.checked=!c.checked;v2Fire(c);v2Paint()})});
  v2Click('#sLang',function(){var l=$('#lang');l.value=store.prefs.lang==='ms'?'en':'ms';v2Fire(l);v2Paint()});

