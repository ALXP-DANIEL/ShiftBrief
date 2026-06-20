"use client";

export type PulseItem = { id: string; message: string };

export function TeamPulse({ items }: { items: PulseItem[] }) {
  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(55%_48%_at_72%_52%,rgba(255,255,255,0.12),transparent_70%)]" />
      {items.map((item, index) => (
        <div
          key={item.id}
          className="team-pulse-item absolute flex max-w-[78vw] items-center gap-2.5 whitespace-nowrap rounded-full border border-current/20 bg-background/20 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-[var(--shift-home-text)] uppercase shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md sm:max-w-none sm:text-[11px]"
          style={{
            top: `${22 + ((index * 17) % 50)}%`,
            left: `${6 + ((index * 13) % 54)}%`,
            animationDelay: `${index * -2.3}s`,
            animationDuration: `${13 + ((index * 3) % 7)}s`,
          }}
        >
          <span className="size-1.5 rounded-full bg-current shadow-[0_0_14px_currentColor]" />
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
