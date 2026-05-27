import {
  intro,
  text,
  select,
  confirm,
  outro,
  isCancel,
  cancel,
} from '@clack/prompts';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { SddConfig, saveConfig } from '../utils/config.js';
import { generateFile } from '../generators/spec-generator.js';
import { generateProjectScaffold } from '../generators/project-generator.js';
import { generateHooks } from '../generators/hooks-generator.js';
import { generateLimiters } from '../generators/limiters-generator.js';
import { runOpencode } from '../opencode/runner.js';
import { readTemplate } from '../utils/template-resolver.js';

export async function initWizard(): Promise<{ projectDir: string; config: SddConfig }> {
  intro('🚀 SDD Project Bootstrap');

  const projectName = await text({
    message: 'Project name?',
    defaultValue: 'my-sdd-project',
  }) as string;
  if (isCancel(projectName)) cancel('Cancelled');

  const description = await text({
    message: 'Describe your project:',
    defaultValue: '',
  }) as string;
  if (isCancel(description)) cancel('Cancelled');

  const runtime = (await select({
    message: 'Runtime:',
    options: [
      { value: 'node', label: 'Node.js' },
      { value: 'bun', label: 'Bun' },
    ],
  })) as SddConfig['runtime'];
  if (isCancel(runtime as unknown as string)) cancel('Cancelled');

  const language = (await select({
    message: 'Language:',
    options: [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'javascript', label: 'JavaScript' },
    ],
  })) as SddConfig['language'];
  if (isCancel(language as unknown as string)) cancel('Cancelled');

  const framework = (await select({
    message: 'Web framework:',
    options: [
      { value: 'fastify', label: 'Fastify' },
      { value: 'express', label: 'Express' },
      { value: 'nestjs', label: 'NestJS' },
      { value: 'none', label: 'None / Library' },
    ],
  })) as SddConfig['framework'];
  if (isCancel(framework as unknown as string)) cancel('Cancelled');

  const validation = (await select({
    message: 'Validation library:',
    options: [
      { value: 'zod', label: 'Zod' },
      { value: 'valibot', label: 'Valibot' },
      { value: 'joi', label: 'Joi' },
      { value: 'none', label: 'None' },
    ],
  })) as SddConfig['validation'];
  if (isCancel(validation as unknown as string)) cancel('Cancelled');

  const database = (await select({
    message: 'Database:',
    options: [
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'mysql', label: 'MySQL' },
      { value: 'sqlite', label: 'SQLite' },
      { value: 'none', label: 'None' },
    ],
  })) as SddConfig['database'];
  if (isCancel(database as unknown as string)) cancel('Cancelled');

  let orm: SddConfig['orm'] = 'none';
  if (database !== 'none') {
    orm = (await select({
      message: 'ORM:',
      options: [
        { value: 'prisma', label: 'Prisma' },
        { value: 'drizzle', label: 'Drizzle' },
        { value: 'typeorm', label: 'TypeORM' },
        { value: 'none', label: 'None (raw queries)' },
      ],
    })) as SddConfig['orm'];
    if (isCancel(orm as unknown as string)) cancel('Cancelled');
  }

  const testing = (await select({
    message: 'Testing framework:',
    options: [
      { value: 'vitest', label: 'Vitest' },
      { value: 'jest', label: 'Jest' },
      { value: 'none', label: 'None' },
    ],
  })) as SddConfig['testing'];
  if (isCancel(testing as unknown as string)) cancel('Cancelled');

  const domainsInput = await text({
    message: 'Core domains (comma separated):',
    placeholder: 'users, projects, tasks',
  }) as string;
  if (isCancel(domainsInput)) cancel('Cancelled');
  const domains = domainsInput.split(',').map(s => s.trim()).filter(Boolean);

  const featuresInput = await text({
    message: 'Initial features (comma separated):',
    placeholder: 'create-user, list-users',
  }) as string;
  if (isCancel(featuresInput)) cancel('Cancelled');
  const initialFeatures = featuresInput.split(',').map(s => s.trim()).filter(Boolean);

  const caching = (await select({
    message: 'Caching strategy:',
    options: [
      { value: 'redis', label: 'Redis' },
      { value: 'memory', label: 'In-memory' },
      { value: 'none', label: 'None' },
    ],
  })) as SddConfig['caching'];
  if (isCancel(caching as unknown as string)) cancel('Cancelled');

  const auth = (await select({
    message: 'Authentication:',
    options: [
      { value: 'jwt', label: 'JWT' },
      { value: 'session', label: 'Session-based' },
      { value: 'apikey', label: 'API Key' },
      { value: 'none', label: 'None' },
    ],
  })) as SddConfig['auth'];
  if (isCancel(auth as unknown as string)) cancel('Cancelled');

  const config: SddConfig = {
    projectName,
    description,
    runtime,
    language,
    framework,
    validation,
    database,
    orm,
    testing,
    domains,
    initialFeatures,
    caching,
    messaging: 'none',
    auth,
  };

  const cwd = process.cwd();
  const projectDir = join(cwd, projectName);

  if (existsSync(projectDir)) {
    const overwrite = await confirm({
      message: `Directory "${projectName}" already exists. Overwrite?`,
    }) as boolean;
    if (isCancel(overwrite) || !overwrite) cancel('Cancelled');
  } else {
    mkdirSync(projectDir, { recursive: true });
  }

  saveConfig(projectDir, config);

  // Generate scaffolding FIRST so project is functional even without AI
  generateProjectScaffold(projectDir, config);
  generateHooks(projectDir);
  generateLimiters(projectDir, config);
  setupDomainSpecs(projectDir, domains, config);
  setupFeatureSpecs(projectDir, initialFeatures, domains, config);

  const stackStr = `${runtime}/${language} + ${framework} + ${validation} + ${database}(${orm}) + ${testing}`;

  const runAI = await confirm({
    message: 'Run opencode AI setup now? (generates framework code)',
    initialValue: true,
  }) as boolean;
  if (isCancel(runAI)) cancel('Cancelled');

  if (runAI) {
    await runOpencode({
      promptTemplate: readTemplate('prompts/init-project.md'),
      replacements: {
        projectName,
        description,
        stack: stackStr,
        framework,
        orm,
        validation,
        testing,
        domains: domains.join(', '),
        features: initialFeatures.join(', '),
        caching,
        auth,
      },
      cwd: projectDir,
    });
  }

  outro(`✨ Project "${projectName}" initialized with SDD!`);
  outro(`   cd ${projectName} && npm install`);
  outro(`   Then: opencode`);
  outro(`   Then: sdd-boilerplate feature <name>`);

  return { projectDir, config };
}

function setupDomainSpecs(projectDir: string, domains: string[], config: SddConfig) {
  for (const domain of domains) {
    const specPath = join(projectDir, 'specs', '01-domain', `${domain}-spec.md`);
    if (!existsSync(specPath)) {
      generateFile('specs/domain-spec.md.hbs', {
        name: domain,
        description: `Core domain: ${domain}`,
        domain,
        type: 'aggregate',
        state: [],
        behavior: [],
        invariants: [],
        validationRules: [],
      }, specPath);
    }
  }
}

function setupFeatureSpecs(projectDir: string, features: string[], domains: string[], config: SddConfig) {
  for (const feature of features) {
    const domain = domains[0] || 'core';
    const specPath = join(projectDir, 'specs', '02-features', `${feature}-spec.md`);
    if (!existsSync(specPath)) {
      generateFile('specs/feature-spec.md.hbs', {
        name: feature,
        description: `${feature} feature`,
        domain,
        mainScenario: 'Describe the main flow here',
        preconditions: [],
        inputs: [],
        outputs: [],
        businessRules: [],
        alternativeFlows: [],
        errors: [],
        example: '// Example usage',
        constraints: [],
      }, specPath);
    }
  }
}
