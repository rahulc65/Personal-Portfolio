import { Renderer, Program, Mesh, Triangle, Texture, Flowmap, Vec2 } from 'ogl';

/**
 * FlowmapTitle
 * ---------------------------------------------------------------------------
 * Cursor-driven "liquid" distortion + RGB split for a DOM heading.
 *
 *  1. The heading's text is drawn (using its real computed font, size, spacing and position)
 *     into an offscreen 2D canvas, which becomes a WebGL texture (an ink mask).
 *  2. A small "flowmap" render target remembers where the pointer has been and how fast it
 *     moved. Every frame it is painted with the pointer velocity and faded out, so the
 *     movement leaves a trail that relaxes back to nothing, which is what makes it feel liquid.
 *  3. The fragment shader reads the flowmap and
 *       - pushes the texture coordinates along the flow (the liquid warp),
 *       - samples the ink three times with slightly different offsets (the RGB split), and
 *       - tints the ink with a moving spectrum in proportion to the flow strength (the rainbow).
 *  4. The render loop only runs while the pointer is moving (and the title is on screen).
 *
 * The real DOM heading stays in place (transparent) for layout, SEO and screen readers.
 */

/* ---- tuning knobs ---------------------------------------------------------------------- */
export const FLOW_OPTIONS = {
  flowSize: 60, // resolution of the flowmap (px). Higher = finer trail, slightly more GPU
  falloff: 0.62, // how big the cursor "brush" is (relative to the title height)
  dissipation: 0.964, // how fast the trail fades. Closer to 1 = longer, lazier liquid
  distort: 3.6, // strength of the liquid warp
  split: 1.35, // distance between the red / green / blue copies (RGB split)
  rainbow: 22.0, // how quickly the ink turns rainbow as the flow gets stronger
  rainbowSpread: 5.5, // how many colour bands appear across the distortion
  maxVelocity: 0.09, // clamp for a single flick of the mouse (stops wild spikes)
  velocityEase: 0.18, // how quickly the brush follows the pointer
  idleMs: 2600, // stop rendering this long after the pointer stops
  maxDpr: 2, // cap the pixel ratio (performance on 3x phones)
  fadeInMs: 220, // hand-off from the DOM text to the canvas
};

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D tText;   // ink mask: the heading's text, alpha = coverage
  uniform sampler2D tFlow;   // flowmap: rg = pointer velocity, b = strength
  uniform vec3 uInk;         // normal text colour
  uniform vec3 uBg;          // page background colour behind the canvas
  uniform float uDistort;
  uniform float uSplit;
  uniform float uRainbow;
  uniform float uSpread;
  uniform float uTime;
  varying vec2 vUv;

  // smooth full-spectrum colour for h in 0..1 (cosine palette, phases 120 degrees apart)
  vec3 spectrum(float h) {
    return 0.5 + 0.5 * cos(6.28318 * (h + vec3(0.0, 0.3333, 0.6667)));
  }

  float ink(vec2 uv) {
    return texture2D(tText, uv).a;
  }

  void main() {
    vec2 flow = texture2D(tFlow, vUv).rg;
    float mag = length(flow);

    // 1) liquid warp: drag the sample position along the flow
    vec2 uv = vUv - flow * uDistort;

    // 2) RGB split: three copies of the ink pushed apart along the flow direction
    vec2 s = flow * uSplit;
    vec3 cover = vec3(ink(uv + s), ink(uv), ink(uv - s));

    // 3) rainbow: where the liquid is moving, the ink turns into a drifting spectrum
    float tint = smoothstep(0.0, 1.0, mag * uRainbow);
    float hue = dot(flow, vec2(uSpread, uSpread * 0.7)) * 10.0 + mag * uSpread * 6.0 + uTime * 0.12;
    vec3 inkColour = mix(uInk, spectrum(hue), tint);

    // composite per channel over the page background, then convert to a premultiplied pixel
    // so the canvas stays transparent wherever there is no ink
    vec3 colour = mix(uBg, inkColour, cover);
    float a = max(cover.r, max(cover.g, cover.b));
    gl_FragColor = vec4(colour - uBg * (1.0 - a), a);
  }
`;

const parseColor = (css) => {
  const m = css.match(/[\d.]+/g);
  if (!m || m.length < 3) return [0, 0, 0];
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
};

/** Draw the heading's text spans into an offscreen canvas at their exact on-screen positions. */
function drawTitleToCanvas(h1, pad, dpr) {
  const hr = h1.getBoundingClientRect();
  const cssW = hr.width + pad.l + pad.r;
  const cssH = hr.height + pad.t + pad.b;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(cssW * dpr);
  canvas.height = Math.ceil(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';

  h1.querySelectorAll('[data-gl-text]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) || 0;
    const text = el.textContent;
    const m = ctx.measureText(text);
    const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
    // CSS puts the baseline half a "leading" below the top of the content area
    const baseline = r.top - hr.top + pad.t + (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
    const x = r.left - hr.left + pad.l;

    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${ls}px`;
      ctx.fillText(text, x, baseline);
    } else {
      // older browsers: place the letters one by one
      let cx = x;
      for (const ch of text) {
        ctx.fillText(ch, cx, baseline);
        cx += ctx.measureText(ch).width + ls;
      }
    }
  });

  return { canvas, cssW, cssH };
}

export class FlowmapTitle {
  constructor(h1) {
    this.h1 = h1;
    this.opts = FLOW_OPTIONS;
    this.destroyed = false;
    this.running = false;
    this.raf = 0;
    this.lastMove = 0;
    this.pointer = { x: 0, y: 0, has: false };
    this.target = new Vec2();
    this.needsUpdate = false;
    this.visible = true;
  }

