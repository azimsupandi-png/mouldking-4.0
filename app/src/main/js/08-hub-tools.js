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
  // an H-hub tells which ports have a smart motor: those ports with no part set get Motor M
  var smartSeen={};
  function autoSmart(d){
    if(!Array.isArray(d.smart)) return;
    var sl=activeSlots(),found=[];
    sl.forEach(function(s,h){
      var row=d.smart[h];if(!isHall(s)||!Array.isArray(row)) return;
      row.forEach(function(v,p){
        var i=s*PER+p;if(v!==1||!isActive(i)||C.pf[i]) return;
        C.pf[i]='m';found.push('Hub '+(s+1)+' '+L[p])});
    });
    if(found.length){save();syncAll();toast('Smart motor found on '+found.join(', ')+'. Set to Motor M.',5000)}
  }
  var LK={h:[],hb:[],last:null,t:0,lvl:'',msg:''};
  function lkSample(force){
    var now=Date.now();if(!force&&now-LK.t<1000) return;
    var dt=LK.t?Math.max(.25,(now-LK.t)/1000):1;LK.t=now;
    var d=null;try{d=NB&&NB.stats?JSON.parse(NB.stats()||'{}'):null}catch(_){d=null}
    if(d&&S.connected) autoSmart(d);
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
    var dg=$('#hubDiag');if(!dg||!dg.open||V2.v!=='home') return;
    var now=Date.now();if(!force&&now-v2DiagT<1000) return;v2DiagT=now;
    var rows=v2DiagData(),dl=$('#diagList');
    if(v2DiagRows.length!==rows.length){dl.innerHTML='';v2DiagRows=rows.map(function(){var t=document.createElement('dt'),v=document.createElement('dd');dl.appendChild(t);dl.appendChild(v);return [t,v]})}
    rows.forEach(function(r,i){v2T(v2DiagRows[i][0],r[0]);v2T(v2DiagRows[i][1],r[1]);if(v2DiagRows[i][1].className!==r[2]) v2DiagRows[i][1].className=r[2]});
  }
  (function(){var dg=$('#hubDiag');if(dg) dg.addEventListener('toggle',function(){v2DiagRows=[];v2Diag(true);var hb=$('#lkHubs');if(hb) hb._k='';lkPaint()})})();
  function v2Copy(t,okMsg){
    var ok=false;try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove()}catch(_){}
    if(!ok&&navigator.clipboard){navigator.clipboard.writeText(t).then(function(){toast(okMsg)},function(){toast('Could not copy.')});return}
    toast(ok?okMsg:'Could not copy.');
  }
  function v2LogText(){var t='';try{t=NB&&NB.log?String(NB.log()||''):''}catch(_){}return t}
  v2Click('#diagCopy',function(){
    var t='MK6 Console diagnostics\n'+v2DiagData().map(function(r){return r[0]+': '+r[1]}).join('\n')+'\nApp: '+navigator.userAgent.replace(/.*(Android [0-9.]+).*?(Chrome\/[0-9]+).*/,'$1 · $2');
    var lg=v2LogText();if(lg) t+='\n\nConnection log:\n'+lg;
    v2Copy(t,'Report copied.');
  });
  // ---- Connection log: shows the newest lines while its box is open ----
  var v2LogTimer=0;
  function v2LogPaint(){
    var pre=$('#connLog');if(!pre) return;
    var t=v2LogText();
    if(!(NB&&NB.log)) t='The connection log is only in the Android app.';
    else if(!t) t='Nothing yet. Tap Connect on Home and the steps appear here.';
    if(pre._t!==t){pre._t=t;pre.textContent=t;pre.scrollTop=pre.scrollHeight}
  }
  (function(){var b=$('#logBox');if(!b) return;b.addEventListener('toggle',function(){
    clearInterval(v2LogTimer);if(b.open){v2LogPaint();v2LogTimer=setInterval(v2LogPaint,1000)}})})();
  v2Click('#logCopy',function(){var t=v2LogText();if(!t){toast('The log is empty.');return}v2Copy(t,'Log copied.')});
  v2Click('#logClear',function(){try{NB&&NB.clearLog&&NB.clearLog()}catch(_){}var p=$('#connLog');if(p) p._t='';v2LogPaint()});
  // ---- H4.0 / H6.0 hubs: choose the hub by its Bluetooth address ----
  var hFindSlot=-1,hFindTimer=0;
  var hst=$('#hStall');if(hst){hst.addEventListener('change',function(){C.stall=hst.checked;save()})}
  window.hAddrPaint=function(){
    var hs0=$('#hStall');if(hs0) hs0.checked=C.stall!==false;
    var box=$('#hAddr');if(!box) return;box.textContent='';
    var any=false;
    [0,1,2].forEach(function(s){
      if(!(C.hubs[s]>=0&&isHall(s))) return;any=true;
      var row=document.createElement('div');row.className='hrow';
      var t=document.createElement('span');var a=hubAddr(s);
      t.textContent='Hub '+(s+1)+' · '+(a?((C.hubA[s].n||'hub')+' '+a):'no hub chosen');row.appendChild(t);
      var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=hFindSlot===s?'Stop':'Find hub';
      b.addEventListener('click',function(){hFind(s)});row.appendChild(b);box.appendChild(row)});
    var ul=document.createElement('ul');ul.id='hFindList';ul.className='v2-ins';box.appendChild(ul);
    box.hidden=!any;hFindPaint();
  };
  function hFindPaint(){
    var ul=$('#hFindList');if(!ul) return;ul.textContent='';
    if(hFindSlot<0) return;
    var d={list:[]};try{d=NB&&NB.scanResults?JSON.parse(NB.scanResults()||'{}'):d}catch(_){}
    var hubs=(d.list||[]).filter(function(r){return /^YX-\d/i.test(r.n||'')});
    if(!hubs.length){var e=document.createElement('li');e.textContent=d.scanning?'Looking for hubs. Switch the hub on and hold the phone close.':'No H4.0 / H6.0 hub found. Switch it on, close the Mould King app and try again.';ul.appendChild(e)}
    hubs.forEach(function(r){var li=document.createElement('li');li.className='hub';li.tabIndex=0;li.setAttribute('role','button');
      var b=document.createElement('b');b.textContent=r.n+' · '+r.a;li.appendChild(b);
      var sm=document.createElement('small');sm.textContent=r.r+' dBm · tap to use for hub '+(hFindSlot+1);li.appendChild(sm);
      var pick=function(){var s=hFindSlot;C.hubA[s]={a:String(r.a).toUpperCase(),n:r.n};
        var ports=/^YX-0[26]/i.test(r.n)?16:14;if(C.hubT[s]!==ports){C.hubT[s]=ports;onHubChange(s,C.hubs[s],ports)}
        hFindStop();save();window.hAddrPaint();syncAll();toast('Hub '+(s+1)+': '+r.n)};
      li.addEventListener('click',pick);li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}});ul.appendChild(li)});
  }
  function hFindStop(){hFindSlot=-1;clearInterval(hFindTimer);try{NB&&NB.scanStop&&NB.scanStop()}catch(_){}}
  function hFind(s){
    if(hFindSlot===s){hFindStop();window.hAddrPaint();return}
    if(!(NB&&NB.scanStart)){toast('Finding a hub works in the Android app.');return}
    hFindSlot=s;try{NB.scanStart()}catch(_){}
    clearInterval(hFindTimer);hFindTimer=setInterval(function(){if(hFindSlot<0) return;hFindPaint();var d={};try{d=JSON.parse(NB.scanResults()||'{}')}catch(_){}if(!d.scanning){hFindStop();window.hAddrPaint()}},1000);
    window.hAddrPaint();
  }
  // ---- Connect sheet (Home › Connect): set up to three hubs (type and module), find H4.0 / H6.0 hubs, then connect ----
  var HTYPES=[[6,'MK 6.0'],[4,'MK 4.0'],[40,'MK 4.0 on/off'],[14,'H4.0 (direct)'],[16,'H6.0 (direct)']];
  function wizOpen(){
    var old=document.getElementById('wizSheet');if(old) old.remove();
    var ov=document.createElement('div');ov.id='wizSheet';ov.className='gedit';
    var bx=document.createElement('div');bx.className='gbox wn';bx.setAttribute('role','dialog');bx.setAttribute('aria-modal','true');ov.appendChild(bx);
    var timer=0;
    function mk(tag,txt,cls){var e=document.createElement(tag);if(txt!=null) e.textContent=tr2(txt);if(cls) e.className=cls;return e}
    function stopScan(){if(timer){clearInterval(timer);timer=0}try{NB&&NB.scanStop&&NB.scanStop()}catch(_){}}
    function done(){stopScan();ov.remove()}
    function btn(t,f,pri){var b=mk('button',t,'btn'+(pri?' pri':''));b.type='button';if(pri) b.setAttribute('aria-pressed','true');b.addEventListener('click',f);return b}
    bx.appendChild(mk('h3','Connect hubs'));
    bx.appendChild(mk('p','Turn the hubs on and hold them near the phone. Pick each hub’s type and module (M1, M2 or M3, chosen with the hub’s button), then tap Connect.','wn-sub'));
    var rows=mk('div',null,'wz-rows');bx.appendChild(rows);
    function paintRows(){
      rows.textContent='';
      [0,1,2].forEach(function(s){
        var r=mk('div',null,'wz-row'),lb=document.createElement('b');lb.textContent='Hub '+(s+1);r.appendChild(lb);
        var sm=document.createElement('select');sm.setAttribute('aria-label','Hub '+(s+1)+' module');
        (s?[[-1,'Off']]:[]).concat([[0,'M1'],[1,'M2'],[2,'M3']]).forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=tr2(o[1]);sm.appendChild(op)});
        sm.value=String(C.hubs[s]);
        var st=document.createElement('select');st.setAttribute('aria-label','Hub '+(s+1)+' type');
        HTYPES.forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];st.appendChild(op)});
        st.value=String(C.hubT[s]);st.disabled=C.hubs[s]<0;
        sm.addEventListener('change',function(){onHubChange(s,+sm.value);paintRows()});
        st.addEventListener('change',function(){onHubChange(s,C.hubs[s],+st.value);paintRows()});
        r.appendChild(sm);r.appendChild(st);
        if(C.hubs[s]>=0&&isHall(s)){var a=hubAddr(s),n=mk('small',null,'wz-addr');n.textContent=a?((C.hubA[s].n||'hub')+' · '+a):tr2('Not found yet: tap Find H4.0 / H6.0 hubs');if(!a) n.classList.add('warn');r.appendChild(n)}
        rows.appendChild(r)});
      cb.disabled=!hubsReadyQuiet();
    }
    function hubsReadyQuiet(){return activeSlots().every(function(s){return !isHall(s)||!!hubAddr(s)})}
    var ul=mk('ul',null,'v2-ins');ul.hidden=true;
    var sb=btn('Find H4.0 / H6.0 hubs',scan);
    bx.appendChild(sb);bx.appendChild(ul);
    // a found H hub goes to the H hub row still waiting for an address, else to a free row, else to Hub 1
    function slotFor(){
      var s=activeSlots().filter(function(k){return isHall(k)&&!hubAddr(k)})[0];if(s!=null) return s;
      for(var k=1;k<3;k++) if(C.hubs[k]<0) return k;return 0;
    }
    function paint(){
      var d={list:[]};try{d=NB&&NB.scanResults?JSON.parse(NB.scanResults()||'{}'):d}catch(_){}
      var hubs=(d.list||[]).filter(function(r){return /^YX-\d/i.test(r.n||'')});
      ul.textContent='';ul.hidden=false;
      hubs.forEach(function(r){var li=document.createElement('li');li.className='hub';li.tabIndex=0;li.setAttribute('role','button');
        var b=document.createElement('b');b.textContent=r.n+' · '+r.a;li.appendChild(b);
        var sm=document.createElement('small');sm.textContent=r.r+' dBm';li.appendChild(sm);
        var pick=function(){var s=slotFor(),ty=/^YX-0[26]/i.test(r.n)?16:14;
          C.hubA[s]={a:String(r.a).toUpperCase(),n:r.n||''};onHubChange(s,C.hubs[s]>=0?C.hubs[s]:0,ty);
          stopScan();sb.textContent=tr2('Find H4.0 / H6.0 hubs');ul.hidden=true;paintRows();toast('Hub '+(s+1)+': '+r.n)};
        li.addEventListener('click',pick);li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}});ul.appendChild(li)});
      if(!hubs.length){var e=document.createElement('li');e.textContent=tr2(d.scanning?'Looking for hubs. Switch the hub on and hold the phone close.':'No H4.0 / H6.0 hub found. Switch it on, close the Mould King app and try again.');ul.appendChild(e)}
      if(!d.scanning&&timer){clearInterval(timer);timer=0;sb.textContent=tr2('Find H4.0 / H6.0 hubs')}
    }
    function scan(){
      if(timer){stopScan();sb.textContent=tr2('Find H4.0 / H6.0 hubs');ul.hidden=true;return}
      if(!(NB&&NB.scanStart)){toast('Finding a hub works in the Android app.');return}
      try{NB.scanStart()}catch(_){}
      sb.textContent=tr2('Stop');timer=setInterval(paint,800);setTimeout(paint,300);
    }
    var cb=btn('Connect',function(){if(!hubsReadyQuiet()) return;done();var c=document.getElementById('hubConn');if(c&&!S.connected) c.click()},true);
    var rr=mk('div',null,'rec-row');rr.appendChild(btn('Close',done));rr.appendChild(cb);bx.appendChild(rr);
    ov.addEventListener('click',function(e){if(e.target===ov) done()});
    paintRows();
    document.body.appendChild(ov);
  }
  v2Click('#hubGo',wizOpen);
  // ---- Bluetooth inspector: nearby devices, hubs highlighted ----
  var v2InsTimer=0;
  function v2InsPaint(){
    var ul=$('#insList'),btn=$('#insScan');if(!ul) return;
    var d={list:[]};try{d=NB&&NB.scanResults?JSON.parse(NB.scanResults()||'{}'):d}catch(_){}
    if(btn){var lab=d.scanning?'Scanning… tap to stop':'Scan for 30 s';v2T(btn,lab)}
    var key=JSON.stringify((d.list||[]).map(function(r){return [r.a,r.n,Math.round(r.r/3),r.m]}))+d.scanning+d.err;
    if(ul._k===key) return;ul._k=key;ul.textContent='';
    if(d.err){var e=document.createElement('li');e.textContent='The scan failed (code '+d.err+'). Turn Bluetooth off and on, then try again.';ul.appendChild(e)}
    else if(!(d.list||[]).length){var e2=document.createElement('li');e2.textContent=d.scanning?'Looking for devices…':'No devices yet. Turn the hub on, hold the phone close and scan.';ul.appendChild(e2)}
    (d.list||[]).forEach(function(r){
      var li=document.createElement('li'),isHub=/^YX-\d/i.test(r.n||'');
      if(isHub) li.className='hub';
      var b=document.createElement('b');b.textContent=(r.n||'(no name)')+(isHub?'  · Mould King hub':'');li.appendChild(b);
      var s1=document.createElement('small');s1.textContent=r.r+' dBm · '+r.a;li.appendChild(s1);
      if(r.m){var s2=document.createElement('small');s2.textContent='Manufacturer data '+r.m;li.appendChild(s2)}
      if(r.u){var s3=document.createElement('small');s3.textContent='Services '+r.u;li.appendChild(s3)}
      ul.appendChild(li)});
  }
  (function(){var b=$('#insBox');if(!b) return;b.addEventListener('toggle',function(){
    clearInterval(v2InsTimer);if(b.open){v2InsPaint();v2InsTimer=setInterval(v2InsPaint,1000)}else{try{NB&&NB.scanStop&&NB.scanStop()}catch(_){}}})})();
  v2Click('#insScan',function(){
    if(!(NB&&NB.scanStart)){toast('The scan works in the Android app.');return}
    var d={};try{d=JSON.parse(NB.scanResults()||'{}')}catch(_){}
    try{if(d.scanning) NB.scanStop(); else NB.scanStart()}catch(_){}
    setTimeout(v2InsPaint,400);
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
    var dm=true;
    if(PAL.g!==(cb?PALCB.g:PAL0.g)||DIRMK!==dm){palSet(cb);DIRMK=dm;if(typeof syncBoard==='function'&&R2._pal!==undefined) syncBoard()}R2._pal=1;
    var fs=store.prefs.fs||100;if(R2._fs!==fs){R2._fs=fs;try{if(NB&&NB.textZoom) NB.textZoom(fs)}catch(_){}}
    v2T($('#sTextV'),fs>=130?'Largest':fs>=115?'Large':'Normal');
  }
  v2Click('#sHC',function(){store.prefs.hc=!store.prefs.hc;save();v2Theme();});
  v2Click('#sCB',function(){store.prefs.cb=!store.prefs.cb;save();v2Theme();toast(store.prefs.cb?'Colour-blind colours on: blue, orange and vermillion.':'Normal colours.')});
  v2Click('#sText',function(){var f=store.prefs.fs||100;store.prefs.fs=f>=130?100:f>=115?130:115;save();v2Theme();feedback('ok');
    if(!(NB&&NB.textZoom)) toast('Text size works in the Android app.')});

  // ---- Safety centre: one score for every protection, with the next best step ----
  var SFI=[
    {k:'built',t:'Stops sending if the app freezes (built in)',p:15,on:function(){return true}},
    {k:'idle',t:'Auto-stop when idle',p:30,on:function(){return !!(C.safety&&C.safety.idle)},go:'#sfIdle'},
    {k:'play',t:'Daily play time limit',p:25,on:function(){return !!store.prefs.playLim},go:'#sPlay'},
    {k:'run',t:'Stop a channel after a long run',p:10,on:function(){return !!(C.safety&&C.safety.run)},go:'#sfRun'},
    {k:'warn',t:'Warn after long full power',p:10,on:function(){return !!(C.safety&&C.safety.warn)},go:'#sfWarn'},
    {k:'ramp',t:'Acceleration smoothing at 30 or more',p:10,on:function(){return (C.ramp||0)>=30},go:'#ramp'}
  ];
  function sfScore(){var sc=0;SFI.forEach(function(x){if(x.on()) sc+=x.p});return sc}
  function sfPaint(force){
    var box=$('#sfScore');if(!box) return;
    var key=SFI.map(function(x){return x.on()?1:0}).join('')+store.prefs.lang;if(!force&&box._k===key) return;box._k=key;
    var sc=sfScore(), cl=sc>=80?'ok':sc>=55?'warn':'bad', miss=SFI.filter(function(x){return !x.on()}).sort(function(a,b){return b.p-a.p})[0];
    var sh=box.querySelector('.sf-fill');sh.setAttribute('stroke-dasharray',sc+' 100');sh.setAttribute('class','sf-fill '+cl);
    box.querySelector('.sf-n').textContent=String(sc);
    var tip=box.querySelector('.sf-tip');tip.textContent=sc>=80?'High protection':'Next: '+(miss?miss.t:'')+' (+'+(miss?miss.p:0)+')';tip.className='sf-tip '+cl;
    var ul=box.querySelector('.sf-list');ul.innerHTML='';
    SFI.forEach(function(x){var on=x.on(),b=document.createElement('button');b.type='button';b.className='sf-it'+(on?' on':'');b.disabled=!x.go;
      b.innerHTML='<i aria-hidden="true">'+(on?'✓':'○')+'</i><span></span><small>+'+x.p+'</small>';b.querySelector('span').textContent=x.t;
      b.setAttribute('aria-label',x.t+(on?', on':', off')+', '+x.p+' points');
      if(x.go) b.addEventListener('click',function(){
        if(x.go==='#sPlay'){v2Go('settings');setTimeout(function(){var e=$('#sPlay');if(e){try{e.scrollIntoView({block:'center'})}catch(_){}srHit(e)}toast('Hold for 2 seconds to change (parents).',3000)},60);return}
        var e=$(x.go);if(e){try{e.scrollIntoView({block:'center'})}catch(_){}srHit(e.closest('.set-row,label')||e);try{e.focus()}catch(_){}}});
      ul.appendChild(b)});
    box.setAttribute('aria-label','Safety score '+sc+' of 100');
  }
  // ---- Search every setting by name ----
  var SR_SCR=[['#scrSet','settings'],['#scrHome','home'],['#calCard','home'],['#setCard','safety'],['#ioCard','backup'],['#tiltCard','m-tilt'],['#padCard','m-pad'],['main > section.model','medit']];
  var SR_WHERE={settings:'Settings',home:'Home',safety:'Limits & auto-stop',backup:'Backup & restore','m-tilt':'Tilt steering','m-pad':'Gamepad','m-app':'App',medit:'Model settings'};
  function srNorm(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim()}
  function srIndex(){
    var out=[],seen={};
    SR_SCR.forEach(function(sv){var root=document.querySelector(sv[0]);if(!root) return;
      var nodes=root.querySelectorAll('.v2-li > span, .set-top > span:first-child, label, summary > span, h2, .v2-grp, button.btn');
      for(var i=0;i<nodes.length;i++){var n=nodes[i],t='';
        if(n.tagName==='LABEL'){for(var c=n.firstChild;c;c=c.nextSibling){if(c.nodeType===3) t+=c.data}if(!t.trim()){var sp=n.querySelector('.set-top > span:first-child');if(sp) continue}}
        else t=n.textContent;
        t=t.replace(/\s+/g,' ').trim();if(t.length<3||t.length>70) continue;
        var tg=n.closest('.v2-li, .set-row, label, details, .rec-row, .card')||n;
        var k=sv[1]+'|'+t;if(seen[k]) continue;seen[k]=1;
        out.push({t:t,v:sv[1],el:tg,n:srNorm(t)});
      }});
    return out;
  }
  function srScore(q,n){if(!q) return 0;var p=n.indexOf(q);if(p===0) return 4;if(p>0) return n.charAt(p-1)===' '?3.5:3;
    var j=0;for(var k=0;k<n.length&&j<q.length;k++) if(n[k]===q[j]) j++;if(j===q.length) return 1.5;
    // one typo: every word of the query must almost match a word
    var ws=n.split(' '),ok=q.split(' ').every(function(w){return w.length>3&&ws.some(function(x){return srNear(w,x.slice(0,w.length+1))})});return ok?1:0}
  function srNear(a,b){if(Math.abs(a.length-b.length)>1) return false;var i=0,j=0,e=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++e>1) return false;if(a.length>b.length) i++;else if(b.length>a.length) j++;else{i++;j++}}return e+(a.length-i)+(b.length-j)<=1}
  function srHit(el){if(!el) return;el.classList.remove('sr-hit');void el.offsetWidth;el.classList.add('sr-hit');setTimeout(function(){el.classList.remove('sr-hit')},1800)}
  function srGo(r){
    var inp=$('#setSearch');if(inp){inp.value='';srDraw()}
    v2Go(r.v);feedback('tap');
    setTimeout(function(){var d=r.el.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details')}
      try{r.el.scrollIntoView({block:'center'})}catch(_){}srHit(r.el)},80);
  }
  function srDraw(){
    var inp=$('#setSearch'),box=$('#setRes');if(!inp||!box) return;
    var q=srNorm(inp.value);box.innerHTML='';box.hidden=!q;if(!q) return;
    var L=srIndex().map(function(r){return [srScore(q,r.n),r]}).filter(function(x){return x[0]>0}).sort(function(a,b){return b[0]-a[0]||a[1].t.length-b[1].t.length}).slice(0,8);
    if(!L.length){var e=document.createElement('p');e.className='note';e.textContent='No setting matches.';box.appendChild(e);return}
    L.forEach(function(x){var r=x[1],b=document.createElement('button');b.type='button';b.className='sr-it';
      var nm=document.createElement('span'),p=srNorm(r.t).indexOf(q);
      if(p>=0&&r.t.length===srNorm(r.t).length){nm.appendChild(document.createTextNode(r.t.slice(0,p)));var m=document.createElement('mark');m.textContent=r.t.slice(p,p+q.length);nm.appendChild(m);nm.appendChild(document.createTextNode(r.t.slice(p+q.length)))}else nm.textContent=r.t;
      var w=document.createElement('small');w.textContent=SR_WHERE[r.v]||'';b.appendChild(nm);b.appendChild(w);
      b.addEventListener('click',function(){srGo(r)});box.appendChild(b)});
  }
  (function(){var i=$('#setSearch');if(i){i.addEventListener('input',srDraw);i.addEventListener('keydown',function(e){if(e.key==='Enter'){var f=$('#setRes .sr-it');if(f){e.preventDefault();f.click()}}})}})();
  v2Click('#sTour',function(){v2Go('home');setTimeout(guideOpen,120)});
  // ---- Motion & haptics: a light tap on app buttons (not on the driving widgets) ----
  document.addEventListener('pointerdown',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('.v2-li:not(.v2-sw), .v2-scr .btn, #cols .card .btn, .gbox .btn, .v2-mmain, .v2-ib, #tabbar button');
    if(!b||b.disabled||b.closest('#boardGrid')) return;feedback('tap');
  },true);
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.v2-sw');if(b) setTimeout(function(){feedback('tick')},0)},true);

