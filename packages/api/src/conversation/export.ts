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
  sections: ExportSection[];
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '')?.trim() || '';
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString();
  } catch {
    return ts;
  }
}

export function formatTranscriptMarkdown(data: ExportData): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');

  if (data.summary) {
    lines.push(`> ${data.summary}`);
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
      lines.push(`> ${section.summary}`);
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

  return lines.join('\n');
}
