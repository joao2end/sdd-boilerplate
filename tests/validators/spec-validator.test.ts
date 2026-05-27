import { describe, it, expect } from 'vitest';
import { validateSpec, formatValidationResult } from '../../src/validators/spec-validator.js';
import type { ParsedSpec } from '../../src/parsers/spec-parser.js';

function makeSpec(overrides: Partial<ParsedSpec['metadata']> = {}, sections: Record<string, string> = {}): ParsedSpec {
  return {
    metadata: {
      name: 'test',
      domain: 'test-domain',
      type: 'feature',
      version: '1.0.0',
      status: 'draft',
      dependencies: [],
      ...overrides,
    },
    sections,
    raw: '',
  };
}

describe('spec-validator', () => {
  describe('validateSpec', () => {
    it('passes a valid spec with all required sections', () => {
      const spec = makeSpec({ type: 'feature' }, {
        description: 'Some feature',
        'main success scenario': 'User does X',
        preconditions: 'User is logged in',
        inputs: 'productId',
        outputs: 'Product',
        'business rules': 'Must be admin',
        examples: 'Example here',
        constraints: 'None',
      });
      const result = validateSpec(spec);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when spec has no name', () => {
      const spec = makeSpec({ name: 'unnamed' }, { description: 'stuff' });
      const result = validateSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Spec must have a name in frontmatter');
    });

    it('reports warning when domain is unknown', () => {
      const spec = makeSpec({ domain: 'unknown' }, { description: 'stuff' });
      const result = validateSpec(spec);
      expect(result.warnings).toContain('Spec should have a domain defined in frontmatter');
    });

    it('reports errors for missing required sections per type', () => {
      const spec = makeSpec({ type: 'aggregate' }, {
        description: 'desc',
      });
      const result = validateSpec(spec);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: "state"');
      expect(result.errors).toContain('Missing required section: "behavior"');
      expect(result.errors).toContain('Missing required section: "invariants"');
      expect(result.errors).toContain('Missing required section: "validation rules"');
    });

    it('requires different sections for different types', () => {
      const apiSpec = makeSpec({ type: 'api' }, {
        description: 'desc',
        endpoints: 'GET /foo',
        authentication: 'API Key',
        'error scenarios': '401',
      });
      expect(validateSpec(apiSpec).valid).toBe(true);

      const entitySpec = makeSpec({ type: 'entity' }, {
        description: 'desc',
        state: 'fields',
        behavior: 'methods',
        invariants: 'rules',
      });
      expect(validateSpec(entitySpec).valid).toBe(true);
    });

    it('reports warning when examples section is missing', () => {
      const spec = makeSpec({ type: 'feature' }, {
        description: 'desc',
        'main success scenario': 'flow',
        preconditions: 'cond',
        inputs: 'in',
        outputs: 'out',
        'business rules': 'rules',
      });
      const result = validateSpec(spec);
      expect(result.warnings).toContain('Spec should include examples section');
    });

    it('reports warning when constraints section is missing', () => {
      const spec = makeSpec({ type: 'feature' }, {
        description: 'desc',
        'main success scenario': 'flow',
        preconditions: 'cond',
        inputs: 'in',
        outputs: 'out',
        'business rules': 'rules',
      });
      const result = validateSpec(spec);
      expect(result.warnings).toContain('Spec should include constraints section');
    });
  });

  describe('formatValidationResult', () => {
    it('formats valid result', () => {
      const result = formatValidationResult({ valid: true, errors: [], warnings: [] });
      expect(result).toContain('✓');
      expect(result).toContain('valid');
    });

    it('formats invalid result with errors', () => {
      const result = formatValidationResult({
        valid: false,
        errors: ['Missing section: "state"'],
        warnings: ['Missing examples'],
      });
      expect(result).toContain('✗');
      expect(result).toContain('errors');
      expect(result).toContain('Missing section');
      expect(result).toContain('⚠');
      expect(result).toContain('Missing examples');
    });
  });
});
