window.BUILD_ID=20250914041840; console.log('BUILD_ID='+20250914041840)
window.BUILD_ID=20250914040747; console.log('BUILD_ID='+20250914040747)
window.BUILD_ID='20250914031215'; console.log('BUILD_ID='+window.BUILD_ID)
window.BUILD_ID=20250914024949; console.log('BUILD_ID='+20250914024949);
window.BUILD_ID=20250914015904; console.log('BUILD_ID=20250914015904');
console.log('BUILD_ID=20250914005637');

/* ===== public/_dev_sw_kill.js ===== */
(async () => {
  try{
    if('serviceWorker' in navigator){
      for(const r of rs){ try{ await r.unregister(); }catch{} }
    }
    if (window.caches){
    }
  }catch(_){}
})();

/* ===== public/pill_current_shim.js ===== */
(()=> {
  if (typeof window.currentValue === 'undefined') window.currentValue = 0;
  const up = e => {
    try { window.currentValue = Number(e?.detail?.value ?? window.currentValue) || 0; } catch {}
  };
  window.addEventListener('aeon:result:calc', up, {passive:true});
  window.addEventListener('aeon:result',      up, {passive:true});
})();

/* ===== public/pill_value_shim.js ===== */
(() => {
  if (typeof window !== 'undefined' && typeof window.setPillValue !== 'function') {
    window.setPillValue = function setPillValue(v) {
      if (v == null) return;
      try {
        const el = document.getElementById('pill');
        if (el) el.textContent = String(v);
      } catch (_) {}
    };
  }
})();

/* ===== public/pill_land_flash.js ===== */
(()=> {
  const el = document.getElementById('count');
  if(!el) return;
  const flash = () => {
    el.classList.remove('pill-flash');
    void el.offsetWidth;           // reflow to retrigger animation
    el.classList.add('pill-flash');
  };
  // existing behavior: flash when text becomes a number 1..6
  let prev = (el.textContent||'').trim();
  const isNum = t => /^[1-6]$/.test(t);
  new MutationObserver(() => {
    const t = (el.textContent||'').trim();
    if (t !== prev && isNum(t)) flash();
    prev = t;
  }).observe(el, {subtree:true, childList:true, characterData:true});
  // new behavior: always flash on settle event (covers same-number repeats)
  document.addEventListener('aeon:result', flash);
})();

/* ===== public/pill_infinity_live.js ===== */
(()=> {
  const pill = document.getElementById('count');
  if(!pill) return;

  const onStart = () => {
    pill.textContent = '∞';
    pill.classList.add('rolling');
  };

  const onNum = (e) => {
    const n = (e && e.detail && typeof e.detail.n !== 'undefined') ? e.detail.n : pill.textContent;
    pill.textContent = n;
    pill.classList.remove('rolling');
  };

  window.addEventListener('aeon:roll:start', onStart, {passive:true});
  window.addEventListener('aeon:result:calc', (e)=>{ setPillValue(e && e.detail && e.detail.value); }); // early show
  window.addEventListener('aeon:result', (e)=>{ setPillValue(e && e.detail && e.detail.value); });      // settle confirm
})();

/* ===== public/pill_live_bus.js ===== */
(()=>{
  const pill = document.getElementById('count');
  const btn  = document.getElementById('rollBtn');
  if(!pill || !btn) return;

  const fireResult = ()=>{
    const v = (pill.textContent||'').trim();
    if (/^[1-6]$/.test(v)) {
      document.dispatchEvent(new CustomEvent('aeon:result',{detail:{value:+v}}));
    }
  };

  const onDown = ()=>{
    pill.textContent = '∞';
    document.dispatchEvent(new CustomEvent('aeon:rolling'));
  };
  const onUp = ()=>{ setTimeout(fireResult, 30); };

  btn.addEventListener('pointerdown', onDown,  {passive:true});
  btn.addEventListener('pointerup',   onUp,    {passive:true});
  btn.addEventListener('pointerleave',onUp,    {passive:true});
  btn.addEventListener('pointercancel',onUp,   {passive:true});

  const mo = new MutationObserver(()=>fireResult());
  mo.observe(pill,{characterData:true,childList:true,subtree:true});
})();

