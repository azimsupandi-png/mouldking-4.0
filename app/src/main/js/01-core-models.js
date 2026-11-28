/* MK6 Console app code. Loaded after the first frame so the window appears at once.
   Each block is wrapped on its own so one failing block cannot stop the others. */

document.documentElement.classList.remove('booting');

/* Port colour tags A-F: one colour per channel letter, shared by the wiring plugs, the wiring labels and the dashboard chips */
var PCOL={A:'#E24B4A',B:'#1D9E75',C:'#3A9BDC',D:'#FFC400',E:'#9B5DE5',F:'#A0663C'};
function pcolOf(t){var m=/([A-F])\+?$/.exec(String(t||'').trim());return m?PCOL[m[1]]:''}
function pcolInk(c){return c===PCOL.D?'#141414':'#ffffff'}
(function(){
  var q=0;
  function paint(){q=0;var n=document.querySelectorAll('.bdw-chip,.ch-head .tag');
    for(var i=0;i<n.length;i++){var e=n[i],c=pcolOf(e.textContent);if(e._pc===c) continue;e._pc=c;
      if(c){e.style.background=c;e.style.color=pcolInk(c);if(e.classList.contains('tag')) e.style.borderLeftColor=c}
      else{e.style.background='';e.style.color='';e.style.borderLeftColor=''}}}
  function soon(){if(!q) q=requestAnimationFrame(paint)}
  try{new MutationObserver(soon).observe(document.documentElement,{childList:true,subtree:true,characterData:true})}catch(e){}
  if(document.readyState!=='loading') soon();else document.addEventListener('DOMContentLoaded',soon);
})();

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
  // parts a port can show in the wiring picture (mk_ = Mould King motors)
  var PF_OK=['m','l','xl','bg','sv','lt','mk_m','mk_l','mk_xl','mk_sv'];
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
  var DIRMK=true; // values show ▲/▼ for direction
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
    for(var i=0;i<NMAX;i++) ch.push({name:(names&&i<names.length)?names[i]:(i<PER?DEF[i]:'Channel '+L[i%PER]),inv:false,max:100,rmax:0,rmp:-1,hm:0,ha:-90,hb:90,hs:50,off:0,cv:[25,50,75],trim:0,kind:'slider',blink:'off',bright:100,stp:5,la:0,ls:0});
    return {ch:ch,limit:100,ramp:60,zone:100,testPwr:60,dash:false,dgv:2,hubNames:['','',''],spring:true,s1:{mode:'axis',a:0,b:1,hold:false},s2:{mode:'axis',a:2,b:3,hold:false},hubs:[0,-1,-1],hubT:[6,6,6],hubA:[{a:'',n:''},{a:'',n:''},{a:'',n:''}],stall:true,layout:'std',board:[],tilt:{on:false,sens:45,inv:false,all:false,dz:4,ex:0,c0:null},accent:0,accentV:3,pad:{on:true,dead:12,trig:-1,map:{}},safety:{idle:60,warn:30,run:0},seq:[],rec:[]};
  }
  // a hub is its module number plus its type (MK 6.0 or MK 4.0): the same module number may be used once per type
  function cleanHubs(h,ty){
    var out=[-1,-1,-1],s,t;ty=ty||[6,6,6];
    for(s=0;s<3;s++){var v=Math.round(+(h&&h[s]));out[s]=(v>=0&&v<=2)?v:-1}
    for(s=1;s<3;s++) for(t=0;t<s;t++) if(out[s]>=0&&out[s]===out[t]&&ty[s]===ty[t]&&ty[s]<14) out[s]=-1;
    if(out[0]<0){var m=0;while(out.some(function(x,k){return x===m&&ty[k]===ty[0]})) m++;out[0]=m}
    return out;
  }
  var PAD_BTNS=[0,1,2,3,4,5,10,11,12,13,14,15];
  function pickOf(v,list,def){v=+v;return list.indexOf(v)>=0?v:def}
  var MAX_SEQ=10, MAX_STEPS=30, MAX_TL=10, MAX_TLLANES=6, MAX_TLPTS=16;
  // Timelines: one lane per channel, points [time s, value, shape 0 smooth / 1 straight / 2 jump]
  function cleanTls(r){
    var out=[];if(!Array.isArray(r)) return out;
    r.slice(0,MAX_TL).forEach(function(x){
      if(!x||typeof x!=='object'||typeof x.id!=='string'||!/^[A-Za-z0-9_-]{1,40}$/.test(x.id)) return;
      var dur=Math.round(num(x.dur,1,60,5)*2)/2, lanes=[], used={};
      (Array.isArray(x.lanes)?x.lanes:[]).slice(0,MAX_TLLANES).forEach(function(l){
        if(!l||typeof l!=='object') return;var c=Math.round(+l.c);if(!(c>=0&&c<NMAX)||used[c]) return;used[c]=1;
        var pts=[];(Array.isArray(l.pts)?l.pts:[]).slice(0,MAX_TLPTS).forEach(function(q){if(!Array.isArray(q)) return;var t=Math.round(num(q[0],0,dur,0)*10)/10,v=Math.round(num(q[1],-100,100,0)),sh=pickOf(q[2],[0,1,2],0);pts.push([t,v,sh])});
        pts.sort(function(a,b){return a[0]-b[0]});
        if(!pts.length||pts[0][0]>0) pts.unshift([0,0,0]);
        if(pts[pts.length-1][0]<dur) pts.push([dur,0,0]);
        pts[0][0]=0;pts[pts.length-1][0]=dur;
        lanes.push({c:c,pts:pts});
      });
      out.push({id:x.id,name:String(x.name||'Timeline').slice(0,20),dur:dur,rp:pickOf(x.rp,[0,1,2,3,5],1),lanes:lanes});
    });
    return out;
  }
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
  var DMIN={ax:[8,8],sw:[10,10],tl:[12,8],lx:[8,5],rs:[8,8],st:[8,8],lv:[6,12],dp:[10,10],s:[12,6],j:[10,12],d:[20,12],m:[12,6],l:[6,6],t:[6,6],b:[6,6],e:[6,6],g:[12,6],z:[8,6],n:[8,8],w:[12,6],a:[10,6],y:[12,6],f:[10,8],i:[6,10],k:[12,8],ps:[8,9]};
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
        if(ja>=0&&ja<NMAX&&jb>=-1&&jb<NMAX){var jo={k:'j',c:ja,d:jb,m:x.m==='tank'?'tank':'axis',w:w,hold:x.hold===true},jj=cleanJc(x.jc);if(jj) jo.jc=jj;if(x.sw===1||x.sw===true) jo.sw=1;if(+x.ng===1) jo.ng=1;out.push(jo)}
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
      }else if(x.k==='cam'){
        var kc=Math.round(+x.c), kd=Math.round(+x.d);
        if(kc>=0&&kc<NMAX&&kd>=-1&&kd<NMAX&&kc!==kd){var ko={k:'cam',c:kc,d:kd,w:2};if(+x.fr===1) ko.fr=1;if(+x.hu===1||+x.hu===2) ko.hu=+x.hu;if(+x.np===1) ko.np=1;if(+x.ct===1) ko.ct=1;if(+x.q===480||+x.q===1080) ko.q=+x.q;if(+x.nr===1) ko.nr=1;out.push(ko)}
      }else if(x.k==='xy'||x.k==='xf'){
        var xa=Math.round(+x.c),xb=Math.round(+x.d);
        if(xa>=0&&xa<NMAX&&xb>=0&&xb<NMAX&&xa!==xb){var xo={k:x.k,c:xa,d:xb,w:w};
          if(x.k==='xy'){if(x.hd===1||x.hd===true) xo.hd=1;if(+x.ng===1) xo.ng=1;if(+x.nr===1) xo.nr=1;var xj=cleanJc(x.jc);if(xj) xo.jc=xj;if(x.sw===1||x.sw===true) xo.sw=1;if(x.m==='tank') xo.m='tank'}
          else{var xp=Math.round(+x.p);if(xp>=10&&xp<100) xo.p=xp;if(+x.md===1) xo.md=1;if(+x.rc===1) xo.rc=1;if(+x.rd===1) xo.rd=1}
          out.push(xo)}
      }else if(x.k==='tl'){
        if(typeof x.tl==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(x.tl)) out.push({k:'tl',w:w,tl:x.tl});
      }else if(x.k==='sw'){
        var swc=Math.round(+x.c);
        if(swc>=0&&swc<NMAX){var swo={k:'sw',c:swc,w:w},q;
          q=Math.round(+x.lo);if(x.lo!==undefined&&q>=-180&&q<=0&&q!==-150) swo.lo=q;q=Math.round(+x.hi);if(x.hi!==undefined&&q>=0&&q<=180&&q!==150) swo.hi=q;
          q=Math.round(+x.sz);if(x.sz!==undefined&&q>=0&&q<=60&&q!==20) swo.sz=q;q=+x.dps;if(q>=1&&q<=360&&q!==30) swo.dps=Math.round(q*10)/10;
          if(+x.inf===1) swo.inf=1;if(+x.rv===1) swo.rv=1;q=+x.a;if(q>=-180&&q<=180) swo.a=Math.round(q*10)/10;out.push(swo)}
      }else if(x.k==='ax'){
        var axc=Math.round(+x.c);if(axc>=0&&axc<NMAX) out.push({k:'ax',c:axc,w:w});
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
          if(x.hold===true) dpo.hold=true;if(x.sw===1||x.sw===true) dpo.sw=1;
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
        if(['e','z','a','l','j','d','w','f','i','k','rs','dp','ps','lx','tl'].indexOf(it0.k)<0){
          if(x.inv===1||x.inv===true) it0.inv=1;
          var cp0=Math.round(+x.cap);if(cp0>=10&&cp0<100) it0.cap=cp0;
          if(it0.k==='s'){var sn0=Math.round(+x.snap);if([5,10,25].indexOf(sn0)>=0) it0.snap=sn0}
          if(it0.k==='b'){var bp0=Math.round(+x.p);it0.p=(bp0>=30&&bp0<=100)?bp0:100;
            // button type: t toggle (the old "lock"), p ping-pong, a accelerator; none = hold
            var bt0=['t','p','a'].indexOf(x.bt)>=0?x.bt:(x.lock===true?'t':'');if(bt0) it0.bt=bt0;
            if(bt0==='a'){var ar0=+x.ar;if([0.5,1,2,3].indexOf(ar0)>=0&&ar0!==1) it0.ar=ar0;var af0=+x.af;if([0.5,2,0].indexOf(af0)>=0) it0.af=af0}}
          if(it0.k==='s'&&(x.tm===1||x.tm===true)){it0.tm=1;var tr0=Math.round(+x.tr);if([20,80].indexOf(tr0)>=0) it0.tr=tr0;if(x.tp===0) it0.tp=0}
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
      o.rmax=x.rmax>=10&&x.rmax<=100?Math.round(+x.rmax):0;
      o.rmp=x.rmp>=0&&x.rmp<=100?Math.round(+x.rmp):-1;
      o.hm=x.hm===1||x.hm===2?x.hm:0;o.ha=Math.round(num(x.ha,-3600,3600,-90));o.hb=Math.round(num(x.hb,-3600,3600,90));o.hs=Math.round(num(x.hs,5,100,50));
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
    d.hubT=[0,1,2].map(function(k){var t=Array.isArray(c.hubT)?+c.hubT[k]:6;return t===4||t===40||t===14||t===16?t:6});
    d.stall=c.stall!==false;
    d.hubA=[0,1,2].map(function(k){var q=Array.isArray(c.hubA)&&c.hubA[k]||{};var a=typeof q.a==='string'&&/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(q.a)?q.a.toUpperCase():'';return {a:a,n:a&&typeof q.n==='string'?q.n.replace(/[\u0000-\u001f<>]/g,'').slice(0,12):''}});
    d.hubs=cleanHubs(Array.isArray(c.hubs)?c.hubs:[num(c.mod,0,2,0),-1,-1],d.hubT);
    d.pfp={};if(c.pfp&&typeof c.pfp==='object') Object.keys(c.pfp).forEach(function(q){var v=c.pfp[q],n=+q;if(n>=0&&n<NMAX*2+3&&Array.isArray(v)&&isFinite(v[0])&&isFinite(v[1])) d.pfp[n]=[Math.max(0,Math.min(1360,+v[0])),Math.max(0,Math.min(1560,+v[1]))]});
    d.pcl=[];for(var cq=0;cq<NMAX;cq++) d.pcl.push(Array.isArray(c.pcl)&&+c.pcl[cq]===50?50:20);
    d.pf=[];for(var pq=0;pq<NMAX;pq++){var pv=Array.isArray(c.pf)?c.pf[pq]:'';d.pf.push(PF_OK.indexOf(pv)>=0?pv:'')}
     // a second connector stacked on the first (same channel): only where a first part is plugged in
     d.pf2=[];for(var pq2=0;pq2<NMAX;pq2++){var pv2=Array.isArray(c.pf2)?c.pf2[pq2]:'';d.pf2.push(d.pf[pq2]&&PF_OK.indexOf(pv2)>=0?pv2:'')}
    // a port drawn with a motor is a motor channel: a light channel there could never run in reverse
    if(Array.isArray(d.ch)) for(var pk=0;pk<NMAX;pk++) if(d.ch[pk]&&d.ch[pk].kind==='light'&&PF_OK.indexOf(d.pf[pk])>=0&&d.pf[pk]!=='lt') d.ch[pk].kind='slider';
    d.layout='board';
    // old 'Speed' setting (x0.4 / x0.7) multiplied the power limit; fold it in once and drop it
    if(c.speed==='slow'||c.speed==='normal') d.limit=Math.max(10,Math.round(d.limit*(c.speed==='slow'?0.4:0.7)));
    d.board=cleanBoard(c.board);
    if(c.dgv!==2) d.board.forEach(function(it){if(it.g) it.g=it.g.map(function(q){return q*2})});
    var tl=(c.tilt&&typeof c.tilt==='object')?c.tilt:{};
    d.tilt={on:tl.on===true,sens:pickOf(tl.sens,[30,45,60],45),inv:tl.inv===true,all:tl.all===true,dz:Math.round(num(tl.dz,0,15,4)),ex:Math.round(num(tl.ex,0,80,0)),c0:(typeof tl.c0==='number'&&isFinite(tl.c0)&&Math.abs(tl.c0)<=180)?Math.round(tl.c0*10)/10:null};
    // Colour choices are now orange(0), red(1), yellow(2). Older saves used six: pink maps to red, yellow to yellow, the rest to orange.
    d.accent=c.accentV===3?Math.round(num(c.accent,0,5,0)):0;
    // model icon / photo (photo: small JPEG data URL)
    d.icon=['car','dig','crane','truck','tractor','boat'].indexOf(c.icon)>=0?c.icon:'';
    d.fav=c.fav===true;
    var st0=(c.st&&typeof c.st==='object')?c.st:{};d.st={ms:Math.max(0,Math.min(36e8*1e3,+st0.ms||0)),last:Math.max(0,+st0.last||0)};
    d.photo=(typeof c.photo==='string'&&c.photo.length<420000&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(c.photo))?c.photo:'';
    // steering eases at speed: steering channel output shrinks as the throttle channel output grows
    var ss0=(c.ss&&typeof c.ss==='object')?c.ss:{};
    d.ss={on:ss0.on===true,st:Math.round(num(ss0.st,0,17,1)),th:Math.round(num(ss0.th,0,17,0)),min:pickOf(ss0.min,[40,55,70],55)};
    d.accentV=3;
    var pd=(c.pad&&typeof c.pad==='object')?c.pad:{};
    var rs0=(pd.rs&&typeof pd.rs==='object')?pd.rs:{},ls0=(pd.ls&&typeof pd.ls==='object')?pd.ls:{};
    d.pad={on:pd.on!==false,dead:Math.round(num(pd.dead,5,40,12)),trig:Math.round(num(pd.trig,-1,NMAX-1,-1)),map:{},mt:{},
      // right stick straight to channels (up/down = a, left/right = b, mx = mixed / tank), -1 = not used
      rs:{a:Math.round(num(rs0.a,-1,NMAX-1,-1)),b:Math.round(num(rs0.b,-1,NMAX-1,-1)),mx:rs0.mx===true},
      ls:{a:Math.round(num(ls0.a,-1,NMAX-1,-1)),b:Math.round(num(ls0.b,-1,NMAX-1,-1)),mx:ls0.mx===true}};
    var mts=(pd.mt&&typeof pd.mt==='object')?pd.mt:{};PAD_BTNS.forEach(function(b){if(['t','p','a'].indexOf(mts[b])>=0) d.pad.mt[b]=mts[b]});
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
    d.tl=cleanTls(c.tl);
    d.rec=cleanRecs(c.rec);
    // models made with the old Standard / Joystick / Dual stick layouts get a starter board
    if(c.layout!=='board'&&!d.board.length){var nb=0;for(var bi=0;bi<NMAX&&nb<4;bi++){if(d.hubs[(bi/PER)|0]<0) continue;var bk=d.ch[bi].kind;d.board.push(bk==='light'?{k:'l',c:bi,w:1}:{k:'s',c:bi,w:bk==='hold'?2:1,hold:bk==='hold'});nb++}if(d.board.length) d.board.push({k:'e',w:1})}
    return d;
  }
  function starters(){
    var mine=baseCfg(['Drive','Steering','Lights','Winch','Rear lights','Channel F']);
    mine.ch[2].kind='light';mine.ch[4].kind='light';mine.layout='board';mine.dash=true;
    mine.board=[{k:'s',c:0,w:1,v:true,g:[0,0,12,24]},{k:'l',c:2,w:1,g:[12,0,13,7]},{k:'b',c:0,w:1,g:[12,7,13,7]},
      {k:'t',c:3,y:'dir',w:1,g:[25,0,14,7]},{k:'l',c:4,w:1,g:[25,7,14,7]},{k:'e',w:1,g:[39,0,9,14]},{k:'s',c:1,w:1,g:[12,14,36,10]}];
    mine.board.forEach(function(o){o.gp=o.g.slice()});
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
  function cleanPrefs(p){p=(p&&typeof p==='object')?p:{};return {practice:p.practice===true,sound:p.sound!==false,haptic:p.haptic!==false,lang:p.lang==='ms'?'ms':'en',seen:p.seen===true,lim:cleanLim(p.lim),autoBackup:p.autoBackup!==false,full:p.full!==false,relink:p.relink!==false,lastBackup:Math.max(0,+p.lastBackup||0),tpls:cleanTpls(p.tpls),ui:p.ui==='light'?'light':'dark',fs:pickOf(p.fs,[100,115,130],100),hc:p.hc===true,cb:p.cb===true,wn:(typeof p.wn==='number'&&p.wn>=0)?Math.floor(p.wn):0,upAt:(typeof p.upAt==='number'&&p.upAt>0)?p.upAt:0,msort:['f','r','a'].indexOf(p.msort)>=0?p.msort:'f',tour:p.tour===true,linkOn:p.linkOn===true,focus:p.focus===true,playLim:pickOf(p.playLim,[0,10,20,30,45,60],0),lframe:p.lframe!==false,wrlock:p.wrlock!==false,bdlock:p.bdlock===true,wrall:p.wrall===true}}
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
  // a failed save (the app's storage is full) used to be silent, so changes vanished at the next start: say so
  var SAVEERR=0;
  function save(){
    try{localStorage.setItem('mk6v2',JSON.stringify(store))}catch(e){if(Date.now()-SAVEERR>20000){SAVEERR=Date.now();try{toast('App storage is full: changes are not being saved. Remove a model photo or a wallpaper, or delete old models.',9000)}catch(_){}}}
    if(NB&&NB.shortcuts){clearTimeout(scTimer);scTimer=setTimeout(pushShortcuts,1500)}
    clearTimeout(hcTimer);hcTimer=setTimeout(sendHall,250);
  }
  var hcTimer=0;
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
  // a hub with 4 ports: Mould King 4.0, or the H4.0 hub that connects directly
  // parts a port can show in the wiring picture; MK servo swings like the servo
  function isSvT(t){return t==='sv'||t==='mk_sv'}
  function isMk4(s){return !!C.hubT&&(C.hubT[s]===4||C.hubT[s]===14||C.hubT[s]===40)}
  function isHall(s){return !!C.hubT&&(C.hubT[s]===14||C.hubT[s]===16)}
  // older Mould King 4.0 boxes (type 40): each port is only on or off (full power) in either direction
  function isOnOff(s){return !!C.hubT&&C.hubT[s]===40}
  function typeTag(s,mk){return isOnOff(s)?(mk?' · MK 4.0 on/off':' · 4.0 on/off'):isMk4(s)?(mk?' · MK 4.0':' · 4.0'):''}
  function hubAddr(s){return C.hubA&&C.hubA[s]?C.hubA[s].a:''}
  // a Mould King 4.0 hub has ports A-D only, so its E and F channels do not exist
  function isActive(i){var s=(i/PER)|0;return slotOn(s)&&!(isMk4(s)&&i%PER>=4)}
  function hubMods(){return activeSlots().map(function(s){return isHall(s)?'H'+(C.hubT[s]-10)+'='+hubAddr(s):isOnOff(s)?20+C.hubs[s]:isMk4(s)?10+C.hubs[s]:C.hubs[s]}).join(',')}
  // an H4.0 / H6.0 hub needs its Bluetooth address first (Settings, Hubs, Find hub)
  // options for the H-hubs: stall protection, servo ports (position from the channel value) and end stops
  function hallCfg(){
    var o={stall:C.stall!==false,servo:[],ends:[]},sl=activeSlots();
    sl.forEach(function(s,h){
      if(!isHall(s)) return;
      for(var p=0;p<(C.hubT[s]===14?4:6);p++){
        var c=C.ch[s*PER+p],u=partOf(s*PER+p)==='xl'?590000:395000;
        if(c.hm===1) o.servo.push({h:h,p:p,lo:Math.min(c.ha,c.hb),hi:Math.max(c.ha,c.hb),sp:c.hs,u:u});
        else if(c.hm===2) o.ends.push({h:h,p:p,a:c.ha,b:c.hb,u:u});
      }
    });
    return o;
  }
  function sendHall(){try{if(NB&&NB.hallConfig) NB.hallConfig(JSON.stringify(hallCfg()))}catch(_){}}
  function hubsReady(){var bad=activeSlots().filter(function(s){return isHall(s)&&!hubAddr(s)});
    if(bad.length){toast('Hub '+(bad[0]+1)+' needs its Bluetooth address. Open Settings, tap Find hub and choose it.',6000);return false}return true}
  function activeSlots(){var o=[];for(var s=0;s<3;s++) if(slotOn(s)) o.push(s);return o}
  function activeIdx(){var o=[];for(var i=0;i<NMAX;i++) if(isActive(i)) o.push(i);return o}
  // channel tag: M1A when every hub has its own module number; H2A (hub number) when a 6.0 and a 4.0 hub share one
  function tagOf(i){var s=(i/PER)|0,sl=activeSlots();if(sl.length<2) return L[i%PER];
    var dup=sl.some(function(a){return sl.some(function(b){return a!==b&&C.hubs[a]===C.hubs[b]})})||sl.some(isHall);
    return (dup?'H'+(s+1):'M'+(C.hubs[s]+1))+L[i%PER]}

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
