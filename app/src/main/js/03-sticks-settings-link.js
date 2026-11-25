  /* ---------- Sticks ---------- */
  var TILT={g:[0,0],has:false,zero:null,ang:null,deg:0}, BD_TILT={cur:null};
  window.onTilt=function(x,y,ang){TILT.g=[+x||0,+y||0];TILT.has=true;TILT.ang=ang;};
  function gyroAny(){return !!(C.board&&C.board.some(function(o){return o.k==='st'&&o.gy}))}
  function tiltNative(){ if(NB&&NB.tilt){try{NB.tilt(!!((C.tilt&&C.tilt.on)||gyroAny()))}catch(e){}} }
  if(typeof window.addEventListener==='function'){
    window.addEventListener('devicemotion',function(e){
      var a=e&&e.accelerationIncludingGravity;
      if(!a||a.x==null||a.y==null) return;
      TILT.g=[a.x,a.y];TILT.has=true;
    },{passive:true});
  }
  function tiltAngle(){
    var ang=0;
    if(TILT.ang!==null&&TILT.ang!==undefined) ang=+TILT.ang;
    else try{ang=(typeof screen!=='undefined'&&screen.orientation&&screen.orientation.angle)||window.orientation||0}catch(e){}
    ang=((ang%360)+360)%360;
    var gx=TILT.g[0], gy=TILT.g[1], sx, sy;
    if(ang===90){sx=gy;sy=-gx}else if(ang===180){sx=-gx;sy=-gy}else if(ang===270){sx=-gy;sy=gx}else{sx=gx;sy=gy}
    if(Math.hypot(sx,sy)<3) return null;
    return Math.atan2(sx,sy)*180/Math.PI;
  }
  function tiltActive(){return !!(C.tilt&&C.tilt.on&&TILT.has)}
  function tiltVal(sn,dz){
    var a=tiltAngle();
    if(a===null) return 0;
    if(C.tilt.c0!=null) TILT.zero=C.tilt.c0;else if(TILT.zero===null) TILT.zero=a;
    var d=a-TILT.zero;
    while(d>180) d-=360;
    while(d<-180) d+=360;
    TILT.deg=C.tilt.inv?d:-d;
    var sv=sn||C.tilt.sens, v=-d/sv;
    if(C.tilt.inv) v=-v;
    v=Math.max(-1,Math.min(1,v));
    if(dz===undefined) return tiltShape(v,sv);
    // custom dead zone in degrees: nothing inside it, then a smooth start so the value does not jump
    var dd=Math.min(.9,dz/sv),av=Math.abs(v);
    return av<=dd?0:(v<0?-1:1)*(av-dd)/(1-dd);
  }
  // Tilt steering's own response: dead zone in degrees with a smooth start, then expo for fine control near the centre
  function tiltShape(v,sv){var dd=Math.min(.9,(C.tilt.dz||0)/sv),av=Math.abs(v);if(av<=dd) return 0;var m=(av-dd)/(1-dd),ex=(C.tilt.ex||0)/100;return (v<0?-1:1)*((1-ex)*m+ex*m*m*m)}
  // what the card shows: tilt in degrees from the centre (fixed centre, the centre of the current hold, or upright) and the steering it gives
  function tiltPreview(){var a=tiltAngle();if(a===null) return null;var z=C.tilt.c0!=null?C.tilt.c0:(TILT.touch&&TILT.zero!==null?TILT.zero:0),d=a-z;
    while(d>180) d-=360;while(d<-180) d+=360;var D=C.tilt.inv?d:-d,sv=C.tilt.sens;return {deg:D,v:tiltShape(Math.max(-1,Math.min(1,D/sv)),sv)}}
  function tiltStep(){
    var held=false;
    if(BD_TILT.cur&&(BD_TILT.cur.st?TILT.has:tiltActive())){
      var bt=BD_TILT.cur, tv=bt.st?tiltVal(bt.it.gs||undefined,bt.it.gz===undefined?3:bt.it.gz):tiltVal();
      if(bt.st){
        // Steering wheel with gyro on: the phone's tilt turns the wheel while it is held.
        var gv=Math.round(tv*20)*5;noteInput();
        if(gv!==bt.last){bt.last=gv;dialBuzz()}
        setT(bt.c,wOut(bt.it,gv),false);
      }else if(bt.sl){setT(bt.c,tv*100,true);if(bt.r) bt.r.value=String(Math.round(tv*100))}
      else applyJoy(bt,tv,bt.y||0);
      held=true;
    }
    TILT.touch=held;
    tiltStatus();
  }
  function tiltStatus(){
    var el=tlSt;
    if(!el) return;
    var on=!!(C.tilt&&C.tilt.on), deg=TILT.touch?Math.max(-120,Math.min(120,TILT.deg)):0, tr='rotate('+deg.toFixed(1)+'deg)';
    if(on&&typeof V2!=='undefined'&&V2&&V2.v==='m-tilt') tlxPaint();
    var t='';
    if(C.tilt&&C.tilt.on){
      if(!TILT.has) t='Tilt sensor: no data yet';
      else if(TILT.touch) t='Tilt: '+Math.round(TILT.deg)+'\u00b0';
      else t='Tilt sensor is ready. Touch and hold a joystick or slider, then tilt the phone.';
    }
    if(el.textContent!==t) el.textContent=t;
  }
  // ---- Tilt card: live LED gauge and response curve ----
  // The gauge face is built once; every animation frame only moves the pointer, recolours the LEDs and updates the numbers.
  var TLX={k:'',ck:'',raf:0,d:0,v:0,seg:[],lit:[],has:null};
  function tlxCol(f){return f>.8?'#E24B4A':f>.55?'#EF9F27':'#1D9E75'}
  var TLC=160,TLY=168,TLR=132;
  function tlxBuild(){var g=$('#tlGauge');if(!g) return false;var sv=C.tilt.sens,key=sv+'|'+store.prefs.lang;if(TLX.k===key&&g.firstChild) return true;TLX.k=key;
    var cx=TLC,cy=TLY,R=TLR,o='<defs><linearGradient id="tgM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e9ef"/><stop offset=".3" stop-color="#9aa3b0"/><stop offset=".55" stop-color="#2b303a"/><stop offset=".8" stop-color="#6b7280"/><stop offset="1" stop-color="#c9ced6"/></linearGradient><radialGradient id="tgF" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#1b1f26"/><stop offset=".7" stop-color="#0d1014"/><stop offset="1" stop-color="#07090c"/></radialGradient><linearGradient id="tgT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".45" stop-color="#ffd21a"/><stop offset="1" stop-color="#e09a00"/></linearGradient><filter id="tgG" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    function arc(r){return 'M'+(cx-r)+' '+cy+' A'+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy}
    o+='<path d="'+arc(R+12)+' Z" fill="url(#tgF)"/><path d="'+arc(R+12)+'" fill="none" stroke="url(#tgM)" stroke-width="8" stroke-linecap="round"/>';
    for(var i=0;i<33;i++){var a=Math.PI+Math.PI*i/32;o+='<line class="tls" x1="'+(cx+Math.cos(a)*(R-18)).toFixed(1)+'" y1="'+(cy+Math.sin(a)*(R-18)).toFixed(1)+'" x2="'+(cx+Math.cos(a)*(R-2)).toFixed(1)+'" y2="'+(cy+Math.sin(a)*(R-2)).toFixed(1)+'" stroke-width="6.5" stroke-linecap="round"/>'}
    [-1,1].forEach(function(s){var fa=Math.PI*1.5+s*sv*Math.PI/180;o+='<line x1="'+(cx+Math.cos(fa)*(R+6)).toFixed(1)+'" y1="'+(cy+Math.sin(fa)*(R+6)).toFixed(1)+'" x2="'+(cx+Math.cos(fa)*(R+20)).toFixed(1)+'" y2="'+(cy+Math.sin(fa)*(R+20)).toFixed(1)+'" stroke="#E24B4A" stroke-width="3" stroke-linecap="round"/><text x="'+(cx+Math.cos(fa)*(R+30)).toFixed(1)+'" y="'+(cy+Math.sin(fa)*(R+30)+4).toFixed(1)+'" font-size="11" font-weight="700" text-anchor="middle" fill="#ff8a88">'+sv+'°</text>'});
    // pointer: a glowing yellow triangle just inside the LED ring, pointing at it
    o+='<g id="tgP" transform="rotate(0 '+cx+' '+cy+')"><path d="M'+cx+' '+(cy-R+22)+' L'+(cx+10)+' '+(cy-R+42)+' L'+(cx-10)+' '+(cy-R+42)+' Z" fill="url(#tgT)" stroke="#fff6c2" stroke-width="1.2" stroke-linejoin="round" filter="url(#tgG)"/></g>';
    o+='<text id="tgD" x="'+cx+'" y="'+(cy-30)+'" font-size="40" font-weight="700" text-anchor="middle" font-family="Barlow Condensed,sans-serif"></text><text id="tgV" x="'+cx+'" y="'+(cy-8)+'" font-size="13" text-anchor="middle"></text>';
    g.innerHTML=o;TLX.seg=[].slice.call(g.querySelectorAll('.tls'));TLX.lit=[];TLX.has=null;TLX.tx='';TLX.vx='';return true}
  function tlxCurve(){var c=$('#tlCurve');if(!c) return;var sv=C.tilt.sens,X0=26,Y0=8,W=274,H=138,o='',key=[sv,C.tilt.dz,C.tilt.ex,store.prefs.lang].join('|');if(TLX.ck===key&&c.firstChild) return;TLX.ck=key;
    o+='<defs><linearGradient id="tcA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84a" stop-opacity=".22"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></linearGradient></defs><rect x="'+X0+'" y="'+Y0+'" width="'+W+'" height="'+H+'" rx="12" fill="#0b0d11" stroke="#2c3340"/>';
    for(var i=1;i<4;i++) o+='<line x1="'+(X0+W*i/4)+'" y1="'+Y0+'" x2="'+(X0+W*i/4)+'" y2="'+(Y0+H)+'" stroke="#1a1e25"/><line x1="'+X0+'" y1="'+(Y0+H*i/4)+'" x2="'+(X0+W)+'" y2="'+(Y0+H*i/4)+'" stroke="#1a1e25"/>';
    var dzw=Math.min(.9,C.tilt.dz/sv)*W/2;o+='<rect x="'+(X0+W/2-dzw)+'" y="'+(Y0+1)+'" width="'+(dzw*2)+'" height="'+(H-2)+'" fill="rgba(239,159,39,.16)"/>';
    o+='<line x1="'+X0+'" y1="'+(Y0+H-4)+'" x2="'+(X0+W)+'" y2="'+(Y0+4)+'" stroke="#3a414d" stroke-dasharray="3 4"/>';
    var d='';for(var k=0;k<=120;k++){var x=-1+2*k/120,y=tiltShape(x,sv);d+=(k?'L':'M')+(X0+W/2+x*W/2).toFixed(1)+' '+(Y0+H/2-y*(H/2-6)).toFixed(1)}
    o+='<path d="'+d+'L'+(X0+W)+' '+(Y0+H/2)+'L'+X0+' '+(Y0+H/2)+'Z" fill="url(#tcA)"/><path d="'+d+'" fill="none" stroke="#ffd84a" stroke-width="3" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px rgba(255,216,74,.6))"/>';
    o+='<circle id="tcP" r="7" fill="#fff" stroke="#ffd84a" stroke-width="3" cx="-50" cy="-50"/>';
    o+='<text x="'+X0+'" y="'+(Y0+H+17)+'" font-size="11" fill="#8a93a0">−'+sv+'°</text><text x="'+(X0+W)+'" y="'+(Y0+H+17)+'" font-size="11" text-anchor="end" fill="#8a93a0">+'+sv+'°</text><text x="'+(X0+W/2)+'" y="'+(Y0+H+17)+'" font-size="11" text-anchor="middle" fill="#8a93a0">'+wesc(tr2('phone tilt'))+'</text><text x="'+(X0+W/2+6)+'" y="'+(Y0+15)+'" font-size="10.5" fill="#8a93a0">'+wesc(tr2('steering'))+'</text>';
    c.innerHTML=o}
  function tlxFrame(){TLX.raf=0;
    if(!C.tilt||!C.tilt.on||typeof V2==='undefined'||!V2||V2.v!=='m-tilt'||document.hidden) return;
    if(!tlxBuild()) return;tlxCurve();
    var p=tiltPreview(),sv=C.tilt.sens,has=!!p;
    if(p){var td=Math.max(-90,Math.min(90,p.deg));TLX.d+=(td-TLX.d)*0.55;if(Math.abs(td-TLX.d)<.05) TLX.d=td;TLX.v=tiltShape(Math.max(-1,Math.min(1,TLX.d/sv)),sv)}
    var deg=TLX.d,v=has?TLX.v:0;
    var P=$('#tgP');if(P){P.setAttribute('transform','rotate('+deg.toFixed(2)+' '+TLC+' '+TLY+')');P.style.opacity=has?1:.25}
    for(var i=0;i<33;i++){var q=(i-16)/16,lit=has&&((v<0&&q<0&&q>=v-.001)||(v>0&&q>0&&q<=v+.001)||i===16),c=lit?tlxCol(Math.abs(q)):(Math.abs(q)>.94?'rgba(226,75,74,.35)':'rgba(150,160,175,.22)');
      if(TLX.lit[i]!==c){TLX.lit[i]=c;var e=TLX.seg[i];e.setAttribute('stroke',c);e.style.filter=lit?'drop-shadow(0 0 4px '+c+')':''}}
    var tx=has?((deg<-.5?'−':'')+Math.abs(Math.round(deg))+'°'):'—';if(TLX.tx!==tx){TLX.tx=tx;var D=$('#tgD');D.textContent=tx;D.setAttribute('fill',has?'#e8e8ea':'#59606c')}
    var vx=!has?tr2('No tilt data yet'):v===0?tr2('Straight'):Math.round(Math.abs(v)*100)+'% '+tr2(v<0?'left':'right');if(TLX.vx!==vx){TLX.vx=vx;var V=$('#tgV');V.textContent=vx;V.setAttribute('fill',v===0?'#8a93a0':tlxCol(Math.abs(v)))}
    var cp=$('#tcP');if(cp){if(has){var x=Math.max(-1,Math.min(1,deg/sv));cp.setAttribute('cx',(26+137+x*137).toFixed(1));cp.setAttribute('cy',(8+69-tiltShape(x,sv)*63).toFixed(1))}else cp.setAttribute('cx','-50')}
    TLX.raf=requestAnimationFrame(tlxFrame)}
  function tlxPaint(){if(!TLX.raf) TLX.raf=requestAnimationFrame(tlxFrame)}
  function cfgOf(k){return k?C.s2:C.s1}
  // right stick straight to the channels chosen on the Gamepad page (no board joystick needed)
  // a stick straight to the channels chosen on the Gamepad page (left: C.pad.ls, right: C.pad.rs)
  function stickOn(cf){return !!cf&&((cf.a>=0&&isActive(cf.a))||(cf.b>=0&&isActive(cf.b)))}
  // what gamepad stick k (0 left, 1 right) drives, in the same order the gamepad loop uses:
  // its own channels, else the board joystick, else stick 1 of the classic screen (left stick only)
  function stickDrive(k){
    var cf=k?C.pad.rs:C.pad.ls;
    if(stickOn(cf)) return {a:cf.a,b:cf.b,mx:!!cf.mx};
    var bp=(C.layout==='board'&&typeof BD_PADS!=='undefined')?BD_PADS.filter(function(p){return p.jp.isConnected}):[];
    if(k===1&&bp.length<2) return null;
    if(bp[k]) return {a:bp[k].it.c,b:bp[k].it.d,mx:bp[k].it.m!=='axis'};
    if(k===0&&C.s1) return {a:C.s1.a,b:C.s1.b,mx:C.s1.mode!=='axis'};
    return null;
  }
  // tr2 throws until the language tables load (these labels are first painted while the app starts)
  function trSafe(x){try{return tr2(x)}catch(_){return x}}
  function stickLabel(k){
    var d=stickDrive(k);if(!d) return '';
    var a=d.a>=0&&isActive(d.a)?tagOf(d.a):'',b=d.b>=0&&isActive(d.b)?tagOf(d.b):'';
    if(!a&&!b) return '';
    if(d.mx) return [a,b].filter(Boolean).join(' + ')+' · '+trSafe('TANK');
    return [a?'↕ '+a:'',b?'↔ '+b:''].filter(Boolean).join(' · ');
  }
  function stickLabelsPaint(){[['#gpLM',0],['#gpRM',1]].forEach(function(q){var el=$(q[0]);if(!el) return;var t=stickLabel(q[1]);el.textContent=t||trSafe('Not used');el.classList.toggle('off',!t)})}
  function applyStickCh(cf,x,y){
    var va,vb;
    if(cf.mx){va=clamp(y+x,-1,1);vb=clamp(y-x,-1,1)}else{va=y;vb=x}
    if(cf.a>=0&&isActive(cf.a)) setT(cf.a,va*100,false);
    if(cf.b>=0&&isActive(cf.b)) setT(cf.b,vb*100,false);
  }
  function applyStick(k,x,y){
    var cf=cfgOf(k), va, vb;
    if(cf.mode==='axis'){va=y;vb=x}else{va=clamp(y+x,-1,1);vb=clamp(y-x,-1,1)}
    va*=(C.zone||100)/100;vb*=(C.zone||100)/100;
    if(cf.a>=0) setT(cf.a,va*100,false);
    if(cf.b>=0) setT(cf.b,vb*100,false);
  }
  // the gamepad drives stick 1 and 2 (when the board has no joysticks): keep their channels valid
  function syncSticks(){
    var idxs=activeIdx();
    [0,1].forEach(function(k){var cf=cfgOf(k);['a','b'].forEach(function(key,q){var cur=cf[key];
      if(!(k===1&&cur===-1)&&idxs.indexOf(cur)<0) cf[key]=idxs.length?idxs[Math.min(q+k*2,idxs.length-1)]:-1})});
  }
  function syncTiltUi(){
    if(!tlOn||!C.tilt) return;
    tlOn.checked=C.tilt.on;tlOpt.hidden=!C.tilt.on;tlSens.value=String(C.tilt.sens);tlInv.checked=C.tilt.inv;tlAll.checked=C.tilt.all;
    [['#sTlOn',C.tilt.on],['#sTlInv',C.tilt.inv],['#sTlAll',C.tilt.all]].forEach(function(q){var b=$(q[0]);if(b) b.setAttribute('aria-checked',String(!!q[1]))});
    Array.prototype.forEach.call(document.querySelectorAll('#tlSeg button'),function(b){b.setAttribute('aria-pressed',String(+b.dataset.v===C.tilt.sens))});
    var dz=$('#tlDz'),ex=$('#tlEx');if(dz){dz.value=String(C.tilt.dz);$('#tlDzO').textContent=C.tilt.dz+'°';ex.value=String(C.tilt.ex);$('#tlExO').textContent=C.tilt.ex+'%'}
    var cn=$('#tlCNote');if(cn) cn.textContent=tr2(C.tilt.c0!=null?'Fixed centre: the position you set is straight ahead.':'Auto centre: wherever you hold the phone when you touch the joystick is straight ahead.');
    if(typeof TLX!=='undefined'&&TLX){TLX.k='';TLX.ck='';if(C.tilt.on) tlxPaint()}
    tiltNative();
  }
  function syncLayout(){
    cols.classList.add('board');
    syncBoard();
    var mapped={}, multi=activeSlots().length>1, first=false, visible=[0,0,0];
    refs.forEach(function(r,i){
      var hid=!isActive(i)||!!mapped[i];
      r.el.hidden=hid;
      r.el.classList.remove('first');
      if(!hid){visible[(i/PER)|0]++;if(!first&&!(multi)){r.el.classList.add('first');first=true}}
    });
    groups.forEach(function(g,s){
      g.hidden=!(multi&&slotOn(s)&&visible[s]>0);
      g.textContent='Hub M'+(C.hubs[s]+1)+((C.hubNames&&C.hubNames[C.hubs[s]])?' · '+C.hubNames[C.hubs[s]]:'');
    });
  }

  /* ---------- Settings & hubs ---------- */
  var limit=$('#limit'), ramp=$('#ramp'), loopBox=$('#loop');
  var gpOn=$('#gpOn'), gpDead=$('#gpDead'), gpTrig=$('#gpTrig'), gpStat=$('#gpStat');
  function syncSettings(){
    limit.value=C.limit;ramp.value=C.ramp;loopBox.checked=S.loop;
    $('#limitOut').textContent=C.limit+'%';$('#rampOut').textContent=C.ramp;
    gpOn.checked=C.pad.on;gpDead.value=C.pad.dead;$('#gpDeadOut').textContent=C.pad.dead+'%';var sg=$('#sGpOn');if(sg) sg.setAttribute('aria-checked',String(!!C.pad.on));
    gpTrig.innerHTML='';
    var no=document.createElement('option');no.value='-1';no.textContent='None';gpTrig.appendChild(no);
    activeIdx().forEach(function(i){var o=document.createElement('option');o.value=String(i);o.textContent=tagOf(i)+' · '+C.ch[i].name;gpTrig.appendChild(o)});
    if(C.pad.trig>=0&&!isActive(C.pad.trig)) C.pad.trig=-1;
    gpTrig.value=String(C.pad.trig);
    gpRsPaint();
    for(var s=0;s<3;s++){
      $('#hub'+s).value=String(C.hubs[s]);var hts=$('#hubT'+s);if(hts){hts.value=String(C.hubT[s]);hts.disabled=C.hubs[s]<0}
      var hn=$('#hubN'+s);hn.disabled=C.hubs[s]<0;hn.value=C.hubs[s]>=0?(C.hubNames[C.hubs[s]]||''):'';
    }
    if(window.hAddrPaint) window.hAddrPaint();
    $('#zoneSel').value=String(C.zone||100);
    $('#calPwr').value=C.testPwr;$('#calPwrOut').textContent=C.testPwr+'%';
    syncLimSeg();
  }
  function syncLimSeg(){
    var lm=store.prefs.lim;
    [0,1,2].forEach(function(i){
      $('#limV'+i).textContent=lm[i].l+'%';
      $('#limP'+i).setAttribute('aria-pressed',String(C.limit===lm[i].l));
    });
  }
  [0,1,2].forEach(function(i){
    $('#limP'+i).addEventListener('click',function(){
      var p=store.prefs.lim[i];C.limit=p.l;C.ramp=p.r;save();syncSettings();feedback('ok');
    });
  });
  [0,1,2].forEach(function(i){
    $('#limS'+i).addEventListener('click',function(){
      store.prefs.lim[i]={l:C.limit,r:C.ramp};save();syncLimSeg();toast('Profile saved.');
    });
  });
  $('#calPwr').addEventListener('input',function(){C.testPwr=+$('#calPwr').value;$('#calPwrOut').textContent=C.testPwr+'%'});
  $('#calPwr').addEventListener('change',save);
  $('#zoneSel').addEventListener('change',function(){C.zone=pickOf($('#zoneSel').value,[25,50,75,100],100);save()});
  [0,1,2].forEach(function(s){
    var inp=$('#hubN'+s);
    inp.addEventListener('input',function(){
      if(C.hubs[s]<0) return;
      C.hubNames[C.hubs[s]]=inp.value.replace(/[\u0000-\u001f<>]/g,'').slice(0,12);
      syncLayout();
      save();
    });
    inp.addEventListener('change',save);
  });
  limit.addEventListener('input',function(){C.limit=+limit.value;$('#limitOut').textContent=C.limit+'%';syncLimSeg()});
  ramp.addEventListener('input',function(){C.ramp=+ramp.value;$('#rampOut').textContent=C.ramp;syncLimSeg()});
  limit.addEventListener('change',save);ramp.addEventListener('change',save);
  gpOn.addEventListener('change',function(){C.pad.on=gpOn.checked;if(!C.pad.on) releasePad();save();var sg=$('#sGpOn');if(sg) sg.setAttribute('aria-checked',String(!!C.pad.on))});
  (function(){var sg=$('#sGpOn');if(sg) sg.addEventListener('click',function(){gpOn.checked=!gpOn.checked;gpOn.dispatchEvent(new Event('change'))})})();
  gpDead.addEventListener('input',function(){C.pad.dead=+gpDead.value;$('#gpDeadOut').textContent=C.pad.dead+'%'});
  gpDead.addEventListener('change',save);
  gpTrig.addEventListener('change',function(){releasePad();C.pad.trig=+gpTrig.value;save()});
  // Right stick straight to channels (Gamepad page): used instead of the board's second joystick
  // (the left stick has the same choices: #gpLsA / #gpLsB / #gpLsMx -> C.pad.ls)
  function gpRsPaint(){['rs','ls'].forEach(gpStickPaint);stickLabelsPaint()}
  function gpStickPaint(key){
    var pre=key==='rs'?'#gpRs':'#gpLs';
    if(!C.pad[key]) C.pad[key]={a:-1,b:-1,mx:false};
    var cf=C.pad[key];
    [[pre+'A','a'],[pre+'B','b']].forEach(function(q){var sel=$(q[0]);if(!sel) return;sel.innerHTML='';
      var no=document.createElement('option');no.value='-1';no.textContent='None';sel.appendChild(no);
      activeIdx().forEach(function(i){var o=document.createElement('option');o.value=String(i);o.textContent=tagOf(i)+' · '+C.ch[i].name;sel.appendChild(o)});
      if(cf[q[1]]>=0&&!isActive(cf[q[1]])) cf[q[1]]=-1;
      sel.value=String(cf[q[1]])});
    var mx=$(pre+'Mx');if(mx) mx.value=cf.mx?'1':'0';
  }
  [['rs','#gpRs'],['ls','#gpLs']].forEach(function(st){
    [['A','a'],['B','b'],['Mx','mx']].forEach(function(q){var sel=$(st[1]+q[0]);if(!sel) return;
      sel.addEventListener('change',function(){releasePad();if(!C.pad[st[0]]) C.pad[st[0]]={a:-1,b:-1,mx:false};C.pad[st[0]][q[1]]=q[1]==='mx'?sel.value==='1':+sel.value;save();stickLabelsPaint();try{v2GpDraw()}catch(_){}})})});
  loopBox.addEventListener('change',function(){S.loop=loopBox.checked});
  function onHubChange(s,v,ty){
    var h=C.hubs.slice();h[s]=v;if(ty) C.hubT[s]=ty;
    for(var t=0;t<3;t++) if(t!==s&&v>=0&&h[t]===v&&C.hubT[t]===C.hubT[s]) h[t]=-1;
    C.hubs=cleanHubs(h,C.hubT);
    stopPlay(true);
    for(var i=0;i<NMAX;i++) if(!isActive(i)){rt.t[i]=0;rt.o[i]=0;refs[i].rng.value=0;refs[i].val.textContent='0'}
    if(RH()&&S.connected){NB.stop();S.connected=false;hubMsg='';live.textContent='Hub setup changed. Tap Connect hub to reconnect.'}
    last=null;
    syncAll();paintLink();save();
  }
  [0,1,2].forEach(function(s){var sel=$('#hub'+s);sel.addEventListener('change',function(){onHubChange(s,+sel.value)});
    var ty=$('#hubT'+s);if(ty) ty.addEventListener('change',function(){var tv=+ty.value;onHubChange(s,C.hubs[s],tv===4||tv===40||tv===14||tv===16?tv:6)})});
  if(NB){
    $('#note').textContent='Frames are broadcast over Bluetooth straight to the Mould King hubs. Put each hub in Bluetooth mode, tap Connect hub and wait until it says Hub active. With several hubs each one is updated in turn, so expect slightly slower response.';
  }

  /* ---------- Model bar ---------- */
  var prof=$('#prof'), profName=$('#profName'), profDel=$('#profDel'), delArmed=0;
  function profLbl(p){return p.label||p.name||'(unnamed)'}
  function syncProfiles(){
    prof.innerHTML='';
    store.profiles.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=profLbl(p);prof.appendChild(o)});
    prof.value=store.active;
    profName.value=activeProfile().name;
    profDel.disabled=store.profiles.length<=1;
    if(typeof snapPaint==='function') snapPaint();
  }
  function syncAll(){
    refs.forEach(function(r,i){syncChannel(i)});
    syncSticks();syncSettings();syncLayout();syncProfiles();syncRec();paintAccent();paintLamps();syncSeq();syncSafety();syncApp();buildGpMap();syncRecTools();bkPaint();syncBoard();syncTiltUi();
  }
  // Model colour: tints the model's widgets (knobs, LED rings) and its card; UI accent, E-Stop and meters keep their colours
  var ACC=['#FFC400','#E24B4A','#4DA3E0','#1D9E75','#B57EDC','#E8E8EA'], ACCN=['Yellow','Red','Blue','Green','Purple','White'];
  var swBox=$('#swatches'),swBtns=ACC.map(function(c,n){
    var b=document.createElement('button');b.type='button';b.className='sw';b.style.setProperty('--c',c);b.setAttribute('aria-label',ACCN[n]);
    b.addEventListener('click',function(){C.accent=n;paintAccent();save();feedback('ok')});
    swBox.appendChild(b);return b;
  });
  function paintAccent(){
    var n=C.accent||0, de=document.documentElement;
    if(de&&de.setAttribute){if(n) de.setAttribute('data-macc',String(n));else de.removeAttribute('data-macc');if(de.style) de.style.setProperty('--macc',ACC[n])}
    swBtns.forEach(function(b,q){b.setAttribute('aria-pressed',String(q===n))});
  }
  function paintLamps(){
    var g=$('#lampG'),r=$('#lampR');
    if(g&&g.classList) g.classList.toggle('on',!!S.connected);
    if(r&&r.classList) r.classList.toggle('on',!!S.estop);
  }
  function switchProfile(id){
    var p=store.profiles.filter(function(x){return x.id===id})[0];
    if(!p)return;
    S.rec=null;stopPlay(false);
    if(typeof labelEdit==='function'&&profLabel&&!profLabel.hidden){profLabel.hidden=true;prof.hidden=false;profRen.textContent='\u270e'}
    store.active=id;C=p.cfg;recSel=null;recNote='';
    Object.keys(MUTE).forEach(function(k){delete MUTE[k]});
    zeroAll();last=null;
    syncAll();paintRec();save();
  }
  prof.addEventListener('change',function(){switchProfile(prof.value)});
  profName.addEventListener('input',function(){
    activeProfile().name=profName.value.slice(0,24);
    var o=prof.options[prof.selectedIndex];if(o)o.textContent=profLbl(activeProfile());
    save();
  });
  var profLabel=$('#profLabel'), profRen=$('#profRen');
  function labelEdit(on){
    if(on){profLabel.value=activeProfile().label||activeProfile().name;profLabel.hidden=false;prof.hidden=true;profRen.textContent='\u2713';profRen.setAttribute('aria-label','Done renaming');try{profLabel.focus();profLabel.select()}catch(e){}}
    else{profLabel.hidden=true;prof.hidden=false;profRen.textContent='\u270e';profRen.setAttribute('aria-label','Rename model in the list');save()}
  }
  profRen.addEventListener('click',function(){labelEdit(profLabel.hidden)});
  profLabel.addEventListener('input',function(){
    var ap=activeProfile();ap.label=profLabel.value.slice(0,24).trim()===ap.name?'':profLabel.value.slice(0,24);
    var o=prof.options[prof.selectedIndex];if(o)o.textContent=profLbl(ap);
    save();
  });
  profLabel.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();labelEdit(false)}});
  profLabel.addEventListener('change',function(){if(!profLabel.hidden)labelEdit(false)});
  profName.addEventListener('change',save);
  $('#profNew').addEventListener('click',function(){
    if(store.profiles.length>=MAX_MODELS){live.textContent='Model list is full.';return}
    var copy=sanitizeCfg(JSON.parse(JSON.stringify(C)));
    var p={id:uid(),name:'Model '+(store.profiles.length+1),cfg:copy};
    store.profiles.push(p);
    switchProfile(p.id);
    live.textContent='New model created from the current settings';
  });
  profDel.addEventListener('click',function(){
    if(store.profiles.length<=1)return;
    if(!delArmed){
      delArmed=setTimeout(function(){delArmed=0;profDel.textContent='Delete';profDel.classList.remove('warn')},3000);
      profDel.textContent='Confirm delete';profDel.classList.add('warn');
      return;
    }
    clearTimeout(delArmed);delArmed=0;profDel.textContent='Delete';profDel.classList.remove('warn');
    var id=store.active;
    store.profiles=store.profiles.filter(function(p){return p.id!==id});
    switchProfile(store.profiles[0].id);
  });

  /* ---------- Record & replay ---------- */
  var recBtn=$('#recBtn'), playBtn=$('#playBtn'), recStat=$('#recStat'), recSelEl=$('#recSel'), recName=$('#recName'), recDel=$('#recDel'), recDelArmed=0;
  function selectedRec(){
    var f=C.rec.filter(function(r){return r.id===recSel})[0];
    return f||C.rec[0]||null;
  }
  function syncRec(){
    var cur=selectedRec();
    recSel=cur?cur.id:null;
    recSelEl.innerHTML='';
    if(!C.rec.length){var o=document.createElement('option');o.value='';o.textContent='No recordings yet';recSelEl.appendChild(o)}
    C.rec.forEach(function(r){var o=document.createElement('option');o.value=r.id;o.textContent=r.name+' · '+fmtTime(r.dur);recSelEl.appendChild(o)});
    if(recSel) recSelEl.value=recSel;
    recName.value=cur?cur.name:'';
    syncRecTools();
    paintRec();
    if(typeof renderQuick==='function'&&quickEl) renderQuick();
  }
  function paintRec(){
    var cur=selectedRec();
    if(typeof recQBtns!=='undefined'&&recQBtns.length) try{paintQuick()}catch(_){}
    var rq=$('#recQuick');if(rq){rq.checked=!!(cur&&cur.btn);rq.disabled=!cur}
    recBtn.textContent=S.rec?'Stop recording':'Record';
    recBtn.setAttribute('aria-pressed',String(!!S.rec));
    recBtn.disabled=!S.rec&&(!!S.play||S.estop);
    playBtn.textContent=S.play?'Stop':'Play';
    playBtn.setAttribute('aria-pressed',String(!!S.play));
    playBtn.disabled=!S.play&&(!cur||!!S.rec||S.estop);
    recDel.disabled=!cur||!!S.rec||!!S.play;
    recName.disabled=!cur;
    recSelEl.disabled=!!S.rec||!!S.play||!C.rec.length;
    paintRecStatus(performance.now());
    paintQuick();
  }
  function paintRecStatus(now){
    var t='';
    if(S.rec) t='Recording '+fmtTime(now-S.rec.start)+' / '+fmtTime(MAX_REC_MS);
    else if(S.play&&now<S.play.start) t='Starts in '+Math.ceil((S.play.start-now)/1000)+' s'
    else if(S.play) t=(S.play.preview?'Preview ':'Playing ')+fmtTime(Math.min(now-S.play.start,S.play.rec.dur))+' / '+fmtTime(S.play.rec.dur)+((S.play.loop===undefined?S.loop:S.play.loop)?' (loop)':'');
    else t=recNote||'Ready';
    if(recStat.textContent!==t) recStat.textContent=t;
  }
  function syncLock(){cols.classList.toggle('locked',S.estop||!!S.play)}
  function recordSample(el,force){
    var v=rt.t.slice();
    var changed=force||!S.rec.last||v.some(function(x,i){return x!==S.rec.last[i]});
    if(changed){S.rec.pts.push([Math.round(el)].concat(v));S.rec.last=v}
  }
  function startRecord(){
    if(S.estop||S.play||S.rec) return;
    recNote='';
    S.rec={start:performance.now(),pts:[],last:null};
    recordSample(0,true);
    paintRec();
  }
  function stopRecord(){
    if(!S.rec) return;
    var el=Math.min(performance.now()-S.rec.start,MAX_REC_MS);
    recordSample(el,true);
    var pts=S.rec.pts;S.rec=null;
    var moved=pts.some(function(p){return p.slice(1).some(function(x){return x!==0})});
    if(pts.length<2||!moved){recNote='Nothing was recorded.';paintRec();return}
    if(C.rec.length>=MAX_RECS){recNote='Recording list is full. Delete one first.';paintRec();return}
    var rec={id:uid(),name:(store.prefs.lang==='ms'?'Rakaman ':'Take ')+(C.rec.length+1),dur:pts[pts.length-1][0],pts:pts};
    C.rec.push(rec);recSel=rec.id;recNote='Saved '+rec.name+' ('+fmtTime(rec.dur)+').';
    save();syncRec();
  }
  function startPlay(rec0,opts){
    var rec=(rec0&&rec0.pts)?rec0:selectedRec();
    if(!rec||S.estop||S.rec||S.play) return;
    var pv=!!(RH()&&!S.connected);
    if(pv) toast('Preview on the screen only. The hub is not connected, so nothing moves.',3500);
    S.play={preview:pv,rec:rec,start:performance.now()+((opts&&opts.delay)||0)*1000,idx:0,seq:(opts&&opts.seq)||null,tl:(opts&&opts.tl)||null,rid:(opts&&opts.rid)||null,loop:opts&&opts.loop!==undefined?!!opts.loop:undefined,reps:(opts&&opts.reps)||1};
    paintRec();syncLock();
  }
  function stopPlay(zero){
    if(!S.play) return;
    S.play=null;
    if(zero) zeroAll();
    paintRec();syncLock();
  }
  function stepPlay(now){
    var p=S.play;
    if(!p) return;
    if(p.preview&&S.connected){stopPlay(true);toast('Hub connected. Preview stopped. Press Play to run it for real.');return}
    var el=now-p.start, dur=p.rec.dur;
    if(el<0){for(var z=0;z<NMAX;z++) setT(z,0,false,true);return}
    if(el>=dur){
      if((p.loop===undefined?S.loop:p.loop)&&dur>200){p.start=now-(el%dur);el=el%dur;p.idx=0}
      else if((p.seq||p.tl)&&p.reps>1&&dur>200){p.reps--;p.start=now-(el%dur);el=el%dur;p.idx=0}
      else{stopPlay(true);return}
    }
    var pts=p.rec.pts;
    while(p.idx+1<pts.length&&pts[p.idx+1][0]<=el) p.idx++;
    var pt=pts[p.idx];
    for(var i=0;i<NMAX;i++) setT(i,isActive(i)?pt[i+1]:0,false,true);
  }
  function stepRecord(now){
    if(!S.rec) return;
    var el=now-S.rec.start;
    if(el>=MAX_REC_MS||S.rec.pts.length>=MAX_PTS){stopRecord();return}
    recordSample(el,false);
  }
  recBtn.addEventListener('click',function(){if(S.rec)stopRecord();else startRecord()});
  playBtn.addEventListener('click',function(){if(S.play)stopPlay(true);else startPlay()});
  recSelEl.addEventListener('change',function(){recSel=recSelEl.value;recNote='';syncRec()});
  recName.addEventListener('input',function(){
    var cur=selectedRec();
    if(!cur) return;
    cur.name=recName.value.slice(0,24);
    var o=recSelEl.options[recSelEl.selectedIndex];if(o)o.textContent=cur.name+' · '+fmtTime(cur.dur);
  });
  recName.addEventListener('change',function(){save();renderQuick()});
  (function(){var rq=$('#recQuick');if(rq) rq.addEventListener('change',function(){var cur=selectedRec();if(!cur) return;cur.btn=rq.checked;save();renderQuick();
    toast(rq.checked?'Added to Quick actions on the Drive screen.':'Removed from Quick actions.')})})();
  recDel.addEventListener('click',function(){
    var cur=selectedRec();
    if(!cur) return;
    if(!recDelArmed){
      recDelArmed=setTimeout(function(){recDelArmed=0;recDel.textContent='Delete';recDel.classList.remove('warn')},3000);
      recDel.textContent='Confirm';recDel.classList.add('warn');
      return;
    }
    clearTimeout(recDelArmed);recDelArmed=0;recDel.textContent='Delete';recDel.classList.remove('warn');
    C.rec=C.rec.filter(function(r){return r.id!==cur.id});
    recSel=null;recNote='Recording deleted.';save();syncRec();
  });

  /* ---------- Backup ---------- */
  var ioText=$('#ioText'), ioApply=$('#ioApply'), ioMsg=$('#ioMsg');
  function exportJson(){
    return JSON.stringify({app:'mk6console',version:3,profiles:store.profiles.map(function(p){return {name:p.name,label:p.label||'',cfg:p.cfg}}),tpls:store.prefs.tpls});
  }
  function uniqueName(n){
    var base=n||'Imported model', name=base, k=2;
    while(store.profiles.some(function(p){return p.name===name})){name=(base.slice(0,20)+' ('+k+')');k++}
    return name;
  }
  function importText(text){
    ioApply.hidden=true;ioText.hidden=true;
    if(typeof text!=='string'||text.length>1500000){ioMsg.textContent='That file is too large to import.';return}
    var data;
    try{data=JSON.parse(text)}catch(e){ioMsg.textContent='That is not valid model data.';return}
    var list=data&&Array.isArray(data.profiles)?data.profiles:(data&&data.cfg?[data]:null);
    var hasT=!!(data&&Array.isArray(data.tpls)&&data.tpls.length);
    if((!list||!list.length)&&!hasT){ioMsg.textContent='No models found in that data.';return}
    list=list||[];
    var added=0;
    list.slice(0,MAX_MODELS).forEach(function(p){
      if(!p||typeof p!=='object'||store.profiles.length>=MAX_MODELS) return;
      store.profiles.push({id:uid(),name:uniqueName(tr(String(p.name||'Imported model').slice(0,24))),label:(typeof p.label==='string'?p.label.slice(0,24):''),cfg:sanitizeCfg(p.cfg)});
      added++;
    });
    var tAdd=0;
    if(data&&Array.isArray(data.tpls)) cleanTpls(data.tpls).forEach(function(t){if(store.prefs.tpls.length<10&&!store.prefs.tpls.some(function(o){return o.name===t.name})){store.prefs.tpls.push(t);tAdd++}});
    if(tAdd&&!added) save();
    if(added){save();syncProfiles()}
    ioMsg.textContent=(added?('Imported '+added+' model'+(added===1?'':'s')+'. Pick them in the Model list.'):(tAdd?'':(store.profiles.length>=MAX_MODELS?'Nothing could be imported: the model list is full ('+MAX_MODELS+'). Delete some models first.':'Nothing could be imported.')))+(tAdd?((added?' ':'')+'Imported '+tAdd+' layout template'+(tAdd===1?'':'s')+'.'):'');
  }
  // Restore can be started from Models as well as Backup, so every import / export result also shows as a message
  window.onImportText=function(t){importText(t);try{toast(ioMsg.textContent,4000)}catch(_){}};
  window.onFileResult=function(kind,result){
    if(result==='ok') ioMsg.textContent='Models saved to file.';
    else if(result==='cancel') ioMsg.textContent='Cancelled.';
    else ioMsg.textContent=kind==='export'?'Could not save the file.':'Could not read that file.';
    if(result!=='cancel') try{toast(ioMsg.textContent,4000)}catch(_){}
  };
  $('#exBtn').addEventListener('click',function(){
    var json=exportJson();
    if(NB){ioMsg.textContent='Choose where to save the file.';try{NB.exportFile('mk6-models.json',json)}catch(e){ioMsg.textContent='Could not save the file.'}return}
    ioText.hidden=false;ioApply.hidden=true;ioText.readOnly=true;ioText.value=json;ioText.focus();ioText.select();
    try{navigator.clipboard.writeText(json).catch(function(){})}catch(e){}
    ioMsg.textContent='Copy this text and keep it somewhere safe.';
  });
  $('#imBtn').addEventListener('click',function(){
    if(NB){ioMsg.textContent='Choose a model file.';try{NB.importFile()}catch(e){ioMsg.textContent='Could not read that file.'}return}
    ioText.hidden=false;ioApply.hidden=false;ioText.readOnly=false;ioText.value='';ioText.focus();
    ioMsg.textContent='Paste exported model data, then tap Apply import.';
  });
  ioApply.addEventListener('click',function(){importText(ioText.value)});

  /* ---------- Link, E-STOP, frames ---------- */
  var link=$('#link'), live=$('#live'), last=null, lastSend=0, sent=0, t0=performance.now(), lines=[];
  var hubMsg='';
  // hub status LED in the wiring: lit only while the status shows Hub active (link up, pairing done)
  function hubLinkUp(){return !!S.connected&&hubMsg!=='Pairing…'}
  var HUB_TEXT={off:'Bluetooth is off',btoff:'Bluetooth was switched off',denied:'Permission denied',unsupported:'BLE advertising not supported',error:'Bluetooth error'};
  S.bt=true;
  function paintBt(){
    var b=$('#btBtn');if(!b) return;
    b.setAttribute('data-bt',S.bt?'on':'off');
    b.setAttribute('aria-label',S.bt?'Bluetooth on':'Bluetooth off');
    b.title=S.bt?'Bluetooth is on':'Bluetooth is off. Tap to open Bluetooth settings.';
  }
  function readBt(){S.bt=(NB&&NB.btOn)?!!NB.btOn():true;if(S.bt&&typeof hubMsg==='string'&&!S.connected&&(hubMsg===HUB_TEXT.off||hubMsg===HUB_TEXT.btoff)){hubMsg='';paintLink()}paintBt()}
  (function(){var b=$('#btBtn');if(!b) return;b.addEventListener('click',function(){
    if(NB&&NB.btSettings){try{NB.btSettings()}catch(e){}}else toast(S.bt?'Bluetooth is on.':'Bluetooth is off.');
  })})();
  readBt();
  function paintLink(){
    link.setAttribute('aria-pressed',String(S.connected));
    paintLamps();
    var t=RH()?(hubMsg||(S.connected?'Hub active':'Connect hub')):(NB?(S.connected?'Practice on':'Practice off'):(S.connected?'Simulation on':'Simulation off'));
    $('#linkText').textContent=t;
    var hs=$('#hubStat');if(hs){hs.setAttribute('data-st',!S.connected?'off':(hubMsg==='Pairing…'?'busy':'on'));hs.querySelector('span').textContent=t}
    link.setAttribute('data-st',!S.connected?'off':(hubMsg==='Pairing…'?'busy':'on'));
    link.setAttribute('aria-label',S.connected?'Disconnect hub':'Connect hub');paintBt();
    // dashboard: widgets dim while the hub is not active; the lost banner goes away once the hub is back
    document.documentElement.classList.toggle('nolink',!S.connected);
    if(!S.connected) crzOff(true);
    var lb=$('#lostBanner');if(lb&&S.connected) lb.hidden=true;
    // While the hub is active, the dashboard's Edit / Reset / model picker are locked so they cannot be hit by accident
    ['#dbEdit','#dbReset','#dbModel'].forEach(function(q){var b=$(q);if(b) b.disabled=!!S.connected&&RH()&&!bdEditing});
    // upright board: editing is only for when the hub is stopped; starting the hub ends it
    if(S.connected&&RH()&&bdEditing&&!dashOn()&&typeof bdEditEnd==='function') bdEditEnd(true);
    if(typeof bdEditPaint==='function') bdEditPaint();
    if(!S.connected) refs.forEach(function(r){r.sent.textContent='not sent'});
  }
  link.addEventListener('click',function(){
    if(bdEditing){toast('Finish editing first, then connect the hub.');return}
    last=null;
    if(RH()){
      if(S.connected){wantLink=false;NB.stop();S.connected=false;hubMsg='';stopPlay(true);if(store.prefs.linkOn){store.prefs.linkOn=false;save()}}
      else{
        if(!hubsReady()) return;
        sendHall();
        wantLink=true;hubMsg='Pairing…';S.connected=true;
        NB.start(hubMods());
      }
      paintLink();return;
    }
    S.connected=!S.connected;paintLink();
  });
  // Auto-reconnect: if the hub link was on when the app went to the background, bring it back (channels at zero) on return
  var wantLink=false,resumeAt=0,relinkTries=0;
  window.onHubState=function(s){
    if(!RH()&&s!=='stopped') return;
    last=null;
    if(s==='connecting'){S.connected=true;hubMsg='Pairing…'}
    else if(s==='ready'){S.connected=true;hubMsg='';relinkTries=0;feedback('ok');if(RH()&&!store.prefs.linkOn){store.prefs.linkOn=true;save()}}
    else if(s==='stopped'){
      S.connected=false;hubMsg='';stopPlay(true);
      if(wantLink&&RH()&&store.prefs.relink&&S.bt!==false&&!S.estop&&Date.now()-resumeAt<3000&&relinkTries<3){
        if(!hubsReady()) return;sendHall();relinkTries++;zeroAll();hubMsg='Pairing…';S.connected=true;
        try{NB.start(hubMods());toast('Reconnecting the hub. Motors are at zero.',4000)}catch(e){S.connected=false;hubMsg=''}
      }
    }
    else{
      wantLink=false;if(store.prefs.linkOn){store.prefs.linkOn=false;save()}
      var was=S.connected&&(s==='error');
      S.connected=false;hubMsg=HUB_TEXT[s]||'Error';live.textContent=hubMsg;stopPlay(true);feedback('lost');
      if(was){toast('Hub link lost. Motors stopped.',6000);var lb2=$('#lostBanner');if(lb2) lb2.hidden=false}
    }
    paintLink();
  };
  (function(){var lb=$('#lostBanner');if(lb) lb.addEventListener('click',function(){lb.hidden=true})})();
  var es=$('#estop'), banner=$('#esBanner');
  function paintEstop(){
    if(S.estop) crzOff(true);
    es.setAttribute('aria-pressed',String(S.estop));
    es.textContent=S.estop?'Release':'E-Stop';es.setAttribute('aria-label',S.estop?'Release emergency stop':'Emergency stop');
    banner.hidden=!S.estop;
    paintLamps();
    syncLock();paintRec();
  }
  // Start / stop button in 'Output only' mode: the hub link stays up, but every channel is held at 0 while outputs are off
  function toggleOut(it){
    S.outOff=!S.outOff;
    S.outMsk=[it.o0,it.o1,it.o2,it.o3,it.o4,it.o5].map(function(x){return x!==0});
    if(S.outOff){stopRecord();stopPlay(false);for(var i=0;i<NMAX;i++) if(isActive(i)&&S.outMsk[i%PER]) setT(i,0,false)}
    last=null;tick();
    live.textContent=S.outOff?'Hub output is off: the chosen channels are held at 0':'Hub output is on';
  }
  // E-Stop black box: the last 10 s of every channel's output, kept while running and frozen when E-Stop goes on
  var BBX={buf:[],last:0}, BBK='mk6bb';
  function bbRec(now){
    if(S.estop||now-BBX.last<90) return;BBX.last=now;
    var t=Date.now(),o=new Array(NMAX);for(var i=0;i<NMAX;i++) o[i]=Math.round(rt.o[i]||0);
    BBX.buf.push({t:t,o:o});while(BBX.buf.length&&t-BBX.buf[0].t>10500) BBX.buf.shift();
  }
  function bbLoad(){try{var a=JSON.parse(localStorage.getItem(BBK)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
  function bbSave(){
    var at=Date.now(),buf=BBX.buf.slice();if(buf.length<2) return;
    var o=new Array(NMAX);for(var i=0;i<NMAX;i++) o[i]=Math.round(rt.o[i]||0);buf.push({t:at,o:o});
    var used=activeIdx().filter(function(c){return buf.some(function(p){return p.o[c]!==0})});
    if(!used.length) used=activeIdx().slice(0,4);
    var rec={at:at,m:(store.profiles.filter(function(p){return p.id===store.active})[0]||{}).name||'',
      ch:used.map(function(c){return {t:tagOf(c),n:C.ch[c].name}}),d:buf.map(function(p){return [p.t-at].concat(used.map(function(c){return p.o[c]}))})};
    var a=bbLoad();a.unshift(rec);a=a.slice(0,3);try{localStorage.setItem(BBK,JSON.stringify(a))}catch(e){}
    BBX.buf=[];
  }
  function setEstop(on){
    if(S.estop===on) return;
    if(on) bbSave();
    S.estop=on;
    stopRecord();stopPlay(false);
    zeroAll();
    last=null;tick();paintEstop();
    live.textContent=S.estop?'E-Stop is on: every channel is locked at 0':'E-Stop released';
    feedback(S.estop?'estop':'release');
  }
  es.addEventListener('click',function(){setEstop(!S.estop)});
  // The on-screen E-Stop button is gone: Volume Up turns E-Stop on (MainActivity sends the key here),
  // and only a tap on the red banner releases it, so a second panic press never restarts the motors.
  window.mk6VolUp=function(){if(!S.estop) setEstop(true);else toast('E-Stop is on. Tap the red banner to release it.')};
  banner.setAttribute('tabindex','0');
  banner.addEventListener('click',function(){if(S.estop){setEstop(false);feedback('ok')}});
  banner.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&S.estop){e.preventDefault();setEstop(false)}});

  // the frame log is only written to the page while it is on screen (it used to re-layout on every frame sent)
  var LOGVIS=!window.IntersectionObserver, logDirty=false;
  function logFlush(){logDirty=false;var el=$('#log');el.textContent=lines.join('\n');el.scrollTop=el.scrollHeight}
  if(window.IntersectionObserver&&$('#log')) new IntersectionObserver(function(es){LOGVIS=es[es.length-1].isIntersecting;if(LOGVIS&&logDirty) logFlush()}).observe($('#log'));
  function logFrame(f){
    var s=((performance.now()-t0)/1000).toFixed(1).padStart(6,' ');
    var slots=activeSlots(), multi=slots.length>1;
    slots.forEach(function(sl,n){
      var part=f.slice(n*PER,n*PER+PER).map(function(v,j){return L[j]+fmt(v).padStart(4,' ')}).join(' ');
      lines.push(s+'s  '+(multi?'M'+(C.hubs[sl]+1)+' ':'')+part);
    });
    while(lines.length>60) lines.shift();
    if(LOGVIS) logFlush(); else logDirty=true;
  }

  function tick(){
    padPoll();tiltStep();bbRec(performance.now());
    if(C.layout==='board') paintBoard();
    var now=performance.now();
    stepRecord(now);stepPlay(now);swStep(now);
    safetyStep(now);
    var vals=outStep();
    for(var i=0;i<NMAX;i++){
      if(!isActive(i)) continue;
      var o=Math.round(rt.o[i]),v=vals[i];
      var r=refs[i];
      var rk=o+'|'+(S.estop?1:0)+(S.play?1:0)+(r.locked?1:0)+(S.connected?v:'')+(C.ch[i].kind==='light'?(rt.t[i]>0?'L':'l'):'');
      if(r._rk===rk) continue;r._rk=rk;
      r.track.classList.toggle('dis',!!(S.estop||S.play||r.locked));
      r.fill.style.setProperty('--lf',String((50+Math.min(0,o)/2)/100));
      r.fill.style.setProperty('--wf',String(Math.abs(o)/200));
      r.track.classList.toggle('neg',o<0);
      r.track.classList.toggle('idle',o===0);
      r.meter.style.setProperty('--m',String(Math.abs(o)));
      r.mw.classList.toggle('up',o>0);r.mw.classList.toggle('down',o<0);r.mw.classList.toggle('neg',o<0);
      if(S.connected) r.sent.textContent='out '+fmt(v);
      if(C.ch[i].kind==='light'){var lon=rt.t[i]>0;r.ltOn.setAttribute('aria-checked',String(lon));var lt2=lon?'On':'Off';if(r.ltOn.textContent!==lt2) r.ltOn.textContent=lt2}
    }
    if(S.rec||S.play) paintRecStatus(now);
    if(!S.connected) return;
    var frame=frameOf(vals);
    var changed=!last||last.length!==frame.length||frame.some(function(v,k){return v!==last[k]});
    var moving=frame.some(function(v){return v!==0});
    if(changed||now-lastSend>(moving?150:1000)){
      transport.send(frame,changed);
      last=frame;lastSend=now;sent++;
      $('#count').textContent=sent+' frames';
    }
  }

  syncAll();
  paintLink();
  paintEstop();

  // ---- Sequences and quick actions ----
  var seqSel=$('#seqSel'), seqName=$('#seqName'), seqLoop=$('#seqLoop'), seqReps=$('#seqReps'), seqSpeed=$('#seqSpeed'), seqDelay=$('#seqDelay'), stepsEl=$('#steps'), seqInfo=$('#seqInfo');
  var seqRun=$('#seqRun'), quickCard=$('#quickCard'), quickEl=$('#quick'), seqCur_=null, quickBtns=[];
  function setSeqNote(t){var a=$('#seqNote'),b=$('#qNote');if(a)a.textContent=t||'';if(b)b.textContent=t||''}
  function seqCur(){
    var f=C.seq.filter(function(x){return x.id===seqCur_})[0];
    return f||C.seq[0]||null;
  }
  function chOptions(sel,cur){
    sel.innerHTML='';
    var w=document.createElement('option');w.value='-1';w.textContent='Wait (all stopped)';sel.appendChild(w);
    var idxs=activeIdx();
    if(cur>=0&&idxs.indexOf(cur)<0) idxs.push(cur);
    idxs.forEach(function(i){var o=document.createElement('option');o.value=String(i);
      o.textContent=tagOf(i)+' · '+C.ch[i].name+(isActive(i)?'':' (hub off)');sel.appendChild(o)});
    sel.value=String(cur);
  }
  function paintSeqInfo(){
    var sq=seqCur();
    if(!sq){seqInfo.textContent='No sequence yet.';return}
    var raw=0,t=0,ls=0;
    sq.steps.forEach(function(st,n){var a=(st.par&&n>0)?ls:t;ls=a;t=Math.max(t,a+Math.round(st.dur*1000/(sq.speed||1)))});
    raw=t;
    seqInfo.textContent=sq.steps.length+' step'+(sq.steps.length===1?'':'s')+' · '+(raw/1000).toFixed(1)+' s'+(raw>MAX_REC_MS?' (too long: only the first 90 s run)':'');
  }
  function renderSteps(){
    var sq=seqCur();
    stepsEl.innerHTML='';
    if(!sq) return;
    sq.steps.forEach(function(st,n){
      var el=document.createElement('div');el.className='step';
      el.innerHTML='<div class="step-top"><span class="step-n">'+(n+1)+'</span><select class="sCh" aria-label="Channel"></select>'+
        '<button class="btn mini sUp" type="button" aria-label="Move up">&#9650;</button><button class="btn mini sDn" type="button" aria-label="Move down">&#9660;</button><button class="btn mini sDel" type="button" aria-label="Delete step">&#10005;</button></div>'+
        '<div class="step-row"><label>Power %<input class="sPwr" type="number" min="-100" max="100" step="5" inputmode="numeric"></label>'+
        '<label>Seconds<input class="sDur" type="number" min="0.1" max="60" step="0.1" inputmode="decimal"></label>'+
        '<label class="check"><input class="sPar" type="checkbox">Together</label></div>';
      stepsEl.appendChild(el);
      var ch=$('.sCh',el),pw=$('.sPwr',el),du=$('.sDur',el),pr=$('.sPar',el);
      chOptions(ch,st.ch);pw.value=st.pwr;du.value=st.dur;pr.checked=st.par;
      pr.disabled=n===0;pw.disabled=st.ch<0;
      ch.addEventListener('change',function(){st.ch=+ch.value;pw.disabled=st.ch<0;save();paintSeqInfo()});
      pw.addEventListener('change',function(){st.pwr=Math.round(num(pw.value,-100,100,st.pwr));pw.value=st.pwr;save()});
      du.addEventListener('change',function(){st.dur=Math.round(num(du.value,0.1,60,st.dur)*10)/10;du.value=st.dur;save();paintSeqInfo()});
      pr.addEventListener('change',function(){st.par=pr.checked;save();paintSeqInfo()});
      $('.sDel',el).addEventListener('click',function(){sq.steps.splice(n,1);if(sq.steps[0])sq.steps[0].par=false;save();renderSteps();paintSeqInfo()});
      $('.sUp',el).addEventListener('click',function(){if(n<1)return;sq.steps.splice(n-1,0,sq.steps.splice(n,1)[0]);sq.steps[0].par=false;save();renderSteps();paintSeqInfo()});
      $('.sDn',el).addEventListener('click',function(){if(n>=sq.steps.length-1)return;sq.steps.splice(n+1,0,sq.steps.splice(n,1)[0]);sq.steps[0].par=false;save();renderSteps();paintSeqInfo()});
    });
  }
  var recQBtns=[];
  function runRecBtn(r){
    if(S.play&&S.play.rid===r.id){stopPlay(true);return}
    if(S.play||S.rec||S.estop) return;
    startPlay(r,{rid:r.id});
  }
  function renderQuick(){
    quickEl.innerHTML='';quickBtns=[];recQBtns=[];
    var rq=C.rec.filter(function(r){return r.btn});
    quickCard.hidden=!C.seq.length&&!rq.length;
    C.seq.forEach(function(sq){
      var b=document.createElement('button');b.type='button';b.className='qbtn';b.textContent='\u25B6 '+sq.name;
      b.addEventListener('click',function(){runSeq(sq.id)});
      quickEl.appendChild(b);quickBtns.push({b:b,sq:sq});
    });
    // recordings ticked "Show as a quick button" replay with one tap
    rq.forEach(function(r){
      var b=document.createElement('button');b.type='button';b.className='qbtn qrec';b.textContent='\u25CF '+r.name;
      b.addEventListener('click',function(){noteInput();runRecBtn(r)});
      quickEl.appendChild(b);recQBtns.push({b:b,r:r});
    });
    paintQuick();
  }
  function paintQuick(){
    if(!quickBtns) return;
    recQBtns.forEach(function(q){
      var mine=!!(S.play&&S.play.rid===q.r.id);
      if(q.b.classList.contains('on')!==mine) q.b.classList.toggle('on',mine);
      var t=(mine?'\u25A0 ':'\u25CF ')+q.r.name;if(q.b.textContent!==t) q.b.textContent=t;
      var d=!mine&&(!!S.rec||!!S.play||S.estop);if(q.b.disabled!==d) q.b.disabled=d;
    });
    quickBtns.forEach(function(q){
      var mine=!!(S.play&&S.play.seq===q.sq.id);
      q.b.classList.toggle('on',mine);
      q.b.textContent=(mine?'\u25A0 ':'\u25B6 ')+q.sq.name;
      q.b.disabled=!mine&&(!!S.rec||!!S.play||S.estop||!q.sq.steps.length);
    });
    var cur=seqCur();
    seqRun.textContent=(S.play&&cur&&S.play.seq===cur.id)?'Stop':'Run';
    seqRun.disabled=!cur||!cur.steps.length||(!S.play&&(S.estop||!!S.rec))||(!!S.play&&S.play.seq!==cur.id);
    if(typeof paintBoard==='function') paintBoard();
  }
  function runSeq(id){
    var sq=C.seq.filter(function(x){return x.id===id})[0];
    if(!sq) return;
    if(S.play&&S.play.seq===id){stopPlay(true);setSeqNote('');return}
    setSeqNote('');
    if(S.play||S.rec||S.estop||!sq.steps.length) return;
    startPlay(compileSeq(sq),{seq:id,loop:sq.loop,reps:sq.reps,delay:sq.delay});
  }
  function syncSeq(){
    if(!seqSel) return;
    var cur=seqCur();seqCur_=cur?cur.id:null;
    seqSel.innerHTML='';
    if(!C.seq.length){var o=document.createElement('option');o.value='';o.textContent='No sequences yet';seqSel.appendChild(o)}
    C.seq.forEach(function(x){var o=document.createElement('option');o.value=x.id;o.textContent=x.name||'(unnamed)';seqSel.appendChild(o)});
    if(cur) seqSel.value=cur.id;
    seqSel.disabled=!C.seq.length;
    seqName.value=cur?cur.name:'';seqName.disabled=!cur;
    seqLoop.checked=!!(cur&&cur.loop);seqLoop.disabled=!cur;
    seqReps.value=String(cur?cur.reps:1);seqSpeed.value=String(cur?cur.speed:1);seqDelay.value=String(cur?cur.delay:0);
    seqReps.disabled=!cur||!!cur.loop;seqSpeed.disabled=!cur;seqDelay.disabled=!cur;
    $('#stepAdd').disabled=!cur||cur.steps.length>=MAX_STEPS;
    $('#seqDup').disabled=!cur||C.seq.length>=MAX_SEQ;
    $('#seqDel').disabled=!cur;
    $('#seqNew').disabled=C.seq.length>=MAX_SEQ;
    renderSteps();paintSeqInfo();renderQuick();buildGpMap();
  }
  seqSel.addEventListener('change',function(){seqCur_=seqSel.value;syncSeq()});
  seqName.addEventListener('input',function(){
    var c=seqCur();if(!c) return;c.name=seqName.value.slice(0,24);
    var o=seqSel.options[seqSel.selectedIndex];if(o)o.textContent=c.name||'(unnamed)';
    quickBtns.forEach(function(q){if(q.sq===c)q.b.textContent='\u25B6 '+c.name});
  });
  seqName.addEventListener('change',function(){save();renderQuick()});
  seqLoop.addEventListener('change',function(){var c=seqCur();if(c){c.loop=seqLoop.checked;seqReps.disabled=!!c.loop;save()}});
  seqReps.addEventListener('change',function(){var c=seqCur();if(c){c.reps=pickOf(seqReps.value,[1,2,3,5,10],1);save()}});
  seqSpeed.addEventListener('change',function(){var c=seqCur();if(c){c.speed=pickOf(seqSpeed.value,[0.5,0.75,1,1.5,2],1);save();paintSeqInfo()}});
  seqDelay.addEventListener('change',function(){var c=seqCur();if(c){c.delay=pickOf(seqDelay.value,[0,1,2,3,5,10],0);save()}});
  $('#stepAdd').addEventListener('click',function(){
    var c=seqCur();if(!c||c.steps.length>=MAX_STEPS) return;
    var idx=activeIdx();
    c.steps.push({ch:idx.length?idx[0]:-1,pwr:50,dur:1,par:false});
    save();syncSeq();
  });
  $('#seqNew').addEventListener('click',function(){
    if(C.seq.length>=MAX_SEQ) return;
    var n={id:uid(),name:(store.prefs.lang==='ms'?'Jujukan ':'Sequence ')+(C.seq.length+1),loop:false,reps:1,speed:1,delay:0,steps:[]};
    C.seq.push(n);seqCur_=n.id;save();syncSeq();
  });
  $('#seqDup').addEventListener('click',function(){
    var c=seqCur();if(!c||C.seq.length>=MAX_SEQ) return;
    var n=JSON.parse(JSON.stringify(c));n.id=uid();n.name=(c.name+' copy').slice(0,24);
    C.seq.push(n);seqCur_=n.id;save();syncSeq();
  });
  $('#seqDel').addEventListener('click',function(){
    var c=seqCur();if(!c) return;
    if(S.play&&S.play.seq===c.id) stopPlay(true);
    C.seq=C.seq.filter(function(x){return x!==c});seqCur_=null;save();syncSeq();
  });
  seqRun.addEventListener('click',function(){var c=seqCur();if(c) runSeq(c.id)});
  syncSeq();

  // ---- Feedback (sound, vibration), toast, safety ----
  var AC=null, toastEl=$('#toast'), toastTimer=0;
  function beep(freqs,dur){
    if(!store.prefs.sound) return;
    try{
      AC=AC||new (window.AudioContext||window.webkitAudioContext)();
      if(AC.state==='suspended'&&AC.resume) AC.resume();
      var t=AC.currentTime;
      freqs.forEach(function(f,i){
        var o=AC.createOscillator(),g=AC.createGain(),st=t+i*dur;
        o.type='square';o.frequency.value=f;
        g.gain.setValueAtTime(0.07,st);g.gain.exponentialRampToValueAtTime(0.0001,st+dur*0.9);
        o.connect(g);g.connect(AC.destination);o.start(st);o.stop(st+dur);
      });
    }catch(e){}
  }
  var FB={estop:[[440,440],0.12,'estop'],release:[[600,800],0.1,'ok'],ok:[[700,900],0.09,'ok'],lost:[[500,300],0.2,'lost'],warn:[[880,880,880],0.16,'warn'],idle:[[700,500,350],0.14,'warn'],hold:[[700,900],0.09,'hold'],tap:[[],0,'tap'],tick:[[],0,'tick'],success:[[660,990],0.08,'success']};
  var FBLAST={};
  // a short click, used by the dial selector for each position (follows the Sound setting)
  function clickSnd(){
    if(!store.prefs.sound) return;
    try{
      AC=AC||new (window.AudioContext||window.webkitAudioContext)();
      if(AC.state==='suspended'&&AC.resume) AC.resume();
      var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
      o.type='square';o.frequency.setValueAtTime(1900,t);o.frequency.exponentialRampToValueAtTime(700,t+.025);
      g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);
      o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.035);
    }catch(e){}
  }
  function feedback(kind){
    var f=FB[kind];if(!f) return;
    if(kind==='warn'||kind==='idle'){var nw=Date.now();if(nw-(FBLAST.w||0)<2500) return;FBLAST.w=nw}
    if(f[0].length) beep(f[0],f[1]);
    if(store.prefs.haptic&&NB&&NB.haptic){try{NB.haptic(f[2])}catch(e){}}
  }
  function toast(msg,ms){
    if(!toastEl) return;
    toastEl.textContent=msg;toastEl.hidden=false;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){toastEl.hidden=true},ms||4500);
  }
  var lastInput=performance.now(), ptrDown=0, hotSince=[], hotWarned=[];
  function noteInput(){lastInput=performance.now();if(typeof tkWake==='function') tkWake()}
  if(document.addEventListener){
    document.addEventListener('pointerdown',function(){ptrDown++;noteInput()},{passive:true});
    document.addEventListener('pointermove',noteInput,{passive:true});
    var pu=function(){ptrDown=Math.max(0,ptrDown-1);noteInput()};
    document.addEventListener('pointerup',pu,{passive:true});
    document.addEventListener('pointercancel',pu,{passive:true});
    document.addEventListener('keydown',noteInput,{passive:true});
  }
  if(typeof window.addEventListener==='function') window.addEventListener('blur',function(){ptrDown=0});
  for(var hq=0;hq<NMAX;hq++){hotSince.push(0);hotWarned.push(false)}
  function safetyStep(now){
    if(!Array.isArray(hotSince)||!hotSince.length) return;
    var sf=C.safety, any=false, i;
    for(i=0;i<NMAX;i++) if(isActive(i)&&C.ch[i].kind!=='light'&&(rt.t[i]!==0||rt.o[i]!==0)) any=true;
    if(ptrDown>0||S.play) lastInput=now;
    if(sf.idle>0&&any&&!S.estop&&!S.play&&now-lastInput>sf.idle*1000){
      zeroAll();lastInput=now;
      toast('Stopped: no input for '+sf.idle+' s');feedback('idle');
    }
    for(i=0;i<NMAX;i++){
      if(sf.run>0&&!S.play&&isActive(i)&&C.ch[i].kind!=='light'&&rt.t[i]!==0){
        if(!runSince[i]) runSince[i]=now;
        else if(now-runSince[i]>sf.run*1000){
          runBlk[i]=true;runSince[i]=0;rt.t[i]=0;unlockCh(i);refs[i].rng.value=0;refs[i].val.textContent='0';
          toast('Channel '+tagOf(i)+' stopped after '+sf.run+' s of running. Move it back to 0, then start again.',6000);feedback('warn');
        }
      }else runSince[i]=0;
    }
    for(i=0;i<NMAX;i++){
      if(isActive(i)&&C.ch[i].kind!=='light'&&Math.abs(rt.o[i])>=90){
        if(!hotSince[i]) hotSince[i]=now;
        else if(sf.warn>0&&!hotWarned[i]&&now-hotSince[i]>sf.warn*1000){
          hotWarned[i]=true;
          toast('Channel '+tagOf(i)+' has run near full power for '+sf.warn+' s. Let the motor rest.',6000);feedback('warn');
        }
      }else{hotSince[i]=0;hotWarned[i]=false}
    }
  }
  window.onAppEvent=function(ev){
    if(ev==='resume'){resumeAt=Date.now();tiltNative()}
    if(ev==='notilt') toast('This phone has no tilt sensor.',5000);
    if(ev==='backupok'){store.prefs.lastBackup=Date.now();save();bkPaint();if(bkManual) toast('Backup saved to the Downloads folder.',4000);bkManual=false}
    if(ev==='backupfail'){if(bkManual) toast('Backup failed. Use Export models instead.',5000);bkManual=false}
    if(ev==='bt1'){S.bt=true;if(!S.connected&&(hubMsg===HUB_TEXT.off||hubMsg===HUB_TEXT.btoff)){hubMsg='';paintLink()}paintBt();
      // Bluetooth is back: bring the hub link back (channels at zero) if it was on when Bluetooth went off
      if(S.relinkBt&&store.prefs.relink&&RH()&&!S.connected&&!S.estop){S.relinkBt=false;zeroAll();setTimeout(function(){if(!S.connected&&S.bt!==false&&!bdEditing){link.click();toast('Bluetooth is back. Reconnecting the hub. Motors are at zero.',4000)}},800)}
      return}
    if(ev==='bt0'){S.bt=false;paintBt();return}
    if(ev==='resume') readBt();
    if(ev==='btoff'){
      var wasOn=S.connected;S.relinkBt=wantLink&&RH();wantLink=false;
      S.connected=false;hubMsg=HUB_TEXT.btoff;last=null;stopPlay(true);zeroAll();paintLink();
      live.textContent=hubMsg;feedback('lost');
      if(wasOn) toast('Bluetooth was switched off. Motors stopped.',8000);
    }
  };
  window.openModel=function(id){
    if(!store.profiles.some(function(p){return p.id===id})) return;
    if(id!==store.active){switchProfile(id);var p=activeProfile();toast(tr2('Opened from the shortcut')+': '+(p?p.name:''),4000)}
  };


  // ---- Calibration, phone battery ----
  var CAL_MS=1500, cal=null;
  var calStatEl=$('#calStat');
  function calShow(ids){['calStart','calOk','calRev','calAgain','calCancel'].forEach(function(id){$('#'+id).hidden=ids.indexOf(id)<0})}
  function calIdle(msg){
    if(cal){
      if(cal.timer) clearTimeout(cal.timer);
      var ci=cal.list[cal.n];if(ci!==undefined) setT(ci,0,false);
    }
    cal=null;calStatEl.textContent=msg;calShow(['calStart']);
  }
  function calRun(){
    var i=cal.list[cal.n];
    if(!S.connected||S.estop||S.play||S.rec){calIdle('Stopped. Connect the hub, release E-Stop and try again.');return}
    cal.phase='run';calShow(['calCancel']);
    calStatEl.textContent='Testing channel '+tagOf(i)+' ('+C.ch[i].name+') forward at '+C.testPwr+'%';
    noteInput();setT(i,C.testPwr,false);
    cal.timer=setTimeout(function(){
      if(!cal) return;
      setT(i,0,false);cal.phase='ask';
      calShow(['calOk','calRev','calAgain','calCancel']);
      calStatEl.textContent='Channel '+tagOf(i)+': did it move the right way?';
    },CAL_MS);
  }
  function calNext(){
    cal.n++;
    if(cal.n>=cal.list.length){calIdle('Done. Every channel is checked.');return}
    calRun();
  }
  $('#calStart').addEventListener('click',function(){
    if(cal) return;
    if(!S.connected){calStatEl.textContent='Connect the hub first (top right), then press Start.';return}
    if(S.estop||S.play||S.rec){calStatEl.textContent='Release E-Stop and stop any sequence or recording first.';return}
    cal={list:activeIdx(),n:0,phase:'run',timer:0};
    calRun();
  });
  $('#calOk').addEventListener('click',function(){if(cal&&cal.phase==='ask') calNext()});
  $('#calRev').addEventListener('click',function(){
    if(!cal||cal.phase!=='ask') return;
    var i=cal.list[cal.n];
    C.ch[i].inv=!C.ch[i].inv;syncChannel(i);save();calRun();
  });
  $('#calAgain').addEventListener('click',function(){if(cal&&cal.phase==='ask') calRun()});
  $('#calCancel').addEventListener('click',function(){if(cal) calIdle('Cancelled.')});


  var batEl=$('#bat'), batWarned=false;
  function pollBattery(){
    if(!batEl||!NB||!NB.battery) return;
    var p=-1;try{p=+NB.battery()}catch(e){}
    if(!(p>=0&&p<=100)){batEl.hidden=true;return}
    batEl.hidden=false;batEl.textContent='Phone '+p+'%';batEl.classList.toggle('low',p<=15);
    var hb=$('#hbat');if(hb){hb.hidden=false;hb.textContent='\u00b7 \ud83d\udd0b '+p+'%';hb.classList.toggle('low',p<=15)}
    if(p<=15&&!batWarned){batWarned=true;toast('Phone battery is low ('+p+'%). Charge it before driving.',6000);feedback('warn')}
    if(p>20) batWarned=false;
  }
  setInterval(pollBattery,30000);pollBattery();


  // ---- Speed profiles, run limiter setting, recording tools, backup ----
  var sfRun=$('#sfRun');
  sfRun.addEventListener('change',function(){C.safety.run=pickOf(sfRun.value,[0,10,20,30,60],0);save()});

  var recFrom=$('#recFrom'), recTo=$('#recTo'), recJoinSel=$('#recJoinSel');
  function recAddNew(name,pts){
    if(C.rec.length>=MAX_RECS){recNote='Recording list is full. Delete one first.';paintRec();return}
    var dur=pts.length?pts[pts.length-1][0]:0;
    if(pts.length<2||pts.length>MAX_PTS||dur<=0||dur>MAX_REC_MS){recNote='That edit does not fit. Try a shorter one.';paintRec();return}
    var r={id:uid(),name:String(name).slice(0,24),dur:dur,pts:pts};
    C.rec.push(r);recSel=r.id;recNote='Saved '+r.name+' ('+fmtTime(r.dur)+').';save();syncRec();
  }
  function recRows(rec){return rec.pts.map(function(p){return p.slice()})}
  $('#recSpdGo').addEventListener('click',function(){
    var cur=selectedRec();if(!cur||S.rec||S.play) return;
    var f=+$('#recSpd').value;if(!(f>0)) return;
    var pts=cur.pts.map(function(p){return [Math.round(p[0]/f)].concat(p.slice(1))});
    recAddNew(cur.name+' x'+f,pts);
  });
  $('#recTrim').addEventListener('click',function(){
    var cur=selectedRec();if(!cur||S.rec||S.play) return;
    var a=Math.round((+recFrom.value||0)*1000), b=Math.min(Math.round((+recTo.value||0)*1000),cur.dur);
    if(!(a>=0&&b>a)){recNote='Set a start before the end.';paintRec();return}
    var base=null, mid=[];
    cur.pts.forEach(function(p){ if(p[0]<=a) base=p; else if(p[0]<b) mid.push(p) });
    var first=(base||cur.pts[0]).slice(1);
    var lastv=(mid.length?mid[mid.length-1]:(base||cur.pts[0])).slice(1);
    var pts=[[0].concat(first)].concat(mid.map(function(p){return [p[0]-a].concat(p.slice(1))})).concat([[b-a].concat(lastv)]);
    recAddNew(cur.name+' cut',pts);
  });
  $('#recJoin').addEventListener('click',function(){
    var cur=selectedRec();if(!cur||S.rec||S.play) return;
    var other=C.rec.filter(function(r){return r.id===recJoinSel.value})[0];
    if(!other) return;
    var pts=recRows(cur), gap=cur.dur+200, zero=[gap];
    for(var z=0;z<NMAX;z++) zero.push(0);
    pts.push(zero);
    other.pts.forEach(function(p){pts.push([p[0]+gap+200].concat(p.slice(1)))});
    recAddNew(cur.name+'+'+other.name,pts);
  });
  $('#recCopy').addEventListener('click',function(){
    var cur=selectedRec();if(!cur||S.rec||S.play) return;
    recAddNew(cur.name+' copy',recRows(cur));
  });
  function syncRecTools(){
    var cur=selectedRec();
    if(!recJoinSel) return;
    recJoinSel.innerHTML='';
    C.rec.forEach(function(r){var o=document.createElement('option');o.value=r.id;o.textContent=r.name;recJoinSel.appendChild(o)});
    recFrom.value='0';recTo.value=cur?(cur.dur/1000).toFixed(1):'1';
  }

  // Backup to the Downloads folder (native side only)
  var BK_MS=7*24*3600*1000, bkAuto=$('#bkAuto'), bkNow=$('#bkNow'), bkMsg=$('#bkMsg'), bkManual=false;
  function bkPaint(){
    if(!bkMsg) return;
    var t=store.prefs.lastBackup;
    bkMsg.textContent=t?('Last backup: '+new Date(t).toLocaleDateString()+'. File: Downloads/MK6-Console-backup.json'):'No backup yet. The file goes to Downloads/MK6-Console-backup.json.';
    bkAuto.checked=store.prefs.autoBackup;
    bkNow.hidden=!(NB&&NB.autoBackup);
    bkAuto.disabled=!(NB&&NB.autoBackup);
  }
  function bkRun(manual){
    if(!(NB&&NB.autoBackup)) return;
    bkManual=!!manual;
    try{NB.autoBackup(exportJson())}catch(e){}
  }
  function bkCheck(){
    if(!(NB&&NB.autoBackup)||!store.prefs.autoBackup) return;
    if(Date.now()-store.prefs.lastBackup>BK_MS) bkRun(false);
  }
  // ---- Board history: the last 3 boards of the current model, saved whenever editing finishes ----
  var SNAPK='mk6.boardsnaps';
  function snapLoad(){try{var a=JSON.parse(localStorage.getItem(SNAPK)||'[]');return Array.isArray(a)?a.filter(function(x){return x&&typeof x.p==='string'&&Array.isArray(x.b)&&isFinite(+x.t)}):[]}catch(e){return []}}
  function snapBoard(){
    try{
      if(!C.board||!C.board.length) return;
      var all=snapLoad(),pid=store.active,js=JSON.stringify(C.board),mine=all.filter(function(x){return x.p===pid});
      if(mine.length&&JSON.stringify(mine[0].b)===js) return;
      var rest=all.filter(function(x){return x.p!==pid});
      mine.unshift({p:pid,t:Date.now(),b:JSON.parse(js)});
      localStorage.setItem(SNAPK,JSON.stringify(mine.slice(0,3).concat(rest).slice(0,24)));
    }catch(e){}
    snapPaint();
  }
  function snapPaint(){
    var box=$('#snapList');if(!box) return;
    box.innerHTML='';
    var mine=snapLoad().filter(function(x){return x.p===store.active}).slice(0,3);
    if(!mine.length){var e=document.createElement('div');e.className='note';e.textContent='No saved boards yet.';box.appendChild(e);return}
    mine.forEach(function(x,i){
      var row=document.createElement('div');row.className='snaprow';
      var d=new Date(+x.t),tx=document.createElement('span');
      tx.textContent=(i===0?'Latest':'Earlier '+i)+' ';
      var sm=document.createElement('small');sm.textContent=d.toLocaleDateString([], {day:'numeric',month:'short'})+' '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+' \u00b7 '+x.b.length+' widgets';
      tx.appendChild(sm);
      var b=document.createElement('button');b.type='button';b.className='btn';b.textContent='Restore';
      b.addEventListener('click',function(){
        C.board=cleanBoard(x.b);bdEditing=false;dashAdd=false;save();syncBoard();toast('Board restored.');feedback('ok');
      });
      row.appendChild(tx);row.appendChild(b);box.appendChild(row);
    });
  }
  window.__snap={take:snapBoard,list:snapLoad};
  snapPaint();
  setTimeout(snapBoard,5000);
  bkAuto.addEventListener('change',function(){store.prefs.autoBackup=bkAuto.checked;save()});
  bkNow.addEventListener('click',function(){bkRun(true)});
  setInterval(bkCheck,3600000);
  setTimeout(bkCheck,4000);
  bkPaint();

  // ---- Tilt settings ----
  var tlOn=$('#tlOn'), tlOpt=$('#tlOpt'), tlSens=$('#tlSens'), tlInv=$('#tlInv'), tlAll=$('#tlAll'), tlSt=$('#tlSt');
  tlOn.addEventListener('change',function(){
    C.tilt.on=tlOn.checked;tlOpt.hidden=!C.tilt.on;TILT.zero=null;save();tiltNative();
    if(C.tilt.on) setTimeout(function(){if(!TILT.has) toast('No tilt sensor data yet. Check that the phone has an accelerometer.',5000)},1500);
  });
  tlSens.addEventListener('change',function(){C.tilt.sens=pickOf(tlSens.value,[30,45,60],45);save()});
  tlInv.addEventListener('change',function(){C.tilt.inv=tlInv.checked;save()});
  tlAll.addEventListener('change',function(){C.tilt.all=tlAll.checked;save();syncBoard()});
  // new card controls drive the stored checkboxes and select, so the handlers above keep doing the work
  [['#sTlOn',tlOn],['#sTlInv',tlInv],['#sTlAll',tlAll]].forEach(function(q){var b=$(q[0]);if(b) b.addEventListener('click',function(){q[1].checked=!q[1].checked;q[1].dispatchEvent(new Event('change'));syncTiltUi()})});
  Array.prototype.forEach.call(document.querySelectorAll('#tlSeg button'),function(b){b.addEventListener('click',function(){tlSens.value=b.dataset.v;tlSens.dispatchEvent(new Event('change'));syncTiltUi()})});
  (function(){var dz=$('#tlDz'),ex=$('#tlEx');if(!dz) return;
    dz.addEventListener('input',function(){C.tilt.dz=+dz.value;$('#tlDzO').textContent=dz.value+'°';TLX.ck='';tlxPaint()});dz.addEventListener('change',save);
    ex.addEventListener('input',function(){C.tilt.ex=+ex.value;$('#tlExO').textContent=ex.value+'%';TLX.ck='';tlxPaint()});ex.addEventListener('change',save);
    $('#tlCentre').addEventListener('click',function(){var a=tiltAngle();if(a===null){toast('No tilt sensor data yet. Hold the phone upright or sideways.');return}C.tilt.c0=Math.round(a*10)/10;TILT.zero=C.tilt.c0;save();feedback('ok');syncTiltUi();toast('This position is now straight ahead.')});
    $('#tlAuto').addEventListener('click',function(){C.tilt.c0=null;TILT.zero=null;save();syncTiltUi();toast('Auto centre: straight ahead is where you hold the phone when you touch the joystick.',4000)})})();

  // ---- Board layout ----
  var bdGrid=$('#boardGrid'), bdEditor=$('#bdEditor'), bdEditBtn=$('#bdEdit'), bdNote=$('#bdNote');
  var bdSel=[$('#bdTarget'),$('#bdTarget2'),$('#bdTarget3'),$('#bdTarget4')];
  var bdFields=[$('#bdF1'),$('#bdF2'),$('#bdF3'),$('#bdF4')], bdLbl=[$('#bdL1'),$('#bdL2'),$('#bdL3'),$('#bdL4')];
  var bdModeF=$('#bdFM'), bdMode=$('#bdMode'), bdWideChk=$('#bdWideChk'), bdSpring=$('#bdSpring'), bdSpringL=$('#bdSpringL');
  var bdTypes=[['sw',$('#bdTSW')],['tl',$('#bdTTL')],['s',$('#bdTS')],['j',$('#bdTJ')],['d',$('#bdTD')],['m',$('#bdTM')],['l',$('#bdTL')],['t',$('#bdTT')],['b',$('#bdTB')],['w',$('#bdTW')],['a',$('#bdTA')],['y',$('#bdTY')],['f',$('#bdTF')],['f',$('#bdTFN')],['lx',$('#bdTXmx')],['lx',$('#bdTXeq')],['lx',$('#bdTXts')],['lx',$('#bdTXgi')],['lx',$('#bdTXlp')],['lx',$('#bdTXtk')],['i',$('#bdTI')],['k',$('#bdTK')],['n',$('#bdTN')],['rs',$('#bdTRS')],['g',$('#bdTG')],['st',$('#bdTST')],['lv',$('#bdTLV')],['dp',$('#bdTDP')],['xy',$('#bdTXY')],['xf',$('#bdTXF')],['ro',$('#bdTRO')],['ax',$('#bdTAX')],['z',$('#bdTZ')],['e',$('#bdTE')],['ps',$('#bdTPS')]];
  var bdRat=(typeof document.querySelectorAll==='function')?[].slice.call(document.querySelectorAll('.bdRat')):[$('.bdRat'),$('.bdRat'),$('.bdRat'),$('.bdRat')], bdMixRow=$('#bdMixRow');
  bdRat.forEach(function(sel){[100,75,50,25,-25,-50,-75,-100].forEach(function(v){bdOpt(sel,String(v),(v>0?'+':'')+v+'%')});sel.value='100'});
  var BPRE={bdTFN:{nd:1},bdTXmx:{t:'mx'},bdTXeq:{t:'eq'},bdTXts:{t:'ts'},bdTXgi:{t:'gi'},bdTXlp:{t:'lp'},bdTXtk:{t:'tk'}}, bdBtn=null, bdK='s', bdEditing=false, bdPick=null, bdPickAt=0, bdW=[], dashAdd=false;
  function bdOpt(sel,v,t){var o=document.createElement('option');o.value=v;o.textContent=t;sel.appendChild(o)}
  function bdFill(){
    if(!bdSel[0]) return;
    var chans=activeIdx(), tank=bdMode.value==='tank';
    var n=(bdK==='e'||bdK==='z'||bdK==='rs'||bdK==='ps'||bdK==='tl')?0:(bdK==='j'||bdK==='w'||bdK==='dp'||bdK==='xy'||bdK==='xf')?2:(bdK==='d'||bdK==='m'?4:1);
    var L=bdK==='w'?['Output A','Output B']:bdK==='xy'?['X (left / right)','Y (up / down)']:bdK==='xf'?['Left side','Right side']:bdK==='ro'||bdK==='ax'?['Channel']:bdK==='sw'?['Swing channel']:(bdK==='l'||bdK==='t'||bdK==='b'||bdK==='g'||bdK==='st'||bdK==='lv'||bdK==='n'||bdK==='a'||bdK==='y'||bdK==='f'||bdK==='i'||bdK==='k')?[bdK==='l'?'Light channel':'Channel']:bdK==='m'?['Channel 1','Channel 2','Channel 3','Channel 4']:((bdK==='s')?['Channel']:
      (bdK==='dp'?(tank?['Left motor','Right motor']:['Drive','Steer']):
      (bdK==='j'?(tank?['Left motor','Right motor']:['Drive','Steer']):
      (tank?['Left stick: Left motor','Left stick: Right motor','Right stick: Left motor','Right stick: Right motor']:
            ['Left stick: Drive','Left stick: Steer','Right stick: Drive','Right stick: Steer']))));
    if(bdK==='lx'){var lxt0=bdPre().t;n=lxt0==='tk'?0:1;L=[{mx:'Drive channel',eq:'First channel',ts:'Steering channel',gi:'Gear channel',lp:'First light channel'}[lxt0]||'Channel']}
    bdSel.forEach(function(sel,q){
      var show=q<n;
      bdFields[q].hidden=!show;
      sel.innerHTML='';
      if(!show) return;
      bdLbl[q].textContent=L[q]||'';
      var none=((bdK==='j'||bdK==='d'||bdK==='dp')&&(q===1||q===3))||(bdK==='m'&&q>=1);
      if(none) bdOpt(sel,'-1','None');
      chans.forEach(function(i){bdOpt(sel,String(i),tagOf(i)+' · '+C.ch[i].name)});
      if(bdK==='m'){sel.value=(q===0&&chans.length)?String(chans[0]):'-1'}
      else if(chans.length>q) sel.value=String(chans[q]);
    });
    bdModeF.hidden=!(bdK==='j'||bdK==='d'||bdK==='dp');
    bdSpringL.hidden=!(bdK==='s'||bdK==='j'||bdK==='d'||bdK==='m');
    bdMixRow.hidden=bdK!=='m';
    $('#bdLightRow').hidden=bdK!=='l';
    $('#bdTgRow').hidden=bdK!=='t'&&bdK!=='y';
    $('#bdTgStyle').hidden=bdK==='y';
    bdRat.forEach(function(sel,q){sel.hidden=q>=n||bdK!=='m'});
  }
  function bdSetKind(k){
    bdK=k;
    if(bdBtn&&!bdTypes.some(function(t){return t[1].id===bdBtn&&t[0]===k})) bdBtn=null;
    bdTypes.forEach(function(t){t[1].setAttribute('aria-pressed',String(t[0]===k&&(bdBtn?t[1].id===bdBtn:!BPRE[t[1].id])))});
    bdWideChk.checked=(k==='j'||k==='d'||k==='m'||k==='tl');
    bdWideChk.disabled=(k==='d');
    if(k==='d') bdWideChk.checked=true;
    bdFill();
  }
  function applyJoy(it,x,y){
    var va,vb;
    if(it.m==='axis'){va=y;vb=x}else{va=clamp(y+x,-1,1);vb=clamp(y-x,-1,1)}
    va*=(C.zone||100)/100;vb*=(C.zone||100)/100;
    setT(it.c,va*100,false);
    if(it.d>=0) setT(it.d,vb*100,false);
  }
  var BD_UNDO=[], BD_PADS=[], BD_SL=null;
  var LMODES=[{t:'OFF',v:0},{t:'LOW',v:30},{t:'MID',v:60},{t:'FULL',v:100},{t:'BLINK',v:100,blink:true}];
  function lightMode(c){
    var v=rt.t[c]||0;
    if(v<=0) return 0;
    if(C.ch[c].blink&&C.ch[c].blink!=='off') return 4;
    return v<=40?1:v<=75?2:3;
  }
  // Per-joystick tuning: axis lock, deadzone, sensitivity, limit
  function jshape(x,y,jc){
    if(!jc) return [x,y];
    if(jc.ax==='x') y=0;
    if(jc.ax==='y') x=0;
    var dz=jc.dz/100,g=jc.sn/100,l=jc.lm/100;
    function f(v){var a=Math.abs(v);if(a<=dz) return 0;a=Math.min(1,(a-dz)/(1-dz)*g)*l;return v<0?-a:a}
    return [f(x),f(y)];
  }
  // Slider shortcut: tap the value read-out to send that slider (and its channels) back to 0
  function bdOutZero(out,chs){
    if(!out) return;
    out.classList.add('zeroable');out.setAttribute('role','button');out.setAttribute('aria-label','Set to zero');
    out.addEventListener('click',function(e){
      if(bdEditing) return;
      e.stopPropagation();noteInput();
      chs.forEach(function(q){if(q!==undefined&&q>=0) setT(q,0,false)});
    });
  }
  var BBC=['#ffd84a','#1D9E75','#5aa9ff','#E24B4A','#c78bff','#EF9F27','#3fe0d0','#ff8ac2'];
  function bbShow(k){
    var a=bbLoad();k=k||0;
    var old=document.getElementById('bbView');if(old) old.remove();
    var ov=document.createElement('div');ov.id='bbView';ov.className='gedit';
    var bx=document.createElement('div');bx.className='gbox bbx';ov.appendChild(bx);
    var mk=function(t,x,c){var e=document.createElement(t);if(x) e.textContent=x;if(c) e.className=c;return e};
    bx.appendChild(mk('h3','E-Stop black box'));
    if(!a.length){bx.appendChild(mk('p','Nothing recorded yet. When E-Stop goes on, the last 10 seconds of every channel are kept here.','note'))}
    else{
      var tabs=mk('div','','bb-tabs');
      a.forEach(function(r0,i){var b=mk('button',new Date(r0.at).toTimeString().slice(0,8),'btn');b.type='button';b.setAttribute('aria-pressed',String(i===k));b.addEventListener('click',function(){bbShow(i)});tabs.appendChild(b)});
      bx.appendChild(tabs);
      var r=a[k]||a[0];
      var hd=mk('div','','bb-h');hd.appendChild(mk('b','\u25A0 E-STOP'));hd.appendChild(document.createTextNode(' '+new Date(r.at).toLocaleString()+(r.m?' \u00b7 '+r.m:'')));bx.appendChild(hd);
      var wrap=mk('div','','bb-g');var cv=document.createElement('canvas');wrap.appendChild(cv);bx.appendChild(wrap);
      var lg=mk('div','','bb-l');r.ch.forEach(function(c,i){var e=mk('span','','bb-li');var d=mk('i');d.style.background=BBC[i%BBC.length];e.appendChild(d);e.appendChild(mk('b',c.t));e.appendChild(document.createTextNode(' '+c.n));lg.appendChild(e)});bx.appendChild(lg);
      bx.appendChild(mk('p','The last 10 seconds before E-Stop. The red line is the moment it stopped.','note'));
      var draw=function(){
        var W=wrap.clientWidth,H=wrap.clientHeight,d=Math.min(2,window.devicePixelRatio||1);cv.width=W*d;cv.height=H*d;var x=cv.getContext('2d');x.setTransform(d,0,0,d,0,0);
        var X=function(t){return 4+(t+10000)/10000*(W-12)},Y=function(v){return H/2-v/100*(H/2-10)};
        x.strokeStyle='#1f242c';x.lineWidth=1;for(var s2=-10;s2<=0;s2+=1){x.beginPath();x.moveTo(X(s2*1000),0);x.lineTo(X(s2*1000),H);x.stroke()}
        x.strokeStyle='#2b303a';x.beginPath();x.moveTo(0,H/2);x.lineTo(W,H/2);x.stroke();
        r.ch.forEach(function(c,i){x.strokeStyle=BBC[i%BBC.length];x.lineWidth=2;x.beginPath();var f=true;r.d.forEach(function(p){if(p[0]<-10000) return;var px=X(p[0]),py=Y(p[i+1]);if(f){x.moveTo(px,py);f=false}else x.lineTo(px,py)});x.stroke()});
        x.strokeStyle='#E24B4A';x.setLineDash([5,4]);x.lineWidth=2;x.beginPath();x.moveTo(X(0),0);x.lineTo(X(0),H);x.stroke();x.setLineDash([]);
        x.fillStyle='#8a93a0';x.font='10px system-ui,sans-serif';x.fillText('\u221210 s',6,H-6);x.fillText('+100',6,12);x.fillStyle='#E24B4A';x.fillText('STOP',X(0)-30,12);
      };
      setTimeout(draw,0);
    }
    var act=mk('div','','gact');
    if(a.length){var cl=mk('button','Clear','btn');cl.type='button';cl.addEventListener('click',function(){try{localStorage.removeItem(BBK)}catch(e){}ov.remove();v2Paint();toast('Black box cleared.')});act.appendChild(cl)}
    var ok=mk('button','Close','btn');ok.type='button';ok.setAttribute('aria-pressed','true');ok.addEventListener('click',function(){ov.remove()});act.appendChild(ok);bx.appendChild(act);
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    document.body.appendChild(ov);
  }
  // Double tap the knob of a slider: it glides back to 0 (or to its lowest end when it has no 0) in 0.2 s
  var DT2={};
  function thumbHit(r,x,y){
    var rc=r.getBoundingClientRect(),mn=+r.min,mx=+r.max,f=mx>mn?(+r.value-mn)/(mx-mn):.5,vert=!!r.closest('.bdv'),z=parseFloat(r.style.zoom)||1,T=40*z;
    if(vert){var py=rc.bottom-T/2-f*(rc.height-T);return Math.abs(y-py)<T*.75&&Math.abs(x-(rc.left+rc.width/2))<T}
    var px=rc.left+T/2+f*(rc.width-T);return Math.abs(x-px)<T*.75&&Math.abs(y-(rc.top+rc.height/2))<T;
  }
  function glideZero(r){
    var mn=+r.min,mx=+r.max,z=(mn<=0&&mx>=0)?0:mn,from=+r.value,t0=performance.now();if(from===z) return;
    dialBuzz();
    (function step(){var f=Math.min(1,(performance.now()-t0)/200),e=1-Math.pow(1-f,3);r.value=Math.round(from+(z-from)*e);r.dispatchEvent(new Event('input',{bubbles:true}));
      if(f<1) requestAnimationFrame(step);else r.dispatchEvent(new Event('change',{bubbles:true}))})();
  }
  window.addEventListener('pointerdown',function(e){
    var r=e.target;if(!r||!r.matches||!r.matches('#boardGrid input[type=range]:not(.ovr)')||bdEditing||S.estop||S.play) return;
    DT2.cur={r:r,x:e.clientX,y:e.clientY,t:Date.now(),on:thumbHit(r,e.clientX,e.clientY)};
  },true);
  window.addEventListener('pointerup',function(e){
    var c=DT2.cur;DT2.cur=null;if(!c) return;
    var nw=Date.now();if(!c.on||nw-c.t>300||Math.hypot(e.clientX-c.x,e.clientY-c.y)>10){DT2.last=null;return}
    var l=DT2.last;
    if(l&&l.r===c.r&&nw-l.t<350){DT2.last=null;setTimeout(function(){glideZero(c.r)},0)}
    else DT2.last={r:c.r,t:nw};
  },true);
  function bdPad(a,b,m,hold,tiltOk,bi){
    var it={c:a,d:b,m:m};
    var jp=document.createElement('div');jp.className='pad';
    var kn=document.createElement('div');kn.className='knob rest';jp.appendChild(kn);
    var pid=null;
    var geo=null, jq=null, jraf=0;
    var jgeo=function(){var r=jp.getBoundingClientRect();geo={cx:r.left+r.width/2,cy:r.top+r.height/2,R:Math.max(8,(r.width-kn.offsetWidth*0.6)/2-7)}};
    var jmove=function(e){
      if(e&&e.type==='pointermove'){jq={clientX:e.clientX,clientY:e.clientY};if(!jraf) jraf=requestAnimationFrame(function(){jraf=0;if(jq&&pid!==null){var q=jq;jq=null;jstep(q)}});return}
      if(!geo) jgeo();jstep(e);
    };
    var jstep=function(e){
      if(!geo) jgeo();
      var R=geo.R, dx=e.clientX-geo.cx, dy=e.clientY-geo.cy;
      var d=Math.hypot(dx,dy);
      if(d>R){dx*=R/d;dy*=R/d}
      var jc=bi&&bi.jc;
      if(jc&&jc.ax==='x') dy=0;
      if(jc&&jc.ax==='y') dx=0;
      kn.style.transform='translate('+dx+'px,'+dy+'px)';
      it.y=-dy/R;
      var sh=jshape((tiltOk&&tiltActive())?tiltVal():dx/R,-dy/R,jc);
      noteInput();applyJoy(it,sh[0],sh[1]);
    };
    jp.addEventListener('pointerdown',function(e){
      pid=e.pointerId;geo=null;try{jp.setPointerCapture(e.pointerId)}catch(_){}
      if(tiltOk){TILT.zero=null;BD_TILT.cur=it}
      kn.classList.remove('rest');jmove(e)});
    jp.addEventListener('pointermove',function(e){if(e.pointerId===pid) jmove(e)});
    var jend=function(e){
      if(e.pointerId!==pid) return;
      if(jq){var q0=jq;jq=null;jstep(q0)}
      pid=null;
      if(tiltOk&&BD_TILT.cur===it) BD_TILT.cur=null;
      if(hold) return;
      kn.classList.add('rest');kn.style.transform='translate(0,0)';jp.style.setProperty('--m','0');applyJoy(it,0,0);
    };
    jp.addEventListener('pointerup',jend);jp.addEventListener('pointercancel',jend);
    if(hold) applyJoy(it,0,0);
    BD_PADS.push({jp:jp,kn:kn,it:it,busy:function(){return pid!==null},lx:null,ly:null});
    return jp;
  }
  // Joysticks on the board show what their channels are doing when no finger is on them
  // (gamepad, recording playback, another widget on the same channel)
  function paintPads(){
    BD_PADS.forEach(function(p){
      if(!p.jp.isConnected) return;
      if(p.busy()){if(p.kn.classList.contains('kglow')) p.kn.classList.remove('kglow');p.lx=null;return}
      var it=p.it, z=(C.zone||100)/100||1, a=(rt.t[it.c]||0)/100/z, b=it.d>=0?(rt.t[it.d]||0)/100/z:0, x, y;
      if(it.m==='axis'){y=a;x=b}else{y=(a+b)/2;x=(a-b)/2}
      x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));
      var m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
      x=Math.round(x*100)/100;y=Math.round(y*100)/100;
      if(x===p.lx&&y===p.ly) return;
      p.lx=x;p.ly=y;
      var nowR=Date.now();if(!p.R||nowR-p.Rt>1500){p.R=Math.max(8,(p.jp.offsetWidth-p.kn.offsetWidth*0.6)/2-7);p.Rt=nowR}var R=p.R;
      p.kn.classList.toggle('rest',x===0&&y===0);
      p.kn.style.transform='translate('+(x*R)+'px,'+(-y*R)+'px)';
      var gm=Math.min(1,Math.hypot(x,y));p.kn.classList.toggle('kglow',gm>0.02);p.kn.style.setProperty('--g',gm.toFixed(2));
    });
  }

