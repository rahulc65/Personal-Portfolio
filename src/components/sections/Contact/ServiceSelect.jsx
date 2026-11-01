import { useEffect, useId, useRef, useState } from 'react';

/**
 * ServiceSelect
 * Custom dropdown that replaces the native <select> in the contact form.
 * - Looks like the rest of the site: underline trigger, numbered rows (like the Process list),
 *   ink highlight, accent dot on the chosen row.
 * - Fully keyboard accessible: Arrow keys, Home/End, Enter/Space, Esc, Tab, type-to-jump.
 * - Still renders a hidden <input name=...> so it behaves like a normal form field.
 *
 * Props: id, name, value, options (string[]), onChange(value), className (trigger styles).
 */
export default function ServiceSelect({ id, name, value, options = [], onChange, className = '' }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const optId = (i) => `${uid}-opt-${i}`;

  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const typing = useRef({ buffer: '', timer: 0 });

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIndex = Math.max(0, options.indexOf(value));
  const last = options.length - 1;

  const openList = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };
  const choose = (index) => {
    if (options[index] !== undefined) onChange?.(options[index]);
    close();
  };

  // close when clicking / tapping anywhere outside
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // keep the highlighted row visible when navigating with the keyboard
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  useEffect(() => () => clearTimeout(typing.current.timer), []);

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(last);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default: {
        // type-to-jump: "w", "we", ... jumps to the first option starting with those letters
        if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) break;
        const t = typing.current;
        clearTimeout(t.timer);
        t.buffer += e.key.toLowerCase();
        t.timer = setTimeout(() => {
          t.buffer = '';
        }, 600);
        const hit = options.findIndex((o) => o.toLowerCase().startsWith(t.buffer));
        if (hit >= 0) {
          setActive(hit);
          setOpen(true);
        }
      }
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optId(active) : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${className} flex cursor-pointer items-center justify-between gap-4 pr-1 text-left ${
          open ? 'border-accent shadow-[0_1px_0_0_var(--color-accent)]' : ''
        }`}
      >
        <span className="truncate">{value}</span>
        <svg
          aria-hidden="true"
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[#7d7a74] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'rotate-180 text-accent' : ''
          }`}
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-labelledby={id}
        tabIndex={-1}
        className={`absolute left-0 right-0 top-[calc(100%+10px)] z-30 m-0 max-h-[320px] list-none origin-top overflow-y-auto rounded-[6px] border border-ink bg-bg-raised p-1.5 shadow-[0_22px_44px_-20px_rgba(20,18,15,0.45)] transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        {options.map((option, i) => {
          const isActive = i === active;
          const isSelected = i === selectedIndex;
          return (
            <li
              key={option}
              id={optId(i)}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()} /* keep focus on the trigger */
              onClick={() => choose(i)}
              className={`cursor-pointer rounded-[4px] font-mono text-[13px] transition-colors duration-200 ${
                isActive ? 'bg-ink text-bg-raised' : 'text-ink'
              }`}
            >
              {/* inner row staggers in when the list opens */}
              <div
                className={`flex items-center gap-4 px-3 py-2.5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  open ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0'
                }`}
                style={{ transitionDelay: open ? `${70 + i * 30}ms` : '0ms' }}
              >
                <span
                  className={`w-5 shrink-0 text-[11px] font-bold tabular-nums transition-colors duration-200 ${
                    isActive ? 'text-bg-raised/55' : 'text-ink-soft/60'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-semibold">{option}</span>
                {isSelected && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}