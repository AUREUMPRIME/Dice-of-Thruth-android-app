/* aeon-bridges-pre.js */
(function(){
  if (typeof window.speechSynthesis === "undefined") window.speechSynthesis = {};
  if (typeof window.speechSynthesis.speak !== "function")  window.speechSynthesis.speak  = function(){};
  if (typeof window.speechSynthesis.cancel !== "function") window.speechSynthesis.cancel = function(){};
  if (typeof window.speechSynthesis.pause  !== "function") window.speechSynthesis.pause  = function(){};
  if (typeof window.speechSynthesis.resume !== "function") window.speechSynthesis.resume = function(){};
  if (typeof window.speechSynthesis.getVoices !== "function") window.speechSynthesis.getVoices = function(){ return []; };
  if (typeof window.SpeechSynthesisUtterance === "undefined") {
    window.SpeechSynthesisUtterance = function(t){ this.text=t||""; this.lang="es-ES"; this.rate=1; this.pitch=1; this.volume=1; };
  }
  window.__AEON_WS_STUB = true;
})();
