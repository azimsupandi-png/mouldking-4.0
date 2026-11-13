/* MK6 Console app code. Loaded after the first frame so the window appears at once.
   Each block is wrapped on its own so one failing block cannot stop the others. */

document.documentElement.classList.remove('booting');

/* ---- block 1 ---- */
try{
(function(){
  // Skip DOM writes that do not change anything: fewer style recalcs and repaints on slow phones
  try{
    var d=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
    if(d&&d.set&&d.get) Object.defineProperty(Node.prototype,'textContent',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){var n=v==null?'':String(v);if(this.nodeType===1&&this.childNodes.length===1&&this.firstChild.nodeType===3&&this.firstChild.data===n) return;if(this.nodeType===1&&n===''&&!this.firstChild) return;d.set.call(this,v)}});
    var sa=Element.prototype.setAttribute;
    Element.prototype.setAttribute=function(k,v){if(this.getAttribute(k)===String(v)) return;return sa.call(this,k,v)};
    var h=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'hidden');
    if(h&&h.set&&h.get) Object.defineProperty(HTMLElement.prototype,'hidden',{configurable:true,enumerable:h.enumerable,get:h.get,set:function(v){if(!!h.get.call(this)===!!v) return;h.set.call(this,v)}});
  }catch(_){}
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 2 ---- */
try{
(function(){
  var NMAX=18, PER=6, L='ABCDEF';
  var MAX_REC_MS=90000, MAX_PTS=1800, MAX_RECS=10, MAX_MODELS=30;
  var NB=window.MK6Bridge||null;
  if(typeof document.addEventListener==='function') document.addEventListener('contextmenu',function(e){var t=e.target&&e.target.tagName;if(t==='INPUT'&&e.target.type!=='range'&&e.target.type!=='checkbox')return;if(t==='TEXTAREA')return;e.preventDefault()});
  var S={connected:!NB,estop:false,rec:null,play:null,loop:false,turbo:[]};
  var $=function(s,r){return (r||document).querySelector(s)};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var fmt=function(n){return n>0?'+'+n:String(n)};
  // Colour palette for value colours: normal (green / amber / red) or colour-blind safe (sky blue / orange / vermillion)
  var PAL={g:'#1D9E75',o:'#EF9F27',r:'#E24B4A',b:'#378ADD'};
  var PAL0={g:'#1D9E75',o:'#EF9F27',r:'#E24B4A',b:'#378ADD'}, PALCB={g:'#56B4E9',o:'#E69F00',r:'#D55E00',b:'#CC79A7'};
  function palSet(cb){var src=cb?PALCB:PAL0;for(var k in src) PAL[k]=src[k];if(typeof MTH!=='undefined'){MTH[0][0]=PAL.g;MTH[0][1]=PAL.o;MTH[0][2]=PAL.r;MTH[0][3]=PAL.b}}
  // Value text for widget heads; with direction marks on, +40 shows as ▲40 and -40 as ▼40
  var DIRMK=false;
  function fmtV(n){n=Math.round(+n||0);return DIRMK?(n>0?'\u25B2'+n:n<0?'\u25BC'+(-n):'0'):fmt(n)}
  function fmtTime(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2)}
  function num(v,lo,hi,d){v=+v;return (v>=lo&&v<=hi)?v:d}
  function uid(){return 'p'+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36)}

  /* ---------- Models (profiles) ---------- */
  var DEF=['Left wheel','Right wheel','Arm','Scoop','Winch','Lights'];
  var TR={'Tetapan asas':'Basic setup','Kereta 2 motor (contoh)':'2-motor car (example)','Jentera (contoh)':'Excavator (example)',
    'Roda kiri':'Left wheel','Roda kanan':'Right wheel','Lengan':'Arm','Penyodok':'Scoop','Lampu':'Lights','Lampu depan':'Headlights',
    'Saluran D':'Channel D','Saluran E':'Channel E','Saluran F':'Channel F','Track kiri':'Left track','Track kanan':'Right track','Baldi':'Bucket','Putar':'Swing'};
  function tr(s){return Object.prototype.hasOwnProperty.call(TR,s)?TR[s]:s}
  function baseCfg(names){
    var ch=[];
    for(var i=0;i<NMAX;i++) ch.push({name:(names&&i<names.length)?names[i]:(i<PER?DEF[i]:'Channel '+L[i%PER]),inv:false,max:100,off:0,cv:[25,50,75],trim:0,kind:'slider',blink:'off',bright:100,stp:5,la:0,ls:0});
    return {ch:ch,limit:100,ramp:60,zone:100,testPwr:60,dash:false,dgv:2,hubNames:['','',''],spring:true,s1:{mode:'axis',a:0,b:1,hold:false},s2:{mode:'axis',a:2,b:3,hold:false},hubs:[0,-1,-1],layout:'std',board:[],tilt:{on:false,sens:45,inv:false,all:false},accent:0,accentV:3,pad:{on:true,dead:12,trig:-1,map:{}},safety:{idle:60,warn:30,run:0},seq:[],rec:[]};
  }
  function cleanHubs(h){
    var out=[-1,-1,-1],s,t;
    for(s=0;s<3;s++){var v=Math.round(+(h&&h[s]));out[s]=(v>=0&&v<=2)?v:-1}
    for(s=1;s<3;s++) for(t=0;t<s;t++) if(out[s]>=0&&out[s]===out[t]) out[s]=-1;
    if(out[0]<0){var m=0;while(out.indexOf(m)>=0) m++;out[0]=m}
    return out;
  }
  var PAD_BTNS=[0,1,2,3,4,5,10,11,12,13,14,15];
  function pickOf(v,list,def){v=+v;return list.indexOf(v)>=0?v:def}
  var MAX_SEQ=10, MAX_STEPS=30;
  function cleanSeqs(r){
    var out=[];
    if(!Array.isArray(r)) return out;
    r.slice(0,MAX_SEQ).forEach(function(x){
      if(!x||typeof x!=='object') return;
      var steps=[];
      (Array.isArray(x.steps)?x.steps:[]).slice(0,MAX_STEPS).forEach(function(q,n){
        if(!q||typeof q!=='object') return;
        steps.push({
          ch:Math.round(num(q.ch,-1,NMAX-1,-1)),
          pwr:Math.round(num(q.pwr,-100,100,50)),
          dur:Math.round(num(q.dur,0.1,60,1)*10)/10,
          par:n>0&&q.par===true
        });
      });
      out.push({id:typeof x.id==='string'?x.id:uid(),name:String(x.name||'Sequence').slice(0,24),loop:x.loop===true,reps:pickOf(x.reps,[1,2,3,5,10],1),speed:pickOf(x.speed,[0.5,0.75,1,1.5,2],1),delay:pickOf(x.delay,[0,1,2,3,5,10],0),steps:steps});
    });
    return out;
  }
  // Turn a sequence into a recording-style timeline so the existing playback (E-Stop, locking, loop) runs it.
  function compileSeq(sq){
    var ev=[],t=0,lastStart=0;
    sq.steps.forEach(function(st,n){
      var start=(st.par&&n>0)?lastStart:t, end=start+Math.round(st.dur*1000/(sq.speed||1));
      lastStart=start;
      if(st.ch>=0){ev.push([start,1,st.ch,st.pwr]);ev.push([end,0,st.ch,0])}
      t=Math.max(t,end);
    });
    var total=Math.min(t,MAX_REC_MS);
    ev=ev.filter(function(e){return e[0]<=total});
    ev.sort(function(a,b){return a[0]-b[0]||a[1]-b[1]});
    var v=[],i,pts=[],k=0;
    for(i=0;i<NMAX;i++) v.push(0);
    pts.push([0].concat(v));
    while(k<ev.length){
      var tm=ev[k][0];
      while(k<ev.length&&ev[k][0]===tm){v[ev[k][2]]=ev[k][3];k++}
      if(tm===0) pts[0]=[0].concat(v); else pts.push([tm].concat(v));
    }
    if(pts[pts.length-1][0]<total) pts.push([total].concat(v.map(function(){return 0})));
    if(pts.length<2) pts.push([Math.max(1,total)].concat(v.map(function(){return 0})));
    return {id:sq.id,name:sq.name,dur:Math.max(1,total),pts:pts};
  }
  function cleanRecs(r){
    var out=[];
    if(!Array.isArray(r)) return out;
    r.slice(0,MAX_RECS).forEach(function(x){
      if(!x||!Array.isArray(x.pts)||x.pts.length<2) return;
      var pts=[];
      x.pts.slice(0,MAX_PTS).forEach(function(p){
        if(!Array.isArray(p)||p.length<2) return;
        var row=[Math.max(0,Math.round(+p[0])||0)];
        for(var i=0;i<NMAX;i++) row.push(clamp(Math.round(+p[i+1])||0,-100,100));
        pts.push(row);
      });
      if(pts.length<2) return;
      var dur=pts[pts.length-1][0];
      if(dur<=0) return;
      out.push({id:typeof x.id==='string'?x.id:uid(),name:String(x.name||'Take').slice(0,24),dur:Math.min(dur,MAX_REC_MS),pts:pts,btn:x.btn===true});
    });
    return out;
  }
  var DG={x:48,y:24,k:'g'};
  function dashLand(){return window.innerWidth>window.innerHeight}
  function dashSetMode(){var l=dashLand();DG.x=l?48:24;DG.y=l?24:48;DG.k=l?'g':'gp';return l}
  function dmin(it){if(it.k==='i'&&(it.hz||it.v)) return [10,5];if((it.k==='s'||it.k==='m')&&it.v) return [6,12];if(it.k==='y'&&it.sc) return [14,10];return DMIN[it.k]||[3,3]}
  function cleanG(g,k,gx,gy,v){
    if(!Array.isArray(g)||g.length!==4) return null;
    g=g.map(function(q){return Math.round(+q)});
    var mn=dmin({k:k,v:v});
    if(!g.every(function(q){return isFinite(q)})||g[0]<0||g[1]<0||g[2]<mn[0]||g[3]<mn[1]||g[0]+g[2]>gx||g[1]+g[3]>gy) return null;
    return g;
  }
  var DMIN={lx:[8,5],rs:[8,8],st:[8,8],lv:[6,12],dp:[10,10],s:[12,6],j:[10,12],d:[20,12],m:[12,6],l:[6,6],t:[6,6],b:[6,6],e:[6,6],g:[12,6],z:[8,6],n:[8,8],w:[12,6],a:[10,6],y:[12,6],f:[10,8],i:[6,10],k:[12,8],ps:[8,9]};
  function ci(v,lo,hi,def){v=Math.round(+v);return (v>=lo&&v<=hi)?v:def}
  function cleanJc(j){
    if(!j||typeof j!=='object') return null;
    var o={dz:ci(j.dz,0,40,0),sn:ci(j.sn,50,150,100),lm:ci(j.lm,20,100,100),ax:(j.ax==='x'||j.ax==='y')?j.ax:'f'};
    return (o.dz===0&&o.sn===100&&o.lm===100&&o.ax==='f')?null:o;
  }
  function cleanBoard(b){
    var out=[];
    if(!Array.isArray(b)) return out;
    b.slice(0,16).forEach(function(x){
      if(!x||typeof x!=='object') return;
      var n0=out.length;
      var w=x.w===2?2:1;
      if(x.k==='s'){
        var c=Math.round(+x.c);
        if(c>=0&&c<NMAX) out.push({k:x.k,c:c,w:w,hold:x.hold===true,v:x.v===true});
      }else if(x.k==='j'){
        var ja=Math.round(+x.c), jb=Math.round(+x.d);
        if(ja>=0&&ja<NMAX&&jb>=-1&&jb<NMAX){var jo={k:'j',c:ja,d:jb,m:x.m==='tank'?'tank':'axis',w:w,hold:x.hold===true},jj=cleanJc(x.jc);if(jj) jo.jc=jj;if(x.sw===1||x.sw===true) jo.sw=1;out.push(jo)}
      }else if(x.k==='d'){
        var da=Math.round(+x.c), db=Math.round(+x.d), dc=Math.round(+x.e), dd=Math.round(+x.f);
        if(da>=0&&da<NMAX&&dc>=0&&dc<NMAX&&db>=-1&&db<NMAX&&dd>=-1&&dd<NMAX){var dobj={k:'d',c:da,d:db,e:dc,f:dd,m:x.m==='tank'?'tank':'axis',w:2,hold:x.hold===true},dj=cleanJc(x.jc);if(dj) dobj.jc=dj;out.push(dobj)}
      }else if(x.k==='l'){
        var lc=Math.round(+x.c);
        if(lc>=0&&lc<NMAX) out.push({k:'l',c:lc,w:w});
      }else if(x.k==='m'&&Array.isArray(x.t)){
        var mt=[];
        x.t.slice(0,4).forEach(function(q){
          if(!q||typeof q!=='object') return;
          var mc=Math.round(+q.c), mr=Math.round(+q.r);
          if(mc>=0&&mc<NMAX&&mr>=-100&&mr<=100&&mr!==0&&!mt.some(function(z){return z.c===mc})) mt.push({c:mc,r:mr});
        });
        if(mt.length) out.push({k:'m',t:mt,c:mt[0].c,w:w,hold:x.hold===true,v:x.v===true});
      }else if(x.k==='b'){
        var bcn=Math.round(+x.c);
        if(bcn>=0&&bcn<NMAX) out.push({k:'b',c:bcn,w:w});
      }else if(x.k==='t'){
        var tcn=Math.round(+x.c), tp=Math.round(+x.p);
        if(tcn>=0&&tcn<NMAX) out.push({k:'t',c:tcn,w:x.y==='dir'?2:w,y:['led','latch','dir'].indexOf(x.y)>=0?x.y:'led',p:(tp>=5&&tp<=100)?tp:100});
      }else if(x.k==='w'){
        var wa=Math.round(+x.c), wb=Math.round(+x.d), wp=Math.round(+x.p);
        if(wa>=0&&wa<NMAX&&wb>=0&&wb<NMAX&&wa!==wb){
          var wo={k:'w',c:wa,d:wb,w:w,p:(wp>=5&&wp<=100)?wp:100};
          if(x.mid===1||x.mid===true) wo.mid=1;
          if(x.ra===1||x.ra===true) wo.ra=1;
          if(x.rb===1||x.rb===true) wo.rb=1;
          out.push(wo);
        }
      }else if(x.k==='a'){
        var acn=Math.round(+x.c), as0=Math.round(+x.s);
        if(acn>=0&&acn<NMAX) out.push({k:'a',c:acn,w:w,s:(as0>=1&&as0<=300)?as0:20});
      }else if(x.k==='y'){
        var ycn=Math.round(+x.c), yp=Math.round(+x.p), yd=Math.round(+x.d*10)/10;
        if(ycn>=0&&ycn<NMAX) {out.push({k:'y',c:ycn,w:w,p:(yp>=5&&yp<=100)?yp:50,d:(yd>=1&&yd<=30)?yd:4});if(x.sc===1||x.sc===true) out[out.length-1].sc=1}
      }else if(x.k==='f'||x.k==='i'||x.k==='k'){
        var ocn=Math.round(+x.c);
        if(ocn>=0&&ocn<NMAX){out.push({k:x.k,c:ocn,w:w});if((x.k==='f'||x.k==='i')&&(x.ow===1||x.ow===true)) out[out.length-1].ow=1;if(x.k==='f'&&(x.nd===1||x.nd===true)) out[out.length-1].nd=1;if(x.k==='f'&&x.nd&&+x.tv>=1&&+x.tv<=5&&Math.round(+x.tv)!==3) out[out.length-1].tv=Math.round(+x.tv);if(x.k==='i'&&(x.hz===1||x.hz===true)) out[out.length-1].hz=1;if(x.k==='i'&&(+x.ls===1||+x.ls===2)) out[out.length-1].ls=+x.ls;if(x.k==='k'&&(+x.ws===30||+x.ws===60)) out[out.length-1].ws=+x.ws;if(x.k==='k'&&Array.isArray(x.cs)){var kcs=[];x.cs.forEach(function(q){q=Math.round(+q);if(q>=0&&q<NMAX&&q!==ocn&&kcs.indexOf(q)<0&&kcs.length<3) kcs.push(q)});if(kcs.length) out[out.length-1].cs=kcs}if(x.k==='k'&&(x.tg===1||x.tg===true)){out[out.length-1].tg=1;var tvv=Math.round(+x.tv);out[out.length-1].tv=isFinite(tvv)?Math.max(-100,Math.min(100,tvv)):80}if((x.k==='f'||x.k==='i')&&(+x.th===1||+x.th===2)) out[out.length-1].th=+x.th;if((x.k==='f'||x.k==='i')&&(x.sh===1||x.sh===true)) out[out.length-1].sh=1}
      }else if(x.k==='xy'||x.k==='xf'){
        var xa=Math.round(+x.c),xb=Math.round(+x.d);
        if(xa>=0&&xa<NMAX&&xb>=0&&xb<NMAX&&xa!==xb){var xo={k:x.k,c:xa,d:xb,w:w};
          if(x.k==='xy'){if(x.hd===1||x.hd===true) xo.hd=1;if(+x.ng===1) xo.ng=1;if(+x.nr===1) xo.nr=1}
          else{var xp=Math.round(+x.p);if(xp>=10&&xp<100) xo.p=xp;if(+x.md===1) xo.md=1;if(+x.rc===1) xo.rc=1;if(+x.rd===1) xo.rd=1}
          out.push(xo)}
      }else if(x.k==='ro'){
        var roc=Math.round(+x.c);
        if(roc>=0&&roc<NMAX){var roo={k:'ro',c:roc,w:w},rbn=Math.round(+x.n);if(rbn===2||rbn===5) roo.n=rbn;if(+x.bs===1) roo.bs=1;out.push(roo)}
      }else if(x.k==='n'){
        var kcn=Math.round(+x.c);
        if(kcn>=0&&kcn<NMAX){out.push({k:x.k,c:kcn,w:w});var nrt=Math.round(+x.rt*2)/2;if(x.rt!==undefined&&nrt>=0&&nrt<=10&&nrt!==3) out[out.length-1].rt=nrt;if(+x.th===1||+x.th===2) out[out.length-1].th=+x.th;if(x.ow===1||x.ow===true) out[out.length-1].ow=1;if(x.sw===1||x.sw===true) out[out.length-1].sw=1;if(+x.fn===1) out[out.length-1].fn=1;if(x.tz===0) out[out.length-1].tz=0}
      }else if(x.k==='g'||x.k==='lv'){
        var gcn=Math.round(+x.c);
        if(gcn>=0&&gcn<NMAX){
          var go={k:x.k,c:gcn,w:w};
          var gr0=Math.round(+x.gr);if(x.gr!==undefined&&gr0>=-100&&gr0<=0) go.gr=gr0;
          if(Array.isArray(x.gf)){var gf0=x.gf.slice(0,5).map(function(q){return Math.round(+q)}).filter(function(q){return q>=1&&q<=100});if(gf0.length) go.gf=gf0}
          out.push(go);
        }
      }else if(x.k==='st'){
        var stc=Math.round(+x.c),sra=Math.round(+x.ra);
        if(stc>=0&&stc<NMAX){var so={k:'st',c:stc,w:w};if([90,180,270].indexOf(sra)>=0) so.ra=sra;if(x.hold===true) so.hold=true;if(x.gy===1||x.gy===true) so.gy=1;var sgz=Math.round(+x.gz),sgs=Math.round(+x.gs);if(x.gz!==undefined&&sgz>=0&&sgz<=10&&sgz!==3) so.gz=sgz;if([30,45,60].indexOf(sgs)>=0) so.gs=sgs;out.push(so)}
      }else if(x.k==='dp'){
        var dpa=Math.round(+x.c),dpb=Math.round(+x.d),dpp=Math.round(+x.p),dpr=Math.round(+x.rt*10)/10;
        if(dpa>=0&&dpa<NMAX&&dpb>=-1&&dpb<NMAX&&dpb!==dpa){
          var dpo={k:'dp',c:dpa,d:dpb,w:w,m:x.m==='car'?'car':'tank',p:(dpp>=10&&dpp<=100)?dpp:70};
          if(x.rt!==undefined&&dpr>=0&&dpr<=3&&dpr!==0.3) dpo.rt=dpr;
          if(x.tg===1||x.tg===true) dpo.tg=1;
          out.push(dpo);
        }
      }else if(x.k==='rs'){
        var rps=Math.round(+x.p),rns=[4,6].indexOf(+x.ns)>=0?+x.ns:6,rsl=Math.round(+x.s),rrt=Math.round(+x.rt*2)/2,rhb=Math.round(+x.hb);
        var ro={k:'rs',w:w,p:(rps>=5&&rps<=100)?rps:100,ns:rns,s:(rsl>=0&&rsl<rns)?rsl:0};
        if(x.rt!==undefined&&rrt>=0&&rrt<=10&&rrt!==3) ro.rt=rrt;
        if(rhb>=1&&rhb<=2&&rhb*PER+rns<=NMAX) ro.hb=rhb;
        if(+x.sm===1){ro.sm=1;ro.sc=[];for(var rsi=0;rsi<6;rsi++){var rr0=Array.isArray(x.sc)&&Array.isArray(x.sc[rsi])?x.sc[rsi]:[];var rr1=[];for(var rsj=0;rsj<PER;rsj++){var rv0=Math.round(+rr0[rsj]);rr1.push(isFinite(rv0)?Math.max(-100,Math.min(100,rv0)):0)}ro.sc.push(rr1)}}
        out.push(ro);
      }else if(x.k==='lx'){
        var lxt=['mx','eq','ts','gi','lp','tk'].indexOf(x.t)>=0?x.t:null, lxc=Math.round(+x.c);
        if(lxt&&(lxt==='tk'||(lxc>=0&&lxc<NMAX))){
          var lxo={k:'lx',t:lxt,w:w};if(lxt!=='tk') lxo.c=lxc;
          var lxd=Math.round(+x.d);if(lxt==='mx'&&lxd>=0&&lxd<NMAX&&lxd!==lxc) lxo.d=lxd;
          if((lxt==='eq'||lxt==='lp')&&Array.isArray(x.cs)){var lcs=[];x.cs.forEach(function(q){q=Math.round(+q);if(q>=0&&q<NMAX&&q!==lxc&&lcs.indexOf(q)<0&&lcs.length<3) lcs.push(q)});if(lcs.length) lxo.cs=lcs}
          if(lxt==='mx'){if(+x.ic===1) lxo.ic=1;if(+x.an===1) lxo.an=1;if(Array.isArray(x.px)&&x.px.length===8&&x.px.every(function(r){return typeof r==='string'&&/^[01]{8}$/.test(r)})) lxo.px=x.px.slice()}
          if(lxt==='eq'&&(x.ow===1||x.ow===true)) lxo.ow=1;
          if(lxt==='ts'){var lth=Math.round(+x.th);if([10,30].indexOf(lth)>=0) lxo.th=lth}
          if(lxt==='tk'){var lsp=Math.round(+x.sp);if(lsp===1||lsp===3) lxo.sp=lsp}
          if(lxt==='lp'){var lpr=Math.round(+x.pr);if(lpr>=1&&lpr<=7) lxo.pr=lpr;var lps=Math.round(+x.ps);if(lps===1||lps===3) lxo.ps=lps}
          out.push(lxo);
        }
      }else if(x.k==='z'){
        var za=Math.round(+x.a);
        out.push({k:'z',w:w,a:(za>=0&&za<=240)?za:15});
      }else if(x.k==='ps'){
        out.push({k:'ps',w:w,hd:pickOf(x.hd,[300,500,800,1200],500),md:pickOf(x.md,[0,1],0),o0:pickOf(x.o0,[0,1],1),o1:pickOf(x.o1,[0,1],1),o2:pickOf(x.o2,[0,1],1),o3:pickOf(x.o3,[0,1],1),o4:pickOf(x.o4,[0,1],1),o5:pickOf(x.o5,[0,1],1)});
      }else if(x.k==='e'){
        out.push({k:'e',w:1});
      }
      if(out.length>n0){
        var it0=out[out.length-1], g1=cleanG(x.g,it0.k,48,24,it0.k==='i'?it0.hz:it0.v);
        if(x.h===2&&it0.k!=='d') it0.h=2;
        if((x.tb===1||x.tb===true)&&['s','st','n'].indexOf(it0.k)>=0) it0.tb=1;
        if(g1) it0.g=g1;
        if(['e','z','a','l','j','d','w','f','i','k','rs','dp','ps','lx'].indexOf(it0.k)<0){
          if(x.inv===1||x.inv===true) it0.inv=1;
          var cp0=Math.round(+x.cap);if(cp0>=10&&cp0<100) it0.cap=cp0;
          if(it0.k==='s'){var sn0=Math.round(+x.snap);if([5,10,25].indexOf(sn0)>=0) it0.snap=sn0}
          if(it0.k==='b'){var bp0=Math.round(+x.p);it0.p=(bp0>=30&&bp0<=100)?bp0:100;if(x.lock===true) it0.lock=true}
        }
        if(['s','n','st'].indexOf(it0.k)>=0&&x.pc!==undefined){var pc0=Math.round(+x.pc);if(pc0>=0&&pc0<NMAX&&pc0!==it0.c){it0.pc=pc0;if(x.pi===1||x.pi===true) it0.pi=1}}
        if(typeof x.lbl==='string'&&it0.k!=='e'){var lb0=x.lbl.replace(/\s+/g,' ').trim().slice(0,20);if(lb0) it0.lbl=lb0}
      }
    });
    return out;
  }
  function idxOf(v,def,allowNone){v=Math.round(+v);if(allowNone&&v===-1)return -1;return (v>=0&&v<NMAX)?v:def}
  function sanitizeCfg(c){
    var d=baseCfg();
    if(!c||typeof c!=='object') return d;
    if(Array.isArray(c.ch)) c.ch.slice(0,NMAX).forEach(function(x,i){
      if(!x||typeof x!=='object') return;
      var o=d.ch[i];
      if(typeof x.name==='string') o.name=tr(x.name.slice(0,16));
      o.inv=!!x.inv;
      o.max=num(x.max,10,100,100);
      o.off=num(x.off,0,50,0);
      if(Array.isArray(x.cv)&&x.cv.length===3){var lo=0;o.cv=x.cv.map(function(v){lo=Math.max(lo,Math.round(num(v,0,100,50)));return lo})}
      else{var ex=num(x.expo,0,100,0)/100;if(ex>0) o.cv=[.25,.5,.75].map(function(q){return Math.round(100*((1-ex)*q+ex*q*q*q))})}
      o.trim=Math.round(num(x.trim,-20,20,0));
      o.kind=(x.kind==='hold'||x.kind==='light')?x.kind:'slider';
      o.blink=['off','slow','fast','pulse','hazard'].indexOf(x.blink)>=0?x.blink:'off';
      o.la=[1,2,3,4].indexOf(x.la)>=0?x.la:0;o.ls=idxOf(x.ls,0,false);
      o.bright=Math.round(num(x.bright,0,100,100));
      o.stp=pickOf(x.stp,[1,5,10],5);
    });
    d.limit=num(c.limit,10,100,100);
    d.ramp=num(c.ramp,0,100,60);
    d.zone=pickOf(c.zone,[25,50,75,100],100);
    d.testPwr=Math.round(num(c.testPwr,10,100,60));
    d.dash=c.dash===true;
    d.dgv=2;
    d.hubNames=[0,1,2].map(function(q){var v=Array.isArray(c.hubNames)?c.hubNames[q]:'';return typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').slice(0,12):''});
    d.spring=true;
    var s1=c.s1||{mode:c.mode,a:c.a,b:c.b}, s2=c.s2||{};
    var gh=c.stickHold===true;
    d.s1={mode:s1.mode==='tank'?'tank':'axis',a:idxOf(s1.a,0,false),b:idxOf(s1.b,1,false),hold:typeof s1.hold==='boolean'?s1.hold:gh};
    d.s2={mode:s2.mode==='tank'?'tank':'axis',a:idxOf(s2.a,2,true),b:idxOf(s2.b,3,true),hold:typeof s2.hold==='boolean'?s2.hold:gh};
    d.hubs=cleanHubs(Array.isArray(c.hubs)?c.hubs:[num(c.mod,0,2,0),-1,-1]);
    d.layout=(c.layout==='joy'||c.layout==='dual'||c.layout==='board')?c.layout:'std';
    // old 'Speed' setting (x0.4 / x0.7) multiplied the power limit; fold it in once and drop it
    if(c.speed==='slow'||c.speed==='normal') d.limit=Math.max(10,Math.round(d.limit*(c.speed==='slow'?0.4:0.7)));
    d.board=cleanBoard(c.board);
    if(c.dgv!==2) d.board.forEach(function(it){if(it.g) it.g=it.g.map(function(q){return q*2})});
    var tl=(c.tilt&&typeof c.tilt==='object')?c.tilt:{};
    d.tilt={on:tl.on===true,sens:pickOf(tl.sens,[30,45,60],45),inv:tl.inv===true,all:tl.all===true};
    // Colour choices are now orange(0), red(1), yellow(2). Older saves used six: pink maps to red, yellow to yellow, the rest to orange.
    d.accent=c.accentV===3?Math.round(num(c.accent,0,5,0)):0;
    // model icon / photo (photo: small JPEG data URL)
    d.icon=['car','dig','crane','truck','tractor','boat'].indexOf(c.icon)>=0?c.icon:'';
    d.photo=(typeof c.photo==='string'&&c.photo.length<160000&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(c.photo))?c.photo:'';
    // steering eases at speed: steering channel output shrinks as the throttle channel output grows
    var ss0=(c.ss&&typeof c.ss==='object')?c.ss:{};
    d.ss={on:ss0.on===true,st:Math.round(num(ss0.st,0,17,1)),th:Math.round(num(ss0.th,0,17,0)),min:pickOf(ss0.min,[40,55,70],55)};
    d.accentV=3;
    var pd=(c.pad&&typeof c.pad==='object')?c.pad:{};
    d.pad={on:pd.on!==false,dead:Math.round(num(pd.dead,5,40,12)),trig:Math.round(num(pd.trig,-1,NMAX-1,-1)),map:{}};
    var msrc=(pd.map&&typeof pd.map==='object')?pd.map:{};
    PAD_BTNS.forEach(function(b){
      var v=msrc[b];
      if(typeof v!=='string'||!/^([frlt]\d{1,2}|z|R|P|rp|rn|rg|s:[A-Za-z0-9_-]{1,40})$/.test(v)) return;
      if(/^[frlt]\d/.test(v)&&+v.slice(1)>=NMAX) return;
      d.pad.map[b]=v;
    });
    var sf=(c.safety&&typeof c.safety==='object')?c.safety:{};
    d.safety={idle:pickOf(sf.idle,[0,10,30,60,120],60),warn:pickOf(sf.warn,[0,15,30,60],30),run:pickOf(sf.run,[0,10,20,30,60],0)};
    d.seq=cleanSeqs(c.seq);
    d.rec=cleanRecs(c.rec);
    return d;
  }
  function starters(){
    var car=baseCfg(['Left wheel','Right wheel','Headlights','Channel D','Channel E','Channel F']);
    car.s1.mode='tank';car.layout='joy';car.ch[2].kind='hold';
    var exc=baseCfg(['Left track','Right track','Arm','Bucket','Swing','Lights']);
    exc.s1.mode='tank';exc.layout='dual';exc.ch[4].kind='hold';exc.ch[4].max=60;exc.ch[5].kind='hold';exc.accent=0;
    car.seq=[{id:uid(),name:'Spin',loop:false,steps:[{ch:0,pwr:60,dur:1.5,par:false},{ch:1,pwr:-60,dur:1.5,par:true},{ch:-1,pwr:0,dur:0.5,par:false}]}];
    exc.seq=[{id:uid(),name:'Dig cycle',loop:false,steps:[{ch:2,pwr:-60,dur:2,par:false},{ch:3,pwr:60,dur:1.5,par:false},{ch:2,pwr:60,dur:2,par:false},{ch:4,pwr:40,dur:3,par:false}]}];
    var mine=baseCfg(['Drive','Steering','Lights','Winch','Rear lights','Channel F']);
    mine.ch[2].kind='light';mine.ch[4].kind='light';mine.layout='board';mine.dash=true;
    mine.board=[{k:'s',c:0,w:1,v:true,g:[0,0,12,24]},{k:'l',c:2,w:1,g:[12,0,13,7]},{k:'b',c:0,w:1,g:[12,7,13,7]},
      {k:'t',c:3,y:'dir',w:1,g:[25,0,14,7]},{k:'l',c:4,w:1,g:[25,7,14,7]},{k:'e',w:1,g:[39,0,9,14]},{k:'s',c:1,w:1,g:[12,14,36,10]}];
    mine.board.forEach(function(o){o.gp=o.g.slice()});
    void car;void exc;
    return [{id:uid(),name:'My model',cfg:sanitizeCfg(mine)}];
  }
  function cleanLim(a){var D=[[40,80],[70,60],[100,40]];return D.map(function(d,i){var x=(Array.isArray(a)&&a[i]&&typeof a[i]==='object')?a[i]:{};return {l:Math.round(num(x.l,10,100,d[0])),r:Math.round(num(x.r,0,100,d[1]))}})}
  function cleanTpls(a){
    var out=[];if(!Array.isArray(a)) return out;
    a.slice(0,10).forEach(function(t){
      if(!t||typeof t!=='object') return;
      var n=String(t.name||'').replace(/\s+/g,' ').trim().slice(0,24), b=cleanBoard(t.board);
      if(n&&b.length&&!out.some(function(o){return o.name===n})) out.push({name:n,board:b});
    });
    return out;
  }
  function cleanPrefs(p){p=(p&&typeof p==='object')?p:{};return {practice:p.practice===true,sound:p.sound!==false,haptic:p.haptic!==false,lang:p.lang==='ms'?'ms':'en',seen:p.seen===true,lock:p.lock===true,kidLimit:pickOf(p.kidLimit,[100,70,50,30],50),lim:cleanLim(p.lim),autoBackup:p.autoBackup!==false,full:p.full!==false,relink:p.relink!==false,fx:(p.fx==='full'||p.fx==='lite')?p.fx:'auto',lastBackup:Math.max(0,+p.lastBackup||0),tpls:cleanTpls(p.tpls),ui:p.ui==='light'?'light':'dark',fs:pickOf(p.fs,[100,115,130],100),hc:p.hc===true,cb:p.cb===true,wn:(typeof p.wn==='number'&&p.wn>=0)?Math.floor(p.wn):0,upAt:(typeof p.upAt==='number'&&p.upAt>0)?p.upAt:0,dir:p.dir===true,linkOn:p.linkOn===true,focus:p.focus===true,playLim:pickOf(p.playLim,[0,10,20,30,45,60],0),lefty:p.lefty===true,meter:p.meter!==false}}
  var store={active:null,profiles:[],prefs:cleanPrefs()};
  try{
    var raw=localStorage.getItem('mk6v2');
    if(raw){
      var sp=JSON.parse(raw);
      if(sp&&Array.isArray(sp.profiles)){
        sp.profiles.forEach(function(p){
          if(p&&typeof p.id==='string'&&typeof p.name==='string') store.profiles.push({id:p.id,name:tr(p.name.slice(0,24)),label:(typeof p.label==='string'?p.label.slice(0,24):''),cfg:sanitizeCfg(p.cfg)});
        });
        store.active=sp.active;
        store.prefs=cleanPrefs(sp.prefs);
      }
    }
    if(!store.profiles.length){
      var old=localStorage.getItem('mk6');
      if(old){var s0=starters();s0[0].cfg=sanitizeCfg(JSON.parse(old));store.profiles=s0}
    }
  }catch(e){}
  if(!store.profiles.length) store.profiles=starters();
  if(!store.profiles.some(function(p){return p.id===store.active})) store.active=store.profiles[0].id;
  function activeProfile(){return store.profiles.filter(function(p){return p.id===store.active})[0]}
  function RH(){return !!NB&&!store.prefs.practice}
  var C=activeProfile().cfg;
  var recSel=null, recNote='';
  var scTimer=0;
  function save(){
    try{localStorage.setItem('mk6v2',JSON.stringify(store))}catch(e){}
    if(NB&&NB.shortcuts){clearTimeout(scTimer);scTimer=setTimeout(pushShortcuts,1500)}
  }
  function pushShortcuts(){
    try{
      var list=store.profiles.slice().sort(function(a,b){return (b.id===store.active)-(a.id===store.active)}).slice(0,4)
        .map(function(p){return {id:p.id,name:p.name}});
      NB.shortcuts(JSON.stringify(list));
    }catch(e){}
  }

  var rt={t:[],o:[]}, MUTE={};
  for(var q=0;q<NMAX;q++){rt.t.push(0);rt.o.push(0)}

  function slotOn(s){return C.hubs[s]>=0}
  function isActive(i){return slotOn((i/PER)|0)}
  function activeSlots(){var o=[];for(var s=0;s<3;s++) if(slotOn(s)) o.push(s);return o}
  function activeIdx(){var o=[];for(var i=0;i<NMAX;i++) if(isActive(i)) o.push(i);return o}
  function tagOf(i){var s=(i/PER)|0;return activeSlots().length>1?'M'+(C.hubs[s]+1)+L[i%PER]:L[i%PER]}

  /* Transport: broadcasts through the native bridge when running inside the Android app. */
  var transport={send:function(frame,changed){
    if(RH()){try{NB.send(frame.join(','))}catch(e){}}
    if(changed)logFrame(frame);
  }};

  /* Play-time limit: f ramps from 1 to 0 over 3 s when the time is up */
  var PLAY={f:1,used:0,last:0,warned:false,extra:false,end:0};
  /* Cruise: while it is on, a control you let go of keeps its last value (steering and lights still return).
     Touch the control to change it; bring it back near the middle and let go to stop it. */
  var CRZ={on:false,v:{},skip:false};
  function crzSteer(i){
    if(C.ss&&C.ss.on&&C.ss.st===i) return true;
    return C.board.some(function(it){return it.k==='st'&&it.c===i});
  }
  function crzT(i){
    var t=rt.t[i];if(!CRZ.on||S.play||t!==0) return t;
    return CRZ.v[i]!=null?CRZ.v[i]:0;
  }
  function crzLatch(i,pv,nv){
    if(!CRZ.on||CRZ.skip||S.estop||S.play||!C.ch[i]||C.ch[i].kind==='light'||crzSteer(i)) return;
    if(nv===0&&pv!==0){if(Math.abs(pv)>=10) CRZ.v[i]=pv; else delete CRZ.v[i]}
  }
  function crzOff(quiet){if(!CRZ.on) return;CRZ.on=false;CRZ.v={};if(!quiet) feedback('ok')}
  /* ---------- Power curve ---------- */
  /* Response curve: 5 points (0,0) (25,a) (50,b) (75,c) (100,100), joined by a smooth curve that never goes backwards. */
  var CVPRE=[['Linear',[25,50,75]],['Fine',[8,22,48]],['Very fine',[3,12,38]],['Fast',[45,72,90]]];
  function curveY(x,cv){
    var P=[0,cv[0],cv[1],cv[2],100], k=Math.min(3,Math.floor(x/25)), t=(x-k*25)/25, d=[], m=[], j;
    for(j=0;j<4;j++) d.push((P[j+1]-P[j])/25);
    m[0]=d[0];m[4]=d[3];for(j=1;j<4;j++) m[j]=(d[j-1]*d[j]<=0)?0:(d[j-1]+d[j])/2;
    for(j=0;j<4;j++){if(d[j]===0){m[j]=0;m[j+1]=0}else{var a=m[j]/d[j],b=m[j+1]/d[j],h=a*a+b*b;if(h>9){var tt=3/Math.sqrt(h);m[j]=tt*a*d[j];m[j+1]=tt*b*d[j]}}}
    var t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*P[k]+(t3-2*t2+t)*25*m[k]+(-2*t3+3*t2)*P[k+1]+(t3-t2)*25*m[k+1];
  }
  function powerFor(a,c){
    if(a<=1) return 0;
    var m=curveY(Math.min(a,100),c.cv||[25,50,75]);
    return Math.min(Math.max(0,m)+c.off,c.max);
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
  function goalOf(i){
    if(MUTE[i]) return 0; // muted from an LED bars widget
    if(C.ch[i].kind==='light'){
      var lt=rt.t[i],mo=lt>0?Math.round(ledOut(lt*blinkF(C.ch[i].blink,performance.now()))):0;
      if(C.ch[i].la&&lightAuto(i)) mo=Math.max(mo,Math.round(ledOut(C.ch[i].bright||100)));
      return mo;
    }
    var t=crzT(i), m=powerFor(Math.abs(t),C.ch[i]);
    var tb=!!S.turbo[i]||!!cal||testOn();
    var f=((S.kid&&store.prefs.kidLimit)?store.prefs.kidLimit/100:1)*PLAY.f;
    var out=(t<0?-m:m)*(tb?100:C.limit)/100*f;
    // steering eases at speed (set per model)
    if(C.ss&&C.ss.on&&i===C.ss.st&&C.ss.th!==i&&!cal&&!testOn()) out*=1-(1-C.ss.min/100)*Math.min(1,Math.abs(rt.o[C.ss.th]||0)/100);
    // trim: a small fixed offset so the model runs straight (never while E-Stop is on)
    var tr0=C.ch[i].trim||0;if(tr0&&!S.estop&&!cal&&!testOn()) out=Math.max(-100,Math.min(100,out+tr0*PLAY.f));
    return out;
  }

  function goalOfAt(i,t){
    var c=C.ch[i];if(c.kind==='light') return t;
    var m=powerFor(Math.abs(t),c),out=(t<0?-m:m)*C.limit/100;
    if(c.trim) out=Math.max(-100,Math.min(100,out+c.trim));
    return out;
  }
  // What the hub sends at a full 100% request (the power limit, speed and channel max); meters mark it with a tick
  function hubMax(i){
    if(C.ch[i].kind==='light') return 100;
    var tb=!!S.turbo[i]||!!cal||testOn();
    var f=(S.kid&&store.prefs.kidLimit)?store.prefs.kidLimit/100:1;
    return Math.min(100,powerFor(100,C.ch[i])*(tb?100:C.limit)/100*f);
  }

  /* ---------- Channels ---------- */
  var refs=[], groups=[], wrap=$('#channels'), cols=$('#cols');
  var runBlk=[], runSince=[];
  var AUTOT={}, RAMP={}, HIST={}, HCNT={}, RECS={}, MPK={}, RAMPLAST={};
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
    (C.board||[]).forEach(function(o){if(o.k==='k'||(o.k==='y'&&o.sc)){[o.c].concat(o.k==='k'&&o.cs?o.cs:[]).forEach(function(hc,hj){if(hdone[hc]) return;hdone[hc]=1;var hh=HIST[hc]||(HIST[hc]=[]);var rs0=hj?'live':(RECS[hc]||'live');if(rs0==='rec'&&hh.length>=600) RECS[hc]='done';else if(rs0!=='done'){hh.push(S.estop?0:(crzT(hc)||0));HCNT[hc]=(HCNT[hc]||0)+1;if(hh.length>600) hh.shift()}});mtr=true}else if(o.k==='f'||o.k==='i'||o.k==='lx') mtr=true});
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
      ['M'+(cx-6)+' '+(Y0+16)+'l6 -8 6 8z','M'+(cx-6)+' '+(Y0+H-16)+'l6 8 6 -8z','M'+(X0+16)+' '+(cy-6)+'l-8 6 8 6z','M'+(X0+W-16)+' '+(cy-6)+'l8 6 -8 6z'].forEach(function(d){sv('path',{d:d,fill:'#d9a400',opacity:.85},svg)});
      var gx=sv('line',{y1:Y0+6,y2:Y0+H-6,stroke:'rgba(245,197,24,.45)','stroke-dasharray':'4 4'},svg),gy=sv('line',{x1:X0+6,x2:X0+W-6,stroke:'rgba(245,197,24,.45)','stroke-dasharray':'4 4'},svg);
      var LX=[],LY=[],N=20;
      if(!it.nr){for(i=0;i<N;i++){LX.push(sv('rect',{x:X0+4+i*(W-8)/N+1,y:Y0+H+12,width:(W-8)/N-2,height:9,rx:2,fill:OFF},svg));LY.push(sv('rect',{x:X0-26,y:Y0+4+i*(H-8)/N+1,width:9,height:(H-8)/N-2,rx:2,fill:OFF},svg))}
        txt({x:X0+W+12,y:Y0+H+20,'font-size':12,'font-weight':800,fill:'#cfd4db'},tagOf(it.c));txt({x:X0-26,y:Y0-2,'font-size':12,'font-weight':800,fill:'#cfd4db'},tagOf(it.d))}
      var kn=knob(R),dx=0,dy=0,pid=null;
      function rail(L,val,horiz){var n=L.length,h=n/2,q=Math.round(Math.abs(val)/100*h);L.forEach(function(r,j){var ix=horiz?j:n-1-j,on=val>=0?(ix>=h&&ix<h+q):(ix<h&&ix>=h-q),p=Math.abs(ix<h?h-ix:ix-h+1)/h*100,f=on?(val<0?PAL.b:col(p)):(ix===h||ix===h-1?'rgba(200,208,220,.3)':OFF);if(r.__f!==f){r.__f=f;r.setAttribute('fill',f)}})}
      function place(x,y){var px=cx+x/100*MV,py=cy-y/100*MV;kn.setAttribute('transform','translate('+px.toFixed(1)+' '+py.toFixed(1)+')');gx.setAttribute('x1',px);gx.setAttribute('x2',px);gy.setAttribute('y1',py);gy.setAttribute('y2',py);gx.style.opacity=gy.style.opacity=(Math.abs(x)>1||Math.abs(y)>1)?1:0}
      function from(e){var p=pt(e);var x=Math.max(-100,Math.min(100,(p.x-cx)/MV*100)),y=Math.max(-100,Math.min(100,-(p.y-cy)/MV*100));return [x,y]}
      function send(x,y){noteInput();delete RAMP[it.c];delete RAMP[it.d];setT(it.c,x*z(),false);setT(it.d,y*z(),false)}
      svg.style.touchAction='none';
      svg.addEventListener('pointerdown',function(e){if(bdEditing||S.estop||S.play) return;e.preventDefault();pid=e.pointerId;try{svg.setPointerCapture(pid)}catch(_){}var v=from(e);dx=v[0];dy=v[1];place(dx,dy);send(dx,dy)});
      svg.addEventListener('pointermove',function(e){if(e.pointerId!==pid) return;var v=from(e);dx=v[0];dy=v[1];place(dx,dy);send(dx,dy)});
      ['pointerup','pointercancel'].forEach(function(ev){svg.addEventListener(ev,function(e){if(e.pointerId!==pid) return;pid=null;if(!it.hd) send(0,0)})});
      var sx=0,sy=0;
      m.upd=function(){var tx=(rt.t[it.c]||0)/z(),ty=(rt.t[it.d]||0)/z();if(pid===null){sx+=(tx-sx)*.55;sy+=(ty-sy)*.55;if(Math.abs(sx-tx)<.5) sx=tx;if(Math.abs(sy-ty)<.5) sy=ty;place(sx,sy)}else{sx=dx;sy=dy}
        if(LX.length){rail(LX,rt.t[it.c]||0,true);rail(LY,rt.t[it.d]||0,false)}
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
      m.hq=[sv('line',{stroke:'#fff','stroke-width':2.5,'stroke-linecap':'round',visibility:'hidden'},svg),sv('line',{stroke:'#fff','stroke-width':2.5,'stroke-linecap':'round',visibility:'hidden'},svg)];
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
        var spOn=!m.cmp&&R2>=40;m.spOn=spOn;
        m.spX=cx-R2*.42;m.spW=R2*.84;m.spY=cy+R2*.86;m.spH=R2*.2;
        m.spB.setAttribute('display',spOn?'inline':'none');m.sp.setAttribute('display',spOn?'inline':'none');
        m.spB.setAttribute('x',(m.spX-4).toFixed(1));m.spB.setAttribute('y',(m.spY-m.spH-3).toFixed(1));m.spB.setAttribute('width',(m.spW+8).toFixed(1));m.spB.setAttribute('height',(m.spH+6).toFixed(1));
        dots(cw,ch);m.rd='';
      };
    }else if(k==='i'){
      m.seg=[];for(i=0;i<20;i++) m.seg.push(sv('rect',{rx:1.5,fill:TRK},svg));
      m.rq=sv('rect',{rx:2,width:4,fill:th[3],visibility:'hidden'},svg);
      m.mid=sv('line',{stroke:TXT,'stroke-width':1.5},svg);
      m.hq=[sv('line',{stroke:'#fff','stroke-width':2.5,'stroke-linecap':'round',visibility:'hidden'},svg),sv('line',{stroke:'#fff','stroke-width':2.5,'stroke-linecap':'round',visibility:'hidden'},svg)];
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
      m.br=mk('rec','Record up to 60 s',function(){HIST[c]=[];RECS[c]='rec';m.pause=false});
      mk('stop','Stop',function(){var st=RECS[c]||'live';if(st==='rec'){RECS[c]='done';m.pause=true;m.endAbs=cnt()}else{HIST[c]=[];RECS[c]='live';m.pause=false}});
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
      var cw=box.clientWidth,ch=box.clientHeight;if(!cw||!ch) return;
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
          if(!xlive){ln.setAttribute('visibility','hidden');return}
          var xh=HIST[xc]||[],xp=[];
          for(var q=0;q<n;q++){var xi=xh.length-off-n+q,xv=xi>=0&&xi<xh.length?xh[xi]:0;xp.push((PL+q*PW/(n-1)).toFixed(1)+','+(md-xv*sc).toFixed(1))}
          ln.setAttribute('points',xp.join(' '));ln.setAttribute('visibility','visible');
        });
        if(m.curX>=0&&m.pause){
          var cq=Math.max(0,Math.min(n-1,Math.round((m.curX-PL)/PW*(n-1)))),cx2=PL+cq*PW/(n-1),back=(n-1-cq+off)/10;
          var pick=function(ch){var hh2=HIST[ch]||[],ii=hh2.length-off-n+cq;return ii>=0&&ii<hh2.length?Math.round(hh2[ii]):0};
          var parts=[tagOf(c)+' '+mSgn(pick(c))];if(xlive) (it.cs||[]).forEach(function(xc){parts.push(tagOf(xc)+' '+mSgn(pick(xc)))});
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
        var nsb=diff?((it.sh?'of ':'hub ')+(oth<0?'−':'')+Math.abs(Math.round(oth))):'';if(m.sub.textContent!==nsb) m.sub.textContent=nsb;
      }else if(k==='f'){
        if(it.ow){out=Math.max(0,out);oth=Math.max(0,oth)}
        var tx2=m.R2>=40?String(Math.abs(Math.round(out))):(it.ow?String(Math.round(out)):mSgn(out));if(m.val.textContent!==tx2) m.val.textContent=tx2;
        m.val.setAttribute('fill',Math.abs(out)>80?'#ff6b6a':TXT);
        var aw=out>2?'\u25B2':out<-2?'\u25BC':'\u25CF';if(m.arw.textContent!==aw){m.arw.textContent=aw;m.arw.setAttribute('fill',out<-2?PAL.b:out>2?PAL.g:'#5a626e')}
        var sb=diff?((it.sh?'of ':'hub ')+(oth<0?'\u2212':'')+Math.abs(Math.round(oth))):(m.R2>=40?'':'%');if(m.sub.textContent!==sb) m.sub.textContent=sb;
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
    s:{t:'Slider settings',f:[F_INV,F_CAP,F_PC,F_PI,{k:'snap',l:'Snap to',ch:[0,5,10,25],lab:['Off','5%','10%','25%'],only:true,def:0}]},
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
      {k:'tg',l:'Control',ch:[0,1],lab:['Hold to move','Tap to toggle'],only:true,def:0,g:function(it){return it.tg?1:0},s:function(it,v){if(v) it.tg=1; else delete it.tg}}]},
    b:{t:'Turbo settings',f:[{k:'p',l:'Turbo power',u:'%',min:30,max:100,st:5,ch:[50,75,100],def:100},{k:'lock',l:'Tap to lock on',ch:[0,1],lab:['Off','On'],only:true,def:0,g:function(it){return it.lock?1:0},s:function(it,v){if(v) it.lock=true; else delete it.lock}}]},
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
    xy:{t:'XY pad settings',f:[{k:'hd',l:'When you let go',ch:[0,1],lab:['Back to the centre','Stay where it is'],only:true,def:0},
      {k:'ng',l:'Grid',ch:[0,1],lab:['On','Off'],only:true,def:0},{k:'nr',l:'LED rails',ch:[0,1],lab:['On','Off'],only:true,def:0}]},
    xf:{t:'Crossfader settings',f:[{k:'p',l:'Full power (top of the fader)',u:'%',min:10,max:100,st:5,ch:[50,80,100],def:100},
      {k:'md',l:'In the centre',ch:[0,1],lab:['Both channels at full power','Half power each'],only:true,def:0},
      {k:'rc',l:'Reverse the left side',ch:[0,1],lab:['Off','On'],only:true,def:0},{k:'rd',l:'Reverse the right side',ch:[0,1],lab:['Off','On'],only:true,def:0},
      {k:'xi',l:'How to use',info:function(){return 'Push the fader on the left up to run, pull it down to stop. Slide the knob to share the power, or tap C, 50 or D. \u21c4 reverses a side. Double-tap the knob to go back to the centre.'}}]},
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
        '<label><span class="set-top"><span>Start power</span><output class="offOut"></output></span><input class="off" type="range" min="0" max="50" step="5"></label>'+

        '<div class="seg stpseg" role="group" aria-label="Step size of the arrows"><button class="btn st1" type="button" aria-pressed="false">Step 1</button><button class="btn st5" type="button" aria-pressed="true">Step 5</button><button class="btn st10" type="button" aria-pressed="false">Step 10</button></div>'+
        '<div class="cvslot"><span class="set-top"><span>Response curve</span></span></div>'+
        '<div class="seg" role="group" aria-label="Control type"><button class="btn kS" type="button" aria-pressed="true">Slider</button><button class="btn kH" type="button" aria-pressed="false">Hold</button><button class="btn kL" type="button" aria-pressed="false">Light</button></div>'+
      '</div></details>';
    wrap.appendChild(el);
    var r={el:el,tag:$('.tag',el),name:$('.name',el),inv:$('.inv',el),track:$('.track',el),fill:$('.fill',el),rng:$('.pwr',el),
      holds:$('.holds',el),hRev:$('.hold.rev',el),hFwd:$('.hold.fwd',el),val:$('.val',el),mw:$('.meter-wrap',el),meter:$('.meter',el),sent:$('.sent',el),
      lock:$('.lock',el),max:$('.max',el),maxOut:$('.maxOut',el),off:$('.off',el),offOut:$('.offOut',el),cvslot:$('.cvslot',el),
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

  /* ---------- Sticks ---------- */
  var sticks=[];
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
    if(TILT.zero===null) TILT.zero=a;
    var d=a-TILT.zero;
    while(d>180) d-=360;
    while(d<-180) d+=360;
    TILT.deg=C.tilt.inv?d:-d;
    var sv=sn||C.tilt.sens, v=-d/sv;
    if(C.tilt.inv) v=-v;
    v=Math.max(-1,Math.min(1,v));
    if(dz===undefined) return Math.abs(v)<0.08?0:v;
    // custom dead zone in degrees: nothing inside it, then a smooth start so the value does not jump
    var dd=Math.min(.9,dz/sv),av=Math.abs(v);
    return av<=dd?0:(v<0?-1:1)*(av-dd)/(1-dd);
  }
  function tiltStep(){
    var st=sticks[0], held=false;
    if(st&&st.id!==null&&tiltActive()){applyStick(0,tiltVal(),st.y||0);held=true}
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
    if(tlWheel&&tlWheel.style){tlWheel.hidden=!on;tlWheel.style.transform=tr;tlWheel.classList.toggle('on',on&&!!TILT.touch)}
    var t='';
    if(C.tilt&&C.tilt.on){
      if(!TILT.has) t='Tilt sensor: no data yet';
      else if(TILT.touch) t='Tilt: '+Math.round(TILT.deg)+'\u00b0';
      else t='Tilt sensor is ready. Touch and hold a joystick or slider, then tilt the phone.';
    }
    if(el.textContent!==t) el.textContent=t;
  }
  function cfgOf(k){return k?C.s2:C.s1}
  function applyStick(k,x,y){
    var cf=cfgOf(k), va, vb;
    if(cf.mode==='axis'){va=y;vb=x}else{va=clamp(y+x,-1,1);vb=clamp(y-x,-1,1)}
    va*=(C.zone||100)/100;vb*=(C.zone||100)/100;
    if(cf.a>=0) setT(cf.a,va*100,false);
    if(cf.b>=0) setT(cf.b,vb*100,false);
    axbPaint(k,va*100,vb*100);
  }
  // Axis bars under the pad: current value from the centre
  function axbPaint(k,a,b){
    var st=sticks[k];if(!st||!st.axb) return;
    [a,b].forEach(function(v,q){
      var r=st.axb[q],m=Math.abs(v);v=Math.round(v);
      var lo=Math.min(0,v),w=Math.abs(v)/2;
      r.f.style.left=(50+lo/2)+'%';r.f.style.width=w+'%';
      r.f.style.background=m>=90?PAL.r:m>=60?PAL.o:PAL.g;
      var tx=(v>0?'+':'')+v;if(r.o.textContent!==tx) r.o.textContent=tx;
    });
  }
  function buildStick(k){
    var box=document.createElement('div');box.className='padbox';
    box.innerHTML='<h3 class="pb-title"></h3>'+
      '<div class="seg" role="group" aria-label="Stick mode"><button class="btn mA" type="button" aria-pressed="true">Axis</button><button class="btn mT" type="button" aria-pressed="false">Tank</button></div>'+
      '<div class="pad"><div class="knob rest"></div></div>'+
      '<div class="axb"><div class="ab"><span class="abl"></span><span class="abt"><i class="abf"></i><i class="abz"></i></span><output>0</output></div><div class="ab"><span class="abl"></span><span class="abt"><i class="abf"></i><i class="abz"></i></span><output>0</output></div></div>'+
      '<div class="maprow"><label><span class="la"></span><select class="selA"></select></label><label><span class="lb"></span><select class="selB"></select></label></div>'+
      '<label class="check spr-row"><input class="spr" type="checkbox" checked><span>Return to 0 when released</span></label>';
    $('#pads').appendChild(box);
    var st={box:box,title:$('.pb-title',box),mA:$('.mA',box),mT:$('.mT',box),pad:$('.pad',box),knob:$('.knob',box),
      spr:$('.spr',box),y:0,la:$('.la',box),lb:$('.lb',box),selA:$('.selA',box),selB:$('.selB',box),id:null};
    st.axb=[].map.call(box.querySelectorAll('.ab'),function(e){return {l:$('.abl',e),f:$('.abf',e),o:$('output',e)}});
    sticks.push(st);
    st.spr.addEventListener('change',function(){
      cfgOf(k).hold=!st.spr.checked;save();
      if(!cfgOf(k).hold&&st.id===null){st.knob.classList.add('rest');st.knob.style.transform='translate(0,0)';st.pad.style.setProperty('--m','0');applyStick(k,0,0)}
    });
    st.mA.addEventListener('click',function(){cfgOf(k).mode='axis';syncSticks();save()});
    st.mT.addEventListener('click',function(){cfgOf(k).mode='tank';syncSticks();save()});
    st.selA.addEventListener('change',function(){cfgOf(k).a=+st.selA.value;syncLayout();save()});
    st.selB.addEventListener('change',function(){cfgOf(k).b=+st.selB.value;syncLayout();save()});
    var sgeo=null, sq=null, sraf=0;
    function move(e){
      if(e&&e.type==='pointermove'){sq={clientX:e.clientX,clientY:e.clientY};if(!sraf) sraf=requestAnimationFrame(function(){sraf=0;if(sq&&st.id!==null){var q=sq;sq=null;mstep(q)}});return}
      mstep(e);
    }
    function mstep(e){
      if(!sgeo){var r=st.pad.getBoundingClientRect();sgeo={cx:r.left+r.width/2,cy:r.top+r.height/2,R:Math.max(8,(r.width-st.knob.offsetWidth*0.6)/2-7)}}
      var R=sgeo.R, dx=e.clientX-sgeo.cx, dy=e.clientY-sgeo.cy, m=Math.hypot(dx,dy);
      if(m>R){dx*=R/m;dy*=R/m}
      st.knob.style.transform='translate('+dx+'px,'+dy+'px)';
      st.y=-dy/R;
      applyStick(k,(k===0&&tiltActive())?tiltVal():dx/R,-dy/R);
    }
    st.pad.addEventListener('pointerdown',function(e){
      st.id=e.pointerId;sgeo=null;
      if(k===0) TILT.zero=null;
      try{st.pad.setPointerCapture(e.pointerId)}catch(_){}
      st.knob.classList.remove('rest');move(e);
    });
    st.pad.addEventListener('pointermove',function(e){if(e.pointerId===st.id)move(e)});
    function end(e){
      if(e.pointerId!==st.id)return;
      if(sq){var q0=sq;sq=null;mstep(q0)}
      st.id=null;if(cfgOf(k).hold)return;st.knob.classList.add('rest');st.knob.style.transform='translate(0,0)';st.pad.style.setProperty('--m','0');applyStick(k,0,0);
    }
    st.pad.addEventListener('pointerup',end);
    st.pad.addEventListener('pointercancel',end);
  }
  buildStick(0);buildStick(1);

  function syncSticks(){
    var idxs=activeIdx();
    sticks.forEach(function(st,k){
      var cf=cfgOf(k);
      st.spr.checked=!cf.hold;
      st.mA.setAttribute('aria-pressed',String(cf.mode==='axis'));
      st.mT.setAttribute('aria-pressed',String(cf.mode==='tank'));
      st.la.textContent=cf.mode==='axis'?'Drive (up/down)':'Left motor';
      st.lb.textContent=cf.mode==='axis'?'Steer (left/right)':'Right motor';
      st.title.textContent=k?'Right stick':'Left stick';
      st.axb[0].l.textContent=cf.mode==='axis'?'Drive':'Left';st.axb[1].l.textContent=cf.mode==='axis'?'Steer':'Right';
      [st.selA,st.selB].forEach(function(sel,q){
        var key=q?'b':'a';
        sel.innerHTML='';
        if(k===1){var none=document.createElement('option');none.value='-1';none.textContent='None';sel.appendChild(none)}
        idxs.forEach(function(i){var o=document.createElement('option');o.value=String(i);o.textContent=tagOf(i)+' · '+C.ch[i].name;sel.appendChild(o)});
        var cur=cf[key];
        if(!(k===1&&cur===-1)&&idxs.indexOf(cur)<0){cur=idxs[Math.min(q+k*2,idxs.length-1)];cf[key]=cur}
        sel.value=String(cur);
      });
    });
  }
  function syncTiltUi(){
    if(!tlOn||!C.tilt) return;
    tlOn.checked=C.tilt.on;tlOpt.hidden=!C.tilt.on;tlSens.value=String(C.tilt.sens);tlInv.checked=C.tilt.inv;tlAll.checked=C.tilt.all;
    tiltNative();
  }
  function mappedSet(){
    var m={};
    if(C.layout==='joy'||C.layout==='dual'){m[C.s1.a]=1;m[C.s1.b]=1}
    if(C.layout==='dual'){if(C.s2.a>=0)m[C.s2.a]=1;if(C.s2.b>=0)m[C.s2.b]=1}
    return m;
  }
  function syncLayout(){
    cols.classList.toggle('joy',C.layout==='joy');
    cols.classList.toggle('dual',C.layout==='dual');
    cols.classList.toggle('board',C.layout==='board');
    $('#lBoard').setAttribute('aria-pressed',String(C.layout==='board'));
    syncBoard();
    $('#lStd').setAttribute('aria-pressed',String(C.layout==='std'));
    $('#lJoy').setAttribute('aria-pressed',String(C.layout==='joy'));
    $('#lDual').setAttribute('aria-pressed',String(C.layout==='dual'));
    sticks[1].box.hidden=C.layout!=='dual';
    $('#joyTitle').textContent=C.layout==='dual'?'Sticks':'Joystick';
    var mapped=mappedSet(), multi=activeSlots().length>1, first=false, visible=[0,0,0];
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
    gpOn.checked=C.pad.on;gpDead.value=C.pad.dead;$('#gpDeadOut').textContent=C.pad.dead+'%';
    gpTrig.innerHTML='';
    var no=document.createElement('option');no.value='-1';no.textContent='None';gpTrig.appendChild(no);
    activeIdx().forEach(function(i){var o=document.createElement('option');o.value=String(i);o.textContent=tagOf(i)+' · '+C.ch[i].name;gpTrig.appendChild(o)});
    if(C.pad.trig>=0&&!isActive(C.pad.trig)) C.pad.trig=-1;
    gpTrig.value=String(C.pad.trig);
    for(var s=0;s<3;s++){
      $('#hub'+s).value=String(C.hubs[s]);
      var hn=$('#hubN'+s);hn.disabled=C.hubs[s]<0;hn.value=C.hubs[s]>=0?(C.hubNames[C.hubs[s]]||''):'';
    }
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
  gpOn.addEventListener('change',function(){C.pad.on=gpOn.checked;if(!C.pad.on) releasePad();save()});
  gpDead.addEventListener('input',function(){C.pad.dead=+gpDead.value;$('#gpDeadOut').textContent=C.pad.dead+'%'});
  gpDead.addEventListener('change',save);
  gpTrig.addEventListener('change',function(){releasePad();C.pad.trig=+gpTrig.value;save()});
  loopBox.addEventListener('change',function(){S.loop=loopBox.checked});
  function onHubChange(s,v){
    var h=C.hubs.slice();h[s]=v;
    for(var t=0;t<3;t++) if(t!==s&&v>=0&&h[t]===v) h[t]=-1;
    C.hubs=cleanHubs(h);
    stopPlay(true);
    for(var i=0;i<NMAX;i++) if(!isActive(i)){rt.t[i]=0;rt.o[i]=0;refs[i].rng.value=0;refs[i].val.textContent='0'}
    if(RH()&&S.connected){NB.stop();S.connected=false;hubMsg='';live.textContent='Hub setup changed. Tap Connect hub to reconnect.'}
    last=null;
    syncAll();paintLink();save();
  }
  [0,1,2].forEach(function(s){var sel=$('#hub'+s);sel.addEventListener('change',function(){onHubChange(s,+sel.value)})});
  if(NB){
    $('#note').textContent='Frames are broadcast over Bluetooth straight to the Mould King hubs. Put each hub in Bluetooth mode, tap Connect hub and wait until it says Hub active. With several hubs each one is updated in turn, so expect slightly slower response.';
  }

  /* ---------- Layout buttons ---------- */
  ['Std','Joy','Dual','Board'].forEach(function(n){
    $('#l'+n).addEventListener('click',function(){C.layout=n.toLowerCase();if(C.layout==='board'&&!C.board.length) prefillBoard();syncLayout();save()});
  });

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
  /* Setup wizard: builds a ready-made model from a vehicle type. */
  var wizPanel=$('#wizPanel'), wizType=$('#wizType');
  var WIZ={
    tank:{name:'Tracked vehicle',ch:['Left track','Right track'],mode:'tank',layout:'joy',note:'Channel A and B drive the tracks. Use the Joystick layout: push forward to drive, sideways to turn.'},
    car:{name:'Car with steering',ch:['Drive','Steering'],mode:'axis',layout:'joy',note:'Channel A drives and channel B steers. Use the Joystick layout: up and down drives, left and right steers.'},
    digger:{name:'Digger',ch:['Left track','Right track','Arm','Bucket','Swing'],mode:'tank',layout:'dual',note:'Channels A and B drive the tracks, C, D and E move the arm, bucket and swing. Uses the Dual stick layout.'}
  };
  function wizSync(){var w=WIZ[wizType.value]||WIZ.tank;$('#wizNote').textContent=w.note}
  wizType.addEventListener('change',wizSync);
  $('#profWiz').addEventListener('click',function(){wizPanel.hidden=!wizPanel.hidden;if(!wizPanel.hidden) wizSync()});
  // ---- Test hub: move every active channel briefly at low power ----
  var TEST_ID='__test', testBtn=$('#profTest'), testNote=$('#testNote'), testPlan=[];
  function testOn(){return !!(S.play&&S.play.seq===TEST_ID)}
  function buildTest(){
    var steps=[];testPlan=[];
    activeIdx().forEach(function(i){
      var d;
      if(C.ch[i].kind==='light'){steps.push({ch:i,pwr:100,dur:0.8});d=0.8}
      else{steps.push({ch:i,pwr:C.testPwr,dur:0.7});steps.push({ch:i,pwr:-C.testPwr,dur:0.7});d=1.4}
      steps.push({ch:-1,pwr:0,dur:0.3});d+=0.3;
      testPlan.push({i:i,d:d*1000});
    });
    return {id:TEST_ID,name:'Test',speed:1,steps:steps};
  }
  function testPaint(){
    if(!testBtn) return;
    var on=testOn();
    testBtn.textContent=on?'Stop test':'Test hub';
    testBtn.setAttribute('aria-pressed',String(on));
    testBtn.disabled=!on&&(S.estop||!!S.play||!!S.rec);
    if(on){
      var el=Math.max(0,performance.now()-S.play.start), n=0, acc=0;
      for(;n<testPlan.length-1;n++){acc+=testPlan[n].d;if(el<acc) break}
      testNote.textContent='Testing '+tagOf(testPlan[n].i)+' ('+(n+1)+'/'+testPlan.length+'). Keep the model clear.';
      testNote.hidden=false;
    }else if(!testNote.hidden){testNote.hidden=true;testNote.textContent=''}
  }
  if(testBtn){
    testBtn.addEventListener('click',function(){
      if(testOn()){stopPlay(true);testPaint();return}
      if(S.estop){toast('Release the E-Stop first.');return}
      if(RH()&&!S.connected){toast('Connect the hub first.');return}
      if(S.play||S.rec){toast('Stop the current playback first.');return}
      var sq=buildTest();
      if(!sq.steps.length) return;
      noteInput();
      startPlay(compileSeq(sq),{seq:TEST_ID,loop:false,reps:1});
      testPaint();
    });
    setInterval(testPaint,150);
  }
  $('#wizCancel').addEventListener('click',function(){wizPanel.hidden=true});
  $('#wizGo').addEventListener('click',function(){
    if(store.profiles.length>=MAX_MODELS){live.textContent='Model list is full.';return}
    var w=WIZ[wizType.value]||WIZ.tank, names=w.ch.slice();
    var lights=$('#wizLights').checked, winch=$('#wizWinch').checked;
    var all=names.slice();while(all.length<PER) all.push('Channel '+L[all.length]);
    var cfg=baseCfg(all);
    cfg.s1.mode=w.mode;cfg.layout=w.layout;cfg.limit=70;cfg.ramp=60;
    if(w.mode==='axis'){cfg.ch[1].max=70}
    var n=names.length;
    if(lights&&n<PER){cfg.ch[n].name='Lights';cfg.ch[n].kind='light';n++}
    if(winch&&n<PER){cfg.ch[n].name='Winch';cfg.ch[n].kind='hold';n++}
    var prof={id:uid(),name:w.name,cfg:sanitizeCfg(cfg)};
    store.profiles.push(prof);
    wizPanel.hidden=true;
    switchProfile(prof.id);
    live.textContent='Model created: '+w.name;
    toast('Model created. Rename the channels or change the layout any time.',4000);
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
    S.play={preview:pv,rec:rec,start:performance.now()+((opts&&opts.delay)||0)*1000,idx:0,seq:(opts&&opts.seq)||null,rid:(opts&&opts.rid)||null,loop:opts&&opts.loop!==undefined?!!opts.loop:undefined,reps:(opts&&opts.reps)||1};
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
      else if(p.seq&&p.reps>1&&dur>200){p.reps--;p.start=now-(el%dur);el=el%dur;p.idx=0}
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
    list.slice(0,10).forEach(function(p){
      if(!p||typeof p!=='object'||store.profiles.length>=MAX_MODELS) return;
      store.profiles.push({id:uid(),name:uniqueName(tr(String(p.name||'Imported model').slice(0,24))),label:(typeof p.label==='string'?p.label.slice(0,24):''),cfg:sanitizeCfg(p.cfg)});
      added++;
    });
    var tAdd=0;
    if(data&&Array.isArray(data.tpls)) cleanTpls(data.tpls).forEach(function(t){if(store.prefs.tpls.length<10&&!store.prefs.tpls.some(function(o){return o.name===t.name})){store.prefs.tpls.push(t);tAdd++}});
    if(tAdd&&!added) save();
    if(added){save();syncProfiles()}
    ioMsg.textContent=(added?('Imported '+added+' model'+(added===1?'':'s')+'. Pick them in the Model list.'):(tAdd?'':'Nothing could be imported.'))+(tAdd?((added?' ':'')+'Imported '+tAdd+' layout template'+(tAdd===1?'':'s')+'.'):'');
  }
  window.onImportText=importText;
  window.onFileResult=function(kind,result){
    if(result==='ok') ioMsg.textContent='Models saved to file.';
    else if(result==='cancel') ioMsg.textContent='Cancelled.';
    else ioMsg.textContent=kind==='export'?'Could not save the file.':'Could not read that file.';
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
    if(!S.connected) refs.forEach(function(r){r.sent.textContent='not sent'});
  }
  link.addEventListener('click',function(){
    if(bdEditing){toast('Finish editing first, then connect the hub.');return}
    last=null;
    if(RH()){
      if(S.connected){wantLink=false;NB.stop();S.connected=false;hubMsg='';stopPlay(true);if(store.prefs.linkOn){store.prefs.linkOn=false;save()}}
      else{
        wantLink=true;hubMsg='Pairing…';S.connected=true;
        NB.start(activeSlots().map(function(s){return C.hubs[s]}).join(','));
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
        relinkTries++;zeroAll();hubMsg='Pairing…';S.connected=true;
        try{NB.start(activeSlots().map(function(s){return C.hubs[s]}).join(','));toast('Reconnecting the hub. Motors are at zero.',4000)}catch(e){S.connected=false;hubMsg=''}
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
    syncLock();paintRec();paintPlayer();
  }
  // Start / stop button in 'Output only' mode: the hub link stays up, but every channel is held at 0 while outputs are off
  function toggleOut(it){
    S.outOff=!S.outOff;
    S.outMsk=[it.o0,it.o1,it.o2,it.o3,it.o4,it.o5].map(function(x){return x!==0});
    if(S.outOff){stopRecord();stopPlay(false);for(var i=0;i<NMAX;i++) if(isActive(i)&&S.outMsk[i%PER]) setT(i,0,false)}
    last=null;tick();
    live.textContent=S.outOff?'Hub output is off: the chosen channels are held at 0':'Hub output is on';
  }
  function setEstop(on){
    if(S.estop===on) return;
    S.estop=on;
    stopRecord();stopPlay(false);
    zeroAll();
    last=null;tick();paintEstop();
    live.textContent=S.estop?'E-Stop is on: every channel is locked at 0':'E-Stop released';
    feedback(S.estop?'estop':'release');
  }
  es.addEventListener('click',function(){setEstop(!S.estop)});

  function logFrame(f){
    var s=((performance.now()-t0)/1000).toFixed(1).padStart(6,' ');
    var slots=activeSlots(), multi=slots.length>1;
    slots.forEach(function(sl,n){
      var part=f.slice(n*PER,n*PER+PER).map(function(v,j){return L[j]+fmt(v).padStart(4,' ')}).join(' ');
      lines.push(s+'s  '+(multi?'M'+(C.hubs[sl]+1)+' ':'')+part);
    });
    while(lines.length>60) lines.shift();
    var el=$('#log');el.textContent=lines.join('\n');el.scrollTop=el.scrollHeight;
  }

  function tick(){
    padPoll();tiltStep();
    if(C.layout==='board') paintBoard();
    var now=performance.now();
    stepRecord(now);stepPlay(now);
    safetyStep(now);
    var step=Math.max(2,200*Math.pow(1-C.ramp/100,2)), vals=new Array(NMAX);
    for(var i=0;i<NMAX;i++){
      if(!isActive(i)){vals[i]=0;continue}
      var hold=S.estop||(S.outOff&&(!S.outMsk||S.outMsk[i%PER]));
      var goal=hold?0:goalOf(i);
      if(hold) rt.o[i]=0;
      var d=goal-rt.o[i];
      rt.o[i]=(C.ch[i].kind==='light'||Math.abs(d)<=step)?goal:rt.o[i]+(d<0?-1:1)*step;
      var o=Math.round(rt.o[i]), v=(C.ch[i].inv?-o:o)||0;
      vals[i]=v;
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
    var frame=[];
    activeSlots().forEach(function(s){for(var j=0;j<PER;j++) frame.push(vals[s*PER+j])});
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
    renderPlayer();paintQuick();
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
    paintPlayer();
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
  var FB={estop:[[440,440],0.12,'estop'],release:[[600,800],0.1,'ok'],ok:[[700,900],0.09,'ok'],lost:[[500,300],0.2,'lost'],warn:[[880,880,880],0.16,'warn'],idle:[[700,500,350],0.14,'warn'],hold:[[700,900],0.09,'hold']};
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
    beep(f[0],f[1]);
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
    if(ev==='nopin') toast('This launcher cannot add a shortcut.');
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
    if(id!==store.active) switchProfile(id);
  };


  // ---- Calibration, player mode, settings lock, phone battery ----
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

  var player=$('#player'), plGrid=$('#plGrid'), plStop=$('#plStop'), plExit=$('#plExit'), plTitle=$('#plTitle'), plBtns=[];
  function renderPlayer(){
    if(!plGrid) return;
    plGrid.innerHTML='';plBtns=[];
    C.seq.forEach(function(sq){
      var b=document.createElement('button');b.type='button';b.className='qbtn';
      b.addEventListener('click',function(){noteInput();runSeq(sq.id)});
      plGrid.appendChild(b);plBtns.push({b:b,sq:sq});
    });
    C.rec.filter(function(r){return r.btn}).forEach(function(r){
      var b=document.createElement('button');b.type='button';b.className='qbtn';
      b.addEventListener('click',function(){noteInput();runRecBtn(r)});
      plGrid.appendChild(b);plBtns.push({b:b,rec:r});
    });
    if(!plBtns.length){var n=document.createElement('p');n.className='pl-note';n.textContent='No sequences yet. Leave player mode and make one first.';plGrid.appendChild(n)}
    paintPlayer();
  }
  function paintPlayer(){
    if(!plGrid||!plBtns) return;
    var prof=store.profiles.filter(function(x){return x.id===store.active})[0];
    plTitle.textContent=prof?prof.name:'';
    plBtns.forEach(function(q){
      if(q.rec){
        var rm=!!(S.play&&S.play.rid===q.rec.id);
        q.b.classList.toggle('on',rm);q.b.textContent=(rm?'■ ':'● ')+q.rec.name;
        q.b.disabled=!rm&&(!!S.rec||!!S.play||S.estop);return;
      }
      var mine=!!(S.play&&S.play.seq===q.sq.id);
      q.b.classList.toggle('on',mine);
      q.b.textContent=(mine?'■ ':'▶ ')+q.sq.name;
      q.b.disabled=!mine&&(!!S.rec||!!S.play||S.estop||!q.sq.steps.length);
    });
    plStop.textContent=S.estop?'Release':'E-Stop';
  }
  var holdT=0;
  function holdBtn(btn,ms,fn){
    function up(){if(holdT){clearTimeout(holdT);holdT=0}btn.classList.remove('holding')}
    btn.addEventListener('pointerdown',function(e){
      if(btn.dataset.tap==='1') return;
      up();btn.classList.add('holding');
      holdT=setTimeout(function(){holdT=0;btn.classList.remove('holding');feedback('hold');fn()},ms);
    });
    ['pointerup','pointercancel','pointerleave','blur'].forEach(function(ev){btn.addEventListener(ev,up)});
    btn.addEventListener('contextmenu',function(e){e.preventDefault()});
    btn.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fn()}});
  }
  function openPlayer(){renderPlayer();S.kid=true;player.hidden=false;feedback('ok')}
  function closePlayer(){player.hidden=true;S.kid=false}
  $('#playerBtn').addEventListener('click',openPlayer);
  plStop.addEventListener('click',function(){setEstop(!S.estop)});
  holdBtn(plExit,1000,closePlayer);

  var lockBtn=$('#lockBtn');
  function applyLock(){
    if(!lockBtn) return;
    var on=!!store.prefs.lock, de=document.documentElement;
    ['imBtn','ioApply'].forEach(function(id){var e=$('#'+id);if(e) e.disabled=on});
    if(de&&de.setAttribute){ if(on) de.setAttribute('data-lock','1'); else de.removeAttribute('data-lock') }
    lockBtn.textContent=on?'Hold to unlock':'Lock settings';
  }
  lockBtn.addEventListener('click',function(){
    if(store.prefs.lock) return;
    store.prefs.lock=true;save();applyLock();feedback('ok');
    toast('Settings locked. To unlock, go to Settings › App and hold the unlock button for 2 seconds.',5000);
  });
  (function(){
    function up(){if(holdT){clearTimeout(holdT);holdT=0}lockBtn.classList.remove('holding')}
    lockBtn.addEventListener('pointerdown',function(){
      if(!store.prefs.lock) return;
      up();lockBtn.classList.add('holding');
      holdT=setTimeout(function(){holdT=0;lockBtn.classList.remove('holding');store.prefs.lock=false;save();applyLock();feedback('hold')},2000);
    });
    ['pointerup','pointercancel','pointerleave','blur'].forEach(function(ev){lockBtn.addEventListener(ev,up)});
  })();
  applyLock();

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


  // ---- Speed profiles, player limit, run limiter setting, recording tools, backup ----
  var kidLim=$('#kidLim');
  kidLim.addEventListener('change',function(){store.prefs.kidLimit=pickOf(kidLim.value,[100,70,50,30],50);save()});
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
  var tlOn=$('#tlOn'), tlOpt=$('#tlOpt'), tlSens=$('#tlSens'), tlInv=$('#tlInv'), tlAll=$('#tlAll'), tlSt=$('#tlSt'), tlWheel=$('#tlWheel');
  tlOn.addEventListener('change',function(){
    C.tilt.on=tlOn.checked;tlOpt.hidden=!C.tilt.on;TILT.zero=null;save();tiltNative();
    if(C.tilt.on) setTimeout(function(){if(!TILT.has) toast('No tilt sensor data yet. Check that the phone has an accelerometer.',5000)},1500);
  });
  tlSens.addEventListener('change',function(){C.tilt.sens=pickOf(tlSens.value,[30,45,60],45);save()});
  tlInv.addEventListener('change',function(){C.tilt.inv=tlInv.checked;save()});
  tlAll.addEventListener('change',function(){C.tilt.all=tlAll.checked;save();syncBoard()});

  // ---- Board layout ----
  var bdGrid=$('#boardGrid'), bdEditor=$('#bdEditor'), bdEditBtn=$('#bdEdit'), bdNote=$('#bdNote');
  var bdSel=[$('#bdTarget'),$('#bdTarget2'),$('#bdTarget3'),$('#bdTarget4')];
  var bdFields=[$('#bdF1'),$('#bdF2'),$('#bdF3'),$('#bdF4')], bdLbl=[$('#bdL1'),$('#bdL2'),$('#bdL3'),$('#bdL4')];
  var bdModeF=$('#bdFM'), bdMode=$('#bdMode'), bdWideChk=$('#bdWideChk'), bdSpring=$('#bdSpring'), bdSpringL=$('#bdSpringL');
  var bdTypes=[['s',$('#bdTS')],['j',$('#bdTJ')],['d',$('#bdTD')],['m',$('#bdTM')],['l',$('#bdTL')],['t',$('#bdTT')],['b',$('#bdTB')],['w',$('#bdTW')],['a',$('#bdTA')],['y',$('#bdTY')],['f',$('#bdTF')],['f',$('#bdTFN')],['lx',$('#bdTXmx')],['lx',$('#bdTXeq')],['lx',$('#bdTXts')],['lx',$('#bdTXgi')],['lx',$('#bdTXlp')],['lx',$('#bdTXtk')],['i',$('#bdTI')],['k',$('#bdTK')],['n',$('#bdTN')],['rs',$('#bdTRS')],['g',$('#bdTG')],['st',$('#bdTST')],['lv',$('#bdTLV')],['dp',$('#bdTDP')],['xy',$('#bdTXY')],['xf',$('#bdTXF')],['ro',$('#bdTRO')],['z',$('#bdTZ')],['e',$('#bdTE')],['ps',$('#bdTPS')]];
  var bdRat=(typeof document.querySelectorAll==='function')?[].slice.call(document.querySelectorAll('.bdRat')):[$('.bdRat'),$('.bdRat'),$('.bdRat'),$('.bdRat')], bdMixRow=$('#bdMixRow');
  bdRat.forEach(function(sel){[100,75,50,25,-25,-50,-75,-100].forEach(function(v){bdOpt(sel,String(v),(v>0?'+':'')+v+'%')});sel.value='100'});
  var BPRE={bdTFN:{nd:1},bdTXmx:{t:'mx'},bdTXeq:{t:'eq'},bdTXts:{t:'ts'},bdTXgi:{t:'gi'},bdTXlp:{t:'lp'},bdTXtk:{t:'tk'}}, bdBtn=null, bdK='s', bdEditing=false, bdPick=null, bdPickAt=0, bdW=[], dashAdd=false;
  function prefillBoard(){
    var n=0;
    activeIdx().forEach(function(i){if(n<4){C.board.push({k:'s',c:i,w:C.ch[i].kind==='hold'?2:1,hold:C.ch[i].kind==='hold'});n++}});
  }
  function bdOpt(sel,v,t){var o=document.createElement('option');o.value=v;o.textContent=t;sel.appendChild(o)}
  function bdFill(){
    if(!bdSel[0]) return;
    var chans=activeIdx(), tank=bdMode.value==='tank';
    var n=(bdK==='e'||bdK==='z'||bdK==='rs'||bdK==='ps')?0:(bdK==='j'||bdK==='w'||bdK==='dp'||bdK==='xy'||bdK==='xf')?2:(bdK==='d'||bdK==='m'?4:1);
    var L=bdK==='w'?['Output A','Output B']:bdK==='xy'?['X (left / right)','Y (up / down)']:bdK==='xf'?['Left side','Right side']:bdK==='ro'?['Channel']:(bdK==='l'||bdK==='t'||bdK==='b'||bdK==='g'||bdK==='st'||bdK==='lv'||bdK==='n'||bdK==='a'||bdK==='y'||bdK==='f'||bdK==='i'||bdK==='k')?[bdK==='l'?'Light channel':'Channel']:bdK==='m'?['Channel 1','Channel 2','Channel 3','Channel 4']:((bdK==='s')?['Channel']:
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
    bdWideChk.checked=(k==='j'||k==='d'||k==='m');
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
      var R=geo.R, dx=e.clientX-geo.cx, dy=e.clientY-geo.cy, d=Math.hypot(dx,dy);
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
    var gx=(store.prefs.lefty&&!bdEditing)?(48-g[0]-g[2]):g[0];
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
      if(e.target.closest&&e.target.closest('.bdw-ed,.bdw-lbl')) return;
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
      try{el.setPointerCapture(pid)}catch(_){}
      el.classList.add('moving');
      var mv=function(ev){
        if(ev.pointerId!==pid) return;
        var dx=Math.round((ev.clientX-sx)/cw), dy=Math.round((ev.clientY-sy)/ch), n=g0.slice();
        if(grp){
          if(dx!==gd[0]||dy!==gd[1]){if(grpAt(dx,dy)) gd=[dx,dy];else if(grpAt(dx,gd[1])) gd=[dx,gd[1]];else if(grpAt(gd[0],dy)) gd=[gd[0],dy]}
          grp.forEach(function(m){if(m.el) dashStyle(m.el,[m.g0[0]+gd[0],m.g0[1]+gd[1],m.g0[2],m.g0[3]])});
          dashGuides(it,[g0[0]+gd[0],g0[1]+gd[1],g0[2],g0[3]]);return}
        if(mode==='mv'){n[0]=clamp(g0[0]+dx,0,DG.x-g0[2]);n[1]=clamp(g0[1]+dy,0,DG.y-g0[3])}
        else{n[2]=clamp(g0[2]+dx,mn[0],DG.x-g0[0]);n[3]=clamp(g0[3]+dy,mn[1],DG.y-g0[1])}
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
        dashGuides(null);
        if(tap&&ev.type==='pointerup'&&BD_SEL.length&&mode==='mv'){var si=BD_SEL.indexOf(it);if(si>=0){if(BD_SEL.length>1) BD_SEL.splice(si,1)}else BD_SEL.push(it);
          bdPick=it;bdPickAt=Date.now();syncBoard();toast(BD_SEL.length+' selected');return}
        if(tap&&ev.type==='pointerup'){bdPick=(bdPick===it&&mode==='mv')?null:it;bdPickAt=Date.now();syncBoard();return}
        if(grp){
          if(gd[0]||gd[1]){var snp=JSON.parse(JSON.stringify(C.board));grp.forEach(function(m){snp[C.board.indexOf(m.o)][DG.k]=m.g0.slice()});
            BD_UNDO.push({board:snp,msg:'Group move undone.'});if(BD_UNDO.length>20)BD_UNDO.shift();
            grp.forEach(function(m){m.o[DG.k]=[m.g0[0]+gd[0],m.g0[1]+gd[1],m.g0[2],m.g0[3]]});save()}
          syncBoard();return}
        if(bdPick!==it) bdPickAt=Date.now();
        bdPick=it;
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
  function bdChans(){var u={};C.board.forEach(function(o){['c','d','e','f','pc'].forEach(function(k){if(typeof o[k]==='number'&&o[k]>=0) u[o[k]]=1});if(o.t) o.t.forEach(function(z){u[z.c]=1})});return u}
  function bdDup(it){
    if(it.k==='e'){toast('There is only one emergency stop.');return}
    var q=C.board.indexOf(it);if(q<0) return;
    var cp=JSON.parse(JSON.stringify(it));Object.keys(cp).forEach(function(k){if(k.charAt(0)==='_') delete cp[k]});
    delete cp.g;delete cp.gp;delete cp.lbl;
    var moved=false;
    if(typeof cp.c==='number'&&cp.c>=0&&!(typeof cp.d==='number'&&cp.d>=0)&&!cp.t){
      var u=bdChans(),act=activeIdx(),pos=act.indexOf(it.c);
      for(var i=1;i<=act.length;i++){var c2=act[(pos+i+act.length)%act.length];if(c2!==it.c&&!u[c2]){cp.c=c2;moved=true;break}}
      if(moved&&typeof cp.pc==='number') delete cp.pc;
    }
    BD_UNDO.push({board:JSON.parse(JSON.stringify(C.board)),msg:'Copy undone.'});if(BD_UNDO.length>20) BD_UNDO.shift();
    C.board.splice(q+1,0,cp);
    if(dashOn()) dashAuto();
    bdPick=cp;bdPickAt=Date.now();save();syncBoard();feedback('ok');
    toast(moved?'Copied to channel '+tagOf(cp.c)+'.':'Copied. The copy uses the same channel.');
  }
  function bdGroupTog(it){
    if(BD_SEL.length){BD_SEL=[];toast('Group cleared.')}
    else{BD_SEL=[it];toast('Tap other widgets to add them, then drag one to move them together.',4000)}
    syncBoard();
  }
  var KNAME={s:'Slider',j:'Joystick',d:'Dual joystick',b:'Button',t:'Toggle',m:'Meter',f:'Arc meter',g:'Gear',lv:'Lever',st:'Steering wheel',e:'Emergency stop',xy:'XY pad',xf:'Crossfader',ro:'Rotor',a:'Light'};
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
    if(it.k==='j'||it.k==='d') defs.push(['\u2699','Joystick settings',function(){jcShow(it)}]);
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
    var nm=document.createElement('span');nm.textContent=(it&&it.lbl)||text||'';if(it&&it.lbl) nm.title=text||'';
    else if(text){
      // "Dial · A · Left wheel" becomes a channel chip plus the channel name; the full text stays as the tooltip
      var cm=/^(?:(.+?)\s\u00b7\s)?([A-F])\s\u00b7\s(.+)$/.exec(text);
      if(cm){nm.title=text;nm.textContent='';var ch0=document.createElement('i');ch0.className='bdw-chip';ch0.textContent=cm[2];nm.appendChild(ch0);nm.appendChild(document.createTextNode(cm[3]))}
    }
    head.appendChild(nm);
    var out=null;
    if(bdEditing) head.appendChild(bdToolbar(it));
    else if(withOut){out=document.createElement('output');out.textContent='0';head.appendChild(out)}
    el.appendChild(head);
    return out;
  }
  function syncBoard(){
    if(!bdGrid||!C.board) return;
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
    bdEditBtn.setAttribute('aria-pressed',String(bdEditing));
    bdEditBtn.textContent=bdEditing?'Done editing':'Edit board';
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
        var jch=activeIdx(),jprs=[];
        for(var jq=0;jq<jch.length;jq+=2) jprs.push([jch[jq],jch[jq+1]===undefined?-1:jch[jq+1]]);
        var jcur=-1;jprs.forEach(function(pr,qi){if(pr[0]===it.c) jcur=qi});
        if(it.sw&&jprs.length>1&&jcur>=0){
          // Swipe sideways on the card (outside the pad) to move the joystick to the next pair of channels.
          var jdg=document.createElement('div');jdg.className='dialdots';
          jprs.forEach(function(pr,qi){var di=document.createElement('i');if(qi===jcur) di.className='on';di.title=tagOf(pr[0])+(pr[1]>=0?'+'+tagOf(pr[1]):'');if(qi>0&&((pr[0]/PER)|0)!==((jprs[qi-1][0]/PER)|0)) di.style.marginLeft='6px';jdg.appendChild(di)});
          el.appendChild(jdg);
          var jsx=null,jsy=0;el.style.touchAction='pan-y';
          el.addEventListener('pointerdown',function(e){if(bdEditing||(e.target.closest&&e.target.closest('.pad'))){jsx=null;return}jsx=e.clientX;jsy=e.clientY});
          el.addEventListener('pointerup',function(e){
            if(jsx===null) return;var dx=e.clientX-jsx,dy=e.clientY-jsy;jsx=null;
            if(Math.abs(dx)>36&&Math.abs(dx)>1.6*Math.abs(dy)&&!S.estop&&!S.play){
              var nx=(jcur+(dx<0?1:jprs.length-1))%jprs.length,np=jprs[nx];
              CRZ.skip=true;[it.c,it.d].forEach(function(c){if(c>=0){delete CRZ.v[c];setT(c,0,false)}});CRZ.skip=false;
              it.c=np[0];it.d=np[1];BD_SL={it:it,d:dx<0?1:-1};save();syncBoard();feedback('ok');
            }
          });
          el.addEventListener('pointercancel',function(){jsx=null});
        }
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
        var tsp=document.createElement('span');tsp.textContent='TURBO';tbn.appendChild(tsp);
        var tdown=false, tprev=0;
        var tpress=function(){
          if(tdown||S.estop||S.play) return;
          tdown=true;noteInput();tprev=rt.t[bc];S.turbo[bc]=true;tbn.classList.add('on');
          setT(bc,tprev<0?-(it.p||100):(it.p||100),false);
        };
        var tlift=function(){
          if(!tdown) return;
          tdown=false;tbn.classList.remove('on');
          setT(bc,tprev,false);S.turbo[bc]=false;
        };
        tbn.addEventListener('pointerdown',function(e){
          e.preventDefault();try{tbn.setPointerCapture(e.pointerId)}catch(_){}
          if(it.lock&&tdown){if(S.estop||rt.t[bc]===0){tdown=false;tbn.classList.remove('on');S.turbo[bc]=false}else{tlift();return}}
          tpress();
        });
        ['pointerup','pointercancel','lostpointercapture','blur'].forEach(function(ev){tbn.addEventListener(ev,function(){if(!it.lock) tlift()})});
        tbn.addEventListener('contextmenu',function(e){e.preventDefault()});
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
        lvt.addEventListener('pointermove',function(e){if(lvD) lvSet(e)});
        ['pointerup','pointercancel'].forEach(function(ev){lvt.addEventListener(ev,function(){lvD=false})});
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
            else dpr[q[0]]=1;
            dpApply();
          });
          if(!it.tg) ['pointerup','pointercancel'].forEach(function(ev){b.addEventListener(ev,function(){if(dpr[q[0]]){delete dpr[q[0]];dpApply()}})});
          b.addEventListener('contextmenu',function(e){e.preventDefault()});
          dbx.appendChild(b);dbs[q[0]]=b;
        });
        var dph=document.createElement('div');dph.className='dphub';dbx.appendChild(dph);
        dww.appendChild(dbx);el.appendChild(dww);w.dpd={bs:dbs,r:function(){return dpr},clr:dpClear};
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
      }else if(it.k==='xy'||it.k==='xf'||it.k==='ro'){
        if(!isActive(it.c)||(it.k!=='ro'&&!isActive(it.d))) return;
        var xhd=bdHead(el,it.k==='xy'?'XY pad \u00b7 '+tagOf(it.c)+'+'+tagOf(it.d):it.k==='xf'?'Crossfader \u00b7 '+tagOf(it.c)+'\u21c4'+tagOf(it.d):'Rotor \u00b7 '+tagOf(it.c)+' \u00b7 '+C.ch[it.c].name,it,true);
        el.classList.add('mtrw');
        w.mtr=xwBuild(el,it,xhd);
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
        else el.appendChild(mr);
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
          r.addEventListener('pointerdown',function(){w.drag=true;if(C.tilt.all&&tiltActive()){TILT.zero=null;BD_TILT.cur=tsl}});
          r.addEventListener('input',function(){
            noteInput();
            if(BD_TILT.cur===tsl){r.value=String(Math.round(tiltVal()*100));return}
            if(it.snap){r.value=String(Math.round(+r.value/it.snap)*it.snap)}
            setT(c,wOut(it,+r.value),true);
          });
          var rel=function(){
            w.drag=false;
            if(BD_TILT.cur===tsl) BD_TILT.cur=null;
            if(!it.hold&&!S.play&&!(refs[c]&&refs[c].locked)){r.value='0';setT(c,0,true)}
          };
          r.addEventListener('pointerup',rel);r.addEventListener('pointercancel',rel);
          if(it.v){
            var vw=document.createElement('div');vw.className='bdv';vw.appendChild(r);el.appendChild(vw);el.classList.add('vert');
          }else el.appendChild(r);
          w.rng=r;
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
  /* Light programs: one pattern at a time plays across a light panel's light channels.
     Steps are 200 ms or longer so the hub keeps up. E-Stop, a recording playing back, or a tap stops it. */
  var LXPN=['','Chase','Bounce','Alternate','Police','All blink','Fill','Twinkle'];
  var LXP={it:null,chs:[],iv:0,t0:0};
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
  function lxpStop(quiet){
    if(!LXP.it) return;clearInterval(LXP.iv);var chs=LXP.chs;LXP.it=null;LXP.chs=[];
    if(!quiet) chs.forEach(function(c){if(C.ch[c]&&C.ch[c].kind==='light') setT(c,0,false)});
    paintBoard();
  }
  function lxpStart(it,chs){
    lxpStop();if(!chs.length){toast('This panel has no light channels to play.');return}
    LXP={it:it,chs:chs,t0:performance.now(),iv:0,k:0,nx:0};
    // The step time is read on every tick, so a new Program speed takes effect at once
    // (it used to be fixed when the program started). Slow 800 ms, Normal 400 ms, Fast 180 ms per step.
    function tick(){
      if(!LXP.it) return;
      if(S.estop){lxpStop(true);return}
      if(S.play) return;
      var now=performance.now(),ms=Math.max(120,[0,800,400,180][LXP.it.ps||2]*(LXP.it.pr===4?.7:1));
      if(!LXP.nx) LXP.nx=now+ms; else if(now>=LXP.nx){LXP.k++;LXP.nx=Math.max(LXP.nx+ms,now+ms*.5)}
      var k=LXP.k,n=LXP.chs.length;
      LXP.chs.forEach(function(c,i){if(!C.ch[c]||C.ch[c].kind!=='light') return;var want=lxpOn(it.pr,n,k,i)?(C.ch[c].bright||100):0;if(rt.t[c]!==want) setT(c,want,false)});
    }
    LXP.iv=setInterval(tick,50);tick();paintBoard();
  }
  function lxBuild(el,it){
    var t=it.t,c=it.c,o={it:it,key:''},TXT='var(--fg,#e8e8ea)',MUT='var(--muted,#8a93a0)';
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
          if((LXP&&LXP.it===it)) lxpStop(true);
          if(C.ch[lc].kind!=='light'){C.ch[lc].kind='light';syncChannel(lc);save()}setT(lc,rt.t[lc]>0?0:(C.ch[lc].bright||100),false)});
        grid.appendChild(b);return [b,lc];
      });
      if(it.pr){
        var pg=document.createElement('button');pg.type='button';pg.className='lx-pg';box.appendChild(pg);o.pg=pg;
        pg.addEventListener('click',function(){noteInput();if((LXP&&LXP.it===it)){lxpStop();return}if(S.estop||S.play) return;
          lxpStart(it,lcs.filter(function(x){return C.ch[x].kind==='light'}));feedback('ok')});
      }
      o.paint=function(){var run=(LXP&&LXP.it===it),key=o.bs.map(function(q){return rt.t[q[1]]>0?1:0}).join('')+(S.estop?'e':'')+(run?'r':'');if(o.key===key) return;o.key=key;
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
  function paintBoard(){
    if(LXP&&LXP.it&&(C.board||[]).indexOf(LXP.it)<0) lxpStop(true);
    if(!bdW||!bdW.length) return;
    mirrorPairs();
    paintPads();
    bdW.forEach(function(w){
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
        if(w.dial.lv!==dv){w.dial.lv=dv;w.dial.sg.forEach(function(q){var on=w.it.ow?q.v<=dv&&dv>0:(q.v>0&&q.v<=dv)||(q.v<0&&q.v>=dv),col=on?mCol(q.v,MTH[(w.it.th===1||w.it.th===2)?w.it.th:0]):'rgba(150,160,175,.32)';if(q.f!==col){q.f=col;q.e.setAttribute('fill',col)}})}
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
        if(w.rng&&!w.drag&&+w.rng.value!==vu) w.rng.value=String(vu);
      }
    });
  }
  bdEditBtn.addEventListener('click',function(){bdEditing=!bdEditing;if(!bdEditing) snapBoard();syncBoard()});
  $('#dbEdit').addEventListener('click',function(){bdEditing=!bdEditing;if(!bdEditing){dashAdd=false;snapBoard()}syncBoard()});
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
  (function(){
    var pad=$('#lockPad'),tm=0;
    function setLock(on){document.documentElement.classList.toggle('locked',on);pad.hidden=!on;pad.classList.remove('hold');clearTimeout(tm);if(on) feedback('ok')}
    $('#dbLock').addEventListener('click',function(){bdEditing=false;dashAdd=false;syncBoard();setLock(true);toast('Board locked. Hold the lock button to unlock.',3000)});
    pad.addEventListener('pointerdown',function(e){e.preventDefault();pad.classList.add('hold');clearTimeout(tm);tm=setTimeout(function(){setLock(false);feedback('hold');toast('Board unlocked.')},1000)});
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){pad.addEventListener(ev,function(){clearTimeout(tm);pad.classList.remove('hold')})});
    window.__lock=function(){return document.documentElement.classList.contains('locked')};
  })();
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
    if(!v[0]&&bdK!=='e'&&bdK!=='z'&&bdK!=='rs'&&bdK!=='ps'&&!(bdK==='lx'&&bdPre().t==='tk')){bdNote.textContent='Nothing to add.';return}
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
    bdNote.textContent='';save();syncBoard();
  });
  bdSetKind('s');
  if(/[?&]mk6test\b/.test(location.search)) window.__t={C:C,S:S,rt:rt,store:store,cleanBoard:cleanBoard,save:save,syncBoard:syncBoard,paintBoard:paintBoard,WSPEC:WSPEC,wsEdit:wsEdit,hubMsgSet:function(m){hubMsg=m;paintLink()}};
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
  var optSound=$('#optSound'), optHaptic=$('#optHaptic'), optRelink=$('#optRelink'), optFx=$('#optFx'), pinBtn=$('#pinBtn');
  function syncApp(){
    if(!optSound) return;
    optSound.checked=store.prefs.sound;optHaptic.checked=store.prefs.haptic;if(optRelink) optRelink.checked=store.prefs.relink;if(optFx){optFx.value=store.prefs.fx;if(window.mk6Lite) window.mk6Lite.mode(store.prefs.fx)}optFull.checked=store.prefs.full;fullNative();
    $('#lang').value=store.prefs.lang;
    pinBtn.hidden=!(NB&&NB.pinModel);
    if(kidLim) kidLim.value=String(store.prefs.kidLimit);
    applyLock();
  }
  optSound.addEventListener('change',function(){store.prefs.sound=optSound.checked;save();if(optSound.checked) beep([700,900],0.09)});
  if(optFx) optFx.addEventListener('change',function(){store.prefs.fx=optFx.value;save();if(window.mk6Lite) window.mk6Lite.mode(optFx.value)});
  if(optRelink) optRelink.addEventListener('change',function(){store.prefs.relink=optRelink.checked;save()});
  optHaptic.addEventListener('change',function(){store.prefs.haptic=optHaptic.checked;save();if(optHaptic.checked) feedback('ok')});
  pinBtn.addEventListener('click',function(){try{NB.pinModel(store.active,activeProfile().name)}catch(e){toast('This launcher cannot add a shortcut.')}});
  syncSafety();syncApp();

  // ---- Gamepad button mapping ----
  var BTN_NAMES={0:'A',1:'B',2:'X',3:'Y',4:'LB',5:'RB',10:'L3',11:'R3',12:'D-pad up',13:'D-pad down',14:'D-pad left',15:'D-pad right'};
  function buildGpMap(){
    var box=$('#gpMap');if(!BTN_NAMES||!box||!box.appendChild) return;
    box.innerHTML='';
    PAD_BTNS.forEach(function(b){
      var row=document.createElement('label');row.className='pm';
      var nm=document.createElement('span');nm.textContent=BTN_NAMES[b];
      var sel=document.createElement('select');
      var o=document.createElement('option');o.value='';o.textContent='Nothing';sel.appendChild(o);
      o=document.createElement('option');o.value='z';o.textContent='Stop all channels';sel.appendChild(o);
      o=document.createElement('option');o.value='R';o.textContent='Record / stop recording';sel.appendChild(o);
      o=document.createElement('option');o.value='P';o.textContent='Play / stop recording';sel.appendChild(o);
      activeIdx().forEach(function(i){
        var op=document.createElement('option');op.value='l'+i;op.textContent=tagOf(i)+' · '+C.ch[i].name+' light on/off';sel.appendChild(op);
        op=document.createElement('option');op.value='t'+i;op.textContent=tagOf(i)+' · '+C.ch[i].name+' Turbo (hold)';sel.appendChild(op);
      });
      activeIdx().forEach(function(i){
        [['f','forward'],['r','reverse']].forEach(function(d){
          var op=document.createElement('option');op.value=d[0]+i;op.textContent=tagOf(i)+' · '+C.ch[i].name+' '+d[1];sel.appendChild(op);
        });
      });
      [['rp','Dial selector: previous position'],['rn','Dial selector: next position'],['rg','Dial selector: on/off']].forEach(function(d){
        var op=document.createElement('option');op.value=d[0];op.textContent=d[1];sel.appendChild(op);
      });
      C.seq.forEach(function(q){var op=document.createElement('option');op.value='s:'+q.id;op.textContent='Run: '+q.name;sel.appendChild(op)});
      var cur=C.pad.map[b]||'';
      if(cur&&!Array.prototype.some.call(sel.options,function(x){return x.value===cur})){delete C.pad.map[b];cur=''}
      sel.value=cur;
      sel.addEventListener('change',function(){
        releasePad();
        if(sel.value) C.pad.map[b]=sel.value; else delete C.pad.map[b];
        save();
      });
      row.appendChild(nm);row.appendChild(sel);box.appendChild(row);
    });
  }

  buildGpMap();

  // ---- Gamepad (browser Gamepad API; standard mapping) ----
  var GP={on:[false,false],trig:false,btn:{},stat:'',had:false,hold:{},mb:{}};
  function padInfo(){
    try{
      var l=navigator.getGamepads?navigator.getGamepads():[];
      for(var i=0;i<l.length;i++) if(l[i]&&l[i].connected) return l[i];
    }catch(e){}
    return null;
  }
  function padDz(v,d){var a=Math.abs(+v||0);return a<d?0:(v<0?-1:1)*Math.min(1,(a-d)/(1-d))}
  function showKnob(k,x,y){
    var st=sticks[k];if(!st) return;
    var R=Math.max(8,(st.pad.getBoundingClientRect().width-st.knob.getBoundingClientRect().width*0.6)/2-7);
    st.knob.classList.toggle('rest',x===0&&y===0);
    st.knob.style.transform='translate('+(x*R)+'px,'+(-y*R)+'px)';
    st.pad.style.setProperty('--m',Math.min(1,Math.hypot(x,y)).toFixed(2));
  }
  function releasePad(){
    var bp=(C.layout==='board'&&typeof BD_PADS!=='undefined')?BD_PADS.filter(function(p){return p.jp.isConnected}):[];
    for(var k=0;k<2;k++) if(GP.on[k]){GP.on[k]=false;if(bp[k]) applyJoy(bp[k].it,0,0); else{showKnob(k,0,0);applyStick(k,0,0)}}
    if(GP.tb) Object.keys(GP.tb).forEach(function(b){var q=GP.tb[b];setT(q.c,q.p,false);S.turbo[q.c]=false;delete GP.tb[b]});
    if(GP.trig){GP.trig=false;if(C.pad.trig>=0) setT(C.pad.trig,0,false)}
    Object.keys(GP.hold).forEach(function(b){setT(GP.hold[b],0,false);delete GP.hold[b]});
  }
  function padEdge(g,n){
    var b=g.buttons[n],down=!!(b&&(b.pressed||b.value>0.5)),was=!!GP.btn[n];
    GP.btn[n]=down;if(down&&!was&&window.v2GpPress) try{window.v2GpPress(n)}catch(_){}
    return down&&!was;
  }
  function padStatus(g){
    var t=!g?'No gamepad found. Pair it in Android Bluetooth settings, then press any button.'
      :(C.pad.on?'Connected: '+String(g.id).slice(0,40):'Connected but switched off');
    if(t!==GP.stat){GP.stat=t;gpStat.textContent=t}
  }
  function padPoll(){
    var g=padInfo();
    padStatus(g);
    if(!!g!==GP.had){GP.had=!!g;if(g) feedback('ok'); else{feedback('lost');GP.mb={}}}
    if(!g||!C.pad.on){releasePad();return}
    if(padEdge(g,8)) setEstop(true);
    if(padEdge(g,9)) setEstop(false);
    var m=C.pad.map||{};
    Object.keys(m).forEach(function(b){
      var a=m[b],pb=g.buttons[+b],down=!!(pb&&(pb.pressed||pb.value>0.5)),was=!!GP.mb[b];
      GP.mb[b]=down;
      if(down) noteInput();
      if(a==='rp'||a==='rn'||a==='rg'){
        if(down&&!was&&!S.estop&&!S.play){
          var rw0=bdW.filter(function(q){return q.rsd&&q.rsd.k.isConnected})[0];
          if(rw0){
            var rd1=rw0.rsd;
            if(a==='rg'){rd1.tog();feedback('hold')}
            else rd1.mv(Math.max(0,Math.min(rd1.n-1,rd1.cur()+(a==='rn'?1:-1))));
          }
        }
      }
      else if(a.charAt(0)==='s'){if(down&&!was) runSeq(a.slice(2))}
      else if(a==='z'){if(down&&!was&&!S.play&&!S.estop) zeroAll()}
      else if(a==='R'){if(down&&!was){if(S.rec) stopRecord(); else startRecord()}}
      else if(a==='P'){if(down&&!was){if(S.play) stopPlay(true); else startPlay(null,{loop:S.loop})}}
      else if(a.charAt(0)==='l'){
        var lc=+a.slice(1);
        if(down&&!was&&isActive(lc)&&!S.estop&&!S.play){if(C.ch[lc].kind!=='light'){C.ch[lc].kind='light';save();syncChannel(lc)}setT(lc,rt.t[lc]>0?0:C.ch[lc].bright,false)}
      }
    });
    if(S.estop||S.play){releasePad();return}
    Object.keys(m).forEach(function(b){
      var a=m[b],c0=a.charAt(0);
      if(c0==='t'){
        var tch=+a.slice(1);if(!isActive(tch)) return;
        GP.tb=GP.tb||{};
        if(GP.mb[b]&&!GP.tb[b]){GP.tb[b]={c:tch,p:rt.t[tch]};S.turbo[tch]=true;setT(tch,rt.t[tch]<0?-100:100,false)}
        else if(!GP.mb[b]&&GP.tb[b]){var q0=GP.tb[b];delete GP.tb[b];setT(q0.c,q0.p,false);S.turbo[q0.c]=false}
        return;
      }
      if(c0!=='f'&&c0!=='r') return;
      if(a==='rp'||a==='rn'||a==='rg') return;
      var ch=+a.slice(1);
      if(!isActive(ch)) return;
      if(GP.mb[b]){setT(ch,c0==='f'?100:-100,false);GP.hold[b]=ch}
      else if(GP.hold[b]!==undefined){setT(GP.hold[b],0,false);delete GP.hold[b]}
    });
    var d=C.pad.dead/100, ax=g.axes||[];
    var xs=[[padDz(ax[0],d),padDz(ax[1],d)],[padDz(ax[2],d),padDz(ax[3],d)]];
    var bp=C.layout==='board'?BD_PADS.filter(function(p){return p.jp.isConnected}):[];
    var n=(C.layout==='dual'||bp.length>1)?2:1;
    for(var k=0;k<n;k++){
      var x=xs[k][0],y=-xs[k][1],act=x!==0||y!==0;
      if(act) noteInput();
      if(act||GP.on[k]){
        if(bp[k]){if(!bp[k].busy()) applyJoy(bp[k].it,x,y)}
        else{applyStick(k,x,y);showKnob(k,x,y)}
      }
      GP.on[k]=act;
    }
    if(C.pad.trig>=0&&isActive(C.pad.trig)){
      var rt_=g.buttons[7]?g.buttons[7].value:0, lt_=g.buttons[6]?g.buttons[6].value:0;
      var tv=rt_-lt_; if(Math.abs(tv)<0.05) tv=0;
      if(tv!==0) noteInput();
      if(tv!==0||GP.trig) setT(C.pad.trig,tv*100,false);
      GP.trig=tv!==0;
    }
  }
  if(typeof window.addEventListener==='function') window.addEventListener('gamepaddisconnected',function(){releasePad()});
  // ---- Language (English / Bahasa Melayu) and first-run guide ----
  var MS={'Target line':'Garisan sasaran','Target value':'Nilai sasaran',
    'Console':'Konsol','Mould King 6.0 · up to 3 hubs':'Mould King 6.0 · sehingga 3 hub',
    'Simulation on':'Simulasi hidup','Simulation off':'Simulasi mati','Connect hub':'Sambung hub','Hub active':'Hub aktif','Pairing…':'Memasangkan…',
    'Release':'Lepas','Turn the hub link on or off':'Hidupkan atau matikan sambungan hub',
    'E-Stop is on. Every channel is locked at 0. Tap Release E-Stop to continue.':'E-Stop aktif. Semua saluran dikunci pada 0. Tekan Lepas untuk sambung semula.',
    'E-Stop is on: every channel is locked at 0':'E-Stop aktif: semua saluran dikunci pada 0','E-Stop released':'E-Stop dilepaskan',
    'Bluetooth is off':'Bluetooth dimatikan','Permission denied':'Kebenaran ditolak','BLE advertising not supported':'Siaran BLE tidak disokong','Bluetooth error':'Ralat Bluetooth','Error':'Ralat',
    'Model':'Model','Model name':'Nama model','Colour':'Warna','Standard':'Standard','Dual stick':'Dua stick',
    'New model':'Model baharu','Delete':'Padam','Confirm delete':'Sahkan padam','Confirm':'Sahkan','Model colour':'Warna model','Layout':'Susun atur',
    'Model list is full.':'Senarai model penuh.','New model created from the current settings':'Model baharu dicipta daripada tetapan semasa',
    'Quick actions':'Tindakan pantas',
    'Channels':'Saluran','Reverse':'Undur','Forward':'Depan','Stop':'Henti','Channel settings':'Tetapan saluran','Maximum power':'Kuasa maksimum','Start power':'Kuasa mula','Dashboard when the phone is sideways':'Dashboard bila telefon mengiring','Edit':'Ubah','Add widget':'Tambah widget','E-Stop':'E-Stop','+ Add':'+ Tambah','Reset':'Set semula','Exit':'Keluar','Done':'Selesai','Reset layout':'Set semula susunan','Exit dashboard':'Keluar dashboard','Layout reset.':'Susunan disetkan semula.','No space. Make room or remove a widget first.':'Tiada ruang. Kosongkan ruang atau buang satu widget dahulu.','The board is full (16 controls).':'Papan penuh (16 kawalan).','Test power':'Kuasa ujian','Used by Calibration and Test hub. Ignores Limit and Speed, so raise it until the motor just moves.':'Digunakan oleh Kalibrasi dan Uji hub. Had kuasa dan Kelajuan diabaikan, jadi naikkan sehingga motor baru bergerak.',
    'Slider':'Gelangsar','Hold':'Tahan','Control type':'Jenis kawalan','Response curve':'Lengkung tindak balas',
    'Channel':'Saluran','Channel power':'Kuasa saluran','Channel name':'Nama saluran','Power channels':'Saluran kuasa','not sent':'tidak dihantar',
    'Sticks':'Stick','Left stick':'Stick kiri','Right stick':'Stick kanan','Axis':'Paksi','Tank':'Tangki','Stick mode':'Mod stick',
    'Drive (up/down)':'Pandu (atas/bawah)','Steer (left/right)':'Stereng (kiri/kanan)','Left motor':'Motor kiri','Right motor':'Motor kanan','None':'Tiada',
    'Repeat':'Ulang kali','Setup wizard':'Wizard persediaan','Vehicle type':'Jenis kenderaan','Tracked vehicle (two tracks)':'Kenderaan track (dua track)','Car with steering':'Kereta dengan stereng','Digger or crane (tracks, arm, bucket, swing)':'Jentera atau kren (track, lengan, baldi, putar)','Add lights':'Tambah lampu','Add a winch':'Tambah winch','Create model':'Cipta model','Cancel':'Batal',
    'Channel A and B drive the tracks. Use the Joystick layout: push forward to drive, sideways to turn.':'Saluran A dan B menggerakkan track. Guna susun atur Joystick: tolak ke depan untuk memandu, ke sisi untuk membelok.',
    'Channel A drives and channel B steers. Use the Joystick layout: up and down drives, left and right steers.':'Saluran A memandu dan saluran B mengemudi. Guna susun atur Joystick: atas dan bawah memandu, kiri dan kanan mengemudi.',
    'Channels A and B drive the tracks, C, D and E move the arm, bucket and swing. Uses the Dual stick layout.':'Saluran A dan B menggerakkan track, C, D dan E menggerakkan lengan, baldi dan putaran. Guna susun atur Dua stick.',
    'Model created. Rename the channels or change the layout any time.':'Model dicipta. Anda boleh namakan semula saluran atau tukar susun atur bila-bila masa.',
'Switch (SPDT)':'Suis (SPDT)','Switch settings':'Tetapan suis','Output A':'Output A','Output B':'Output B','Centre off position':'Kedudukan tengah mati','Reverse output A':'Songsang output A','Reverse output B':'Songsang output B','Pick two different channels.':'Pilih dua saluran berbeza.','Slider settings':'Tetapan slider','Mix settings':'Tetapan campuran','Dial settings':'Tetapan dail','Steering wheel':'Stereng','Gear lever':'Tuas gear','D-pad':'Pad arah','Tidy':'Susun','Wheel':'Stereng','Lever':'Tuas','Widgets tidied. Back undoes it.':'Widget disusun. Back untuk batal.','Steering wheel settings':'Tetapan stereng','Full lock at':'Kunci penuh pada','On release':'Bila dilepas','Return to centre':'Kembali ke tengah','Stay':'Kekal','D-pad settings':'Tetapan pad arah','Drive mode':'Mod pemanduan','Tank (2 motors)':'Tank (2 motor)','Car (drive + steer)':'Kereta (pacu + stereng)','Ramp time (0 = instant)':'Masa ramp (0 = serta-merta)','Hold to move':'Tahan untuk bergerak','Tap to toggle':'Ketik untuk togol','Dial selector: previous position':'Suis dail: kedudukan sebelum','Dial selector: next position':'Suis dail: kedudukan seterusnya','Dial selector: on/off':'Suis dail: hidup/mati','Dial selector':'Suis dail','Selector settings':'Tetapan suis dail','Output power':'Kuasa output','Positions':'Kedudukan','Hub':'Hub','Hub 1':'Hub 1','Hub 2':'Hub 2','Hub 3':'Hub 3','Both ways':'Dua arah','Forward only':'Ke depan sahaja','On/off ramp time (0 = instant)':'Masa ramp on/off (0 = serta-merta)','Turbo settings':'Tetapan turbo','Direction & limit':'Arah & had','Reverse direction':'Songsang arah','Power limit':'Had kuasa','Snap to':'Lekat pada','Turbo power':'Kuasa turbo','Tap to lock on':'Ketik untuk kunci hidup','Brightness':'Kecerahan','Blink':'Kelip','Repeat':'Ulang','Speed':'Laju','Loop':'Gelung','On':'Hidup','Steady':'Tetap','Slow':'Perlahan','Fast':'Laju','Toggle settings':'Tetapan togol','Ramp settings':'Tetapan naik perlahan','Auto-stop settings':'Tetapan henti auto','Timer settings':'Tetapan pemasa','Widget settings':'Tetapan widget','Power':'Kuasa','Target power':'Kuasa sasaran','Ramp time':'Masa naik','Stop after':'Henti selepas','Alert after (0 = off)':'Amaran selepas (0 = mati)','Off':'Mati','Decrease':'Kurang','Increase':'Tambah','Auto-stop':'Henti auto','Ramp':'Naik perlahan','Arc meter':'Meter arka','Meter settings':'Tetapan meter','Target line':'Garisan sasaran','Target value':'Nilai sasaran','Monitor':'Pemantau','4 motors + driver':'4 motor + pemandu','LED and arc meter, slider, scope and ramp for one channel':'Meter LED dan arka, slider, scope dan ramp untuk satu saluran','Four arc meters on top, joystick and scope below':'Empat meter arka di atas, joystick dan scope di bawah','Main value':'Nilai utama','Widget':'Widget','Hub output':'Output hub','Colour theme':'Tema warna','Blue-orange':'Biru-oren','Mono':'Mono','Time window':'Tetingkap masa','LED meter':'Meter LED','Scope':'Osiloskop','Duration':'Tempoh','ON':'AKTIF','Gear':'Gear','Gear settings':'Tetapan gear','Session timer':'Pemasa sesi','Dial':'Dail','R (reverse)':'R (undur)','Add gear':'Tambah gear','Remove gear':'Buang gear','Save':'Simpan','Cancel':'Batal','Session timer reset.':'Pemasa sesi ditetapkan semula.','No alert \u00b7 hold to reset':'Tiada amaran \u00b7 tahan untuk set semula','Light settings':'Tetapan lampu','Test hub':'Uji hub','Kid':'Kanak-kanak','Full':'Penuh','Power profile':'Profil kuasa','Save current limit as profile':'Simpan had semasa sebagai profil','Save profile':'Simpan profil','Profile saved.':'Profil disimpan.','Stick range (maximum output)':'Julat stick (output maksimum)','Hub names (optional)':'Nama hub (pilihan)','Hub 1 name':'Nama hub 1','Hub 2 name':'Nama hub 2','Hub 3 name':'Nama hub 3','Turbo':'Turbo','Stop test':'Henti ujian','Release the E-Stop first.':'Lepaskan E-Stop dahulu.','Stop the current playback first.':'Henti main semula semasa dahulu.','Toggle':'Togol','Toggle settings':'Tetapan togol','LED button':'Butang LED','Latch switch':'Suis selak','Direction':'Arah','Style':'Gaya','Power':'Kuasa','Speed':'Kelajuan','Start after':'Mula selepas','Now':'Sekarang','Light':'Lampu','Brightness':'Kecerahan','Blink':'Kelip','Steady':'Tetap','Slow blink':'Kelip perlahan','Fast blink':'Kelip laju','Pulse':'Denyut','Mix':'Campur','Share of power for each channel (same order as above)':'Bahagian kuasa untuk setiap saluran','Pick at least one channel.':'Pilih sekurang-kurangnya satu saluran.','Pick different channels.':'Pilih saluran yang berbeza.','Light channel':'Saluran lampu','ON':'HIDUP','OFF':'MATI',
    'Record & replay':'Rakam & main semula','Record':'Rakam','Play':'Main','Loop':'Ulang','Ready':'Sedia','Recordings':'Rakaman','Recording name':'Nama rakaman',
    'No recordings yet':'Belum ada rakaman','Stop recording':'Henti rakam','Connect the hub first.':'Sambung hub dahulu.',
    'Sequences':'Jujukan','Sequence':'Jujukan','Sequence name':'Nama jujukan','Add step':'Tambah langkah','Run':'Jalan','New sequence':'Jujukan baharu','Copy':'Salin',
    'Power %':'Kuasa %','Seconds':'Saat','Together':'Serentak','Wait (all stopped)':'Tunggu (semua henti)','No sequence yet.':'Belum ada jujukan.','No sequences yet':'Belum ada jujukan',
    'Move up':'Naik','Move down':'Turun','Delete step':'Padam langkah',
    'Each sequence becomes a quick action button. Steps run one after another; tick "together" to start a step with the one above.':'Setiap jujukan menjadi butang tindakan pantas. Langkah berjalan satu demi satu; tanda "Serentak" untuk memulakan langkah bersama langkah di atasnya.',
    'Gamepad':'Gamepad','Use gamepad':'Guna gamepad','Stick dead zone':'Zon mati stick','Trigger channel (RT forward, LT reverse)':'Saluran picu (RT depan, LT undur)',
    'Left stick = stick 1, right stick = stick 2 (Dual stick layout). Back = E-Stop, Start = release. The sticks use the channels chosen in the stick cards.':'Stick kiri = stick 1, stick kanan = stick 2 (susun atur Dua stick). Back = E-Stop, Start = lepas. Stick menggunakan saluran yang dipilih dalam kad stick.',
    'No gamepad found. Pair it in Android Bluetooth settings, then press any button.':'Tiada gamepad ditemui. Pasangkan dalam tetapan Bluetooth Android, kemudian tekan mana-mana butang.',
    'Connected but switched off':'Disambung tetapi dimatikan','Button mapping':'Pemetaan butang','Nothing':'Tiada','Stop all channels':'Henti semua saluran',
    'D-pad up':'D-pad atas','D-pad down':'D-pad bawah','D-pad left':'D-pad kiri','D-pad right':'D-pad kanan',
    'Limits & hubs':'Had & hub','Limits & auto-stop':'Had & henti automatik','Power limit (all channels)':'Had kuasa (semua saluran)','Acceleration smoothing':'Pelicinan pecutan',
    'Sliders return to 0 when released':'Gelangsar kembali ke 0 bila dilepas','Return to 0 when released':'Kembali ke 0 bila dilepas','Lock':'Kunci','Locked':'Dikunci','Calibration':'Kalibrasi','Start':'Mula','Correct':'Betul','Reversed':'Terbalik','Repeat':'Ulang','Cancel':'Batal','Player mode':'Mod pemain','Lock settings':'Kunci tetapan','Hold to unlock':'Tahan untuk buka kunci','Hold to exit':'Tahan untuk keluar','Release':'Lepas','Cancelled.':'Dibatalkan.',
    'Runs each channel forward at the test power for 1.5 seconds. Lift the model off the ground first. Say whether it moved the right way and the app fixes the direction for you.':'Setiap saluran dijalankan ke depan pada kuasa rendah selama 1.5 saat. Angkat model dari tanah dahulu. Beritahu sama ada ia bergerak ke arah yang betul dan app akan betulkan arah untuk anda.',
    'Connect the hub first, then press Start.':'Sambung hub dahulu, kemudian tekan Mula.',
    'Connect the hub first (top right), then press Start.':'Sambung hub dahulu (kanan atas), kemudian tekan Mula.',
    'Release E-Stop and stop any sequence or recording first.':'Lepaskan E-Stop dan hentikan sebarang jujukan atau rakaman dahulu.',
    'Stopped. Connect the hub, release E-Stop and try again.':'Dihentikan. Sambung hub, lepaskan E-Stop dan cuba lagi.',
    'Done. Every channel is checked.':'Siap. Semua saluran telah diperiksa.',
    'Player mode shows only big sequence buttons and E-Stop. Lock settings hides everything that changes the model. Hold the button for 2 seconds to unlock or leave.':'Mod pemain hanya menunjukkan butang jujukan besar dan E-Stop. Kunci tetapan menyembunyikan semua yang mengubah model. Tahan butang selama 2 saat untuk buka kunci atau keluar.',
    'No sequences yet. Leave player mode and make one first.':'Belum ada jujukan. Keluar dari mod pemain dan buat satu dahulu.',
    'Settings locked. Hold the button in the App card for 2 seconds to unlock.':'Tetapan dikunci. Tahan butang dalam kad App selama 2 saat untuk buka kunci.','Settings locked. To unlock, go to Settings › App and hold the unlock button for 2 seconds.':'Tetapan dikunci. Untuk buka kunci, pergi ke Tetapan › Aplikasi dan tahan butang buka kunci selama 2 saat.',
    'Slow':'Perlahan','Rename model in the list':'Namakan semula model dalam senarai','Done renaming':'Selesai menamakan semula','Vertical or horizontal':'Menegak atau mengufuk','Tilt on every Board joystick and slider':'Condong pada setiap joystik dan slider Board','Full screen (hide system bars)':'Skrin penuh (sembunyi bar sistem)','Touch and hold a joystick or slider, then tilt the phone.':'Sentuh dan tahan joystik atau slider, kemudian condongkan telefon.','Tilt steering':'Pusing dengan condong','This phone has no tilt sensor.':'Telefon ini tiada sensor condong.',
    'Tilt sensor: no data yet':'Sensor condong: belum ada data','Tilt sensor is ready. Touch and hold a joystick or slider, then tilt the phone.':'Sensor condong sedia. Sentuh dan tahan joystik atau slider, kemudian condongkan telefon.',
    'No tilt sensor data yet. Check that the phone has an accelerometer.':'Belum ada data sensor condong. Pastikan telefon ada sensor pecutan.',
    'Touch and hold the joystick with one thumb. Up and down drives. Tilt the phone left or right like a steering wheel to steer. It works with the left joystick, or the first joystick on the Board. Hold the phone upright or sideways, not flat.':'Sentuh dan tahan joystik dengan satu ibu jari. Atas dan bawah untuk memandu. Condongkan telefon ke kiri atau kanan seperti stereng untuk memusing. Ia berfungsi dengan joystik kiri, atau joystik pertama pada Board. Pegang telefon tegak atau mengiring, bukan mendatar.','Hold':'Tahan','Double joystick':'Joystik berkembar','Double stick':'Stik berkembar','Mode':'Mod','Add to board':'Tambah ke papan','Done editing':'Siap sunting','Channel':'Saluran','Drive':'Pandu','Steer':'Pusing','Left motor':'Motor kiri','Right motor':'Motor kanan','None':'Tiada',
    'Pick different channels for each motor.':'Pilih saluran berbeza untuk setiap motor.','Axis (drive + steer)':'Paksi (pandu + pusing)','Tank (left + right)':'Tangki (kiri + kanan)','Hold buttons':'Butang tahan','Slider':'Gelangsar','Sequence':'Jujukan','Wide':'Lebar','Add':'Tambah','Edit board':'Sunting papan',
    'The board is empty. Tap Edit board to add controls.':'Papan kosong. Tekan Sunting papan untuk tambah kawalan.','The board is full (12 controls).':'Papan penuh (12 kawalan).','Nothing to add. Make a sequence first.':'Tiada untuk ditambah. Buat jujukan dahulu.',
    'Steer by tilting the phone (experimental)':'Pusing dengan condongkan telefon (eksperimen)','Tilt for full steering':'Condong untuk pusing penuh','Low sensitivity (60\u00b0)':'Kepekaan rendah (60\u00b0)','Medium (45\u00b0)':'Sederhana (45\u00b0)','High sensitivity (30\u00b0)':'Kepekaan tinggi (30\u00b0)','Reverse tilt direction':'Terbalikkan arah condong','No tilt sensor found on this phone.':'Tiada sensor condong pada telefon ini.','Normal':'Biasa','Fast':'Laju','Board':'Papan',
    'Stop a channel after running this long':'Henti saluran selepas berjalan selama ini','Player mode power limit':'Had kuasa mod pemain',
    'Edit recording':'Sunting rakaman','Half speed':'Separuh laju','Slower (0.75x)':'Lebih perlahan (0.75x)','Faster (1.5x)':'Lebih laju (1.5x)','Double speed':'Dua kali laju',
    'Save as new':'Simpan sebagai baru','From (s)':'Dari (s)','To (s)':'Hingga (s)','Trim to new':'Potong ke baru','Join to end':'Sambung ke hujung','Copy':'Salin',
    'Back up automatically every week':'Sandar automatik setiap minggu','Back up now':'Sandar sekarang',
    'No backup yet. The file goes to Downloads/MK6-Console-backup.json.':'Belum ada sandaran. Fail disimpan di Downloads/MK6-Console-backup.json.',
    'Backup saved to the Downloads folder.':'Sandaran disimpan dalam folder Downloads.','Backup failed. Use Export models instead.':'Sandaran gagal. Guna Export models.',
    'Set a start before the end.':'Tetapkan mula sebelum tamat.','That edit does not fit. Try a shorter one.':'Suntingan itu terlalu panjang. Cuba yang lebih pendek.',
    'Hub link lost. Motors stopped.':'Sambungan hub terputus. Motor dihentikan.',
    'Bluetooth was switched off. Motors stopped.':'Bluetooth dimatikan. Motor dihentikan.','Bluetooth was switched off':'Bluetooth dimatikan','Sticks return to 0 when released':'Stick kembali ke 0 bila dilepas','Auto-stop when idle':'Henti automatik bila tiada input','Warn after long full power':'Amaran selepas kuasa penuh lama',
    'Off':'Mati','Hubs (module number of each)':'Hub (nombor modul setiap satu)',
    'Frames sent':'Bingkai dihantar','Frame log':'Log bingkai',
    'Each frame is six values from -100 to +100, one per channel, for every active hub. This page is running in simulation: no Bluetooth is used, frames are only logged.':'Setiap bingkai ialah enam nilai dari -100 hingga +100, satu setiap saluran, untuk setiap hub aktif. Halaman ini berjalan dalam simulasi: Bluetooth tidak digunakan, bingkai hanya dicatat.',
    'Frames are broadcast over Bluetooth straight to the Mould King hubs. Put each hub in Bluetooth mode, tap Connect hub and wait until it says Hub active. With several hubs each one is updated in turn, so expect slightly slower response.':'Bingkai disiarkan melalui Bluetooth terus ke hub Mould King. Letakkan setiap hub dalam mod Bluetooth, tekan Sambung hub dan tunggu sehingga tertulis Hub aktif. Dengan beberapa hub, setiap satu dikemas kini bergilir, jadi tindak balas sedikit lebih perlahan.',
    'Backup':'Sandaran','Export models':'Eksport model','Import models':'Import model','Apply import':'Gunakan import','Model data':'Data model',
    'Exports every model, including recordings, as one file.':'Mengeksport semua model, termasuk rakaman, sebagai satu fail.',
    'That file is too large to import.':'Fail itu terlalu besar untuk diimport.','That is not valid model data.':'Itu bukan data model yang sah.',
    'No models found in that data.':'Tiada model ditemui dalam data itu.','Nothing could be imported.':'Tiada apa yang dapat diimport.',
    'Models saved to file.':'Model disimpan ke fail.','Cancelled.':'Dibatalkan.','Could not save the file.':'Tidak dapat menyimpan fail.','Could not read that file.':'Tidak dapat membaca fail itu.',
    'Choose where to save the file.':'Pilih tempat menyimpan fail.','Copy this text and keep it somewhere safe.':'Salin teks ini dan simpan di tempat selamat.',
    'Choose a model file.':'Pilih fail model.','Paste exported model data, then tap Apply import.':'Tampal data model yang dieksport, kemudian tekan Gunakan import.',
    'App':'Aplikasi','Language':'Bahasa','Sound':'Bunyi','Vibration':'Getaran','Reconnect when I return to the app':'Sambung semula bila saya kembali ke app','Effects':'Kesan visual','Lightweight':'Ringan','Auto (recommended)':'Auto (disyorkan)','Joystick settings':'Tetapan joystick','Applies to this joystick only.':'Untuk joystick ini sahaja.','Deadzone':'Zon mati','Sensitivity':'Kepekaan','Power limit':'Had kuasa','Axis lock':'Kunci paksi','Free':'Bebas','Left / right':'Kiri / kanan','Up / down':'Atas / bawah','Export layout':'Eksport susun atur','Import layout':'Import susun atur','Export / import layout':'Eksport / import susun atur','Import':'Import','Show guide':'Tunjuk panduan','Add model to home screen':'Tambah model ke skrin utama',
    'This launcher cannot add a shortcut.':'Pelancar ini tidak dapat menambah pintasan.',
    'Skip':'Langkau','Back':'Kembali','Next':'Seterusnya','Done':'Selesai',
    'My templates':'Templat saya','Wallpaper (portrait)':'Kertas dinding (menegak)','Wallpaper (landscape)':'Kertas dinding (melintang)','Choose image':'Pilih gambar','Fit: Fill':'Muat: Penuhi','Fit: Stretch':'Muat: Regang','Use default background':'Guna latar lalai','No image was chosen.':'Tiada gambar dipilih.','The image is too large to save.':'Gambar terlalu besar untuk disimpan.','Wallpaper set for landscape.':'Kertas dinding melintang ditetapkan.','Wallpaper set for portrait.':'Kertas dinding menegak ditetapkan.','Default background restored.':'Latar lalai dipulihkan.','Could not open the image picker.':'Tidak dapat membuka pemilih gambar.','Template name':'Nama templat','Save current layout':'Simpan susunan ini','My templates work in every model. Up to 10.':'Templat saya boleh digunakan dalam semua model. Maksimum 10.',
    'Delete?':'Padam?','Up to 10 templates. Delete one first.':'Maksimum 10 templat. Padam satu dahulu.',
    'Rename widget':'Namakan semula widget','Widget name':'Nama widget','Widget name (empty = default)':'Nama widget (kosong = asal)',
    'No recording':'Tiada rakaman',
    'Record / stop recording':'Rakam / henti rakam','Play / stop recording':'Main / henti rakaman',' light on/off':' lampu hidup/mati',' Turbo (hold)':' Turbo (tahan)',
    'LOW':'RENDAH','MID':'SEDANG','FULL':'PENUH','BLINK':'KELIP',
    'Connect the hub first, then press Play.':'Sambung hub dahulu, kemudian tekan Main.','No recording yet. Press Record first.':'Belum ada rakaman. Tekan Rakam dahulu.',
    'Preview on the screen only. The hub is not connected, so nothing moves.':'Pratonton pada skrin sahaja. Hub belum disambung, jadi tiada yang bergerak.',
    'Hub connected. Preview stopped. Press Play to run it for real.':'Hub disambung. Pratonton dihentikan. Tekan Main untuk jalankan betul-betul.','Move undone.':'Alihan dibatalkan.','Size undone.':'Saiz dibatalkan.',
    'That model has no Board layout yet, so it opens in its own layout.':'Model itu belum ada susunan Board, jadi ia dibuka dalam susunannya sendiri.',
    'Template':'Templat','Layout templates':'Templat susunan','Replaces the current layout. Press Back to undo.':'Menggantikan susunan semasa. Tekan Kembali untuk batal.',
    'Car / Truck':'Kereta / Trak','Excavator':'Jengkaut','Dual stick':'Dua joystick',
    'Drive slider, steering slider, lights, Turbo, winch, E-Stop':'Gelangsar pandu, gelangsar stereng, lampu, Turbo, win, E-Stop',
    'Thin track slider at the sides, double joystick for boom, arm, bucket, swing':'Gelangsar track nipis di tepi, joystick ganda untuk boom, arm, baldi, pusingan',
    'Two big joysticks, E-Stop, lights and Turbo in the middle':'Dua joystick besar, E-Stop, lampu dan Turbo di tengah',
    'Welcome to MK6 Console':'Selamat datang ke MK6 Console',
    'Control up to three Mould King 6.0 hubs from your phone over Bluetooth. This short guide covers the setup.':'Kawal sehingga tiga hub Mould King 6.0 dari telefon anda melalui Bluetooth. Panduan ringkas ini merangkumi persediaan.',
    'Set each hub number':'Tetapkan nombor setiap hub',
    'Press the power button on the hub briefly. The LED flashes 1, 2 or 3 times: that is its number (M1, M2, M3). Give every hub a different number, then pick the same numbers under Limits & hubs.':'Tekan butang power pada hub sekejap. LED berkelip 1, 2 atau 3 kali: itulah nombornya (M1, M2, M3). Beri setiap hub nombor berbeza, kemudian pilih nombor yang sama di bawah Had & hub.',
    'Connect':'Sambung',
    'Switch the hub into Bluetooth mode and power it on. Tap Connect hub, allow the Bluetooth permission, and wait about 3 seconds until it says Hub active.':'Tukar hub ke mod Bluetooth dan hidupkannya. Tekan Sambung hub, benarkan kebenaran Bluetooth, dan tunggu kira-kira 3 saat sehingga tertulis Hub aktif.',
    'Drive safely':'Pandu dengan selamat',
    'E-Stop locks every channel at 0 until you release it. On a gamepad, Back is E-Stop and Start releases it. Motors also stop when the app leaves the screen or after the idle time you set.':'E-Stop mengunci semua saluran pada 0 sehingga anda melepaskannya. Pada gamepad, Back ialah E-Stop dan Start melepaskannya. Motor juga berhenti bila app meninggalkan skrin atau selepas masa tiada input yang anda tetapkan.',
    'Make it yours':'Jadikan milik anda',
    'Pick a colour and a theme per model, build sequences and quick action buttons, and map gamepad buttons. You can reopen this guide from the App card.':'Pilih warna dan tema bagi setiap model, bina jujukan dan butang tindakan pantas, dan petakan butang gamepad. Anda boleh buka semula panduan ini dari kad Aplikasi.'
  };
  var MS_RE=[
    [/^of (\u2212?\d+)$/,function(m){return 'dari '+m[1]}],
    [/^hub (\u2212?\d+)$/,function(m){return 'hub '+m[1]}],
    [/^Target ([+\u2212]?\d+)$/,function(m){return 'Sasaran '+m[1]}],
    [/^(Gear|Dial|Ramp|Auto-stop|Switch|Arc meter|Tachometer|LED meter|Scope) \u00b7 (.+)$/,function(m){return ({'Arc meter':'Meter arka',Tachometer:'Takometer','LED meter':'Meter LED',Scope:'Osiloskop',Switch:'Suis',Nudge:'Tolak',Gear:'Gear',Dial:'Dail',Cruise:'Pelayaran',Ramp:'Naik perlahan',Step:'Langkah','Auto-stop':'Henti auto',Position:'Kedudukan'})[m[1]]+' \u00b7 '+m[2]}],
    [/^(\d+) s limit \u00b7 tap to change$/,function(m){return 'Had '+m[1]+' s \u00b7 ketik untuk tukar'}],
    [/^Auto-stop: channel (\S+) stopped after (\d+) s\.$/,function(m){return 'Henti auto: saluran '+m[1]+' dihentikan selepas '+m[2]+' s.'}],
    [/^Gear (\d)$/,function(m){return 'Gear '+m[1]}],
    [/^Alert (\d+) min \u00b7 hold to reset$/,function(m){return 'Amaran '+m[1]+' min \u00b7 tahan untuk set semula'}],
    [/^Session (\d+) min\. Check motors and battery\.$/,function(m){return 'Sesi '+m[1]+' min. Semak motor dan bateri.'}],
    [/^Colour (\d)$/,function(m){return 'Warna '+m[1]}],
    [/^Name of channel (\S+)$/,function(m){return 'Nama saluran '+m[1]}],
    [/^Power of channel (\S+)$/,function(m){return 'Kuasa saluran '+m[1]}],
    [/^Hub (M?\d)$/,function(m){return 'Hub '+m[1]}],
    [/^Last backup: (.*)\. File: Downloads\/MK6-Console-backup\.json$/,function(m){return 'Sandaran terakhir: '+m[1]+'. Fail: Downloads/MK6-Console-backup.json'}],
    [/^Channel (\S+) stopped after (\d+) s of running\. Move it back to 0, then start again\.$/,function(m){return 'Saluran '+m[1]+' dihentikan selepas '+m[2]+' s berjalan. Gerakkan kembali ke 0, kemudian mula semula.'}],
    [/^(Left|Right) stick: (Drive|Steer|Left motor|Right motor)$/,function(m){var t={'Drive':'Pandu','Steer':'Pusing','Left motor':'Motor kiri','Right motor':'Motor kanan'};return (m[1]==='Left'?'Stik kiri: ':'Stik kanan: ')+t[m[2]]}],
    [/^Tilt: (-?\d+)\u00b0$/,function(m){return 'Condong: '+m[1]+'\u00b0'}],
    [/^Phone (\d+)%$/,function(m){return 'Telefon '+m[1]+'%'}],
    [/^Phone battery is low \((\d+)%\)\. Charge it before driving\.$/,function(m){return 'Bateri telefon rendah ('+m[1]+'%). Cas sebelum memandu.'}],
    [/^Testing channel (\S+) \((.*)\) forward at (\d+)%$/,function(m){return 'Menguji saluran '+m[1]+' ('+m[2]+') ke depan pada '+m[3]+'%'}],
    [/^Channel (\S+): did it move the right way\?$/,function(m){return 'Saluran '+m[1]+': adakah ia bergerak ke arah yang betul?'}],
    [/^(\d+) frames$/,function(m){return m[1]+' bingkai'}],
    [/^Starts in (\d+) s$/,function(m){return 'Bermula dalam '+m[1]+' s'}],
    [/^Testing (\S+) \((\d+)\/(\d+)\)\. Keep the model clear\.$/,function(m){return 'Menguji '+m[1]+' ('+m[2]+'/'+m[3]+'). Pastikan model di ruang lapang.'}],
    [/^Recording (\d+:\d\d \/ \d+:\d\d)$/,function(m){return 'Merakam '+m[1]}],
    [/^Playing (\d+:\d\d \/ \d+:\d\d)( \(loop\))?$/,function(m){return 'Memainkan '+m[1]+(m[2]?' (ulang)':'')}],
    [/^(\d+) steps? · ([\d.]+) s( \(too long: only the first 90 s run\))?$/,function(m){return m[1]+' langkah · '+m[2]+' s'+(m[3]?' (terlalu panjang: hanya 90 s pertama dijalankan)':'')}],
    [/^Run: (.+)$/,function(m){return 'Jalankan: '+m[1]}],
    [/^(.+ · .+) forward$/,function(m){return m[1]+' depan'}],
    [/^(.+ · .+) reverse$/,function(m){return m[1]+' undur'}],
    [/^(.+) \(hub off\)$/,function(m){return m[1]+' (hub mati)'}],
    [/^Connected: (.+)$/,function(m){return 'Disambung: '+m[1]}],
    [/^Imported (\d+) models?\. Pick them in the Model list\.$/,function(m){return m[1]+' model diimport. Pilih dalam senarai Model.'}],
    [/^Stopped: no input for (\d+) s$/,function(m){return 'Berhenti: tiada input selama '+m[1]+' s'}],
    [/^Channel (\S+) has run near full power for (\d+) s\. Let the motor rest\.$/,function(m){return 'Saluran '+m[1]+' telah berjalan hampir kuasa penuh selama '+m[2]+' s. Biarkan motor berehat.'}]
  ];
  function msLookup(text){
    if(Object.prototype.hasOwnProperty.call(MS,text)) return MS[text];
    for(var i=0;i<MS_RE.length;i++){var m=MS_RE[i][0].exec(text);if(m) return MS_RE[i][1](m)}
    return null;
  }
  var trOrig=typeof WeakMap==='function'?new WeakMap():null, trShown=typeof WeakMap==='function'?new WeakMap():null;
  var ATTRS=['aria-label','title','placeholder'];
  function trSkip(el){return !el||el.tagName==='SCRIPT'||el.tagName==='STYLE'||(el.closest&&el.closest('.log'))}
  function trText(n){
    if(!trOrig) return;
    var cur=n.data;
    if(trShown.get(n)===cur){
      if(store.prefs.lang!=='ms'){n.data=trOrig.get(n);trShown.delete(n);trOrig.delete(n)}
      return;
    }
    if(store.prefs.lang!=='ms'||trSkip(n.parentElement)) return;
    var key=cur.trim();if(!key) return;
    var t=msLookup(key);if(t===null) return;
    var out=cur.replace(key,function(){return t});
    trOrig.set(n,cur);trShown.set(n,out);n.data=out;
  }
  function trAttr(el,a){
    if(!trOrig||!el.getAttribute) return;
    var cur=el.getAttribute(a);if(cur===null) return;
    var rec=trOrig.get(el)||{};
    if(rec[a]&&rec[a].shown===cur){
      if(store.prefs.lang!=='ms'){el.setAttribute(a,rec[a].orig);delete rec[a]}
      return;
    }
    if(store.prefs.lang!=='ms') return;
    var t=msLookup(cur.trim());if(t===null) return;
    rec[a]={orig:cur,shown:t};trOrig.set(el,rec);el.setAttribute(a,t);
  }
  function trWalk(root){
    if(!root||!document.createTreeWalker||!trOrig) return;
    if(root.nodeType===3){trText(root);return}
    if(root.nodeType!==1) return;
    var w=document.createTreeWalker(root,4),n,list=[];
    while((n=w.nextNode())) list.push(n);
    list.forEach(trText);
    var els=root.querySelectorAll?[].slice.call(root.querySelectorAll('[aria-label],[title],[placeholder]')):[];
    if(root.getAttribute) els.push(root);
    els.forEach(function(e){ATTRS.forEach(function(a){trAttr(e,a)})});
  }
  function applyLang(){
    var de=document.documentElement;
    if(de&&de.setAttribute) de.setAttribute('lang',store.prefs.lang==='ms'?'ms':'en');
    if(document.body) trWalk(document.body);
    $('#lang').value=store.prefs.lang;
    if(typeof guideRender==='function') guideRender();
  }
  if(document.body&&typeof MutationObserver==='function'){
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.type==='characterData') trText(m.target);
        else if(m.type==='attributes') trAttr(m.target,m.attributeName);
        else m.addedNodes.forEach(trWalk);
      });
    }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  }
  $('#lang').addEventListener('change',function(){store.prefs.lang=$('#lang').value==='ms'?'ms':'en';save();applyLang()});

  $('#guideBtn').addEventListener('click',guideOpen);
  var V2MS={'Back':'Kembali','Done':'Selesai','Home':'Utama','Drive':'Pandu','Models':'Model','Settings':'Tetapan','Main':'Utama',
    'Not connected':'Belum bersambung','Connect':'Sambung','Disconnect':'Putuskan','Reconnect':'Sambung semula','Active model':'Model aktif','Open':'Buka',
    'Record':'Rakam','Sequences':'Jujukan','Board':'Papan','Model settings':'Tetapan model','My models':'Model saya','Search models…':'Cari model…',
    'No model matches your search.':'Tiada model yang sepadan.','New model':'Model baharu','Templates & backup':'Templat & sandaran',
    'Car with steering':'Kereta berstereng','Drive + steer':'Pandu + stereng','Digger or crane':'Jentera atau kren','Tracks, arm, bucket':'Trek, lengan, baldi',
    'Tracked vehicle':'Kenderaan trek','Two tracks':'Dua trek','Empty board':'Papan kosong','Build your own':'Susun sendiri','Backup all models':'Sandaran semua model',
    'Save':'Simpan','Restore':'Pulihkan','Hub':'Hub','Hub & channel test':'Hub & ujian saluran','Safety':'Keselamatan','Model safety profile':'Profil keselamatan model',
    'Data':'Data','Backup & restore':'Sandaran & pulihkan','Experience':'Pengalaman','Theme':'Tema','Dark mode':'Gelap','Light mode':'Cerah','Language':'Bahasa',
    'Vibration & sound':'Getaran & bunyi','Light theme (outdoors)':'Tema cerah (luar rumah)','The board is empty':'Papan masih kosong','Pick a template or add your own widgets.':'Pilih templat atau tambah widget sendiri.','Templates':'Templat','Add widget':'Tambah widget','Press Record, drive, then press Record again to stop. Play replays it.':'Tekan Rakam, pandu, kemudian tekan Rakam lagi untuk henti. Main untuk ulang.','No sequences yet':'Belum ada jujukan','A sequence runs steps one after another from one button.':'Jujukan menjalankan langkah satu demi satu dengan satu butang.','Practice mode (no hub)':'Mod latihan (tanpa hub)','More':'Lain-lain','Tilt steering':'Stereng condong','Gamepad':'Gamepad',
    'App, guide & player mode':'Aplikasi, panduan & mod pemain','Frames sent':'Bingkai dihantar','App':'Aplikasi','No hub connected':'Tiada hub bersambung',
    'Turn the hub on, press its button for 2 seconds and hold it near the phone.':'Hidupkan hub, tekan butangnya 2 saat dan dekatkan dengan telefon.',
    'Rename':'Namakan','Channel test':'Ujian saluran','hold to run':'tahan untuk jalan','Hubs on this model':'Hub untuk model ini','Welcome':'Selamat datang',
    'Control Mould King 6.0 hubs':'Kawal hub Mould King 6.0','straight from your phone':'terus dari telefon','Your own widget board':'Papan widget sendiri',
    'laid out to fit each model':'susun ikut model','Safety first':'Selamat dahulu','E-Stop and automatic stop':'E-Stop & henti automatik','Start':'Mula',
    'Try without a hub':'Cuba tanpa hub','Practice on':'Latihan aktif','Practice off':'Latihan mati','Hub active':'Hub aktif','Pairing…':'Menyambung…',
    'E-Stop is on':'E-Stop aktif','Every channel is locked at 0':'Semua saluran dikunci pada 0','Release':'Lepas','Connection lost':'Sambungan hilang',
    'Outputs were stopped automatically':'Output dihentikan automatik','Bluetooth is off':'Bluetooth dimatikan','Turn it on to reach the hub':'Hidupkan untuk mencari hub',
    'Try again':'Cuba lagi','Check Bluetooth and the permission, then try again':'Semak Bluetooth dan kebenaran, kemudian cuba lagi',
    'Charge it before driving':'Cas dahulu sebelum memandu','OK':'Faham','Practice mode: no hub is used, outputs are only shown.':'Mod latihan: hub tidak digunakan, output hanya dipaparkan.',
    'Practice mode off.':'Mod latihan dimatikan.','Turn on Practice mode or connect the hub first.':'Hidupkan Mod latihan atau sambung hub dahulu.',
    'Release E-Stop first.':'Lepaskan E-Stop dahulu.','Practice mode: no hub is used':'Mod latihan: tiada hub digunakan','Connect hub':'Sambung hub','Disconnect hub':'Putuskan hub',
    'Permission denied':'Kebenaran ditolak','Bluetooth was switched off':'Bluetooth telah dimatikan','BLE advertising not supported':'Telefon tidak menyokong BLE advertising','Bluetooth error':'Ralat Bluetooth'};
  for(var v2k in V2MS) MS[v2k]=V2MS[v2k];
  var V2MS2={"A copy of the board is kept every time you finish editing it. Restore one if the layout gets messed up.": "Salinan papan disimpan setiap kali anda selesai menyunting. Pulihkan salah satu jika susunan menjadi kucar-kacir.", "Board history (this model, last 3)": "Sejarah papan (model ini, 3 terakhir)", "No saved boards yet.": "Belum ada papan disimpan.", "Export fills the box with your layout. Copy it to keep or share. To import, paste a layout here and press Import.": "Eksport mengisi kotak dengan susunan anda. Salin untuk simpan atau kongsi. Untuk import, tampal susunan di sini dan tekan Import.", "Start / stop": "Mula / henti", "Swipe to other pairs": "Leret ke pasangan lain", "Close": "Tutup", "Control board": "Papan kawalan", "Emergency stop": "Henti kecemasan", "Release emergency stop": "Lepas henti kecemasan", "Export or import layout": "Eksport atau import susun atur", "Layout text": "Teks susun atur", "Open the board": "Buka papan", "Return to 0 on release": "Kembali ke 0 bila dilepas", "Search models": "Cari model", "Set to zero": "Set ke sifar", "Wide or normal": "Lebar atau biasa", "Move earlier": "Alih ke atas", "Move later": "Alih ke bawah", "Link diagnostics": "Diagnostik sambungan", "Copy report": "Salin laporan", "Report copied.": "Laporan disalin.", "Could not copy.": "Tidak dapat menyalin.", "The hub only listens and never answers, so the phone cannot measure signal strength. If a model stutters, hold the phone closer and watch Bluetooth errors.": "Hub hanya mendengar dan tidak pernah membalas, jadi telefon tidak dapat mengukur kekuatan isyarat. Jika model tersekat-sekat, dekatkan telefon dan perhatikan Ralat Bluetooth.", "Link": "Sambungan", "Send mode": "Mod hantar", "Connected for": "Bersambung selama", "Frames from the app": "Bingkai daripada app", "Sent by Bluetooth": "Dihantar melalui Bluetooth", "Bluetooth errors": "Ralat Bluetooth", "Error time": "Masa ralat", "data too large": "data terlalu besar", "too many advertisers": "terlalu banyak pemancar", "already started": "sudah bermula", "internal Bluetooth error": "ralat dalaman Bluetooth", "not supported by this phone": "tidak disokong telefon ini", "Last error": "Ralat terakhir", "Safety stops (app paused)": "Henti keselamatan (app dijeda)", "Last frame": "Bingkai terakhir", "Transmit power": "Kuasa pancaran", "Native data": "Data Android", "Only in the Android app": "Hanya dalam app Android", "Update rate": "Kadar kemas kini", "Hubs on this model": "Hub untuk model ini", "Practice": "Latihan", "Not connected": "Belum bersambung", "On": "Hidup", "Off": "Mati", "Connecting": "Menyambung", "1 hub": "1 hub", "Several hubs at once": "Beberapa hub serentak", "Several hubs, taking turns": "Beberapa hub, bergilir", "Text size": "Saiz teks", "Normal": "Biasa", "Large": "Besar", "Largest": "Paling besar", "High contrast": "Kontras tinggi", "Text size works in the Android app.": "Saiz teks berfungsi dalam app Android.", "Share this model": "Kongsi model ini", "Share model": "Kongsi model", "Sends the model as a file (board, channels, recordings and sequences). Your friend opens it with MK6 Console.": "Menghantar model sebagai fail (papan, saluran, rakaman dan jujukan). Kawan anda membukanya dengan MK6 Console.", "Could not share the model.": "Tidak dapat berkongsi model.", "That file could not be shared or opened.": "Fail itu tidak dapat dikongsi atau dibuka.", "That file is not an MK6 model.": "Fail itu bukan model MK6.", "Shared from another phone": "Dikongsi dari telefon lain", "Add to my models": "Tambah ke model saya", "Ignore": "Abaikan", "Model added.": "Model ditambah.", "Nothing could be imported.": "Tiada apa yang dapat diimport.", "Show as a quick button": "Tunjuk sebagai butang pantas", "Added to Quick actions on the Drive screen.": "Ditambah ke Tindakan pantas di skrin Pandu.", "Removed from Quick actions.": "Dibuang dari Tindakan pantas."};
  for(var v2k2 in V2MS2) MS[v2k2]=V2MS2[v2k2];
  var V2MS3={"Eco": "Eco", "Sport": "Sport", "Drive mode": "Mod pandu", "Live output (tap for the big view)": "Keluaran langsung (ketik untuk paparan besar)", "Play time limit (a day)": "Had masa main (sehari)", "2 minutes of play time left.": "Tinggal 2 minit masa main.", "Play time is up. Motors are slowing down.": "Masa main tamat. Motor sedang perlahan.", "Hold for 2 seconds to change (parents).": "Tahan 2 saat untuk tukar (ibu bapa).", "Play time limit off.": "Had masa main dimatikan.", "5 more minutes.": "Tambah 5 minit.", "Play time is up": "Masa main tamat", "Come back tomorrow, or a parent can add 5 minutes": "Main lagi esok, atau ibu bapa boleh tambah 5 minit", "+5 min (hold 2 s)": "+5 minit (tahan 2 s)", "Live output meter": "Meter keluaran langsung", "Left-handed (landscape)": "Mod kidal (landskap)", "Model colour": "Warna model", "Yellow": "Kuning", "Red": "Merah", "Blue": "Biru", "Green": "Hijau", "Purple": "Ungu", "White": "Putih", "Trim (runs straight)": "Trim (jalan lurus)", "Trim buttons on the widget": "Butang trim pada widget", "Trim left": "Trim kiri", "Trim right": "Trim kanan", "Trim reset to 0.": "Trim diset semula ke 0.", "Trim · tap to reset": "Trim · ketik untuk set semula", "Size": "Saiz", "Widget type": "Jenis widget", "All": "Semua", "Lights & buttons": "Lampu & butang", "Meters": "Meter", "Tap a button on the picture, or press it on the gamepad.": "Ketik butang pada gambar, atau tekan pada gamepad.", "Quick settings": "Tetapan pantas", "Unlock": "Buka kunci", "Dark theme": "Tema gelap", "Light theme": "Tema cerah", "hold 2 s": "tahan 2 s", "Release E-Stop (hold 1 s)": "Lepas E-Stop (tahan 1 s)", "Drive up to three Mould King 6.0 hubs from your phone. This guide shows the real buttons, step by step.": "Pandu sehingga tiga hub Mould King 6.0 dari telefon anda. Panduan ini menunjukkan butang sebenar, langkah demi langkah.", "Start": "Mula", "Turn the hub on, then hold START for half a second. The ring turns yellow when the hub answers.": "Hidupkan hub, kemudian tahan START selama setengah saat. Cincin bertukar kuning bila hub menjawab.", "Move the controls to drive. Lift your finger and they go back to 0.": "Gerakkan kawalan untuk memandu. Angkat jari dan ia kembali ke 0.", "E-Stop stops every motor at once. Tap it again to release.": "E-Stop menghentikan semua motor serta-merta. Ketik sekali lagi untuk lepas.", "Your models": "Model anda", "Make your own board, start from a template, or share a model with a friend.": "Buat papan sendiri, mula daripada templat, atau kongsi model dengan kawan.", "Welcome to MK6 Console": "Selamat datang ke MK6 Console", "Lock settings": "Kunci tetapan", "Disconnect": "Putuskan"};
  for(var v2k3 in V2MS3) if(!MS[v2k3]) MS[v2k3]=V2MS3[v2k3];
  var V2MS4={"Cruise": "Cruise", "Connect the hub first.": "Sambungkan hub dahulu.", "Cruise off. Held controls go back to 0.": "Cruise dimatikan. Kawalan yang ditahan kembali ke 0.", "Cruise on: a control you let go of keeps its value. Bring it back to the middle to stop it. Steering and lights still return.": "Cruise hidup: kawalan yang dilepaskan kekal pada nilainya. Bawa kembali ke tengah untuk berhenti. Stereng dan lampu tetap kembali.", "Cruise on": "Cruise hidup", "Steering eases at speed": "Stereng ikut kelajuan", "Steering": "Stereng", "Throttle": "Pendikit", "Steering at full speed": "Stereng pada kelajuan penuh", "At full throttle the steering turns only this much, so the model does not tip over in fast turns.": "Pada pendikit penuh, stereng hanya berpusing setakat ini supaya model tidak terbalik semasa membelok laju.", "Bluetooth is back. Reconnecting the hub. Motors are at zero.": "Bluetooth hidup semula. Menyambung semula hub. Motor pada sifar.", "Reconnect automatically (back in the app, Bluetooth on again, or app opened)": "Sambung semula automatik (kembali ke app, Bluetooth hidup semula, atau app dibuka)", "Reconnecting the hub from last time. Motors are at zero.": "Menyambung semula hub seperti kali lepas. Motor pada sifar.", "Icon & photo": "Ikon & foto", "Model icon": "Ikon model", "Choose photo": "Pilih foto", "Remove photo": "Buang foto", "No icon": "Tiada ikon", "Car": "Kereta", "Excavator": "Jengkaut", "Crane": "Kren", "Truck": "Lori", "Tractor": "Traktor", "Boat": "Bot", "Photo set for this model.": "Foto ditetapkan untuk model ini.", "Photo removed.": "Foto dibuang.", "That image could not be read.": "Imej itu tidak dapat dibaca.", "No image was chosen.": "Tiada imej dipilih.", "Practice: virtual model": "Latihan: model maya", "tap to put the model back in the middle": "ketik untuk letak model di tengah semula", "Undo": "Batal", "Redo": "Ulang", "Focus mode": "Mod fokus", "Focus mode. Tap the focus button at the top to leave.": "Mod fokus. Ketik butang fokus di atas untuk keluar."};
  for(var v2k4 in V2MS4) if(!MS[v2k4]) MS[v2k4]=V2MS4[v2k4];
  var V2MS5={"% POWER":"% KUASA","Light program":"Program lampu","Program speed":"Kelajuan program","Chase":"Kejar","Bounce":"Lantun","Alternate":"Berselang","Police":"Polis","All blink":"Kelip semua","Fill":"Isi","Twinkle":"Kerlip","This panel has no light channels to play.":"Panel ini tiada saluran lampu untuk dimainkan.","Start power (channel)":"Kuasa mula (saluran)","How the hub value is made":"Bagaimana nilai hub dikira","Move the undo bar":"Alih bar undo","Drag to move \u00b7 double-tap to put back":"Seret untuk alih \u00b7 ketik dua kali untuk kembali","Tachometer look":"Rupa takometer","A Racing":"A Lumba","B Twin ring":"B Dwi-cincin","C Chrome":"C Krom","D Smooth arc":"D Lengkok licin","E Pro":"E Pro","POWER":"KUASA","LED strip":"Jalur LED","LED arrows":"Anak panah LED","LED bars":"Bar LED","Turn signals":"Isyarat belok","Gear LED":"Gear LED","Light panel":"Panel lampu","Message strip":"Jalur mesej","LED":"LED","LED matrix settings":"Tetapan matriks LED","Drive channel":"Saluran pemanduan","Steering channel (arrows left/right)":"Saluran stereng (anak panah kiri/kanan)","LED bars settings":"Tetapan bar LED","Bar 1":"Bar 1","Bar 2":"Bar 2","Bar 3":"Bar 3","Bar 4":"Bar 4","Turn signal settings":"Tetapan isyarat belok","Steering channel":"Saluran stereng","Blinks from":"Berkelip mulai","Left indicator light":"Lampu isyarat kiri","Right indicator light":"Lampu isyarat kanan","Left indicator":"Isyarat kiri","Right indicator":"Isyarat kanan","Gear LED settings":"Tetapan gear LED","Gear channel":"Saluran gear","Light panel settings":"Tetapan panel lampu","Light 1":"Lampu 1","Light 2":"Lampu 2","Light 3":"Lampu 3","Light 4":"Lampu 4","First channel":"Saluran pertama","First light channel":"Saluran lampu pertama","Message strip settings":"Tetapan jalur mesej","Scroll speed":"Kelajuan gulung","Slow":"Perlahan","Normal":"Biasa","Tachometer":"Takometer","Style":"Gaya","LED ring":"Cincin LED","Needle (tachometer)":"Jarum (takometer)","Response curve":"Lengkung tindak balas","Linear":"Linear","Fine":"Halus","Very fine":"Sangat halus","Fast":"Laju","Custom":"Sendiri",
    "Hazard":"Hazard","Light settings\u2026":"Tetapan lampu\u2026","Turns on by itself":"Menyala sendiri","Brake light":"Lampu brek","Reverse light":"Lampu undur","Follows drive channel":"Ikut saluran pemanduan",
    "Also show (yellow line)":"Turut tunjuk (garis kuning)","Also show (blue line)":"Turut tunjuk (garis biru)","Also show (grey line)":"Turut tunjuk (garis kelabu)"};
  for(var v2k5 in V2MS5) MS[v2k5]=V2MS5[v2k5];
  var V2MS6={"Picture":"Gambar","Arrows (follow direction)":"Anak panah (ikut arah)","My icon":"Ikon saya","My icon (tap the dots to draw)":"Ikon saya (ketik titik untuk lukis)","Animation":"Animasi","Scroll (faster with more power)":"Tatal (laju ikut kuasa)",
    "Both ways (reverse in blue)":"Dua arah (undur biru)","Tap a bar":"Ketik bar","Tap a bar to mute its channel (the hub gets 0). Tap again to unmute. Mute ends when the app closes.":"Ketik bar untuk bisukan salurannya (hub terima 0). Ketik sekali lagi untuk nyahbisu. Bisu tamat bila app ditutup.","MUTE":"BISU",
    "Mode":"Mod","One channel per position":"Satu saluran setiap kedudukan","Scenes (several channels)":"Adegan (beberapa saluran)","Scenes: power of each channel at each position":"Adegan: kuasa setiap saluran pada setiap kedudukan",
    "Rows are positions (1 = first). Channels left at 0 in every row are not touched. With 4 positions, rows 5 and 6 are not used.":"Baris ialah kedudukan (1 = pertama). Saluran yang 0 dalam semua baris tidak diusik. Dengan 4 kedudukan, baris 5 dan 6 tidak digunakan.",
    "Turning":"Putaran","Normal":"Biasa","Fine (1 turn = 50%)":"Halus (1 pusingan = 50%)","Tap the centre to go to 0":"Ketik tengah untuk ke 0","LED shape":"Bentuk LED","Square":"Segi","Round":"Bulat","Thin line":"Garis nipis"};
  for(var v2k6 in V2MS6) MS[v2k6]=V2MS6[v2k6];
  var V2MS7={"XY pad":"Pad XY","Crossfader":"Crossfader","Rotor":"Rotor","X (left / right)":"X (kiri / kanan)","Y (up / down)":"Y (atas / bawah)","Left side":"Sebelah kiri","Right side":"Sebelah kanan",
    "XY pad settings":"Tetapan pad XY","When you let go":"Bila dilepaskan","Back to the centre":"Kembali ke tengah","Stay where it is":"Kekal di situ","Grid":"Grid","LED rails":"Rel LED",
    "Crossfader settings":"Tetapan crossfader","Full power":"Kuasa penuh","In the centre":"Di tengah","Both channels at full power":"Kedua-dua saluran kuasa penuh","Half power each":"Separuh kuasa setiap satu","How to use":"Cara guna",
    "Tap the middle to start or stop. Slide the knob to share the power between the two channels. Double-tap the knob to go back to the centre.":"Ketik bahagian tengah untuk mula atau henti. Leret tombol untuk bahagikan kuasa antara dua saluran. Ketik dua kali tombol untuk kembali ke tengah.",
    "Rotor settings":"Tetapan rotor","Blades":"Bilah","Blade style":"Gaya bilah","Metal":"Logam","Boat propeller":"Kipas bot","BALANCE":"IMBANGAN","TAP TO START":"KETIK UNTUK MULA"};
  for(var v2k7 in V2MS7) MS[v2k7]=V2MS7[v2k7];
  var V2MS8={"frames / s":"bingkai / s","From the app":"Dari app","Sent by Bluetooth":"Dihantar oleh Bluetooth","Link is steady.":"Sambungan stabil.","Steady":"Stabil","Check":"Semak","Problem":"Masalah",
    "Connecting to the hubs…":"Menyambung ke hub…","At once":"Serentak","Taking turns":"Bergilir","Android app only":"App Android sahaja","Not connected.":"Tidak bersambung.","Live data is shown in the Android app.":"Data langsung ditunjukkan dalam app Android.",
    "off air":"tidak dipancar","Send rate, last 60 seconds":"Kadar hantar, 60 saat terakhir",
    "Duplicate":"Salin","Select several":"Pilih beberapa","Group cleared.":"Kumpulan dikosongkan.","Tap other widgets to add them, then drag one to move them together.":"Ketik widget lain untuk menambahnya, kemudian seret satu untuk mengalihkan semuanya bersama.",
    "Copy undone.":"Salinan dibatalkan.","Group move undone.":"Alihan kumpulan dibatalkan.","Copied. The copy uses the same channel.":"Disalin. Salinan menggunakan saluran yang sama.","There is only one emergency stop.":"Hanya ada satu henti kecemasan.",
    "High contrast (outdoor)":"Kontras tinggi (luar)","Colour-blind colours":"Warna buta warna","Direction arrows on values (▲/▼)":"Anak panah arah pada nilai (▲/▼)",
    "Colour-blind colours on: blue, orange and vermillion.":"Warna buta warna dihidupkan: biru, oren dan merah jingga.","Normal colours.":"Warna biasa.",
    "About":"Perihal","What's new":"Apa yang baharu","Check for updates":"Semak kemas kini","Update available":"Kemas kini tersedia","Download":"Muat turun","Later":"Nanti",
    "NEW":"BAHARU","IMPROVED":"BAIK","FIXED":"BAIKI","Checking for updates…":"Menyemak kemas kini…","You have the newest build.":"Anda sudah ada binaan terbaharu.",
    "Could not check for updates. Is the internet on?":"Tidak dapat menyemak kemas kini. Adakah internet dihidupkan?","Update check works in the Android app.":"Semakan kemas kini berfungsi dalam app Android.","No build has been published for updates yet.":"Belum ada binaan diterbitkan untuk kemas kini.","Could not check for updates. Try again later.":"Tidak dapat menyemak kemas kini. Cuba lagi nanti.",
    "Live link centre: send-rate graph, a ring for each hub and an early warning when sending slows down":"Pusat sambungan langsung: graf kadar hantar, cincin untuk setiap hub dan amaran awal bila penghantaran perlahan",
    "Edit mode: ⧉ duplicates a widget onto the next free channel; ⊞ selects several widgets to move together":"Mod edit: ⧉ menyalin widget ke saluran kosong seterusnya; ⊞ memilih beberapa widget untuk dialih bersama",
    "Colour-blind colours (blue / orange) and ▲/▼ direction arrows on values":"Warna buta warna (biru / oren) dan anak panah arah ▲/▼ pada nilai",
    "High contrast is stronger for outdoor use; TalkBack reads each widget's name":"Kontras tinggi lebih kuat untuk kegunaan luar; TalkBack membaca nama setiap widget",
    "Pink alignment guides while moving widgets":"Garis panduan jajaran merah jambu semasa mengalih widget","Check for updates, and this What's new list":"Semak kemas kini, dan senarai Apa yang baharu ini",
    "Light program speed now changes while the program runs; Slow, Normal and Fast are clearly different":"Kelajuan program lampu kini berubah semasa program berjalan; Perlahan, Biasa dan Laju jelas berbeza",
    "Rotor: jet turbine or silver boat propeller":"Rotor: turbin jet atau kipas bot perak","Crossfader: the master fader is the throttle and starts at 0":"Crossfader: fader utama ialah pendikit dan bermula pada 0",
    "New widgets: XY pad, crossfader and rotor":"Widget baharu: pad XY, crossfader dan rotor","Cleaner LED bar, LED meter and dial: extra value labels removed":"Bar LED, meter LED dan dail lebih kemas: label nilai tambahan dibuang",
    "LED bars work both ways; tap a bar to mute it":"Bar LED berfungsi dua arah; ketik bar untuk membisukannya","Dial: fine turning, tap the centre for 0, and scene selector":"Dail: putaran halus, ketik tengah untuk 0, dan pemilih babak",
    "LED matrix: draw your own icon and scroll it":"Matriks LED: lukis ikon sendiri dan tatalnya","Slider":"Peluncur","Joystick":"Joystik","Widget":"Widget"};
  for(var v2k8 in V2MS8) MS[v2k8]=V2MS8[v2k8];
  MS_RE.push([/^Copied to channel (.+)\.$/,function(m){return 'Disalin ke saluran '+m[1]+'.'}]);
  MS_RE.push([/^(\d+) selected$/,function(m){return m[1]+' dipilih'}]);
  MS_RE.push([/^Build (\d+)$/,function(m){return 'Binaan '+m[1]}]);
  MS_RE.push([/^Build (\d+) available$/,function(m){return 'Binaan '+m[1]+' tersedia'}]);
  MS_RE.push([/^Build (\d+) is ready\. You have build (\d+)\.$/,function(m){return 'Binaan '+m[1]+' sedia. Anda ada binaan '+m[2]+'.'}]);
  MS_RE.push([/^Version (\S+) · build (\d+)(.*)$/,function(m){return 'Versi '+m[1]+' · binaan '+m[2]+m[3]}]);
  MS_RE.push([/^Hubs take turns, so each hub gets news about every (\d+) ms\.$/,function(m){return 'Hub bergilir, jadi setiap hub dapat kemas kini kira-kira setiap '+m[1]+' ms.'}]);
  MS_RE.push([/^Bluetooth errors just now \((\d+)\)\. Hold the phone closer to the model\.$/,function(m){return 'Ralat Bluetooth sebentar tadi ('+m[1]+'). Dekatkan telefon ke model.'}]);
  MS_RE.push([/^Hub (M[\d, M]+) is not being sent to\.$/,function(m){return 'Hub '+m[1]+' tidak menerima penghantaran.'}]);
  MS_RE.push([/^Send rate dropped: no new frame for (.+)\. Keep the app open and the screen on\.$/,function(m){return 'Kadar hantar menurun: tiada bingkai baharu selama '+m[1]+'. Biarkan app terbuka dan skrin hidup.'}]);
  MS["Full power (top of the fader)"]="Kuasa penuh (fader paling atas)";
  MS["Push the fader on the left up to run, pull it down to stop. Slide the knob to share the power, or tap C, 50 or D. \u21c4 reverses a side. Double-tap the knob to go back to the centre."]="Tolak fader di kiri ke atas untuk jalan, tarik ke bawah untuk henti. Leret tombol untuk bahagikan kuasa, atau ketik C, 50 atau D. \u21c4 menyongsangkan satu sisi. Ketik dua kali tombol untuk kembali ke tengah.";
  var V2MS8={"Full in centre":"Tengah penuh","Cross":"Silang","Master power":"Kuasa induk","Reverse the left side":"Songsang sebelah kiri","Reverse the right side":"Songsang sebelah kanan","Jet turbine":"Turbin jet",
    "Tap \u23fb to start or stop (power comes up in 0.3 s). Slide the knob to share the power, or tap C, 50 or D. The fader on the left sets the master power. \u21c4 reverses a side. Double-tap the knob to go back to the centre.":"Ketik \u23fb untuk mula atau henti (kuasa naik dalam 0.3 s). Leret tombol untuk bahagikan kuasa, atau ketik C, 50 atau D. Fader di kiri menetapkan kuasa induk. \u21c4 menyongsangkan satu sisi. Ketik dua kali tombol untuk kembali ke tengah."};
  for(var v2k8 in V2MS8) MS[v2k8]=V2MS8[v2k8];
  MS_RE.push([/^([A-F]\d?): (.+)\. Example: 75 \u2192 hub (-?\d+)\.$/,function(m){return m[1]+': '+m[2].replace(/curve /,'lengkung ').replace(/start power/,'kuasa mula').replace(/drive mode/,'mod pemanduan').replace(/max /,'maks ')+'. Contoh: 75 \u2192 hub '+m[3]+'.'}]);
  MS_RE.push([/^([\u25B6\u25A0]) (Chase|Bounce|Alternate|Police|All blink|Fill|Twinkle)$/,function(m){return m[1]+' '+MS[m[2]]}]);
  MS_RE.push([/^(Linear|Fine|Very fine|Fast|Custom) \u00b7 50% \u2192 (\d+)%$/,function(m){return MS[m[1]]+' \u00b7 50% \u2192 '+m[2]+'%'}]);
  MS_RE.push([/^(\d+) hubs? · (\d+) widgets?$/,function(m){return m[1]+' hub · '+m[2]+' widget'}],
    [/^Output (\d+)%$/,function(m){return 'Keluaran '+m[1]+'%'}],
    [/^Phone battery low · (\d+)%$/,function(m){return 'Bateri telefon rendah · '+m[1]+'%'}],
    [/^(\d+) hubs · (.+)$/,function(m){return m[1]+' hub · '+(msLookup(m[2])||m[2])}]);
  MS['Templates']='Templat';
  [['Left wheel','Roda kiri'],['Right wheel','Roda kanan'],['Arm','Lengan'],['Scoop','Penyodok'],['Winch','Win'],['Lights','Lampu'],['Headlights','Lampu depan'],
   ['Rear lights','Lampu belakang'],['Channel D','Saluran D'],['Channel E','Saluran E'],['Channel F','Saluran F'],['Left track','Trek kiri'],['Right track','Trek kanan'],
   ['Bucket','Baldi'],['Swing','Putar'],['Steering','Stereng'],['Boom','Boom'],['Motor 1','Motor 1'],['Motor 2','Motor 2'],['Motor 3','Motor 3'],['Motor 4','Motor 4'],
   ['Basic setup','Tetapan asas'],['2-motor car (example)','Kereta 2 motor (contoh)'],['Excavator (example)','Jentera (contoh)'],['Spin','Pusing'],['Dig cycle','Kitaran gali'],
   ['My model','Model saya'],['Car / Truck','Kereta / Trak'],['Excavator / crane','Jengkaut / kren'],['Dual stick car','Kereta dua joystick'],['Robot (4 motors)','Robot (4 motor)'],
   ['My board','Papan saya'],['Advanced','Lanjutan'],['Control layout','Susun atur kawalan'],['Sliders, lights, Turbo, winch','Gelangsar, lampu, Turbo, win'],
   ['Tracks + double joystick','Trek + joystick berkembar'],['Two joysticks','Dua joystick'],['Four meters + joystick','Empat meter + joystick'],['Start from nothing','Mula dari kosong'],
   ['Pick a template','Pilih templat'],['Hold the button for half a second.','Tahan butang selama setengah saat.'],['Drive menu','Menu pandu']].forEach(function(x){MS[x[0]]=x[1]});
  MS['Settings are locked']='Tetapan dikunci';MS['Only driving is available']='Hanya pemanduan dibenarkan';MS['Unlock']='Buka kunci';
  MS_RE.push([/^(.+) · Output (\d+)%$/,function(m){return (msLookup(m[1])||m[1])+' · Keluaran '+m[2]+'%'}]);
  MS['Language, sound & vibration']='Bahasa, bunyi & getaran';MS['Hold a channel to run it at the test power.']='Tahan saluran untuk menjalankannya pada kuasa ujian.';
  MS['‹ Back']='‹ Kembali';MS['Mould King 6.0']='Mould King 6.0';
  [['Safety stop: the app paused, so every motor was set to 0.','Henti selamat: app tergendala, jadi semua motor ditetapkan ke 0.'],['Active','Aktif'],['Off','Mati'],['Active model','Model aktif'],['Hold for half a second to start','Tahan setengah saat untuk mula'],['Hold for half a second to stop','Tahan setengah saat untuk henti'],
   ['Template or empty','Templat atau kosong'],['Limits & auto-stop','Had & henti automatik'],['App, guide & player mode','Aplikasi, panduan & mod pemain'],
   ['Hub numbers & names','Nombor & nama hub'],['hold to run','tahan untuk jalan'],['Output','Keluaran'],['Remove','Buang'],['Add','Tambah'],
   ['None — add a second hub','Tiada — tambah hub kedua'],['None — add a third hub','Tiada — tambah hub ketiga'],['Record & replay','Rakam & ulang'],
   ['Stop recording','Henti rakam'],['More','Lagi'],['Back','Kembali'],['Search models…','Cari model…']].forEach(function(x){MS[x[0]]=x[1]});
  MS['Connect hub']=MS['Connect hub']||'Sambung hub';MS_RE.push([/^(\d+) recordings?$/,function(m){return m[1]+' rakaman'}],[/^(\d+) sequences?$/,function(m){return m[1]+' jujukan'}],
    [/^Hub (\d) · M(\d)$/,function(m){return 'Hub '+m[1]+' · M'+m[2]}],[/^Channels (.+)–(.+)$/,function(m){return 'Saluran '+m[1]+'–'+m[2]}],
    [/^Light · ([A-R][0-9]?)$/,function(m){return 'Lampu · '+m[1]}],
    [/^Play time limit: (\d+) min a day\.$/,function(m){return 'Had masa main: '+m[1]+' min sehari.'}],[/^Size (\d×\d)$/,function(m){return 'Saiz '+m[1]}],
    [/^Button (.+) found: pick what it does\.$/,function(m){return 'Butang '+m[1]+' dikesan: pilih fungsinya.'}],
    [/^Model received: (.+)$/,function(m){return 'Model diterima: '+m[1]}],[/^(\d+) models in this file$/,function(m){return m[1]+' model dalam fail ini'}],
    [/^(\d+) models added\.$/,function(m){return m[1]+' model ditambah.'}],[/^(\d+) per second$/,function(m){return m[1]+' sesaat'}],
    [/^(.+) ago$/,function(m){return m[1]+' lalu'}],[/^(\d+) s$/,function(m){return m[1]+' saat'}],[/^(\d+) min (\d+) s$/,function(m){return m[1]+' min '+m[2]+' saat'}],
    [/^(\d+) h (\d+) min$/,function(m){return m[1]+' jam '+m[2]+' min'}],
    [/^(\d+) · (data too large|too many advertisers|already started|internal Bluetooth error|not supported by this phone|code \d+)$/,function(m){return m[1]+' · '+({'data too large':'data terlalu besar','too many advertisers':'terlalu banyak pemancar','already started':'sudah bermula','internal Bluetooth error':'ralat dalaman Bluetooth','not supported by this phone':'tidak disokong telefon ini'}[m[2]]||m[2].replace('code','kod'))}],
    [/^Model saved as (.+)$/,function(m){return 'Model disimpan sebagai '+m[1]}],
    [/^(Connect hub|Hub active|Pairing…|Practice on|Practice off|Not connected)(, battery (\d+)%)?$/,function(m){return (msLookup(m[1])||m[1])+(m[3]?', bateri '+m[3]+'%':'')}],
    [/^(.+) · (\d) hubs$/,function(m){return (msLookup(m[1])||m[1])+' · '+m[2]+' hub'}]);
  /* ---------- Layout shell ("Lakaran UI v2"): Home cockpit, focused Drive, model gallery, icon settings, hub test; minimalist icons ---------- */
  var V2={v:'home'}, R2=document.documentElement;
  var V2IC={"home": "<path d=\"M3.5 10.8 12 3.6l8.5 7.2V19.5a1.3 1.3 0 0 1-1.3 1.3H15v-6.2H9v6.2H4.8a1.3 1.3 0 0 1-1.3-1.3z\"/>", "drive": "<circle cx=\"12\" cy=\"12\" r=\"8.6\"/><circle cx=\"12\" cy=\"12\" r=\"2.6\"/><path d=\"M12 14.6v6M9.6 11.1 3.6 9.6M14.4 11.1l6-1.5\"/>", "models": "<path d=\"M12 3.2 20 7.6v8.8L12 20.8l-8-4.4V7.6z\"/><path d=\"M4 7.6 12 12l8-4.4M12 12v8.8\"/>", "settings": "<path d=\"M21.02,10.21 L21.02,13.79 L18.96,13.39 L17.90,15.94 L19.65,17.11 L17.11,19.65 L15.94,17.90 L13.39,18.96 L13.79,21.02 L10.21,21.02 L10.61,18.96 L8.06,17.90 L6.89,19.65 L4.35,17.11 L6.10,15.94 L5.04,13.39 L2.98,13.79 L2.98,10.21 L5.04,10.61 L6.10,8.06 L4.35,6.89 L6.89,4.35 L8.06,6.10 L10.61,5.04 L10.21,2.98 L13.79,2.98 L13.39,5.04 L15.94,6.10 L17.11,4.35 L19.65,6.89 L17.90,8.06 L18.96,10.61Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>", "bt": "<path d=\"M7 7.2l10 9.6-5 4.2V3l5 4.2-10 9.6\"/>", "hub": "<rect x=\"6.5\" y=\"6.5\" width=\"11\" height=\"11\" rx=\"2.2\"/><rect x=\"9.5\" y=\"9.5\" width=\"5\" height=\"5\" rx=\"1\"/><path d=\"M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3\"/>", "shield": "<path d=\"M12 3.2l7.6 2.9v5.8c0 4.4-3.2 7.9-7.6 8.9-4.4-1-7.6-4.5-7.6-8.9V6.1z\"/><path d=\"M12 8.2v4.6M12 15.8v.1\"/>", "sync": "<path d=\"M19.5 11A7.5 7.5 0 0 0 6 6.6L4.5 8M4.5 4v4h4\"/><path d=\"M4.5 13A7.5 7.5 0 0 0 18 17.4l1.5-1.4M19.5 20v-4h-4\"/>", "vibe": "<rect x=\"8\" y=\"4\" width=\"8\" height=\"16\" rx=\"2\"/><path d=\"M11 17h2M4.5 9v6M19.5 9v6M2 11v2M22 11v2\"/>", "cap": "<path d=\"M2.8 9.2 12 4.5l9.2 4.7L12 13.9z\"/><path d=\"M6.8 11.4v4.3c0 1.5 2.3 3 5.2 3s5.2-1.5 5.2-3v-4.3M21.2 9.2v5\"/>", "globe": "<circle cx=\"12\" cy=\"12\" r=\"8.6\"/><path d=\"M3.4 12h17.2M12 3.4c2.4 2.4 3.4 5.3 3.4 8.6s-1 6.2-3.4 8.6c-2.4-2.4-3.4-5.3-3.4-8.6s1-6.2 3.4-8.6z\"/>", "rec": "<circle cx=\"12\" cy=\"12\" r=\"8.4\"/><circle cx=\"12\" cy=\"12\" r=\"3.6\"/>", "seq": "<path d=\"M4 6.5h10M4 12h10M4 17.5h6M15.5 14.5l5 3-5 3z\"/>", "pen": "<path d=\"M4 20h4.2L19.2 9a2.1 2.1 0 0 0-3-3L5.2 17z\"/><path d=\"M14.5 7.5l3 3\"/>", "unlink": "<path d=\"M9.5 14.5 7.4 16.6a3 3 0 0 1-4.2-4.2l3-3M14.5 9.5l2.1-2.1a3 3 0 0 1 4.2 4.2l-3 3M8 4.5v2.5M4.5 8H7M16 19.5V17M19.5 16H17\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "minus": "<path d=\"M5 12h14\"/>", "search": "<circle cx=\"10.8\" cy=\"10.8\" r=\"6.3\"/><path d=\"M15.6 15.6l4.6 4.6\"/>", "more": "<path d=\"M5.5 12h.1M12 12h.1M18.5 12h.1\" stroke-width=\"3\"/>", "chev": "<path d=\"M9.5 6l6 6-6 6\"/>", "down": "<path d=\"M6 9.5l6 6 6-6\"/>", "save": "<path d=\"M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14\"/>", "load": "<path d=\"M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14\"/>", "grid": "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\" rx=\"1.6\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\" rx=\"1.6\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\" rx=\"1.6\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\" rx=\"1.6\"/>", "tilt": "<rect x=\"7\" y=\"3.5\" width=\"10\" height=\"17\" rx=\"2\" transform=\"rotate(-18 12 12)\"/><path d=\"M3 18.5c1.5 1.3 3.2 2 5 2.2M21 5.5c-1.5-1.3-3.2-2-5-2.2\"/>", "pad": "<path d=\"M7 8h10a4 4 0 0 1 4 4.6l-.6 3.6a2.3 2.3 0 0 1-4 1l-1.8-2.2H9.4l-1.8 2.2a2.3 2.3 0 0 1-4-1L3 12.6A4 4 0 0 1 7 8z\"/><path d=\"M8 10.5v3M6.5 12h3M15.5 11.3h.1M17.5 13h.1\"/>", "list": "<path d=\"M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.1M4.5 12h.1M4.5 17.5h.1\"/>", "q": "<circle cx=\"12\" cy=\"12\" r=\"8.6\" stroke-dasharray=\"2.4 2.4\"/><path d=\"M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.6M12 16.8v.1\"/>"};
  function v2Ic(k,cls){return '<svg class="'+(cls||'ic')+'" viewBox="0 0 24 24" aria-hidden="true">'+(V2IC[k]||'')+'</svg>'}
  var V2PARENT={medit:'models',tpl:'models',hub:'settings',safety:'settings',backup:'settings','m-tilt':'settings','m-pad':'settings','m-app':'settings','m-log':'settings'};
  var V2TITLE={medit:'Model settings',tpl:'Templates',hub:'Hub',safety:'Limits & auto-stop',backup:'Backup & restore','m-tilt':'Tilt steering','m-pad':'Gamepad','m-app':'App','m-log':'Frames sent'};
  var V2UI={};try{V2UI=JSON.parse(localStorage.getItem('mk6ui')||'{}')||{}}catch(_){V2UI={}}
  function v2UiSave(){try{localStorage.setItem('mk6ui',JSON.stringify(V2UI))}catch(_){}}
  function v2Tab(v){return (v==='home'||v==='drive')?v:(v==='models'||v==='medit'||v==='tpl')?'models':'settings'}
  function v2Go(v){
    if(v.indexOf('/')>0) v=v.split('/')[0];
    V2.v=v;R2.setAttribute('data-v',v);
    var t=v2Tab(v);
    if(v!=='drive'&&bdEditing){var be=$('#bdEdit');if(be) be.click()}
    if(t!==v2LastTab) v2Motion(t);
    Array.prototype.forEach.call(document.querySelectorAll('#tabbar [data-tab]'),function(b){b.setAttribute('aria-pressed',String(b.dataset.tab===t))});
    var sub=!!V2PARENT[v];$('#subHead').hidden=!sub;if(sub) $('#subTitle').textContent=V2TITLE[v];
    $('#subDone').hidden=v!=='medit';
    try{window.scrollTo(0,0)}catch(_){}
    if(v==='models') v2Models();
    if(v==='home') v2Preview();
    if(v==='drive') v2Pick();
    if(v==='hub'){v2ChTest(true);v2Slots()}
    if(v==='m-pad') v2GpDraw();
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
    if(v2QS){v2QuickClose();return true}
    if(v2Co.el){guideClose();return true}
    if(bdEditing){var be=$('#bdEdit');if(be) be.click();return true}
    if(!player.hidden) return true;
    if(V2PARENT[V2.v]){v2Go(V2PARENT[V2.v]);return true}
    if(V2.v!=='home'){v2Go('home');return true}
    return false;
  };
  function v2Click(sel,fn){var e=$(sel);if(e) e.addEventListener('click',fn)}
  function v2Conn(){link.click()}
  var v2WasLive=!!S.connected;
  function v2Live(){
    var live=S.connected&&hubMsg!=='Pairing…';
    if(live&&!v2WasLive&&(V2.v==='home'||V2.v==='hub')) v2Go('drive');
    v2WasLive=live;
  }
  // Home start/stop: the app's own START/STOP widget graphic, driving the hub link
  var v2PS=null;
  (function(){
    var box=$('#hPS');if(!box) return;
    var el=document.createElement('div');el.className='bdw psw v2-ps';
    var pb=document.createElement('button');pb.type='button';pb.className='psb';pb.setAttribute('aria-label','Connect hub');
    var psv=sv('svg',{viewBox:'0 0 120 116',class:'pssvg'},pb);
    var pdf=sv('defs',{},psv),pgr=sv('radialGradient',{id:'psgH',cx:'.35',cy:'.3',r:'.9'},pdf);
    sv('stop',{offset:'0','stop-color':'#5a6376'},pgr);sv('stop',{offset:'.6','stop-color':'#2a303b'},pgr);sv('stop',{offset:'1','stop-color':'#14181f'},pgr);
    var pglow=sv('g',{style:'filter:blur(4px)',opacity:.55},psv);
    var pglw=ledRing(pglow,60,58,46.5,40,90,360,7), pring=ledRing(psv,60,58,46.5,40,90,360,7);
    var pcap=sv('g',{},psv);
    sv('circle',{cx:60,cy:58,r:39,fill:'#0d1015',stroke:'#6b7280','stroke-width':2},pcap);
    sv('circle',{cx:60,cy:58,r:35,fill:'url(#psgH)',stroke:'#0d1015','stroke-width':2},pcap);
    sv('ellipse',{cx:52,cy:42,rx:19,ry:8,fill:'#fff',opacity:.12},pcap);
    var pic=sv('circle',{cx:60,cy:58,r:31,fill:'none','stroke-width':2.5,stroke:PAL.r},pcap);
    var pt1=sv('text',{x:60,y:58,'text-anchor':'middle','font-size':14,'font-weight':900,fill:'#e8e8ea'},pcap);pt1.textContent='START';
    var pt2=sv('text',{x:60,y:71,'text-anchor':'middle','font-size':10,'font-weight':900,fill:PAL.r},pcap);pt2.textContent='STOP';
    var pst=sv('text',{x:60,y:62,'text-anchor':'middle','font-size':11,'font-weight':900,fill:PAL.r},psv);
    v2PS={k:'ps',it:{md:0},b:pb,ring:pring,glow:pglw,glowg:pglow,cap:pcap,ic:pic,t1:pt1,t2:pt2,st:pst,col:[],tgt:'',ai:0,t:0};
    // same behaviour as the START/STOP widget on the board: hold for 0.5 s; a short tap only shows a hint
    var hdT=0,hdDn=false,hdFired=false;
    pb.addEventListener('pointerdown',function(e){
      e.preventDefault();try{pb.setPointerCapture(e.pointerId)}catch(_){}
      hdDn=true;hdFired=false;pb.classList.add('dn');clearTimeout(hdT);
      hdT=setTimeout(function(){if(!hdDn) return;hdFired=true;feedback('ok');v2Conn()},500);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){pb.addEventListener(ev,function(e){
      var was=hdDn;hdDn=false;clearTimeout(hdT);pb.classList.remove('dn');
      if(ev==='pointerup'&&was&&!hdFired) toast('Hold the button for half a second.',2000);
    })});
    pb.addEventListener('contextmenu',function(e){e.preventDefault()});
    pb.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();v2Conn()}});
    el.appendChild(pb);box.appendChild(el);
    setInterval(function(){if(V2.v==='home'&&!document.hidden) paintVw(v2PS)},50);
  })();
  // Home preview: a still copy of the active model's board
  function v2Preview(){
    var box=$('#hPrev');if(!box) return;
    box.textContent='';
    var ok=C.layout==='board'&&C.board.length>0;box.hidden=!ok;if(!ok) return;
    var g=$('#boardGrid');if(!g) return;
    var c=g.cloneNode(true);c.removeAttribute('id');
    Array.prototype.forEach.call(c.querySelectorAll('[id]'),function(e){e.removeAttribute('id')});
    Array.prototype.forEach.call(c.querySelectorAll('button,input,select'),function(e){e.tabIndex=-1;e.disabled=true});
    c.setAttribute('aria-hidden','true');
    var w=document.createElement('div');w.className='v2-previn';w.appendChild(c);box.appendChild(w);
  }
  var V2ORD={home:0,drive:1,models:2,settings:3},v2LastTab='home';
  function v2Motion(t){
    var m=document.querySelector('main');if(!m) return;
    var dir=(V2ORD[t]||0)>=(V2ORD[v2LastTab]||0)?'r':'l';v2LastTab=t;
    m.classList.remove('v2-in-r','v2-in-l');void m.offsetWidth;m.classList.add('v2-in-'+dir);
  }
  function v2Tick(){if(store.prefs.haptic&&NB&&NB.haptic){try{NB.haptic('dial')}catch(_){}}}
  Array.prototype.forEach.call(document.querySelectorAll('#tabbar [data-tab]'),function(b){b.addEventListener('click',function(){
    if(V2.v!==b.dataset.tab) v2Tick();v2Go(b.dataset.tab)})});
  Array.prototype.forEach.call(document.querySelectorAll('[data-go]'),function(b){b.addEventListener('click',function(){v2Go(b.dataset.go)})});
  v2Click('#subBack',function(){v2Go(V2PARENT[V2.v]||'home')});
  v2Click('#subDone',function(){v2Go('drive')});
  v2Click('#dEdit',function(){v2Go('medit')});
  v2Click('#hOpen',function(){v2Go('drive')});
  v2Click('#hConn',v2Conn);v2Click('#hubConn',v2Conn);
  v2Click('#hubOff',function(){if(S.connected) v2Conn()});
  // top bar: one pill = Bluetooth | status | battery; tap it to connect (or to open Bluetooth when it is off)
  (function(){
    var bi=document.querySelector('.bar-in');if(!bi) return;
    var b=document.createElement('button');b.type='button';b.id='v2Pill';b.className='v2-pill';b.setAttribute('data-st','off');b.setAttribute('data-bt','on');
    b.innerHTML=v2Ic('bt','ic pbt')+'<i class="pdv" aria-hidden="true"></i><i class="pdot" aria-hidden="true"></i><span class="ptx"></span><em class="pbat"></em>';
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
  function v2OpenFold(card,key){
    v2Go('drive');if(!card) return;card.classList.add('open');var h=card.querySelector('.v2-foldh');if(h) h.setAttribute('aria-expanded','true');V2UI[key]=true;v2UiSave();
    setTimeout(function(){try{card.scrollIntoView({block:'start',behavior:'smooth'})}catch(_){}},60);
  }
  v2Click('#hRec',function(){v2OpenFold($('#recCard'),'fRec')});
  v2Click('#hSeq',function(){v2OpenFold($('#seqCard'),'fSeq')});

  // Model settings: layout choice, wizard and hub test go under Advanced (Board is the normal way to drive)
  (function(){
    var card=document.querySelector('section.model');if(!card) return;
    var d=document.createElement('details');d.className='adv';var sm=document.createElement('summary');sm.textContent='Advanced';d.appendChild(sm);
    var inner=document.createElement('div');inner.className='rec-row v2-advrow';d.appendChild(inner);
    var lay=card.querySelector('.seg[aria-label="Layout"]');
    var lbl=document.createElement('div');lbl.className='seglbl';lbl.textContent='Control layout';
    if(lay){d.insertBefore(lbl,inner);d.insertBefore(lay,inner)}
    ['#profWiz','#profTest'].forEach(function(q){var e=$(q);if(e) inner.appendChild(e)});
    var note=$('#testNote'),wiz=$('#wizPanel');
    var after=card.querySelector('.model-row:last-of-type')||card.lastChild;
    card.insertBefore(d,after.nextSibling);
    if(note) d.appendChild(note);if(wiz) d.appendChild(wiz);
  })();
  // Hub module numbers and names (existing rows) sit on the Hub screen under "Hub numbers & names"
  (function(){var box=$('#hubRows');['#hub0','#hubN0'].forEach(function(q){var el=$(q);var row=el&&el.closest('.set-row');if(row&&box) box.appendChild(row)})})();
  v2Click('#hubName',function(){var d=$('#hubAdv');if(d) d.open=true;var n=$('#hubN0');if(n){try{n.scrollIntoView({block:'center'});n.focus()}catch(_){}}});

  // ---- 3 · Models: gallery cards with a sketch of each board ----
  function v2Sub(p){
    var c=p.cfg||{},h=(c.hubs||[]).filter(function(x){return x>=0}).length||1,w=(c.board||[]).length;
    return h+(h===1?' hub':' hubs')+' · '+w+(w===1?' widget':' widgets');
  }
  function v2Thumb(c){
    var o='<svg class="v2-th" viewBox="0 0 48 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    var Y=(c&&c.accent&&ACC[c.accent])||'#ffd84a',K='#3a414d',F='#1d222b';
    if(c.layout==='board'&&c.board&&c.board.length){
      var x0=0,y0=0;
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
        else if(k==='f'||k==='n'||k==='rs'||k==='st'||k==='g'||k==='ro'){var r=m*.3,cc=2*Math.PI*r;o+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2e3540" stroke-width=".8"/><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#1D9E75" stroke-width=".8" stroke-dasharray="'+(cc*.45)+' '+cc+'" transform="rotate(135 '+cx+' '+cy+')"/>'}
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
    store.profiles.forEach(function(p){
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
      card.appendChild(main);card.appendChild(more);box.appendChild(card);
    });
    var add=document.createElement('button');add.type='button';add.className='v2-mcard v2-madd';
    add.innerHTML=v2Ic('plus','ic big')+'<b></b><small></small>';add.querySelector('b').textContent='New model';add.querySelector('small').textContent='Template or empty';
    add.addEventListener('click',function(){v2Go('tpl')});
    if(!q) box.appendChild(add);
    $('#mNone').hidden=n>0;
  }
  (function(){var s=$('#mSearch');if(s) s.addEventListener('input',v2Models)})();
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
  v2Click('#sLang',function(){var l=$('#lang');l.value=store.prefs.lang==='ms'?'en':'ms';v2Fire(l);v2Paint()});

  // ---- 5 · Hub: output LEDs, channel-test knobs with LED rings, add a second / third hub ----
  (function(){var b=$('#hubLeds');if(!b) return;for(var q=0;q<14;q++){var i=document.createElement('i');b.appendChild(i)}})();
  var v2ChKey='',v2Knobs=[];
  function v2KnobSvg(tag){
    var o='<svg viewBox="0 0 80 80" class="v2-ksvg" aria-hidden="true">';
    for(var q=0;q<18;q++){var a=(135+270*(q+.5)/18)*Math.PI/180,r1=31,r2=37;
      o+='<line class="v2seg" data-q="'+q+'" x1="'+(40+r1*Math.cos(a)).toFixed(1)+'" y1="'+(40+r1*Math.sin(a)).toFixed(1)+'" x2="'+(40+r2*Math.cos(a)).toFixed(1)+'" y2="'+(40+r2*Math.sin(a)).toFixed(1)+'"/>'}
    o+='<circle cx="40" cy="40" r="26" fill="#0d1015"/><circle cx="40" cy="40" r="24" fill="url(#v2kg)"/><ellipse cx="34" cy="31" rx="12" ry="5" fill="#fff" opacity=".1"/>';
    o+='<text x="40" y="46" text-anchor="middle" class="kt"></text></svg>';
    return o;
  }
  function v2KnobPaint(k,frac){
    var segs=k.segs;for(var q=0;q<segs.length;q++){var f=(q+.5)/segs.length,on=f<=frac;var sc=on?(f<=.55?PAL.g:f<=.8?PAL.o:PAL.r):'';if(segs[q]._c!==sc){segs[q]._c=sc;segs[q].style.stroke=sc}}
  }
  function v2ChTest(force){
    var box=$('#chTest');if(!box) return;
    var idx=activeIdx(),key=idx.join(',')+'|'+C.hubs.join(',')+'|'+idx.map(function(i){return C.ch[i].name}).join(',');
    if(!force&&key===v2ChKey) return;v2ChKey=key;box.innerHTML='';v2Knobs=[];
    idx.forEach(function(i){
      var b=document.createElement('button');b.type='button';b.className='v2-knob-b';b.setAttribute('aria-pressed','false');
      b.innerHTML=v2KnobSvg()+'<span class="kl"></span>';
      b.querySelector('.kt').textContent=tagOf(i);b.querySelector('.kl').textContent=C.ch[i].name;
      b.setAttribute('aria-label',tagOf(i)+' · '+C.ch[i].name);
      var k={b:b,segs:[].slice.call(b.querySelectorAll('.v2seg')),i:i,on:false};v2Knobs.push(k);v2KnobPaint(k,0);
      var down=function(e){
        if(e&&e.preventDefault) e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}
        if(!S.connected){toast(RH()?'Connect the hub first.':'Turn on Practice mode or connect the hub first.');return}
        if(S.estop){toast('Release E-Stop first.');return}
        k.on=true;b.setAttribute('aria-pressed','true');noteInput();setT(i,C.testPwr||60,false);feedback('ok');
      };
      var up=function(){if(!k.on) return;k.on=false;b.setAttribute('aria-pressed','false');setT(i,0,false)};
      b.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){b.addEventListener(ev,up)});
      b.addEventListener('contextmenu',function(e){e.preventDefault()});
      box.appendChild(b);
    });
  }
  function v2Slots(){
    var box=$('#hubSlots');if(!box) return;box.innerHTML='';
    for(var s=1;s<3;s++){
      var sel=$('#hub'+s);if(!sel) continue;
      var on=C.hubs[s]>=0;
      if(!on&&s===2&&C.hubs[1]<0) continue;
      var c=document.createElement('section');c.className='card v2-slot';
      var nm=on?('Hub '+(s+1)+' · M'+(C.hubs[s]+1)):('Hub '+(s+1));
      c.innerHTML='<div class="v2-mrow"><span class="v2-grow"><b></b><small></small></span><button class="btn v2-icbtn" type="button"></button></div>';
      c.querySelector('b').textContent=nm;c.querySelector('small').textContent=on?'Channels '+tagOf(s*6)+'–'+tagOf(s*6+5):'None — add a second hub';
      if(s===2&&!on) c.querySelector('small').textContent='None — add a third hub';
      var bt=c.querySelector('button');bt.innerHTML=v2Ic(on?'minus':'plus')+'<span></span>';bt.querySelector('span').textContent=on?'Remove':'Add';
      (function(sel,on,s){bt.addEventListener('click',function(){
        if(on){sel.value='-1'}else{var used=C.hubs.filter(function(x){return x>=0});var free=[0,1,2].filter(function(m){return used.indexOf(m)<0})[0];if(free==null) return;sel.value=String(free)}
        v2Fire(sel);setTimeout(function(){v2Slots();v2ChTest(true)},50);
      })})(sel,on,s);
      box.appendChild(c);
    }
  }

  // Alerts on Home: one main action each, using the app's own card and button
  function v2Alert(box,title,sub,act,fn,act2,fn2){
    var d=document.createElement('section');d.className='card';
    var h=document.createElement('h2');h.textContent=title;var p=document.createElement('p');p.className='note';p.style.marginTop='0';p.textContent=sub;
    d.appendChild(h);d.appendChild(p);
    if(act){var r=document.createElement('div');r.className='rec-row';var k=document.createElement('button');k.type='button';k.className='btn';k.textContent=act;k.addEventListener('click',fn);r.appendChild(k);
      if(act2){var k2=document.createElement('button');k2.type='button';k2.className='btn';k2.textContent=act2;k2.addEventListener('click',fn2);r.appendChild(k2)}d.appendChild(r)}
    box.appendChild(d);
  }
  var v2AlKey='';
  function v2Alerts(){
    var box=$('#hAlerts');if(!box) return;
    var lost=!$('#lostBanner').hidden, bat=$('#bat'), low=!!(bat&&!bat.hidden&&bat.classList.contains('low'));
    var pct=low?(bat.textContent.match(/\d+/)||[''])[0]:'';
    var bad=!S.connected&&RH()&&hubMsg&&hubMsg!=='Pairing…'?hubMsg:'';
    var key=[S.estop,lost,S.bt,low,pct,bad,store.prefs.lang,!!store.prefs.lock,v2Inbox?v2Inbox.name:'',store.prefs.playLim&&v2PlayLeft()<=0,PLAY.extra].join('|');if(key===v2AlKey) return;v2AlKey=key;
    box.innerHTML='';
    if(store.prefs.playLim&&v2PlayLeft()<=0){v2Alert(box,'Play time is up','Come back tomorrow, or a parent can add 5 minutes',PLAY.extra?null:'+5 min (hold 2 s)',function(){});
      var pb5=box.lastChild&&box.lastChild.querySelector('button');if(pb5){var nb5=pb5.cloneNode(true);pb5.parentNode.replaceChild(nb5,pb5);v2PlayHold(nb5,v2PlayExtra)}}
    if(v2Inbox){var ib=v2Inbox;v2Alert(box,'Model received: '+ib.name,ib.n>1?ib.n+' models in this file':'Shared from another phone','Add to my models',function(){
        var before=store.profiles.length;importText(ib.text);v2Inbox=null;v2AlKey='';
        var added=store.profiles.length-before;
        if(added>0){switchProfile(store.profiles[store.profiles.length-1].id);toast(added===1?'Model added.':added+' models added.');v2Go('drive')}
        else{toast(store.profiles.length>=MAX_MODELS?'Model list is full.':'Nothing could be imported.',3500);v2Alerts()}
      },'Ignore',function(){v2Inbox=null;v2AlKey='';v2Alerts()})}
    if(S.estop) v2Alert(box,'E-Stop is on','Every channel is locked at 0','Release',function(){setEstop(false)});
    if(lost) v2Alert(box,'Connection lost','Outputs were stopped automatically','Reconnect',function(){$('#lostBanner').hidden=true;if(!S.connected) v2Conn();v2Paint()});
    if(S.bt===false) v2Alert(box,'Bluetooth is off','Turn it on to reach the hub','Open',function(){$('#btBtn').click()});
    else if(bad&&!lost) v2Alert(box,bad,'Check Bluetooth and the permission, then try again','Try again',v2Conn);
    if(low) v2Alert(box,'Phone battery low · '+pct+'%','Charge it before driving','OK',function(){bat.classList.remove('low');v2AlKey='';v2Alerts()});
    if(store.prefs.lock) v2Alert(box,'Settings are locked','Only driving is available','Unlock',function(){v2Go('m-app');try{$('#lockBtn').scrollIntoView({block:'center'})}catch(_){}});
  }

  // write a text only when the English source changes, so translated text is not rewritten every frame
  function v2T(el,t){if(el&&el._v2t!==t){el._v2t=t;el.textContent=t}}
  function v2Paint(){
    var busy=S.connected&&hubMsg==='Pairing…', real=RH();
    var txt=real?(busy?'Pairing…':S.connected?'Hub active':(hubMsg||'Not connected')):NB?(S.connected?'Practice on':'Practice off'):(S.connected?'Simulation on':'Simulation off');
    var st=!S.connected?'off':busy?'busy':'on';
    var nm=(C.hubNames&&C.hubNames[C.hubs[0]])||'', n=activeSlots().length;
    var hs=$('#hState');v2T(hs,txt);hs.setAttribute('data-st',st);
    v2T($('#hHint'),S.connected?'Hold for half a second to stop':'Hold for half a second to start');
    v2T($('#hLastName'),profLbl(activeProfile()));v2T($('#hLastSub'),v2Sub(activeProfile()));
    v2T($('#hRecN'),String(C.rec.length));v2T($('#hSeqN'),String(C.seq.length));
    v2T($('#dName'),profLbl(activeProfile()));
    var dr=$('#dRec');if(dr){dr.setAttribute('aria-pressed',String(!!S.rec));dr.setAttribute('aria-label',S.rec?'Stop recording':'Record')}
    if(v2FR) v2T(v2FR.querySelector('small'),C.rec.length+(C.rec.length===1?' recording':' recordings'));
    if(v2FS) v2T(v2FS.querySelector('small'),C.seq.length+(C.seq.length===1?' sequence':' sequences'));
    var pl=$('#v2Pill');
    if(pl){
      var ptx=real?(hubMsg||(S.connected?'Hub active':'Connect hub')):NB?(S.connected?'Practice on':'Practice off'):(S.connected?'Simulation on':'Simulation off');
      if(st==='on'&&pl._st&&pl._st!=='on'){pl.classList.remove('v2-pulse');void pl.offsetWidth;pl.classList.add('v2-pulse')}
      pl._st=st;
      pl.setAttribute('data-st',st);pl.setAttribute('data-bt',S.bt===false?'off':'on');
      v2T(pl.querySelector('.ptx'),ptx);
      var hb=$('#hbat'),bm=hb&&!hb.hidden?(hb.textContent.match(/(\d+)%/)||[]):[];
      var pb=pl.querySelector('.pbat');v2T(pb,bm[1]?bm[1]+'%':'');pb.classList.toggle('low',!!(hb&&hb.classList.contains('low')));
      pl.setAttribute('aria-label',(S.bt===false?'Bluetooth is off. ':'')+ptx+(bm[1]?', battery '+bm[1]+'%':''));
    }
    // settings values
    v2T($('#sHubSt'),busy?'…':S.connected?'Active':'Off');
    var lo=$('#limitOut');v2T($('#sLimV'),lo?lo.textContent:'');
    v2T($('#sLangV'),store.prefs.lang==='ms'?'BM':'EN');
    $('#sFb').setAttribute('aria-checked',String(!!(store.prefs.sound||store.prefs.haptic)));
    $('#sPrac').setAttribute('aria-checked',String(!!store.prefs.practice));
    // hub screen
    $('#hubEmpty').hidden=!!S.connected;$('#hubCard').hidden=!S.connected;
    v2T($('#hubTitle'),'Mould King 6.0 · M'+(C.hubs[0]+1)+(nm?' · '+nm:''));
    v2T($('#hubMod'),'M'+(C.hubs[0]+1));
    v2T($('#hubSub'),txt+(n>1?' · '+n+' hubs':''));
    var mx=0;activeIdx().forEach(function(i){mx=Math.max(mx,Math.abs(rt.o[i]||0))});mx=Math.round(mx);
    v2T($('#hubPct'),mx+'%');
    var leds=$('#hubLeds');if(leds&&V2.v==='hub'){var L=leds.children;for(var q=0;q<L.length;q++){var f=(q+.5)/L.length,lc=f*100<=mx?(f<=.55?'g':f<=.8?'o':'r'):'';if(L[q].className!==lc) L[q].className=lc}}
    if(V2.v==='hub'){v2ChTest(false);v2Knobs.forEach(function(k){v2KnobPaint(k,Math.min(1,Math.abs(rt.o[k.i]||0)/100))})}
    if(store.prefs.lock&&['safety','m-tilt','m-pad','tpl','medit','models'].indexOf(V2.v)>=0) v2Go(V2PARENT[V2.v]||'home');
    v2Alerts();
    v2Gfx(st);
    v2Diag(false);lkSample(false);
    // drive mode, play time, meter, left-handed
    v2Mode();v2CrzPaint();v2Focus();v2SimKick();
    if(V2.v==='medit'){v2SsPaint();}
    v2MiPaint();
    var pl0=store.prefs.playLim||0;v2T($('#sPlayV'),pl0?pl0+' min':'Off');
    var dp=$('#dPlay');if(dp){var lf=v2PlayLeft();if(dp.hidden===!!pl0) dp.hidden=!pl0;if(pl0){v2T(dp.querySelector('b'),v2Clock(lf));v2Tog(dp,'low',lf<=120000)}}
    $('#sLefty').setAttribute('aria-checked',String(!!store.prefs.lefty));$('#sMeter').setAttribute('aria-checked',String(!!store.prefs.meter));
    var mt=$('#dMeter');if(mt&&mt.hidden===!!store.prefs.meter) mt.hidden=!store.prefs.meter;
  }

  // ---- Hub link diagnostics (numbers from the native Bluetooth side) ----
  var V2ERR={1:'data too large',2:'too many advertisers',3:'already started',4:'internal Bluetooth error',5:'not supported by this phone'};
  var v2DiagT=0,v2DiagRows=[];
  function v2Dur(ms){if(!(ms>=0)) return '—';var s=Math.round(ms/1000);if(s<60) return s+' s';var m=Math.floor(s/60);if(m<60) return m+' min '+(s%60)+' s';return Math.floor(m/60)+' h '+(m%60)+' min'}
  function v2DiagData(){
    var d={};try{d=NB&&NB.stats?JSON.parse(NB.stats()||'{}'):{}}catch(_){d={}}
    var M={off:'Off',connecting:'Connecting',single:'1 hub',parallel:'Several hubs at once',rotate:'Several hubs, taking turns'};
    var rows=[];
    rows.push(['Link',S.connected?(RH()?'Hub active':'Practice'):'Not connected',S.connected?'ok':'bad']);
    rows.push(['Bluetooth',S.bt===false?'Off':'On',S.bt===false?'bad':'ok']);
    if(NB&&NB.stats){
      rows.push(['Send mode',M[d.mode]||'—','']);
      rows.push(['Connected for',d.mode&&d.mode!=='off'?v2Dur(d.up):'—','']);
      rows.push(['Frames from the app',String(d.frames||0),'']);
      rows.push(['Sent by Bluetooth',String(d.ok||0),'']);
      var f=d.fail||0;rows.push(['Bluetooth errors',String(f),f?'bad':'ok']);
      if(f&&d.err) rows.push(['Last error',(V2ERR[d.err]||('code '+d.err)),'bad']);
      if(f&&d.errAgo>=0) rows.push(['Error time',v2Dur(d.errAgo)+' ago','']);
      rows.push(['Safety stops (app paused)',String(d.watchdog||0),d.watchdog?'warn':'']);
      rows.push(['Last frame',d.lastFrameAgo>=0?v2Dur(d.lastFrameAgo)+' ago':'—','']);
      if(d.tx!=null) rows.push(['Transmit power',d.tx+' dBm','']);
    }else rows.push(['Native data','Only in the Android app','']);
    rows.push(['Update rate',(1000/(window.mk6Rate?mk6Rate():50)).toFixed(0)+' per second','']);
    rows.push(['Hubs on this model',String(activeSlots().length),'']);
    return rows;
  }
  // ---- Live link centre: send rate for the last 60 s, one ring per hub, early warning ----
  var LK={h:[],hb:[],last:null,t:0,lvl:'',msg:''};
  function lkSample(force){
    var now=Date.now();if(!force&&now-LK.t<1000) return;
    var dt=LK.t?Math.max(.25,(now-LK.t)/1000):1;LK.t=now;
    var d=null;try{d=NB&&NB.stats?JSON.parse(NB.stats()||'{}'):null}catch(_){d=null}
    var on=!!(d&&S.connected&&d.mode&&d.mode!=='off'), p=LK.last, r=0, rb=0, fd=0;
    if(on&&p&&p.mode===d.mode){r=Math.max(0,((d.frames||0)-(p.frames||0))/dt);rb=Math.max(0,((d.ok||0)-(p.ok||0))/dt);fd=Math.max(0,(d.fail||0)-(p.fail||0))}
    LK.last=on?d:null;
    LK.h.push(r);LK.hb.push(rb);if(LK.h.length>60){LK.h.shift();LK.hb.shift()}
    var lvl='',msg='';
    if(on){
      var dead=(d.alive||[]).map(function(a,i){return a?-1:i}).filter(function(i){return i>=0});
      lvl='ok';msg='Link is steady.';
      if(d.mode==='connecting'){lvl='warn';msg='Connecting to the hubs…'}
      else if(fd){lvl='bad';msg='Bluetooth errors just now ('+fd+'). Hold the phone closer to the model.'}
      else if(dead.length){lvl='bad';msg='Hub M'+dead.map(function(i){return ((d.mods||[])[i]||0)+1}).join(', M')+' is not being sent to.'}
      else if(d.lastFrameAgo>1400){lvl='warn';msg='Send rate dropped: no new frame for '+v2Dur(d.lastFrameAgo)+'. Keep the app open and the screen on.'}
      else if(d.mode==='rotate'){lvl='warn';msg='Hubs take turns, so each hub gets news about every '+(d.lat||0)+' ms.'}
    }
    LK.lvl=lvl;LK.msg=msg;LK.d=d;LK.r=r;
    var chip=$('#lkChip');if(chip){chip.hidden=!lvl;if(lvl){v2T(chip,lvl==='ok'?'Steady':lvl==='warn'?'Check':'Problem');if(chip.className!=='lk-chip '+lvl) chip.className='lk-chip '+lvl}}
    lkPaint();
  }
  function lkPaint(){
    var dg=$('#hubDiag');if(!dg||!dg.open) return;
    var d=LK.d||{}, has=!!(NB&&NB.stats), M={off:'Off',connecting:'Connecting',single:'1 hub',parallel:'At once',rotate:'Taking turns'};
    v2T($('#lkRate'),has?String(Math.round(LK.r||0)):'—');
    v2T($('#lkMode'),has?(M[d.mode]||'Off'):'Android app only');
    var mx=Math.max(10,Math.max.apply(null,LK.h.concat(LK.hb))*1.15);
    function path(a){var n=a.length;if(!n) return '';var o='';for(var i=0;i<n;i++){var x=(120*(60-n+i)/59).toFixed(1),y=(31-a[i]/mx*29).toFixed(1);o+=(i?'L':'M')+x+' '+y}return o}
    var sp=$('#lkSpark');if(sp){sp.querySelector('.lk-a').setAttribute('d',path(LK.h));sp.querySelector('.lk-b').setAttribute('d',path(LK.hb))}
    var hb=$('#lkHubs');if(hb){
      var mods=LK.lvl?(d.mods||[]):[], key=mods.join()+'|'+(d.alive||[]).join()+'|'+d.lat+'|'+LK.lvl;
      if(hb._k!==key){hb._k=key;hb.innerHTML='';
        mods.forEach(function(m,i){var al=d.alive?d.alive[i]:1, cl=!al?'bad':d.mode==='rotate'||d.mode==='connecting'?'warn':'ok';
          var w=document.createElement('div');w.className='lk-hub';
          w.innerHTML='<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="14"/><circle class="'+cl+'" cx="18" cy="18" r="14" stroke-dasharray="'+(al?'88 0':'10 6')+'" transform="rotate(-90 18 18)"/></svg><span><b></b><small></small></span>';
          w.querySelector('b').textContent='M'+(m+1);w.querySelector('small').textContent=al?('~'+(d.lat||0)+' ms'):'off air';
          w.setAttribute('aria-label','Hub M'+(m+1)+(al?', on air, about '+(d.lat||0)+' ms':', not on air'));hb.appendChild(w)});
      }
    }
    var ms=$('#lkMsg');if(ms){v2T(ms,LK.msg||(has?'Not connected.':'Live data is shown in the Android app.'));var c='lk-msg '+(LK.lvl||'');if(ms.className!==c) ms.className=c}
  }
  function v2Diag(force){
    var dg=$('#hubDiag');if(!dg||!dg.open||V2.v!=='hub') return;
    var now=Date.now();if(!force&&now-v2DiagT<1000) return;v2DiagT=now;
    var rows=v2DiagData(),dl=$('#diagList');
    if(v2DiagRows.length!==rows.length){dl.innerHTML='';v2DiagRows=rows.map(function(){var t=document.createElement('dt'),v=document.createElement('dd');dl.appendChild(t);dl.appendChild(v);return [t,v]})}
    rows.forEach(function(r,i){v2T(v2DiagRows[i][0],r[0]);v2T(v2DiagRows[i][1],r[1]);if(v2DiagRows[i][1].className!==r[2]) v2DiagRows[i][1].className=r[2]});
  }
  (function(){var dg=$('#hubDiag');if(dg) dg.addEventListener('toggle',function(){v2DiagRows=[];v2Diag(true);var hb=$('#lkHubs');if(hb) hb._k='';lkPaint()})})();
  v2Click('#diagCopy',function(){
    var t='MK6 Console diagnostics\n'+v2DiagData().map(function(r){return r[0]+': '+r[1]}).join('\n')+'\nApp: '+navigator.userAgent.replace(/.*(Android [0-9.]+).*?(Chrome\/[0-9]+).*/,'$1 · $2');
    var ok=false;try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove()}catch(_){}
    if(!ok&&navigator.clipboard){navigator.clipboard.writeText(t).then(function(){toast('Report copied.')},function(){toast('Could not copy.')});return}
    toast(ok?'Report copied.':'Could not copy.');
  });
  // ---- Graphics upgrades: no-hub widgets, empty states, light theme ----
  function v2Tog(el,c,on){if(el&&el.classList.contains(c)!==on) el.classList.toggle(c,on)}
  function v2Ill(k){
    var I={board:'<rect x="6" y="5" width="138" height="74" rx="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>'+
        '<rect x="18" y="15" width="34" height="24" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3"/><rect x="58" y="15" width="34" height="24" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3"/><rect x="98" y="15" width="34" height="24" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3"/>'+
        '<g class="y" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"><circle cx="75" cy="60" r="12"/><path d="M75 54v12M69 60h12"/></g>',
      rec:'<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="22" cy="22" r="17"/></g><circle class="y" cx="22" cy="22" r="6.5" fill="currentColor"/>',
      seq:'<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="4" width="36" height="36" rx="9"/><path d="M11 15h13M11 22h13M11 29h8"/></g><path class="y" d="M28 25l7 4.5-7 4.5z" fill="currentColor"/>'};
    var vb=k==='board'?'0 0 150 84':'0 0 44 44';
    return '<svg class="ill" viewBox="'+vb+'" aria-hidden="true">'+I[k]+'</svg>';
  }
  function v2EmptyBox(id,k,title,sub,small){
    var d=document.createElement('div');d.className='v2-empty'+(small?' sm':'');d.id=id;d.hidden=true;
    d.innerHTML=v2Ill(k)+'<div><b></b><p></p></div>';d.querySelector('b').textContent=title;d.querySelector('p').textContent=sub;
    return d;
  }
  var v2E={};
  (function(){
    var bc=$('#boardCard'),bn=$('#bdNote');
    if(bc&&bn){
      var e=v2EmptyBox('v2BdEmpty','board','The board is empty','Pick a template or add your own widgets.');
      var r=document.createElement('div');r.className='rec-row';
      var a=document.createElement('button');a.type='button';a.className='btn pri';a.textContent='Templates';a.addEventListener('click',function(){v2Go('tpl')});
      var w=document.createElement('button');w.type='button';w.className='btn';w.textContent='Add widget';w.addEventListener('click',function(){var be=$('#bdEdit');if(be&&!bdEditing) be.click()});
      r.appendChild(a);r.appendChild(w);e.appendChild(r);bn.parentNode.insertBefore(e,bn.nextSibling);v2E.bd=e;
    }
    var rc=$('#recCard'),rs=$('#recStat');
    if(rc&&rs){var e2=v2EmptyBox('v2RecEmpty','rec','No recordings yet','Press Record, drive, then press Record again to stop. Play replays it.',true);rc.insertBefore(e2,rc.querySelector('.rec-row'));v2E.rec=e2}
    var sc=$('#seqCard');
    if(sc){
      var e3=v2EmptyBox('v2SeqEmpty','seq','No sequences yet','A sequence runs steps one after another from one button.',true);
      var r3=document.createElement('div');r3.className='rec-row';r3.style.marginTop='10px';
      var nb=document.createElement('button');nb.type='button';nb.className='btn pri';nb.textContent='New sequence';nb.addEventListener('click',function(){var x=$('#seqNew');if(x) x.click()});
      r3.appendChild(nb);var e3w=document.createElement('div');e3w.className='v2-empty';e3w.id='v2SeqEmptyW';e3w.hidden=true;e3w.style.padding='4px 0 6px';
      e3.hidden=false;e3w.appendChild(e3);e3w.appendChild(r3);var h=sc.querySelector('.v2-foldh');sc.insertBefore(e3w,h?h.nextSibling:sc.firstChild);v2E.seq=e3w;
    }
  })();
  function v2Theme(){
    var lt=store.prefs.ui==='light';if((R2.getAttribute('data-ui')==='light')!==lt) R2.setAttribute('data-ui',lt?'light':'dark');
    var sl=$('#sLight');if(sl) sl.setAttribute('aria-checked',String(lt));
    // Android status / navigation bars follow the theme
    if(R2._bar!==lt){R2._bar=lt;try{if(NB&&NB.theme) NB.theme(lt)}catch(_){}}
    var hc=!!store.prefs.hc;if(R2.hasAttribute('data-hc')!==hc){if(hc) R2.setAttribute('data-hc','');else R2.removeAttribute('data-hc')}
    var sh=$('#sHC');if(sh) sh.setAttribute('aria-checked',String(hc));
    var cb=!!store.prefs.cb;if(R2.hasAttribute('data-cb')!==cb){if(cb) R2.setAttribute('data-cb','');else R2.removeAttribute('data-cb')}
    var sc0=$('#sCB');if(sc0) sc0.setAttribute('aria-checked',String(cb));
    var dm=!!store.prefs.dir;var sd0=$('#sDir');if(sd0) sd0.setAttribute('aria-checked',String(dm));
    if(PAL.g!==(cb?PALCB.g:PAL0.g)||DIRMK!==dm){palSet(cb);DIRMK=dm;if(typeof syncBoard==='function'&&R2._pal!==undefined) syncBoard()}R2._pal=1;
    var fs=store.prefs.fs||100;if(R2._fs!==fs){R2._fs=fs;try{if(NB&&NB.textZoom) NB.textZoom(fs)}catch(_){}}
    v2T($('#sTextV'),fs>=130?'Largest':fs>=115?'Large':'Normal');
  }
  v2Click('#sHC',function(){store.prefs.hc=!store.prefs.hc;save();v2Theme();feedback('ok')});
  v2Click('#sCB',function(){store.prefs.cb=!store.prefs.cb;save();v2Theme();feedback('ok');toast(store.prefs.cb?'Colour-blind colours on: blue, orange and vermillion.':'Normal colours.')});
  v2Click('#sDir',function(){store.prefs.dir=!store.prefs.dir;save();v2Theme();feedback('ok')});
  v2Click('#sText',function(){var f=store.prefs.fs||100;store.prefs.fs=f>=130?100:f>=115?130:115;save();v2Theme();feedback('ok');
    if(!(NB&&NB.textZoom)) toast('Text size works in the Android app.')});

  // ---- What's new, version and update check ----
  var CHANGES=[
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
    if(!o||!(o.build>0)) o={name:'1.2',build:CHANGES[0].b,date:'',web:!NB||!NB.appInfo};return o}
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
    if(upd&&upd.notes){var nt=mk('p',upd.notes.slice(0,600),'note');nt.style.whiteSpace='pre-line';bx.appendChild(nt)}
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
  v2Click('#sLight',function(){store.prefs.ui=store.prefs.ui==='light'?'dark':'light';save();v2Theme();feedback('ok')});
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
  (function(){var r=$('#sPlay');if(r) v2PlayHold(r,function(){
    var L=[0,10,20,30,45,60],i=L.indexOf(store.prefs.playLim||0);store.prefs.playLim=L[(i+1)%L.length];
    PLAY.used=0;PLAY.extra=false;PLAY.warned=false;PLAY.end=0;PLAY.f=1;v2PlaySave();save();v2Paint();
    toast(store.prefs.playLim?('Play time limit: '+store.prefs.playLim+' min a day.'):'Play time limit off.')})})();
  function v2PlayExtra(){if(PLAY.extra) return;PLAY.extra=true;PLAY.warned=false;PLAY.end=0;PLAY.f=1;v2PlaySave();v2AlKey='';toast('5 more minutes.')}

  // ---- 6 · Left-handed: the landscape dashboard is mirrored (widgets swap sides) ----
  v2Click('#sLefty',function(){store.prefs.lefty=!store.prefs.lefty;save();try{syncBoard()}catch(_){}v2Paint();feedback('ok')});

  // ---- 7 · Live output meter on the Drive screen (thin; tap for the big view) ----
  var v2MCols=[],v2MKey='';
  function v2MeterBuild(){
    var m=$('#dMeter');if(!m) return;var idx=activeIdx(),key=idx.join(',');if(key===v2MKey) return;v2MKey=key;
    m.innerHTML='';v2MCols=idx.map(function(i){
      var c=document.createElement('span');c.className='mc';
      c.innerHTML='<i class="mt"><i class="mu"></i><i class="md"></i></i><em></em><small></small>';
      c.querySelector('em').textContent=tagOf(i);m.appendChild(c);
      return {i:i,u:c.querySelector('.mu'),d:c.querySelector('.md'),v:c.querySelector('small'),k:''};
    });
  }
  (function(){var m=$('#dMeter');if(m) m.addEventListener('click',function(){V2UI.meterBig=!V2UI.meterBig;v2UiSave();m.classList.toggle('big',!!V2UI.meterBig);feedback('ok')});if(m&&V2UI.meterBig) m.classList.add('big')})();
  function v2MeterPaint(){
    if(V2.v!=='drive'||document.hidden||!store.prefs.meter) return;
    v2MeterBuild();
    v2MCols.forEach(function(c){
      var o=Math.round(rt.o[c.i]||0),a=Math.min(100,Math.abs(o)),q=Math.round(a/5)*5,lv=S.estop?'x':a<=55?'g':a<=80?'o':'r',k=(o<0?'-':'+')+q+lv;
      if(k===c.k) return;c.k=k;
      c.u.style.height=(o>0?q/2:0)+'%';c.d.style.height=(o<0?q/2:0)+'%';c.u.className='mu '+lv;c.d.className='md '+lv;
      c.v.textContent=o?((o>0?'+':'')+o):'0';
    });
  }
  setInterval(v2MeterPaint,100);
  v2Click('#sMeter',function(){store.prefs.meter=!store.prefs.meter;save();v2Paint();feedback('ok')});

  // ---- 10 · Widget gallery: picture cards with categories instead of a list of names ----
  (function(){
    var box=document.querySelector('#bdEditor .bd-types');if(!box) return;
    var K={bdTS:'s',bdTJ:'j',bdTD:'d',bdTM:'m',bdTL:'l',bdTT:'t',bdTB:'b',bdTW:'w',bdTA:'a',bdTY:'y',bdTF:'f',bdTFN:'fn',bdTI:'i',bdTXmx:'xmx',bdTXeq:'xeq',bdTXts:'xts',bdTXgi:'xgi',bdTXlp:'xlp',bdTXtk:'xtk',bdTK:'k',bdTN:'n',bdTRS:'rs',bdTG:'g',bdTST:'st',bdTLV:'lv',bdTDP:'dp',bdTZ:'z',bdTE:'e',bdTPS:'ps',bdTXY:'xy',bdTXF:'xf',bdTRO:'ro'};
    var CAT={drive:['s','j','d','m','st','dp','n','g','lv','rs','y','xy','xf'],light:['l','t','b','w'],meter:['f','fn','i','k','z','ro'],led:['xmx','xeq','xts','xgi','xlp','xtk'],safe:['e','ps','a']};
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
      case 'ro': o='<circle cx="24" cy="12" r="10.5" fill="'+D+'" stroke="'+S+'" stroke-width=".6"/>';[0,120,240].forEach(function(a){o+='<path d="M24 12 L22.6 3.5 Q24 2.4 25.4 3.5Z" fill="#c9ced6" transform="rotate('+a+' 24 12)"/>'});o+='<circle cx="24" cy="12" r="2" fill="'+Y+'"/>';break;
      case 'z': o='<text x="24" y="15.5" font-size="8.5" font-weight="900" text-anchor="middle" fill="#e8e8ea">12:30</text>';break;
      case 'e': o='<circle cx="24" cy="12" r="9" fill="'+R+'"/><text x="24" y="13.6" font-size="4.4" font-weight="900" text-anchor="middle" fill="#fff">STOP</text>';break;
      case 'ps': o=ring(24,12,10,1,Y)+'<circle cx="24" cy="12" r="6.5" fill="#2a303b" stroke="'+Y+'" stroke-width=".6"/><text x="24" y="13.4" font-size="3.6" font-weight="900" text-anchor="middle" fill="#fff">START</text>';break;
    }
    return '<svg viewBox="0 0 48 24" aria-hidden="true">'+o+'</svg>';
  }
  // ---- 4 · Gamepad picture: tap a button on the picture or press it on the gamepad ----
  var V2GPOS={0:[150,62],1:[163,49],2:[137,49],3:[150,36],4:[52,14],5:[148,14],10:[78,74],11:[122,74],12:[50,40],13:[50,58],14:[41,49],15:[59,49]};
  function v2GpDraw(){
    var host=$('#gpPic');if(!host) return;
    var o='<svg viewBox="0 0 200 104" class="gp-svg" aria-hidden="true"><path d="M44 22 Q56 12 80 14 L120 14 Q144 12 156 22 L176 72 Q182 98 160 100 Q146 100 136 84 L64 84 Q54 100 40 100 Q18 98 24 72 Z" class="gp-body"/>';
    o+='<rect x="38" y="8" width="28" height="9" rx="4" class="gp-sh"/><rect x="134" y="8" width="28" height="9" rx="4" class="gp-sh"/>';
    PAD_BTNS.forEach(function(b){var p=V2GPOS[b];if(!p) return;var on=!!C.pad.map[b],r=(b===10||b===11)?9:(b>=12?6:6.5);
      o+='<g class="gp-b'+(on?' on':'')+'" data-b="'+b+'"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'"/><text x="'+p[0]+'" y="'+(p[1]+2.6)+'" text-anchor="middle">'+({12:'▲',13:'▼',14:'◀',15:'▶'}[b]||BTN_NAMES[b])+'</text></g>'});
    host.innerHTML=o+'</svg>';
    Array.prototype.forEach.call(host.querySelectorAll('.gp-b'),function(g){g.addEventListener('click',function(){v2GpFocus(+g.getAttribute('data-b'),false)})});
  }
  function v2GpFocus(b,press){
    var host=$('#gpPic'),d=document.querySelector('#padCard details.adv');if(d) d.open=true;
    if(host) Array.prototype.forEach.call(host.querySelectorAll('.gp-b'),function(g){g.classList.toggle('sel',+g.getAttribute('data-b')===b)});
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
    tile('shield',store.prefs.lock?'Unlock':'Lock settings',!!store.prefs.lock,function(){if(store.prefs.lock){store.prefs.lock=false;save();applyLock()}else lockBtn.click()},!!store.prefs.lock);
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
    {v:'home',q:'#hPS',t:'Start',b:'Turn the hub on, then hold START for half a second. The ring turns yellow when the hub answers.'},
    {v:'drive',q:'#boardGrid > .bdw:not(.v2-es):not([data-k=ps])',t:'Drive',b:'Move the controls to drive. Lift your finger and they go back to 0.'},
    {v:'drive',q:'#estop',t:'E-Stop',b:'E-Stop stops every motor at once. Tap it again to release.'},
    {v:'drive',q:'#tabbar [data-tab=models]',t:'Your models',b:'Make your own board, start from a template, or share a model with a friend.'}
  ];
  var v2Co={i:0,el:null};
  function guideOpen(){v2Co.i=0;v2CoShow()}
  function guideClose(){
    if(v2Co.el){v2Co.el.remove();v2Co.el=null}
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
    var tg=st.q?document.querySelector(st.q):null;
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
  var V2MI={car:'M3.5 15.5l2-5.5h13l2 5.5v3h-17z M7 18.5v1.5M17 18.5v1.5 M7.5 10l1.6-3.2h5.8L16.5 10 M6.5 14h2M15.5 14h2',
    dig:'M2.5 17.5h11v2h-11z M4.5 17.5v-4h6.5v4 M11 14l4.5-6.5 3.5 3 M19 10.5v4.5l-2.2 1.2',
    crane:'M6 20.5V4h2.2v16.5 M4 20.5h6 M7 5h13 M18 5v6.5 M16.6 11.5h2.8v2h-2.8z M8.2 5l-3 3',
    truck:'M2.5 7.5h11v9.5h-11z M13.5 10.5h4.2l3.3 3.3v3.2h-7.5z M6 17.5a1.6 1.6 0 1 0 0 .1 M17 17.5a1.6 1.6 0 1 0 0 .1',
    tractor:'M4 15.5V9.5h7l1.5 3h6v3 M5.5 9.5V6h4v3.5 M7.5 18a3 3 0 1 0 0 .1 M18 18a2 2 0 1 0 0 .1',
    boat:'M3 15h18l-2.5 4.5h-13z M12 4.5V15 M12 5l5.5 8H12'};
  var V2MIN={car:'Car',dig:'Excavator',crane:'Crane',truck:'Truck',tractor:'Tractor',boat:'Boat'};
  function v2MiSvg(k,cls){return '<svg class="'+(cls||'ic')+'" viewBox="0 0 24 24" aria-hidden="true"><path d="'+V2MI[k]+'"/></svg>'}
  function v2Avatar(cfg,big){
    if(cfg&&cfg.photo) return '<span class="v2-av'+(big?' big':'')+'"><img alt="" src="'+cfg.photo+'"></span>';
    if(cfg&&cfg.icon&&V2MI[cfg.icon]) return '<span class="v2-av ic'+(big?' big':'')+'">'+v2MiSvg(cfg.icon)+'</span>';
    return '';
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
    var sig=(C.photo?C.photo.length:0)+'|'+(C.icon||'')+'|'+store.active;
    Array.prototype.forEach.call(document.querySelectorAll('.v2-mchip .v2-knob, #scrHome .v2-knob'),function(kn){
      if(kn._sig===sig) return;kn._sig=sig;var av=v2Avatar(C,!kn.classList.contains('sm'));kn.innerHTML=av?av:'';kn.classList.toggle('has-av',!!av)});
  }
  var v2PhotoWant=false;
  function v2PhotoSet(url){
    if(!url){toast('No image was chosen.');return}
    var img=new Image();img.onload=function(){
      var S0=240,c=document.createElement('canvas'),k=Math.max(S0/img.width,S0/img.height),w=img.width*k,h=img.height*k;
      c.width=c.height=S0;c.getContext('2d').drawImage(img,(S0-w)/2,(S0-h)/2,w,h);
      C.photo=c.toDataURL('image/jpeg',.72);save();v2MiPaint();v2Models();toast('Photo set for this model.');
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
    function upKey(){return 'l'}
    function upCan(){return document.documentElement.classList.contains('dash')}
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
  new MutationObserver(scanSoon).observe(document.body,{childList:true,subtree:true});
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
  function all(){var l=document.querySelectorAll('.bdw input[type=range], .pwr');for(var i=0;i<l.length;i++)g(l[i])}
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
  function tick(){
    if(document.hidden) return;
    var l=document.querySelectorAll('.pad');
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
  var KEY='mk6lite',lvl=0,raf=0,last=0,dts=[],t0=0,bad=0,root=document.documentElement,fxm='auto',autoLvl=0;
  try{lvl=Math.max(0,Math.min(3,parseInt(localStorage.getItem(KEY)||'0',10)||0))}catch(_){}
  autoLvl=lvl;
  function apply(){for(var i=1;i<=3;i++) root.classList.toggle('lite'+i,i<=lvl)}
  function save(){try{localStorage.setItem(KEY,String(lvl))}catch(_){}}
  function loop(t){
    raf=requestAnimationFrame(loop);
    if(fxm!=='auto'||document.hidden||!root.classList.contains('dash')||lvl>=3){last=0;t0=0;bad=0;dts=[];return}
    if(last&&t-last<250) dts.push(t-last); last=t; if(!t0) t0=t;
    if(t-t0>=2500){
      var n=dts.length,s=dts.slice().sort(function(a,b){return a-b}),med=n?s[n>>1]:0;
      dts=[];t0=t;
      if(n>=15&&med>32){ if(++bad>=2){bad=0;lvl++;autoLvl=lvl;apply();save();window.dispatchEvent(new Event('mk6lite'))} } else bad=0;
    }
  }
  window.mk6Lite={get:function(){return lvl},set:function(n){lvl=Math.max(0,Math.min(3,n|0));autoLvl=lvl;bad=0;apply();save()},
    mode:function(m){fxm=(m==='full'||m==='lite')?m:'auto';bad=0;lvl=fxm==='full'?0:fxm==='lite'?3:autoLvl;apply()}};
  try{var st0=JSON.parse(localStorage.getItem('mk6v2')||'null');if(st0&&st0.prefs&&st0.prefs.fx) window.mk6Lite.mode(st0.prefs.fx)}catch(_){}
  apply();raf=requestAnimationFrame(loop);
})();
}catch(e){try{console.error(e)}catch(_){}}

/* ---- block 12 ---- */
try{
(function(){
  var T=40,DX=0,DY=0,root=document.documentElement;
  function upd(i){
    var o=i._ok;if(!o) return;
    var kv=parseFloat(i.style.zoom)||1,L=i.getBoundingClientRect().height,Ts=T*kv;
    if(!L) return;
    var mn=+i.min,mx=+i.max,f=mx>mn?(i.value-mn)/(mx-mn):0.5,k=(((0.5-f)*(L-(T+5)*kv))+DY*kv).toFixed(1);
    var sk=Ts.toFixed(1);
    if(i._sk!==sk){i._sk=sk;o.style.width=o.style.height=sk+'px';o.style.margin=(-Ts/2).toFixed(1)+'px 0 0 '+(-Ts/2).toFixed(1)+'px';i._yk=null}
    if(i._yk!==k){i._yk=k;o.style.transform='translate('+(DX*kv)+'px,'+k+'px)'}
    var g=i.style.getPropertyValue('--g');if(i._gk!==g){i._gk=g;o.style.setProperty('--g',g||'0')}
  }
  function scan(){
    if(!root.classList.contains('dash')||document.hidden) return;
    var l=document.querySelectorAll('.bdv input[type=range]:not(.ovr)');
    for(var n=0;n<l.length;n++){
      var i=l[n];
      if(!i._ok){var rc=i.cloneNode(false);rc.removeAttribute('id');rc.className=(rc.className?rc.className+' ':'')+'ovr';rc.tabIndex=-1;rc.setAttribute('aria-hidden','true');rc.value='0';i.parentNode.insertBefore(rc,i);var o=document.createElement('div');o.className='ovk';i.parentNode.appendChild(o);i._ok=o;i.addEventListener('input',function(){upd(this)})}
      upd(i);
    }
  }
  window.__ovk={set:function(x,y,t){DX=x;DY=y;T=t||T;document.querySelectorAll('.bdv input[type=range]:not(.ovr)').forEach(function(i){i._yk=null;i._sk=null})}};
  setInterval(scan,40);
})();
}catch(e){try{console.error(e)}catch(_){}}
