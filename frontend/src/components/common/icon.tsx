const ICONS: Record<string, string> = {
  dashboard: '▦',
  show_chart: '⌁',
  newspaper: '▤',
  history: '↺',
  search: '⌕',
  calendar_today: '◷',
  calendar_clock: '◴',
  expand_more: '⌄',
  notifications: '◉',
  settings: '⚙',
  schedule: '◷',
  warning: '▲',
  anchor: '⚓',
  remove: '—',
};

export function Icon({
  name,
  className = '',
}: {
  name: keyof typeof ICONS | string;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={className}>
      {ICONS[name] ?? '•'}
    </span>
  );
}
