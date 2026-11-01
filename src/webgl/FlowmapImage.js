import { Renderer, Program, Mesh, Triangle, Texture, Flowmap, Vec2 } from 'ogl';

/**
 * FlowmapImage
 * ---------------------------------------------------------------------------
 * Hover "liquid" distortion + RGB split for an <img> (the same effect family as FlowmapTitle).
 *
 *  - A canvas is laid over the image and replicates its `object-fit: cover` crop exactly.
 *  - While the pointer moves over the image, a flowmap (pointer velocity that slowly fades)
 *    drives the shader: the photo is dragged along the flow, the red / green / blue channels are
 *    pulled apart, and a faint spectrum shimmer follows the fastest movement.
 *  - When the pointer stops, the trail relaxes and the canvas fades out, revealing the original
 *    <img> underneath: the photo is always crisp at rest and nothing renders while idle.
 *
 * Reusable: createFlowmapImage(hostElement, imgElement, optionsOverrides). The host must be
 * position: relative (and normally overflow: hidden).
 */

export const IMAGE_FLOW_OPTIONS = {
  flowSize: 500, // resolution of the flowmap
  falloff: 0.5, // size of the "brush" under the cursor (relative to the image height)
  dissipation: 0.965, // how fast the trail fades (closer to 1 = lazier, longer liquid)
  distort: 1.9, // strength of the liquid warp
  split: 0.9, // RGB channel separation
  shimmer: 0.18, // strength of the spectrum shimmer along fast movement (0 = off)
  lodBias: -0.6, // sharper texture sampling when a big photo is shown small (0 = default, more negative = sharper)
  flowBlur: 0.012, // softness of the flow field (uv units)
  maxSubsteps: 8, // brush stamps per frame along the pointer's path (smooth even at low fps)
  shimmerSpread: 5.0, // how many colour bands the shimmer has
  maxVelocity: 0.08, // clamp for a single flick
  velocityEase: 0.16, // how quickly the brush follows the pointer
  fadeInMs: 140, // canvas fades in when the pointer starts moving over the image
  fadeOutMs: 600, // ... and back out once the trail has settled
  settleMs: 1500, // how long after the last movement before fading out
  maxDpr: 1.5, // the photo is large; cap the pixel ratio (the crisp <img> shows at rest anyway)
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

  uniform sampler2D tImage;  // the photo
  uniform sampler2D tFlow;   // flowmap: rg = pointer velocity
  uniform vec2 uCover;       // object-fit: cover crop (fraction of the image that is visible)
  uniform float uDistort;
  uniform float uSplit;
  uniform float uShimmer;
  uniform float uSpread;
  uniform float uBlur;
  uniform float uLodBias;    // < 0 picks a sharper mip level (keeps small thumbnails crisp)
  uniform float uTime;
  varying vec2 vUv;

  vec3 spectrum(float h) {
    return 0.5 + 0.5 * cos(6.28318 * (h + vec3(0.0, 0.3333, 0.6667)));
  }

  // canvas uv -> image uv, replicating object-fit: cover (centered)
  vec2 coverUv(vec2 uv) {
    return clamp((uv - 0.5) * uCover + 0.5, 0.0, 1.0);
  }

  void main() {
    // flow field, lightly blurred so the edge of the brush never shows up as a ring
    vec2 flow = texture2D(tFlow, vUv).rg * 0.4
      + texture2D(tFlow, vUv + vec2(uBlur, 0.0)).rg * 0.15
      + texture2D(tFlow, vUv - vec2(uBlur, 0.0)).rg * 0.15
      + texture2D(tFlow, vUv + vec2(0.0, uBlur)).rg * 0.15
      + texture2D(tFlow, vUv - vec2(0.0, uBlur)).rg * 0.15;
    float mag = length(flow);

    // liquid warp
    vec2 uv = vUv - flow * uDistort;

    // RGB split along the flow direction
    vec2 s = flow * uSplit;
    vec3 col = vec3(
      texture2D(tImage, coverUv(uv + s), uLodBias).r,
      texture2D(tImage, coverUv(uv), uLodBias).g,
      texture2D(tImage, coverUv(uv - s), uLodBias).b
    );

    // faint drifting spectrum where the liquid is moving fastest
    float tint = smoothstep(0.0, 1.0, mag * 18.0);
    float hue = dot(flow, vec2(uSpread, uSpread * 0.7)) * 10.0 + mag * uSpread * 6.0 + uTime * 0.12;
    col += (spectrum(hue) - 0.35) * tint * uShimmer;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class FlowmapImage {
  constructor(host, img, overrides = {}) {
    this.host = host;
    this.img = img;
    this.opts = { ...IMAGE_FLOW_OPTIONS, ...overrides };
    this.destroyed = false;
    this.running = false;
    this.raf = 0;
    this.lastMove = 0;
    this.pointer = { x: 0, y: 0, has: false };
    this.target = new Vec2();
    this.needsUpdate = false;
    this.visible = true;
    this.shown = false;
    this.stopTimer = 0;
  }

  async init() {
    const { host, img, opts: o } = this;

    // the photo must be decoded before it becomes a texture
    if (!img.complete || !img.naturalWidth) {
      await new Promise((res, rej) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', rej, { once: true });
      });
    }
    try {
      await img.decode();
    } catch {
      /* already decoded / not decodable: carry on */
    }
    if (this.destroyed) return false;

    this.dpr = Math.min(window.devicePixelRatio || 1, o.maxDpr);
    this.renderer = new Renderer({ dpr: this.dpr, alpha: false, antialias: false });
    const gl = (this.gl = this.renderer.gl);

    this.dissipation = o.dissipation;
    this.flowmap = new Flowmap(gl, { size: o.flowSize, falloff: o.falloff, dissipation: o.dissipation });
    // mipmaps: large photos shown in small boxes (thumbnails, cards) are filtered properly instead of aliasing
    // (OGL falls back to plain LINEAR by itself where WebGL1 can't mipmap a non-power-of-two image)
    this.texture = new Texture(gl, { image: img, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR });

    this.program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      depthTest: false,
      uniforms: {
        tImage: { value: this.texture },
        tFlow: this.flowmap.uniform,
        uCover: { value: new Vec2(1, 1) },
        uDistort: { value: o.distort },
        uSplit: { value: o.split },
        uShimmer: { value: o.shimmer },
        uSpread: { value: o.shimmerSpread },
        uBlur: { value: o.flowBlur },
        uLodBias: { value: o.lodBias },
        uTime: { value: 0 },
      },
    });
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });

    const wrap = (this.wrap = document.createElement('div'));
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = `position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity ${o.fadeInMs}ms linear;`;
    gl.canvas.style.cssText = 'display:block;width:100%;height:100%;';
    wrap.appendChild(gl.canvas);
    host.appendChild(wrap);

    this.layout();
    this.bind();
    return true;
  }

  layout() {
    // the true (fractional) layout size of the box, e.g. 198.9 x 90.45. clientWidth/Height are rounded,
    // which would shift the picture by up to half a pixel relative to the real <img>'s crop.
    const cs = getComputedStyle(this.host);
    const w = parseFloat(cs.width);
    const h = parseFloat(cs.height);
    if (!w || !h) return;
    this.renderer.setSize(Math.round(w), Math.round(h));
    // OGL pins the canvas to whole CSS pixels; stretch it back over the exact box
    this.gl.canvas.style.width = '100%';
    this.gl.canvas.style.height = '100%';
    this.flowmap.aspect = w / h;
    // object-fit: cover: the fraction of the photo that is visible on each axis
    const ac = w / h;
    const ai = this.img.naturalWidth / this.img.naturalHeight;
    this.program.uniforms.uCover.value.set(ac > ai ? 1 : ac / ai, ac > ai ? ai / ac : 1);
  }

  bind() {
    const host = this.host;

    this.onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (p.clientX - rect.left) / rect.width;
      const y = (p.clientY - rect.top) / rect.height;
      if (this.pointer.has) {
        this.target.set(x - this.pointer.x, y - this.pointer.y);
        const len = this.target.len();
        if (len > this.opts.maxVelocity) this.target.multiply(this.opts.maxVelocity / len);
        this.needsUpdate = true;
        this.lastMove = performance.now();
        this.show();
        this.start();
      }
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.has = true;
    };
    this.onLeave = () => {
      this.pointer.has = false;
    };

    host.addEventListener('pointermove', this.onMove, { passive: true });
    host.addEventListener('touchmove', this.onMove, { passive: true });
    host.addEventListener('pointerleave', this.onLeave);
    host.addEventListener('touchend', this.onLeave);

    this.io = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (!this.visible) this.finish();
      },
      { rootMargin: '50px' }
    );
    this.io.observe(host);

    let t = 0;
    this.ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (this.destroyed) return;
        this.layout();
        if (this.shown) this.renderFrame(performance.now());
      }, 120);
    });
    this.ro.observe(host);
  }

  show() {
    clearTimeout(this.stopTimer);
    if (this.shown) return;
    this.shown = true;
    this.wrap.style.transition = `opacity ${this.opts.fadeInMs}ms linear`;
    this.wrap.style.opacity = '1';
  }

  /** fade the canvas out (revealing the crisp <img>) and stop rendering once it is gone */
  finish() {
    this.shown = false;
    this.wrap.style.transition = `opacity ${this.opts.fadeOutMs}ms ease-out`;
    this.wrap.style.opacity = '0';
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      this.stop();
      this.opts.onIdle?.(); // lets a lazy owner release the WebGL context
    }, this.opts.fadeOutMs + 50);
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
    if (this.shown && now - this.lastMove > this.opts.settleMs) this.finish();
    this.raf = requestAnimationFrame(this.tick);
  };

  renderFrame(now) {
    const fm = this.flowmap;
    const o = this.opts;
    if (this.needsUpdate) {
      this.needsUpdate = false;
    } else {
      this.target.set(0, 0);
    }
    fm.velocity.lerp(this.target, this.target.len() ? o.velocityEase : 0.1);

    // Stamp the brush at several points along the path the pointer travelled since the last frame.
    // Without this, a fast flick on a slow frame would leave separate discs instead of one ribbon.
    const cx = this.pointer.x;
    const cy = 1 - this.pointer.y;
    if (!this.lastMouse) this.lastMouse = { x: cx, y: cy };
    const dx = (cx - this.lastMouse.x) * fm.aspect;
    const dy = cy - this.lastMouse.y;
    const radius = o.falloff * 0.5;
    const steps = Math.max(1, Math.min(o.maxSubsteps, Math.ceil(Math.hypot(dx, dy) / (radius * 0.35))));
    const dissipation = this.dissipation;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      fm.mouse.set(this.lastMouse.x + (cx - this.lastMouse.x) * t, this.lastMouse.y + (cy - this.lastMouse.y) * t);
      // fade the trail once per frame (not once per stamp) so the look doesn't depend on the step count
      fm.mesh.program.uniforms.uDissipation.value = i === steps ? dissipation : 1;
      fm.update();
    }
    this.lastMouse.x = cx;
    this.lastMouse.y = cy;

    this.program.uniforms.uTime.value = now * 0.001;
    this.renderer.render({ scene: this.mesh });
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    clearTimeout(this.stopTimer);
    const host = this.host;
    host.removeEventListener('pointermove', this.onMove);
    host.removeEventListener('touchmove', this.onMove);
    host.removeEventListener('pointerleave', this.onLeave);
    host.removeEventListener('touchend', this.onLeave);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.wrap?.remove();
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/** Create the effect. Resolves to the instance, or null if WebGL isn't available. */
export async function createFlowmapImage(host, img, overrides) {
  const fx = new FlowmapImage(host, img, overrides);
  try {
    const ok = await fx.init();
    return ok ? fx : null;
  } catch (err) {
    console.warn('[FlowmapImage] WebGL effect unavailable, the plain image is shown.', err);
    fx.destroy();
    return null;
  }
}

