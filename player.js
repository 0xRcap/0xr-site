/* ── player: one video engine for every wall on the site ──
   index.html and work.html both show grids of autoplaying clips. They render
   different things, so only the engine is shared: what mounts a source, what
   releases it, and what guarantees a tile is never left frozen.

   Three constraints it exists to satisfy:

   1. WebKit caps live video decoders. Past the cap the extra tiles paint
      black, so a source is attached only while its tile is on screen and
      released on the way out. Every clip has a real poster underneath, so
      the worst case is a still rather than a hole.

   2. Autoplay needs the properties, not just the attributes, and play()
      rejects if it is called before anything is decoded. So: set muted and
      playsInline on the element, try play() now in case it is cached, and
      try again on canplay.

   3. Events alone are not enough. A missed observer batch, or a play() that
      rejects mid-load, would otherwise leave a tile frozen. The sweep below
      is the guarantee: events are the fast path, and anything they drop is
      picked up within a second.

   Usage:  mediaWall.observe(tileElement)     // tile contains one <video>
           mediaWall.reobserve(tileElement)   // after it becomes visible again
   The video inside carries its source on data-src, never on src. */
window.mediaWall = (() => {
  const WEBKIT = /safari/i.test(navigator.userAgent)
    && !/chrome|chromium|android|edg/i.test(navigator.userAgent);

  /* It is the phone that runs out of decoders, not Safari. Measured on
     desktop Safari: eight clips mounted and all eight played at readyState
     4, while twelve more sat unmounted waiting for a slot that never freed,
     because nothing scrolls off a wall that fits on one screen. The old cap
     of 8 was the whole bug, and it was ours, not the browser's.

     iPadOS reports itself as a Mac, so touch points are what separate a
     tablet from a desktop. */
  const APPLE_MOBILE = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  /* A ceiling we are willing to try, not one the browser has agreed to: if
     a browser cannot sustain it, the sweep below steps it down until it
     settles at what it can. */
  let cap = APPLE_MOBILE ? 6 : 32;
  const live = new Set();
  const pending = new Set();
  /* last seen currentTime per video, and how many sweeps it has sat still.
     A frozen clock is the only honest signal that a video is not playing:
     paused stays false on one Safari has quietly abandoned. */
  const progress = new WeakMap();

  /* why a play() was refused is the one fact this file used to throw away,
     and it is the fact that identifies an autoplay-policy block versus a
     decoder limit. Kept per video for the ?debug readout. */
  const refusals = new WeakMap();
  const start = (v) => {
    const p = v.play();
    if (p) p.catch((e) => refusals.set(v, e && e.name || "rejected"));
  };

  function mount(v) {
    if (v.dataset.mounted || !v.dataset.src) return false;
    if (live.size >= cap) { pending.add(v); return false; }
    v.dataset.mounted = "1";
    live.add(v);
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = "auto";
    v.src = v.dataset.src;
    v.addEventListener("canplay", () => start(v), { once: true });
    start(v);
    return true;
  }

  function release(v) {
    if (!v.dataset.mounted) return;
    v.pause();
    v.classList.remove("ready");
    v.removeAttribute("src");
    v.preload = "none";
    v.load();
    delete v.dataset.mounted;
    live.delete(v);
    progress.delete(v);
    drain();
  }

  /* give up this clip's slot but keep it in the queue, so a waiting clip
     can try while this one comes round again later */
  function evict(v) { release(v); pending.add(v); }

  function drain() {
    for (const v of [...pending]) {
      if (live.size >= cap) break;
      pending.delete(v);
      mount(v);
    }
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target.querySelector("video");
      if (!v) continue;
      if (e.isIntersecting) mount(v);
      else { pending.delete(v); release(v); }
    }
    drain();
  }, { rootMargin: "150px" });

  const inView = (el, pad = 150) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -pad && r.top < innerHeight + pad && r.width > 0;
  };

  /* ── the sweep ──
     Mount what is on screen, release what is far off it, and judge every
     mounted clip by whether its clock is moving. A video reporting
     paused:false while currentTime stands still is holding a decoder slot
     it is not using: it gets evicted so a waiting clip can take the slot.
     When that keeps happening the browser is telling us its real limit, so
     the cap settles just above what it is actually sustaining. */
  const STALL_SWEEPS = 3;    /* frozen clock, with data in hand */
  const LOAD_SWEEPS  = 12;   /* never got data at all */
  setInterval(() => {
    if (document.hidden) return;
    let zombies = 0;

    for (const v of document.querySelectorAll("video[data-src]")) {
      if (!inView(v)) {
        if (v.dataset.mounted && live.size >= cap) release(v);
        continue;
      }
      if (!v.dataset.mounted) { mount(v); continue; }
      if (v.paused) { start(v); continue; }

      const p = progress.get(v) || { t: -1, stalls: 0, waits: 0 };

      /* Only WebKit oversells its decoders, so only WebKit is policed. On
         a browser that plays the whole wall, nothing below can run and
         nothing below can break it. */
      if (!WEBKIT) continue;

      /* Still fetching. A clip legitimately sits at readyState 0 and time
         zero for a second or more after mounting, so it is not judged on
         the clock yet, only on a much longer fuse for never arriving. */
      if (v.readyState < 3) {
        if (++p.waits >= LOAD_SWEEPS) { zombies++; evict(v); continue; }
        progress.set(v, p);
        continue;
      }
      p.waits = 0;

      /* Has data and claims to be playing. If the clock is not moving it is
         holding a decoder slot it is not using: Safari's real failure. */
      if (v.currentTime > p.t + 0.01) p.stalls = 0;
      else if (++p.stalls >= STALL_SWEEPS) { zombies++; evict(v); continue; }

      p.t = v.currentTime;
      progress.set(v, p);
    }

    /* Each eviction is the browser declining one more stream than it can
       serve. Step down by one and let it settle, rather than snapping to a
       reading taken mid-load. */
    if (zombies) cap = Math.max(3, cap - 1);
    drain();
  }, 1000);

  /* if Safari refused the first play, the first gesture of any kind lifts the
     restriction. Retry everything live, once, then stop listening. */
  const retryAll = () => { for (const v of live) if (v.paused) start(v); };
  for (const ev of ["pointerdown", "touchstart", "keydown", "scroll"]) {
    window.addEventListener(ev, retryAll, { once: true, passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) retryAll();
  });

  /* reveal a clip as soon as there is a frame to show, so one that decoded
     but cannot autoplay still shows its own frame instead of staying blank */
  for (const ev of ["loadeddata", "playing"]) {
    document.addEventListener(ev, (e) => {
      if (e.target.tagName === "VIDEO") e.target.classList.add("ready");
    }, true);
  }

  return {
    observe: (el) => io.observe(el),
    reobserve: (el) => { io.unobserve(el); io.observe(el); },
    /* read-only, for ?debug */
    stats: () => ({ WEBKIT, cap, live: live.size, pending: pending.size }),
    refusalFor: (v) => refusals.get(v) || "",
  };
})();
