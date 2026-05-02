export type HudStat = [label: string, value: string];

export function GameHud({
  stats,
  columns = stats.length,
}: {
  stats: HudStat[];
  columns?: number;
}) {
  return (
    <div
      className="pointer-events-none fixed left-3 right-3 top-3 z-20 grid gap-2 sm:left-4 sm:right-4 sm:top-4 sm:gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {stats.map(([label, value]) => (
        <div
          key={label}
          className="rounded-md border border-white/10 bg-black/45 px-3 py-2 backdrop-blur"
        >
          <span className="block text-[11px] text-white/60">{label}</span>
          <strong className="mt-0.5 block text-base leading-none sm:text-lg">
            {value}
          </strong>
        </div>
      ))}
    </div>
  );
}
