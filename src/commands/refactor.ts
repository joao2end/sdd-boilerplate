import { refactorWizard } from '../wizards/refactor-wizard.js';

interface RefactorOptions {
  domain?: string;
}

export async function refactorCommand(name: string, options: RefactorOptions): Promise<void> {
  await refactorWizard(name, options.domain);
}
