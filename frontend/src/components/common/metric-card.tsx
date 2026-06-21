import type { CSSProperties, PropsWithChildren } from 'react';

export function MetricCard({
  title,
  children,
  accent = 'var(--color-outline-variant)',
  className = '',
}: PropsWithChildren<{ title: string; accent?: string; className?: string }>) {
  return (
    <div className={`intel-frame ambient-shadow-strong signal-bar relative rounded-[22px] border border-white/8 bg-[linear-gradient(160deg,rgba(37,42,52,0.96),rgba(21,24,32,0.94))] px-5 py-5 md:px-6 md:py-6 ${className}`}>
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent } as CSSProperties} />
      <div
        className="absolute right-4 top-4 h-16 w-16 rounded-full blur-2xl"
        style={{ background: accent, opacity: 0.12 } as CSSProperties}
      />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-label text-[10px] uppercase tracking-[0.24em] text-[var(--color-outline)]">指标节点</div>
        <div className="h-[1px] flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.16),transparent)]" />
      </div>
      <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
