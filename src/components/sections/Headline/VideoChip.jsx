import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../../lib/gsap';

/**
 * VideoChip
 * A small tilted card with a looping, muted video that sits inline in a
 * sentence. Hovering springs it up with a GSAP elastic ease and it settles
 * back to its resting tilt (also elastic) on leave.
 *
 * Sizes are in em, so the card scales with the headline's font size.
 * The video only plays while on screen and stays paused for people who
 * prefer reduced motion.
 *
 * Entrance (GSAP): the card is hidden (scale 0) until it scrolls into view, then it pops in with an elastic spring.
 */
export default function VideoChip({ mp4, webm, width = 1.5, height = 1, rotate = 0 }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  // entrance: pop in the first time the card scrolls into view
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return undefined;

    const ctx = gsap.context((gctx) => {
      gsap.set(card, { scale: 0 });
      ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        end: 'max', // still plays if the page was opened already scrolled past the card
        once: true,
        onEnter: () => gctx.add(() => gsap.to(card, { scale: 1, duration: 1.5, ease: 'elastic.out(1, 0.55)', delay: 0.35 })),
      });
    }, card);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- elastic hover ---- */
    // (scale is left alone here: the entrance above owns it until the card has popped in)
    gsap.set(card, { rotation: rotate, transformOrigin: '50% 50%' });

    const enter = () => {
      gsap.set(card, { zIndex: 10 });
      gsap.to(
        card,
        reduceMotion
          ? { scale: 1.15, rotation: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }
          : { scale: 1.6, rotation: rotate * 0.2, duration: 1.4, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' }
      );
    };
    const leave = () => {
      gsap.to(card, {
        scale: 1,
        rotation: rotate,
        duration: reduceMotion ? 0.25 : 1.1,
        ease: reduceMotion ? 'power2.out' : 'elastic.out(1, 0.5)',
        overwrite: 'auto',
        onComplete: () => gsap.set(card, { zIndex: 0 }),
      });
    };
    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);

    /* ---- video: play only while visible ---- */
    let io;
    if (reduceMotion) {
      video.pause();
    } else {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        },
        { threshold: 0.1 }
      );
      io.observe(card);
    }

    return () => {
      card.removeEventListener('pointerenter', enter);
      card.removeEventListener('pointerleave', leave);
      io?.disconnect();
      gsap.killTweensOf(card);
    };
  }, [rotate]);

  return (
    <span
      ref={cardRef}
      aria-hidden="true"
      className="relative mx-[0.12em] inline-block cursor-pointer overflow-hidden rounded-[0.16em] bg-[#2a0c07] align-middle shadow-[0_0.05em_0.18em_rgba(20,18,15,0.28)] will-change-transform"
      style={{ width: `${width}em`, height: `${height}em` }}
    >
      <video
        ref={videoRef}
        className="pointer-events-none block h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
      >
        <source src={mp4} type="video/mp4" />
        {webm && <source src={webm} type="video/webm" />}
      </video>
    </span>
  );
}