import { useMemo, useState } from 'react';

import { Icon } from '../common/icon';
import { filterInstrumentGroups } from '../../features/meta/filterable-instrument-list';
import { useFiltersQuery } from '../../features/meta/useFiltersQuery';
import { useFiltersStore } from '../../store/filters';

export function TopNav() {
  const { data } = useFiltersQuery();
  const { startDate, endDate, setFilters } = useFiltersStore();
  const [keyword, setKeyword] = useState('');
  const instrumentGroups = data?.instrument_groups ?? [];
  const matchedInstruments = useMemo(
    () => filterInstrumentGroups(instrumentGroups, keyword).flatMap((group) => group.instruments),
    [instrumentGroups, keyword]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstMatch = matchedInstruments[0];
    if (!firstMatch) {
      return;
    }

    setFilters({
      ticker: firstMatch.symbol,
      startDate,
      endDate,
    });
    setKeyword(firstMatch.name);
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-20 grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-white/[0.05] bg-[var(--topbar-bg)] px-5 backdrop-blur-md">
      <div className="flex items-center">
        <form aria-label="顶部股票搜索" className="relative hidden md:block" onSubmit={handleSubmit}>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6b7288]" />
          <input
            aria-label="搜索"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-9 w-[192px] rounded-[12px] border border-white/[0.04] bg-[#10172b] pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#56617b] focus:border-[rgba(173,199,255,0.22)] lg:w-[260px]"
            placeholder="搜索..."
          />
        </form>
      </div>
      <div className="justify-self-center font-headline text-[18px] font-semibold tracking-[-0.02em] text-white">券商舆情风控态势</div>
      <div className="flex items-center justify-self-end gap-4">
        <button aria-label="通知" className="text-[20px] text-[var(--color-on-surface-variant)] transition-colors hover:text-white"><Icon name="notifications" /></button>
        <button aria-label="设置" className="text-[20px] text-[var(--color-on-surface-variant)] transition-colors hover:text-white"><Icon name="settings" /></button>
        <div className="h-7 w-px bg-white/[0.06]" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(45,219,222,0.55)] bg-[var(--color-surface-highest)] font-label text-[10px] text-white">
          中枢
        </div>
      </div>
    </header>
  );
}
