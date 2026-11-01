import researchImg from '../assets/images/Process-images/research_related_img.webp';
import designImg from '../assets/images/Process-images/design_related_img.webp';
import developmentImg from '../assets/images/Process-images/development_related_img.webp';

export const processStatement = [
  'Great ideas take shape through a thoughtful ',
  { accent: 'process' },
  ', where creativity meets intention and simple details become meaningful experiences.'
];

export const processSteps = [
  {
    id: 'research',
    number: '01.',
    title: 'Research',
    description: "Every project starts with an idea, but understanding that idea is where everything begins. I take time to explore different possibilities, gather inspiration, look at references, and understand what the project is trying to achieve. It's about asking the right questions, discovering new perspectives, and finding a direction that gives the idea room to grow.",
    tags: ['Inspiration', 'Research Competitor' ,'Analysis User' ,'Experience' ,'References', 'Visual Exploration'],
    image: researchImg,
    imageAlt: 'Research',
  },
  {
    id: 'design',
    number: '02.',
    title: 'Design',
    description: "This is where the ideas slowly begin to take shape. I enjoy experimenting with layouts, colours, typography, and visual elements to find the right balance between creativity and simplicity. Every detail has a place, and every decision contributes to the overall experience. It's a process of trying different things, making adjustments, and shaping something that feels both meaningful and visually engaging.",
    tags: ['Visual Design' ,'Typography' ,'Colour & Layout' ,'Wireframing' ,'Prototyping' ,'Creative Direction'],
    image: designImg,
    imageAlt: 'Design',
  },
  {
    id: 'development',
    number: '03.',
    title: 'Development',
    description: "This is where everything starts coming together. I bring the designs to life through code, turning static ideas into experiences people can actually interact with. From building responsive layouts to adding animations, interactions, and functionality, I enjoy seeing each piece fall into place. I also make use of AI tools to speed up the development process, explore solutions, and work more efficiently while keeping creativity and attention to detail at the heart of everything. There's always room to experiment, refine the details, solve unexpected challenges, and make the final experience feel just right.",
    tags: ['Frontend Development' ,'Responsive Design','Interactive UI' ,'Animations','AI-Assisted Development','Backend Integration','Testing & Refinement'],
    image: developmentImg,
    imageAlt: 'Development',
  },
];