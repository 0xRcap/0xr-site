/* ── glitch: the films break, loudly, in their own pixels, and settle ──
   Round 2, after his review of the first prototype (2026-10-19): the ASCII
   ground is gone, the films stay in full colour at rest, and the first pass
   was "too timid". So the break is now made of the film itself: its pixels
   sorted by brightness and smeared down the frame, blocks of it torn
   sideways, rendered chunky. ASCII survives as an accent inside the break.

   Rules kept from JEAN (jean/projects/0xr-glitch/2026-10-19-rules.md): one
   burst on the page at a time, type never glitches, nothing at rest, no RGB
   split or scanlines, reduced motion and hidden tabs stay still. Colour is
   only ever the film's own, never added (YE). */
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches ||
                (navigator.connection && navigator.connection.saveData);
  if (still) return;

  const STREAK = "':;|!lI1";
  const CORRUPT = "!<>-_\\/[]{}=+*^?#%:;";
  const INK = "#0E0D0B", PAPER = "#FAF8F4";
  const PX = 4;                                    // one "pixel" of the break is 4x4 screen px

  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

  /* PROTOTYPE ONLY: ?glitch=slow plays bursts 12x slower; window.__glitch.tile(i)
     fires one. Both come out before shipping. */
  const SLOW = /glitch=slow/.test(location.search) ? 12 : 1;
  window.__glitch = {};

  let busy = false;
  const lock = () => (busy ? false : (busy = true));
  const unlock = () => { busy = false; };

  function clusters(cols, share, wMin, wMax) {
    const out = new Set(), target = Math.round(cols * share);
    let guard = 0;
    while (out.size < target && guard++ < 300) {
      const w = ri(wMin, wMax), x0 = ri(0, Math.max(0, cols - w));
      for (let x = x0; x < x0 + w && out.size < target; x++) out.add(x);
    }
    return [...out];
  }

  function run(duration, frame, done, freezeAt) {
    if (freezeAt != null) { frame(freezeAt); return; }   // PROTOTYPE ONLY: one still frame
    const t0 = performance.now(); let skip = 0;
    (function tick(now) {
      if (++skip & 1) return requestAnimationFrame(tick);   // stepped, 30fps
      const t = (now - t0) / SLOW;
      if (t >= duration || document.hidden) { done(); return; }
      frame(t); requestAnimationFrame(tick);
    })(t0);
  }

  const reel = document.getElementById("reel");
  if (!reel) return;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cool = new WeakMap();

  function burst(tile, freezeAt) {
    if (!tile) return;
    const now = performance.now();
    if (freezeAt == null && ((cool.get(tile) || 0) > now || !lock())) return;
    cool.set(tile, now + 3000 * SLOW);

    const a = tile.querySelector("a") || tile;
    const src = tile.querySelector("video.ready") || tile.querySelector("img");
    const W = a.clientWidth, H = a.clientHeight;
    if (!src || !W || !H) { unlock(); return; }
    const cols = Math.ceil(W / PX), rows = Math.ceil(H / PX);

    // the film, at break resolution
    const srcCv = document.createElement("canvas"); srcCv.width = cols; srcCv.height = rows;
    const sg = srcCv.getContext("2d", { willReadFrequently: true });
    try { sg.drawImage(src, 0, 0, cols, rows); } catch (e) { unlock(); return; }
    const B = sg.getImageData(0, 0, cols, rows).data;

    // what breaks: sorted columns (a big share), torn blocks, and a few ASCII strips
    const sorted = clusters(cols, rnd(0.35, 0.55), 3, 14).map((x) => {
      const s = ri(0, Math.floor(rows * 0.3));
      const run = [];
      for (let y = s; y < rows; y++) { const i = (y * cols + x) * 4; run.push([B[i], B[i + 1], B[i + 2], lum(B, i)]); }
      const up = Math.random() < 0.5;
      run.sort((p, q) => (up ? p[3] - q[3] : q[3] - p[3]));
      return { x, s, run, at: rnd(0, 90), resolveAt: rnd(560, 880) };
    });
    const blocks = Array.from({ length: ri(2, 4) }, () => {
      const w = Math.round(cols * rnd(0.2, 0.5)), h = Math.max(2, Math.round(rows * rnd(0.05, 0.16)));
      return { w, h, x: ri(0, cols - w), y: ri(0, rows - h),
               off: Math.round(cols * rnd(0.05, 0.2)) * (Math.random() < 0.5 ? -1 : 1),
               from: rnd(60, 220), to: rnd(420, 700) };
    });
    const asciiCols = clusters(Math.ceil(W / 9), rnd(0.04, 0.08), 1, 3);

    const out = document.createElement("canvas"); out.width = cols; out.height = rows;
    const og = out.getContext("2d");
    const frameImg = og.createImageData(cols, rows);
    const F = frameImg.data;

    const cv = document.createElement("canvas");
    cv.className = "glitch"; cv.setAttribute("aria-hidden", "true");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    a.appendChild(cv);
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;

    run(900, (t) => {
      F.set(B);
      // pixel sort, then the smear: the head of each sorted run streaks down the frame
      for (const c of sorted) {
        if (t < c.at || t >= c.resolveAt) continue;
        const len = Math.round(easeOut(Math.min(1, (t - c.at) / 360)) * (rows - c.s));
        const head = c.run[0];
        for (let y = c.s; y < rows; y++) {
          const k = y - c.s, i = (y * cols + c.x) * 4;
          const p = k < len * 0.6 ? head : c.run[k];
          F[i] = p[0]; F[i + 1] = p[1]; F[i + 2] = p[2]; F[i + 3] = 255;
        }
      }
      // datamosh: a block of the frame torn sideways, the original left in place
      for (const b of blocks) {
        if (t < b.from || t >= b.to) continue;
        for (let y = b.y; y < b.y + b.h; y++) for (let x = 0; x < b.w; x++) {
          const sx = b.x + x, dx = sx + b.off;
          if (dx < 0 || dx >= cols) continue;
          const si = (y * cols + sx) * 4, di = (y * cols + dx) * 4;
          F[di] = F[si]; F[di + 1] = F[si + 1]; F[di + 2] = F[si + 2];
        }
      }
      og.putImageData(frameImg, 0, 0);
      g.clearRect(0, 0, W, H);
      g.drawImage(out, 0, 0, W, H);                        // chunky: no smoothing

      // the 0xR accent: a few strips of characters inside the break
      if (t > 80 && t < 640) {
        g.font = "9px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
        for (const x of asciiCols) {
          g.fillStyle = INK; g.fillRect(x * 9, 0, 9, H);
          g.fillStyle = PAPER;
          for (let y = 0; y < Math.ceil(H / 9); y++)
            g.fillText(Math.random() < 0.06 ? pick(CORRUPT) : pick(STREAK), x * 9 + 4.5, y * 9 + 4.5);
        }
      }
    }, () => { cv.remove(); unlock(); }, freezeAt);
  }

  const visibleTiles = () => [...reel.querySelectorAll(".tile:not([hidden])")].filter((t) => {
    const r = t.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.width > 0;
  });
  window.__glitch.tile = (i = 0, freezeAt) => burst(reel.querySelectorAll(".tile:not([hidden])")[i], freezeAt);

  // the wall never quite sits still: every few seconds one film on screen breaks
  (function ambient() {
    setTimeout(() => {
      if (!document.hidden) { const v = visibleTiles(); if (v.length) burst(v[ri(0, v.length - 1)]); }
      ambient();
    }, rnd(4500, 8000) * SLOW);
  })();

  if (fine) {
    reel.addEventListener("pointerover", (e) => {
      const tile = e.target.closest(".tile");
      if (tile && !tile.contains(e.relatedTarget)) burst(tile);
    });
  }
  reel.addEventListener("focusin", (e) => {
    const tile = e.target.closest(".tile");
    if (tile && e.target.matches(":focus-visible")) burst(tile);
  });
})();
