// Edit this list to add, remove or reorder photos.
// "src" must point to an image in the images/ folder.
// "title" contains the caption (filename after Value(number))
const PHOTOS = [
  { src: "images/Value(51)Chasing,2026.webp", title: "Chasing,2026" },
  { src: "images/Value(50)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(48)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/Value(45)Audio, Fijolla, 2026.webp", title: "Audio, Fijolla, 2026" },
  { src: "images/Value(41)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/Value(31)Chasing,2026.webp", title: "Chasing,2026" },
  { src: "images/Value(30)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(29)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(28)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/Value(27)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(26)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(25)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026" },
  { src: "images/Value(24)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(23)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/Value(23)Freddie Taylor for Chatchai Chaitrakulthong, 2026.webp", title: "Freddie Taylor for Chatchai Chaitrakulthong, 2026" },
  { src: "images/Value(22)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/Value(21)Chasing, 2026.webp", title: "Chasing, 2026" },
  { src: "images/Value(21)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026" },
  { src: "images/Value(20)Milan Here, 2026.webp", title: "Milan Here, 2026" },
  { src: "images/Value(19)Boko Yout for Pohoda, 2026.webp", title: "Boko Yout for Pohoda, 2026" },
  { src: "images/Value(19)Boko Yout for Pohoda,2026.webp", title: "Boko Yout for Pohoda,2026" },
  { src: "images/Value(18)Manon Servage for Volume, 2026.webp", title: "Manon Servage for Volume, 2026" },
  { src: "images/Value(17)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/Value(16)Boko Yout for Pohoda, 2026.webp", title: "Boko Yout for Pohoda, 2026" },
  { src: "images/Value(15)Milan Here, 2026.webp", title: "Milan Here, 2026" },
  { src: "images/Value(14)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/Value(13)Audio, Fijolla, 2026.webp", title: "Audio, Fijolla, 2026" },
  { src: "images/Value(12)Manon Servage, 2026.webp", title: "Manon Servage, 2026" },
  { src: "images/Value(11)Denu Denudes for Cover, 2025.webp", title: "Denu Denudes for Cover, 2025" },
  { src: "images/Value(10)Denu Denudes for Volume, 2025.webp", title: "Denu Denudes for Volume, 2025" },
  { src: "images/Value(9)Cover, 2025.webp", title: "Cover, 2025" },
  { src: "images/Value(8)Mishko for Volume, 2026.webp", title: "Mishko for Volume, 2026" },
  { src: "images/Value(7)O, 2025.webp", title: "O, 2025" },
  { src: "images/Value(6)Unbearable Lightness, 2025.webp", title: "Unbearable Lightness, 2025" },
  { src: "images/Value(5)Shout, 2025.webp", title: "Shout, 2025" },
  { src: "images/Value(4)Morphed Series, 2024.webp", title: "Morphed Series, 2024" },
  { src: "images/Value(2)Block, 2024.webp", title: "Block, 2024" },
  { src: "images/Value(2)Fur Legs, 2025.webp", title: "Fur Legs, 2025" },
  { src: "images/Value(1)Boot, 2024.webp", title: "Boot, 2024" },
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
