const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiGet<T>(path: string, params?: Record<string, string | number>) {
  const url = API_BASE ? new URL(`${API_BASE}${path}`) : new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }
  const requestUrl = API_BASE ? url.toString() : `${url.pathname}${url.search}`;
  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}
