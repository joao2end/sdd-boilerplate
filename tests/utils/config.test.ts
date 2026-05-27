import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

let tmpDir: string;

beforeEach(() => {
  const rawDir = join(tmpdir(), `sdd-test-config-${randomUUID()}`);
  mkdirSync(rawDir, { recursive: true });
  tmpDir = realpathSync(rawDir);
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe('config', () => {
  it('loadConfig throws when no config exists', async () => {
    const { loadConfig } = await import('../../src/utils/config.js');
    expect(() => loadConfig('/nonexistent')).toThrow('SDD config not found');
  });

  it('saveConfig writes config.json', async () => {
    const { saveConfig } = await import('../../src/utils/config.js');
    saveConfig(tmpDir, {
      projectName: 'test',
      description: 'desc',
      runtime: 'node',
      language: 'typescript',
      framework: 'fastify',
      validation: 'zod',
      database: 'postgresql',
      orm: 'drizzle',
      testing: 'vitest',
      domains: ['dom1'],
      initialFeatures: ['feat1'],
      caching: 'redis',
      messaging: 'none',
      auth: 'apikey',
    });
    expect(existsSync(join(tmpDir, '.sdd', 'config.json'))).toBe(true);
  });

  it('loadConfig reads back saved config', async () => {
    const { saveConfig, loadConfig } = await import('../../src/utils/config.js');
    saveConfig(tmpDir, {
      projectName: 'my-project',
      description: 'My project',
      runtime: 'bun',
      language: 'typescript',
      framework: 'nestjs',
      validation: 'zod',
      database: 'sqlite',
      orm: 'prisma',
      testing: 'jest',
      domains: ['users'],
      initialFeatures: ['create-user'],
      caching: 'none',
      messaging: 'none',
      auth: 'jwt',
    });
    const config = loadConfig(tmpDir);
    expect(config.projectName).toBe('my-project');
    expect(config.runtime).toBe('bun');
    expect(config.framework).toBe('nestjs');
    expect(config.domains).toEqual(['users']);
    expect(config.initialFeatures).toEqual(['create-user']);
    expect(config.auth).toBe('jwt');
  });
});
