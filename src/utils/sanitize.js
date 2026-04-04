import DOMPurify from 'dompurify';

const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color']);

function sanitizeStyleValue(prop, value) {
  const v = String(value).trim().toLowerCase();
  if (prop === 'color' || prop === 'background-color') {
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) return v;
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(v)) return v;
    if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(v)) return v;
  }
  return null;
}

function filterStyleString(style) {
  if (!style) return '';
  const parts = style.split(';');
  const out = [];
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim().toLowerCase();
    const rawVal = part.slice(idx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(name)) continue;
    const safe = sanitizeStyleValue(name, rawVal);
    if (safe) out.push(`${name}: ${safe}`);
  }
  return out.join('; ');
}

function uponSanitizeAttribute(node, data) {
  if (data.attrName === 'style' && data.attrValue) {
    const filtered = filterStyleString(data.attrValue);
    if (filtered) {
      node.setAttribute('style', filtered);
    } else {
      node.removeAttribute('style');
    }
  }
}

DOMPurify.addHook('uponSanitizeAttribute', uponSanitizeAttribute);

/** Sanitize rich task HTML: tags + limited inline color/highlight styles only. */
export function sanitizeRichHtml(dirty) {
  if (typeof dirty !== 'string' || !dirty.trim()) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'span', 'br', 'div'],
    ALLOWED_ATTR: ['style'],
    KEEP_CONTENT: true,
  });
}

export function sanitizePlainText(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '');
}
