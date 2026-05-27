import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SddConfig {
  projectName: string;
  description: string;
  runtime: 'node' | 'bun';
  language: 'typescript' | 'javascript';
  projectType: 'api' | 'frontend' | 'fullstack';
  framework: 'express' | 'fastify' | 'nestjs' | 'none';
  frontendFramework: 'react' | 'vue' | 'svelte' | 'none';
  designSystem: 'shadcn' | 'material-ui' | 'tailwind' | 'none';
  validation: 'zod' | 'valibot' | 'joi' | 'none';
  database: 'postgresql' | 'mysql' | 'sqlite' | 'none';
  orm: 'prisma' | 'drizzle' | 'typeorm' | 'knex' | 'none';
  testing: 'vitest' | 'jest' | 'ava' | 'none';
  domains: string[];
  initialFeatures: string[];
  caching: 'redis' | 'memory' | 'none';
  messaging: 'rabbitmq' | 'kafka' | 'none';
  auth: 'jwt' | 'session' | 'apikey' | 'none';
}

export function loadConfig(cwd: string): SddConfig {
  const configPath = join(cwd, '.sdd', 'config.json');
  if (!existsSync(configPath)) {
    throw new Error(`SDD config not found at ${configPath}. Run 'sdd-boilerplate init' first.`);
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

export function saveConfig(cwd: string, config: SddConfig): void {
  const configDir = join(cwd, '.sdd');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
}
