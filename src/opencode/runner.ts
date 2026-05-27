import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

  const tmpDir = mkdtempSync(join(tmpdir(), 'sdd-'));
  const promptFile = join(tmpDir, 'prompt.txt');
  writeFileSync(promptFile, prompt, 'utf-8');

  try {
    execSync(`opencode "$(cat '${promptFile}')"`, {
      cwd,
      stdio: 'inherit',
    });
  } finally {
    try {
      import('node:fs').then(fs => fs.rmSync(tmpDir, { recursive: true, force: true }));
    } catch { }
  }
}
