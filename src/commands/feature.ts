import { featureWizard } from '../wizards/feature-wizard.js';

interface FeatureOptions {
  domain?: string;
}

export async function featureCommand(name: string, options: FeatureOptions): Promise<void> {
  await featureWizard(name, options.domain);
}
