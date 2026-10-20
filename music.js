/* ── the player: a classic iPod that rises from the bottom when "wav" is pressed ──
   0xR is the artist. The screen has two views, as the real thing did: the track
   list and Now Playing. The click wheel works the same way: MENU goes back, the
   centre selects or plays, the sides skip, and turning the ring sets the volume.
   It sits above the glitch organism, so the music stays in reach through a
   takeover. Nothing loads until a track is played. */
(() => {
  const TRACKS = [
    { title: "Residue", artist: "0xR", album: "Residue", src: "/media/music/residue.mp3", cover: "/media/music/residue-cover.jpg" },
  ];
  const KEY = "0xr-music";
  const nav = document.querySelector(".bar nav");
  if (!nav) return;

  /* ── the nav button, with a small level meter while something plays ── */
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "music-btn";
  btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "ipod");
  btn.setAttribute("aria-label", "wav, the 0xR music player");   // the label is a file format; the name says what it opens
  btn.innerHTML = 'wav<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';
  nav.appendChild(btn);

  /* ── the device ── */
  const ICON = {
    play: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z"/></svg>',
    pause: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1h2v8H2zM6 1h2v8H6z"/></svg>',
    playpause: '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M1 1l5 4-5 4zM9 1h2v8H9zM13 1h2v8h-2z"/></svg>',
    prev: '<svg viewBox="0 0 14 10" aria-hidden="true"><path d="M1 1h2v8H1zM13 1v8L8 5zM8 1v8L3 5z"/></svg>',
    next: '<svg viewBox="0 0 14 10" aria-hidden="true"><path d="M11 1h2v8h-2zM1 1v8l5-4zM6 1v8l5-4z"/></svg>',
  };
  const pod = document.createElement("div");
  pod.className = "ipod"; pod.id = "ipod"; pod.hidden = true;
  pod.setAttribute("role", "dialog"); pod.setAttribute("aria-label", "0xR music player");
  pod.innerHTML = `
    <div class="ipod-screen">
      <div class="lcd-head"><span class="lcd-state" aria-hidden="true"></span><span class="lcd-title"></span><span class="lcd-batt" aria-hidden="true"></span></div>
      <div class="lcd-body" aria-live="polite"></div>
    </div>
    <div class="ipod-wheel">
      <button type="button" class="w-menu" aria-label="Menu">MENU</button>
      <button type="button" class="w-prev" aria-label="Previous">${ICON.prev}</button>
      <button type="button" class="w-next" aria-label="Next">${ICON.next}</button>
      <button type="button" class="w-play" aria-label="Play or pause">${ICON.playpause}</button>
      <button type="button" class="w-center" aria-label="Select"></button>
    </div>`;
  document.body.appendChild(pod);
  const $ = (s) => pod.querySelector(s);
  const head = $(".lcd-title"), state = $(".lcd-state"), body = $(".lcd-body");

  /* ── state, kept for the visit so the next page picks up where this one left ── */
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (e) {}
  let index = Math.min(saved.i || 0, TRACKS.length - 1), sel = index;
  let view = "list", volShownUntil = 0;
  const audio = new Audio(); audio.preload = "none";
  audio.volume = typeof saved.vol === "number" ? saved.vol : 0.6;
  let loaded = -1, want = false;                             // want: what the visitor asked for, which survives the browser pausing on the way out
  const load = (i) => {
    if (loaded === i) return;
    loaded = i; audio.src = TRACKS[i].src; audio.load();
  };
  const save = () => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ i: index, t: audio.currentTime || 0, playing: want, vol: audio.volume })); } catch (e) {}
  };

  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  function render() {
    const playing = !audio.paused;
    state.innerHTML = loaded >= 0 ? (playing ? ICON.play : ICON.pause) : "";
    btn.classList.toggle("playing", playing);
    if (view === "list") {
      head.textContent = "Music";
      body.innerHTML = '<ul class="lcd-list" role="listbox" aria-label="Tracks">' + TRACKS.map((t, i) =>
        `<li role="option" aria-selected="${i === sel}" data-i="${i}"><span>${t.title}</span><em>${t.artist}</em><b aria-hidden="true">&rsaquo;</b></li>`).join("") +
        "</ul>" + '<p class="lcd-foot">made with AI</p>';
      return;
    }
    const t = TRACKS[index];
    head.textContent = "Now Playing";
    const d = audio.duration, c = audio.currentTime || 0;
    const vol = performance.now() < volShownUntil;
    body.innerHTML = `
      <p class="lcd-count">${index + 1} of ${TRACKS.length}</p>
      <div class="lcd-now">
        <img src="${t.cover}" alt="">
        <div><strong>${t.title}</strong><span>${t.artist}</span><span>${t.album}</span></div>
      </div>
      ${vol
        ? `<div class="lcd-bar vol" aria-label="Volume"><i style="width:${Math.round(audio.volume * 100)}%"></i></div>
           <p class="lcd-times"><span>volume</span><span>${Math.round(audio.volume * 100)}</span></p>`
        : `<div class="lcd-bar"><i style="width:${d ? (c / d) * 100 : 0}%"></i></div>
           <p class="lcd-times"><span>${fmt(c)}</span><span>-${fmt((d || 0) - c)}</span></p>`}
      <p class="lcd-foot">made with AI</p>`;
  }
  /* the times are the only thing that changes while playing: update them in place */
  function tick() {
    if (view !== "now" || performance.now() < volShownUntil) return;
    const d = audio.duration, c = audio.currentTime || 0;
    const bar = body.querySelector(".lcd-bar i"), ts = body.querySelectorAll(".lcd-times span");
    if (bar) bar.style.width = (d ? (c / d) * 100 : 0) + "%";
    if (ts.length === 2) { ts[0].textContent = fmt(c); ts[1].textContent = "-" + fmt((d || 0) - c); }
  }

  /* ── what the controls do ── */
  const play = (i = index) => {
    if (i !== index) { index = i; loaded = -1; }
    load(index); want = true;
    audio.play().catch(() => {}).finally(render);
    setMeta();
  };
  const stop = () => { want = false; audio.pause(); render(); save(); };
  const toggle = () => { if (loaded < 0 || audio.paused) play(); else stop(); };
  const prev = () => {
    if (audio.currentTime > 3 || TRACKS.length === 1) { audio.currentTime = 0; if (loaded < 0) play(); return; }
    play((index - 1 + TRACKS.length) % TRACKS.length);
  };
  const next = () => {
    if (TRACKS.length === 1) { audio.currentTime = 0; if (loaded < 0 || audio.paused) play(); return; }
    play((index + 1) % TRACKS.length);
  };
  const select = () => {
    if (view === "list") { view = "now"; if (sel !== index || loaded < 0 || audio.paused) play(sel); else render(); }
    else toggle();
  };
  const menu = () => { if (view === "now") { view = "list"; sel = index; render(); } };
  const turn = (step) => {                                   // the ring: volume on Now Playing, selection on the list
    if (view === "now") {
      audio.volume = Math.max(0, Math.min(1, Math.round((audio.volume + step * 0.05) * 100) / 100));
      volShownUntil = performance.now() + 1400; render(); save();
      clearTimeout(turn.t); turn.t = setTimeout(render, 1450);
    } else { sel = Math.max(0, Math.min(TRACKS.length - 1, sel + step)); render(); }
  };

  audio.addEventListener("timeupdate", () => { tick(); if (!tick.s || performance.now() - tick.s > 2000) { tick.s = performance.now(); save(); } });
  audio.addEventListener("loadedmetadata", render);
  audio.addEventListener("play", () => { render(); save(); });
  audio.addEventListener("pause", render);
  audio.addEventListener("ended", () => (TRACKS.length > 1 ? play((index + 1) % TRACKS.length) : (audio.currentTime = 0, play())));
  addEventListener("pagehide", save);

  /* the phone's lock screen and headphone buttons speak to the same player */
  function setMeta() {
    if (!("mediaSession" in navigator)) return;
    const t = TRACKS[index];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album,
        artwork: [{ src: t.cover, sizes: "400x400", type: "image/jpeg" }] });
      navigator.mediaSession.setActionHandler("play", () => play());
      navigator.mediaSession.setActionHandler("pause", stop);
      navigator.mediaSession.setActionHandler("previoustrack", prev);
      navigator.mediaSession.setActionHandler("nexttrack", next);
    } catch (e) {}
  }

  /* ── the wheel: buttons press, the ring turns ── */
  let drag = null;
  const wheel = $(".ipod-wheel");
  const angle = (e) => { const r = wheel.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
  wheel.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".w-center")) return;
    drag = { a: angle(e), acc: 0, moved: false, id: e.pointerId };
  });
  wheel.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    let a = angle(e), d = a - drag.a; drag.a = a;
    if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    drag.acc += d;
    if (!drag.moved && Math.abs(drag.acc) > 0.12) { drag.moved = true; try { wheel.setPointerCapture(e.pointerId); } catch (_) {} }
    while (drag.moved && Math.abs(drag.acc) >= 0.26) {          // one click of the ring is 15 degrees
      const s = Math.sign(drag.acc); turn(s); drag.acc -= s * 0.26;
    }
  });
  const end = () => { setTimeout(() => { drag = null; }, 0); };
  wheel.addEventListener("pointerup", end); wheel.addEventListener("pointercancel", end);
  const press = (sel_, fn) => $(sel_).addEventListener("click", (e) => { if (drag && drag.moved) return; e.stopPropagation(); fn(); });
  press(".w-menu", menu); press(".w-prev", prev); press(".w-next", next); press(".w-play", toggle); press(".w-center", select);
  body.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]"); if (!li) return;
    sel = +li.dataset.i; select();
  });

  /* ── rising and falling ── */
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let open = false;
  const show = () => {
    if (open) return; open = true;
    const film = document.querySelector(".film-card .film-x");   // the THESEUS card shares the corner: it steps aside
    if (film) film.click();
    if (loaded >= 0) view = "now";
    render(); pod.hidden = false; btn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => requestAnimationFrame(() => pod.classList.add("up")));
    $(".w-center").focus({ preventScroll: true });
  };
  const hide = () => {
    if (!open) return; open = false;
    pod.classList.remove("up"); btn.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!open) pod.hidden = true; }, REDUCED ? 0 : 380);
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); open ? hide() : show(); });
  document.addEventListener("pointerdown", (e) => { if (open && !pod.contains(e.target) && !btn.contains(e.target)) hide(); });
  addEventListener("keydown", (e) => {
    if (!open || e.target.closest("input, textarea, [contenteditable]")) return;
    const k = e.key;
    if (k === "Escape") { hide(); btn.focus(); }
    else if (k === " " || k === "k") { e.preventDefault(); toggle(); }
    else if (k === "ArrowRight") next();
    else if (k === "ArrowLeft") prev();
    else if (k === "ArrowUp") { e.preventDefault(); turn(1); }
    else if (k === "ArrowDown") { e.preventDefault(); turn(-1); }
    else if (k === "Enter" && e.target === document.body) select();
    else return;
  });

  /* ── a visit that was playing picks up where it was; the browser may ask for a press first ── */
  if (saved.t > 0 || saved.playing) {
    load(index);
    want = !!saved.playing;
    /* a new page may not make sound until it is touched: if the browser says no, the music waits for the first press */
    const resume = () => { if (want && audio.paused) audio.play().catch(() => {}).finally(render); };
    const go = () => {
      try { audio.currentTime = saved.t || 0; } catch (e) {}
      if (want) audio.play().catch(() => {
        ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, resume, { once: true, capture: true }));
      }).finally(render);
    };
    if (audio.readyState >= 1) go(); else audio.addEventListener("loadedmetadata", go, { once: true });
    view = "now"; setMeta();
  }
  render();
})();
