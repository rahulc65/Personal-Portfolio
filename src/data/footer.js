/**
 * Footer content. Edit links, copy and the falling pills here.
 *
 * Page links use "#id" (smooth-scrolls to that section) or a file path.
 * The Elsewhere links point at the sites' home pages: replace each with your own profile URL.
 */
export const footerContent = {
  eyebrow: 'Get in touch',
  email: 'hellorahuuu@gmail.com',
  blurb:
    "Have an idea, a project in mind, or simply want to say hello? I'm always open to interesting conversations, creative collaborations, and new possibilities. Feel free to reach out!",
  pages: [
    { label: 'Works', href: '#projects' },
    { label: 'About me', href: '#about' },
    { label: 'Resume', href: '/rahul-cv.pdf' },
    { label: 'Contact', href: '#contact' },
  ],

  elsewhere: [
    { label: 'Linkedin', href: 'https://www.linkedin.com/' },
    { label: 'Github', href: 'https://github.com/' },
    { label: 'Instagram', href: 'https://www.instagram.com/' },
    { label: 'Facebook', href: 'https://www.facebook.com/' },
  ],

  address: {
    emailLabel: 'Email :',
    lines: ['Palakkad, Kerala, India'],
  },

  /** The big faint word across the bottom. */
  watermark: 'RAHUL©',

  /** Falling pills, in drop order. */
  pills: ['Development', 'Strategy', 'Design', 'Design', 'Design', 'Strategy', 'Development', 'Design'],
};