import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useLenis
 * Enables Lenis smooth scrolling and keeps it in sync with GSAP's
 * ScrollTrigger, so scroll-driven animations stay accurate.
 * Call once at the top of <App />.
 */
export default function useLenis() {
  useEffect(() => {
    // Respect users who prefer reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true, // smooth-scroll to #home, #projects, #contact links
    });

    // Tell ScrollTrigger whenever Lenis scrolls.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (time is in seconds, Lenis wants ms).
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
