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

  // The cache tag already on src is a hash of the web-sized file, so
  // rebuilding the thumbnails alone changes no URL and browsers keep
  // serving the old ones. Bump this whenever they are regenerated.
  const THUMBS = 2;
  const thumb = (i) =>
    "../" + PHOTOS[i].src.replace("images/web/", "images/thumb/") + "&t=" + THUMBS;
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
  // What the whole grid is currently scaled by. The entrance starts it
  // oversized, and a cursor read off the window has to be divided by it
  // to land on the right place in the grid.
  let viewScale = 1;

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

    // Everything that can reach the window, plus a cell of margin so a
    // photo is already built before it comes into view. The grid used to
    // fade out on a radius, which drew it as a disc floating in the page
    // with the corners left empty; it now runs to all four edges.
    const reachX = innerWidth / 2 + pitch;
    const reachY = innerHeight * 0.58 + row;
    const seen = new Set();

    const rMin = Math.floor((-panY - reachY) / row);
    const rMax = Math.ceil((-panY + reachY) / row);

    for (let r = rMin; r <= rMax; r++) {
      const shift = noise(0, r, 5) * pitch;
      const qMin = Math.floor((-panX - reachX - shift) / pitch);
      const qMax = Math.ceil((-panX + reachX - shift) / pitch);

      for (let q = qMin; q <= qMax; q++) {
        const p = cellPos(q, r, m);
        const x = p.x, y = p.y;
        const dx = x + panX, dy = y + panY;
        if (Math.abs(dx) > reachX || Math.abs(dy) > reachY) continue;

        const key = q + "," + r;
        seen.add(key);
        const it = pool.get(key) || makeCell(q, r, key);

        const box = cellBox(it.index, CELL);
        const w = box.w, h = box.h;

        it.x = x;
        it.y = y;
        it.w = w;
        it.h = h;
        it.el.style.width = w + "px";
        it.el.style.height = h + "px";
        it.el.style.left = x - w / 2 + "px";
        it.el.style.top = y - h / 2 + "px";
      }
    }

    for (const [key, it] of pool) {
      if (!seen.has(key)) {
        it.el.remove();
        pool.delete(key);
      }
    }

    const eased = 1 - Math.pow(1 - introT, 3);
    viewScale = INTRO_FROM + (1 - INTRO_FROM) * eased;
    canvas.style.transform =
      "translate3d(" + panX + "px," + panY + "px,0) scale(" + viewScale.toFixed(4) + ")";
    canvas.style.opacity = eased.toFixed(3);

    // Last, so that it reads this frame's pan rather than the one before
    // it, and so that cells about to be dropped are not warped first.
    dome();
  }

  // --- the warp ------------------------------------------------------
  // Think of the grid as a sheet of rubber with the photos printed on
  // it. The cursor pulls one point of that sheet towards the viewer, and
  // everything printed nearby is dragged out of shape by it: the photo
  // under the cursor swells, and the ones around it stretch and skew
  // towards it, each corner pulled by how near that corner is rather
  // than the photo as a whole.
  //
  // That is the difference from tilting each photo rigidly. Height is a
  // field over the whole sheet, read separately at every corner of every
  // photo, so two photos meeting at a seam read the same height there
  // and distort together instead of sliding past one another.
  const LIFT = 400;     // px the sheet rises at the cursor
  const DEPTH = 1000;   // viewing distance the risen sheet is seen through
  const BLUR = 5;       // px the far edges of the sheet are thrown out of focus
  const canHover = matchMedia("(hover: hover)").matches &&
                   !matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The cursor is kept in window coordinates, not grid coordinates. The
  // grid slides under a cursor that has not moved — whenever you pan or
  // scroll — so a position stored against the grid walks away from the
  // pointer until you nudge the mouse to correct it.
  //
  // It is never forgotten. A pointer that leaves the window, crosses a
  // bar laid over the grid or is simply never reported leaves the sheet
  // where it was rather than snapping flat, because the collapse and the
  // spring back are far more distracting than a swell sitting still. The
  // middle of the frame stands in until the pointer is first seen.
  let ptrX = null, ptrY = null;
  let domeX = 0, domeY = 0, peakCell = null;
  let released = false;

  // How far the sheet has risen under one point, and so how much the
  // view spreads it away from the cursor. The bell is squared to keep
  // the swell local: past a photo or two the sheet is flat again.
  function spread(x, y, reach) {
    const dx = x - domeX, dy = y - domeY;
    const g = 1 / (1 + (dx * dx + dy * dy) / (reach * reach));
    return DEPTH / (DEPTH - LIFT * g * g);
  }

  // The transform that lands a photo's own box on four arbitrary corners.
  // Four corners that are no longer a rectangle cannot be reached by
  // scaling and rotation — it takes a projective map, which is what the
  // bottom row of a matrix3d is for. The box is normalised to a unit
  // square first, so the same matrix works whatever the photo's size.
  function quadTransform(w, h, q) {
    const x0 = q[0], y0 = q[1], x1 = q[2], y1 = q[3],
          x2 = q[4], y2 = q[5], x3 = q[6], y3 = q[7];
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dy1 * dx2;

    let a, b, c, d, e, f, g, i;
    if (!den || (dx3 === 0 && dy3 === 0)) {
      // Still a parallelogram: no perspective term needed.
      g = i = 0;
      a = x1 - x0; b = x3 - x0; c = x0;
      d = y1 - y0; e = y3 - y0; f = y0;
    } else {
      g = (dx3 * dy2 - dy3 * dx2) / den;
      i = (dx1 * dy3 - dy1 * dx3) / den;
      a = x1 - x0 + g * x1; b = x3 - x0 + i * x3; c = x0;
      d = y1 - y0 + g * y1; e = y3 - y0 + i * y3; f = y0;
    }

    return "matrix3d(" +
      [a, d, 0, g, b, e, 0, i, 0, 0, 1, 0, c, f, 0, 1]
        .map((n) => n.toFixed(6)).join(",") +
      ") scale(" + 1 / w + "," + 1 / h + ")";
  }

  function dome() {
    if (!canHover) return;

    if (released) {
      for (const it of pool.values()) {
        it.el.style.transform = "";
        it.el.style.filter = "";
        it.el.classList.remove("is-peak");
      }
      peakCell = null;
      return;
    }

    const frame = canvas.parentElement;
    let px = ptrX, py = ptrY;
    if (px === null) {
      const f = frame.getBoundingClientRect();
      px = f.left + f.width / 2;
      py = f.top + f.height / 2;
    }

    // Where the cursor falls on the grid right now. The canvas is a
    // zero-sized point at the grid's origin, so its own box gives that
    // origin on screen — read every pass, since panning moves it — and
    // the distance from it is divided by whatever the grid is scaled by.
    const o = canvas.getBoundingClientRect();
    domeX = (px - o.left) / viewScale;
    domeY = (py - o.top) / viewScale;

    // Reach is tied to the pitch so the swell covers roughly the ring of
    // neighbours whatever the cells are sized at.
    const pitch = metrics().pitch;
    const reach = pitch * 1.05;
    const blurReach = pitch * 2.75;

    // The photo to name is the one the cursor is actually inside, not
    // the nearest centre: the cells are different shapes, so a tall
    // neighbour can be nearer the middle than the wide photo the cursor
    // is really on. Nearest is kept only for the gaps between cells.
    let peak = null, near = null, best = Infinity;

    for (const it of pool.values()) {
      if (!it.w) continue;
      const dx = it.x - domeX, dy = it.y - domeY;
      const d2 = dx * dx + dy * dy;
      if (d2 < best) { best = d2; near = it; }
      if (Math.abs(dx) <= it.w / 2 && Math.abs(dy) <= it.h / 2) peak = it;

      // Focus falls off with distance, on a much wider curve than the
      // warp, so the photos out at the edges go soft while the ones you
      // are among stay sharp. Quantised to half a pixel: a blur is
      // re-rendered whenever its radius changes, and the eye cannot tell
      // 2.5px from 2.6px anyway.
      const soft = d2 / (d2 + blurReach * blurReach);
      const px = Math.round(BLUR * soft * 2) / 2;
      it.el.style.filter = px > 0.25 ? "blur(" + px + "px)" : "";

      // Each corner is moved away from the cursor by however far the
      // sheet has risen beneath that corner. A corner facing the cursor
      // is carried further than the one behind it, which is what skews
      // the photo towards the swell rather than merely enlarging it.
      const L = it.x - it.w / 2, T = it.y - it.h / 2;
      const cx = [L, L + it.w, L + it.w, L];
      const cy = [T, T, T + it.h, T + it.h];
      const q = new Array(8);
      for (let k = 0; k < 4; k++) {
        const s = spread(cx[k], cy[k], reach);
        q[k * 2] = domeX + (cx[k] - domeX) * s - L;
        q[k * 2 + 1] = domeY + (cy[k] - domeY) * s - T;
      }
      it.el.style.transform = quadTransform(it.w, it.h, q);
    }

    // One cell is named outright. The warp is a smooth field, so nothing
    // in it can carry a cue that belongs only to the photo being pointed
    // at — the shadow that lifts it clear of the sheet.
    // In the gaps between photos, stay with the nearest one rather than
    // dropping the cue: letting it blink out as the cursor crosses a
    // seam is more distracting than being a few pixels generous.
    if (!peak && best <= (pitch * 0.75) * (pitch * 0.75)) peak = near;
    // Whatever the falloff says, the photo being pointed at is in focus.
    if (peak) peak.el.style.filter = "";
    if (peak !== peakCell) {
      if (peakCell) peakCell.el.classList.remove("is-peak");
      if (peak) peak.el.classList.add("is-peak");
      peakCell = peak;
    }
  }

  // Tracked on the page rather than on the frame. The top bar is laid
  // over the grid, so a cursor near the top edge was leaving the frame
  // and collapsing the whole warp, which sprang back the moment the
  // cursor dropped below the bar again. The pointer is only really gone
  // when it leaves the window.
  const page = document.documentElement;

  page.addEventListener("pointermove", (e) => {
    if (!canHover || e.pointerType === "touch") return;
    ptrX = e.clientX;
    ptrY = e.clientY;
    dome();
  });


  // Input nudges a target; the cluster eases towards it each frame, so it
  // drifts rather than snapping to the pointer.
  // Dragging tracks the pointer almost one to one — anything less reads
  // as the grid lagging behind your hand. The easing is kept only to
  // smooth the steps between frames, not to slow the movement down.
  const DRAG = 0.9;
  const WHEEL = 0.55;
  const EASE = 0.24;

  // A flick on a touchscreen should keep travelling after the finger
  // leaves; stopping dead on release is what makes a grid feel stuck to
  // the glass. Mouse dragging is left alone — there the pointer is still
  // there to steer with.
  const FRICTION = 0.94;      // speed kept per frame while coasting
  const MIN_FLICK = 0.06;     // px/ms — slower than this was a placement, not a throw
  const MAX_FLICK = 2.5;      // px/ms — cap so a hard swipe cannot bolt across
  let vx = 0, vy = 0, coasting = false, touchDrag = false;
  const trail = [];

  function glide() {
    if (raf || zooming) return;
    const step = () => {
      if (coasting) {
        targetX += vx;
        targetY += vy;
        vx *= FRICTION;
        vy *= FRICTION;
        if (Math.hypot(vx, vy) < 0.15) coasting = false;
      }
      const dx = targetX - panX, dy = targetY - panY;
      if (!coasting && Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
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
    // Catching a coasting grid should stop it where you touched it.
    coasting = false;
    vx = vy = 0;
    touchDrag = e.pointerType === "touch";
    trail.length = 0;
    trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
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
    trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (trail.length > 6) trail.shift();
    panBy(dx * DRAG, dy * DRAG);
  });

  // Speed at the moment of release, measured over the tail of the
  // gesture only — a finger that swept round and paused is not a throw,
  // and averaging the whole drag would say it was.
  function flick(now) {
    const recent = trail.filter((p) => now - p.t < 110);
    if (recent.length < 2) return;
    const a = recent[0], b = recent[recent.length - 1];
    const dt = b.t - a.t;
    if (dt <= 0) return;

    let sx = ((b.x - a.x) / dt) * DRAG;
    let sy = ((b.y - a.y) / dt) * DRAG;
    const speed = Math.hypot(sx, sy);
    if (speed < MIN_FLICK) return;
    if (speed > MAX_FLICK) {
      sx *= MAX_FLICK / speed;
      sy *= MAX_FLICK / speed;
    }

    vx = sx * 16; // px per frame at 60fps
    vy = sy * 16;
    coasting = true;
    glide();
  }

  function endDrag(e) {
    if (dragging && touchDrag) flick(e && e.timeStamp ? e.timeStamp : performance.now());
    dragging = false;
  }
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
      "</main>";

    const probe = host.querySelector(".gallery-figure img");
    host.querySelector("figcaption").textContent = caption || "";
    probe.style.height = "auto";
    document.body.appendChild(host);

    // Read the two limits separately rather than handing the browser an
    // oversized box of the right shape and trusting it to fit. Once a
    // width is definite, clamping the height does not pull the width
    // back in, so a photo constrained by both came out stretched.
    probe.style.aspectRatio = "100";          // absurdly wide: width binds
    probe.style.width = "20000px";
    const availW = probe.getBoundingClientRect().width;
    probe.style.aspectRatio = "0.005";        // absurdly tall: height binds
    const availH = probe.getBoundingClientRect().height;

    // Fit the real shape inside both, the way the photo page does.
    const w = Math.min(availW, availH * ratio);
    probe.style.aspectRatio = "auto";
    probe.style.width = w + "px";
    probe.style.height = w / ratio + "px";

    const rect = probe.getBoundingClientRect();
    host.remove();
    return rect;
  }

  function open(it) {
    if (moved > 8) return; // that was a drag, not a tap
    zooming = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }

    const thumb = it.el.querySelector("img");
    // The photo flies as a rectangle, so it has to leave from its own
    // rectangle rather than from a warped quad. Release the sheet first,
    // with this cell's transition suppressed so that what is measured is
    // what is on screen; the rest of the grid relaxes as it fades out.
    released = true;
    const held = it.el.style.transition;
    it.el.style.transition = "none";
    dome();
    thumb.getBoundingClientRect();
    it.el.style.transition = held;

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
