/* ── the frames: hover a figure and a square closes around it, with its tags ──
   On the home stage and the who page. He is the one human and his frame is mint,
   with his handles; the six are agents and theirs is orange, with what each one
   does. The frame snaps (no fade), like the rest of the site's motion. On touch
   the first tap opens it and his handles then work as links; a tap anywhere else
   closes it. */
(() => {
  const HUMAN = [
    ["human"],
    ["@0xRcap", "https://x.com/0xRcap", "Rodrigo on X"],
    ["in/rodrigo-rivas-yassin", "https://www.linkedin.com/in/rodrigo-rivas-yassin/", "Rodrigo on LinkedIn"],
  ];
  const ROLE = { ye: "brand", quent: "films", jean: "art direction", frank: "words", steve: "design", kim: "go to market" };
  const tagsFor = (who) => (who === "rodrigo" ? HUMAN : [["agent"], [ROLE[who]]]);

  const figs = document.querySelectorAll('#stage canvas[data-crew], .director [data-crew="rodrigo"] canvas.fig');
  for (const fig of figs) {
    const who = fig.dataset.crew || fig.closest("[data-crew]").dataset.crew;
    if (who !== "rodrigo" && !ROLE[who]) continue;
    const host = fig.parentElement;
    const box = document.createElement("div");
    box.className = "crew-frame " + (who === "rodrigo" ? "human" : "agent");
    const tags = document.createElement("span");
    tags.className = "crew-tags";
    for (const [text, href, label] of tagsFor(who)) {
      const t = document.createElement(href ? "a" : "span");
      if (href) { t.href = href; t.target = "_blank"; t.rel = "noopener"; t.setAttribute("aria-label", label); }
      if (text === "human" || text === "agent") t.className = "kind";
      t.textContent = text;
      tags.appendChild(t);
    }
    box.appendChild(tags);
    host.appendChild(box);

    // the frame hugs the drawn figure, not its canvas: read where the pixels are
    const inked = () => {
      try {
        const g = fig.getContext("2d"), w = fig.width, h = fig.height;
        const d = g.getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
          if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        return x1 < 0 ? null : { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h };
      } catch (e) { return null; }
    };
    // measured where the figure is drawn, so a CSS shift or scale on it is followed
    const place = () => {
      box.hidden = fig.offsetParent === null;                    // he leaves the stage under 600px
      if (box.hidden) return;
      const f = fig.getBoundingClientRect(), h = host.getBoundingClientRect();
      const k = inked() || { x0: 0, y0: 0, x1: 1, y1: 1 };
      Object.assign(box.style, { left: f.left - h.left + f.width * k.x0 + "px", top: f.top - h.top + f.height * k.y0 + "px",
                                 width: f.width * (k.x1 - k.x0) + "px", height: f.height * (k.y1 - k.y0) + "px" });
      // the hero clips at its foot, and on a phone the figures stand right on it:
      // the square's lower edge comes up to stay inside instead of being cut off
      const below = h.height - (f.top - h.top + f.height * k.y1);
      box.style.setProperty("--below", Math.max(0, Math.min(10, Math.floor(below) - 2)) + "px");
      // past the middle of the stage the tags hang from the frame's right edge, so they stay on screen
      box.classList.toggle("end", f.left + f.width / 2 - h.left > h.width * 0.6);
    };
    place();
    new ResizeObserver(place).observe(fig);
    addEventListener("resize", place);
    setInterval(place, 600);                                     // the stage lays its figures out after load

    box.addEventListener("click", (e) => { if (!e.target.closest("a")) box.classList.add("open"); });
    document.addEventListener("pointerdown", (e) => { if (!box.contains(e.target)) box.classList.remove("open"); });
  }
})();
