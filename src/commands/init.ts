import { initWizard } from '../wizards/init-wizard.js';
import { generateProjectScaffold } from '../generators/project-generator.js';
import { generateHooks } from '../generators/hooks-generator.js';
import { generateLimiters } from '../generators/limiters-generator.js';

export async function initCommand(): Promise<void> {
  const { projectDir, config } = await initWizard();

  generateProjectScaffold(projectDir, config);
  generateHooks(projectDir);
  generateLimiters(projectDir, config);
}
