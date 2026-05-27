import { bugfixWizard } from '../wizards/bugfix-wizard.js';

export async function bugfixCommand(description: string): Promise<void> {
  await bugfixWizard(description);
}
