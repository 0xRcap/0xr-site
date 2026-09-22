/* ── crew3d: the approved crew figures, given depth, drawn as characters,
   and since 2026-09-09 given a rig so they behave like people standing ──

   The flat figure in crew/gen/<name>.png is the likeness and it is not up
   for negotiation, so it is the model's front face and nothing else. Depth
   is a second grid the same size, authored by hand in crew/<name>.depth.txt,
   one character per depth step. Both are baked into crew/models.js by
   crew/mkmodel.py; edit the text file, rerun the script.

   Why an authored depth map and not a guess from brightness: the likeness
   lives in exact placement, the sunglasses bar and the beard mass and the
   line where the coat meets the jaw. A brightness heightfield puts the lit
   band of the shades at the BACK of the head and the face turns inside out
   on the first degree of turn. Authoring it costs one text file and is
   diffable.

   THE BACK, 2026-09-18. One grid can only describe a symmetric solid: the
   back mirrored the front and clamped at backmax, so every figure was a bas
   relief and a turn revealed the extruded edge of the front silhouette and
   nothing else. Measured on STEVE at 24 degrees, the body widened 12px at the
   head, 4px at the torso and 0px at the legs. So there is a second optional
   grid, crew/<name>.back.txt, same alphabet: how far the BACK surface sits
   behind the base plane. `~` is no opinion and falls through to the old
   mirror rule, which is also what a figure with no back file gets, so a
   half authored back is legal and the five figures without one are byte
   identical to before. A back value on a thin card extrudes it into a slab;
   without one a card stays a card, which is how STEVE's one cell leg gap
   survives.

   THE RIG. The depth file also names three row ranges: head, torso, legs.
   The ray march is a per row walk, so each row can be marched at its own
   angle for free. Since 2026-09-18 all three of those angles are alive and
   none of them is a copy of another: one command goes into three springs
   with three different masses, so the head leads, the shoulders are
   recruited only past six degrees and arrive later, and the hips oppose the
   head at the start of a move and carry past rest at the end. Vertical moves are whole rows remapped from
   screen row to model row (a nod is the head drawn one row lower, over the
   collar; a lifted head doubles its chin row so the neck never opens; a
   shrug lifts the shoulder band a row against a still head).
   Sub voxel moves (the breath, a weight shift, a step) are whole css
   pixels, so nothing is ever antialiased into a grey seam. The parts share
   one grid and one march; the only cost of the rig is a 56 entry row map
   per frame.

   ALIVE. Idle yaw is three summed sines at incommensurate periods, not one.
   Blinks and acts are on Poisson clocks per figure, seeded per figure. Each
   act is a curve with anticipation, action, overshoot and settle on one
   channel; on a one voxel channel the anticipation rounds to nothing, which
   is the honest limit of a 32 x 56 figure. One constants block per figure,
   TEMPER below, tunes the same machine six ways.

   API:  crew3d.register(canvas, model, opts)  live figure, returns a handle
           handle: act(name) blink() turn(deg|null) freeze(on) stop()
         crew3d.paint(canvas, model, opts)     one static frame, no loop
         crew3d.build(model)                   the text pair to a voxel grid
         crew3d.attend(pageX, pageY | null)    the pointer, for every figure
         crew3d.neighbours([handles])          left to right; else derived
         crew3d.stats()                        ms per frame, draw calls
         crew3d.drive(ms)                      advance a virtual clock, no rAF
         crew3d.ACTS, crew3d.TEMPER            the library and the table
   Opts: angle, scale (css px per voxel, default 4), glyphs (default auto:
         on at 6px and up), resolved, hold, name (temperament), seed,
         instant (skip the arrival decode).

   One rAF for every figure, 30fps like ascii.js, paused while the tab is
   hidden and skipped for any figure that is off screen. Nothing allocates
   per frame: bins and row maps are reused, hits are written into one
   object, the ground strip is a flat array. */
