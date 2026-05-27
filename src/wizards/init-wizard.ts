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
  outro('Vamos configurar seu projeto. Cada pergunta tem exemplos para te ajudar.\n');

  const projectName = await text({
    message: 'Project name?\n  Nome do diretório do projeto. Use kebab-case (minúsculas, hífen).',
    placeholder: 'meu-projeto-incrivel',
    defaultValue: 'my-sdd-project',
  }) as string;
  if (isCancel(projectName)) cancel('Cancelled');

  const description = await text({
    message: 'Describe your project:\n  Explique o propósito do projeto em 1-2 frases. Isso vai para o README e AGENTS.md.',
    placeholder: 'API para gestao de pedidos com calculo de frete em tempo real',
    defaultValue: '',
  }) as string;
  if (isCancel(description)) cancel('Cancelled');

  const runtime = (await select({
    message: 'Runtime:\n  Ambiente de execução. Bun é mais rápido; Node.js tem ecossistema maior.',
    options: [
      { value: 'node', label: 'Node.js', hint: 'Ecossistema maduro, mais pacotes' },
      { value: 'bun', label: 'Bun', hint: 'Mais rápido, test runner nativo' },
    ],
  })) as SddConfig['runtime'];
  if (isCancel(runtime as unknown as string)) cancel('Cancelled');

  const language = (await select({
    message: 'Language:',
    options: [
      { value: 'typescript', label: 'TypeScript', hint: 'Type safety, recomendado' },
      { value: 'javascript', label: 'JavaScript', hint: 'Mais simples, sem types' },
    ],
  })) as SddConfig['language'];
  if (isCancel(language as unknown as string)) cancel('Cancelled');

  const framework = (await select({
    message: 'Backend framework:\n  Framework web para criar as rotas da API.',
    options: [
      { value: 'fastify', label: 'Fastify', hint: 'Mais rápido, schema-based' },
      { value: 'express', label: 'Express', hint: 'Mais popular, flexível' },
      { value: 'nestjs', label: 'NestJS', hint: 'Estrutura opinada, decorators' },
      { value: 'none', label: 'None / Library', hint: 'Sem framework' },
    ],
  })) as SddConfig['framework'];
  if (isCancel(framework as unknown as string)) cancel('Cancelled');

  const projectType = (await select({
    message: 'Project type:\n  Define quais pastas e configs serão geradas.',
    options: [
      { value: 'api', label: 'API only (backend)', hint: 'Apenas servidor HTTP' },
      { value: 'frontend', label: 'Frontend only', hint: 'SPA sem backend' },
      { value: 'fullstack', label: 'Fullstack', hint: 'Frontend + backend no mesmo repo' },
    ],
  })) as SddConfig['projectType'];
  if (isCancel(projectType as unknown as string)) cancel('Cancelled');

  let frontendFramework: SddConfig['frontendFramework'] = 'none';
  let designSystem: SddConfig['designSystem'] = 'none';
  if (projectType === 'frontend' || projectType === 'fullstack') {
    frontendFramework = (await select({
      message: 'Frontend framework:\n  Biblioteca para construir a interface do usuário.',
      options: [
        { value: 'react', label: 'React', hint: 'Maior ecossistema, Next.js, shadcn' },
        { value: 'vue', label: 'Vue', hint: 'Mais simples, Nuxt, Vite nativo' },
        { value: 'svelte', label: 'Svelte', hint: 'Menos boilerplate, SvelteKit' },
      ],
    })) as SddConfig['frontendFramework'];
    if (isCancel(frontendFramework as unknown as string)) cancel('Cancelled');

    designSystem = (await select({
      message: 'Design system:\n  Biblioteca de componentes visuais para acelerar o UI.',
      options: [
        { value: 'shadcn', label: 'Shadcn/ui', hint: 'Copiável, Tailwind, moderno' },
        { value: 'material-ui', label: 'Material UI', hint: 'Componentes completos, Google Design' },
        { value: 'tailwind', label: 'Tailwind (custom)', hint: 'Utility-first, customização total' },
        { value: 'none', label: 'None', hint: 'CSS puro ou outro' },
      ],
    })) as SddConfig['designSystem'];
    if (isCancel(designSystem as unknown as string)) cancel('Cancelled');
  }

  const validation = (await select({
    message: 'Validation library:\n  Biblioteca para validar dados de entrada (requests, forms).',
    options: [
      { value: 'zod', label: 'Zod', hint: 'Typescript-first, mais popular' },
      { value: 'valibot', label: 'Valibot', hint: 'Tree-shakeable, menor bundle' },
      { value: 'joi', label: 'Joi', hint: 'Madura, boa para JS puro' },
      { value: 'none', label: 'None', hint: 'Validação manual' },
    ],
  })) as SddConfig['validation'];
  if (isCancel(validation as unknown as string)) cancel('Cancelled');

  const database = (await select({
    message: 'Database:\n  Banco de dados principal da aplicação.',
    options: [
      { value: 'postgresql', label: 'PostgreSQL', hint: 'Relacional, mais robusto' },
      { value: 'mysql', label: 'MySQL', hint: 'Relacional, popular' },
      { value: 'sqlite', label: 'SQLite', hint: 'Embedded, ideal para prototipação' },
      { value: 'none', label: 'None', hint: 'Sem banco (ex: apenas cache)' },
    ],
  })) as SddConfig['database'];
  if (isCancel(database as unknown as string)) cancel('Cancelled');

  let orm: SddConfig['orm'] = 'none';
  if (database !== 'none') {
    orm = (await select({
      message: 'ORM:\n  Mapeador objeto-relacional para o banco escolhido.',
      options: [
        { value: 'prisma', label: 'Prisma', hint: 'Auto-gera types, migrations declarativas' },
        { value: 'drizzle', label: 'Drizzle', hint: 'SQL-like, performático' },
        { value: 'typeorm', label: 'TypeORM', hint: 'Maduro, decorators' },
        { value: 'none', label: 'None (raw queries)', hint: 'SQL puro ou driver direto' },
      ],
    })) as SddConfig['orm'];
    if (isCancel(orm as unknown as string)) cancel('Cancelled');
  }

  const testing = (await select({
    message: 'Testing framework:\n  Framework para testes unitários e de integração.',
    options: [
      { value: 'vitest', label: 'Vitest', hint: 'Rápido, compatível Jest, nativo Vite' },
      { value: 'jest', label: 'Jest', hint: 'Mais popular, matchers ricos' },
      { value: 'none', label: 'None', hint: 'Sem testes automatizados' },
    ],
  })) as SddConfig['testing'];
  if (isCancel(testing as unknown as string)) cancel('Cancelled');

  const domainsInput = await text({
    message: 'Core domains (comma separated):\n  Domínios são os módulos de negócio do seu sistema. Ex: "users" gerencia usuários, "orders" gerencia pedidos.',
    placeholder: 'users, products, orders, payments',
  }) as string;
  if (isCancel(domainsInput)) cancel('Cancelled');
  const domains = domainsInput.split(',').map(s => s.trim()).filter(Boolean);

  const featuresInput = await text({
    message: 'Initial features (comma separated):\n  Funcionalidades iniciais que o sistema terá. Use kebab-case. Ex: criar-usuario cria a feature de cadastro.',
    placeholder: 'create-user, list-products, place-order, process-payment',
  }) as string;
  if (isCancel(featuresInput)) cancel('Cancelled');
  const initialFeatures = featuresInput.split(',').map(s => s.trim()).filter(Boolean);

  const caching = (await select({
    message: 'Caching strategy:\n  Como armazenar dados em cache para melhorar performance.',
    options: [
      { value: 'redis', label: 'Redis', hint: 'Em memória, distribuído, ideal para APIs' },
      { value: 'memory', label: 'In-memory', hint: 'Simples, sem dependência externa' },
      { value: 'none', label: 'None', hint: 'Sem cache' },
    ],
  })) as SddConfig['caching'];
  if (isCancel(caching as unknown as string)) cancel('Cancelled');

  const auth = (await select({
    message: 'Authentication:\n  Estratégia de autenticação da aplicação.',
    options: [
      { value: 'jwt', label: 'JWT', hint: 'Token stateless, escalável' },
      { value: 'session', label: 'Session-based', hint: 'Sessão em banco/cache, stateful' },
      { value: 'apikey', label: 'API Key', hint: 'Chave fixa por cliente, simples' },
      { value: 'none', label: 'None', hint: 'Sem autenticação' },
    ],
  })) as SddConfig['auth'];
  if (isCancel(auth as unknown as string)) cancel('Cancelled');

  const config: SddConfig = {
    projectName,
    description,
    runtime,
    language,
    projectType,
    framework,
    frontendFramework,
    designSystem,
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


  const runAI = await confirm({
    message: 'Run opencode AI setup now? (generates framework code)',
    initialValue: true,
  }) as boolean;
  if (isCancel(runAI)) cancel('Cancelled');

  if (runAI) {
    await runOpencode({
      promptTemplate: readTemplate('prompts/init-project.md'),
      contextFiles: [
        join(projectDir, '.sdd', 'config.json'),
      ],
      replacements: {},
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
