"use strict";

window.createTreeScene = function createTreeScene(canvas, markers, layers = {}) {
  const stage = layers.stage ?? canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const skyCanvas = layers.sky;
  const sky = skyCanvas ? skyCanvas.getContext("2d") : ctx;
  const gpuCanvas = layers.particles;
  const narrow = matchMedia("(max-width: 620px)").matches;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particles = IceParticles.generate(narrow);
  let nativePoints;
  try {
    nativePoints = IceParticles.gpuRenderer(gpuCanvas, particles.values);
  } catch {
    if (gpuCanvas) gpuCanvas.hidden = true;
  }
  const softwarePoints = IceParticles.fallbackRenderer(ctx, particles.values, layers.export ? 1 : 2);
  const random = IceParticles.randomGenerator(936201);
  const tau = Math.PI * 2;
  const state = {
    width: 0, height: 0, dpr: 1, x: 0, y: 0, zoom: 1, grain: 1,
    time: 0, yaw: -.12, cosine: 1, sine: 0, spread: 0, coil: 0
  };
  let scatterTarget = 0;
  let coilTarget = 0;
  let dynamic = 0;
  let frame = 0;
  let frameTime = 0;
  let dragId = null;
  let pointerX = 0;
  let inertia = 0;
  let paused = false;
  let front = 0;
  let flareAt = -10;
  const projection = {};
  const top = {};
  const ground = {};
  const orbit = { x: 0, y: 0, rx: 0, ry: 0, lean: -.11 };
  const orbitCos = Math.cos(orbit.lean);
  const orbitSin = Math.sin(orbit.lean);
  const iceFlakes = Array.from({ length: narrow ? 136 : 286 }, () => ({
    x: random(), y: random(), phase: random() * tau,
    size: .4 + Math.pow(random(), 4.5) * 2,
    speed: .004 + random() * .028, light: .11 + Math.pow(random(), 2) * .65
  }));

  const ornaments = [
    [.29, 1.51], [.47, 2.45], [.60, .66], [.61, 4.26], [.38, 5.54],
    [.73, 1.76], [.79, 2.97], [.85, 4.8], [.87, .7], [.93, 4.08]
  ];

  function glow(ink, x, y, radius, stops) {
    const light = ink.createRadialGradient(x, y, 0, x, y, radius);
    for (const [offset, color] of stops) light.addColorStop(offset, color);
    ink.fillStyle = light;
    ink.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const coldHaze = [[0, "#204b8a41"], [.64, "#12364c1b"], [1, "#0d234700"]];
  const nightHaze = [[0, "#17416c4e"], [.65, "#0f263d37"], [1, "#070f1c00"]];
  const starHalo = [[0, "#73d4ffe4"], [.13, "#229dfd94"], [.39, "#1361b341"], [1, "#10336600"]];
  const starCore = [[0, "#ffffff"], [.16, "#faffffff"], [.35, "#aae9ffdd"], [1, "#6ad0ff00"]];

  function drawSky() {
    const { width, height, zoom, time } = state;
    sky.globalCompositeOperation = "source-over";
    sky.globalAlpha = 1;
    sky.fillStyle = "#02050b";
    sky.fillRect(0, 0, width, height);
    glow(sky, state.x, state.y - zoom * 2.65, zoom * 8.1, nightHaze);
    glow(sky, state.x, state.y + zoom * 1.66, zoom * 6.25, coldHaze);
    IceParticles.project(0, IceParticles.foot, 0, state, ground);
    sky.save();
    sky.translate(state.x, ground.y + zoom * .31);
    sky.scale(1, .27);
    glow(sky, 0, 0, zoom * 7.7, [[0, "#4d9aee30"], [.4, "#25669816"], [1, "#071e3200"]]);
    sky.restore();
    for (const flake of iceFlakes) {
      const x = flake.x * width + Math.sin(time * .3 + flake.phase) * 12;
      const y = ((flake.y + time * flake.speed) % 1) * height;
      const pulse = .63 + .37 * Math.sin(time * 1.22 + flake.phase);
      sky.globalAlpha = flake.light * pulse;
      sky.fillStyle = "#d9eeff";
      sky.fillRect(x, y, flake.size, flake.size);
    }
    sky.globalAlpha = 1;
  }

  function drawRay(x, y, length, width, angle, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, 0, length, 0);
    gradient.addColorStop(0, "#fbffffe8");
    gradient.addColorStop(.09, "#a4e4ffff");
    gradient.addColorStop(.29, "#48aaf88f");
    gradient.addColorStop(1, "#146dff00");
    ctx.beginPath();
    ctx.moveTo(0, -width);
    ctx.quadraticCurveTo(length * .17, -width * .42, length, 0);
    ctx.quadraticCurveTo(length * .17, width * .42, 0, width);
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function drawStar() {
    IceParticles.project(0, IceParticles.crown + .43, 0, state, top);
    const { x, y, zoom } = top;
    const light = 1 - state.spread * .72;
    const flicker = .84 + .16 * Math.sin(state.time * 1.95);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = light * .83;
    glow(ctx, x, y, zoom * 1.47, starHalo);
    ctx.globalAlpha = light * .97;
    glow(ctx, x, y, zoom * .26, starCore);
    const angles = [-1.5, -.77, .05, .67, 1.42, 2.16, 3.02, 3.9];
    const lengths = [.94, 1.12, 1.57, 1.36, .87, 1.31, 1.62, 1.18];
    angles.forEach((angle, index) => {
      drawRay(x, y, lengths[index] * zoom, zoom * .041, angle, light * flicker * .77);
      drawRay(x, y, lengths[index] * zoom * 1.23, zoom * .114, angle, light * .16);
    });
    ctx.globalAlpha = light;
    ctx.fillStyle = "#f8ffff";
    ctx.beginPath();
    ctx.arc(x, y, zoom * .057, 0, tau);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawIcyTips() {
    const opacity = (1 - state.coil) * (1 - state.spread);
    if (opacity < .04) return;
    ctx.globalCompositeOperation = "lighter";
    for (let index = 0; index < particles.highlights.length; index++) {
      const [x, y, z] = particles.highlights[index];
      const p = IceParticles.project(x, y, z, state, projection);
      const pulse = Math.pow(.5 + .5 * Math.sin(state.time * (1.5 + .14 * (index % 5)) + index * 2.93), 8);
      if (pulse < .19 || p.depth < -.4) continue;
      const radius = p.zoom * (.044 + .034 * pulse);
      ctx.globalAlpha = pulse * opacity * .67;
      glow(ctx, p.x, p.y, radius, starCore);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawBoughs() {
    const opacity = (1 - state.coil) * (1 - Math.min(1, state.spread));
    if (opacity < .04) return;
    const branches = particles.boughs;
    for (const bough of branches) {
      bough.depth = bough.tip[2] * state.cosine - bough.tip[0] * state.sine;
    }
    branches.sort((a, b) => a.depth - b.depth);
    sky.lineWidth = Math.max(.35, state.zoom * .008);
    for (const bough of branches) {
      const tip = IceParticles.project(...bough.tip, state, projection);
      const tipY = tip.y;
      const baseY = IceParticles.project(...bough.root, state, projection).y;
      const fade = Math.max(.28, Math.min(.96, .66 + bough.depth * .108));
      const upper = Math.min(tipY, baseY) - state.zoom * .13;
      const lower = Math.max(tipY, baseY) + state.zoom * .1;
      const frost = sky.createLinearGradient(0, upper, 0, lower);
      frost.addColorStop(0, "#94d2ff76");
      frost.addColorStop(.35, "#457aaa8a");
      frost.addColorStop(.76, "#173757bc");
      frost.addColorStop(1, "#071422ac");
      sky.beginPath();
      for (const point of bough.edge) {
        const p = IceParticles.project(...point, state, projection);
        sky.lineTo(p.x, p.y);
      }
      sky.closePath();
      sky.globalAlpha = opacity * fade * .69;
      sky.fillStyle = frost;
      sky.fill();
      sky.beginPath();
      for (const [root, end] of bough.twigs) {
        const start = IceParticles.project(...root, state, projection);
        sky.moveTo(start.x, start.y);
        const tip = IceParticles.project(...end, state, projection);
        sky.lineTo(tip.x, tip.y);
      }
      sky.globalAlpha = opacity * fade * .45;
      sky.strokeStyle = "#9ed7ff";
      sky.stroke();
    }
    sky.globalAlpha = 1;
  }

  function drawLightWave() {
    const age = (state.time - flareAt) / 1.22;
    if (age < 0 || age >= 1) return;
    const radius = state.zoom * (.31 + (scatterTarget ? age : 1 - age) * 5.8);
    const y = state.y + state.zoom * (1.55 + age * 1.9);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#7ec8fd";
    ctx.globalAlpha = Math.sin(age * Math.PI) * .4;
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.ellipse(state.x, y, radius, radius * .22, -.04, 0, tau);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawOrnamentOrbit(reveal) {
    if (reveal < .02) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#8ec9fc";
    ctx.globalAlpha = reveal * .23;
    ctx.lineWidth = .76;
    ctx.setLineDash([1.1, 5.1]);
    ctx.beginPath();
    ctx.ellipse(orbit.x, orbit.y, orbit.rx, orbit.ry, orbit.lean, 0, tau);
    ctx.stroke();
    ctx.restore();
  }

  function moveOrnaments(reveal) {
    let nearest = -Infinity;
    const { coil, spread, zoom } = state;
    const expanded = String(reveal > .04);
    ornaments.forEach(([t, angle], index) => {
      const marker = markers[index];
      if (marker.dataset.expanded !== expanded) {
        marker.dataset.expanded = expanded;
        marker.tabIndex = expanded === "true" ? 0 : -1;
      }
      const morph = angle - coil * (t * tau * 7.85);
      const r = (.16 + 3.25 * t) * (1 + spread * .74);
      const y = IceParticles.crown - t * 8.24 + spread * (t * 5.9 - 2.9);
      const p = IceParticles.project(Math.cos(morph) * r, y, Math.sin(morph) * r, state, projection);
      marker.hidden = p.depth < .02 && reveal < .04;
      if (marker.hidden) return;
      const azimuth = index * tau / ornaments.length - Math.PI * .47 + state.yaw * .43;
      const ringX = Math.cos(azimuth) * orbit.rx;
      const ringY = Math.sin(azimuth) * orbit.ry;
      const x = p.x + (orbit.x + ringX * orbitCos - ringY * orbitSin - p.x) * reveal;
      const orbitY = orbit.y + ringX * orbitSin + ringY * orbitCos;
      const lift = paused || reduceMotion ? 0 : Math.sin(state.time * .92 + index * 1.79) * 2.3;
      const screenY = p.y + (orbitY + lift - p.y) * reveal;
      const ringDepth = Math.sin(azimuth);
      const scale = p.zoom / zoom * (1 - reveal) + (.97 + ringDepth * .043) * reveal;
      marker.style.setProperty("--charm-reveal", reveal.toFixed(3));
      marker.style.transform = `translate3d(${x.toFixed(1)}px,${screenY.toFixed(1)}px,0) translate(-50%,-50%) scale(${scale.toFixed(2)})`;
      const depth = p.depth * (1 - reveal) + ringDepth * reveal;
      marker.style.zIndex = String(14 + Math.round(depth * 4));
      if (depth > nearest) {
        nearest = depth;
        front = index;
      }
    });
  }

  function paint(timestamp) {
    frame = 0;
    if (!state.width || !state.height || document.hidden) return;
    const delta = frameTime ? Math.min((timestamp - frameTime) / 1000, .048) : 0;
    frameTime = timestamp;
    if (reduceMotion) {
      state.coil = coilTarget;
      state.spread = scatterTarget;
    } else {
      state.time += delta;
      if (dragId === null && !paused && !markers.includes(document.activeElement)) state.yaw += delta * (.095 + inertia);
      inertia *= Math.pow(.021, delta);
      state.coil += (coilTarget - state.coil) * Math.min(1, delta * 3.1);
      if (Math.abs(coilTarget - state.coil) < .001) state.coil = coilTarget;
      dynamic = (dynamic + (scatterTarget - state.spread) * delta * 50) * Math.exp(-7.1 * delta);
      state.spread = Math.max(0, Math.min(1.07, state.spread + dynamic * delta));
      if (Math.abs(scatterTarget - state.spread) + Math.abs(dynamic) < .002) {
        state.spread = scatterTarget;
        dynamic = 0;
      }
    }
    state.cosine = Math.cos(state.yaw);
    state.sine = Math.sin(state.yaw);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.width, state.height);
    sky.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    drawSky();
    drawBoughs();
    let drawn = false;
    if (nativePoints) {
      try {
        drawn = nativePoints.paint(state);
      } catch {
        nativePoints = null;
        gpuCanvas.hidden = true;
      }
    }
    if (!drawn) softwarePoints.paint(state);
    drawIcyTips();
    drawLightWave();
    drawStar();
    const appearance = Math.max(0, Math.min(1, (state.spread - .25) / .66));
    const reveal = appearance * appearance * (3 - 2 * appearance);
    drawOrnamentOrbit(reveal);
    moveOrnaments(reveal);
    if (layers.poster) layers.poster.hidden = true;
    if (!reduceMotion) requestPaint();
  }

  function requestPaint() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    state.width = width;
    state.height = height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.9);
    for (const layer of [canvas, skyCanvas, gpuCanvas]) {
      if (!layer) continue;
      layer.width = Math.round(width * state.dpr);
      layer.height = Math.round(height * state.dpr);
    }
    state.x = width / 2;
    state.y = height * .495;
    state.zoom = Math.min(width / 7.74, height / 13.8);
    state.grain = Math.min(1.21, Math.max(.82, state.zoom / 55));
    orbit.x = state.x;
    orbit.y = height * .472;
    orbit.rx = Math.min(width * .374, state.zoom * 6.74);
    orbit.ry = Math.min(height * .255, state.zoom * 3.82);
    requestPaint();
  }

  function endDrag(event) {
    if (event.pointerId !== dragId) return;
    dragId = null;
    stage.classList.remove("dragging");
  }

  stage.addEventListener("pointerdown", event => {
    if (event.target.closest("button") || !event.isPrimary || event.button !== 0) return;
    dragId = event.pointerId;
    pointerX = event.clientX;
    inertia = 0;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", event => {
    if (event.pointerId !== dragId) return;
    const step = event.clientX - pointerX;
    state.yaw += step * .009;
    inertia = Math.max(-1.7, Math.min(1.7, step * .082));
    pointerX = event.clientX;
    requestPaint();
  });
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("lostpointercapture", endDrag);
  stage.addEventListener("pointerover", event => { paused = Boolean(event.target.closest("button")); });
  stage.addEventListener("pointerleave", () => { paused = false; });
  stage.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    state.yaw += event.key === "ArrowLeft" ? -.24 : .24;
    requestPaint();
  });
  document.addEventListener("visibilitychange", () => {
    frameTime = 0;
    if (!document.hidden) requestPaint();
  });
  new ResizeObserver(resize).observe(stage);
  resize();

  return {
    scatter(value) {
      scatterTarget = Number(value);
      if (!reduceMotion) flareAt = state.time;
      requestPaint();
    },
    spiral(value) {
      coilTarget = Number(value);
      requestPaint();
    },
    turn(delta) {
      state.yaw += delta;
      requestPaint();
    },
    frontOrnament() {
      return front;
    }
  };
};
