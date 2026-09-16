// Edit this list to add, remove or reorder photos.
// "src" must point to an image in the images/ folder.
// "title" contains the caption (filename after Value(number))
const PHOTOS = [
  { src: "images/web/Value(51)Chasing,2026.webp", title: "Chasing,2026" },
  { src: "images/web/Value(50)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/web/Value(48)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/web/Value(45)Audio, Fijolla, 2026.webp", title: "Audio, Fijolla, 2026" },
  { src: "images/web/Value(41)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/web/Value(35)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026" },
  { src: "images/web/Value(34)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/web/Value(33)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/web/Value(32)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/web/Value(29)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/web/Value(26)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/web/Value(25)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026" },
  { src: "images/web/Value(24)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/web/Value(23)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/web/Value(22)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/web/Value(20)Milan Here, 2026.webp", title: "Milan Here, 2026" },
  { src: "images/web/Value(19)Boko Yout for Pohoda, 2026.webp", title: "Boko Yout for Pohoda, 2026" },
  { src: "images/web/Value(16)Boko Yout for Pohoda, 2026.webp", title: "Boko Yout for Pohoda, 2026" },
  { src: "images/web/Value(15)Milan Here, 2026.webp", title: "Milan Here, 2026" },
  { src: "images/web/Value(14)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/web/Value(12)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/web/Value(11)Denu Denudes for Cover, 2025.webp", title: "Denu Denudes for Cover, 2025" },
  { src: "images/web/Value(10)Denu Denudes for Volume, 2025.webp", title: "Denu Denudes for Volume, 2025" },
  { src: "images/web/Value(9)Cover, 2025.webp", title: "Cover, 2025" },
  { src: "images/web/Value(8)Mishko for Volume, 2026.webp", title: "Mishko for Volume, 2026" },
  { src: "images/web/Value(7)O, 2025.webp", title: "O, 2025" },
  { src: "images/web/Value(6)Unbearable Lightness, 2025.webp", title: "Unbearable Lightness, 2025" },
  { src: "images/web/Value(5)Shout, 2025.webp", title: "Shout, 2025" },
  { src: "images/web/Value(4)Morphed Series, 2024.webp", title: "Morphed Series, 2024" },
  { src: "images/web/Value(2)Block, 2024.webp", title: "Block, 2024" },
  { src: "images/web/Value(2)Fur Legs, 2025.webp", title: "Fur Legs, 2025" },
  { src: "images/web/Value(1)Boot, 2024.webp", title: "Boot, 2024" },
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
  if (Number.isInteger(requested) && requested >= 0 && requested < PHOTOS.length) {
    document.body.classList.add("from-gallery");
    show(requested);
  } else {
    show(0);
  }
})();

// Zoom the current view out before following a top-bar link, so moving
// between the single photo and the honeycomb reads as one motion.
(function () {
  document.querySelectorAll("[data-zoom-to]").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      document.body.classList.add("is-zooming-out");
      setTimeout(() => { location.href = link.dataset.zoomTo; }, 320);
    });
  });
})();
