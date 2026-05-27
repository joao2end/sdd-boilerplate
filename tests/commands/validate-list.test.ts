import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  cancel: vi.fn(),
}));

let tmpDir: string;
let originalCwd: string;

function createSddProject() {
  mkdirSync(join(tmpDir, '.sdd'), { recursive: true });
  mkdirSync(join(tmpDir, 'specs', '01-domain'), { recursive: true });
  mkdirSync(join(tmpDir, 'specs', '02-features'), { recursive: true });
  mkdirSync(join(tmpDir, 'src', 'domain'), { recursive: true });
  mkdirSync(join(tmpDir, 'src', 'application'), { recursive: true });

  writeFileSync(join(tmpDir, '.sdd', 'config.json'), JSON.stringify({
    projectName: 'test-project',
    runtime: 'node',
    language: 'typescript',
    framework: 'fastify',
    database: 'none',
    orm: 'none',
    testing: 'vitest',
    domains: ['products'],
    initialFeatures: ['crud-products'],
    caching: 'none',
    auth: 'none',
  }, null, 2), 'utf-8');

  writeFileSync(join(tmpDir, 'specs', '01-domain', 'products-spec.md'), `---
name: products
domain: products
type: aggregate
version: 1.0.0
status: draft
dependencies:
---
## Description
Products domain
## State
product entity
## Behavior
crud operations
## Invariants
must be unique
## Validation Rules
required fields
`, 'utf-8');

  writeFileSync(join(tmpDir, '.sdd', 'traceability.json'), JSON.stringify({
    entries: [
      {
        specPath: 'specs/01-domain/products-spec.md',
        type: 'domain',
        name: 'products',
        domain: 'products',
        status: 'draft',
        codePaths: ['src/domain/products.ts'],
        testPaths: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  }, null, 2), 'utf-8');

  writeFileSync(join(tmpDir, 'src', 'domain', 'products.ts'), 'export class Products {}', 'utf-8');
}

beforeEach(() => {
  const rawDir = join(tmpdir(), `sdd-test-cmd-${randomUUID()}`);
  mkdirSync(rawDir, { recursive: true });
  tmpDir = realpathSync(rawDir);
  originalCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('validate command', () => {
  it('cancels when not in an SDD project', async () => {
    // No .sdd dir
    const { cancel } = await import('@clack/prompts');
    const { validateCommand } = await import('../../src/commands/validate.js');
    await validateCommand();
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining('Not an SDD project'));
  });

  it('validates a project with specs and traceability', async () => {
    createSddProject();
    const { cancel } = await import('@clack/prompts');
    const { validateCommand } = await import('../../src/commands/validate.js');
    await validateCommand();
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe('list command', () => {
  it('shows message when not in an SDD project', async () => {
    const { outro } = await import('@clack/prompts');
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({});
    expect(outro).toHaveBeenCalledWith(expect.stringContaining('Not an SDD project'));
  });

  it('shows specs when in an SDD project', async () => {
    createSddProject();
    const { outro } = await import('@clack/prompts');
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ status: true });
    // Should NOT show "no specs" message
    expect(outro).not.toHaveBeenCalledWith(expect.stringContaining('No specs found'));
  });
});
