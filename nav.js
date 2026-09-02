/* ── nav: the pill hides going down, returns going up ── */
(() => {
  const bar = document.getElementById("bar");
  if (!bar) return;
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    bar.classList.toggle("hidden", y > lastY && y > 90);
    lastY = y;
  }, { passive: true });
})();
