  // ---- 5 · Hub: output LEDs, channel-test knobs with LED rings, add a second / third hub ----
  // ---- Hub wiring view: the MK6 hub with its six ports, plugs, cables and the part on each port (part pictures in img/pf) ----
  var WR={slot:0,root:null,svg:null,cur:null,raf:0,last:0,key:'',host:'wrHost',on:true};
  var LT=L;
  // every hub picture is its own instance (own parts, cables and drag state); the port panel under them is shared: WCUR is the picture that opened it
  var WCUR=null,WALLI=[],WALLK='';
  function mkWire(WR){
var API={WR:WR};
var G='#1D9E75',Y='#EF9F27',R='#E24B4A',K='#ffd84a',OFF='rgba(150,160,175,.28)';
function col(f){return f<=.55?G:f<=.8?Y:R}
var TOP=['B','D','F'],BOT=['A','C','E'];
var DEFS='<defs>'+
 '<radialGradient id="gMetal" cx="35%" cy="30%"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".45" stop-color="#8d939c"/><stop offset="1" stop-color="#3a4049"/></radialGradient>'+
 '<radialGradient id="gMetalL" cx="35%" cy="30%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#a3aab3"/></radialGradient>'+
 '<radialGradient id="gOrange" cx="40%" cy="35%"><stop offset="0" stop-color="#ffc27a"/><stop offset=".6" stop-color="#e0861f"/><stop offset="1" stop-color="#9a5208"/></radialGradient>'+
 '<linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eceef1"/><stop offset="1" stop-color="#c9ced5"/></linearGradient>'+
 '<linearGradient id="gCap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a919b"/><stop offset=".35" stop-color="#d9dde2"/><stop offset=".55" stop-color="#6b727c"/><stop offset="1" stop-color="#3e444d"/></linearGradient>'+
 '<radialGradient id="gCapF" cx="40%" cy="35%"><stop offset="0" stop-color="#7a818b"/><stop offset="1" stop-color="#3a4049"/></radialGradient>'+
 '<linearGradient id="gTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".55" stop-color="#d9dce1"/><stop offset="1" stop-color="#b9bec6"/></linearGradient>'+
 '<linearGradient id="gSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d838d"/><stop offset="1" stop-color="#3e434b"/></linearGradient>'+
 '<radialGradient id="gStud" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f7f8fa"/><stop offset=".6" stop-color="#cfd3d9"/><stop offset="1" stop-color="#9ea4ad"/></radialGradient>'+
 '<radialGradient id="gHole" cx="50%" cy="60%"><stop offset="0" stop-color="#4b515a"/><stop offset="1" stop-color="#8f959e"/></radialGradient>'+
 '<linearGradient id="gPin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d939c"/><stop offset=".5" stop-color="#f4f6f8"/><stop offset="1" stop-color="#7a808a"/></linearGradient>'+
 '<linearGradient id="gMot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0f2f5"/><stop offset=".55" stop-color="#c3c8cf"/><stop offset="1" stop-color="#868d97"/></linearGradient>'+
 '<linearGradient id="gMotD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a909a"/><stop offset="1" stop-color="#4a4f57"/></linearGradient>'+
 '<radialGradient id="gKnob" cx="40%" cy="35%"><stop offset="0" stop-color="#5a6376"/><stop offset=".6" stop-color="#2a303b"/><stop offset="1" stop-color="#14181f"/></radialGradient>'+
 '<filter id="fGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
 '<filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".55"/></filter>'+
 '</defs>';




// orange axle disc, ellipse fitted to the picture pixels (cv2.fitEllipse): centre x,y, semi-axes rx,ry (px), rotation (deg); picture size
var IMG={m:{e:[94.33,440.16,21.95,57.7,162.05],W:900,H:677},l:{e:[83.4,459.65,18.81,50.01,162.03],W:900,H:676},xl:{e:[140.93,452.66,18.83,49.42,162.23],W:900,H:721},bg:{es:[[176.32,362.57,23.62,33.76,22.48],[294.34,325.22,23.68,33.77,23.09]],red:1,W:900,H:493},sv:{e:[82.9,595.64,18.94,49.24,161.34],W:900,H:757},lt:{lamps:[[0.012,0.66],[0.152,0.867]],W:408,H:286}};
// outline of the visible part in each picture (traced from its alpha): taps land on the part, not on the clear corners of its picture
var HIT={"m": "M858,118 829,102 785,48 739,12 739,0 639,0 637,14 144,178 118,196 106,222 44,245 13,305 0,306 0,405 14,407 23,458 23,543 100,611 144,676 222,676 226,661 885,443 886,350 899,349 899,194 886,193Z", "l": "M899,171 886,171 840,126 779,119 774,62 726,12 726,0 646,0 627,40 262,155 231,194 221,225 127,249 85,208 39,208 0,227 0,304 18,310 18,334 0,343 0,502 50,536 78,599 124,615 178,661 179,675 248,675 269,631 274,586 338,572 387,597 418,597 750,485 771,452 807,453 820,471 899,451Z", "xl": "M662,0 566,0 564,14 218,133 97,163 55,182 35,219 22,222 15,249 0,250 0,408 26,416 54,515 90,590 90,616 118,644 136,690 187,707 188,720 293,720 294,707 780,546 817,502 876,467 887,443 899,443 899,316 887,316 821,258 763,112 669,34Z", "bg": "M899,160 885,158 850,109 811,91 732,91 679,69 623,12 623,0 520,0 520,12 491,29 452,90 374,115 346,115 291,90 216,108 156,184 77,209 12,266 0,266 0,429 147,475 196,473 211,480 211,492 317,492 317,480 341,467 387,405 492,380 548,403 620,395 687,458 725,479 726,492 806,492 807,479 847,460 884,386 899,382Z", "sv": "M774,0 685,0 678,16 158,194 103,202 27,236 13,272 0,273 0,583 13,584 52,693 97,756 211,756 212,743 439,669 471,599 476,521 540,509 601,573 641,580 683,553 694,528 693,451 747,440 826,511 864,507 899,489 899,194 886,193 853,83 802,57Z", "lt": "M0,168 0,212 27,212 36,228 54,229 62,272 87,272 88,285 148,285 151,270 277,222 324,226 407,204 407,127 380,116 355,85 322,85 306,55 264,19 260,0 160,0 160,12 104,69 92,149Z"};
// shown turning speed: the real rpm slowed down so the eye can follow it (a real 400 rpm axle turns too far between two frames
// and looks the same at any speed); slow, medium and fast now look clearly different
var VSPD=.4;
var TAU={m:.12,l:.2,xl:.35,bg:.3,sv:.15,lt:.1},LAY=6;
function mul(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
function rotM(d){var r=d*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [c,s,-s,c,0,0]}
// matrix that maps the unit circle (rotated by theta) onto the fitted ellipse of the orange disc: exact rotation in the disc's plane
function discMatrix(e,theta){var A=mul(rotM(e[4]),[e[2],0,0,e[3],0,0]);var M=mul([1,0,0,1,e[0],e[1]],mul(A,rotM(theta)));return 'matrix('+M.map(function(v){return v.toFixed(5)}).join(' ')+')'}
// axle hole (cross) in unit-circle coordinates, drawn like the source pictures: flat orange disc with a thick black rim,
// cross hole with a heavy black border and a lit orange centre (light stays fixed while the cross turns)
function crossPath(w,l){return 'M'+(-w)+' '+(-l)+'H'+w+'V'+(-w)+'H'+l+'V'+w+'H'+w+'V'+l+'H'+(-w)+'V'+w+'H'+(-l)+'V'+(-w)+'H'+(-w)+'Z'}
var CR_OUT=crossPath(.35,.82),CR_IN=crossPath(.23,.62);

var RPM={m:405,l:390,xl:220,bg:420,sv:0,lt:0};
// output discs of a part: most have one (e), the buggy motor has two (es) that turn together
function discsOf(d){return d.es||(d.e?[d.e]:[])}
// cable exit point on each picture (fraction of picture)
var EXIT={m:[.93,.30],l:[.97,.40],xl:[.92,.32],bg:[.95,.45],sv:[.96,.40],lt:[.97,.6]};
// scene layout
// true scale: U scene units = 1 stud (8 mm). Hub drawing: 162 px per stud (stud pitch in the drawing).
var U=54,HS=.38,HX=680-942.5*HS,HY=770-70*HS;   // hub 9 x 5 studs (162 px per stud in the hub drawing)    // hub drawing placed with translate(HX,HY) scale(HS)
// part length in studs (BrickArchitect sizes: Med 3x3x6, Lg 3x4x7, XL 5x5x6, Servo 3x5x7); the picture is scaled so its width spans that length
var LEN={m:6,l:7,xl:6,bg:9.75,sv:7};
// Mould King motors (pictures from the user's reference drawings): same fields as the parts above
IMG.mk_m={e:[69.58, 268.55, 15.36, 31.94, 153.52],W:480,H:397};HIT.mk_m="M415,13 403,9 393,15 344,0 63,132 53,154 24,169 13,197 0,210 2,237 18,280 19,324 117,396 466,234 479,155 475,114 450,60 422,37 427,28Z";TAU.mk_m=0.12;RPM.mk_m=405;EXIT.mk_m=[0.8438, 0.1408];LEN.mk_m=6.6;
IMG.mk_l={e:[70.78, 317.57, 15.57, 30.15, 153.65],W:556,H:449};HIT.mk_l="M551,113 501,74 464,81 457,41 463,31 450,14 442,11 428,17 406,1 386,2 369,15 358,35 336,39 155,121 136,145 133,169 90,190 48,163 17,174 1,200 4,220 17,231 0,260 7,296 1,333 44,368 65,405 105,415 147,447 170,446 195,420 198,401 191,386 223,372 253,385 279,384 465,299 481,277 490,275 507,287 536,279 554,252Z";TAU.mk_l=0.2;RPM.mk_l=390;EXIT.mk_l=[0.7932, 0.1293];LEN.mk_l=7.7;
IMG.mk_xl={e:[118.8, 322.53, 16.21, 33.75, 153.98],W:613,H:495};HIT.mk_xl="M455,15 442,11 432,18 427,8 407,1 374,0 54,146 18,176 0,222 13,297 23,302 39,349 78,415 78,427 116,476 139,479 170,494 217,487 538,340 554,321 598,291 612,258 602,200 558,165 505,68 462,40 468,32Z";TAU.mk_xl=0.35;RPM.mk_xl=220;EXIT.mk_xl=[0.7284, 0.1134];LEN.mk_xl=6.6;
IMG.mk_sv={e:[79.63, 433.36, 17.02, 37.1, 151.52],W:618,H:542};HIT.mk_sv="M536,19 524,15 514,22 488,0 464,3 42,187 22,201 0,241 9,266 8,295 1,304 8,343 1,381 11,396 26,452 75,531 145,541 324,460 341,432 344,369 373,355 382,355 432,393 465,387 486,358 487,305 511,295 567,335 585,333 606,319 617,294 617,241 607,210 602,131 578,72 567,57 543,43 549,36Z";TAU.mk_sv=0.15;RPM.mk_sv=0;EXIT.mk_sv=[0.8706, 0.1276];LEN.mk_sv=7.7;
function hx(x){return HX+x*HS}function hy(y){return HY+y*HS}

var POS={},POS0={},SLOT={},SXS=[40,470,900];
// part spots around the hub: each port's part sits on the side its cable leaves the plug
//   6.0: B D F plugs face the back (parts above the hub), A C E the front (parts below)
//   4.0: B and A leave toward the A/B end (left), C and D toward the C/D end (right)
function slotsFor(kind){SLOT={};
 if(kind==='4'){SLOT.B={x:120,y:20,w:420,h:330,top:true};SLOT.C={x:820,y:20,w:420,h:330,top:true};SLOT.A={x:120,y:1130,w:420,h:330,top:false};SLOT.D={x:820,y:1130,w:420,h:330,top:false}}   // closer to the smaller true-scale 4.0 hub
 else{['B','D','F'].forEach(function(k,j){SLOT[k]={x:SXS[j],y:20,w:420,h:330,top:true}});['A','C','E'].forEach(function(k,j){SLOT[k]={x:SXS[j],y:1130,w:420,h:330,top:false}})}
 POS0={};Object.keys(SLOT).forEach(function(k){var sl=SLOT[k];POS0[k]=[sl.x+sl.w/2,sl.y+sl.h/2+(sl.top?-20:20)]})}
// one stud for every picture in the wiring (real sizes): STUD = svg px per stud upward. Hubs use their own stud height (AZ);
// motors use their orange output disc (about 1.04 stud across on every PF/MK motor); the LED brick uses its studs
var STUD=42,SU=STUD*70.2/63;   // SU: one stud along the floor (iso axis), for the scale bar
function partScale(t,d){if(t==='lt') return 1.05*STUD/44;var e=d.e||(d.es&&d.es[0]);return e?STUD*0.52/e[3]:LEN[t]*U/d.W}
// default spot of each part: its slot centre, pushed sideways only as far as needed so wide parts in one row do not overlap
function rowsOf(){return HKIND==='4'?[['B','C'],['A','D']]:[['B','D','F'],['A','C','E']]}
// stacked parts wait beside the hub (left of it for the A/B end, right for the far end), back-row ports high, front-row ports low
function sideSpots(){var hc=HUBOV||(C.pfp&&C.pfp[NMAX+WR.slot])||[680,745],hw=HWH[0]*HK/2,L=Math.max(8,hc[0]-hw-24),Rx=Math.min(1352,hc[0]+hw+24);
 var ks=Object.keys(ST).filter(isStk),spot={},used={};
 var pref=function(k){var b=baseOf(k),left=HKIND==='4'?(b==='A'||b==='B'):(b==='A'||b==='B'||b==='C'||b==='D'),hi=SLOT[b]&&SLOT[b].top;return [[left,hi],[left,!hi],[!left,hi],[!left,!hi]]};
 ks.sort(function(a,b){return 'ABEFCD'.indexOf(baseOf(a))-'ABEFCD'.indexOf(baseOf(b))}).forEach(function(k){var t=ST[k].t,w=IMG[t].W*partScale(t,IMG[t]);
  var c=pref(k).filter(function(q){return !used[q[0]+'|'+q[1]]})[0];if(!c) return;used[c[0]+'|'+c[1]]=1;
  spot[k]=[c[0]?Math.max(8+w/2,L-w/2):Math.min(1352-w/2,Rx+w/2),c[1]?hc[1]-170:hc[1]+190]});return spot}
function pos0(k){if(isStk(k)){var sp=sideSpots()[k];if(sp) return sp}var row=rowsOf().filter(function(r){return r.indexOf(k)>=0})[0];if(!row||!POS0[k]) return (POS0[k]||[680,745]).slice();
 var w=row.map(function(q){var t=ST[q]&&ST[q].t;return t?IMG[t].W*partScale(t,IMG[t]):340}),c=row.map(function(q){return POS0[q][0]}),G=24,n=row.length,i;
 for(i=1;i<n;i++) c[i]=Math.max(c[i],c[i-1]+(w[i-1]+w[i])/2+G);
 c[n-1]=Math.min(c[n-1],1352-w[n-1]/2);for(i=n-2;i>=0;i--) c[i]=Math.min(c[i],c[i+1]-(w[i]+w[i+1])/2-G);
 c[0]=Math.max(c[0],8+w[0]/2);return [c[row.indexOf(k)],POS0[k][1]]}
function fit(t,k){if(typeof k!=='string') k=Object.keys(SLOT).filter(function(q){return SLOT[q]===k})[0];var d=IMG[t],sc=partScale(t,d),w=d.W*sc,h=d.H*sc,c=POS[k],x=c[0]-w/2;if(t==='bg') x=Math.max(8,Math.min(1352-w,x));return {k:sc,x:x,y:c[1]-h/2,w:w,h:h}}

function partSvg(k){var s=ST[k],t=s.t;if(!t) return '';var f=fit(t,k),d=IMG[t],o='';
 o+='<g class="pt" data-p="'+k+'" style="cursor:pointer" id="pt'+k+'" transform="translate('+f.x.toFixed(1)+' '+f.y.toFixed(1)+') scale('+f.k.toFixed(5)+')"><image href="img/pf/'+t+'.webp" width="'+d.W+'" height="'+d.H+'" pointer-events="none"/><path class="hit" d="'+HIT[t]+'" fill="transparent"/>';
 var kP=k;discsOf(d).forEach(function(e,q){var k=kP+(q?'_'+q:''),M0=discMatrix(e,0),rd=d.red;
  o+='<defs><linearGradient id="od'+k+'" x1="0" y1="0" x2="1" y2="1">'+(rd?'<stop offset="0" stop-color="#a3231b"/><stop offset=".55" stop-color="#951d16"/><stop offset="1" stop-color="#7d1611"/>':'<stop offset="0" stop-color="#9e5d22"/><stop offset=".55" stop-color="#95571e"/><stop offset="1" stop-color="#8a4e19"/>')+'</linearGradient>'+
   '<radialGradient id="ol'+k+'" cx="50%" cy="50%" r="50%">'+(rd?'<stop offset="0" stop-color="#ff8a78"/><stop offset=".45" stop-color="#f0503f"/><stop offset=".8" stop-color="#cc2a20"/><stop offset="1" stop-color="#a11e17"/>':'<stop offset="0" stop-color="#fcc87f"/><stop offset=".45" stop-color="#f6b062"/><stop offset=".8" stop-color="#de8238"/><stop offset="1" stop-color="#b8692a"/>')+'</radialGradient>'+
   '<clipPath id="cp'+k+'"><circle r=".97" transform="'+M0+'"/></clipPath>';
  for(var j=0;j<LAY;j++) o+='<clipPath id="ic'+k+'_'+j+'"><path id="icp'+k+'_'+j+'" d="'+CR_IN+'" transform="'+M0+'"/></clipPath>';
  o+='</defs><circle pointer-events="none" id="gl'+k+'" r="1.22" fill="none" stroke-width="1.4" vector-effect="non-scaling-stroke" filter="url(#fGlow)" opacity="0" transform="'+M0+'"/>'+
   '<circle r="1.03" fill="url(#od'+k+')" stroke="#050505" stroke-width=".9" vector-effect="non-scaling-stroke" transform="'+M0+'"/><g clip-path="url(#cp'+k+')">';
  for(var j=0;j<LAY;j++) o+='<g id="ly'+k+'_'+j+'" opacity="'+(j?0:1)+'"><path id="cro'+k+'_'+j+'" d="'+CR_OUT+'" fill="#050505" stroke="#050505" stroke-width=".5" stroke-linejoin="round" vector-effect="non-scaling-stroke" transform="'+M0+'"/><g clip-path="url(#ic'+k+'_'+j+')"><ellipse cx="'+e[0]+'" cy="'+e[1]+'" rx="'+(e[2]*.72)+'" ry="'+(e[3]*.72)+'" transform="rotate('+e[4]+' '+e[0]+' '+e[1]+')" fill="url(#ol'+k+')"/></g></g>';
  o+='</g>'});
 if(d.lamps) d.lamps.forEach(function(q,j){o+='<circle pointer-events="none" id="lg'+k+'_'+j+'" cx="'+(q[0]*d.W)+'" cy="'+(q[1]*d.H)+'" r="70" fill="url(#lampG)" opacity="0"/>'});
 o+='</g>';return o}
// PF plug seen from above, in hub-drawing coordinates (top ports; bottom ports are the same turned 180 deg about the port column).
// 2x2 footprint: contact half sits over the port, stud half clutches the hub's two studs next to the port; cable leaves from the contact end toward the hub edge.
// PF plug, top view, drawn after the user's reference diagram (no lettering). Picture units: body 602..895 x 198..465, cable tab to x=527.
// Placed with the cable tab toward the hub edge, the contact half over the port and the stud half over the hub's two studs.
// ---- 3D hub, drawn in the same line-and-flat-shade style as the motor pictures ----
// World: x,y in the hub drawing's own px (162 px = 1 stud; plate 215..1670 x 88..885), z in studs from the hub's base.
// Screen axes per stud: along the hub (A/B end at right, E/F end at lower left), toward the back (A/C/E row), and up.
var SS=U,AX=[-.84*SS,.40*SS],AY=[-.66*SS,-.42*SS],AZ=[0,-.84*SS],HZ=3.4,CZ=2.25,PZ=1.15,O3=[0,0];
// the hub is the real picture (redrawn in the motor style); its top plane maps hub-drawing px onto picture px with this affine fit
// (least squares on the 12 stud centres, rms 5 px); HK scales the picture so one stud matches U
var HM=[[-0.53579,-0.46667,1307.89668],[0.25023,-0.3043,143.12769]],HK=.6,HWH=[1125,962],HP=[0,0];
// Hub pictures: the user's 6.0 and 4.0 hub drawings. Their camera was read off the drawings (same as his wireframe views) (the two
// top-face axes, square studs, vertical up); M maps the hub plan (162.5 px = 1 stud) onto the hub top in picture px,
// AZ = picture px per stud upward, K scales the picture. P: centre of each port's contact half on the plan and the way its
// cable leaves; the stud half of the connector sits on the two hub studs inward.
var HUBS={
 '6':{led:[331.5,370.0,7.5,4.6],img:'img/pf/hub6.webp',WH:[890,763],M:[[0.384615, 0.390769, -690.551], [-0.196923, 0.181538, 363.845]],K:42/63,AZ:63,
  P:{A:[1541.74,1382.68,0,1,'f'],B:[1541.74,895.18,0,-1,'b'],C:[1867.6,1382.68,0,1,'f'],D:[1867.6,895.18,0,-1,'b'],E:[2192.03,1382.68,0,1,'f'],F:[2192.03,895.18,0,-1,'b']}},
 '4':{led:[531,227,22,13],ledPoly:[[470,224],[527,199],[594,227],[533,255]],img:'img/pf/hub4.webp',WH:[1003,846],M:[[0.508856, 0.519224, -1521.952875], [-0.248186, 0.252122, 425.916552]],K:42/103.198,AZ:103.198,
  P:{A:[1950.0,1746.15,-1,0,'ab'],B:[1950.0,1420.86,-1,0,'ab'],C:[2762.5,1420.86,1,0,'cd'],D:[2762.5,1746.15,1,0,'cd']}}};
// the user's connectors, cut straight from his drawings of a connector on the hub (6.0: his close-ups of a connector on B and on C; 4.0: on C) and from
// his motor drawing (4.0 A/B). Each drawing is laid over the hub picture with one straight transform found from the hub
// itself, so the connector sits exactly where he drew it; the other ports get the same picture moved by the port spacing.
// 6.0: b = B D F (cable to the back), f = A C E (to the front); 4.0: ab = A B (mouth to the A/B end), cd = C D (to the C/D end)
var PLUGS={b:{W:429,H:367,ex:[40,95]},f:{W:439,H:334,ex:[372,252]},cd:{W:394,H:347,ex:[280,140]},ab:{W:391,H:318,ex:[110,184]}};
// where each port's connector picture sits on the hub picture (svg matrix a b c d e f, hub picture px)
var PLUGM={'6':{A:[0.5850,0,0,0.5850,284.98,174.00],B:[0.5750,0,0,0.5750,164.98,94.00],C:[0.5800,0,0,0.5800,409.98,110.00],D:[0.5750,0,0,0.5750,288.98,30.00],E:[0.5800,0,0,0.5800,533.98,47.00],F:[0.5750,0,0,0.5750,412.98,-33.00]},'4':{A:[1.5113,0.0000,0.0000,1.5113,97.7682,104.6731],B:[1.5113,0.0000,0.0000,1.5113,-78.0063,2.8068],   /* A/B slid ~0.35 stud away from the push button so it and its LED stay visible */
 C:[1.4500,0.0012,-0.0012,1.4500,301.1719,-181.3803],D:[1.4500,0.0012,-0.0012,1.4500,469.9258,-99.4378]}};
var HKIND='',HIMG='',PORTS={};
// stacked connector: a second plug pressed onto the first (same channel); its key is the port letter + '2'
function isStk(k){return k&&k.length===2&&k.charAt(1)==='2'}
function baseOf(k){return isStk(k)?k.charAt(0):k}
function part2At(i){return (Array.isArray(C.pf2)&&C.pf2[i])||''}
var STKH={'6':.98,'4':.98};   // rise of a stacked plug, in studs (one connector height)
function stackPorts(){var h=HUBS[HKIND];PORTS={};Object.keys(h.P).forEach(function(k){PORTS[k]=h.P[k]});
 Object.keys(SLOT).forEach(function(k){if(isStk(k)){delete SLOT[k];delete POS0[k]}});
 Object.keys(ST).forEach(function(k){if(!isStk(k)) return;var b=baseOf(k);PORTS[k]=h.P[b];SLOT[k]=SLOT[b];POS0[k]=POS0[b].slice()})}
function hubKind(){var k=isMk4(WR.slot)?'4':'6',h=HUBS[k];HM=h.M;HK=h.K;HWH=h.WH;HIMG=h.img;PORTS=h.P;AZ=[0,-HK*h.AZ];CW=STUD*.6;   // one cable width for every hub (about 0.6 stud, true scale)
 if(HKIND!==k){HKIND=k;slotsFor(k)}stackPorts()}
function W(x,y,z){return [HP[0]+HK*(HM[0][0]*x+HM[0][1]*y+HM[0][2])+(z-HZ)*AZ[0],HP[1]+HK*(HM[1][0]*x+HM[1][1]*y+HM[1][2])+(z-HZ)*AZ[1]]}
function pt(q){return q[0].toFixed(1)+','+q[1].toFixed(1)}
function poly(ps,fill,extra){return '<polygon points="'+ps.map(pt).join(' ')+'" fill="'+fill+'" stroke="#0b0c0e" stroke-width="4.5" stroke-linejoin="round"'+(extra||'')+'/>'}
// matrix that draws hub-drawing px onto the plane z (top face of the hub or of a plug)
function topM(z){var a=HK*HM[0][0],b=HK*HM[1][0],c=HK*HM[0][1],d=HK*HM[1][1],o=W(0,0,z);return 'matrix('+[a,b,c,d,o[0],o[1]].map(function(v){return v.toFixed(5)}).join(' ')+')'}
// a stud (cylinder) standing on plane z at hub px (x,y), radius r px, height h studs
function stud3(x,y,z,r,h,cs,ct){var o='',n=7;for(var i=0;i<=n;i++){var zz=z+h*i/n;o+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+cs+'" '+(i===0?'stroke="#0b0c0e" stroke-width="13"':'')+' transform="'+topM(zz)+'"/>'}
 return o+'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+ct+'" stroke="#0b0c0e" stroke-width="12" transform="'+topM(z+h)+'"/>'+
  '<circle cx="'+x+'" cy="'+y+'" r="'+(r*.62)+'" fill="none" stroke="#0b0c0e" stroke-width="5" opacity=".35" transform="'+topM(z+h)+'"/>'+
  '<path d="M'+(x-r*.7)+' '+(y-r*.25)+' a'+(r*.75)+' '+(r*.75)+' 0 0 1 '+(r*.45)+' '+(-r*.5)+'" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".9" transform="'+topM(z+h)+'"/>'}
// a hole on a vertical face: face spanned by axis e1 (screen per unit) and up; centre c (screen), radius in face units
function hole(c,e1,r,dark){var M='matrix('+e1[0]+' '+e1[1]+' '+AZ[0]+' '+AZ[1]+' '+c[0].toFixed(1)+' '+c[1].toFixed(1)+')';
 return '<g transform="'+M+'"><circle r="'+r+'" fill="url(#'+(dark?'holeD':'holeL')+')" stroke="#0b0c0e" stroke-width="0.075"/><circle r="'+(r*.64)+'" fill="url(#holeIn)" stroke="#0b0c0e" stroke-width="0.055"/>'+
  '<path d="M'+(-r*.5)+' '+(r*.1)+' a'+(r*.55)+' '+(r*.55)+' 0 0 1 '+(r*.42)+' '+(-r*.48)+'" stroke="#fff" stroke-width="0.035" fill="none" stroke-linecap="round" opacity=".85"/></g>'}
function cross(c,e1,r){var M='matrix('+e1[0]+' '+e1[1]+' '+AZ[0]+' '+AZ[1]+' '+c[0].toFixed(1)+' '+c[1].toFixed(1)+')',w=r*.36;
 return '<path d="M'+(-w)+' '+(-r)+'H'+w+'V'+(-w)+'H'+r+'V'+w+'H'+w+'V'+r+'H'+(-w)+'V'+w+'H'+(-r)+'V'+(-w)+'H'+(-w)+'Z" fill="#1b1d21" stroke="#0b0c0e" stroke-width="0.04" transform="'+M+'"/>'}
function hub3d(){var c=[HP[0]+HWH[0]*HK*.5,HP[1]+HWH[1]*HK*.93];
 return '<ellipse cx="'+c[0]+'" cy="'+c[1]+'" rx="'+(HWH[0]*HK*.46)+'" ry="'+(HWH[1]*HK*.09)+'" fill="#000" opacity=".55" filter="url(#soft)"/>'+
  '<image class="hubg" href="'+HIMG+'" x="'+HP[0].toFixed(1)+'" y="'+HP[1].toFixed(1)+'" width="'+(HWH[0]*HK)+'" height="'+(HWH[1]*HK)+'"/>'+(HKIND==='4'?'':hubLed())}
// blue status LED next to the USB port (6.0) or inside the middle push button (4.0): it blinks the hub's number (hub 1 once, hub 2 twice, hub 3 three times,
// quickly) and pauses, with a blue glow pulse on every blink
function hubLed(){var h=HUBS[HKIND];if(!h||!h.led) return '';var hm=(C.hubs&&C.hubs[WR.slot|0]>=0)?C.hubs[WR.slot|0]:(WR.slot|0),n=Math.max(1,Math.min(3,hm+1)),c=[HP[0]+HK*h.led[0],HP[1]+HK*h.led[1]],rx=HK*h.led[2],ry=HK*h.led[3];
 // smooth blink: quick rise, short hold, soft fall; n blinks then a pause
 var step=.26,dur=n*step+.9,rise=.04,hold=.07,fall=.1,kt=[0],vs=[0];
 for(var i=0;i<n;i++){var t=i*step;kt.push((t)/dur,(t+rise)/dur,(t+rise+hold)/dur,(t+rise+hold+fall)/dur);vs.push(0,1,1,0)}
 kt.push(1);vs.push(0);
 var KT=kt.map(function(v){return v.toFixed(4)}).join(';');
 WR.ledK={kt:kt,vs:vs,dur:dur};
 // the blink is driven from the frame loop (style.opacity), so it runs the same on every WebView; data-hi is the peak opacity
 function an(attr,lo,hi){return ''}
 var big=h.ledPoly?2.6:7.5,id='led'+HKIND,cx=c[0].toFixed(1),cy=c[1].toFixed(1);
 var o='<g class="hubled" data-slot="'+(WR.slot|0)+'" pointer-events="none" style="display:'+(hubLinkUp()?'':'none')+'"><defs>'+
  '<radialGradient id="'+id+'h"><stop offset="0" stop-color="#5fd4ff" stop-opacity=".9"/><stop offset=".35" stop-color="#1f7bff" stop-opacity=".55"/><stop offset=".7" stop-color="#2b3cff" stop-opacity=".18"/><stop offset="1" stop-color="#2b3cff" stop-opacity="0"/></radialGradient>'+
  '<radialGradient id="'+id+'c"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d8f4ff"/><stop offset=".75" stop-color="#3fb6ff"/><stop offset="1" stop-color="#0a6cff"/></radialGradient>'+
  '<filter id="'+id+'b" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="'+(rx*.9).toFixed(1)+'"/></filter></defs>';
 // wide soft halo and a tighter bloom, both breathing with each blink
 o+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(rx*big*1.5).toFixed(1)+'" ry="'+(rx*big*1.1).toFixed(1)+'" fill="url(#'+id+'h)" class="lb" data-hi=".85" opacity="0">'+an('opacity',0,.85)+'</ellipse>';
 o+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(rx*2.2).toFixed(1)+'" ry="'+(ry*2.2).toFixed(1)+'" fill="#3aa8ff" filter="url(#'+id+'b)" class="lb" data-hi=".9" opacity="0">'+an('opacity',0,.9)+'</ellipse>';
 if(h.ledPoly){var pts=h.ledPoly.map(function(q){return (HP[0]+HK*q[0]).toFixed(1)+','+(HP[1]+HK*q[1]).toFixed(1)}).join(' ');
  // 4.0: the LED lights the push button from inside
  o+='<polygon points="'+pts+'" fill="url(#'+id+'c)" stroke="#7fd8ff" stroke-width="1.2" stroke-linejoin="round" class="lb" data-hi=".92" opacity="0">'+an('opacity',0,.92)+'</polygon>';}
 else{
  o+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+'" fill="#0b2f6b" stroke="#0b0c0e" stroke-width="1"/>';
  o+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+'" fill="url(#'+id+'c)" class="lb" data-hi="1" opacity="0">'+an('opacity',0,1)+'</ellipse>';
  o+='<ellipse cx="'+(c[0]-rx*.3).toFixed(1)+'" cy="'+(c[1]-ry*.35).toFixed(1)+'" rx="'+(rx*.35).toFixed(1)+'" ry="'+(ry*.3).toFixed(1)+'" fill="#ffffff" opacity=".35"/>';}
 return o+'</g>'}
// plug footprint: 2 x 2 studs, width = port pitch so plugs touch; contact half over the port, stud half over the two hub studs
// PF plug, 2 x 2 studs: contact half on the port, stud half on the two studs inward, cable leaving from the contact end.
// Drawn in the plug's own frame on the hub plan: a along the port (side s), b along the cable way (o); the hub picture decides the view.
var PLW=162.5,PLI=243.75,PLO=81.25;
function plg(k){var q=PORTS[k];return {p:[q[0],q[1]],o:[q[2],q[3]],s:[-q[3],q[2]]}}
function LP(g,a,b){return [g.p[0]+g.s[0]*a+g.o[0]*b,g.p[1]+g.s[1]*a+g.o[1]*b]}
// where a connector picture sits on screen for port k: scale c, shift tx, ty
function plugT(k){var P=PLUGS[PORTS[k][4]],q=PLUGM[HKIND][baseOf(k)];if(isStk(k)){q=q.slice();q[5]-=STKH[HKIND]*HUBS[HKIND].AZ}
 return {P:P,q:q,m:[HK*q[0],HK*q[1],HK*q[2],HK*q[3],HP[0]+HK*q[4],HP[1]+HK*q[5]]}}
function plugPt(T,x,y){var m=T.m;return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]}
function plugExit(k){var g=plg(k),c=LP(g,0,PLO),z=HZ+PZ*.32,p=W(c[0],c[1],z),q=W(c[0]+g.o[0]*100,c[1]+g.o[1]*100,z),dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1;
 var T=plugT(k);if(T.P.ex) p=plugPt(T,T.P.ex[0],T.P.ex[1]);
 return {x:p[0],y:p[1],ox:dx/l,oy:dy/l,top:!!(SLOT[k]&&SLOT[k].top)}}
// colour tag on the plug head, drawn in the plug picture's own pixels so it follows the plug exactly
var PTAG={f:{c:[348,146],a:[100,-54.4],b:[63,32.7],sa:.47,sb:.45},b:{c:[86,46],a:[101.7,-55.3],b:[63,32.7],sa:.45,sb:.40},
 ab:{c:[130,140],a:[53,28],b:[-38,20],sa:.38,sb:.32},cd:{c:[264.5,102],a:[56,27],b:[-37,23],sa:.4,sb:.4}};   // 4.0: on the plug's cable-end top
function plugTag(k,T){if(ST[k+'2']&&ST[k+'2'].t) return '';var L0=baseOf(k),t=PTAG[PORTS[k][4]],col=PCOL[L0];if(!t||!col) return '';
 var P=function(i,j){return plugPt(T,t.c[0]+i*t.a[0]+j*t.b[0],t.c[1]+i*t.a[1]+j*t.b[1])},A=t.sa,B=t.sb;
 var q=[P(-A,-B),P(A,-B),P(A,B),P(-A,B)].map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ');
 var o=P(0,0),ux=P(1,0),vy=P(0,1),la=[(ux[0]-o[0]),(ux[1]-o[1])],lb=[(vy[0]-o[0]),(vy[1]-o[1])],na=Math.hypot(la[0],la[1]),fs=Math.hypot(lb[0],lb[1])*B*1.35;
 var m=[la[0]/na,la[1]/na,lb[0]/Math.hypot(lb[0],lb[1]),lb[1]/Math.hypot(lb[0],lb[1]),o[0],o[1]].map(function(v){return v.toFixed(4)}).join(' ');
 return '<polygon points="'+q+'" fill="'+col+'" stroke="#111" stroke-width="'+(HK*3).toFixed(2)+'" stroke-linejoin="round" pointer-events="none"/>'+
  '<text transform="matrix('+m+')" x="0" y="'+(fs*.36).toFixed(1)+'" text-anchor="middle" font-size="'+fs.toFixed(1)+'" font-weight="800" fill="'+pcolInk(col)+'" font-family="Inter,Arial" pointer-events="none">'+L0+'</text>'}
function plugSvg(k){var g=plg(k),P=PLUGS[PORTS[k][4]],cn=[LP(g,-PLW,-PLI),LP(g,PLW,-PLI),LP(g,PLW,PLO),LP(g,-PLW,PLO)];
 var T=plugT(k);
 return '<image href="img/pf/plug_'+PORTS[k][4]+'.webp" width="'+P.W+'" height="'+P.H+'" transform="matrix('+T.m.map(function(v){return v.toFixed(4)}).join(' ')+')" pointer-events="none"/>'+
  plugTag(k,T)+'<polygon class="sock" data-p="'+k+'" points="'+cn.map(function(c){return W(c[0],c[1],HZ+PZ)}).map(pt).join(' ')+'" fill="transparent" style="cursor:pointer"'+(isStk(k)?' transform="translate(0 '+(-STKH[HKIND]*HUBS[HKIND].AZ*HK).toFixed(1)+')"':'')+'/>'}
function portHit(k){var q=PORTS[k],c=W(q[0],q[1],HZ);return '<circle class="sock" data-p="'+k+'" cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="44" fill="transparent" style="cursor:pointer"/>'}
// cables that leave a plug up the screen pass behind the plugs, the others in front
var CABB=[],CABF=[];
function cabSides(){CABB=[];CABF=[];Object.keys(PORTS).forEach(function(k){if(!ST[k]||ST[k].na) return;(plugExit(k).oy<0&&PORTS[k][4]!=='ab'?CABB:CABF).push(k)})}
var CW=SS*.62;   // cable width taken from the diagram: four cores fill the plug's cable tab

function roundRun(P,r){var out=[P[0]];
 for(var i=1;i<P.length-1;i++){var a=P[i-1],c=P[i],b=P[i+1],d1=Math.hypot(c[0]-a[0],c[1]-a[1]),d2=Math.hypot(b[0]-c[0],b[1]-c[1]),rr=Math.min(r,d1/2,d2/2);
  if(rr<1){out.push(c);continue}var p=[c[0]+(a[0]-c[0])/d1*rr,c[1]+(a[1]-c[1])/d1*rr],q=[c[0]+(b[0]-c[0])/d2*rr,c[1]+(b[1]-c[1])/d2*rr];
  for(var t=0;t<=12;t++){var u=t/12,v=1-u;out.push([v*v*p[0]+2*v*u*c[0]+u*u*q[0],v*v*p[1]+2*v*u*c[1]+u*u*q[1]])}}
 out.push(P[P.length-1]);
 // even spacing so the core offsets stay smooth
 var res=[out[0]],acc=0;for(var i=1;i<out.length;i++){var a=out[i-1],b=out[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.01) continue;var n=Math.max(1,Math.round(l/6));for(var j=1;j<=n;j++) res.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}
 return res}

// obstacle-aware orthogonal router: leave the plug straight out, then take the cheapest of a few square routes that keep clear of the hub and the motors
function segHit(a,b,r){var x0=r[0],y0=r[1],x1=r[2],y1=r[3],t0=0,t1=1,dx=b[0]-a[0],dy=b[1]-a[1],P=[-dx,dx,-dy,dy],Q=[a[0]-x0,x1-a[0],a[1]-y0,y1-a[1]];
 for(var i=0;i<4;i++){if(P[i]===0){if(Q[i]<0) return false}else{var t=Q[i]/P[i];if(P[i]<0){if(t>t1) return false;if(t>t0) t0=t}else{if(t<t0) return false;if(t<t1) t1=t}}}return t1-t0>.02}
function routeOf(k,off){var t=ST[k].t,f=fit(t,k),ex=EXIT[t],e=plugExit(k),A=[e.x,e.y],B=[f.x+ex[0]*f.w,f.y+ex[1]*f.h],G=SS*.5;
 var pk=PORTS[k]&&PORTS[k][4],lead=pk==='ab'?1.2:e.top?.75:1.7,rt=pk==='ab'?-.5236:e.top?0:.3491,ux=e.ox*Math.cos(rt)-e.oy*Math.sin(rt),uy=e.ox*Math.sin(rt)+e.oy*Math.cos(rt),p1=[A[0]+ux*SS*lead,A[1]+uy*SS*lead],Bq=[B[0]+SS*.7,B[1]],H=HUBR,back=!!e.top;
 var L=back?H[1]-SS*.6-off*G:H[3]+SS*.6+off*G,Lo=back?H[3]+SS*.6+off*G:H[1]-SS*.6-off*G,xl=H[0]-SS*.6-off*G,xr=H[2]+SS*.6+off*G;
 var C=[[p1,[p1[0],Bq[1]],Bq],[p1,[p1[0],L],[Bq[0],L],Bq]];
 [xl,xr].forEach(function(xs){C.push([p1,[p1[0],L],[xs,L],[xs,Bq[1]],Bq]);C.push([p1,[p1[0],L],[xs,L],[xs,Lo],[Bq[0],Lo],Bq])});
 var best=null,bs=1e18;
 C.forEach(function(P){var len=0,hit=0;for(var i=0;i<P.length-1;i++){len+=Math.abs(P[i+1][0]-P[i][0])+Math.abs(P[i+1][1]-P[i][1]);
   if(i===1){var dy=P[2]?P[2][1]-P[1][1]:0;if(back?dy>1:dy<-1) hit+=1}else if(i>1&&segHit(P[i],P[i+1],H)) hit+=1;
   Object.keys(ST).forEach(function(q){if(!ST[q].t) return;var g=fit(ST[q].t,q),r=[g.x+g.w*.08,g.y+g.h*.12,g.x+g.w*.92,g.y+g.h*.88];if(segHit(P[i],P[i+1],r)) hit+=q===k?.6:.35})}
  var sc=len+hit*4000+P.length*25;if(sc<bs){bs=sc;best=P}});
 return [A].concat(best,[B])}
function cableGeom(k){var pts=roundRun(ROUTES[k],SS*.75);
 function off(o){var out=[];for(var i=0;i<pts.length;i++){var a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],tx=b[0]-a[0],ty=b[1]-a[1],l=Math.hypot(tx,ty)||1;out.push([pts[i][0]-ty/l*o,pts[i][1]+tx/l*o])}return 'M'+out.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1)}).join(' L')}
 var c=[],h=[],step=CW/4;for(var n=0;n<4;n++){var o=(n-1.5)*step;c.push(off(o));h.push(off(o-step*.25))}
 return {d:off(0),cores:c,hi:h}}
