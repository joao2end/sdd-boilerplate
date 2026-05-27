import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface SddConfig {
  projectName: string;
  description: string;
  runtime: 'node' | 'bun';
  language: 'typescript' | 'javascript';
  framework: 'express' | 'fastify' | 'nestjs' | 'none';
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
    import('node:fs').then(fs => fs.mkdirSync(configDir, { recursive: true }));
  }
  const configPath = join(configDir, 'config.json');
  import('node:fs').then(fs => fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8'));
}
