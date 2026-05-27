import { readFileSync, existsSync } from 'node:fs';

export interface SpecMetadata {
  name: string;
  domain: string;
  type: 'entity' | 'value-object' | 'aggregate' | 'feature' | 'api';
  version: string;
  status: 'draft' | 'implemented' | 'deprecated';
  dependencies: string[];
}

export interface ParsedSpec {
  metadata: SpecMetadata;
  sections: Record<string, string>;
  raw: string;
}

export function parseSpec(filePath: string): ParsedSpec | null {
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const metadata = extractMetadata(raw);
  if (!metadata) return null;

  const sections = extractSections(raw);

  return { metadata, sections, raw };
}

function extractMetadata(raw: string): SpecMetadata | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }

  return {
    name: fm.name || 'unnamed',
    domain: fm.domain || 'unknown',
    type: (fm.type as SpecMetadata['type']) || 'feature',
    version: fm.version || '1.0.0',
    status: (fm.status as SpecMetadata['status']) || 'draft',
    dependencies: fm.dependencies ? fm.dependencies.split(',').map(s => s.trim()).filter(Boolean) : [],
  };
}

function extractSections(raw: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionRegex = /^## (.+)$/gm;
  const bodies: string[] = [];
  const titles: string[] = [];

  let lastIndex = 0;
  let match;

  while ((match = sectionRegex.exec(raw)) !== null) {
    if (lastIndex > 0) {
      bodies.push(raw.slice(lastIndex, match.index).trim());
    }
    titles.push(match[1].trim().toLowerCase());
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex > 0) {
    bodies.push(raw.slice(lastIndex).trim());
  }

  for (let i = 0; i < titles.length; i++) {
    sections[titles[i]] = bodies[i] || '';
  }

  return sections;
}

export function getSpecNameFromPath(filePath: string): string {
  return filePath.replace(/\.md$/, '').split('/').pop()?.replace(/-spec$/, '') || 'unknown';
}