var ROUTES={},HUBR=[0,0,0,0],HUBOV=null;
function routeAll(){
 function X(a,b,c,d){function o(p,q,r){return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])}return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0}
 function cross(Rr){var n=0,ks=Object.keys(Rr);for(var i=0;i<ks.length;i++)for(var j=i+1;j<ks.length;j++){var P=Rr[ks[i]],Q=Rr[ks[j]];for(var a=0;a<P.length-1;a++)for(var b=0;b<Q.length-1;b++) if(X(P[a],P[a+1],Q[b],Q[b+1])) n++}return n}
 var perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];ROUTES={};
 function lane(ks,pm,k){var b=ks.filter(function(q){return !isStk(q)}),j=b.indexOf(k);return j>=0?pm[j]:3+ks.filter(isStk).indexOf(k)}
 [Object.keys(SLOT).filter(function(k){return SLOT[k].top}),Object.keys(SLOT).filter(function(k){return !SLOT[k].top})].forEach(function(g){var ks=g.filter(function(k){return ST[k].t}),best=null,bn=1e9;
  perms.forEach(function(pm){var Rr={};ks.forEach(function(k){Rr[k]=routeOf(k,lane(ks,pm,k))});var all={};for(var q in ROUTES) all[q]=ROUTES[q];for(var q2 in Rr) all[q2]=Rr[q2];var n=cross(all)*1000;ks.forEach(function(k){var P=Rr[k];for(var i=0;i<P.length-1;i++) n+=(Math.abs(P[i+1][0]-P[i][0])+Math.abs(P[i+1][1]-P[i][1]))/1000});if(n<bn){bn=n;best=Rr}});
  if(best) for(var k in best) ROUTES[k]=best[k]})}
