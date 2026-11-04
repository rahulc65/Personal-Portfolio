export default function SkillList({ title, items }) {
  return (
    <div className="skills__group mb-[clamp(28px,3.4vw,44px)] last:mb-0">
      <h3 className="skills__group-title m-0 mb-[clamp(10px,1.2vw,16px)] font-mono text-[clamp(17px,1.7vw,25px)] font-bold tracking-[-0.01em] text-white">
        {title}
      </h3>
      <ul className="m-0 list-none p-0">
        {items.map(({ name, value }) => (
          <li
            key={name}
            className="skills__row flex items-baseline opacity-80 justify-between gap-4 py-[clamp(9px,1vw,12px)] font-mono text-[clamp(14px,1.25vw,18.5px)] font-bold text-white"
          >
            <span>{name}</span>
            <span className="skills__value tabular-nums">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}