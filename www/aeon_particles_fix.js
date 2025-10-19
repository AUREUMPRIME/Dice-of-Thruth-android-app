/* AEON — particles tune PREVIEW v1
   - Cut red particles by ~50%, preferring ones near the scene center
   - Make ~50% of black particles vanish 1s after they “break”
   - No file writes; uninstall via window.AEON_PARTS_FIX?.uninstall()
*/
(() => {
  const NS = "AEON_PARTS_FIX";
  if (window[NS]?.uninstall) window[NS].uninstall();

  // ---------- utils
  const rgb = (s) => {
    const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m ? [+m[1], +m[2], +m[3]] : [NaN, NaN, NaN];
  };
  const isRed = ([r,g,b]) => r>=170 && g<=90 && b<=90;       // tolerant “red”
  const isBlack = ([r,g,b]) => r<=70 && g<=70 && b<=70;      // dark dots
  const isSmallCircle = (el, cs) => {
    const w = parseFloat(cs.width)||0, h = parseFloat(cs.height)||0;
    return (w>4 && h>4 && w<22 && h<22) && (cs.borderRadius.includes("%") || +cs.borderTopLeftRadius.replace("px","")>=6);
  };
  const centerOfScene = () => {
    const cand = document.querySelector("#cube, .cube, canvas");
    if (cand) { const r = cand.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }
    return [innerWidth/2, innerHeight/2];
  };
  const dist2 = (x1,y1,x2,y2)=> (x1-x2)*(x1-x2)+(y1-y2)*(y1-y2);

  // Collect probable background particles (DOM circles), avoid UI pills/menus
  const allEls = Array.from(document.querySelectorAll("body *"))
    .filter(el => {
      if (el.id === "last5Dice") return false;
      if (el.closest("#last5Dice")) return false;
      const cs = getComputedStyle(el);
      if (cs.position !== "absolute" && cs.position !== "fixed") return false;
      return isSmallCircle(el, cs);
    });

  const redEls = [], blackEls = [];
  for (const el of allEls) {
    const cs = getComputedStyle(el);
    const col = rgb(cs.backgroundColor || cs.color);
    if (isRed(col)) redEls.push(el);
    else if (isBlack(col)) blackEls.push(el);
  }

  // ---------- 1) Reduce red particles near center by ~50%
  (() => {
    const [cx, cy] = centerOfScene();
    const ranked = redEls.map(el => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width/2, y = r.top + r.height/2;
        return { el, d2: dist2(x,y,cx,cy) };
      }).sort((a,b)=> a.d2 - b.d2); // nearest first
    const cut = Math.floor(ranked.length/2);
    for (let i=0;i<cut;i++) {
      const el = ranked[i].el;
      el.dataset.aeonParts = "hiddenRed";
      el.style.transition = "opacity .25s linear";
      el.style.opacity = "0";
    }
    console.log(`[particles] red total=${redEls.length}, hidden=${cut}`);
  })();

  // ---------- 2) For ~50% of black dots, vanish 1s after they “break”
  const pickFast = new Set(blackEls.filter((_,i)=> i%2===0));
  const observers = [];
  const scheduleFade = (el) => {
    if (el.dataset.aeonFastGone) return;
    el.dataset.aeonFastGone = "1";
    el.style.transition = "opacity 1s linear";
    void el.offsetWidth;
    requestAnimationFrame(() => { el.style.opacity = "0"; });
    setTimeout(() => { el.style.display = "none"; }, 1100);
  };
  const looksLikeBreak = (el) => {
    const cls = el.className || "";
    if (/(break|burst|explode|dead)/i.test(cls)) return true;
    const tr = getComputedStyle(el).transform;
    return tr && tr !== "none" && /matrix|scale/.test(tr);
  };
  for (const el of pickFast) {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes" && (m.attributeName === "class" || m.attributeName === "style")) {
          if (looksLikeBreak(el)) scheduleFade(el);
        }
      }
    });
    obs.observe(el, { attributes:true, attributeFilter:["class","style"] });
    observers.push(obs);
    setTimeout(() => { if (looksLikeBreak(el)) scheduleFade(el); }, 50);
    setTimeout(() => { try{obs.disconnect()}catch{} }, 8000);
  }
  console.log(`[particles] black total=${blackEls.length}, fast-vanish=${pickFast.size}`);

  // ---------- uninstall
  window[NS] = {
    uninstall(){
      for (const el of document.querySelectorAll("[data-aeon-parts='hiddenRed']")) {
        el.style.opacity = ""; el.style.transition = ""; el.dataset.aeonParts = "";
      }
      observers.forEach(o=>{ try{o.disconnect()}catch{} });
      delete window[NS];
      console.log("AEON particles script removed");
    }
  };

  console.log("AEON particles v1 active (red halved near center; half black vanish 1s post-break).");
})();
