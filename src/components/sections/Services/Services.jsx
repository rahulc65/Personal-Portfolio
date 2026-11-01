import { useState } from 'react';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import ServiceRow from './ServiceRow';

/**
 * Services
 * Header + a multi-open accordion. The first row starts open; opening a row
 * never closes the others (each row toggles on its own).
 */
export default function Services({ intro, services = [] }) {
  const [openIds, setOpenIds] = useState(() => new Set(services[0] ? [services[0].id] : []));

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section id="services" className="services relative overflow-hidden text-white">
      <div className="services__bg absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 pb-[clamp(48px,6vw,88px)] pt-[clamp(32px,4.4vw,56px)]">
        <Container>
          <Eyebrow className="text-white!">My services</Eyebrow>
          <h2 className="m-0 mt-[clamp(10px,1.4vw,18px)] font-mono text-[clamp(36px,4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
            Services
          </h2>
          <p className="m-0 mt-[clamp(12px,1.4vw,18px)] max-w-[50ch] font-mono text-[clamp(12px,1vw,14px)] leading-[1.5] text-white">
            {intro}
          </p>
        </Container>

        <Container className="mt-[clamp(32px,4.4vw,60px)]">
          <div>
            {services.map((service, i) => (
              <ServiceRow
                key={service.id}
                service={service}
                index={i}
                open={openIds.has(service.id)}
                onToggle={() => toggle(service.id)}
              />
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}