import { apiGet } from './client';

describe('apiGet', () => {
  it('uses the same origin api path by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/api/meta/health');

    expect(fetchMock).toHaveBeenCalledWith('/api/meta/health');
  });
});
