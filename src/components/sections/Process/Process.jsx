import { useState } from 'react';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import ProcessItem from './ProcessItem';
import ProcessMedia from './ProcessMedia';
import glassImage from '../../../assets/images/process-glass.jpg';

export default function Process({ statement = [], steps = [], image = glassImage, imageAlt = '' }) {
  const [openId, setOpenId] = useState(steps[0]?.id ?? null);
  // The image follows the last step that was opened. Collapsing everything keeps that image on screen
  // (instead of rolling the film back to the first one).
  const [shownId, setShownId] = useState(steps[0]?.id ?? null);

  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === shownId));

  const toggle = (id) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) setShownId(next);
  };

  return (
    <section id="process" className="py-[clamp(56px,8vw,80px)]">
      <Container>
        <p className="process__statement m-0 font-mono color-[#2C2C2C] text-[clamp(26px,4.4vw,64px)] font-bold leading-[1.12] tracking-[-0.03em]">
          {statement.map((part, i) =>
            typeof part === 'string' ? (
              <span key={i}>{part}</span>
            ) : (
              <span key={i} className="text-accent">
                {part.accent}
              </span>
            )
          )}
        </p>
      </Container>

      <Container className="mt-[clamp(40px,6vw,88px)] grid items-start gap-[clamp(32px,6vw,96px)] md:grid-cols-[1.12fr_1fr]">
        <div>
          <Eyebrow className="text-[12px]!">Process</Eyebrow>
          <div className="mt-[clamp(12px,1.6vw,20px)] border-t border-ink/25">
            {steps.map((step) => (
              <ProcessItem
                key={step.id}
                step={step}
                open={openId === step.id}
                onToggle={() => toggle(step.id)}
              />
            ))}
          </div>
        </div>

        <ProcessMedia steps={steps} activeIndex={activeIndex} fallbackImage={image} fallbackAlt={imageAlt} />
      </Container>
    </section>
  );
}