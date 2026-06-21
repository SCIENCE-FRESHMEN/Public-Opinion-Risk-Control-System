import { create } from 'zustand';

const STORAGE_KEY = 'formal-ui-filters';

interface FiltersState {
  ticker: string;
  startDate: string;
  endDate: string;
  setFilters: (payload: { ticker: string; startDate: string; endDate: string }) => void;
}

export interface PersistedFiltersPayload {
  ticker?: string;
  startDate?: string;
  endDate?: string;
  lastSyncedEndDate?: string;
}

export function readPersistedFilters(): PersistedFiltersPayload | null {
  if (
    typeof window === 'undefined' ||
    !('localStorage' in window) ||
    typeof window.localStorage?.getItem !== 'function'
  ) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PersistedFiltersPayload : null;
  } catch {
    return null;
  }
}

function persistFilters(payload: { ticker: string; startDate: string; endDate: string; lastSyncedEndDate?: string }) {
  if (
    typeof window === 'undefined' ||
    !('localStorage' in window) ||
    typeof window.localStorage?.setItem !== 'function'
  ) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

const persisted = readPersistedFilters();

export const useFiltersStore = create<FiltersState>((set) => ({
  ticker: persisted?.ticker ?? '600519.SH',
  startDate: persisted?.startDate ?? '2020-01-01',
  endDate: persisted?.endDate ?? '2026-04-22',
  setFilters: ({ ticker, startDate, endDate }) => {
    const existing = readPersistedFilters();
    persistFilters({
      ticker,
      startDate,
      endDate,
      lastSyncedEndDate: existing?.lastSyncedEndDate,
    });
    set({ ticker, startDate, endDate });
  },
}));
