(() => {
  try { window.__floatFX?.stop?.(); } catch {}
  try { window.__numRain?.stop?.(); } catch {}
  for (const id of ['floatFX','bgfx','bgRnd','numRain']) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
  const st = document.createElement('style');
  st.textContent = '#floatFX,#bgfx,#bgRnd,#numRain{display:none!important}';
  document.head.appendChild(st);
})();
