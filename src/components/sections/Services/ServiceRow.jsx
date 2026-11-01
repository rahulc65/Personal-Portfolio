import ServiceThumb from './ServiceThumb';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export default function ServiceRow({ service, index, open, onToggle }) {
  const { id, title, description, tags = [], more, image } = service;
  const number = `(${String(index + 1).padStart(3, '0')})`;
  const panelId = `service-${id}-panel`;

  return (
    <div
      className={`relative border-b border-white/35 transition-colors duration-500 [--pad:clamp(18px,2vw,26px)] ${
        open ? '' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="grid grid-cols-[52px_minmax(0,1fr)_34px] items-start sm:grid-cols-[clamp(64px,16%,360px)_minmax(0,1fr)_34px] py-[var(--pad)] md:grid-cols-[minmax(110px,24%)_minmax(0,1fr)_44px]">
        {/* number */}
        <span className="flex h-[34px] items-center font-mono text-[clamp(15px,1.45vw,19px)] font-bold text-white/60">
          {number}
        </span>

        {/* main cell: closed title and open layout share it */}
        <div className="grid">
          {/* closed title (visual only; the toggle button carries the accessible name) */}
          <span
            aria-hidden="true"
            className="pointer-events-none flex h-[34px] items-center font-mono text-[clamp(17px,2.1vw,30px)] font-bold leading-none tracking-[-0.01em] text-white [grid-area:1/1] md:absolute md:inset-x-0 md:top-[var(--pad)] md:justify-center"
            style={{
              opacity: open ? 0 : 1,
              transform: open ? 'translateY(-6px)' : 'translateY(0)',
              transition: `opacity 350ms ease ${open ? '0ms' : '250ms'}, transform 600ms ${EASE}`,
            }}
          >
            {title}
          </span>

          {/* open layout */}
          <div
            id={panelId}
            role="region"
            aria-label={title}
            inert={!open}
            className="grid [grid-area:1/1] motion-reduce:!transition-none"
            style={{
              gridTemplateRows: open ? '1fr' : '0fr',
              transition: `grid-template-rows 650ms ${EASE}`,
            }}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className="grid items-start gap-[clamp(16px,2.4vw,40px)] md:grid-cols-[clamp(100px,13.8vw,200px)_minmax(0,1fr)_minmax(0,1fr)]"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(14px)',
                  transition: `opacity 450ms ease ${open ? '200ms' : '0ms'}, transform 650ms ${EASE} ${open ? '120ms' : '0ms'}`,
                }}
              >
                <ServiceThumb src={image} alt={image ? title : ''} className="max-w-[240px] md:max-w-none" />

                <div>
                  <h3 className="m-0 max-w-[16ch] font-mono text-[clamp(18px,1.95vw,28px)] font-bold leading-[1.1] tracking-[-0.01em] text-white">
                    {title}
                  </h3>
                  <p className="m-0 mt-[clamp(10px,1.2vw,16px)] max-w-[34ch] font-mono text-[clamp(11px,0.95vw,13px)] leading-[1.5] text-white">
                    {description}
                  </p>
                </div>

                <div>
                  <p className="m-0 font-mono text-[14px] text-white">Categories</p>
                  <ul className="m-0 mt-3 flex max-w-[28ch] list-none flex-wrap gap-y-[7px] gap-x-[6px] p-0 md:max-w-[34ch]">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-pill bg-white px-3 py-[4px] font-mono text-[11px] font-semibold leading-[1.3] text-accent"
                      >
                        {tag}
                      </li>
                    ))}
                    {more && (
                      <li className="grid px-2 py-[4px] place-items-center rounded-pill bg-white font-mono text-[11px] font-bold text-accent">
                        {more}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* toggle: when closed its ::after stretches over the whole row, so the
            entire row is clickable; when open only the circle is. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={title}
          onClick={onToggle}
          className={`group relative grid h-[34px] w-[34px] cursor-pointer place-items-center justify-self-end rounded-full border-[1.5px] border-white bg-transparent text-white transition-colors duration-300 hover:bg-white hover:text-accent focus-visible:outline-white ${
            open ? '' : 'after:absolute after:inset-y-[calc(var(--pad)*-1)] after:right-0 after:-left-[2000px] after:content-[""]'
          }`}
        >
          <span aria-hidden="true" className="relative block h-[12px] w-[12px]">
            <span className="absolute left-0 top-1/2 h-[1.8px] w-full -translate-y-1/2 rounded-full bg-current" />
            <span
              className="absolute left-1/2 top-0 h-full w-[1.8px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300"
              style={{ transform: `translateX(-50%) scaleY(${open ? 0 : 1})` }}
            />
          </span>
        </button>
      </div>
    </div>
  );
}