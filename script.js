// Edit this list to add, remove or reorder photos.
// "src" must point to an image in the images/ folder.
// "title" contains the caption (filename after Value(number))
const PHOTOS = [
  { src: "images/web/Value(51)Chasing,2026.webp", title: "Chasing,2026", ar: 0.6667 },
  { src: "images/web/Value(50)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7505 },
  { src: "images/web/Value(49)Colour Series, 2026.webp", title: "Colour Series, 2026", ar: 0.7500 },
  { src: "images/web/Value(48)Chasing, 2026.webp", title: "Chasing, 2026", ar: 0.7325 },
  { src: "images/web/Value(45)Audio, Fijolla, 2026.webp", title: "Audio, Fijolla, 2026", ar: 0.7500 },
  { src: "images/web/Value(41)Manon Servage, 2026.webp", title: "Manon Servage, 2026", ar: 0.7150 },
  { src: "images/web/Value(35)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026", ar: 0.7550 },
  { src: "images/web/Value(34)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7502 },
  { src: "images/web/Value(33)Chasing, 2026.webp", title: "Chasing, 2026", ar: 0.6667 },
  { src: "images/web/Value(32)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7500 },
  { src: "images/web/Value(29)Chasing, 2026.webp", title: "Chasing, 2026", ar: 0.6667 },
  { src: "images/web/Value(26)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7504 },
  { src: "images/web/Value(25)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026", ar: 0.6821 },
  { src: "images/web/Value(24)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7546 },
  { src: "images/web/Value(23)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026", ar: 0.7546 },
  { src: "images/web/Value(22)Manon Servage, 2026.webp", title: "Manon Servage, 2026", ar: 0.6833 },
  { src: "images/web/Value(20)Milan Here, 2026.webp", title: "Milan Here, 2026", ar: 0.6937 },
  { src: "images/web/Value(19)Boko Yout for Pohoda, 2026.webp", title: "Boko Yout for Pohoda, 2026", ar: 0.6667 },
  { src: "images/web/Value(16)Boko Yout for Pohoda, 2026.webp", title: "Boko Yout for Pohoda, 2026", ar: 0.6667 },
  { src: "images/web/Value(15)Milan Here, 2026.webp", title: "Milan Here, 2026", ar: 0.6971 },
  { src: "images/web/Value(14)Manon Servage, 2026.webp", title: "Manon Servage, 2026", ar: 0.6667 },
  { src: "images/web/Value(12)Manon Servage, 2026.webp", title: "Manon Servage, 2026", ar: 0.7104 },
  { src: "images/web/Value(11)Denu Denudes for Cover, 2025.webp", title: "Denu Denudes for Cover, 2025", ar: 0.7458 },
  { src: "images/web/Value(10)Denu Denudes for Volume, 2025.webp", title: "Denu Denudes for Volume, 2025", ar: 0.7348 },
  { src: "images/web/Value(9)Cover, 2025.webp", title: "Cover, 2025", ar: 0.7471 },
  { src: "images/web/Value(8)Mishko for Volume, 2026.webp", title: "Mishko for Volume, 2026", ar: 0.7358 },
  { src: "images/web/Value(7)O, 2025.webp", title: "O, 2025", ar: 0.6350 },
  { src: "images/web/Value(6)Unbearable Lightness, 2025.webp", title: "Unbearable Lightness, 2025", ar: 0.7348 },
  { src: "images/web/Value(5)Shout, 2025.webp", title: "Shout, 2025", ar: 0.6658 },
  { src: "images/web/Value(4)Morphed Series, 2024.webp", title: "Morphed Series, 2024", ar: 0.6667 },
  { src: "images/web/Value(2)Block, 2024.webp", title: "Block, 2024", ar: 0.7348 },
  { src: "images/web/Value(2)Fur Legs, 2025.webp", title: "Fur Legs, 2025", ar: 0.7471 },
  { src: "images/web/Value(1)Boot, 2024.webp", title: "Boot, 2024", ar: 0.7471 },
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

  function show(i) {
    index = (i + PHOTOS.length) % PHOTOS.length;
    const photo = PHOTOS[index];

    img.classList.remove("is-loaded");
    img.src = photo.src;
    img.alt = photo.title || "";

    caption.textContent = [photo.title, photo.detail].filter(Boolean).join(", ");

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

  // Mobile: click left/right halves to navigate
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 640) return; // only on mobile
    if (e.target.closest(".topbar")) return; // ignore header clicks
    if (e.clientY < 60) return; // ignore top area where contact button is

    const midpoint = window.innerWidth / 2;
    if (e.clientX < midpoint) {
      show(index - 1);
    } else {
      show(index + 1);
    }
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

  document.querySelectorAll('[data-zoom-to="/gallery/"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();

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
    });
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
