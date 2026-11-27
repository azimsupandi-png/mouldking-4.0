  /* ---------- Dashboard: free-position widgets (separate layouts for landscape and portrait) ---------- */
  function dashOn(){
    if(C.layout!=='board') return false;
    return dashSetMode()&&!!C.dash;
  }
  function dashSize(it){
    var k=it.k, wd=it.w===2, L=DG.k==='g';
    if(k==='j') return L?[12,16]:[16,18];
    if(k==='d') return L?[24,16]:[24,14];
    if(k==='s'||k==='m') return it.v?[6,16]:(L&&!wd?[16,6]:[24,6]);
    if(k==='t') return it.y==='dir'?(L?[18,6]:[24,6]):(L?(wd?[12,6]:[8,6]):[12,6]);
    if(k==='e') return [8,8];
    if(k==='w') return L?[18,7]:[24,7];
    if(k==='a') return L?[14,6]:[24,6];
    if(k==='y') return it.sc?(L?[18,12]:[24,12]):(L?[18,6]:[24,6]);
    if(k==='f') return L?[10,12]:[14,12];
    if(k==='i') return it.hz?(L?[16,7]:[24,7]):(L?[8,14]:[10,14]);
    if(k==='k') return L?[20,12]:[24,12];
    if(k==='n') return L?[10,12]:[14,12];
    if(k==='rs') return L?[10,12]:[14,12];
    if(k==='st') return L?[10,12]:[14,12];
    if(k==='xy') return L?[12,14]:[16,16];
    if(k==='xf') return L?[16,12]:[20,12];
    if(k==='ro') return L?[10,12]:[14,12];
    if(k==='ax') return L?[10,12]:[14,12];
    if(k==='sw') return L?[12,14]:[24,16];
    if(k==='tl') return L?[18,12]:[24,12];
    if(k==='lv') return L?[8,14]:[10,14];
    if(k==='dp') return L?[12,14]:[16,14];
    if(k==='g') return L?[24,6]:[24,7];
    if(k==='z') return L?[10,6]:[16,6];
    if(k==='lx') return ({mx:L?[10,12]:[14,12],eq:L?[12,12]:[16,12],ts:L?[12,6]:[16,6],gi:L?[14,7]:[20,7],lp:L?[16,((it.cs||[]).length>1?9:6)]:[16,10],tk:L?[22,6]:[24,5]})[it.t]||[12,6];
    if(k==='ps') return L?[9,12]:[12,12];
    return L?[8,6]:[12,6];
  }
  function dashHitsG(a,b){return a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3]}
  function dashHits(it,g){return C.board.some(function(o){return o!==it&&o[DG.k]&&dashHitsG(o[DG.k],g)})}
  var DASH_TINY=0;
  function dashFind(it,f){
    var sz=dashSize(it), mn=dmin(it);
    if(DASH_TINY) mn=[Math.max(3,Math.round(mn[0]*DASH_TINY)),Math.max(3,Math.round(mn[1]*DASH_TINY))];
    var w0=Math.max(mn[0],Math.round(sz[0]*f)), h0=Math.max(mn[1],Math.round(sz[1]*f));
    if(it.k==='e'&&!dashHits(it,[DG.x-w0,DG.y-h0,w0,h0])) return [DG.x-w0,DG.y-h0,w0,h0];
    for(var shrink=0;shrink<12;shrink++){
      var w=Math.max(mn[0],w0-shrink*2), h=Math.max(mn[1],h0-shrink*2);
      for(var y=0;y<=DG.y-h;y++) for(var x=0;x<=DG.x-w;x++){
        var t=[x,y,w,h];
        if(!dashHits(it,t)) return t;
      }
      if(w===mn[0]&&h===mn[1]) break;
    }
    return null;
  }
  // Place widgets that have no position yet. Never overlap: if they do not fit,
  // try again with every new widget smaller and biggest first. Returns false if
  // some widget still could not get its own space.
  function dashAuto(){
    var list=C.board.filter(function(o){return !o[DG.k]});
    if(!list.length) return true;
    var byArea=list.slice().sort(function(a,b){
      if(a.k==='e'||b.k==='e') return (b.k==='e'?1:0)-(a.k==='e'?1:0);
      var A=dashSize(a),B=dashSize(b);return B[0]*B[1]-A[0]*A[1]});
    var tries=[[list,1],[byArea,1],[byArea,.85],[byArea,.7],[byArea,.55],[byArea,.4],[byArea,0],[byArea,0,.9],[byArea,0,.8],[byArea,0,.7],[byArea,0,.6],[byArea,0,.5],[byArea,0,.45]];
    var ok=false;
    for(var t=0;t<tries.length&&!ok;t++){
      DASH_TINY=tries[t][2]||0;
      list.forEach(function(o){delete o[DG.k]});
      var order=tries[t][0].slice().sort(function(a,b){return (b.k==='e'?1:0)-(a.k==='e'?1:0)});
      ok=true;
      for(var i=0;i<order.length;i++){var g=dashFind(order[i],tries[t][1]);if(!g){ok=false;break}order[i][DG.k]=g}
    }
    var usedTiny=DASH_TINY;DASH_TINY=0;
    if(ok&&usedTiny) toast('Many widgets, so some were made smaller. Remove one to make them bigger.',5000);
    if(!ok){
      list.forEach(function(o){if(!o[DG.k]){var mn=dmin(o);o[DG.k]=[0,0,mn[0],mn[1]]}});
      toast('Too many widgets to fit on the screen. Remove one.');
    }
    save();
    return ok;
  }
  function dashRefit(it){
    if(!it[DG.k]) return;
    var sz=dashSize(it), mn=dmin(it);
    var w=Math.max(mn[0],Math.min(sz[0],DG.x)), h=Math.max(mn[1],Math.min(sz[1],DG.y));
    var x=Math.min(it[DG.k][0],DG.x-w), y=Math.min(it[DG.k][1],DG.y-h), g=[x,y,w,h];
    if(!dashHits(it,g)){it[DG.k]=g;return}
    delete it[DG.k];dashAuto();
  }
  var DCELL={w:30,h:24,pw:720,ph:288};
  function dashCell(){
    var par=bdGrid.parentElement, pw=(par&&par.clientWidth)||window.innerWidth;
    var hd=document.querySelector('header'), top=hd?hd.getBoundingClientRect().bottom:0;
    DCELL.pw=Math.floor(pw);DCELL.ph=Math.floor(Math.max(150,window.innerHeight-top-12-(DG.k==='gp'?52:0)));
    DCELL.w=DCELL.pw/DG.x;DCELL.h=DCELL.ph/DG.y;
  }
  function dashStyle(el,g){
    // left-handed: the dashboard is mirrored (not while editing, so dragging still follows the finger)
    var gx=g[0];
    var x0=Math.round(gx*DCELL.w), x1=Math.round((gx+g[2])*DCELL.w), y0=Math.round(g[1]*DCELL.h), y1=Math.round((g[1]+g[3])*DCELL.h);
    el.style.left=x0+'px';el.style.top=y0+'px';el.style.width=(x1-x0)+'px';el.style.height=(y1-y0)+'px';
  }
  function dashFit(){
    var on=dashOn();
    document.documentElement.classList.toggle('dash',on);
    document.documentElement.classList.toggle('dash-l',on&&DG.k==='g');
    if(on){try{window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0}catch(_){}}
    if(!bdGrid) return;
    if(!on){var dbar0=$('#dashBar');if(dbar0) dbar0.style.top='';bdGrid.style.height='';bdGrid.style.width='';bdGrid.style.margin='';bdGrid.style.backgroundSize='';return}
    dashCell();
    var hdr=document.querySelector('header'), htop=hdr?hdr.getBoundingClientRect().bottom:51;
    var bt0=$('#btBtn'), dbar=$('#dashBar');
    if(dbar){var bq=bt0?bt0.getBoundingClientRect():null;if(DG.k==='gp') dbar.style.top=''; else dbar.style.top=(bq&&bq.height?Math.round(bq.top+bq.height/2-16):Math.max(0,Math.round((htop-3-32)/2)))+'px'}
    bdGrid.style.width=DCELL.pw+'px';bdGrid.style.height=DCELL.ph+'px';bdGrid.style.margin='0';
    bdGrid.style.backgroundSize=DCELL.w+'px '+DCELL.h+'px';
    bdW.forEach(function(w){if(w.el&&w.it&&w.it[DG.k]) dashStyle(w.el,w.it[DG.k])});
    if(typeof bdGrid.querySelectorAll!=='function') return;
    [].slice.call(bdGrid.querySelectorAll('.dw')).forEach(function(el){
      if(el.__rsz) el.__rsz();
      var hh=0, hd2=el.querySelector('.bdw-h');
      if(hd2) hh=hd2.offsetHeight+3;
      var ddt=el.querySelector('.dialdots');if(ddt&&el.querySelector('.pad')) hh+=ddt.offsetHeight+3;
      var aw=el.clientWidth-14, ah=el.clientHeight-10-hh;
      var esb=el.querySelector('.dw-es');
      if(esb){var es0=Math.max(20,Math.floor(Math.min(el.clientWidth,el.clientHeight)-4));esb.style.width=es0+'px';esb.style.height=es0+'px';esb.style.alignSelf='center'}
      var pads=[].slice.call(el.querySelectorAll('.pad'));
      if(pads.length){
        var sp=Math.max(30,Math.min(pads.length>1?(aw-42)/2:aw-18,ah-18));
        sp=Math.floor(sp);
        pads.forEach(function(q){q.style.width=sp+'px';q.style.height=sp+'px';q.style.marginTop=Math.max(0,Math.floor((ah-sp)/2))+'px';q.style.marginLeft=q.style.marginRight='0'});
      }
      var bv=el.querySelector('.bdv');
      if(bv){
        var inp=bv.firstChild, bh=Math.max(60,ah);
        bv.style.height=bh+'px';
        if(inp){
          inp.style.zoom='1';var tk=inp.offsetHeight||46;
          var kv=Math.max(window.innerHeight<340?0.6:1,Math.min(4,aw/tk,bh/(2.6*tk))), lw=bh/kv;
          inp.style.zoom=String(kv);inp.style.width=lw+'px';inp.style.marginLeft=(-lw/2)+'px';inp.style.marginTop=(-tk/2)+'px';
        }
      }else if(el.querySelector){
        var ct=el.querySelector(':scope > input[type=range], :scope > .tgl, :scope > .tgdir, :scope > .qbtn');
        if(ct){
          ct.style.zoom='1';ct.style.width='';
          var cb=ct.offsetHeight||44, isIn=ct.matches&&ct.matches('input'), mw=ct.classList.contains('tgdir')?230:170, kc=Math.max(window.innerHeight<340?0.6:1,Math.min(4,ah/cb,isIn?aw/(2.6*cb):aw/mw));
          ct.style.zoom=String(kc);ct.style.width=(aw/kc)+'px';
        }
      }
    });
  }
  function dashGuides(it,g){
    var old=bdGrid.querySelectorAll('.dguide');for(var i=0;i<old.length;i++) old[i].remove();
    if(!it||!g) return;
    var xs={},ys={};
    C.board.forEach(function(o){var h=o[DG.k];if(o===it||!h) return;
      [h[0],h[0]+h[2]].forEach(function(v){xs[v]=1});[h[1],h[1]+h[3]].forEach(function(v){ys[v]=1});
      xs['c'+(h[0]*2+h[2])]=h[0]+h[2]/2;ys['c'+(h[1]*2+h[3])]=h[1]+h[3]/2});
    var mine={x:[g[0],g[0]+g[2]],y:[g[1],g[1]+g[3]]}, cx=g[0]+g[2]/2, cy=g[1]+g[3]/2;
    function line(v,vert){var d=document.createElement('div');d.className='dguide '+(vert?'v':'h');
      if(vert){d.style.left=Math.round(v*DCELL.w)+'px'}else{d.style.top=Math.round(v*DCELL.h)+'px'}bdGrid.appendChild(d)}
    var done={};
    mine.x.forEach(function(v){if(xs[v]&&!done['x'+v]&&v>0&&v<DG.x){done['x'+v]=1;line(v,true)}});
    mine.y.forEach(function(v){if(ys[v]&&!done['y'+v]&&v>0&&v<DG.y){done['y'+v]=1;line(v,false)}});
    Object.keys(xs).forEach(function(k){if(k.charAt(0)==='c'&&xs[k]===cx&&!done['x'+cx]){done['x'+cx]=1;line(cx,true)}});
    Object.keys(ys).forEach(function(k){if(k.charAt(0)==='c'&&ys[k]===cy&&!done['y'+cy]){done['y'+cy]=1;line(cy,false)}});
  }
  function dashDrag(el,it){
    el.addEventListener('pointerdown',function(e){
      if(e.target.closest&&e.target.closest('.bdw-ed,.bdw-lbl,.bdw-chip.tap')) return;
      // a second finger on the same widget turns the drag into a pinch (resize in grid steps)
      var P=el.__pz||(el.__pz={pts:{},on:false,used:false});
      P.pts[e.pointerId]={x:e.clientX,y:e.clientY};
      var pids=Object.keys(P.pts);
      if(pids.length>=2){if(!P.on&&pids.length===2) dashPinch(el,it,P,e);e.preventDefault();return}
      var mode=e.target.classList.contains('dw-rs')?'rs':'mv';
      var cw=DCELL.w, ch=DCELL.h;
      var g0=it[DG.k].slice(), g1=g0.slice(), sx=e.clientX, sy=e.clientY, pid=e.pointerId, mn=dmin(it);
      var grp=(mode==='mv'&&BD_SEL.length>1&&BD_SEL.indexOf(it)>=0)?BD_SEL.filter(function(o){return o[DG.k]}).map(function(o){
        var w0=null;bdW.forEach(function(w){if(w.it===o) w0=w});return {o:o,g0:o[DG.k].slice(),el:w0&&w0.el}}):null, gd=[0,0];
      function grpAt(dx,dy){
        var bad=false;grp.forEach(function(m){var n=[m.g0[0]+dx,m.g0[1]+dy,m.g0[2],m.g0[3]];
          if(n[0]<0||n[1]<0||n[0]+n[2]>DG.x||n[1]+n[3]>DG.y) bad=true;
          else if(C.board.some(function(o){return BD_SEL.indexOf(o)<0&&o[DG.k]&&dashHitsG(o[DG.k],n)})) bad=true});
        return !bad}
      var swT=null, swEl=null;
      try{el.setPointerCapture(pid)}catch(_){}
      el.classList.add('moving');
      var mv=function(ev){
        if(ev.pointerId!==pid||P.used) return;
        var dx=Math.round((ev.clientX-sx)/cw), dy=Math.round((ev.clientY-sy)/ch), n=g0.slice();
        if(grp){
          if(dx!==gd[0]||dy!==gd[1]){if(grpAt(dx,dy)) gd=[dx,dy];else if(grpAt(dx,gd[1])) gd=[dx,gd[1]];else if(grpAt(gd[0],dy)) gd=[gd[0],dy]}
          grp.forEach(function(m){if(m.el) dashStyle(m.el,[m.g0[0]+gd[0],m.g0[1]+gd[1],m.g0[2],m.g0[3]])});
          dashGuides(it,[g0[0]+gd[0],g0[1]+gd[1],g0[2],g0[3]]);return}
        if(mode==='mv'){n[0]=clamp(g0[0]+dx,0,DG.x-g0[2]);n[1]=clamp(g0[1]+dy,0,DG.y-g0[3])}
        else{n[2]=clamp(g0[2]+dx,mn[0],DG.x-g0[0]);n[3]=clamp(g0[3]+dy,mn[1],DG.y-g0[1])}
        // over another widget: drop here to swap places with it
        var st=null;
        if(mode==='mv'&&dashHits(it,n)){
          var br=el.parentNode.getBoundingClientRect(),gx=Math.floor((ev.clientX-br.left)/cw),gy=Math.floor((ev.clientY-br.top)/ch);
          C.board.forEach(function(o){var q=o[DG.k];if(o!==it&&q&&gx>=q[0]&&gx<q[0]+q[2]&&gy>=q[1]&&gy<q[1]+q[3]) st=o});
        }
        if(st!==swT){
          if(swEl) swEl.classList.remove('swapt');
          swT=st;swEl=null;
          if(swT){bdW.forEach(function(w){if(w.it===swT) swEl=w.el});if(swEl) swEl.classList.add('swapt');dialBuzz()}
        }
        if(swT){el.classList.add('swapping');dashStyle(el,n);dashGuides(null);return}
        el.classList.remove('swapping');
        if(dashHits(it,n)){
          var nx=n.slice();nx[1]=g1[1];nx[3]=g1[3];
          var ny=n.slice();ny[0]=g1[0];ny[2]=g1[2];
          if(!dashHits(it,nx)) n=nx; else if(!dashHits(it,ny)) n=ny; else n=g1.slice();
        }
        g1=n;dashStyle(el,n);dashGuides(it,n);
      };
      var up=function(ev){
        if(ev.pointerId!==pid) return;
        var tap=Math.hypot(ev.clientX-sx,ev.clientY-sy)<6;
        el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
        el.classList.remove('moving','bad');
        delete P.pts[pid];
        if(P.used){if(!P.on){P.used=false;P.pts={}}dashGuides(null);return}
        dashGuides(null);
        if(tap&&ev.type==='pointerup'&&BD_SEL.length&&mode==='mv'){var si=BD_SEL.indexOf(it);if(si>=0){if(BD_SEL.length>1) BD_SEL.splice(si,1)}else BD_SEL.push(it);
          bdPick=it;bdPickAt=Date.now();syncBoard();toast(BD_SEL.length+' selected');return}
        if(tap&&ev.type==='pointerup'&&MSZ&&mode==='mv'){if(MSZ.src===it) matchEnd();else matchApply(it,el);return}
        if(tap&&ev.type==='pointerup'){bdPick=(bdPick===it&&mode==='mv')?null:it;bdPickAt=Date.now();syncBoard();return}
        if(grp){
          if(gd[0]||gd[1]){var snp=JSON.parse(JSON.stringify(C.board));grp.forEach(function(m){snp[C.board.indexOf(m.o)][DG.k]=m.g0.slice()});
            BD_UNDO.push({board:snp,msg:'Group move undone.'});if(BD_UNDO.length>20)BD_UNDO.shift();
            grp.forEach(function(m){m.o[DG.k]=[m.g0[0]+gd[0],m.g0[1]+gd[1],m.g0[2],m.g0[3]]});save()}
          syncBoard();return}
        if(bdPick!==it) bdPickAt=Date.now();
        bdPick=it;
        el.classList.remove('swapping');
        if(swT){
          var so=swT, sg=so[DG.k].slice(), mo=dmin(so);swT=null;if(swEl) swEl.classList.remove('swapt');swEl=null;
          if(ev.type==='pointerup'&&sg[2]>=mn[0]&&sg[3]>=mn[1]&&g0[2]>=mo[0]&&g0[3]>=mo[1]){
            var snap2=JSON.parse(JSON.stringify(C.board));snap2[C.board.indexOf(it)][DG.k]=g0.slice();
            BD_UNDO.push({board:snap2,msg:'Swap undone.'});if(BD_UNDO.length>20)BD_UNDO.shift();
            it[DG.k]=sg;so[DG.k]=g0.slice();save();syncBoard();feedback('ok');return}
          if(ev.type==='pointerup') toast('Too small to swap there.');
          dashStyle(el,g0);dashFit();return}
        if(dashHits(it,g1)){dashStyle(el,g0)}else if(g1.join()!==g0.join()){
          var snap=JSON.parse(JSON.stringify(C.board));snap[C.board.indexOf(it)][DG.k]=g0.slice();
          BD_UNDO.push({board:snap,msg:mode==='mv'?'Move undone.':'Size undone.'});if(BD_UNDO.length>20)BD_UNDO.shift();
          it[DG.k]=g1;save();syncBoard();return}
        dashFit();
      };
      el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
      e.preventDefault();
    });
  }
  // Match size: pick a widget, then tap others to give them its size (where there is room)
  var MSZ=null;
  function matchStart(it){
    MSZ={src:it};var b=document.getElementById('msBar');
    if(!b){b=document.createElement('div');b.id='msBar';b.setAttribute('role','status');b.innerHTML='<span class="ms-t"></span> <b></b><button class="btn" type="button"></button>';document.body.appendChild(b);
      b.querySelector('button').textContent='Done';b.querySelector('button').addEventListener('click',matchEnd)}
    b.querySelector('.ms-t').textContent='Tap widgets to give them this size:';b.querySelector('b').textContent=it[DG.k][2]+' \u00d7 '+it[DG.k][3];
    b.classList.add('on');document.documentElement.classList.add('matching');bdPick=it;bdPickAt=Date.now();syncBoard();
  }
  function matchEnd(){MSZ=null;var b=document.getElementById('msBar');if(b) b.classList.remove('on');document.documentElement.classList.remove('matching');if(typeof syncBoard==='function') syncBoard()}
  function matchApply(it,el){
    var s0=MSZ.src[DG.k], g=it[DG.k];if(!s0||!g) return;
    var w=s0[2], h=s0[3], mn=dmin(it);
    if(w<mn[0]||h<mn[1]){toast('Too small for this widget.');el.animate&&el.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:220});return}
    if(g[2]===w&&g[3]===h) return;
    var tries=[[g[0],g[1]],[g[0]+g[2]-w,g[1]],[g[0],g[1]+g[3]-h],[g[0]+g[2]-w,g[1]+g[3]-h],[Math.round(g[0]+g[2]/2-w/2),Math.round(g[1]+g[3]/2-h/2)]], n=null;
    tries.forEach(function(p){if(n) return;var q=[clamp(p[0],0,DG.x-w),clamp(p[1],0,DG.y-h),w,h];if(!dashHits(it,q)) n=q});
    if(!n){toast('No room for that size here.');dialBuzz();el.animate&&el.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:220});return}
    var snap=JSON.parse(JSON.stringify(C.board));
    BD_UNDO.push({board:snap,msg:'Size undone.'});if(BD_UNDO.length>20)BD_UNDO.shift();
    it[DG.k]=n;save();dialBuzz();syncBoard();
  }
  function dashPinch(el,it,P,e0){
    var ids=Object.keys(P.pts), a=P.pts[ids[0]], b=P.pts[ids[1]];
    var g0=it[DG.k].slice(), g1=g0.slice(), mn=dmin(it), d0x=Math.abs(a.x-b.x), d0y=Math.abs(a.y-b.y);
    P.on=true;P.used=true;
    try{el.setPointerCapture(e0.pointerId)}catch(_){}
    dashStyle(el,g0);dashGuides(null);el.classList.remove('moving');el.classList.add('pinch');
    var lab=document.createElement('div');lab.className='dw-psz';el.appendChild(lab);
    var show=function(g){lab.textContent=g[2]+' \u00d7 '+g[3]};show(g0);
    var mv=function(ev){
      if(!P.pts[ev.pointerId]) return;
      P.pts[ev.pointerId]={x:ev.clientX,y:ev.clientY};
      var k=Object.keys(P.pts);if(k.length<2) return;
      var p=P.pts[k[0]], q=P.pts[k[1]];
      var w=clamp(g0[2]+Math.round((Math.abs(p.x-q.x)-d0x)/DCELL.w),mn[0],DG.x), h=clamp(g0[3]+Math.round((Math.abs(p.y-q.y)-d0y)/DCELL.h),mn[1],DG.y);
      var n=[clamp(Math.round(g0[0]+g0[2]/2-w/2),0,DG.x-w),clamp(Math.round(g0[1]+g0[3]/2-h/2),0,DG.y-h),w,h];
      if(n.join()===g1.join()) return;
      if(dashHits(it,n)){el.classList.add('bad');return}
      el.classList.remove('bad');g1=n;dashStyle(el,n);show(n);dialBuzz();
    };
    var end=function(ev){
      if(!P.pts[ev.pointerId]) return;
      delete P.pts[ev.pointerId];
      el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);
      P.on=false;if(!Object.keys(P.pts).length) P.used=false;
      el.classList.remove('pinch','bad');lab.remove();
      if(g1.join()!==g0.join()){
        var snap=JSON.parse(JSON.stringify(C.board));snap[C.board.indexOf(it)][DG.k]=g0.slice();
        BD_UNDO.push({board:snap,msg:'Size undone.'});if(BD_UNDO.length>20)BD_UNDO.shift();
        it[DG.k]=g1;bdPick=it;bdPickAt=Date.now();save();syncBoard();
      }else dashStyle(el,g0);
    };
    el.addEventListener('pointermove',mv);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  }
  function dashPlace(el,it){
    el.classList.add('dw');
    if(it.k==='e') el.classList.add('estopw');
    dashStyle(el,it[DG.k]);
    if(bdEditing){
      el.classList.add('dw-ed');if(it===bdPick) el.classList.add('sel');if(BD_SEL.indexOf(it)>=0) el.classList.add('gsel');
      var rs=document.createElement('div');rs.className='dw-rs';rs.setAttribute('aria-hidden','true');el.appendChild(rs);
      var rsz=function(){var m=Math.floor(Math.min(el.clientWidth,el.clientHeight)*0.42);rs.style.width=rs.style.height=Math.max(18,Math.min(44,m))+'px'};
      rsz();if(window.requestAnimationFrame) requestAnimationFrame(rsz);el.__rsz=rsz;
      dashDrag(el,it);
    }
  }
  function bdMove(it,d){
    var n=C.board.indexOf(it), m=n+d;if(n<0||m<0||m>=C.board.length) return;
    var t=C.board[n];C.board[n]=C.board[m];C.board[m]=t;save();syncBoard();
  }
  // ---- Edit mode pro: duplicate a widget, select several and move them together, TalkBack labels ----
  var BD_SEL=[];
  function bdChans(){var u={};C.board.forEach(function(o){['c','d','e','f','pc'].forEach(function(k){if(typeof o[k]==='number'&&o[k]>=0) u[o[k]]=1});if(Array.isArray(o.t)) o.t.forEach(function(z){u[z.c]=1})});return u}
  function bdDup(it){
    if(it.k==='e'){toast('There is only one emergency stop.');return}
    var q=C.board.indexOf(it);if(q<0) return;
    var cp=JSON.parse(JSON.stringify(it));Object.keys(cp).forEach(function(k){if(k.charAt(0)==='_') delete cp[k]});
    delete cp.g;delete cp.gp;delete cp.lbl;
    if(cp.k==='tl'){var tsrc=tlOf(it);if(!tsrc||C.tl.length>=MAX_TL){toast('Up to 10 timelines. Remove one first.');return}var tnew=JSON.parse(JSON.stringify(tsrc));tnew.id=uid();tnew.name=(tsrc.name+' 2').slice(0,20);C.tl.push(tnew);cp.tl=tnew.id}
    var moved=false;
    if(typeof cp.c==='number'&&cp.c>=0&&!(typeof cp.d==='number'&&cp.d>=0)&&!cp.t){
      var u=bdChans(),act=activeIdx(),pos=act.indexOf(it.c);
      for(var i=1;i<=act.length;i++){var c2=act[(pos+i+act.length)%act.length];if(c2!==it.c&&!u[c2]){cp.c=c2;moved=true;break}}
      if(moved&&typeof cp.pc==='number') delete cp.pc;
    }
    BD_UNDO.push({board:JSON.parse(JSON.stringify(C.board)),msg:'Copy undone.'});if(BD_UNDO.length>20) BD_UNDO.shift();
    C.board.splice(q+1,0,cp);
    if(dashOn()) dashAuto();
    bdPick=cp;bdPickAt=Date.now();save();syncBoard();feedback('success');
    toast(moved?'Copied to channel '+tagOf(cp.c)+'.':'Copied. The copy uses the same channel.');
  }
  function bdGroupTog(it){
    if(BD_SEL.length){BD_SEL=[];toast('Group cleared.')}
    else{BD_SEL=[it];toast('Tap other widgets to add them, then drag one to move them together.',4000)}
    syncBoard();
  }
  // ---- Change a widget's channels while editing: tap the channel chip (quick pop-over) or use the named list ----
  var CHKN={s:'Slider',j:'Joystick',d:'Double stick',l:'Light',b:'Turbo',t:'Toggle',m:'Mix',w:'Switch',a:'Auto-stop',y:'Ramp',f:'Meter',i:'Bar meter',k:'Graph',n:'Dial',g:'Gear',lv:'Lever',st:'Steering wheel',xy:'XY pad',xf:'Crossfader',ro:'Rotor',ax:'Motor axle',sw:'Swing angle',dp:'D-pad',lx:'LED widget'};
  function chName(o){return o.lbl||CHKN[o.k]||'Widget'}
  function chRoles(it){
    var k=it.k,tk=it.m==='tank';
    if(k==='m') return (Array.isArray(it.t)?it.t:[]).map(function(z,j){return {k:'t'+j,l:'Channel '+(j+1)}});
    if(k==='j') return tk?[{k:'c',l:'Left motor'},{k:'d',l:'Right motor',none:1}]:[{k:'c',l:'Up / down'},{k:'d',l:'Left / right',none:1}];
    if(k==='d') return tk?[{k:'c',l:'Left stick: left motor'},{k:'d',l:'Left stick: right motor',none:1},{k:'e',l:'Right stick: left motor'},{k:'f',l:'Right stick: right motor',none:1}]
      :[{k:'c',l:'Left stick: up / down'},{k:'d',l:'Left stick: left / right',none:1},{k:'e',l:'Right stick: up / down'},{k:'f',l:'Right stick: left / right',none:1}];
    if(k==='dp') return it.m==='car'?[{k:'c',l:'Drive'},{k:'d',l:'Steer',none:1}]:[{k:'c',l:'Left motor'},{k:'d',l:'Right motor',none:1}];
    if(k==='w') return [{k:'c',l:'Output A'},{k:'d',l:'Output B'}];
    if(k==='xy') return it.m==='tank'?[{k:'c',l:'Left motor'},{k:'d',l:'Right motor'}]:[{k:'c',l:'X (left / right)'},{k:'d',l:'Y (up / down)'}];
    if(k==='xf') return [{k:'c',l:'Left side'},{k:'d',l:'Right side'}];
    if(k==='lx') return it.t==='tk'?[]:[{k:'c',l:'Channel'}];
    if(['s','l','b','t','a','y','f','i','k','n','g','lv','st','ro','ax','sw'].indexOf(k)>=0) return [{k:'c',l:k==='l'?'Light channel':k==='sw'?'Swing channel':'Channel'}];
    return [];
  }
  function chIsT(k){return /^t\d$/.test(k)}
  function chGet(it,k){if(chIsT(k)){var z=it.t[+k.charAt(1)];return z?z.c:-1}return typeof it[k]==='number'?it[k]:-1}
  function chPut(it,k,v){if(chIsT(k)){var j=+k.charAt(1);it.t[j].c=v;if(!j) it.c=v}else it[k]=v}
  function chOfIt(o){var u=[];['c','d','e','f','pc'].forEach(function(k){if(typeof o[k]==='number'&&o[k]>=0) u.push(o[k])});
    if(Array.isArray(o.cs)) o.cs.forEach(function(q){if(q>=0) u.push(q)});if(Array.isArray(o.t)) o.t.forEach(function(z){if(z&&typeof z.c==='number') u.push(z.c)});return u}
  function chUsers(v,me){var r=[];C.board.forEach(function(o){if(o!==me&&chOfIt(o).indexOf(v)>=0) r.push(chName(o))});return r}
  // the core change, no questions asked; false when it is not allowed
  function chSet(it,k,v){
    var old=chGet(it,k);if(v===old) return true;
    var R=chRoles(it),me=null,sib=null;
    R.forEach(function(r){if(r.k===k) me=r;else if(v>=0&&chGet(it,r.k)===v) sib=r});
    if(!me||(v<0&&!me.none)) return false;
    if(sib){if(old<0&&!sib.none){toast('Pick different channels.');return false}chPut(it,sib.k,old)}
    if(it.k==='sw'&&C.board.some(function(o){return o!==it&&o.k==='sw'&&o.c===v})){toast('This channel already has a swing angle widget.');return false}
    if(k==='c'&&old>=0&&v>=0){
      // same-hub extras (second channel, extra lines, LED steering) move to the new hub with the widget
      var dh=(Math.floor(v/PER)-Math.floor(old/PER))*PER;
      if(typeof it.pc==='number'){it.pc+=dh;if(it.pc===v||it.pc<0||it.pc>=NMAX){delete it.pc;delete it.pi}}
      if(Array.isArray(it.cs)){it.cs=it.cs.map(function(q){return q+dh}).filter(function(q){return q!==v&&q>=0&&q<NMAX});if(!it.cs.length) delete it.cs}
      if(it.k==='lx'&&typeof it.d==='number'){it.d+=dh;if(it.d===v||it.d<0||it.d>=NMAX) delete it.d}
    }
    chPut(it,k,v);
    if(v>=0&&it.k==='l'&&C.ch[v].kind!=='light'){C.ch[v].kind='light';syncChannel(v)}
    if(old>=0&&chOfIt(it).indexOf(old)<0) setT(old,0,false);
    if(it.k==='a') AUTOT[it.c]=0;
    return true;
  }
  function chShare(v,us,go){
    var old=document.getElementById('chShare');if(old) old.remove();
    var ov=document.createElement('div');ov.id='chShare';ov.className='gedit';
    var bx=document.createElement('div');bx.className='gbox ch-sh';ov.appendChild(bx);
    bx.innerHTML='<h3><span>⚠ </span><span></span> <i class="bdw-chip"></i></h3><p class="note"><span></span> <b class="ch-u"></b></p><p class="note"></p><div class="gact"><button class="btn" type="button" data-a="x"></button><button class="btn" type="button" aria-pressed="true" data-a="go"></button></div>';
    var h=bx.querySelectorAll('h3 span');h[1].textContent='This channel is already used';bx.querySelector('h3 .bdw-chip').textContent=tagOf(v);
    var p=bx.querySelectorAll('p');p[0].querySelector('span').textContent='Also used by:';p[0].querySelector('.ch-u').textContent=us[0];if(us.length>1) p[0].appendChild(document.createTextNode(' +'+(us.length-1)));
    p[1].textContent='Both widgets will drive the same channel. The last one you touch wins.';
    bx.querySelector('[data-a=x]').textContent='Cancel';bx.querySelector('[data-a=go]').textContent='Share channel';
    bx.querySelector('[data-a=x]').addEventListener('click',function(){ov.remove()});
    bx.querySelector('[data-a=go]').addEventListener('click',function(){ov.remove();go()});
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    document.body.appendChild(ov);
  }
  function chApply(it,k,v,after){
    if(v===chGet(it,k)){if(after) after();return}
    var go=function(){
      var snap=JSON.parse(JSON.stringify(C.board));
      if(!chSet(it,k,v)) return;
      BD_UNDO.push({board:snap,msg:'Channel change undone.'});if(BD_UNDO.length>20) BD_UNDO.shift();
      save();syncBoard();feedback('ok');
      if(v>=0) toast(tagOf(v)+' · '+C.ch[v].name);
      if(after) after();
    };
    var us=v>=0?chUsers(v,it):[];
    if(us.length) chShare(v,us,go); else go();
  }
  function chMk(tag,txt,cls){var e=document.createElement(tag);if(txt) e.textContent=txt;if(cls) e.className=cls;return e}
  function chHubRow(slots,hub,fn){
    var hr=chMk('div','','chp-h');
    slots.forEach(function(s){var b=chMk('button','','btn');b.type='button';b.appendChild(chMk('span','Hub'));b.appendChild(document.createTextNode(' M'+(C.hubs[s]+1)));
      b.setAttribute('aria-pressed',String(s===hub));b.addEventListener('click',function(e){e.stopPropagation();fn(s)});hr.appendChild(b)});
    return hr;
  }
  // option 1: a small pop-over right under the chip
  function chPop(it,anchor,k0){
    var R=chRoles(it);if(!R.length) return;
    var old=document.getElementById('chPop');if(old) old.remove();
    var ov=chMk('div','','chpop-ov');ov.id='chPop';
    var bx=chMk('div','','chpop');bx.setAttribute('role','dialog');bx.setAttribute('aria-label','Change channel');ov.appendChild(bx);
    var rk=k0||R[0].k, slots=activeSlots(), c0=chGet(it,rk), hub=c0>=0?Math.floor(c0/PER):(slots[0]||0);
    if(slots.indexOf(hub)<0) slots=slots.concat([hub]);
    var close=function(){ov.remove()};
    function paint(){
      bx.innerHTML='';
      var role=R.filter(function(r){return r.k===rk})[0], cur=chGet(it,rk);
      if(R.length>1){
        var rr=chMk('div','','chp-r');
        R.forEach(function(r){var v=chGet(it,r.k),b=chMk('button','','btn');b.type='button';b.appendChild(chMk('span',r.l));b.appendChild(chMk('b',v>=0?tagOf(v):'–'));
          b.setAttribute('aria-pressed',String(r.k===rk));b.addEventListener('click',function(e){e.stopPropagation();rk=r.k;var c2=chGet(it,rk);if(c2>=0) hub=Math.floor(c2/PER);paint()});rr.appendChild(b)});
        bx.appendChild(rr);
      }else bx.appendChild(chMk('div',role.l,'chp-t'));
      if(slots.length>1) bx.appendChild(chHubRow(slots,hub,function(s){hub=s;paint()}));
      var g=chMk('div','','chp-g');
      for(var q=0;q<PER;q++)(function(i){
        var b=chMk('button','','btn');b.type='button';b.appendChild(chMk('b',L[q]));b.appendChild(chMk('small',C.ch[i].name));
        var us=chUsers(i,it);if(us.length) b.classList.add('used');
        b.setAttribute('aria-pressed',String(i===cur));b.setAttribute('aria-label',tagOf(i)+' · '+C.ch[i].name);
        b.addEventListener('click',function(e){e.stopPropagation();close();chApply(it,rk,i)});g.appendChild(b);
      })(hub*PER+q);
      bx.appendChild(g);
      var ft=chMk('div','','chp-f');
      if(role.none){var nb=chMk('button','None','btn');nb.type='button';nb.setAttribute('aria-pressed',String(cur<0));nb.addEventListener('click',function(e){e.stopPropagation();close();chApply(it,rk,-1)});ft.appendChild(nb)}
      ft.appendChild(chMk('span','● used by another widget','chp-k'));
      var lb=chMk('button','Names ›','btn chp-n');lb.type='button';lb.addEventListener('click',function(e){e.stopPropagation();close();chList(it,rk,function(v){chApply(it,rk,v)})});ft.appendChild(lb);
      bx.appendChild(ft);
    }
    paint();
    ov.addEventListener('pointerdown',function(e){if(e.target===ov){e.preventDefault();close()}});
    document.body.appendChild(ov);
    var r=anchor&&anchor.getBoundingClientRect?anchor.getBoundingClientRect():{left:20,top:60,bottom:60},W=bx.offsetWidth,H=bx.offsetHeight,vw=window.innerWidth,vh=window.innerHeight;
    var x=Math.max(8,Math.min(vw-W-8,r.left-10)), y=r.bottom+8;if(y+H>vh-8) y=Math.max(8,r.top-H-8);
    bx.style.left=x+'px';bx.style.top=y+'px';
  }
  // option 3: the named list (channel names and which widget uses each one)
  function chList(it,rk,pick){
    var R=chRoles(it),role=R.filter(function(r){return r.k===rk})[0];if(!role) return;
    var old=document.getElementById('chList');if(old) old.remove();
    var ov=chMk('div','','gedit');ov.id='chList';
    var bx=chMk('div','','gbox chl');ov.appendChild(bx);
    var slots=activeSlots(), cur=chGet(it,rk), hub=cur>=0?Math.floor(cur/PER):(slots[0]||0);
    if(slots.indexOf(hub)<0) slots=slots.concat([hub]);
    function paint(){
      bx.innerHTML='';
      var h=chMk('h3');h.appendChild(chMk('span','Channels'));if(R.length>1||role.l!=='Channel'){h.appendChild(document.createTextNode(' · '));h.appendChild(chMk('span',role.l))}bx.appendChild(h);
      if(slots.length>1) bx.appendChild(chHubRow(slots,hub,function(s){hub=s;paint()}));
      var ls=chMk('div','','chl-l');
      var row=function(i){
        var b=chMk('button','','chl-r');b.type='button';
        b.appendChild(chMk('i',i>=0?tagOf(i):'–','bdw-chip'));b.appendChild(chMk('span',i>=0?C.ch[i].name:'None','chl-n'));
        var us=i>=0?chUsers(i,it):[],em=chMk('em','','chl-u');
        if(i===cur){em.appendChild(chMk('span','✓ this widget'));em.className='chl-u me';b.classList.add('me')}
        else if(us.length){em.appendChild(chMk('span',us[0]));if(us.length>1) em.appendChild(document.createTextNode(' +'+(us.length-1)));em.className='chl-u used'}
        else if(i>=0) em.appendChild(chMk('span','free'));
        b.appendChild(em);b.setAttribute('aria-pressed',String(i===cur));
        b.addEventListener('click',function(){ov.remove();if(i!==cur) pick(i)});ls.appendChild(b);
      };
      for(var q=0;q<PER;q++) row(hub*PER+q);
      if(role.none) row(-1);
      bx.appendChild(ls);
      bx.appendChild(chMk('p','Channel settings (name, reverse, limit) stay with each channel.','note'));
      var cn=chMk('button','Cancel','btn');cn.type='button';cn.addEventListener('click',function(){ov.remove()});bx.appendChild(cn);
    }
    paint();
    ov.addEventListener('click',function(e){if(e.target===ov) ov.remove()});
    document.body.appendChild(ov);
  }
  var KNAME={sw:'Swing angle',tl:'Timeline',s:'Slider',j:'Joystick',d:'Dual joystick',b:'Button',t:'Toggle',m:'Meter',f:'Arc meter',g:'Gear',lv:'Lever',st:'Steering wheel',e:'Emergency stop',xy:'XY pad',xf:'Crossfader',ro:'Rotor',ax:'Motor axle',a:'Light'};
  function bdA11y(el,it){
    var hs=el.querySelector('.bdw-h > span'), nm=(it.lbl)||(hs&&(hs.title||hs.textContent))||KNAME[it.k]||'Widget';
    if(it.lbl&&KNAME[it.k]) nm=it.lbl+', '+KNAME[it.k];
    if(typeof it.c==='number'&&it.c>=0&&C.ch[it.c]&&!/·/.test(nm)) nm+=', channel '+tagOf(it.c)+' '+C.ch[it.c].name;
    el.setAttribute('role','group');el.setAttribute('aria-label',nm);
    var sv0=el.querySelectorAll('svg');
    for(var i=0;i<sv0.length;i++){var g=sv0[i];if(g.getAttribute('aria-hidden')==='true'||g.closest('button')) continue;g.setAttribute('role','img');g.setAttribute('aria-label',nm)}
  }
  function bdToolbar(it){
    var ed=document.createElement('div');ed.className='bdw-ed';
    var dash=dashOn();
    // like the sideways board: only the widget you tapped shows its tools, as round buttons over its corner
    if(dash&&it!==bdPick){ed.classList.add('empty');return ed}
    var defs=dash?[]:[['◀','Move earlier',function(){bdMove(it,-1)}],['▶','Move later',function(){bdMove(it,1)}]];
    if(!dash&&it.k!=='d') defs.push([(it.w===2?'2':'1')+'\u00d7'+(it.h===2?'2':'1'),'Size',function(){
      var sz=(it.w===2?2:1)+'x'+(it.h===2?2:1), nx={'1x1':'2x1','2x1':'1x2','1x2':'2x2','2x2':'1x1'}[sz];
      it.w=+nx[0];if(nx[2]==='2') it.h=2; else delete it.h;save();syncBoard();toast('Size '+nx.replace('x','\u00d7'))}]);
    if(it.k==='s'||it.k==='m') defs.push(['\u2195','Vertical or horizontal',function(){it.v=!it.v;if(dashOn()) dashRefit(it);save();syncBoard()},!!it.v]);
    if(it.k==='s'||it.k==='j'||it.k==='d'||it.k==='m') defs.push(['0','Return to 0 on release',function(){
      it.hold=!it.hold;
      (it.t?it.t.map(function(z){return z.c}):[it.c,it.d,it.e,it.f]).forEach(function(q){if(q!==undefined&&q>=0) setT(q,0,false)});
      save();syncBoard();
    },!it.hold]);
    if(it.k==='d') defs.push(['\u2699','Joystick settings',function(){jcShow(it)}]);
    if(it.k==='tl') defs.push(['\u223F','Edit timeline',function(){tlEdit(it)}]);
    if(dashOn()&&it[DG.k]) defs.push(['\u25A3','Match size',function(){matchStart(it)}]);
    if(it.k==='g'||it.k==='lv') defs.push(['\u2699','Gear settings',function(){gearEdit(it)}]);
    else if(WSPEC[it.k]) defs.push(['\u2699','Widget settings',function(){wsEdit(it)}]);
    if(it.k!=='e') defs.push(['\u270E','Rename widget',function(e){bdRename(it,e.target.closest('.bdw-h'))}]);
    if(it.k!=='e') defs.push(['\u29C9','Duplicate',function(){bdDup(it)}]);
    if(dash) defs.push(['\u229E','Select several',function(){bdGroupTog(it)},BD_SEL.length>0]);
    defs.push(['✕','Remove',function(){var q=C.board.indexOf(it);if(q>=0){BD_UNDO.push({it:JSON.parse(JSON.stringify(it)),q:q});if(BD_UNDO.length>20)BD_UNDO.shift();C.board.splice(q,1)}save();syncBoard()}]);
    defs.forEach(function(d){
      var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=d[0];b.setAttribute('aria-label',d[1]);
      if(d.length>3) b.setAttribute('aria-pressed',String(d[3]));
      b.addEventListener('click',function(e){if(dashOn()&&Date.now()-bdPickAt<150){e.preventDefault();return}d[2](e)});ed.appendChild(b);
    });
    return ed;
  }
  function bdTrim(el,c){
    var bx=document.createElement('div');bx.className='bdw-trim';
    var m=document.createElement('button'),v=document.createElement('b'),p=document.createElement('button');
    m.type=p.type='button';m.className=p.className='trb';m.textContent='\u25C0';p.textContent='\u25B6';
    m.setAttribute('aria-label','Trim left');p.setAttribute('aria-label','Trim right');
    function show(){var t=C.ch[c].trim||0;v.textContent=t?((t>0?'+':'')+t):'0';v.className=t?'on':''}
    function bump(d){var t=Math.max(-20,Math.min(20,(C.ch[c].trim||0)+d));if(t===(C.ch[c].trim||0)) return;C.ch[c].trim=t;show();noteInput();feedback('dial');clearTimeout(bx._sv);bx._sv=setTimeout(save,600)}
    m.addEventListener('click',function(e){e.stopPropagation();bump(-1)});p.addEventListener('click',function(e){e.stopPropagation();bump(1)});
    v.addEventListener('click',function(e){e.stopPropagation();if(C.ch[c].trim){C.ch[c].trim=0;show();save();toast('Trim reset to 0.')}});
    v.setAttribute('title','Trim · tap to reset');
    bx.appendChild(m);bx.appendChild(v);bx.appendChild(p);el.appendChild(bx);show();
  }
  function bdRename(it,head){
    if(!head||head.querySelector('.bdw-lbl')) return;
    var inp=document.createElement('input');inp.type='text';inp.className='bdw-lbl txt';inp.maxLength=20;
    inp.placeholder='Widget name (empty = default)';inp.setAttribute('aria-label','Widget name');inp.autocomplete='off';
    inp.value=it.lbl||'';head.appendChild(inp);
    var done=false;
    function fin(save){
      if(done) return;done=true;
      if(save){var v=inp.value.replace(/\s+/g,' ').trim().slice(0,20);if(v) it.lbl=v; else delete it.lbl;save_();}
      syncBoard();
    }
    function save_(){save()}
    inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();fin(true)}else if(e.key==='Escape'){e.preventDefault();fin(false)}});
    inp.addEventListener('blur',function(){fin(true)});
    inp.addEventListener('pointerdown',function(e){e.stopPropagation()});
    setTimeout(function(){try{inp.focus();inp.select()}catch(_){}},0);
  }
  function bdHead(el,text,it,withOut){
    if(!text&&!bdEditing&&!withOut) return null;
    var head=document.createElement('div');head.className='bdw-h';
    var CRs=it?chRoles(it):[];
    var mkChip=function(t){var c0=document.createElement('i');c0.className='bdw-chip';c0.textContent=t;
      if(CRs.length){c0.classList.add('tap');c0.setAttribute('role','button');c0.setAttribute('aria-label','Change channel');
        c0.addEventListener('pointerdown',function(e){e.stopPropagation()});c0.addEventListener('click',function(e){e.stopPropagation();e.preventDefault();chPop(it,c0)})}
      return c0};
    var nm=document.createElement('span');nm.textContent=(it&&it.lbl)||text||'';if(it&&it.lbl) nm.title=text||'';
    else if(text){
      // "Dial · A · Left wheel" becomes a channel chip plus the channel name; the full text stays as the tooltip
      var cm=/^(?:(.+?)\s\u00b7\s)?((?:M\d)?[A-F])\s\u00b7\s(.+)$/.exec(text);
      if(cm){nm.title=text;nm.textContent='';nm.appendChild(mkChip(cm[2]));nm.appendChild(document.createTextNode(cm[3]))}
    }
    // every widget with channels gets a chip; tapping it opens the channel pop-over, while editing or driving
    if(CRs.length&&!nm.querySelector('.bdw-chip')){var tg=CRs.map(function(r){return chGet(it,r.k)}).filter(function(v){return v>=0}).map(tagOf);if(tg.length) nm.insertBefore(mkChip(tg[0]+(tg.length>1?'+':'')),nm.firstChild)}
    head.appendChild(nm);
    var out=null;
    // upright board: the tools sit on the widget itself (not dimmed with its title when no hub is connected)
    if(bdEditing) (dashOn()?head:el).appendChild(bdToolbar(it));
    else if(withOut){out=document.createElement('output');out.textContent='0';head.appendChild(out)}
    el.appendChild(head);
    return out;
  }
  // fingers on the screen: the board is rebuilt only when none is down, so a switch never freezes a control being held
  var GPD={},GPEND=false;
  window.addEventListener('pointerdown',function(e){GPD[e.pointerId]=1},true);
  var gpUp=function(e){delete GPD[e.pointerId];if(GPEND&&!Object.keys(GPD).length){GPEND=false;syncBoard()}};
  window.addEventListener('pointerup',gpUp,true);window.addEventListener('pointercancel',gpUp,true);
  function bdRebuild(){if(Object.keys(GPD).length) GPEND=true; else syncBoard()}
  // Stick, XY pad and D-pad: "Swipe to other pairs" - swipe sideways on the card (not on the control) to move the
  // widget to the next pair of channels; the dots show which pair it drives
  function swPairs(el,it,ctl){
    var ch=activeIdx(),prs=[];
    for(var q=0;q<ch.length;q+=2) prs.push([ch[q],ch[q+1]===undefined?-1:ch[q+1]]);
    var cur=-1;prs.forEach(function(pr,qi){if(pr[0]===it.c) cur=qi});
    if(!it.sw||prs.length<2||cur<0) return;
    var dg=document.createElement('div');dg.className='dialdots';
    prs.forEach(function(pr,qi){var di=document.createElement('i');if(qi===cur) di.className='on';di.title=tagOf(pr[0])+(pr[1]>=0?'+'+tagOf(pr[1]):'');if(qi>0&&((pr[0]/PER)|0)!==((prs[qi-1][0]/PER)|0)) di.style.marginLeft='6px';dg.appendChild(di)});
    el.appendChild(dg);
    var sx=null,sy=0;el.style.touchAction='pan-y';
    el.addEventListener('pointerdown',function(e){if(bdEditing||(e.target.closest&&e.target.closest(ctl))){sx=null;return}sx=e.clientX;sy=e.clientY});
    el.addEventListener('pointerup',function(e){
      if(sx===null) return;var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
      if(Math.abs(dx)>36&&Math.abs(dx)>1.6*Math.abs(dy)&&!S.estop&&!S.play){
        if([it.c,it.d].some(function(c){return c>=0&&Math.abs(rt.t[c]||0)>1})&&!it.hold&&!it.hd) return;
        var nx=(cur+(dx<0?1:prs.length-1))%prs.length,np=prs[nx];
        CRZ.skip=true;[it.c,it.d].forEach(function(c){if(c>=0){delete CRZ.v[c];setT(c,0,false)}});CRZ.skip=false;
        it.c=np[0];it.d=np[1];BD_SL={it:it,d:dx<0?1:-1};save();feedback('ok');bdRebuild();
      }
    });
    el.addEventListener('pointercancel',function(){sx=null});
  }
  // XY pad: the pair dots sit just under the pad's bottom LED rail, wherever the pad is drawn in its card
  function xyDots(w){var el=w.el,dg=el&&el.__xyd,sg=el&&el.querySelector('svg.xwv');if(!dg||!sg||!el.isConnected) return;
    var eb=el.getBoundingClientRect(),b=sg.getBoundingClientRect(),k=Math.min(b.width/300,b.height/260),bot=w.it.nr?222:236;
    var y=b.top-eb.top-el.clientTop+(b.height-260*k)/2+bot*k+4,key=Math.round(y)+','+Math.round(eb.width);
    if(dg.__k!==key){dg.__k=key;dg.style.top=Math.round(y)+'px'}}
  // a channel muted on a Levels (EQ) widget stays muted only while that widget is on the board, so a mute is never hidden
  function muteTidy(){
    var eq={};(C.board||[]).forEach(function(it){if(it.k==='lx'&&it.t==='eq'){eq[it.c]=1;(it.cs||[]).forEach(function(q){eq[q]=1})}});
    Object.keys(MUTE).forEach(function(k){if(!eq[k]) delete MUTE[k]});
  }
  function syncBoard(){
    window.__bdGen=(window.__bdGen||0)+1;
    muteTidy();
    if(MSZ&&(!bdEditing||!dashOn()||C.board.indexOf(MSZ.src)<0)){MSZ=null;var msb=document.getElementById('msBar');if(msb) msb.classList.remove('on');document.documentElement.classList.remove('matching')}
    if(!bdGrid||!C.board) return;
    SWC=null;
    bdFill();
    bdGrid.innerHTML='';bdW=[];BD_PADS=[];
    var dash0=dashOn();
    bdEditor.hidden=dash0?!(bdEditing&&dashAdd):!bdEditing;
    $('#dbAdd').hidden=!bdEditing;
    $('#dbBack').hidden=!BD_UNDO.length;
    $('#dbTpl').hidden=!bdEditing;
    $('#dbTidy').hidden=!(bdEditing&&dash0);
    var dm=$('#dbModel');if(dm){dm.hidden=bdEditing;dm.innerHTML='';store.profiles.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.label||p.name;dm.appendChild(o)});dm.value=store.active}
    $('#dbAdd').setAttribute('aria-pressed',String(dashAdd&&bdEditing));
    if(!bdEditing) bdPick=null;
    BD_SEL=bdEditing?BD_SEL.filter(function(o){return C.board.indexOf(o)>=0}):[];
    bdEditPaint();
    var dash=dashOn();
    if(dash){dashAuto();dashCell();
      // arc meters from older builds (old default 14x10) become the same size as the dial and wheel (10x12)
      if(DG.k==='g'){var mig=false;C.board.forEach(function(o){
        if(o.k==='f'&&o.g&&o.g[2]===14&&o.g[3]===10){var t=[o.g[0],o.g[1],10,12];if(t[1]+12<=DG.y&&!dashHits(o,t)){o.g=t;mig=true}}});
        if(mig) save()}
    }
    bdGrid.classList.toggle('editing',dash&&bdEditing);
    $('#dbEdit').setAttribute('aria-pressed',String(bdEditing));
    $('#dbEdit').textContent=bdEditing?'Done':'Edit';
    $('#bdDash').checked=!!C.dash;
    var tiltTaken=false;
    C.board.forEach(function(it){
      var el=document.createElement('div');
      el.className='bdw'+((it.w===2||it.k==='d')&&!dash?' w2':'')+(it.h===2&&!dash?' h2':'')+(bdEditing?' editing':'');
      el.setAttribute('data-k',it.k);if(it.k==='e') el.classList.add('v2-es');
      if(typeof it.c==='number'&&it.c>=0) el.setAttribute('data-c',it.c);if(typeof it.d==='number'&&it.d>=0) el.setAttribute('data-d',it.d);
      var w={it:it,drag:false,out:null,rng:null};
      if(it.k==='e'){
        var eb=document.createElement('button');eb.type='button';eb.className='dw-es';eb.setAttribute('aria-label','Emergency stop');
        eb.addEventListener('click',function(){setEstop(!S.estop)});
        el.appendChild(eb);w.es=eb;
        if(bdEditing) el.appendChild(bdToolbar(it));
      }else if(it.k==='j'){
        if(!isActive(it.c)||(it.d>=0&&!isActive(it.d))) return;
        el.classList.add('padw');
        bdHead(el,(it.m==='tank'?'Tank':'Stick')+' · '+tagOf(it.c)+(it.d>=0?'+'+tagOf(it.d):''),it,false);
        var tp=C.tilt.all||!tiltTaken;tiltTaken=true;
        el.appendChild(bdPad(it.c,it.d,it.m,it.hold,tp,it));
        if(BD_SL&&BD_SL.it===it){el.classList.add(BD_SL.d>0?'slL':'slR');BD_SL=null}
        var jpad=el.querySelector('.pad');if(it.ng&&jpad) jpad.classList.add('nog');
        swPairs(el,it,'.pad');
      }else if(it.k==='d'){
        var all=[it.c,it.d,it.e,it.f];
        for(var q=0;q<4;q++) if(all[q]>=0&&!isActive(all[q])) return;
        bdHead(el,'Double stick',it,false);
        var pr=document.createElement('div');pr.className='bd-pads';
        var tpd=C.tilt.all||!tiltTaken;tiltTaken=true;
        pr.appendChild(bdPad(it.c,it.d,it.m,it.hold,tpd,it));pr.appendChild(bdPad(it.e,it.f,it.m,it.hold,!!C.tilt.all,it));
        el.appendChild(pr);
      }else if(it.k==='l'){
        var lc=it.c;
        if(!isActive(lc)) return;
        w.out=bdHead(el,'Light · '+tagOf(lc),it,true);
        var lb=document.createElement('button');lb.type='button';lb.className='qbtn lbtn';
        lb.addEventListener('click',function(){
          noteInput();if(S.estop||S.play) return;
          if(C.ch[lc].kind!=='light'){C.ch[lc].kind='light';save();syncChannel(lc)}
          // One tap = next mode: Off, Low, Medium, Full, Slow blink, Off
          var md=lightMode(lc), nx=(md+1)%LMODES.length, L=LMODES[nx];
          var bl=L.blink?'slow':'off';
          if(C.ch[lc].blink!==bl){C.ch[lc].blink=bl;if(refs[lc]&&refs[lc].ltBl) refs[lc].ltBl.value=bl;save()}
          setT(lc,L.v,false);
        });
        (function(){
          var lt=0,lpDone=false;
          function lpClose(){var m=document.getElementById('lpMenu');if(m)m.remove()}
          function lpOpen(){
            lpClose();lpDone=true;
            var m=document.createElement('div');m.id='lpMenu';m.className='lpmenu';
            [['Slow blink',100,'slow'],['Fast blink',100,'fast'],['Pulse',100,'pulse'],['Hazard',100,'hazard'],['Light settings\u2026',0,null]].forEach(function(o){
              var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=o[0];
              b.addEventListener('click',function(){
                if(!o[2]){lpClose();wsEdit(it);return}
                if(S.estop||S.play){lpClose();return}
                if(C.ch[lc].kind!=='light'){C.ch[lc].kind='light';syncChannel(lc)}
                C.ch[lc].blink=o[2];if(refs[lc]&&refs[lc].ltBl) refs[lc].ltBl.value=o[2];save();
                setT(lc,o[1],false);lpClose();feedback('ok');
              });
              m.appendChild(b);
            });
            var r=lb.getBoundingClientRect();
            document.body.appendChild(m);
            var mh=m.offsetHeight,mw=m.offsetWidth;
            m.style.left=Math.max(6,Math.min(innerWidth-mw-6,r.left+r.width/2-mw/2))+'px';
            m.style.top=Math.max(6,Math.min(innerHeight-mh-6,r.top))+'px';
            setTimeout(function(){document.addEventListener('pointerdown',function f(e){if(!m.contains(e.target)){lpClose();document.removeEventListener('pointerdown',f,true)}},true)},0);
          }
          lb.addEventListener('pointerdown',function(){lpDone=false;clearTimeout(lt);lt=setTimeout(lpOpen,500)});
          ['pointerup','pointercancel','pointerleave'].forEach(function(ev){lb.addEventListener(ev,function(){clearTimeout(lt)})});
          lb.addEventListener('contextmenu',function(e){e.preventDefault()});
          lb.addEventListener('click',function(e){if(lpDone){e.stopImmediatePropagation();lpDone=false}},true);
        })();
        el.appendChild(lb);w.lb=lb;
        var lvl=document.createElement('div');lvl.className='lvl';lvl.setAttribute('aria-hidden','true');
        for(var li=0;li<4;li++){var lq=document.createElement('i');lvl.appendChild(lq)}
        lb.appendChild(lvl);w.lvl=lvl;
      }else if(it.k==='b'){
        var bc=it.c;
        if(!isActive(bc)) return;
        bdHead(el,tagOf(bc)+' · '+C.ch[bc].name,it,false);
        var tbn=document.createElement('button');tbn.type='button';tbn.className='qbtn turbo';
        var bt=it.bt||(it.lock?'t':''),TBL={'':'TURBO',t:'TOGGLE',p:'',a:'ACCEL'};
        var tsp=document.createElement('span');tsp.textContent=TBL[bt];tbn.appendChild(tsp);
        if(bt){var tch=document.createElement('i');tch.className='bt-chip';tch.textContent={t:'TOGGLE',p:'PINGPONG',a:'ACCEL'}[bt];var hh=el.querySelector('.bdw-h');if(hh) hh.appendChild(tch)}
        var tdown=false, tprev=0, tp=it.p||100;
        var tpress=function(){
          if(tdown||S.estop||S.play) return;
          tdown=true;noteInput();tprev=rt.t[bc];S.turbo[bc]=true;tbn.classList.add('on');
          setT(bc,tprev<0?-tp:tp,false);
        };
        var tlift=function(){
          if(!tdown) return;
          tdown=false;tbn.classList.remove('on');
          setT(bc,tprev,false);S.turbo[bc]=false;
        };
        // PingPong: each press goes forward → stop → reverse → stop, read from the channel so an E-Stop restarts it cleanly
        var ppDir=1,ppPaint=function(){var v=rt.t[bc];tsp.textContent=v>0?'▶ FWD':v<0?'◀ REV':'■ STOP';tbn.classList.toggle('on',v!==0)};
        // Accelerator: holding raises the power at a steady rate, letting go lowers it (or keeps it)
        var acc=null,accGo=function(){
          if(acc) return;var last=performance.now();
          acc=setInterval(function(){
            if(!tbn.isConnected||S.estop||S.play){clearInterval(acc);acc=null;tbn.style.removeProperty('--acc');tbn.classList.remove('on');return}
            var now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;var v=rt.t[bc],sg=tprev<0?-1:1,ar=it.ar||1,af=it.af===undefined?1:it.af;
            if(tdown) v=sg*Math.min(tp,Math.abs(v)+tp/ar*dt);
            else if(af>0) v=Math.abs(v)<=tp/af*dt?0:v-Math.sign(v)*tp/af*dt;
            setT(bc,Math.round(v),false);tbn.style.setProperty('--acc',(Math.abs(v)/100*100).toFixed(0)+'%');tbn.classList.toggle('on',v!==0);
            if(!tdown&&(v===0||af===0)){clearInterval(acc);acc=null;if(v===0) tbn.style.removeProperty('--acc')}
          },40)};
        if(bt==='p') ppPaint();
        tbn.addEventListener('pointerdown',function(e){
          e.preventDefault();try{tbn.setPointerCapture(e.pointerId)}catch(_){}
          if(S.estop||S.play) return;
          if(bt==='p'){noteInput();var v=rt.t[bc];if(v>0){setT(bc,0,false);ppDir=-1}else if(v<0){setT(bc,0,false);ppDir=1}else setT(bc,ppDir*tp,false);ppPaint();feedback('tap');return}
          if(bt==='a'){noteInput();if(!tdown){tdown=true;tprev=rt.t[bc]<0?-1:1;tbn.classList.add('on');accGo()}return}
          if(bt==='t'&&tdown){if(S.estop||rt.t[bc]===0){tdown=false;tbn.classList.remove('on');S.turbo[bc]=false}else{tlift();return}}
          tpress();
        });
        ['pointerup','pointercancel','lostpointercapture','blur'].forEach(function(ev){tbn.addEventListener(ev,function(){
          if(bt==='a'){if(tdown){tdown=false;accGo()}return}
          if(bt!=='t'&&bt!=='p') tlift()})});
        tbn.addEventListener('contextmenu',function(e){e.preventDefault()});
        if(bt==='p') w.pp=ppPaint;
        el.appendChild(tbn);
      }else if(it.k==='w'){
        var wc=it.c, wd=it.d;
        if(!isActive(wc)||!isActive(wd)) return;
        bdHead(el,'Switch \u00b7 '+tagOf(wc)+' / '+tagOf(wd),it,false);
        var sp=document.createElement('div');sp.className='spdt';
        var la=document.createElement('span');la.className='spl a';la.textContent=tagOf(wc)+'\n'+C.ch[wc].name;
        var lb2=document.createElement('span');lb2.className='spl b';lb2.textContent=tagOf(wd)+'\n'+C.ch[wd].name;
        var sw=document.createElement('button');sw.type='button';sw.className='spsw';sw.setAttribute('role','switch');sw.setAttribute('aria-label','Switch '+tagOf(wc)+' or '+tagOf(wd));
        var kn=document.createElement('i');sw.appendChild(kn);
        var spSet=function(pos){
          noteInput();if(S.estop||S.play) return;
          var pw=it.p||100;
          setT(wc,pos==='a'?(it.ra?-pw:pw):0,false);
          setT(wd,pos==='b'?(it.rb?-pw:pw):0,false);
          feedback('ok');
        };
        var spPos=function(){return rt.t[wc]!==0&&rt.t[wd]===0?'a':(rt.t[wd]!==0&&rt.t[wc]===0?'b':'')};
        sw.addEventListener('click',function(e){
          var r=sw.getBoundingClientRect(), side=(e.clientX-r.left)<r.width/2?'a':'b', cur=spPos();
          if(e.detail===0) side=cur==='a'?'b':'a';
          if(side===cur) spSet(it.mid?'':side); else spSet(side);
        });
        sp.appendChild(la);sp.appendChild(sw);sp.appendChild(lb2);el.appendChild(sp);
        w.spdt={it:it,sw:sw,la:la,lb:lb2,kn:kn,pos:spPos};
      }else if(it.k==='a'){
        var ac=it.c;
        if(!isActive(ac)) return;
        bdHead(el,'Auto-stop \u00b7 '+tagOf(ac)+' \u00b7 '+C.ch[ac].name,it,false);
        var ab=document.createElement('button');ab.type='button';ab.className='sesst';
        var at=document.createElement('b');var as=document.createElement('small');ab.appendChild(at);ab.appendChild(as);
        ab.addEventListener('click',function(){var o=[5,10,20,30,60];it.s=o[(o.indexOf(it.s)+1)%o.length];AUTOT[ac]=0;save();paintBoard()});
        el.appendChild(ab);w.auto={t:at,s:as,it:it};
      }else if(it.k==='y'){
        var yc=it.c;
        if(!isActive(yc)) return;
        w.out=bdHead(el,'Ramp \u00b7 '+tagOf(yc)+' \u00b7 '+C.ch[yc].name+' \u00b7 '+(it.p||50)+'% \u00b7 '+it.d+'s',it,true);
        var ybs=dirRow(el,w,it,function(dir){
          delete RAMP[yc];
          if(dir===0){delete RAMPLAST[yc];setT(yc,0,false);return}
          RAMP[yc]={t0:performance.now(),from:rt.t[yc],to:wOut(it,dir*(it.p||50)),d:it.d};RAMPLAST[yc]={to:RAMP[yc].to,d:it.d,s:HCNT[yc]||0};
        });
        w.yr={c:yc,bs:ybs,it:it};
        if(it.sc) w.yr.m=meterBuild(el,{k:'k',c:yc});
      }else if(it.k==='f'||it.k==='i'||it.k==='k'){
        var mtc=it.c;
        if(!isActive(mtc)) return;
        var mhd=bdHead(el,(it.k==='f'?(it.nd?'Tachometer':'Arc meter'):it.k==='i'?'LED meter':'Scope')+' \u00b7 '+tagOf(mtc)+' \u00b7 '+C.ch[mtc].name,it,it.k==='i');
        el.classList.add('mtrw');if(it.k==='i'&&it.hz) el.classList.add('hzw');
        w.mtr=meterBuild(el,it);w.mtr.hd=mhd;
      }else if(it.k==='n'){
        var nc=it.c;
        if(!isActive(nc)) return;
        w.out=bdHead(el,'Dial \u00b7 '+tagOf(nc)+' \u00b7 '+C.ch[nc].name,it,true);
        var nw=document.createElement('div');nw.className='dialw';
        var nbx=document.createElement('div');nbx.className='dialbox';
        var nsv=document.createElementNS('http://www.w3.org/2000/svg','svg');nsv.setAttribute('viewBox','0 0 100 100');nsv.setAttribute('aria-hidden','true');
        var NSEG=28,nstep=270/NSEG,nsg=[];
        var npt=function(r,a){a=a*Math.PI/180;return (50+r*Math.sin(a)).toFixed(2)+' '+(50-r*Math.cos(a)).toFixed(2)};
        for(var nj=0;nj<NSEG;nj++){
          var na1=-135+nj*nstep+.6,na2=-135+(nj+1)*nstep-.6,nse=document.createElementNS('http://www.w3.org/2000/svg','path');
          nse.setAttribute('d','M'+npt(49,na1)+'A49 49 0 0 1 '+npt(49,na2)+'L'+npt(42,na2)+'A42 42 0 0 0 '+npt(42,na1)+'Z');
          nse.setAttribute('fill','rgba(150,160,175,.32)');nsv.appendChild(nse);nsg.push({e:nse,v:it.ow?(nj+.5)/NSEG*100:(-135+(nj+.5)*nstep)/135*100,f:''});
        }
        nbx.appendChild(nsv);
        var nk=document.createElement('div');nk.className='dialk';nk.setAttribute('role','slider');nk.setAttribute('aria-valuemin',it.ow?'0':'-100');nk.setAttribute('aria-valuemax','100');
        var ni=document.createElement('i');nk.appendChild(ni);
        // The dial only turns relative to where it is now: touching it never jumps to another value,
        // and it stops at the ends (0 and 100) instead of wrapping round.
        var nAng=0,nLa=0;
        var nPtr=function(e){var rc=nk.getBoundingClientRect();return Math.atan2(e.clientX-(rc.left+rc.width/2),-(e.clientY-(rc.top+rc.height/2)))*180/Math.PI};
        var nCur=function(){var cv=wIn(it,rt.t[nc]);if(it.ow&&cv<0) cv=0;return it.ow?-135+cv/100*270:cv/100*135};
        var nset=function(e){
          var a=nPtr(e),d=a-nLa;nLa=a;
          if(d>180) d-=360;else if(d<-180) d+=360;
          // fine turning: one full turn of the finger moves the value 50%
          if(it.fn) d*=it.ow?.375:.1875;
          nAng=Math.max(-135,Math.min(135,nAng+d));
          noteInput();delete RAMP[nc];
          var nraw=it.ow?(nAng+135)/270*100:nAng/135*100,dstep=it.fn?Math.round(nraw):Math.round(nraw/5)*5;
          if(Math.round(dstep/5)!==w.dbz){w.dbz=Math.round(dstep/5);dialBuzz()}
          if(dstep!==w.dlast){w.dlast=dstep;setT(nc,wOut(it,dstep),false)}
        };
        var nT=0,nX=0,nY=0,nPend=false,nLong=false;
        nk.addEventListener('pointerdown',function(e){
          if(S.estop||S.play) return;
          e.preventDefault();try{nk.setPointerCapture(e.pointerId)}catch(_){}
          nX=e.clientX;nY=e.clientY;nPend=true;nLong=false;w.dlast=wIn(it,rt.t[nc]);w.dbz=Math.round(w.dlast/5);nAng=nCur();nLa=nPtr(e);clearTimeout(nT);nk.classList.add('holding');
          nT=setTimeout(function(){
            if(!nPend) return;
            nPend=false;nLong=true;noteInput();nk.classList.remove('holding');nk.classList.add('pop');setTimeout(function(){nk.classList.remove('pop')},250);
            var rp=RAMP[nc],cv=wIn(it,rt.t[nc]),off=rp?rp.to!==0:cv!==0;
            var rd=it.rt===undefined?3:it.rt,tg=off?0:wOut(it,it.ow?Math.abs(w.dlv||50):(w.dlv||50));
            if(off&&!rp&&cv!==0) w.dlv=cv;
            if(rd>0) RAMP[nc]={t0:performance.now(),from:rt.t[nc],to:tg,d:rd};
            else{delete RAMP[nc];setT(nc,tg,false)}
            feedback('hold');
          },800);
        });
        nk.addEventListener('pointermove',function(e){
          if(nPend&&Math.hypot(e.clientX-nX,e.clientY-nY)>6){nPend=false;clearTimeout(nT);w.drag=true;nk.classList.remove('holding')}
          if(w.drag&&!nLong) nset(e);
        });
        ['pointerup','pointercancel'].forEach(function(ev){nk.addEventListener(ev,function(e){
          clearTimeout(nT);nk.classList.remove('holding');
          // a short tap on the middle of the knob sets the dial to 0 (a long press still switches on/off)
          if(ev==='pointerup'&&nPend&&it.tz!==0&&!S.estop&&!S.play){
            var zr=nk.getBoundingClientRect();
            if(Math.hypot(nX-(zr.left+zr.width/2),nY-(zr.top+zr.height/2))<zr.width*.2){
              var zc=wIn(it,rt.t[nc]);if(zc!==0) w.dlv=zc;
              noteInput();delete RAMP[nc];setT(nc,0,false);dialBuzz();
              nk.classList.add('pop');setTimeout(function(){nk.classList.remove('pop')},250);
            }
          }
          // double tap anywhere on the knob: glide back to 0 in 0.2 s
          if(ev==='pointerup'&&nPend&&!S.estop&&!S.play){
            var nnow=Date.now();
            if(w.ntap&&nnow-w.ntap<350){w.ntap=0;var zc2=wIn(it,rt.t[nc]);if(zc2!==0) w.dlv=zc2;noteInput();RAMP[nc]={t0:performance.now(),from:rt.t[nc],to:0,d:0.2};dialBuzz();
              nk.classList.add('pop');setTimeout(function(){nk.classList.remove('pop')},250)}
            else w.ntap=nnow;
          }
          nPend=false;nLong=false;w.drag=false;
        })});
        nk.addEventListener('contextmenu',function(e){e.preventDefault()});
        nbx.appendChild(nk);nw.appendChild(nbx);el.appendChild(nw);w.dial={c:nc,k:nk,i:ni,sg:nsg,lv:null};
        var nchs=activeIdx();
        if(it.sw&&nchs.length>1){
          // Swipe sideways on the card (outside the knob) to move the dial to the next channel.
          var ndg=document.createElement('div');ndg.className='dialdots';
          nchs.forEach(function(q){var di=document.createElement('i');if(q===nc) di.className='on';ndg.appendChild(di)});
          if(nchs.length>8) ndg.style.gap='2px';el.appendChild(ndg);
          var nsx=null,nsy=0;el.style.touchAction='pan-y';
          el.addEventListener('pointerdown',function(e){if(bdEditing||nk.contains(e.target)){nsx=null;return}nsx=e.clientX;nsy=e.clientY});
          el.addEventListener('pointerup',function(e){
            if(nsx===null) return;var dx=e.clientX-nsx,dy=e.clientY-nsy;nsx=null;
            if(Math.abs(dx)>36&&Math.abs(dx)>1.6*Math.abs(dy)){var q=nchs.indexOf(nc);it.c=nchs[(q+(dx<0?1:nchs.length-1))%nchs.length];save();syncBoard();feedback('ok')}
          });
          el.addEventListener('pointercancel',function(){nsx=null});
        }
      }else if(it.k==='rs'){
        var rsn=it.ns||6,rsb=(it.hb||0)*PER;
        w.out=bdHead(el,'Dial selector',it,true);
        var rw=document.createElement('div');rw.className='dialw';
        var rbx=document.createElement('div');rbx.className='dialbox';
        var rsv=document.createElementNS('http://www.w3.org/2000/svg','svg');rsv.setAttribute('viewBox','0 0 100 100');rsv.setAttribute('aria-hidden','true');
        var rdots=[],rang=function(i){return rsn===1?0:-135+i*270/(rsn-1)};
        var rch=function(i){return rsb+i};
        var rpt=function(r,a){a=a*Math.PI/180;return [50+r*Math.sin(a),50-r*Math.cos(a)]};
        for(var ri=0;ri<rsn;ri++){
          var rp0=rpt(46,rang(ri)),rg=document.createElementNS('http://www.w3.org/2000/svg','g');
          var rh=document.createElementNS('http://www.w3.org/2000/svg','circle');rh.setAttribute('cx',rp0[0]);rh.setAttribute('cy',rp0[1]);rh.setAttribute('r',5);rh.setAttribute('fill',PAL.r);rh.setAttribute('opacity','0');
          var rc0=document.createElementNS('http://www.w3.org/2000/svg','circle');rc0.setAttribute('cx',rp0[0]);rc0.setAttribute('cy',rp0[1]);rc0.setAttribute('r',2.2);rc0.setAttribute('fill',PAL.r);rc0.setAttribute('opacity','.3');
          rg.appendChild(rh);rg.appendChild(rc0);rsv.appendChild(rg);rdots.push({c:rc0,h:rh,st:-1});
        }
        rbx.appendChild(rsv);
        var rk=document.createElement('div');rk.className='dialk';rk.setAttribute('role','slider');rk.setAttribute('aria-valuemin','1');rk.setAttribute('aria-valuemax',String(rsn));
        var rik=document.createElement('i');rk.appendChild(rik);
        var rcur=function(){return Math.max(0,Math.min(rsn-1,it.s||0))};
        // Scene mode: each position sets several channels of the hub at once.
        // Only channels that are non-zero in at least one scene are touched.
        var rsc=it.sm?rsScenes(it):null, rused=[];
        if(rsc) for(var rj=0;rj<PER;rj++){for(var rq=0;rq<rsn;rq++) if(rsc[rq][rj]){rused.push(rj);break}}
        var rramp=function(c,tg){if(!C.ch[c]) return;var rd1=it.rt===undefined?3:it.rt;if(rt.t[c]===tg&&!RAMP[c]) return;if(rd1>0) RAMP[c]={t0:performance.now(),from:rt.t[c],to:tg,d:rd1};else{delete RAMP[c];setT(c,tg,false)}};
        var rapply=function(i,off){rused.forEach(function(j){rramp(rsb+j,off?0:rsc[i][j])})};
        // a scene whose channels are all 0 still counts as switched on (it._on is dropped when the board is loaded again)
        var rison=rsc?function(){var nz=rused.some(function(j){var c=rsb+j,rp=RAMP[c];return rp?rp.to!==0:rt.t[c]!==0});return nz||(!!it._on&&!rused.some(function(j){return rsc[rcur()][j]}))}:function(){var c=rch(rcur()),rp=RAMP[c];return rp?rp.to!==0:rt.t[c]!==0};
        var rmove=rsc?function(ni){
          ni=Math.max(0,Math.min(rsn-1,ni));if(ni===rcur()) return;
          noteInput();var wasOn=rison();it.s=ni;save();dialBuzz();clickSnd();
          if(wasOn){it._on=true;rapply(ni)}
        }:function(ni){
          // Positions are visited in order (A, B, C ...): a jump is walked through one position at a time.
          ni=Math.max(0,Math.min(rsn-1,ni));
          while(ni!==rcur()){
            noteInput();
            var oc=rch(rcur()),rd0=it.rt===undefined?3:it.rt;
            // The position being left fades out over the ramp time instead of cutting off.
            if(rd0>0&&rt.t[oc]!==0) RAMP[oc]={t0:performance.now(),from:rt.t[oc],to:0,d:rd0};
            else{delete RAMP[oc];setT(oc,0,false)}
            it.s=rcur()+(ni>rcur()?1:-1);save();dialBuzz();clickSnd();
          }
        };
        var rtog=rsc?function(){noteInput();var on=rison();it._on=!on;rapply(rcur(),on)}:function(){
          var c=rch(rcur()),on=rison(),rd=it.rt===undefined?3:it.rt,tg=on?0:(it.p||100);
          if(rd>0) RAMP[c]={t0:performance.now(),from:rt.t[c],to:tg,d:rd};
          else{delete RAMP[c];setT(c,tg,false)}
        };
        // Relative turning, like the dial: touching never jumps to another position.
        var rAng=0,rLa=0;
        var rPtr=function(e){var rc=rk.getBoundingClientRect();return Math.atan2(e.clientX-(rc.left+rc.width/2),-(e.clientY-(rc.top+rc.height/2)))*180/Math.PI};
        var rset=function(e){
          var a=rPtr(e),d=a-rLa;rLa=a;
          if(d>180) d-=360;else if(d<-180) d+=360;
          rAng=Math.max(-135,Math.min(135,rAng+d));
          rmove(rsn===1?0:Math.round((rAng+135)/270*(rsn-1)));
        };
        var rT=0,rX=0,rY=0,rPend=false,rLong=false;
        rk.addEventListener('pointerdown',function(e){
          if(S.estop||S.play) return;
          e.preventDefault();try{rk.setPointerCapture(e.pointerId)}catch(_){}
          rX=e.clientX;rY=e.clientY;rPend=true;rLong=false;rAng=rang(rcur());rLa=rPtr(e);clearTimeout(rT);rk.classList.add('holding');
          rT=setTimeout(function(){
            if(!rPend) return;
            rPend=false;rLong=true;noteInput();rk.classList.remove('holding');rk.classList.add('pop');setTimeout(function(){rk.classList.remove('pop')},250);
            rtog();
            feedback('hold');
          },800);
        });
        rk.addEventListener('pointermove',function(e){
          if(rPend&&Math.hypot(e.clientX-rX,e.clientY-rY)>6){rPend=false;clearTimeout(rT);w.drag=true;rk.classList.remove('holding')}
          if(w.drag&&!rLong) rset(e);
        });
        ['pointerup','pointercancel'].forEach(function(ev){rk.addEventListener(ev,function(e){
          clearTimeout(rT);rk.classList.remove('holding');
          rPend=false;rLong=false;w.drag=false;
        })});
        rk.addEventListener('contextmenu',function(e){e.preventDefault()});
        rbx.appendChild(rk);rw.appendChild(rbx);el.appendChild(rw);
        w.rsd={k:rk,i:rik,dots:rdots,n:rsn,ang:rang,ch:rch,cur:rcur,on:rison,lt:'',mv:rmove,tog:rtog,sc:rsc,used:rused,b:rsb};
      }else if(it.k==='g'){
        var gc=it.c;
        if(!isActive(gc)) return;
        w.out=bdHead(el,'Gear \u00b7 '+tagOf(gc)+' \u00b7 '+C.ch[gc].name,it,true);
        var glist=gearsOf(it);
        var gr=document.createElement('div');gr.className='tgdir gear';gr.style.gridTemplateColumns='repeat('+glist.length+',minmax(0,1fr))';
        var gbs=[];
        glist.forEach(function(gd,gi){
          var b=document.createElement('button');b.type='button';b.className='tgd';b.setAttribute('data-g',String(gi));b.setAttribute('data-k',gd[0]==='R'||gd[0]==='N'?gd[0]:'F');
          var ic=document.createElement('i');ic.textContent=gd[0];b.appendChild(ic);
          b.addEventListener('click',function(){noteInput();if(S.estop||S.play) return;setT(gc,wOut(it,gd[1]),false)});
          gr.appendChild(b);gbs.push(b);
        });
        el.appendChild(gr);w.gear={c:gc,bs:gbs,list:glist};
      }else if(it.k==='st'){
        var sc=it.c;
        if(!isActive(sc)) return;
        w.out=bdHead(el,'Wheel · '+tagOf(sc)+' · '+C.ch[sc].name,it,true);
        var srg=(it.ra||180)/2;
        var sw0=document.createElement('div');sw0.className='stw';
        var sbx=document.createElement('div');sbx.className='stbox';
        var ssv=document.createElementNS('http://www.w3.org/2000/svg','svg');ssv.setAttribute('viewBox','0 0 100 100');ssv.setAttribute('aria-hidden','true');
        var spt=function(r,a){a=a*Math.PI/180;return (50+r*Math.sin(a)).toFixed(2)+' '+(50-r*Math.cos(a)).toFixed(2)};
        var sar=document.createElementNS('http://www.w3.org/2000/svg','path');
        sar.setAttribute('d','M'+spt(48.5,-srg)+'A48.5 48.5 0 '+(srg>90?1:0)+' 1 '+spt(48.5,srg));
        sar.setAttribute('fill','none');sar.setAttribute('stroke','rgba(150,160,175,.55)');sar.setAttribute('stroke-width','1.6');sar.setAttribute('stroke-dasharray','3 3');ssv.appendChild(sar);
        // same dashes, coloured like the meters from centre to the current value
        var sz=[];(function(){var th=MTH[(it.th===1||it.th===2)?it.th:0],uid='stz'+(MSEQ++);
          for(var zi=0;zi<3;zi++){
            var cp=document.createElementNS('http://www.w3.org/2000/svg','clipPath');cp.setAttribute('id',uid+zi);
            var pg=document.createElementNS('http://www.w3.org/2000/svg','polygon');cp.appendChild(pg);ssv.appendChild(cp);
            var pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d',sar.getAttribute('d'));pa.setAttribute('fill','none');pa.setAttribute('stroke',th[zi]);pa.setAttribute('stroke-width','1.6');pa.setAttribute('stroke-dasharray','3 3');pa.setAttribute('clip-path','url(#'+uid+zi+')');ssv.appendChild(pa);
            sz.push(pg)}})();
        sbx.appendChild(ssv);
        var sk=document.createElement('div');sk.className='stk';sk.setAttribute('role','slider');sk.setAttribute('aria-valuemin','-100');sk.setAttribute('aria-valuemax','100');
        sk.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="stgR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a94a6"/><stop offset=".5" stop-color="#3a4252"/><stop offset="1" stop-color="#1b2029"/></linearGradient><linearGradient id="stgS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b7587"/><stop offset="1" stop-color="#2a303b"/></linearGradient><radialGradient id="stgH" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#5b6578"/><stop offset="1" stop-color="#14181f"/></radialGradient></defs><circle cx="50" cy="50" r="45" fill="none" stroke="#0b0d11" stroke-width="12"/><circle cx="50" cy="50" r="45" fill="none" stroke="url(#stgR)" stroke-width="8.5"/><circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1" stroke-dasharray="1.2 1.8"/><path d="M9 50H91M50 50V92" stroke="#0b0d11" stroke-width="10.5" stroke-linecap="round"/><path d="M9 50H91M50 50V92" stroke="url(#stgS)" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="50" r="13" fill="url(#stgH)" stroke="#0b0d11" stroke-width="2"/><circle cx="50" cy="50" r="4" style="fill:var(--hc,#ffd84a)" opacity=".9"/><rect x="43.5" y="2.5" width="13" height="16" rx="3.5" style="fill:var(--hc,#ffd84a);stroke:var(--hcd,#7a6a1f)" stroke-width="1.2"/><rect x="46" y="5" width="3" height="11" rx="1.5" fill="rgba(255,255,255,.55)"/></svg>';
        var sAng=0,sPrev=0,sDrag=false,sGy={st:true,c:sc,it:it,last:0};
        var sAt=function(e){var rc=sk.getBoundingClientRect();return Math.atan2(e.clientX-(rc.left+rc.width/2),-(e.clientY-(rc.top+rc.height/2)))*180/Math.PI};
        sk.addEventListener('pointerdown',function(e){
          if(S.estop||S.play) return;
          e.preventDefault();try{sk.setPointerCapture(e.pointerId)}catch(_){}
          delete RAMP[sc];sAng=wIn(it,rt.t[sc])/100*srg;sPrev=sAt(e);sDrag=true;sk.classList.add('drag');w.slast=wIn(it,rt.t[sc]);
          if(it.gy&&TILT.has){TILT.zero=null;sGy.last=0;BD_TILT.cur=sGy}
        });
        sk.addEventListener('pointermove',function(e){
          if(!sDrag||S.estop||S.play||BD_TILT.cur===sGy) return;
          var a=sAt(e),d=a-sPrev;if(d>180) d-=360;if(d<-180) d+=360;sPrev=a;
          sAng=Math.max(-srg,Math.min(srg,sAng+d));
          var v=Math.round(sAng/srg*20)*5;
          noteInput();
          if(v!==w.slast){w.slast=v;dialBuzz()}
          setT(sc,wOut(it,v),false);
        });
        ['pointerup','pointercancel'].forEach(function(ev){sk.addEventListener(ev,function(){
          if(!sDrag) return;
          sDrag=false;sk.classList.remove('drag');if(BD_TILT.cur===sGy) BD_TILT.cur=null;
          if(!it.hold&&!S.estop&&!S.play&&rt.t[sc]!==0) RAMP[sc]={t0:performance.now(),from:rt.t[sc],to:0,d:0.25};
        })});
        sk.addEventListener('contextmenu',function(e){e.preventDefault()});
        sbx.appendChild(sk);sw0.appendChild(sbx);el.appendChild(sw0);w.stw={c:sc,k:sk,rg:srg,zs:sz};
      }else if(it.k==='lv'){
        var lvc=it.c;
        if(!isActive(lvc)) return;
        w.out=bdHead(el,'Lever · '+tagOf(lvc)+' · '+C.ch[lvc].name,it,true);
        var lvl=gearsOf(it).slice().reverse(), lvn=lvl.length;
        var lvw=document.createElement('div');lvw.className='lvw';
        var lvt=document.createElement('div');lvt.className='lvt';
        var lvy=function(i){return (8+i/(lvn-1)*84)};
        var lvr=document.createElement('div');lvr.className='rail';lvt.appendChild(lvr);
        var lvb=[];
        lvl.forEach(function(gd,gi){
          var d=document.createElement('div');d.className='lvd';d.style.top=lvy(gi)+'%';
          var b=document.createElement('b');b.textContent=gd[0];b.className=gd[0]==='R'?'gr':gd[0]==='N'?'gn':'gf';var tk=document.createElement('i');
          d.appendChild(b);d.appendChild(tk);lvt.appendChild(d);lvb.push(b);
        });
        var lvk=document.createElement('div');lvk.className='lvk';lvk.setAttribute('role','slider');lvt.appendChild(lvk);
        var lvSet=function(e){
          if(S.estop||S.play) return;
          var rc=lvt.getBoundingClientRect(),fr=((e.clientY-rc.top)/rc.height*100-8)/84;
          var di=Math.max(0,Math.min(lvn-1,Math.round(fr*(lvn-1))));
          if(di===w.lvi) return;
          w.lvi=di;noteInput();delete RAMP[lvc];dialBuzz();setT(lvc,wOut(it,lvl[di][1]),false);
        };
        var lvD=false;
        lvt.addEventListener('pointerdown',function(e){
          if(S.estop||S.play) return;
          e.preventDefault();try{lvt.setPointerCapture(e.pointerId)}catch(_){}
          lvD=true;w.lvi=-1;lvSet(e);
        });
        var lvX=0,lvY=0,lvT0=0;
        lvt.addEventListener('pointerdown',function(e){lvX=e.clientX;lvY=e.clientY;lvT0=Date.now()});
        lvt.addEventListener('pointermove',function(e){if(lvD) lvSet(e)});
        ['pointerup','pointercancel'].forEach(function(ev){lvt.addEventListener(ev,function(e){
          lvD=false;
          // double tap the lever: back to N (the notch that gives 0)
          if(ev!=='pointerup'||S.estop||S.play) return;
          var lnow=Date.now();if(lnow-lvT0>300||Math.hypot(e.clientX-lvX,e.clientY-lvY)>10) return;
          if(w.ltap&&lnow-w.ltap<350){w.ltap=0;var ni2=-1;lvl.forEach(function(gd,gi){if(gd[1]===0&&ni2<0) ni2=gi});
            if(ni2>=0&&ni2!==w.lvi){w.lvi=ni2;noteInput();delete RAMP[lvc];dialBuzz();setT(lvc,wOut(it,0),false)}}
          else w.ltap=lnow;
        })});
        lvt.addEventListener('contextmenu',function(e){e.preventDefault()});
        lvw.appendChild(lvt);el.appendChild(lvw);w.lev={c:lvc,k:lvk,b:lvb,l:lvl,y:lvy};
      }else if(it.k==='dp'){
        var dpc=it.c,dpd=it.d;
        if(!isActive(dpc)||(dpd>=0&&!isActive(dpd))) return;
        w.out=bdHead(el,'D-pad · '+tagOf(dpc)+(dpd>=0?'+'+tagOf(dpd):''),it,false);
        var dww=document.createElement('div');dww.className='dpw';
        var dbx=document.createElement('div');dbx.className='dpbox';
        var dpr={},dbs={};
        var dpGo=function(ch,to){
          if(ch<0) return;
          var rp=RAMP[ch];if(!rp&&rt.t[ch]===to) return;if(rp&&rp.to===to) return;
          var rd=it.rt===undefined?0.3:it.rt;
          if(rd>0&&to!==rt.t[ch]) RAMP[ch]={t0:performance.now(),from:rt.t[ch],to:to,d:rd};
          else{delete RAMP[ch];setT(ch,to,false)}
        };
        var dpApply=function(){
          var f=(dpr.u?1:0)-(dpr.d?1:0), t=(dpr.r?1:0)-(dpr.l?1:0), pw=it.p||70, a,b;
          if(it.m==='car'){a=f;b=t}
          else{a=Math.max(-1,Math.min(1,f+t));b=Math.max(-1,Math.min(1,f-t))}
          noteInput();
          dpGo(dpc,Math.round(a*pw));dpGo(dpd,Math.round(b*pw));
        };
        var dpClear=function(){dpr={};dpApply()};
        [['u','▲','Forward'],['l','◀','Left'],['r','▶','Right'],['d','▼','Reverse']].forEach(function(q){
          var b=document.createElement('button');b.type='button';b.className='dpb '+q[0];b.textContent=q[1];b.setAttribute('aria-label',q[2]);b.setAttribute('data-d',q[0]);
          b.addEventListener('pointerdown',function(e){
            if(S.estop||S.play) return;
            e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}
            if(it.tg){var was=!!dpr[q[0]];dpr={};if(!was) dpr[q[0]]=1}
            else if(it.hold){dpr={};dpr[q[0]]=1}
            else dpr[q[0]]=1;
            dpApply();
          });
          if(!it.tg&&!it.hold) ['pointerup','pointercancel'].forEach(function(ev){b.addEventListener(ev,function(){if(dpr[q[0]]){delete dpr[q[0]];dpApply()}})});
          b.addEventListener('contextmenu',function(e){e.preventDefault()});
          dbx.appendChild(b);dbs[q[0]]=b;
        });
        var dph=document.createElement('div');dph.className='dphub';dbx.appendChild(dph);
        // "Stay where it is": the last arrow keeps running; tap the centre to stop
        if(it.hold||it.tg){dph.setAttribute('role','button');dph.setAttribute('aria-label','Stop');dph.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(S.estop||S.play) return;dpClear()})}
        dww.appendChild(dbx);el.appendChild(dww);w.dpd={bs:dbs,r:function(){return dpr},clr:dpClear};
        swPairs(el,it,'.dpbox');
      }else if(it.k==='ps'){
        el.classList.add('psw');
        bdHead(el,'',it,false);
        var pb=document.createElement('button');pb.type='button';pb.className='psb';pb.setAttribute('aria-label',it.md?'Hub output on/off (hold)':'Hub link on/off (hold)');
        var psv=sv('svg',{viewBox:'0 0 120 116',class:'pssvg'},pb);
        var pdf=sv('defs',{},psv),pgr=sv('radialGradient',{id:'psg'+(MSEQ++),cx:'.35',cy:'.3',r:'.9'},pdf);
        var pgid=pgr.getAttribute('id');
        sv('stop',{offset:'0','stop-color':'#5a6376'},pgr);sv('stop',{offset:'.6','stop-color':'#2a303b'},pgr);sv('stop',{offset:'1','stop-color':'#14181f'},pgr);
        var pglow=sv('g',{style:'filter:blur(4px)',opacity:.55},psv);
        var pglw=ledRing(pglow,60,58,46.5,40,90,360,7), pring=ledRing(psv,60,58,46.5,40,90,360,7);
        var pcap=sv('g',{},psv);
        sv('circle',{cx:60,cy:58,r:39,fill:'#0d1015',stroke:'#6b7280','stroke-width':2},pcap);
        sv('circle',{cx:60,cy:58,r:35,fill:'url(#'+pgid+')',stroke:'#0d1015','stroke-width':2},pcap);
        sv('ellipse',{cx:52,cy:42,rx:19,ry:8,fill:'#fff',opacity:.12},pcap);
        var pic=sv('circle',{cx:60,cy:58,r:31,fill:'none','stroke-width':2.5,stroke:PAL.r},pcap);
        var pt1=sv('text',{x:60,y:58,'text-anchor':'middle','font-size':14,'font-weight':900,fill:'#e8e8ea'},pcap);pt1.textContent='START';
        var pt2=sv('text',{x:60,y:71,'text-anchor':'middle','font-size':10,'font-weight':900,fill:PAL.r},pcap);pt2.textContent='STOP';
        var pst=sv('text',{x:60,y:62,'text-anchor':'middle','font-size':11,'font-weight':900,fill:PAL.r},psv);
        var pv={k:'ps',it:it,b:pb,ring:pring,glow:pglw,glowg:pglow,cap:pcap,ic:pic,t1:pt1,t2:pt2,st:pst,col:[],tgt:'',ai:0,t:0,dn:false,tm:0};
        pb.addEventListener('pointerdown',function(e){
          e.preventDefault();try{pb.setPointerCapture(e.pointerId)}catch(_){}
          if(bdEditing) return;
          noteInput();pv.dn=true;pb.classList.add('dn');
          clearTimeout(pv.tm);
          pv.tm=setTimeout(function(){
            if(!pv.dn) return;
            // held long enough: one vibration (feedback() already vibrates in the app), then the LEDs change colour one by one
            if(store.prefs.haptic!==false&&!NB&&navigator.vibrate){try{navigator.vibrate(45)}catch(_){}}
            feedback('ok');
            pv.fired=true;if(it.md) toggleOut(it); else link.click();paintBoard();
          },it.hd||500);
        });
        ['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){pb.addEventListener(ev,function(){pv.dn=false;clearTimeout(pv.tm);pb.classList.remove('dn')})});
        pb.addEventListener('contextmenu',function(e){e.preventDefault()});
        el.appendChild(pb);w.vw=pv;
      }else if(it.k==='lx'){
        if(it.t!=='tk'&&!isActive(it.c)) return;
        w.lx=lxBuild(el,it);
      }else if(it.k==='tl'){
        var tlo=tlOf(it);var tlhd=bdHead(el,tlo?tlo.name:'Timeline',it,true);el.classList.add('mtrw');w.mtr=pxBuild(el,it,tlhd);
      }else if(it.k==='sw'){
        if(!isActive(it.c)) return;
        var swhd=bdHead(el,'Swing \u00b7 '+tagOf(it.c)+' '+C.ch[it.c].name,it,true);el.classList.add('mtrw');w.mtr=swBuild(el,it,swhd);
      }else if(it.k==='xy'||it.k==='xf'||it.k==='ro'||it.k==='ax'){
        if(!isActive(it.c)||(it.k!=='ro'&&it.k!=='ax'&&!isActive(it.d))) return;
        var xhd=bdHead(el,it.k==='xy'?'XY pad \u00b7 '+tagOf(it.c)+'+'+tagOf(it.d):it.k==='xf'?'Crossfader \u00b7 '+tagOf(it.c)+'\u21c4'+tagOf(it.d):(it.k==='ax'?'Motor axle':'Rotor')+' \u00b7 '+tagOf(it.c)+' \u00b7 '+C.ch[it.c].name,it,it.k!=='xy');
        el.classList.add('mtrw');
        w.mtr=xwBuild(el,it,xhd);
        if(it.k==='xy'){swPairs(el,it,'svg');var xdg=el.querySelector(':scope>.dialdots');if(xdg){xdg.classList.add('xyd');el.classList.add('xyw');el.__xyd=xdg}}
      }else if(it.k==='z'){
        bdHead(el,'Session timer',it,false);
        var zd=document.createElement('button');zd.type='button';zd.className='sesst';
        var zt=document.createElement('b');zt.textContent='00:00';
        var zs=document.createElement('small');
        zd.appendChild(zt);zd.appendChild(zs);
        var zlp=0, zdone=false;
        zd.addEventListener('pointerdown',function(){zdone=false;clearTimeout(zlp);zlp=setTimeout(function(){zdone=true;sessReset();toast('Session timer reset.');feedback('hold');paintBoard()},800)});
        ['pointerup','pointercancel','pointerleave'].forEach(function(ev){zd.addEventListener(ev,function(){clearTimeout(zlp)})});
        zd.addEventListener('click',function(){
          if(zdone){zdone=false;return}
          var o=[0,5,10,15,20,30];it.a=o[(o.indexOf(it.a)+1)%o.length];SESS.warned=false;save();paintBoard();
        });
        zd.addEventListener('contextmenu',function(e){e.preventDefault()});
        el.appendChild(zd);w.sess={t:zt,s:zs,b:zd,it:it};
      }else if(it.k==='t'){
        var tc=it.c;
        if(!isActive(tc)) return;
        w.out=bdHead(el,tagOf(tc)+' · '+C.ch[tc].name,it,true);
        var tgp=it.p||100, tgs=it.y||'led', tgb=[];
        var tgDo=function(v){noteInput();if(S.estop||S.play) return;setT(tc,wOut(it,v),false)};
        if(tgs==='dir'){
          var dr=document.createElement('div');dr.className='tgdir';
          [['Reverse',-1,'◀'],['Stop',0,'■'],['Forward',1,'▶']].forEach(function(d){
            var b=document.createElement('button');b.type='button';b.className='tgd';b.setAttribute('data-d',String(d[1]));
            var ic=document.createElement('i');ic.textContent=d[2];ic.setAttribute('aria-hidden','true');
            var tx=document.createElement('span');tx.textContent=d[0];
            b.appendChild(ic);b.appendChild(tx);
            b.addEventListener('click',function(){tgDo(d[1]*tgp)});
            dr.appendChild(b);tgb.push(b);
          });
          el.appendChild(dr);
        }else{
          var tb=document.createElement('button');tb.type='button';tb.className='tgl '+tgs;
          tb.setAttribute('role','switch');
          if(tgs==='latch'){
            var k1=document.createElement('span');k1.className='k';tb.appendChild(k1);
            var l1=document.createElement('span');l1.className='lbl';k1.appendChild(l1);
          }else{
            var l2=document.createElement('span');l2.className='led';tb.appendChild(l2);
            var t2=document.createElement('span');t2.className='tx';tb.appendChild(t2);
          }
          tb.addEventListener('click',function(){tgDo(rt.t[tc]!==0?0:tgp)});
          el.appendChild(tb);tgb.push(tb);
          if(tgs==='led'&&it.w===2){
            var pb=document.createElement('div');pb.className='tgbar';var pi=document.createElement('i');pb.appendChild(pi);el.appendChild(pb);w.bar=pi;
          }
        }
        w.tg=tgb;w.tgs=tgs;
      }else if(it.k==='m'){
        var mt=it.t;
        if(mt.some(function(z){return !isActive(z.c)})) return;
        w.out=bdHead(el,'Mix · '+mt.map(function(z){return tagOf(z.c)+(z.r<0?'−':'')}).join(' '),it,true);
        bdOutZero(w.out,mt.map(function(z){return z.c}));
        var mr=document.createElement('input');mr.type='range';mr.min='-100';mr.max='100';mr.step='1';mr.value='0';
        mr.setAttribute('aria-label','Mixer');
        var mset=function(v){mt.forEach(function(z){setT(z.c,wOut(it,Math.max(-100,Math.min(100,Math.round(v*z.r/100)))),true)})};
        mr.addEventListener('pointerdown',function(){w.drag=true});
        mr.addEventListener('input',function(){noteInput();mset(+mr.value);if(w.out) w.out.textContent=fmtV(+mr.value)});
        var mrel=function(){
          w.drag=false;
          if(!it.hold&&!S.play&&!mt.some(function(z){return refs[z.c]&&refs[z.c].locked})){mr.value='0';mset(0)}
        };
        mr.addEventListener('pointerup',mrel);mr.addEventListener('pointercancel',mrel);
        if(it.v){var mv=document.createElement('div');mv.className='bdv';mv.appendChild(mr);el.appendChild(mv);el.classList.add('vert')}
        else{var mz=document.createElement('div');mz.className='bdhz';mr.classList.add('hsl');mz.appendChild(mr);el.appendChild(mz)}
        w.rng=mr;w.mix=mt;
      }else{
        var c=it.c;
        if(!isActive(c)) return;
        w.out=bdHead(el,tagOf(c)+' · '+C.ch[c].name,it,true);
        if(it.k==='s') bdOutZero(w.out,[c]);
        if(it.k==='s'){
          var r=document.createElement('input');r.type='range';r.min='-100';r.max='100';r.step='1';r.value='0';
          r.setAttribute('aria-label','Power of channel '+tagOf(c));
          var tsl={sl:true,c:c,r:r};
          // Train: the slider is a throttle lever; how far it is pushed sets how fast the speed changes, and the speed stays when it is let go
          var trn=it.tm?{tm:null,lastTap:0,hold:0,mk:null}:null;
          var trStep=function(){var now=performance.now(),dt=Math.min(.2,(now-(trn.t||now))/1000);trn.t=now;
            if(!w.drag||S.estop||S.play||!r.isConnected){clearInterval(trn.tm);trn.tm=null;return}
            var dv=+r.value/100,dz=0.08,e=Math.abs(dv)<=dz?0:Math.sign(dv)*(Math.abs(dv)-dz)/(1-dz);if(!e) return;
            var lim=Math.abs(wOut(it,100))||100,sg=wOut(it,100)<0?-1:1,cur=rt.t[c]*sg;
            if(trn.hold>0){trn.hold-=dt;return}
            var nv=cur+e*(it.tr||40)*dt;
            if(it.tp!==0&&cur!==0&&Math.sign(nv)!==Math.sign(cur)){nv=0;trn.hold=.5;feedback('tap')}
            nv=Math.max(-lim,Math.min(lim,nv));setT(c,Math.round(nv*sg),true)};
          r.addEventListener('pointerdown',function(){w.drag=true;if(C.tilt.all&&tiltActive()){TILT.zero=null;BD_TILT.cur=tsl}
            if(trn){var n=performance.now();if(n-trn.lastTap<320){setT(c,0,true);feedback('tap')}trn.lastTap=n;trn.t=n;trn.hold=0;if(!trn.tm) trn.tm=setInterval(trStep,40)}});
          r.addEventListener('input',function(){
            noteInput();
            if(trn){if(BD_TILT.cur!==tsl) return}
            if(BD_TILT.cur===tsl){r.value=String(Math.round(tiltVal()*100));return}
            if(it.snap){r.value=String(Math.round(+r.value/it.snap)*it.snap)}
            setT(c,wOut(it,+r.value),true);
          });
          var rel=function(){
            w.drag=false;
            if(BD_TILT.cur===tsl) BD_TILT.cur=null;
            if(trn){r.value='0';return}
            if(!it.hold&&!S.play&&!(refs[c]&&refs[c].locked)){r.value='0';setT(c,0,true)}
          };
          r.addEventListener('pointerup',rel);r.addEventListener('pointercancel',rel);
          if(it.v){
            var vw=document.createElement('div');vw.className='bdv';vw.appendChild(r);el.appendChild(vw);el.classList.add('vert');
          }else{var hz=document.createElement('div');hz.className='bdhz';r.classList.add('hsl');hz.appendChild(r);el.appendChild(hz)}
          w.rng=r;
          if(trn){var tc0=document.createElement('i');tc0.className='bt-chip trn';tc0.textContent='TRAIN';var hh2=el.querySelector('.bdw-h');if(hh2) hh2.appendChild(tc0);
            var mk=document.createElement('i');mk.className='trmk';mk.setAttribute('aria-hidden','true');(r.parentNode||el).appendChild(mk);w.trmk=mk;w.trn=1}
        }else{
          var hb=document.createElement('div');hb.className='holds';
          [['Reverse',-1],['Forward',1]].forEach(function(d){
            var b=document.createElement('button');b.type='button';b.className='hold '+(d[1]<0?'rev':'fwd');
            var ar=document.createElement('span'),tx=document.createElement('span');
            ar.textContent=d[1]<0?'◀':'▶';tx.textContent=d[0];ar.setAttribute('aria-hidden','true');
            if(d[1]<0){b.appendChild(ar);b.appendChild(tx)}else{b.appendChild(tx);b.appendChild(ar)}
            var down=false;
            function press(){if(down)return;down=true;b.classList.add('on');noteInput();setT(c,wOut(it,d[1]*100),false)}
            function lift(){if(!down)return;down=false;b.classList.remove('on');setT(c,0,false)}
            b.addEventListener('pointerdown',function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}press()});
            ['pointerup','pointercancel','lostpointercapture','blur'].forEach(function(ev){b.addEventListener(ev,lift)});
            b.addEventListener('contextmenu',function(e){e.preventDefault()});
            hb.appendChild(b);
          });
          el.appendChild(hb);
        }
      }
      if(dash) dashPlace(el,it);
      else if(bdEditing){
        if(it===bdPick) el.classList.add('psel');
        el.addEventListener('click',function(e){
          if(!bdEditing||dashOn()||(e.target.closest&&e.target.closest('.bdw-ed,.bdw-chip.tap,.bdw-lbl'))) return;
          bdPick=bdPick===it?null:it;bdPickAt=Date.now();syncBoard();
        });
      }
      // trim buttons on the widget (steering / slider / dial): a small fixed offset so the model runs straight
      if(it.tb&&!bdEditing&&typeof it.c==='number'&&it.c>=0&&C.ch[it.c]&&C.ch[it.c].kind!=='light') bdTrim(el,it.c);
      w.el=el;bdA11y(el,it);
      bdGrid.appendChild(el);bdW.push(w);
    });
    dashFit();
    bdNote.textContent=C.board.length?'':'The board is empty. Tap Edit board to add controls.';
    paintBoard();tiltNative();
  }
  function mirrorPairs(){
    if(S.estop||S.play||!C.board) return;
    C.board.forEach(function(it){
      if(typeof it.pc!=='number'||it.pc===it.c) return;
      var v=(it.pi?-1:1)*(rt.t[it.c]||0);
      if((rt.t[it.pc]||0)!==(v||0)) setT(it.pc,v,false);
    });
  }
  var OFFC='rgba(150,160,175,.32)';
  function ledRing(par,cx,cy,r,n,a0,span,sw){
    var a=[];
    for(var i=0;i<n;i++) a.push(sv('path',{d:mArc(cx,cy,r,a0-i*span/n-0.8,a0-(i+1)*span/n+0.8),fill:'none','stroke-width':sw,stroke:OFFC},par));
    return a;
  }
  // Start / stop button: red ring = hub link off, glowing yellow = on (green power symbol), yellow flashing = E-stop or hub fault
  function psFault(){
    var lb=$('#lostBanner');
    return !!S.estop||(!!hubMsg&&hubMsg!=='Pairing…')||!!(lb&&!lb.hidden);
  }
  function paintVw(v){
    var now=performance.now(), n=v.ring.length, on=v.it.md?!S.outOff:!!S.connected, T=on?'#ffd84a':PAL.r, flt=psFault();
    // connecting (pairing): a short yellow tail runs round the ring; when the hub answers the ring fills yellow
    if(!v.it.md&&on&&!flt&&!S.estop&&hubMsg==='Pairing…'){
      var hd=Math.floor(now/45)%n;
      for(var q=0;q<n;q++){var d=(hd-q+n)%n,cq=d===0?'#ffd84a':d<7?'rgba(255,216,74,'+(1-d/7).toFixed(2)+')':OFFC;
        if(v.ring[q]._c!==cq){v.ring[q]._c=cq;v.ring[q].setAttribute('stroke',cq);v.glow[q].setAttribute('stroke',d<3?'#ffd84a':'transparent')}}
      if(v.st.textContent!=='') v.st.textContent='';
      v.t1.style.display=v.t2.style.display='';
      v.ic.setAttribute('stroke','#ffd84a');v.t1.setAttribute('fill','#e8e8ea');v.t1.setAttribute('font-size',14);v.t1.setAttribute('y',58);
      v.t2.setAttribute('fill',PAL.r);v.t2.setAttribute('font-size',10);v.t2.setAttribute('y',71);v.glowg.setAttribute('opacity',.8);
      v.tgt='busy';for(var q2=0;q2<n;q2++) v.col[q2]=OFFC;return;
    }
    if(v.tgt!==T){v.tgt=T;v.ai=0;v.t=now}
    // one more LED changes every ~22 ms, clockwise from the top
    var steps=Math.max(1,Math.floor((now-v.t)/22));
    if(v.ai<n){var upto=Math.min(n,v.ai+steps);for(;v.ai<upto;v.ai++) v.col[v.ai]=T;v.t=now}
    var blink=flt&&(Math.floor(now/450)%2===0);
    for(var i=0;i<n;i++){
      var c=flt?(blink?'#ffd84a':OFFC):(v.col[i]||OFFC);
      if(v.ring[i]._c!==c){v.ring[i]._c=c;v.ring[i].setAttribute('stroke',c);v.glow[i].setAttribute('stroke',c==='rgba(150,160,175,.32)'?'transparent':c)}
    }
    var word=S.estop?'E-STOP':flt?'FAULT':'', wc=flt?'#ffd84a':on?'#ffd84a':PAL.r;
    if(v.st.textContent!==word){v.st.textContent=word}
    v.st.setAttribute('fill',wc);
    // E-STOP / FAULT replace START/STOP inside the button; the ring stays centred in the card
    v.t1.style.display=v.t2.style.display=word?'none':'';
    // centre button: red ring + white/red wording when stopped, all yellow when started
    v.ic.setAttribute('stroke',on?'#ffd84a':PAL.r);
    // stopped: big white START, small red STOP; started: small yellow START, big white STOP
    v.t1.setAttribute('fill',on?'#ffd84a':'#e8e8ea');v.t1.setAttribute('font-size',on?10:14);v.t1.setAttribute('y',on?53:58);
    v.t2.setAttribute('fill',on?'#fff':PAL.r);v.t2.setAttribute('font-size',on?14:10);v.t2.setAttribute('y',on?69:71);
    v.glowg.setAttribute('opacity',on&&!flt?.95:.55);
    v.b.classList.toggle('flt',flt);
  }
  /* ---------- LED widgets: matrix, bars, turn signals, gear, light panel, message strip ---------- */
  var LXOFF='rgba(150,160,175,.17)';
  function lxCol(v){v=Math.abs(v);return v>80?PAL.r:v>55?PAL.o:PAL.g}
  var LXPAT={up:['00011000','00111100','01111110','11111111','00111100','00111100','00111100','00111100'],
    dn:['00111100','00111100','00111100','00111100','11111111','01111110','00111100','00011000'],
    rt:['00001000','00001100','11111110','11111111','11111111','11111110','00001100','00001000'],
    lt:['00010000','00110000','01111111','11111111','11111111','01111111','00110000','00010000'],
    st:['10000001','01000010','00100100','00011000','00011000','00100100','01000010','10000001'],
    id:['00000000','00000000','00000000','00011000','00011000','00000000','00000000','00000000']};
  function lxOut(c){var v=Math.round(rt.o[c]||0);return isFinite(v)?v:0}
  /* Light programs: each light panel plays its own pattern across its light channels, and several
     panels (on different hubs) can play at the same time. Starting a panel stops only programs that
     share one of its channels. Steps are 200 ms or longer so the hub keeps up.
     E-Stop, a recording playing back, or a tap stops it. */
  var LXPN=['','Chase','Bounce','Alternate','Police','All blink','Fill','Twinkle'];
  function lxpOn(pr,n,k,i){
    if(n<2&&pr!==7) pr=5;
    switch(pr){
      case 1: return i===k%n;
      case 2: var pd=2*n-2,p=k%pd;return i===(p<n?p:pd-p);
      case 3: return (i+k)%2===0;
      case 4: var ph=k%8,left=i<Math.ceil(n/2);return left?(ph===0||ph===2):(ph===4||ph===6);
      case 5: return k%2===0;
      case 6: var f=k%(2*n);return f<n?i<=f:i>f-n;
      case 7: var h=Math.sin((k+1)*12.9898+(i+1)*78.233)*43758.5453;return (h-Math.floor(h))<.45;
    }
    return false;
  }
  var LXPS=[];
  function lxpRun(it){if(!LXPS) return null;for(var q=0;q<LXPS.length;q++) if(LXPS[q].it===it) return LXPS[q];return null}
  // stop the program of panel it (or every program when it is not given); quiet keeps the lights as they are
  function lxpStop(quiet,it){
    var keep=[],any=false;
    (LXPS||[]).forEach(function(P){if(it&&P.it!==it){keep.push(P);return}any=true;clearInterval(P.iv);P.on=false;
      if(!quiet) P.chs.forEach(function(c){if(C.ch[c]&&C.ch[c].kind==='light') setT(c,0,false)})});
    LXPS=keep;if(any) paintBoard();
  }
  function lxpStart(it,chs){
    lxpStop(false,it);if(!chs.length){toast('This panel has no light channels to play.');return}
    LXPS.slice().forEach(function(P){if(P.chs.some(function(c){return chs.indexOf(c)>=0})) lxpStop(false,P.it)});
    var P={it:it,chs:chs,t0:performance.now(),iv:0,k:0,nx:0,on:true};LXPS.push(P);
    // The step time is read on every tick, so a new Program speed takes effect at once
    // (it used to be fixed when the program started). Slow 800 ms, Normal 400 ms, Fast 180 ms per step.
    function tick(){
      if(!P.on) return;
      if(S.estop){lxpStop(true,it);return}
      if(S.play) return;
      var now=performance.now(),ms=Math.max(120,[0,800,400,180][P.it.ps||2]*(P.it.pr===4?.7:1));
      if(!P.nx) P.nx=now+ms; else if(now>=P.nx){P.k++;P.nx=Math.max(P.nx+ms,now+ms*.5)}
      var k=P.k,n=P.chs.length;
      P.chs.forEach(function(c,i){if(!C.ch[c]||C.ch[c].kind!=='light') return;var want=lxpOn(it.pr,n,k,i)?(C.ch[c].bright||100):0;if(rt.t[c]!==want) setT(c,want,false)});
    }
    P.iv=setInterval(tick,50);tick();paintBoard();
  }
  function lxBuild(el,it){
    var t=it.t,c=it.c,o={it:it,key:''},TXT='var(--fg,#e8e8ea)';
    var NAME={mx:'LED arrows',eq:'LED bars',ts:'Turn signals',gi:'Gear LED',lp:'Light panel',tk:'Message strip'}[t];
    var hd=bdHead(el,(t==='tk'||t==='lp')?NAME:NAME+' \u00b7 '+tagOf(c)+' \u00b7 '+C.ch[c].name,it,t!=='tk'&&t!=='lp');
    o.hd=hd;
    var box=document.createElement('div');box.className='lx-box lx-'+t;el.appendChild(box);
    function SVG0(w,h){var g=sv('svg',{viewBox:'0 0 '+w+' '+h,'class':'lx-svg','preserveAspectRatio':'xMidYMid meet','aria-hidden':'true'},box);return g}
    if(t==='mx'){
      var g=SVG0(100,100);sv('rect',{x:2,y:2,width:96,height:96,rx:10,'class':'lx-pan'},g);
      o.d=[];for(var r=0;r<8;r++)for(var q=0;q<8;q++)o.d.push(sv('circle',{cx:13.5+q*10.4,cy:13.5+r*10.4,r:3.9,fill:LXOFF},g));
      o.paint=function(){
        var a=S.estop?0:Math.round(crzT(c)||0),b=(it.d>=0&&it.d!==undefined)?Math.round(crzT(it.d)||0):0,now=performance.now();
        var dir=S.estop?'st':Math.abs(b)>30?(b>0?'rt':'lt'):a>5?'up':a<-5?'dn':'id';
        var my=it.ic===1&&dir!=='st',P=my?(it.px||LXPAT.up):LXPAT[dir],cl=dir==='st'?PAL.r:'#ffd84a';
        var dim=dir==='st'?'rgba(226,75,74,.35)':'rgba(255,216,74,.38)';
        var sp=dir==='lt'||dir==='rt'?Math.abs(b):Math.abs(a),moving=dir!=='st'&&dir!=='id'&&!(my&&Math.abs(a)<=5&&Math.abs(b)<=30);
        var on=true,dx=0,dy=0;
        if(it.an===1){
          // scroll: the picture slides along, faster with more power (2 to 16 dots a second)
          if(moving){o.sx=(o.sx||0)+(now-(o.st||now))/1000*(2+sp/100*14);}
          o.st=now;var st8=Math.floor(o.sx||0)%8;
          var sdir=my?(dir==='lt'||(dir!=='rt'&&a<0)?'lt':'rt'):dir;
          if(moving){if(sdir==='rt') dx=st8;else if(sdir==='lt') dx=8-st8;else if(sdir==='up') dy=8-st8;else if(sdir==='dn') dy=st8}
          if(my&&!moving) on=false;
        }else{
          var per=Math.max(220,900-sp*7);on=(dir==='st'||moving)?(now%per<per*.65):!my;
        }
        var key=dir+(on?1:0)+(my?'m':'')+dx+','+dy;if(o.key===key) return;o.key=key;
        // the picture pulses between bright and dim; it never goes dark, so it always reads
        o.d.forEach(function(d,ix){var r=((ix>>3)-dy+8)%8,q=((ix&7)-dx+8)%8;d.setAttribute('fill',P[r][q]==='1'?(on?cl:dim):LXOFF)});
        if(hd){var tx={up:'\u25B2 '+a,dn:'\u25BC '+(-a),rt:'\u25B6',lt:'\u25C0',st:'STOP',id:'0'}[dir];if(hd.textContent!==tx) hd.textContent=tx}
      };
    }else if(t==='eq'){
      // Both ways: forward lights up from the middle line, reverse lights down in blue.
      // Each bar shows its value on top; tap a bar to mute its channel.
      var chs=[c].concat(it.cs||[]),n=chs.length,W=n*30+10,g2=SVG0(W,125),EQ2=!it.ow,NS=EQ2?14:10,PT=EQ2?6.43:9,SH=EQ2?4.7:6.4;g2.setAttribute('viewBox','0 13 '+W+' 125');
      sv('rect',{x:1,y:14,width:W-2,height:104,rx:9,'class':'lx-pan'},g2);
      if(EQ2) sv('line',{x1:6,x2:W-6,y1:66,y2:66,stroke:'rgba(200,208,220,.35)','stroke-width':1},g2);
      o.v=[];o.m=[];
      o.b=chs.map(function(ch,j){var a=[];
        for(var k=0;k<NS;k++){var y=EQ2?(k<7?62.5-k*PT-SH:69.5+(k-7)*PT):105-k*PT-SH;a.push(sv('rect',{x:10+j*30,y:y.toFixed(2),width:20,height:SH,rx:1.4,fill:LXOFF},g2))}
        sv('text',{x:20+j*30,y:133,'text-anchor':'middle','font-size':11,'font-weight':800,fill:TXT},g2).textContent=tagOf(ch);
        o.m.push(sv('rect',{x:6+j*30,y:15,width:28,height:102,rx:6,fill:'rgba(10,12,16,.6)',visibility:'hidden'},g2));
        o.v.push(sv('text',{x:20+j*30,y:69,'text-anchor':'middle','font-size':8,'font-weight':900,fill:PAL.r},g2));
        return a});
      g2.style.pointerEvents='auto';g2.style.cursor='pointer';
      g2.addEventListener('click',function(e){
        if(bdEditing) return;
        var rc=g2.getBoundingClientRect(),sc=Math.min(rc.width/W,rc.height/125),x0=rc.left+(rc.width-W*sc)/2,j=Math.floor(((e.clientX-x0)/sc-5)/30);
        if(j<0||j>=n) return;var ch=chs[j];
        if(MUTE[ch]) delete MUTE[ch]; else MUTE[ch]=1;
        o.key='';feedback(MUTE[ch]?'hold':'ok');
      });
      o.paint=function(){
        var vs=chs.map(lxOut),key=vs.map(function(v,j){return (MUTE[chs[j]]?'m':'')+(EQ2?Math.round(v/100*7):Math.round(Math.abs(v)/10))+'|'+Math.round(v)}).join(',');
        if(o.key!==key){o.key=key;o.b.forEach(function(arr,j){var v=vs[j],mu=!!MUTE[chs[j]];
          arr.forEach(function(rc,k){var on,cl;
            if(EQ2){if(k<7){var vv=(k+.5)/7*100;on=v>0&&vv<=v;cl=lxCol(vv)}else{var vr=(k-7+.5)/7*100;on=v<0&&vr<=-v;cl=PAL.b}}
            else{var va=(k+.5)*10;on=va<=Math.abs(v);cl=lxCol(va)}
            rc.setAttribute('fill',on&&!mu?cl:LXOFF)});
          var tx=mu?'MUTE':'';if(o.v[j].textContent!==tx) o.v[j].textContent=tx;
          o.m[j].setAttribute('visibility',mu?'visible':'hidden')})}
        if(hd){var tx=mSgn(vs[0]);if(hd.textContent!==tx) hd.textContent=tx}
      };
    }else if(t==='ts'){
      var g3=SVG0(200,60);sv('rect',{x:2,y:2,width:196,height:56,rx:12,'class':'lx-pan'},g3);
      o.L=sv('path',{d:'M50 14 l-30 16 30 16z',fill:LXOFF},g3);o.R=sv('path',{d:'M150 14 l30 16 -30 16z',fill:LXOFF},g3);
      o.q=[];for(var k3=0;k3<5;k3++) o.q.push(sv('circle',{cx:76+k3*12,cy:30,r:4,fill:LXOFF},g3));
      o.paint=function(){
        var b=S.estop?0:Math.round(crzT(c)||0),th=it.th||20,now=performance.now(),bl=Math.floor(now/450)%2===0,rgt=b>=th,lft=b<=-th,sq=Math.floor(now/110)%6;
        var key=(rgt?'r':lft?'l':'-')+(bl?1:0)+sq;if(o.key===key) return;o.key=key;
        o.R.setAttribute('fill',rgt&&bl?PAL.o:LXOFF);o.L.setAttribute('fill',lft&&bl?PAL.o:LXOFF);
        o.q.forEach(function(d,j){var on=bl&&(rgt?j<sq:lft?(4-j)<sq:false);d.setAttribute('fill',on?PAL.o:LXOFF)});
        if(hd){var tx=rgt?'\u25B6':lft?'\u25C0':'\u2014';if(hd.textContent!==tx) hd.textContent=tx}
      };
    }else if(t==='gi'){
      var gw=(C.board||[]).filter(function(x){return x.k==='g'&&x.c===c})[0]||{},gl=gearsOf(gw),gn=gl.length,GW=gn*36+8,g4=SVG0(GW,72);
      sv('rect',{x:1,y:1,width:GW-2,height:70,rx:10,'class':'lx-pan'},g4);
      o.g=gl.map(function(gd,j){var rc=sv('rect',{x:8+j*36,y:8,width:28,height:36,rx:6,fill:'#11141a'},g4);var tx=sv('text',{x:22+j*36,y:33,'text-anchor':'middle','font-size':19,'font-weight':900,fill:'#3a414d'},g4);tx.textContent=gd[0];return [rc,tx,wOut(gw,gd[1])]});
      o.p=[];for(var k4=0;k4<11;k4++) o.p.push(sv('circle',{cx:12+k4*(GW-24)/10,cy:58,r:3.4,fill:LXOFF},g4));
      o.paint=function(){
        var tv=Math.round(rt.t[c]||0),best=-1,bd=1e9;o.g.forEach(function(gg,j){var dd=Math.abs(gg[2]-tv);if(dd<bd){bd=dd;best=j}});
        if(bd>12) best=-1;
        var pw=Math.abs(lxOut(c)),key=best+'|'+Math.round(pw/9);if(o.key===key) return;o.key=key;
        o.g.forEach(function(gg,j){var on=j===best;gg[0].setAttribute('fill',on?'#ffd84a':'#11141a');gg[1].setAttribute('fill',on?'#1b1b1b':'#3a414d')});
        o.p.forEach(function(d,j){var vv=(j+.5)/11*100;d.setAttribute('fill',vv<=pw?lxCol(vv):LXOFF)});
        if(hd){var tx=best>=0?o.g[best][1].textContent:'\u2013';if(hd.textContent!==tx) hd.textContent=tx}
      };
    }else if(t==='lp'){
      var lcs=[c].concat(it.cs||[]).filter(isActive),grid=document.createElement('div');grid.className='lx-lpg';box.appendChild(grid);
      o.bs=lcs.map(function(lc){
        var b=document.createElement('button');b.type='button';b.className='lx-lb';
        var dot=document.createElement('i');var nm=document.createElement('span');nm.textContent=tagOf(lc)+' \u00b7 '+C.ch[lc].name;b.appendChild(dot);b.appendChild(nm);
        var lp=0,lpd=false;
        b.addEventListener('pointerdown',function(){lpd=false;clearTimeout(lp);lp=setTimeout(function(){lpd=true;if(S.estop||S.play) return;var any=lcs.some(function(x){return rt.t[x]>0});
          lcs.forEach(function(x){if(C.ch[x].kind!=='light'){C.ch[x].kind='light';syncChannel(x)}setT(x,any?0:(C.ch[x].bright||100),false)});feedback('hold');save()},650)});
        ['pointerup','pointercancel','pointerleave'].forEach(function(ev){b.addEventListener(ev,function(){clearTimeout(lp)})});
        b.addEventListener('contextmenu',function(e){e.preventDefault()});
        b.addEventListener('click',function(){if(lpd){lpd=false;return}noteInput();if(S.estop||S.play) return;
          if(lxpRun(it)) lxpStop(true,it);
          if(C.ch[lc].kind!=='light'){C.ch[lc].kind='light';syncChannel(lc);save()}setT(lc,rt.t[lc]>0?0:(C.ch[lc].bright||100),false)});
        grid.appendChild(b);return [b,lc];
      });
      if(it.pr){
        var pg=document.createElement('button');pg.type='button';pg.className='lx-pg';box.appendChild(pg);o.pg=pg;
        pg.addEventListener('click',function(){noteInput();if(lxpRun(it)){lxpStop(false,it);return}if(S.estop||S.play) return;
          lxpStart(it,lcs.filter(function(x){return C.ch[x].kind==='light'}));feedback('ok')});
      }
      o.paint=function(){var run=!!lxpRun(it),key=o.bs.map(function(q){return rt.t[q[1]]>0?1:0}).join('')+(S.estop?'e':'')+(run?'r':'');if(o.key===key) return;o.key=key;
        if(o.pg){var pt=(run?'\u25A0 ':'\u25B6 ')+LXPN[it.pr];if(o.pg.textContent!==pt) o.pg.textContent=pt;o.pg.setAttribute('aria-pressed',String(run))}
        o.bs.forEach(function(q){q[0].classList.toggle('on',rt.t[q[1]]>0);q[0].setAttribute('aria-pressed',String(rt.t[q[1]]>0));q[0].disabled=!!S.estop});};
    }else{
      var tw=document.createElement('div');tw.className='lx-tkw';var sp=document.createElement('span');tw.appendChild(sp);box.appendChild(tw);
      var sp1=document.createElement('b'),sp2=document.createElement('b');sp2.setAttribute('aria-hidden','true');sp.appendChild(sp1);sp.appendChild(sp2);
      o.pend='';var SEPK='   \u2022   ';
      function msg(){
        var m=[];if(S.estop) m.push('E-STOP ON');
        if(!S.connected) m.push('HUB NOT CONNECTED'); else m.push('HUB ACTIVE');
        if(CRZ.on){var ks=Object.keys(CRZ.v);m.push(ks.length?'CRUISE '+ks.map(function(k){return tagOf(+k)+' '+mSgn(CRZ.v[k])+'%'}).join(' '):'CRUISE ON')}
        var mv=activeIdx().filter(function(i){return C.ch[i].kind!=='light'&&Math.abs(lxOut(i))>=10}).map(function(i){return tagOf(i)+' '+mSgn(Math.round(lxOut(i)/10)*10)+'%'});
        if(mv.length) m.push(mv.join('  '));
        var p=-1;if(NB&&NB.battery){try{p=+NB.battery()}catch(e){}}if(p>=0) m.push('PHONE '+p+'%');
        var ap=activeProfile();m.push(ap&&ap.name?ap.name:'MK6');
        return m.join('   \u2022   ');
      }
      function skey(){return [S.estop?1:0,S.connected?1:0,CRZ.on?Object.keys(CRZ.v).length+1:0].join('')}
      function apply(restart){var tx=msg();o.sk=skey();if(sp1.textContent===tx+SEPK) return;sp1.textContent=tx+SEPK;sp2.textContent=tx+SEPK;var dur=Math.max(5,tx.length*([0,.22,.15,.09][it.sp||2]));sp.style.animationDuration=dur.toFixed(1)+'s';
        if(restart){sp.style.animation='none';void sp.offsetWidth;sp.style.animation='';sp.style.animationDuration=dur.toFixed(1)+'s'}}
      sp.addEventListener('animationiteration',function(){apply(false)});apply(false);
      // hub, E-Stop and Cruise changes show at once; the rest waits for the next pass
      o.paint=function(){if(o.sk!==skey()) apply(true)};
    }
    return o;
  }
  // Live frames: a widget's rim turns green while its motor runs, red at full stroke, and blinks red on E-Stop
  var LVF_T=0;
  function lvFrames(){
    var nw=Date.now();if(nw-LVF_T<110) return;LVF_T=nw;
    var on=store.prefs.lframe!==false&&!bdEditing, full=(C.zone||100)*0.97;
    bdW.forEach(function(w){
      var el=w.el,it=w.it;if(!el||!it) return;
      var st='';
      if(on&&it.k!=='e'&&it.k!=='ps'){
        if(S.estop) st=chOfIt(it).length?'lv-stop':'';
        else chOfIt(it).forEach(function(c){
          if(st==='lv-lim'||!C.ch[c]) return;
          var t=Math.abs(rt.t[c]||0), o=Math.abs(rt.o[c]||0);
          if(t>=full&&o>=3) st='lv-lim'; else if(o>=3||(C.ch[c].kind==='light'&&t>0)) st='lv-run';
        });
      }
      if(el.__lv!==st){if(el.__lv) el.classList.remove(el.__lv);if(st) el.classList.add(st);el.__lv=st}
    });
  }
  function paintBoard(){
    (LXPS||[]).slice().forEach(function(P){if((C.board||[]).indexOf(P.it)<0) lxpStop(true,P.it)});
    if(!bdW||!bdW.length) return;
    mirrorPairs();
    paintPads();
    lvFrames();
    bdW.forEach(function(w){
      if(w.el&&w.el.__xyd) xyDots(w);
      if(w.es){
        w.es.classList.toggle('on',!!S.estop);
        w.es.textContent=S.estop?'RELEASE':'E-STOP';
      }else if(w.lb){
        var lv=rt.t[w.it.c]>0, lmd=lightMode(w.it.c);
        w.lb.classList.toggle('on',lv);w.lb.classList.toggle('blink',lmd===4);
        var lt=w.lb.firstChild&&w.lb.firstChild.nodeType===3?w.lb.firstChild:null, ltx=LMODES[lmd].t;
        if(!lt){lt=document.createTextNode('');w.lb.insertBefore(lt,w.lb.firstChild)}
        if(w.lmd!==lmd){w.lmd=lmd;lt.data=ltx}
        if(w.lvl) [].forEach.call(w.lvl.children,function(q,i){q.classList.toggle('on',lmd>0&&i<lmd)});
        w.lb.disabled=S.estop||!!S.play;
        if(w.out){var lpt=lv?Math.round(rt.t[w.it.c])+'%':'0%';if(w.out.textContent!==lpt) w.out.textContent=lpt}
      }else if(w.spdt){
        var sd=w.spdt, sps=sd.pos();
        sd.sw.setAttribute('data-pos',sps||'n');sd.sw.setAttribute('aria-checked',String(sps==='b'));
        sd.la.classList.toggle('on',sps==='a');sd.lb.classList.toggle('on',sps==='b');
        sd.sw.disabled=S.estop||!!S.play;
      }else if(w.auto){
        var ac0=w.auto.it.c, ar=AUTOT[ac0]?Math.max(0,Math.ceil(w.auto.it.s-(performance.now()-AUTOT[ac0])/1000)):0;
        var at0=AUTOT[ac0]?ar+' s':'ON';
        if(w.auto.t.textContent!==at0) w.auto.t.textContent=at0;
        var as0=(w.auto.it.s+' s limit \u00b7 tap to change');
        if(w.auto.s.textContent!==as0) w.auto.s.textContent=as0;
        w.auto.t.parentNode.classList.toggle('over',!!AUTOT[ac0]&&ar<=3);
        w.auto.t.parentNode.classList.toggle('run',!AUTOT[ac0]);
      }else if(w.yr){
        var yv0r=rt.t[w.yr.c], yv0=wIn(w.yr.it,yv0r);
        if(w.out) w.out.textContent=fmtV(yv0r);
        if(w.yr.m) w.yr.m.upd();
        w.yr.bs.forEach(function(b){var d=+b.getAttribute('data-d');b.classList.toggle('on',d===0?yv0===0:(d>0?yv0>0:yv0<0));b.disabled=S.estop||!!S.play});
      }else if(w.mtr){
        w.mtr.upd();
      }else if(w.dial){
        var dvr=rt.t[w.dial.c], dv=wIn(w.it,dvr);if(w.it.ow&&dv<0) dv=0;
        if(w.out) w.out.textContent=fmtV(dvr);
        w.dial.i.style.transform='rotate('+(w.it.ow?-135+dv/100*270:dv/100*135)+'deg)';
        w.dial.k.setAttribute('aria-valuenow',String(dv));
        w.dial.k.classList.toggle('on',dv!==0);
        if(w.dial.lv!==dv){
          w.dial.lv=dv;w.dial.sg.forEach(function(q){var on=w.it.ow?q.v<=dv&&dv>0:(q.v>0&&q.v<=dv)||(q.v<0&&q.v>=dv),col=on?mCol(q.v,MTH[(w.it.th===1||w.it.th===2)?w.it.th:0]):'rgba(150,160,175,.32)';if(q.f!==col){q.f=col;q.e.setAttribute('fill',col)}})}
      }else if(w.rsd){
        var rd0=w.rsd,rsel=rd0.cur(),ron=!S.estop&&rd0.on();
        w.rsd.i.style.transform='rotate('+rd0.ang(rsel)+'deg)';
        w.rsd.k.classList.toggle('on',ron);w.rsd.k.setAttribute('aria-valuenow',String(rsel+1));
        var rtxt=(rd0.sc?'P'+(rsel+1):'ABCDEF'.charAt(rd0.ch(rsel)%PER))+(ron?' ON':'');if(w.out&&w.out.textContent!==rtxt) w.out.textContent=rtxt;
        var rlv=ron?Math.min(1,(rd0.sc?rd0.used.reduce(function(a,j){return Math.max(a,Math.abs(rt.t[rd0.b+j]||0))},0):Math.abs(rt.t[rd0.ch(rsel)]))/100):0;
        rd0.dots.forEach(function(q,qi){
          var sel=qi===rsel,lv=sel?Math.round(rlv*20)/20:0,sk=(sel?'s':'o')+lv;if(q.st===sk) return;q.st=sk;
          // like the arc meter: the current position is a bigger red dot, the others small grey dots
          q.c.setAttribute('fill',sel?'var(--danger,#E03E3E)':'#8a93a0');
          q.c.setAttribute('r',sel?'3.6':'2.4');
          q.c.setAttribute('opacity',sel?String(.7+.3*lv):'.55');
          q.h.setAttribute('opacity',String(.35*lv));
        });
      }else if(w.stw){
        var sv0=wIn(w.it,rt.t[w.stw.c]);
        w.stw.k.style.transform='rotate('+(sv0/100*w.stw.rg)+'deg)';
        (function(){var rg=w.stw.rg,cv=Math.max(-100,Math.min(100,sv0)),sg=cv<0?-1:1,m=Math.abs(cv),B=[0,55,80,100];
          w.stw.zs.forEach(function(pg,zi){
            var lo=B[zi],hi=Math.min(B[zi+1],m),pts='';
            if(m>lo){var n=Math.max(2,Math.ceil((hi-lo)/100*rg/4));pts='50,50';
              for(var q=0;q<=n;q++){var a=sg*(lo+(hi-lo)*q/n)/100*rg,r=a*Math.PI/180;pts+=' '+(50+70*Math.sin(r)).toFixed(2)+','+(50-70*Math.cos(r)).toFixed(2)}}
            if(pg._p!==pts){pg._p=pts;pg.setAttribute('points',pts)}})})();
        w.stw.k.setAttribute('aria-valuenow',String(sv0));
        if(w.out) w.out.textContent=fmtV(rt.t[w.stw.c]);
      }else if(w.lev){
        var lv0=wIn(w.it,rt.t[w.lev.c]),li0=0,lb0=1e9;
        w.lev.l.forEach(function(gd,gi){var dd=Math.abs(gd[1]-lv0);if(dd<lb0){lb0=dd;li0=gi}});
        w.lev.k.style.top=w.lev.y(li0)+'%';
        w.lev.b.forEach(function(b,i){b.classList.toggle('on',i===li0&&lb0<=8)});
        if(w.out) w.out.textContent=fmtV(rt.t[w.lev.c]);
      }else if(w.dpd){
        var dd0=w.dpd.r();
        Object.keys(w.dpd.bs).forEach(function(k){w.dpd.bs[k].classList.toggle('on',!!dd0[k]);w.dpd.bs[k].disabled=S.estop||!!S.play});
        if((S.estop||S.play)&&Object.keys(dd0).length) w.dpd.clr();
      }else if(w.gear){
        var gv=wIn(w.it,rt.t[w.gear.c]), gi0=-1, gbest=1e9;
        w.gear.list.forEach(function(gd,gi){var dd=Math.abs(gd[1]-gv);if(dd<gbest){gbest=dd;gi0=gi}});
        if(gbest>8) gi0=-1;
        if(w.out) w.out.textContent=fmtV(rt.t[w.gear.c]);
        w.gear.bs.forEach(function(b,i){b.classList.toggle('on',i===gi0);b.disabled=S.estop||!!S.play});
      }else if(w.vw){
        paintVw(w.vw);
      }else if(w.lx){
        w.lx.paint();
      }else if(w.sess){
        var sm=SESS.ms, tx0=fmtSess(sm), aMs=(w.it.a||0)*60000;
        if(w.sess.t.textContent!==tx0) w.sess.t.textContent=tx0;
        var st=(w.it.a?'Alert '+w.it.a+' min':'No alert')+' \u00b7 hold to reset';
        if(w.sess.s.textContent!==st) w.sess.s.textContent=st;
        w.sess.b.classList.toggle('run',!!S.connected);
        w.sess.b.classList.toggle('over',!!aMs&&sm>=aMs);
      }else if(w.tg){
        var tv=rt.t[w.it.c], ton=tv!==0;
        if(w.out) w.out.textContent=fmtV(tv);
        if(w.tgs==='dir'){
          w.tg.forEach(function(b){
            var d=+b.getAttribute('data-d');
            var tvu=wIn(w.it,tv);b.classList.toggle('on',d===(tvu>0?1:tvu<0?-1:0)&&(d!==0||!ton));
            b.disabled=S.estop||!!S.play;
          });
        }else{
          var tb0=w.tg[0];
          tb0.classList.toggle('on',ton);tb0.setAttribute('aria-checked',String(ton));
          tb0.disabled=S.estop||!!S.play;
          var tt=tb0.querySelector('.tx,.lbl');if(tt) tt.textContent=ton?'ON':'OFF';
          if(w.bar) w.bar.style.width=Math.min(100,Math.abs(tv))+'%';
        }
      }else if(w.mix){
        var z0=w.mix[0], mv0=Math.round(wIn(w.it,rt.t[z0.c])*100/z0.r);
        if(w.out&&!w.drag) w.out.textContent=fmtV(mv0);
        if(w.rng&&!w.drag&&+w.rng.value!==mv0) w.rng.value=String(mv0);
      }else if(w.it.k==='s'){
        var v=rt.t[w.it.c], vu=wIn(w.it,v);
        if(w.out) w.out.textContent=fmtV(v);
        // Train: the lever rests at the centre; a green mark shows the speed that is being kept
        if(w.trn){if(w.trmk){w.trmk.style.setProperty('--tv',String(vu));w.trmk.classList.toggle('on',v!==0)}}
        else if(w.rng&&!w.drag&&+w.rng.value!==vu) w.rng.value=String(vu);
      }
      if(w.pp) w.pp();
    });
  }
  function bdEditLocked(){return (!!S.connected&&RH()||!!store.prefs.bdlock)&&!bdEditing}
  function bdEditPaint(){
    if(!bdEditBtn) return;
  var lk=bdEditLocked();bdEditBtn.disabled=lk;
    bdEditBtn.setAttribute('aria-pressed',String(bdEditing));
    bdEditBtn.textContent=bdEditing?'Done editing':lk?(store.prefs.bdlock?'Board locked':'Stop the hub to edit the board'):'Edit board';
    var on=!!store.prefs.bdlock;document.documentElement.classList.toggle('bdlk',on);
    ['#bdLock','#dbLock'].forEach(function(q){var bl=$(q);if(bl&&bl._on!==on){bl._on=on;bl.setAttribute('aria-pressed',String(on));bl.textContent=on?'🔒':'🔓';bl.setAttribute('aria-label',tr2(on?'Board locked':'Board unlocked'))}})
  }
  function bdEditEnd(why){bdEditing=false;dashAdd=false;bdPick=null;snapBoard();syncBoard();if(why) toast('Hub started: board editing ended.')}
  bdEditBtn.addEventListener('click',function(){if(bdEditLocked()){toast(store.prefs.bdlock?'Board locked. Tap 🔒 to unlock.':'Stop the hub to edit the board.');return}bdEditing=!bdEditing;if(!bdEditing) snapBoard();else{bdPick=null;if(!dashOn()) toast('Tap a widget to show its tools.')}syncBoard()});
  // 🔒 on the Board card (🔒 in the landscape bar too): widgets ignore touches, so the page can be scrolled with no accidental moves
  function bdLockTog(){store.prefs.bdlock=!store.prefs.bdlock;save();if(store.prefs.bdlock&&bdEditing) bdEditEnd();if(store.prefs.bdlock) feedback('ok');bdEditPaint();toast(store.prefs.bdlock?'Board locked: widgets ignore touches, scroll freely.':'Board unlocked: widgets work again.')}
  $('#bdLock').addEventListener('click',bdLockTog);$('#dbLock').addEventListener('click',function(){dashAdd=false;bdLockTog()});
  $('#dbEdit').addEventListener('click',function(){if(!bdEditing&&store.prefs.bdlock){toast('Board locked. Tap 🔒 to unlock.');return}bdEditing=!bdEditing;if(!bdEditing){dashAdd=false;snapBoard()}syncBoard()});
  $('#dbAdd').addEventListener('click',function(){dashAdd=!dashAdd;syncBoard()});
  var rstT=0;
  $('#dbReset').addEventListener('click',function(){
    var b=$('#dbReset');
    if(!rstT){b.textContent='Tap again';rstT=setTimeout(function(){rstT=0;b.textContent='Reset'},3000);return}
    clearTimeout(rstT);rstT=0;b.textContent='Reset';
    dashOn();
    BD_UNDO.push({board:JSON.parse(JSON.stringify(C.board))});if(BD_UNDO.length>20)BD_UNDO.shift();
    C.board.forEach(function(o){delete o[DG.k]});save();syncBoard();toast('Layout reset. Back undoes it.')});
  var DTPL={
    car:[{k:'s',c:0,w:1,v:true,g:[0,0,12,24]},{k:'l',c:2,w:1,g:[12,0,13,7]},{k:'b',c:0,w:1,g:[12,7,13,7]},
         {k:'t',c:3,y:'dir',w:1,g:[25,0,14,7]},{k:'l',c:4,w:1,g:[25,7,14,7]},{k:'e',w:1,g:[39,0,9,14]},{k:'s',c:1,w:1,g:[12,14,36,10]}],
    exc:[{k:'s',c:0,w:1,v:true,g:[0,0,7,24]},{k:'d',c:2,d:5,e:3,f:4,m:'axis',w:2,g:[7,0,34,24]},{k:'s',c:1,w:1,v:true,g:[41,0,7,24]}],
    mon:[{k:'i',c:0,w:1,g:[0,0,8,24]},{k:'f',c:0,w:1,g:[8,0,16,16]},{k:'s',c:0,w:1,g:[8,16,16,8]},{k:'k',c:0,w:1,g:[24,0,24,12]},{k:'y',c:0,w:1,p:80,d:4,sc:1,g:[24,12,24,12]}],
    four:[{k:'f',c:0,w:1,g:[0,0,12,10]},{k:'f',c:1,w:1,g:[12,0,12,10]},{k:'f',c:2,w:1,g:[24,0,12,10]},{k:'f',c:3,w:1,g:[36,0,12,10]},{k:'j',c:0,d:1,m:'axis',w:1,g:[0,10,22,14]},{k:'k',c:0,w:1,g:[22,10,26,14]}],
    dual:[{k:'j',c:0,d:1,m:'axis',w:1,g:[0,0,19,24]},{k:'e',w:1,g:[19,0,10,8]},{k:'l',c:4,w:1,g:[19,8,10,8]},{k:'b',c:0,w:1,g:[19,16,10,8]},
          {k:'j',c:2,d:3,m:'axis',w:1,g:[29,0,19,24]}]
  };
  function dtplMine(){
    var box=$('#dtplMine');box.textContent='';
    var L2=store.prefs.tpls;
    $('#dtplMineH').hidden=!L2.length;
    L2.forEach(function(t,i){
      var row=document.createElement('div');row.className='dtpl-row';
      var b=document.createElement('button');b.type='button';b.className='btn';b.setAttribute('data-my',String(i));
      b.appendChild(document.createTextNode(t.name));
      var sm=document.createElement('small');sm.textContent=t.board.length+' widget'+(t.board.length===1?'':'s');b.appendChild(sm);
      var x=document.createElement('button');x.type='button';x.className='btn dtpl-del';x.setAttribute('data-del',String(i));x.setAttribute('aria-label','Delete template '+t.name);x.textContent='\u2715';
      row.appendChild(b);row.appendChild(x);box.appendChild(row);
    });
    $('#dtplSave').disabled=!C.board.length;
  }
  function dtplApply(board,label){
    dashOn();
    BD_UNDO.push({board:JSON.parse(JSON.stringify(C.board))});if(BD_UNDO.length>20)BD_UNDO.shift();
    C.board=cleanBoard(JSON.parse(JSON.stringify(board)));
    if(DG.k!=='g') C.board.forEach(function(o){if(o.g){o[DG.k]=o.g.slice()}});
    dashTplShow(false);dashAdd=false;save();syncBoard();toast(label+' layout. Back undoes it.');
  }
  /* ---- Joystick settings dialog ---- */
  var jcItem=null;
  function jcPaint(){
    var j=jcItem&&jcItem.jc||{dz:0,sn:100,lm:100,ax:'f'};
    $('#jcDz').value=j.dz;$('#jcSn').value=j.sn;$('#jcLm').value=j.lm;
    $('#jcDzO').textContent=j.dz+'%';$('#jcSnO').textContent=j.sn+'%';$('#jcLmO').textContent=j.lm+'%';
    [].forEach.call($('#jcAx').querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-ax')===j.ax))});
  }
  function jcSwPaint(){
    var it=jcItem;$('#jcSwBox').hidden=!(it&&it.k==='j');
    [].forEach.call($('#jcSw').querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-sw')===(it&&it.sw?'1':'0')))});
  }
  [].forEach.call($('#jcSw').querySelectorAll('button'),function(b){b.addEventListener('click',function(){
    if(!jcItem) return;if(b.getAttribute('data-sw')==='1') jcItem.sw=1; else delete jcItem.sw;
    save();jcSwPaint();syncBoard();
  })});
  function jcShow(it){jcItem=it;jcPaint();jcSwPaint();$('#jcDlg').hidden=false}
  function jcRead(ax){
    if(!jcItem) return;
    var o=cleanJc({dz:+$('#jcDz').value,sn:+$('#jcSn').value,lm:+$('#jcLm').value,ax:ax||(jcItem.jc&&jcItem.jc.ax)||'f'});
    if(o) jcItem.jc=o; else delete jcItem.jc;
    save();jcPaint();
  }
  ['#jcDz','#jcSn','#jcLm'].forEach(function(q){$(q).addEventListener('input',function(){jcRead()})});
  [].forEach.call($('#jcAx').querySelectorAll('button'),function(b){b.addEventListener('click',function(){jcRead(b.getAttribute('data-ax'))})});
  $('#jcReset').addEventListener('click',function(){if(jcItem){delete jcItem.jc;save();jcPaint()}});
  ['#jcDz','#jcSn','#jcLm'].forEach(function(q){
    var inp=$(q), out=$(q+'O').parentNode===inp.parentNode?$(q+'O'):null;
    if(!out) return;
    var wrap=document.createElement('div');wrap.className='jcst';
    function mkb(t,d,l){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=t;b.setAttribute('aria-label',l);
      b.addEventListener('click',function(e){e.preventDefault();inp.value=String(Math.max(+inp.min,Math.min(+inp.max,(+inp.value)+d*(+inp.step||1))));inp.dispatchEvent(new Event('input',{bubbles:true}))});return b}
    out.parentNode.insertBefore(wrap,out);
    wrap.appendChild(mkb('\u2212',-1,'Decrease'));wrap.appendChild(out);wrap.appendChild(mkb('+',1,'Increase'));
  });
  $('#jcDone').addEventListener('click',function(){$('#jcDlg').hidden=true;jcItem=null});
  /* ---- Export / import layout ---- */
  function lxShow(mode){
    var ta=$('#lxText');
    $('#dashTpl').hidden=true;$('#lxDlg').hidden=false;
    if(mode==='export'){
      ta.value=JSON.stringify({mk6layout:1,board:C.board.map(function(o){var c=JSON.parse(JSON.stringify(o));return c})});
      $('#lxHelp').textContent='Copy this text to keep or share your layout.';
      $('#lxImport').hidden=true;$('#lxCopy').hidden=false;
      try{ta.focus();ta.select()}catch(e){}
    }else{
      ta.value='';
      $('#lxHelp').textContent='Paste a layout here, then press Import. It replaces the current layout. Back undoes it.';
      $('#lxImport').hidden=false;$('#lxCopy').hidden=true;
      try{ta.focus()}catch(e){}
    }
  }
  $('#lxExp').addEventListener('click',function(){
    if(!C.board.length){toast('Nothing to export yet.');return}
    lxShow('export')});
  $('#lxImp').addEventListener('click',function(){lxShow('import')});
  $('#lxX').addEventListener('click',function(){$('#lxDlg').hidden=true});
  $('#lxCopy').addEventListener('click',function(){
    var ta=$('#lxText');ta.focus();ta.select();
    var ok=false;try{ok=document.execCommand('copy')}catch(e){}
    if(!ok&&navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).then(function(){toast('Copied.')},function(){toast('Select the text and copy it.')});return}
    toast(ok?'Copied.':'Select the text and copy it.');
  });
  $('#lxImport').addEventListener('click',function(){
    var txt=$('#lxText').value.trim(),o=null;
    try{o=JSON.parse(txt)}catch(e){}
    var list=o&&(Array.isArray(o)?o:(o.mk6layout===1&&Array.isArray(o.board)?o.board:null));
    var b=list?cleanBoard(list):[];
    if(!b.length){toast('That is not a valid layout.',4000);return}
    $('#lxDlg').hidden=true;
    dtplApply(b,'Imported');
  });
  /* Wallpaper: one image for portrait and one for landscape, kept in this phone only */
  var WALL={p:'',l:'',fit:{p:'fill',l:'fill'}},wallLast='';
  try{WALL.p=localStorage.getItem('mk6wp')||'';WALL.l=localStorage.getItem('mk6wl')||'';WALL.fit.p=localStorage.getItem('mk6wfp')==='stretch'?'stretch':'fill';WALL.fit.l=localStorage.getItem('mk6wfl')==='stretch'?'stretch':'fill'}catch(e){}
  function wallSlot(){return document.documentElement.classList.contains('dash-l')?'l':'p'}
  function wallEl(){
    var e=document.getElementById('wallBg');
    if(!e){e=document.createElement('div');e.id='wallBg';e.setAttribute('aria-hidden','true');document.body.insertBefore(e,document.body.firstChild)}
    return e;
  }
  function wallTop(){var bar=document.querySelector('header.bar');var t=bar?Math.round(bar.getBoundingClientRect().bottom):0;wallEl().style.top=Math.max(0,t)+'px'}
  function wallFitOf(sl){var f=WALL.fit&&WALL.fit[sl];return f==='stretch'?'stretch':'fill'}
  function wallApply(force){
    var R=document.documentElement,sl=wallSlot(),u=R.classList.contains('dash')?WALL[sl]:'';
    var key=sl+'|'+(u?u.length:0)+'|'+wallFitOf(sl);if(key===wallLast&&!force) return;wallLast=key;
    var e=wallEl();
    if(u){
      e.style.backgroundImage='linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.12)),url("'+u+'")';
      e.style.backgroundSize=wallFitOf(sl)==='stretch'?'100% 100%':'cover';
      R.classList.add('has-wall');wallTop();
    }else{e.style.backgroundImage='';R.classList.remove('has-wall')}
  }
  new MutationObserver(function(){wallApply()}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  wallApply();
  window.addEventListener('resize',function(){if(document.documentElement.classList.contains('has-wall')) wallTop()});
  try{var wb=document.querySelector('header.bar');if(wb&&window.ResizeObserver) new ResizeObserver(function(){if(document.documentElement.classList.contains('has-wall')) wallTop()}).observe(wb)}catch(e){}
  window.onWallpaper=function(slot,url){
    if(!url){toast('No image was chosen.');return}
    slot=slot==='l'?'l':'p';
    try{localStorage.setItem(slot==='l'?'mk6wl':'mk6wp',url)}catch(e){toast('The image is too large to save.');return}
    WALL[slot]=url;wallLast='';wallApply();
    toast('Wallpaper set for '+(slot==='l'?'landscape':'portrait')+'.');
  };
  function wallLabel(){$('#wallH').textContent=wallSlot()==='l'?'Wallpaper (landscape)':'Wallpaper (portrait)';$('#wallClr').disabled=!WALL[wallSlot()];$('#wallFit').disabled=!WALL[wallSlot()];$('#wallFit').textContent=wallFitOf(wallSlot())==='stretch'?'Fit: Stretch':'Fit: Fill'}
  $('#wallPick').addEventListener('click',function(){
    var sl=wallSlot();
    if(NB&&NB.pickWallpaper){try{NB.pickWallpaper(sl)}catch(e){toast('Could not open the image picker.')}return}
    var f=document.createElement('input');f.type='file';f.accept='image/*';
    f.addEventListener('change',function(){
      var file=f.files&&f.files[0];if(!file){return}
      var img=new Image(),url=URL.createObjectURL(file);
      img.onload=function(){
        var k=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');
        c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        URL.revokeObjectURL(url);window.onWallpaper(sl,c.toDataURL('image/jpeg',.8));wallLabel();
      };
      img.onerror=function(){window.onWallpaper(sl,null)};img.src=url;
    });
    f.click();
  });
  $('#wallFit').addEventListener('click',function(){
    var sl=wallSlot();WALL.fit[sl]=wallFitOf(sl)==='stretch'?'fill':'stretch';
    try{localStorage.setItem(sl==='l'?'mk6wfl':'mk6wfp',WALL.fit[sl])}catch(e){}
    wallApply(true);wallLabel();
  });
  $('#wallClr').addEventListener('click',function(){
    var sl=wallSlot();WALL[sl]='';
    try{localStorage.removeItem(sl==='l'?'mk6wl':'mk6wp')}catch(e){}
    wallLast='';wallApply();wallLabel();toast('Default background restored.');
  });
  function dashTplShow(on){$('#dashTpl').hidden=!on;if(on){$('#dtplName').value='';dtplMine();wallLabel();var bl=function(){try{document.activeElement&&document.activeElement.blur()}catch(e){}};bl();setTimeout(bl,60)}}
  $('#dtplSave').addEventListener('click',function(){
    if(!C.board.length) return;
    dashOn();
    var nm=$('#dtplName').value.replace(/\s+/g,' ').trim().slice(0,24);
    var L2=store.prefs.tpls, ex=-1;
    if(!nm){var k=1;do{nm='My layout '+k;k++}while(L2.some(function(o){return o.name===nm}))}
    L2.forEach(function(o,i){if(o.name===nm) ex=i});
    if(ex<0&&L2.length>=10){toast('Up to 10 templates. Delete one first.');return}
    var bd=JSON.parse(JSON.stringify(C.board));
    if(DG.k!=='g') bd.forEach(function(o){if(o[DG.k]) o.g=o[DG.k].slice()});
    var t={name:nm,board:cleanBoard(bd)};
    if(ex>=0) L2[ex]=t; else L2.push(t);
    save();dtplMine();$('#dtplName').value='';
    toast(ex>=0?('Template "'+nm+'" updated.'):('Saved as "'+nm+'".'));
  });
  $('#dtplName').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();$('#dtplSave').click()}});
  $('#dtplMine').addEventListener('click',function(e){
    var d=e.target.closest&&e.target.closest('[data-del]');
    if(d){
      var i=+d.getAttribute('data-del');
      if(!d.classList.contains('arm')){d.classList.add('arm');d.textContent='Delete?';setTimeout(function(){if(d.isConnected){d.classList.remove('arm');d.textContent='\u2715'}},3000);return}
      var gone=store.prefs.tpls.splice(i,1)[0];save();dtplMine();if(gone) toast('Template "'+gone.name+'" deleted.');
      return;
    }
    var b=e.target.closest&&e.target.closest('[data-my]');if(!b) return;
    var t=store.prefs.tpls[+b.getAttribute('data-my')];if(t) dtplApply(t.board,t.name);
  });
  $('#dbTpl').addEventListener('click',function(){dashTplShow(true)});
  // Tidy: pack every widget (same size) to the first free spot, reading order, no gaps
  function dashTidy(){
    if(!dashOn()) return;
    var k=DG.k, list=C.board.filter(function(o){return o.k!=='e'&&o[k]});
    if(!list.length) return;
    BD_UNDO.push({board:JSON.parse(JSON.stringify(C.board))});if(BD_UNDO.length>20)BD_UNDO.shift();
    var order=list.slice().sort(function(a,b){return (a[k][1]-b[k][1])||(a[k][0]-b[k][0])});
    var size=order.map(function(o){return [o[k][2],o[k][3]]});
    // rows: an item joins the current row if its top is within half the row's first height
    var rows=[],cur=null;
    order.forEach(function(o,i){
      if(cur&&o[k][1]<cur.y+cur.h*0.5){cur.m.push(i);cur.h=Math.max(cur.h,size[i][1])}
      else{cur={y:o[k][1],h:size[i][1],m:[i]};rows.push(cur)}
    });
    rows.forEach(function(r){r.m.sort(function(a,b){return order[a][k][0]-order[b][k][0]})});
    order.forEach(function(o){delete o[k]});
    var bad=[], y=0;
    rows.forEach(function(r){
      var x=0,rh=0;
      r.m.forEach(function(i){
        var o=order[i],w=size[i][0],h=size[i][1];
        if(x>0&&x+w>DG.x){x=0;y+=rh;rh=0}
        var t=[x,y,w,h];
        while(dashHits(o,t)&&t[0]+w<DG.x) t[0]++;
        if(dashHits(o,t)||t[0]+w>DG.x||t[1]+h>DG.y){bad.push(o);return}
        o[k]=t;x=t[0]+w;rh=Math.max(rh,h);
      });
      y+=rh;
    });
    if(bad.length) dashAuto();
    save();syncBoard();toast('Widgets tidied. Back undoes it.');
  }
  $('#dbTidy').addEventListener('click',dashTidy);
  $('#dbTplX').addEventListener('click',function(){dashTplShow(false)});
  $('#dashTpl').addEventListener('click',function(e){
    if(e.target===this){dashTplShow(false);return}
    var b=e.target.closest&&e.target.closest('[data-tpl]');if(!b) return;
    var t=DTPL[b.getAttribute('data-tpl')];if(!t) return;
    dtplApply(t,b.firstChild.textContent.trim());
  });
  $('#dbBack').addEventListener('click',function(){
    var u=BD_UNDO.pop();if(!u){syncBoard();return}
    if(u.board){C.board=cleanBoard(u.board);save();syncBoard();toast(u.msg||'Previous layout back.');return}
    if(C.board.length>=16){BD_UNDO.push(u);toast('Board is full.');return}
    var it=u.it, k=DG&&DG.k, g=k&&it[k];
    if(g&&C.board.some(function(o){var h=o[k];return h&&g[0]<h[0]+h[2]&&h[0]<g[0]+g[2]&&g[1]<h[1]+h[3]&&h[1]<g[1]+g[3]})) delete it[k];
    if(k&&!it[k]){var g2=dashFind(it,1);if(!g2){BD_UNDO.push(u);toast('No free space to put it back.');return}it[k]=g2}
    C.board.splice(Math.min(u.q,C.board.length),0,it);
    var n=C.board.length;C.board=cleanBoard(C.board);
    if(C.board.length<n){BD_UNDO.length=0;toast('Could not put it back.')}else toast('Widget put back.');
    save();syncBoard()});
  $('#dbModel').addEventListener('change',function(){
    var v=this.value;if(!v||v===store.active) return;
    var tp=store.profiles.filter(function(p){return p.id===v})[0];
    if(tp&&tp.cfg){
      if(tp.cfg.board&&tp.cfg.board.length){tp.cfg.layout='board';tp.cfg.dash=true}
      else toast('That model has no Board layout yet, so it opens in its own layout.',4500);
    }
    prof.value=v;switchProfile(v);
  });
  $('#dbExit').addEventListener('click',function(){C.dash=false;bdEditing=false;dashAdd=false;save();syncLayout()});
  $('#bdDash').addEventListener('change',function(){C.dash=$('#bdDash').checked;save();syncLayout()});
  var dashLastK=dashLand()?'g':'gp';
  window.addEventListener('resize',function(){
    var k=dashLand()?'g':'gp';
    if(k!==dashLastK){dashLastK=k;syncLayout();return}
    if(dashOn()){dashFit();setTimeout(dashFit,250)}
  });
  bdTypes.forEach(function(t){t[1].addEventListener('click',function(){bdBtn=BPRE[t[1].id]?t[1].id:null;bdSetKind(t[0])})});
  function bdPre(){return (bdBtn&&BPRE[bdBtn])||{}}
  bdMode.addEventListener('change',bdFill);
  $('#bdAdd').addEventListener('click',function(){
    if(C.board.length>=16){bdNote.textContent='The board is full (16 controls).';return}
    var v=bdSel.map(function(s){return s.value});
    if(!v[0]&&bdK!=='e'&&bdK!=='z'&&bdK!=='rs'&&bdK!=='ps'&&bdK!=='tl'&&!(bdK==='lx'&&bdPre().t==='tk')){bdNote.textContent='Nothing to add.';return}
    var ww=bdWideChk.checked?2:1, m=bdMode.value==='tank'?'tank':'axis', n=v.map(function(x){return Math.round(+x)});
    var hd=!bdSpring.checked;
    if(bdK==='w'){
      if(n[0]===n[1]){bdNote.textContent='Pick two different channels.';return}
      C.board.push({k:'w',c:n[0],d:n[1],w:ww,p:100});
    }
    else if(bdK==='e') C.board.push({k:'e',w:1});
    else if(bdK==='b') C.board.push({k:'b',c:n[0],w:ww});
    else if(bdK==='a') C.board.push({k:'a',c:n[0],w:ww,s:20});
    else if(bdK==='y'||bdK==='v') C.board.push({k:bdK,c:n[0],w:ww,p:Math.round(+$('#bdTgPow').value)||50,d:bdK==='y'?4:1});
    else if(bdK==='f'||bdK==='i'||bdK==='k'){var bp=bdPre(),bo={k:bdK,c:n[0],w:ww};if(bdK==='f'&&bp.nd) bo.nd=1;C.board.push(bo)}
    else if(bdK==='lx'){
      var lt=bdPre().t||'mx',lo={k:'lx',t:lt,w:ww};if(lt!=='tk') lo.c=n[0];
      var hb=Math.floor((n[0]||0)/PER)*PER,act=activeIdx().filter(function(i){return i>=hb&&i<hb+PER&&i!==n[0]});
      if(lt==='mx'){var sg=(C.ss&&C.ss.on&&C.ss.st!==n[0])?C.ss.st:-1;if(sg<0){var stw=C.board.filter(function(x){return x.k==='st'&&x.c!==n[0]})[0];if(stw) sg=stw.c}if(sg>=0) lo.d=sg}
      if(lt==='eq'&&act.length) lo.cs=act.filter(function(i){return C.ch[i].kind!=='light'}).slice(0,3);
      if(lt==='lp'){var ls0=act.filter(function(i){return C.ch[i].kind==='light'}).slice(0,3);if(ls0.length) lo.cs=ls0}
      if(lo.cs&&!lo.cs.length) delete lo.cs;
      C.board.push(lo);
    }
    else if(bdK==='n') C.board.push({k:bdK,c:n[0],w:ww});
    else if(bdK==='u') C.board.push({k:'u',c:n[0],w:ww,p:Math.round(+$('#bdTgPow').value)||50});
    else if(bdK==='g'||bdK==='lv') C.board.push({k:bdK,c:n[0],w:ww});
    else if(bdK==='st') C.board.push({k:'st',c:n[0],w:ww});
    else if(bdK==='xy'||bdK==='xf'){
      if(n[0]===n[1]){bdNote.textContent='Pick two different channels.';return}
      C.board.push({k:bdK,c:n[0],d:n[1],w:ww});
    }
    else if(bdK==='ro') C.board.push({k:'ro',c:n[0],w:ww});
    else if(bdK==='ax') C.board.push({k:'ax',c:n[0],w:ww});
    else if(bdK==='sw'){if(C.board.some(function(o){return o.k==='sw'&&o.c===n[0]})){bdNote.textContent='This channel already has a swing angle widget.';return}C.board.push({k:'sw',c:n[0],w:ww,a:0})}
    else if(bdK==='tl'){var ntl=tlNew();if(!ntl){bdNote.textContent='Up to 10 timelines. Remove one first.';return}var ntw={k:'tl',w:ww,tl:ntl.id};C.board.push(ntw);setTimeout(function(){tlEdit(ntw)},350)}
    else if(bdK==='dp'){
      if(n[1]>=0&&n[0]===n[1]){bdNote.textContent='Pick different channels for each motor.';return}
      C.board.push({k:'dp',c:n[0],d:n[1],w:ww,m:m==='tank'?'tank':'car',p:70});
    }
    else if(bdK==='z') C.board.push({k:'z',w:ww,a:15});
    else if(bdK==='ps') C.board.push({k:'ps',w:ww,hd:500,md:0,o0:1,o1:1,o2:1,o3:1,o4:1,o5:1});
    else if(bdK==='rs') C.board.push({k:'rs',w:ww,p:100,ns:6,s:0});
    else if(bdK==='t'){
      var tsy=$('#bdTgStyle').value;
      C.board.push({k:'t',c:n[0],w:tsy==='dir'?2:ww,y:tsy,p:Math.round(+$('#bdTgPow').value)||100});
    }
    else if(bdK==='l'){
      var lcc=C.ch[n[0]];lcc.kind='light';lcc.blink=$('#bdLBlink').value;lcc.bright=Math.round(+$('#bdLBright').value)||100;
      syncChannel(n[0]);C.board.push({k:'l',c:n[0],w:ww});
    }
    else if(bdK==='m'){
      var mt=[];
      n.forEach(function(cv,q){if(cv>=0&&!mt.some(function(z){return z.c===cv})) mt.push({c:cv,r:Math.round(+bdRat[q].value)||100})});
      if(!mt.length){bdNote.textContent='Pick at least one channel.';return}
      if(mt.length<n.filter(function(x){return x>=0}).length){bdNote.textContent='Pick different channels.';return}
      C.board.push({k:'m',t:mt,c:mt[0].c,w:ww,hold:hd,v:false});
    }
    else if(bdK==='s') C.board.push({k:'s',c:n[0],w:ww,hold:hd});
    else{
      var used=(bdK==='j'?n.slice(0,2):n).filter(function(x){return x>=0});
      if(used.some(function(x,i){return used.indexOf(x)!==i})){bdNote.textContent='Pick different channels for each motor.';return}
      if(bdK==='j') C.board.push({k:'j',c:n[0],d:n[1],m:m,w:ww,hold:hd});
      else C.board.push({k:'d',c:n[0],d:n[1],e:n[2],f:n[3],m:m,w:2,hold:hd});
    }
    if(dashOn()){
      var lastIt=C.board[C.board.length-1], lg=lastIt&&dashFind(lastIt,1);
      if(!lg){C.board.pop();save();toast('No space. Make room or remove a widget first.');return}
      lastIt[DG.k]=lg;
      dashAdd=false;
    }
    bdNote.textContent='';wrAutoParts(C.board[C.board.length-1]);save();syncBoard();
  });
  // Hub wiring sketches itself while the board is built: each new widget fills in the part on its channels when the
  // port is still empty (drive -> Motor L, steering -> Servo, lever -> Motor XL, lights -> LED, others -> Motor M).
  // A part the user already picked is never changed.
  function wrPartsOf(it){var o=[],add=function(i,t){if(typeof i==='number'&&i>=0&&i<NMAX) o.push([i,t])},tank=it.m==='tank';
    switch(it.k){
      case 'st':add(it.c,'sv');break;
      case 'lv':add(it.c,'xl');break;
      case 'g':add(it.c,'l');break;
      case 'l':case 'a':add(it.c,'lt');break;
      case 't':add(it.c,it.y==='led'||it.y==='blink'?'lt':'m');break;
      case 'j':case 'dp':add(it.c,'l');add(it.d,tank?'l':'sv');break;
      case 'd':add(it.c,'l');add(it.d,tank?'l':'sv');add(it.e,'m');add(it.f,'m');break;
      case 'w':add(it.c,'m');add(it.d,'m');break;
      case 's':case 'b':case 'u':case 'y':case 'v':case 'xy':case 'xf':add(it.c,'m');if(it.k==='xy'||it.k==='xf') add(it.d,'m');break;
      case 'm':(it.t||[]).forEach(function(q){add(q.c,'m')});break}
    return o.map(function(q){return [q[0],C.ch[q[0]]&&C.ch[q[0]].kind==='light'?'lt':q[1]]})}
  function wrAutoParts(it){if(!it) return;var set=[];if(!Array.isArray(C.pf)) C.pf=[];while(C.pf.length<NMAX) C.pf.push('');
    wrPartsOf(it).forEach(function(q){var i=q[0];if(!isActive(i)||C.pf[i]) return;C.pf[i]=q[1];set.push(tagOf(i)+' '+tr2(({m:'Motor M',l:'Motor L',xl:'Motor XL',bg:'Buggy motor',sv:'Servo',lt:'LED lights'})[q[1]]))});
    if(set.length) setTimeout(function(){toast(tr2('Hub wiring filled in')+': '+set.join(', '),3500)},700)}
  bdSetKind('s');
  if(/[?&]mk6test\b/.test(location.search)) window.__t={toast:function(m,ms){toast(m,ms)},C:C,S:S,rt:rt,store:store,MUTE:MUTE,switchProfile:function(id){switchProfile(id);window.__t.C=C},cleanBoard:cleanBoard,save:save,syncBoard:syncBoard,paintBoard:paintBoard,WSPEC:WSPEC,wsEdit:wsEdit,hubMsgSet:function(m){hubMsg=m;paintLink()}};
  var sfIdle=$('#sfIdle'), sfWarn=$('#sfWarn');
  function syncSafety(){if(!sfIdle) return;sfIdle.value=String(C.safety.idle);sfWarn.value=String(C.safety.warn);if(sfRun)sfRun.value=String(C.safety.run)}
  sfIdle.addEventListener('change',function(){C.safety.idle=pickOf(sfIdle.value,[0,10,30,60,120],60);save()});
  sfWarn.addEventListener('change',function(){C.safety.warn=pickOf(sfWarn.value,[0,15,30,60],30);save()});

  var optFull=$('#optFull');
  var landMQ=(typeof window.matchMedia==='function')?window.matchMedia('(orientation:landscape) and (max-height:520px)'):null;
  function fullNative(){ if(NB&&NB.immersive){try{NB.immersive(!!store.prefs.full||!!(landMQ&&landMQ.matches))}catch(e){}} }
  function landChange(){fullNative();syncLayout()}
  if(landMQ){ if(landMQ.addEventListener) landMQ.addEventListener('change',landChange); else if(landMQ.addListener) landMQ.addListener(landChange); }
  if(dashOn()) syncLayout();
  optFull.addEventListener('change',function(){store.prefs.full=optFull.checked;save();fullNative()});
  var optSound=$('#optSound'), optHaptic=$('#optHaptic'), optRelink=$('#optRelink');
  function syncApp(){
    if(!optSound) return;
    optSound.checked=store.prefs.sound;optHaptic.checked=store.prefs.haptic;if(optRelink) optRelink.checked=store.prefs.relink;optFull.checked=store.prefs.full;fullNative();
    $('#lang').value=store.prefs.lang;
  }
  optSound.addEventListener('change',function(){store.prefs.sound=optSound.checked;save();if(optSound.checked) beep([700,900],0.09)});
  if(optRelink) optRelink.addEventListener('change',function(){store.prefs.relink=optRelink.checked;save()});
  optHaptic.addEventListener('change',function(){store.prefs.haptic=optHaptic.checked;save();if(optHaptic.checked) feedback('ok')});
  syncSafety();syncApp();

