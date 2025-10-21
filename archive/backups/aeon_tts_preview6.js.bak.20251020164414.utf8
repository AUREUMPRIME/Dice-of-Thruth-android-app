/* AEON — Console PREVIEW v6 (gray OFF) */
(()=>{(window.AEON_TTS_PREVIEW5?.uninstall?.(),window.AEON_TTS_PREVIEW4?.uninstall?.());
const NS="AEON_TTS_PREVIEW6"; if(window[NS]?.uninstall) window[NS].uninstall();
const SKEY={mute:"ttsPrev_mute",vol:"ttsPrev_vol"};
const state={mute:JSON.parse(sessionStorage.getItem(SKEY.mute)||"false"),vol:+sessionStorage.getItem(SKEY.vol)||0.8,voiceURI:""};
const save=()=>{sessionStorage.setItem(SKEY.mute,JSON.stringify(state.mute));sessionStorage.setItem(SKEY.vol,String(state.vol));};
const css=`:root{--aeon-red:#dc2626;--aeon-off:#e5e7eb;--aeon-bg:#fff;--aeon-border:#0002;--aeon-shadow:#0002}
.aeon-btn{position:fixed;right:14px;top:14px;width:38px;height:38px;display:grid;place-items:center;border-radius:12px;border:1px solid var(--aeon-border);background:var(--aeon-bg);z-index:90}
.aeon-btn svg{width:22px;height:22px}
.aeon-ov{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:linear-gradient(#0000,#00000018);backdrop-filter:blur(2px)}
.aeon-ov.on{display:flex}
.aeon-panel{width:min(520px,92vw);background:#fff;border:1px solid var(--aeon-border);border-radius:18px;padding:16px 14px;box-shadow:0 24px 60px var(--aeon-shadow);font:500 14px system-ui}
.aeon-row{display:flex;align-items:center;justify-content:space-between;padding:10px 6px}
.aeon-label{font:600 15px system-ui}
.aeon-toggle{position:relative;width:54px;height:30px;border-radius:999px;cursor:pointer}
.aeon-toggle input{position:absolute;inset:0;opacity:0;z-index:3}
.aeon-track{position:absolute;inset:0;border-radius:999px;background:var(--aeon-off);transition:background .2s;z-index:1;border:1px solid var(--aeon-border)}
.aeon-knob{position:absolute;top:3px;left:3px;width:24px;height:24px;background:#fff;border-radius:50%;box-shadow:0 1px 3px var(--aeon-shadow);transition:transform .2s;z-index:2}
.aeon-toggle input:checked~.aeon-track{background:var(--aeon-red)}
.aeon-toggle input:checked~.aeon-knob{transform:translateX(24px)}
.aeon-vol{width:200px}
.aeon-vol input[type=range]{width:100%;height:28px;background:transparent;appearance:none;-webkit-appearance:none}
.aeon-vol input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:999px;background:linear-gradient(90deg,var(--aeon-red) calc(var(--pct,0)*1%),#e5e7eb 0)}
.aeon-vol input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--aeon-red);border:0;margin-top:-6px}
.aeon-vol input[type=range]::-moz-range-track{height:6px;border-radius:999px;background:linear-gradient(90deg,var(--aeon-red) calc(var(--pct,0)*1%),#e5e7eb 0)}
.aeon-vol input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--aeon-red);border:0}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
const btn=document.createElement("button");btn.className="aeon-btn";btn.ariaLabel="Ajustes";btn.innerHTML=`<svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 4V6l-5 4H3z" fill="#111"/><path d="M14 9c1.8 1.8 1.8 4.2 0 6" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16.5 6.5c3 3 3 8 0 11" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const ov=document.createElement("div");ov.className="aeon-ov";ov.id="aeon-ov";ov.role="dialog";ov.setAttribute("aria-modal","true");ov.innerHTML=`<div class="aeon-panel"><div class="aeon-row"><div class="aeon-label">Sonido</div><label class="aeon-toggle"><input id="aeon-sound" type="checkbox"><span class="aeon-track"></span><i class="aeon-knob"></i></label></div><div class="aeon-row"><div class="aeon-label">Volumen</div><div class="aeon-vol"><input id="aeon-vol" type="range" min="0" max="100" step="5"></div></div></div>`;document.body.append(btn,ov);
const $=s=>document.querySelector(s),sound=$("#aeon-sound"),vol=$("#aeon-vol");const show=()=>ov.classList.add("on"),hide=()=>ov.classList.remove("on");btn.addEventListener("click",show,{passive:true});ov.addEventListener("click",e=>{if(e.target===ov)hide();},{passive:true});
sound.checked=!state.mute;vol.value=Math.round(state.vol*100);vol.style.setProperty("--pct",vol.value);
sound.addEventListener("change",()=>{state.mute=!sound.checked;save();},{passive:true});vol.addEventListener("input",()=>{state.vol=(+vol.value||0)/100;vol.style.setProperty("--pct",vol.value);save();},{passive:true});
const words=['','uno','dos','tres','cuatro','cinco','seis'];
function pickVoice(){if(!("speechSynthesis"in window))return null;const vs=speechSynthesis.getVoices()||[];let cand=vs.filter(v=>/^es(-|_)?US/i.test(v.lang)||/Estados Unidos/i.test(v.name));if(!cand.length)cand=vs.filter(v=>/^es/i.test(v.lang));const female=cand.filter(v=>/female|femen/i.test(v.name));const v=female[0]||cand[0]||null;state.voiceURI=v?.voiceURI||"";return v}
function speak(n){if(state.mute||!("speechSynthesis"in window))return;const w=words[n|0];if(!w)return;const u=new SpeechSynthesisUtterance(w);const v=(speechSynthesis.getVoices()||[]).find(x=>x.voiceURI===state.voiceURI)||pickVoice();if(v)u.voice=v;u.lang=(v&&v.lang)||'es-US';u.pitch=1.1;u.rate=0.95;u.volume=Math.max(0,Math.min(1,state.vol));try{speechSynthesis.cancel();speechSynthesis.speak(u)}catch(_){}}
let primed=false;addEventListener("pointerdown",()=>{if(primed||!("speechSynthesis"in window))return;primed=true;try{speechSynthesis.resume();const p=new SpeechSynthesisUtterance("uno");p.volume=0;speechSynthesis.speak(p);setTimeout(()=>speechSynthesis.cancel(),30)}catch(_){}},{once:true,passive:true});
let tries=0,iv=setInterval(()=>{tries++;if((speechSynthesis.getVoices()||[]).length||tries>20){clearInterval(iv);pickVoice();}},150);if("speechSynthesis"in window)speechSynthesis.onvoiceschanged=pickVoice;
function onResult(e){let n=+(e?.detail?.value||0);if(!(n>=1&&n<=6)){const t=document.querySelector("#count")?.textContent||"";n=+t.replace(/\D/g,"")}if(n>=1&&n<=6)speak(n)}
addEventListener("aeon:result",onResult,{passive:true});addEventListener("aeon:result:calc",onResult,{passive:true});
window[NS]={uninstall:()=>{removeEventListener("aeon:result",onResult,{passive:true});removeEventListener("aeon:result:calc",onResult,{passive:true});btn.remove();ov.remove();st.remove();delete window[NS];console.log("AEON TTS preview v6 removed")}};
console.log("AEON TTS preview v6 installed. Reload to revert.");
})();
