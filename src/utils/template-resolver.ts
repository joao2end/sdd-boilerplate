import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEV_TEMPLATES = join(__dirname, '..', '..', 'templates');
const PROD_TEMPLATES = join(__dirname, '..', 'templates');

export function resolveTemplatePath(relativePath: string): string {
  const devPath = join(DEV_TEMPLATES, relativePath);
  if (existsSync(devPath)) return devPath;
  const prodPath = join(PROD_TEMPLATES, relativePath);
  if (existsSync(prodPath)) return prodPath;
  throw new Error(`Template not found: ${relativePath}`);
}

export function readTemplate(relativePath: string): string {
  return readFileSync(resolveTemplatePath(relativePath), 'utf-8');
}
