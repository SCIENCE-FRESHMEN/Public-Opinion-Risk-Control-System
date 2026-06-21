import { useMemo } from 'react';

import { useFiltersQuery } from './useFiltersQuery';

export function useInstrumentName(symbol?: string | null) {
  const { data } = useFiltersQuery();

  return useMemo(() => {
    if (!symbol) {
      return '';
    }

    const instruments = data?.instrument_groups?.flatMap((group) => group.instruments) ?? [];
    return instruments.find((instrument) => instrument.symbol === symbol)?.name ?? symbol;
  }, [data?.instrument_groups, symbol]);
}