  async init() {
    const h1 = this.h1;
    const o = this.opts;

    // fonts must be ready, otherwise the texture would be drawn in a fallback font
    const nameEl = h1.querySelector('.hero__name-part');
    const cs = getComputedStyle(nameEl);
    try {
      await document.fonts.load(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`);
      await document.fonts.ready;
    } catch {
      /* ignore: draw with whatever is available */
    }
    if (this.destroyed) return false;

    this.ink = parseColor(getComputedStyle(h1).color);
    const section = h1.closest('section') || document.body;
    this.bg = parseColor(getComputedStyle(section).backgroundColor);

    this.dpr = Math.min(window.devicePixelRatio || 1, o.maxDpr);
    this.renderer = new Renderer({ dpr: this.dpr, alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
    const gl = (this.gl = this.renderer.gl);
    gl.clearColor(0, 0, 0, 0);

    this.flowmap = new Flowmap(gl, { size: o.flowSize, falloff: o.falloff, dissipation: o.dissipation });
    this.texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });

    this.program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      depthTest: false,
      uniforms: {
        tText: { value: this.texture },
        tFlow: this.flowmap.uniform,
        uInk: { value: this.ink },
        uBg: { value: this.bg },
        uDistort: { value: o.distort },
        uSplit: { value: o.split },
        uRainbow: { value: o.rainbow },
        uSpread: { value: o.rainbowSpread },
        uTime: { value: 0 },
      },
    });
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });

    // wrapper that overlays the heading (slightly larger so the warp has room to move)
    const wrap = (this.wrap = document.createElement('div'));
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = `position:absolute;pointer-events:none;opacity:0;transition:opacity ${o.fadeInMs}ms linear;`;
    wrap.appendChild(gl.canvas);
    gl.canvas.style.cssText = 'display:block;width:100%;height:100%;';
    h1.appendChild(wrap);

    this.layout();
    this.renderFrame(0); // first frame is ready before we reveal the canvas
    wrap.style.opacity = '1';
    h1.classList.add('is-gl');

    this.bind();
    return true;
  }

  /** (Re)measure the heading, rebuild the text texture, resize the canvas */
  layout() {
    const h1 = this.h1;
    const hr = h1.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(h1.querySelector('.hero__name-part')).fontSize) || 120;
    const base = Math.max(24, Math.round(fs * 0.14));
    const vw = document.documentElement.clientWidth;
    // never let the canvas poke outside the screen horizontally (that would cause sideways scroll)
    const pad = {
      t: base,
      b: base,
      l: Math.max(0, Math.min(base, Math.floor(hr.left))),
      r: Math.max(0, Math.min(base, Math.floor(vw - hr.right))),
    };
    this.pad = pad;

    const { canvas, cssW, cssH } = drawTitleToCanvas(h1, pad, this.dpr);
    this.texture.image = canvas;
    this.renderer.setSize(cssW, cssH);
    this.size = { w: cssW, h: cssH };
    this.flowmap.aspect = cssW / cssH;

    const s = this.wrap.style;
    s.left = `${-pad.l}px`;
    s.top = `${-pad.t}px`;
    s.width = `${cssW}px`;
    s.height = `${cssH}px`;
    this.dirty = true;
  }

  bind() {
    this.onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      const rect = this.wrap.getBoundingClientRect();
      const m = 140; // only wake up when the pointer is near the title
      const near = p.clientX > rect.left - m && p.clientX < rect.right + m && p.clientY > rect.top - m && p.clientY < rect.bottom + m;
      const x = (p.clientX - rect.left) / rect.width;
      const y = (p.clientY - rect.top) / rect.height;
      if (this.pointer.has && near) {
        this.target.set((x - this.pointer.x) * 1, (y - this.pointer.y) * 1);
        const len = this.target.len();
        if (len > this.opts.maxVelocity) this.target.multiply(this.opts.maxVelocity / len);
        this.needsUpdate = true;
        this.lastMove = performance.now();
        this.start();
      }
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.has = true;
    };
    this.onLeave = () => {
      this.pointer.has = false;
    };

    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('touchmove', this.onMove, { passive: true });
    document.addEventListener('pointerleave', this.onLeave);

    this.io = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (!this.visible) this.stop();
      },
      { rootMargin: '100px' }
    );
    this.io.observe(this.h1);

    let t = 0;
    this.ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (this.destroyed) return;
        this.layout();
        this.renderFrame(performance.now());
      }, 120);
    });
    this.ro.observe(this.h1);
  }

  start() {
    if (this.running || this.destroyed || !this.visible) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  tick = (now) => {
    if (!this.running || this.destroyed) return;
    this.renderFrame(now);
    if (now - this.lastMove > this.opts.idleMs) {
      this.running = false; // the trail has faded: stop spending GPU time
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  renderFrame(now) {
    const fm = this.flowmap;
    fm.mouse.set(this.pointer.x, 1 - this.pointer.y);
    if (this.needsUpdate) {
      this.needsUpdate = false;
    } else {
      this.target.set(0, 0);
    }
    fm.velocity.lerp(this.target, this.target.len() ? this.opts.velocityEase : 0.1);
    fm.update();
    this.program.uniforms.uTime.value = now * 0.001;
    this.renderer.render({ scene: this.mesh });
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('touchmove', this.onMove);
    document.removeEventListener('pointerleave', this.onLeave);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.h1.classList.remove('is-gl');
    this.wrap?.remove();
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/** Create the effect for a heading. Resolves to the instance, or null if WebGL isn't available. */
export async function createFlowmapTitle(h1) {
  const fx = new FlowmapTitle(h1);
  try {
    const ok = await fx.init();
    if (!ok) return null;
    return fx;
  } catch (err) {
    console.warn('[FlowmapTitle] WebGL effect unavailable, falling back to plain text.', err);
    fx.destroy();
    return null;
  }
}