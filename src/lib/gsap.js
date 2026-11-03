/**
 * lib/gsap.js
 * One place that registers every GSAP plugin and holds the small helpers all sections share.
 * Import gsap, ScrollTrigger and SplitText from HERE in every component, never straight from 'gsap'.
 * (SplitText is part of the free GSAP package since 3.13.)
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- intro gate ----------
   The preloader flips this once its curtain is lifting. Sections that have an intro animation (the Hero)
   wait for it, so nothing plays behind the curtain. */
let introDone = false;
const waiting = new Set();

export const isIntroDone = () => introDone;

export const onIntroDone = (cb) => {
  if (introDone) {
    cb();
    return () => {};
  }
  waiting.add(cb);
  return () => waiting.delete(cb);
};

export const markIntroDone = () => {
  introDone = true;
  waiting.forEach((cb) => cb());
  waiting.clear();
};

export { gsap, ScrollTrigger, SplitText };