(() => {
  const DENSITY = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PX = 4;                        /* css px per voxel on the page */
  /* 12: measured on the sheet, each leg's projection widens about a cell on
     the turn and by 20 the near one swallows the gap between them. The head
     respects it at idle; the reduced motion rest has always stood the legs
     at it, which is why LEG_MAX below is set where it is. */
  const IDLE = 12;
  /* 28 since 2026-09-18. The old 24 was set before the back of the head was
     authored, and it was the clamp, not the spring, that shaped the top of a
     turn: STEVE hit exactly 24.00 in five of five 90 second windows. Painted
     at 0/22/24/28/32 against the back map, 28 still reads as a head turning
     and 32 is where the near lens reaches the silhouette edge and the skull
     goes wide. So 28 is headroom, not a new target: the turn act still peaks
     at 22 x 1.12 and now overshoots inside the clamp instead of against it. */
  const MAX_TURN = 28;
  /* the sprite swap (2026-09-18): past this head angle, a figure that has an
     authored turned face paints it instead of the wrapped front one, mirrored
     for the other direction. In at 18, out at 12, so held-turn noise around
     one value cannot flicker the face and idle sway, which peaks at 12, never
     reaches the swap. JEAN's arithmetic, 2026-09-18: a head of half width r
     moves its centre line by r*sin(theta), so at 12 degrees JEAN shifts half
     a cell and YE under one. Below the grid, nothing turns, and the front
     face is the honest thing to show. The art is drawn at 22. */
  const TURN_SWAP = 18, TURN_BACK = 12;
  /* ── the chain (2026-09-18) ──
     A turn used to be one rotation drawn at three sizes: the legs at zero
     forever, the torso a fixed fraction of the head's current angle, so the
     two could never be out of step. A real turn is a chain with time between
     its links. Each link is now a spring with its own mass, so the lag, the
     overshoot and the settle come out of the mechanics instead of a curve. */
  const LEG_MAX = 8;      /* deg. 20 swallows the gap between the legs, 12 is the
                             documented edge, 8 keeps a margin on every figure */
  const TORSO_DEAD = 6;   /* deg of yaw the shoulders ignore: nobody turns their
                             body to glance, so a small look stays head only */
  const WEIGHT = 6;       /* deg of shoulder per px the upper body counterweights */
  const DT_MAX = 1 / 15;  /* the longest step the integrator will take */
  const FOCAL = 240;                   /* px of pointer offset for a 45° turn */
  const DECODE = 1.4;                  /* seconds, slice by slice */
  const ARRIVE = 300;                  /* ms between one figure's decode and the next */
  const SHOULDER = 4;                  /* rows of torso that are shoulder, for the shrug */
  const GLYPH_MIN = 6;                 /* px per voxel below which a glyph is mud */
  const FRAME = 1000 / 30;
  const RAD = Math.PI / 180, TAU = Math.PI * 2;
  const RAMP = "0123456789AB";
  /* the same protrusion, ONE voxel thick: a card with no side faces projects
     its own width at any angle. The only way a one cell feature (JEAN's
     spikes) or a one cell gap (STEVE's legs) survives the turn. */
  const THIN = "abcdefghijkl";
  /* three sines the idle is made of: period in seconds, amplitude in degrees.
     7.3, 11.1 and 17.9 share no small common multiple, so the sum first
     repeats after about a quarter of an hour. Peak sum is 12. */
  const NOISE = [[7.3, 6], [11.1, 4], [17.9, 2]];
  const BREATH = 4.2, BREATH_WOBBLE = 13.7, SWAY = 6.3;

  /* ── tokens: read once, with the sheet's own values as fallback ── */
  const css = getComputedStyle(document.documentElement);
  const token = (n, f) => css.getPropertyValue(n).trim() || f;
  const PAL = [
    token("--paper", "#FAF8F4"), token("--rule", "#E9E7E2"),
    token("--tone", "#8A8781"), token("--ink-soft", "#3F3D38"),
    token("--ink", "#0E0D0B"),
  ];
  const VAL = { ".": 0, "·": 1, "-": 2, "+": 3, "#": 4 };

  /* A side face is one value darker than the front it belongs to, clamped
     at ink. Greys are flat inlays with no thickness of their own; only the
     mass has sides. Two passes were thrown away to get here, see the git
     history of this comment. */
  const SIDE = [0, 2, 3, 4, 4];
  /* The softened ramp, for figures built as a volume only. Darkening the two
     light values checkerboards every stair step of a rounded pale head at mid
     turn, which is what kept breaking QUENT's face: his skull is skin where
     the others are hair. A figure with no volume is the old slab, has no
     stair steps, and keeps the original ramp so it renders exactly as it
     always did. Scoped 2026-09-18, when rodrigo and quent were reverted. */
  const SIDE_SOFT = [0, 1, 2, 4, 4];
  /* glyph weight per value: [base, spread] as a fraction of the ramp, and
     the value the character is drawn in. Only the two dark values are
     textured; grey here is a FEATURE, not a plane. */
  const GLYPH = { 3: [0.26, 0.26, 4], 4: [0.02, 0.11, 3] };

  /* ── the act library ──
     ch: 0 head yaw (deg), 1 head pitch (rows, + is down), 2 head tilt
     (columns), 3 shoulder lift (rows, + is up, head stays), 4 torso x (px),
     5 figure x (px).
     in/out in seconds, hold a range. sign: the direction is drawn at random.
     Positive yaw turns the figure toward the viewer's left. */
  const ACTS = [
    { name: "glanceL", ch: 0, amp: 14,  in: 0.35,  hold: [0.6, 1.4],     out: 0.5 },
    { name: "glanceR", ch: 0, amp: -14, in: 0.35,  hold: [0.6, 1.4],     out: 0.5 },
    { name: "turn",    ch: 0, amp: 22,  in: 0.28,  hold: [1.2, 2.4],     out: 0.9,  sign: 1 },
    { name: "lookUp",  ch: 1, amp: -1,  in: 0.25,  hold: [0.8, 1.8],     out: 0.35 },
    { name: "nod",     ch: 1, amp: 1,   in: 0.18,  hold: [0.2, 0.45],    out: 0.3 },
    { name: "tilt",    ch: 2, amp: 1,   in: 0.3,   hold: [2, 5],         out: 0.5,  sign: 1 },
    { name: "weight",  ch: 4, amp: 1,   in: 0.6,   hold: [3, 8],         out: 0.7,  sign: 1 },
    { name: "shrug",   ch: 3, amp: 1,   in: 0.07,  hold: [0.2, 0.3],     out: 0.15 },
    { name: "step",    ch: 5, amp: 1,   in: 0.4,   hold: [0.3, 0.8],     out: 0.4,  sign: 1 },
  ];
  const ACT_INDEX = Object.fromEntries(ACTS.map((a, i) => [a.name, i]));

  /* ── temperament: one block per figure, the same machine tuned six ways.
     blink/act: mean seconds between (Poisson). idle: scale on the ±12 noise.
     radius: px from the head within which the pointer is noticed. back: the
     chance of returning a neighbour's glance. ease: fraction of the way to
     the target per frame (the speed of a turn). follow: how much of the
     recruited yaw the torso eventually takes. holdx: scale on every hold.
     mix: act weights.
     2026-09-18: every figure carries turn. Before this, five of the six had
     no act above the 14 degree glance, so in a 90 second window FRANK never
     once crossed 15 and QUENT and JEAN crossed it in one window out of five.
     idle also came up across the board, because a median of 1.5 degrees is a
     figure standing still. The three noise periods are 7.3, 11.1 and 17.9
     seconds, so a bigger idle is a slower drift, never a faster one.
     The chain, per figure: lag is the shoulders' speed as a fraction of the
     head's, so a low lag arrives later. bounce is the head's damping, under
     1 overshoots and settles, at 1 arrives and stops. tbounce is the same for
     the shoulders. plant is the share of the shoulder angle the hips take.
     counter is how hard the hips oppose the head at the start of a move,
     which is the anticipation. */
  const TEMPER = {
    ye:    { blink: 5.0, act: 7.0,  idle: 0.75, radius: 220, back: 0.3, ease: 0.06, follow: 0.4,  holdx: 1.6,
             lag: 0.55, bounce: 0.82, tbounce: 0.90, plant: 0.30, counter: 0.8,
             mix: { glanceL: 2, glanceR: 2, lookUp: 1, nod: 1, weight: 2, turn: 2 } },
    /* he stays near front on. His eyes are scattered single cells rather than
       a mass, so the side darkening on a turn swallows them and the chin
       flattens into the jaw: past a few degrees he stops being a face. The
       fidget moves into the body instead, which is where it survives.
       2026-09-18, measured against the back map: the face does lose its
       features by 22, but the silhouette turns and the legs open, so the
       move reads on the body exactly as the note says. He gets the smallest
       turn share of the six. weight drops from 3 to 2 because its 5 to 13
       second hold was holding a third of his clock and blocking every other
       act while it ran. */
    quent: { blink: 3.0, act: 3.5,  idle: 0.45, radius: 260, back: 0.8, ease: 0.22, follow: 0.18, holdx: 0.6,
             lag: 0.70, bounce: 0.70, tbounce: 0.80, plant: 0.35, counter: 1.4,
             mix: { nod: 3, weight: 3, shrug: 2, step: 1, lookUp: 1, glanceL: 2, glanceR: 2, turn: 4 } },
    frank: { blink: 6.0, act: 11.0, idle: 0.55, radius: 180, back: 0.2, ease: 0.05, follow: 0.6,  holdx: 1.4,
             lag: 0.40, bounce: 0.95, tbounce: 1.00, plant: 0.25, counter: 0.5,
             mix: { nod: 3, glanceL: 1, glanceR: 1, lookUp: 1, turn: 4 } },
    jean:  { blink: 4.0, act: 5.0,  idle: 0.85, radius: 240, back: 0.5, ease: 0.12, follow: 0.5,  holdx: 1.0,
             lag: 0.60, bounce: 0.70, tbounce: 0.80, plant: 0.45, counter: 1.1,
             mix: { weight: 3, tilt: 2, glanceL: 2, glanceR: 2, shrug: 1, step: 1, nod: 1, lookUp: 1, turn: 4 } },
    steve: { blink: 4.5, act: 7.0,  idle: 0.6,  radius: 200, back: 0.4, ease: 0.25, follow: 0.35, holdx: 1.5,
             lag: 0.45, bounce: 0.72, tbounce: 0.85, plant: 0.40, counter: 1.2,
             mix: { turn: 2, nod: 1, weight: 1, glanceL: 1, glanceR: 1 } },
    kim:   { blink: 4.0, act: 7.0,  idle: 0.65, radius: 360, back: 0.6, ease: 0.14, follow: 0.45, holdx: 1.0,
             lag: 0.65, bounce: 0.78, tbounce: 0.85, plant: 0.35, counter: 1.0,
             mix: { glanceL: 2, glanceR: 2, nod: 1, weight: 1, tilt: 1, lookUp: 1, turn: 3 } },
  };
  const DEFAULT_T = TEMPER.jean;

  /* ── curves: anticipation, action, overshoot, settle. Never linear. ── */
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
  function shape(u) {                 /* 0 → 1 with a pull back first and a push past */
    if (u < 0.2) return -0.18 * ease(u / 0.2);
    if (u < 0.7) return -0.18 + 1.3 * ease((u - 0.2) / 0.5);
    return 1.12 - 0.12 * ease((u - 0.7) / 0.3);
  }
  function back(u) {                  /* 1 → 0, a little past rest, then settle */
    if (u < 0.6) return 1 - 1.08 * ease(u / 0.6);
    return -0.08 + 0.08 * ease((u - 0.6) / 0.4);
  }
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* ── one link of the chain ──
     Semi implicit Euler on a spring. w is the inverse of the rise time in
     seconds, z is damping: under 1 it overshoots and settles, at 1 it
     arrives and stops. Four multiplies per link per frame, three links.
     Why a spring and not the shape()/back() curves the acts use: those are
     parameterised on u, the fraction of a known duration, and a turn has no
     duration. Its command is continuous, the sum of pointer, idle noise and
     whatever act is running. The act keeps its curve, so its anticipation
     and overshoot are still in the command; the chain then filters that one
     command through three different masses, which is what puts time between
     the links. */
  const link = (x, v, target, w, z, dt) =>
    v + ((target - x) * w * w - 2 * z * w * v) * dt;
  /* the old per frame lerp stays the tuning knob: a rate of r at 30fps has a
     time constant of -FRAME/ln(1-r), and the spring's w is its inverse. So
     ease keeps meaning the speed of a turn and no block had to be retuned. */
  const omega = (r) => -1000 * Math.log(1 - clamp(r, 0.01, 0.9)) / FRAME;
  /* a lerp and a spring do not reach 63% at the same time: a spring damped at
     z gets there at about (1 + z) / w. Folding that in is what let every
     temperament keep the ease it was tuned with, measured against the old
     rig to within a frame or two on the head. */
  const speed = (r, z) => omega(r) * (1 + z);
  const W_HELD = omega(0.15);          /* the floor when a pointer or pin is on */

  /* a seeded generator per figure, so two figures never share a clock */
  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const expo = (rng, mean) => -Math.log(1 - rng()) * mean;   /* Poisson gap */

  /* ── unrle: a sculpted volume, run length coded, back to voxels ──
     A run is a base36 count then one value character, and the two alphabets
     do not overlap, so no separator is needed. The extrusion below can only
     paint a whole depth column one value, which is why a head turning used to
     show the front of the face on the side of the skull. A volume carries a
     value per voxel and the march reads it with no other change. */
  const RLE = { ".": 0, ":": 1, "-": 2, "+": 3, "#": 4 };
  function unrle(s, grid) {
    let p = 0, n = 0;
    for (let q = 0; q < s.length; q++) {
      const v = RLE[s[q]];
      if (v === undefined) { n = n * 36 + parseInt(s[q], 36); continue; }
      if (v) grid.fill(v, p, p + n);
      p += n; n = 0;
    }
    return p;
  }

  /* ── build: two text grids to one voxel grid ── */
  function build(src) {
    const rows = (t) => t.split("\n").filter((l) => l.length);
    const vs = rows(src.value), ds = rows(src.depth);
    const bs = src.back ? rows(src.back) : null;
    const W = src.w, H = src.h, BACK = src.backmax;
    let front = 0, back = BACK;
    for (const r of ds) for (const c of r) if (c !== ".")
      front = Math.max(front, RAMP.indexOf(c), THIN.indexOf(c));
    if (bs) for (const r of bs) for (const c of r) back = Math.max(back, RAMP.indexOf(c));
    let D = front + back + 1;
    /* a sculpt replaces the extrusion outright: it already holds the body,
       and only the floor strip is still read off the text pair below */
    if (src.volume) { D = src.volume.d; front = src.volume.front; }
    const grid = new Uint8Array(W * H * D);
    let gridL = null, gridR = null;
    if (src.volume) {
      const cells = unrle(src.volume.rle, grid);
      if (cells !== grid.length)
        console.warn(`${src.name}: volume covers ${cells} of ${grid.length} cells`);
      if (src.volume.l && src.volume.r) {
        gridL = new Uint8Array(W * H * D); unrle(src.volume.l, gridL);
        gridR = new Uint8Array(W * H * D); unrle(src.volume.r, gridR);
      }
    }
    const ground = [];
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const v = VAL[vs[j][i]] || 0;
        const dc = ds[j][i];
        if (!v) continue;
        if (dc === ".") { ground.push(i, j, v); continue; }   /* the cast shadow strip */
        if (src.volume) continue;                             /* the sculpt is the body */
        /* the back map, where one exists. `~` and `.` are both no opinion and
           fall through to the mirror rule, so a half authored back is legal. */
        const b = bs ? RAMP.indexOf(bs[j][i]) : -1;
        const t = THIN.indexOf(dc);
        if (t >= 0 && b < 0) { grid[((front - t) * H + j) * W + i] = v; continue; }
        const f = t >= 0 ? t : RAMP.indexOf(dc);
        const k0 = front - f, k1 = front + (b >= 0 ? b : Math.min(f, BACK));
        for (let k = k0; k <= k1; k++) grid[(k * H + j) * W + i] = v;
      }
    }
    let half = 0;
    for (let a = 0; a <= 90; a++)
      half = Math.max(half, (W * Math.cos(a * RAD) + D * Math.sin(a * RAD)) / 2);
    let LW = W + 2 * Math.ceil(half - W / 2);
    if ((LW - W) % 2) LW += 1;      /* even padding keeps cell 0 on cell 0 at rest */
    /* the rig: row ranges, and the eye cells as a mask over the front grid */
    const head = src.head || [2, 13], torso = src.torso || [head[1] + 1, 35];
    const eyes = new Uint8Array(W * H);
    for (const [x, y] of src.eyes || []) eyes[y * W + x] = 1;
    const face = VAL[src.face] ?? 2;
    return { W, H, D, front, grid, gridF: grid, gridL, gridR, soft: !!src.volume, ground, LW, LH: H, head, torso, eyes, face, name: src.name };
  }

  /* ── the ray march: for one screen cell, which voxel and which face ── */
  function march(m, sx, j, sin, cos, out) {
    const { W, D, H, grid } = m;
    const cx = W / 2, cz = D / 2, R = 40;
    const x0 = sx * cos + R * sin + cx, z0 = sx * sin - R * cos + cz;
    const dx = -sin, dz = cos;
    let i = Math.floor(x0), k = Math.floor(z0);
    const stepX = dx > 0 ? 1 : -1;
    const tdx = dx === 0 ? Infinity : Math.abs(1 / dx), tdz = Math.abs(1 / dz);
    let tx = dx === 0 ? Infinity : (dx > 0 ? i + 1 - x0 : x0 - i) * tdx;
    let tz = (k + 1 - z0) * tdz;
    let face = 0;
    for (let n = 0; n < 160; n++) {
      if (tx < tz) { i += stepX; tx += tdx; face = stepX > 0 ? 1 : 2; }
      else { k += 1; tz += tdz; face = 0; }
      if (k >= D) return false;
      if (i < 0 || i >= W || k < 0) continue;
      const v = grid[(k * H + j) * W + i];
      if (v) { out.v = v; out.face = face; out.i = i; out.k = k; return true; }
    }
    return false;
  }

  function hash(i, j, k) {
    let h = (i * 374761393 + j * 668265263 + k * 2246822519) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  /* ── pose: everything a frame needs besides the grid ── */
  function makePose(H) {
    return {
      sin: [0, 0, 0], cos: [1, 1, 1],         /* legs, torso, head */
      rowMap: new Int16Array(H), rowPart: new Uint8Array(H),
      tilt: 0, tx: 0, bob: 0, fx: 0, blink: false, hem: 0,
    };
  }
  /* screen row → model row. Legs stay. The torso may rise a row (shrug) and
     doubles its hem row over the waist. The head rides the torso, may drop a
     row (nod, over the collar) or lift one (doubles the chin row). No frame
     can open a gap: every screen row between crown and feet maps somewhere. */
  function setRows(p, m, hy, rise, sh) {
    const rm = p.rowMap, rp = p.rowPart;
    rm.fill(-1);
    const h0 = m.head[0], h1 = m.head[1], t0 = m.torso[0], t1 = m.torso[1];
    for (let j = t1 + 1; j < m.H; j++) { rm[j] = j; rp[j] = 0; }
    for (let j = t0; j <= t1; j++) { const s = j + rise; if (s >= 0) { rm[s] = j; rp[s] = 1; } }
    if (rise < 0) { rm[t1] = t1; rp[t1] = 1; }
    const hs = rise + hy;
    for (let j = h0; j <= h1; j++) { const s = j + hs; if (s >= 0) { rm[s] = j; rp[s] = 2; } }
    if (hy < 0) { rm[h1 + rise] = h1; rp[h1 + rise] = 2; }
    /* the shrug: the shoulder band rises against a head that does not move,
       so the neck shortens. The row under the band doubles to close the gap,
       the same trick the hem uses. Written last, so it eats the jaw row. */
    if (sh > 0) {
      const band = Math.min(t0 + SHOULDER - 1, t1 - 1);
      for (let j = t0; j <= band; j++) { const s = j + rise - sh; if (s >= 0) { rm[s] = j; rp[s] = 1; } }
      const gap = band + rise;
      if (gap >= 0) { rm[gap] = band; rp[gap] = 1; }
    }
    p.hem = t1;
  }
  function setAngles(p, legs, torso, head) {
    p.sin[0] = Math.sin(legs * RAD);  p.cos[0] = Math.cos(legs * RAD);
    p.sin[1] = Math.sin(torso * RAD); p.cos[1] = Math.cos(torso * RAD);
    p.sin[2] = Math.sin(head * RAD);  p.cos[2] = Math.cos(head * RAD);
  }

  /* ── one frame ── */
  const hit = { v: 0, face: 0, i: 0, k: 0 };
  const bins = [[], [], [], [], []];
  let draws = 0;
  function draw(ctx, m, p, opts, resolved, noise) {
    const { H, W, LW, LH } = m;
    const px = opts.scale || PX;
    const glyphs = opts.glyphs === undefined ? px >= GLYPH_MIN : opts.glyphs;
    const off = (LW - W) / 2;
    ctx.clearRect(0, 0, LW * px, LH * px); draws++;
    for (let b = 0; b < 5; b++) bins[b].length = 0;

    /* the cast shadow strip is on the floor: it does not turn, only steps */
    const g = m.ground;
    for (let n = 0; n < g.length; n += 3) {
      ctx.fillStyle = PAL[g[n + 2]];
      ctx.fillRect((g[n] + off) * px + p.fx, g[n + 1] * px, px, px); draws++;
    }

    for (let sy = 0; sy < H; sy++) {
      const j = p.rowMap[sy];
      if (j < 0) continue;
      const part = p.rowPart[sy];
      const sin = p.sin[part], cos = p.cos[part];
      const lean = part === 2 ? p.tilt : 0;
      const ox = p.fx + (part ? p.tx : 0), oy = part ? p.bob : 0;
      /* the hem row stretches down by the breath so the waist never shows paper */
      const hh = part === 1 && sy === p.hem && oy < 0 ? px - oy : px;
      const y = sy * px + oy;
      for (let sx = 0; sx < LW; sx++) {
        const x = sx + 0.5 - LW / 2 - lean;
        if (!march(m, x, j, sin, cos, hit)) continue;
        if (hit.k < resolved) {
          const id = sy * LW + sx;
          if (!noise[id] || Math.random() < 0.3)
            noise[id] = DENSITY[1 + ((Math.random() * (DENSITY.length - 1)) | 0)];
          bins[2].push(noise[id], sx * px + ox + px / 2, y + px / 2);
          continue;
        }
        let v = hit.v;
        if (p.blink && m.eyes[j * W + hit.i]) v = m.face;
        if (hit.face) v = (m.soft ? SIDE_SOFT : SIDE)[v];
        ctx.fillStyle = PAL[v];
        ctx.fillRect(sx * px + ox, y, px, hh); draws++;
        if (!glyphs) continue;
        const gl = GLYPH[v];
        if (!gl) continue;
        const t = gl[0] + hash(hit.i, j, hit.k) * gl[1];
        const ch = DENSITY[Math.min(DENSITY.length - 1, (t * DENSITY.length) | 0)];
        if (ch !== " ") bins[gl[2]].push(ch, sx * px + ox + px / 2, y + px / 2);
      }
    }
    let any = false;
    for (let b = 1; b < 5; b++) if (bins[b].length) any = true;
    if (!any) return;
    ctx.font = Math.round(px * 1.15) + "px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let v = 1; v < 5; v++) {
      const b = bins[v];
      if (!b.length) continue;
      ctx.fillStyle = PAL[v];
      for (let n = 0; n < b.length; n += 3) { ctx.fillText(b[n], b[n + 1], b[n + 2]); draws++; }
    }
  }

  function prepare(canvas, m, opts) {
    const px = opts.scale || PX;
    canvas.width = m.LW * px; canvas.height = m.LH * px;
    canvas.style.width = m.LW * px + "px";
    canvas.style.height = m.LH * px + "px";
    return canvas.getContext("2d", { alpha: true });
  }

  /* ── the loop: one for every figure on the page ── */
  const figures = [];
  let raf = 0, skip = 0, t0 = 0, driven = false, vnow = 0, lastArrival = -1e9;
  let prevNow = 0;                      /* the real gap between frames, for the springs */
  let order = null;                     /* explicit neighbour order, if given */
  const stat = { ms: 0, avg: 0, max: 0, draws: 0, figures: 0, frames: 0 };
  const clock = () => (driven ? vnow : performance.now());

  function pick(f, attended) {
    const mix = f.T.mix;
    let total = 0;
    for (const n in mix) if (!(attended && ACTS[ACT_INDEX[n]].ch === 0)) total += mix[n];
    if (!total) return -1;
    let r = f.rng() * total;
    for (const n in mix) {
      if (attended && ACTS[ACT_INDEX[n]].ch === 0) continue;
      r -= mix[n];
      if (r <= 0) return ACT_INDEX[n];
    }
    return -1;
  }

  function neighbour(f, dir) {
    if (order) {
      const i = order.indexOf(f);
      return i < 0 ? null : order[i + dir] || null;
    }
    const r = f.canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bd = Infinity;
    for (const g of figures) {
      if (g === f || !g.seen) continue;
      const q = g.canvas.getBoundingClientRect();
      const gx = q.left + q.width / 2, gy = q.top + q.height / 2;
      if (Math.abs(gy - cy) > r.height * 0.6) continue;
      const d = (gx - cx) * dir;
      if (d > 0 && d < bd) { bd = d; best = g; }
    }
    return best;
  }

  function startAct(f, idx, now) {
    const a = ACTS[idx];
    f.act = idx; f.actT0 = now;
    f.actHold = (a.hold[0] + f.rng() * (a.hold[1] - a.hold[0])) * f.T.holdx;
    f.actAmp = a.amp * (a.sign && f.rng() < 0.5 ? -1 : 1);
    /* a glance toward a neighbour may be returned: temperament decides */
    if (a.ch === 0 && f.actAmp) {
      const dir = f.actAmp < 0 ? 1 : -1;            /* negative yaw looks to the viewer's right */
      const n = neighbour(f, dir);
      if (n && n.act < 0 && n.pending < 0 && n.attn === null && n.rng() < n.T.back) {
        n.pending = dir > 0 ? ACT_INDEX.glanceL : ACT_INDEX.glanceR;
        n.pendingAt = now + 300 + n.rng() * 700;
      }
    }
  }

  function step(now) {
    const s0 = performance.now();
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    /* the springs are integrated in seconds, not in frames, so a dropped
       frame or a driven step of any size lands the figure in the same place */
    const dt = clamp((now - (prevNow || now - FRAME)) / 1000, 1 / 240, DT_MAX);
    prevNow = now;
    draws = 0;
    let blinked = false, active = 0;
    for (let fi = 0; fi < figures.length; fi++) {
      const f = figures[fi];
      if (!f.seen || !f.visible || f.frozen) continue;
      active++;
      const T = f.T, p = f.pose;

      /* arrival: noise until this figure's slot, then back to front */
      let resolved = 0;
      if (f.decodeAt !== null) {
        const q = clamp((now - f.decodeAt) / 1000 / DECODE, 0, 1);
        resolved = f.m.D - Math.floor(q * f.m.D);
        if (resolved < f.hold) resolved = f.hold;
        if (q >= 1 && f.hold === 0) f.decodeAt = null;
      }

      /* blink: two frames, never two figures on one frame */
      if (now >= f.blinkAt) {
        if (blinked) f.blinkAt = now + FRAME * 2;
        else { f.blinkFrames = 2; f.blinkAt = now + expo(f.rng, T.blink * 1000); blinked = true; }
      }
      if (f.m.gridL) {
        if (f.head < -TURN_SWAP) f.turned = -1;
        else if (f.head > TURN_SWAP) f.turned = 1;
        else if (Math.abs(f.head) < TURN_BACK) f.turned = 0;
        f.m.grid = f.turned < 0 ? f.m.gridL : f.turned > 0 ? f.m.gridR : f.m.gridF;
      }
      p.blink = f.blinkFrames > 0 && !f.turned;
      if (p.blink) { f.blinkFrames--; blinked = true; }

      /* acts: one at a time, a returned glance first, else the clock */
      if (f.act < 0 && f.decodeAt === null) {
        if (f.pending >= 0 && now >= f.pendingAt) { startAct(f, f.pending, now); f.pending = -1; }
        else if (now >= f.nextAct) {
          const idx = pick(f, f.attn !== null);
          if (idx >= 0) startAct(f, idx, now);
          else f.nextAct = now + expo(f.rng, T.act * 1000);
        }
      }
      let ay = 0, hy = 0, tilt = 0, rise = 0, sh = 0, wx = 0, fx = 0;
      if (f.act >= 0) {
        const a = ACTS[f.act];
        const e = (now - f.actT0) / 1000;
        let k;
        if (e < a.in) k = shape(e / a.in);
        else if (e < a.in + f.actHold) k = 1;
        else if (e < a.in + f.actHold + a.out) k = back((e - a.in - f.actHold) / a.out);
        else { k = 0; f.act = -1; f.nextAct = now + expo(f.rng, T.act * 1000); }
        const v = f.actAmp * k;
        switch (a.ch) {
          case 0: ay = v; break;
          case 1: hy = Math.round(v); break;
          case 2: tilt = Math.round(v); break;
          case 3: sh = Math.round(v); break;
          case 4: wx = v; break;
          case 5: fx = v; break;
        }
      }

      /* yaw: the pointer wins, else idle noise plus the act; torso follows */
      const idle = T.idle * (
        NOISE[0][1] * Math.sin(TAU * t / NOISE[0][0] + f.ph[0]) +
        NOISE[1][1] * Math.sin(TAU * t / NOISE[1][0] + f.ph[1]) +
        NOISE[2][1] * Math.sin(TAU * t / NOISE[2][0] + f.ph[2]));
      const cmd = f.pin !== null ? f.pin
        : f.attn !== null ? f.attn
        : clamp(idle + ay, -MAX_TURN, MAX_TURN);
      const held = f.attn !== null || f.pin !== null;

      /* the head takes the command whole. Following a pointer or sitting on
         a pin is critically damped on purpose: overshooting something the
         reader is holding still reads as a fault, and on QUENT a bounce past
         a pinned 12 is exactly the angle where he stops being a face. */
      f.headV = link(f.head, f.headV, cmd, held ? f.wHeld : f.wHead, held ? 1 : f.zHead, dt);
      f.head = clamp(f.head + f.headV * dt, -MAX_TURN, MAX_TURN);

      /* the shoulders chase the COMMAND, not the head. That is the whole
         difference: a fraction of the head's current angle can only ever be
         the same move at a smaller size, while a slower spring on the same
         command arrives late, holds, and comes back late. And they ignore
         the first TORSO_DEAD degrees, so a glance stays head only and a real
         turn recruits the body. */
      const recruit = cmd > TORSO_DEAD ? cmd - TORSO_DEAD
        : cmd < -TORSO_DEAD ? cmd + TORSO_DEAD : 0;
      f.torsoV = link(f.torso, f.torsoV, recruit * T.follow, f.wTorso, f.zTorso, dt);
      f.torso = clamp(f.torso + f.torsoV * dt, -MAX_TURN, MAX_TURN);

      /* the hips: a share of the shoulders, less a term in how fast the head
         is moving. At the top of the move that term wins and the hips go the
         other way, which is the anticipation; at the hold it is zero and they
         sit under the shoulders; on the way back it flips and they carry past
         rest, which is the follow through. Clamped well inside the angle at
         which the near leg eats the gap between them. */
      const hips = f.plant * f.torso - f.counter * f.headV * 0.05;
      f.legsV = link(f.legs, f.legsV, clamp(hips, -LEG_MAX, LEG_MAX), f.wLegs, 1, dt);
      f.legs = clamp(f.legs + f.legsV * dt, -LEG_MAX, LEG_MAX);

      /* breath: a whole pixel, up, level, down, slightly irregular */
      const br = Math.sin(TAU * t / BREATH + f.ph[3] + 0.5 * Math.sin(TAU * t / BREATH_WOBBLE + f.ph[4]));
      p.bob = Math.round(0.9 * br);
      /* the weight: the upper body counterweights the turn by a whole pixel,
         the mass settling over the leg on the far side. It rides the torso
         angle, so it arrives with the shoulders and leaves with them. */
      p.tx = Math.round(wx + 0.6 * Math.sin(TAU * t / SWAY + f.ph[5]) + f.torso / WEIGHT);
      p.fx = Math.round(fx);
      p.tilt = tilt;
      setAngles(p, f.legs, f.torso, f.head);
      setRows(p, f.m, hy, rise, sh);
      draw(f.ctx, f.m, p, f.opts, resolved, f.noise);
    }
    const ms = performance.now() - s0;
    stat.ms = ms; stat.avg = stat.avg ? stat.avg * 0.9 + ms * 0.1 : ms;
    if (ms > stat.max) stat.max = ms;
    stat.draws = draws; stat.figures = active; stat.frames++;
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (++skip & 1) return;                       /* 30fps is plenty */
    step(performance.now());
  }
  function run() {
    if (raf || document.hidden || driven) return;
    /* after a hidden stretch every clock is overdue: spread them again */
    const now = performance.now();
    for (const f of figures) {
      if (f.blinkAt < now) f.blinkAt = now + expo(f.rng, f.T.blink * 1000);
      if (f.nextAct < now) f.nextAct = now + expo(f.rng, f.T.act * 1000);
    }
    raf = requestAnimationFrame(tick);
  }
  function halt() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener("visibilitychange", () => (document.hidden ? halt() : run()));

  function wake(f) {
    if (f.seen) return;
    f.seen = true;
    if (f.opts.instant) { f.decodeAt = null; return; }
    const now = clock();
    f.decodeAt = Math.max(now, lastArrival + ARRIVE);
    lastArrival = f.decodeAt;
  }
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => {
        /* the order of arrival is drawn fresh on every load */
        const list = Array.from(es).sort(() => Math.random() - 0.5);
        for (const e of list) {
          const f = figures.find((g) => g.canvas === e.target);
          if (!f) continue;
          if (e.isIntersecting) wake(f);
          f.visible = e.isIntersecting;
        }
      }, { threshold: 0.15 })
    : null;

  function nameOf(model, opts) {
    if (opts.name) return opts.name;
    if (model.name) return model.name;
    const all = window.crewModels || {};
    for (const k in all) if (all[k] === model) return k;
    return "";
  }

  function attend(x, y) {
    for (const f of figures) {
      if (x === null || x === undefined) { f.attn = null; continue; }
      const r = f.canvas.getBoundingClientRect();
      const cx = r.left + scrollX + r.width / 2, cy = r.top + scrollY + r.height * 0.2;
      const dx = x - cx, dy = y - cy;
      f.attn = dx * dx + dy * dy < f.T.radius * f.T.radius
        ? clamp(-Math.atan2(dx, FOCAL) / RAD, -MAX_TURN, MAX_TURN) : null;
    }
  }
  document.addEventListener("pointermove", (e) => attend(e.pageX, e.pageY), { passive: true });
  document.addEventListener("pointerleave", () => attend(null));

  function register(canvas, model, opts = {}) {
    const m = model.grid ? model : build(model);
    const ctx = prepare(canvas, m, opts);
    const name = nameOf(model, opts);
    const T = TEMPER[name] || DEFAULT_T;
    const seed = opts.seed ?? ((Math.random() * 0x7fffffff) ^ (figures.length * 0x9E3779B1)) >>> 0;
    const rng = mulberry(seed);
    const pose = makePose(m.H);
    if (REDUCED) {
      /* no motion: settled at the idle extreme, lit side to the reader,
         and the blink alone still runs, on its own clock */
      const paintRest = (blink) => {
        pose.blink = blink; setAngles(pose, -IDLE, -IDLE, -IDLE); setRows(pose, m, 0, 0);
        draw(ctx, m, pose, opts, 0, []);
      };
      paintRest(false);
      let timer = 0;
      const blink = () => {
        paintRest(true);
        setTimeout(() => paintRest(false), FRAME * 2);
        timer = setTimeout(blink, expo(rng, T.blink * 1000));
      };
      timer = setTimeout(blink, expo(rng, T.blink * 1000));
      return { canvas, model: m, name, act() {}, blink() { paintRest(true); setTimeout(() => paintRest(false), FRAME * 2); },
               turn() {}, freeze() {}, stop() { clearTimeout(timer); } };
    }
    const f = {
      canvas, ctx, m, opts, T, rng, pose, name,
      head: 0, torso: 0, legs: 0, headV: 0, torsoV: 0, legsV: 0, turned: 0,
      wHead: speed(T.ease, T.bounce ?? 0.8),
      wHeld: Math.max(omega(T.ease), W_HELD) * 2,
      wTorso: speed(T.ease, T.tbounce ?? 0.9) * (T.lag ?? 0.55),
      wLegs: omega(T.ease) * (T.lag ?? 0.55) * 1.8,
      zHead: T.bounce ?? 0.8, zTorso: T.tbounce ?? 0.9,
      plant: T.plant ?? 0.35, counter: T.counter ?? 1,
      attn: null, pin: null,
      ph: [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU],
      seen: false, visible: true, frozen: false,
      decodeAt: null, hold: opts.hold || 0, noise: [],
      blinkAt: clock() + expo(rng, T.blink * 1000), blinkFrames: 0,
      act: -1, actT0: 0, actHold: 0, actAmp: 0,
      nextAct: clock() + 1500 + expo(rng, T.act * 1000), pending: -1, pendingAt: 0,
    };
    figures.push(f);
    if (io && !opts.instant) io.observe(canvas); else wake(f);
    /* a viewer whose observer never fires would leave the cell empty */
    setTimeout(() => wake(f), 1200 + Math.random() * 60);
    run();
    return {
      canvas, model: m, name,
      act(n) { const i = typeof n === "number" ? n : ACT_INDEX[n]; if (i >= 0) { f.pending = -1; startAct(f, i, clock()); } },
      blink() { f.blinkFrames = 2; },
      turn(deg) { f.pin = deg === "" || deg === undefined ? null : deg; },
      freeze(on) {
        f.frozen = !!on;
        if (!on) return;
        /* rest: no act, breath at its midpoint, eyes open, everything at 0 */
        f.act = -1; f.head = 0; f.torso = 0; f.legs = 0;
        f.headV = 0; f.torsoV = 0; f.legsV = 0;
        pose.blink = false; pose.bob = 0; pose.tx = 0; pose.fx = 0; pose.tilt = 0;
        setAngles(pose, 0, 0, 0); setRows(pose, m, 0, 0);
        draw(ctx, m, pose, opts, 0, f.noise);
      },
      stop() { const i = figures.indexOf(f); if (i >= 0) figures.splice(i, 1); },
      _f: f,
    };
  }

  function paint(canvas, model, opts = {}) {
    const m = model.grid ? model : build(model);
    const ctx = prepare(canvas, m, opts);
    const pose = makePose(m.H);
    const a = opts.angle ?? 0;
    if (m.gridL) m.grid = a < -TURN_SWAP ? m.gridL : a > TURN_SWAP ? m.gridR : m.gridF;
    setAngles(pose, a, a, a); setRows(pose, m, 0, 0);
    pose.blink = !!opts.blink;
    draw(ctx, m, pose, opts, opts.resolved ?? 0, opts.noise || []);
    return m;
  }

  /* a virtual clock for sheets and tests: halts the rAF and advances by ms */
  function drive(ms) {
    if (!driven) { driven = true; halt(); vnow = performance.now(); }
    vnow += ms;
    step(vnow);
  }
  function neighbours(list) { order = list ? list.map((h) => h._f || h) : null; }
  function stats() { return { ...stat }; }

  window.crew3d = { register, paint, build, attend, neighbours, stats, drive, ACTS, TEMPER, DENSITY, PAL };
})();
