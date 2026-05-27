import {
  intro,
  text,
  select,
  multiselect,
  confirm,
  outro,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts';
import { join, relative } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { loadConfig } from '../utils/config.js';
import { addTraceEntry } from '../utils/traceability.js';
import { generateFeatureSpec, FeatureSpecData } from '../generators/spec-generator.js';
import { runOpencode } from '../opencode/runner.js';
import { readTemplate } from '../utils/template-resolver.js';

export async function featureWizard(name: string, domainHint?: string): Promise<void> {
  const cwd = process.cwd();
  const config = loadConfig(cwd);
  const specDir = join(cwd, 'specs', '02-features');
  const specPath = join(specDir, `${name}-spec.md`);

  if (existsSync(specPath)) {
    const regenerate = await confirm({
      message: `Spec "${name}" already exists. Regenerate?`,
    }) as boolean;
    if (isCancel(regenerate) || !regenerate) {
      return runOpencode({
        promptTemplate: readTemplate('prompts/implement-from-spec.md'),
        contextFiles: [specPath],
        replacements: {
          name,
          domain: domainHint || config.domains[0] || 'core',
          stack: `${config.runtime}/${config.language} + ${config.framework} + ${config.validation} + ${config.database}(${config.orm}) + ${config.testing}`,
          framework: config.framework,
          orm: config.orm,
          validation: config.validation,
          testing: config.testing,
          specContent: readFileSync(specPath, 'utf-8'),
        },
        cwd,
      });
    }
  }

  intro(`📋 Creating feature spec: ${name}`);

  const domain = domainHint || await select({
    message: 'Domain:',
    options: config.domains.map(d => ({ value: d, label: d })),
  }) as string;
  if (isCancel(domain)) cancel('Cancelled');

  const description = await text({
    message: 'Feature description:',
    defaultValue: `${name} feature`,
  }) as string;
  if (isCancel(description)) cancel('Cancelled');

  const mainScenario = await text({
    message: 'Main success scenario:',
    placeholder: 'User submits cart → system validates → creates order → returns ID',
  }) as string;
  if (isCancel(mainScenario)) cancel('Cancelled');

  const preconditionsRaw = await text({
    message: 'Preconditions (comma separated):',
    placeholder: 'user authenticated, cart exists, items in stock',
  }) as string;
  if (isCancel(preconditionsRaw)) cancel('Cancelled');
  const preconditions = preconditionsRaw.split(',').map(s => s.trim()).filter(Boolean);

  const inputsRaw = await text({
    message: 'Inputs (format: name:type:description):',
    placeholder: 'cartId:string:Cart identifier, address:Address:Shipping address',
  }) as string;
  if (isCancel(inputsRaw)) cancel('Cancelled');
  const inputs = inputsRaw.split(',').map(s => {
    const [name, type, ...desc] = s.trim().split(':');
    return { name: name || '', type: type || 'string', required: true, description: desc.join(':') || '' };
  }).filter(i => i.name);

  const outputsRaw = await text({
    message: 'Outputs (format: name:type:description):',
    placeholder: 'orderId:string:Order ID, status:string:Order status',
  }) as string;
  if (isCancel(outputsRaw)) cancel('Cancelled');
  const outputs = outputsRaw.split(',').map(s => {
    const [name, type, ...desc] = s.trim().split(':');
    return { name: name || '', type: type || 'string', description: desc.join(':') || '' };
  }).filter(i => i.name);

  const rulesRaw = await text({
    message: 'Business rules (comma separated):',
    placeholder: 'max 50 items per order, total must be > 0, email must be unique',
  }) as string;
  if (isCancel(rulesRaw)) cancel('Cancelled');
  const businessRules = rulesRaw.split(',').map(s => s.trim()).filter(Boolean);

  const errorsRaw = await text({
    message: 'Error scenarios (format: Name:when:message):',
    placeholder: 'CartEmptyError:cart is empty:Cannot create order with empty cart',
  }) as string;
  if (isCancel(errorsRaw)) cancel('Cancelled');
  const errors = errorsRaw.split(',').map(s => {
    const [name, when, ...msgParts] = s.trim().split(':');
    return { name: name || '', when: when || '', message: msgParts.join(':') || '' };
  }).filter(i => i.name);

  const example = await text({
    message: 'Usage example:',
    placeholder: 'POST /orders { cartId: "cart-123" } → { orderId: "ord-456", status: "pending" }',
    defaultValue: '',
  }) as string;
  if (isCancel(example)) cancel('Cancelled');

  const constraintsRaw = await text({
    message: 'Constraints (comma separated):',
    placeholder: '< 200ms response time, requires auth, max payload 1MB',
    defaultValue: '',
  }) as string;
  if (isCancel(constraintsRaw)) cancel('Cancelled');
  const constraints = constraintsRaw.split(',').map(s => s.trim()).filter(Boolean);

  const specData: FeatureSpecData = {
    name,
    description,
    domain,
    mainScenario,
    preconditions,
    inputs,
    outputs,
    businessRules,
    alternativeFlows: [],
    errors,
    example,
    constraints,
  };

  const spin = spinner();
  spin.start('Generating spec...');
  generateFeatureSpec(specData, specPath);
  spin.stop('✓ Spec created');

  const codeNow = await confirm({
    message: 'Generate implementation now? (calls opencode)',
    initialValue: true,
  }) as boolean;
  if (isCancel(codeNow)) cancel('Cancelled');

  if (codeNow) {
    spin.start('Calling opencode to generate implementation...');

    addTraceEntry(cwd, {
      specPath: relative(cwd, specPath),
      type: 'feature',
      name,
      domain,
      status: 'draft',
      codePaths: [],
      testPaths: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const promptContent = readTemplate('prompts/implement-from-spec.md');

    runOpencode({
      promptTemplate: promptContent,
      contextFiles: [specPath],
      replacements: {
        name,
        domain,
        stack: `${config.runtime}/${config.language} + ${config.framework} + ${config.validation} + ${config.database}(${config.orm}) + ${config.testing}`,
        framework: config.framework,
        orm: config.orm,
        validation: config.validation,
        testing: config.testing,
        specContent: readFileSync(specPath, 'utf-8'),
      },
      cwd,
    });

    spin.stop('✓ Implementation generated');
  }

  outro(`✓ Feature "${name}" ready!`);
  outro(`  Spec: specs/02-features/${name}-spec.md`);
}
