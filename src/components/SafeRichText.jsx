import { sanitizeRichHtml } from '../utils/sanitize';
import { richHtmlToReact } from '../utils/htmlToReact';

export function SafeRichText({ html, className = '' }) {
  const clean = sanitizeRichHtml(html || '');
  const node = richHtmlToReact(clean);
  if (!node) {
    return <span className={className} />;
  }
  return <span className={`inline leading-relaxed ${className}`}>{node}</span>;
}
