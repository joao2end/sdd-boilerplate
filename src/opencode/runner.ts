import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface OpencodeOptions {
  promptTemplate: string;
  contextFiles?: string[];
  replacements: Record<string, string>;
  cwd: string;
}

export function runOpencode(options: OpencodeOptions): void {
  const { promptTemplate, contextFiles = [], replacements, cwd } = options;

  let prompt = promptTemplate;

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value);
  }

  for (const file of contextFiles) {
    if (file.startsWith('/') && readFileSync(file, 'utf-8').length > 0) {
      prompt += `\n\n## Context File: ${file}\n${readFileSync(file, 'utf-8')}`;
    }
  }

  // Write prompt to a file in the project for reference and to support
  // opencode reading it directly (avoids CLI argument length limits)
  const sddDir = join(cwd, '.sdd');
  mkdirSync(sddDir, { recursive: true });
  writeFileSync(join(sddDir, 'prompt.md'), prompt, 'utf-8');

  const result = spawnSync('opencode', ['--prompt', prompt], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`opencode exited with code ${result.status}`);
  }
}
