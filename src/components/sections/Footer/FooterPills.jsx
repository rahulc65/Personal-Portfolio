import { useRef } from 'react';
import useGravityWorld from '../../../hooks/useGravityWorld';

/**
 * FooterPills
 * The translucent pills that fall to the bottom of the footer. Same physics as the
 * Skills section (hooks/useGravityWorld): they drop in when the footer scrolls into
 * view, pile up, and can be dragged and thrown.
 *
 * The layer covers the whole footer so the pills fall past the content, but it lets
 * clicks through everywhere except on the pills themselves, so links stay clickable.
 */
export default function FooterPills({ pills = [] }) {
  const wrapRef = useRef(null);
  const elRefs = useRef([]);

  useGravityWorld({ wrapRef, elRefs, count: pills.length, deps: pills, threshold: 0.2 });

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="gravity gravity--passthrough absolute inset-0 z-20 overflow-hidden"
    >
      {pills.map((label, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`${label}-${i}`}
          ref={(node) => {
            elRefs.current[i] = node;
          }}
          data-shape="pill"
          className="gravity__item gravity__item--pill gravity__item--glass"
          style={{ visibility: 'hidden' }}
        >
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}