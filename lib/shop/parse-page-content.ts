function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeHref(value: string): string | null {
  const href = value.trim();
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  try {
    const parsed = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function inlineFormat(text: string): string {
  const token = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\))/g;
  let result = '';
  let lastIndex = 0;
  for (const match of text.matchAll(token)) {
    const index = match.index ?? 0;
    result += escapeHtml(text.slice(lastIndex, index));
    if (match[2] !== undefined) {
      result += `<strong class="text-ink font-medium">${escapeHtml(match[2])}</strong>`;
    } else {
      const href = safeHref(match[4]);
      const label = escapeHtml(match[3]);
      result += href
        ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-ink transition-colors">${label}</a>`
        : label;
    }
    lastIndex = index + match[0].length;
  }
  return result + escapeHtml(text.slice(lastIndex));
}

export function parsePageContent(raw: string): string {
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) { out.push('</ul>'); inList = false; }
  };

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trimEnd();
    if (line.startsWith('## ')) {
      closeList();
      out.push(`<h2 class="font-serif text-[20px] font-normal text-ink mb-3 mt-8 first:mt-0">${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul class="mt-3 space-y-1.5 list-disc list-inside">'); inList = true; }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
    } else if (line === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p class="mt-3 first:mt-0">${inlineFormat(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}
