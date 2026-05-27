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
import { existsSync } from 'node:fs';
import { loadConfig } from '../utils/config.js';
import { addTraceEntry } from '../utils/traceability.js';
import { parseSpec } from '../parsers/spec-parser.js';
import { runOpencode } from '../opencode/runner.js';
import { readTemplate } from '../utils/template-resolver.js';

export async function bugfixWizard(bugDescription: string): Promise<void> {
  const cwd = process.cwd();
  const config = loadConfig(cwd);

  intro('🐛 Bugfix Workflow');

  const featureName = await text({
    message: 'Which feature/domain is affected?',
    placeholder: 'create-user',
  }) as string;
  if (isCancel(featureName)) cancel('Cancelled');

  const specPaths = [
    join(cwd, 'specs', '02-features', `${featureName}-spec.md`),
    join(cwd, 'specs', '01-domain', `${featureName}-spec.md`),
  ];

  const specPath = specPaths.find(s => existsSync(s));
  if (!specPath) {
    cancel(`No spec found for "${featureName}". Create one first with "sdd-boilerplate feature ${featureName}".`);
    return;
  }

  const details = await text({
    message: 'Detailed bug description:',
    defaultValue: bugDescription,
  }) as string;
  if (isCancel(details)) cancel('Cancelled');

  const promptContent = readTemplate('prompts/bugfix-from-spec.md');

  const spin = spinner();
  spin.start('Calling opencode to fix bug...');

  runOpencode({
    promptTemplate: promptContent,
    contextFiles: [specPath],
    replacements: {
      bugDescription: details,
      stack: `${config.runtime}/${config.language} + ${config.framework} + ${config.validation} + ${config.database}(${config.orm}) + ${config.testing}`,
      framework: config.framework,
    },
    cwd,
  });

  spin.stop('✓ Bugfix applied');
  outro(`✓ Bugfix for "${featureName}" complete — spec updated + regression test added`);
}
