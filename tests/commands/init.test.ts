import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

vi.mock('@clack/prompts', () => {
  const confirmMock = vi.fn()
    .mockResolvedValueOnce(true); // Run opencode AI? → yes
  const textMock = vi.fn()
    .mockResolvedValueOnce('test-project') // project name
    .mockResolvedValueOnce('A test project for integration testing') // description
    .mockResolvedValueOnce('products, competitors') // domains
    .mockResolvedValueOnce('crud-products, crud-competitors'); // features
  const selectMock = vi.fn()
    .mockResolvedValueOnce('bun')       // runtime
    .mockResolvedValueOnce('typescript') // language
    .mockResolvedValueOnce('fastify')    // framework
    .mockResolvedValueOnce('zod')        // validation
    .mockResolvedValueOnce('postgresql') // database
    .mockResolvedValueOnce('drizzle')    // ORM
    .mockResolvedValueOnce('vitest')     // testing
    .mockResolvedValueOnce('redis')      // caching
    .mockResolvedValueOnce('apikey');    // auth
  return {
    intro: vi.fn(),
    text: textMock,
    select: selectMock,
    confirm: confirmMock,
    outro: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    cancel: vi.fn(),
  };
});

vi.mock('../../src/opencode/runner.js', () => ({
  runOpencode: vi.fn().mockResolvedValue(undefined),
}));

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  const rawDir = join(tmpdir(), `sdd-test-init-${randomUUID()}`);
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

describe('init integration', () => {
  it('generates full project scaffold with all directories and files', async () => {
    const { initWizard } = await import('../../src/wizards/init-wizard.js');
    const result = await initWizard();

    const projectDir = join(tmpDir, 'test-project');
    expect(result.projectDir).toBe(projectDir);

    // Config
    const config = JSON.parse(
      readFileSync(join(projectDir, '.sdd', 'config.json'), 'utf-8')
    );
    expect(config.projectName).toBe('test-project');
    expect(config.runtime).toBe('bun');
    expect(config.language).toBe('typescript');
    expect(config.framework).toBe('fastify');
    expect(config.validation).toBe('zod');
    expect(config.database).toBe('postgresql');
    expect(config.orm).toBe('drizzle');
    expect(config.testing).toBe('vitest');
    expect(config.caching).toBe('redis');
    expect(config.auth).toBe('apikey');
    expect(config.domains).toEqual(['products', 'competitors']);
    expect(config.initialFeatures).toEqual(['crud-products', 'crud-competitors']);

    // Directories
    const expectedDirs = [
      'src/domain',
      'src/application',
      'src/infrastructure/persistence',
      'src/infrastructure/http',
      'src/infrastructure/config',
      'tests/unit',
      'tests/integration',
      'tests/architecture',
      'specs/00-system',
      'specs/01-domain',
      'specs/02-features',
      '.sdd',
      '.opencode/skills/sdd-core',
      '.opencode/skills/sdd-generate',
      '.opencode/skills/sdd-system-design',
    ];
    for (const dir of expectedDirs) {
      expect(existsSync(join(projectDir, dir))).toBe(true);
    }

    // Source entry point
    const indexSrc = readFileSync(join(projectDir, 'src', 'index.ts'), 'utf-8');
    expect(indexSrc).toContain('test-project');

    // System overview spec
    const overview = readFileSync(join(projectDir, 'specs', '00-system', 'system-overview.md'), 'utf-8');
    expect(overview).toContain('test-project');
    expect(overview).toContain('bun');
    expect(overview).toContain('typescript');

    // Specs README
    const specsReadme = readFileSync(join(projectDir, 'specs', 'README.md'), 'utf-8');
    expect(specsReadme).toContain('Specs Directory');

    // Hook files
    const hooks = ['.husky/pre-commit', '.husky/pre-push', '.husky/post-merge'];
    for (const hook of hooks) {
      expect(existsSync(join(projectDir, hook))).toBe(true);
    }

    // Limiters
    expect(existsSync(join(projectDir, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(projectDir, 'opencode.json'))).toBe(true);
    expect(existsSync(join(projectDir, '.gitignore'))).toBe(true);
    expect(existsSync(join(projectDir, '.env.example'))).toBe(true);

    // SDD skills
    const skillDirs = ['sdd-core/SKILL.md', 'sdd-generate/SKILL.md', 'sdd-system-design/SKILL.md'];
    for (const skill of skillDirs) {
      expect(existsSync(join(projectDir, '.opencode/skills', skill))).toBe(true);
    }

    // Domain specs
    expect(existsSync(join(projectDir, 'specs', '01-domain', 'products-spec.md'))).toBe(true);
    const productsSpec = readFileSync(join(projectDir, 'specs', '01-domain', 'products-spec.md'), 'utf-8');
    expect(productsSpec).toContain('products');

    expect(existsSync(join(projectDir, 'specs', '01-domain', 'competitors-spec.md'))).toBe(true);

    // Feature specs
    expect(existsSync(join(projectDir, 'specs', '02-features', 'crud-products-spec.md'))).toBe(true);
    expect(existsSync(join(projectDir, 'specs', '02-features', 'crud-competitors-spec.md'))).toBe(true);

    // opencode was called
    const { runOpencode } = await import('../../src/opencode/runner.js');
    expect(runOpencode).toHaveBeenCalledOnce();
  });
});
