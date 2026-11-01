import { useEffect, useRef } from 'react';

/**
 * HeroImage
 * The full-bleed portrait. The <img> is always there (crisp, SEO, no-JS, reduced motion).
 * Once the intro has finished (`active`), a hover canvas is laid over it that gives the photo the
 * same liquid / RGB-split distortion as the title while the pointer moves over it
 * (see webgl/FlowmapImage.js). It fades back to the plain <img> when the pointer stops.
 */
export default function HeroImage({ src, alt, active = false }) {
  const hostRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!active || !src) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let cancelled = false;
    let fx = null;

    import('../../../webgl/FlowmapImage').then(async ({ createFlowmapImage }) => {
      if (cancelled || !hostRef.current || !imgRef.current) return;
      const instance = await createFlowmapImage(hostRef.current, imgRef.current);
      if (cancelled) instance?.destroy();
      else fx = instance;
    });

    return () => {
      cancelled = true;
      fx?.destroy();
    };
  }, [active, src]);

  return (
    <div
      ref={hostRef}
      className="hero__image relative h-[100vh] h-[100svh] w-full overflow-hidden bg-linear-to-br from-[#7a2b0c] via-[#d9631f] to-[#2a1006] max-[860px]:h-auto max-[860px]:aspect-[4/5]"
    >
      {src && <img ref={imgRef} src={src} alt={alt} className="h-full w-full object-cover" />}
    </div>
  );
}