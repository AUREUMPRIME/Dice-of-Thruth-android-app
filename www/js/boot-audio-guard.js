(function(){
  var tracked = [], patched = false;

  function patchMedia(){
    try{
      var M = window.Media;
      if(!M || patched) return;
      patched = true;
      var Old = M;

      // Envolver constructor para registrar toda instancia nueva
      function Wrapped(src, success, error, status){
        var inst = new Old(src, success, error, status);
        try{ tracked.push(inst); }catch(e){}
        return inst;
      }
      Wrapped.prototype = Old.prototype;
      window.Media = Wrapped;

      // Asegura registrar instancias ya creadas cuando llamen play()
      var oldPlay = Old.prototype.play;
      Old.prototype.play = function(){
        try{ if(tracked.indexOf(this) < 0) tracked.push(this); }catch(e){}
        return oldPlay.apply(this, arguments);
      };
    }catch(e){}
  }

  function stopAll(){
    try{
      // HTML5 video/audio
      var v = document.querySelectorAll('video');
      for(var i=0;i<v.length;i++){ try{ v[i].pause(); v[i].currentTime=0; v[i].style.display='none'; }catch(e){} }
      var a = document.querySelectorAll('audio');
      for(var j=0;j<a.length;j++){ try{ a[j].pause(); a[j].currentTime=0; a[j].muted=true; }catch(e){} }

      // Howler (global)
      try{ if(window.Howler && typeof Howler.stop==='function'){ Howler.stop(); } }catch(e){}
      try{ if(window.Howler && typeof Howler.unload==='function'){ Howler.unload(); } }catch(e){}
      try{ if(window.bootHowl && typeof window.bootHowl.stop==='function'){ window.bootHowl.stop(); } }catch(e){}

      // Cordova Media: detener y liberar
      for(var k=0;k<tracked.length;k++){
        var m = tracked[k];
        try{ if(m && typeof m.stop==='function'){ m.stop(); } }catch(e){}
        try{ if(m && typeof m.release==='function'){ m.release(); } }catch(e){}
      }
    }catch(e){}
  }

  var fired=false;
  function once(){ if(fired) return; fired=true; stopAll();
    try{ document.removeEventListener('touchstart', once, true); }catch(e){}
    try{ document.removeEventListener('click',      once, true); }catch(e){}
    try{ document.removeEventListener('keydown',    once, true); }catch(e){}
  }

  // Parchar lo antes posible y también tras deviceready
  patchMedia(); setTimeout(patchMedia,50); setTimeout(patchMedia,500); setTimeout(patchMedia,1500);
  document.addEventListener('deviceready', patchMedia, true);

  // Primer gesto del usuario detiene TODO
  document.addEventListener('touchstart', once, true);
  document.addEventListener('click',      once, true);
  document.addEventListener('keydown',    once, true);
})();
