import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface TraceEntry {
  specPath: string;
  type: 'domain' | 'feature' | 'api';
  name: string;
  domain: string;
  status: 'draft' | 'implemented' | 'deprecated';
  codePaths: string[];
  testPaths: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Traceability {
  entries: TraceEntry[];
}

function getTracePath(cwd: string): string {
  return join(cwd, '.sdd', 'traceability.json');
}

export function loadTraceability(cwd: string): Traceability {
  const path = getTracePath(cwd);
  if (!existsSync(path)) {
    return { entries: [] };
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function saveTraceability(cwd: string, trace: Traceability): void {
  const dir = join(cwd, '.sdd');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(getTracePath(cwd), JSON.stringify(trace, null, 2), 'utf-8');
}

export function addTraceEntry(cwd: string, entry: TraceEntry): void {
  const trace = loadTraceability(cwd);
  const existing = trace.entries.findIndex(e => e.specPath === entry.specPath);
  if (existing >= 0) {
    trace.entries[existing] = { ...trace.entries[existing], ...entry, updatedAt: new Date().toISOString() };
  } else {
    trace.entries.push(entry);
  }
  saveTraceability(cwd, trace);
}

export function removeTraceEntry(cwd: string, specPath: string): void {
  const trace = loadTraceability(cwd);
  trace.entries = trace.entries.filter(e => e.specPath !== specPath);
  saveTraceability(cwd, trace);
}
