import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SddConfig } from '../utils/config.js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { generateFile } from './spec-generator.js';

export function generateLimiters(projectDir: string, config: SddConfig): void {
  const opencodeSkillsDir = join(projectDir, '.opencode', 'skills');
  mkdirSync(join(opencodeSkillsDir, 'sdd-core'), { recursive: true });
  mkdirSync(join(opencodeSkillsDir, 'sdd-generate'), { recursive: true });
  mkdirSync(join(opencodeSkillsDir, 'sdd-system-design'), { recursive: true });

  generateFile('limiters/sdd-core-skill.md.hbs', config as unknown as Record<string, unknown>, join(opencodeSkillsDir, 'sdd-core', 'SKILL.md'));

  generateFile('limiters/sdd-generate-skill.md.hbs', config as unknown as Record<string, unknown>, join(opencodeSkillsDir, 'sdd-generate', 'SKILL.md'));

  generateFile('limiters/sdd-system-design-skill.md.hbs', config as unknown as Record<string, unknown>, join(opencodeSkillsDir, 'sdd-system-design', 'SKILL.md'));

  generateFile('limiters/AGENTS.md.hbs', config as unknown as Record<string, unknown>, join(projectDir, 'AGENTS.md'));
  generateFile('limiters/opencode-json.hbs', config as unknown as Record<string, unknown>, join(projectDir, 'opencode.json'));

  writeFileSync(join(projectDir, '.gitignore'), [
    'node_modules/',
    'dist/',
    '.env',
    '.env.local',
    '*.log',
    '.DS_Store',
    'coverage/',
  ].join('\n') + '\n', 'utf-8');

  writeFileSync(join(projectDir, '.env.example'), [
    '# Environment Variables',
    `# Project: ${config.projectName}`,
    `# Stack: ${config.runtime}/${config.language} + ${config.framework}`,
    '',
    '# Application',
    'PORT=3000',
    'NODE_ENV=development',
    '',
    '# Database',
    'DATABASE_URL=postgresql://localhost:5432/myapp',
    '',
    '# Auth',
    'JWT_SECRET=change-me-in-production',
    '',
  ].join('\n') + '\n', 'utf-8');
}