/* ===== public/reset_feedback.js ===== */
(() => {
  const HAPTIC_MS = 14; // subtle, same on press & release
  const vib = () => { if ('vibrate' in navigator) navigator.vibrate(HAPTIC_MS); };

  const findReset = () => {
    const els = Array.from(document.querySelectorAll('button, [role="button"], .reset, .stats-reset'));
    for (const el of els) {
      const t = (el.textContent || '').trim().toUpperCase();
      if (t === 'RESET') return el;
    }
    return null;
  };

  const wire = () => {
    const btn = findReset();
    if (!btn) { setTimeout(wire, 300); return; }

    btn.classList.add('has-haptic');

    const onDown = () => { vib(); btn.classList.add('haptic-press'); };
    const onUp   = () => { setTimeout(()=>btn.classList.remove('haptic-press'), 90); vib(); };

    ['pointerdown','mousedown','touchstart'].forEach(e=>btn.addEventListener(e, onDown, {passive:true}));
    ['pointerup','mouseup','touchend','pointercancel','mouseleave'].forEach(e=>btn.addEventListener(e, onUp, {passive:true}));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();

/* ===== public/bgfx_random.js ===== */
(()=>{"use strict";
// --- debug switches: disable legacy bgfx blocks ---
const USE_LEGACY_RINGS = false;  // keep only ringsLiteV3
const USE_LEGACY_DOTS  = false;  // keep only floatersLiteV3

const c=document.getElementById("bgRnd"); if(!c) return;
const g=c.getContext("2d",{alpha:true});

// ---------- setup ----------
const DPR_CAP=1.5;
let dpr=Math.max(1,Math.min(DPR_CAP,window.devicePixelRatio||1));
let W=0,H=0,CX=0,CY=0,MAXR=0;
function fit(){W=innerWidth;H=innerHeight;CX=W/2;CY=H/2;MAXR=Math.hypot(W,H)/2;
  c.style.width=W+"px"; c.style.height=H+"px";
  c.width=Math.round(W*dpr); c.height=Math.round(H*dpr);
}
fit(); addEventListener("resize",()=>{dpr=Math.max(1,Math.min(DPR_CAP,window.devicePixelRatio||1)); fit(); rebuild();});

const css=getComputedStyle(document.documentElement);
const INK=(css.getPropertyValue("--ink").trim()||"#0b0d10");
const ACC=(css.getPropertyValue("--accent").trim()||"#e10600");
const TAU=Math.PI*2;
const rnd=()=>{try{return crypto.getRandomValues(new Uint32Array(1))[0]/2**32;}catch{return Math.random();}};
const fr=(a,b)=>a+(b-a)*rnd();

// ---------- rings ----------
const pulses=[];
function pulse(n=2,life=5200,speed=0.5){ if(!USE_LEGACY_RINGS) return;
  const t0=performance.now();
  for(let i=0;i<n;i++) pulses.push({t0:t0+i*320, life, speed});
}
let nextIdle=performance.now()+fr(5200,8200);

// ---------- calm particles ----------
const N_DOTS=60;
let dots=[];
function mkDots(n){
  if(!USE_LEGACY_DOTS) return []; const RBASE=Math.min(W,H)*0.46;
  return Array.from({length:n},()=>{
    const z=rnd(), r0=(rnd()**0.3)*(RBASE*0.98), a=rnd()*TAU;
    const m=2.6+z*2.8, s=fr(2.0,4.0)*1.2*(1+0.4*z);
    const x0=CX+Math.cos(a)*r0, y0=CY+Math.sin(a)*r0;
    return {z,m,a,phase:rnd()*TAU,r0,x:x0,y:y0,vx:0,vy:0,s};
  });
}

// ---------- VERTICAL CODE RAIN (slow + typewriter; no roll reaction) ----------
const CODE_LINES=[
  "// Crown Jewel RNG",
  "seed = hash(entropy ^ time ^ jitter)",
  "x = splitmix64(seed)",
  "s = xorshift128plus(x)",
  "u = (s >>> 12) * 2^-52",
  "u = (u ^ PHI) * 0x9E3779B97F4A7C15",
  "z = mulberry32(u32(seed))",
  "r = mix(cryptoRand(), u, z)",
  "return (r % 6) + 1"
];

const LANE_W=110;
let lanes=[];
function mkLanes(){
  const N=Math.max(5,Math.floor(W/LANE_W));
  const xs=[...Array(N)].map((_,i)=>Math.round((i+0.5)*(W/N)));
  return xs.map(x=>spawn({x, line:null}));
}
function spawn(L){
  const text=CODE_LINES[Math.floor(rnd()*CODE_LINES.length)];
  const y0=-fr(20,200);
  const vy=fr(12,18);                 // ~1/3 of previous speed (66.66% slower)
  const cps=fr(10,16);                // chars per second (typewriter)
  const tokMask=Math.random()<0.45;
  L.line={text,y:y0,vy,cps,ch:0,tokMask};
  return L;
}
function drawTokenized(s, x0, y, tokMask){
  g.font="12px ui-monospace, SFMono-Regular, Menlo, monospace";
  g.globalAlpha=0.25;
  g.shadowBlur=1.5; g.shadowColor="rgba(0,0,0,0.15)";

  // clip to lane so columns never overlap
  g.save();
  g.beginPath();
  g.rect(x0 - LANE_W*0.5, y-14, LANE_W, 20);
  g.clip();

  let cx = x0 - LANE_W*0.5 + 6;       // left-align inside the lane
  const parts=s.split(/(\b0x[0-9a-fA-F]+|\b2\^-?\d+|>>>|<<|[\^\+\*\%]|PHI|cryptoRand)/g);
  for(const t of parts){
    if(!t) continue;
    const isRed = tokMask && /^(0x[0-9a-fA-F]+|2\^-?\d+|>>>|<<|PHI|cryptoRand|\^|\*|%)$/.test(t);
    g.fillStyle=isRed?ACC:INK;
    g.fillText(t,cx,y);
    cx += g.measureText(t).width;
  }
  g.restore();
}

// ---------- rebuild ----------
function rebuild(){ dots=mkDots(N_DOTS); lanes=mkLanes(); }
rebuild();

// ---------- loop ----------
let blast=0,last=0;
const clamp=(v,m)=>v>m?m:(v<-m?-m:v);

function draw(ts){
  const dt=Math.min(32,last?ts-last:16); last=ts; const kdt=dt/16;

  // idle ring schedule
  if (USE_LEGACY_RINGS && ts>nextIdle){ pulse(2,6000,0.48); nextIdle=ts+fr(6400,9800); }

  // clear
  g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,W,H);

  // CODE RAIN
  for(const L of lanes){
    const ln=L.line;
    ln.y  += ln.vy * (dt/1000);             // px per second
    ln.ch += ln.cps * (dt/1000);            // typewriter
    const vis = ln.text.slice(0, Math.min(ln.text.length, ln.ch|0));
    drawTokenized(vis, L.x, ln.y, ln.tokMask);
    // faint cursor
    if(ln.ch < ln.text.length){
      g.globalAlpha=0.18;
      g.fillStyle=INK;
      g.fillRect(L.x - LANE_W*0.5 + 6 + g.measureText(vis).width, ln.y-9, 6, 1.5);
    }
    if(ln.y > H + 40) spawn(L);
  }

  // RINGS
  if(pulses.length){
    g.save(); g.translate(CX,CY); g.strokeStyle=INK;
    for(let i=pulses.length-1;i>=0;i--){
      const p=pulses[i], age=ts-p.t0; if(age<0) continue;
      const u=age/p.life; if(u>=1){ pulses.splice(i,1); continue; }
      g.globalAlpha=0.22*(1-u); g.lineWidth=(3+2*(1-u));
      const r=Math.min(MAXR*u*p.speed,MAXR);
      g.beginPath(); g.arc(0,0,r,0,TAU); g.stroke();
    }
    g.restore();
  }

  // DOTS (calm)
  const b=blast, expand=1+0.0*b;
  for(const d of dots){
    d.a += (0.00003*dt)*(0.7+0.5*d.z) + 0.00001*Math.sin(ts*0.00025 + d.phase);
    const r=d.r0*expand, tx=CX+Math.cos(d.a)*r, ty=CY+Math.sin(d.a)*r;
    const ax=(tx-d.x)*0.01, ay=(ty-d.y)*0.01;
    if(b>0){
      const dx=d.x-CX, dy=d.y-CY, dist=Math.hypot(dx,dy)||1;
      const f=(0.0*b)/(d.m*(1+dist/1200));
      d.vx+=(dx/dist)*f*(dt/16); d.vy+=(dy/dist)*f*(dt/16);
    }
    d.vx=clamp((d.vx+ax)*0.993,0.6);
    d.vy=clamp((d.vy+ay)*0.993,0.6);
    d.x+=d.vx*(dt/16); d.y+=d.vy*(dt/16);

    g.globalAlpha=0.20+0.10*b; g.fillStyle=ACC;
    g.beginPath(); g.arc(d.x,d.y,d.s,0,TAU); g.fill();
  }

  blast=Math.max(0,blast*0.95);
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// roll reaction (rings + dots; code rain independent)
new MutationObserver(()=>{
  if(document.body.classList.contains("rolling")){
    blast=Math.min(1,blast+0.18);
     if(USE_LEGACY_RINGS) pulse(2,5600,0.5);
  }
}).observe(document.body,{attributes:true,attributeFilter:["class"]});
})();

/* === RINGS LITE v3 (centered, thick, one per press+release) === */
(function(){
  if (window.__ringsLiteV3) return; window.__ringsLiteV3 = 1;
  var cv=document.getElementById('ringsFX');
  if(!cv){ cv=document.createElement('canvas'); cv.id='ringsFX'; document.body.prepend(cv); }
  var ctx=cv.getContext('2d',{alpha:true});
  var DPR=Math.min(1.5, window.devicePixelRatio||1);
  function fit(){
    var w=Math.max(1,Math.round(innerWidth*DPR)), h=Math.max(1,Math.round(innerHeight*DPR));
    if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; }
    cv.style.width='100vw'; cv.style.height='100dvh';
  }
  addEventListener('resize',fit,{passive:true}); fit();

  var LIFE=1000;                   // 1.0s (0.5 + 0.5 more as requested)
  var rings=[], raf=0;
  var phase='idle';                // idle -> calc -> final -> idle
  var resetTimer=0;
  function now(){ return performance.now(); }
  function center(){ return {x:cv.width*0.5, y:cv.height*0.5}; }
  function easeOut(t){ return 1-Math.pow(1-t,3); }

  function spawn(kind){
    // gate: exactly one calc then one final
    if(kind==='calc' && phase!=='idle' && phase!=='final') return;
    if(kind==='final'&& phase!=='calc') return;
    phase = (kind==='calc') ? 'calc' : 'final';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function(){ phase='idle'; }, 1500);

    var c=center();
    rings.push({t0:now(), x:c.x, y:c.y});
    if(rings.length>2) rings.shift(); // max 2 live (no stacks)
    if(!raf) raf=requestAnimationFrame(tick);
  }

  function tick(){
    raf=requestAnimationFrame(tick);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,cv.width,cv.height);
    var maxR=Math.hypot(cv.width,cv.height)*0.40;
    for(var i=rings.length-1;i>=0;i--){
      var a=(now()-rings[i].t0)/LIFE; if(a>=1){ rings.splice(i,1); continue; }
      ctx.globalAlpha = 1 - easeOut(a);
      ctx.lineWidth = 10*DPR;      // thicker ring
      ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.arc(rings[i].x,rings[i].y,a*maxR,0,Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(!rings.length){ cancelAnimationFrame(raf); raf=0; }
  }

  addEventListener('aeon:result:calc', function(){ spawn('calc'); }, {passive:true});
  addEventListener('aeon:result',      function(){ spawn('final');}, {passive:true});
})();
/* === floatFX v3.3.1 (rest circle + square roam on roll/hold) === */
(function(){
  try{
    if (window.__floatFX && typeof window.__floatFX.stop === 'function') {
      try{ window.__floatFX.stop(); }catch(_){}
    }
    if (window.__floatFX && window.__floatFX.v === 3.301) return;

    let cv = document.getElementById('floatFX') || document.getElementById('bgfx');
    if (!cv){ cv=document.createElement('canvas'); cv.id='floatFX'; cv.setAttribute('aria-hidden','true'); document.body.appendChild(cv); }
    const ctx = cv.getContext('2d', {alpha:true});

    let dpr = Math.min(window.devicePixelRatio||1, 1.5);
    const center={x:0,y:0}; let S=0,half=0,minX=0,minY=0,maxX=0,maxY=0,Rrest=0;

    function resize(){
      const w=Math.max(1,Math.floor(innerWidth*dpr));
      const h=Math.max(1,Math.floor(innerHeight*dpr));
      if (cv.width!==w || cv.height!==h){ cv.width=w; cv.height=h; }
      center.x=cv.width*0.5; center.y=cv.height*0.5;
      S=Math.min(cv.width,cv.height);
half=S*0.5;
minX=0; minY=0; maxX=cv.width; maxY=cv.height;
Rrest=Math.min(cv.width,cv.height)*0.48; // rest circle (full width inside square)
    }
    addEventListener('resize', resize, {passive:true}); resize();
// targets re-home after resize
try{if(Array.isArray(targets)&&targets.length){const GOLD=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<targets.length;i++){const t=(i+0.5)/targets.length,r=Math.sqrt(t)*Rrest,a=i*GOLD;
targets[i].x=center.x+r*Math.cos(a);targets[i].y=center.y+r*Math.sin(a);} }}catch(_){}

    const COUNT=Math.max(36, Math.floor(Math.min(cv.width,cv.height)/28));
    const GOLD=Math.PI*(3-Math.sqrt(5));

    const targets=new Array(COUNT);
    for(let i=0;i<COUNT;i++){
      const t=(i+0.5)/COUNT, r=Math.sqrt(t)*Rrest, a=i*GOLD;
      targets[i]={x:center.x + r*Math.cos(a), y:center.y + r*Math.sin(a)};
    }

    function newParticle(i){
      const T=targets[i], jx=(Math.random()-0.5)*12, jy=(Math.random()-0.5)*12;
      const r=(2+Math.random()*5)*1.5, m=r*r;
      return {x:T.x+jx, y:T.y+jy, vx:(Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.25, r, m};
    }
    const P=Array.from({length:COUNT}, (_,i)=>newParticle(i));

    const DAMP=0.985, K_HOME_BASE=0.030, K_COH_BASE=0.0, K_HOLD_MAX=0.60, SWIRL=0.0005;

    let lastDisturb=performance.now();
    function idleGain(now){return 0;}

    let holding=false, holdStart=0; const attract={x:center.x,y:center.y};
    function holdGain(now){ return holding ? Math.min(1,(now-holdStart)/250) : 0; }

    // Rolling flag via body class
    let isRolling=false;
    const mo=new MutationObserver(()=>{ isRolling=document.body.classList.contains('rolling'); });
    mo.observe(document.body,{attributes:true, attributeFilter:['class']});

    function impulseToCenter(str){
      for(const p of P){ const ax=center.x-p.x, ay=center.y-p.y, d=Math.hypot(ax,ay)||1;
        p.vx += (ax/d)*str; p.vy += (ay/d)*str; }
    }
    addEventListener('aeon:result:calc', ()=>{ lastDisturb=performance.now(); impulseToCenter(0); }, {passive:true});
    addEventListener('aeon:result',      ()=>{ lastDisturb=performance.now(); impulseToCenter(0); }, {passive:true});

    function pt(e){ const s=e.touches?e.touches[0]:e; const r=cv.getBoundingClientRect(); return {x:(s.clientX-r.left)*dpr, y:(s.clientY-r.top)*dpr}; }
    const onDown=e=>{ holding=true; holdStart=performance.now(); lastDisturb=holdStart; const p=pt(e); attract.x=p.x; attract.y=p.y; };
    const onMove=e=>{ if(!holding) return; lastDisturb=performance.now(); const p=pt(e); attract.x=p.x; attract.y=p.y; };
    const onUp  =()=>{ holding=false; lastDisturb=performance.now(); attract.x=center.x; attract.y=center.y; };
    addEventListener('pointerdown', onDown, {passive:true});
    addEventListener('pointermove', onMove, {passive:true});
    addEventListener('pointerup',   onUp,   {passive:true});
    addEventListener('touchstart',  onDown, {passive:true});
    addEventListener('touchmove',   onMove, {passive:true});
    addEventListener('touchend',    onUp,   {passive:true});

    function bounceSquare(p){
      let stuck=false;
      if (p.x - p.r < minX){ p.x=minX+p.r; p.vx=Math.abs(p.vx)*0.8; stuck=true; }
      if (p.x + p.r > maxX){ p.x=maxX-p.r; p.vx=-Math.abs(p.vx)*0.8; stuck=true; }
      if (p.y - p.r < minY){ p.y=minY+p.r; p.vy=Math.abs(p.vy)*0.8; stuck=true; }
      if (p.y + p.r > maxY){ p.y=maxY-p.r; p.vy=-Math.abs(p.vy)*0.8; stuck=true; }
      if (stuck){
        const tx=-(p.y-center.y), ty=(p.x-center.x), tl=Math.hypot(tx,ty)||1;
        p.vx += (tx/tl)*0.12; p.vy += (ty/tl)*0.12;
      }
    }

    function collide(){
      for(let i=0;i<P.length;i++){
        for(let j=i+1;j<P.length;j++){
          const a=P[i], b=P[j], dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
          const minD=a.r+b.r+0.5;
          if (d>0 && d<minD){
            const nx=dx/d, ny=dy/d, overlap=minD-d;
            a.x-=nx*overlap*0.5; a.y-=ny*overlap*0.5;
            b.x+=nx*overlap*0.5; b.y+=ny*overlap*0.5;
            const va=a.vx*nx+a.vy*ny, vb=b.vx*nx+b.vy*ny, ma=a.m, mb=b.m;
            const va2=(va*(ma-mb)+2*mb*vb)/(ma+mb);
            const vb2=(vb*(mb-ma)+2*ma*va)/(ma+mb);
            a.vx+=(va2-va)*nx; a.vy+=(va2-va)*ny; b.vx+=(vb2-vb)*nx; b.vy+=(vb2-vb)*ny;
          }
        }
      }
    }

    let raf, tPrev=performance.now();
    function tick(now){
      raf=requestAnimationFrame(tick);
      const dt=Math.min(0.033,(now-tPrev)/1000); tPrev=now;
      ctx.clearRect(0,0,cv.width,cv.height);

      const idleG=idleGain(now), holdG=holdGain(now);
      const rollingActive = isRolling || holding;

      // When rolling/holding → disable rest spread + idle cohesion
      const spreadK = rollingActive ? 0 : K_HOME_BASE;
      const cohK    = rollingActive ? 0 : (K_COH_BASE * idleG);
      const centerK = K_HOLD_MAX * holdG;

      for(let i=0;i<P.length;i++){
        const p=P[i], T=targets[i];

        // rest spread to home targets (only when not rolling/holding)
        if (spreadK){ p.vx += (T.x - p.x) * spreadK; p.vy += (T.y - p.y) * spreadK; }

        // gentle cohesion to center (ramps with idle; off while rolling/holding)
        if (cohK){
          const ax=center.x - p.x, ay=center.y - p.y, ad=Math.hypot(ax,ay)||1;
          p.vx += (ax/ad) * cohK; p.vy += (ay/ad) * cohK;
        }

        // hold/drag center attraction (ramps 0→max in 0.25s)
        if (centerK>0){
          const bx=attract.x - p.x, by=attract.y - p.y, bd=Math.hypot(bx,by)||1;
          p.vx += (bx/bd) * centerK; p.vy += (by/bd) * centerK;
        }

        // organic curl
        p.vx += SWIRL * (p.y - center.y);
        p.vy += -SWIRL * (p.x - center.x);

        // integrate + bounds + collisions
        p.vx*=DAMP; p.vy*=DAMP; p.x+=p.vx; p.y+=p.vy;
        bounceSquare(p);
      }
      collide();

      ctx.globalAlpha=0.5; ctx.fillStyle='rgb(214 54 54)';
      for(const p of P){ ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1;
    }
    raf=requestAnimationFrame(tick);

    window.__floatFX = {
      v:3.301,
      stop(){
        try{ cancelAnimationFrame(raf); }catch(_){}
        removeEventListener('pointerdown', onDown);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup',   onUp);
        removeEventListener('touchstart',  onDown);
        removeEventListener('touchmove',   onMove);
        removeEventListener('touchend',    onUp);
        try{ mo.disconnect(); }catch(_){}
      }
    };
  }catch(e){ console.debug('[floatFX v3.3.1]', e); }
})();

/* ===== public/app_hold2roll.js ===== */

// --- HAPTICS: single, subtle, debounced ---
const HAPTIC_MS = 16;
let hapticLock = false;
function buzzOnce(){
  if (!('vibrate' in navigator) || hapticLock) return;
  hapticLock = true;
  navigator.vibrate(HAPTIC_MS);
  setTimeout(()=>{ hapticLock = false; }, HAPTIC_MS + 120);
}
(()=>{ if(window.__holdDragSpin) return; window.__holdDragSpin=1;
  // vib shim
  const vib = window.vib || (k=>{ try{
    if(!navigator.vibrate) return false;
    if(k==='press')   return navigator.vibrate([8,10,8]);
    if(k==='release') return navigator.vibrate([6,10,6]);
    return navigator.vibrate([12,16,12]);
  }catch(e){} return false; });

  // find roll button (support both #rollBtn and #roll)
  let btn = document.getElementById('rollBtn') || document.getElementById('roll');
  if(!btn) return;

  // drop old listeners by cloning
  const clone = btn.cloneNode(true);
  btn.parentNode.replaceChild(clone, btn);
  btn = clone;

  // state
  let holding=false, pid=null, raf=0, prev=0;
  let ix=0, iy=0;            // incremental angles driven during hold
  let vx=0, vy=0;            // smoothed pointer velocity
  let lastX=0, lastY=0, lastT=0;

  // constants
  const BASE_OX=540, BASE_OY=720;    // deg/sec while holding (constant)
  const GAIN_X=220,  GAIN_Y=220;     // gesture tilt gains (deg per px/s)
  const SMOOTH = 0.90;               // velocity low-pass

  function dieEl(){
    return document.getElementById('die') || document.querySelector('.die,#cube,#dice');
  }

  function setIncAngles(dx,dy){
    const d = dieEl(); if(!d) return;
    d.style.setProperty('--ix', dx+'deg');
    d.style.setProperty('--iy', dy+'deg');
  }

  function absorbIntoBase(){
    const d = dieEl(); if(!d) return;
    const cs=getComputedStyle(d);
    const rx=parseFloat(cs.getPropertyValue('--rx'))||0;
    const ry=parseFloat(cs.getPropertyValue('--ry'))||0;
    const nx=((ix%360)+360)%360, ny=((iy%360)+360)%360;
    d.style.setProperty('--rx', (rx+nx)+'deg');
    d.style.setProperty('--ry', (ry+ny)+'deg');
    d.style.setProperty('--ix','0deg'); d.style.setProperty('--iy','0deg');
    ix=iy=0;
  }

  function loop(t){
    if(!holding) return;
    const dt = prev ? (t-prev)/1000 : 0; prev=t;

    // base spin
    ix += BASE_OX*dt;
    iy += BASE_OY*dt;

    // pointer velocity influence (smooth)
    const tipX = vx*GAIN_X, tipY = -vy*GAIN_Y; // invert Y for natural feel
    setIncAngles(ix + tipX*dt, iy + tipY*dt);

    raf = requestAnimationFrame(loop);
  }

  function onDown(e){
    e.preventDefault(); e.stopPropagation();
    pid = e.pointerId;
    try{ btn.setPointerCapture(pid); }catch(_){}
    holding = true;
    prev = 0; ix=iy=0;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vib('press');
    document.body.classList.add('holding');   // visual state if you want it
    document.body.classList.add('rolling');   // keep bgfx reactive
    raf = requestAnimationFrame(loop);
  }

  function onMove(e){
    if(!holding) return;
    const t = performance.now();
    const dt = Math.max(16, t - (lastT||t));
    const dx = e.clientX - (lastX||e.clientX);
    const dy = e.clientY - (lastY||e.clientY);
    lastX = e.clientX; lastY = e.clientY; lastT = t;

    // smooth instantaneous velocity (px/ms)
    const ivx = dx/dt, ivy = dy/dt;
    vx = vx*SMOOTH + ivx*(1-SMOOTH);
    vy = vy*SMOOTH + ivy*(1-SMOOTH);
  }

  function onUp(){
    if(!holding) return;
    holding = false;
    try{ if(pid!=null) btn.releasePointerCapture(pid); }catch(_){}
    pid=null;
    vib('release');
    absorbIntoBase();
    // pick target (respects any taps logic if defined)
    const target = (typeof taps!=='undefined' && taps>0) ? taps : (1+Math.floor(Math.random()*6));
    try{ window.spinToFace && spinToFace(target); }catch(_){}
    setTimeout(()=>{ document.body.classList.remove('rolling'); document.body.classList.remove('holding'); },120);
  }

  btn.addEventListener('pointerdown', onDown, {passive:false});
  window.addEventListener('pointermove', onMove, {passive:true});
  window.addEventListener('pointerup', onUp, {passive:true});
  window.addEventListener('pointercancel', onUp, {passive:true});
})();

/* ===== public/app.js ===== */

// === HAPTICS + HOLD-TO-ROLL v5 ===
(()=>{ if(window.__holdHaptics) return; window.__holdHaptics=1;
  const CAN = !!(navigator && navigator.vibrate);
  const SCALE = 1.15;
  const ms = v => Math.max(4, Math.round(v*SCALE));
  console.log('[haptics] v5 active');
  window.vib = (kind="press")=>{
    if(!CAN) return false;
    try{
      if(Array.isArray(kind)) return navigator.vibrate(kind.map(ms));
      if(kind==="press")   return navigator.vibrate([10,12].map(ms));   // down
      if(kind==="release") return navigator.vibrate([6,10,6].map(ms));  // up
      if(kind==="tick")    return navigator.vibrate(ms(12));
      if(kind==="soft")    return navigator.vibrate(ms(18));
      if(kind==="roll")    return navigator.vibrate([14,18,14].map(ms));
    }catch(e){} return false;
  };

  const ROLL_SEL = '#roll, .roll, [data-roll], [data-action="roll"], [data-role="roll"], button';
  const findBtn = ()=>{
    const all = [...document.querySelectorAll(ROLL_SEL)];
    // prefer a button whose text equals "Roll"
    return all.find(b=>/^\s*roll\s*$/i.test((b.textContent||"").trim())) ||
           document.querySelector('[aria-label="Roll"]') || all[0] || null;
  };

  const finalRoll = ()=>{
    try{
      if(typeof window.roll === "function"){ window.roll(); return; }
      if(typeof window.onRoll === "function"){ window.onRoll(); return; }
      if(typeof window.doRoll === "function"){ window.doRoll(); return; }
    }catch(e){}
  };

  const bind = ()=>{
    const btn = findBtn();
    if(!btn || btn.__holdBound) return;

    // prevent the original click handler from firing once (we own the sequence)
    const clickBlocker = (e)=>{
      if(window.__suppressRollClick){
        e.stopImmediatePropagation();
        e.preventDefault();
        window.__suppressRollClick = false;
      }
    };
    btn.addEventListener("click", clickBlocker, true);

    let down = false;

    const onDown = (e)=>{
      down = true;
      window.__suppressRollClick = true;  // block the default click roll
      vib("press");
      document.body.classList.add("rolling");   // keep dice/bg animating while held
      // (no repeated roll calls here to avoid heavy work while holding)
      try{ btn.setPointerCapture?.(e.pointerId); }catch(_){}
    };

    const onUp = ()=>{
      if(!down) return;
      down = false;
      vib("release");
      // finalize the roll once on release
      finalRoll();
      // let the visual spin settle a moment
      setTimeout(()=>document.body.classList.remove("rolling"), 120);
    };

    btn.addEventListener("pointerdown", onDown, {passive:true});
    btn.addEventListener("pointerup", onUp, {passive:true});
    btn.addEventListener("pointercancel", onUp, {passive:true});
    btn.addEventListener("pointerleave", onUp, {passive:true});

    btn.__holdBound = true;
  };

  const mo = new MutationObserver(bind);
  mo.observe(document.documentElement, {subtree:true, childList:true});
  bind();
})();

const die = document.getElementById('die');
const rollBtn = document.getElementById('rollBtn');
const overlay = document.getElementById('touchOverlay');
const dots = [...document.querySelectorAll('.tap-dots .dot')];
const countEl = document.getElementById('count');
const statsOverlay = document.getElementById('statsOverlay');
const barsEl = document.getElementById('bars');
const resetBtn = document.getElementById('resetStats');

const TAP_COOLDOWN_MS = 150;
const HOLD_RESET_MS = 1000;
const POSE_RX = -12, POSE_RY = -16;
const STORAGE_KEY = "hd_freq_v1";

let taps = 0, lastTap = 0, wasHold = false, holdTimer = null;
let rolling = false, lastResult = 0;
  try{window.dispatchEvent(new CustomEvent('aeon:result', {detail:{value:lastResult,t:Date.now()}}));}catch(e){}
let clickLockAt = 0;

function readFreq(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [0,0,0,0,0,0,0]; }catch{ return [0,0,0,0,0,0,0]; } }
function writeFreq(f){ localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); }

/* Map: face -> rotation to bring it to front */
const faceToRot = n => ({1:[0,0], 2:[0,-90], 3:[0,180], 4:[0,90], 5:[90,0], 6:[-90,0]})[n];

const setRotation = (rx,ry)=>{
  die.style.setProperty('--rx', rx+'deg');
  die.style.setProperty('--ry', ry+'deg');
};

/* idle */
let idleRAF=null, idleStart=null, idleIx=0, idleIy=0;
function idleLoop(ts){
  if(!idleStart) idleStart=ts;
  const t=(ts-idleStart)/1000;
  idleIx=Math.sin(t*1.2)*4; idleIy=Math.cos(t*0.9)*4;
  die.style.setProperty('--ix', idleIx+'deg'); die.style.setProperty('--iy', idleIy+'deg');
  idleRAF=requestAnimationFrame(idleLoop);
}
function startIdle(){ if(!idleRAF){ idleStart=null; idleRAF=requestAnimationFrame(idleLoop); } }
function stopIdle(){ if(idleRAF){ cancelAnimationFrame(idleRAF); idleRAF=null; die.style.setProperty('--ix','0deg'); die.style.setProperty('--iy','0deg'); } }
startIdle();

/* roll */
// HOLD_TO_ROLL

let holding=false, holdStart=0, holdPrev=0, holdRAF=null;
let holdIx=0, holdIy=0;
const HOLD_OMEGA_X = 540;   // deg/sec while holding
const HOLD_OMEGA_Y = 720;   // deg/sec while holding

function holdTick(ts){
  if(!holding) return;
  const dt = holdPrev ? (ts-holdPrev)/1000 : 0;
  holdPrev = ts;
  holdIx += HOLD_OMEGA_X * dt;
  holdIy += HOLD_OMEGA_Y * dt;
  die.style.setProperty('--ix', holdIx+'deg');
  die.style.setProperty('--iy', holdIy+'deg');
  holdRAF = requestAnimationFrame(holdTick);
}

function holdDown(e){
  if(e) e.preventDefault();
  if(rolling) return;                    // ignore if a settle is running
  holding = true;
  holdStart = performance.now(); holdPrev = 0;
  holdIx = 0; holdIy = 0;
  try{ vib("press"); }catch(e){}
  stopIdle();                            // pause idle sway
  document.body.classList.add('rolling');
  if(holdRAF) cancelAnimationFrame(holdRAF);
  holdRAF = requestAnimationFrame(holdTick);
}

function holdUp(){
  if(!holding) return;
  holding = false;
  if(holdRAF) cancelAnimationFrame(holdRAF);
  try{ vib("release"); }catch(e){}

  // choose target exactly like tryRoll
  const target = taps===0 ? (1+Math.floor(Math.random()*6)) : taps;

  // brief ease-out settle independent of hold time
  // but visible rolling duration == time held thanks to holdTick above
  rolling = true;
  // let spinToFace do the settle and bookkeeping
  spinToFace(target);
}

function spinToFace(n){
  stopIdle();
  document.body.classList.add('rolling');
  const [rx, ry] = faceToRot(n);
  const kx = 3 + Math.floor(Math.random()*2);
  const ky = 3 + Math.floor(Math.random()*2);
  setRotation(rx + POSE_RX + 360*kx, ry + POSE_RY + 360*ky);

  const onEnd = (ev)=>{
    const pn = ev.propertyName || ev.originalEvent?.propertyName || "";
    if(!/transform/i.test(pn)) return;
    die.removeEventListener('transitionend', onEnd);
    die.style.transition = 'none';
    setRotation(rx + POSE_RX, ry + POSE_RY);
    void die.offsetWidth;
    die.style.transition = '';
    rolling=false; lastResult=n;

    const f = readFreq(); f[n] = (f[n]||0) + 1; writeFreq(f);
    updateCounter();
  window.dispatchEvent(new CustomEvent("aeon:result:calc",{detail:{n:currentValue,ts:Date.now()}})); document.dispatchEvent(new CustomEvent("aeon:result",{detail:{value:lastResult}}));
    rebuildBars(); renderBars(true); resetTaps();

    document.body.classList.remove('rolling'); startIdle();
  };
  die.addEventListener('transitionend', onEnd);
}
function tryRoll(e){ if(holding){ if(e) e.preventDefault(); return; }
  e?.preventDefault();
  const now = performance.now();
  if(rolling) return;
  if(now - clickLockAt < 400) return;
  clickLockAt = now;
  const target = taps===0 ? (1+Math.floor(Math.random()*6)) : taps;
  rolling=true; spinToFace(target);
}
rollBtn.addEventListener('pointerdown', holdDown, {passive:false});
rollBtn.addEventListener('pointerup', holdUp, {passive:false});
rollBtn.addEventListener('pointercancel', holdUp, {passive:false});
rollBtn.addEventListener('pointerleave', holdUp, {passive:false});
/* taps (MID) */
function updateCounter(){ countEl.textContent = String(lastResult); }
function resetTaps(){ taps=0; dots.forEach(d=>d.classList.remove('on')); }
overlay.addEventListener('pointerdown', ()=>{
  clearTimeout(holdTimer); wasHold=false;
  holdTimer=setTimeout(()=>{ wasHold=true; resetTaps(); }, HOLD_RESET_MS);
});
overlay.addEventListener('pointerup', ()=>{
  clearTimeout(holdTimer);
  if (wasHold){ wasHold=false; return; }
  const now = performance.now();
  if(now - lastTap < TAP_COOLDOWN_MS) return;
  lastTap = now;
  if(taps < 6){ taps++; dots[taps-1].classList.add('on'); }
});
overlay.addEventListener('pointerleave', ()=> clearTimeout(holdTimer));

/* stats (FNT trigger = count) */
function rebuildBars(){
  barsEl.innerHTML = "";
  for(let i=1;i<=6;i++){
    const bar = document.createElement('div'); bar.className = 'bar';
    const fill = document.createElement('i');
    const lab  = document.createElement('span'); lab.className='lab'; lab.textContent = String(i);
    const val  = document.createElement('span'); val.className='val'; val.textContent='0';
    bar.append(fill, lab, val); barsEl.append(bar);
  }
}
function renderBars(animate=false){
  const f = readFreq();
  const max = Math.max(1, ...f.slice(1));
  [...barsEl.querySelectorAll('.bar')].forEach((b,i)=>{
    const v = f[i+1] || 0;
    b.querySelector('.val').textContent = String(v);
    const fill = b.querySelector('i');
    if(!animate) fill.style.transition = 'none';
    fill.style.height = Math.round(v*100/max) + '%';
    if(!animate){ requestAnimationFrame(()=> fill.style.transition = 'height 420ms cubic-bezier(.22,1,.3,1)'); }
  });
}
function openStats(){ if(navigator.vibrate) try{navigator.vibrate(8)}catch{} statsOverlay.classList.add("on"); rebuildBars(); renderBars(true); }
function closeStats(){ statsOverlay.classList.remove("on"); }
countEl.addEventListener("click", openStats, {passive:true});
statsOverlay.addEventListener("click", e=>{ if(e.target===statsOverlay) closeStats(); });
resetBtn.addEventListener("click", ()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify([0,0,0,0,0,0,0])); rebuildBars(); renderBars(true); });

