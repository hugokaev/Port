// Edit this list to add, remove or reorder photos.
// "src" must point to an image in the images/ folder.
// "title" and "detail" are shown as the caption under each image.
const PHOTOS = [
  { src: "images/Photo-2.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong", detail: "2026" },
  { src: "images/Photo-3.webp", title: "Chasing", detail: "2026" },
  { src: "images/Photo-4.webp", title: "Manon Servage for Volume", detail: "2026" },
  { src: "images/Photo-5.webp", title: "Chasing", detail: "2026" },
  { src: "images/Photo-6.webp", title: "Chasing", detail: "2026" },
  { src: "images/Photo-7.webp", title: "Manon Servage", detail: "2026" },
  { src: "images/Photo-8.webp", title: "Chasing", detail: "2026" },
  { src: "images/Photo-9.webp", title: "Milan Here", detail: "2026" },
  { src: "images/Photo-10.webp", title: "Manon Servage for Volume", detail: "2026" },
  { src: "images/Photo-11.webp", title: "Milan Here", detail: "2026" },
  { src: "images/Photo-12.webp", title: "Manon Servage", detail: "2026" },
  { src: "images/Photo-13.webp", title: "Manon Servage", detail: "2026" },
  { src: "images/Photo-14.webp", title: "Audio, Fijolla", detail: "2026" },
  { src: "images/Photo-15.webp", title: "Manon Servage", detail: "2026" },
  { src: "images/Photo-16.webp", title: "Denu Denudes for Cover", detail: "2025" },
  { src: "images/Photo-17.webp", title: "Denu Denudes for Volume", detail: "2025" },
  { src: "images/Photo-18.webp", title: "Cover", detail: "2025" },
  { src: "images/Photo-19.webp", title: "Mishko for Volume", detail: "2026" },
  { src: "images/Photo-20.webp", title: "O", detail: "2025" },
  { src: "images/Photo-21.webp", title: "Unbearable Lightness", detail: "2025" },
  { src: "images/Photo-22.webp", title: "Shout", detail: "2025" },
  { src: "images/Photo-23.webp", title: "Boko Yout for Pohoda", detail: "2026" },
  { src: "images/Photo-24.webp", title: "Boko Yout for Pohoda", detail: "2026" },
  { src: "images/Photo-25.webp", title: "Morphed Series", detail: "2024" },
  { src: "images/Photo-26.webp", title: "Block", detail: "2024" },
  { src: "images/Photo-27.webp", title: "Fur Legs", detail: "2025" },
  { src: "images/Photo-28.webp", title: "Boot", detail: "2024" },
];

(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const img = document.getElementById("galleryImage");
  if (!img) return; // not on the gallery page

  const caption = document.getElementById("galleryCaption");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let index = 0;

  function show(i) {
    index = (i + PHOTOS.length) % PHOTOS.length;
    const photo = PHOTOS[index];

    img.classList.remove("is-loaded");
    img.src = photo.src;
    img.alt = photo.title || "";

    caption.textContent = [photo.title, photo.detail].filter(Boolean).join(", ");
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

  show(0);
})();
