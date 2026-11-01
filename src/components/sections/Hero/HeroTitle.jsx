import { useEffect, useRef } from 'react';

/**
 * HeroTitle
 * The big "Rahul©" heading. The text itself stays in the DOM (layout, SEO, screen readers and the
 * GSAP intro all keep working). Once the intro has finished (`active`), a WebGL canvas takes over
 * the drawing and adds the cursor-driven liquid / RGB-split effect (see webgl/FlowmapTitle.js).
 *
 * Falls back to the plain DOM text when: reduced motion is requested, WebGL is unavailable,
 * or anything in the effect throws.
 */
export default function HeroTitle({ name, active = false }) {
  const h1Ref = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let cancelled = false;
    let fx = null;

    // loaded on demand so the WebGL code never blocks the first paint
    import('../../../webgl/FlowmapTitle').then(async ({ createFlowmapTitle }) => {
      if (cancelled || !h1Ref.current) return;
      const instance = await createFlowmapTitle(h1Ref.current);
      if (cancelled) instance?.destroy();
      else fx = instance;
    });

    return () => {
      cancelled = true;
      fx?.destroy();
    };
  }, [active]);

  return (
    <h1
      ref={h1Ref}
      aria-label={name}
      className="hero-title relative m-0 inline-flex items-start font-display font-extrabold leading-[0.86] tracking-[-0.04em] text-ink"
    >
      <span className="inline-block overflow-hidden">
        <span
          data-gl-text
          className="hero__name-part hero__name-size inline-block font-body tracking-[-0.06em]"
        >
          {name}
        </span>
      </span>
      <span
        data-gl-text
        className="hero__mark hero__copy-size ml-[0.01em] -translate-y-[0.182em] font-body leading-none"
        aria-hidden="true"
      >
        ©
      </span>
    </h1>
  );
}