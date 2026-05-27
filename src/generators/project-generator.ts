import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SddConfig } from '../utils/config.js';

export function generateProjectScaffold(projectDir: string, config: SddConfig): void {
  const dirs = [
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

  for (const dir of dirs) {
    mkdirSync(join(projectDir, dir), { recursive: true });
  }

  writeFileSync(join(projectDir, 'src', 'index.ts'), [
    `// ${config.projectName} — ${config.description}`,
    `// Stack: ${config.runtime}/${config.language} + ${config.framework}`,
    '',
    `export const VERSION = '0.1.0';`,
    '',
  ].join('\n') + '\n', 'utf-8');

  const specsDir = join(projectDir, 'specs', '00-system');
  const systemOverviewPath = join(specsDir, 'system-overview.md');
  if (!existsSync(systemOverviewPath)) {
    writeFileSync(systemOverviewPath, [
      `# ${config.projectName}`,
      '',
      `> ${config.description}`,
      '',
      '## Stack',
      `- Runtime: ${config.runtime}`,
      `- Language: ${config.language}`,
      `- Framework: ${config.framework}`,
      `- Validation: ${config.validation}`,
      `- Database: ${config.database}`,
      `- ORM: ${config.orm}`,
      `- Testing: ${config.testing}`,
      `- Caching: ${config.caching}`,
      `- Auth: ${config.auth}`,
      '',
      '## Architecture',
      '- Clean Architecture (domain → application → infrastructure)',
      '- Spec-Driven Development (specs/ are source of truth)',
      '',
      '## Domains',
      config.domains.map(d => `- ${d}`).join('\n'),
      '',
      '## Conventions',
      '- TypeScript strict mode',
      '- All code must have a corresponding spec',
      '- Tests follow AAA pattern',
      '',
    ].join('\n'), 'utf-8');
  }

  const specsReadmePath = join(projectDir, 'specs', 'README.md');
  if (!existsSync(specsReadmePath)) {
    writeFileSync(specsReadmePath, [
    '# Specs Directory',
    '',
    'This is the **source of truth** for the project.',
    '',
    '## Structure',
    '- `00-system/` — System overview, architecture, conventions',
    '- `01-domain/` — Entity, value object, aggregate specs',
    '- `02-features/` — Feature and use case specs',
    '',
    '## Writing Specs',
    'Each spec must have these sections:',
    '1. **Frontmatter** — name, domain, type, version, status',
    '2. **Description** — What this is',
    '3. **State/Inputs** — Properties with types',
    '4. **Behavior** — Methods and their rules',
    '5. **Invariants** — Always-true constraints',
    '6. **Business Rules** — Explicit validation logic',
    '7. **Examples** — Usage examples',
    '',
    '> Rule: Update the spec FIRST, then the code.',
  ].join('\n'), 'utf-8');
  }
}