/* init */
setRotation(-32+POSE_RX, -36+POSE_RY);
updateCounter(); rebuildBars(); renderBars();
// vib shim (no-op if device can't vibrate)
function vib(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} }

// colorize result pill safely
document.getElementById('rollBtn')?.classList.add('pill--resultColors');
// RINGS_JS_START
(()=>{ // rings v1
  if (window.__RINGS_V1__) return; window.__RINGS_V1__=true;

  const overlay = document.getElementById('rings-overlay') || (()=> {
    const el = document.createElement('div'); el.id='rings-overlay'; document.body.prepend(el); return el;
  })();

  const last={press:0,result:0}, THROTTLE=1500;
  function spawn(kind){
    const now=Date.now(); if(now-last[kind] < THROTTLE) return;
    last[kind]=now;
    const el=document.createElement('div'); el.className='ring';
    overlay.appendChild(el);
    el.addEventListener('animationend',()=>el.remove(),{once:true});
  }

  // Roll button only
  const rollBtn = document.querySelector('button[data-role="roll"], #roll, .roll, button[aria-label="Roll"]');
  if(rollBtn){
    ['pointerdown','touchstart','mousedown'].forEach(ev=>{
      rollBtn.addEventListener(ev, ()=>spawn('press'), {passive:true});
    });
  }

  // Result via custom event, with fallback observer
  window.addEventListener('aeon:result', ()=>spawn('result'), {passive:true});
  const resultEl = document.querySelector('[data-role="result"], #result, .result');
  if(resultEl && 'MutationObserver' in window){
    new MutationObserver(()=>spawn('result')).observe(resultEl,{childList:true,subtree:true,characterData:true});
  }

  console.log('[rings] installed (throttle=1.5s, decay-delay=0.25s, +20% area)');
})();
// RINGS_JS_END

