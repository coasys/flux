import { SynergyItem } from '@coasys/flux-utils';

interface ExportSection {
  name: string;
  summary: string;
  items: (SynergyItem & { authorName: string })[];
}

interface ExportData {
  title: string;
  summary: string;
  topics: string[];
  participants?: string[];
  date?: string;
  sections: ExportSection[];
  unprocessedItems?: (SynergyItem & { authorName: string })[];
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '')?.trim() || '';
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  } catch {
    return ts;
  }
}

function blockquote(text: string): string {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

export function formatTranscriptMarkdown(data: ExportData): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');

  if (data.date) {
    lines.push(`**Date:** ${formatTimestamp(data.date)}`);
  }

  if (data.participants && data.participants.length > 0) {
    lines.push(`**Participants:** ${data.participants.join(', ')}`);
  }

  if (data.date || (data.participants && data.participants.length > 0)) {
    lines.push('');
  }

  if (data.summary) {
    lines.push(blockquote(data.summary));
    lines.push('');
  }

  if (data.topics.length > 0) {
    lines.push(`**Topics:** ${data.topics.map((t) => `#${t}`).join(', ')}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  for (const section of data.sections) {
    if (section.name) {
      lines.push(`## ${section.name}`);
      lines.push('');
    }

    if (section.summary) {
      lines.push(blockquote(section.summary));
      lines.push('');
    }

    for (const item of section.items) {
      const text = stripHtml(item.text);
      if (!text) continue;

      const time = formatTimestamp(item.timestamp);
      lines.push(`**${item.authorName}** _(${time})_`);
      lines.push(text);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  if (data.unprocessedItems && data.unprocessedItems.length > 0) {
    lines.push(`## Unprocessed Messages (${data.unprocessedItems.length})`);
    lines.push('');

    for (const item of data.unprocessedItems) {
      const text = stripHtml(item.text);
      if (!text) continue;

      const time = formatTimestamp(item.timestamp);
      lines.push(`**${item.authorName}** _(${time})_`);
      lines.push(text);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
