import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadTraceability } from '../utils/traceability.js';
import { parseSpec } from '../parsers/spec-parser.js';
import { intro, outro } from '@clack/prompts';
import picocolors from 'picocolors';

interface ListOptions {
  status?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const cwd = process.cwd();
  if (!existsSync(join(cwd, '.sdd'))) {
    outro('Not an SDD project. Run "sdd-boilerplate init" first.');
    return;
  }

  intro('📋 SDD Project Specs');

  const trace = loadTraceability(cwd);

  if (trace.entries.length === 0) {
    outro('No specs found. Create one with "sdd-boilerplate feature <name>".');
    return;
  }

  const statusIcon: Record<string, string> = {
    draft: picocolors.yellow('⬡'),
    implemented: picocolors.green('●'),
    deprecated: picocolors.red('○'),
  };

  const typeColor: Record<string, (s: string) => string> = {
    feature: picocolors.cyan,
    entity: picocolors.magenta,
    'value-object': picocolors.blue,
    aggregate: picocolors.magenta,
    api: picocolors.yellow,
  };

  const grouped: Record<string, typeof trace.entries> = {};
  for (const entry of trace.entries) {
    const parsed = parseSpec(join(cwd, entry.specPath));
    const group = parsed?.metadata.type || 'unknown';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(entry);
  }

  for (const [type, entries] of Object.entries(grouped)) {
    const color = typeColor[type] || picocolors.white;
    console.log(`\n${picocolors.bold(color(`${type}s:`))}`);

    for (const entry of entries) {
      const icon = statusIcon[entry.status] || picocolors.gray('○');
      const statusStr = options.status ? ` ${picocolors.dim(`(${entry.status})`)}` : '';
      console.log(`  ${icon} ${entry.name} ${picocolors.dim(`(${entry.domain})`)}${statusStr}`);

      if (entry.codePaths.length > 0 && options.status) {
        for (const path of entry.codePaths) {
          const exists = existsSync(join(cwd, path));
          const mark = exists ? picocolors.green('✓') : picocolors.red('✗');
          console.log(`    ${mark} ${path}`);
        }
      }
    }
  }

  const counts = trace.entries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n${picocolors.bold('Summary:')}`);
  console.log(`  Total: ${picocolors.cyan(String(trace.entries.length))}`);
  console.log(`  ${picocolors.green('●')} Implemented: ${counts.implemented || 0}`);
  console.log(`  ${picocolors.yellow('⬡')} Draft:       ${counts.draft || 0}`);
  console.log(`  ${picocolors.red('○')} Deprecated:  ${counts.deprecated || 0}`);

  outro('');
}
