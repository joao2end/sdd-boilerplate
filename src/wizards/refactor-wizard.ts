import {
  intro,
  text,
  select,
  confirm,
  outro,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { loadConfig } from '../utils/config.js';
import { parseSpec } from '../parsers/spec-parser.js';
import { runOpencode } from '../opencode/runner.js';
import { readTemplate } from '../utils/template-resolver.js';

export async function refactorWizard(name: string, domainHint?: string): Promise<void> {
  const cwd = process.cwd();
  const config = loadConfig(cwd);

  const specPaths = [
    join(cwd, 'specs', '02-features', `${name}-spec.md`),
    join(cwd, 'specs', '01-domain', `${name}-spec.md`),
  ];

  const specPath = specPaths.find(s => existsSync(s));
  if (!specPath) {
    cancel(`No spec found for "${name}". Check specs/01-domain/ or specs/02-features/.`);
    return;
  }

  intro(`🔄 Refactoring: ${name}`);

  const parsed = parseSpec(specPath);
  if (parsed) {
    outro(`Current spec: ${parsed.metadata.name} (${parsed.metadata.status})`);
  }

  const changes = await text({
    message: 'Describe the changes needed:',
    placeholder: 'Add email verification, change status flow, split into sub-entities',
  }) as string;
  if (isCancel(changes)) cancel('Cancelled');

  const specContent = readFileSync(specPath, 'utf-8');
  const promptContent = readTemplate('prompts/refactor-from-spec.md');

  const spin = spinner();
  spin.start('Calling opencode to refactor...');

  runOpencode({
    promptTemplate: promptContent,
    contextFiles: [specPath],
    replacements: {
      name,
      domain: domainHint || (parsed?.metadata.domain || 'core'),
      stack: `${config.runtime}/${config.language} + ${config.framework} + ${config.validation} + ${config.database}(${config.orm}) + ${config.testing}`,
      framework: config.framework,
      specContent,
      changes,
    },
    cwd,
  });

  spin.stop('✓ Refactoring complete');
  outro(`✓ "${name}" refactored via spec`);
}