var GR3='<linearGradient id="hTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef0f2"/><stop offset="1" stop-color="#dcdfe3"/></linearGradient>'+
 '<linearGradient id="hbC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d9299"/><stop offset="1" stop-color="#4b5056"/></linearGradient>'+
 '<linearGradient id="hcC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef0f2"/><stop offset="1" stop-color="#b9bec4"/></linearGradient>'+
 '<linearGradient id="hvF" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3e6e9"/></linearGradient>'+
 '<linearGradient id="hvE" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd3d8"/><stop offset="1" stop-color="#e8eaed"/></linearGradient>'+
 '<radialGradient id="holeL" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#c3c7cc"/><stop offset="1" stop-color="#8a9097"/></radialGradient>'+
 '<radialGradient id="holeD" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#b8bdc4"/><stop offset=".55" stop-color="#6c7178"/><stop offset="1" stop-color="#34383d"/></radialGradient>'+
 '<radialGradient id="holeIn" cx="60%" cy="65%" r="70%"><stop offset="0" stop-color="#5c6168"/><stop offset=".7" stop-color="#202327"/><stop offset="1" stop-color="#0f1113"/></radialGradient>'+'<linearGradient id="hbF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f4349"/><stop offset=".22" stop-color="#7b8087"/><stop offset=".38" stop-color="#a8adb3"/><stop offset=".55" stop-color="#5d6268"/><stop offset="1" stop-color="#383c41"/></linearGradient>'+
 '<linearGradient id="hbE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34383d"/><stop offset=".3" stop-color="#5f646b"/><stop offset=".45" stop-color="#7f848b"/><stop offset=".65" stop-color="#474b51"/><stop offset="1" stop-color="#2c2f33"/></linearGradient>'+
 '<linearGradient id="hcF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#eceef1"/><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#cdd1d6"/></linearGradient>'+
 '<linearGradient id="hcE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dbe0"/><stop offset=".45" stop-color="#bfc4ca"/><stop offset="1" stop-color="#9fa5ac"/></linearGradient>'+
 '<linearGradient id="plF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e7278"/><stop offset="1" stop-color="#53575d"/></linearGradient>'+
 '<linearGradient id="plE" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4c5055"/><stop offset="1" stop-color="#383b40"/></linearGradient>'+
 '<linearGradient id="plT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a6e74"/><stop offset="1" stop-color="#585c62"/></linearGradient>';
