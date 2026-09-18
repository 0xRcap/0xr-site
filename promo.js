/* ── the film card ──
   One thing to announce, on the home page only, in the site's own card
   language: the dark ink ground the crew bubble already uses. It is a card,
   not a modal: nothing is blocked, nothing is dimmed, and the page behind it
   stays usable.

   It keeps no memory. Every load of the home page shows it, because the film
   is the thing worth interrupting for and a visitor who closed it last week
   is not the same visitor. Closing it clears it for the page you are on. */
(() => {
  const HREF = "https://www.youtube.com/watch?v=YIVVL7GtiGM";
  if (!document.body) return;

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
    setTimeout(() => card.remove(), 260);
  };

  card.querySelector(".film-x").addEventListener("click", close);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && card.isConnected) close(); });

  document.body.appendChild(card);
  /* the hero gets its own moment first. Long enough to read the headline. */
  setTimeout(() => card.classList.add("on"), 2400);
})();
