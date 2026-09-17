// Apple Watch style honeycomb of every photo, tiled endlessly.
// The lattice is infinite: cells are built as they come into reach and
// dropped once they leave, so panning never hits an edge. Each cell
// scales by how far it is from the centre of the screen.
(function () {
  const canvas = document.getElementById("watchCanvas");
  if (!canvas || typeof PHOTOS === "undefined") return;

  const N = PHOTOS.length;
  const cellSize = () =>
    parseFloat(getComputedStyle(canvas.parentElement).getPropertyValue("--watch-cell")) || 160;
  // Cells are nudged off the lattice so the field does not read as a
  // grid; the gap has to carry that wander without letting photos touch.
  const GAP = 32;
  const JX = 13, JY = 6;

  const thumb = (i) => "../" + PHOTOS[i].src.replace("images/web/", "images/thumb/");
  const ratios = PHOTOS.map((p) => p.ar || 0.75);

  // Stable pseudo-random value in [0,1) for a cell. Deterministic, so
  // panning away and back shows the same photo in the same spot rather
  // than reshuffling underneath you.
  function noise(q, r, salt) {
    let h = Math.imul(q + 0x1f1f, 0x27d4eb2d) ^
            Math.imul(r + 0x7a7a, 0x165667b1) ^
            Math.imul(salt, 0x9e3779b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2545f491);
    h ^= h >>> 13;
    h = Math.imul(h, 0x27d4eb2d);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // A fixed shuffle of the photos. Hashing coordinates straight to a
  // photo looks random but repeats far too often — at this density a
  // screenful would show the same shot two or three times. Walking the
  // lattice linearly instead keeps repeats many cells apart, and the
  // shuffle removes the run of consecutive photos that would otherwise
  // band across the screen.
  const ORDER = (() => {
    const a = Array.from({ length: N }, (_, i) => i);
    let s = 0x9e3779b9;
    for (let i = N - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  })();

  function photoAt(q, r) {
    const i = ((q + 7 * r) % N + N) % N;
    return ORDER[i];
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

  // Space the lattice by the widest and tallest photo actually in the
  // set, not by the square that bounds them. Every photo here is
  // upright, so pitching on height alone would leave the field far
  // emptier than it needs to be — while still adapting if a landscape
  // shot is ever added.
  function metrics() {
    const CELL = cellSize();
    let maxW = 0, maxH = 0;
    for (const r of ratios) {
      maxW = Math.max(maxW, r >= 1 ? CELL : CELL * r);
      maxH = Math.max(maxH, r >= 1 ? CELL / r : CELL);
    }
    const pitch = maxW + GAP;
    // Rows sit closer than a true hexagon, but leave room for a full
    // cell height plus the vertical wander, so photos cannot touch.
    return { CELL, pitch, row: Math.max(maxH + 2 * JY + 8, pitch * 0.866) };
  }

  // Each row slides sideways by an arbitrary fraction of the pitch. Rows
  // are already more than a full cell height apart, so nothing here can
  // collide — and it is what stops columns from lining up down the
  // screen, which per-cell jitter alone is far too small to break.
  function cellPos(q, r, m) {
    return {
      x: m.pitch * q + noise(0, r, 5) * m.pitch + (noise(q, r, 3) - 0.5) * 2 * JX,
      y: m.row * r + (noise(q, r, 4) - 0.5) * 2 * JY,
    };
  }

  function cellBox(index, CELL) {
    const ratio = ratios[index] || 0.75;
    return ratio >= 1
      ? { w: CELL, h: Math.round(CELL / ratio) }
      : { w: Math.round(CELL * ratio), h: CELL };
  }

  // The lattice cell nearest the middle that shows a given photo.
  function cellFor(index) {
    let best = null, bestD = Infinity;
    for (let r = -4; r <= 4; r++) {
      for (let q = -6; q <= 6; q++) {
        if (photoAt(q, r) !== index) continue;
        const d = Math.abs(q) + Math.abs(r) + Math.abs(q + r);
        if (d < bestD) { bestD = d; best = { q, r }; }
      }
    }
    return best || { q: 0, r: 0 };
  }

  function render() {
    if (zooming) return;

    const m = metrics();
    const CELL = m.CELL, pitch = m.pitch, row = m.row;

    // Cells fade to nothing at `radius`, so there is no point building
    // anything beyond that — this is what keeps an infinite grid cheap.
    const radius = Math.min(innerWidth, innerHeight) * 0.52;
    const reach = radius + pitch;
    const seen = new Set();

    const rMin = Math.floor((-panY - reach) / row);
    const rMax = Math.ceil((-panY + reach) / row);

    for (let r = rMin; r <= rMax; r++) {
      const shift = noise(0, r, 5) * pitch;
      const qMin = Math.floor((-panX - reach - shift) / pitch);
      const qMax = Math.ceil((-panX + reach - shift) / pitch);

      for (let q = qMin; q <= qMax; q++) {
        const p = cellPos(q, r, m);
        const x = p.x, y = p.y;
        const dx = x + panX, dy = y + panY;
        const d = Math.hypot(dx, dy);
        if (d > reach) continue;

        const key = q + "," + r;
        seen.add(key);
        const it = pool.get(key) || makeCell(q, r, key);

        const box = cellBox(it.index, CELL);
        const w = box.w, h = box.h;

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
  // Where this photo will sit on the photo page. Measured from a hidden
  // copy of that page's own markup rather than recomputed here, so the
  // landing spot cannot drift out of step with the stylesheet.
  function landingRect(ratio, caption) {
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;inset:0;display:flex;flex-direction:column;" +
      "visibility:hidden;pointer-events:none;z-index:-1";
    host.innerHTML =
      '<main class="gallery">' +
      '<button class="nav-arrow nav-prev">‹</button>' +
      // The real caption, not a placeholder: a caption long enough to
      // wrap makes the figure taller and lifts the photo, which a single
      // blank line would not predict.
      '<figure class="gallery-figure"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="nav-arrow nav-next">›</button>' +
      "</main>" +
      // The footer is empty but its padding shortens the photo area, and
      // leaving it out drops the landing point ~32px too low.
      '<footer class="site-footer"><p>&nbsp;</p></footer>';

    // An oversized box of the right shape is shrunk by max-width and
    // max-height to exactly where the real photo lands, so the file's
    // true pixel dimensions are never needed.
    const probe = host.querySelector(".gallery-figure img");
    probe.style.aspectRatio = String(ratio);
    probe.style.width = "4000px";
    probe.style.height = "auto";
    host.querySelector("figcaption").textContent = caption || "";

    document.body.appendChild(host);
    const rect = probe.getBoundingClientRect();
    host.remove();
    return rect;
  }

  function open(it) {
    if (moved > 8) return; // that was a drag, not a tap
    zooming = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }

    const thumb = it.el.querySelector("img");
    // The listed ratio is the full file's, which is what the photo page
    // will lay out from — the thumbnail's own can differ by rounding.
    const ratio = ratios[it.index];
    const from = thumb.getBoundingClientRect();
    const to = landingRect(ratio, PHOTOS[it.index].title);
    const full = "../" + PHOTOS[it.index].src;

    // Fly the photo itself. It starts as the thumbnail, which is already
    // decoded, and upgrades to the full file the moment that arrives —
    // same picture, so the swap is invisible.
    const flight = document.createElement("img");
    flight.className = "hero-flight";
    flight.src = thumb.currentSrc || thumb.src;
    flight.style.left = to.left + "px";
    flight.style.top = to.top + "px";
    flight.style.width = to.width + "px";
    flight.style.height = to.height + "px";
    flight.style.transformOrigin = "top left";
    flight.style.transform =
      "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) " +
      "scale(" + from.width / to.width + "," + from.height / to.height + ")";
    document.body.appendChild(flight);

    const upgrade = new Image();
    const ready = new Promise((resolve) => {
      upgrade.onload = () => { flight.src = full; resolve(); };
      upgrade.onerror = resolve;
    });
    upgrade.src = full;

    document.body.classList.add("is-leaving");

    try {
      sessionStorage.setItem("hk:hero", JSON.stringify({ i: it.index, ar: ratio }));
    } catch (e) { /* private browsing */ }

    // Commit the starting transform as its own style before changing it.
    // Without this flush the browser coalesces both values into one
    // change and the photo jumps to its destination with no animation.
    getComputedStyle(flight).transform;

    flight.style.transition = "transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)";
    flight.style.transform = "none";

    // Hand over once the flight has landed AND the full file is decoded,
    // otherwise the photo page can open on an empty frame while it
    // downloads. Capped so a stalled request cannot trap you here.
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      location.href = "/?i=" + it.index;
    };
    Promise.all([new Promise((r) => setTimeout(r, 540)), ready]).then(go);
    setTimeout(go, 2500);
  }

  // Arriving from a photo that shrank back into the grid: put that
  // photo's cell dead centre, where the flight just finished, and skip
  // the entrance so nothing moves underneath it.
  let landed = null;
  try {
    const raw = sessionStorage.getItem("hk:back");
    sessionStorage.removeItem("hk:back");
    if (raw) landed = JSON.parse(raw);
  } catch (e) { /* private browsing */ }

  if (landed && typeof landed.i === "number") {
    const spot = cellPos(cellFor(landed.i).q, cellFor(landed.i).r, metrics());
    panX = targetX = -spot.x;
    panY = targetY = -spot.y;
    introT = 1;
  }

  render();
  if (introT < 1) {
    requestAnimationFrame(function intro(ts) {
      if (!introStart) introStart = ts;
      introT = Math.min(1, (ts - introStart) / INTRO_MS);
      render();
      if (introT < 1) requestAnimationFrame(intro);
    });
  }
})();
