/** Join an API base and request path without duplicating an existing /api prefix. */
export function buildApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseAlreadyIncludesApi = /\/api$/i.test(base);

  if (baseAlreadyIncludesApi && /^\/api(?:\/|$)/i.test(normalizedPath)) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
}