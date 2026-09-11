// Edit this list to add, remove or reorder photos.
// "src" must point to an image in the images/ folder.
// "title" and "detail" are shown as the caption under each image.
const PHOTOS = [
  { src: "images/Photo-2.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-3.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-4.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-5.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-6.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-7.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-8.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-9.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-10.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-11.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-12.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-13.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-14.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-15.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-16.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-17.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-18.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-19.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-20.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-21.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-22.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-23.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-24.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-25.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-26.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-27.webp", title: "Untitled", detail: "2026" },
  { src: "images/Photo-28.webp", title: "Untitled", detail: "2026" },
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
