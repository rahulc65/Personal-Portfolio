import tsa from '../assets/images/spanish-alchemist-mockup.webp'
import evolv from "../assets/images/evolv-design-mockup.webp"
import cartonbear from "../assets/images/carton-bear-mockup.webp"
import moksha from "../assets/images/moksha-stories-travel-mockup.webp"
import pariraksha from "../assets/images/pulse-pariraksha-mockup.webp"
import oceanus from "../assets/images/oceanus-grandeur-mockup.webp"


export const projects = [
    {
    id: 'spanish-alchemist',
    title: 'The Spanish Alchemist',
    url: 'https://thespanishalchemist.com',
    description:
      "A clinical-skincare storefront on Shopify, built around the brand's science-led story. Custom Liquid sections, a study-backed results page and a clean product journey that keeps the focus on proof, not noise.",
    image: tsa,
    stack: ['Shopify', 'Ecommerce', 'Custom liquid Files'],
    status: { label: 'On going', tone: 'accent' },
  },
  {
    id: 'evolv-design',
    title: 'Evolv Design',
    url: 'https://evolv.design/',
    description:
      "A marketing site for a design-subscription studio serving SaaS teams. Bold, conversion-focused pages with a straightforward plans flow and built-in call booking, so a visitor goes from curious to booked in a few clicks.",
    image: evolv,
    stack: ['Javascript','Boots Strap', 'Cal.co'],
    status: { label: 'Completed', tone: 'dark' },
  },
   {
    id: 'carton-bear',
    title: 'Carton Bear',
    url: 'https://www.cartonbear.com',
    description:
      "A motion-led brand site where scrolling tells the story. GSAP timelines, smooth scrolling and WebGL touches give it a playful, tactile feel while staying fast and responsive.",
    image: cartonbear,
    stack: ['Next js', 'Tailwind', 'Gsap', 'WebGL'],
    status: { label: 'Completed', tone: 'dark' },
  },
  {
    id: 'moksha-stories',
    title: 'Moksha Stories',
    url: 'https://mokshastories.com',
    description:
      "A travel brand on WordPress built to inspire and convert. Story-driven trip pages, a custom plugin for enquiries and an Elementor setup the team can update on its own.",
    image: moksha,
    stack: ['Wordpress', 'Custom Plugin', 'Elementor'],
    status: { label: 'Completed', tone: 'dark' },
  },
  {
    id: 'pulse-pariraksha',
    title: 'Pulse Pariraksha',
    url: 'https://pariraksha.pulsepkd.com',
    description:
      "A healthcare PWA with an admin panel for managing patients and updates. Installable on any phone, with real-time data on Supabase and push notifications to keep everyone in the loop.",
    image: pariraksha,
    stack: ['React js', 'Tailwind', 'Supabase', 'FCM', 'PWA'],
    status: { label: 'Completed', tone: 'dark' },
  },
  {
    id: 'oceanus-grandeur',
    title: 'Oceanus Grandeur',
    url: 'https://oceanusgrandeurpalakkad.com',
    description:
      "A real-estate showcase for a premium residential project. Fast, lightweight pages with push notifications and lead capture wired straight into the sales pipeline.",
    image: oceanus,
    stack: ['Html', 'JS', 'CSS', 'Supabase', 'FCM', 'PWA'],
    status: { label: 'Completed', tone: 'dark' },
  },
];