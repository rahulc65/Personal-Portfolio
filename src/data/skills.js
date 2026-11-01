
export const skillsIntro =
  "Different skills, different tools, and plenty of curiosity. Here's a little glimpse of what goes into the things I create.";

export const skillGroups = [
  {
    title: 'Capabilities',
    items: [
      { name: 'Web design', value: '01' },
      { name: 'Full stack web application', value: '02' },
      { name: 'Wordpress websites', value: '03' },
      { name: 'Website admin panel', value: '04' },
    ],
  },
  {
    title: 'Languages',
    items: [
      { name: 'HTML', value: '01' },
      { name: 'CSS', value: '04' },
      { name: 'JavaScript', value: '05' },
      { name: 'SQL', value: '06' },
    ],
  },
  {
    title: 'Frameworks & tools',
    items: [
      { name: 'React js', value: '01' },
      { name: 'Next js', value: '02' },
      { name: 'Node js', value: '03' },
      { name: 'Supabase', value: '04' },
      { name: 'Shopify', value: '05' },
    ],
  },
];

const P = ( label="" ) => ({ kind: 'pill' , label});
const H = () => ({ kind: 'heart' });

export const gravityItems = [
  P('React'), P('JavaScript'), H(), P('Three.js'),H(),H(), P('GSAP'),
  P('HTML5'), H(),H(), P('Web Design'),H(),H(), P('CSS3'),H(), P('Motion'),
  H(), P('Node.js'),H(), P('Typography'), P('Tailwind CSS'),
  H(), P('Supabase'), P('Next.js'), H(), P('Express.js'),
  P('Shopify'), P('PostgreSQL'), H(), P('Creative Coding'),
  P('WordPress'), H(), P('Liquid'), P('Animation'),
  H(), P('Responsive UI'), P('GitHub')
].map((item, i) => ({ ...item, id: `g-${i}` }));
