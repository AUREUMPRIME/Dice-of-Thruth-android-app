/* AEON — tap-dots toggle PERM v3
   - Default OFF; dots always invisible (visual only)
   - Hold 1s on stats bar “1” → ON  (functionality only)
   - Hold 1s on stats bar “6” → OFF (functionality only)
   - 4ms vibration on toggle
   - Disables functionality by capturing and cancelling events on #touchOverlay
   - Idempotent, uninstall via window.AEON_TAPDOTS_TOGGLE?.uninstall()
*/
(()=>{ const NS="AEON_TAPDOTS_TOGGLE";
  if(window[NS]?.uninstall) window[NS].uninstall();

  // Always hide visual dots; functionality is controlled separately.
  const st=document.createElement('style'); st.id=NS;
  st.textContent=`.tap-dots{opacity:0!important;pointer-events:none!important}`;
  document.head.appendChild(st);

  const overlay=document.getElementById('touchOverlay');
  if(!overlay){ console.warn('touchOverlay not found'); return; }

  let enabled=false; // default OFF

  // Intercept overlay events in capture phase when disabled.
  const swallow=(e)=>{ if(!enabled){ try{ e.preventDefault(); e.stopImmediatePropagation(); }catch(_){} } };
  ['pointerdown','pointerup','click'].forEach(ev=>{
    overlay.addEventListener(ev, swallow, {capture:true, passive:false});
  });

  // Long-press on stats bars: bar 1 -> ON, bar 6 -> OFF.
  const vib4=()=>{ try{
    if (Navigator&&Navigator.prototype&&Navigator.prototype.vibrate) Navigator.prototype.vibrate.call(navigator,4);
    else if (navigator.vibrate) navigator.vibrate(4);
  }catch(_){} };

  const HOLD_MS=1000;
  const barsHost=document.getElementById('bars');
  if(barsHost){
    const timers=new WeakMap();

    const faceOfBar=(bar)=>{
      const lab=bar.querySelector('.lab');
      const n=lab?parseInt(lab.textContent,10):NaN;
      if(n>=1&&n<=6) return n;
      const all=[...barsHost.querySelectorAll('.bar')];
      const ix=all.indexOf(bar); return ix>=0?ix+1:NaN;
    };

    const onDown=(e)=>{
      const bar=e.target.closest?.('.bar'); if(!bar||!barsHost.contains(bar)) return;
      const f=faceOfBar(bar); if(f!==1 && f!==6) return;
      timers.set(bar, setTimeout(()=>{
        if(f===1){ enabled=true;  vib4(); }
        if(f===6){ enabled=false; vib4(); }
        bar.__aeon_lp_at=Date.now();
      }, HOLD_MS));
    };

    const onUp=(e)=>{
      const bar=e.target.closest?.('.bar'); if(!bar) return;
      const t=timers.get(bar); if(t){ clearTimeout(t); timers.delete(bar); }
      if(bar.__aeon_lp_at && Date.now()-bar.__aeon_lp_at<350){ e.preventDefault(); e.stopPropagation(); }
    };

    barsHost.addEventListener('pointerdown', onDown, {capture:true, passive:true});
    ['pointerup','pointercancel','pointerleave','touchend','mouseup'].forEach(ev=>{
      barsHost.addEventListener(ev, onUp, {capture:true, passive:false});
    });
  }else{
    console.warn('bars container not found');
  }

  window[NS]={ uninstall(){
    try{ st.remove(); }catch(_){}
    try{ ['pointerdown','pointerup','click'].forEach(ev=> overlay.removeEventListener(ev, swallow, {capture:true})); }catch(_){}
    delete window[NS];
    console.log('AEON tap-dots toggle removed');
  }};

  console.log('AEON tap-dots toggle PERM v3 active (default OFF; dots hidden).');
})();
