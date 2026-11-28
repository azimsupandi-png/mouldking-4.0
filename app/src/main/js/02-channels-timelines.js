  /* ---------- Power curve ---------- */
  /* Response curve: 5 points (0,0) (25,a) (50,b) (75,c) (100,100), joined by a smooth curve that never goes backwards. */
  var CVPRE=[['Linear',[25,50,75]],['Fine',[8,22,48]],['Very fine',[3,12,38]],['Fast',[45,72,90]],['S-curve',[12,50,88]],['Soft start',[10,28,55]]];
  function curveY(x,cv){
    var P=[0,cv[0],cv[1],cv[2],100], k=Math.min(3,Math.floor(x/25)), t=(x-k*25)/25, d=[], m=[], j;
    for(j=0;j<4;j++) d.push((P[j+1]-P[j])/25);
    m[0]=d[0];m[4]=d[3];for(j=1;j<4;j++) m[j]=(d[j-1]*d[j]<=0)?0:(d[j-1]+d[j])/2;
    for(j=0;j<4;j++){if(d[j]===0){m[j]=0;m[j+1]=0}else{var a=m[j]/d[j],b=m[j+1]/d[j],h=a*a+b*b;if(h>9){var tt=3/Math.sqrt(h);m[j]=tt*a*d[j];m[j+1]=tt*b*d[j]}}}
    var t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*P[k]+(t3-2*t2+t)*25*m[k]+(-2*t3+3*t2)*P[k+1]+(t3-t2)*25*m[k+1];
  }
  // rev: going backwards, where a channel may have its own top speed (rmax, 0 = same as forward)
  function powerFor(a,c,rev){
    if(a<=1) return 0;
    var m=curveY(Math.min(a,100),c.cv||[25,50,75]);
    return Math.min(Math.max(0,m)+c.off,rev&&c.rmax?c.rmax:c.max);
  }
  function cvName(cv){for(var q=0;q<CVPRE.length;q++){var p=CVPRE[q][1];if(p[0]===cv[0]&&p[1]===cv[1]&&p[2]===cv[2]) return CVPRE[q][0]}return 'Custom'}
  /* Curve editor: drag the three middle points, or pick a ready shape. get() returns the points, set(p) stores them. */
  // 8x8 dot editor for the LED matrix's own icon
  var PXPRE=[['\u2191',null],['\u00bb',['10010000','01001000','00100100','00010010','00100100','01001000','10010000','00000000']],['\u2665',['01100110','11111111','11111111','11111111','01111110','00111100','00011000','00000000']],['!',['00011000','00111100','00111100','00111100','00011000','00000000','00011000','00011000']],['\u2715',['00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000']]];
  function pxEditor(get,set){
    var wrap=document.createElement('div');wrap.className='pxed';
    var gr=document.createElement('div');gr.className='pxed-g';wrap.appendChild(gr);
    var cells=[];
    function draw(){var p=get();cells.forEach(function(b,i){var on=p[i>>3].charAt(i&7)==='1';b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
    for(var i=0;i<64;i++)(function(i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Dot '+(1+(i>>3))+'-'+(1+(i&7)));
      b.addEventListener('click',function(){var p=get().slice(),r=p[i>>3],q=i&7;p[i>>3]=r.slice(0,q)+(r.charAt(q)==='1'?'0':'1')+r.slice(q+1);set(p);draw()});gr.appendChild(b);cells.push(b)})(i);
    var pr=document.createElement('div');pr.className='pxed-p';wrap.appendChild(pr);
    PXPRE.forEach(function(q){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=q[0];b.addEventListener('click',function(){set((q[1]||LXPAT.up).slice());draw()});pr.appendChild(b)});
    draw();return wrap;
  }
  // Dial selector scenes: one row of channel powers (A-F) for each position
  function rsScenes(it){var a=[];for(var i=0;i<6;i++){var r=(it.sc&&it.sc[i])||[];var b=[];for(var j=0;j<PER;j++) b.push(Math.max(-100,Math.min(100,Math.round(+r[j]||0))));a.push(b)}return a}
  function sceneEditor(get,set){
    var wrap=document.createElement('div');wrap.className='sced';
    var tb=document.createElement('table');wrap.appendChild(tb);
    var hr=document.createElement('tr');hr.appendChild(document.createElement('th'));
    for(var j=0;j<PER;j++){var th=document.createElement('th');th.textContent=L.charAt(j);hr.appendChild(th)}
    tb.appendChild(hr);
    get().forEach(function(row,i){
      var tr=document.createElement('tr'),th=document.createElement('th');th.textContent=String(i+1);tr.appendChild(th);
      row.forEach(function(v,j){var td=document.createElement('td'),inp=document.createElement('input');inp.type='number';inp.min='-100';inp.max='100';inp.step='10';inp.inputMode='numeric';inp.className='txt';inp.value=String(v);
        inp.setAttribute('aria-label','Position '+(i+1)+' channel '+L.charAt(j));
        inp.addEventListener('input',function(){var a=get().map(function(r){return r.slice()}),n=Math.round(+inp.value);a[i][j]=isFinite(n)?Math.max(-100,Math.min(100,n)):0;set(a)});
        inp.addEventListener('blur',function(){inp.value=String(get()[i][j])});
        td.appendChild(inp);tr.appendChild(td)});
      tb.appendChild(tr);
    });
    var nt=document.createElement('p');nt.className='sced-n';nt.textContent='Rows are positions (1 = first). Channels left at 0 in every row are not touched. With 4 positions, rows 5 and 6 are not used.';wrap.appendChild(nt);
    return wrap;
  }
  function cvEditor(get,set){
    var wrap=document.createElement('div');wrap.className='cved';
    var W=200,H=120,svg=sv('svg',{viewBox:'0 0 '+W+' '+H,'class':'cved-g',role:'img','aria-label':'Response curve'},wrap);
    for(var g=1;g<4;g++){sv('line',{x1:g*W/4,x2:g*W/4,y1:0,y2:H,'class':'cved-l'},svg);sv('line',{x1:0,x2:W,y1:g*H/4,y2:g*H/4,'class':'cved-l'},svg)}
    sv('line',{x1:0,y1:H,x2:W,y2:0,'class':'cved-d'},svg);
    var path=sv('path',{'class':'cved-p'},svg), hs=[], lab=sv('text',{x:W-6,y:H-8,'text-anchor':'end','class':'cved-t'},svg);
    var X=function(v){return v/100*W},Y=function(v){return H-v/100*H};
    for(var q=0;q<3;q++){var hh=sv('circle',{r:9,'class':'cved-h','data-i':q},svg);hs.push(hh)}
    var chips=document.createElement('div');chips.className='wsc cved-c';wrap.appendChild(chips);
    CVPRE.forEach(function(p){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=p[0];b.addEventListener('click',function(){set(p[1].slice());draw()});chips.appendChild(b)});
    function draw(){
      var cv=get(),d='';
      for(var x=0;x<=100;x+=2.5){var y=Math.max(0,Math.min(100,curveY(x,cv)));d+=(x?'L':'M')+X(x).toFixed(1)+' '+Y(y).toFixed(1)}
      path.setAttribute('d',d);
      hs.forEach(function(h,j){h.setAttribute('cx',X((j+1)*25));h.setAttribute('cy',Y(cv[j]))});
      var nm=cvName(cv);lab.textContent=(nm==='Custom'?'Custom':nm)+' \u00b7 50% \u2192 '+Math.round(curveY(50,cv))+'%';
      [].forEach.call(chips.children,function(b,j){b.setAttribute('aria-pressed',String(CVPRE[j][0]===nm))});
    }
    var drag=-1;
    svg.addEventListener('pointerdown',function(e){
      var r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100;drag=Math.max(0,Math.min(2,Math.round(x/25)-1));
      try{svg.setPointerCapture(e.pointerId)}catch(_){}move(e);e.preventDefault();
    });
    function move(e){
      if(drag<0) return;
      var r=svg.getBoundingClientRect(),v=Math.round((1-(e.clientY-r.top)/r.height)*100);
      var cv=get().slice(),lo=drag?cv[drag-1]:0,hi=drag<2?cv[drag+1]:100;
      cv[drag]=Math.max(lo,Math.min(hi,v));set(cv);draw();
    }
    svg.addEventListener('pointermove',move);
    ['pointerup','pointercancel'].forEach(function(ev){svg.addEventListener(ev,function(){drag=-1})});
    svg.style.touchAction='none';
    draw();wrap.redraw=draw;return wrap;
  }
  /* The hub only picks up a new broadcast about every 100-200 ms, so blinking is kept slow and
     pulsing moves in coarse steps. Brightness is mapped above the LED start threshold. */
  function blinkF(mode,now){
    if(mode==='slow') return (Math.floor(now/1000)%2)?0:1;
    if(mode==='fast') return (Math.floor(now/400)%2)?0:1;
    if(mode==='pulse') return 0.5+0.5*Math.cos(Math.floor(now/200)*200/3000*2*Math.PI+Math.PI);
    // hazard: two flashes, then a pause (1.6 s); each step is 300 ms or more so the hub keeps up
    if(mode==='hazard'){var hp=now%1600;return (hp<300||(hp>=600&&hp<900))?1:0}
    return 1;
  }
  /* The LEDs only light from about 40% hub power, so any brightness above 0 is mapped into 40..100%. */
  function ledOut(b){return b<=0?0:40+60*Math.pow(Math.min(b,100)/100,1.5)}
  /* Automatic lights: a brake light shines for 1.5 s when the drive channel it follows comes back to 0,
     a reverse light shines while that channel runs backwards. They add to what the widget sets. */
  var LAUTO={};
  function lightAuto(i){
    var c=C.ch[i];if(!c.la||S.estop||c.ls===i||!C.ch[c.ls]) return 0;
    var t=crzT(c.ls)||0,now=performance.now(),st=LAUTO[i]||(LAUTO[i]={mv:false,until:0});
    if(c.la===2) return t<=-5?1:0;
    if(c.la===3||c.la===4){var blk=Math.floor(now/450)%2===0;return ((c.la===3&&t<=-20)||(c.la===4&&t>=20))&&blk?1:0}
    if(Math.abs(t)>=10) st.mv=true;
    else if(Math.abs(t)<5&&st.mv){st.mv=false;st.until=now+1500}
    return now<st.until?1:0;
  }
  /* ======================================================================
     Output pipeline: what each hub port gets, from the control to the frame
       1 request  -100..100 from the widget (cruise keeps a let-go value)
       2 power    response curve + start power, capped by the channel's Max power
       3 scale    drive mode limit (Turbo and calibration: 100), kid limit, play-time fade
       4 steering eases at speed (set per model)
       5 trim     see trimAt
       6 swing    soft stops of a turret
     then in tick(): E-Stop / output off -> 0, ramp towards the goal, reverse, frame per hub
     ====================================================================== */
  function partOf(i){return (Array.isArray(C.pf)&&C.pf[i])||''}
  function isLight(i){return C.ch[i].kind==='light'}
  function scaleOf(i,live){
    var lim=(live&&(S.turbo[i]||cal))?100:C.limit;
    return lim/100*(live?PLAY.f:1);
  }
  // trim: kept at rest to move a servo's centre (or a port with no part set);
  // a port wired as a motor only gets it while it runs, a light never, so nothing creeps at 0
  function trimAt(i,t){
    var tr=C.ch[i].trim||0,p=partOf(i);
    if(!tr||isLight(i)||p==='lt') return 0;
    return (p===''||isSvT(p)||Math.abs(+t||0)>0.5)?tr:0;
  }
  function clamp100(v){return Math.max(-100,Math.min(100,v))}
  // one motor channel; live=false is the preview used in widget settings (no turbo, kid limit, fade, steering ease or swing)
  function motorGoal(i,t,live){
    var c=C.ch[i],m=powerFor(Math.abs(t),c,t<0),out=(t<0?-m:m)*scaleOf(i,live);
    if(live&&C.ss&&C.ss.on&&i===C.ss.st&&C.ss.th!==i&&!cal) out*=1-(1-C.ss.min/100)*Math.min(1,Math.abs(rt.o[C.ss.th]||0)/100);
    var tr=trimAt(i,t);
    if(tr&&!(live&&(S.estop||cal))) out=clamp100(out+tr*(live?PLAY.f:1));
    return live?swLim(i,out):out;
  }
  // one light channel: brightness mapped above the LED start level, blink pattern, automatic brake/reverse light
  function lightGoal(i){
    var c=C.ch[i],lt=rt.t[i],mo=lt>0?Math.round(ledOut(lt*blinkF(c.blink,performance.now()))):0;
    if(c.la&&lightAuto(i)) mo=Math.max(mo,Math.round(ledOut(c.bright||100)));
    return mo;
  }
  function goalOf(i){if(MUTE[i]) return 0;return isLight(i)?lightGoal(i):motorGoal(i,crzT(i),true)}
  function goalOfAt(i,t){return isLight(i)?t:motorGoal(i,t,false)}
  // what the hub gets at a full 100% request; meters mark it
  function hubMax(i){
    if(isLight(i)) return 100;
    var tb=!!S.turbo[i]||!!cal;
    return Math.min(100,powerFor(100,C.ch[i])*(tb?100:C.limit)/100);
  }
  // step every active channel towards its goal and return the values to send (reverse applied), indexed by channel
  // smoothing 0..100 to the largest change of one output per tick
  function rampStep(r){return Math.max(2,200*Math.pow(1-r/100,2))}
  function outStep(){
    var vals=new Array(NMAX);
    for(var i=0;i<NMAX;i++){
      if(!isActive(i)){vals[i]=0;continue}
      var step=rampStep(C.ch[i].rmp>=0?C.ch[i].rmp:C.ramp);
      var hold=S.estop||(S.outOff&&(!S.outMsk||S.outMsk[i%PER]));
      var goal=hold?0:goalOf(i);
      if(hold) rt.o[i]=0;
      var d=goal-rt.o[i];
      rt.o[i]=(isLight(i)||Math.abs(d)<=step)?goal:rt.o[i]+(d<0?-1:1)*step;
      var o=Math.round(rt.o[i]);vals[i]=(C.ch[i].inv?-o:o)||0;
    }
    return vals;
  }
  // the frame: six values per active hub, in hub-slot order (the native side sends slot n to the n-th hub it started)
  function frameOf(vals){var f=[];activeSlots().forEach(function(s){for(var j=0;j<PER;j++) f.push(vals[s*PER+j])});return f}

  /* ---------- Channels ---------- */
  var refs=[], groups=[], wrap=$('#channels'), cols=$('#cols');
  var runBlk=[], runSince=[];
  var AUTOT={}, RAMP={}, HIST={}, HCNT={}, RECS={}, RX={}, RAMPLAST={};
  // element sizes kept up to date by a ResizeObserver, so the paint loop never forces a layout to read them
  var SZRO=window.ResizeObserver?new ResizeObserver(function(es){es.forEach(function(e){var t=e.target;if(!t.isConnected){SZRO.unobserve(t);t._sz=0;return}t._cw=t.clientWidth;t._ch=t.clientHeight})}):null;
  function boxSize(b){if(!SZRO) return [b.clientWidth,b.clientHeight];if(!b._sz){b._sz=1;SZRO.observe(b);b._cw=b.clientWidth;b._ch=b.clientHeight}return [b._cw,b._ch]}
  function autoTick(){
    var now=performance.now();
    (C.board||[]).forEach(function(it){
      if(it.k==='a'){
        var c=it.c;
        if(S.estop||rt.t[c]===0||!isFinite(rt.t[c])){AUTOT[c]=0;return}
        if(!AUTOT[c]) AUTOT[c]=now;
        if(now-AUTOT[c]>=it.s*1000){AUTOT[c]=0;CRZ.skip=true;if(CRZ.v[c]!=null) delete CRZ.v[c];setT(c,0,false);CRZ.skip=false;toast('Auto-stop: channel '+tagOf(c)+' stopped after '+it.s+' s.',5000);feedback('warn')}
      }
    });
    Object.keys(RAMP).forEach(function(k){
      var r=RAMP[k];
      if(S.estop){delete RAMP[k];return}
      var f=Math.min(1,(now-r.t0)/(r.d*1000));
      setT(+k,Math.round(r.from+(r.to-r.from)*f),false);
      if(f>=1) delete RAMP[k];
    });
    var mtr=false;
    var hdone={};
    (C.board||[]).forEach(function(o){if(o.k==='k'||(o.k==='y'&&o.sc)){[o.c].concat(o.k==='k'&&o.cs?o.cs:[]).forEach(function(hc,hj){if(hdone[hc]) return;hdone[hc]=1;var hh=HIST[hc]||(HIST[hc]=[]);var rs0=hj?'live':(RECS[hc]||'live');if(rs0==='rec'&&hh.length>=600) RECS[hc]='done';else if(rs0!=='done'){hh.push(S.estop?0:(crzT(hc)||0));HCNT[hc]=(HCNT[hc]||0)+1;if(hh.length>600) hh.shift()}});if(o.k==='k'&&o.cs&&o.cs.length&&RECS[o.c]==='rec'&&!hdone['rx'+o.c]){hdone['rx'+o.c]=1;var rx=RX[o.c]||(RX[o.c]={});o.cs.forEach(function(xc){(rx[xc]||(rx[xc]=[])).push(S.estop?0:(crzT(xc)||0))})}mtr=true}else if(o.k==='f'||o.k==='i'||o.k==='lx') mtr=true});
    if(C.board&&(mtr||C.board.some(function(o){return o.k==='a'}))&&typeof paintBoard==='function') paintBoard();
  }
  setInterval(autoTick,100);

  var SVGNS='http://www.w3.org/2000/svg';
  function sv(tag,at,par){var e=document.createElementNS(SVGNS,tag);for(var k in at) e.setAttribute(k,at[k]);if(par) par.appendChild(e);return e}
  function mPol(cx,cy,r,a){var d=a*Math.PI/180;return [cx+r*Math.cos(d),cy-r*Math.sin(d)]}
  function mArc(cx,cy,r,a0,a1){var p=mPol(cx,cy,r,a0),q=mPol(cx,cy,r,a1);return 'M'+p[0].toFixed(1)+' '+p[1].toFixed(1)+'A'+r.toFixed(1)+' '+r.toFixed(1)+' 0 '+(Math.abs(a0-a1)>180?1:0)+' '+(a0>a1?1:0)+' '+q[0].toFixed(1)+' '+q[1].toFixed(1)}
  var MTH=[['#1D9E75','#EF9F27','#E24B4A','#378ADD'],['#378ADD','#7F77DD','#D85A30','#c8cdd4'],['#8a93a0','#c8cdd4','#ffffff','#6f7882']];
  function mCol(v,th){var a=Math.abs(v);return a>80?th[2]:a>55?th[1]:th[0]}
  function mAg(v){return 210-(v+100)/200*240}
  function mAgF(v){return 210-v/100*240}
  function mSgn(v){return (v>0?'+':v<0?'−':'')+Math.abs(Math.round(v))}
  var MSEQ=0;
  var KCOL=['#ffd84a','#378ADD','#c8cdd4'];
  function tzCol(v){v=Math.abs(v);return v>80?PAL.r:v>55?PAL.o:PAL.g}
  // smooth colour along the arc: green to 45, blends to orange by 70, to red by 95
  function tzSmooth(v){v=Math.abs(v);var G=[29,158,117],O=[239,159,39],Rd=[226,75,74],a,b,t;
    if(v<=45) return PAL.g;if(v<70){a=G;b=O;t=(v-45)/25}else{a=O;b=Rd;t=Math.min(1,(v-70)/25)}
    return 'rgb('+a.map(function(x,k){return Math.round(x+(b[k]-x)*t)}).join(',')+')'}
  function tzDim(v){v=Math.abs(v);return v>80?'rgba(226,75,74,.22)':v>55?'rgba(239,159,39,.18)':'rgba(29,158,117,.16)'}
  // tachometer looks A-F (num: [size, y, weight] relative to the face radius)
  var TACHO=[
    {bez:'dark',seg:1,rr:.84,rw:.14,nd:{c:'#ff8a1f',w:.045,len:.66,tail:.2,cw:1},num:[.2,.52,900],unit:'POWER',peak:'tri'},
    {bez:'dark',seg:1,rr:.86,rw:.12,hubArc:1,nd:{c:'#e8e8ea',w:.04,len:.6,tail:.12},num:[.21,.5,800],peak:'none'},
    {bez:'chrome',seg:1,rr:.84,rw:.12,glass:1,nd:{c:'#f4f5f7',w:.035,len:.68,tail:.16,tip:'#E24B4A'},num:[.2,.52,800],peak:'dot'},
    {bez:'dark',seg:1,rr:.86,rw:.15,nolab:1,nd:{c:'#ffd84a',w:.06,len:.86,from:.66},num:[.42,.08,800],unit:'%',peak:'tri'},
    {bez:'dark',seg:0,rr:.84,rw:.1,nd:{c:'#e8e8ea',w:.03,len:.7,tail:.1,glow:1},num:[.2,.52,700],peak:'none'},
    {bez:'dark',seg:2,rr:.86,rw:.11,minor:1,pulse:1,nd:{c:'#ffffff',w:.03,len:.66,tail:.18,cw:1,glow:1},num:[.2,.52,800],unit:'POWER',peak:'none'}];
  TACHO.n=0;
  // ---- XY pad, crossfader and rotor: drawn in a fixed 300 x 260 picture that scales with the card ----
  var XWN=0;
  // ---- Timelines: helpers ----
  function tlOf(it){var id=it&&it.tl;for(var i=0;i<(C.tl||[]).length;i++) if(C.tl[i].id===id) return C.tl[i];return null}
  function tlNew(){
    if(!C.tl) C.tl=[];
    if(C.tl.length>=MAX_TL){C.tl=C.tl.filter(function(t){return C.board.some(function(o){return o.k==='tl'&&o.tl===t.id})});if(C.tl.length>=MAX_TL) return null}
    var ch=activeIdx().filter(function(c){return C.ch[c].kind!=='light'}).slice(0,2);if(!ch.length) ch=activeIdx().slice(0,1);
    var t={id:uid(),name:(store.prefs.lang==='ms'?'Garis masa ':'Timeline ')+(C.tl.length+1),dur:5,rp:1,lanes:ch.map(function(c,i){return {c:c,pts:i?[[0,0,0],[2,-40,0],[4,40,0],[5,0,0]]:[[0,0,0],[1.5,60,0],[3.5,60,0],[5,0,0]]}})};
    C.tl.push(t);return t;
  }
  // value of one lane at time t (s)
  function tlVal(pts,t){
    if(t<=pts[0][0]) return pts[0][1];
    for(var k=1;k<pts.length;k++){var a=pts[k-1],b=pts[k];if(t<=b[0]){var f=b[0]>a[0]?(t-a[0])/(b[0]-a[0]):1;
      if(b[2]===2) return t>=b[0]?b[1]:a[1];if(b[2]===1) return a[1]+(b[1]-a[1])*f;return a[1]+(b[1]-a[1])*(1-Math.cos(Math.PI*f))/2}}
    return pts[pts.length-1][1];
  }
  // Turn a timeline into a recording (one row every 50 ms) so the normal playback runs it
  function compileTl(tl){
    var ms=Math.round(tl.dur*1000),pts=[];
    for(var t=0;t<=ms;t+=50){var row=[t];for(var i=0;i<NMAX;i++) row.push(0);
      tl.lanes.forEach(function(l){row[l.c+1]=Math.round(tlVal(l.pts,Math.min(t,ms)/1000))});pts.push(row)}
    if(pts[pts.length-1][0]<ms){var last=[ms];for(var i2=0;i2<NMAX;i2++) last.push(0);tl.lanes.forEach(function(l){last[l.c+1]=Math.round(tlVal(l.pts,tl.dur))});pts.push(last)}
    return {id:tl.id,name:tl.name,dur:Math.max(1,ms),pts:pts};
  }
  function runTl(tl){
    if(!tl) return;
    if(S.play&&S.play.tl===tl.id){stopPlay(true);feedback('ok');return}
    if(S.play||S.rec||S.estop){toast(S.estop?'Release E-Stop first.':'Something else is playing.');return}
    if(!tl.lanes.length){toast('Add a lane first.');return}
    noteInput();startPlay(compileTl(tl),{tl:tl.id,loop:tl.rp===0,reps:tl.rp||1});feedback('ok');
  }
  function tlProg(tl){var p=S.play;if(!tl||!p||p.tl!==tl.id) return -1;var el=(performance.now()-p.start)%p.rec.dur;return Math.max(0,el)/p.rec.dur}
  // ---- timeline player, drawn as an SVG picture ----
  function pxBuild(el,it,hd,kind){
    var k=kind||it.k,id='px'+(++XWN),OFF='rgba(150,160,175,.32)';
    var box=document.createElement('div');box.className='mtr-box';
    var svg=sv('svg',{'class':'xwv','data-k':k,viewBox:'0 0 300 260','preserveAspectRatio':'xMidYMid meet'},box);el.appendChild(box);
    var df=sv('defs',{},svg);
    function grad(gid,type,at,stops){var g=sv(type,at,df);g.setAttribute('id',gid);stops.forEach(function(s){sv('stop',{offset:s[0],'stop-color':s[1]},g)});return 'url(#'+gid+')'}
    var KN=grad(id+'k','radialGradient',{cx:'40%',cy:'35%',r:'70%'},[['0','#5a6376'],['.6','#2a303b'],['1','#14181f']]);
    var MT=grad(id+'m','linearGradient',{x1:0,y1:0,x2:1,y2:1},[['0','#e6e9ef'],['.4','#6b7280'],['.7','#2b303a'],['1','#9aa3b0']]);
    var gl=sv('filter',{id:id+'g',x:'-50%',y:'-50%',width:'200%',height:'200%'},df);sv('feGaussianBlur',{stdDeviation:3},gl);
    function txt(at,s){var t=sv('text',at,svg);t.textContent=s;return t}
    var m={upd:function(){}};
    // ---- timeline player: play / stop button on the left, the lanes fill the rest of the box ----
    svg.setAttribute('viewBox','0 0 420 250');
    var bx0=100,by0=108,ring=[],NR=30,RR0=66,RR1=78;
    for(var j=0;j<NR;j++){var a2=(-135+j*270/(NR-1))*Math.PI/180;ring.push(sv('line',{x1:bx0+Math.sin(a2)*RR0,y1:by0-Math.cos(a2)*RR0,x2:bx0+Math.sin(a2)*RR1,y2:by0-Math.cos(a2)*RR1,stroke:OFF,'stroke-width':6,'stroke-linecap':'round'},svg))}
    var pb=sv('g',{style:'cursor:pointer;outline:none'},svg);sv('circle',{cx:bx0,cy:by0,r:57,fill:MT},pb);sv('circle',{cx:bx0,cy:by0,r:52,fill:KN,stroke:'#0d1015','stroke-width':3},pb);
    sv('ellipse',{cx:bx0-13,cy:by0-22,rx:24,ry:11,fill:'#fff',opacity:.08},pb);
    // small, rounded signs: green play, red stop (each with a soft glow)
    var tri='M'+(bx0-8)+' '+(by0-13)+' L'+(bx0+13)+' '+by0+' L'+(bx0-8)+' '+(by0+13)+' Z';
    var playG=sv('g',{},pb);sv('path',{d:tri,fill:PAL.g,stroke:PAL.g,'stroke-width':5,'stroke-linejoin':'round',filter:'url(#'+id+'g)',opacity:.6},playG);var playP=sv('path',{d:tri,fill:PAL.g,stroke:PAL.g,'stroke-width':5,'stroke-linejoin':'round'},playG);
    var stopG=sv('g',{style:'display:none'},pb);sv('rect',{x:bx0-11,y:by0-11,width:22,height:22,rx:5,fill:PAL.r,filter:'url(#'+id+'g)',opacity:.6},stopG);var stopP=sv('rect',{x:bx0-11,y:by0-11,width:22,height:22,rx:5,fill:PAL.r},stopG);
    pb.setAttribute('role','button');pb.setAttribute('tabindex','0');
    var st=txt({x:bx0,y:212,'text-anchor':'middle','font-size':19,'font-weight':900,fill:'#8a93a0'},''),sub=txt({x:bx0,y:238,'text-anchor':'middle','font-size':15,fill:'#8a93a0'},'');
    var LX=206,LW=206,VW=420,LT=6,LB=220,lanesG=sv('g',{},svg),dots=[],head=sv('line',{x1:0,y1:LT,x2:0,y2:LB,stroke:'#fff','stroke-width':2,opacity:0},svg);
    var trk=sv('rect',{x:LX,y:232,width:LW,height:7,rx:3.5,fill:'#0b0e12'},svg),bar=sv('rect',{x:LX,y:232,width:0,height:7,rx:3.5,fill:'#ffd84a'},svg);
    var lp=0,lpf=false;
    pb.addEventListener('pointerdown',function(){if(bdEditing) return;lpf=false;clearTimeout(lp);lp=setTimeout(function(){lpf=true;feedback('hold');tlEdit(it)},600)});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){pb.addEventListener(ev,function(){clearTimeout(lp)})});
    pb.addEventListener('click',function(){if(bdEditing) return;if(lpf){lpf=false;return}runTl(tlOf(it))});
    pb.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();runTl(tlOf(it))}});
    var lkey='',was=null,L=[];
    function laneY(i){var n=L.length,h=n?(LB-LT-(n-1)*6)/n:0;return {y0:LT+i*(h+6),h:h,mid:LT+i*(h+6)+h/2,a:h/2-7}}
    function lx(f){return LX+8+f*(LW-16)}
    m.upd=function(){
      var tl=tlOf(it);if(!tl){st.textContent='?';return}
      var bs0=boxSize(box),bw=bs0[0],bh=bs0[1],nv=(bw>0&&bh>0)?Math.round(Math.max(420,Math.min(760,250*bw/bh))):420;
      if(nv!==VW){VW=nv;LW=VW-LX-8;svg.setAttribute('viewBox','0 0 '+VW+' 250');trk.setAttribute('width',LW);lkey='';was=null}
      var kk=JSON.stringify(tl)+store.prefs.lang+PAL.b+VW;
      if(kk!==lkey){lkey=kk;while(lanesG.firstChild) lanesG.removeChild(lanesG.firstChild);
        L=tl.lanes.slice(0,4);var COL=['#ffd84a',PAL.b,PAL.g,'#B57EDC'];dots=[];
        L.forEach(function(l,i){var g=laneY(i);sv('rect',{x:LX,y:g.y0,width:LW,height:g.h,rx:9,fill:'#0b0e12',stroke:'#262b33'},lanesG);
          sv('line',{x1:LX+8,y1:g.mid,x2:LX+LW-8,y2:g.mid,stroke:'#1c2129'},lanesG);
          var d='';for(var q=0;q<=60;q++){var tt=q/60*tl.dur;d+=(q?'L':'M')+lx(q/60).toFixed(1)+' '+(g.mid-tlVal(l.pts,tt)/100*g.a).toFixed(1)}
          sv('path',{d:d,fill:'none',stroke:COL[i],'stroke-width':3,'stroke-linejoin':'round',opacity:.9},lanesG);
          var lb=sv('text',{x:LX+9,y:g.y0+15,'font-size':13,'font-weight':900,fill:COL[i]},lanesG);lb.textContent=tagOf(l.c)+(i===3&&tl.lanes.length>4?' +'+(tl.lanes.length-4):'');
          dots.push(sv('circle',{r:5.5,fill:COL[i],stroke:'#0b0e12','stroke-width':2,opacity:0},lanesG))});
        sub.textContent=(tl.rp===0?tr2('loop')+' · ':tl.rp>1?'×'+tl.rp+' · ':'')+tl.dur+' s';
        was=null;
      }
      var p=S.play,f=tlProg(tl),on=f>=0;
      if(on){
        // progress in soft yellow, and a bright light that runs round the ring
        var n=Math.round(f*NR),run=Math.floor(performance.now()/45)%NR;
        ring.forEach(function(s0,i){var d=(run-i+NR)%NR,col=OFF,op=1;
          if(d<5){col='#ffd84a';op=1-d*.18}else if(i<n){col='#ffd84a';op=.4}
          s0.setAttribute('stroke',col);s0.setAttribute('opacity',op.toFixed(2))});
        var hx=lx(f);head.setAttribute('opacity',.9);head.setAttribute('x1',hx);head.setAttribute('x2',hx);
        L.forEach(function(l,i){var g=laneY(i),dt=dots[i];if(!dt) return;dt.setAttribute('cx',hx);dt.setAttribute('cy',g.mid-tlVal(l.pts,f*tl.dur)/100*g.a);dt.setAttribute('opacity',1)});
        bar.setAttribute('width',LW*f);
        var rep=tl.rp-(p.reps||1)+1,stx=tl.rp===0?tr2('Playing'):tl.rp>1?Math.min(rep,tl.rp)+' / '+tl.rp:tr2('Playing');
        if(st.textContent!==stx) st.textContent=stx;
        if(hd){var o=(f*tl.dur).toFixed(1)+' / '+tl.dur+' s';if(hd.textContent!==o) hd.textContent=o}
      }else if(was!==false){
        ring.forEach(function(s0){s0.setAttribute('stroke',OFF);s0.setAttribute('opacity',1)});head.setAttribute('opacity',0);bar.setAttribute('width',0);
        dots.forEach(function(dt){dt.setAttribute('opacity',0)});st.textContent=tr2('Ready');
        if(hd) hd.textContent='0 / '+tl.dur+' s';
      }
      if(on!==was){was=on;
        playG.style.display=on?'none':'';stopG.style.display=on?'':'none';
        playP.setAttribute('fill',PAL.g);playP.setAttribute('stroke',PAL.g);stopP.setAttribute('fill',PAL.r);
        st.setAttribute('fill',on?'#ffd84a':'#8a93a0');
        pb.setAttribute('aria-label',(on?'Stop ':'Play ')+tl.name)}
      var dis=!on&&(S.estop||!!S.rec||!!S.play);pb.style.opacity=dis?.45:1;
    };
    m.upd();return m;
  }
  // ---- Swing angle: estimated turret angle from output x time, soft stops near the limits ----
  var SWC=null, SWT=0, SWSV=0;
  function swOf(i){if(!SWC){SWC={};(C.board||[]).forEach(function(o){if(o.k==='sw'&&typeof o.c==='number') SWC[o.c]=o})}return SWC[i]||null}
  function swCfg(it){return {lo:it.lo===undefined?-150:it.lo,hi:it.hi===undefined?150:it.hi,sz:it.sz===undefined?20:it.sz,dps:it.dps||30,inf:it.inf===1,rv:it.rv===1}}
  // limit one channel's output so the turret slows near a limit and stops at it (only away from the limit is allowed)
  function swLim(i,out){
    var it=swOf(i);if(!it||!out) return out;var c=swCfg(it);if(c.inf) return out;
    var a=it.a||0,dir=(c.rv?-out:out),rem=dir>0?c.hi-a:a-c.lo,st='';
    if(rem<=0){out=0;st='lim'}else if(c.sz>0&&rem<c.sz){out*=Math.max(.25,rem/c.sz);st='slow'}
    it._st=st;it._pw=Math.round(Math.abs(out));return out;
  }
  function swStep(now){
    var dt=SWT?Math.min(.25,(now-SWT)/1000):0;SWT=now;if(!dt||!C.board) return;
    var moved=false;
    C.board.forEach(function(it){if(it.k!=='sw'||!isActive(it.c)) return;
      var c=swCfg(it),o=(S.connected&&!S.estop)?(rt.o[it.c]||0):0;if(c.rv) o=-o;
      var sp=o/100*c.dps;it._sp=sp;
      if(Math.abs(o)<1){if(it._st!=='lim') it._st='';return}
      var a=(it.a||0)+sp*dt;
      if(c.inf){a=((a+180)%360+360)%360-180}else a=Math.max(c.lo,Math.min(c.hi,a));
      var pz=it._z,z=c.inf?'':(a>=c.hi||a<=c.lo)?'lim':(c.sz>0&&(c.hi-a<c.sz||a-c.lo<c.sz))?'slow':'';
      if(z!==pz){it._z=z;if(z==='slow') feedback('tick');else if(z==='lim') feedback('warn')}
      it.a=Math.round(a*10)/10;moved=true});
    if(moved&&now-SWSV>3000){SWSV=now;save()}
  }
  function swCalMk(get,set){
    var box=document.createElement('div');box.className='swcal';
    var out=document.createElement('b'),b=document.createElement('button'),t0=0,tm=0;b.type='button';b.className='btn';
    function paint(){var v=get();out.textContent=t0?((performance.now()-t0)/1000).toFixed(1)+' s':(v?v+' °/s · '+(360/v).toFixed(1)+' s / 360°':'');b.textContent=t0?'✓ Done':'▶ Start';b.classList.toggle('pri',!!t0)}
    b.addEventListener('click',function(){if(!t0){t0=performance.now();tm=setInterval(paint,100);toast('Turn one full circle at full power, then tap Done.',4000)}
      else{var s=(performance.now()-t0)/1000;clearInterval(tm);t0=0;if(s>=2&&s<=120){set(Math.round(360/s*10)/10);feedback('success')}else toast('That took too long or too short. Try again.');}paint()});
    var p=document.createElement('p');p.className='note';p.textContent='Tap Start, turn the model one full circle at full power, then tap Done.';
    box.appendChild(out);box.appendChild(b);box.appendChild(p);paint();return box;
  }
  function swBuild(el,it,hd){
    var id='sw'+(++XWN),OFF='rgba(150,160,175,.32)',cx=150,cy=150;
    var box=document.createElement('div');box.className='mtr-box';
    var svg=sv('svg',{'class':'xwv','data-k':'sw',viewBox:'0 0 300 324','preserveAspectRatio':'xMidYMid meet'},box);el.appendChild(box);
    var df=sv('defs',{},svg),gl=sv('filter',{id:id+'g',filterUnits:'userSpaceOnUse',x:-20,y:-20,width:340,height:340},df);sv('feGaussianBlur',{stdDeviation:2.6},gl);   // whole-picture region: a box around a thin slanted line would cut the glow off
    var dsh=sv('filter',{id:id+'s',x:'-30%',y:'-30%',width:'160%',height:'160%'},df);sv('feDropShadow',{dx:3,dy:4,stdDeviation:3,'flood-color':'#000','flood-opacity':.6},dsh);
    var ringG=sv('g',{},svg),segs=[];
    sv('circle',{cx:cx,cy:cy,r:114,fill:'#0b0e12',stroke:'#262b33','stroke-width':2.5},svg);
    // excavator: tracks stay, the upper part turns about the slew centre
    var S0=128/495.7,iw=247*S0,ih=682*S0,ix=cx-123.5*S0,iy=cy-495.7*S0;
    var trk=sv('image',{x:ix,y:iy,width:iw,height:ih,preserveAspectRatio:'none'},svg);trk.setAttribute('href','img/swing-tracks.webp');
    var upG=sv('g',{filter:'url(#'+id+'s)'},svg),upI=sv('image',{x:ix,y:iy,width:iw,height:ih,preserveAspectRatio:'none'},upG);upI.setAttribute('href','img/swing-upper.webp');
    svg.appendChild(ringG);   // LEDs stay on top, so the bucket never hides them
    function txt(at,s0){var t=sv('text',at,svg);t.textContent=s0;return t}
    var home=sv('g',{style:'cursor:pointer'},svg);sv('rect',{x:4,y:4,width:56,height:30,rx:15,fill:'#232831',stroke:'#3a414d'},home);var hT=sv('text',{x:32,y:24,'text-anchor':'middle','font-size':15,'font-weight':800,fill:'#c8cdd4'},home);hT.textContent='⌂ 0';
    home.setAttribute('role','button');home.setAttribute('aria-label','Set the angle to 0');
    home.addEventListener('click',function(){if(bdEditing) return;it.a=0;it._z='';save();feedback('ok');toast('Angle set to 0. Do this when the cab points straight ahead.',3000);m.upd(true)});
    var spT=txt({x:292,y:24,'text-anchor':'end','font-size':14,fill:'#8a93a0'},''),stT=txt({x:cx,y:316,'text-anchor':'middle','font-size':17,'font-weight':900,fill:'#e8e8ea'},'');
    var key='',m={};
    m.upd=function(force){
      var c=swCfg(it),k0=[c.lo,c.hi,c.sz,c.inf,PAL.r].join();
      if(k0!==key||force){key=k0;while(ringG.firstChild) ringG.removeChild(ringG.firstChild);segs=[];
        var a0=c.inf?-180:c.lo,a1=c.inf?172.5:c.hi,n=Math.max(2,Math.round((a1-a0)/7.5)+1);
        for(var i=0;i<n;i++){var a=a0+i*(a1-a0)/(n-1),r=a*Math.PI/180,lim=!c.inf&&(a>c.hi-8||a<c.lo+8);
          var gp={x1:cx+Math.sin(r)*122,y1:cy-Math.cos(r)*122,x2:cx+Math.sin(r)*138,y2:cy-Math.cos(r)*138,'stroke-linecap':'round'};
          var gw=lim?sv('line',Object.assign({'stroke-width':11,stroke:PAL.r,opacity:0,filter:'url(#'+id+'g)'},gp),ringG):null;
          segs.push({a:a,lim:lim,g:gw,e:sv('line',Object.assign({'stroke-width':6},gp),ringG)})}
        segs.forEach(function(s0){s0.e.setAttribute('stroke',s0.lim?PAL.r:OFF);s0.e.setAttribute('opacity',s0.lim?.55:1)});m._la=null}
      var a=it.a||0,st=c.inf?'':(a>=c.hi||a<=c.lo)?'lim':(Math.abs(it._sp||0)>.5&&c.sz>0&&(c.hi-a<c.sz||a-c.lo<c.sz))?'slow':'',ak=Math.round(a)+st+(it._st||'');
      upG.setAttribute('transform','rotate('+a.toFixed(1)+' '+cx+' '+cy+')');
      if(ak!==m._la){m._la=ak;
        segs.forEach(function(s0){var lit=c.inf?Math.abs(((s0.a-a+540)%360)-180)<6:(a>=0?(s0.a>=0&&s0.a<=a+.01):(s0.a<=0&&s0.a>=a-.01)),col=OFF,op=1;
          var hot=st==='lim'&&((a>0)===(s0.a>0));if(s0.lim){col=PAL.r;op=hot?1:.55}
          if(lit&&!s0.lim){col=(c.sz>0&&(c.hi-s0.a<c.sz||s0.a-c.lo<c.sz)&&!c.inf)?PAL.o:'#ffd84a'}
          s0.e.setAttribute('stroke',col);s0.e.setAttribute('opacity',op);
          if(s0.g) s0.g.setAttribute('opacity',s0.lim&&hot?.7:0)});
        var t=(a>0?'+':a<0?'−':'')+Math.abs(Math.round(a))+'°';if(hd&&hd.textContent!==t) hd.textContent=t;
        stT.textContent=st==='lim'?tr2('Limit · turn back only'):st==='slow'?tr2('Slowing near the limit'):(C.ch[it.c]?tagOf(it.c)+' · '+C.ch[it.c].name:'');
        stT.setAttribute('fill',st==='lim'?PAL.r:st==='slow'?PAL.o:'#e8e8ea');
        box.setAttribute('aria-label','Swing angle '+t);
      }
      var sp=Math.round(Math.abs(it._sp||0)),spx=sp?(it._sp>0?'↻ ':'↺ ')+sp+'°/s':'';if(spT.textContent!==spx) spT.textContent=spx;
    };
    m.upd(true);return m;
  }
  function tr2(s){return store.prefs.lang==='ms'&&Object.prototype.hasOwnProperty.call(MS,s)?MS[s]:s}
  // ---- Timeline editor: one lane per channel, drag points, pick the shape of each change ----
  var TLE=null;
  function tlEdit(it){
    var tl=tlOf(it);if(!tl){toast('This timeline is missing.');return}
    if(TLE) tlClose();
    var snap=JSON.stringify(tl);
    var ov=document.createElement('div');ov.id='tlEd';ov.className='tled';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
    ov.innerHTML='<div class="tle-top"><button class="btn v2-ib" type="button" data-a="x" aria-label="Close">✕</button><input class="txt tle-nm" maxlength="20" aria-label="Timeline name"><button class="btn pri tle-play" type="button" data-a="play"></button></div>'+
      '<div class="tle-row"><label>Length<select data-f="dur"></select></label><label>Repeat<select data-f="rp"></select></label></div>'+
      '<div class="tle-body"><div class="tle-main"><div class="tle-svgw"><svg class="tle-svg"></svg></div>'+
      '<p class="note tle-hint">Drag a point. Tap an empty spot in a lane to add a point. Tap a point to change it exactly.</p></div>'+
      '<div class="tle-side"><div class="tle-pt" hidden></div>'+
      '<div class="tle-row tle-add"><select data-f="ch" aria-label="Channel for the new lane"></select><button class="btn" type="button" data-a="lane">+ Lane</button></div>'+
      '<div class="tle-row tle-end"><button class="btn" type="button" data-a="undo">Undo changes</button><button class="btn pri" type="button" data-a="done">Done</button></div></div></div>';
    document.body.appendChild(ov);
    var svg=ov.querySelector('svg'),W=360,RH=22,LH=78,sel=null,COL=['#ffd84a',PAL.b,PAL.g,'#B57EDC','#EF9F27','#e8e8ea'];
    TLE={ov:ov,it:it,tl:tl,raf:0};
    var nmI=ov.querySelector('.tle-nm');nmI.value=tl.name;nmI.addEventListener('input',function(){tl.name=nmI.value.slice(0,20)||'Timeline'});
    var dS=ov.querySelector('[data-f=dur]');[2,3,4,5,6,8,10,15,20,30,45,60].forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v+' s';dS.appendChild(o)});
    if(!dS.querySelector('option[value="'+tl.dur+'"]')){var o0=document.createElement('option');o0.value=tl.dur;o0.textContent=tl.dur+' s';dS.appendChild(o0)}dS.value=String(tl.dur);
    dS.addEventListener('change',function(){var nd=+dS.value,f=nd/tl.dur;tl.lanes.forEach(function(l){l.pts.forEach(function(q){q[0]=Math.round(q[0]*f*10)/10})});tl.dur=nd;draw()});
    var rS=ov.querySelector('[data-f=rp]');[[1,'Once'],[2,'×2'],[3,'×3'],[5,'×5'],[0,'Loop']].forEach(function(v){var o=document.createElement('option');o.value=v[0];o.textContent=v[1];rS.appendChild(o)});rS.value=String(tl.rp);
    rS.addEventListener('change',function(){tl.rp=+rS.value});
    var chS=ov.querySelector('[data-f=ch]');
    function fillCh(){chS.innerHTML='';activeIdx().filter(function(c){return !tl.lanes.some(function(l){return l.c===c})}).forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=tagOf(c)+' · '+C.ch[c].name;chS.appendChild(o)});
      ov.querySelector('.tle-add').hidden=!chS.options.length||tl.lanes.length>=MAX_TLLANES}
    function X(t){return 34+t/tl.dur*(W-46)}
    function T(x){return Math.max(0,Math.min(tl.dur,(x-34)/(W-46)*tl.dur))}
    function pt(e){var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var m=svg.getScreenCTM();return m?p.matrixTransform(m.inverse()):{x:0,y:0}}
    var head=null;
    function draw(){
      // draw 1:1 in screen pixels and fit all lanes on the screen, so nothing needs scrolling
      W=Math.max(240,svg.clientWidth||360);
      var top0=svg.getBoundingClientRect().top+(window.scrollY||0)-ov.getBoundingClientRect().top+ov.scrollTop, land=window.innerWidth>window.innerHeight;
      var avail=window.innerHeight-top0-(land?34:150), nl=Math.max(1,tl.lanes.length);
      LH=Math.round(Math.max(46,Math.min(84,(avail-RH-6)/nl)));
      var H=RH+tl.lanes.length*LH+6;svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.style.height=H+'px';
      while(svg.firstChild) svg.removeChild(svg.firstChild);
      var step=tl.dur<=6?1:tl.dur<=15?2:tl.dur<=30?5:10;
      for(var s0=0;s0<=tl.dur+1e-6;s0+=step){sv('text',{x:X(s0),y:14,'text-anchor':'middle','font-size':10,fill:'#8a93a0'},svg).textContent=s0+'s';sv('line',{x1:X(s0),y1:RH,x2:X(s0),y2:H,stroke:'rgba(255,255,255,.05)'},svg)}
      tl.lanes.forEach(function(l,i){
        var y0=RH+i*LH,mid=y0+(LH-8)/2,a=(LH-8)/2-7,col=COL[i%COL.length];
        var bg=sv('rect',{x:2,y:y0,width:W-4,height:LH-8,rx:10,fill:'#0b0e12',stroke:'#262b33'},svg);
        sv('line',{x1:34,y1:mid,x2:W-12,y2:mid,stroke:'#262b33'},svg);
        sv('text',{x:8,y:y0+16,'font-size':12,'font-weight':900,fill:col},svg).textContent=tagOf(l.c);
        var del=sv('text',{x:8,y:y0+LH-16,'font-size':13,fill:'#8a93a0',style:'cursor:pointer'},svg);del.textContent='✕';
        del.addEventListener('click',function(){tl.lanes.splice(i,1);sel=null;fillCh();draw();ptPanel()});
        var d='';for(var q=0;q<=120;q++){var tt=q/120*tl.dur;d+=(q?'L':'M')+X(tt).toFixed(1)+' '+(mid-tlVal(l.pts,tt)/100*a).toFixed(1)}
        sv('path',{d:d,fill:'none',stroke:col,'stroke-width':2.6,'stroke-linejoin':'round','pointer-events':'none'},svg);
        // add a point only on a clear tap (no slide, short press), so a touch that was meant to scroll adds nothing
        var tap0=null;
        bg.addEventListener('pointerdown',function(e){tap0={x:e.clientX,y:e.clientY,t:Date.now()}});
        bg.addEventListener('pointermove',function(e){if(tap0&&Math.hypot(e.clientX-tap0.x,e.clientY-tap0.y)>8) tap0=null});
        bg.addEventListener('pointerup',function(e){
          var ok=tap0&&Date.now()-tap0.t<450&&Math.hypot(e.clientX-tap0.x,e.clientY-tap0.y)<=8;tap0=null;if(!ok) return;
          if(sel){sel=null;draw();ptPanel();return}
          if(l.pts.length>=MAX_TLPTS){toast('Up to 16 points in a lane.');return}
          var q=pt(e),t=Math.round(T(q.x)*10)/10,v=Math.round(Math.max(-100,Math.min(100,(mid-q.y)/a*100))/5)*5;
          if(t<=0||t>=tl.dur) return;if(l.pts.some(function(z){return Math.abs(z[0]-t)<.1})) return;
          l.pts.push([t,v,0]);l.pts.sort(function(a1,b1){return a1[0]-b1[0]});sel={l:l,p:l.pts.filter(function(z){return z[0]===t})[0]};feedback('tick');draw();ptPanel()});
        l.pts.forEach(function(p,k){
          var on=sel&&sel.p===p,c=sv('circle',{cx:X(p[0]),cy:mid-p[1]/100*a,r:on?9:7,fill:on?'#fff':col,stroke:'#0b0e12','stroke-width':2.5,style:'cursor:grab'},svg);
          c.setAttribute('role','button');c.setAttribute('aria-label',tagOf(l.c)+' '+p[0]+' s '+p[1]);
          var hit=sv('circle',{cx:X(p[0]),cy:mid-p[1]/100*a,r:18,fill:'transparent',style:'cursor:grab'},svg);
          hit.addEventListener('pointerdown',function(e){e.stopPropagation();try{hit.setPointerCapture(e.pointerId)}catch(_){}
            var mv=false,sx=e.clientX,sy=e.clientY;sel={l:l,p:p};ptPanel();
            hit.onpointermove=function(ev){if(!mv&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<5) return;mv=true;var q=pt(ev);
              if(k>0&&k<l.pts.length-1){var lo=l.pts[k-1][0]+.1,hi=l.pts[k+1][0]-.1;p[0]=Math.round(Math.max(lo,Math.min(hi,T(q.x)))*10)/10}
              var nv=Math.round(Math.max(-100,Math.min(100,(mid-q.y)/a*100))/5)*5;if(nv!==p[1]){p[1]=nv;if(nv%25===0) feedback('tick')}
              c.setAttribute('cx',X(p[0]));c.setAttribute('cy',mid-p[1]/100*a);hit.setAttribute('cx',X(p[0]));hit.setAttribute('cy',mid-p[1]/100*a);ptPanel()};
            hit.onpointerup=hit.onpointercancel=function(){hit.onpointermove=null;draw();ptPanel()}});
        });
      });
      head=sv('line',{x1:0,y1:RH-4,x2:0,y2:H,stroke:'#fff','stroke-width':2,opacity:0,'pointer-events':'none'},svg);
      var pl=ov.querySelector('.tle-play'),on=!!(S.play&&S.play.tl===tl.id);pl.textContent=on?'■ Stop':'▶ Play';
    }
    function ptPanel(){
      var box=ov.querySelector('.tle-pt');if(!sel||tl.lanes.indexOf(sel.l)<0||sel.l.pts.indexOf(sel.p)<0){box.hidden=true;return}
      var l=sel.l,p=sel.p,k=l.pts.indexOf(p),end=k===0||k===l.pts.length-1;box.hidden=false;
      if(box._p!==p){box._p=p;box.innerHTML='<div class="tle-ph"><b></b><button class="btn" type="button" data-a="del">Delete point</button></div>'+
        '<label class="tle-f"><span>Value</span><b class="v"></b><input type="range" min="-100" max="100" step="5" data-f="v"></label>'+
        '<label class="tle-f"><span>Time</span><b class="t"></b><input type="range" step="0.1" data-f="t"></label>'+
        '<div class="tle-f"><span>Change</span><div class="seg tle-sh"><button class="btn" type="button" data-s="0">Smooth</button><button class="btn" type="button" data-s="1">Straight</button><button class="btn" type="button" data-s="2">Jump</button></div></div>';
        var vI=box.querySelector('[data-f=v]'),tI=box.querySelector('[data-f=t]');
        vI.addEventListener('input',function(){p[1]=+vI.value;draw();ptPanel()});
        tI.addEventListener('input',function(){p[0]=+tI.value;draw();ptPanel()});
        [].forEach.call(box.querySelectorAll('[data-s]'),function(b){b.addEventListener('click',function(){p[2]=+b.dataset.s;feedback('tick');draw();ptPanel()})});
        box.querySelector('[data-a=del]').addEventListener('click',function(){var kk=l.pts.indexOf(p);if(kk>0&&kk<l.pts.length-1){l.pts.splice(kk,1);sel=null;draw();ptPanel()}});
      }
      box.querySelector('.tle-ph b').textContent=tagOf(l.c)+' · '+C.ch[l.c].name;
      box.querySelector('.v').textContent=(p[1]>0?'+':'')+p[1];box.querySelector('.t').textContent=p[0].toFixed(1)+' s';
      var vI2=box.querySelector('[data-f=v]'),tI2=box.querySelector('[data-f=t]');vI2.value=p[1];
      tI2.disabled=end;tI2.min=end?p[0]:l.pts[k-1][0]+.1;tI2.max=end?p[0]:l.pts[k+1][0]-.1;tI2.value=p[0];
      box.querySelector('[data-a=del]').disabled=end;
      [].forEach.call(box.querySelectorAll('[data-s]'),function(b){b.setAttribute('aria-pressed',String(+b.dataset.s===p[2]));b.disabled=k===0});
    }
    ov.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b) return;var a=b.dataset.a;
      if(a==='x'||a==='done'){tlClose();return}
      if(a==='undo'){var o=JSON.parse(snap);Object.keys(o).forEach(function(k){tl[k]=o[k]});sel=null;nmI.value=tl.name;dS.value=String(tl.dur);rS.value=String(tl.rp);fillCh();draw();ptPanel();toast('Changes undone.');return}
      if(a==='play'){if(S.play&&S.play.tl!==tl.id) stopPlay(true);runTl(tl);setTimeout(draw,30);return}
      if(a==='lane'){var c=+chS.value;if(!(c>=0)||tl.lanes.length>=MAX_TLLANES) return;tl.lanes.push({c:c,pts:[[0,0,0],[tl.dur,0,0]]});fillCh();draw();feedback('ok')}});
    function loop(){if(!TLE||TLE.ov!==ov) return;var f=tlProg(tl);if(head){head.setAttribute('opacity',f>=0?1:0);if(f>=0){var hx=X(f*tl.dur);head.setAttribute('x1',hx);head.setAttribute('x2',hx)}}
      var pl=ov.querySelector('.tle-play'),t0=f>=0?'■ Stop':'▶ Play';if(pl.textContent!==t0) pl.textContent=t0;TLE.raf=requestAnimationFrame(loop)}
    fillCh();draw();loop();
    window.addEventListener('resize',draw);TLE.rs=draw;
  }
  function tlClose(){
    if(!TLE) return;var t=TLE;TLE=null;cancelAnimationFrame(t.raf);window.removeEventListener('resize',t.rs);
    if(S.play&&S.play.tl===t.tl.id){stopPlay(true)}
    t.ov.remove();save();syncBoard();
  }
  function xwBuild(el,it,hd){
    var k=it.k,id='xw'+(++XWN),OFF='rgba(150,160,175,.17)';
    var box=document.createElement('div');box.className='mtr-box';
    var svg=sv('svg',{'class':'xwv','data-k':k,viewBox:'0 0 300 260','preserveAspectRatio':'xMidYMid meet'},box);
    el.appendChild(box);
    var df=sv('defs',{},svg);
    function grad(gid,type,at,stops){var g=sv(type,at,df);g.setAttribute('id',gid);stops.forEach(function(s){sv('stop',{offset:s[0],'stop-color':s[1]},g)});return 'url(#'+gid+')'}
    var KN=grad(id+'k','radialGradient',{cx:'38%',cy:'32%',r:'75%'},[['0','#fff6c4'],['.35','#ffd84a'],['.75','#d9a400'],['1','#8a6700']]);
    var RIM=grad(id+'r','linearGradient',{x1:0,y1:0,x2:0,y2:1},[['0','#d7dce3'],['.45','#5a6069'],['1','#aab1bb']]);
    var gl=sv('filter',{id:id+'g',x:'-60%',y:'-60%',width:'220%',height:'220%'},df);sv('feGaussianBlur',{stdDeviation:6},gl);
    function knob(r){var g=sv('g',{},svg);sv('circle',{r:r+8,fill:'#f5c518',opacity:.32,filter:'url(#'+id+'g)'},g);sv('circle',{r:r,fill:KN,stroke:'#a07c00','stroke-width':2},g);
      sv('circle',{r:r*.62,fill:'none',stroke:'rgba(120,85,0,.55)','stroke-width':2.5},g);sv('circle',{r:r*.22,fill:'#fff4b0',opacity:.9},g);return g}
    function col(p){p=Math.abs(p);return p<60?PAL.g:p<85?PAL.o:PAL.r}
    function pt(e){var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var m=svg.getScreenCTM();return m?p.matrixTransform(m.inverse()):{x:0,y:0}}
    function txt(at,s){var t=sv('text',at,svg);t.textContent=s;return t}
    var z=function(){return (C.zone||100)/100||1};
    var m={upd:function(){}};
    if(k==='xy'){
      // ---- XY pad: X = first channel, Y = second channel ----
      var X0=58,Y0=12,W=200,H=200,cx=X0+W/2,cy=Y0+H/2,R=20,MV=W/2-R-6;
      sv('rect',{x:X0-6,y:Y0-6,width:W+12,height:H+12,rx:22,fill:RIM},svg);
      sv('rect',{x:X0-2,y:Y0-2,width:W+4,height:H+4,rx:19,fill:'#050607'},svg);
      sv('rect',{x:X0,y:Y0,width:W,height:H,rx:17,fill:'#08090b'},svg);
      if(!it.ng){var gg=sv('g',{stroke:'rgba(255,255,255,.06)','stroke-width':1},svg);
        for(var i=1;i<8;i++){if(i===4) continue;sv('line',{x1:X0+W*i/8,y1:Y0+8,x2:X0+W*i/8,y2:Y0+H-8},gg);sv('line',{x1:X0+8,y1:Y0+H*i/8,x2:X0+W-8,y2:Y0+H*i/8},gg)}}
      sv('line',{x1:cx,y1:Y0+8,x2:cx,y2:Y0+H-8,stroke:'rgba(255,255,255,.16)'},svg);sv('line',{x1:X0+8,y1:cy,x2:X0+W-8,y2:cy,stroke:'rgba(255,255,255,.16)'},svg);
      sv('rect',{x:cx-R,y:cy-R,width:2*R,height:2*R,rx:10,fill:'none',stroke:'rgba(245,197,24,.35)','stroke-dasharray':'3 4'},svg);
      var agl=sv('filter',{id:id+'a',x:'-250%',y:'-250%',width:'600%',height:'600%'},df);sv('feGaussianBlur',{stdDeviation:5},agl);
      var ARW=['M'+(cx-6)+' '+(Y0+16)+'l6 -8 6 8z','M'+(cx-6)+' '+(Y0+H-16)+'l6 8 6 -8z','M'+(X0+16)+' '+(cy-6)+'l-8 6 8 6z','M'+(X0+W-16)+' '+(cy-6)+'l8 6 -8 6z'].map(function(d){
        var g=sv('g',{},svg),hl=sv('path',{d:d,fill:'#ffd84a',stroke:'#ffc400','stroke-width':7,'stroke-linejoin':'round',opacity:0,filter:'url(#'+id+'a)'},g);sv('path',{d:d,fill:'#d9a400',opacity:.85},g);var lit=sv('path',{d:d,fill:'#ffe27a',opacity:0},g);return {hl:hl,lit:lit,v:-1}});
      // up, down, left, right: lit in the direction the pad is pushed
      function arrows(x,y){[y,-y,-x,x].forEach(function(v,j){var a=ARW[j],o=Math.max(0,Math.min(1,(v-3)/60));o=Math.round(o*20)/20;if(a.v===o) return;a.v=o;a.hl.setAttribute('opacity',o);a.lit.setAttribute('opacity',o)})}
      var gx=sv('line',{y1:Y0+6,y2:Y0+H-6,stroke:'rgba(245,197,24,.45)','stroke-dasharray':'4 4'},svg),gy=sv('line',{x1:X0+6,x2:X0+W-6,stroke:'rgba(245,197,24,.45)','stroke-dasharray':'4 4'},svg);
      var LX=[],LY=[],N=20;
      if(!it.nr){for(i=0;i<N;i++){LX.push(sv('rect',{x:X0+4+i*(W-8)/N+1,y:Y0+H+12,width:(W-8)/N-2,height:9,rx:2,fill:OFF},svg));LY.push(sv('rect',{x:X0-26,y:Y0+4+i*(H-8)/N+1,width:9,height:(H-8)/N-2,rx:2,fill:OFF},svg))}
        txt({x:X0+W+12,y:Y0+H+20,'font-size':12,'font-weight':800,fill:'#cfd4db'},tagOf(it.c));txt({x:X0-26,y:Y0-2,'font-size':12,'font-weight':800,fill:'#cfd4db'},tagOf(it.d))}
      var kn=knob(R),dx=0,dy=0,pid=null;
      function rail(L,val,horiz){var n=L.length,h=n/2,q=Math.round(Math.abs(val)/100*h);L.forEach(function(r,j){var ix=horiz?j:n-1-j,on=val>=0?(ix>=h&&ix<h+q):(ix<h&&ix>=h-q),p=Math.abs(ix<h?h-ix:ix-h+1)/h*100,f=on?(val<0?PAL.b:col(p)):(ix===h||ix===h-1?'rgba(200,208,220,.3)':OFF);if(r.__f!==f){r.__f=f;r.setAttribute('fill',f)}})}
      function place(x,y){var px=cx+x/100*MV,py=cy-y/100*MV;kn.setAttribute('transform','translate('+px.toFixed(1)+' '+py.toFixed(1)+')');gx.setAttribute('x1',px);gx.setAttribute('x2',px);gy.setAttribute('y1',py);gy.setAttribute('y2',py);gx.style.opacity=gy.style.opacity=(Math.abs(x)>1||Math.abs(y)>1)?1:0}
      function from(e){var p=pt(e);var x=Math.max(-100,Math.min(100,(p.x-cx)/MV*100)),y=Math.max(-100,Math.min(100,-(p.y-cy)/MV*100));var jx=it.jc&&it.jc.ax;if(jx==='x') y=0;if(jx==='y') x=0;return [x,y]}
      function send(x,y){noteInput();delete RAMP[it.c];delete RAMP[it.d];var sh=jshape(x/100,y/100,it.jc),a=sh[0],b=sh[1];if(it.m==='tank'){a=clamp(sh[1]+sh[0],-1,1);b=clamp(sh[1]-sh[0],-1,1)}setT(it.c,a*100*z(),false);setT(it.d,b*100*z(),false)}
      svg.style.touchAction='none';
      svg.addEventListener('pointerdown',function(e){if(bdEditing||S.estop||S.play) return;e.preventDefault();pid=e.pointerId;try{svg.setPointerCapture(pid)}catch(_){}var v=from(e);dx=v[0];dy=v[1];place(dx,dy);send(dx,dy)});
      svg.addEventListener('pointermove',function(e){if(e.pointerId!==pid) return;var v=from(e);dx=v[0];dy=v[1];place(dx,dy);send(dx,dy)});
      ['pointerup','pointercancel'].forEach(function(ev){svg.addEventListener(ev,function(e){if(e.pointerId!==pid) return;pid=null;if(!it.hd) send(0,0)})});
      var sx=0,sy=0;
      m.upd=function(){var tx=(rt.t[it.c]||0)/z(),ty=(rt.t[it.d]||0)/z();if(it.m==='tank'){var ta=tx,tb=ty;ty=(ta+tb)/2;tx=(ta-tb)/2}if(pid===null){sx+=(tx-sx)*.55;sy+=(ty-sy)*.55;if(Math.abs(sx-tx)<.5) sx=tx;if(Math.abs(sy-ty)<.5) sy=ty;place(sx,sy)}else{sx=dx;sy=dy}
        if(LX.length){rail(LX,rt.t[it.c]||0,true);rail(LY,rt.t[it.d]||0,false)}
        arrows(sx,sy);
        if(hd){var s=fmt(rt.t[it.c]||0)+' · '+fmt(rt.t[it.d]||0);if(hd.textContent!==s) hd.textContent=s}};
    }else if(k==='xf'){
      // ---- Crossfader (mixer desk): master fader = throttle (starts at 0 each time), two VU columns, presets, reverse per side ----
      svg.setAttribute('viewBox','0 0 320 300');
      var mx=28,my0=40,my1=210;
      sv('rect',{x:mx-9,y:my0-12,width:18,height:my1-my0+24,rx:9,fill:'#020203',stroke:'#5a6069','stroke-width':2},svg);
      for(var mi=0;mi<=10;mi++) sv('line',{x1:mx+14,x2:mx+(mi%5?19:23),y1:my1-(my1-my0)*mi/10,y2:my1-(my1-my0)*mi/10,stroke:'#4a5059','stroke-width':1.5},svg);
      txt({x:mx,y:my1+30,'text-anchor':'middle','font-size':10,'font-weight':800,fill:'#8a93a0','letter-spacing':1},'POWER');
      if(typeof it._m!=='number') it._m=0;
      var mtx=txt({x:mx,y:my0-20,'text-anchor':'middle','font-size':13,'font-weight':900,fill:'#f5c518'},'');
      var mcap=sv('g',{},svg);sv('rect',{x:-15,y:-9,width:30,height:18,rx:4,fill:'#d7dce3',stroke:'#5a6069','stroke-width':1.5},mcap);sv('line',{x1:-11,x2:11,y1:0,y2:0,stroke:PAL.r,'stroke-width':2.5},mcap);
      function vu(x){var a=[];sv('rect',{x:x-5,y:35,width:40,height:160,rx:10,fill:'#050607',stroke:'#2b3038'},svg);for(var q=0;q<12;q++) a.push(sv('rect',{x:x,y:40+150-(q+1)*12.5+1.5,width:30,height:9.5,rx:2.5,fill:OFF},svg));return a}
      var VC=vu(70),VD=vu(250);
      txt({x:85,y:28,'text-anchor':'middle','font-size':13,'font-weight':900,fill:'#eceef2'},tagOf(it.c));txt({x:265,y:28,'text-anchor':'middle','font-size':13,'font-weight':900,fill:'#eceef2'},tagOf(it.d));
      // small buttons: [x,y,w,h,label,action]
      var BT=[];
      function sbtn(x,y,w,h,lab,fs,act){var g=sv('g',{style:'cursor:pointer'},svg),r=sv('rect',{x:x,y:y,width:w,height:h,rx:Math.min(8,h/2),fill:'#22262c',stroke:'#3a3f47','stroke-width':1.5},g),t=txt({x:x+w/2,y:y+h/2+fs*.36,'text-anchor':'middle','font-size':fs,'font-weight':800,fill:'#cfd4db'},lab);g.appendChild(t);
        var b={x:x,y:y,w:w,h:h,act:act,set:function(on,l){if(b.on===on&&(l===undefined||b.l===l)) return;b.on=on;if(l!==undefined) b.l=l;r.setAttribute('fill',on?'#f5c518':'#22262c');r.setAttribute('stroke',on?'#f5c518':'#3a3f47');t.setAttribute('fill',on?'#1a1300':'#cfd4db');if(l!==undefined) t.textContent=l}};BT.push(b);return b}
      var bRC=sbtn(63,202,44,22,'⇄',13,function(){it.rc=it.rc?0:1;if(!it.rc) delete it.rc;save();apply()}),bRD=sbtn(243,202,44,22,'⇄',13,function(){it.rd=it.rd?0:1;if(!it.rd) delete it.rd;save();apply()});
      var bP=[['C',-1],['50',0],['D',1]].map(function(q,j){return sbtn(127+j*33,150,30,24,q[0],11,function(){bal=q[1];apply()})});
      var bCv=sbtn(130,182,90,20,'',9.5,function(){it.md=it.md?0:1;if(!it.md) delete it.md;save();apply()});
      txt({x:175,y:64,'text-anchor':'middle','font-size':11,'font-weight':800,fill:'#8a93a0','letter-spacing':2},'BALANCE');
      var big=txt({x:175,y:112,'text-anchor':'middle','font-size':30,'font-weight':900,fill:'#eceef2'},'50 : 50');
      var tx0=90,tx1=260,ty=262;
      sv('rect',{x:tx0-22,y:ty-16,width:tx1-tx0+44,height:32,rx:16,fill:'#020203',stroke:'#5a6069','stroke-width':2.5},svg);
      for(var t=0;t<=8;t++){var xx=tx0+(tx1-tx0)*t/8;sv('line',{x1:xx,x2:xx,y1:ty-22,y2:ty-(t%4?26:30),stroke:t===4?'#f5c518':'#4a5059','stroke-width':t===4?2.5:1.5},svg)}
      var fill=sv('rect',{y:ty-4,height:8,rx:4,fill:PAL.g,opacity:0},svg);
      var kn2=knob(17),bal=it._b||0,det=true,lastTap=0,drag=null;
      function outs(){var tot=(it.p||100)*it._m/100,c,d;if(it.md){c=tot*(1-bal)/2;d=tot*(1+bal)/2}else{c=tot*Math.min(1,1-bal);d=tot*Math.min(1,1+bal)}return [Math.round(c)*(it.rc?-1:1),Math.round(d)*(it.rd?-1:1)]}
      // every change sends both channels at once; with the fader at 0 nothing runs
      function apply(){it._b=bal;var o=outs();noteInput();delete RAMP[it.c];delete RAMP[it.d];setT(it.c,o[0],false);setT(it.d,o[1],false)}
      svg.style.touchAction='none';
      svg.addEventListener('pointerdown',function(e){if(bdEditing||S.estop||S.play) return;var p=pt(e);
        for(var q=0;q<BT.length;q++){var b=BT[q];if(p.x>=b.x-3&&p.x<=b.x+b.w+3&&p.y>=b.y-3&&p.y<=b.y+b.h+3){e.preventDefault();b.act();dialBuzz();return}}
        if(p.x<mx+24&&p.y>my0-20&&p.y<my1+20){e.preventDefault();drag={k:'m',id:e.pointerId};try{svg.setPointerCapture(e.pointerId)}catch(_){}mv(p);return}
        if(p.y>ty-34&&p.x>tx0-30&&p.x<tx1+30){e.preventDefault();var n=performance.now();if(n-lastTap<320){bal=0;lastTap=0;dialBuzz();apply();return}lastTap=n;drag={k:'b',id:e.pointerId};try{svg.setPointerCapture(e.pointerId)}catch(_){}mv(p)}});
      function mv(p){if(drag.k==='m'){var np=Math.round(Math.max(0,Math.min(100,(my1-p.y)/(my1-my0)*100))/5)*5;if(np!==it._m){if(np===0||it._m===0) dialBuzz();it._m=np;apply()}}
        else{var nb=Math.max(-1,Math.min(1,(p.x-(tx0+tx1)/2)/((tx1-tx0)/2)));if(Math.abs(nb)<.06){if(!det){det=true;dialBuzz()}nb=0}else det=false;bal=nb;apply()}}
      svg.addEventListener('pointermove',function(e){if(drag&&e.pointerId===drag.id) mv(pt(e))});
      ['pointerup','pointercancel'].forEach(function(ev){svg.addEventListener(ev,function(e){if(drag&&e.pointerId===drag.id) drag=null})});
      function paint(L,live,ghost){var l=Math.round(Math.abs(live)/100*12),g=Math.round(Math.abs(ghost)/100*12);L.forEach(function(r,j){var f=j<l?(live<0?PAL.b:col((j+.5)/12*100)):(j<g?(ghost<0?'rgba(55,138,221,.24)':'rgba(245,197,24,.2)'):OFF);if(r.__f!==f){r.__f=f;r.setAttribute('fill',f)}})}
      m.upd=function(){if(S.estop&&it._m) it._m=0;var o=outs(),on=it._m>0;
        // the columns show only what this crossfader sends
        paint(VC,o[0],0);paint(VD,o[1],0);
        var mv0=it._m;if(mtx.textContent!==String(mv0)) mtx.textContent=String(mv0);mcap.setAttribute('transform','translate('+mx+' '+(my1-mv0/100*(my1-my0)).toFixed(1)+')');
        var pl=Math.round(50-bal*50),s=pl+' : '+(100-pl);if(big.textContent!==s) big.textContent=s;
        bP.forEach(function(b,j){b.set(Math.abs(bal-[-1,0,1][j])<.02)});bRC.set(!!it.rc);bRD.set(!!it.rd);bCv.set(false,it.md?'Cross':'Full in centre');
        var kx=(tx0+tx1)/2+bal*(tx1-tx0)/2,mid=(tx0+tx1)/2;kn2.setAttribute('transform','translate('+kx.toFixed(1)+' '+ty+')');
        if(Math.abs(bal)<.01) fill.setAttribute('opacity',0);else{fill.setAttribute('x',Math.min(kx,mid));fill.setAttribute('width',Math.abs(kx-mid));fill.setAttribute('opacity',on?.9:.3)}
        if(hd){var h2=on?fmt(o[0])+' · '+fmt(o[1]):'OFF';if(m.lh!==h2){m.lh=h2;hd.textContent=h2}}};
    }else if(k==='ax'){
      // ---- Motor axle: the round front of the Motor XL; only the orange axle turns, with the power the hub
      // gets on the channel. Fast turns leave fading copies of the cross. LED display under it fills left to right going forward, right to left in reverse.
      var acx=150,acy=106,SU=45,KB='#0b0b0b',asegs=[];
      var DK=grad(id+'d','radialGradient',{cx:'35%',cy:'30%',r:'90%'},[['0','#8b9098'],['.45','#55595f'],['1','#2c2f33']]);
      var DK2=grad(id+'p','linearGradient',{x1:0,y1:0,x2:1,y2:1},[['0','#6e737a'],['1','#34373c']]);
      var HR=grad(id+'h','linearGradient',{x1:0,y1:0,x2:1,y2:1},[['0','#2a2d31'],['.45','#e9ecef'],['.6','#9aa0a7'],['1','#2a2d31']]);
      var sh=sv('filter',{id:id+'s',x:'-20%',y:'-20%',width:'140%',height:'150%'},df);sv('feDropShadow',{dx:0,dy:5,stdDeviation:5,'flood-color':'#000','flood-opacity':.6},sh);
      var dg=sv('g',{filter:'url(#'+id+'s)'},svg);
      sv('circle',{cx:acx,cy:acy,r:2.2*SU,fill:DK,stroke:KB,'stroke-width':3},dg);
      sv('circle',{cx:acx,cy:acy,r:1.85*SU,fill:'none',stroke:KB,'stroke-width':2},dg);
      var pr=.62*SU,PLn=SU;
      sv('path',{d:'M'+(acx-pr)+' '+(acy-PLn)+'A'+pr+' '+pr+' 0 0 1 '+(acx+pr)+' '+(acy-PLn)+'V'+(acy-pr)+'H'+(acx+PLn)+'A'+pr+' '+pr+' 0 0 1 '+(acx+PLn)+' '+(acy+pr)+'H'+(acx+pr)+'V'+(acy+PLn)+'A'+pr+' '+pr+' 0 0 1 '+(acx-pr)+' '+(acy+PLn)+'V'+(acy+pr)+'H'+(acx-PLn)+'A'+pr+' '+pr+' 0 0 1 '+(acx-PLn)+' '+(acy-pr)+'H'+(acx-pr)+'Z',fill:DK2,stroke:KB,'stroke-width':2.4},dg);
      [[0,-1],[1,0],[0,1],[-1,0]].forEach(function(q){var hx=acx+q[0]*PLn,hy=acy+q[1]*PLn,hr=.39*SU;
        sv('circle',{cx:hx,cy:hy,r:hr+3,fill:'#3a3d42',stroke:KB,'stroke-width':2.4},dg);sv('circle',{cx:hx,cy:hy,r:hr,fill:HR,stroke:KB,'stroke-width':2},dg);sv('circle',{cx:hx,cy:hy,r:hr*.72,fill:'#16181b',stroke:KB,'stroke-width':1.6},dg)});
      var ar=.42*SU,aa=.11*SU,ab=.3*SU;
      sv('circle',{cx:acx,cy:acy,r:ar,fill:'#95571E',stroke:KB,'stroke-width':3},svg);
      sv('circle',{cx:acx,cy:acy,r:ar-4,fill:'none',stroke:'#c07a35','stroke-width':1.4,opacity:.7},svg);
      var CRS='M'+(acx-aa)+' '+(acy-ab)+'h'+(2*aa)+'v'+(ab-aa)+'h'+(ab-aa)+'v'+(2*aa)+'h-'+(ab-aa)+'v'+(ab-aa)+'h-'+(2*aa)+'v-'+(ab-aa)+'h-'+(ab-aa)+'v-'+(2*aa)+'h'+(ab-aa)+'z';
      var acp=[];for(var ci2=4;ci2>=0;ci2--){acp.unshift(sv('path',{d:CRS,fill:'#1b1208',stroke:KB,'stroke-width':1.5,opacity:ci2?0:1},svg))}
      // full-width LED display: forward fills from the left, reverse fills from the right
      var by=226,bh=22,NS=20,bx0=22,bw=(300-2*bx0)/NS,bgp=2.6;
      sv('rect',{x:bx0-10,y:by-6,width:NS*bw+20-bgp,height:bh+12,rx:(bh+12)/2,fill:'#0b0d11',stroke:'#2c333f'},svg);
      for(var q=0;q<NS;q++) asegs.push(sv('rect',{x:(bx0+q*bw).toFixed(1),y:by,width:(bw-bgp).toFixed(1),height:bh,rx:3,fill:OFF},svg));
      svg.style.pointerEvents='none';
      var aang=0,aspd=0,alast=0,alit=null,araf=0;
      function aframe(tm){araf=0;if(!svg.isConnected) return;var dt=alast?Math.min(.05,(tm-alast)/1000):0;alast=tm;var val=S.connected?(rt.o[it.c]||0):(rt.t[it.c]||0);
        aspd+=(val-aspd)*Math.min(1,dt*2.2);if(Math.abs(aspd)<.2&&val===0) aspd=0;aang=(aang+aspd*dt*10)%360;
        var kk=Math.min(1,Math.abs(aspd)/100),dir=aspd<0?-1:1,nc=Math.min(4,Math.floor(Math.abs(aspd)/20));
        acp.forEach(function(pth,j){pth.setAttribute('transform','rotate('+(aang-j*kk*7*dir).toFixed(1)+' '+acx+' '+acy+')');pth.setAttribute('opacity',j===0?'1':(j<=nc?(.3-j*.05).toFixed(2):'0'))});
        var ln=Math.round(Math.abs(val)/100*asegs.length)*(val<0?-1:1);
        if(ln!==alit){alit=ln;var NN=asegs.length;asegs.forEach(function(r,j){var ix=ln<0?NN-1-j:j,on=ix<Math.abs(ln);r.setAttribute('fill',on?col((ix+1)/NN*100):OFF)})}
        if(hd){var s4=fmt(Math.round(val));if(hd.textContent!==s4) hd.textContent=s4}
        if(aspd!==0||val!==0) araf=requestAnimationFrame(aframe);else alast=0}
      m.upd=function(){if(!araf) araf=requestAnimationFrame(aframe)};
      m.upd();
    }else{
      // ---- Rotor: blades spin with the power the hub gets on the channel. Fast blades stay sharp with fading
      // copies behind them (no blur). Styles: 1 boat propeller (silver, ripples), otherwise jet turbine (16 blades).
      var rcx=150,rcy=124,RR=104,SEG=36,segs=[],sty=it.bs===1?1:2;
      var SIL=grad(id+'b','linearGradient',{x1:0,y1:0,x2:1,y2:sty===1?1:0},[['0','#6b727c'],['.45','#f2f4f7'],['.6','#c3c9d1'],['1','#5d636c']]);
      var HB=grad(id+'h','radialGradient',{cx:'35%',cy:'30%',r:'80%'},[['0','#ffffff'],['.4','#b9bfc8'],['1','#3d424a']]);
      for(var s2=0;s2<SEG;s2++){var a0=(s2/SEG)*Math.PI*2-Math.PI/2+.03,a1=((s2+1)/SEG)*Math.PI*2-Math.PI/2-.03,r1=RR+2,r2=RR+11;
        segs.push(sv('path',{d:'M'+(rcx+r1*Math.cos(a0)).toFixed(1)+' '+(rcy+r1*Math.sin(a0)).toFixed(1)+'A'+r1+' '+r1+' 0 0 1 '+(rcx+r1*Math.cos(a1)).toFixed(1)+' '+(rcy+r1*Math.sin(a1)).toFixed(1)+'L'+(rcx+r2*Math.cos(a1)).toFixed(1)+' '+(rcy+r2*Math.sin(a1)).toFixed(1)+'A'+r2+' '+r2+' 0 0 0 '+(rcx+r2*Math.cos(a0)).toFixed(1)+' '+(rcy+r2*Math.sin(a0)).toFixed(1)+'Z',fill:OFF},svg))}
      sv('circle',{cx:rcx,cy:rcy,r:RR-2,fill:RIM},svg);
      if(sty===1) sv('circle',{cx:rcx,cy:rcy,r:RR-6,fill:grad(id+'w','radialGradient',{},[['0','#0d2a3a'],['1','#050607']])},svg); else sv('circle',{cx:rcx,cy:rcy,r:RR-6,fill:'#050607'},svg);
      var rip=[],stk=null;
      if(sty===1){for(var q3=0;q3<4;q3++) rip.push(sv('circle',{cx:rcx,cy:rcy,r:30,fill:'none',stroke:'#5fb6e8','stroke-width':1.5,opacity:0},svg))}
      else if(sty===0){stk=sv('g',{opacity:0},svg);for(var q2=0;q2<24;q2++){var aa=q2/24*Math.PI*2;sv('line',{x1:rcx+30*Math.cos(aa),y1:rcy+30*Math.sin(aa),x2:rcx+(RR-16)*Math.cos(aa+.25),y2:rcy+(RR-16)*Math.sin(aa+.25),stroke:'rgba(220,225,232,.14)','stroke-width':2},stk)}}
      else sv('circle',{cx:rcx,cy:rcy,r:RR-10,fill:'none',stroke:'#1b1f25','stroke-width':3},svg);
      var n=sty===2?16:(it.n||3),Lb=RR-18,NT=sty===2?2:3,copies=[];
      function blades(g){
        for(var b=0;b<n;b++){var g2=sv('g',{transform:'rotate('+(b*360/n)+' '+rcx+' '+rcy+')'},g);
          if(sty===2) sv('path',{d:'M'+rcx+' '+(rcy-26)+'Q'+(rcx+14)+' '+(rcy-60)+' '+(rcx+8)+' '+(rcy-RR+14)+'L'+(rcx-2)+' '+(rcy-RR+14)+'Q'+(rcx+2)+' '+(rcy-60)+' '+(rcx-6)+' '+(rcy-26)+'Z',fill:SIL,stroke:'rgba(0,0,0,.5)','stroke-width':.6},g2);
          else if(sty===1) sv('path',{d:'M'+rcx+' '+rcy+'C'+(rcx+34)+' '+(rcy-18)+' '+(rcx+48)+' '+(rcy-70)+' '+(rcx+16)+' '+(rcy-86)+'C'+(rcx-12)+' '+(rcy-92)+' '+(rcx-24)+' '+(rcy-34)+' '+rcx+' '+rcy+'Z',fill:SIL,stroke:'rgba(20,24,30,.7)','stroke-width':1.2},g2);
          else{sv('path',{d:'M'+(rcx-7)+' '+(rcy-14)+'L'+(rcx-10)+' '+(rcy-Lb+14)+'Q'+rcx+' '+(rcy-Lb-2)+' '+(rcx+10)+' '+(rcy-Lb+14)+'L'+(rcx+7)+' '+(rcy-14)+'Z',fill:SIL,stroke:'rgba(0,0,0,.45)','stroke-width':1},g2);
            sv('rect',{x:rcx-10,y:rcy-Lb+12,width:20,height:6,fill:'#f5c518',opacity:.9},g2)}}}
      for(var ci=NT;ci>=0;ci--){var cg=sv('g',{'class':'rb'},svg);blades(cg);copies.unshift(cg)}
      var swl=null;
      if(sty===2){sv('circle',{cx:rcx,cy:rcy,r:28,fill:grad(id+'c','radialGradient',{cx:'40%',cy:'35%',r:'70%'},[['0','#ffffff'],['.5','#9aa1ab'],['1','#2b2f36']]),stroke:'#111','stroke-width':2},svg);
        swl=sv('path',{d:'M'+rcx+' '+(rcy-22)+'A22 22 0 0 1 '+(rcx+19)+' '+(rcy+11),fill:'none',stroke:'#f5c518','stroke-width':4,'stroke-linecap':'round'},svg)}
      else{sv('circle',{cx:rcx,cy:rcy,r:19,fill:HB,stroke:'#2b2f36','stroke-width':2},svg);sv('circle',{cx:rcx,cy:rcy,r:6,fill:'#f5c518'},svg)}
      svg.style.pointerEvents='none';
      var ang=0,spd=0,last=0,lit=null,raf=0,STEP=sty===2?7:9;
      function frame(tm){raf=0;if(!svg.isConnected) return;var dt=last?Math.min(.05,(tm-last)/1000):0;last=tm;var val=S.connected?(rt.o[it.c]||0):(rt.t[it.c]||0);
        spd+=(val-spd)*Math.min(1,dt*2.2);if(Math.abs(spd)<.2&&val===0) spd=0;ang=(ang+spd*dt*14)%360;
        var kk=Math.min(1,Math.abs(spd)/100),dir=spd<0?-1:1;
        copies.forEach(function(g,j){g.setAttribute('transform','rotate('+(ang-j*kk*STEP*dir).toFixed(1)+' '+rcx+' '+rcy+')');g.setAttribute('opacity',j===0?'1':(Math.min(1,Math.abs(spd)/60)*(.42-j*.09)).toFixed(2))});
        if(swl) swl.setAttribute('transform','rotate('+ang.toFixed(1)+' '+rcx+' '+rcy+')');
        if(stk){stk.setAttribute('opacity',(kk*.8).toFixed(2));stk.setAttribute('transform','rotate('+(-ang*.15).toFixed(1)+' '+rcx+' '+rcy+')')}
        rip.forEach(function(c,j){var ph=((tm/1000*(.4+kk*.9))+j/4)%1;c.setAttribute('r',(30+ph*(RR-40)).toFixed(1));c.setAttribute('opacity',(kk*(1-ph)*.6).toFixed(2))});
        var ln=Math.round(Math.abs(val)/100*SEG)*(val<0?-1:1);if(ln!==lit){lit=ln;segs.forEach(function(p,j){var ix=val>=0?j:SEG-1-j,on=ix<Math.abs(ln);p.setAttribute('fill',on?(val<0?PAL.b:col((ix+1)/SEG*100)):OFF)})}
        if(hd){var s3=fmt(Math.round(val));if(hd.textContent!==s3) hd.textContent=s3}
        if(spd!==0||val!==0) raf=requestAnimationFrame(frame);else last=0}
      m.upd=function(){if(!raf) raf=requestAnimationFrame(frame)};
      m.upd();
    }
    return m;
  }
  function meterBuild(el,it){
    var k=it.k, c=it.c, th=MTH[(it.th===1||it.th===2)?it.th:0], i, chs=activeIdx();
    var TXT='var(--fg,#e8e8ea)',MUT='var(--muted,#8a93a0)',TRK='rgba(150,160,175,.32)';
    var box=document.createElement('div');box.className='mtr-box';
    var svg=sv('svg',{'class':'mtr','data-k':k,'preserveAspectRatio':'xMidYMid meet','role':'img','aria-label':'Power meter'},box);
    var m={c:c,k:k,box:box,svg:svg,nch:chs.length};
    function T(at,txt){var e=sv('text',at,svg);if(txt!==undefined) e.textContent=txt;return e}
    function dots(cw,ch){
      if(m.dg) m.dg.remove();
      if(m.nch<2) return;
      m.dg=sv('g',{},svg);
      var sp=Math.min(m.cmp?10:14,(cw-12)/m.nch),rs=Math.min(1,sp/(m.cmp?10:14));
      chs.forEach(function(q,j){sv('circle',{cx:cw/2+(j-(m.nch-1)/2)*sp,cy:ch-(m.cmp?5:7),r:(q===c?(m.cmp?3.5:4.5):(m.cmp?2.4:3))*Math.max(.55,rs),fill:q===c?'var(--danger,#E03E3E)':MUT,opacity:q===c?1:.55},m.dg)});
    }
    if(k==='f'&&it.nd){
      // tachometer: six looks (A-F) sharing one engine. LED ring or smooth arc + needle; colour zones always faintly
      // visible; 0 and 100 labelled at the ring ends; the number never blinks; the peak mark sits on/outside the ring.
      var ow=!!it.ow,AG=ow?mAgF:mAg,LO=ow?0:-100,TV=TACHO[it.tv||0]||TACHO[0];
      m.tg=sv('g',{},svg);m.pk=0;m.pkT=0;m.tv=TV;
      m.hq=[sv('line',{stroke:PAL.b,'stroke-width':2.5,'stroke-linecap':'round',visibility:'hidden'},svg),sv('line',{stroke:PAL.b,'stroke-width':2.5,'stroke-linecap':'round',visibility:'hidden'},svg)];
      m.val=T({'class':'mv','text-anchor':'middle','font-weight':TV.num[2],fill:'#f2f3f5'});
      m.unit=TV.unit?T({'text-anchor':'middle','font-weight':700,fill:MUT,'letter-spacing':'.18em'},TV.unit):null;
      m.sub=T({'text-anchor':'middle','font-weight':700,fill:'#5aa2e6'});
      m.lay=function(cw,ch){
        m.cmp=ch<150;var dh=m.nch>1?(m.cmp?11:16):0,slH=0,R=Math.max(18,Math.min(cw/2-6,(ch-dh-8-slH)/2)),cx=cw/2,cy=slH+4+R+Math.max(0,(ch-dh-8-slH-2*R)/2);m.slH=slH;
        m.cx=cx;m.cy=cy;m.R2=R;m.rr=R*TV.rr;m.ww=R*TV.rw;m.hk='';m.lk='';
        var g=m.tg;while(g.firstChild) g.removeChild(g.firstChild);
        var defs=sv('defs',{},g),uid='t'+(++TACHO.n),RB=R-(TV.bez==='chrome'?6:2);
        function grad(id,st,lin,at){var gg=sv(lin?'linearGradient':'radialGradient',Object.assign({id:uid+id},at||{}),defs);st.forEach(function(x){sv('stop',{offset:x[0],'stop-color':x[1]},gg)});return 'url(#'+uid+id+')'}
        if(TV.bez==='chrome') sv('circle',{cx:cx,cy:cy,r:R,fill:grad('cz',[[0,'#f4f6f9'],[.45,'#7b8291'],[.7,'#2b303a'],[1,'#c4cad3']],true,{x1:0,y1:0,x2:1,y2:1})},g);
        sv('circle',{cx:cx,cy:cy,r:RB,fill:grad('fc',[[0,'#151a21'],[1,'#05070a']],false,{cx:'50%',cy:'42%',r:'62%'}),stroke:TV.bez==='chrome'?'none':'#3a414d','stroke-width':Math.max(1.2,R*.02)},g);
        var rr=RB*TV.rr,rw=RB*TV.rw;m.rr=rr;m.ww=rw;m.RB=RB;
        m.segs=[];m.fill=null;m.smooth=false;
        if(TV.seg){var n=TV.seg===2?(ow?34:30):(ow?27:24),gap=TV.seg===2?1.7:1.3;
          for(var q=0;q<n;q++){var v0=LO+q*(100-LO)/n,v1=LO+(q+1)*(100-LO)/n,md=(v0+v1)/2;m.segs.push([sv('path',{d:mArc(cx,cy,rr,AG(v0)-gap,AG(v1)+gap),fill:'none','stroke-width':rw.toFixed(1),stroke:tzDim(md)},g),md])}}
        else{sv('path',{d:mArc(cx,cy,rr,AG(LO),AG(100)),fill:'none',stroke:'rgba(150,160,175,.14)','stroke-width':rw.toFixed(1),'stroke-linecap':'round'},g);
          var ns=ow?60:80;m.smooth=true;
          for(var q2=0;q2<ns;q2++){var a0=LO+q2*(100-LO)/ns,a1=LO+(q2+1)*(100-LO)/ns;m.segs.push([sv('path',{d:mArc(cx,cy,rr,AG(a0)+.35,AG(a1)-.35),fill:'none','stroke-width':rw.toFixed(1),stroke:'none'},g),(a0+a1)/2])}}
        if(TV.hubArc){var hr=rr-rw/2-RB*.06;sv('path',{d:mArc(cx,cy,hr,AG(LO),AG(100)),fill:'none',stroke:'rgba(55,138,221,.18)','stroke-width':Math.max(2,RB*.035),'stroke-linecap':'round'},g);m.hubA=sv('path',{fill:'none',stroke:PAL.b,'stroke-width':Math.max(2,RB*.035),'stroke-linecap':'round'},g);m.hr=hr}else m.hubA=null;
        var step=TV.minor&&R>=60?5:10,maj=ow?20:50,fsl=Math.max(7,Math.min(12,RB*.105)),ri=rr-rw/2-RB*.04;
        for(var v=LO;v<=100;v+=step){var big=v%maj===0,mid=v%10===0,a=AG(v),p=mPol(cx,cy,ri,a),p2=mPol(cx,cy,ri-RB*(big?.1:mid?.06:.035),a);
          sv('line',{x1:p[0].toFixed(1),y1:p[1].toFixed(1),x2:p2[0].toFixed(1),y2:p2[1].toFixed(1),stroke:big?'#d5d9df':'#5a626e','stroke-width':big?Math.max(1.4,RB*.02):1,'stroke-linecap':'round'},g);
          if(big&&!TV.nolab&&R>=46){var lr=ri-RB*.22,tp=mPol(cx,cy,lr,a);
            sv('text',{x:tp[0].toFixed(1),y:(tp[1]+fsl*.35).toFixed(1),'text-anchor':'middle','font-size':fsl.toFixed(0),'font-weight':600,fill:'#aeb4bd'},g).textContent=String(Math.abs(v))}}
        // shift lights: a row of LEDs above the dial
        m.sl=[];if(slH){var sn=12,sw2=Math.min(R*1.7,cw-24),sr=Math.max(2.4,Math.min(4.5,sw2/sn*.32));for(var si=0;si<sn;si++){var scl=si<6?PAL.g:si<9?PAL.o:PAL.r;m.sl.push([sv('circle',{cx:(cx-sw2/2+(si+.5)*sw2/sn).toFixed(1),cy:(slH/2+1).toFixed(1),r:sr.toFixed(1),fill:'rgba(150,160,175,.16)'},g),scl,(si+1)/sn*100])}}
        // red bezel that pulses above 80
        // gear window: the gear of a Gear widget on the same channel
        m.gw=(C.board||[]).filter(function(x){return (x.k==='g'||x.k==='lv')&&x.c===it.c})[0]||null;m.gb=null;
        if(m.gw&&R>=46){var gs=RB*.22,gx=cx+RB*.5,gy=cy+RB*.64;m.gb=sv('rect',{x:(gx-gs/2).toFixed(1),y:(gy-gs/2).toFixed(1),width:gs.toFixed(1),height:gs.toFixed(1),rx:(gs*.18).toFixed(1),fill:'#0b0d11',stroke:'#ffd84a','stroke-width':1.5},g);
          m.gt=sv('text',{x:gx.toFixed(1),y:(gy+gs*.26).toFixed(1),'text-anchor':'middle','font-size':(gs*.7).toFixed(0),'font-weight':900,fill:'#ffd84a'},g);m.gl=gearsOf(m.gw)}
        m.pkm=TV.peak==='none'?null:TV.peak==='tri'?sv('path',{fill:'#fff',opacity:0},g):TV.peak==='tick'?sv('line',{stroke:'#fff','stroke-width':Math.max(1.6,RB*.025),'stroke-linecap':'round',opacity:0},g):sv('circle',{r:Math.max(1.8,RB*.03),fill:'#fff',opacity:0},g);
        var N=TV.nd,nw=Math.max(1.2,RB*N.w);m.ng=sv('g',{'class':'ndl'},g);
        if(N.from) sv('path',{d:'M'+(cx-nw)+' '+(cy-RB*N.from)+' L'+cx+' '+(cy-RB*N.len)+' L'+(cx+nw)+' '+(cy-RB*N.from)+'Z',fill:N.c},m.ng);
        else{
          if(N.glow) sv('line',{x1:cx,y1:cy+RB*(N.tail||0),x2:cx,y2:cy-RB*N.len,stroke:N.c,'stroke-width':nw*3,opacity:.18,'stroke-linecap':'round'},m.ng);
          sv('path',{d:'M'+(cx-nw)+' '+(cy+RB*(N.tail||0))+' L'+(cx-nw*.35)+' '+(cy-RB*N.len)+' L'+(cx+nw*.35)+' '+(cy-RB*N.len)+' L'+(cx+nw)+' '+(cy+RB*(N.tail||0))+'Z',fill:N.c},m.ng);
          if(N.tip) sv('path',{d:'M'+(cx-nw*.45)+' '+(cy-RB*(N.len-.14))+' L'+(cx-nw*.35)+' '+(cy-RB*N.len)+' L'+(cx+nw*.35)+' '+(cy-RB*N.len)+' L'+(cx+nw*.45)+' '+(cy-RB*(N.len-.14))+'Z',fill:N.tip},m.ng);
          if(N.cw) sv('circle',{cx:cx,cy:cy+RB*(N.tail||.15),r:nw*1.6,fill:N.c},m.ng);
          sv('circle',{cx:cx,cy:cy,r:Math.max(3,RB*.085),fill:grad('hb',[[0,'#6b7280'],[1,'#1b1f26']],false),stroke:N.c,'stroke-width':1.2},g);
        }
        m.ng.style.transformBox='view-box';m.ng.style.transformOrigin=cx+'px '+cy+'px';
        if(TV.glass) sv('path',{d:'M'+(cx-RB*.82)+' '+(cy-RB*.2)+' Q'+cx+' '+(cy-RB*1.18)+' '+(cx+RB*.82)+' '+(cy-RB*.2)+' Q'+cx+' '+(cy-RB*.62)+' '+(cx-RB*.82)+' '+(cy-RB*.2)+'Z',fill:'#fff',opacity:.08,'pointer-events':'none'},g);
        svg.appendChild(m.val);if(m.unit) svg.appendChild(m.unit);svg.appendChild(m.sub);
        var fs=Math.max(9,Math.min(TV.num[0]>.3?40:26,RB*TV.num[0]));m.val.setAttribute('font-size',fs.toFixed(0));m.val.setAttribute('x',cx);m.val.setAttribute('y',(cy+RB*TV.num[1]+(TV.num[0]>.3?fs*.35:0)).toFixed(1));
        var y2=cy+RB*TV.num[1]+(TV.num[0]>.3?fs*.35:0);
        if(m.unit){y2+=Math.max(8,RB*.13);m.unit.setAttribute('x',cx);m.unit.setAttribute('y',y2.toFixed(1));m.unit.setAttribute('font-size',Math.max(6,RB*.085).toFixed(0));m.unit.setAttribute('display',R<56?'none':'inline')}
        y2+=Math.max(9,RB*.13);m.sub.setAttribute('x',cx);m.sub.setAttribute('y',y2.toFixed(1));m.sub.setAttribute('font-size',Math.max(8,Math.min(11,RB*.1)).toFixed(0));m.sub.setAttribute('display',R<50?'none':'inline');
        dots(cw,ch);m.nk='';
      };
    }else if(k==='f'){
      m.seg=[];for(i=0;i<24;i++) m.seg.push(sv('path',{fill:'none',stroke:TRK},svg));
      m.req=sv('path',{fill:'none','stroke-linecap':'round','stroke-width':5,stroke:th[3]},svg);
      m.zt=sv('line',{stroke:TXT,'stroke-width':2.5,'stroke-linecap':'round'},svg);
      // inner blue ring = what the hub receives; arrow + big number + unit; 5-second mini graph underneath
      m.hT=sv('path',{fill:'none',stroke:'rgba(55,138,221,.18)','stroke-linecap':'round'},svg);
      m.hA=sv('path',{fill:'none',stroke:PAL.b,'stroke-linecap':'round'},svg);
      m.arw=T({'text-anchor':'middle',fill:PAL.g});
      m.val=T({'class':'mv','text-anchor':'middle','font-weight':800,fill:TXT});
      m.unit=T({'text-anchor':'middle','font-weight':700,fill:MUT,'letter-spacing':'.18em'},'% POWER');
      m.sub=T({'text-anchor':'middle','font-size':11,'font-weight':800,fill:'#5aa2e6'});
      m.spB=sv('rect',{rx:4,fill:'rgba(0,0,0,.28)'},svg);
      m.sp=sv('polyline',{fill:'none',stroke:'#ffd84a','stroke-width':1.8,'stroke-linejoin':'round','stroke-linecap':'round'},svg);
      m.hs=[];m.hsT=0;
      m.lay=function(cw,ch){
        m.cmp=ch<112;
        var dh=m.nch>1?(m.cmp?12:18):0, R2=Math.max(16,Math.min((cw-12)/2,(ch-dh-7)/(m.cmp?1.68:1.9)));
        var w=Math.max(5,R2*.16), r=R2-w/2-1, total=(m.cmp?1.707:1.88)*R2+w/2+1, y0=Math.max(1,(ch-dh-total)/2), cx=cw/2, cy=y0+R2+1;
        m.cx=cx;m.cy=cy;m.R2=R2;m.rr=r;m.ww=w;m.hk='';
        for(var j=0;j<24;j++){m.seg[j].setAttribute('d',mArc(cx,cy,r,mAg(-100+j*200/24)-.8,mAg(-100+(j+1)*200/24)+.8));m.seg[j].setAttribute('stroke-width',w.toFixed(1))}
        m.zt.setAttribute('x1',cx);m.zt.setAttribute('x2',cx);m.zt.setAttribute('y1',cy-R2-1);m.zt.setAttribute('y2',cy-r+w/2);m.zt.setAttribute('display',it.ow?'none':'inline');
        var hw=Math.max(2.5,R2*.05),hr=r-w/2-hw/2-Math.max(3,R2*.05);m.hr=hr;
        [m.hT,m.hA].forEach(function(p){p.setAttribute('stroke-width',hw.toFixed(1))});m.hT.setAttribute('d',mArc(cx,cy,hr,mAg(-100),mAg(100)));m.hk2='';
        var big=R2>=40,fs=Math.max(8,Math.min(64,big?hr*.62:r*.55,(hr-hw)*2*.86/2.4));
        m.val.setAttribute('font-size',fs.toFixed(0));m.val.setAttribute('x',cx);m.val.setAttribute('y',(cy+fs*.32).toFixed(1));
        m.arw.setAttribute('display',big?'inline':'none');m.arw.setAttribute('font-size',(fs*.36).toFixed(0));m.arw.setAttribute('x',cx);m.arw.setAttribute('y',(cy-fs*.52).toFixed(1));
        m.unit.setAttribute('display',big?'inline':'none');m.unit.setAttribute('font-size',Math.max(7,fs*.2).toFixed(0));m.unit.setAttribute('x',cx);m.unit.setAttribute('y',(cy+fs*.32+Math.max(9,fs*.34)).toFixed(1));
        m.sub.setAttribute('display',R2<28?'none':'inline');m.sub.setAttribute('x',cx);m.sub.setAttribute('y',(cy+fs*.32+(big?Math.max(9,fs*.34)+13:15)).toFixed(1));
        // 5-second mini graph under the gauge: shown whenever it fits (also on the sideways board, where cards are short)
        m.spX=cx-R2*.42;m.spW=R2*.84;m.spY=cy+R2*.86;m.spH=R2*.2;
        var spOn=R2>=30&&m.spY+3<=ch-dh;m.spOn=spOn;
        m.spB.setAttribute('display',spOn?'inline':'none');m.sp.setAttribute('display',spOn?'inline':'none');
        m.spB.setAttribute('x',(m.spX-4).toFixed(1));m.spB.setAttribute('y',(m.spY-m.spH-3).toFixed(1));m.spB.setAttribute('width',(m.spW+8).toFixed(1));m.spB.setAttribute('height',(m.spH+6).toFixed(1));
        dots(cw,ch);m.rd='';
      };
    }else if(k==='i'){
      m.seg=[];for(i=0;i<20;i++) m.seg.push(sv('rect',{rx:1.5,fill:TRK},svg));
      m.rq=sv('rect',{rx:2,width:4,fill:th[3],visibility:'hidden'},svg);
      m.mid=sv('line',{stroke:TXT,'stroke-width':1.5},svg);
      m.lt=T({'text-anchor':'end','font-size':11,fill:MUT},it.ow?'100':'+100');
      m.lm=T({'text-anchor':'end','font-size':11,fill:MUT},it.ow?'50':'0');
      m.lb=T({'text-anchor':'end','font-size':11,fill:MUT},it.ow?'0':'-100');
      m.val=T({'class':'mv','text-anchor':'middle','font-size':15,'font-weight':700,fill:TXT});
      svg.removeChild(m.val); // the LED meter shows its value as small yellow text in the card header instead
      // LED shape: 0 square, 1 round, 2 thin line
      var segShape=function(r,x,y,w,h){var ls=it.ls||0,d;
        if(ls===1){d=Math.max(2,Math.min(w,h));x+=(w-d)/2;y+=(h-d)/2;w=h=d;r.setAttribute('rx',(d/2).toFixed(1))}
        else if(ls===2){if(it.hz){var th2=Math.max(2,h*.3);y+=(h-th2)/2;h=th2;r.setAttribute('rx',(th2/2).toFixed(1))}else{var tw=Math.max(3,w*.3);x+=(w-tw)/2;w=tw;r.setAttribute('rx',(tw/2).toFixed(1))}}
        else r.setAttribute('rx','1.5');
        r.setAttribute('x',x.toFixed(1));r.setAttribute('y',y.toFixed(1));r.setAttribute('width',Math.max(1,w).toFixed(1));r.setAttribute('height',Math.max(1,h).toFixed(1))};
      m.lay=function(cw,ch){
        if(it.hz){
          // The bar fills the card. The scale goes underneath when there is room, otherwise it is left out.
          var hdh=m.nch>1?16:0, avail=ch-hdh, hbL=14, hR=cw-14, hbw=Math.max(40,hR-hbL), noLab=avail<30, hty, hbh, hly=0;
          if(noLab){hbh=Math.max(6,avail-4);hty=Math.max(1,(avail-hbh)/2)}
          else{hty=4;hly=avail-2;hbh=Math.max(10,hly-12-hty)}
          var hsw=hbw/20, hcx=hbL+hbw/2;
          m.hzOn=true;m.bx0=hbL;m.bw=hbw;m.by0=hty;m.bh=hbh;m.hk='';
          m.seg.forEach(function(r,j){segShape(r,hbL+j*hsw,hty,Math.max(2,hsw-2),hbh)});
          m.mid.setAttribute('display',it.ow?'none':'inline');m.mid.setAttribute('x1',hcx);m.mid.setAttribute('x2',hcx);m.mid.setAttribute('y1',hty-2);m.mid.setAttribute('y2',hty+hbh+2);
          [m.lb,m.lm,m.lt].forEach(function(q){q.setAttribute('display',noLab?'none':'inline')});
          m.lb.setAttribute('text-anchor','start');m.lb.setAttribute('x',hbL);m.lb.setAttribute('y',hly);
          m.lm.setAttribute('text-anchor','middle');m.lm.setAttribute('x',hcx);m.lm.setAttribute('y',hly);
          m.lt.setAttribute('text-anchor','end');m.lt.setAttribute('x',hR);m.lt.setAttribute('y',hly);
          m.rq.setAttribute('x',-9999);dots(cw,ch);return;
        }
        m.hzOn=false;[m.lb,m.lm,m.lt].forEach(function(q){q.setAttribute('display','inline')});m.lt.setAttribute('text-anchor','end');m.lm.setAttribute('text-anchor','end');m.lb.setAttribute('text-anchor','end');
        var dh=m.nch>1?16:0, top=6, bot=Math.max(top+60,ch-dh-4), x0=36, colw=Math.max(24,cw-x0-12);
        var sh=(bot-top)/20, md=(top+bot)/2;m.md=md;m.half=(bot-top)/2;m.cx0=x0+colw+4;m.x0=x0;m.cw=colw;m.top=top;m.bot=bot;m.hk='';
        m.seg.forEach(function(r,j){segShape(r,x0,top+j*sh,colw,Math.max(2,sh-2))});
        m.mid.setAttribute('display',it.ow?'none':'inline');m.mid.setAttribute('x1',x0-5);m.mid.setAttribute('x2',x0+colw+5);m.mid.setAttribute('y1',md);m.mid.setAttribute('y2',md);
        m.lt.setAttribute('x',x0-8);m.lt.setAttribute('y',top+10);m.lm.setAttribute('x',x0-8);m.lm.setAttribute('y',md+4);m.lb.setAttribute('x',x0-8);m.lb.setAttribute('y',bot-2);
        m.rq.setAttribute('x',m.cx0);dots(cw,ch);
      };
    }else{
      var id='mc'+(++MSEQ), df=sv('defs',{},svg);
      m.cu=sv('rect',{},sv('clipPath',{id:id+'u'},df));
      m.cd=sv('rect',{},sv('clipPath',{id:id+'d'},df));
      m.hl=[];m.vl=[];
      for(i=0;i<=4;i++) m.hl.push(sv('line',{stroke:TRK,'stroke-width':.5},svg));
      for(i=0;i<=9;i++) m.vl.push(sv('line',{stroke:TRK,'stroke-width':.5},svg));
      m.zl=sv('line',{stroke:MUT,'stroke-width':1.5},svg);
      m.up=sv('polyline',{fill:'none',stroke:PAL.g,'stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round','clip-path':'url(#'+id+'u)'},svg);
      m.dn=sv('polyline',{fill:'none',stroke:'#D85A30','stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round','clip-path':'url(#'+id+'d)'},svg);
      m.dot=sv('circle',{r:4.5,fill:PAL.g},svg);
      m.xl=(it.cs||[]).map(function(q,j){var pl=sv('polyline',{fill:'none',stroke:KCOL[j],'stroke-width':2.4,'stroke-linejoin':'round','stroke-linecap':'round'},svg);svg.insertBefore(pl,m.up);return pl});
      m.cur=sv('line',{stroke:TXT,'stroke-width':1.2,'stroke-dasharray':'3 3',visibility:'hidden'},svg);
      m.curT=T({'font-size':11,'font-weight':700,fill:TXT,visibility:'hidden'});m.curX=-1;
      m.t1=T({'font-size':11,fill:MUT},'+100');m.t2=T({'font-size':11,fill:MUT},'-100');m.t3=T({'text-anchor':'end','font-size':11,fill:MUT},'10 s');
      m.tl=sv('line',{stroke:'#BA7517','stroke-width':1.5,'stroke-dasharray':'5 4',visibility:'hidden'},svg);
      m.tt=T({'font-size':11,fill:'#BA7517',visibility:'hidden'});
      m.b1=sv('line',{stroke:TXT,'stroke-width':1.5,visibility:'hidden'},svg);m.b2=sv('line',{stroke:TXT,'stroke-width':1.5,visibility:'hidden'},svg);
      m.bl=sv('line',{stroke:PAL.b,'stroke-width':1.5,visibility:'hidden'},svg);m.bt=T({'text-anchor':'middle','font-size':11,fill:PAL.b,visibility:'hidden'});
      m.val=T({'class':'mv','text-anchor':'middle','font-size':15,'font-weight':700,fill:TXT});
      m.n=Math.max(10,Math.min(60,+it.ws||10))*10;m.pause=false;m.endAbs=0;m.PW=180;m.PL=10;m.md=56;m.sc=.4;
      m.lay=function(cw,ch){
        var L=10,Rr=10,t=18,bt=Math.max(t+30,ch-34),md=(t+bt)/2;
        m.bt0=t;m.PL=L;m.PW=cw-L-Rr;m.md=md;m.sc=(bt-t)/2/100;m.bb=bt;
        m.cu.setAttribute('x',L);m.cu.setAttribute('y',t);m.cu.setAttribute('width',m.PW);m.cu.setAttribute('height',md-t+.2);
        m.cd.setAttribute('x',L);m.cd.setAttribute('y',md+1.6);m.cd.setAttribute('width',m.PW);m.cd.setAttribute('height',bt-md-.6);
        m.hl.forEach(function(l,j){var y=t+j*(bt-t)/4;l.setAttribute('x1',L);l.setAttribute('x2',cw-Rr);l.setAttribute('y1',y);l.setAttribute('y2',y)});
        m.vl.forEach(function(l,j){var x=L+j*m.PW/9;l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',t);l.setAttribute('y2',bt)});
        m.zl.setAttribute('x1',L);m.zl.setAttribute('x2',cw-Rr);m.zl.setAttribute('y1',md);m.zl.setAttribute('y2',md);
        m.t1.setAttribute('x',L);m.t1.setAttribute('y',t-5);m.t2.setAttribute('x',L);m.t2.setAttribute('y',bt+14);
        m.t3.setAttribute('x',cw-Rr);m.t3.setAttribute('y',bt+14);
        m.val.setAttribute('x',cw/2);m.val.setAttribute('y',ch-6);m.dot.setAttribute('cx',cw-Rr);m.ps='';
      };
    }
    el.appendChild(box);
    if(k==='k'){
      var bar=document.createElement('div');bar.className='mtr-ctl';
      var ICO={
        back:'<path d="M12 2.5 4 8l8 5.5z"/>',
        rec:'<circle cx="8" cy="8" r="5.5" fill="#E24B4A"/>',
        stop:'<rect x="3" y="3" width="10" height="10" rx="1.5"/>',
        pause:'<rect x="3.5" y="2.5" width="3.3" height="11" rx="1"/><rect x="9.2" y="2.5" width="3.3" height="11" rx="1"/>',
        play:'<path d="M4 2.5 12 8l-8 5.5z"/>'};
      var mk=function(ic,lbl,fn){var b=document.createElement('button');b.type='button';b.className='btn';b.innerHTML='<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">'+ICO[ic]+'</svg>';b.setAttribute('aria-label',lbl);b.addEventListener('click',function(e){e.preventDefault();fn();m.upd()});bar.appendChild(b);return b};
      var cnt=function(){return HCNT[c]||0},first=function(){return cnt()-(HIST[c]||[]).length};
      var step=function(d){var n=m.n;if(!m.pause){m.pause=true;m.endAbs=cnt()}m.endAbs=Math.max(first()+Math.min(n,(HIST[c]||[]).length),Math.min(cnt(),m.endAbs+d*Math.round(n/2)));if(d>0&&m.endAbs>=cnt()) m.pause=false};
      mk('back','Back in time',function(){step(-1)});
      m.br=mk('rec','Record up to 60 s',function(){HIST[c]=[];RX[c]={};RECS[c]='rec';m.pause=false});
      mk('stop','Stop',function(){var st=RECS[c]||'live';if(st==='rec'){RECS[c]='done';m.pause=true;m.endAbs=cnt()}else{HIST[c]=[];RX[c]={};RECS[c]='live';m.pause=false}});
      m.bp=mk('pause','Pause',function(){if(m.pause){m.pause=false}else{m.pause=true;m.endAbs=cnt()}});
      mk('play','Forward or live',function(){if(m.pause) step(1)});
      el.appendChild(bar);
      // tap the graph to pause it; touch or drag on a paused graph to read the exact values
      svg.style.touchAction='pan-y';
      var kx=function(e){var r=svg.getBoundingClientRect();return (e.clientX-r.left)/r.width*(m.PL*2+m.PW)};
      var kdown=false;
      svg.addEventListener('pointerdown',function(e){if(bdEditing) return;kdown=true;if(!m.pause){m.pause=true;m.endAbs=cnt()}m.curX=kx(e);m.upd()});
      svg.addEventListener('pointermove',function(e){if(!kdown||!m.pause) return;m.curX=kx(e);m.upd()});
      ['pointerup','pointercancel','pointerleave'].forEach(function(ev){svg.addEventListener(ev,function(){kdown=false})});
    }else if((k==='f'||k==='i')&&m.nch>1){
      var sx=null,sy=0;svg.style.touchAction='pan-y';
      svg.addEventListener('pointerdown',function(e){if(bdEditing) return;sx=e.clientX;sy=e.clientY});
      svg.addEventListener('pointerup',function(e){
        if(sx===null) return;var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
        if(Math.abs(dx)>36&&Math.abs(dx)>1.6*Math.abs(dy)){var q=chs.indexOf(c);it.c=chs[(q+(dx<0?1:chs.length-1))%chs.length];save();syncBoard();feedback('ok')}
      });
      svg.addEventListener('pointercancel',function(){sx=null});
    }
    m.upd=function(){
      var bs=boxSize(box),cw=bs[0],ch=bs[1];if(!cw||!ch) return;
      if(m.dim!==cw+'x'+ch){m.dim=cw+'x'+ch;svg.setAttribute('viewBox','0 0 '+cw+' '+ch);m.lay(cw,ch)}
      var j,v;
      if(k==='k'){
        v=rt.t[c]||0;if(!isFinite(v)) v=0;
        var h=HIST[c]||[], n=m.n, pts=[], PL=m.PL, PW=m.PW, md=m.md, sc=m.sc, tot=HCNT[c]||0, off=m.pause?Math.max(0,tot-m.endAbs):0;
        if(m.pause&&h.length>=n&&m.endAbs<tot-h.length+n){m.endAbs=tot-h.length+n;off=tot-m.endAbs}
        for(j=0;j<n;j++){var hi=h.length-off-n+j,hv=hi>=0&&hi<h.length?h[hi]:0;pts.push((PL+j*PW/(n-1)).toFixed(1)+','+(md-hv*sc).toFixed(1))}
        var last=h.length-off-1;v=(last>=0&&last<h.length)?h[last]:v;
        var xlive=(RECS[c]||'live')==='live';
        (it.cs||[]).forEach(function(xc,xj){
          var ln=m.xl[xj];if(!ln) return;
          var xh=xlive?(HIST[xc]||[]):((RX[c]||{})[xc]||[]),xp=[];
          for(var q=0;q<n;q++){var xi=xh.length-off-n+q,xv=xi>=0&&xi<xh.length?xh[xi]:0;xp.push((PL+q*PW/(n-1)).toFixed(1)+','+(md-xv*sc).toFixed(1))}
          ln.setAttribute('points',xp.join(' '));ln.setAttribute('visibility','visible');
        });
        if(m.curX>=0&&m.pause){
          var cq=Math.max(0,Math.min(n-1,Math.round((m.curX-PL)/PW*(n-1)))),cx2=PL+cq*PW/(n-1),back=(n-1-cq+off)/10;
          var pick=function(ch){var hh2=(ch===c||xlive)?(HIST[ch]||[]):((RX[c]||{})[ch]||[]),ii=hh2.length-off-n+cq;return ii>=0&&ii<hh2.length?Math.round(hh2[ii]):0};
          var parts=[tagOf(c)+' '+mSgn(pick(c))];(it.cs||[]).forEach(function(xc){parts.push(tagOf(xc)+' '+mSgn(pick(xc)))});
          m.cur.setAttribute('x1',cx2);m.cur.setAttribute('x2',cx2);m.cur.setAttribute('y1',m.bt0);m.cur.setAttribute('y2',m.bb);m.cur.setAttribute('visibility','visible');
          var ctx='\u2212'+back.toFixed(1)+' s \u00b7 '+parts.join(' \u00b7 ');if(m.curT.textContent!==ctx) m.curT.textContent=ctx;
          var right=cx2>PL+PW/2;m.curT.setAttribute('text-anchor',right?'end':'start');m.curT.setAttribute('x',(cx2+(right?-6:6)).toFixed(1));m.curT.setAttribute('y',(m.bt0+12).toFixed(1));m.curT.setAttribute('visibility','visible');
        }else{m.cur.setAttribute('visibility','hidden');m.curT.setAttribute('visibility','hidden');if(!m.pause) m.curX=-1}
        var ps=pts.join(' ');
        if(m.ps!==ps){m.ps=ps;m.up.setAttribute('points',ps);m.dn.setAttribute('points',ps)}
        m.dot.setAttribute('cy',(md-v*sc).toFixed(1));m.dot.setAttribute('fill',v<0?'#D85A30':PAL.g);
        var rl=null;if(!S.estop){if(it.k==='k'){if(it.tg){var tv0=(it.tv===undefined?80:it.tv);rl={to:tv0,man:1,d:0,s:0}}}else rl=RAMPLAST[c]}
        if(rl){
          var ty=md-rl.to*sc,a0=tot-off-n,xa=function(a){return PL+(a-a0)*PW/(n-1)},wend=tot-off;
          m.tl.setAttribute('x1',PL);m.tl.setAttribute('x2',PL+PW);m.tl.setAttribute('y1',ty);m.tl.setAttribute('y2',ty);
          m.tt.setAttribute('y',(ty+((rl.to>=0&&ty>m.bt0+16)?-5:13)).toFixed(1));m.tt.setAttribute('x',PL+PW-4);m.tt.setAttribute('text-anchor','end');m.tt.textContent='Target '+mSgn(rl.to);
          m.tl.setAttribute('visibility','visible');m.tt.setAttribute('visibility','visible');
          var sa=rl.s,ea=rl.s+Math.round(rl.d*10),by=m.bb-7;
          if(!rl.man&&ea>=a0&&sa<=wend){
            var xs=xa(Math.max(sa,a0)),xe=xa(Math.min(ea,wend));
            m.bl.setAttribute('x1',xs);m.bl.setAttribute('x2',xe);m.bl.setAttribute('y1',by);m.bl.setAttribute('y2',by);
            if(sa>=a0){m.b1.setAttribute('x1',xs);m.b1.setAttribute('x2',xs);m.b1.setAttribute('y1',by-5);m.b1.setAttribute('y2',by+5);m.b1.setAttribute('visibility','visible')}else m.b1.setAttribute('visibility','hidden');
            if(ea<=wend){m.b2.setAttribute('x1',xe);m.b2.setAttribute('x2',xe);m.b2.setAttribute('y1',by-5);m.b2.setAttribute('y2',by+5);m.b2.setAttribute('visibility','visible')}else m.b2.setAttribute('visibility','hidden');
            m.bt.setAttribute('x',(xs+xe)/2);m.bt.setAttribute('y',by-6);m.bt.textContent=rl.d.toFixed(1)+' s';
            m.bl.setAttribute('visibility','visible');m.bt.setAttribute('visibility','visible');
          }else{m.bl.setAttribute('visibility','hidden');m.bt.setAttribute('visibility','hidden');m.b1.setAttribute('visibility','hidden');m.b2.setAttribute('visibility','hidden')}
        }else{[m.tl,m.tt,m.b1,m.b2,m.bl,m.bt].forEach(function(e){e.setAttribute('visibility','hidden')})}
        var rst=RECS[c]||'live', tl;
        if(rst==='rec') tl='● REC '+(h.length/10).toFixed(1)+' / 60 s';
        else if(rst==='done') tl='■ '+(h.length/10).toFixed(1)+' s'+(m.pause&&off>0?' · −'+(off/10).toFixed(1)+' s':'');
        else tl=m.pause?('❚❚ −'+(off/10).toFixed(1)+' s'):(n/10)+' s';
        if(m.t3.textContent!==tl) m.t3.textContent=tl;
        m.t3.setAttribute('fill',rst==='rec'?PAL.r:MUT);
        var tx=mSgn(v)+'%';if(it.cs&&it.cs.length) tx=tagOf(c)+' '+tx+' \u00b7 '+it.cs.map(function(xc){return tagOf(xc)+' '+mSgn(Math.round(crzT(xc)||0))+'%'}).join(' \u00b7 ');if(m.val.textContent!==tx) m.val.textContent=tx;
        if(m.bp) m.bp.setAttribute('aria-pressed',String(!!m.pause));
        if(m.br) m.br.setAttribute('aria-pressed',String(rst==='rec'));
        return;
      }
      var rq=rt.t[c]||0;if(!isFinite(rq)) rq=0;
      var hub=Math.round(goalOf(c));if(!isFinite(hub)) hub=0;
      var out=it.sh?hub:rq, oth=it.sh?rq:hub;
      var zn=Math.abs(out)>80?2:(Math.abs(out)>55?1:0);
      if(m.lz!==undefined&&zn===2&&m.lz<2&&!bdEditing) dialBuzz();
      m.lz=zn;
      var diff=Math.abs(rq-hub)>=2;
      // tick(s) on the scale at the hub's limit
      var hlim=Math.round(hubMax(c)),hkey=hlim+'|'+(it.sh?1:0)+(it.ow?1:0);
      if(m.hk!==hkey&&m.hq){
        m.hk=hkey;var hon=hlim<99&&!it.sh,hv=it.ow?[hlim]:[hlim,-hlim];
        m.hq.forEach(function(ln,qi){
          if(!hon||qi>=hv.length){ln.setAttribute('visibility','hidden');return}
          if(k==='f'){
            var ha=it.ow?mAgF(hv[qi]):mAg(hv[qi]),p0=mPol(m.cx,m.cy,m.rr-m.ww/2-2,ha),p1=mPol(m.cx,m.cy,m.rr+m.ww/2+3,ha);
            ln.setAttribute('x1',p0[0].toFixed(1));ln.setAttribute('y1',p0[1].toFixed(1));ln.setAttribute('x2',p1[0].toFixed(1));ln.setAttribute('y2',p1[1].toFixed(1));
          }else if(m.hzOn){
            var hx=it.ow?m.bx0+hv[qi]/100*m.bw:m.bx0+m.bw/2+hv[qi]/100*m.bw/2;
            ln.setAttribute('x1',hx.toFixed(1));ln.setAttribute('x2',hx.toFixed(1));ln.setAttribute('y1',(m.by0-2).toFixed(1));ln.setAttribute('y2',(m.by0+m.bh+2).toFixed(1));
          }else{
            var hy=it.ow?m.bot-hv[qi]/100*(m.bot-m.top):m.md-hv[qi]/100*m.half;
            ln.setAttribute('x1',(m.x0-3).toFixed(1));ln.setAttribute('x2',(m.x0+m.cw+3).toFixed(1));ln.setAttribute('y1',hy.toFixed(1));ln.setAttribute('y2',hy.toFixed(1));
          }
          ln.setAttribute('visibility','visible');
        });
      }
      if(k==='f'&&it.nd){
        if(it.ow){out=Math.max(0,out);oth=Math.max(0,oth)}
        var nv=Math.max(-100,Math.min(100,out)),AGu=it.ow?mAgF:mAg,TVu=m.tv,nnow=performance.now();
        // start sweep: when the hub connects, the needle and lights sweep to 100 and back
        if(S.connected&&!m.wasC) m.swT=nnow;m.wasC=!!S.connected;
        if(m.swT){var se=(nnow-m.swT)/1000;if(se<1.4){nv=se<.6?se/.6*100:100*(1-(se-.6)/.8)}else m.swT=0}
        var nk=String(Math.round(nv));
        if(m.nk!==nk){m.nk=nk;m.ng.style.transform='rotate('+(90-AGu(nv)).toFixed(1)+'deg)'}
        var ntx=TVu.unit==='%'||TVu.num[0]>.3?(it.ow?String(Math.round(out)):mSgn(out)):(it.ow?String(Math.round(out)):mSgn(out))+'%';if(m.val.textContent!==ntx) m.val.textContent=ntx;
        m.val.setAttribute('fill',Math.abs(out)>80?'#ff6b6a':'#f2f3f5');
        
        if(m.sl.length){var an=Math.abs(nv),fl=an>95&&Math.floor(nnow/110)%2;m.sl.forEach(function(q){var on=an>=q[2]-4,cl=on?(fl?'#ffffff':q[1]):'rgba(150,160,175,.16)';if(q[0].getAttribute('fill')!==cl){q[0].setAttribute('fill',cl);q[0].style.filter=on?'drop-shadow(0 0 3px '+q[1]+')':''}})}
        if(m.gb){var tv0=Math.round(rt.t[it.c]||0),bi=-1,bd=1e9;m.gl.forEach(function(gd,j){var d=Math.abs(wOut(m.gw,gd[1])-tv0);if(d<bd){bd=d;bi=j}});var gtx=bd<=12&&bi>=0?String(m.gl[bi][0]):'\u2013';if(m.gt.textContent!==gtx) m.gt.textContent=gtx}
        var hot=TVu.pulse&&Math.abs(nv)>80,lk=Math.round(nv/2)+(hot?'p'+Math.floor(nnow/120)%6:'');
        if(m.lk!==lk){m.lk=lk;
          m.segs.forEach(function(q){var md=q[1],on=nv>=0?(md>=0&&md<=nv+.01):(md<=0&&md>=nv),cl=m.smooth?tzSmooth(md):tzCol(md);
            q[0].setAttribute('stroke',on?cl:(m.smooth?'none':tzDim(md)));q[0].style.filter=on&&!m.smooth?'drop-shadow(0 0 2px '+cl+')':'';
            q[0].setAttribute('opacity',on&&hot&&Math.abs(md)>80?(.55+.45*Math.sin(nnow/90)).toFixed(2):1)});
          if(m.fill) m.fill.setAttribute('d',Math.abs(nv)<.5?'':mArc(m.cx,m.cy,m.rr,AGu(0),AGu(nv)));
        }
        if(m.hubA){var hv=Math.max(-100,Math.min(100,it.sh?out:(diff?oth:out)));if(it.ow) hv=Math.max(0,hv);m.hubA.setAttribute('d',Math.abs(hv)<.5?'':mArc(m.cx,m.cy,m.hr,AGu(0),AGu(hv)))}
        if(Math.abs(nv)>=Math.abs(m.pk)||nnow-m.pkT>3000){m.pk=nv;m.pkT=nnow}
        var pa=AGu(m.pk),pon=Math.abs(m.pk)>2;if(m.pkm){
        if(TVu.peak==='tri'){var r0=m.rr+m.ww/2+m.RB*.03,pp=mPol(m.cx,m.cy,r0,pa),pl=mPol(m.cx,m.cy,r0+m.RB*.08,pa+3.5),pr=mPol(m.cx,m.cy,r0+m.RB*.08,pa-3.5);m.pkm.setAttribute('d','M'+pp[0].toFixed(1)+' '+pp[1].toFixed(1)+'L'+pl[0].toFixed(1)+' '+pl[1].toFixed(1)+'L'+pr[0].toFixed(1)+' '+pr[1].toFixed(1)+'Z')}
        else if(TVu.peak==='tick'){var t1=mPol(m.cx,m.cy,m.rr+m.ww/2+m.RB*.02,pa),t2=mPol(m.cx,m.cy,m.rr-m.ww/2-m.RB*.02,pa);m.pkm.setAttribute('x1',t1[0].toFixed(1));m.pkm.setAttribute('y1',t1[1].toFixed(1));m.pkm.setAttribute('x2',t2[0].toFixed(1));m.pkm.setAttribute('y2',t2[1].toFixed(1))}
        else{var d2=mPol(m.cx,m.cy,m.rr+m.ww/2+m.RB*.06,pa);m.pkm.setAttribute('cx',d2[0].toFixed(1));m.pkm.setAttribute('cy',d2[1].toFixed(1))}
        m.pkm.setAttribute('opacity',pon?.9:0);}
        var nsb=MUTE[c]?tr2('muted'):diff?((it.sh?'of ':'hub ')+(oth<0?'−':'')+Math.abs(Math.round(oth))):'';if(m.sub.textContent!==nsb) m.sub.textContent=nsb;
      }else if(k==='f'){
        if(it.ow){out=Math.max(0,out);oth=Math.max(0,oth)}
        var tx2=m.R2>=40?String(Math.abs(Math.round(out))):(it.ow?String(Math.round(out)):mSgn(out));if(m.val.textContent!==tx2) m.val.textContent=tx2;
        m.val.setAttribute('fill',Math.abs(out)>80?'#ff6b6a':TXT);
        var aw=out>2?'\u25B2':out<-2?'\u25BC':'\u25CF';if(m.arw.textContent!==aw){m.arw.textContent=aw;m.arw.setAttribute('fill',out<-2?PAL.b:out>2?PAL.g:'#5a626e')}
        var sb=MUTE[c]?tr2('muted'):diff?((it.sh?'of ':'hub ')+(oth<0?'\u2212':'')+Math.abs(Math.round(oth))):(m.R2>=40?'':'%');if(m.sub.textContent!==sb) m.sub.textContent=sb;
        var hv=Math.round(it.sh?out:(diff?oth:out)),hk2=String(hv);
        if(m.hk2!==hk2){m.hk2=hk2;var hc=Math.max(-100,Math.min(100,hv));m.hA.setAttribute('d',Math.abs(hv)<1?'':(it.ow?mArc(m.cx,m.cy,m.hr,mAg(-100),mAg(-100+2*Math.max(0,hc))):mArc(m.cx,m.cy,m.hr,mAg(0),mAg(hc))))}
        var nw=performance.now();if(nw-m.hsT>=100){m.hsT=nw;m.hs.push(out);if(m.hs.length>50) m.hs.shift();
          if(m.spOn){var pts=[];for(var q=0;q<m.hs.length;q++) pts.push((m.spX+(50-m.hs.length+q)*m.spW/49).toFixed(1)+','+(m.spY-Math.min(100,Math.abs(m.hs[q]))/100*m.spH).toFixed(1));m.sp.setAttribute('points',pts.join(' '))}}
        for(j=0;j<24;j++){var vc=it.ow?(j+.5)*100/24:-100+(j+.5)*200/24,on=it.ow?(out>0&&vc<=out):((vc>0&&vc<=out)||(vc<0&&vc>=out));var col=on?mCol(vc,th):TRK;if(m.seg[j].getAttribute('stroke')!==col) m.seg[j].setAttribute('stroke',col)}
        var rd='';if(m.rd!==rd){m.rd=rd;m.req.setAttribute('d',rd)}
      }else{
        if(it.ow){out=Math.max(0,out);oth=Math.max(0,oth)}
        var tx3=it.ow?String(Math.round(out)):mSgn(out);if(m.hd&&m.hd.textContent!==tx3) m.hd.textContent=tx3;
        for(j=0;j<20;j++){var vv=it.hz?(it.ow?(j+.5)*5:-100+(j+.5)*10):(it.ow?100-(j+.5)*5:100-(j+.5)*10),on2=it.ow?(out>0&&vv<=out):((vv>0&&vv<=out)||(vv<0&&vv>=out));var cl=on2?(vv<0?th[3]:mCol(vv,th)):TRK;if(m.seg[j].getAttribute('fill')!==cl) m.seg[j].setAttribute('fill',cl)}
        m.rq.setAttribute('visibility','hidden');
      }
    };
    return m;
  }
  function dirRow(el,w,it,act){
    var row=document.createElement('div');row.className='tgdir';
    var bs=[];
    [['Reverse',-1,'\u25C0'],['Stop',0,'\u25A0'],['Forward',1,'\u25B6']].forEach(function(d){
      var b=document.createElement('button');b.type='button';b.className='tgd';b.setAttribute('data-d',String(d[1]));
      var ic=document.createElement('i');ic.textContent=d[2];ic.setAttribute('aria-hidden','true');
      var tx=document.createElement('span');tx.textContent=d[0];b.appendChild(ic);b.appendChild(tx);
      b.addEventListener('click',function(){noteInput();if(S.estop||S.play) return;act(d[1])});
      row.appendChild(b);bs.push(b);
    });
    el.appendChild(row);return bs;
  }
  function gearsOf(it){
    var f=(it.gf&&it.gf.length)?it.gf:[35,65,100], l=[['R',it.gr===undefined?-50:it.gr],['N',0]];
    f.forEach(function(v,i){l.push([String(i+1),v])});
    return l;
  }
  // Short vibration for each 5% step of a dial (follows the Vibration setting)
  var DBZ=0;
  function dialBuzz(){
    if(!store.prefs.haptic) return;
    var nw=Date.now();if(nw-DBZ<45) return;DBZ=nw;
    if(NB&&NB.haptic){try{NB.haptic('dial')}catch(e){}}
    else if(navigator.vibrate){try{navigator.vibrate(15)}catch(e){}}
  }
  function wOut(it,v){return Math.round((it.inv?-v:v)*(it.cap||100)/100)}
  function wIn(it,t){return Math.max(-100,Math.min(100,Math.round((it.inv?-t:t)*100/(it.cap||100))))}
  var F_INV={k:'inv',l:'Reverse direction',ch:[0,1],lab:['Off','On'],only:true,def:0};
  var F_SH={k:'sh',l:'Main value',ch:[0,1],lab:['Widget','Hub output'],only:true,def:0};
  var F_TH={k:'th',l:'Colour theme',ch:[0,1,2],lab:['Default','Blue-orange','Mono'],only:true,def:0};
  // Also drive a second channel of the same hub with the same value (or the opposite one, for a tank turn)
  var F_PC={k:'pc',l:'Also drive channel (same hub)',ch:[-1,0,1,2,3,4,5],lab:['Off','A','B','C','D','E','F'],only:true,def:-1,g:function(it){return it.pc===undefined?-1:it.pc%PER},s:function(it,v){if(v<0||v===it.c%PER){delete it.pc;delete it.pi}else it.pc=Math.floor(it.c/PER)*PER+v}};
  var F_PI={k:'pi',l:'Second channel direction',ch:[0,1],lab:['Same','Opposite'],only:true,def:0,g:function(it){return it.pi?1:0},s:function(it,v){if(v&&it.pc!==undefined) it.pi=1; else delete it.pi}};
  var F_CAP={k:'cap',l:'Power limit',u:'%',min:10,max:100,st:5,ch:[25,50,75,100],def:100};
  // Stick, XY pad (and D-pad): the same settings, kept in the same places on both widgets
  // (it.jc = deadzone/sensitivity/power limit/axis lock; let go: it.hold on Stick and D-pad, it.hd on the XY pad;
  //  grid off: it.ng; LED rails (XY pad only): it.nr = off)
  function jcF(k,v){return function(it,x){var o=cleanJc(Object.assign({dz:0,sn:100,lm:100,ax:'f'},it.jc||{},(function(){var q={};q[k]=x;return q})()));if(o) it.jc=o; else delete it.jc}}
  function jcG(k,d){return function(it){return it.jc&&it.jc[k]!==undefined?it.jc[k]:d}}
  var F_LETGO={k:'hd',l:'When you let go',ch:[0,1],lab:['Back to the centre','Stay where it is'],only:true,def:0,
    g:function(it){return (it.k==='xy'?it.hd:it.hold)?1:0},s:function(it,v){if(it.k==='xy'){if(v) it.hd=1; else delete it.hd}else{if(v) it.hold=true; else delete it.hold}}};
  var F_SWP={k:'sw',l:'Swipe to other pairs',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.sw?1:0},s:function(it,v){if(v) it.sw=1; else delete it.sw}};
  var F_RAIL={k:'nr',l:'LED rails',ch:[0,1],lab:['On','Off'],only:true,def:0};
  var F_JDRV={k:'m',l:'Drive mode',ch:[0,1],lab:['Tank (2 motors)','Car (drive + steer)'],only:true,def:1,g:function(it){return it.m==='tank'?0:1},s:function(it,v){if(it.k==='xy'){if(v) delete it.m; else it.m='tank'}else it.m=v?'axis':'tank'}};
  var JXF=[{k:'dz',l:'Deadzone',u:'%',min:0,max:40,st:1,ch:[0,5,10,20],def:0,g:jcG('dz',0),s:jcF('dz')},
    {k:'sn',l:'Sensitivity',u:'%',min:50,max:150,st:5,ch:[75,100,125,150],def:100,g:jcG('sn',100),s:jcF('sn')},
    {k:'lm',l:'Power limit',u:'%',min:20,max:100,st:5,ch:[50,75,100],def:100,g:jcG('lm',100),s:jcF('lm')},
    {k:'ax',l:'Axis lock',ch:[0,1,2],lab:['Free','Left / right','Up / down'],only:true,def:0,g:function(it){return ['f','x','y'].indexOf(jcG('ax','f')(it))},s:function(it,v){jcF('ax')(it,['f','x','y'][v]||'f')}},
    F_LETGO,F_SWP,
    {k:'ng',l:'Grid',ch:[0,1],lab:['On','Off'],only:true,def:0,g:function(it){return it.ng?1:0},s:function(it,v){if(v) it.ng=1; else delete it.ng}},
    F_RAIL];
  var JYF=[F_JDRV].concat(JXF);
  var JSF=[F_JDRV].concat(JXF.filter(function(f){return f!==F_RAIL}));
  // the scope can draw up to 3 more channels of the same hub (yellow, blue, grey)
  function F_KC(j){return {k:'cs'+j,l:['Also show (yellow line)','Also show (blue line)','Also show (grey line)'][j],ch:[-1,0,1,2,3,4,5],lab:['Off','A','B','C','D','E','F'],only:true,def:-1,
    g:function(it){var v=(it.cs||[])[j];return v===undefined?-1:v%PER},
    s:function(it,v){var a=(it.cs||[]).slice(),hb=Math.floor(it.c/PER)*PER;a[j]=v<0?null:hb+v;a=a.filter(function(q,qi){return q!==null&&q!==undefined&&q!==it.c&&a.indexOf(q)===qi});if(a.length) it.cs=a; else delete it.cs}}}
  // a channel picker for the same hub as the widget's first channel
  function F_CHN(key,l,off){return {k:key,l:l,ch:(off?[-1]:[]).concat([0,1,2,3,4,5]),lab:(off?['Off']:[]).concat(['A','B','C','D','E','F']),only:true,def:off?-1:0,
    g:function(it){var v=it[key];return v===undefined||v<0?-1:v%PER},
    s:function(it,v){var hb=Math.floor((it.c||0)/PER)*PER;if(v<0) delete it[key]; else it[key]=hb+v}}}
  function F_CSN(j,l){return {k:'cs'+j,l:l,ch:[-1,0,1,2,3,4,5],lab:['Off','A','B','C','D','E','F'],only:true,def:-1,
    g:function(it){var v=(it.cs||[])[j];return v===undefined?-1:v%PER},
    s:function(it,v){var a=(it.cs||[]).slice(),hb=Math.floor(it.c/PER)*PER;a[j]=v<0?null:hb+v;a=a.filter(function(q,qi){return q!==null&&q!==undefined&&q!==it.c&&a.indexOf(q)===qi});if(a.length) it.cs=a; else delete it.cs}}}
  // turn-signal widget: pick the light channels that blink with it (stored on those channels)
  function F_IND(side,l){var la=side?4:3;return {k:'ind'+side,l:l,ch:[-1,0,1,2,3,4,5],lab:['Off','A','B','C','D','E','F'],only:true,def:-1,
    g:function(it){var hb=Math.floor(it.c/PER)*PER;for(var q=0;q<PER;q++){var cc=C.ch[hb+q];if(cc&&cc.kind==='light'&&cc.la===la&&cc.ls===it.c) return q}return -1},
    s:function(it,v){var hb=Math.floor(it.c/PER)*PER;for(var q=0;q<PER;q++){var cc=C.ch[hb+q];if(cc&&cc.la===la&&cc.ls===it.c) cc.la=0}
      if(v>=0&&hb+v!==it.c){var cl=C.ch[hb+v];cl.kind='light';cl.la=la;cl.ls=it.c;syncChannel(hb+v)}}}}
  var WSPEC={
    lx:{byT:{
      mx:{t:'LED matrix settings',f:[F_CHN('c','Drive channel'),F_CHN('d','Steering channel (arrows left/right)',true),
        {k:'ic',l:'Picture',ch:[0,1],lab:['Arrows (follow direction)','My icon'],only:true,def:0},
        {k:'px',l:'My icon (tap the dots to draw)',ed:true,mk:pxEditor,ch:[],dep:{k:'ic',v:1},g:function(it){return (it.px||LXPAT.up).slice()},s:function(it,v){if(it.ic) it.px=v.slice(); else delete it.px}},
        {k:'an',l:'Animation',ch:[0,1],lab:['Blink','Scroll (faster with more power)'],only:true,def:0}]},
      eq:{t:'LED bars settings',f:[F_CHN('c','Bar 1'),F_CSN(0,'Bar 2'),F_CSN(1,'Bar 3'),F_CSN(2,'Bar 4'),
        {k:'ow',l:'Direction',ch:[0,1],lab:['Both ways (reverse in blue)','Forward only'],only:true,def:0},
        {k:'mi',l:'Tap a bar',info:function(){return 'Tap a bar to mute its channel (the hub gets 0). Tap again to unmute. Mute ends when the app closes.'}}]},
      ts:{t:'Turn signal settings',f:[F_CHN('c','Steering channel'),{k:'th',l:'Blinks from',ch:[10,20,30],lab:['10%','20%','30%'],only:true,def:20},F_IND(0,'Left indicator light'),F_IND(1,'Right indicator light')]},
      gi:{t:'Gear LED settings',f:[F_CHN('c','Gear channel')]},
      lp:{t:'Light panel settings',f:[F_CHN('c','Light 1'),F_CSN(0,'Light 2'),F_CSN(1,'Light 3'),F_CSN(2,'Light 4'),
        {k:'pr',l:'Light program',ch:[0,1,2,3,4,5,6,7],lab:['Off','Chase','Bounce','Alternate','Police','All blink','Fill','Twinkle'],only:true,def:0},
        {k:'ps',l:'Program speed',ch:[1,2,3],lab:['Slow','Normal','Fast'],only:true,def:2,dep:{k:'pr',not:0}}]},
      tk:{t:'Message strip settings',f:[{k:'sp',l:'Scroll speed',ch:[1,2,3],lab:['Slow','Normal','Fast'],only:true,def:2}]}}},
    s:{t:'Slider settings',f:[F_INV,F_CAP,F_PC,F_PI,{k:'snap',l:'Snap to',ch:[0,5,10,25],lab:['Off','5%','10%','25%'],only:true,def:0},
      {k:'tm',l:'On release',ch:[0,1],lab:['Return to 0','Train (speed stays)'],only:true,def:0,g:function(it){return it.tm?1:0},s:function(it,v){if(v){it.tm=1;delete it.hold} else{delete it.tm;delete it.tr;delete it.tp}}},
      {k:'tr',l:'Train: change speed (full push)',ch:[20,40,80],lab:['20%/s','40%/s','80%/s'],only:true,def:40,dep:{k:'tm',v:1},g:function(it){return it.tr||40},s:function(it,v){if(v===40) delete it.tr; else it.tr=v}},
      {k:'tp',l:'Train: pause at 0 when reversing',ch:[0,1],lab:['Off','On'],only:true,def:1,dep:{k:'tm',v:1},g:function(it){return it.tp===0?0:1},s:function(it,v){if(v) delete it.tp; else it.tp=0}}]},
    m:{t:'Mix settings',f:[F_INV,F_CAP]},
    rs:{t:'Selector settings',f:[{k:'sm',l:'Mode',ch:[0,1],lab:['One channel per position','Scenes (several channels)'],only:true,def:0},
      {k:'p',l:'Output power',u:'%',min:5,max:100,st:5,ch:[25,50,75,100],def:100,dep:{k:'sm',v:0}},
      {k:'sc',l:'Scenes: power of each channel at each position',ed:true,mk:sceneEditor,ch:[],dep:{k:'sm',v:1},g:function(it){return rsScenes(it)},s:function(it,v){if(it.sm) it.sc=v.map(function(r){return r.slice()}); else delete it.sc}},
      {k:'ns',l:'Positions',ch:[4,6],only:true,def:6},
      {k:'hb',l:'Hub',ch:[0,1,2],lab:['Hub 1','Hub 2','Hub 3'],only:true,def:0,g:function(it){return it.hb||0},s:function(it,v){if(v) it.hb=v; else delete it.hb}},
      {k:'rt',l:'On/off ramp time (0 = instant)',u:'s',min:0,max:10,st:0.5,ch:[0,1,3,5],def:3}]},
    n:{t:'Dial settings',f:[F_INV,F_CAP,F_PC,F_PI,{k:'rt',l:'On/off ramp time (0 = instant)',u:'s',min:0,max:10,st:0.5,ch:[0,1,3,5],def:3},F_TH,{k:'ow',l:'Direction',ch:[0,1],lab:['Both ways','Forward only'],only:true,def:0},
      {k:'sw',l:'Swipe to other channels',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.sw?1:0},s:function(it,v){if(v) it.sw=1; else delete it.sw}},
      {k:'fn',l:'Turning',ch:[0,1],lab:['Normal','Fine (1 turn = 50%)'],only:true,def:0},
      {k:'tz',l:'Tap the centre to go to 0',ch:[1,0],lab:['On','Off'],only:true,def:1}]},
    g:{t:'Direction & limit',f:[F_INV,F_CAP]},
    lv:{t:'Direction & limit',f:[F_INV,F_CAP]},
    st:{t:'Steering wheel settings',f:[F_INV,F_CAP,F_PC,F_PI,{k:'ra',l:'Full lock at',ch:[90,180,270],lab:['90\u00b0','180\u00b0','270\u00b0'],only:true,def:180},
      {k:'hold',l:'On release',ch:[0,1],lab:['Return to centre','Stay'],only:true,def:0,g:function(it){return it.hold?1:0},s:function(it,v){if(v) it.hold=true; else delete it.hold}},
      {k:'gy',l:'Gyro (hold the wheel and tilt the phone)',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.gy?1:0},s:function(it,v){if(v) it.gy=1; else delete it.gy}},
      {k:'gs',l:'Gyro: tilt for full lock',ch:[0,30,45,60],lab:['Phone setting','High (30\u00b0)','Medium (45\u00b0)','Low (60\u00b0)'],only:true,def:0,g:function(it){return it.gs||0},s:function(it,v){if(v) it.gs=v; else delete it.gs}},
      {k:'gz',l:'Gyro: dead zone (hand shake is ignored)',only:true,ch:[0,3,5,8],lab:['Off','3\u00b0','5\u00b0','8\u00b0'],def:3,g:function(it){return it.gz===undefined?3:it.gz},s:function(it,v){if(v===3) delete it.gz; else it.gz=v}}]},
    dp:{t:'D-pad settings',f:[{k:'p',l:'Power',u:'%',min:10,max:100,st:5,ch:[40,70,100],def:70},
      {k:'m',l:'Drive mode',ch:[0,1],lab:['Tank (2 motors)','Car (drive + steer)'],only:true,def:0,g:function(it){return it.m==='car'?1:0},s:function(it,v){it.m=v?'car':'tank'}},
      {k:'rt',l:'Ramp time (0 = instant)',u:'s',min:0,max:3,st:0.1,ch:[0,0.3,1],def:0.3},
      {k:'tg',l:'Control',ch:[0,1],lab:['Hold to move','Tap to toggle'],only:true,def:0,g:function(it){return it.tg?1:0},s:function(it,v){if(v) it.tg=1; else delete it.tg}},
      F_LETGO,F_SWP]},
    b:{t:'Button settings',f:[{k:'p',l:'Turbo power',u:'%',min:30,max:100,st:5,ch:[50,75,100],def:100},
      {k:'bt',l:'Button type',ch:[0,1,2,3],lab:['Hold','Toggle','PingPong','Accelerator'],only:true,def:0,g:function(it){return ['','t','p','a'].indexOf(it.bt||'')},s:function(it,v){delete it.lock;if(v) it.bt=['','t','p','a'][v]; else delete it.bt;if(v!==3){delete it.ar;delete it.af}}},
      {k:'ar',l:'Accelerator: time to full power',ch:[0.5,1,2,3],lab:['0.5 s','1 s','2 s','3 s'],only:true,def:1,dep:{k:'bt',v:3},g:function(it){return it.ar||1},s:function(it,v){if(v===1) delete it.ar; else it.ar=v}},
      {k:'af',l:'Accelerator: time back to 0',ch:[0.5,1,2,0],lab:['0.5 s','1 s','2 s','Keep power'],only:true,def:1,dep:{k:'bt',v:3},g:function(it){return it.af===undefined?1:it.af},s:function(it,v){if(v===1) delete it.af; else it.af=v}}]},
    l:{t:'Light settings',f:[
      {k:'br',l:'Brightness',u:'%',ch:[25,50,75,100],only:true,def:100,g:function(it){return C.ch[it.c].bright||100},s:function(it,v){C.ch[it.c].bright=v;syncChannel(it.c)}},
      {k:'bl',l:'Blink',ch:[0,1,2,3,4],lab:['Steady','Slow','Fast','Pulse','Hazard'],only:true,def:0,g:function(it){return Math.max(0,['off','slow','fast','pulse','hazard'].indexOf(C.ch[it.c].blink||'off'))},s:function(it,v){C.ch[it.c].kind='light';C.ch[it.c].blink=['off','slow','fast','pulse','hazard'][v];syncChannel(it.c)}},
      {k:'la',l:'Turns on by itself',ch:[0,1,2,3,4],lab:['Off','Brake light','Reverse light','Left indicator','Right indicator'],only:true,def:0,g:function(it){return C.ch[it.c].la||0},s:function(it,v){C.ch[it.c].kind='light';C.ch[it.c].la=v}},
      {k:'ls',l:'Follows drive channel',ch:[0,1,2,3,4,5],lab:['A','B','C','D','E','F'],only:true,def:0,dep:{k:'la',not:0},g:function(it){return (C.ch[it.c].ls||0)%PER},s:function(it,v){C.ch[it.c].ls=Math.floor(it.c/PER)*PER+v}}]},
    t:{t:'Toggle settings',f:[{k:'p',l:'Power',u:'%',min:5,max:100,st:5,ch:[25,50,75,100]},F_INV,F_CAP]},
    f:{t:'Meter settings',f:[{k:'nd',l:'Style',ch:[0,1],lab:['LED ring','Needle (tachometer)'],only:true,def:0},{k:'tv',l:'Tachometer look',ch:[0,1,2,4,5],lab:['A Racing','B Twin ring','C Chrome','D Smooth arc','E Pro'],only:true,def:0,dep:{k:'nd',v:1}},F_SH,F_TH,{k:'ow',l:'Direction',ch:[0,1],lab:['Both ways','Forward only'],only:true,def:0}]},
    i:{t:'Meter settings',f:[F_SH,F_TH,{k:'ow',l:'Direction',ch:[0,1],lab:['Both ways','Forward only'],only:true,def:0},{k:'hz',l:'Bar layout',ch:[0,1],lab:['Vertical','Horizontal'],only:true,def:0},{k:'ls',l:'LED shape',ch:[0,1,2],lab:['Square','Round','Thin line'],only:true,def:0}]},
    k:{t:'Scope settings',f:[{k:'ws',l:'Time window',ch:[10,30,60],lab:['10 s','30 s','60 s'],only:true,def:10},F_KC(0),F_KC(1),F_KC(2),{k:'tg',l:'Target line',ch:[0,1],lab:['Off','On'],only:true,def:0},{k:'tv',l:'Target value',u:'%',min:-100,max:100,st:5,ch:[-80,-50,50,80,100],def:80}]},
    y:{t:'Ramp settings',f:[{k:'p',l:'Target power',u:'%',min:5,max:100,st:5,ch:[25,50,75,100]},{k:'d',l:'Ramp time',u:'s',min:1,max:30,st:1,ch:[2,4,6,10]},{k:'sc',l:'Show scope',ch:[0,1],lab:['Off','On'],only:true,def:0},F_INV,F_CAP]},
    w:{t:'Switch settings',f:[{k:'p',l:'Power',u:'%',min:5,max:100,st:5,ch:[25,50,75,100],def:100},
      {k:'mid',l:'Centre off position',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.mid?1:0},s:function(it,v){if(v) it.mid=1; else delete it.mid}},
      {k:'ra',l:'Reverse output A',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.ra?1:0},s:function(it,v){if(v) it.ra=1; else delete it.ra}},
      {k:'rb',l:'Reverse output B',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.rb?1:0},s:function(it,v){if(v) it.rb=1; else delete it.rb}}]},
    ps:{t:'Start / stop button settings',f:[{k:'hd',l:'Hold time before it switches',ch:[300,500,800,1200],lab:['0.3 s','0.5 s','0.8 s','1.2 s'],only:true,def:500},{k:'md',l:'What it controls',ch:[0,1],lab:['Hub link','Output only'],only:true,def:0}].concat('ABCDEF'.split('').map(function(c,j){return {k:'o'+j,l:'Output only: channel '+c,ch:[1,0],lab:['Stopped','Left running'],only:true,def:1,dep:{k:'md',v:1}}}))},
    j:{t:'Joystick settings',f:JSF},
    xy:{t:'XY pad settings',f:JYF},
    cam:{t:'Camera settings',f:[{k:'fr',l:'Camera',ch:[0,1],lab:['Rear','Front'],only:true,def:0},
      {k:'hu',l:'HUD',ch:[0,1,2],lab:['Full','Minimum','Off'],only:true,def:0},
      {k:'np',l:'Path lines',ch:[0,1],lab:['On','Off'],only:true,def:0},
      {k:'ct',l:'Picture',ch:[0,1],lab:['Fill','Fit'],only:true,def:0},
      {k:'q',l:'Video quality',ch:[480,720,1080],lab:['480p','720p','1080p'],only:true,def:720},
      {k:'nr',l:'Record and photo buttons',ch:[0,1],lab:['On','Off'],only:true,def:0}]},
    xf:{t:'Crossfader settings',f:[{k:'p',l:'Full power (top of the fader)',u:'%',min:10,max:100,st:5,ch:[50,80,100],def:100},
      {k:'md',l:'In the centre',ch:[0,1],lab:['Both channels at full power','Half power each'],only:true,def:0},
      {k:'rc',l:'Reverse the left side',ch:[0,1],lab:['Off','On'],only:true,def:0},{k:'rd',l:'Reverse the right side',ch:[0,1],lab:['Off','On'],only:true,def:0},
      {k:'xi',l:'How to use',info:function(){return 'Push the fader on the left up to run, pull it down to stop. Slide the knob to share the power, or tap C, 50 or D. \u21c4 reverses a side. Double-tap the knob to go back to the centre.'}}]},
    sw:{t:'Swing angle settings',f:[{k:'inf',l:'Limits',ch:[0,1],lab:['Left and right limits','No limit (turns 360\u00b0)'],only:true,def:0},
      {k:'lo',l:'Left limit',u:'\u00b0',min:-180,max:0,st:5,ch:[-180,-150,-90],def:-150,dep:{k:'inf',v:0}},{k:'hi',l:'Right limit',u:'\u00b0',min:0,max:180,st:5,ch:[90,150,180],def:150,dep:{k:'inf',v:0}},
      {k:'sz',l:'Slow down before the limit',u:'\u00b0',min:0,max:60,st:5,ch:[0,20,40],def:20,dep:{k:'inf',v:0}},
      {k:'dps',l:'Speed at full power',ed:true,g:function(it){return it.dps||30},s:function(it,v){if(v>0) it.dps=v},mk:function(get,set){return swCalMk(get,set)}},
      {k:'rv',l:'Direction',ch:[0,1],lab:['Normal','Reversed'],only:true,def:0}]},
    ro:{t:'Rotor settings',f:[{k:'bs',l:'Style',ch:[2,1],lab:['Jet turbine','Boat propeller'],only:true,def:2},{k:'n',l:'Blades',ch:[2,3,5],lab:['2','3','5'],only:true,def:3,dep:{k:'bs',v:1}}]},
    a:{t:'Auto-stop settings',f:[{k:'s',l:'Stop after',u:'s',min:1,max:300,st:1,ch:[5,10,20,30,60]}]},
    z:{t:'Timer settings',f:[{k:'a',l:'Alert after (0 = off)',u:'min',min:0,max:240,st:1,ch:[0,5,10,15,20,30]}]}
  };
  // channel fields shown in the widget settings of slider / steering / dial (stored on the channel, not the widget)
  var F_TRIM={k:'trimv',l:'Trim (runs straight)',u:'%',min:-20,max:20,st:1,ch:[-5,0,5],def:0,g:function(it){return C.ch[it.c].trim||0},s:function(it,v){C.ch[it.c].trim=v}};
  var F_TB={k:'tb',l:'Trim buttons on the widget',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.tb?1:0},s:function(it,v){if(v) it.tb=1; else delete it.tb}};
  var F_CURVE={k:'cvv',l:'Response curve',ed:true,ch:[],g:function(it){return (C.ch[it.c].cv||[25,50,75]).slice()},s:function(it,v){C.ch[it.c].cv=v}};
  var F_OFF={k:'offv',l:'Start power (channel)',u:'%',min:0,max:50,st:1,ch:[0,5,10,20],def:0,g:function(it){return C.ch[it.c].off||0},s:function(it,v){C.ch[it.c].off=v}};
  // read-only: how the hub value is made from the widget value, with this channel's settings
  var F_WHY={k:'why',l:'How the hub value is made',info:function(it){
    var c=C.ch[it.c],p=[];
    p.push('curve '+cvName(c.cv||[25,50,75]));
    if(c.off) p.push('start power +'+c.off+'%');
    if(c.max<100) p.push('max '+c.max+'%');
    if(C.limit<100) p.push('drive mode '+C.limit+'%');
    if(c.trim) p.push('trim '+(c.trim>0?'+':'')+c.trim+'%');
    var ex=Math.max(-100,Math.min(100,Math.round(goalOfAt(it.c,75))));
    return tagOf(it.c)+': '+p.join(' \u00b7 ')+'. Example: 75 \u2192 hub '+ex+'.';
  }};
  ['s','st','n'].forEach(function(k){if(WSPEC[k]) WSPEC[k].f=WSPEC[k].f.concat([F_CURVE,F_OFF,F_TRIM,F_TB,F_WHY])});
  function wsEdit(it){
    var sp=WSPEC[it.k];if(sp&&sp.byT) sp=sp.byT[it.t];if(!sp) return;
    var old=document.getElementById('gEdit');if(old) old.remove();
    var ov=document.createElement('div');ov.id='gEdit';ov.className='gedit';
    var bx=document.createElement('div');bx.className='gbox';ov.appendChild(bx);
    function mk(tag,txt,cls){var e=document.createElement(tag);if(txt) e.textContent=txt;if(cls) e.className=cls;return e}
    bx.appendChild(mk('h3',sp.t));
    // the widget's channels: tap one to pick from the named list (the change is made at once)
    var CR=it.k==='lx'?[]:chRoles(it);
    if(CR.length){
      var cbx=mk('div','','wsf ws-ch');cbx.appendChild(mk('span',CR.length>1?'Channels':'Channel','wsl'));
      CR.forEach(function(r){
        var v=chGet(it,r.k),b=mk('button','','btn ws-chb');b.type='button';
        if(CR.length>1) b.appendChild(mk('span',r.l,'ws-chl'));
        b.appendChild(mk('i',v>=0?tagOf(v):'\u2013','bdw-chip'));b.appendChild(mk('span',v>=0?C.ch[v].name:'None','ws-chn'));b.appendChild(mk('em','\u25BE'));
        b.addEventListener('click',function(){chList(it,r.k,function(nv){chApply(it,r.k,nv,function(){ov.remove();wsEdit(it)})})});
        cbx.appendChild(b);
      });
      bx.appendChild(cbx);
    }
    var vals={}, ins={}, boxes={};
    // a field with dep:{k,v} is only shown while another field has that value
    function refreshDep(){sp.f.forEach(function(f){if(f.dep&&boxes[f.k]) boxes[f.k].hidden=f.dep.not!==undefined?vals[f.dep.k]===f.dep.not:vals[f.dep.k]!==f.dep.v})}
    function dec(f){return f.st&&f.st<1?1:0}
    function clampF(f,v){v=+v;if(!isFinite(v)) return null;if(f.only) return v;v=Math.max(f.min,Math.min(f.max,v));return dec(f)?Math.round(v*10)/10:Math.round(v)}
    sp.f.forEach(function(f){
      if(f.info){var ib=mk('div','','wsf wsinfo');ib.appendChild(mk('span',f.l,'wsl'));var it2=mk('div',f.info(it),'wsinfo-t');ib.appendChild(it2);bx.appendChild(ib);boxes[f.k]=ib;ib.refresh=function(){it2.textContent=f.info(it)};return}
      if(f.ed){
        vals[f.k]=f.g(it);var ebox=mk('div','','wsf');ebox.appendChild(mk('span',f.l,'wsl'));
        ebox.appendChild((f.mk||cvEditor)(function(){return vals[f.k]},function(p){vals[f.k]=p}));
        bx.appendChild(ebox);boxes[f.k]=ebox;return;
      }
      var cur0=f.g?f.g(it):it[f.k];
      vals[f.k]=cur0!==undefined?cur0:(f.def!==undefined?f.def:f.ch[1]);
      var box=mk('div','','wsf');
      box.appendChild(mk('span',f.l,'wsl'));
      var rw=mk('div','','wsr');if(f.only) rw.hidden=true;
      var mn=mk('button','\u2212','btn wsb'),pl=mk('button','+','btn wsb');mn.type=pl.type='button';
      mn.setAttribute('aria-label','Decrease');pl.setAttribute('aria-label','Increase');
      var inp=document.createElement('input');inp.type='number';inp.className='txt wsi';inp.min=String(f.min);inp.max=String(f.max);inp.step=String(f.st);inp.inputMode='decimal';
      var un=mk('em',f.u);
      function set(v,fromInp){
        var c=clampF(f,v);if(c===null) return;
        vals[f.k]=c;if(!fromInp) inp.value=String(c);refreshDep();
        [].forEach.call(chips.children,function(b){b.setAttribute('aria-pressed',String(+b.getAttribute('data-v')===c))});
      }
      mn.addEventListener('click',function(){set(vals[f.k]-f.st)});
      pl.addEventListener('click',function(){set(vals[f.k]+f.st)});
      inp.addEventListener('input',function(){set(inp.value,true)});
      inp.addEventListener('blur',function(){inp.value=String(vals[f.k])});
      rw.appendChild(mn);rw.appendChild(inp);rw.appendChild(un);rw.appendChild(pl);
      var chips=mk('div','','wsc');
      f.ch.forEach(function(v){var b=mk('button',f.lab?f.lab[f.ch.indexOf(v)]:(v===0?'Off':String(v)+(f.u==='%'?'%':'')),'btn');b.type='button';b.setAttribute('data-v',String(v));b.addEventListener('click',function(){set(v)});chips.appendChild(b)});
      box.appendChild(rw);box.appendChild(chips);bx.appendChild(box);
      ins[f.k]=inp;boxes[f.k]=box;set(vals[f.k]);
    });
    refreshDep();
    var act=mk('div','','gact');
    var sv=mk('button','Save','btn'),cn=mk('button','Cancel','btn');sv.type=cn.type='button';sv.setAttribute('aria-pressed','true');
    sv.addEventListener('click',function(){
      var sc0=!!it.sc, hz0=!!it.hz;
      sp.f.forEach(function(f){
        if(f.info) return;
        var v=vals[f.k];
        if(f.s) f.s(it,v);
        else if(f.def!==undefined&&v===f.def) delete it[f.k];
        else it[f.k]=v;
      });
      if(it.k==='z') SESS.warned=false;
      if(it.k==='a') AUTOT[it.c]=0;
      if(it.k==='y'&&sc0!==!!it.sc&&dashOn()) dashRefit(it);
      if(it.k==='i'&&hz0!==!!it.hz&&dashOn()) dashRefit(it);
      save();ov.remove();syncBoard();
    });
    cn.addEventListener('click',function(){ov.remove()});
    act.appendChild(sv);act.appendChild(cn);bx.appendChild(act);
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    document.body.appendChild(ov);
  }
  function gearEdit(it){
    var old=document.getElementById('gEdit');if(old) old.remove();
    var rv=it.gr===undefined?-50:it.gr, fw=(it.gf&&it.gf.length?it.gf:[35,65,100]).slice();
    var ov=document.createElement('div');ov.id='gEdit';ov.className='gedit';
    var bx=document.createElement('div');bx.className='gbox';ov.appendChild(bx);
    function mk(tag,txt,cls){var e=document.createElement(tag);if(txt) e.textContent=txt;if(cls) e.className=cls;return e}
    function row(lbl,val,min,max){
      var r=mk('label','', 'grow');r.appendChild(mk('span',lbl));
      var i=document.createElement('input');i.type='number';i.min=String(min);i.max=String(max);i.step='5';i.inputMode='numeric';i.value=String(val);i.className='txt';
      var mn=mk('button','\u2212','btn wsb'),pl=mk('button','+','btn wsb');mn.type=pl.type='button';
      mn.setAttribute('aria-label','Decrease');pl.setAttribute('aria-label','Increase');
      var bump=function(d){var n=Math.round(+i.value);if(!isFinite(n)||i.value==='') n=0;i.value=String(Math.max(min,Math.min(max,n+d)))};
      mn.addEventListener('click',function(){bump(-5)});pl.addEventListener('click',function(){bump(5)});
      r.appendChild(mn);r.appendChild(i);r.appendChild(mk('em','%'));r.appendChild(pl);return {r:r,i:i};
    }
    var rows=[];
    function build(){
      bx.textContent='';
      bx.appendChild(mk('h3','Gear settings'));
      rows=[];
      var r0=row('R (reverse)',rv,-100,0);rows.push(r0);bx.appendChild(r0.r);
      fw.forEach(function(v,i){var r=row('Gear '+(i+1),v,1,100);rows.push(r);bx.appendChild(r.r)});
      var act=mk('div','', 'gact');
      var add=mk('button','Add gear','btn'),rm=mk('button','Remove gear','btn');
      add.type=rm.type='button';
      add.disabled=fw.length>=5;rm.disabled=fw.length<=1;
      add.addEventListener('click',function(){grab();fw.push(Math.min(100,(fw[fw.length-1]||0)+10));build()});
      rm.addEventListener('click',function(){grab();fw.pop();build()});
      act.appendChild(add);act.appendChild(rm);bx.appendChild(act);
      var more=mk('button','Direction & limit','btn');more.type='button';
      more.addEventListener('click',function(){grab();it.gr=rv;it.gf=fw.slice();save();ov.remove();wsEdit(it)});
      bx.appendChild(more);
      var act2=mk('div','', 'gact');
      var sv=mk('button','Save','btn'),cn=mk('button','Cancel','btn');
      sv.type=cn.type='button';sv.setAttribute('aria-pressed','true');
      sv.addEventListener('click',function(){grab();it.gr=rv;it.gf=fw.slice();save();ov.remove();syncBoard()});
      cn.addEventListener('click',function(){ov.remove()});
      act2.appendChild(sv);act2.appendChild(cn);bx.appendChild(act2);
    }
    function num(i,a,b,d){var n=Math.round(+i.value);return isFinite(n)&&i.value!==''?Math.max(a,Math.min(b,n)):d}
    function grab(){rv=num(rows[0].i,-100,0,rv);fw=fw.map(function(v,i){return num(rows[i+1].i,1,100,v)})}
    build();
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    document.body.appendChild(ov);
  }
  var SESS={ms:0,last:0,warned:false};
  function fmtSess(ms){var t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor(t/60)%60,sc=t%60,z=function(n){return n<10?'0'+n:''+n};return (h?h+':':'')+z(m)+':'+z(sc)}
  function sessReset(){SESS.ms=0;SESS.warned=false;SESS.last=performance.now()}
  function sessTick(){
    var now=performance.now(), dt=now-(SESS.last||now);SESS.last=now;
    if(!S.connected) return;
    SESS.ms+=Math.min(dt,2000);
    if(C.st){C.st.ms+=Math.min(dt,2000);C.st.last=Date.now();if(now-(SESS.sv||0)>20000){SESS.sv=now;save()}}
    var al=0;(C.board||[]).forEach(function(o){if(o.k==='z'&&o.a) al=al?Math.min(al,o.a):o.a});
    if(al&&!SESS.warned&&SESS.ms>=al*60000){SESS.warned=true;toast('Session '+al+' min. Check motors and battery.',6000);feedback('warn')}
    if(typeof paintBoard==='function'&&C.board&&C.board.some(function(o){return o.k==='z'})) paintBoard();
  }
  setInterval(sessTick,500);
  // Slider minimum / maximum only limit the channel's own slider, never other widgets (selector, dial, joystick ...)
  function setT(i,v,fromUI,force){
    if(runBlk&&runBlk[i]&&!force){ if(v===0||S.estop) runBlk[i]=false; else return }
    if(S.estop) v=0; else if(S.play&&!force) return;
    var nv0=clamp(Math.round(v),-100,100)||0;crzLatch(i,rt.t[i],nv0);
    rt.t[i]=nv0;
    if(!fromUI||S.estop) refs[i].rng.value=rt.t[i];
    refs[i].val.textContent=fmt(rt.t[i]);
    if(refs[i].preB) refs[i].preB.forEach(function(b){b.classList.toggle('on',+b.dataset.v===rt.t[i])});
    if(refs[i].hRev){refs[i].hRev.classList.toggle('on',rt.t[i]<0);refs[i].hFwd.classList.toggle('on',rt.t[i]>0)}
  }
  function unlockCh(i){
    var r=refs[i];
    if(r&&r.hRev){r.hRev.classList.remove('on');r.hFwd.classList.remove('on')}
    if(r&&r.locked){r.locked=false;r.lock.setAttribute('aria-pressed','false');r.lock.textContent='Lock'}
  }
  function zeroAll(){
    for(var u=0;u<NMAX;u++){unlockCh(u);if(runBlk)runBlk[u]=false}
    for(var i=0;i<NMAX;i++){rt.t[i]=0;rt.o[i]=0;refs[i].rng.value=0;refs[i].val.textContent='0'}
  }
  function buildChannel(i){
    var el=document.createElement('article');el.className='ch';
    el.innerHTML='<div class="ch-head"><span class="tag"></span><input class="name" maxlength="16" aria-label="Channel name"><button class="btn inv" type="button" aria-pressed="false">Reverse</button></div>'+
      '<div class="track"><div class="fill"></div><input class="pwr" type="range" min="-100" max="100" step="1" value="0" aria-label="Channel power"><button class="stp dec" type="button" aria-label="Decrease 5%"></button><button class="stp inc" type="button" aria-label="Increase 5%"></button></div>'+
      '<div class="pre" role="group" aria-label="Quick values"><button class="btn" type="button" data-v="-100">\u2212100</button><button class="btn" type="button" data-v="-50">\u221250</button><button class="btn" type="button" data-v="0">0</button><button class="btn" type="button" data-v="50">+50</button><button class="btn" type="button" data-v="100">+100</button></div>'+
      '<div class="holds" hidden><button class="hold rev" type="button">Reverse</button><button class="hold fwd" type="button">Forward</button></div>'+
      '<div class="lights" hidden>'+
        '<label><span class="set-top"><span>Brightness</span><output class="ltOut">100%</output></span><input class="lt-bright" type="range" min="0" max="100" step="5"></label>'+
        '<label>Blink<select class="lt-blink"><option value="off">Steady</option><option value="slow">Slow blink</option><option value="fast">Fast blink</option><option value="pulse">Pulse</option><option value="hazard">Hazard</option></select></label></div>'+
      '<div class="ch-foot"><span class="meter-wrap" aria-hidden="true"><span class="meter"></span><span class="ar"></span></span><output class="val">0</output><span class="sent">out 0</span><button class="btn stop" type="button">Stop</button><button class="btn lock" type="button" aria-pressed="false">Lock</button><button class="lt-on" type="button" role="switch" aria-checked="false" aria-label="Light" hidden>Off</button></div>'+
      '<details class="adv"><summary>Channel settings</summary><div class="adv-grid">'+
        '<label><span class="set-top"><span>Maximum power</span><output class="maxOut"></output></span><input class="max" type="range" min="10" max="100" step="5"></label>'+
        '<label><span class="set-top"><span>Reverse top speed</span><output class="rmaxOut"></output></span><input class="rmax" type="range" min="10" max="105" step="5"></label>'+
        '<label><span class="set-top"><span>Acceleration smoothing</span><output class="rmpOut"></output></span><input class="rmp" type="range" min="0" max="105" step="5"></label>'+
        '<div class="hmbox" hidden><label><span class="set-top"><span>Smart motor mode (H-hub)</span></span><select class="hm"><option value="0">Normal (speed)</option><option value="1">Servo (position)</option><option value="2">End stops</option></select></label>'+
        '<div class="hmrow"><label><span class="set-top"><span class="hmal">From (°)</span></span><input class="ha txt" type="number" min="-3600" max="3600" step="5" inputmode="numeric"></label>'+
        '<label><span class="set-top"><span class="hmbl">To (°)</span></span><input class="hb txt" type="number" min="-3600" max="3600" step="5" inputmode="numeric"></label></div>'+
        '<label class="hsl"><span class="set-top"><span>Servo speed</span><output class="hsOut"></output></span><input class="hs" type="range" min="5" max="100" step="5"></label></div>'+
        '<label><span class="set-top"><span>Start power</span><output class="offOut"></output></span><input class="off" type="range" min="0" max="50" step="5"></label>'+

        '<div class="seg stpseg" role="group" aria-label="Step size of the arrows"><button class="btn st1" type="button" aria-pressed="false">Step 1</button><button class="btn st5" type="button" aria-pressed="true">Step 5</button><button class="btn st10" type="button" aria-pressed="false">Step 10</button></div>'+
        '<div class="cvslot"><span class="set-top"><span>Response curve</span></span></div>'+
        '<div class="seg" role="group" aria-label="Control type"><button class="btn kS" type="button" aria-pressed="true">Slider</button><button class="btn kH" type="button" aria-pressed="false">Hold</button><button class="btn kL" type="button" aria-pressed="false">Light</button></div>'+
      '</div></details>';
    wrap.appendChild(el);
    var r={el:el,tag:$('.tag',el),name:$('.name',el),inv:$('.inv',el),track:$('.track',el),fill:$('.fill',el),rng:$('.pwr',el),
      holds:$('.holds',el),hRev:$('.hold.rev',el),hFwd:$('.hold.fwd',el),val:$('.val',el),mw:$('.meter-wrap',el),meter:$('.meter',el),sent:$('.sent',el),
      lock:$('.lock',el),max:$('.max',el),maxOut:$('.maxOut',el),rmax:$('.rmax',el),rmaxOut:$('.rmaxOut',el),rmp:$('.rmp',el),rmpOut:$('.rmpOut',el),hmbox:$('.hmbox',el),hm:$('.hm',el),ha:$('.ha',el),hb:$('.hb',el),hs:$('.hs',el),hsOut:$('.hsOut',el),off:$('.off',el),offOut:$('.offOut',el),cvslot:$('.cvslot',el),
      pre:$('.pre',el),preB:[].slice.call(el.querySelectorAll('.pre .btn')),st1:$('.st1',el),st5:$('.st5',el),st10:$('.st10',el),
      kS:$('.kS',el),kH:$('.kH',el),kL:$('.kL',el),lights:$('.lights',el),ltOn:$('.lt-on',el),ltB:$('.lt-bright',el),ltOut:$('.ltOut',el),ltBl:$('.lt-blink',el)};
    refs.push(r);

    r.rng.addEventListener('input',function(){
      var v=+r.rng.value;
      setT(i,v,true);
      if(+r.rng.value!==rt.t[i]) r.rng.value=rt.t[i];
    });
    r.preB.forEach(function(b){b.addEventListener('click',function(){
      if(S.estop||S.play||r.locked) return;
      setT(i,+b.dataset.v,false);
    })});
    (function(){
      var tm=0,rp=0;
      function step(d){
        if(S.estop||S.play||r.locked) return;
        var sp=C.ch[i].stp||5;
        var v=Math.max(-100,Math.min(100,Math.round((rt.t[i]+(d<0?-sp:sp))/sp)*sp));
        setT(i,v,false);
      }
      function stop(){clearTimeout(tm);clearInterval(rp);tm=0;rp=0}
      [['.dec',-5],['.inc',5]].forEach(function(q){
        var b=$(q[0],el);
        b.addEventListener('pointerdown',function(e){
          e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}
          stop();step(q[1]);tm=setTimeout(function(){rp=setInterval(function(){step(q[1])},120)},420);
        });
        ['pointerup','pointercancel','lostpointercapture','blur'].forEach(function(ev){b.addEventListener(ev,stop)});
        b.addEventListener('contextmenu',function(e){e.preventDefault()});
      });
    })();
    var rel=function(){ if(C.spring&&!S.play&&!r.locked){r.rng.value=0;setT(i,0,true)} };
    r.rng.addEventListener('pointerup',rel);
    r.rng.addEventListener('pointercancel',rel);
    r.lock.addEventListener('click',function(){
      if(S.estop||S.play) return;
      r.locked=!r.locked;
      r.lock.setAttribute('aria-pressed',String(r.locked));
      r.lock.textContent=r.locked?'Locked':'Lock';
      if(!r.locked&&(C.spring||C.ch[i].kind==='hold')){r.rng.value=0;setT(i,0,true)}
    });
    $('.stop',el).addEventListener('click',function(){
      if(S.play) return;
      unlockCh(i);
      r.rng.value=0;setT(i,0,true);rt.o[i]=0;last=null;
    });

    [r.hRev,r.hFwd].forEach(function(btn,k){
      var dir=k?1:-1, down=false;
      function press(){ if(down)return; down=true; btn.classList.add('on'); setT(i,dir*100,false); }
      function lift(){ if(!down)return; down=false; if(r.locked) return; btn.classList.remove('on'); setT(i,0,false); }
      btn.addEventListener('pointerdown',function(e){
        e.preventDefault();
        try{btn.setPointerCapture(e.pointerId)}catch(_){}
        press();
      });
      btn.addEventListener('pointerup',lift);
      btn.addEventListener('pointercancel',lift);
      btn.addEventListener('lostpointercapture',lift);
      btn.addEventListener('contextmenu',function(e){e.preventDefault()});
      btn.addEventListener('keydown',function(e){ if(e.key===' '||e.key==='Enter'){e.preventDefault();press()} });
      btn.addEventListener('keyup',function(e){ if(e.key===' '||e.key==='Enter'){e.preventDefault();lift()} });
      btn.addEventListener('blur',lift);
    });

    r.inv.addEventListener('click',function(){C.ch[i].inv=!C.ch[i].inv;r.inv.setAttribute('aria-pressed',String(C.ch[i].inv));save()});
    r.name.addEventListener('input',function(){C.ch[i].name=r.name.value;syncSticks()});
    r.name.addEventListener('change',save);
    r.max.addEventListener('input',function(){C.ch[i].max=+r.max.value;r.maxOut.textContent=C.ch[i].max+'%';drawCurve(i)});
    r.max.addEventListener('change',save);
    function rmaxTxt(){var v=C.ch[i].rmax;r.rmaxOut.textContent=v?v+'%':(MS?tr2('Same as forward'):'Same as forward')}
    function rmpTxt(){var v=C.ch[i].rmp;r.rmpOut.textContent=v>=0?String(v):(MS?tr2('Same as all outputs'):'Same as all outputs')}
    r.rmax.addEventListener('input',function(){var v=+r.rmax.value;C.ch[i].rmax=v>100?0:v;rmaxTxt()});
    r.rmax.addEventListener('change',save);
    r.rmp.addEventListener('input',function(){var v=+r.rmp.value;C.ch[i].rmp=v>100?-1:v;rmpTxt()});
    r.rmp.addEventListener('change',save);
    r.rmaxT=rmaxTxt;r.rmpT=rmpTxt;
    function hmSync(){var c=C.ch[i];r.hmbox.querySelector('.hmrow').hidden=c.hm===0;r.hmbox.querySelector('.hsl').hidden=c.hm!==1;r.hsOut.textContent=c.hs+'%'}
    r.hm.addEventListener('change',function(){C.ch[i].hm=+r.hm.value;hmSync();save()});
    r.ha.addEventListener('change',function(){C.ch[i].ha=Math.max(-3600,Math.min(3600,Math.round(+r.ha.value||0)));r.ha.value=C.ch[i].ha;save()});
    r.hb.addEventListener('change',function(){C.ch[i].hb=Math.max(-3600,Math.min(3600,Math.round(+r.hb.value||0)));r.hb.value=C.ch[i].hb;save()});
    r.hs.addEventListener('input',function(){C.ch[i].hs=+r.hs.value;hmSync()});
    r.hs.addEventListener('change',save);
    r.hmS=hmSync;
    r.off.addEventListener('input',function(){C.ch[i].off=+r.off.value;r.offOut.textContent=C.ch[i].off+'%';drawCurve(i)});
    r.off.addEventListener('change',save);
    r.cve=cvEditor(function(){return C.ch[i].cv},function(p){C.ch[i].cv=p;clearTimeout(r.cvT);r.cvT=setTimeout(save,300)});r.cvslot.appendChild(r.cve);
    [[r.st1,1],[r.st5,5],[r.st10,10]].forEach(function(q){q[0].addEventListener('click',function(){C.ch[i].stp=q[1];syncChannel(i);save()})});
    function setKind(k){C.ch[i].kind=k;r.rng.value=0;setT(i,0,true);syncChannel(i);save()}
    r.kS.addEventListener('click',function(){setKind('slider')});
    r.kL.addEventListener('click',function(){setKind('light')});
    r.ltOn.addEventListener('click',function(){if(S.estop||S.play) return;setT(i,rt.t[i]>0?0:(C.ch[i].bright||100),false)});
    r.ltB.addEventListener('input',function(){C.ch[i].bright=+r.ltB.value;r.ltOut.textContent=C.ch[i].bright+'%';if(rt.t[i]>0) setT(i,C.ch[i].bright,false)});
    r.ltB.addEventListener('change',save);
    r.ltBl.addEventListener('change',function(){C.ch[i].blink=r.ltBl.value;save()});
    r.kH.addEventListener('click',function(){setKind('hold')});
  }
  for(var gs=0;gs<3;gs++){
    var g=document.createElement('div');g.className='grp';wrap.appendChild(g);groups.push(g);
    for(var gj=0;gj<PER;gj++) buildChannel(gs*PER+gj);
  }

  function drawCurve(i){if(refs[i]&&refs[i].cve) refs[i].cve.redraw()}
  function syncChannel(i){
    var c=C.ch[i], r=refs[i], hold=c.kind==='hold', light=c.kind==='light';
    r.tag.textContent=tagOf(i);
    r.name.value=c.name;
    r.name.setAttribute('aria-label','Name of channel '+tagOf(i));
    r.rng.setAttribute('aria-label','Power of channel '+tagOf(i));
    r.inv.setAttribute('aria-pressed',String(c.inv));
    r.max.value=c.max;r.maxOut.textContent=c.max+'%';
    r.rmax.value=c.rmax||105;r.rmp.value=c.rmp>=0?c.rmp:105;if(r.rmaxT){r.rmaxT();r.rmpT()}
    r.hmbox.hidden=!(isHall((i/PER)|0)&&!light);r.hm.value=String(c.hm||0);r.ha.value=c.ha;r.hb.value=c.hb;r.hs.value=c.hs;if(r.hmS) r.hmS();
    r.off.value=c.off;r.offOut.textContent=c.off+'%';
    r.track.hidden=hold||light;r.holds.hidden=!hold;r.lights.hidden=!light;r.lock.hidden=light;r.inv.hidden=light;r.ltOn.hidden=!light;
    r.kS.setAttribute('aria-pressed',String(!hold&&!light));
    r.kH.setAttribute('aria-pressed',String(hold));
    r.kL.setAttribute('aria-pressed',String(light));
    r.ltB.value=c.bright;r.ltOut.textContent=c.bright+'%';r.ltBl.value=c.blink;
    r.pre.hidden=hold||light;
    r.st1.setAttribute('aria-pressed',String(c.stp===1));r.st5.setAttribute('aria-pressed',String(c.stp===5));r.st10.setAttribute('aria-pressed',String(c.stp===10));
    var sdec=$('.dec',r.el),sinc=$('.inc',r.el);sdec.setAttribute('aria-label','Decrease '+c.stp+'%');sinc.setAttribute('aria-label','Increase '+c.stp+'%');
    drawCurve(i);
    // Settings that only make sense for a slider are hidden for Hold and Light (Hold still uses Maximum power)
    var sl=!hold&&!light;
    [[r.max,!light],[r.off,sl]].forEach(function(q){var lb=q[0].closest('label');if(lb) lb.hidden=!q[1]});
    r.st1.parentNode.hidden=!sl;
    r.cvslot.hidden=!sl;
  }

