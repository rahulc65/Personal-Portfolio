import { useCallback, useRef, useState } from 'react';
import useGravityWorld from '../../../hooks/useGravityWorld';

const HEART_PATH =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

function Heart({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={HEART_PATH} />
    </svg>
  );
}

/**
 * GravityPile
 * The Skills section's falling chips: pills plus hearts that toggle "liked".
 * The physics lives in hooks/useGravityWorld (shared with the footer pills);
 * this component only renders the chips and handles the heart taps.
 */
export default function GravityPile({ items, className = '' }) {
  const wrapRef = useRef(null);
  const elRefs = useRef([]);
  const [liked, setLiked] = useState(() => new Set());

  const toggleLike = useCallback(
    (id) =>
      setLiked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );

  const onTap = useCallback(
    (el) => {
      if (el.dataset.kind === 'heart') toggleLike(el.dataset.id);
    },
    [toggleLike]
  );

  useGravityWorld({ wrapRef, elRefs, count: items.length, deps: items, onTap });

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label="Skill chips. Drag them around, or like the hearts."
      className={`gravity relative overflow-hidden ${className}`}
    >
      {items.map((item, i) => {
        const isHeart = item.kind === 'heart';
        const isLiked = liked.has(item.id);
        return (
          <div
            key={item.id}
            ref={(node) => {
              elRefs.current[i] = node;
            }}
            data-id={item.id}
            data-kind={item.kind}
            data-shape={isHeart ? 'circle' : 'pill'}
            className={`gravity__item ${isHeart ? 'gravity__item--heart' : 'gravity__item--pill'}`}
            style={{ visibility: 'hidden' }}
          >
            {isHeart ? (
              <button
                type="button"
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                onClick={(e) => {
                  // Keyboard activation only (detail 0). Pointer taps are handled
                  // by the hook's tap callback, because of pointer capture.
                  if (e.detail === 0) toggleLike(item.id);
                }}
                className={`gravity__heart ${isLiked ? 'is-liked' : ''}`}
              >
                <Heart filled={isLiked} />
              </button>
            ) : (
              <span>{item.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}