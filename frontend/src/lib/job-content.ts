const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'a',
  'span',
  'div',
]);

function decodeBasicEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

function isSafeHref(value: string) {
  const href = value.trim().toLowerCase();
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('/') ||
    href.startsWith('#')
  );
}

function sanitizeAttributes(tag: string, attrs: string) {
  if (tag !== 'a') return '';

  const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '';
  if (!href || !isSafeHref(href)) return '';

  return ` href="${href.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer"`;
}

/**
 * Sanitize job description HTML for safe rendering.
 * Allows common formatting tags only; strips scripts/events/unknown markup.
 */
export function sanitizeJobDescriptionHtml(input?: string | null): string {
  if (!input?.trim()) return '';

  let html = decodeBasicEntities(input)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');

  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full, rawTag: string, rawAttrs = '') => {
    const tag = rawTag.toLowerCase();
    const isClosing = full.startsWith('</');

    if (!ALLOWED_TAGS.has(tag)) {
      return tag === 'br' ? '<br />' : '';
    }

    if (isClosing) return `</${tag}>`;
    if (tag === 'br') return '<br />';

    return `<${tag}${sanitizeAttributes(tag, rawAttrs)}>`;
  });

  return html.trim();
}

export function dedupeSkills(skills?: string[] | null): string[] {
  if (!skills?.length) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of skills) {
    const value = String(skill || '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
