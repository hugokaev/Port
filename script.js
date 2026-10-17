// Take the address bar back. A link shared from Instagram arrives
// carrying utm_source, fbclid and a hundred characters of click id —
// none of it anything this site reads. Rather than list every tracking
// parameter ever invented, keep the one parameter the site actually
// uses and drop everything else, so the bar reads hugokae.com however
// the link was handed around.
(function () {
  const KEEPS = ["i"];                 // which photo to open, and nothing else
  try {
    const url = new URL(location.href);
    let dropped = false;
    for (const key of [...url.searchParams.keys()]) {
      if (KEEPS.indexOf(key) === -1) {
        url.searchParams.delete(key);
        dropped = true;
      }
    }
    // The fragment is nobody's business either, unless it is ours.
    const hash = url.hash && url.hash !== "#" ? url.hash : "";
    if (!dropped && hash === url.hash) return;
    history.replaceState(history.state, "", url.pathname + url.search + hash);
  } catch (e) { /* no history to rewrite: leave it as it came */ }
})();

// Edit this list to add, remove or reorder photos.
// "src" must point to an image in the images/ folder.
// "title" contains the caption (filename after Value(number))
const PHOTOS = [
  { src: "images/web/Value(51)Chasing,2026.webp?v=d1ef5f07", title: "Chasing,2026", ar: 0.6667 },
  { src: "images/web/Value(50)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp?v=815f4cfd", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7505 },
  { src: "images/web/Value(48)Chasing, 2026.webp?v=71b53fd5", title: "Chasing, 2026", ar: 0.7325 },
  { src: "images/web/Value(45)Audio, Fijolla, 2026.webp?v=732a716b", title: "Audio, Fijolla, 2026", ar: 0.7500 },
  { src: "images/web/Value(44)C.Protocol.webp?v=a4545517", title: "C.Protocol", ar: 0.7096 },
  { src: "images/web/Value(41)Manon Servage, 2026.webp?v=70380b1a", title: "Manon Servage, 2026", ar: 0.7150 },
  { src: "images/web/Value(40)August Amenoff for ADOLF MALDONADO.webp?v=a8640c56", title: "August Amenoff for ADOLF MALDONADO", ar: 0.6671 },
  { src: "images/web/Value(35)Manon Servage for Volume, 2026.webp?v=9b372a8a", title: "Manon Servage for Volume, 2026", ar: 0.7550 },
  { src: "images/web/Value(34)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp?v=7c0fcd54", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7502 },
  { src: "images/web/Value(33)Chasing, 2026.webp?v=73ec6377", title: "Chasing, 2026", ar: 0.6667 },
  { src: "images/web/Value(32)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp?v=676c42a3", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7500 },
  { src: "images/web/Value(30)Colour Series, 2026.webp?v=21f9630c", title: "Colour Series, 2026", ar: 0.7500 },
  { src: "images/web/Value(29)Chasing, 2026.webp?v=62480716", title: "Chasing, 2026", ar: 0.6667 },
  { src: "images/web/Value(28)ADOLF MALDONADO.webp?v=0f416a31", title: "ADOLF MALDONADO", ar: 0.6668 },
  { src: "images/web/Value(27)Chatchai.C.webp?v=7414cda7", title: "Chatchai.C", ar: 0.6671 },
  { src: "images/web/Value(26)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp?v=62953417", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7504 },
  { src: "images/web/Value(25)Manon Servage for Volume, 2026.webp?v=dd847a74", title: "Manon Servage for Volume, 2026", ar: 0.6821 },
  { src: "images/web/Value(24)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp?v=925c9687", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7546 },
  { src: "images/web/Value(23)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp?v=3a17748a", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7546 },
  { src: "images/web/Value(22)Manon Servage, 2026.webp?v=4aa3ed13", title: "Manon Servage, 2026", ar: 0.6833 },
  { src: "images/web/Value(21)Jun Kong for Chatchai.C.webp?v=e6b3e011", title: "Jun Kong for Chatchai.C", ar: 0.7792 },
  { src: "images/web/Value(20)Milan Here, 2026.webp?v=7585733d", title: "Milan Here, 2026", ar: 0.6937 },
  { src: "images/web/Value(19)Boko Yout for Pohoda, 2026.webp?v=16fb2828", title: "Boko Yout for Pohoda, 2026", ar: 0.6667 },
  { src: "images/web/Value(18)C.Protocol.webp?v=f18c319c", title: "C.Protocol", ar: 0.7875 },
  { src: "images/web/Value(17)Samuel Richards for ADOLF MALDONADO.webp?v=304d7484", title: "Samuel Richards for ADOLF MALDONADO", ar: 0.6668 },
  { src: "images/web/Value(16)Boko Yout for Pohoda, 2026.webp?v=76d243a1", title: "Boko Yout for Pohoda, 2026", ar: 0.6667 },
  { src: "images/web/Value(15)Milan Here, 2026.webp?v=44167591", title: "Milan Here, 2026", ar: 0.6971 },
  { src: "images/web/Value(14)Manon Servage, 2026.webp?v=ddbd9645", title: "Manon Servage, 2026", ar: 0.6667 },
  { src: "images/web/Value(13)Shai Fassom for Chatchai.C.webp?v=436dad3b", title: "Shai Fassom for Chatchai.C", ar: 0.6673 },
  { src: "images/web/Value(12)Manon Servage, 2026.webp?v=3ddd0ec0", title: "Manon Servage, 2026", ar: 0.7104 },
  { src: "images/web/Value(11)Denu Denudes for Cover, 2025.webp?v=c7026b0a", title: "Denu Denudes for Cover, 2025", ar: 0.7458 },
  { src: "images/web/Value(10)Denu Denudes for Volume, 2025.webp?v=d68f5ce2", title: "Denu Denudes for Volume, 2025", ar: 0.7348 },
  { src: "images/web/Value(9)Cover, 2025.webp?v=d0764c01", title: "Cover, 2025", ar: 0.7471 },
  { src: "images/web/Value(8)Mishko for Volume, 2026.webp?v=5d771d98", title: "Mishko for Volume, 2026", ar: 0.7358 },
  { src: "images/web/Value(7)O, 2025.webp?v=6962c783", title: "O, 2025", ar: 0.6350 },
  { src: "images/web/Value(6)Unbearable Lightness, 2025.webp?v=12c1a673", title: "Unbearable Lightness, 2025", ar: 0.7348 },
  { src: "images/web/Value(5)Shout, 2025.webp?v=4a5e94bd", title: "Shout, 2025", ar: 0.6658 },
  { src: "images/web/Value(4)Morphed Series, 2024.webp?v=63ba2ff8", title: "Morphed Series, 2024", ar: 0.6667 },
  { src: "images/web/Value(2)Block, 2024.webp?v=db09423f", title: "Block, 2024", ar: 0.7348 },
  { src: "images/web/Value(2)Fur Legs, 2025.webp?v=b8e2ec1d", title: "Fur Legs, 2025", ar: 0.7471 },
  { src: "images/web/Value(1)Boot, 2024.webp?v=d20a9ffe", title: "Boot, 2024", ar: 0.7471 },
];

