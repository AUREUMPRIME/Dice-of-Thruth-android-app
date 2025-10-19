/* AEON — Force Spanish TTS v2 (safe)
   - Forces Spanish voices at speak-time (no race on getVoices()).
   - Pref order: es-US › es-MX › es-419 › es-ES › any es. Prefer female when present.
   - Idempotent: stores original speak() under a symbol; uninstall restores it.
   - Does NOT overwrite onvoiceschanged or other handlers.
*/
(() => {
  const SYM = Symbol.for("AEON_FORCE_SP_TTS_ORIG_SPEAK");
  if (speechSynthesis[SYM]) {
    // already installed
    console.log("AEON force Spanish TTS already active");
    return;
  }

  const prefer = [/^es[-_]?US/i, /^es[-_]?MX/i, /^es[-_]?419/i, /^es[-_]?ES/i, /^es/i];
  const isFem = v => /female|femen/i.test((v && v.name) || "");

  function pickVoice() {
    const vs = (speechSynthesis.getVoices && speechSynthesis.getVoices()) || [];
    for (const p of prefer) {
      const pool = vs.filter(v => p.test(v.lang || "") || p.test(v.name || ""));
      if (pool.length) return pool.find(isFem) || pool[0];
    }
    return null;
  }

  const origSpeak = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis[SYM] = origSpeak;

  function forcedSpeak(u) {
    try {
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang || "es-US"; }
      else   { u.lang = "es-US"; }
    } catch {}
    return origSpeak(u);
  }

  // Install wrapper
  speechSynthesis.speak = forcedSpeak;

  // Ensure engine can resume after first gesture on mobile
  addEventListener("pointerdown", () => { try { speechSynthesis.resume(); } catch {} }, { once: true, capture: true });

  // Expose uninstall
  if (!window.AEON_FORCE_SP_TTS) window.AEON_FORCE_SP_TTS = {};
  window.AEON_FORCE_SP_TTS.uninstall = () => {
    try { if (speechSynthesis[SYM]) speechSynthesis.speak = speechSynthesis[SYM]; } catch {}
    try { delete speechSynthesis[SYM]; } catch {}
    console.log("AEON force Spanish TTS removed");
  };

  console.log("AEON force Spanish TTS active");
})();
