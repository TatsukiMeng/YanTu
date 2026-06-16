export const PORT = parseInt(process.env.PORT || '3000');
export const BASE_URL = `http://localhost:${PORT}`;

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=0052d9&color=fff&size=150&name=%E5%BE%AE%E4%BF%A1%E7%94%A8%E6%88%B7';

export function absUrl(url?: string | null): string {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function absUrls(urls?: string[] | null): string[] {
  return (urls || []).map(absUrl);
}
