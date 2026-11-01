import webimage from '../assets/images/Services-images/web_development_img.jpg';
import webappimage from '../assets/images/Services-images/webapp_development_img.jpg';
import ecommerceimage from '../assets/images/Services-images/ecommerce_service_img.jpg';

export const servicesIntro =
  "From thoughtful designs to fully functional digital experiences, I enjoy turning ideas into something meaningful. Here's how I can help bring yours to life.";

export const services = [
  {
    id: 'web-design',
    title: 'Web design and development',
    description: "I create modern, responsive websites that combine thoughtful design with smooth functionality, making every experience simple and enjoyable.",
    tags: ['UI design', 'Landing pages', 'Portfolios', 'Responsive', 'Animation', 'Branding'],
    more: '6+',
    image: webimage,
  },
  {
    id: 'webapp',
    title: 'Webapp and app development',
    description: "I develop interactive web applications that simplify everyday tasks through intuitive interfaces and useful functionality.",
    tags: ['React js', 'Next js', 'Node js', 'Dashboards', 'Admin panels', 'API Integration'],
    image: webappimage,
  },
  {
    id: 'ecommerce',
    title: 'Ecommerce site development',
    description: "I create and customize online stores with engaging storefronts and smooth shopping experiences that keep customers in mind.",
    tags: ['Shopify', 'WordPress', 'Custom themes', 'Storefront Design', 'Payment Integration'],
    image: ecommerceimage, 
  },
];