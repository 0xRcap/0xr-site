/* ── glitch: one organism that lives in the page ──
   0xR's glitchcore (2026-10-19, four rounds with Rodrigo; rules in
   jean/projects/0xr-glitch/, colour in ye/clients/rodrigo/2026-10-19-glitch-colour.md).

   One creature, on every page. It travels from picture to picture (films,
   crew figures, the THESEUS card, case-study and press images, the footer)
   and across the empty paper, which it tears; its next stop is weighted
   toward its last, so it can be watched moving. Where it lands it pulses
   and rests. A picture breaks in its own pixels: sorted by brightness,
   smeared down, blocks torn sideways, with a few strips of ASCII as the 0xR
   mark. Labels it passes run their own scramble. It comes to a resting
   cursor; a fast scroll tears the page.

   The longer nobody touches the page, the more it takes: from 8 s still it
   escalates, and by about 55 s the screen is smeared film pixels except the
   title. Any touch heals it, column by column.

   Rules: type never glitches (the title is cut out of the takeover by its
   own line boxes), nothing moves at rest, no RGB split, scanlines or CSS
   transforms. Colour is only ever the films' own, never boosted; pages
   without films feed on posters from the wall. Reduced motion and Save-Data
   switch it off; hidden tabs pause it; phones get a lighter takeover. */
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches ||
                (navigator.connection && navigator.connection.saveData);
  if (still) return;

  /* the strips read like an Ethereum address running down a column: 0x, then
     hex, scrolling, a character flipping now and then as it corrupts */
  const HEX = "0123456789abcdef";
  const DENSITY = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const INK = "#0E0D0B", PAPER = "#FAF8F4";
  const PX = 4;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function hexAt(col, row, t) {
    const n = ((row + Math.floor(t / 90)) % 42 + 42) % 42;
    if (n === 0) return "0";
    if (n === 1) return "x";
    const h = (Math.imul(col + 101, 2654435761) ^ Math.imul(n + 7, 40503)) >>> 0;
    return HEX[(h + (Math.random() < 0.06 ? ri(1, 15) : 0)) & 15];
  }
  const LITE_EARLY = matchMedia("(hover: none)").matches ||
                     (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                     (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  /* ── marble: the liquid shapes of the reference, in the films' own colours ──
     A domain-warped noise field (noise fed back into its own coordinates) makes
     the swirl; banding it into a film's palette makes the flat marbled fields.
     Blooms are organic outlines filled with that marble, chunky at the rim,
     with sorted streaks dripping out of their lower edge. */
  const PERM = new Uint8Array(512);
  { const p = [...Array(256).keys()].sort(() => Math.random() - 0.5); for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; }
  const smooth = (t) => t * t * (3 - 2 * t);
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
    const h = (a, b) => PERM[(PERM[a & 255] + (b & 255)) & 511] / 255;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y) => vnoise(x, y) * 0.5 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.2;
  const soft = (x, y) => vnoise(x, y) * 0.7 + vnoise(x * 1.9, y * 1.9) * 0.3;   // two octaves: smooth, no grain
  function marble(x, y) {
    const qx = soft(x, y), qy = soft(x + 5.2, y + 1.3);
    const rx = soft(x + 2.6 * qx + 1.7, y + 2.6 * qy + 9.2), ry = soft(x + 2.6 * qx + 8.3, y + 2.6 * qy + 2.8);
    return soft(x + 2.2 * rx, y + 2.2 * ry);
  }

  /* a film's palette: its six main colours, most vivid first, never boosted */
  const palettes = new WeakMap();
  function paletteOf(src) {
    if (palettes.has(src)) return palettes.get(src);
    let out = [];
    try {
      const c = document.createElement("canvas"); c.width = 24; c.height = 14;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(src, 0, 0, 24, 14);
      const d = g.getImageData(0, 0, 24, 14).data, px = [];
      for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
      let cent = Array.from({ length: 6 }, (_, k) => px[Math.floor((k + 0.5) * px.length / 6)].slice());
      for (let it = 0; it < 6; it++) {
        const sum = cent.map(() => [0, 0, 0, 0]);
        for (const p of px) {
          let b = 0, bd = 1e9;
          cent.forEach((q, k) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < bd) { bd = dd; b = k; } });
          const t = sum[b]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++;
        }
        cent = sum.map((t, k) => (t[3] ? [t[0] / t[3], t[1] / t[3], t[2] / t[3]] : cent[k]));
      }
      const chroma = (q) => Math.max(...q) - Math.min(...q);
      out = cent.map((q) => q.map(Math.round)).sort((a, b) => chroma(b) - chroma(a)).slice(0, 4);
    } catch (e) { out = []; }
    palettes.set(src, out);
    return out;
  }

  /* ── the glitch set: 0xR's own colours, near the reference, never at rest ──
     His call, 2026-10-20: "i love the paradigm green, orange". A fixed set,
     tuned a step off Paradigm's, that appears only inside bursts and the
     takeover. Paired in scenes the way the reference pairs them. */
  const GC = { mint: [92, 211, 146], vermilion: [250, 86, 52], orange: [244, 146, 64], magenta: [226, 108, 198],
               lavender: [170, 156, 232], gold: [210, 160, 86], cream: [244, 235, 216], paper: [250, 248, 244],
               ink: [14, 13, 11], grey: [164, 164, 156] };
  const SCENES = [
    [GC.orange, GC.mint, GC.cream],
    [GC.mint, GC.magenta, GC.paper],
    [GC.vermilion, GC.gold, GC.magenta, GC.cream],
    [GC.mint, GC.grey, GC.paper, GC.lavender],
    [GC.orange, GC.vermilion, GC.cream, GC.ink],
    [GC.lavender, GC.mint, GC.orange, GC.paper],
  ];
  const scene = () => SCENES[ri(0, SCENES.length - 1)];

  /* a polygon test at cell resolution: shards come out stair-stepped, like the reference */
  function inPoly(x, y, P) {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++)
      if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
    return c;
  }
  function shardPoly(nw, nh) {
    const k = ri(3, 5), cx = nw / 2, cy = nh / 2, P = [];
    const a0 = Math.random() * Math.PI * 2;
    for (let i = 0; i < k; i++) {
      const a = a0 + (i / k) * Math.PI * 2 + rnd(-0.5, 0.5);
      P.push([cx + Math.cos(a) * nw * rnd(0.3, 0.52), cy + Math.sin(a) * nh * rnd(0.3, 0.52)]);
    }
    return P;
  }

  /* a patch: one of the reference's shapes, computed once, revealed like a glitch */
  function makePatch(x0, y0, W, H, kind, pal, filmPal) {
    const CELL = W * H > 300000 ? (LITE_EARLY ? 8 : 6) : (LITE_EARLY ? 6 : 4);
    const nw = Math.max(2, Math.ceil(W / CELL)), nh = Math.max(2, Math.ceil(H / CELL));
    const cols = pal.concat(filmPal || []);
    const idx = new Int16Array(nw * nh).fill(-1);
    const ox = Math.random() * 100, oy = Math.random() * 100;
    const k4 = CELL / 4;
    if (kind === "ribbon") {
      // flowing bands, stretched along one axis: brushstrokes, not islands
      const horiz = Math.random() < 0.6;
      // wide and smooth: low frequency, a gentle stretch, few bands
      const s0 = rnd(0.005, 0.010) * k4, sa = horiz ? s0 : s0 * rnd(1.4, 2.1), sb = horiz ? s0 * rnd(1.4, 2.1) : s0;
      const bands = rnd(0.8, 1.4), thr = rnd(0.28, 0.38);
      for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) {
        const edge = Math.min(i, nw - 1 - i, j, nh - 1 - j) / Math.min(nw, nh);
        const m = soft(i * 0.03 * k4 + ox + 40, j * 0.03 * k4 + oy) * smooth(Math.min(1, edge * 5));
        if (m < thr) continue;
        const v = marble(i * sa + ox, j * sb + oy);
        idx[j * nw + i] = Math.min(pal.length - 1, Math.floor(((((v - 0.2) * bands * 2.2) % 1) + 1) % 1 * pal.length));
      }
    } else if (kind === "shard") {
      // angular datamosh chunks: flat or striped, sometimes doubled with an offset
      const P = shardPoly(nw, nh), striped = Math.random() < 0.5, sw = ri(1, 4);
      const flat = ri(0, pal.length - 1), dup = Math.random() < 0.5 ? ri(3, Math.max(4, Math.round(nw * 0.25))) : 0;
      for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) {
        const hit = inPoly(i + 0.5, j + 0.5, P) || (dup && inPoly(i + 0.5 - dup, j + 0.5 + dup * 0.3, P));
        if (!hit) continue;
        idx[j * nw + i] = striped ? Math.floor(i / sw) % pal.length : flat;
      }
    } else if (kind === "steps") {
      // a staircase mass: an angular V or wedge built from stepped bars
      const down = Math.random() < 0.6, g = ri(2, 5), c0 = ri(0, pal.length - 1), c1 = (c0 + 1) % pal.length;
      const lean = rnd(-0.25, 0.25), inner = Math.random() < 0.45;
      for (let j = 0; j < nh; j++) {
        const step = Math.floor(j / g) * g / nh, f = down ? 1 - step : step;
        const hw = Math.round((nw / 2) * (0.12 + 0.88 * f) * rnd(0.92, 1));
        const mid = Math.round(nw / 2 + lean * (j - nh / 2));
        for (let i = Math.max(0, mid - hw); i < Math.min(nw, mid + hw); i++)
          idx[j * nw + i] = inner && Math.abs(i - mid) < hw * 0.45 ? c1 : c0;
      }
    } else if (kind === "barcode") {
      // dense thin stripes over a colour field: the pixel-sorted curtain over green
      const base = ri(0, pal.length - 1), stripes = [GC.ink, GC.grey, GC.paper, ...pal].map((q) => cols.push(q) - 1);
      const top0 = Math.floor(nh * rnd(0, 0.3));
      for (let i = 0; i < nw; i++) {
        const top = top0 + ri(0, Math.floor(nh * 0.15));
        for (let j = top; j < nh; j++) idx[j * nw + i] = base;
        if (Math.random() < 0.55) {
          const c = pick(stripes), a = ri(top, nh - 1), b = ri(a, nh);
          for (let j = a; j < b; j++) idx[j * nw + i] = c;
        }
      }
    } else if (kind === "moss") {
      // chunky clusters of square blocks with ragged edges
      const B = ri(2, 4), thr = rnd(0.5, 0.6), c0 = ri(0, pal.length - 1), c1 = (c0 + ri(1, pal.length - 1)) % pal.length;
      for (let bj = 0; bj < Math.ceil(nh / B); bj++) for (let bi = 0; bi < Math.ceil(nw / B); bi++) {
        const edge = Math.min(bi * B, nw - bi * B, bj * B, nh - bj * B) / Math.min(nw, nh);
        const v = soft(bi * 0.22 + ox, bj * 0.22 + oy) * smooth(Math.min(1, edge * 4)) + rnd(-0.06, 0.06);
        if (v < thr) continue;
        const c = v > thr + 0.12 ? c1 : c0;
        for (let j = bj * B; j < Math.min(nh, bj * B + B); j++) for (let i = bi * B; i < Math.min(nw, bi * B + B); i++) idx[j * nw + i] = c;
      }
    } else if (kind === "streaks") {
      // a field of thin columns, each a smooth sorted gradient between two colours
      const pair = () => { const a = pick(cols), b = pick(cols); return [a, b]; };
      for (let i = 0; i < nw; i++) {
        if (Math.random() < 0.18) continue;
        const [a, b] = pair(), top = ri(0, Math.floor(nh * 0.4)), steps = 8, base = cols.length;
        for (let k = 0; k < steps; k++) { const f = k / (steps - 1); cols.push([0, 1, 2].map((c) => Math.round(a[c] + (b[c] - a[c]) * f))); }
        for (let j = top; j < nh; j++) idx[j * nw + i] = base + Math.min(steps - 1, Math.floor((j - top) / (nh - top) * steps));
      }
    } else if (kind === "bars") {
      // horizontal strips, displaced sideways: the datamosh rows
      let j = 0;
      while (j < nh) {
        const h = ri(1, 4), c = ri(0, pal.length - 1), a = ri(0, Math.floor(nw * 0.5)), w = ri(Math.floor(nw * 0.2), nw - a);
        if (Math.random() < 0.75) for (let y = j; y < Math.min(nh, j + h); y++) for (let i = a; i < a + w; i++) idx[y * nw + i] = c;
        j += h + (Math.random() < 0.4 ? ri(1, 3) : 0);
      }
    } else {
      // a curtain: vertical sorted stripes, from the set and from a film
      let run = 0, c = 0, top = 0, split = 0;
      for (let i = 0; i < nw; i++) {
        if (run-- <= 0) {
          run = ri(0, 3);
          c = Math.random() < 0.25 ? -1 : ri(0, cols.length - 1);
          top = ri(0, Math.floor(nh * 0.35)); split = ri(top, nh);
        }
        if (c < 0) continue;
        const c2 = (c + 1) % cols.length;
        for (let j = top; j < nh; j++) idx[j * nw + i] = j < split ? c : c2;
      }
    }
    const delay = new Float32Array(nw).map(() => rnd(0, 0.45));
    const sweep = /^(shard|steps|moss|bars)$/.test(kind) ? new Float32Array(nw).map(() => rnd(0, 0.6)) : null;
    const im = new ImageData(nw, nh), D = im.data;
    const tile = document.createElement("canvas"); tile.width = nw; tile.height = nh;
    const tg = tile.getContext("2d");
    const paint = (g, prog) => {
      D.fill(0);
      for (let i = 0; i < nw; i++) {
        // curtains and ribbons drip in from the top; shards flicker in across
        const vis = sweep ? (prog > sweep[i] ? nh : 0) : Math.floor(Math.max(0, (prog - delay[i]) / 0.55) * nh);
        for (let j = 0; j < Math.min(nh, vis); j++) {
          const k = idx[j * nw + i]; if (k < 0) continue;
          const q = cols[k], o = (j * nw + i) * 4;
          D[o] = q[0]; D[o + 1] = q[1]; D[o + 2] = q[2]; D[o + 3] = 255;
        }
      }
      tg.putImageData(im, 0, 0);
      g.imageSmoothingEnabled = false;
      g.drawImage(tile, x0, y0, nw * CELL, nh * CELL);
    };
    paint.bounds = { x: x0, y: y0, w: nw * CELL, h: nh * CELL };
    return paint;
  }
  const pickKind = (w) => {
    let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
    for (const k in w) if ((r -= w[k]) <= 0) return k;
    return "ribbon";
  };

  function clusters(cols, share, wMin, wMax) {
    const out = new Set(), target = Math.round(cols * share);
    let guard = 0;
    while (out.size < target && guard++ < 400) {
      const w = ri(wMin, wMax), x0 = ri(0, Math.max(0, cols - w));
      for (let x = x0; x < x0 + w && out.size < target; x++) out.add(x);
    }
    return [...out];
  }

  function run(duration, frame, done) {
    return new Promise((resolve) => {
      const t0 = performance.now(); let skip = 0;
      (function tick(now) {
        if (++skip & 1) return requestAnimationFrame(tick);   // stepped, 30fps
        const t = now - t0;
        if (t >= duration || document.hidden) { done(); resolve(); return; }
        frame(t); requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* anything picture-like that can be read right now, or null */
  function readable(el) {
    if (!el) return null;
    if (el.tagName === "VIDEO") return el.readyState >= 2 && el.videoWidth ? el : null;
    if (el.tagName === "IMG") return el.complete && el.naturalWidth ? el : null;
    if (el.tagName === "CANVAS") return el.width && el.height ? el : null;
    return null;
  }
  const filmSource = (tile) =>
    readable(tile.querySelector("video")) || readable(tile.querySelector("img"));
  /* every other picture on any page: case studies, press, writing covers */
  const MEDIA = "main img, main video";
  const isLoose = (el) => !el.closest("#reel, .film-card, nav, header.hero .stage") &&
                          el.getBoundingClientRect().width >= 80;

  /* ── the break: a picture's own pixels, sorted, smeared and torn ────────── */
  function makeBreak(src, W, H, opts = {}) {
    const cols = Math.max(1, Math.ceil(W / PX)), rows = Math.max(1, Math.ceil(H / PX));
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const cg = c.getContext("2d", { willReadFrequently: true });
    let B;
    try { cg.drawImage(src, 0, 0, cols, rows); B = cg.getImageData(0, 0, cols, rows).data; }
    catch (e) { return null; }                                   // a picture from another site cannot be read
    const share = opts.share || [0.35, 0.55];
    const sorted = clusters(cols, rnd(share[0], share[1]), 3, 14).map((x) => {
      const s = ri(0, Math.floor(rows * 0.3)), run = [];
      for (let y = s; y < rows; y++) { const i = (y * cols + x) * 4; run.push([B[i], B[i + 1], B[i + 2], B[i + 3], lum(B, i)]); }
      const up = Math.random() < 0.5;
      run.sort((p, q) => (up ? p[4] - q[4] : q[4] - p[4]));
      return { x, s, run, at: rnd(180, 300), resolveAt: rnd(0.66, 0.98) * opts.duration };
    });
    const blocks = Array.from({ length: ri(opts.blocks ? opts.blocks[0] : 2, opts.blocks ? opts.blocks[1] : 4) }, () => {
      const w = Math.round(cols * rnd(0.2, 0.5)), h = Math.max(2, Math.round(rows * rnd(0.05, 0.16)));
      return { w, h, x: ri(0, Math.max(0, cols - w)), y: ri(0, Math.max(0, rows - h)),
               off: Math.round(cols * rnd(0.05, 0.2)) * (Math.random() < 0.5 ? -1 : 1),
               from: rnd(60, 220), to: rnd(0.45, 0.78) * opts.duration };
    });
    const asciiCols = opts.ascii === false ? [] : clusters(Math.ceil(W / 9), rnd(0.03, 0.07), 1, 3);
    // a shard of the glitch set torn into the frame, on most breaks
    const shard = [];
    if (opts.shard !== false && Math.random() < 0.7) {
      const sw = Math.round(cols * rnd(0.2, 0.45)), sh = Math.round(rows * rnd(0.25, 0.6));
      const sx = ri(0, Math.max(0, cols - sw)), sy = ri(0, Math.max(0, rows - sh)), P = shardPoly(sw, sh);
      const pal = scene(), striped = Math.random() < 0.5;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++)
        if (inPoly(x + 0.5, y + 0.5, P)) shard.push([(sy + y) * cols + sx + x, pal[striped ? Math.floor(x / 2) % pal.length : 0]]);
      shard.from = rnd(120, 260); shard.to = rnd(0.5, 0.8) * opts.duration;
    }
    const out = document.createElement("canvas"); out.width = cols; out.height = rows;
    const og = out.getContext("2d");
    const img = og.createImageData(cols, rows), F = img.data;

    const wo = Math.random() * 50, LIQ = 300;
    return (g, x0, y0, t) => {
      if (t < LIQ) {                                             // the liquid moment
        const amp = Math.sin(Math.PI * t / LIQ) * cols * 0.09;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const sx = Math.min(cols - 1, Math.max(0, Math.round(x + (fbm(x * 0.07 + wo, y * 0.07) - 0.5) * amp * 2)));
          const sy = Math.min(rows - 1, Math.max(0, Math.round(y + (fbm(x * 0.07, y * 0.07 + wo) - 0.5) * amp * 2)));
          const si = (sy * cols + sx) * 4, di = (y * cols + x) * 4;
          F[di] = B[si]; F[di + 1] = B[si + 1]; F[di + 2] = B[si + 2]; F[di + 3] = B[si + 3];
        }
      } else F.set(B);
      for (const k of sorted) {
        if (t < k.at || t >= k.resolveAt) continue;
        const len = Math.round(easeOut(Math.min(1, (t - k.at) / 360)) * (rows - k.s));
        const head = k.run[0];
        for (let y = k.s; y < rows; y++) {
          const j = y - k.s, i = (y * cols + k.x) * 4, p = j < len * 0.6 ? head : k.run[j];
          F[i] = p[0]; F[i + 1] = p[1]; F[i + 2] = p[2]; F[i + 3] = p[3];
        }
      }
      for (const b of blocks) {
        if (t < b.from || t >= b.to) continue;
        for (let y = b.y; y < b.y + b.h; y++) for (let x = 0; x < b.w; x++) {
          const sx = b.x + x, dx = sx + b.off;
          if (dx < 0 || dx >= cols) continue;
          const si = (y * cols + sx) * 4, di = (y * cols + dx) * 4;
          F[di] = F[si]; F[di + 1] = F[si + 1]; F[di + 2] = F[si + 2]; F[di + 3] = F[si + 3];
        }
      }
      if (shard.length && t >= shard.from && t < shard.to)
        for (const [k, q] of shard) { const o = k * 4; F[o] = q[0]; F[o + 1] = q[1]; F[o + 2] = q[2]; F[o + 3] = 255; }
      og.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false;
      g.drawImage(out, x0, y0, W, H);
      if (t > 80 && t < opts.duration * 0.7) {
        g.font = "9px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
        for (const x of asciiCols) {
          g.fillStyle = INK; g.fillRect(x0 + x * 9, y0, 9, H);
          g.fillStyle = PAPER;
          for (let y = 0; y < Math.ceil(H / 9); y++)
            g.fillText(hexAt(x, y, t), x0 + x * 9 + 4.5, y0 + y * 9 + 4.5);
        }
      }
    };
  }

  /* ── where things are drawn ─────────────────────────────────────────────
     Films draw inside their own tile, under the caption. Everything else
     draws on one fixed layer over the page that never takes a click. */
  const layer = document.createElement("canvas");
  layer.className = "organism"; layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  const lg = layer.getContext("2d");
  let LW = 0, LH = 0;
  function sizeLayer() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (innerWidth === LW && innerHeight === LH && layer.width === Math.round(LW * dpr)) return;  // a same-size resize would wipe a burst
    LW = innerWidth; LH = innerHeight;
    layer.width = LW * dpr; layer.height = LH * dpr;
    lg.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeLayer(); addEventListener("resize", sizeLayer);
  let layerUsers = 0;
  const clearLayer = () => { if (layerUsers === 0) lg.clearRect(0, 0, LW, LH); };

  /* one visit on one element: a film, a figure, the card, the footer */
  async function breakElement(el, kind, duration) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return;
    const src = kind === "film" ? filmSource(el) : readable(el);
    if (!src) return;

    if (kind === "film") {
      const a = el.querySelector("a") || el;
      const W = a.clientWidth, H = a.clientHeight;
      const draw = makeBreak(src, W, H, { duration });
      if (!draw) return;
      const cv = document.createElement("canvas");
      cv.className = "glitch"; cv.setAttribute("aria-hidden", "true");
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      a.appendChild(cv);
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      await run(duration, (t) => { g.clearRect(0, 0, W, H); draw(g, 0, 0, t); }, () => cv.remove());
      return;
    }

    // figures and the footer get a lighter break: they are smaller or quieter things
    const opts = kind === "figure" ? { duration, share: [0.4, 0.7], blocks: [1, 2], ascii: false, shard: false }
               : kind === "footer" ? { duration, share: [0.2, 0.35], blocks: [2, 3] }
               : { duration };
    const draw = makeBreak(src, r.width, r.height, opts);
    if (!draw) return;
    layerUsers++;
    if (kind === "figure") el.style.visibility = "hidden";   // the figure melts, not a copy beside it
    const paint = (t) => {
      const q = el.getBoundingClientRect();
      lg.clearRect(q.left - 2, q.top - 2, q.width + 4, q.height + 4);
      draw(lg, q.left, q.top, t);
    };
    await run(duration, paint, () => {
      const q = el.getBoundingClientRect();
      lg.clearRect(q.left - 2, q.top - 2, q.width + 4, q.height + 4);
      if (kind === "figure") el.style.visibility = "";
      layerUsers--; clearLayer();
    });
  }

  /* ── tears: the organism crossing the empty paper between sections ────── */
  const OCCUPIED = "h1,h2,h3,p,li,figcaption,button,nav,.label,img,video,canvas:not(.organism),.tile,.film-card,a";
  /* free spots: a horizontal run of empty paper at least minW wide and h tall,
     avoiding every text box, picture and control on screen */
  function freeSpots(h, minW) {
    const rects = [];
    for (const el of document.querySelectorAll(OCCUPIED)) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.bottom > 0 && r.top < innerHeight)
        rects.push([r.left - 10, r.top - 10, r.right + 10, r.bottom + 10]);
    }
    const spots = [];
    for (let y = 72; y + h < innerHeight; y += 10) {
      const xs = rects.filter((r) => r[1] < y + h && r[3] > y).map((r) => [r[0], r[2]]).sort((a, b) => a[0] - b[0]);
      let x = 0;
      for (const [a, b] of xs) { if (a - x >= minW) spots.push({ y, x0: x, x1: a }); x = Math.max(x, b); }
      if (LW - x >= minW) spots.push({ y, x0: x, x1: LW });
    }
    return spots;
  }
  function filmColours() {
    const all = sources();
    const src = all.length ? pick(all) : null;
    if (!src) return [];
    const c = document.createElement("canvas"); c.width = 32; c.height = 4;
    const g = c.getContext("2d", { willReadFrequently: true });
    let d; const out = [];
    try { g.drawImage(src, 0, 0, 32, 4); d = g.getImageData(0, 0, 32, 4).data; } catch (e) { return []; }
    for (let i = 0; i < d.length; i += 4) out.push(`rgb(${d[i]},${d[i + 1]},${d[i + 2]})`);
    return out;
  }
  async function tear(nearY, duration, nearX = LW / 2) {
    const h = ri(30, 96), spots = freeSpots(h, 160);
    if (!spots.length) return false;
    spots.sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - nearX, a.y - nearY) - Math.hypot((b.x0 + b.x1) / 2 - nearX, b.y - nearY));
    const sp = spots[ri(0, Math.min(3, spots.length - 1))];
    const y = sp.y, c0 = Math.ceil(sp.x0 / 9), c1 = Math.floor(sp.x1 / 9);
    const cols = Math.max(1, c1 - c0), rows = Math.ceil(h / 9);
    // ragged, not barred: thin columns, each dripping from its own height
    const hot = clusters(cols, rnd(0.14, 0.32), 1, 4).map((x) => x + c0);
    const drip = new Map(hot.map((x) => { const top = ri(0, Math.max(0, rows - 2)); return [x, [top, ri(top + 1, rows)]]; }));
    const colours0 = Math.random() < 0.7 ? scene().map((q) => `rgb(${q[0]},${q[1]},${q[2]})`) : filmColours();
    const tint = new Map(colours0.length ? hot.filter(() => Math.random() < 0.45).map((x) => [x, pick(colours0)]) : []);
    const colours = colours0;
    const spanW = sp.x1 - sp.x0;
    const slivers = Array.from({ length: ri(2, 5) }, () => ({ x: sp.x0 + ri(0, Math.max(0, spanW - 120)), w: ri(60, Math.min(420, spanW)), y: y + ri(0, h - 6), h: ri(4, 14),
                                                         from: rnd(0, 120), to: rnd(0.4, 0.8) * duration }));
    const shift = { from: rnd(60, 160), to: rnd(0.4, 0.7) * duration, off: ri(2, 8) * (Math.random() < 0.5 ? -1 : 1) };
    const resolve = new Map(hot.map((x) => [x, rnd(0.55, 0.98) * duration]));
    const paint = (t) => {
      lg.clearRect(sp.x0, y - 1, spanW, h + 2);
      lg.font = "9px monospace"; lg.textAlign = "center"; lg.textBaseline = "middle";
      for (const x of hot) {
        if (t >= resolve.get(x)) continue;
        let dx = t >= shift.from && t < shift.to ? x + shift.off : x;
        if (dx < c0 || dx >= c1) dx = x;
        const [r0, r1] = drip.get(x);
        const grow = Math.min(r1, r0 + 1 + Math.round(easeOut(Math.min(1, t / 260)) * (r1 - r0)));
        const fill = tint.get(x);
        lg.fillStyle = fill || INK; lg.fillRect(dx * 9, y + r0 * 9, 9, (grow - r0) * 9);
        lg.fillStyle = fill ? INK : PAPER;
        for (let r = r0; r < grow; r++)
          lg.fillText(hexAt(x, r, t), dx * 9 + 4.5, y + r * 9 + 4.5);
      }
      if (colours.length) for (const s of slivers) {
        if (t < s.from || t >= s.to) continue;
        const step = 4;
        for (let i = 0; i < s.w; i += step) { lg.fillStyle = colours[Math.floor(i / s.w * colours.length)]; lg.fillRect(s.x + i, s.y, step, s.h); }
      }
    };
    layerUsers++;
    await run(duration, paint, () => { lg.clearRect(sp.x0, y - 1, spanW, h + 2); layerUsers--; clearLayer(); });
    return true;
  }

  /* a blot: a small marbled bloom on the empty paper, grown, held, cut away */
  async function blot(nearY, duration, nearX = LW / 2) {
    const R = ri(30, LITE_EARLY ? 70 : 110), spots = freeSpots(Math.round(R * 2), Math.round(R * 2.6));
    if (!spots.length) return tear(nearY, duration, nearX);
    spots.sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - nearX, a.y - nearY) - Math.hypot((b.x0 + b.x1) / 2 - nearX, b.y - nearY));
    const sp = spots[ri(0, Math.min(3, spots.length - 1))];
    const srcs = sources(); if (!srcs.length) return tear(nearY, duration, nearX);
    const W = Math.min(sp.x1 - sp.x0 - 8, R * rnd(2.2, 4.2)), H = R * 2;
    const x = ri(Math.round(sp.x0 + 4), Math.round(Math.max(sp.x0 + 4, sp.x1 - W - 4)));
    const paint = makePatch(x, sp.y, W, H, pickKind({ ribbon: 0.6, shard: 1, curtain: 0.5, steps: 0.8, barcode: 0.6, moss: 1, bars: 0.6, streaks: 0.5 }), scene(), paletteOf(pick(srcs))), b = paint.bounds;
    const cuts = []; for (let x = b.x; x < b.x + b.w; x += 8) cuts.push(x);
    cuts.sort(() => Math.random() - 0.5);
    const grownAt = duration * 0.45, cutFrom = duration * 0.7;
    layerUsers++;
    await run(duration, (t) => {
      lg.clearRect(b.x, b.y, b.w, b.h);
      paint(lg, easeOut(Math.min(1, t / grownAt)));
      if (t > cutFrom) {                                         // dissolves in vertical cuts, never a fade
        const k = Math.floor((t - cutFrom) / (duration - cutFrom) * cuts.length);
        for (let i = 0; i < k; i++) lg.clearRect(cuts[i], b.y, 8, b.h);
      }
    }, () => { lg.clearRect(b.x, b.y, b.w, b.h); layerUsers--; clearLayer(); });
    return true;
  }

  /* labels near where the organism is ask to decode: their own effect */
  function touchLabels(cx, cy) {
    for (const el of document.querySelectorAll("[data-scramble]")) {
      if (el === glassFor || el.contains(glassFor)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (d < 260 && Math.random() < 0.6) el.dispatchEvent(new Event("0xr:scramble"));
    }
  }

  /* ── the organism ───────────────────────────────────────────────────────── */
  const WEIGHT = { film: 3, figure: 2, card: 1.6, footer: 1.4, tear: 1.6 };
  function candidates() {
    const list = [];
    const add = (el, kind) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return;
      if (kind === "film" ? !filmSource(el) : !readable(el)) return;
      list.push({ el, kind, x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };
    document.querySelectorAll("#reel .tile:not([hidden])").forEach((t) => add(t, "film"));
    document.querySelectorAll("#stage canvas, canvas.fig").forEach((c) => add(c, "figure"));
    add(document.querySelector(".film-card .film-shot img"), "card");
    document.querySelectorAll(MEDIA).forEach((m) => { if (isLoose(m)) add(m, "card"); });
    add(document.getElementById("ascii"), "footer");
    return list;
  }

  let at = { x: innerWidth / 2, y: innerHeight / 2 }, pointer = null, lastMove = 0;
  addEventListener("pointermove", (e) => { pointer = { x: e.clientX, y: e.clientY }; lastMove = performance.now(); }, { passive: true });

  function choose() {
    // a resting cursor pulls it over
    const resting = pointer && performance.now() - lastMove > 1200 && performance.now() - lastMove < 6000;
    const focus = resting ? pointer : at;
    const list = candidates();
    const weighted = list.map((c) => ({ c, w: WEIGHT[c.kind] / (1 + Math.hypot(c.x - focus.x, c.y - focus.y) / (resting ? 120 : 320)) }));
    weighted.push({ c: { kind: "tear", x: focus.x, y: focus.y }, w: WEIGHT.tear / (resting ? 3 : 1) });
    const total = weighted.reduce((n, o) => n + o.w, 0);
    let r = Math.random() * total;
    for (const o of weighted) { if ((r -= o.w) <= 0) return o.c; }
    return weighted[weighted.length - 1].c;
  }

  async function live() {
    await wait(1800);
    for (;;) {
      if (document.hidden) { await wait(1000); continue; }
      try { await visit(); } catch (err) { await wait(2000); }   // a failed visit never ends the organism
    }
  }
  async function visit() {
    {
      const c = choose();
      const e = entropy();
      const pulses = ri(1, 3 + Math.round(e * 3));
      for (let p = 0; p < pulses; p++) {
        const duration = p === 0 ? rnd(700, 950) : rnd(380, 600);
        if (c.kind === "tear") await (Math.random() < 0.7 ? blot(c.y, duration * 1.6, c.x) : tear(c.y, duration, c.x));
        else await breakElement(c.el, c.kind, duration);
        if (p === 0) touchLabels(c.x, c.y);
        await wait(rnd(120, 320));
      }
      at = { x: c.x, y: c.y };
      await wait(rnd(900, 2600) * (1 - e * 0.85));          // rests, then moves on; less and less as it takes over
    }
  }
  live();

  /* ── entropy: the longer nobody touches the page, the more it takes ───────
     Still for 8 s and it starts to escalate; by about 55 s the screen is all
     glitch except the title. Smears of the films' own pixels grow across the
     page and stay. Any movement heals it, column by column, never a fade. */
  const QUIET = 8000, FULL = 55000;
  /* phones and small machines get half the spores and a 1x residue */
  const LITE = matchMedia("(hover: none)").matches ||
               (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
               (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const residue = document.createElement("canvas");
  residue.className = "organism residue"; residue.setAttribute("aria-hidden", "true");
  document.body.appendChild(residue);
  const rg = residue.getContext("2d");
  let RW = 0, RH = 0, dirty = false, healing = false, lastTouch = performance.now();
  function sizeResidue() {
    const dpr = LITE ? 1 : Math.min(devicePixelRatio || 1, 2);
    if (innerWidth === RW && innerHeight === RH) return;
    RW = innerWidth; RH = innerHeight;
    residue.width = RW * dpr; residue.height = RH * dpr;
    rg.setTransform(dpr, 0, 0, dpr, 0, 0); rg.imageSmoothingEnabled = false; dirty = false;
  }
  sizeResidue(); addEventListener("resize", sizeResidue);

  const entropy = () => {
    const x = Math.min(1, Math.max(0, (performance.now() - lastTouch - QUIET) / (FULL - QUIET)));
    return x * x * (3 - 2 * x);
  };

  /* the one thing it never takes: the title, or the nearest heading on screen */
  function spared() {
    const hs = [...document.querySelectorAll("h1, h2")].filter((h) => {
      const r = h.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight;
    });
    const h1 = hs.find((h) => h.tagName === "H1");
    if (h1) return h1;
    return hs.sort((a, b) => Math.abs(a.getBoundingClientRect().top - innerHeight / 2) - Math.abs(b.getBoundingClientRect().top - innerHeight / 2))[0];
  }
  /* the title is not cut out: it floats on glass over the takeover. The glass
     is a copy laid exactly over the real heading (which stays in place for
     screen readers and copying, its ink made transparent); the glass blurs
     what is behind it and the letters invert whatever colour they sit on. */
  const glass = document.createElement("div");
  glass.className = "spared-glass"; glass.setAttribute("aria-hidden", "true"); glass.hidden = true;
  document.body.appendChild(glass);
  let glassFor = null;
  function spareTitle() {
    const t = spared();
    if (t !== glassFor) {
      if (glassFor) glassFor.style.color = "";
      glass.textContent = ""; glassFor = t || null;
      if (!t) { glass.hidden = true; return; }
      const c = document.createElement(t.tagName);
      const cs = getComputedStyle(t);
      for (const k of ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing",
                       "wordSpacing", "textWrap", "textAlign", "fontFeatureSettings", "textTransform"]) c.style[k] = cs[k];
      c.className = "glass-text";
      t.textContent.split(/(\s+)/).forEach((w) => {
        if (/^\s+$/.test(w) || !w) { c.appendChild(document.createTextNode(w)); return; }
        const sp = document.createElement("span"); sp.textContent = w; c.appendChild(sp);
      });
      glass.appendChild(c);
    }
    if (!t) return;
    const r = t.getBoundingClientRect();
    Object.assign(glass.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    glass.hidden = false;
    t.style.color = "transparent";
    if (++readTick % 3 === 0) readBehind();
  }
  /* what is behind each word, read off the residue: light behind it means ink, dark means paper */
  let readTick = 0;
  const probe = document.createElement("canvas"); probe.width = 6; probe.height = 3;
  const pg = probe.getContext("2d", { willReadFrequently: true });
  function readBehind() {
    const dpr = residue.width / RW;
    for (const sp of glass.querySelectorAll("span")) {
      const r = sp.getBoundingClientRect(); if (!r.width) continue;
      pg.clearRect(0, 0, 6, 3);
      try { pg.drawImage(residue, r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr, 0, 0, 6, 3); } catch (e) { continue; }
      const d = pg.getImageData(0, 0, 6, 3).data; let L = 0;
      for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; L += a * lum(d, i) / 255 + (1 - a) * 0.97; }
      L /= d.length / 4;
      sp.style.color = L > 0.56 ? INK : PAPER;
    }
  }
  function unspare() {
    glass.hidden = true;
    if (glassFor) glassFor.style.color = "";
    glassFor = null;
  }

  /* every page feeds on the films, even a page with none on it: a few posters
     from the wall are loaded in the background as the organism's colour */
  const pantry = [];
  fetch("/media/manifest.json").then((r) => r.json()).then((list) => {
    const posters = list.map((it) => it.poster || (/\.(jpe?g|png|webp)$/i.test(it.src) ? it.src : null)).filter(Boolean);
    posters.sort(() => Math.random() - 0.5).slice(0, 8).forEach((p) => {
      const im = new Image(); im.decoding = "async"; im.src = "/media/" + p;
      im.onload = () => pantry.push(im);
    });
  }).catch(() => {});

  function sources() {
    const out = pantry.slice();
    document.querySelectorAll("#reel .tile:not([hidden])").forEach((t) => { const s = filmSource(t); if (s) out.push(s); });
    const card = readable(document.querySelector(".film-card .film-shot img")); if (card) out.push(card);
    document.querySelectorAll(MEDIA).forEach((m) => { const s = readable(m); if (s && !m.closest("#reel")) out.push(s); });
    return out;
  }
  /* a spore: a vertical smear of a film's own pixels, sorted, laid on the page */
  function spore(e, srcs) {
    if (!srcs.length) return;
    const src = pick(srcs);
    const w = ri(4, 14 + Math.round(e * 70)), h = Math.round(RH * rnd(0.2, 0.4 + e * 0.6));
    const x = ri(-10, RW), y = ri(-Math.round(h * 0.2), RH - Math.round(h * 0.6));
    const cols = Math.max(1, Math.ceil(w / PX)), rows = Math.max(2, Math.ceil(h / PX));
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const g = c.getContext("2d", { willReadFrequently: true });
    const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
    const sx = rnd(0, Math.max(0, sw - sw * 0.06)), sWide = Math.max(1, sw * rnd(0.01, 0.06));
    let im;
    try { g.drawImage(src, sx, 0, sWide, sh, 0, 0, cols, rows); im = g.getImageData(0, 0, cols, rows); } catch (err) { return; }
    const d = im.data;
    for (let cx = 0; cx < cols; cx++) {
      const run = [];
      for (let cy = 0; cy < rows; cy++) { const i = (cy * cols + cx) * 4; run.push([d[i], d[i + 1], d[i + 2], lum(d, i)]); }
      run.sort((p, q) => p[3] - q[3]);
      const head = Math.random() < 0.5 ? run[0] : run[run.length - 1], cut = ri(Math.floor(rows * 0.2), rows);
      for (let cy = 0; cy < rows; cy++) {
        const p = cy < cut ? run[cy] : head, i = (cy * cols + cx) * 4;
        d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
    rg.drawImage(c, x, y, w, h);
    if (Math.random() < 0.3) {                                  // the 0xR accent, inside the takeover too
      rg.font = "9px monospace"; rg.textAlign = "center"; rg.textBaseline = "middle";
      const ax = x + ri(0, Math.max(0, w - 9)), ah = Math.round(h * rnd(0.3, 0.9));
      rg.fillStyle = INK; rg.fillRect(ax, y, 9, ah); rg.fillStyle = PAPER;
      const col = ri(0, 9999);
      for (let r = 0; r < ah / 9; r++) rg.fillText(hexAt(col, r, 0), ax + 4.5, y + r * 9 + 4.5);
    }
    if (Math.random() < e * 0.5) {                              // datamosh the residue itself
      const bw = ri(60, 340), bh = ri(10, 60), bx = ri(0, RW - bw), by = ri(0, RH - bh), off = ri(-80, 80);
      const dpr = residue.width / RW;                            // the canvas copies itself: no read back
      rg.drawImage(residue, bx * dpr, by * dpr, bw * dpr, bh * dpr, bx + off, by, bw, bh);
    }
    dirty = true;
  }

  (function spread() {
    setTimeout(() => {
      try {
        if (!document.hidden && !healing) {
          const e = entropy();
          if (e > 0.02) {
            const srcs = sources();                             // read the page once per tick, not per spore
            const n = Math.round((e * e * 3 + e) * (LITE ? 0.5 : 1));
            for (let i = 0; i < n; i++) spore(e, srcs);
            if (blooming < (LITE ? 2 : 4) && Math.random() < 0.15 + e * 0.6) grow(e, srcs);
            spareTitle();
          }
        }
      } catch (err) { /* keep spreading */ }
      spread();
    }, 120);
  })();

  /* the takeover's blooms: marbled shapes that grow on the residue and stay */
  let blooming = 0;
  function grow(e, srcs) {
    if (!srcs.length) srcs = [];
    const kind = pickKind({ ribbon: 1.2, shard: 0.7, curtain: 0.6, steps: 0.9, barcode: 0.7, moss: 0.8, streaks: 1, bars: 0.6 });
    const big = LITE ? 0.7 : 1;
    const SIZE = {
      ribbon:  () => [rnd(0.35, 0.9 + e * 0.5) * RW, rnd(120, 260 + e * 420) * big],
      streaks: () => [rnd(0.3, 0.6 + e * 0.3) * RW, rnd(0.4, 1) * RH],
      curtain: () => [rnd(60, 380) * big, rnd(0.35, 1) * RH],
      barcode: () => [rnd(80, 360) * big, rnd(0.35, 1) * RH],
      steps:   () => [rnd(200, 500 + e * 300) * big, rnd(120, 300 + e * 200) * big],
      moss:    () => [rnd(160, 380 + e * 200) * big, rnd(120, 280 + e * 160) * big],
      shard:   () => { const w = rnd(90, 260 + e * 320) * big; return [w, w * rnd(0.6, 1.4)]; },
      bars:    () => [rnd(0.3, 1) * RW, rnd(60, 240) * big],
    };
    const [W, H] = SIZE[kind]();
    const x = Math.random() < 0.5 ? at.x - W / 2 + rnd(-RW * 0.3, RW * 0.3) : rnd(-W * 0.2, RW - W * 0.8);
    const y = /curtain|barcode|streaks/.test(kind) ? rnd(-H * 0.2, RH - H * 0.6) : rnd(-H * 0.3, RH - H * 0.5);
    const paint = makePatch(x, y, W, H, kind, scene(), paletteOf(pick(srcs))), dur = rnd(900, 1800);
    blooming++;
    run(dur, (t) => { if (!healing) { paint(rg, easeOut(t / dur)); dirty = true; } },
        () => { if (!healing) paint(rg, 1); blooming--; });
  }

  /* healing: any touch wipes it away, column by column */
  function heal() {
    if (!dirty || healing) return;
    healing = true;
    const strips = []; for (let x = 0; x < RW; x += 16) strips.push(x);
    strips.sort(() => Math.random() - 0.5);
    const per = Math.ceil(strips.length / 12);
    let i = 0;
    (function step() {
      for (let k = 0; k < per && i < strips.length; k++, i++) rg.clearRect(strips[i], 0, 16, RH);
      if (i < strips.length) setTimeout(step, 40);
      else { rg.clearRect(0, 0, RW, RH); dirty = false; healing = false; unspare(); }
    })();
  }
  const wake = () => { lastTouch = performance.now(); heal(); };
  ["pointermove", "pointerdown", "wheel", "keydown", "touchstart"].forEach((ev) => addEventListener(ev, wake, { passive: true }));

  /* a fast scroll tears the page where you are */
  let lastY = scrollY, lastT = performance.now(), lastTear = 0;
  addEventListener("scroll", () => {
    wake();
    const now = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(1, now - lastT);
    lastY = scrollY; lastT = now;
    if (v > 2.2 && now - lastTear > 1500) { lastTear = now; tear(innerHeight / 2, rnd(420, 620)); }
  }, { passive: true });

  /* poking a film always works, whatever the organism is doing */
  const reel = document.getElementById("reel");
  const cool = new WeakMap();
  const poke = (tile) => {
    const now = performance.now();
    if (!tile || (cool.get(tile) || 0) > now || tile.querySelector("canvas.glitch")) return;
    cool.set(tile, now + 1200);
    breakElement(tile, "film", rnd(700, 900));
  };
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) document.addEventListener("pointerover", (e) => {
    if (reel && reel.contains(e.target)) return;
    const box = e.target.closest("a, figure, .shot, .cover, .pcard") || e.target;
    const m = box.matches && box.matches("img, video") ? box : box.querySelector && box.querySelector("img, video");
    if (!m || !m.closest("main") || !isLoose(m) || box.contains(e.relatedTarget)) return;
    const now = performance.now();
    if ((cool.get(m) || 0) > now) return;
    cool.set(m, now + 1200);
    breakElement(m, "card", rnd(700, 900));
  });
  if (reel) {
    if (fine)
      reel.addEventListener("pointerover", (e) => {
        const tile = e.target.closest(".tile");
        if (tile && !tile.contains(e.relatedTarget)) poke(tile);
      });
    reel.addEventListener("focusin", (e) => {
      const tile = e.target.closest(".tile");
      if (tile && e.target.matches(":focus-visible")) poke(tile);
    });
  }

})();