// Order always follows the Value(n) number in the filename, highest first.
PHOTOS.sort((a, b) => {
  const val = (s) => parseInt((s.match(/Value\((\d+)\)/) || [0, 0])[1], 10);
  return val(b.src) - val(a.src);
});

(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const img = document.getElementById("galleryImage");
  if (!img) return; // not on the gallery page

  const caption = document.getElementById("galleryCaption");
  const countNow = document.getElementById("countNow");
  const countTotal = document.getElementById("countTotal");
  if (countTotal) countTotal.textContent = PHOTOS.length;
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let index = 0;

  // Keep neighbouring photos in the browser cache so navigation is instant.
  // Referenced by the map so the fetches are not garbage collected mid-flight.
  const AHEAD = 4;
  const BEHIND = 2;
  const preloaded = new Map();

  function preload(i) {
    const src = PHOTOS[(i + PHOTOS.length) % PHOTOS.length].src;
    if (preloaded.has(src)) return;
    const im = new Image();
    im.decoding = "async";
    im.src = src;
    preloaded.set(src, im);
  }

  function preloadAround(i) {
    for (let n = 1; n <= AHEAD; n++) preload(i + n);
    for (let n = 1; n <= BEHIND; n++) preload(i - n);
  }

  const figure = document.querySelector(".gallery-figure");

  // Say in the address bar which photo is actually on screen. Stepping
  // through the set used to leave the first photo's number behind in
  // the URL, so copying it sent somebody to a different picture. The
  // first photo is simply the site, so it carries no parameter at all.
  function mark() {
    try {
      const url = location.pathname + (index === 0 ? "" : "?i=" + index);
      history.replaceState(history.state, "", url);
    } catch (e) { /* nothing to rewrite */ }
  }

  function show(i) {
    // Read the direction before the wrap, so stepping off either end
    // still travels the way you asked rather than snapping back.
    const dir = i > index ? 1 : i < index ? -1 : 0;
    index = (i + PHOTOS.length) % PHOTOS.length;
    const photo = PHOTOS[index];
    mark();

    if (dir && figure) {
      figure.classList.remove("from-right", "from-left");
      void figure.offsetWidth; // restart the animation rather than ignore it
      figure.classList.add(dir > 0 ? "from-right" : "from-left");
    }

    img.classList.remove("is-loaded");
    img.src = photo.src;
    img.alt = photo.title || "";

    caption.textContent = [photo.title, photo.detail].filter(Boolean).join(", ");
    if (countNow) {
      countNow.textContent = String(index + 1).padStart(2, "0");
      if (dir) {
        countNow.classList.remove("rolling");
        void countNow.offsetWidth; // restart rather than ignore
        countNow.classList.add("rolling");
      }
    }

    // An already-cached photo fires no load event, so reveal it immediately
    // rather than leaving the frame blank.
    if (img.complete && img.naturalWidth) img.classList.add("is-loaded");

    preloadAround(index);
  }

  img.addEventListener("load", () => img.classList.add("is-loaded"));

  prevBtn.addEventListener("click", () => show(index - 1));
  nextBtn.addEventListener("click", () => show(index + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  const edge = document.getElementById("tapEdge");

  function lightEdge(dir) {
    if (!edge) return;
    edge.classList.remove("flash", "left", "right");
    void edge.offsetWidth; // restart rather than ignore a repeat tap
    edge.classList.add(dir > 0 ? "right" : "left", "flash");
  }

  // Mobile: click left/right halves to navigate
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 640) return; // only on mobile
    // Not every click target is an element — a click on the document
    // itself has no closest() and used to throw here.
    const hit = e.target;
    if (hit instanceof Element && hit.closest(".topbar")) return;
    if (e.clientY < 60) return; // ignore top area where contact button is

    const forward = e.clientX >= window.innerWidth / 2;
    lightEdge(forward ? 1 : -1);
    show(forward ? index + 1 : index - 1);
  });

  // basic touch swipe
  let touchStartX = null;
  document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) show(dx > 0 ? index - 1 : index + 1);
    touchStartX = null;
  }, { passive: true });

  const requested = parseInt(new URLSearchParams(location.search).get("i"), 10);
  const valid = Number.isInteger(requested) && requested >= 0 && requested < PHOTOS.length;

  // A photo opened from the grid is handed over mid-morph: give the
  // image its ratio up front so it occupies the right box before the
  // file loads, and leave the zoom to the transition rather than
  // animating on top of it.
  let handoff = null;
  try {
    const raw = sessionStorage.getItem("hk:hero");
    sessionStorage.removeItem("hk:hero");
    if (raw) handoff = JSON.parse(raw);
  } catch (e) { /* private browsing */ }

  const morphing = handoff && handoff.i === requested;
  if (morphing) {
    // The photo is already on screen at this exact size, so it must
    // appear instantly rather than zoom or fade into place.
    document.body.classList.add("no-fade");
  } else if (valid || document.referrer.indexOf("/gallery") !== -1) {
    document.body.classList.add("from-gallery");
  }

  show(valid ? requested : 0);

  // Show the tap hint once a visit. Repeating it every time would nag
  // about something you already know.
  (function () {
    const hint = document.getElementById("tapHint");
    if (!hint || !matchMedia("(max-width: 640px)").matches) return;
    try {
      if (sessionStorage.getItem("hk:tapped")) return;
      sessionStorage.setItem("hk:tapped", "1");
    } catch (e) { /* private browsing: show it, just do not remember */ }

    setTimeout(() => hint.classList.add("is-on"), 700);
    setTimeout(() => hint.classList.remove("is-on"), 3600);
    // Dismiss early once the gesture has been used.
    addEventListener("pointerdown", () => hint.classList.remove("is-on"), { once: true });
  })();

  // Where this photo sits in the grid: dead centre, because the grid is
  // told to open panned onto that cell. Measured from a hidden copy of
  // the grid's own markup so the cell size and origin come from the
  // stylesheet rather than being restated here.
  function gridLanding() {
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;inset:0;display:flex;flex-direction:column;" +
      "visibility:hidden;pointer-events:none;z-index:-1";
    host.innerHTML = '<main class="watch"><div class="watch-canvas"></div></main>';
    document.body.appendChild(host);
    const cell = parseFloat(
      getComputedStyle(host.querySelector(".watch")).getPropertyValue("--watch-cell")
    ) || 160;
    const origin = host.querySelector(".watch-canvas").getBoundingClientRect();
    host.remove();

    const ratio = PHOTOS[index].ar || 0.75;
    const w = ratio >= 1 ? cell : Math.round(cell * ratio);
    const h = ratio >= 1 ? Math.round(cell / ratio) : cell;
    return { left: origin.left - w / 2, top: origin.top - h / 2, width: w, height: h };
  }

  let flying = false;

  function flyToGallery() {
      // A second click would start a second flight and a second
      // navigation, and the page that lost the race arrives with nothing
      // telling it where to open.
      if (flying) return;
      flying = true;

      const from = img.getBoundingClientRect();
      const to = gridLanding();

      const flight = document.createElement("img");
      flight.className = "hero-flight";
      flight.src = img.currentSrc || img.src;
      flight.style.left = to.left + "px";
      flight.style.top = to.top + "px";
      flight.style.width = to.width + "px";
      flight.style.height = to.height + "px";
      flight.style.transformOrigin = "top left";
      flight.style.transform =
        "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) " +
        "scale(" + from.width / to.width + "," + from.height / to.height + ")";
      document.body.appendChild(flight);

      img.style.visibility = "hidden";
      document.body.classList.add("is-leaving");

      try {
        sessionStorage.setItem("hk:back", JSON.stringify({ i: index }));
      } catch (err) { /* private browsing */ }

      // Commit the starting transform before changing it, or the browser
      // coalesces both values and the photo jumps.
      getComputedStyle(flight).transform;
      flight.style.transition = "transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)";
      flight.style.transform = "none";

      setTimeout(() => { location.href = "/gallery/"; }, 540);
  }

  document.querySelectorAll('[data-zoom-to="/gallery/"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      flyToGallery();
    });
  });

  // Clicking the photo itself is the same move as the Gallery button:
  // it pulls back into the grid with this photo in the middle, which is
  // where the flight lands it. On a phone the two halves of the screen
  // already step through the photos, so that gesture is left alone.
  img.addEventListener("click", (e) => {
    if (window.innerWidth <= 640) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    flyToGallery();
  });
})();

