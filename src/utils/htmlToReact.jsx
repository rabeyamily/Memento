import { createElement, Fragment } from 'react';

const TAG_MAP = {
  b: 'b',
  strong: 'b',
  i: 'i',
  em: 'i',
  u: 'u',
  s: 's',
  strike: 's',
  span: 'span',
  div: 'span',
  br: 'br',
};

function walk(node, keyPrefix) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent;
    return t ? t : null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node;
  const tag = TAG_MAP[el.tagName.toLowerCase()];
  if (!tag) return null;

  if (tag === 'br') {
    return createElement('br', { key: keyPrefix });
  }

  const style = {};
  const raw = el.getAttribute('style');
  if (raw) {
    raw.split(';').forEach((part) => {
      const i = part.indexOf(':');
      if (i === -1) return;
      const name = part.slice(0, i).trim().toLowerCase();
      const v = part.slice(i + 1).trim();
      if (name === 'color') style.color = v;
      if (name === 'background-color') style.backgroundColor = v;
    });
  }

  const children = [];
  el.childNodes.forEach((child, idx) => {
    const c = walk(child, `${keyPrefix}-${idx}`);
    if (c !== null && c !== undefined && c !== '') children.push(c);
  });

  const props = { key: keyPrefix };
  if (Object.keys(style).length) props.style = style;

  return createElement(tag, props, ...children);
}

/**
 * Renders sanitized HTML as React elements (no dangerouslySetInnerHTML).
 * Pass only strings that were produced by sanitizeRichHtml.
 */
export function richHtmlToReact(html) {
  if (!html || typeof html !== 'string') return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const container = doc.body;
  if (!container) return null;

  const out = [];
  container.childNodes.forEach((child, idx) => {
    const c = walk(child, `r-${idx}`);
    if (c !== null && c !== undefined && c !== '') out.push(c);
  });

  if (out.length === 0) return null;
  if (out.length === 1) return out[0];
  return createElement(Fragment, null, ...out);
}