// === ABSORB_ON_RELEASE_START ===
// Fold transient --ix/--iy (hold spin) into base --rx/--ry on release,
// so settle starts exactly from the visible pose (no pause/jump).
(function(){
  try{
    const SELECT_ROLL='button[data-role="roll"],#roll,.roll,button[aria-label="Roll"],#rollBtn';
    const SELECT_DIE ='#die,#cube';
    const norm = v => ((v%360)+360)%360;

    function install(){
      const btn = document.querySelector(SELECT_ROLL);
      const die = document.querySelector(SELECT_DIE);
      if(!btn || !die) return false;

      function absorbAngles(){
        const cs = getComputedStyle(die);
        const rx = parseFloat(cs.getPropertyValue('--rx')) || 0;
        const ry = parseFloat(cs.getPropertyValue('--ry')) || 0;
        const ix = parseFloat(cs.getPropertyValue('--ix')) || 0;
        const iy = parseFloat(cs.getPropertyValue('--iy')) || 0;
        die.style.setProperty('--rx', (rx + norm(ix)) + 'deg');
        die.style.setProperty('--ry', (ry + norm(iy)) + 'deg');
        die.style.setProperty('--ix', '0deg');
        die.style.setProperty('--iy', '0deg');
      }

      ['pointerup','pointercancel','pointerleave'].forEach(e=>{
        btn.addEventListener(e, absorbAngles, {capture:true});
      });

      console.log('✓ absorb-on-release baked in');
      return true;
    }

    // Try now; if DOM not ready yet, retry briefly.
    if(!install()){
      let tries=0;
      const id=setInterval(()=>{ if(install()||++tries>200) clearInterval(id); },25);
    }
  }catch(e){ /* no-op */ }
})();
// === ABSORB_ON_RELEASE_END ===
// AEON_HAPTICS_LOCK_V4 BEGIN
(function(){
  if (window.__AEON_HLOCK_V4__) return;
  window.__AEON_HLOCK_V4__ = true;

  const HOLD_MS = 108;   // hold threshold
  const BUZZ_MS = 16;    // equal slight buzz
  const UNLOCK_MS = 100; // unlock after result

  const canV = !!(navigator && navigator.vibrate);
  const vibRaw = d => { if(!canV) return false; try{ return navigator.vibrate(d); }catch(e){ return false; } };

  const S = { phase:'ready', downDone:false, upDone:false, holdTimer:null, unlockTimer:null };
  const lockRoll   = ()=>{ S.phase='rolling'; S.downDone=false; S.upDone=false; };
  const unlockRoll = ()=>{ S.phase='ready';   S.downDone=false; S.upDone=false; };

  const pickTarget = () =>
    document.getElementById('ROLL') ||
    document.querySelector('[data-role="roll"], .roll, #roll, button.roll, .btn-roll') ||
    document.body;

  const onDown = () => {
    if (S.phase!=='ready') return;
    lockRoll();
    clearTimeout(S.holdTimer);
    S.holdTimer = setTimeout(() => {
      if (!S.downDone) { vibRaw(BUZZ_MS); S.downDone = true; }
    }, HOLD_MS);
  };

  const onUp = () => {
    clearTimeout(S.holdTimer);
    if (!S.downDone) { vibRaw(BUZZ_MS); S.downDone = true; } // tap buzz if no hold
    if (!S.upDone)   { vibRaw(BUZZ_MS); S.upDone   = true; } // release buzz
    // remain locked; no buzz while rolling; no auto-buzz on result
  };

  const hookResult = () => {
    if (typeof window.updateCounter === 'function' && !window.updateCounter.__aeon_wrapped_v4__) {
      const orig = window.updateCounter;
      window.updateCounter = function(){ const r = orig.apply(this, arguments);
        clearTimeout(S.unlockTimer); S.unlockTimer = setTimeout(unlockRoll, UNLOCK_MS); return r; };
      window.updateCounter.__aeon_wrapped_v4__ = true;
    } else {
      const pill = document.querySelector('#counter, .pill, [data-role="pill"]');
      if (pill && !pill.__aeon_obs_v4__) {
        const mo = new MutationObserver(() => { clearTimeout(S.unlockTimer); S.unlockTimer = setTimeout(unlockRoll, UNLOCK_MS); });
        mo.observe(pill, { childList:true, subtree:true, characterData:true });
        pill.__aeon_obs_v4__ = true;
      }
    }
  };

  const bind = () => {
    const t = pickTarget();
    if (t.__aeon_bound_v4__) return;
    t.addEventListener('pointerdown', onDown, {passive:true});
    t.addEventListener('pointerup',   onUp,   {passive:true});
    t.__aeon_bound_v4__ = true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bind(); hookResult(); });
  } else { bind(); hookResult(); }
})();
// AEON_HAPTICS_LOCK_V4 END

