import { ParsedSpec } from '../parsers/spec-parser.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_SECTIONS: Record<string, string[]> = {
  'entity': ['description', 'state', 'behavior', 'invariants'],
  'value-object': ['description', 'state', 'invariants'],
  'aggregate': ['description', 'state', 'behavior', 'invariants', 'validation rules'],
  'feature': ['description', 'main success scenario', 'preconditions', 'inputs', 'outputs', 'business rules'],
  'api': ['description', 'endpoints', 'authentication', 'error scenarios'],
};

export function validateSpec(spec: ParsedSpec): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec.metadata.name || spec.metadata.name === 'unnamed') {
    errors.push('Spec must have a name in frontmatter');
  }

  if (!spec.metadata.domain || spec.metadata.domain === 'unknown') {
    warnings.push('Spec should have a domain defined in frontmatter');
  }

  const required = REQUIRED_SECTIONS[spec.metadata.type];
  if (required) {
    for (const section of required) {
      if (!spec.sections[section]) {
        errors.push(`Missing required section: "${section}"`);
      }
    }
  }

  if (!spec.sections['examples']) {
    warnings.push('Spec should include examples section');
  }

  if (!spec.sections['constraints']) {
    warnings.push('Spec should include constraints section');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✓ Spec is valid');
  } else {
    lines.push('✗ Spec has errors:');
    for (const err of result.errors) {
      lines.push(`  - ${err}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('⚠ Warnings:');
    for (const warn of result.warnings) {
      lines.push(`  - ${warn}`);
    }
  }

  return lines.join('\n');
}
