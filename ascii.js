/* ── ascii terrain: the hero landscape, drawn as characters ──
   A canvas of monospace glyphs chosen by a drifting noise field, so the
   ridge moves on its own. Renders at 30fps; the density ramp maps height to
   glyph weight, light characters at the peaks and heavy ones in the valleys. */
(() => {
/* ── the ascii terrain — characters as landscape, drifting on their own ── */
  const canvas = document.getElementById("ascii");
  const ctx = canvas.getContext("2d");
  const CHAR = 13;
  const DENSITY = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  let cols = 0, rows = 0, W = 0, H = 0, t = 0, skip = 0;
  const asciiColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--ascii").trim();

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CHAR); rows = Math.ceil(H / CHAR);
  }
  window.addEventListener("resize", resize);
  resize();

  function noise(x, y, tt) {
    return Math.sin(x * 0.05 + tt) * Math.cos(y * 0.05 + tt) +
           Math.sin(x * 0.01 - tt) * Math.cos(y * 0.12) * 0.5;
  }

  function render() {
    if (++skip & 1) { requestAnimationFrame(render); return; }   // 30fps is plenty
    ctx.clearRect(0, 0, W, H);
    ctx.font = CHAR + "px monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const t05 = t * 0.5, t01 = t * 0.1;
    for (let y = 0; y < rows; y++) {
      const posY = y * CHAR;
      const nY = (rows - y) / rows;                 // 1 at top, 0 at bottom
      const baseAlpha = Math.min(1, (1 - nY) * 1.15) * 0.55;
      for (let x = 0; x < cols; x++) {
        const posX = x * CHAR;
        const n = noise(x, y, t05);
        const ridge = 0.42 + Math.sin(x * 0.05 + t01) * 0.12 + Math.cos(x * 0.2) * 0.06;
        let ch = "", alpha = 0;
        if (nY < ridge + n * 0.1) {
          ch = DENSITY[Math.floor(Math.abs(n) * DENSITY.length) % DENSITY.length];
          alpha = baseAlpha;
        }
        if (ch) {
          ctx.fillStyle = `rgba(${asciiColor},${alpha})`;
          ctx.fillText(ch, posX, posY);
        }
      }
    }
    t += 0.01;
    requestAnimationFrame(render);
  }
  render();
})();