// Zoom the current view out before following a top-bar link, so moving
// between views reads as one motion. The photo page handles its own
// link above, where it can fly the photo itself.
(function () {
  if (document.getElementById("galleryImage")) return;
  document.querySelectorAll("[data-zoom-to]").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      // Direction matters: heading for the grid pulls back, heading for
      // a single photo pushes in.
      document.body.classList.add(
        link.dataset.zoom === "in" ? "is-zooming-in" : "is-zooming-out"
      );
      setTimeout(() => { location.href = link.dataset.zoomTo; }, 370);
    });
  });
})();

// One small flourish on top of the ordinary cursor, which is left where
// it is: a thin ring that fades in around the pointer over anything that
// can be clicked, and follows a half-step behind the hand. Nothing is
// drawn the rest of the time, and nothing is hidden — the arrow, the
// hand and the grab cursor all behave as they always did.
//
// Only on a machine with a real pointer: a touchscreen has no cursor to
// decorate.
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  // The grid's frame is dragged rather than clicked, so it is not in
  // here; the photos inside it are buttons and are.
  const CLICKABLE = 'a, button, [role="button"], input, textarea, select, summary, ' +
                    '.watch-cell, #galleryImage';
  const root = document.documentElement;
  const slow = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = slow ? 1 : 0.3;

  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.appendChild(document.createElement("i"));
  document.body.appendChild(ring);

  let px = 0, py = 0;      // the pointer
  let rx = 0, ry = 0;      // the ring, trailing
  let raf = 0, over = false;

  function frame() {
    rx += (px - rx) * EASE;
    ry += (py - ry) * EASE;
    const caught = Math.abs(px - rx) < 0.3 && Math.abs(py - ry) < 0.3;
    if (caught) { rx = px; ry = py; }
    ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
    // Stop asking for frames as soon as it has caught up, and do not ask
    // at all while the ring is not being shown.
    raf = (caught || !over) ? 0 : requestAnimationFrame(frame);
  }

  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    px = e.clientX;
    py = e.clientY;

    const hit = e.target instanceof Element ? e.target : null;
    const now = !!(hit && hit.closest(CLICKABLE));
    if (now !== over) {
      over = now;
      root.classList.toggle("cursor-over", over);
      // Appear where the pointer is rather than sliding in from
      // wherever it was last seen.
      if (over) { rx = px; ry = py; }
    }
    if (!over) return;

    ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });

  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") root.classList.add("cursor-down");
  }, { passive: true });

  addEventListener("pointerup", () => root.classList.remove("cursor-down"), { passive: true });

  root.addEventListener("pointerleave", () => {
    over = false;
    root.classList.remove("cursor-over", "cursor-down");
  });

  addEventListener("touchstart", () => {
    over = false;
    root.classList.remove("cursor-over", "cursor-down");
  }, { passive: true });
})();

