/* ── his frame: hover his figure and a square closes around it, with his handles ──
   On the home stage and the crew page. The frame snaps (no fade), like the
   rest of the site's motion. On touch the first tap opens it and the handles
   then work as links; a tap anywhere else closes it. */
(() => {
  const HANDLES = [
    ["@0xRcap", "https://x.com/0xRcap", "Rodrigo on X"],
    ["in/rodrigo-rivas-yassin", "https://www.linkedin.com/in/rodrigo-rivas-yassin/", "Rodrigo on LinkedIn"],
  ];
  const figs = document.querySelectorAll('#stage canvas[data-crew="rodrigo"], .director [data-crew="rodrigo"] canvas.fig');
  for (const fig of figs) {
    const host = fig.parentElement;
    const box = document.createElement("div");
    box.className = "his-frame";
    const tags = document.createElement("span");
    tags.className = "his-tags";
    for (const [text, href, label] of HANDLES) {
      const a = document.createElement("a");
      a.href = href; a.target = "_blank"; a.rel = "noopener"; a.textContent = text; a.setAttribute("aria-label", label);
      tags.appendChild(a);
    }
    box.appendChild(tags);
    host.appendChild(box);

    // measured where the figure is drawn, so a CSS shift or scale on it is followed
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
    const place = () => {
      const f = fig.getBoundingClientRect(), h = host.getBoundingClientRect();
      const k = inked() || { x0: 0, y0: 0, x1: 1, y1: 1 };
      Object.assign(box.style, { left: f.left - h.left + f.width * k.x0 + "px", top: f.top - h.top + f.height * k.y0 + "px",
                                 width: f.width * (k.x1 - k.x0) + "px", height: f.height * (k.y1 - k.y0) + "px" });
    };
    place();
    new ResizeObserver(place).observe(fig);
    addEventListener("resize", place);
    setInterval(place, 600);                                     // the stage lays its figures out after load

    box.addEventListener("click", (e) => { if (!e.target.closest("a")) box.classList.add("open"); });
    document.addEventListener("pointerdown", (e) => { if (!box.contains(e.target)) box.classList.remove("open"); });
  }
})();
