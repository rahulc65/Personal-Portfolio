import { creativityScript } from './handwriting';
import video1Mp4 from '../assets/videos/headline-1.mp4';
import video1Webm from '../assets/videos/headline-1.webm';
import video2Mp4 from '../assets/videos/headline-2.mp4';
import video2Webm from '../assets/videos/headline-2.webm';

export const headlineSegments = [
  { type: 'text', value: 'Every idea becomes an ' },
  { type: 'video', mp4: video1Mp4, webm: video1Webm, width: 1.7, height: 1, rotate: -5 },
  { type: 'text', value: ' experience through' },
  { type: 'break' },
  { type: 'text', value: ' curiosity, imagination, and ' },
  { type: 'script', label: 'Creativity', script: creativityScript },
  { type: 'text', value: ', shaped' },
  { type: 'break' },
  { type: 'text', value: ' with purpose,' },
  { type: 'video', mp4: video2Mp4, webm: video2Webm, width: 1.2, height: 0.95, rotate: 5 },
  { type: 'text', value: 'and made ' },
  { type: 'pill', value: 'memorable.' },
];