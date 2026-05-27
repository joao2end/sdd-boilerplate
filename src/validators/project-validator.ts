import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadTraceability } from '../utils/traceability.js';
import { parseSpec } from '../parsers/spec-parser.js';

export interface ProjectValidationResult {
  valid: boolean;
  totalSpecs: number;
  implementedCount: number;
  untrackedCode: string[];
  orphanSpecs: string[];
  deprecatedCount: number;
  details: string[];
}

export async function validateProject(cwd: string): Promise<ProjectValidationResult> {
  const trace = loadTraceability(cwd);
  const details: string[] = [];
  const untrackedCode: string[] = [];
  const orphanSpecs: string[] = [];

  let implementedCount = 0;
  let deprecatedCount = 0;

  for (const entry of trace.entries) {
    if (entry.status === 'implemented') {
      implementedCount++;
    }
    if (entry.status === 'deprecated') {
      deprecatedCount++;
    }

    if (!existsSync(join(cwd, entry.specPath))) {
      orphanSpecs.push(entry.specPath);
      details.push(`✗ Spec file not found: ${entry.specPath}`);
    } else {
      details.push(`✓ ${entry.specPath} (${entry.status})`);
    }

    for (const codePath of entry.codePaths) {
      const fullPath = join(cwd, codePath);
      if (!existsSync(fullPath)) {
        details.push(`  ⚠ Code file not found: ${codePath}`);
      }
    }
  }

  const srcDir = join(cwd, 'src');
  if (existsSync(srcDir)) {
    const allSrcFiles = await findFiles(srcDir, '.ts');
    const trackedCode = new Set(trace.entries.flatMap(e => e.codePaths));
    for (const file of allSrcFiles) {
      if (!trackedCode.has(file)) {
        untrackedCode.push(file);
      }
    }
  }

  return {
    valid: orphanSpecs.length === 0,
    totalSpecs: trace.entries.length,
    implementedCount,
    untrackedCode,
    orphanSpecs,
    deprecatedCount,
    details,
  };
}

async function findFiles(dir: string, ext: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(d: string) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name.endsWith(ext)) {
        files.push(full.replace(/^\.\//, ''));
      }
    }
  }

  await walk(dir);
  return files.map(f => f.startsWith('/') ? f : f.slice(f.indexOf('/') + 1));
}