/* === haptics-guard (fused) === */
// Haptics guard: only vibrate for the Roll button
(() => {
  const real = navigator.vibrate && navigator.vibrate.bind(navigator);
  if (!real) { console.warn('[haptics] navigator.vibrate unavailable'); return; }

  // Find Roll button heuristically
  const cand = [...document.querySelectorAll('button,#roll,.roll')];
  const rollBtn = cand.length===1 ? cand[0]
    : cand.find(b => /roll/i.test((b.textContent||'')+' '+(b.ariaLabel||'')));
  if (!rollBtn) { console.warn('[haptics] roll button not found'); return; }

  let downOnRoll = false, lastUpAt = -1;
  const GRACE = 350; // ms after release still allow

  rollBtn.addEventListener('pointerdown', () => { downOnRoll = true; }, {passive:true});
  const up = () => { downOnRoll = false; lastUpAt = performance.now(); };
  rollBtn.addEventListener('pointerup', up, {passive:true});
  rollBtn.addEventListener('pointercancel', up, {passive:true});

  const map = p => {
    if (typeof p === 'string') {
      if (/press/i.test(p))   return 16;
      if (/release/i.test(p)) return 20;
      if (/long/i.test(p))    return 35;
      return 16;
    }
    return p;
  };

  navigator.vibrate = function(pattern){
    const sinceUp = performance.now() - lastUpAt;
    const ok = downOnRoll || sinceUp < GRACE;
    const pat = map(pattern);
    console.log('[haptics]', ok ? 'allow' : 'block',
                {owner: rollBtn, pattern: pat, raw: pattern, sinceUp: Math.round(sinceUp)});
    return ok ? real(pat) : false;
  };

  console.log('[haptics] guard installed (Roll only, grace', GRACE,'ms)');
})();