// cable length along the drawn route: U scene units = 1 stud = 0.8 cm

function cableCm(k){var P=ROUTES[k];if(!P) return 0;var L=0;for(var i=1;i<P.length;i++) L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);return L/SU*.8}
function cableMax(k){var i=ST[k].i;return (Array.isArray(C.pcl)&&C.pcl[i]===50)?50:20}
function cabSvg(k){if(!ST[k].t||!ROUTES[k]) return '';var g=cableGeom(k),lng=cableCm(k)>cableMax(k),core=lng?['#4a1214','#5e171a','#4a1214','#5e171a']:['#13233a','#172a45','#13233a','#172a45'],s='';
 s+='<path d="'+g.d+'" stroke="#03060a" stroke-width="'+(CW+5)+'" fill="none" stroke-linecap="butt" stroke-linejoin="round" opacity=".6" transform="translate(3 5)"/>'+
  '<path d="'+g.d+'" stroke="#05080d" stroke-width="'+(CW+4)+'" fill="none" stroke-linecap="butt" stroke-linejoin="round"/>';
 g.cores.forEach(function(c,n){s+='<path d="'+c+'" stroke="'+core[n]+'" stroke-width="'+(CW/4-.4)+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'});
 g.hi.forEach(function(c){s+='<path d="'+c+'" stroke="'+(lng?'#ff8a88':'#5f86b8')+'" stroke-width="1.3" fill="none" opacity=".8"/>'});
 // live cable: pulses of light run from the hub to the part (back to the hub in reverse), faster with more power
 return s+'<path id="cf'+k+'" d="'+g.d+'" stroke="#1D9E75" stroke-width="'+(CW*.62)+'" fill="none" stroke-linecap="round" stroke-dasharray="12 30" opacity="0"/>'+
  '<path id="cg'+k+'" d="'+g.d+'" stroke="#fff6c2" stroke-width="'+(CW*.2)+'" fill="none" stroke-linecap="round" stroke-dasharray="12 30" opacity="0"/>'}
function layout(){
 AX=[HK*HM[0][0]*162,HK*HM[1][0]*162];AY=[HK*HM[0][1]*162,HK*HM[1][1]*162];
 var hc=HUBOV||(C.pfp&&C.pfp[NMAX+WR.slot])||[680,745];HP=[hc[0]-HWH[0]*HK/2,hc[1]-HWH[1]*HK/2];var xs=[HP[0],HP[0]+HWH[0]*HK],ys=[HP[1]-PZ*SS,HP[1]+HWH[1]*HK];
 var top=Math.min.apply(0,ys)+O3[1],bot=Math.max.apply(0,ys)+O3[1];
 HUBR=[Math.min.apply(0,xs)+O3[0],top,Math.max.apply(0,xs)+O3[0],bot];
 routeAll();
}
slotsFor('6');Object.keys(POS0).forEach(function(k){POS[k]=POS0[k].slice()});
var PARTS={m:'Motor M',l:'Motor L',xl:'Motor XL',bg:'Buggy motor',sv:'Servo',lt:'LED lights',mk_m:'MK Motor M',mk_l:'MK Motor L',mk_xl:'MK Motor XL',mk_sv:'MK Servo'};

function render(){hubKind();layout();var s='<defs>'+DEFS.replace(/^<defs>|<\/defs>$/g,'')+'<radialGradient id="lampG"><stop offset="0" stop-color="#fff8d0" stop-opacity="1"/><stop offset=".35" stop-color="#ffd84a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient></defs>';
 // LEGO baseplate background (1 stud pitch = U) so the true scale reads at a glance
 s+='<rect x="0" y="0" width="1360" height="1560" fill="url(#plate)"/>';
 // empty ports: a dashed spot where a part can be dropped; filled ports: a soft floor shadow under the part
 Object.keys(SLOT).forEach(function(k){var has=!!ST[k].t,c=POS[k];
  if(has){var f=fit(ST[k].t,k);s+='<g id="sh'+k+'"><ellipse cx="'+(f.x+f.w/2)+'" cy="'+(f.y+f.h*.9)+'" rx="'+(f.w*.48)+'" ry="'+(f.h*.13)+'" fill="#000" opacity=".45" filter="url(#soft)"/></g>'}
  else s+='<g class="slot" data-p="'+k+'"><rect class="dz" x="'+(c[0]-170)+'" y="'+(c[1]-110)+'" width="340" height="220" rx="28" fill="rgba(255,255,255,.02)" stroke="#3a414d" stroke-width="2.5" stroke-dasharray="10 10"/>'+
   '<circle cx="'+c[0]+'" cy="'+c[1]+'" r="46" fill="#1a1e26" stroke="#3a414d" stroke-width="2.5"/><text x="'+c[0]+'" y="'+(c[1]+18)+'" font-size="54" text-anchor="middle" fill="#59606c" font-family="Inter,Arial">+</text>'+
   '<text x="'+c[0]+'" y="'+(c[1]+90)+'" font-size="26" font-weight="800" text-anchor="middle" fill="#59606c" font-family="Inter,Arial">'+k+' · '+tr2('Empty')+'</text></g>'});
 // hub: drawn in 3D
 s+=hub3d();
 // cables: flat 4-core PF cable, drawn as four parallel cores along the cable centre line
 function cab(k){s+=cabSvg(k)}
 
 // back row first (cables leave behind the plugs), then the front row with its cables on top
 cabSides();s+='<g id="cabB" pointer-events="none">';CABB.forEach(function(k){cab(k)});s+='</g>';
 // plugs back to front, so a nearer plug overlaps the one behind it
 Object.keys(PORTS).filter(function(k){return ST[k]&&!ST[k].na}).sort(function(a,b){return W(PORTS[a][0],PORTS[a][1],HZ)[1]-W(PORTS[b][0],PORTS[b][1],HZ)[1]||(isStk(a)?1:0)-(isStk(b)?1:0)}).forEach(function(k){s+=ST[k].t?plugSvg(k):portHit(k)});
 // front cables leave the slot at the bottom of the connector's front face, straight out toward the viewer (as in the user's drawing)
 s+='<g id="cabF" pointer-events="none">';CABF.forEach(function(k){cab(k)});s+='</g>';
 if(HKIND==='4') s+=hubLed();   // 4.0: the button LED shows over the connectors around it
 // scale bar: 5 studs = 4 cm
 s+='<g transform="translate(30 1553)"><path d="M0 0h'+(5*SU)+'M0 -8v16M'+(5*SU)+' -8v16" stroke="#8a93a0" stroke-width="2"/>';for(var q=1;q<5;q++) s+='<path d="M'+(q*SU)+' -4v8" stroke="#8a93a0" stroke-width="1.5"/>';
 s+='<text x="'+(5*SU+14)+'" y="8" font-size="22" fill="#8a93a0" font-family="Inter,Arial" font-weight="700">'+tr2('5 studs = 4 cm')+'</text></g>';
 // parts, each with its × and its label; these three move together while a part is dragged
 Object.keys(SLOT).filter(function(k){return ST[k].t}).sort(function(a,b){var fa=fit(ST[a].t,a),fb=fit(ST[b].t,b);return (fa.y+fa.h)-(fb.y+fb.h)}).forEach(function(k){
  s+='<g id="mvP'+k+'">'+partSvg(k)+'</g>';});
 // label: port letter and part on the first line, the channel's own name on the second
 Object.keys(SLOT).forEach(function(k){var t=ST[k].t;if(!t) return;var txt=tr2(PARTS[t]),nm=String((C.ch[ST[k].i]||{}).name||''),fs=26,w=58+Math.max(txt.length*fs*.56,nm.length*(fs-3)*.55),f=fit(t,k),x=f.x+f.w/2-w/2,y=f.y+f.h+4;
  s+='<g id="mvL'+k+'" pointer-events="none"><rect x="'+x+'" y="'+y+'" width="'+w.toFixed(0)+'" height="'+(nm?72:42)+'" rx="21" fill="#0d1014" fill-opacity=".86" stroke="#3a414d" stroke-width="2"/>'+
   '<text x="'+(x+16)+'" y="'+(y+30)+'" font-size="'+fs+'" font-weight="900" fill="'+(PCOL[baseOf(k)]||'#ffd84a')+'" font-family="Inter,Arial">'+baseOf(k)+'</text>'+
   '<text x="'+(x+46)+'" y="'+(y+30)+'" font-size="'+(fs-2)+'" font-weight="700" fill="#e8e8ea" font-family="Inter,Arial">'+txt+'</text>'+
   (nm?'<text class="lbn" x="'+(x+46)+'" y="'+(y+60)+'" font-size="'+(fs-3)+'" font-weight="700" fill="#ffd84a" font-family="Inter,Arial">'+wesc(nm)+'</text>':'')+'</g>'});
 s=s.replace('<defs>','<defs>'+GR3+'<radialGradient id="btnBlk" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#4a4e55"/><stop offset=".55" stop-color="#1a1c20"/><stop offset="1" stop-color="#08090b"/></radialGradient><pattern id="plate" width="'+U+'" height="'+U+'" patternUnits="userSpaceOnUse" x="'+(HX%U)+'" y="'+(HY%U)+'"><rect width="'+U+'" height="'+U+'" fill="#232a35"/><circle cx="'+U/2+'" cy="'+(U/2+2)+'" r="'+(U*.3)+'" fill="#1a2029"/><circle cx="'+U/2+'" cy="'+U/2+'" r="'+(U*.3)+'" fill="#2a323f" stroke="#343e4c" stroke-width="1.5"/></pattern><filter id="soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="10"/></filter><linearGradient id="plugTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a7079"/><stop offset=".5" stop-color="#50555d"/><stop offset="1" stop-color="#3a3e45"/></linearGradient><radialGradient id="studD" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#8a919b"/><stop offset=".6" stop-color="#555a62"/><stop offset="1" stop-color="#34383e"/></radialGradient><linearGradient id="plugG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a818b"/><stop offset=".5" stop-color="#4b5059"/><stop offset="1" stop-color="#2e3238"/></linearGradient>');
 WR.svg.innerHTML=s;WR.svg.classList.toggle('mk4',isMk4(WR.slot));wireEvents();
 // an empty spot also opens on a plain click (keyboard, accessibility tools)
 [].forEach.call(WR.svg.querySelectorAll('.slot'),function(g){g.addEventListener('click',function(){wrOpen(g.getAttribute('data-p'))})});
}

// ======================================================================
// Ports of the shown hub
//   letter A-F  ->  channel index i = hub slot * 6 + port number
//   part        ->  C.pf[i]   (m, l, xl, bg, sv, lt or '' for nothing)
//   spot        ->  C.pfp[i]  (where the part was dragged to), else its default spot
// ST[letter] also keeps the live animation state of that port.
// ======================================================================
var ST={};
function partAt(i){return (Array.isArray(C.pf)&&C.pf[i])||''}
function wrBuildST(){var old=ST;ST={};hubKind();
 for(var p=0;p<PER;p++){var k=LT.charAt(p),i=WR.slot*PER+p,na=isMk4(WR.slot)&&p>=4,t=na?null:(partAt(i)||null),o=old[k];
  var keep=o&&o.i===i&&o.t===t;
  // na: the port does not exist on this hub (E and F on a Mould King 4.0)
  ST[k]={t:t,i:i,na:na,v:keep?o.v:0,w:keep?o.w:0,ang:keep?o.ang:0,flow:0,idle:false};
  var sp=C.pfp&&C.pfp[i];POS[k]=Array.isArray(sp)?sp.slice():(POS0[k]||[680,745]).slice();if(t) inView(k)}
 for(var p2=0;p2<PER;p2++){var b=LT.charAt(p2),i2=WR.slot*PER+p2,t2=part2At(i2);if(!ST[b]||ST[b].na||!ST[b].t||!t2) continue;var k2=b+'2',o2=old[k2],kp=o2&&o2.i===i2&&o2.t===t2;
  ST[k2]={t:t2,i:i2,na:false,stk:true,v:kp?o2.v:0,w:kp?o2.w:0,ang:kp?o2.ang:0,flow:0,idle:false}}
 stackPorts();
 Object.keys(ST).forEach(function(k){if(!isStk(k)) return;var sp=C.pfp&&C.pfp[pfpKey(k)];POS[k]=Array.isArray(sp)?sp.slice():POS0[k].slice()});
 Object.keys(ST).forEach(function(k){var sp=C.pfp&&C.pfp[pfpKey(k)];if(ST[k].t&&!Array.isArray(sp)){POS[k]=pos0(k);inView(k)}})}
// saved spot of a part: channel index, or NMAX+3+channel for a stacked part
function pfpKey(k){return ST[k].stk?NMAX+3+ST[k].i:ST[k].i}
// keep the whole part, and its label under it, inside the picture so it can always be grabbed again
function inView(k){var t=ST[k].t;if(!t) return;var d=IMG[t],sc=partScale(t,d),w=d.W*sc,h=d.H*sc;
 POS[k]=[Math.max(w/2+8,Math.min(1352-w/2,POS[k][0])),Math.max(h/2+8,Math.min(1560-80-h/2,POS[k][1]))]}
function wrRender(){wrBuildST();render()}
function wake(){Object.keys(ST).forEach(function(q){ST[q].idle=false})}

// ======================================================================
// Touch: one handler for the whole picture.
//   tap  (finger moves < 12 px)          -> opens the port under the finger
//   drag a part (layout unlocked)        -> moves the part, cables re-route live
//   drag the hub or a plug (unlocked)    -> moves the hub with its plugs
//   layout locked                        -> taps only; any movement scrolls the page
// What is under the finger is found from data-p on the touched element, so a tap
// can only open the port of the shape that was touched (parts use their traced outline).
// ======================================================================
var HUB0=[680,745];
function svgPt(e){var p=WR.svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(WR.svg.getScreenCTM().inverse())}
function targetOf(el){var g=el&&el.closest?el.closest('.pt,.sock,.slot,.hubg'):null;if(!g) return null;var gp=g.getAttribute('data-p');if(gp&&ST[gp]&&ST[gp].na) return null;
 var kind=g.classList.contains('pt')?'part':g.classList.contains('hubg')?'hub':g.classList.contains('slot')?'empty':'plug';
 return {kind:kind,k:g.getAttribute('data-p')||null}}
function wireEvents(){if(WR.ev) return;WR.ev=true;var svg=WR.svg;
 svg.addEventListener('touchstart',function(e){var t=targetOf(e.target);if(t&&t.kind!=='empty'&&!store.prefs.wrlock) e.preventDefault()},{passive:false});
 svg.addEventListener('pointerdown',function(e){var t=targetOf(e.target);if(!t) return;
  var id=e.pointerId,x0=e.clientX,y0=e.clientY,drag=!store.prefs.wrlock&&t.kind!=='empty',q0=null,from=null,moved=false,raf=0;
  if(drag){e.preventDefault();q0=svgPt(e);from=t.kind==='part'?POS[t.k].slice():((C.pfp&&C.pfp[NMAX+WR.slot])||HUB0).slice()}
  function mv(ev){if(ev.pointerId!==id||!drag) return;var q=svgPt(ev),dx=q.x-q0.x,dy=q.y-q0.y;if(!moved&&Math.hypot(dx,dy)<14) return;moved=true;
   if(t.kind==='part') movePart(t.k,from,dx,dy);
   else{setHub(from,dx,dy);if(!raf) raf=requestAnimationFrame(function(){raf=0;render();wake()})}}
  function up(ev){if(ev.pointerId!==id) return;window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
   if(moved){if(t.kind==='part'){keepOffHub(t.k);savePos()}else save();render();wake();return}
   if(ev.type==='pointerup'&&t.k&&Math.hypot(ev.clientX-x0,ev.clientY-y0)<12) wrOpen(t.k)}
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)})}
function movePart(k,from,dx,dy){POS[k]=[from[0]+dx,from[1]+dy];inView(k);
 var mx=POS[k][0]-from[0],my=POS[k][1]-from[1];
 ['mvP','mvL','sh'].forEach(function(id){var el=WR.root.getElementById(id+k);if(el) el.setAttribute('transform','translate('+mx.toFixed(1)+' '+my.toFixed(1)+')')});
 routeAll();var b=WR.root.getElementById('cabB'),f=WR.root.getElementById('cabF');
 if(b) b.innerHTML=CABB.map(cabSvg).join('');if(f) f.innerHTML=CABF.map(cabSvg).join('');WR.idleReset=true}
function setHub(from,dx,dy){var hw=HWH[0]*HK/2,hh=HWH[1]*HK/2;if(!C.pfp||typeof C.pfp!=='object') C.pfp={};
 C.pfp[NMAX+WR.slot]=[Math.round(Math.max(hw,Math.min(1360-hw,from[0]+dx))),Math.round(Math.max(hh+40,Math.min(1560-hh,from[1]+dy)))]}
// a part dropped on the hub is pushed just off it, the shortest way
function keepOffHub(k){var f=fit(ST[k].t,k),H=HUBR,m=12;if(f.x>H[2]+m||f.x+f.w<H[0]-m||f.y>H[3]+m||f.y+f.h<H[1]-m) return;
 var d=[[H[0]-m-(f.x+f.w),0],[H[2]+m-f.x,0],[0,H[1]-m-(f.y+f.h)],[0,H[3]+m-f.y]].sort(function(a,b){return Math.abs(a[0]+a[1])-Math.abs(b[0]+b[1])})[0];
 POS[k]=[POS[k][0]+d[0],POS[k][1]+d[1]];inView(k)}
function savePos(){if(!C.pfp||typeof C.pfp!=='object') C.pfp={};Object.keys(ST).forEach(function(k){if(ST[k].t) C.pfp[pfpKey(k)]=[Math.round(POS[k][0]),Math.round(POS[k][1])]});save()}
function wrLockPaint(){var b=document.getElementById('wrLock'),on=!!store.prefs.wrlock,key=on+'|'+store.prefs.lang;if(WR.lk===key) return;WR.lk=key;
 if(b){b.setAttribute('aria-pressed',String(on));b.textContent=on?'🔒':'🔓';b.title=tr2(on?'Layout locked':'Layout unlocked');b.setAttribute('aria-label',b.title)}
 if(WR.svg) WR.svg.classList.toggle('lk',on);var h=document.querySelector('#wrCard .v2-h2s');if(h) v2T(h,tr2(on?'Tap a port':'Tap a port or drag a part'))}

// ======================================================================
// Live picture: every frame, each port follows what the hub really gets
// (rt.o with reverse applied): axles turn, a servo swings, LEDs glow, the
// cable shows light running hub -> part (part -> hub in reverse).
// ======================================================================
function hubGets(i){return Math.max(-100,Math.min(100,liveO(i)*(C.ch[i]&&C.ch[i].inv?-1:1)))}
function animPort(k,x,dt){var t=x.t,d=IMG[t],R=WR.root;
 var tgt=hubGets(x.i);x.v+=(tgt-x.v)*Math.min(1,dt*(t==='lt'?14:10));if(Math.abs(x.v)<.3&&!tgt) x.v=0;
 var f=Math.abs(x.v)/100,idle=!x.v&&!x.w&&(!isSvT(t)||Math.abs(x.ang)<.05);if(idle&&x.idle) return f;x.idle=idle;
 var trav=0;
 if(isSvT(t)){var step=Math.max(-300*dt,Math.min(300*dt,x.v*.9-x.ang));x.ang+=step;trav=step}
 else if(t!=='lt'){var wt=RPM[t]*6*x.v/100*VSPD;x.w+=(wt-x.w)*Math.min(1,dt/TAU[t]);if(Math.abs(x.w)<12&&!wt) x.w=0;trav=x.w/60;x.ang=(x.ang+x.w*dt)%360}
 // axle discs: up to LAY fading copies spread over the turn of this frame (motion blur)
 discsOf(d).forEach(function(e,q){var kk=k+(q?'_'+q:''),n=Math.max(1,Math.min(LAY,Math.ceil(Math.abs(trav)/6)));
  for(var j=0;j<LAY;j++){var el=R.getElementById('ly'+kk+'_'+j);if(!el) continue;
   if(j<n){var m=discMatrix(e,x.ang-(n>1?trav*(n-1-j)/(n-1):0));R.getElementById('cro'+kk+'_'+j).setAttribute('transform',m);R.getElementById('icp'+kk+'_'+j).setAttribute('transform',m);el.setAttribute('opacity',(1/(j+1)).toFixed(3))}
   else el.setAttribute('opacity',0)}
  var gl=R.getElementById('gl'+kk);if(gl){gl.setAttribute('stroke',f>.01?col(f):'none');gl.setAttribute('opacity',f>.01?(.35+f*.5):0)}});
 if(d.lamps) d.lamps.forEach(function(q,j){var lg=R.getElementById('lg'+k+'_'+j);if(lg){lg.setAttribute('opacity',f);lg.setAttribute('r',40+f*60)}});
 var cf=R.getElementById('cf'+k);
 if(cf){cf.setAttribute('opacity',f>.01?(.55+f*.45):0);cf.setAttribute('stroke',col(f));x.flow=((x.flow||0)+(x.v>0?-1:1)*dt*(60+f*260))%42;cf.setAttribute('stroke-dashoffset',x.flow);
  var cg=R.getElementById('cg'+k);if(cg){cg.setAttribute('opacity',f>.01?(.5+f*.5):0);cg.setAttribute('stroke-dashoffset',x.flow)}}
 return f}
function wrFrame(ts){WR.raf=0;
 if(V2.v!=='home'||document.hidden||!WR.on||WR.vis===false){WR.last=0;return}
 // every changed attribute repaints the whole picture, so it is drawn at most ~30 times a second
 if(WR.last&&ts-WR.last<30){WR.raf=requestAnimationFrame(wrFrame);return}
 var dt=Math.min(.05,(ts-(WR.last||ts))/1000),any=false;WR.last=ts;
 Object.keys(ST).forEach(function(k){if(ST[k].t&&animPort(k,ST[k],dt)>.01) any=true});
 // hub status LED: n quick blinks then a pause (hubLed sets the pattern), while the link is up
 var hl=WR.root.querySelector('.hubled'),lu=hubLinkUp();
 if(hl){var dv=lu?'':'none';if(hl.style.display!==dv) hl.style.display=dv}
 if(lu&&!WR.ledOn) WR.ledT0=ts;WR.ledOn=lu;   // the pattern starts with a blink the moment the hub turns active
 if(hl&&lu&&WR.ledK){var K=WR.ledK,u=(((ts-(WR.ledT0||0))/1000)%K.dur)/K.dur,v=0;
  for(var j=1;j<K.kt.length;j++){if(u<=K.kt[j]){var a=K.kt[j-1],b2=K.kt[j];v=K.vs[j-1]+(K.vs[j]-K.vs[j-1])*(b2>a?(u-a)/(b2-a):1);break}}
  var lb=hl.querySelectorAll('.lb');for(var j2=0;j2<lb.length;j2++){var o=(+lb[j2].getAttribute('data-hi')*v).toFixed(2);if(lb[j2]._o!==o){lb[j2]._o=o;lb[j2].style.opacity=o}}}
 var led=WR.root.getElementById('pLed');if(led) led.setAttribute('fill',!S.connected?'#59606c':any?(Math.sin(ts/166)>0?'#3dffb0':'#1D9E75'):'#3b9cff');
 wrPanelPaint();
 WR.raf=requestAnimationFrame(wrFrame)}

// ======================================================================
// Port panel (shared by every hub picture; WCUR is the picture that owns it)
// ======================================================================
var CYCLE=['','m','l','xl','bg','sv','lt','mk_m','mk_l','mk_xl','mk_sv'];
function own(){if(WCUR&&WCUR!==API) WCUR.WR.cur=null;WCUR=API}
function wrOpen(k){if(!ST[k]||ST[k].na) return;own();WR.cur=k;wrPanel()}
function wrPanel(){var box=document.getElementById('wrPanel');if(!box||WCUR!==API) return;var k=WR.cur;if(!k||!ST[k]){wrPanelHide();return}
 var x=ST[k],i=x.i;wrPanelShow();
 box.querySelector('.chip').textContent=tagOf(i);
 var nm=box.querySelector('.wr-pn');if(document.activeElement!==nm) nm.value=C.ch[i].name;nm._i=i;
 wrGrid(box,k);box.querySelector('.wr-holds').hidden=false;
 wrPanelMore(box,i,x.t,x.t?cableCm(k):0);wrPanelPaint()}
function wrPanelPaint(){var box=document.getElementById('wrPanel');if(!box||box.hidden||WCUR!==API||!WR.cur||!ST[WR.cur]) return;var x=ST[WR.cur];
 wrLiveBar(box,x.i);v2T(box.querySelector('.wr-pv'),isSvT(x.t)?Math.round(x.ang)+'°':Math.round(hubGets(x.i))+'%')}
// six cards, one per port of this hub: letter, picture, part and channel name
function wrGrid(box,cur){var g=box.querySelector('.wr-grid');if(!g) return;var o='';
 LT.split('').forEach(function(k){var x=ST[k];if(!x||x.na) return;var t=x.t||'';
  o+='<button type="button" data-p="'+k+'" data-t="'+t+'" class="'+(k===cur?'sel':'')+'" aria-pressed="'+(k===cur)+'"><em>'+k+'</em>'+(t?'<img src="img/pf/'+t+'.webp" alt="">':'<i class="wr-none">∅</i>')+'<b></b><small></small></button>';
  var k2=k+'2',x2=ST[k2];
  if(x2) o+='<button type="button" class="wr-stk'+(k2===cur?' sel':'')+'" data-p="'+k2+'" data-t="'+x2.t+'" aria-pressed="'+(k2===cur)+'"><em>'+k+'</em><img src="img/pf/'+x2.t+'.webp" alt=""><b></b><small></small></button>';
  else if(t&&baseOf(cur||'')===k) o+='<button type="button" class="wr-stk wr-add" data-p="'+k2+'" data-t=""><em>'+k+'</em><i class="wr-none">＋</i><b></b><small></small></button>'});
 g.innerHTML=o;
 [].forEach.call(g.children,function(b){var x=ST[b.getAttribute('data-p')];if(!x){b.querySelector('b').textContent=tr2('Stack a part');b.querySelector('small').textContent=tr2('same channel');return}var t=x.t||'';b.querySelector('b').textContent=tr2(t?PARTS[t]:'Nothing');b.querySelector('small').textContent=(C.ch[x.i]&&C.ch[x.i].name)||'—'})}
// a tap on a card gives that port the next part and opens it
function wrCyc(k){if(isStk(k)&&!ST[k]){var b=baseOf(k);if(!ST[b]||ST[b].na||!ST[b].t) return;own();WR.cur=k;wrSetPart('m');return}
 if(!ST[k]||ST[k].na) return;own();WR.cur=k;wrSetPart(CYCLE[(CYCLE.indexOf(ST[k].t||'')+1)%CYCLE.length])}
// new part on the open port; its trim starts again at 0 (trim belongs to the part that was there)
function wrSetPart(t){var k=WR.cur;t=t||'';
 if(isStk(k)){var b=baseOf(k);if(!ST[b]||!ST[b].t) return;var i2=ST[b].i;if(!Array.isArray(C.pf2)) C.pf2=[];while(C.pf2.length<NMAX) C.pf2.push('');
  C.pf2[i2]=t;if(!t){if(C.pfp) delete C.pfp[NMAX+3+i2];WR.cur=b}save();wrRender();wrPanel();return}
 if(!k||!ST[k]||ST[k].na) return;var i=ST[k].i;
 // the first part taken off: the stacked one moves down onto the port
 if(!t&&part2At(i)){t=part2At(i);C.pf2[i]='';if(C.pfp){C.pfp[i]=C.pfp[NMAX+3+i];delete C.pfp[NMAX+3+i];if(!C.pfp[i]) delete C.pfp[i]}}
 if(!Array.isArray(C.pf)) C.pf=[];while(C.pf.length<NMAX) C.pf.push('');
 if(partAt(i)!==t&&C.ch[i]) C.ch[i].trim=0;
 C.pf[i]=t;
 // the part decides how the channel runs: LED lights only go forward, a motor runs both ways
 if(C.ch[i]){var nk=t==='lt'?'light':(t&&C.ch[i].kind==='light'?'slider':C.ch[i].kind);if(nk!==C.ch[i].kind){C.ch[i].kind=nk;if(nk!=='light') setT(i,0,false);try{syncChannel(i)}catch(_){}}}
 save();wrRender();wrPanel()}
function wrInit(){if(WR.root) return true;var host=WR.hostEl||document.getElementById(WR.host);if(!host||!host.attachShadow) return false;
 WR.root=host.attachShadow({mode:'open'});
 WR.root.innerHTML='<style>:host{display:block}svg{display:block;width:100%;height:auto;border-radius:16px}.slot,.pt,.sock{cursor:pointer}.hubg{cursor:grab}.pt,.sock,.hubg{touch-action:none}.lk .pt,.lk .sock,.lk .hubg{touch-action:auto;cursor:pointer}.mk4 [data-p=E],.mk4 [data-p=F]{opacity:.12;filter:grayscale(1);pointer-events:none}</style><svg viewBox="0 0 1360 1560" role="img" aria-label="Hub wiring"></svg>';
 WR.svg=WR.root.querySelector('svg');
 // a picture scrolled off screen stops animating until it comes back
 if(window.IntersectionObserver){try{new IntersectionObserver(function(es){var v=es[es.length-1].isIntersecting;WR.vis=v;if(v&&WR.on&&!WR.raf){WR.last=0;WR.raf=requestAnimationFrame(wrFrame)}},{rootMargin:'40px'}).observe(host)}catch(_){}}
 return true}
// everything the picture is drawn from; when it changes the picture is drawn again
function wrKey(){var nm=[];for(var p=0;p<PER;p++) nm.push((C.ch[WR.slot*PER+p]||{}).name);
 return [WR.slot,(C.hubs||[]).join(','),(C.hubT||[]).join(','),(C.pf||[]).join(','),(C.pf2||[]).join(','),JSON.stringify(C.pfp||{}),store.prefs.lang,store.active,(C.pcl||[]).join(','),nm.join(',')].join('|')}
function wrTick(){if(!wrInit()) return;WR.on=true;wrLockPaint();var key=wrKey();if(WR.key!==key){WR.key=key;wrRender();wrPanel()}
 if(!WR.raf) WR.raf=requestAnimationFrame(wrFrame)}
// Tidy: every part glides back to its own side of the hub, the hub to the middle
function wrTidy(done){var from={},to={},hc0=(C.pfp&&C.pfp[NMAX+WR.slot])||HUB0,t0=0,dur=420;
 Object.keys(ST).forEach(function(k){if(ST[k].t){from[k]=POS[k].slice();to[k]=pos0(k)}});
 function step(ts){if(!t0) t0=ts;var e=Math.min(1,(ts-t0)/dur),q=1-Math.pow(1-e,3);
  Object.keys(from).forEach(function(k){POS[k]=[from[k][0]+(to[k][0]-from[k][0])*q,from[k][1]+(to[k][1]-from[k][1])*q]});
  HUBOV=[hc0[0]+(HUB0[0]-hc0[0])*q,hc0[1]+(HUB0[1]-hc0[1])*q];render();
  if(e<1){requestAnimationFrame(step);return}
  HUBOV=null;if(C.pfp){for(var p=0;p<PER;p++){delete C.pfp[WR.slot*PER+p];delete C.pfp[NMAX+3+WR.slot*PER+p]}delete C.pfp[NMAX+WR.slot]}save();WR.key='';wrRender();wake();if(done) done()}
 requestAnimationFrame(step)}
API.tick=wrTick;API.panel=wrPanel;API.setPart=wrSetPart;API.cyc=wrCyc;API.tidy=wrTidy;API.open=wrOpen;
API.port=function(){return WR.cur&&ST[WR.cur]?ST[WR.cur].i:-1};
API.cable=function(){return WR.cur&&ST[WR.cur]&&ST[WR.cur].t?cableCm(WR.cur):0};
API.redraw=function(){WR.key=''};
API.step=function(d){var q=Math.max(0,LT.indexOf(WR.cur));wrOpen(LT.charAt((q+d+PER)%PER))};
API.close=function(){WR.cur=null};
return API;
  }
  var WIRE0=mkWire(WR);
  function wrAllOn(){return !!store.prefs.wrall&&activeSlots().length>1}
  function wrVis(){return wrAllOn()?WALLI:[WIRE0]}
  // tabs: one per hub, plus "All hubs" (idea 12) that shows every hub's picture at once
  function wrTabs(){var box=document.getElementById('wrTabs');if(!box) return;var sl=activeSlots(),all=wrAllOn();if(sl.indexOf(WR.slot)<0) WR.slot=sl[0]||0;
   var key=sl.join(',')+'|'+C.hubs.join(',')+'|'+C.hubT.join(',')+'|'+WR.slot+'|'+all+'|'+store.prefs.lang;if(box._k===key) return;box._k=key;box.hidden=sl.length<2;box.innerHTML='';
   sl.forEach(function(s){var b=document.createElement('button');b.type='button';b.className='btn'+(!all&&s===WR.slot?' sel':'');b.textContent='Hub '+(s+1)+' · M'+(C.hubs[s]+1)+typeTag(s);
    b.addEventListener('click',function(){store.prefs.wrall=false;save();WR.slot=s;WR.cur=null;WCUR=null;wrPanelHide();WR.key='';wrTabs();wrCtl()});box.appendChild(b)});
   if(sl.length>1){var ab=document.createElement('button');ab.type='button';ab.className='btn wr-allb'+(all?' sel':'');ab.textContent=tr2('All hubs');
    ab.addEventListener('click',function(){store.prefs.wrall=true;save();WR.cur=null;WCUR=null;wrPanelHide();WALLK='';wrTabs();wrCtl()});box.appendChild(ab)}}
  // live output bar under the panel title: what the hub gets on this port (reverse applied), filling from the left going forward and from the right in reverse
  function wrLiveBar(box,i){var lb=box.querySelector('.wr-lb');if(!lb) return;if(!lb.children.length) for(var n=0;n<20;n++) lb.appendChild(document.createElement('i'));
   var v=Math.round(liveO(i)*(C.ch[i]&&C.ch[i].inv?-1:1)),k=String(Math.round(v/5));if(lb._k===k) return;lb._k=k;var ln=Math.round(Math.abs(v)/5);
   [].forEach.call(lb.children,function(c,j){var ix=v<0?19-j:j,on=ix<ln;c.style.background=on?wcol((ix+1)/20):''})}
  function wrPanelHide(){var b=document.getElementById('wrPanel');if(b) b.hidden=true;document.documentElement.classList.remove('wr-fl')}
  function wrPanelShow(){var b=document.getElementById('wrPanel');if(b) b.hidden=false;document.documentElement.classList.add('wr-fl')}
  function wrCtl(){var host=document.getElementById('wrHost'),box=document.getElementById('wrAll');if(!host) return;var all=wrAllOn()&&!!box;
   host.hidden=all;if(box) box.hidden=!all;
   if(!all){WALLI.forEach(function(w){w.WR.on=false});if(WCUR&&WCUR!==WIRE0){WCUR=null;wrPanelHide()}WIRE0.tick();return}
   if(WCUR===WIRE0){WCUR=null;WR.cur=null;wrPanelHide()}
   WR.on=false;var sl=activeSlots(),key=sl.join(',')+'|'+C.hubs.join(',')+'|'+C.hubT.join(',')+'|'+store.active;
   if(WALLK!==key){WALLK=key;WALLI.forEach(function(w){w.WR.on=false});WALLI=[];box.innerHTML='';if(WCUR&&WCUR!==WIRE0){WCUR=null;wrPanelHide()}
    sl.forEach(function(s){var d=document.createElement('div');d.className='wr-sub';var h=document.createElement('div');h.className='wr-subh';h.textContent='Hub '+(s+1)+' · M'+(C.hubs[s]+1)+typeTag(s,1);var hs=document.createElement('div');d.appendChild(h);d.appendChild(hs);box.appendChild(d);
     WALLI.push(mkWire({slot:s,root:null,svg:null,cur:null,raf:0,last:0,key:'',hostEl:hs,on:true}))})}
   WALLI.forEach(function(w){w.tick()})}
  var WIRE={tick:function(){wrShared();wrTabs();wrCtl();wrBudget()}};
  function wesc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var WR_ADDS={m:['ax','s','f'],l:['ax','s','f'],xl:['ax','lv','f'],bg:['ax','s','f'],sv:['st','s','f'],lt:['t','s'],mk_m:['ax','s','f'],mk_l:['ax','s','f'],mk_xl:['ax','lv','f'],mk_sv:['st','s','f']};
  // port panel extras (idea 9 and 11): test slider, reverse switch, cable length, add a widget for this port
  function wrPanelMore(box,i,t,cm){var mo=box.querySelector('.wr-more'),tb0=box.querySelector('.wr-tst');if(tb0) tb0.hidden=false;if(!mo) return;mo.hidden=!t;if(!t) return;
   var sw=mo.querySelector('.wr-sw'),inv=!!C.ch[i].inv;sw.classList.toggle('on',inv);sw.setAttribute('aria-checked',String(inv));
   var mx=(Array.isArray(C.pcl)&&C.pcl[i]===50)?50:20,lng=cm>mx;
   [].forEach.call(mo.querySelectorAll('.wr-cbs button'),function(b){var on=+b.getAttribute('data-l')===mx;b.classList.toggle('sel',on);b.setAttribute('aria-pressed',String(on))});
   var cl=mo.querySelector('.wr-cl');v2T(cl,Math.round(cm)+' cm');cl.classList.toggle('bad',lng);mo.querySelector('.wr-cw').hidden=!lng;
   v2T(box.querySelector('.wr-mxv'),C.ch[i].max+'%');
   var tr=box.querySelector('.wr-trow');tr.hidden=!t||t==='lt';
   v2T(box.querySelector('.wr-tmv'),((C.ch[i].trim||0)>0?'+':'')+(C.ch[i].trim||0));
   tr.querySelector('span').firstChild.nodeValue=tr2(isSvT(t)?'Centre trim':'Trim (runs straight)')+' ';
   var ad=WR_ADDS[t]||[];[].forEach.call(mo.querySelectorAll('.wr-adds button'),function(b){b.hidden=ad.indexOf(b.getAttribute('data-w'))<0});
   var ts=box.querySelector('.wr-test');if(ts&&!ts._on) ts.value=0}
  function wrGuard(){if(!S.connected){toast(RH()?'Connect the hub first.':'Turn on Practice mode or connect the hub first.');return false}if(S.estop){toast('Release E-Stop first.');return false}return true}
  function wrAddW(k,i){if(C.board.length>=16){toast('The board is full (16 controls).');return}
   var it={k:k,c:i,w:1};if(k==='s') it.hold=false;if(k==='t'){it.y='led';it.p=100}
   C.board.push(it);
   if(dashOn()){var g=dashFind(it,1);if(!g){C.board.pop();toast('No space. Make room or remove a widget first.');return}it[DG.k]=g}
   save();syncBoard();toast(C.layout==='board'?'Added to the board.':'Added. Switch the layout to Board to see it.');feedback('ok')}
  // channels i and j trade places everywhere: names and settings, widgets, sticks, sequences, timelines, recordings,
  // gamepad buttons, part pictures and their spots. Used when the wiring check finds two plugs swapped.
  function swapCh(i,j){if(i===j) return;var f=function(v){return v===i?j:v===j?i:v};
   setT(i,0,false,true);setT(j,0,false,true);
   var t=C.ch[i];C.ch[i]=C.ch[j];C.ch[j]=t;
   C.ch.forEach(function(o){if(typeof o.ls==='number') o.ls=f(o.ls)});
   ['s1','s2'].forEach(function(q){if(C[q]){if(C[q].a>=0) C[q].a=f(C[q].a);if(C[q].b>=0) C[q].b=f(C[q].b)}});
   if(C.ss){C.ss.st=f(C.ss.st);C.ss.th=f(C.ss.th)}
   if(C.pad){if(C.pad.trig>=0) C.pad.trig=f(C.pad.trig);Object.keys(C.pad.map||{}).forEach(function(b){var m=/^([frlt])(\d{1,2})$/.exec(C.pad.map[b]);if(m) C.pad.map[b]=m[1]+f(+m[2])})}
   (C.seq||[]).forEach(function(q){(q.steps||[]).forEach(function(st){if(st.ch>=0) st.ch=f(st.ch)})});
   (C.tl||[]).forEach(function(q){(q.lanes||[]).forEach(function(l){l.c=f(l.c)})});
   (C.rec||[]).forEach(function(r){(r.pts||[]).forEach(function(p){var a=p[i+1];p[i+1]=p[j+1];p[j+1]=a})});
   var TWO={j:1,d:1,w:1,xy:1,xf:1,dp:1,lx:1};
   (C.board||[]).forEach(function(o){if(typeof o.c==='number') o.c=f(o.c);if(typeof o.pc==='number') o.pc=f(o.pc);
    if(TWO[o.k]&&typeof o.d==='number'&&o.d>=0) o.d=f(o.d);if(o.k==='d'){if(o.e>=0) o.e=f(o.e);if(o.f>=0) o.f=f(o.f)}
    if(Array.isArray(o.t)) o.t.forEach(function(q){q.c=f(q.c)});if(Array.isArray(o.cs)) o.cs=o.cs.map(f)});
   if(Array.isArray(C.pf)){var p=C.pf[i];C.pf[i]=C.pf[j];C.pf[j]=p}
   if(Array.isArray(C.pf2)){var p2=C.pf2[i];C.pf2[i]=C.pf2[j];C.pf2[j]=p2}
   if(Array.isArray(C.pcl)){var l=C.pcl[i];C.pcl[i]=C.pcl[j];C.pcl[j]=l}
   if(C.pfp){[0,NMAX+3].forEach(function(o){var a=C.pfp[o+i],b=C.pfp[o+j];delete C.pfp[o+i];delete C.pfp[o+j];if(a) C.pfp[o+j]=a;if(b) C.pfp[o+i]=b})}
   save();syncAll();wrVis().forEach(function(w){w.redraw()})}
  // idea 3: guided wiring check: each port runs for a moment and the app asks if the right part moved
  var WCK=null;
  function wrChkPorts(){var out=[];(wrAllOn()?activeSlots():[WR.slot]).forEach(function(sl){for(var p=0;p<PER;p++){var i=sl*PER+p;if(C.pf&&C.pf[i]) out.push(i)}});return out}
  function wrChkStart(){var q=wrChkPorts();if(!q.length){toast('Pick what is plugged into each port first.');return}if(!wrGuard()) return;
   WCK={q:q,n:0,ok:0,sw:0,bad:0,st:'run',tm:0};wrChkRun()}
  function wrChkStop(){if(!WCK) return;clearTimeout(WCK.tm);var i=WCK.q[WCK.n];if(i>=0) setT(i,0,false,true)}
  function wrChkRun(){var i=WCK.q[WCK.n];if(i===undefined){WCK.st='done';wrChkPaint();return}
   if(!wrGuard()){WCK.st='ask';wrChkPaint();return}
   WCK.st='run';wrChkPaint();var pw=C.testPwr||60;noteInput();setT(i,pw,false);
   if(isSvT(C.pf[i])) WCK.tm=setTimeout(function(){setT(i,-pw,false);WCK.tm=setTimeout(function(){setT(i,0,false);WCK.st='ask';wrChkPaint()},600)},600);
   else WCK.tm=setTimeout(function(){setT(i,0,false);WCK.st='ask';wrChkPaint()},1000)}
  function wrChkName(i){return tagOf(i)+' · '+tr2(({m:'Motor M',l:'Motor L',xl:'Motor XL',bg:'Buggy motor',sv:'Servo',lt:'LED lights',mk_m:'MK Motor M',mk_l:'MK Motor L',mk_xl:'MK Motor XL',mk_sv:'MK Servo'})[C.pf[i]]||'')+' · '+C.ch[i].name}
  function wrChkPaint(){var box=document.getElementById('wrChkBox');if(!box) return;if(!WCK){box.hidden=true;return}box.hidden=false;var i=WCK.q[WCK.n],h='';
   var prog='<div class="wr-ckp">'+WCK.q.map(function(q,n){return '<i class="'+(n<WCK.n?'ok':n===WCK.n&&WCK.st!=='done'?'on':'')+'">'+tagOf(q)+'</i>'}).join('')+'</div>';
   if(WCK.st==='done'){h=prog+'<b>'+tr2('Wiring check done')+'</b><p>'+WCK.ok+' '+tr2('right')+' · '+WCK.sw+' '+tr2('swapped')+' · '+WCK.bad+' '+tr2('to check')+'</p><div class="wr-ckb"><button class="btn" data-a="x">'+tr2('Close')+'</button></div>'}
   else if(WCK.st==='run'){h=prog+'<b>'+wesc(wrChkName(i))+'</b><p>'+tr2('Running for a moment… watch which part moves.')+'</p><div class="wr-ckb"><button class="btn" data-a="x">'+tr2('Stop check')+'</button></div>'}
   else if(WCK.st==='which'){var oth=WCK.q.filter(function(q){return q!==i&&Math.floor(q/PER)===Math.floor(i/PER)});
    h=prog+'<b>'+tr2('Which part moved?')+'</b><p>'+tr2('The app swaps the two ports: names, settings and widgets follow the motors.')+'</p><div class="wr-ckb wr-ckw">'+oth.map(function(q){return '<button class="btn" data-w="'+q+'">'+wesc(wrChkName(q))+'</button>'}).join('')+'<button class="btn" data-a="none">'+tr2('Nothing moved')+'</button></div>'}
   else h=prog+'<b>'+wesc(wrChkName(i))+'</b><p>'+tr2('Did this part move?')+'</p><div class="wr-ckb"><button class="btn go" data-a="y">'+tr2('Yes')+'</button><button class="btn" data-a="n">'+tr2('No')+'</button><button class="btn" data-a="r">'+tr2('Again')+'</button></div>';
   box.innerHTML=h;
   [].forEach.call(box.querySelectorAll('button'),function(b){b.addEventListener('click',function(){var a=b.getAttribute('data-a'),w=b.getAttribute('data-w');
    if(a==='x'){wrChkStop();WCK=null;wrChkPaint();return}
    if(a==='y'){WCK.ok++;WCK.n++;wrChkRun();return}
    if(a==='r'){wrChkRun();return}
    if(a==='n'){WCK.st='which';wrChkPaint();return}
    if(a==='none'){WCK.bad++;WCK.n++;toast(tr2('Check the plug and cable on port')+' '+tagOf(i)+'.',4000);wrChkRun();return}
    if(w!==null){var j=+w;swapCh(i,j);WCK.sw++;WCK.ok++;toast(tr2('Ports swapped')+': '+tagOf(i)+' ⇄ '+tagOf(j),4000);
     // the other port now holds a different part: check it (again)
     var pos=WCK.q.indexOf(j);if(pos>=0&&pos<WCK.n){WCK.q.splice(pos,1);WCK.n--;WCK.q.push(j)}WCK.n++;wrChkRun()}})})}
  // idea 2: power budget. Estimated current per port from the part and its live output; hub total against a ~4 A budget;
  // runtime from the hub battery level and the average draw (assumes a 1500 mAh battery). Hubs do not report current.
  var WAMP={m:.55,l:.85,xl:1.6,bg:1.8,sv:.6,lt:.05,mk_m:.55,mk_l:.85,mk_xl:1.6,mk_sv:.6},WBUD=4,WBT={t:0,avg:0};
  function wrBudget(){var box=document.getElementById('wrBud');if(!box) return;var now=performance.now();if(now-WBT.t<250) return;var dt=WBT.t?Math.min(2,(now-WBT.t)/1000):0;WBT.t=now;
   var sl=wrAllOn()?activeSlots():[WR.slot],h='',tot=0,mx=0;
   sl.forEach(function(s){var a=0,rows='';for(var p=0;p<PER;p++){var i=s*PER+p,t=C.pf&&C.pf[i],f=Math.min(1,Math.abs(liveO(i))/100),q=t?(WAMP[t]||0)*(t==='lt'?f:f*(.35+.65*f)):0,t2=t&&C.pf2&&C.pf2[i];if(t2) q+=(WAMP[t2]||0)*(t2==='lt'?f:f*(.35+.65*f));a+=q;
     rows+='<div class="wr-bp'+(t?'':' no')+'"><span>'+LT.charAt(p)+'</span><i><b style="width:'+Math.round(Math.min(1,q/1.6)*100)+'%;background:'+wcol(q/1.6)+'"></b></i><em>'+(t?q.toFixed(2)+' A':'—')+'</em></div>'}
    tot+=a;var L=a/WBUD;mx=Math.max(mx,L);var seg='';for(var n=0;n<20;n++){var g=(n+.5)/20;seg+='<i style="background:'+(g<=L?wcol(g):'')+'"></i>'}
    h+='<div class="wr-bh"><div class="wr-bt"><b>'+(sl.length>1||activeSlots().length>1?'Hub '+(s+1)+' · ':'')+a.toFixed(1)+' A</b><span>'+Math.round(L*100)+'% '+tr2('of the hub budget')+'</span></div><div class="wr-bseg">'+seg+'</div><div class="wr-bps">'+rows+'</div></div>'});
   WBT.avg=dt?WBT.avg+(tot-WBT.avg)*Math.min(1,dt/20):tot;
   var hb=document.getElementById('hbat'),bm=hb&&!hb.hidden?(hb.textContent.match(/(\d+)%/)||[]):[],rt0='—';
   if(bm[1]&&WBT.avg>.03){var mins=1.5*(+bm[1]/100)/(WBT.avg+.05)*60;rt0=mins>240?'> 4 h':'≈ '+Math.round(mins)+' min'}
   h+='<div class="wr-brt"><span>'+tr2('Play time left')+'</span><b>'+(rt0==='> 4 h'?tr2('over 4 hours'):rt0)+'</b></div>';
   if(mx>.95) h+='<div class="wr-bw r">'+tr2('Over the hub budget: the hub may cut out on a climb. Move a heavy motor to another hub.')+'</div>';
   else if(mx>.7) h+='<div class="wr-bw y">'+tr2('High load: the hub may limit power or get warm.')+'</div>';
   if(box._h!==h){box._h=h;box.innerHTML=h}}
  function wcol(f){return f<=.55?'#1D9E75':f<=.8?'#EF9F27':'#E24B4A'}
  // ---- port panel controls, bound once; every control works on the open port of the picture that owns the panel ----
  var WSH=false;
  function openPort(){return WCUR?WCUR.port():-1}
  function redrawAll(){wrVis().forEach(function(w){w.redraw();w.tick()})}
  function wrShared(){if(WSH) return;var pn=document.getElementById('wrPanel');if(!pn) return;WSH=true;
   function on(sel,ev,fn){[].forEach.call(pn.querySelectorAll(sel),function(el){el.addEventListener(ev,function(e){fn(el,e)})})}
   var lb=document.getElementById('wrLock');
   if(lb) lb.addEventListener('click',function(){store.prefs.wrlock=!store.prefs.wrlock;save();toast(store.prefs.wrlock?'Layout locked.':'Layout unlocked: drag the hub and parts.')});
   // header: ‹ › other port, ▾ smaller panel, ✕ close, name field
   on('.wr-nav','click',function(b){if(WCUR) WCUR.step(+b.getAttribute('data-d'))});
   on('.wr-min','click',function(b){var m=!pn.classList.contains('min');pn.classList.toggle('min',m);b.setAttribute('aria-pressed',String(m));b.setAttribute('aria-label',tr2(m?'Show all of the panel':'Make the panel smaller'))});
   on('.wr-x','click',function(){if(WCUR) WCUR.close();wrPanelHide()});
   var nm=pn.querySelector('.wr-pn');
   if(nm){var keep=function(){var i=nm._i;if(!(i>=0)||!C.ch[i]) return;var v=nm.value.replace(/\s+/g,' ').trim().slice(0,16);if(!v){nm.value=C.ch[i].name;return}if(v===C.ch[i].name) return;C.ch[i].name=v;save();syncAll();redrawAll();feedback('ok')};
    nm.addEventListener('change',keep);nm.addEventListener('blur',keep);nm.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();nm.blur()}})}
   // test the open port: Hold buttons run it at the test power while pressed; the slider runs it while held away from 0
   var held=-1;
   function runPort(i,v){noteInput();setT(i,v,false)}
   on('.wr-f,.wr-r','pointerdown',function(b,e){if(e.preventDefault) e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}
    if(!wrGuard()) return;var i=openPort();if(i<0) return;held=i;b.classList.add('down');runPort(i,(b.classList.contains('wr-f')?1:-1)*(C.testPwr||60));feedback('ok')});
   ['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){on('.wr-f,.wr-r',ev,function(b){if(held<0) return;setT(held,0,false);held=-1;b.classList.remove('down')})});
   on('.wr-f,.wr-r','contextmenu',function(b,e){e.preventDefault()});
   var ts=pn.querySelector('.wr-test'),tsi=-1;
   if(ts){ts.addEventListener('pointerdown',function(){ts._on=true;if(!wrGuard()){ts._on=false;return}tsi=openPort();noteInput()});
    ts.addEventListener('input',function(){if(!ts._on||tsi<0||!S.connected||S.estop) return;runPort(tsi,+ts.value)});
    var let_go=function(){if(!ts._on) return;ts._on=false;ts.value=0;if(tsi>=0) setT(tsi,0,false);tsi=-1};
    ['pointerup','pointercancel','change','touchend','blur'].forEach(function(ev){ts.addEventListener(ev,let_go)})}
   // wiring grid: a tap gives that port the next part
   var gr=pn.querySelector('.wr-grid');if(gr) gr.addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(b&&WCUR) WCUR.cyc(b.getAttribute('data-p'))});
   // settings of the open port
   on('.wr-sw','click',function(){var i=openPort();if(i<0) return;C.ch[i].inv=!C.ch[i].inv;save();syncChannel(i);if(WCUR) WCUR.panel();toast(C.ch[i].inv?tr2('Direction reversed for')+' '+tagOf(i)+'.':tr2('Normal direction for')+' '+tagOf(i)+'.')});
   on('.wr-step button','click',function(b){var i=openPort();if(i<0) return;var c=C.ch[i],d=+b.getAttribute('data-d');
    if(b.parentNode.getAttribute('data-f')==='max') c.max=Math.max(10,Math.min(100,(c.max||100)+d)); else c.trim=Math.max(-20,Math.min(20,(c.trim||0)+d));
    save();syncChannel(i);v2T(pn.querySelector('.wr-mxv'),c.max+'%');v2T(pn.querySelector('.wr-tmv'),((c.trim||0)>0?'+':'')+(c.trim||0))});
   on('.wr-cbs button','click',function(b){var i=openPort();if(i<0) return;if(!Array.isArray(C.pcl)){C.pcl=[];for(var n=0;n<NMAX;n++) C.pcl.push(20)}C.pcl[i]=+b.getAttribute('data-l')===50?50:20;save();redrawAll();if(WCUR) WCUR.panel()});
   on('.wr-adds button','click',function(b){var i=openPort();if(i>=0) wrAddW(b.getAttribute('data-w'),i)});
   // card buttons: wiring check and tidy
   var ck=document.getElementById('wrChk');if(ck) ck.addEventListener('click',function(){if(WCK){wrChkStop();WCK=null;wrChkPaint();return}wrChkStart()});
   var td=document.getElementById('wrTidy');if(td) td.addEventListener('click',function(){var n=wrVis().length;wrVis().forEach(function(w,q){w.tidy(q===n-1?function(){toast('Tidied: each part back on its side of the hub.')}:null)})})}

  function v2Slots(){
    var box=$('#hubSlots');if(!box) return;box.innerHTML='';
    for(var s=1;s<3;s++){
      var sel=$('#hub'+s);if(!sel) continue;
      var on=C.hubs[s]>=0;
      if(!on&&s===2&&C.hubs[1]<0) continue;
      var c=document.createElement('section');c.className='card v2-slot';
      var nm=on?('Hub '+(s+1)+' · M'+(C.hubs[s]+1)+typeTag(s)):('Hub '+(s+1));
      c.innerHTML='<div class="v2-mrow"><span class="v2-grow"><b></b><small></small></span><button class="btn v2-icbtn" type="button"></button></div>';
      c.querySelector('b').textContent=nm;c.querySelector('small').textContent=on?'Channels '+tagOf(s*6)+'–'+tagOf(s*6+5):'None — add a second hub';
      if(s===2&&!on) c.querySelector('small').textContent='None — add a third hub';
      var bt=c.querySelector('button');bt.innerHTML=v2Ic(on?'minus':'plus')+'<span></span>';bt.querySelector('span').textContent=on?'Remove':'Add';
      (function(sel,on,s){bt.addEventListener('click',function(){
        if(on){sel.value='-1'}else{var used=C.hubs.filter(function(x){return x>=0});var free=[0,1,2].filter(function(m){return used.indexOf(m)<0})[0];if(free==null) return;sel.value=String(free)}
        v2Fire(sel);setTimeout(v2Slots,50);
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
    var key=[S.estop,lost,S.bt,low,pct,bad,store.prefs.lang,v2Inbox?v2Inbox.name:'',store.prefs.playLim&&v2PlayLeft()<=0,PLAY.extra].join('|');if(key===v2AlKey) return;v2AlKey=key;
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
  }

  // write a text only when the English source changes, so translated text is not rewritten every frame
  // Home hub card: one row per hub with its name, its own output LEDs and how often the phone sends to it
  function v2HubRows(){
    var box=$('#hubList');if(!box||!S.connected) return;
    var sl=[0,1,2].filter(function(q){return C.hubs[q]>=0}),key=sl.map(function(q){return C.hubs[q]}).join();
    if(box._k!==key){box._k=key;box.innerHTML='';sl.forEach(function(q){var r=document.createElement('div');r.className='v2-hrow';r.innerHTML='<em></em><b></b><span class="v2-leds"></span><strong></strong><small></small>';var L=r.querySelector('.v2-leds');for(var j=0;j<14;j++) L.appendChild(document.createElement('i'));r._q=q;box.appendChild(r)})}
    var d=LK.d||{},has=!!(NB&&NB.stats),rate=has&&LK.lvl?Math.round((LK.r||0)/(d.mode==='rotate'?Math.max(1,sl.length):1)):-1;
    [].forEach.call(box.children,function(r,ix){var q=r._q,m=C.hubs[q],mx=0;
      for(var i=q*PER;i<q*PER+PER;i++) if(activeIdx().indexOf(i)>=0) mx=Math.max(mx,Math.abs(rt.o[i]||0));mx=Math.round(mx);
      v2T(r.querySelector('em'),'M'+(m+1));v2T(r.querySelector('b'),(C.hubNames&&C.hubNames[m])||tr2('Hub')+' '+(q+1));v2T(r.querySelector('strong'),mx+'%');
      var al=!d.alive||d.alive[ix]!==0,sm=r.querySelector('small');v2T(sm,rate<0?'—':al?rate+'/s':tr2('off air'));if(sm.className!==(al?'':'off')) sm.className=al?'':'off';
      var L=r.querySelector('.v2-leds').children;for(var j=0;j<L.length;j++){var f=(j+.5)/L.length,lc=f*100<=mx?(f<=.55?'g':f<=.8?'o':'r'):'';if(L[j].className!==lc) L[j].className=lc}});
  }
  function v2T(el,t){if(el&&el._v2t!==t){el._v2t=t;el.textContent=t}}
  // top pill: one ring per hub on this model. Colour = state (green active, amber pairing, red off air, grey off), arc = that hub's output now
  var RING_TAG={6:'6.0',4:'4.0',40:'O/O',14:'H4',16:'H6'};
  function v2Rings(pl,st,real){
    var box=pl.querySelector('.prings');if(!box) return;
    var sl=real?[0,1,2].filter(function(q){return C.hubs[q]>=0}):[];
    var key=sl.map(function(q){return q+':'+(C.hubT?C.hubT[q]:6)}).join();
    if(box._k!==key){box._k=key;box.innerHTML=sl.map(function(q){
      return '<i class="pring" data-st="off"><svg viewBox="0 0 30 30"><circle class="rt" cx="15" cy="15" r="12.5"/><circle class="ra" cx="15" cy="15" r="12.5" pathLength="100" stroke-dasharray="0 100"/></svg><b>'+(RING_TAG[C.hubT?C.hubT[q]:6]||'6.0')+'</b></i>'}).join('')}
    pl.classList.toggle('rings',sl.length>0);
    // wiring status LED: blinks whenever the link is up (a real hub after pairing, or Practice / Simulation on), on every hub of the model
    var lit={};if(hubLinkUp()) [0,1,2].forEach(function(q){if(C.hubs[q]>=0) lit[q]=true});window.mk6HubOn=lit;
    var whL=document.getElementById('wrHost');if(whL&&whL.shadowRoot) whL.shadowRoot.querySelectorAll('.hubled').forEach(function(g){var v=lit[+g.getAttribute('data-slot')]?'':'none';if(g.style.display!==v) g.style.display=v});
    if(!sl.length) return;
    var d=LK.d||{},act=activeIdx();
    sl.forEach(function(q,ix){var r=box.children[ix];if(!r) return;var mx=0;
      for(var i=q*PER;i<q*PER+PER;i++) if(act.indexOf(i)>=0) mx=Math.max(mx,Math.abs(rt.o[i]||0));
      var al=!d.alive||d.alive[ix]!==0,rs=st==='off'?'off':st==='busy'?'busy':al?'on':'lost';
      if(r.getAttribute('data-st')!==rs) r.setAttribute('data-st',rs);
      var lv=rs==='on'&&mx>0?(mx<=55?'g':mx<=80?'o':'r'):'';if((r._lv||'')!==lv){r._lv=lv;r.setAttribute('data-lv',lv)}
      var da=(rs==='on'?Math.round(mx):0)+' 100',a=r.querySelector('.ra');if(a._da!==da){a._da=da;a.setAttribute('stroke-dasharray',da)}});
  }
  function v2Paint(){
    var busy=S.connected&&hubMsg==='Pairing…', real=RH();
    var txt=real?(busy?'Pairing…':S.connected?'Hub active':(hubMsg||'Not connected')):NB?(S.connected?'Practice on':'Practice off'):(S.connected?'Simulation on':'Simulation off');
    var st=!S.connected?'off':busy?'busy':'on';
    var nm=(C.hubNames&&C.hubNames[C.hubs[0]])||'', n=activeSlots().length;
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
      v2T(pl.querySelector('.ptx'),ptx);v2Rings(pl,st,real);
      var hb=$('#hbat'),bm=hb&&!hb.hidden?(hb.textContent.match(/(\d+)%/)||[]):[];
      var pb=pl.querySelector('.pbat');v2T(pb,bm[1]?bm[1]+'%':'');pb.classList.toggle('low',!!(hb&&hb.classList.contains('low')));
      pl.setAttribute('aria-label',(S.bt===false?'Bluetooth is off. ':'')+ptx+(bm[1]?', battery '+bm[1]+'%':''));
    }
    // settings values
    v2T($('#sHubSt'),busy?'…':S.connected?'Active':'Off');
    var lo=$('#limitOut');v2T($('#sLimV'),lo?lo.textContent:'');
    v2T($('#sLangV'),store.prefs.lang==='ms'?'BM':'EN');
    $('#sRelink').setAttribute('aria-checked',String(!!store.prefs.relink));$('#sFull').setAttribute('aria-checked',String(!!store.prefs.full));
    $('#sFb').setAttribute('aria-checked',String(!!(store.prefs.sound||store.prefs.haptic)));
    $('#sPrac').setAttribute('aria-checked',String(!!store.prefs.practice));
    // hub screen
    $('#hubEmpty').hidden=!!S.connected;$('#hubCard').hidden=!S.connected;
    v2T($('#hubSub'),'● '+txt+(n>1?' · '+n+' hubs':''));
    if(V2.v==='home') v2HubRows();
    if(V2.v==='home') WIRE.tick();
    v2Alerts();
    v2Gfx(st);
    v2Diag(false);lkSample(false);if(V2.v==='safety') sfPaint(false);
    // drive mode, play time, meter, left-handed
    v2Mode();v2CrzPaint();v2Focus();v2SimKick();
    if(V2.v==='medit'){v2SsPaint();}
    v2MiPaint();
    var pl0=store.prefs.playLim||0;v2T($('#sPlayV'),pl0?pl0+' min':'Off');
    var dp=$('#dPlay');if(dp){var lf=v2PlayLeft();if(dp.hidden===!!pl0) dp.hidden=!pl0;if(pl0){v2T(dp.querySelector('b'),v2Clock(lf));v2Tog(dp,'low',lf<=120000)}}
    $('#sLframe').setAttribute('aria-checked',String(store.prefs.lframe!==false));
    var bbl=bbLoad();v2T($('#sBbV'),bbl.length?new Date(bbl[0].at).toTimeString().slice(0,5):'None yet');
  }

