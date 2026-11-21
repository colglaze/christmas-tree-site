"use strict";

window.IceParticles = (() => {
  const stride = 13;
  const tau = Math.PI * 2;
  const crown = 4.58;
  const foot = -4.25;
  const cameraDistance = 25;
  const pitch = .253;
  const tiltCos = Math.cos(pitch);
  const tiltSin = Math.sin(pitch);

  function randomGenerator(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function generate(narrow) {
    const random = randomGenerator(552312);
    const positions = [];
    const detail = narrow ? .66 : 1;
    const treeHeight = crown - foot;
    const highlights = [];
    const boughs = [];

    function add(fir, coil, sea, size, frosted, spiral) {
      positions.push(...fir, ...coil, ...sea, size, random(), frosted, spiral);
    }

    function halo(t, radius, jitter) {
      const a = random() * tau;
      return [Math.cos(a) * radius, crown - t * treeHeight + (random() - .5) * jitter, Math.sin(a) * radius];
    }

    function coilAt(t, jitter) {
      const angle = 1.8 - tau * 7.85 * t;
      const sigma = random() + random() - 1;
      const a = angle + sigma * jitter * 1.8;
      const r = .06 + 3.44 * Math.pow(t, 1.19) + (random() - .5) * jitter * (t + .9);
      return [Math.cos(a) * r, crown - Math.pow(t, .76) * treeHeight + (random() - .5) * jitter, Math.sin(a) * r];
    }

    function orbit(t, phase) {
      const radius = .75 + Math.sqrt(random()) * 6.22;
      const angle = phase * Math.PI + radius * 1.09 + (random() - .5) * 1.26;
      return [
        Math.cos(angle) * radius,
        1.2 * Math.sin(angle) + (t - .5) * 4.55 + (random() - .5) * 1.35,
        Math.sin(angle) * radius * .8
      ];
    }

    for (let layer = 0; layer < 17; layer++) {
      const t = (layer + .54) / 17;
      const height = crown - t * treeHeight;
      const spread = .1 + 3.36 * Math.pow(t, .92);
      const branches = Math.round(8 + 10 * t);
      const perBranch = Math.round((104 + 204 * t) * detail);
      for (let branch = 0; branch < branches; branch++) {
        const a = tau * branch / branches + layer * 1.56 + (random() - .5) * .32;
        const length = spread * (.74 + random() * .31);
        const flutter = (random() - .5) * .265;
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        const needleWidth = .07 + length * .29;
        const profile = along => height + flutter - (.23 + .46 * t) * along + (.16 + .12 * t) * along ** 6;
        const pointAt = (along, sideways, rise) => [
          length * along * cos - sideways * sin,
          profile(along) + rise,
          length * along * sin + sideways * cos
        ];
        const edge = [pointAt(.09, 0, -.115)];
        for (const side of [-1, 1]) {
          for (let segment = 0; segment < 15; segment++) {
            const progress = .12 + (side === -1 ? segment : 14 - segment) * .062;
            const frond = Math.sin(Math.PI * progress) * (segment % 3 === 0 ? .69 : 1);
            edge.push(pointAt(progress, side * needleWidth * frond, (random() - .48) * (.16 + .1 * t)));
          }
        }
        const twigs = Array.from({ length: 12 }, (_, index) => {
          const t = .19 + (index / 12) * .68;
          const side = index % 2 === 0 ? -1 : 1;
          return [
            pointAt(t - .075, side * needleWidth * .12, .035),
            pointAt(t + .12, side * needleWidth * Math.sin(Math.PI * t) * (.45 + random() * .4), .072 + random() * .09)
          ];
        });
        boughs.push({ edge, twigs, tip: pointAt(.88, 0, .045), root: pointAt(.14, 0, -.04) });
        for (let index = 0; index < perBranch; index++) {
          const along = .06 + Math.pow(random(), .68) * .94;
          const across = random() * 2 - 1;
          const frond = (along * 9.5 + index % 3 * .17) % 1;
          const wing = Math.pow(Math.sin(along * Math.PI), .71) * (.38 + .62 * frond);
          const stem = length * along - Math.abs(across) * wing * length * .115;
          const offset = across * wing * needleWidth;
          const crest = (random() + random() - .87) * (.103 + .13 * t);
          const y = profile(along) + crest;
          const point = [stem * cos - offset * sin, y, stem * sin + offset * cos];
          const snow = Math.max(0, crest + .04) * 3.95;
          const light = Math.min(1.05, (.167 + .39 * along + snow) * (.66 + random() * .55));
          const size = .53 + Math.pow(random(), 3.03) * 1.79;
          const angle = random() * tau;
          const u = Math.max(.008, Math.min(1, t + (random() - .5) * .19));
          const ghost = halo(u, (.08 + 3.7 * u) * Math.pow(random(), .64), .62);
          add(point, ghost, orbit(t, angle > Math.PI ? 1 : 0), size, light, .096 + random() * .18);
          if (index === 1 && t > .11 && branch % 2 === 0) highlights.push(point);
        }
      }
    }

    const trackCount = Math.round(24900 * detail);
    for (let index = 0; index < trackCount; index++) {
      const t = Math.min(1, .02 + Math.pow(random(), .79) * .997);
      const glint = random();
      const ribbon = coilAt(t, glint < .87 ? .118 + t * .169 : .43 + t * .53);
      const fir = halo(t, (.07 + 3.04 * t) * (.72 + random() * .29), .34);
      const frost = glint < .88 ? .047 + random() * .065 : .26 + random() * .48;
      const trace = glint < .87 ? .66 + random() * .54 : .26 + random() * .42;
      const size = .54 + Math.pow(random(), 2.35) * 1.55;
      add(fir, ribbon, orbit(t, index % 2), size, frost, trace);
    }

    for (let index = 0; index < Math.round(670 * detail); index++) {
      const t = random();
      const a = random() * tau;
      const radius = (.02 + .126 * t) * Math.sqrt(random());
      const height = crown + .34 - t * .81;
      const point = [Math.cos(a) * radius, height, Math.sin(a) * radius];
      const light = .18 + random() * .44;
      add(point, point, orbit(0, index % 2), .5 + random() * 1.02, light, light * 1.15);
    }

    const floorCount = Math.round(12400 * detail);
    for (let index = 0; index < floorCount; index++) {
      const angle = random() * tau;
      const t = Math.sqrt(random());
      const radius = 1.1 + t * 5.75;
      const airy = Math.pow(random(), 4);
      const r = radius + (random() - .5) * .37;
      const base = [Math.cos(angle) * r, foot - .06 + airy * .32, Math.sin(angle) * r];
      const ground = [base[0] * 1.17, base[1] + airy * .26, base[2] * 1.13];
      const ice = (1 - t * .86) * (.044 + random() * .12);
      const spiral = (1 - t * .55) * (.22 + random() * .42);
      const size = .51 + Math.pow(random(), 4) * 1.38;
      add(base, ground, ground, size, ice, spiral);
    }
    return { values: new Float32Array(positions), highlights, boughs };
  }

  function project(x, y, z, state, out) {
    const horizontal = x * state.cosine + z * state.sine;
    const rotatedZ = z * state.cosine - x * state.sine;
    const vertical = y * tiltCos - rotatedZ * tiltSin;
    const depth = y * tiltSin + rotatedZ * tiltCos;
    const zoom = state.zoom * cameraDistance / (cameraDistance - depth);
    out.x = state.x + horizontal * zoom;
    out.y = state.y - vertical * zoom;
    out.depth = depth;
    out.zoom = zoom;
    return out;
  }

  function wrapAngle(spread) {
    return Math.sin(Math.PI * Math.min(1, spread)) * 1.11;
  }

  function gpuRenderer(canvas, values) {
    if (!canvas) return null;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
    if (!gl) return null;
    const vertex = `
      precision highp float;
      attribute vec3 fir;
      attribute vec3 coil;
      attribute vec3 orbit;
      attribute vec4 grain;
      uniform vec4 view;
      uniform vec4 camera;
      uniform vec4 effect;
      uniform vec3 surface;
      varying mediump float shine;
      varying mediump vec3 tint;

      void main() {
        vec3 p = mix(fir, coil, effect.x);
        p = mix(p, orbit, effect.y);
        p.y += effect.y * sin(effect.z * .9 + grain.y * 24.0) * .17;
        float x = p.x * camera.x + p.z * camera.y;
        float z = p.z * camera.x - p.x * camera.y;
        float y = p.y * camera.z - z * camera.w;
        float depth = p.y * camera.w + z * camera.z;
        float scale = 25.0 / (25.0 - depth);
        vec2 coord = view.zw + vec2(x, -y) * scale * surface.z;
        gl_Position = vec4(coord.x * 2.0 / view.x - 1.0, 1.0 - coord.y * 2.0 / view.y, 0.0, 1.0);
        float light = mix(grain.z, grain.w, effect.x);
        float twinkle = .88 + .12 * sin(effect.z * 2.38 + grain.y * 37.5);
        float front = clamp(.83 + depth * .071, .43, 1.23);
        shine = light * twinkle * front * (1.0 + effect.y * .18);
        tint = mix(vec3(.26,.54,.90), vec3(.83,.95,1.0), clamp(light * 1.13 + effect.x * .21, 0.0, 1.0));
        gl_PointSize = max(1.0, grain.x * scale * surface.x * surface.y);
      }
    `;
    const fragment = `
      precision mediump float;
      varying mediump float shine;
      varying mediump vec3 tint;
      void main() {
        vec2 offset = (gl_PointCoord - .5) * 2.0;
        float d = dot(offset, offset);
        float k = (1.0 - smoothstep(.20, 1.0, d)) * (.52 + .48 * exp(-d * 2.2));
        float alpha = shine * k;
        gl_FragColor = vec4(tint * alpha, alpha);
      }
    `;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
      return shader;
    }
    const vert = compile(gl.VERTEX_SHADER, vertex);
    const frag = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vert || !frag) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    gl.useProgram(program);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
    [["fir", 0, 3], ["coil", 3, 3], ["orbit", 6, 3], ["grain", 9, 4]].forEach(([name, offset, size]) => {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride * 4, offset * 4);
    });
    const view = gl.getUniformLocation(program, "view");
    const camera = gl.getUniformLocation(program, "camera");
    const effect = gl.getUniformLocation(program, "effect");
    const surface = gl.getUniformLocation(program, "surface");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    return {
      paint(state) {
        if (gl.isContextLost()) return false;
        const angle = state.yaw + wrapAngle(state.spread);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform4f(view, state.width, state.height, state.x, state.y);
        gl.uniform4f(camera, Math.cos(angle), Math.sin(angle), tiltCos, tiltSin);
        gl.uniform4f(effect, state.coil, state.spread, state.time, 0);
        gl.uniform3f(surface, state.dpr, state.grain, state.zoom);
        gl.drawArrays(gl.POINTS, 0, values.length / stride);
        return true;
      }
    };
  }

  const colors = Array.from({ length: 64 }, (_, index) => {
    const t = index / 63;
    return "rgba(" + Math.round(58 + t * 177) + "," + Math.round(131 + t * 116) + ",255," + (t * .97).toFixed(3) + ")";
  });

  function fallbackRenderer(ctx, values, decimate) {
    const point = {};
    const step = stride * decimate;
    return {
      paint(state) {
        const angle = state.yaw + wrapAngle(state.spread);
        const camera = { ...state, cosine: Math.cos(angle), sine: Math.sin(angle) };
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        let previous = -1;
        for (let i = 0; i < values.length; i += step) {
          const x = values[i] + (values[i + 3] - values[i]) * state.coil;
          const y = values[i + 1] + (values[i + 4] - values[i + 1]) * state.coil;
          const z = values[i + 2] + (values[i + 5] - values[i + 2]) * state.coil;
          project(
            x + (values[i + 6] - x) * state.spread,
            y + (values[i + 7] - y + Math.sin(state.time * .9 + values[i + 10] * 24) * .17) * state.spread,
            z + (values[i + 8] - z) * state.spread, camera, point
          );
          if (point.x < -1 || point.x > state.width + 1 || point.y < -1 || point.y > state.height + 1) continue;
          const light = values[i + 11] + (values[i + 12] - values[i + 11]) * state.coil;
          const front = Math.min(1.23, Math.max(.43, .83 + point.depth * .071));
          const twinkle = .88 + .12 * Math.sin(state.time * 2.38 + values[i + 10] * 37.5);
          const tint = Math.min(63, Math.round(light * front * twinkle * (decimate === 1 ? .93 : 1.15) * 63));
          if (tint < 1) continue;
          if (tint !== previous) {
            ctx.fillStyle = colors[tint];
            previous = tint;
          }
          const size = Math.max(.49, values[i + 9] * state.grain * point.zoom / state.zoom * .85);
          ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
        }
        ctx.restore();
        return true;
      }
    };
  }

  return { generate, project, gpuRenderer, fallbackRenderer, randomGenerator, crown, foot };
})();
