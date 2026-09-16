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
    return { el, cell: c, x: 0, y: 0, index: i };
  });

  let spanX = 0, spanY = 0;
  let panX = 0, panY = 0;

  function layout() {
    CELL = cellSize();
    const pitch = CELL + GAP;
    const row = pitch * 0.866;
    for (const it of items) {
      it.x = pitch * (it.cell.q + it.cell.r / 2);
      it.y = row * it.cell.r;
      it.el.style.width = CELL + "px";
      it.el.style.height = CELL + "px";
      it.el.style.left = it.x - CELL / 2 + "px";
      it.el.style.top = it.y - CELL / 2 + "px";
    }
    spanX = Math.max(...items.map((i) => Math.abs(i.x))) + CELL;
    spanY = Math.max(...items.map((i) => Math.abs(i.y))) + CELL;
  }

  function clamp() {
    const limX = Math.max(0, spanX - innerWidth / 2 + CELL);
    const limY = Math.max(0, spanY - innerHeight / 2 + CELL);
    panX = Math.min(limX, Math.max(-limX, panX));
    panY = Math.min(limY, Math.max(-limY, panY));
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
    panX += dx;
    panY += dy;
    clamp();
    update();
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
    canvas.classList.add("is-dragging");
  });

  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    panBy(dx, dy);
  });

  function endDrag() {
    dragging = false;
    canvas.classList.remove("is-dragging");
  }
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  canvas.parentElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    panBy(-e.deltaX, -e.deltaY);
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
})();
