/* ── glitch: the page breaks for a moment, in characters, and settles ──
   JEAN's rules (jean/projects/0xr-glitch/2026-10-19-rules.md) and YE's colour
   ruling (ye/clients/rodrigo/2026-10-19-glitch-colour.md). Prototype scope:
   the hero ground and the film tiles. The page wipe is built last, if at all.

   Everything happens on a character grid in whole cells, stepped at 30fps.
   No fades, no transforms, no RGB split. Colour is sampled from the films at
   the moment of a burst, never stored, never boosted, and drains back to ink. */
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches ||
                (navigator.connection && navigator.connection.saveData);

  const DENSITY = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const STREAK  = "':;|!lI1";
  const TEAR    = "[]{}<>/\\";
  const CORRUPT = "!<>-_\\/[]{}=+*^?#%:;";
  const INK = "#0E0D0B", PAPER = "#FAF8F4", TONE = "138,135,129";

  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const weight = (ch) => Math.max(0, DENSITY.indexOf(ch));
  const streakFor = (head) =>
    STREAK[Math.min(STREAK.length - 1, Math.floor(weight(head) / DENSITY.length * STREAK.length))];

  /* one burst on screen at a time, across the whole page */
  let busy = false;
  const lock = (maxWait) => new Promise((res) => {
    const t0 = performance.now();
    (function poll() {
      if (!busy) { busy = true; return res(true); }
      if (performance.now() - t0 > maxWait) return res(false);
      setTimeout(poll, 60);
    })();
  });
  const unlock = () => { busy = false; };

  /* clusters of adjacent columns, covering a share of the width */
  function clusters(cols, share, nMin, nMax, wMin, wMax) {
    const out = new Set(), target = Math.round(cols * share);
    let n = ri(nMin, nMax), guard = 0;
    while (out.size < target && guard++ < 200) {
      const w = ri(wMin, wMax), x0 = ri(0, Math.max(0, cols - w));
      for (let x = x0; x < x0 + w && out.size < target; x++) out.add(x);
      if (--n <= 0 && out.size >= target * 0.6) break;
    }
    return [...out];
  }

  /* ── colour: OKLCH, sampled from a film ───────────────────────────────── */
  function toOklch(r, g, b) {
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const R = lin(r), G = lin(g), B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L, C: Math.hypot(A, Bb), h: (Math.atan2(Bb, A) * 180 / Math.PI + 360) % 360 };
  }
  const css = (c, lo, hi) =>
    `oklch(${Math.min(hi, Math.max(lo, c.L)).toFixed(3)} ${Math.min(0.2, c.C).toFixed(3)} ${c.h.toFixed(1)})`;

  /* the film's two most chromatic colours, or [] for a monochrome film.
     Read at the moment of the burst; nothing is cached across films. */
  function palette(source) {
    try {
      const c = document.createElement("canvas"); c.width = 48; c.height = 27;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(source, 0, 0, 48, 27);
      const d = g.getImageData(0, 0, 48, 27).data, px = [];
      for (let i = 0; i < d.length; i += 4) {
        const o = toOklch(d[i], d[i + 1], d[i + 2]);
        if (o.C >= 0.08) px.push(o);
      }
      if (px.length < 12) return [];
      // k-means, k = 3, on (a, b) with lightness, a few rounds is enough at this size
      const vec = (o) => [o.L, o.C * Math.cos(o.h * Math.PI / 180), o.C * Math.sin(o.h * Math.PI / 180)];
      let cent = [0, 1, 2].map((k) => vec(px[Math.floor((k + 0.5) * px.length / 3)]));
      for (let it = 0; it < 6; it++) {
        const sum = cent.map(() => [0, 0, 0, 0]);
        for (const o of px) {
          const v = vec(o);
          let best = 0, bd = 1e9;
          cent.forEach((c, k) => { const dd = (v[0]-c[0])**2 + (v[1]-c[1])**2 + (v[2]-c[2])**2; if (dd < bd) { bd = dd; best = k; } });
          const s = sum[best]; s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; s[3]++;
        }
        cent = sum.map((s, k) => s[3] ? [s[0]/s[3], s[1]/s[3], s[2]/s[3]] : cent[k]);
      }
      return cent.map(([L, a, b]) => ({ L, C: Math.hypot(a, b), h: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360 }))
                 .sort((x, y) => y.C - x.C).slice(0, 2);
    } catch (e) { return []; }
  }
  const nearest = (o, pal) => pal.reduce((b, p) =>
    Math.abs(((p.h - o.h + 540) % 360) - 180) < Math.abs(((b.h - o.h + 540) % 360) - 180) ? p : b, pal[0]);

  /* PROTOTYPE ONLY: ?glitch=slow plays bursts 12x slower to judge them frame by
     frame; window.__glitch fires one on demand. Both come out before shipping. */
  const SLOW = /glitch=slow/.test(location.search) ? 12 : 1;
  const FORCE_COLOUR = /glitch-colour/.test(location.search);
  const AUTO_TILE = /glitch-tile/.test(location.search);
  window.__glitch = {};

  /* a stepped 30fps loop that ends itself */
  function run(duration, frame, done) {
    const t0 = performance.now(); let skip = 0;
    (function tick(now) {
      if (++skip & 1) return requestAnimationFrame(tick);
      const t = (now - t0) / SLOW;
      if (t >= duration || document.hidden) { done(); return; }
      frame(t); requestAnimationFrame(tick);
    })(t0);
  }

  /* ── 1. the hero ground: the terrain the crew stand on ─────────────────── */
  function hero(holdStill) {
    const stage = document.getElementById("stage");
    if (!stage) return;
    const cv = document.createElement("canvas");
    cv.className = "ground"; cv.setAttribute("aria-hidden", "true");
    stage.after(cv);
    const g = cv.getContext("2d");
    const CH = 13, ROWS = 8;
    let W = 0, cols = 0, base = [], full = [];

    const noise = (x, y, t) => Math.sin(x * 0.05 + t) * Math.cos(y * 0.05 + t) +
                               Math.sin(x * 0.01 - t) * Math.cos(y * 0.12) * 0.5;
    const T = Math.random() * 100;                  // fixed at load: the ground does not drift

    function build() {
      W = cv.clientWidth;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = ROWS * CH * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CH);
      base = []; full = [];
      for (let y = 0; y < ROWS; y++) {
        base[y] = []; full[y] = [];
        for (let x = 0; x < cols; x++) {
          const n = noise(x, y, T);
          const ch = DENSITY[Math.floor(Math.abs(n) * DENSITY.length) % DENSITY.length];
          const ridge = 0.42 + Math.sin(x * 0.05) * 0.12 + Math.cos(x * 0.2) * 0.06;
          const nY = (ROWS - y) / ROWS;
          base[y][x] = nY < ridge + n * 0.18 + 0.25 ? ch : "";
          full[y][x] = ch === " " ? "." : ch;
        }
      }
      rest();
    }
    function rest() {
      g.clearRect(0, 0, W, ROWS * CH);
      g.font = CH + "px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = `rgba(${TONE},0.6)`;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < cols; x++)
        if (base[y][x]) g.fillText(base[y][x], x * CH + CH / 2, y * CH + CH / 2);
    }

    let count = 0, timer = 0, visible = false, nth = 0;

    async function burst() {
      if (!visible || document.hidden || count >= 6) return schedule();
      if (!(await lock(1200))) return schedule();
      count++; nth++;
      const brk = clusters(cols, rnd(0.12, 0.2), 3, 6, 1, 5).map((x) => {
        const s = ri(0, 3);
        const run = []; for (let y = s; y < ROWS; y++) run.push(full[y][x]);
        run.sort((a, b) => weight(a) - weight(b));        // light rises, heavy falls
        return { x, s, run, head: run[0], resolveAt: rnd(300, 480) };
      });
      const shift = Math.random() < 0.5 ? {
        w: ri(8, 24), h: ri(2, 3), off: ri(3, 9) * (Math.random() < 0.5 ? -1 : 1),
        x: ri(0, Math.max(0, cols - 24)), y: ri(0, ROWS - 3) } : null;

      // colour: one burst in three, sampled from reel tile n mod tiles
      let pal = [];
      if (nth % 3 === 0 || FORCE_COLOUR) {
        const tiles = [...document.querySelectorAll("#reel .tile:not([hidden])")];
        const t = tiles[FORCE_COLOUR ? 0 : (nth / 3 - 1) % Math.max(1, tiles.length)];
        const src = t && (t.querySelector("video.ready") || t.querySelector("img"));
        if (src) pal = palette(src);
      }
      const tint = new Map();                               // "x,y" -> {c, drainAt}
      if (pal.length) {
        const cells = [];
        for (const b of brk) for (let y = b.s; y < ROWS; y++)
          if (noise(b.x, y, T + 7.3) > 0.15) cells.push([b.x, y, b.resolveAt]);
        cells.sort(() => Math.random() - 0.5);
        const cap = Math.floor(brk.reduce((n, b) => n + ROWS - b.s, 0) * 0.35);
        cells.slice(0, cap).forEach(([x, y, r]) =>
          tint.set(x + "," + y, { c: css(pal[ri(0, pal.length - 1)], 0.45, 0.62), drainAt: rnd(300, r) }));
      }

      run(480, (t) => {
        rest();
        g.font = CH + "px monospace";
        for (const b of brk) {
          if (t >= b.resolveAt) continue;
          g.clearRect(b.x * CH, b.s * CH, CH, (ROWS - b.s) * CH);
          const len = t < 60 ? 0 : Math.round(easeOut(Math.min(1, (t - 60) / 240)) * (ROWS - b.s));
          for (let y = b.s; y < ROWS; y++) {
            const i = y - b.s;
            let ch = i < len ? streakFor(b.head) : b.run[i];
            if (Math.random() < 0.03) ch = pick(CORRUPT);
            const tt = tint.get(b.x + "," + y);
            g.fillStyle = tt && t < tt.drainAt ? tt.c : INK;
            g.fillText(ch, b.x * CH + CH / 2, y * CH + CH / 2);
          }
        }
        if (shift && t >= 120 && t < 360) {
          for (let y = shift.y; y < shift.y + shift.h; y++) {
            const dx = shift.x + shift.off;
            g.clearRect(dx * CH, y * CH, shift.w * CH, CH);
            for (let i = 0; i < shift.w; i++) {
              const edge = i === 0 || i === shift.w - 1;
              const ch = edge ? pick(TEAR) : (full[y][shift.x + i] || "");
              g.fillStyle = INK;
              if (ch) g.fillText(ch, (dx + i) * CH + CH / 2, y * CH + CH / 2);
            }
          }
        }
      }, () => { rest(); unlock(); schedule(); });
    }
    window.__glitch.hero = (colour) => { count = 0; visible = true; if (colour) nth = 2; burst(); };
    function schedule() { clearTimeout(timer); if (visible) timer = setTimeout(burst, rnd(11000, 17000)); }

    let first = true, rb = 0;
    addEventListener("resize", () => { clearTimeout(rb); rb = setTimeout(build, 150); });
    build();
    if (holdStill) return;                          // reduced motion: the rest frame, held
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.intersectionRatio >= 0.25;
      if (visible && !was) { count = 0; clearTimeout(timer); timer = setTimeout(burst, first ? 2600 : rnd(11000, 17000)); first = false; }
      if (!visible) { clearTimeout(timer); }
    }, { threshold: [0, 0.25] }).observe(cv);
  }

  /* ── 2. film tiles: hover breaks the poster into sorted columns ────────── */
  function tiles() {
    const reel = document.getElementById("reel");
    if (!reel) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cool = new WeakMap();

    async function burst(tile) {
      const now = performance.now();
      if ((cool.get(tile) || 0) > now) return;
      cool.set(tile, now + 4000);
      if (!(await lock(1200))) return;

      const a = tile.querySelector("a") || tile;
      const src = tile.querySelector("video.ready") || tile.querySelector("img");
      if (!src) { unlock(); return; }
      const W = a.clientWidth, H = a.clientHeight, CH = 8;
      const cols = Math.ceil(W / CH), rows = Math.ceil(H / CH);

      // the image as a grid: luminance picks the glyph, the pixel keeps its colour
      const off = document.createElement("canvas"); off.width = cols; off.height = rows;
      const og = off.getContext("2d", { willReadFrequently: true });
      try { og.drawImage(src, 0, 0, cols, rows); } catch (e) { unlock(); return; }
      const d = og.getImageData(0, 0, cols, rows).data;
      const cell = (x, y) => { const i = (y * cols + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
      const glyph = (rgb) => DENSITY[Math.min(DENSITY.length - 1,
        Math.floor((0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 256 * DENSITY.length))];

      const pal = palette(src);
      const cv = document.createElement("canvas");
      cv.className = "glitch"; cv.setAttribute("aria-hidden", "true");
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      a.appendChild(cv);
      tile.classList.add("lit");
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = CH + "px monospace"; g.textAlign = "center"; g.textBaseline = "middle";

      const brk = clusters(cols, rnd(0.2, 0.3), 3, 7, 2, 6).map((x) => {
        const s = ri(0, Math.floor(rows * 0.4));
        const run = []; for (let y = s; y < rows; y++) run.push({ ch: glyph(cell(x, y)), rgb: cell(x, y) });
        run.sort((p, q) => weight(p.ch) - weight(q.ch));
        return { x, s, run, head: run[0], resolveAt: rnd(450, 620) };
      });
      const blocks = Array.from({ length: ri(1, 2) }, () => {
        const w = Math.round(cols * rnd(0.15, 0.35)), h = Math.max(1, Math.round(rows * rnd(0.06, 0.14)));
        return { w, h, x: ri(0, cols - w), y: ri(0, rows - h), off: ri(4, 10) * (Math.random() < 0.5 ? -1 : 1) };
      });

      // colour: at most 40% of breaking cells, each snapped to the film's nearer palette colour
      const tint = new Map();
      if (pal.length) {
        const cells = [];
        for (const b of brk) for (let y = b.s; y < rows; y++) cells.push([b.x, y]);
        cells.sort(() => Math.random() - 0.5);
        cells.slice(0, Math.floor(cells.length * 0.4)).forEach(([x, y]) => {
          const rgb = cell(x, y), o = toOklch(rgb[0], rgb[1], rgb[2]);
          if (o.C < 0.04) return;
          tint.set(x + "," + y, { c: css(nearest(o, pal), 0.68, 0.85), drainAt: rnd(340, 450) });
        });
      }

      run(620, (t) => {
        g.clearRect(0, 0, W, H);
        for (const b of brk) {
          if (t >= b.resolveAt) continue;
          g.fillStyle = INK; g.fillRect(b.x * CH, 0, CH, H);   // the column becomes an ink strip
          const len = t < 50 ? 0 : Math.round(easeOut(Math.min(1, (t - 50) / 290)) * (rows - b.s));
          for (let y = 0; y < rows; y++) {
            let ch, key = b.x + "," + y, tt;
            if (y < b.s) { ch = glyph(cell(b.x, y)); }
            else {
              const i = y - b.s;
              if (i < len) { ch = streakFor(b.head.ch); key = b.x + "," + b.s; }   // the head's colour runs down
              else ch = b.run[i].ch;
              tt = tint.get(key);
            }
            if (Math.random() < 0.03) ch = pick(CORRUPT);
            g.fillStyle = tt && t < tt.drainAt ? tt.c : PAPER;
            g.fillText(ch, b.x * CH + CH / 2, y * CH + CH / 2);
          }
        }
        if (t < 400) for (const k of blocks) {
          const dx = k.x + k.off;
          g.fillStyle = INK; g.fillRect(dx * CH, k.y * CH, k.w * CH, k.h * CH);
          for (let y = k.y; y < k.y + k.h; y++) for (let i = 0; i < k.w; i++) {
            const sx = k.x + i; if (sx < 0 || sx >= cols || y >= rows) continue;
            const edge = i === 0 || i === k.w - 1;
            g.fillStyle = PAPER;
            g.fillText(edge ? pick(TEAR) : glyph(cell(sx, y)), (dx + i) * CH + CH / 2, y * CH + CH / 2);
          }
        }
      }, () => {
        cv.remove();
        if (!tile.matches(":hover") && !tile.contains(document.activeElement)) tile.classList.remove("lit");
        unlock();
      });
    }

    window.__glitch.tile = (i = 0) => burst(reel.querySelectorAll(".tile:not([hidden])")[i]);
    if (AUTO_TILE) setTimeout(() => {
      const t = reel.querySelectorAll(".tile:not([hidden])")[1];
      if (t) { t.scrollIntoView({ block: "center" }); setTimeout(() => burst(t), 300); }
    }, 1500);
    if (fine) {
      reel.addEventListener("pointerover", (e) => {
        const tile = e.target.closest(".tile");
        if (tile && !tile.contains(e.relatedTarget)) burst(tile);
      });
      reel.addEventListener("pointerout", (e) => {
        const tile = e.target.closest(".tile");
        if (tile && !tile.contains(e.relatedTarget) && !tile.querySelector("canvas.glitch")) tile.classList.remove("lit");
      });
    } else {
      // touch: the poster-to-video handoff breaks once per tile, one tile at a time
      const done = new WeakSet(); let queue = Promise.resolve();
      reel.addEventListener("playing", (e) => {
        const tile = e.target.closest && e.target.closest(".tile");
        if (!tile || done.has(tile)) return;
        done.add(tile);
        queue = queue.then(() => burst(tile)).then(() => new Promise((r) => setTimeout(r, 1200)));
      }, true);
    }
    reel.addEventListener("focusin", (e) => {
      const tile = e.target.closest(".tile");
      if (tile && e.target.matches(":focus-visible")) burst(tile);
    });
  }

  const start = () => { hero(still); if (!still) tiles(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
