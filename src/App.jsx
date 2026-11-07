import Navbar from './components/layout/Navbar';
import Preloader from './components/layout/Preloader';
import ScrollProgress from './components/layout/ScrollProgress';
import Hero from './components/sections/Hero/Hero';
import Projects from './components/sections/Projects/Projects';
import Skills from './components/sections/Skills/Skills';
import Process from './components/sections/Process/Process';
import Marquee from './components/sections/Marquee/Marquee';
import About from './components/sections/About/About';
import Services from './components/sections/Services/Services';
import Headline from './components/sections/Headline/Headline';
import Contact from './components/sections/Contact/Contact';
import Footer from './components/sections/Footer/Footer';
import { projects } from './data/projects';
import { skillsIntro, skillGroups, gravityItems } from './data/skills';
import { processStatement, processSteps } from './data/process';
import { marqueeItems } from './data/marquee';
import { aboutDes, aboutParagraphs, cvEntries, aboutLinks } from './data/about';
import { servicesIntro, services } from './data/services';
import { headlineSegments } from './data/headline';
import { contactConfig, serviceOptions, contactWord } from './data/contact';
import { footerContent } from './data/footer';
import useLenis from './hooks/useLenis';
import UnderConstruction from './components/sections/UnderConstruction/UnderConstruction';

import heroImage from './assets/images/profile-img.png';

const sections = [
  {
    id: 'home',
    Component: Hero,
    props: { image: heroImage },
  },
  {
    id: 'projects',
    Component: Projects,
    props: { projects },
  },
  {
    id: 'skills',
    Component: Skills,
    props: { intro: skillsIntro, groups: skillGroups, gravityItems },
  },
  {
    id: 'process',
    Component: Process,
    props: { statement: processStatement, steps: processSteps },
  },
  {
    id: 'marquee',
    Component: Marquee,
    props: { items: marqueeItems },
  },
  {
    id: 'about',
    Component: About,
    props: { intro: aboutDes, paragraphs: aboutParagraphs, cv: cvEntries, links: aboutLinks },
  },
    {
    id: 'services',
    Component: Services,
    props: { intro: servicesIntro, services },
  },
    {
    id: 'headline',
    Component: Headline,
    props: { segments: headlineSegments },
  },
    {
    id: 'contact',
    Component: Contact,
    props: { word: contactWord, serviceOptions, config: contactConfig },
  },
];

function HomePage() {
  useLenis();

  return (
    <>
      <Preloader />
      <ScrollProgress />
      <Navbar notificationCount={3} cvHref="/rahul-cv.pdf" />
      <main>
        {sections.map(({ id, Component, props }) => (
          <Component key={id} {...props} />
        ))}
      </main>
      <Footer content={footerContent} />
    </>
  );
}

/* Only the one-page home site exists so far. Any other path (/projects, /about, ...) is an inner page that
   hasn't been built yet, so it gets the "under construction" page. When a real inner page is ready, add it here. */
const isHomePath = () => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === '' || path === '/index.html';
};

export default function App() {
  return isHomePath() ? <HomePage /> : <UnderConstruction />;
}