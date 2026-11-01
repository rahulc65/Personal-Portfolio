export default function PillButton({
  children,
  variant = 'outline',
  icon = 'arrow',
  as = 'button',
  className = '',
  ...rest
}) {
  const Tag = as;

  const base =
    'group inline-flex items-center gap-3 rounded-pill border-2 pl-[22px] py-[6px] pr-[6px] pt-[4px] pb-[4px] text-[15px] font-mono font-bold cursor-pointer transition-all duration-[250ms] ease-brand ';

  const variants = {
    outline: 'text-ink bg-transparent',
    solid: 'bg-ink text-bg-raised',
  };

  const iconTone = {
    outline: 'bg-accent text-white',
    solid: 'bg-bg-raised text-ink',
  };

  return (
    <Tag className={`${base} ${variants[variant]} ${className}`} {...rest}>
      <span>{children}</span>
      {icon === 'arrow' && (
        <span
          aria-hidden="true"
          className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-brand group-hover:rotate-45 ${iconTone[variant]}`}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {icon === 'download' && (
        <span
          aria-hidden="true"
          className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-brand group-hover:rotate-45 ${iconTone[variant]}`}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M6 1.5V8M6 8L3.2 5.2M6 8L8.8 5.2M2 10H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </Tag>
  );
}