/**
 * attachFlowmapImage: the lazy version, for lists of images (project cards, galleries...).
 *
 * Nothing is created until the pointer enters the host. The WebGL context is released again once
 * the trail has settled, so a page full of cards never holds more than one or two contexts
 * (browsers cap how many can exist at once). Returns a cleanup function.
 */
export function attachFlowmapImage(host, img, overrides = {}) {
  let inst = null;
  let creating = false;
  let dead = false;
  let leaveTimer = 0;

  const release = () => {
    clearTimeout(leaveTimer);
    inst?.destroy();
    inst = null;
  };

  const ensure = async () => {
    if (inst || creating || dead) return;
    creating = true;
    const fx = new FlowmapImage(host, img, { ...overrides, onIdle: release });
    try {
      const ok = await fx.init();
      if (dead || !ok) fx.destroy();
      else inst = fx;
    } catch (err) {
      console.warn('[FlowmapImage] WebGL effect unavailable, the plain image is shown.', err);
      fx.destroy();
    }
    creating = false;
  };

  const onEnter = () => {
    clearTimeout(leaveTimer);
    ensure();
  };
  // pointer left without ever moving over the image: give the GPU context back
  const onLeave = () => {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (inst && !inst.shown && !inst.running) release();
    }, 2500);
  };

  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('touchstart', onEnter, { passive: true });
  host.addEventListener('pointerleave', onLeave);

  return () => {
    dead = true;
    host.removeEventListener('pointerenter', onEnter);
    host.removeEventListener('touchstart', onEnter);
    host.removeEventListener('pointerleave', onLeave);
    release();
  };
}