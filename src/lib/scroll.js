/**
 * lib/scroll.js
 * Lets the preloader freeze / release the page scroll even though Lenis is created later (in useLenis).
 */
let lenis = null;
let locked = false;

export const setLenis = (instance) => {
  lenis = instance;
  if (locked && lenis) lenis.stop();
};

export const lockScroll = () => {
  locked = true;
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
};

export const unlockScroll = () => {
  locked = false;
  lenis?.start();
  document.documentElement.style.overflow = '';
};

export const getLenis = () => lenis;