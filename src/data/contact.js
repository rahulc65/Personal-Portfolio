/**
 * Contact section data.
 *
 * The form needs somewhere to go. Set ONE of these (a .env file in the project root):
 *   VITE_CONTACT_ENDPOINT=https://formspree.io/f/xxxx     (or your own API route)
 *   VITE_CONTACT_EMAIL=you@yourdomain.com                 (used for the mailto fallback)
 * With an endpoint, the form POSTs JSON to it. Without one, it opens the visitor's
 * email app with the message prefilled, addressed to VITE_CONTACT_EMAIL.
 */
export const contactConfig = {
  endpoint: import.meta.env.VITE_CONTACT_ENDPOINT || '',
  email: import.meta.env.VITE_CONTACT_EMAIL || 'hello@example.com',
};

export const serviceOptions = [
  'Web Development',
  'Web design',
  'Webapp and app development',
  'Ecommerce site development',
  'WordPress website',
  'Admin panel',
  'Something else',
];

/** The word that falls into the Tetris panel. Only letters defined in FONT_BLOCK in data/pixelFont.js (C O N T A M E), and spaces. */
export const contactWord = 'CONTACT ME';