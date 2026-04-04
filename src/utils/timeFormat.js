/** @param {string|null|undefined} t - "HH:MM" 24h */
export function formatTimeBadge(t) {
  if (!t || typeof t !== 'string') return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const am = h < 12 || h === 24;
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${min} ${am ? 'AM' : 'PM'}`;
}

export function plainTextFromHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ').trim();
}
