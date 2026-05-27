import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEV_TEMPLATES = join(__dirname, '..', '..', 'templates');
const PROD_TEMPLATES = join(__dirname, '..', 'templates');
const TEMPLATES_DIR = existsSync(DEV_TEMPLATES) ? DEV_TEMPLATES : PROD_TEMPLATES;

export interface FeatureSpecData {
  name: string;
  description: string;
  domain: string;
  mainScenario: string;
  preconditions: string[];
  inputs: { name: string; type: string; required: boolean; description: string }[];
  outputs: { name: string; type: string; description: string }[];
  businessRules: string[];
  alternativeFlows: { name: string; trigger: string; steps: string }[];
  errors: { name: string; when: string; message: string }[];
  example: string;
  constraints: string[];
}

export interface DomainSpecData {
  name: string;
  description: string;
  domain: string;
  type: 'entity' | 'value-object' | 'aggregate';
  state: { name: string; type: string; required: boolean; description: string }[];
  behavior: {
    method: string;
    params: string;
    description: string;
    preconditions: string[];
    rules: string[];
    events: string[];
    throws: string[];
  }[];
  invariants: string[];
  validationRules: string[];
}

export function generateFeatureSpec(data: FeatureSpecData, outputPath: string): void {
  const templatePath = join(TEMPLATES_DIR, 'specs', 'feature-spec.md.hbs');
  const templateSource = readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const content = template(data);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, 'utf-8');
}

export function generateDomainSpec(data: DomainSpecData, outputPath: string): void {
  const templatePath = join(TEMPLATES_DIR, 'specs', 'domain-spec.md.hbs');
  const templateSource = readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const content = template(data);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, 'utf-8');
}

export function generateFile(templateRelPath: string, data: Record<string, unknown>, outputPath: string): void {
  const templatePath = join(TEMPLATES_DIR, templateRelPath);
  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const templateSource = readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const content = template(data);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, 'utf-8');
}
