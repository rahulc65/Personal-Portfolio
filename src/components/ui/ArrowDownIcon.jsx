import arrowDown from '../../assets/icons/arrow-down.svg';

/**
 * ArrowDownIcon
 * The down arrow as an SVG (src/assets/icons/arrow-down.svg), drawn as a colour-mask so it always takes
 * the colour of the surrounding text. To use a different arrow, just replace that SVG file (any colours,
 * only its shape is used).
 */
export default function ArrowDownIcon({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[0.80em] w-[0.7em] shrink-0 bg-current ${className}`}
      style={{
        // quoted: Vite inlines small SVGs as data URIs that contain quotes, which breaks an unquoted url()
        WebkitMaskImage: `url("${arrowDown}")`,
        maskImage: `url("${arrowDown}")`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  );
}
