import { useEffect } from 'react';
import Container from '../../ui/Container';
import PillButton from '../../ui/PillButton';
import ConstructionScene from './ConstructionScene';

/**
 * UnderConstruction
 * Placeholder for every inner page that isn't built yet (App.jsx shows it for any path other than "/").
 * Same cream background, wordmark and PillButton as the home page, just a quiet single-screen layout.
 */
export default function UnderConstruction() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Under construction — Rahul';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="nav-panel">
        <a
          href="/"
          aria-label="Rahul, back to the home page"
          className="flex w-max items-start whitespace-nowrap font-body text-[26px] font-extrabold leading-[0.86] tracking-[-0.06em] text-ink max-sm:text-[22px]"
        >
          <span>Rahul</span>
          <span className="ml-[0.01em] -translate-y-[0.182em] text-[0.75em] leading-none tracking-normal">©</span>
        </a>
      </header>

      <main className="flex flex-1 items-center py-[clamp(24px,5vw,56px)]">
        <Container className="flex flex-col items-center text-center">
          <ConstructionScene className="h-auto w-full max-w-[680px]" />

          <h1 className="m-0 mt-[clamp(20px,3vw,32px)] font-mono text-[clamp(26px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.025em]">
            This page is under construction.
          </h1>
          <p className="m-0 mt-3 max-w-[34ch] text-[clamp(15px,1.3vw,18px)] leading-[1.6] text-ink-soft">
            I&rsquo;m still building it. Will be back soon!
          </p>

          <PillButton as="a" href="/" className="mt-8">
            Back to home
          </PillButton>
        </Container>
      </main>
    </div>
  );
}