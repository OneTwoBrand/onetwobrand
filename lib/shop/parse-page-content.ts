/**
 * Minimal markdown-to-HTML renderer for editable shop pages.
 * Supports: ## headings, **bold**, - lists, blank-line paragraphs.
 * No dependencies — avoids adding a full markdown library for simple content.
 */
export function parsePageContent(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) { out.push('</ul>'); inList = false; }
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-medium">$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline underline-offset-2 hover:text-ink transition-colors">$1</a>');
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('## ')) {
      closeList();
      out.push(`<h2 class="font-serif text-[20px] font-normal text-ink mb-3 mt-8 first:mt-0">${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul class="mt-3 space-y-1.5 list-disc list-inside">'); inList = true; }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }

    if (line === '') {
      closeList();
      continue;
    }

    closeList();
    out.push(`<p class="mt-3 first:mt-0">${inlineFormat(line)}</p>`);
  }

  closeList();
  return out.join('\n');
}
