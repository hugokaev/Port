// Apple Watch style honeycomb of every photo, tiled endlessly.
// The lattice is infinite: cells are built as they come into reach and
// dropped once they leave, so panning never hits an edge. Each cell
// scales by how far it is from the centre of the screen.
(function () {
  const canvas = document.getElementById("watchCanvas");
  if (!canvas || typeof PHOTOS === "undefined") return;

  const N = PHOTOS.length;
  const cellSize = () => (innerWidth <= 640 ? 112 : 160);
  const GAP = 18;

  const thumb = (i) => "../" + PHOTOS[i].src.replace("images/web/", "images/thumb/");

  // Aspect ratios are only known once the thumbnails load; until then a
  // cell is laid out upright, which is what every photo currently is.
  const ratios = new Array(N).fill(0);
  PHOTOS.forEach((p, i) => {
    const im = new Image();
    im.addEventListener("load", () => {
      ratios[i] = im.naturalWidth / im.naturalHeight;
      render();
    });
    im.src = thumb(i);
  });

  // Which photo belongs at a lattice cell. Stepping by 7 across rows
  // keeps all six neighbours different, and it is deterministic, so
  // panning back to a spot shows the same photo again.
  function photoAt(q, r) {
    const i = (q + 7 * r) % N;
    return i < 0 ? i + N : i;
  }

  const pool = new Map(); // "q,r" -> cell record
  let panX = 0, panY = 0, targetX = 0, targetY = 0, raf = 0, zooming = false;

  // You arrive here having pulled back from a single photo, so the grid
  // comes in large and settles, continuing that motion rather than
  // simply appearing.
  const INTRO_MS = 750;
  const INTRO_FROM = 1.3;
  let introT = 0, introStart = 0;

  function makeCell(q, r, key) {
    const index = photoAt(q, r);
    const el = document.createElement("button");
    el.className = "watch-cell";
    el.type = "button";
    el.setAttribute("aria-label", PHOTOS[index].title);

    const im = document.createElement("img");
    im.src = thumb(index);
    im.alt = PHOTOS[index].title;
    im.draggable = false;
    el.appendChild(im);

    const it = { el, index, x: 0, y: 0 };
    el.addEventListener("click", () => open(it));
    canvas.appendChild(el);
    pool.set(key, it);
    return it;
  }

  function render() {
    if (zooming) return;

    const CELL = cellSize();

    // Space the lattice by the widest and tallest photo actually in the
    // set, not by the square that bounds them. Every photo here is
    // upright, so pitching on height alone would leave the field far
    // emptier than it needs to be — while still adapting if a landscape
    // shot is ever added.
    let maxW = 0, maxH = 0;
    for (const r of ratios) {
      if (!r) continue;
      maxW = Math.max(maxW, r >= 1 ? CELL : CELL * r);
      maxH = Math.max(maxH, r >= 1 ? CELL / r : CELL);
    }
    if (!maxW) { maxW = CELL * 0.75; maxH = CELL; }

    const pitch = maxW + GAP;
    // Rows sit closer than a true hexagon, but never closer than a full
    // cell height, so upright photos in adjacent rows cannot touch.
    const row = Math.max(maxH + GAP * 0.6, pitch * 0.866);

    // Cells fade to nothing at `radius`, so there is no point building
    // anything beyond that — this is what keeps an infinite grid cheap.
    const radius = Math.min(innerWidth, innerHeight) * 0.52;
    const reach = radius + pitch;
    const seen = new Set();

    const rMin = Math.floor((-panY - reach) / row);
    const rMax = Math.ceil((-panY + reach) / row);

    for (let r = rMin; r <= rMax; r++) {
      const y = row * r;
      const qMin = Math.floor((-panX - reach) / pitch - r / 2);
      const qMax = Math.ceil((-panX + reach) / pitch - r / 2);

      for (let q = qMin; q <= qMax; q++) {
        const x = pitch * (q + r / 2);
        const dx = x + panX, dy = y + panY;
        const d = Math.hypot(dx, dy);
        if (d > reach) continue;

        const key = q + "," + r;
        seen.add(key);
        const it = pool.get(key) || makeCell(q, r, key);

        const ratio = ratios[it.index] || 0.75;
        const w = ratio >= 1 ? CELL : Math.round(CELL * ratio);
        const h = ratio >= 1 ? Math.round(CELL / ratio) : CELL;

        it.x = x;
        it.y = y;
        it.el.style.width = w + "px";
        it.el.style.height = h + "px";
        it.el.style.left = x - w / 2 + "px";
        it.el.style.top = y - h / 2 + "px";

        const t = Math.min(1, d / radius);
        it.el.style.transform = "scale(" + Math.max(0.15, 1 - 0.85 * Math.pow(t, 1.3)).toFixed(3) + ")";
        it.el.style.opacity = Math.max(0, 1 - Math.pow(t, 1.5)).toFixed(3);
        it.el.style.zIndex = Math.round((1 - t) * 100);
      }
    }

    for (const [key, it] of pool) {
      if (!seen.has(key)) {
        it.el.remove();
        pool.delete(key);
      }
    }

    const eased = 1 - Math.pow(1 - introT, 3);
    const introScale = INTRO_FROM + (1 - INTRO_FROM) * eased;
    canvas.style.transform =
      "translate3d(" + panX + "px," + panY + "px,0) scale(" + introScale.toFixed(4) + ")";
    canvas.style.opacity = eased.toFixed(3);
  }

  // Input nudges a target; the cluster eases towards it each frame, so it
  // drifts rather than snapping to the pointer.
  const DRAG = 0.55;
  const WHEEL = 0.35;
  const EASE = 0.08;

  function glide() {
    if (raf || zooming) return;
    const step = () => {
      const dx = targetX - panX, dy = targetY - panY;
      if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
        panX = targetX;
        panY = targetY;
        raf = 0;
        render();
        return;
      }
      panX += dx * EASE;
      panY += dy * EASE;
      render();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function panBy(dx, dy) {
    targetX += dx;
    targetY += dy;
    glide();
  }

  // --- dragging -----------------------------------------------------
  // Deliberately no setPointerCapture: capturing retargets the click to
  // the container, so a cell's own click would never fire.
  let dragging = false, lastX = 0, lastY = 0, moved = 0;

  canvas.parentElement.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    // A pointerup can be missed (released off-window, or swallowed by a
    // page transition), which would otherwise leave the cluster dragging
    // around with no button held.
    if (e.buttons === 0) { endDrag(); return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    panBy(dx * DRAG, dy * DRAG);
  });

  function endDrag() { dragging = false; }
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  canvas.parentElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    panBy(-e.deltaX * WHEEL, -e.deltaY * WHEEL);
  }, { passive: false });

  addEventListener("resize", render);

  // --- opening a photo ----------------------------------------------
  function open(it) {
    if (moved > 8) return; // that was a drag, not a tap
    zooming = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    // Push in on the chosen photo: it stays put while everything else
    // expands away around it.
    canvas.style.transformOrigin = it.x + "px " + it.y + "px";
    canvas.classList.add("is-zooming");
    canvas.style.transform =
      "translate3d(" + panX + "px," + panY + "px,0) scale(6)";
    canvas.style.opacity = "0";
    document.body.classList.add("is-leaving");
    setTimeout(() => { location.href = "/?i=" + it.index; }, 430);
  }

  render();
  requestAnimationFrame(function intro(ts) {
    if (!introStart) introStart = ts;
    introT = Math.min(1, (ts - introStart) / INTRO_MS);
    render();
    if (introT < 1) requestAnimationFrame(intro);
  });
})();
