document.addEventListener("deviceready", function () {
  if (!("speechSynthesis" in window) && window.TTS) {
    window.SpeechSynthesisUtterance = function (t) {
      this.text = t || "";
      this.lang = "es-ES"; this.rate = 1; this.pitch = 1; this.volume = 1;
    };
    window.speechSynthesis = {
      cancel:function(){}, pause:function(){}, resume:function(){},
      speak:function(u){
        try{
          TTS.speak({
            text: (u && u.text) || "",
            locale: (u && u.lang) || "es-ES",
            rate: (u && u.rate) || 1.0,
            pitch: 1.0, volume: 1.0
          }, function(){}, function(err){ console.warn("TTS error:", err); });
        }catch(e){ console.warn("TTS polyfill error:", e); }
      }
    };
    console.log("[AEON] TTS via cordova-plugin-tts");
  }

  window.AEON_TTS = function (text, lang) {
    if ("speechSynthesis" in window) {
      var u = new SpeechSynthesisUtterance(text); u.lang = lang || "es-ES";
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      return true;
    }
    if (window.TTS) { TTS.speak({ text: text, locale: lang || "es-ES", rate: 1.0 }, function(){}, console.warn); return true; }
    return false;
  };

  window.AEON_VIB = function (pattern) {
    try {
      if (navigator.vibrate && navigator.vibrate(pattern || 30)) return true;
      if (navigator.notification && navigator.notification.vibrate) { navigator.notification.vibrate(pattern || 30); return true; }
    } catch(e){ console.warn(e); }
    return false;
  };
});
