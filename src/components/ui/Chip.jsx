/**
 * Chip
 * Small rounded label used for tech-stack tags and status badges.
 * tone: 'dark' | 'accent'
 */
export default function Chip({ children, tone = 'dark', className = '' }) {
  const tones = {
    dark: 'bg-chip text-chip-ink',
    accent: 'bg-accent text-white',
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-mono leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}