import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { loadTraceability, saveTraceability, addTraceEntry, removeTraceEntry } from '../../src/utils/traceability.js';
import type { TraceEntry } from '../../src/utils/traceability.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `sdd-test-trace-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function makeEntry(overrides: Partial<TraceEntry> = {}): TraceEntry {
  return {
    specPath: 'specs/01-domain/products-spec.md',
    type: 'domain',
    name: 'products',
    domain: 'products',
    status: 'draft',
    codePaths: ['src/products/'],
    testPaths: ['tests/products/'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('traceability', () => {
  describe('loadTraceability', () => {
    it('returns empty entries when no trace file exists', () => {
      const trace = loadTraceability(tmpDir);
      expect(trace.entries).toEqual([]);
    });
  });

  describe('saveTraceability', () => {
    it('creates .sdd directory and saves trace file', () => {
      const trace = { entries: [makeEntry()] };
      saveTraceability(tmpDir, trace);

      const tracePath = join(tmpDir, '.sdd', 'traceability.json');
      expect(existsSync(tracePath)).toBe(true);

      const saved = JSON.parse(readFileSync(tracePath, 'utf-8'));
      expect(saved.entries).toHaveLength(1);
      expect(saved.entries[0].name).toBe('products');
    });
  });

  describe('addTraceEntry', () => {
    it('adds a new entry to traceability', () => {
      addTraceEntry(tmpDir, makeEntry());
      const trace = loadTraceability(tmpDir);
      expect(trace.entries).toHaveLength(1);
    });

    it('adds multiple entries', () => {
      addTraceEntry(tmpDir, makeEntry({ specPath: 'specs/01-domain/products-spec.md', name: 'products' }));
      addTraceEntry(tmpDir, makeEntry({ specPath: 'specs/01-domain/competitors-spec.md', name: 'competitors' }));
      const trace = loadTraceability(tmpDir);
      expect(trace.entries).toHaveLength(2);
    });

    it('updates existing entry with same specPath', () => {
      addTraceEntry(tmpDir, makeEntry({ specPath: 'specs/product-spec.md', status: 'draft' }));
      addTraceEntry(tmpDir, makeEntry({ specPath: 'specs/product-spec.md', status: 'implemented' }));
      const trace = loadTraceability(tmpDir);
      expect(trace.entries).toHaveLength(1);
      expect(trace.entries[0].status).toBe('implemented');
    });
  });

  describe('removeTraceEntry', () => {
    it('removes an entry by specPath', () => {
      addTraceEntry(tmpDir, makeEntry({ specPath: 'specs/products-spec.md' }));
      addTraceEntry(tmpDir, makeEntry({ specPath: 'specs/competitors-spec.md' }));
      removeTraceEntry(tmpDir, 'specs/products-spec.md');

      const trace = loadTraceability(tmpDir);
      expect(trace.entries).toHaveLength(1);
      expect(trace.entries[0].specPath).toBe('specs/competitors-spec.md');
    });

    it('does nothing when specPath does not exist', () => {
      addTraceEntry(tmpDir, makeEntry());
      removeTraceEntry(tmpDir, 'nonexistent');
      const trace = loadTraceability(tmpDir);
      expect(trace.entries).toHaveLength(1);
    });
  });
});
