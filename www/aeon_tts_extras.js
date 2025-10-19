/* AEON — TTS EXTRAS v1
   - If three 6s in a row: append “La cagaste”
   - Every 100 rolls: append one random bonus line
   - Respects ttsPrev_mute / ttsPrev_vol
   - Uninstall: window.AEON_TTS_EXTRAS?.uninstall()
*/
(() => {
  const NS = "AEON_TTS_EXTRAS";
  if (window[NS]?.uninstall) window[NS].uninstall();

  const SKEY_MUTE  = "ttsPrev_mute";
  const SKEY_VOL   = "ttsPrev_vol";
  const SKEY_COUNT = "aeon_roll_count";

  const getMute = () => { try { return JSON.parse(sessionStorage.getItem(SKEY_MUTE) || "false"); } catch { return false; } };
  const getVol  = () => { const v = +sessionStorage.getItem(SKEY_VOL) || 0.8; return Math.min(1, Math.max(0, v)); };

  const pickVoice = () => {
    if (!("speechSynthesis" in window)) return null;
    const vs = speechSynthesis.getVoices() || [];
    let cand = vs.filter(v => /^es(-|_)?US/i.test(v.lang) || /Estados Unidos/i.test(v.name));
    if (!cand.length) cand = vs.filter(v => /^es/i.test(v.lang));
    const female = cand.filter(v => /female|femen/i.test(v.name));
    return female[0] || cand[0] || null;
  };

  function say(text) {
    if (!text || getMute() || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(); if (v) u.voice = v;
    u.lang = (v && v.lang) || "es-US";
    u.rate = 0.95; u.pitch = 1.05; u.volume = getVol();
    try { speechSynthesis.speak(u); } catch {}
  }

  // prime on first user gesture
  let primed = false;
  addEventListener("pointerdown", () => {
    if (primed) return; primed = true;
    try { speechSynthesis.resume(); const p = new SpeechSynthesisUtterance("uno"); p.volume = 0; speechSynthesis.speak(p); setTimeout(() => speechSynthesis.cancel(), 30); } catch {}
  }, { once: true, passive: true });

  const bonusLines = [
    "Te Amo Anely",
    "Quien quiere pico",
    "Ustedes no hacen nada mas que jugar o que?",
    "El Gabriel es bien culon",
    "A patty le suda el mico",
    "A la pepi le huele el mico",
    "Anely tiene el culo chiquito pero caga Cerotones",
    "A la Anita le yeden las patas",
    "El toshi tiene las nalgas paches",
    "Que huele a caca"
  ];

  let streakSix = 0;

  function onResult(e) {
    let n = +(e?.detail?.value || 0);
    if (!(n >= 1 && n <= 6)) {
      const t = document.querySelector("#count")?.textContent || "";
      n = +String(t).replace(/\D/g, "");
    }
    if (!(n >= 1 && n <= 6)) return;

    streakSix = (n === 6) ? (streakSix + 1) : 0;

    let rolls = +sessionStorage.getItem(SKEY_COUNT) || 0;
    rolls++; sessionStorage.setItem(SKEY_COUNT, String(rolls));

    // append after the built-in number TTS
    setTimeout(() => {
      if (streakSix === 3) { say("La cagaste"); streakSix = 0; }
      if (rolls % 100 === 0) {
        const msg = bonusLines[Math.floor(Math.random() * bonusLines.length)];
        say(msg);
      }
    }, 60);
  }

  addEventListener("aeon:result", onResult, { passive: true });
  addEventListener("aeon:result:calc", onResult, { passive: true });

  if ("speechSynthesis" in window) {
    let tries = 0, iv = setInterval(() => {
      tries++;
      if ((speechSynthesis.getVoices() || []).length || tries > 12) clearInterval(iv);
    }, 200);
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  window[NS] = {
    uninstall() {
      removeEventListener("aeon:result", onResult, { passive: true });
      removeEventListener("aeon:result:calc", onResult, { passive: true });
      delete window[NS];
      console.log("AEON TTS extras removed");
    }
  };

  console.log("AEON TTS EXTRAS v1 active");
})();
