/* ── the film card ──
   One thing to announce, on every page, in the site's own card language: the
   dark ink ground the crew bubble already uses. It is a card, not a modal:
   nothing is blocked, nothing is dimmed, and the page behind it stays usable.

   It shows once. A dismissal is remembered, and so is a click through to the
   film, because someone who has watched it does not need telling again. */
(() => {
  const KEY = "0xr.film.theseus";
  const HREF = "https://www.youtube.com/watch?v=YIVVL7GtiGM";

  let seen = false;
  try { seen = localStorage.getItem(KEY) === "1"; } catch (e) { /* private window */ }
  if (seen) return;
  if (!document.body) return;

  const remember = () => { try { localStorage.setItem(KEY, "1"); } catch (e) {} };

  const card = document.createElement("aside");
  card.className = "film-card";
  card.setAttribute("aria-label", "New film");
  card.innerHTML =
      '<button class="film-x" type="button" aria-label="Close">&times;</button>'
    + '<a class="film-go" href="' + HREF + '" target="_blank" rel="noopener">'
    +   '<span class="film-shot"><img src="media/theseus/theseus.jpg" alt="" loading="lazy"></span>'
    +   '<span class="film-lab">New film</span>'
    +   '<span class="film-h">THESEUS</span>'
    +   '<span class="film-t">My first short AI film, made in about 100 hours '
    +     'for the Lumara Film&nbsp;Festival.</span>'
    +   '<span class="film-cta">Watch it &#8599;</span>'
    + '</a>';

  const close = () => {
    card.classList.remove("on");
    remember();
    setTimeout(() => card.remove(), 260);
  };

  card.querySelector(".film-x").addEventListener("click", close);
  card.querySelector(".film-go").addEventListener("click", remember);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && card.isConnected) close(); });

  document.body.appendChild(card);
  /* let the page arrive first: the hero gets its own moment before this does */
  setTimeout(() => card.classList.add("on"), 1400);
})();
