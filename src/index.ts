#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
import { featureCommand } from './commands/feature.js';
import { refactorCommand } from './commands/refactor.js';
import { bugfixCommand } from './commands/bugfix.js';
import { validateCommand } from './commands/validate.js';
import { listCommand } from './commands/list.js';

const program = new Command();

program
  .name('sdd-boilerplate')
  .description('SDD CLI — Spec-Driven Development with AI')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize a new SDD project')
  .action(initCommand);

program
  .command('feature <name>')
  .description('Create a new feature with spec + implementation')
  .option('-d, --domain <domain>', 'Domain name')
  .action(featureCommand);

program
  .command('refactor <name>')
  .description('Refactor existing feature via spec update')
  .option('-d, --domain <domain>', 'Domain name')
  .action(refactorCommand);

program
  .command('bugfix <description>')
  .description('Fix a bug following SDD workflow')
  .action(bugfixCommand);

program
  .command('validate')
  .description('Validate project integrity — spec vs code')
  .action(validateCommand);

program
  .command('list')
  .description('List all specs and their status')
  .option('-s, --status', 'Show implementation status')
  .action(listCommand);

program.parse();
