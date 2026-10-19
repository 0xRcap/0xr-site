/* ── glitch: one organism that lives in the page ──
   Round 3 (2026-10-19). His notes on round 2: "much better. not all videos
   have this and i want it not only on the videos i want it like a living
   organism inside my site".

   So the glitch is now one creature, not a set of effects. It travels: its
   next stop is always weighted toward its last one, so it can be watched
   moving down the page. Where it lands it pulses one to three times, rests,
   and moves on. It visits the films, the crew figures, the THESEUS card, the
   ASCII footer, and the empty paper between sections, which it tears. It
   asks labels it passes to decode (their own scramble, so type still only
   moves the way it always has). It comes to a resting cursor, and a fast
   scroll tears the page.

   Kept from JEAN's rules: type never glitches, nothing at rest, no RGB split,
   scanlines or CSS transforms, reduced motion and hidden tabs stay still.
   Colour is only ever the films' own (YE). */
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches ||
                (navigator.connection && navigator.connection.saveData);
  if (still) return;

  const STREAK = "':;|!lI1";
  const CORRUPT = "!<>-_\\/[]{}=+*^?#%:;";
  const DENSITY = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const INK = "#0E0D0B", PAPER = "#FAF8F4";
  const PX = 4;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* PROTOTYPE ONLY: ?glitch=slow plays everything 12x slower; window.__glitch
     exposes still frames for review. Both come out before shipping. */
  const SLOW = /glitch=slow/.test(location.search) ? 12 : 1;
  const G = (window.__glitch = {});

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
        const t = (now - t0) / SLOW;
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

  /* ── the break: a picture's own pixels, sorted, smeared and torn ────────── */
  function makeBreak(src, W, H, opts = {}) {
    const cols = Math.max(1, Math.ceil(W / PX)), rows = Math.max(1, Math.ceil(H / PX));
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const cg = c.getContext("2d", { willReadFrequently: true });
    try { cg.drawImage(src, 0, 0, cols, rows); } catch (e) { return null; }
    const B = cg.getImageData(0, 0, cols, rows).data;
    const share = opts.share || [0.35, 0.55];
    const sorted = clusters(cols, rnd(share[0], share[1]), 3, 14).map((x) => {
      const s = ri(0, Math.floor(rows * 0.3)), run = [];
      for (let y = s; y < rows; y++) { const i = (y * cols + x) * 4; run.push([B[i], B[i + 1], B[i + 2], B[i + 3], lum(B, i)]); }
      const up = Math.random() < 0.5;
      run.sort((p, q) => (up ? p[4] - q[4] : q[4] - p[4]));
      return { x, s, run, at: rnd(0, 90), resolveAt: rnd(0.62, 0.98) * opts.duration };
    });
    const blocks = Array.from({ length: ri(opts.blocks ? opts.blocks[0] : 2, opts.blocks ? opts.blocks[1] : 4) }, () => {
      const w = Math.round(cols * rnd(0.2, 0.5)), h = Math.max(2, Math.round(rows * rnd(0.05, 0.16)));
      return { w, h, x: ri(0, Math.max(0, cols - w)), y: ri(0, Math.max(0, rows - h)),
               off: Math.round(cols * rnd(0.05, 0.2)) * (Math.random() < 0.5 ? -1 : 1),
               from: rnd(60, 220), to: rnd(0.45, 0.78) * opts.duration };
    });
    const asciiCols = opts.ascii === false ? [] : clusters(Math.ceil(W / 9), rnd(0.03, 0.07), 1, 3);
    const out = document.createElement("canvas"); out.width = cols; out.height = rows;
    const og = out.getContext("2d");
    const img = og.createImageData(cols, rows), F = img.data;

    return (g, x0, y0, t) => {
      F.set(B);
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
      og.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false;
      g.drawImage(out, x0, y0, W, H);
      if (t > 80 && t < opts.duration * 0.7) {
        g.font = "9px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
        for (const x of asciiCols) {
          g.fillStyle = INK; g.fillRect(x0 + x * 9, y0, 9, H);
          g.fillStyle = PAPER;
          for (let y = 0; y < Math.ceil(H / 9); y++)
            g.fillText(Math.random() < 0.06 ? pick(CORRUPT) : pick(STREAK), x0 + x * 9 + 4.5, y0 + y * 9 + 4.5);
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
  async function breakElement(el, kind, duration, freezeAt) {
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
      if (freezeAt != null) { draw(g, 0, 0, freezeAt); return; }
      await run(duration, (t) => { g.clearRect(0, 0, W, H); draw(g, 0, 0, t); }, () => cv.remove());
      return;
    }

    // figures and the footer get a lighter break: they are smaller or quieter things
    const opts = kind === "figure" ? { duration, share: [0.4, 0.7], blocks: [1, 2], ascii: false }
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
    if (freezeAt != null) { paint(freezeAt); layerUsers--; return; }
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
    const tiles = [...document.querySelectorAll("#reel .tile:not([hidden])")];
    const t = tiles[ri(0, Math.max(0, tiles.length - 1))];
    const src = t && filmSource(t);
    if (!src) return [];
    const c = document.createElement("canvas"); c.width = 32; c.height = 4;
    const g = c.getContext("2d", { willReadFrequently: true });
    try { g.drawImage(src, 0, 0, 32, 4); } catch (e) { return []; }
    const d = g.getImageData(0, 0, 32, 4).data, out = [];
    for (let i = 0; i < d.length; i += 4) out.push(`rgb(${d[i]},${d[i + 1]},${d[i + 2]})`);
    return out;
  }
  async function tear(nearY, duration, freezeAt, nearX = LW / 2) {
    const h = ri(30, 96), spots = freeSpots(h, 160);
    if (!spots.length) return false;
    spots.sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - nearX, a.y - nearY) - Math.hypot((b.x0 + b.x1) / 2 - nearX, b.y - nearY));
    const sp = spots[ri(0, Math.min(3, spots.length - 1))];
    const y = sp.y, c0 = Math.ceil(sp.x0 / 9), c1 = Math.floor(sp.x1 / 9);
    const cols = Math.max(1, c1 - c0), rows = Math.ceil(h / 9);
    // ragged, not barred: thin columns, each dripping from its own height
    const hot = clusters(cols, rnd(0.14, 0.32), 1, 4).map((x) => x + c0);
    const drip = new Map(hot.map((x) => { const top = ri(0, Math.max(0, rows - 2)); return [x, [top, ri(top + 1, rows)]]; }));
    const colours0 = filmColours();
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
          lg.fillText(Math.random() < 0.08 ? pick(CORRUPT) : pick(STREAK), dx * 9 + 4.5, y + r * 9 + 4.5);
      }
      if (colours.length) for (const s of slivers) {
        if (t < s.from || t >= s.to) continue;
        const step = 4;
        for (let i = 0; i < s.w; i += step) { lg.fillStyle = colours[Math.floor(i / s.w * colours.length)]; lg.fillRect(s.x + i, s.y, step, s.h); }
      }
    };
    layerUsers++;
    if (freezeAt != null) { paint(freezeAt); layerUsers--; return true; }
    await run(duration, paint, () => { lg.clearRect(sp.x0, y - 1, spanW, h + 2); layerUsers--; clearLayer(); });
    return true;
  }

  /* labels near where the organism is ask to decode: their own effect */
  function touchLabels(cx, cy) {
    for (const el of document.querySelectorAll("[data-scramble]")) {
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
    document.querySelectorAll("#stage canvas").forEach((c) => add(c, "figure"));
    add(document.querySelector(".film-card .film-shot img"), "card");
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
    await wait(1800 * SLOW);
    for (;;) {
      if (document.hidden) { await wait(1000); continue; }
      const c = choose();
      const e = entropy();
      const pulses = ri(1, 3 + Math.round(e * 3));
      for (let p = 0; p < pulses; p++) {
        const duration = p === 0 ? rnd(700, 950) : rnd(380, 600);
        if (c.kind === "tear") await tear(c.y, duration, undefined, c.x);
        else await breakElement(c.el, c.kind, duration);
        if (p === 0) touchLabels(c.x, c.y);
        await wait(rnd(120, 320) * SLOW);
      }
      at = { x: c.x, y: c.y };
      await wait(rnd(900, 2600) * (1 - e * 0.85) * SLOW);  // rests, then moves on; less and less as it takes over
    }
  }
  if (!/freeze=/.test(location.search)) live();

  /* ── entropy: the longer nobody touches the page, the more it takes ───────
     Still for 8 s and it starts to escalate; by about 55 s the screen is all
     glitch except the title. Smears of the films' own pixels grow across the
     page and stay. Any movement heals it, column by column, never a fade. */
  const QUIET = 8000 * SLOW, FULL = 55000 * SLOW;
  const residue = document.createElement("canvas");
  residue.className = "organism residue"; residue.setAttribute("aria-hidden", "true");
  document.body.appendChild(residue);
  const rg = residue.getContext("2d", { willReadFrequently: true });
  let RW = 0, RH = 0, dirty = false, healing = false, lastTouch = performance.now();
  function sizeResidue() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
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
  G.entropy = entropy;

  /* the one thing it never takes: the title, or the nearest heading on screen */
  function spared() {
    const hs = [...document.querySelectorAll("h1, h2")].filter((h) => {
      const r = h.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight;
    });
    const h1 = hs.find((h) => h.tagName === "H1");
    if (h1) return h1;
    return hs.sort((a, b) => Math.abs(a.getBoundingClientRect().top - innerHeight / 2) - Math.abs(b.getBoundingClientRect().top - innerHeight / 2))[0];
  }
  function spareTitle() {
    const t = spared(); if (!t) return;
    // the title's own line boxes, so the cut follows the words and not the block
    const range = document.createRange(); range.selectNodeContents(t);
    for (const r of range.getClientRects()) { rg.clearRect(r.left - 10, r.top - 6, r.width + 20, r.height + 12); lg.clearRect(r.left - 10, r.top - 6, r.width + 20, r.height + 12); }
  }

  function sources() {
    const out = [];
    document.querySelectorAll("#reel .tile:not([hidden])").forEach((t) => { const s = filmSource(t); if (s) out.push(s); });
    const card = readable(document.querySelector(".film-card .film-shot img")); if (card) out.push(card);
    return out;
  }
  /* a spore: a vertical smear of a film's own pixels, sorted, laid on the page */
  function spore(e) {
    const srcs = sources(); if (!srcs.length) return;
    const src = pick(srcs);
    const w = ri(4, 14 + Math.round(e * 70)), h = Math.round(RH * rnd(0.2, 0.4 + e * 0.6));
    const x = ri(-10, RW), y = ri(-Math.round(h * 0.2), RH - Math.round(h * 0.6));
    const cols = Math.max(1, Math.ceil(w / PX)), rows = Math.max(2, Math.ceil(h / PX));
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const g = c.getContext("2d", { willReadFrequently: true });
    const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
    const sx = rnd(0, Math.max(0, sw - sw * 0.06)), sWide = Math.max(1, sw * rnd(0.01, 0.06));
    try { g.drawImage(src, sx, 0, sWide, sh, 0, 0, cols, rows); } catch (err) { return; }
    const im = g.getImageData(0, 0, cols, rows), d = im.data;
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
      for (let r = 0; r < ah / 9; r++) rg.fillText(Math.random() < 0.08 ? pick(CORRUPT) : pick(STREAK), ax + 4.5, y + r * 9 + 4.5);
    }
    if (Math.random() < e * 0.5) {                              // datamosh the residue itself
      const bw = ri(60, 340), bh = ri(10, 60), bx = ri(0, RW - bw), by = ri(0, RH - bh), off = ri(-80, 80);
      try { const dpr = residue.width / RW; const blk = rg.getImageData(bx * dpr, by * dpr, bw * dpr, bh * dpr); rg.putImageData(blk, (bx + off) * dpr, by * dpr); } catch (err) {}
    }
    dirty = true;
  }

  (function spread() {
    setTimeout(() => {
      if (!document.hidden && !healing) {
        const e = entropy();
        if (e > 0.02) {
          const n = Math.round(e * e * 6 + e * 1.5);
          for (let i = 0; i < n; i++) spore(e);
          spareTitle();
        }
      }
      spread();
    }, 120 * SLOW);
  })();

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
      if (i < strips.length) setTimeout(step, 40 * SLOW);
      else { rg.clearRect(0, 0, RW, RH); dirty = false; healing = false; }
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
    cool.set(tile, now + 1200 * SLOW);
    breakElement(tile, "film", rnd(700, 900));
  };
  if (reel) {
    if (matchMedia("(hover: hover) and (pointer: fine)").matches)
      reel.addEventListener("pointerover", (e) => {
        const tile = e.target.closest(".tile");
        if (tile && !tile.contains(e.relatedTarget)) poke(tile);
      });
    reel.addEventListener("focusin", (e) => {
      const tile = e.target.closest(".tile");
      if (tile && e.target.matches(":focus-visible")) poke(tile);
    });
  }

  // PROTOTYPE ONLY: still frames for review; G.takeover(e) fakes how long the page has been still
  G.takeover = (e = 1, ticks = 60) => { lastTouch = performance.now() - (QUIET + (FULL - QUIET) * e); for (let i = 0; i < ticks; i++) spore(entropy()); spareTitle(); };
  G.film = (i = 0, t = 300) => breakElement(document.querySelectorAll("#reel .tile:not([hidden])")[i], "film", 900, t);
  G.figure = (i = 0, t = 300) => breakElement(document.querySelectorAll("#stage canvas")[i], "figure", 900, t);
  G.tear = (y = innerHeight / 2, t = 300) => tear(y, 700, t);
  G.footer = (t = 300) => breakElement(document.getElementById("ascii"), "footer", 900, t);
  const FREEZE = new URLSearchParams(location.search).get("freeze");   // e.g. figure:2:300,tear:420:260
  if (FREEZE) setTimeout(() => FREEZE.split(",").forEach((f) => {
    const [k, a1, a2] = f.split(":"); const n1 = +a1, n2 = +a2;
    if (k === "tear") G.tear(n1, n2); else if (k === "footer") G.footer(n1); else G[k] && G[k](n1, n2);
  }) || setTimeout(() => {
    const d = lg.getImageData(0, 0, layer.width, layer.height).data; let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
    const f = document.querySelector("#stage canvas"), tg = document.createElement("canvas");
    tg.width = f.width; tg.height = f.height; tg.getContext("2d").drawImage(f, 0, 0);
    const fd = tg.getContext("2d").getImageData(0, 0, tg.width, tg.height).data; let m = 0;
    for (let i = 3; i < fd.length; i += 4) if (fd[i]) m++;
    document.documentElement.dataset.glitchDebug = JSON.stringify({ layerPx: n, figPx: m, spots: freeSpots(30, 160).length });
  }, 400), 2600);
})();