/* === number-rain v9.6 (fused) === */
(()=>{ // number-rain v9.6 — match red opacity, keep only newest; on 2nd roll: fully fade 1st, then after 3s fade 50% of 2nd
  try{window.__numRain?.stop()}catch(_){}
  document.getElementById('numRain')?.remove();

  // --- canvas (strictly behind red FX & dice)
  const vv=()=> (visualViewport ?? {width:innerWidth,height:innerHeight});
  const DPR=Math.min(2, devicePixelRatio||1);
  const cv=Object.assign(document.createElement('canvas'),{id:'numRain',ariaHidden:'true'});
  Object.assign(cv.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'-2'});
  const anchor=document.querySelector('#ringsFX,#floatFX,#bgfx');
  if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(cv, anchor); else document.body.prepend(cv);
  const g=cv.getContext('2d',{alpha:true});
  const fit=()=>{const v=vv(); cv.width=Math.max(1,Math.round(v.width*DPR)); cv.height=Math.max(1,Math.round(v.height*DPR));}; fit();
  addEventListener('resize',fit,{passive:true}); (visualViewport||window).addEventListener?.('resize',fit,{passive:true});
  new MutationObserver(()=>{ const a=document.querySelector('#ringsFX,#floatFX,#bgfx'); if(a && cv.nextSibling!==a) a.parentNode.insertBefore(cv,a); cv.style.zIndex='-2'; }).observe(document.body,{childList:true,subtree:true});

  // --- helpers
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const CENTER = ()=>({x:cv.width*0.5,y:cv.height*0.5});
  const GOLD=2.39996322973;

  // --- input
  let bodyHolding=false, pointerHolding=false, ptX=(vv().width*0.5)*DPR, ptY=(vv().height*0.5)*DPR;
  new MutationObserver(()=>{ bodyHolding=document.body.classList.contains('holding'); }).observe(document.body,{attributes:true,attributeFilter:['class']});
  function onDown(e){ pointerHolding=true; const c=e.touches?e.touches[0]:e; ptX=c.clientX*DPR; ptY=c.clientY*DPR; }
  function onMove(e){ if(pointerHolding){ const c=e.touches?e.touches[0]:e; ptX=c.clientX*DPR; ptY=c.clientY*DPR; } }
  function onUp(){ pointerHolding=false; }
  addEventListener('pointerdown',onDown,{passive:true}); addEventListener('pointermove',onMove,{passive:true}); addEventListener('pointerup',onUp,{passive:true});
  addEventListener('touchstart',onDown,{passive:true});  addEventListener('touchmove',onMove,{passive:true});  addEventListener('touchend',onUp,{passive:true});
  const HOLDING=()=> (bodyHolding||pointerHolding);

  // --- mask
  const DOT_R=3.0*DPR;
  function digitMask(n,scale){
    const W=92,H=112,c=document.createElement('canvas'); c.width=W; c.height=H;
    const x=c.getContext('2d'); x.fillStyle='#000'; x.textAlign='center'; x.textBaseline='middle'; x.font='800 94px system-ui,Arial';
    x.fillText(String(n),W/2,H/2+2);
    const img=x.getImageData(0,0,W,H).data, TARGET=220, step=Math.max(2,Math.round(Math.sqrt((W*H)/TARGET)));
    const pts=[]; let minY=1e9,maxY=-1e9;
    for(let y=0;y<H;y+=step) for(let xx=0;xx<W;xx+=step){
      if(img[(y*W+xx)*4+3]>150){ const oy=(y-H/2)*scale, ox=(xx-W/2)*scale; pts.push({ox,oy,r:DOT_R}); if(oy<minY)minY=oy; if(oy>maxY)maxY=oy; }
    }
    return {pts,halfH:{min:minY,max:maxY}};
  }

  // --- state
  const groups=[], sand=[];
  const gens=[]; // [{id,born,total,alive,fading,halfDueAt,halfDone}]
  let NEXT_ID=1;
  const SAND_CAP=2200;
  let wasHolding=false;

  // physics
  const DAMP=0.985, K_HOME_BASE=0.030, K_HOLD_MAX=0.60, SWIRL=0.0005;
  const BLACK_ALPHA=0.78;       // slightly lower than before; visually matches red floaters
  const FULL_FADE_MS=900;       // seamless fade duration

  function rest(){ const c=CENTER(); const R=Math.min(cv.width,cv.height)*0.48; return {cx:c.x, cy:c.y, r:R}; }

  function anchorsFor(n){
    const A=[];
    if(n===1){ A.push({rf:0, ang:0}); }
    else if(n===2){ A.push({rf:0.34, ang:0}, {rf:0.34, ang:Math.PI}); }
    else if(n===3){ for(let i=0;i<3;i++) A.push({rf:0.35, ang:i*(2*Math.PI/3)}); }
    else if(n===4){ for(let i=0;i<4;i++) A.push({rf:0.36, ang:(Math.PI/4)+i*(Math.PI/2)}); }
    else if(n===5){ for(let i=0;i<4;i++) A.push({rf:0.36, ang:(Math.PI/4)+i*(Math.PI/2)}); A.push({rf:0, ang:0}); }
    else { for(let i=0;i<6;i++) A.push({rf:0.38, ang:i*(Math.PI/3)}); }
    return A;
  }

  // --- spawn & break
  let currentRoll=0;
  function spawnDigit(n){
    currentRoll=n;
    const cx=(vv().width*0.5)*DPR, y0=-120*DPR, m=digitMask(n,1.48*DPR);
    groups.length=0;
    groups.push({x:cx,y:y0,vy:0,parts:m.pts,bottomOffset:m.halfH.max,startAt:performance.now()+100,roll:n});
  }

  function newGen(total){
    const id=NEXT_ID++;
    gens.push({id,born:performance.now(),total,alive:total,fading:false,halfDueAt:null,halfDone:false});
    return id;
  }
  function aliveCount(id){ let n=0; for(const p of sand) if(p.gen===id && p.dieAt===Infinity) n++; return n; }

  function fadeFromGen(id, count, totalMs=FULL_FADE_MS, delayMs=0){
    if(count<=0) return 0;
    const base=performance.now()+delayMs;
    let done=0, step=Math.max(8, totalMs/Math.max(1,count)), t=0;
    for(const p of sand){
      if(done>=count) break;
      if(p.gen===id && p.dieAt===Infinity){ p.dieAt=base+t; t+=step; done++; }
    }
    const meta=gens.find(g=>g.id===id); if(meta) meta.fading=true;
    return done;
  }

  function enforceCap(skipId){
    let need=sand.length - SAND_CAP;
    for(const g of gens){
      if(need<=0) break;
      if(g.id===skipId) continue;
      const alive=aliveCount(g.id);
      if(alive>0){ const took=fadeFromGen(g.id, Math.min(need, alive), 400, 0); need-=took; }
    }
  }

  function breakToSand(gr){
    const now=performance.now(), A=anchorsFor(gr.roll||currentRoll||6);
    const N=gr.parts.length, perCluster=Math.ceil(N/A.length), clusterFill=0.24;
    const genId=newGen(N);

    for(let k=0;k<N;k++){
      const p0=gr.parts[k];
      const clusterIdx = k % A.length;
      const localIdx   = (k / A.length) | 0;
      const localN     = perCluster;
      const lr  = Math.sqrt((localIdx+0.5)/localN) * clusterFill;
      const lth = GOLD*localIdx + ((k*0.123)%0.6 - 0.3);
      const an=A[clusterIdx];
      const r=p0.r, m=r*r;

      sand.push({
        x:gr.x+p0.ox, y:gr.y+p0.oy,
        vx:(Math.random()-0.5)*2.2*DPR, vy:(-1-Math.random()*2)*DPR,
        r, m, fade:1, dieAt:Infinity,
        aRf:an.rf, aAng:an.ang, lRf:lr, lAng:lth,
        seed:(k*9973)%10000, relLag:(k%23)*35 + Math.random()*120,
        homeAt: HOLDING()? Infinity : now,
        gen: genId
      });
    }

    // --- New policy:
    // 1) If there is a previous generation, fade it out completely now (seamless)
    // 2) After it finishes + 3s, fade HALF of the newest generation
    const newest=gens[gens.length-1];
    const prev  = gens.length>=2 ? gens[gens.length-2] : null;
    if(prev){
      const alivePrev=aliveCount(prev.id);
      if(alivePrev>0) fadeFromGen(prev.id, alivePrev, FULL_FADE_MS, 0);
      newest.halfDueAt = performance.now() + FULL_FADE_MS + 3000;
    }else{
      newest.halfDueAt = null;
    }

    // keep memory bounded (never trim the newest)
    enforceCap(newest.id);
  }

  // --- collisions
  function collide(A){
    for(let i=0;i<A.length;i++){
      const a=A[i];
      for(let j=i+1;j<A.length;j++){
        const b=A[j], dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
        const minD=a.r+b.r+0.5;
        if(d>0 && d<minD){
          const nx=dx/d, ny=dy/d, overlap=minD-d;
          a.x-=nx*overlap*0.5; a.y-=ny*overlap*0.5;
          b.x+=nx*overlap*0.5; b.y+=ny*overlap*0.5;
          const va=a.vx*nx+a.vy*ny, vb=b.vx*nx+b.vy*ny, ma=a.m, mb=b.m;
          const va2=(va*(ma-mb)+2*mb*vb)/(ma+mb);
          const vb2=(vb*(mb-ma)+2*ma*va)/(ma+mb);
          a.vx+=(va2-va)*nx; a.vy+=(va2-va)*ny; b.vx+=(vb2-vb)*nx; b.vy+=(vb2-vb)*ny;
        }
      }
    }
  }

  // --- square bounce
  function bounceSquare(p){
    const C=CENTER(); let hit=false;
    if(p.x-p.r<0){ p.x=p.r; p.vx=Math.abs(p.vx)*0.8; hit=true; }
    if(p.x+p.r>cv.width){ p.x=cv.width-p.r; p.vx=-Math.abs(p.vx)*0.8; hit=true; }
    if(p.y-p.r<0){ p.y=p.r; p.vy=Math.abs(p.vy)*0.8; hit=true; }
    if(p.y+p.r>cv.height){ p.y=cv.height-p.r; p.vy=-Math.abs(p.vy)*0.8; hit=true; }
    if(hit){ const tx=-(p.y-C.y), ty=(p.x-C.x), tl=Math.hypot(tx,ty)||1; p.vx += (tx/tl)*0.12; p.vy += (ty/tl)*0.12; }
  }

  // --- loop
  let raf=0,t0=performance.now();
  function tick(t){
    raf=requestAnimationFrame(tick);
    const dt=Math.min(0.033,(t-t0)/1000); t0=t;
    g.clearRect(0,0,cv.width,cv.height);

    // start 2s home ramp for all on release
    if(wasHolding && !HOLDING()){ for(const p of sand) p.homeAt = isFinite(p.homeAt) ? Math.min(p.homeAt, t) : t; }
    wasHolding=HOLDING();

    // newest: schedule its half fade if due
    if(gens.length){
      const newest=gens[gens.length-1];
      if(newest.halfDueAt && !newest.halfDone && performance.now()>=newest.halfDueAt){
        const alive=aliveCount(newest.id);
        if(alive>1){ fadeFromGen(newest.id, Math.floor(alive/2), FULL_FADE_MS, 0); }
        newest.halfDone=true;
      }
    }

    // falling number (break immediately on hold)
    for(let i=groups.length-1;i>=0;i--){
      const gr=groups[i];
      if(HOLDING()){ breakToSand(gr); groups.splice(i,1); continue; }
      if(t>=gr.startAt){
        gr.x += (ptX - gr.x) * (3.2*dt);
        gr.vy = gr.vy*0.997 + (18*0.25)*dt;
        const nextY=gr.y+gr.vy, floor=cv.height-6*DPR;
        if(nextY+gr.bottomOffset>=floor){ gr.y=floor-gr.bottomOffset; breakToSand(gr); groups.splice(i,1); continue; }
        gr.y=nextY;
      }
      g.globalAlpha=BLACK_ALPHA; g.fillStyle='#111';
      for(const p of gr.parts){ g.beginPath(); g.arc(gr.x+p.ox,gr.y+p.oy,p.r,0,6.283); g.fill(); }
    }

    const R=rest();

    // integrate sand
    for(let i=0;i<sand.length;i++){
      const p=sand[i];

      if(p.dieAt!==Infinity){
        const left=p.dieAt-t;
        if(left<=0){
          const meta=gens.find(g=>g.id===p.gen);
          if(meta){ meta.alive=Math.max(0,(meta.alive||1)-1); if(meta.alive===0){ const idx=gens.findIndex(g=>g.id===meta.id); if(idx>-1) gens.splice(idx,1); } }
          sand.splice(i--,1); continue;
        }
        p.fade=clamp(left/280,0,1);
      }else p.fade=1;

      if(HOLDING()){
        const bx=ptX - p.x, by=ptY - p.y, bl=Math.hypot(bx,by)||1;
        p.vx += (bx/bl) * K_HOLD_MAX;
        p.vy += (by/bl) * K_HOLD_MAX;
        p.vx += SWIRL * (p.y - R.cy);
        p.vy += -SWIRL * (p.x - R.cx);
      }else{
        const ax = R.cx + (p.aRf*R.r)*Math.cos(p.aAng);
        const ay = R.cy + (p.aRf*R.r)*Math.sin(p.aAng);
        const tx = ax + (p.lRf*R.r)*Math.cos(p.lAng);
        const ty = ay + (p.lRf*R.r)*Math.sin(p.lAng);
        const start = isFinite(p.homeAt) ? p.homeAt : t;
        const ramp = clamp((t - start - (p.relLag||0))/2000, 0, 1);
        const kHome = K_HOME_BASE * ramp;
        p.vx += (tx - p.x) * kHome;
        p.vy += (ty - p.y) * kHome;
        p.vx += SWIRL * (p.y - R.cy);
        p.vy += -SWIRL * (p.x - R.cx);
        p.vy += Math.sin((t+p.seed)*0.006)*0.001;
      }

      p.vx*=DAMP; p.vy*=DAMP; p.x+=p.vx; p.y+=p.vy;
      bounceSquare(p);
    }

    if(sand.length) collide(sand);

    // draw
    for(const p of sand){
      g.globalAlpha=BLACK_ALPHA*p.fade; g.fillStyle='#111';
      g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill();
    }
  }
  raf=requestAnimationFrame(tick);

  // --- result bridge (air-break)
  let lastVal=0,lastAt=0;
  const onResult=n=>{
    const now=performance.now(); if(!(n>=1&&n<=6))return;
    const dup=(n===lastVal)&&(now-lastAt<400);
    if(!dup && groups.length){ breakToSand(groups[0]); groups.length=0; }
    lastVal=n; lastAt=now; spawnDigit(n);
  };
  const types=['aeon:result','aeon:result:calc'];
  for(const t of types){ addEventListener(t,e=>onResult(+e?.detail?.value||0),{passive:true,capture:true}); addEventListener(t,e=>onResult(+e?.detail?.value||0),{passive:true}); }
  const orig=EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent=function(ev){ if(ev && types.includes(ev.type)) try{ onResult(+ev?.detail?.value||0); }catch(_){}
    return orig.call(this,ev);
  };

  window.__numRain={stop(){cancelAnimationFrame(raf); EventTarget.prototype.dispatchEvent=orig; cv.remove();}, test(){spawnDigit((Math.random()*6|0)+1)}};
  console.log('[number-rain] v9.6 — opacity matched; on each new roll: previous fully fades, and 3s later newest fades to 50%; stable gens, no lag.');
})();

