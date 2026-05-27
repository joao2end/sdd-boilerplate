import { initWizard } from '../wizards/init-wizard.js';

export async function initCommand(): Promise<void> {
  await initWizard();
}
