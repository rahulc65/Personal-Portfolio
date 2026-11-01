import { useEffect, useId, useRef } from 'react';
import gsap from 'gsap';

/**
 * HandwrittenWord
 * An inline SVG word that writes itself like a pen, holds, is wiped away left
 * to right with a soft edge, and writes itself again, forever.
 *
 * Two kinds of script data (see data/handwriting.js):
 *   1. Font mode  { fill, mask, maskWidth } — `fill` is a real font outline and
 *      `mask` is a pen path along the middle of the letters. The pen path is
 *      drawn inside an SVG <mask>, so the font is revealed stroke by stroke.
 *   2. Line mode  { paths } — single-stroke paths drawn directly (old "process").
 *
 * The pen strokes use their real lengths for the dash (no pathLength trick),
 * which keeps the drawing working in Safari as well as Chrome/Firefox.
 * Runs only while on screen; reduced motion shows the finished word.
 */
const WRITE_SECONDS = 2.6; // time to write the whole word
const HOLD_SECONDS = 2.8; // how long the finished word stays
const ERASE_SECONDS = 0.9; // wipe-away time
const PEN_LIFT = 0.12; // pause between strokes (pen lifted)
const REST_SECONDS = 0.45; // blank pause before writing again
const WIPE_FEATHER = 14; // soft edge of the wipe, in viewBox units

export default function HandwrittenWord({ label, script }) {
  const svgRef = useRef(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const maskId = `hw-mask-${uid}`;
  const gradId = `hw-wipe-${uid}`;
  const fontMode = Boolean(script.fill && script.mask);
  const strokes = fontMode ? script.mask : script.paths;
  const W = script.width;
  // wipe band: solid (hides ink) on the left, fading to clear on the right
  const wipeWidth = W + WIPE_FEATHER + 20;
  const wipeStartX = -wipeWidth - 2; // fully off to the left, word visible
  const wipeEndX = 0; // solid part covers the whole word

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const pens = [...svg.querySelectorAll('[data-pen]')];
    const wipe = svg.querySelector('[data-wipe]');
    const lengths = pens.map((p) => p.getTotalLength() + 1);
    const total = lengths.reduce((a, b) => a + b, 0) || 1;

    // each stroke: dash = its own length, offset = length (hidden) -> 0 (written)
    pens.forEach((p, i) => {
      p.style.strokeDasharray = `${lengths[i]} ${lengths[i] + 2}`;
    });

    // Round line caps still paint a dot at a stroke's end even when its dash is
    // scrolled off, so idle strokes are also hidden with visibility.
    const hideAll = () => {
      pens.forEach((p, i) => gsap.set(p, { strokeDashoffset: lengths[i], visibility: 'hidden' }));
      if (wipe) gsap.set(wipe, { attr: { x: wipeStartX } });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pens.forEach((p) => gsap.set(p, { strokeDashoffset: 0, visibility: 'visible' }));
      if (wipe) gsap.set(wipe, { attr: { x: wipeStartX } });
      return undefined;
    }

    hideAll();
    const tl = gsap.timeline({ repeat: -1, paused: true });

    // write — pen speed is even across the word, short pen lifts between strokes
    let t = 0;
    pens.forEach((p, i) => {
      const duration = Math.max((WRITE_SECONDS * lengths[i]) / total, 0.12);
      tl.set(p, { visibility: 'visible' }, t); // pen touches down
      tl.to(p, { strokeDashoffset: 0, duration, ease: i === 0 ? 'power1.in' : 'none' }, t);
      t += duration + PEN_LIFT;
    });

    // hold the finished word
    t += HOLD_SECONDS;

    if (wipe) {
      // font mode: one soft-edged sweep clears the whole word (dots and bars too)
      tl.to(wipe, { attr: { x: wipeEndX }, duration: ERASE_SECONDS, ease: 'power2.inOut' }, t);
      t += ERASE_SECONDS;
    } else {
      // line mode: all strokes fade out together
      tl.to(pens, { opacity: 0, duration: ERASE_SECONDS, ease: 'power1.in' }, t);
      t += ERASE_SECONDS;
      tl.set(pens, { opacity: 1 }, t + 0.01);
    }

    tl.add(hideAll, t + 0.01); // back to blank, ready for the next pass
    tl.to({}, { duration: REST_SECONDS }, t + 0.01);

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? tl.play() : tl.pause()), {
      threshold: 0.2,
    });
    io.observe(svg);

    return () => {
      io.disconnect();
      tl.kill();
    };
  }, [script, wipeStartX]);

  return (
    <>
      <span className="sr-only">{label}</span>
      <svg
        ref={svgRef}
        aria-hidden="true"
        viewBox={script.viewBox}
        className="mx-[0.08em] inline-block h-[1.3em] w-auto overflow-visible text-accent"
        // vertical-align lowers the svg so the word's baseline sits on the text baseline;
        // the negative block margin keeps the tall svg from stretching the line.
        style={{ aspectRatio: `${script.width} / ${script.height}`, verticalAlign: '-0.45em', marginBlock: '-0.3em' }}
      >
        {fontMode ? (
          <>
            <defs>
              <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                <stop offset={(W + 20) / wipeWidth} stopColor="#000" stopOpacity="1" />
                <stop offset="1" stopColor="#000" stopOpacity="0" />
              </linearGradient>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="-15" width={W + 20} height="60">
                {script.mask.map((d) => (
                  <path
                    key={d.slice(0, 24)}
                    data-pen=""
                    d={d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={script.maskWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ visibility: 'hidden' }}
                  />
                ))}
                {/* black hides ink inside a mask; this band slides in from the left to wipe the word */}
                <rect data-wipe="" x={wipeStartX} y="-15" width={wipeWidth} height="60" fill={`url(#${gradId})`} />
              </mask>
            </defs>
            <path d={script.fill} fill="currentColor" mask={`url(#${maskId})`} />
          </>
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((d) => (
              <path key={d.slice(0, 24)} data-pen="" d={d} />
            ))}
          </g>
        )}
      </svg>
    </>
  );
}