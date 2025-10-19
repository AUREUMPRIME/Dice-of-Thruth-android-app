/* AEON — last5 PATCH v6.4 (no persistence, single micro-buzz, stable ring, hide-until-first, read 5 always) */
(() => {
  const NS = "AEON_LAST5_V64";
  if (window[NS]?.uninstall) window[NS].uninstall();

  const wrap = document.getElementById('last5Dice');
  if (!wrap) { console.warn('last5Dice not found'); return; }
  wrap.style.pointerEvents = 'auto'; wrap.style.cursor = 'pointer';

  // ---------- Styles: keep centering while flashing; stable outline ring; hide class ----------
  const st = document.createElement('style'); st.id = NS;
  st.textContent = `
    #last5Dice{-webkit-tap-highlight-color:transparent;outline:0}
    #last5Dice *:focus{outline:0!important}
    #last5Dice.has-pillfx.pill-flash{ transform: translateX(-50%) scale(1.035) !important }
    #last5Dice i{ position:relative; display:inline-block } /* anchor ring to each mini-die */
    #last5Dice i.aeon-ring{ outline:2px solid #e10600; outline-offset:2px }
    #last5Dice i.aeon-ring.fade{ outline-color:transparent; transition:outline-color .35s ease }
    #last5Dice.aeon-hide{ opacity:0; visibility:hidden; pointer-events:none }
  `;
  document.head.appendChild(st);
  wrap.classList.add('has-pillfx');

  // ---------- Haptics: single ultra-light buzz on press; debounce to prevent doubles ----------
  const realVib = (Navigator&&Navigator.prototype&&Navigator.prototype.vibrate)
    ? p=>{ try{ Navigator.prototype.vibrate.call(navigator,p); }catch{} }
    : p=>{ try{ navigator.vibrate && navigator.vibrate(p); }catch{} };
  let lastDown=0;
  const pressStart = e => { const now=performance.now(); if(now-lastDown<260) return; lastDown=now;
    wrap.classList.add('pill-flash'); realVib(4); // micro buzz
  };
  const pressEnd = () => wrap.classList.remove('pill-flash');
  wrap.addEventListener('pointerdown', pressStart, {passive:false, capture:true});
  ['pointerup','pointercancel','pointerleave','touchend'].forEach(ev =>
    wrap.addEventListener(ev, pressEnd, {passive:true, capture:true})
  );

  // ---------- Ephemeral history ONLY (no storage). Hide pill until first result ----------
  let hist = [];                 // in-memory only; reload clears it
  wrap.classList.add('aeon-hide');
  function onResult(e){
    let n = +(e?.detail?.value || 0);
    if (!(n>=1&&n<=6)) { const t=document.querySelector('#count')?.textContent||''; n=+t.replace(/\D/g,''); }
    if (n>=1&&n<=6){
      hist.push(n); while (hist.length>5) hist.shift();
      wrap.classList.remove('aeon-hide');
    }
  }
  addEventListener('aeon:result', onResult, {passive:true});
  addEventListener('aeon:result:calc', onResult, {passive:true});

  // ---------- TTS (Spanish US, female if available) ----------
  const words=['','uno','dos','tres','cuatro','cinco','seis'];
  const getMute = ()=>JSON.parse(sessionStorage.getItem('ttsPrev_mute')||'false');
  const getVol  = ()=>+sessionStorage.getItem('ttsPrev_vol')||0.8;
  const pickVoice = () => {
    const vs = speechSynthesis.getVoices()||[];
    let c = vs.filter(v=>/^es(-|_)?US/i.test(v.lang)||/Estados Unidos/i.test(v.name));
    if (!c.length) c = vs.filter(v=>/^es/i.test(v.lang));
    return c.find(v=>/female|femen/i.test(v.name)) || c[0] || null;
  };
  const speak = n => {
    if (getMute() || !('speechSynthesis' in window) || !(n>=1&&n<=6)) return;
    const u = new SpeechSynthesisUtterance(words[n|0]); const v = pickVoice(); if (v) u.voice = v;
    u.lang = (v&&v.lang) || 'es-US'; u.rate=.95; u.pitch=1.1; u.volume=Math.max(0,Math.min(1,getVol()));
    try{ speechSynthesis.speak(u); }catch{}
  };
  let primed=false; addEventListener('pointerdown',()=>{ if(primed) return; primed=true;
    try{ speechSynthesis.resume(); const p=new SpeechSynthesisUtterance('uno'); p.volume=0;
         speechSynthesis.speak(p); setTimeout(()=>speechSynthesis.cancel(),30);}catch{} }, {once:true, passive:false});
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;

  // ---------- Tap: always pulse all five positions oldest→newest; speak when value exists ----------
  const icons = ()=>Array.from(wrap.querySelectorAll('i')).slice(0,5);
  let playing=false;
  function onTap(e){
    e.preventDefault(); e.stopPropagation();
    if (playing) return; playing=true;
    const els = icons();
    const seq = Array(5).fill(null); const start = Math.max(0, 5 - hist.length);
    for (let i=0;i<hist.length;i++) seq[start+i] = hist[i];

    try{ speechSynthesis.cancel(); }catch{}
    let t=0;
    for (let i=0;i<5;i++){
      setTimeout(()=>{
        const el = els[i];
        if (el){
          el.classList.remove('aeon-ring','fade'); void el.offsetWidth;
          el.classList.add('aeon-ring'); requestAnimationFrame(()=>el.classList.add('fade'));
          setTimeout(()=>el.classList.remove('aeon-ring','fade'),380);
        }
        speak(seq[i]);
      }, t);
      t += 550;
    }
    setTimeout(()=>{ playing=false; }, t+70);
  }
  wrap.addEventListener('click', onTap, {passive:false, capture:true});

  window[NS] = { uninstall(){
    removeEventListener('aeon:result', onResult, {passive:true});
    removeEventListener('aeon:result:calc', onResult, {passive:true});
    wrap.removeEventListener('pointerdown', pressStart, {capture:true});
    ['pointerup','pointercancel','pointerleave','touchend'].forEach(ev=>wrap.removeEventListener(ev, pressEnd, {capture:true}));
    wrap.removeEventListener('click', onTap, {capture:true});
    st.remove(); delete window[NS];
  }};
  console.log('last5 PATCH v6.4 ready');
})();
