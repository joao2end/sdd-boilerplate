import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function generateHooks(projectDir: string): void {
  const hooksDir = join(projectDir, '.husky');
  mkdirSync(hooksDir, { recursive: true });

  writeFileSync(join(hooksDir, 'pre-commit'), [
    '#!/usr/bin/env bash',
    'set -e',
    '',
    'echo "🔍 SDD: Verifying specs before commit..."',
    '',
    `# Check if there are any unstaged spec files
    if git diff --cached --name-only | grep -q "specs/"; then
      echo "✓ Spec changes detected"
    fi`,
    '',
    `# Warn about code without spec
    if git diff --cached --name-only | grep -q "^src/" && ! git diff --cached --name-only | grep -q "^specs/"; then
      echo "⚠ WARNING: Code changes detected without spec changes."
      echo "  If this implements a new feature, did you write the spec first?"
      echo "  Run: sdd-boilerplate feature <name>"
    fi`,
    '',
    'echo "✓ Pre-commit hook complete"',
  ].join('\n'), 'utf-8');

  writeFileSync(join(hooksDir, 'pre-push'), [
    '#!/usr/bin/env bash',
    'set -e',
    '',
    'echo "🔍 SDD: Validating project before push..."',
    '',
    `# Run SDD validation
    if command -v sdd-boilerplate &> /dev/null; then
      echo "Running: sdd-boilerplate validate"
      sdd-boilerplate validate
    else
      echo "⚠ sdd-boilerplate not found — skipping validation"
    fi`,
    '',
    'echo "✓ Pre-push hook complete"',
  ].join('\n'), 'utf-8');

  writeFileSync(join(hooksDir, 'post-merge'), [
    '#!/usr/bin/env bash',
    'set -e',
    '',
    'echo "🔍 SDD: Post-merge — checking spec consistency..."',
    '',
    `# Check for deleted or renamed spec files
    if git diff HEAD@{1} --name-status | grep -q "^D.*specs/"; then
      echo "⚠ Spec files were deleted — run 'sdd-boilerplate validate'"
    fi`,
    '',
    'echo "✓ Post-merge hook complete"',
  ].join('\n'), 'utf-8');
}
