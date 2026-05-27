import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadTraceability } from '../utils/traceability.js';
import { parseSpec } from '../parsers/spec-parser.js';
import { validateSpec } from '../validators/spec-validator.js';
import { validateProject } from '../validators/project-validator.js';
import { intro, outro, spinner, cancel } from '@clack/prompts';
import picocolors from 'picocolors';

export async function validateCommand(): Promise<void> {
  const cwd = process.cwd();
  const sddDir = join(cwd, '.sdd');

  if (!existsSync(sddDir)) {
    cancel('Not an SDD project. Run "sdd-boilerplate init" first.');
    return;
  }

  intro('🔍 SDD Project Validation');

  const spin = spinner();
  spin.start('Validating project...');

  const trace = loadTraceability(cwd);
  const projectResult = await validateProject(cwd);

  spin.stop('Validation complete');

  console.log(`\n${picocolors.bold('Summary:')}`);
  console.log(`  Total specs: ${picocolors.cyan(String(projectResult.totalSpecs))}`);
  console.log(`  Implemented: ${picocolors.green(String(projectResult.implementedCount))}`);
  console.log(`  Deprecated:  ${picocolors.yellow(String(projectResult.deprecatedCount))}`);

  if (projectResult.orphanSpecs.length > 0) {
    console.log(`\n${picocolors.red('✗ Orphan specs (spec without file):')}`);
    for (const spec of projectResult.orphanSpecs) {
      console.log(`    - ${spec}`);
    }
  }

  if (projectResult.untrackedCode.length > 0) {
    console.log(`\n${picocolors.yellow('⚠ Untracked code (no spec):')}`);
    for (const file of projectResult.untrackedCode.slice(0, 10)) {
      console.log(`    - ${file}`);
    }
    if (projectResult.untrackedCode.length > 10) {
      console.log(`    ... and ${projectResult.untrackedCode.length - 10} more`);
    }
  }

  let specErrors = 0;
  let specWarnings = 0;

  for (const entry of trace.entries) {
    const specPath = join(cwd, entry.specPath);
    if (existsSync(specPath)) {
      const parsed = parseSpec(specPath);
      if (parsed) {
        const result = validateSpec(parsed);
        if (!result.valid) {
          specErrors++;
          console.log(`\n${picocolors.red(`✗ ${entry.specPath}:`)}`);
          for (const err of result.errors) {
            console.log(`    ${err}`);
          }
        }
        specWarnings += result.warnings.length;
      }
    }
  }

  if (specErrors > 0) {
    console.log(`\n${picocolors.red(`✗ ${specErrors} spec(s) with errors`)}`);
  }
  if (specWarnings > 0) {
    console.log(`${picocolors.yellow(`⚠ ${specWarnings} warning(s)`)}`);
  }

  if (projectResult.valid && specErrors === 0) {
    outro('✓ Project is valid — all specs have corresponding code');
  } else {
    outro('⚠ Project has issues to resolve');
  }
}
