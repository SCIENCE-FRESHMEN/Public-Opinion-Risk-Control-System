type ResolvePrimaryTickerOptions = {
  overviewTicker?: string;
  linkageTicker?: string;
  filterTicker?: string;
  heatTopTicker?: string;
  fallbackTicker: string;
};

export function resolvePrimaryTicker({
  overviewTicker,
  linkageTicker,
  filterTicker,
  heatTopTicker,
  fallbackTicker,
}: ResolvePrimaryTickerOptions): string {
  return overviewTicker ?? linkageTicker ?? filterTicker ?? heatTopTicker ?? fallbackTicker;
}