// The time in London under the office hours, and whether that time
// falls inside them. The hours themselves are printed above it in the
// markup; this only reads the clock and says which side of them we are
// on, so the two can never disagree about what the hours are.
(function () {
  const el = document.getElementById("contactClock");
  if (!el) return;

  const OPENS = 10, CLOSES = 18;          // as printed above: 10am to 6pm
  const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // Asked of London rather than of the reader's own clock, so it reads
  // the same in Los Angeles, and so that British Summer Time is the
  // browser's problem rather than a number written into the page.
  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function face(h, m) {
    const suffix = h < 12 ? "am" : "pm";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ":" + String(m).padStart(2, "0") + suffix;
  }

  function tick() {
    const parts = {};
    for (const p of when.formatToParts(new Date())) parts[p.type] = p.value;

    const day = DAY[parts.weekday];
    const h = Number(parts.hour) % 24;
    const m = Number(parts.minute);
    if (day === undefined || Number.isNaN(h)) return;

    const weekday = day >= 1 && day <= 5;
    const open = weekday && h >= OPENS && h < CLOSES;

    let tail;
    if (open) {
      tail = '<span class="contact-open">Open now</span>';
    } else {
      const next = weekday && h < OPENS ? "later today"
                 : day >= 1 && day <= 4 ? "tomorrow"
                 : "Monday";
      tail = "Closed &mdash; opens " + next;
    }

    el.innerHTML = face(h, m) + " in London &middot; " + tail;
  }

  tick();
  setInterval(tick, 30000);
})();

