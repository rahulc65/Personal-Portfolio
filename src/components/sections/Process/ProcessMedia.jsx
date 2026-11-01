import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * ProcessMedia
 * The image panel on the right of the Process accordion.
 *
 * The images sit one under the other on a "film strip". Opening a step rolls the strip like a roll
 * of film inside the frame: the current image slides out through the top while the next one slides
 * in from the bottom (and the other way round when going back to an earlier step). Jumping over a
 * step (Research -> Development) rolls past the one in between, exactly like film would.
 *
 * Once the strip has stopped, hovering the image gives it the same liquid / RGB-split distortion as
 * the rest of the site (webgl/FlowmapImage.js). No zoom, no blur, no cross-fade.
 */

const ROLL_SECONDS = 1; // one step. Longer jumps take a little longer so the film never looks rushed
const ROLL_EXTRA_PER_STEP = 0.3;
const ROLL_EASE = 'power3.inOut';

// hover effect tuned for this panel (see IMAGE_FLOW_OPTIONS in webgl/FlowmapImage.js for every knob)
const PROCESS_FLOW = { falloff: 0.65, distort: 1.8, split: 1, shimmer: 0.2 };

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ProcessMedia({ steps = [], activeIndex = 0, fallbackImage, fallbackAlt = '' }) {
  const hostRef = useRef(null);
  const stripRef = useRef(null);
  const imgRefs = useRef([]);
  const mounted = useRef(false);
  const rolling = useRef(false);

  // 1) roll the film to the active image
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return undefined;
    const target = -activeIndex * 100;

    // first paint, reduced motion, or already there: just place the strip
    if (!mounted.current || prefersReducedMotion()) {
      mounted.current = true;
      gsap.set(strip, { yPercent: target });
      return undefined;
    }
    const distance = Math.abs(gsap.getProperty(strip, 'yPercent') - target) / 100;
    if (distance < 0.001) return undefined;

    rolling.current = true;
    const tween = gsap.to(strip, {
      yPercent: target,
      duration: ROLL_SECONDS + ROLL_EXTRA_PER_STEP * (distance - 1),
      ease: ROLL_EASE,
      overwrite: true,
      onComplete: () => {
        rolling.current = false;
        hostRef.current?.dispatchEvent(new Event('process-roll-end'));
      },
    });
    return () => tween.kill();
  }, [activeIndex]);

  // 2) hover liquid effect on whichever image is showing (switched on once the film has stopped)
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const host = hostRef.current;
    const img = imgRefs.current[activeIndex];
    if (!host || !img) return undefined;

    let cancelled = false;
    let detach = null;
    let idle = 0;

    const attach = () => {
      import('../../../webgl/FlowmapImage').then(({ attachFlowmapImage }) => {
        if (cancelled || rolling.current) return;
        detach = attachFlowmapImage(host, img, PROCESS_FLOW);
      });
    };
    const onRollEnd = () => attach();

    if (rolling.current) {
      host.addEventListener('process-roll-end', onRollEnd, { once: true });
    } else {
      // load it when the browser is idle so it never competes with the first paint
      idle = window.requestIdleCallback ? window.requestIdleCallback(attach, { timeout: 4000 }) : setTimeout(attach, 1500);
    }

    return () => {
      cancelled = true;
      host.removeEventListener('process-roll-end', onRollEnd);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      detach?.();
    };
  }, [activeIndex]);

  return (
    <div ref={hostRef} className="process__media relative aspect-[1/0.98] w-full overflow-hidden rounded-[6px] bg-[#2a0c07]">
      {/* the film strip: one frame (= the size of the panel) per step, stacked vertically */}
      <div ref={stripRef} className="absolute inset-x-0 top-0 h-full will-change-transform">
        {steps.map((step, i) => (
          <img
            key={step.id}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            src={step.image ?? fallbackImage}
            alt={step.imageAlt ?? fallbackAlt}
            aria-hidden={i !== activeIndex}
            draggable={false}
            decoding="async"
            className="absolute inset-x-0 h-full w-full object-cover"
            style={{ top: `${i * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}