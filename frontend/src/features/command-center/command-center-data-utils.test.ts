import { describe, expect, it } from 'vitest';

import { resolvePrimaryTicker } from './command-center-data-utils';

describe('resolvePrimaryTicker', () => {
  it('prefers overview ticker over heat top ticker to keep homepage modules aligned', () => {
    expect(
      resolvePrimaryTicker({
        overviewTicker: '600519.SH',
        linkageTicker: '600519.SH',
        filterTicker: '600519.SH',
        heatTopTicker: '000089.SZ',
        fallbackTicker: 'UNKNOWN',
      }),
    ).toBe('600519.SH');
  });

  it('falls back to filter ticker before heat top ticker when overview is unavailable', () => {
    expect(
      resolvePrimaryTicker({
        overviewTicker: undefined,
        linkageTicker: undefined,
        filterTicker: '300750.SZ',
        heatTopTicker: '000089.SZ',
        fallbackTicker: 'UNKNOWN',
      }),
    ).toBe('300750.SZ');
  });
});
