// AEON_NOPERSIST_LAST5
(function(){try{
  const K='last5Hist'; const S=sessionStorage;
  const g=S.getItem.bind(S), s=S.setItem.bind(S), r=S.removeItem.bind(S);
  S.getItem = (k)=> k===K ? null : g(k);
  S.setItem = (k,v)=> k===K ? void 0 : s(k,v);
  S.removeItem = (k)=> k===K ? void 0 : r(k);
}catch(_){}})();
(() => {
  const WRAP="last5Dice", CSS="last5-dice-css";
  document.getElementById(WRAP)?.remove();
  document.getElementById(CSS)?.remove();

  const st=document.createElement("style"); st.id=CSS; st.textContent=`
    #last5Dice{position:fixed;top:calc(env(safe-area-inset-top,0px)+12px);left:50%;transform:translateX(-50%);
      display:none;gap:14px;padding:12px 20px;border-radius:999px;background:#fff;border:2px solid #111;
      box-shadow:0 8px 16px rgba(0,0,0,.15);pointer-events:none;z-index:5000;will-change:transform;contain:paint layout}
    #last5Dice.show{display:flex!important}
    #last5Dice i{position:relative;width:28px;height:28px;flex:0 0 28px;background:center/contain no-repeat;
      will-change:transform,opacity;transform:translateZ(0)}
    #last5Dice i.newest::after{content:"";position:absolute;left:50%;bottom:-7px;width:18px;height:2px;
      background:#e10600;border-radius:2px;transform:translateX(-50%);box-shadow:0 0 0 1px #111}
  `; document.head.appendChild(st);

  const wrap=document.createElement("div"); wrap.id=WRAP; document.body.appendChild(wrap);

  const ICON=(()=>{const m=new Map(),p={tl:[8,8],tr:[16,8],ml:[8,12],mid:[12,12],mr:[16,12],bl:[8,16],br:[16,16]},
    f={1:["mid"],2:["tl","br"],3:["tl","mid","br"],4:["tl","tr","bl","br"],5:["tl","tr","mid","bl","br"],6:["tl","tr","ml","mr","bl","br"]};
    for(let n=1;n<=6;n++){const dots=f[n].map(k=>`<circle cx="${p[k][0]}" cy="${p[k][1]}" r="2.25"/>`).join(""),
      svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="#0b0d10"/><g fill="#e10600">${dots}</g></svg>`;
      m.set(n,`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);} return n=>m.get(n)||m.get(1); })();

  let hist=[]; try{hist=JSON.parse(sessionStorage.getItem("last5Hist")||"[]")}catch{}
  const pool=[]; const get=()=>pool.pop()||document.createElement("i"); const give=el=>{el.className="";el.style.backgroundImage="";pool.push(el)};

  function render(pop=false){
    if(!hist.length){wrap.classList.remove("show"); wrap.innerHTML=""; return;}
    wrap.classList.add("show"); while(wrap.firstChild) give(wrap.removeChild(wrap.firstChild));
    const arr=hist.slice(-5);
    arr.forEach((v,i)=>{const el=get(); el.style.backgroundImage=ICON(v);
      if(i===arr.length-1){ el.classList.add("newest"); if(pop){
        el.style.opacity="0"; el.style.transform="translateY(10px) scale(.85)"; wrap.appendChild(el);
        requestAnimationFrame(()=>{ el.animate(
          [{opacity:0,transform:"translateY(10px) scale(.85)"},{opacity:1,transform:"none"}],
          {duration:220,easing:"cubic-bezier(.2,.8,.2,1)"} ); el.style.opacity=""; el.style.transform="";}); return; }
      }
      wrap.appendChild(el);
    });
  }

  function push(n){const t=performance.now(); if(!(n>=1&&n<=6))return;
    if(push._last===n && t-push._at<250)return; push._last=n; push._at=t;
    hist.push(n); if(hist.length>5) hist.splice(0,hist.length-5);
    try{sessionStorage.setItem("last5Hist",JSON.stringify(hist));}catch{} render(true);
  }

  const on=e=>push(+e?.detail?.value||0);
  ["aeon:result","aeon:result:calc"].forEach(evt=>{
    [window,document,document.body].forEach(t=>t?.addEventListener?.(evt,on,{passive:true}));
  });
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible") render(false)},{passive:true});
  window.addEventListener("pageshow",()=>render(false),{passive:true});
  render(false);
  console.log("[last-5] v4k.1 installed");
})();

// version v4k.2
;(()=>{try{
  const r=typeof render==="function"?render:null;
  const go=()=>{try{r&&r(false)}catch(_){}}; 
  addEventListener("hashchange",go,{passive:true});
  addEventListener("popstate",go,{passive:true});
}catch(_){}})();
