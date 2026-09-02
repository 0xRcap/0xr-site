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
  /* Only WebKit runs out of decoders; Chromium and Firefox handle far more
     than any wall here will hold. Cap tightly there, stay out of the way
     everywhere else. */
  const WEBKIT = /safari/i.test(navigator.userAgent)
    && !/chrome|chromium|android|edg/i.test(navigator.userAgent);
  const LIVE_CAP = WEBKIT ? 8 : 32;
  const live = new Set();
  const pending = new Set();

  const start = (v) => { const p = v.play(); if (p) p.catch(() => {}); };

  function mount(v) {
    if (v.dataset.mounted || !v.dataset.src) return false;
    if (live.size >= LIVE_CAP) { pending.add(v); return false; }
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
    drain();
  }

  function drain() {
    for (const v of [...pending]) {
      if (live.size >= LIVE_CAP) break;
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

  /* the sweep: mount anything on screen that never mounted, nudge anything
     mounted that stalled paused, release anything far off screen once the
     cap is reached */
  const inView = (el, pad = 150) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -pad && r.top < innerHeight + pad && r.width > 0;
  };
  setInterval(() => {
    if (document.hidden) return;
    for (const v of document.querySelectorAll("video[data-src]")) {
      const seen = inView(v);
      if (seen && !v.dataset.mounted) mount(v);
      else if (!seen && v.dataset.mounted && live.size >= LIVE_CAP) release(v);
      else if (seen && v.dataset.mounted && v.paused) start(v);
    }
    drain();
  }, 1200);

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
  };
})();
