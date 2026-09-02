/* ── scramble: the decode effect ──
   Each character cycles through random glyphs before resolving, left to
   right, so a heading appears to decode itself.

   Two constraints shape the implementation:

   1. THE SETTLED STATE IS PLAIN TEXT. The ghost and overlay exist only while
      a decode is running, then the element goes back to its own markup.
      Selectable, copyable, searchable, and unchanged for a screen reader.
      Keeping them in the DOM permanently would put the visible text inside a
      pointer-events:none layer and make the heading impossible to select.

   2. THE ANIMATION IS WRAPPED. The overlay is positioned against a wrapper
      rather than the element itself, because inset:0 resolves to the padding
      box: on a padded element the decoded text would sit above the real text
      and leave a gap beneath it.

   Layout cannot shift. While a decode runs, a hidden copy of the final text
   holds the exact width, wrapping and height, and the cycling glyphs animate
   out of flow on top of it.

   Markup:  <h2 data-scramble>Positioning</h2>
   Options: data-scramble="hover" | "view" (default) | "mount"
            data-delay="110"
            data-scramble-host on an ancestor widens the hover target */
(() => {
  const GLYPHS = "!<>-_\\/[]{}=+*^?#%·:;";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const nodes = [...document.querySelectorAll("[data-scramble]")];
  if (!nodes.length) return;

  const esc = (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c);

  function attach(el) {
    /* collapse ordinary whitespace only: U+00A0 is load bearing, it keeps
       bracketed groups like ( one ) from breaking across lines */
    const text = el.textContent.replace(/[ \t\n\r]+/g, " ").trim();
    /* the element's own markup: authored <br> line breaks live here, and
       restoring textContent alone would delete them on the first decode */
    const html = el.innerHTML;
    const trigger = el.dataset.scramble || "view";
    const delay = Number(el.dataset.delay ?? 110);
    let raf = 0, timer = 0, guard = 0, frame = 0, queue = [], wrap = null, overlay = null;

    const teardown = () => {
      clearTimeout(timer); clearTimeout(guard); cancelAnimationFrame(raf);
      if (wrap) { wrap.remove(); wrap = null; overlay = null; }
      el.innerHTML = html;            /* back to plain, selectable markup */
      el.style.position = "";
    };

    const build = () => {
      el.textContent = "";
      el.style.position = "relative";
      /* the wrapper is the positioning context, so the overlay lines up with
         the text rather than with the element's padding box */
      wrap = document.createElement("span");
      wrap.style.cssText = "position:relative;display:block";
      const ghost = document.createElement("span");
      ghost.textContent = text;
      ghost.style.visibility = "hidden";
      overlay = document.createElement("span");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.cssText = "position:absolute;inset:0;pointer-events:none";
      wrap.append(ghost, overlay);
      el.append(wrap);
    };

    const paint = () => {
      let html = "", done = 0;
      for (const q of queue) {
        const ch = q.to === " " ? "&nbsp;" : esc(q.to);
        if (frame >= q.end) { done++; html += ch; }
        else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.3) q.char = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          html += `<i class="sc">${q.char}</i>`;
        } else html += `<span style="visibility:hidden">${ch}</span>`;
      }
      overlay.innerHTML = html;
      return done;
    };

    const loop = () => {
      if (paint() === queue.length) { teardown(); return; }
      frame++;
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (wrap) return;                       /* already decoding, let it finish */
      build();
      frame = 0;
      queue = [...text].map((c) => {
        const s = (Math.random() * 14) | 0;
        return { to: c, start: s, end: s + 6 + ((Math.random() * 16) | 0), char: "" };
      });
      paint();
      timer = setTimeout(loop, delay);
      /* if rAF never ticks (backgrounded tab, throttled renderer) the text
         would be stranded in its ghost state and uncopyable. Always come back. */
      guard = setTimeout(teardown, 2500);
    };

    if (trigger === "mount") {
      start();
    } else {
      /* view is the default for everything, hover included: a subtitle decodes
         as the reader reaches its section. Hover targets can re-fire on the
         pointer as a second pass. */
      if (trigger === "hover")
        (el.closest("[data-scramble-host]") || el).addEventListener("pointerenter", start);
      let inside = false;
      new IntersectionObserver((es) => {
        for (const e of es) {
          if (e.isIntersecting && !inside) { inside = true; start(); }
          else if (!e.isIntersecting) inside = false;
        }
      }, { threshold: 0.4 }).observe(el);
    }
  }

  nodes.forEach(attach);
})();

/* ── reveal: things rise into place as they enter ──
   The hidden state is applied by script, never in the stylesheet, and a
   failsafe reveals everything after 1.2s. A browser that never fires the
   observer shows a complete page rather than a blank one. */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (!items.length) return;

  items.forEach((el, i) => { el.style.setProperty("--i", i % 6); el.classList.add("pre-reveal"); });
  const show = (el) => el.classList.remove("pre-reveal");

  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  items.forEach((el) => io.observe(el));

  setTimeout(() => items.forEach(show), 1200);
})();
