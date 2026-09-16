// Apple Watch style honeycomb of every photo.
// Cells sit on a hex grid; each one scales by how far it is from the
// centre of the screen, so panning brings photos forward as they arrive.
(function () {
  const canvas = document.getElementById("watchCanvas");
  if (!canvas || typeof PHOTOS === "undefined") return;

  const cellSize = () => (innerWidth <= 640 ? 92 : 128);
  let CELL = cellSize();
  const GAP = 18;

  // Axial hex directions, walked in rings out from the centre.
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

  function hexCells(n) {
    const cells = [{ q: 0, r: 0 }];
    for (let ring = 1; cells.length < n; ring++) {
      let q = -ring, r = ring;
      for (let side = 0; side < 6; side++) {
        for (let step = 0; step < ring; step++) {
          if (cells.length >= n) break;
          cells.push({ q, r });
          q += DIRS[side][0];
          r += DIRS[side][1];
        }
      }
    }
    return cells;
  }

  const cells = hexCells(PHOTOS.length);

  const items = cells.map((c, i) => {
    const photo = PHOTOS[i];

    const el = document.createElement("button");
    el.className = "watch-cell";
    el.type = "button";
    el.setAttribute("aria-label", photo.title);

    const im = document.createElement("img");
    im.src = "../" + photo.src.replace("images/web/", "images/thumb/");
    im.alt = photo.title;
    im.draggable = false;
    el.appendChild(im);

    canvas.appendChild(el);
    const item = { el, img: im, cell: c, ratio: 0, x: 0, y: 0, index: i };

    // Each photo keeps its own proportions, so the box can only be sized
    // once the real dimensions are known.
    im.addEventListener("load", () => {
      item.ratio = im.naturalWidth / im.naturalHeight;
      scheduleLayout();
    });
    return item;
  });

  let pending = false;
  function scheduleLayout() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      layout();
      clamp();
      update();
    });
  }

  let spanX = 0, spanY = 0;
  let panX = 0, panY = 0;

  function layout() {
    CELL = cellSize();
    const pitch = CELL + GAP;
    // Rows sit closer than a true hexagon, but never closer than a
    // full-height cell, so upright photos in adjacent rows cannot touch.
    const row = Math.max(CELL + GAP * 0.6, pitch * 0.866);

    for (const it of items) {
      const ratio = it.ratio || 0.75;
      const w = ratio >= 1 ? CELL : Math.round(CELL * ratio);
      const h = ratio >= 1 ? Math.round(CELL / ratio) : CELL;

      it.x = pitch * (it.cell.q + it.cell.r / 2);
      it.y = row * it.cell.r;
      it.el.style.width = w + "px";
      it.el.style.height = h + "px";
      it.el.style.left = it.x - w / 2 + "px";
      it.el.style.top = it.y - h / 2 + "px";
    }
    spanX = Math.max(...items.map((i) => Math.abs(i.x))) + CELL;
    spanY = Math.max(...items.map((i) => Math.abs(i.y))) + CELL;
  }

  // Input nudges a target; the cluster eases towards it each frame, so it
  // drifts rather than snapping to the pointer.
  const DRAG = 0.55;
  const WHEEL = 0.35;
  const EASE = 0.08;
  let targetX = 0, targetY = 0, raf = 0;

  function clamp() {
    const limX = Math.max(0, spanX - innerWidth / 2 + CELL);
    const limY = Math.max(0, spanY - innerHeight / 2 + CELL);
    targetX = Math.min(limX, Math.max(-limX, targetX));
    targetY = Math.min(limY, Math.max(-limY, targetY));
    panX = Math.min(limX, Math.max(-limX, panX));
    panY = Math.min(limY, Math.max(-limY, panY));
  }

  function glide() {
    if (raf) return;
    const step = () => {
      const dx = targetX - panX, dy = targetY - panY;
      if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
        panX = targetX;
        panY = targetY;
        raf = 0;
        update();
        return;
      }
      panX += dx * EASE;
      panY += dy * EASE;
      update();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function update() {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const radius = Math.min(innerWidth, innerHeight) * 0.52;
    canvas.style.transform = "translate3d(" + panX + "px," + panY + "px,0)";

    for (const it of items) {
      const dx = it.x + panX;
      const dy = it.y + panY;
      const t = Math.min(1, Math.hypot(dx, dy) / radius);
      const scale = Math.max(0.15, 1 - 0.85 * Math.pow(t, 1.3));
      it.el.style.transform = "scale(" + scale.toFixed(3) + ")";
      // Fades out well before the edges, which keeps the cluster clear of
      // the fixed header rather than colliding with it.
      it.el.style.opacity = Math.max(0, 1 - Math.pow(t, 1.5)).toFixed(3);
      it.el.style.zIndex = Math.round((1 - t) * 100);
    }
  }

  function panBy(dx, dy) {
    targetX += dx;
    targetY += dy;
    clamp();
    glide();
  }

  // --- dragging -----------------------------------------------------
  let dragging = false, lastX = 0, lastY = 0, moved = 0;

  // Deliberately no setPointerCapture here: capturing retargets the
  // click to the container, so a cell's own click never fires. Tracking
  // on window keeps the drag alive outside the element instead.
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

  function endDrag() {
    dragging = false;
  }
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  canvas.parentElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    panBy(-e.deltaX * WHEEL, -e.deltaY * WHEEL);
  }, { passive: false });

  addEventListener("resize", () => { layout(); clamp(); update(); });

  // --- opening a photo ----------------------------------------------
  // Zoom the whole cluster into the chosen cell, then hand over to the
  // main gallery positioned on that photo.
  for (const it of items) {
    it.el.addEventListener("click", () => {
      if (moved > 8) return; // that was a drag, not a tap
      canvas.style.transformOrigin = it.x + "px " + it.y + "px";
      canvas.classList.add("is-zooming");
      canvas.style.transform =
        "translate3d(" + panX + "px," + panY + "px,0) scale(8)";
      canvas.style.opacity = "0";
      document.body.classList.add("is-leaving");
      setTimeout(() => { location.href = "/?i=" + it.index; }, 420);
    });
  }

  layout();
  update();
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  // Hand transform control over to the frame loop once the entrance has
  // finished playing.
  setTimeout(() => canvas.classList.add("is-live"), 650);
})();
