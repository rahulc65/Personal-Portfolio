import { useEffect } from 'react';

/**
 * useFlowmapHover(hostRef, imgRef, overrides)
 *
 * Gives an <img> the hover liquid / RGB-split distortion (webgl/FlowmapImage.js).
 *  - hostRef: the wrapper around the image (position: relative, normally overflow: hidden)
 *  - imgRef:  the <img> itself (it stays in the DOM and is what you see at rest)
 *  - overrides: optional tweaks of IMAGE_FLOW_OPTIONS, e.g. { distort: 1.4 } (keep it a constant)
 *
 * The effect is created lazily on hover and released again when it settles. It is skipped for
 * reduced-motion users, and the plain image stays if WebGL isn't available.
 */
export default function useFlowmapHover(hostRef, imgRef, overrides) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let cancelled = false;
    let detach = null;

    const start = () => {
      import('../webgl/FlowmapImage').then(({ attachFlowmapImage }) => {
        if (cancelled || !hostRef.current || !imgRef.current) return;
        detach = attachFlowmapImage(hostRef.current, imgRef.current, overrides);
      });
    };
    // load it when the browser is idle, so it never competes with the first paint
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      detach?.();
    };
  }, [hostRef, imgRef, overrides]);
}