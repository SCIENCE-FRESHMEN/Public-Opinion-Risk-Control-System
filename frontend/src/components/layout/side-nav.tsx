import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { Icon } from '../common/icon';
import { filterInstrumentGroups } from '../../features/meta/filterable-instrument-list';
import { useFiltersQuery } from '../../features/meta/useFiltersQuery';
import { readPersistedFilters, useFiltersStore } from '../../store/filters';

const items = [
  { to: '/', label: '因子总览', icon: 'dashboard' },
  { to: '/stock', label: '个股因子', icon: 'query_stats' },
  { to: '/backtest', label: '因子验证', icon: 'history' },
  { to: '/news', label: '舆情证据', icon: 'newspaper' }
];

export function SideNav() {
  const hydratedRef = useRef(false);
  const { data } = useFiltersQuery();
  const { ticker, startDate, endDate, setFilters } = useFiltersStore();
  const [pendingTicker, setPendingTicker] = useState(ticker);
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);
  const [instrumentKeyword, setInstrumentKeyword] = useState('');
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);
  const lastTickerRef = useRef<string | null>(null);

  const instrumentGroups = data?.instrument_groups ?? [];
  const filteredGroups = filterInstrumentGroups(instrumentGroups, instrumentKeyword);
  const selectedInstrumentGroup = instrumentGroups.find((group) =>
    group.instruments.some((instrument) => instrument.symbol === pendingTicker)
  );

  useEffect(() => {
    if (hydratedRef.current || !data?.defaults) {
      return;
    }

    hydratedRef.current = true;
    const availableTickers = new Set(data.tickers ?? []);
    const persisted = readPersistedFilters();
    const persistedTicker = persisted?.ticker;
    const persistedStartDate = persisted?.startDate;
    const persistedEndDate = persisted?.endDate;
    const persistedLastSyncedEndDate = persisted?.lastSyncedEndDate;
    const hasPersistedTicker = Boolean(persistedTicker && availableTickers.has(persistedTicker));
    const hasExistingSelection =
      Boolean(ticker && startDate && endDate) &&
      availableTickers.has(ticker) &&
      (ticker !== '600519.SH' || startDate !== '2020-01-01' || endDate !== '2026-04-22');

    if (hasPersistedTicker) {
      const nextTicker = persistedTicker ?? data.defaults.ticker;
      const nextStartDate = persistedStartDate || data.defaults.start_date;
      const shouldRollEndDate =
        !persistedLastSyncedEndDate || persistedLastSyncedEndDate < data.defaults.end_date;
      const nextEndDate = shouldRollEndDate ? data.defaults.end_date : (persistedEndDate || data.defaults.end_date);
      setFilters({
        ticker: nextTicker,
        startDate: nextStartDate,
        endDate: nextEndDate,
      });
      if (typeof window !== 'undefined' && 'localStorage' in window && typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(
          'formal-ui-filters',
          JSON.stringify({
            ticker: nextTicker,
            startDate: nextStartDate,
            endDate: nextEndDate,
            lastSyncedEndDate: data.defaults.end_date,
          }),
        );
      }
      setPendingTicker(nextTicker);
      setPendingStartDate(nextStartDate);
      setPendingEndDate(nextEndDate);
      return;
    }

    if (hasExistingSelection) {
      const nextEndDate = data.defaults.end_date;
      setFilters({
        ticker,
        startDate,
        endDate: nextEndDate,
      });
      if (typeof window !== 'undefined' && 'localStorage' in window && typeof window.localStorage?.setItem === 'function') {
        window.localStorage.setItem(
          'formal-ui-filters',
          JSON.stringify({
            ticker,
            startDate,
            endDate: nextEndDate,
            lastSyncedEndDate: data.defaults.end_date,
          }),
        );
      }
      setPendingTicker(ticker);
      setPendingStartDate(startDate);
      setPendingEndDate(nextEndDate);
      return;
    }

    setFilters({
      ticker: data.defaults.ticker,
      startDate: data.defaults.start_date,
      endDate: data.defaults.end_date,
    });
    if (typeof window !== 'undefined' && 'localStorage' in window && typeof window.localStorage?.setItem === 'function') {
      window.localStorage.setItem(
        'formal-ui-filters',
        JSON.stringify({
          ticker: data.defaults.ticker,
          startDate: data.defaults.start_date,
          endDate: data.defaults.end_date,
          lastSyncedEndDate: data.defaults.end_date,
        }),
      );
    }
    setPendingTicker(data.defaults.ticker);
    setPendingStartDate(data.defaults.start_date);
    setPendingEndDate(data.defaults.end_date);
  }, [data?.defaults, data?.tickers, setFilters]);

  useEffect(() => {
    setPendingTicker(ticker);
  }, [ticker]);

  useEffect(() => {
    setPendingStartDate(startDate);
  }, [startDate]);

  useEffect(() => {
    setPendingEndDate(endDate);
  }, [endDate]);

  useEffect(() => {
    if (!instrumentGroups.length) {
      return;
    }

    if (!activeGroupName) {
      const initialGroup = selectedInstrumentGroup?.group_name ?? instrumentGroups[0].group_name;
      setActiveGroupName(initialGroup);
      lastTickerRef.current = pendingTicker;
      return;
    }

    if (lastTickerRef.current !== pendingTicker && selectedInstrumentGroup) {
      setActiveGroupName(selectedInstrumentGroup.group_name);
      lastTickerRef.current = pendingTicker;
    }
  }, [activeGroupName, instrumentGroups, pendingTicker, selectedInstrumentGroup]);

  const handleApplyFilters = () => {
    setFilters({
      ticker: pendingTicker,
      startDate: pendingStartDate,
      endDate: pendingEndDate,
    });
  };

  const minDate = data?.date_range.start ?? '2020-01-01';
  const maxDate = data?.date_range.end ?? endDate;
  const visibleGroups = instrumentKeyword
    ? filteredGroups
    : filteredGroups.filter((group) => !activeGroupName || group.group_name === activeGroupName);
  const selectOptions = instrumentGroups.flatMap((group) => group.instruments);

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col overflow-y-auto overflow-x-hidden border-r border-white/[0.04] bg-[var(--nav-bg)] text-[var(--color-on-surface)]">
      <div className="px-5 pb-5 pt-4">
        <div className="font-headline text-[18px] font-bold tracking-[-0.02em] text-white">上市公司舆情风控指挥台</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-outline)]">上市公司舆情风控中枢</div>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'group mx-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors duration-150 ease-in-out',
                isActive
                  ? 'border-r-4 border-[var(--color-nav-accent)] bg-[rgba(79,70,229,0.18)] text-[rgb(196,181,253)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-white/[0.04] hover:text-white',
              ].join(' ')
            }
          >
            <Icon name={item.icon} className="text-[18px]" />
            <span className="font-body">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 border-t border-white/[0.04] px-4 pb-4 pt-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="global-ticker" className="mb-2 ml-1 block font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">
              全局标的
            </label>
            <select
              id="global-ticker"
              aria-label="全局标的"
              value={pendingTicker}
              onChange={(event) => {
                const nextTicker = event.target.value;
                setPendingTicker(nextTicker);
                const nextGroup = instrumentGroups.find((group) =>
                  group.instruments.some((instrument) => instrument.symbol === nextTicker)
                );

                if (nextGroup) {
                  setInstrumentKeyword('');
                  setActiveGroupName(nextGroup.group_name);
                }
              }}
              className="sr-only"
            >
              {selectOptions.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.symbol}
                </option>
              ))}
            </select>
            <div className="ghost-border rounded-sm bg-[var(--color-surface-lowest)] p-3">
              <div className="mb-3 flex items-center gap-2 rounded-sm border border-white/[0.06] bg-black/10 px-3 py-2">
                <Icon name="search" className="text-[15px] text-[var(--color-outline)]" />
                <input
                  type="text"
                  value={instrumentKeyword}
                  onChange={(event) => setInstrumentKeyword(event.target.value)}
                  placeholder="搜索代码或股票简称"
                  className="w-full bg-transparent font-label text-sm text-white outline-none placeholder:text-[var(--color-outline)]"
                />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {instrumentGroups.map((group) => {
                  const isActive = activeGroupName === group.group_name;
                  return (
                    <button
                      key={group.group_name}
                      type="button"
                      onClick={() => {
                        setInstrumentKeyword('');
                        setActiveGroupName(group.group_name);
                      }}
                      className={[
                        'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                        isActive
                          ? 'border-[var(--color-nav-accent)] bg-[rgba(79,70,229,0.2)] text-white'
                          : 'border-white/[0.08] bg-white/[0.02] text-[var(--color-on-surface-variant)] hover:text-white',
                      ].join(' ')}
                    >
                      {group.group_name}
                    </button>
                  );
                })}
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {visibleGroups.map((group) => (
                  <div key={group.group_name}>
                    {instrumentKeyword ? (
                      <div className="mb-2 px-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">
                        {group.group_name}
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      {group.instruments.map((instrument) => {
                        const isSelected = instrument.symbol === pendingTicker;
                        return (
                          <button
                            key={instrument.symbol}
                            type="button"
                            onClick={() => {
                              setPendingTicker(instrument.symbol);
                              setActiveGroupName(group.group_name);
                            }}
                            className={[
                              'flex w-full items-center justify-between rounded-sm px-3 py-2 text-left transition-colors',
                              isSelected
                                ? 'bg-[rgba(51,133,246,0.18)] text-white'
                                : 'bg-white/[0.02] text-[var(--color-on-surface-variant)] hover:bg-white/[0.05] hover:text-white',
                            ].join(' ')}
                          >
                            <span className="font-body text-sm">{instrument.name}</span>
                            <span className="font-label text-[11px] text-[var(--color-outline)]">{instrument.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {visibleGroups.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-white/[0.08] px-3 py-4 text-center text-xs text-[var(--color-outline)]">
                    未找到匹配标的
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 ml-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">日期范围</div>
            <div className="space-y-2">
              <label htmlFor="global-start-date" className="sr-only">开始日期</label>
              <div className="ghost-border flex items-center gap-2 rounded-sm bg-[var(--color-surface-lowest)] px-3 py-2.5">
                <Icon name="calendar_today" className="text-[15px] text-[var(--color-outline)]" />
                <input
                  id="global-start-date"
                  aria-label="开始日期"
                  type="date"
                  min={minDate}
                  max={pendingEndDate || maxDate}
                  value={pendingStartDate}
                  onChange={(event) => setPendingStartDate(event.target.value)}
                  className="w-full bg-transparent font-label text-sm text-white outline-none [color-scheme:dark]"
                />
              </div>
              <label htmlFor="global-end-date" className="sr-only">结束日期</label>
              <div className="ghost-border flex items-center gap-2 rounded-sm bg-[var(--color-surface-lowest)] px-3 py-2.5">
                <Icon name="calendar_today" className="text-[15px] text-[var(--color-outline)]" />
                <input
                  id="global-end-date"
                  aria-label="结束日期"
                  type="date"
                  min={pendingStartDate || minDate}
                  max={maxDate}
                  value={pendingEndDate}
                  onChange={(event) => setPendingEndDate(event.target.value)}
                  className="w-full bg-transparent font-label text-sm text-white outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="w-full rounded-sm bg-[linear-gradient(180deg,#3385f6,#2878ea)] px-4 py-3 font-body text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            应用全局筛选
          </button>
        </div>
      </div>
    </aside>
  );
}
