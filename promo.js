/* ── the film card ──
   One thing to announce, on every page, in the site's own card language: the
   dark ink ground the crew bubble already uses. It is a card, not a modal:
   nothing is blocked, nothing is dimmed, and the page behind it stays usable.

   Two kinds of no. Closing it means not right now, so it is forgotten when the
   visit ends and the card is back next time. Watching the film means done, and
   that is kept for good: nobody needs telling twice about something they have
   already seen. */
(() => {
  const KEY = "0xr.film.theseus";
  const HREF = "https://www.youtube.com/watch?v=YIVVL7GtiGM";

  let done = false, hushed = false;
  try {
    done = localStorage.getItem(KEY) === "watched";
    hushed = sessionStorage.getItem(KEY) === "closed";
  } catch (e) { /* private window: the card simply shows */ }
  if (done || hushed) return;
  if (!document.body) return;

  const hush    = () => { try { sessionStorage.setItem(KEY, "closed"); } catch (e) {} };
  const watched = () => { try { localStorage.setItem(KEY, "watched"); } catch (e) {} };

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
    hush();
    setTimeout(() => card.remove(), 260);
  };

  card.querySelector(".film-x").addEventListener("click", close);
  card.querySelector(".film-go").addEventListener("click", watched);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && card.isConnected) close(); });

  document.body.appendChild(card);
  /* let the page arrive first: the hero gets its own moment before this does */
  setTimeout(() => card.classList.add("on"), 1400);
})();
