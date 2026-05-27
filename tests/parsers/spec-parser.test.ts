import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpec, getSpecNameFromPath } from '../../src/parsers/spec-parser.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixtures = resolve(__dirname, '..', 'fixtures');

describe('spec-parser', () => {
  it('parses a valid spec with frontmatter and sections', () => {
    const result = parseSpec(resolve(fixtures, 'valid-domain-spec.md'));
    expect(result).not.toBeNull();

    expect(result!.metadata.name).toBe('products');
    expect(result!.metadata.domain).toBe('products');
    expect(result!.metadata.type).toBe('aggregate');
    expect(result!.metadata.version).toBe('1.0.0');
    expect(result!.metadata.status).toBe('draft');
    expect(result!.metadata.dependencies).toEqual([]);

    expect(result!.sections['description']).toContain('Products domain');
    expect(result!.sections['state']).toContain('Product');
    expect(result!.sections['behavior']).toContain('createProduct');
    expect(result!.sections['invariants']).toContain('SKU must be unique');
    expect(result!.sections['validation rules']).toContain('name is required');
    expect(result!.sections['examples']).toContain('Aspirin');
    expect(result!.sections['constraints']).toContain('100k products');

    expect(result!.raw).toContain('---');
  });

  it('returns null when file does not exist', () => {
    const result = parseSpec('/nonexistent/spec.md');
    expect(result).toBeNull();
  });

  it('returns null when file has no frontmatter', () => {
    const result = parseSpec(resolve(fixtures, 'no-frontmatter-spec.md'));
    expect(result).toBeNull();
  });

  it('extracts section titles case-insensitively', () => {
    const result = parseSpec(resolve(fixtures, 'valid-domain-spec.md'));
    expect(result).not.toBeNull();
    expect(result!.sections['DESCRIPTION']).toBeUndefined();
    expect(result!.sections['description']).toBeDefined();
  });

  it('extracts multiple sections correctly', () => {
    const result = parseSpec(resolve(fixtures, 'valid-domain-spec.md'));
    expect(Object.keys(result!.sections)).toHaveLength(7);
  });
});

describe('getSpecNameFromPath', () => {
  it('extracts spec name from full path', () => {
    const name = getSpecNameFromPath('/project/specs/01-domain/products-spec.md');
    expect(name).toBe('products');
  });

  it('handles path without -spec suffix', () => {
    const name = getSpecNameFromPath('/project/specs/products.md');
    expect(name).toBe('products');
  });

  it('falls back to unknown for empty segments', () => {
    const name = getSpecNameFromPath('');
    expect(name).toBe('unknown');
  });
});