/* === number-rain v9.8 merged 20250917151141 === */
(()=>{ // number-rain v9.8b — outer-band rest + two-roll fade
  try{window.__numRain?.stop()}catch(_){}
  document.getElementById('numRain')?.remove();

  const vv=()=> (visualViewport ?? {width:innerWidth,height:innerHeight});
  const DPR=Math.min(2, devicePixelRatio||1);
  const cv=Object.assign(document.createElement('canvas'),{id:'numRain',ariaHidden:'true'});
  Object.assign(cv.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'-2'});
  const anchor=document.querySelector('#ringsFX,#floatFX,#bgfx');
  (anchor?.parentNode||document.body).insertBefore(cv,anchor||document.body.firstChild);
  const g=cv.getContext('2d',{alpha:true});
  const fit=()=>{const v=vv(); cv.width=Math.max(1,Math.round(v.width*DPR)); cv.height=Math.max(1,Math.round(v.height*DPR));}; fit();
  addEventListener('resize',fit,{passive:true}); (visualViewport||window).addEventListener?.('resize',fit,{passive:true});

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const CENTER = ()=>({x:cv.width*0.5,y:cv.height*0.5});
  const GOLD=2.39996322973;

  // input mirror
  let bodyHolding=false, pointerHolding=false, ptX=(vv().width*0.5)*DPR, ptY=(vv().height*0.5)*DPR;
  new MutationObserver(()=>{ bodyHolding=document.body.classList.contains('holding'); }).observe(document.body,{attributes:true,attributeFilter:['class']});
  const HOLDING=()=> (bodyHolding||pointerHolding);
  const onDown=e=>{ pointerHolding=true; const c=e.touches?e.touches[0]:e; ptX=c.clientX*DPR; ptY=c.clientY*DPR; };
  const onMove=e=>{ if(pointerHolding){ const c=e.touches?e.touches[0]:e; ptX=c.clientX*DPR; ptY=c.clientY*DPR; } };
  const onUp=()=>{ pointerHolding=false; };
  addEventListener('pointerdown',onDown,{passive:true}); addEventListener('pointermove',onMove,{passive:true}); addEventListener('pointerup',onUp,{passive:true});
  addEventListener('touchstart',onDown,{passive:true}); addEventListener('touchmove',onMove,{passive:true}); addEventListener('touchend',onUp,{passive:true});

  // mask
  const DOT_R=3.0*DPR;
  function digitMask(n,scale){
    const W=92,H=112,c=document.createElement('canvas'); c.width=W; c.height=H;
    const x=c.getContext('2d'); x.fillStyle='#000'; x.textAlign='center'; x.textBaseline='middle'; x.font='800 94px system-ui,Arial';
    x.fillText(String(n),W/2,H/2+2);
    const img=x.getImageData(0,0,W,H).data, TARGET=220, step=Math.max(2,Math.round(Math.sqrt((W*H)/TARGET)));
    const pts=[]; let minY=1e9,maxY=-1e9;
    for(let y=0;y<H;y+=step) for(let xx=0;xx<W;xx+=step){
      if(img[(y*W+xx)*4+3]>150){ const oy=(y-H/2)*scale, ox=(xx-W/2)*scale; pts.push({ox,oy,r:DOT_R}); if(oy<minY)minY=oy; if(oy>maxY)maxY=oy; }
    }
    return {pts,halfH:{min:minY,max:maxY}};
  }

  // state + physics
  const groups=[], sand=[], gens=[]; let NEXT_ID=1, wasHolding=false;
  const DAMP=0.985, K_HOME_BASE=0.028, K_HOLD_MAX=0.58, SWIRL=0.0005;
  const BLACK_ALPHA=0.78, FULL_FADE_MS=900;

  // rest container (shrunk a bit so blacks sit just around cube)
  const REST_F=0.56;
  function rest(){ const c=CENTER(); return {cx:c.x, cy:c.y, r:Math.min(cv.width,cv.height)*REST_F}; }

  // prioritize outer band first
  const OUTER_MIN=0.86, OUTER_MAX=0.96;

  // gens helpers
  const newGen=total=>{ const id=NEXT_ID++; gens.push({id,born:performance.now(),total,alive:total,halfDueAt:null,halfDone:false}); return id; };
  const aliveCount=id=>{ let n=0; for(const p of sand) if(p.gen===id && p.dieAt===Infinity) n++; return n; };
  function fadeFromGen(id,count,totalMs=FULL_FADE_MS,delayMs=0){
    if(count<=0) return 0; const base=performance.now()+delayMs;
    let done=0, step=Math.max(8,totalMs/Math.max(1,count)), t=0;
    for(const p of sand){ if(done>=count) break; if(p.gen===id && p.dieAt===Infinity){ p.dieAt=base+t; t+=step; done++; } }
    return done;
  }

  // spawn & break
  let currentRoll=0;
  function spawnDigit(n){
    currentRoll=n;
    const cx=(vv().width*0.5)*DPR, y0=-120*DPR, m=digitMask(n,1.48*DPR);
    groups.length=0;
    groups.push({x:cx,y:y0,vy:0,parts:m.pts,bottomOffset:m.halfH.max,startAt:performance.now()+80,roll:n});
  }
  function breakToSand(gr){
    const N=gr.parts.length, genId=newGen(N);
    for(let k=0;k<N;k++){
      const p0=gr.parts[k], bias=k/N;
      const rt=(bias<0.65 ? (OUTER_MIN+Math.random()*(OUTER_MAX-OUTER_MIN)) : (0.52+Math.random()*0.20));
      const th=GOLD*k + (Math.random()-0.5)*0.2;
      sand.push({
        x:gr.x+p0.ox, y:gr.y+p0.oy,
        vx:(Math.random()-0.5)*2.2*DPR, vy:(-1-Math.random()*2)*DPR,
        r:p0.r, m:p0.r*p0.r, fade:1, dieAt:Infinity,
        rt, th, seed:(k*9973)%10000, relLag:(k%23)*35 + Math.random()*120,
        homeAt: performance.now(), gen: genId
      });
    }
    const newest=gens[gens.length-1], prev=gens.length>=2?gens[gens.length-2]:null;
    if(prev){ fadeFromGen(prev.id, aliveCount(prev.id), FULL_FADE_MS, 0); newest.halfDueAt=performance.now()+FULL_FADE_MS+3000; }
    else newest.halfDueAt=performance.now()+3000;
  }

  // collisions/bounds
  function collide(A){
    for(let i=0;i<A.length;i++){
      const a=A[i];
      for(let j=i+1;j<A.length;j++){
        const b=A[j], dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
        const minD=a.r+b.r+0.5;
        if(d>0 && d<minD){
          const nx=dx/d, ny=dy/d, overlap=minD-d;
          a.x-=nx*overlap*0.5; a.y-=ny*overlap*0.5; b.x+=nx*overlap*0.5; b.y+=ny*overlap*0.5;
          const va=a.vx*nx+a.vy*ny, vb=b.vx*nx+b.vy*ny, ma=a.m, mb=b.m;
          const va2=(va*(ma-mb)+2*mb*vb)/(ma+mb); const vb2=(vb*(mb-ma)+2*ma*va)/(ma+mb);
          a.vx+=(va2-va)*nx; a.vy+=(va2-va)*ny; b.vx+=(vb2-vb)*nx; b.vy+=(vb2-vb)*ny;
        }
      }
    }
  }
  function bounceSquare(p){
    const C=CENTER(); let hit=false;
    if(p.x-p.r<0){ p.x=p.r; p.vx=Math.abs(p.vx)*0.8; hit=true; }
    if(p.x+p.r>cv.width){ p.x=cv.width-p.r; p.vx=-Math.abs(p.vx)*0.8; hit=true; }
    if(p.y-p.r<0){ p.y=p.r; p.vy=Math.abs(p.vy)*0.8; hit=true; }
    if(p.y+p.r>cv.height){ p.y=cv.height-p.r; p.vy=-Math.abs(p.vy)*0.8; hit=true; }
    if(hit){ const tx=-(p.y-C.y), ty=(p.x-C.x), tl=Math.hypot(tx,ty)||1; p.vx+=(tx/tl)*0.12; p.vy+=(ty/tl)*0.12; }
  }

  // loop
  let rafId=0,t0=performance.now();
  function tick(t){
    rafId=requestAnimationFrame(tick);
    const dt=Math.min(0.033,(t-t0)/1000); t0=t;
    g.clearRect(0,0,cv.width,cv.height);

    // ramp-to-home only after release
    if(wasHolding && !HOLDING()){ for(const p of sand) p.homeAt=t; }
    wasHolding=HOLDING();

    // schedule newest half-fade
    if(gens.length){
      const newest=gens[gens.length-1];
      if(newest.halfDueAt && !newest.halfDone && performance.now()>=newest.halfDueAt){
        const alive=aliveCount(newest.id); if(alive>1) fadeFromGen(newest.id, Math.floor(alive/2), FULL_FADE_MS, 0);
        newest.halfDone=true;
      }
    }

    // falling glyph
    for(let i=groups.length-1;i>=0;i--){
      const gr=groups[i];
      if(HOLDING()){ breakToSand(gr); groups.splice(i,1); continue; }
      if(t>=gr.startAt){
        gr.x+=(ptX-gr.x)*(3.0*dt);
        gr.vy=gr.vy*0.997+(18*0.25)*dt;
        const floor=cv.height-6*DPR, nextY=gr.y+gr.vy;
        if(nextY+gr.bottomOffset>=floor){ gr.y=floor-gr.bottomOffset; breakToSand(gr); groups.splice(i,1); continue; }
        gr.y=nextY;
      }
      g.globalAlpha=BLACK_ALPHA; g.fillStyle='#111';
      for(const p of gr.parts){ g.beginPath(); g.arc(gr.x+p.ox,gr.y+p.oy,p.r,0,6.283); g.fill(); }
    }

    const R=rest();
    for(let i=0;i<sand.length;i++){
      const p=sand[i];
      if(p.dieAt!==Infinity){
        const left=p.dieAt-t;
        if(left<=0){ sand.splice(i--,1); continue; }
        p.fade=clamp(left/280,0,1);
      }else p.fade=1;

      if(HOLDING()){
        const bx=ptX-p.x, by=ptY-p.y, bl=Math.hypot(bx,by)||1;
        p.vx+=(bx/bl)*K_HOLD_MAX; p.vy+=(by/bl)*K_HOLD_MAX;
        p.vx+=SWIRL*(p.y-R.cy); p.vy+=-SWIRL*(p.x-R.cx);
      }else{
        const tx=R.cx+(R.r*p.rt)*Math.cos(p.th), ty=R.cy+(R.r*p.rt)*Math.sin(p.th);
        const ramp=clamp((t-(p.homeAt||t)-(p.relLag||0))/2000,0,1);
        const kHome=K_HOME_BASE*ramp;
        p.vx+=(tx-p.x)*kHome; p.vy+=(ty-p.y)*kHome;
        p.vx+=SWIRL*(p.y-R.cy); p.vy+=-SWIRL*(p.x-R.cx);
        p.vy+=Math.sin((t+p.seed)*0.006)*0.001;
      }
      p.vx*=DAMP; p.vy*=DAMP; p.x+=p.vx; p.y+=p.vy; bounceSquare(p);
    }
    if(sand.length) collide(sand);

    for(const p of sand){ g.globalAlpha=BLACK_ALPHA*p.fade; g.fillStyle='#111'; g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill(); }
  }
  rafId=requestAnimationFrame(tick);

  // result hook
  let lastVal=0,lastAt=0;
  const onResult=n=>{
    const now=performance.now(); if(!(n>=1&&n<=6))return;
    const dup=(n===lastVal)&&(now-lastAt<350);
    if(!dup && groups.length){ breakToSand(groups[0]); groups.length=0; }
    lastVal=n; lastAt=now; spawnDigit(n);
  };
  ['aeon:result','aeon:result:calc'].forEach(t=>{
    addEventListener(t,e=>onResult(+e?.detail?.value||0),{passive:true,capture:true});
    addEventListener(t,e=>onResult(+e?.detail?.value||0),{passive:true});
  });

  window.__numRain={ stop(){try{cancelAnimationFrame(rafId);}catch(_){ } try{cv.remove();}catch(_){ }} };
  console.log('[number-rain] v9.8b — outer-band rest + two-roll fade');
})();
/* STATS_MINI_DICE_ICONS v1 */
(function(){
  function U(){
    var css="#statsOverlay .statsPanel{padding-bottom:56px}#statsOverlay .bar-icons{position:absolute;left:0;right:0;bottom:12px;height:24px;pointer-events:none}#statsOverlay .bar-icons i{position:absolute;width:22px;height:22px;transform:translateX(-50%);background:center/contain no-repeat}";
    if(!document.getElementById("stats-icons-css")){
      var s=document.createElement("style"); s.id="stats-icons-css"; s.textContent=css; document.head.appendChild(s);
    }
  }
  function iconURI(n){
    var p={tl:[8,8],tr:[16,8],ml:[8,12],mid:[12,12],mr:[16,12],bl:[8,16],br:[16,16]},
        F={1:["mid"],2:["tl","br"],3:["tl","mid","br"],4:["tl","tr","bl","br"],5:["tl","tr","mid","bl","br"],6:["tl","tr","ml","mr","bl","br"]}[n],
        acc=(getComputedStyle(document.documentElement).getPropertyValue("--accent")||"#e10600").trim(),
        dots=F.map(function(k){return '<circle cx="'+p[k][0]+'" cy="'+p[k][1]+'" r="2.25"/>'}).join(""),
        svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="#0b0d10" stroke="#0b0d10" stroke-width="1.2"/><g fill="'+acc+'">'+dots+"</g></svg>";
    return 'url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';
  }
  function layout(){
    U();
    var panel=document.querySelector("#statsOverlay .statsPanel"),
        bars=document.querySelectorAll("#statsOverlay .bars .bar");
    if(!panel||!bars.length) return;
    var row=panel.querySelector(".bar-icons");
    if(!row){ row=document.createElement("div"); row.className="bar-icons"; panel.appendChild(row); }
    while(row.children.length<bars.length) row.appendChild(document.createElement("i"));
    while(row.children.length>bars.length) row.removeChild(row.lastChild);
    var panR=panel.getBoundingClientRect();
    bars.forEach(function(bar,i){
      var icon=row.children[i];
      icon.style.backgroundImage=iconURI(i+1);
      var r=bar.getBoundingClientRect(), cx=r.left-panR.left+r.width/2;
      icon.style.left=cx+"px";
    });
  }
  var root=document.body;
  new MutationObserver(layout).observe(root,{childList:true,subtree:true,attributes:true});
  addEventListener("resize",layout,{passive:true});
  setTimeout(layout,50);
})();
/* Force refresh disabled - was causing redirect loops */
/* DICE_UI_CLEAN_V1 */
(function(){
  if (window.__DICE_UI_CLEAN_V1__) return; window.__DICE_UI_CLEAN_V1__=true;

  // ---------- Total badge (safe, throttled)
  function cssOnce(id,css){ if(document.getElementById(id)) return; var s=document.createElement("style"); s.id=id; s.textContent=css; document.head.appendChild(s); }
  cssOnce("stats-total-css",
    "#statsOverlay .statsPanel{position:relative}#statsOverlay .statsPanel .totalBadge{position:absolute;top:12px;right:16px;padding:6px 10px;border-radius:999px;background:#111;color:#fff;font:600 14px system-ui,Arial;box-shadow:0 6px 16px rgba(0,0,0,.15)}"
  );
  function q(s){return document.querySelector(s)}
  function qa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
  var scheduled=false;
  function scheduleTotal(){ if(scheduled) return; scheduled=true; requestAnimationFrame(function(){ scheduled=false; updateTotal(); }); }
  function updateTotal(){
    var panel=q("#statsOverlay .statsPanel"); if(!panel) return;
    var badge=panel.querySelector(".totalBadge"); if(!badge){ badge=document.createElement("div"); badge.className="totalBadge"; panel.appendChild(badge); }
    var sum=qa("#statsOverlay .bars .bar .val").map(function(x){var v=parseInt(x.textContent,10);return isNaN(v)?0:v}).reduce(function(a,b){return a+b},0);
    var next="Total: "+sum; if(badge.textContent!==next) badge.textContent=next;
  }
  if(typeof window.openStats==="function" && !window.__TOTAL_WRAP__){
    var __orig=openStats; window.openStats=function(){ __orig(); scheduleTotal(); }; window.__TOTAL_WRAP__=true;
  }
  (function observeBars(){ var bars=q("#statsOverlay .bars"); if(!bars) return; new MutationObserver(scheduleTotal).observe(bars,{childList:true,subtree:true,characterData:true}); })();
  addEventListener("aeon:result", scheduleTotal, {passive:true}); addEventListener("aeon:result:calc", scheduleTotal, {passive:true});
  scheduleTotal();

  // ---------- Last-5 mini dice ribbon (idempotent)
  cssOnce("last5-dice-css",
    "#last5Dice{position:fixed;top:64px;left:50%;transform:translateX(-50%);display:flex;gap:10px;padding:8px 14px;border-radius:999px;background:rgba(17,17,17,.85);box-shadow:0 10px 24px rgba(0,0,0,.18);z-index:12;pointer-events:none;backdrop-filter:blur(4px)}#last5Dice i{width:22px;height:22px;display:block;background:center/contain no-repeat;filter:drop-shadow(0 0 1px rgba(225,6,0,.25))}@keyframes l5in{0%{transform:translateY(8px) scale(.7);opacity:0}100%{transform:none;opacity:1}}#last5Dice i.new{animation:l5in .22s ease-out}"
  );
  var wrap=document.getElementById("last5Dice"); if(!wrap){ wrap=document.createElement("div"); wrap.id="last5Dice"; document.body.appendChild(wrap); }
  var hist=(window.__last5dice ||= []);
  function acc(){ var v=getComputedStyle(document.documentElement).getPropertyValue("--accent"); return (v&&v.trim())||"#e10600"; }
  function icon(n){
    var p={tl:[8,8],tr:[16,8],ml:[8,12],mid:[12,12],mr:[16,12],bl:[8,16],br:[16,16]},
        F={1:["mid"],2:["tl","br"],3:["tl","mid","br"],4:["tl","tr","bl","br"],5:["tl","tr","mid","bl","br"],6:["tl","tr","ml","mr","bl","br"]}[n]||["mid"];
    var dots=F.map(function(k){return "<circle cx=\""+p[k][0]+"\" cy=\""+p[k][1]+"\" r=\"2.25\"/>"}).join("");
    var svg="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\" ry=\"3\" fill=\"#0b0d10\" stroke=\"#0b0d10\" stroke-width=\"1.2\"/><g fill=\""+acc()+"\">"+dots+"</g></svg>";
    return "url(\"data:image/svg+xml,"+encodeURIComponent(svg)+"\")";
  }
  function renderLast5(){
    wrap.innerHTML=""; var fades=[1,.8,.62,.48,.36], arr=hist.slice(-5);
    for(var i=0;i<arr.length;i++){ var el=document.createElement("i"); el.style.backgroundImage=icon(arr[i]); el.style.opacity=fades[Math.max(0,arr.length-5+i)]; wrap.appendChild(el); }
    var last=wrap.lastElementChild; if(last){ last.classList.add("new"); last.addEventListener("animationend",function(){ last.classList.remove("new"); },{once:true}); }
  }
  function push(n){ if(!(n>=1&&n<=6)) return; hist.push(n); if(hist.length>5) hist.splice(0,hist.length-5); renderLast5(); }
  if(!window.__L5_WIRED__){
    addEventListener("aeon:result", function(e){ push(+((e&&e.detail&&e.detail.value)||0)); }, {passive:true});
    addEventListener("click", function(e){ var b=e.target && e.target.closest && e.target.closest("#statsOverlay") && /reset/i.test((e.target.textContent||"")); if(b){ hist.length=0; renderLast5(); } }, true);
    window.__L5_WIRED__=true;
  }
  renderLast5();
})();
/* AEON_TTS_PERM */
(()=>{if(!('speechSynthesis'in window))return;
const LS={mute:'tts_mute',vol:'tts_vol',voice:'tts_voice'};
const state={mute:JSON.parse(localStorage.getItem(LS.mute)||'false'),
             vol:+localStorage.getItem(LS.vol)||0.8,voiceURI:localStorage.getItem(LS.voice)||''};
const $=(s)=>document.querySelector(s),sound=$('#aeon-sound'),vol=$('#aeon-vol'),ov=$('#aeon-ov'),btn=$('#aeon-btn');
if(btn&&ov){const show=()=>ov.classList.add('on'),hide=()=>ov.classList.remove('on');
btn.addEventListener('click',show,{passive:true});ov.addEventListener('click',e=>{if(e.target===ov)hide();},{passive:true});}
if(sound){sound.checked=!state.mute;sound.addEventListener('change',()=>{state.mute=!sound.checked;localStorage.setItem(LS.mute,JSON.stringify(state.mute));},{passive:true});}
if(vol){vol.value=Math.round(state.vol*100);vol.style.setProperty('--pct',vol.value);
vol.addEventListener('input',()=>{state.vol=(+vol.value||0)/100;vol.style.setProperty('--pct',vol.value);localStorage.setItem(LS.vol,String(state.vol));},{passive:true});}
function pickVoice(){const vs=speechSynthesis.getVoices()||[];let cand=vs.filter(v=>/^es(-|_)?US/i.test(v.lang)||/Estados Unidos/i.test(v.name));if(!cand.length)cand=vs.filter(v=>/^es/i.test(v.lang));
const female=cand.filter(v=>/female|femen/i.test(v.name));const v=female[0]||cand[0]||null;if(v)state.voiceURI=v.voiceURI||'';localStorage.setItem(LS.voice,state.voiceURI||'');return v}
function speak(n){if(state.mute)return;const words=['','uno','dos','tres','cuatro','cinco','seis'];const w=words[n|0];if(!w)return;
const u=new SpeechSynthesisUtterance(w);const v=(speechSynthesis.getVoices()||[]).find(x=>x.voiceURI===state.voiceURI)||pickVoice();
if(v)u.voice=v;u.lang=(v&&v.lang)||'es-US';u.pitch=1.1;u.rate=0.95;u.volume=Math.max(0,Math.min(1,state.vol));try{speechSynthesis.cancel();speechSynthesis.speak(u);}catch{}}
let primed=false;addEventListener('pointerdown',()=>{if(primed)return;primed=true;try{speechSynthesis.resume();const p=new SpeechSynthesisUtterance('uno');p.volume=0;speechSynthesis.speak(p);setTimeout(()=>speechSynthesis.cancel(),30);}catch{}},{once:true,passive:true});
let tries=0,iv=setInterval(()=>{tries++;if((speechSynthesis.getVoices()||[]).length||tries>20){clearInterval(iv);pickVoice();}},150);speechSynthesis.onvoiceschanged=pickVoice;
addEventListener('aeon:result',e=>{const n=+((e&&e.detail&&e.detail.value)||0);if(n>=1&&n<=6)speak(n);},{passive:true});
addEventListener('aeon:result:calc',e=>{const n=+((e&&e.detail&&e.detail.value)||0);if(n>=1&&n<=6)speak(n);},{passive:true});
})();
