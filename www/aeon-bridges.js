/* aeon-bridges.js */
(function(){
  var queue = [];
  function trySpeak(text, lang, rate, pitch, vol){
    if (window.TTS && typeof window.TTS.speak==="function"){
      window.TTS.speak({ text:String(text||""), locale:lang||"es-ES", rate:rate||1, pitch:pitch||1, volume:vol||1 }, function(){}, function(e){console.warn("TTS error:",e);});
      return true;
    }
    if (!window.__AEON_WS_STUB && window.speechSynthesis && typeof window.speechSynthesis.speak==="function"){
      var u = new (window.SpeechSynthesisUtterance)(String(text||""));
      u.lang = lang||"es-ES"; u.rate=rate||1; u.pitch=pitch||1; u.volume=vol||1;
      window.speechSynthesis.cancel && window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    }
    return false;
  }

  // AEON_TTS existe siempre; si aún no hay motor, encola
  window.AEON_TTS = function(text, lang){ if(!trySpeak(text, lang)) queue.push([text, lang]); return true; };

  // Vibración quedará lista en deviceready
  window.AEON_VIB = function(){ return false; };

  document.addEventListener("deviceready", function(){
    // Si hay plugin, redirige cualquier uso de speechSynthesis.speak al plugin
    try{
      if (window.TTS && typeof window.TTS.speak==="function"){
        window.speechSynthesis = window.speechSynthesis || {};
        window.speechSynthesis.speak = function(u){
          var t = (typeof u==="string") ? u : (u && u.text) || "";
          var l = (u && (u.lang||u.locale)) || "es-ES";
          var r = (u && u.rate) || 1.0, p=(u&&u.pitch)||1.0, v=(u&&u.volume)||1.0;
          trySpeak(t,l,r,p,v);
        };
      }
    }catch(e){ console.warn("bridge patch error:", e); }

    // Definir vibración robusta
    window.AEON_VIB = function(pattern){
      try{
        if (navigator.vibrate && navigator.vibrate(pattern||30)) return true;
        if (navigator.notification && typeof navigator.notification.vibrate==="function"){ navigator.notification.vibrate(pattern||30); return true; }
      }catch(e){}
      return false;
    };

    // Vaciar cola
    for (var i=0;i<queue.length;i++) trySpeak(queue[i][0], queue[i][1]);
    queue.length = 0;

    console.log("[AEON] bridges ready");
  }, false);
})();

;/* AEON_FIRST_TTS_GUARD */
(function(){
  document.addEventListener('deviceready', function(){
    var wrapped=false;
    function wrap(){
      if(wrapped) return;
      if(typeof window.AEON_TTS==='function'){
        wrapped=true;
        var real=window.AEON_TTS;
        if(typeof window.__AEON_TTS_SUPPRESS==='undefined'){ window.__AEON_TTS_SUPPRESS=1; }
        window.AEON_TTS=function(){
          if(window.__AEON_TTS_LOCK) return false;            // aún en intro
          if(window.__AEON_TTS_SUPPRESS>0){                    // suprime primera
            window.__AEON_TTS_SUPPRESS=0;
            console.log('[TTS] first call suppressed');
            return false;
          }
          return real.apply(this, arguments);
        };
      } else { setTimeout(wrap,100); }
    }
    wrap();
  }, {once:true});
})();