// Two small things the contact page can do once there is script to do
// them with: copy the address without opening a mail client, and let
// the name answer the cursor.
(function () {
  const mail = document.querySelector(".contact-item--mail");

  // Only offered where it can actually be done. A button that silently
  // fails is worse than no button, and the clipboard is unavailable on
  // an insecure origin and in some browsers outright.
  if (mail && navigator.clipboard && navigator.clipboard.writeText) {
    const address = mail.dataset.copy;
    const button = document.createElement("button");
    button.className = "contact-copy";
    button.type = "button";
    button.setAttribute("aria-label", "Copy " + address);
    const word = document.createElement("span");
    word.textContent = "Copy";
    // Announced rather than only drawn, since the only sign that it
    // worked is the word changing.
    word.setAttribute("aria-live", "polite");
    button.appendChild(word);
    mail.appendChild(button);

    let undo = 0;
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(address).then(() => {
        button.classList.add("is-done");
        word.textContent = "Copied";
        clearTimeout(undo);
        undo = setTimeout(() => {
          button.classList.remove("is-done");
          word.textContent = "Copy";
        }, 1900);
      }, () => { /* refused: say nothing rather than lie */ });
    });
  }

  // The name, letter by letter. Done here rather than in the markup so
  // the heading stays one word to a search engine or a screen reader
  // until the moment it is any use, and is skipped outright for anyone
  // who has asked for less movement.
  const name = document.querySelector(".contact-name");
  if (!name) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const text = name.textContent;
  name.textContent = "";
  for (const ch of text) {
    if (ch === " ") {
      name.appendChild(document.createTextNode(" "));
      continue;
    }
    const span = document.createElement("span");
    span.className = "contact-letter";
    span.textContent = ch;
    name.appendChild(span);
  }
})();
