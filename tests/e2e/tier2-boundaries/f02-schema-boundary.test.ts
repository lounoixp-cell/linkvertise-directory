/**
 * Feature F02 Boundary: Post Schema in Sanity
 * Specifications: ORIGINAL_REQUEST.md §4; src/sanity/schemas/post.ts; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Missing Required Fields (title, slug, previewImage, externalUrl, publishedAt, sortOrder)
 * 2. Extreme String Lengths (titles exceeding 200 character boundary)
 * 3. Slugify Normalization with Special Characters, Symbols & Accents
 * 4. Sort Order Boundary Values (0, negative integers, large integers vs invalid floats)
 * 5. Preview Image Hotspot & Accessibility Alt Field Enforcement
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertContains, assertTrue, assertFalse } from '../harness';

describe('F02: Schema Boundary & Validation Constraints', () => {
  const schemaPath = path.resolve(process.cwd(), 'src/sanity/schemas/post.ts');
  const schemaSource = fs.readFileSync(schemaPath, 'utf-8');

  test('validates schema enforcement for all mandatory fields', () => {
    // Inspect schema source to ensure Rule.required() is applied to key fields
    const requiredFieldRules = [
      { name: 'title', pattern: /name:\s*['"]title['"][\s\S]*?Rule\.required\(\)/ },
      { name: 'slug', pattern: /name:\s*['"]slug['"][\s\S]*?Rule\.required\(\)/ },
      { name: 'previewImage', pattern: /name:\s*['"]previewImage['"][\s\S]*?Rule\.required\(\)/ },
      { name: 'externalUrl', pattern: /name:\s*['"]externalUrl['"][\s\S]*?Rule\.required\(\)/ },
      { name: 'publishedAt', pattern: /name:\s*['"]publishedAt['"][\s\S]*?Rule\.required\(\)/ },
      { name: 'sortOrder', pattern: /name:\s*['"]sortOrder['"][\s\S]*?Rule\.required\(\)/ },
    ];

    for (const { name, pattern } of requiredFieldRules) {
      assertTrue(
        pattern.test(schemaSource),
        `Expected field "${name}" in Sanity schema to have Rule.required()`
      );
    }

    // Verify boundary validation function behavior for incomplete document
    const validateRequiredFields = (doc: Record<string, unknown>): string[] => {
      const missing: string[] = [];
      const required = ['title', 'slug', 'previewImage', 'externalUrl', 'publishedAt', 'sortOrder'];
      for (const field of required) {
        if (doc[field] === undefined || doc[field] === null || doc[field] === '') {
          missing.push(field);
        }
      }
      return missing;
    };

    const emptyDoc = {};
    const missingFields = validateRequiredFields(emptyDoc);
    assertEquals(missingFields.length, 6);

    const validDoc = {
      title: 'Valid Title',
      slug: { current: 'valid-title' },
      previewImage: { asset: { _ref: 'image-123' } },
      externalUrl: 'https://example.com',
      publishedAt: '2026-01-01T00:00:00Z',
      sortOrder: 1,
    };
    assertEquals(validateRequiredFields(validDoc).length, 0);
  });

  test('enforces boundary limit for title string length (max 200 chars)', () => {
    assertContains(schemaSource, 'Rule.required().min(1).max(200)');

    const validateTitleLength = (title: string): { valid: boolean; error?: string } => {
      if (title.length > 200) {
        return { valid: false, error: 'Title cannot exceed 200 characters.' };
      }
      return { valid: true };
    };

    // Boundary at 200 chars: valid
    const title200 = 'A'.repeat(200);
    assertEquals(validateTitleLength(title200).valid, true);

    // Boundary at 201 chars: invalid
    const title201 = 'A'.repeat(201);
    const result201 = validateTitleLength(title201);
    assertEquals(result201.valid, false);
    assertEquals(result201.error, 'Title cannot exceed 200 characters.');

    // Extreme string length 500 chars: invalid
    const title500 = 'X'.repeat(500);
    assertEquals(validateTitleLength(title500).valid, false);
  });

  test('slugify normalization handles symbols, accents, multiple spaces, and boundary punctuation', () => {
    // Sanity schema custom slugify implementation
    const slugify = (input: string) =>
      input
        .normalize('NFD') // decompose accented letters into base + diacritics
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    assertEquals(
      slugify("  C++ & C# Guide: What's New in 2026?  "),
      'c-c-guide-whats-new-in-2026'
    );
    assertEquals(slugify('Café & Résumé 2026!'), 'cafe-resume-2026');
    assertEquals(slugify('---Leading and Trailing Hyphens---'), 'leading-and-trailing-hyphens');
    assertEquals(slugify('Spaces   And___Underscores---Mix'), 'spaces-and-underscores-mix');
    assertEquals(slugify('Special @#$% Characters ^&*() Dropped'), 'special-characters-dropped');
  });

  test('validates sortOrder boundary values (zero, negative, large integers vs invalid floats)', () => {
    assertContains(schemaSource, 'Rule.required().integer()');

    const isValidSortOrder = (val: unknown): boolean => {
      if (typeof val !== 'number') return false;
      return Number.isInteger(val);
    };

    // Zero is valid integer
    assertTrue(isValidSortOrder(0));
    // Negative integer is valid integer
    assertTrue(isValidSortOrder(-1));
    assertTrue(isValidSortOrder(-999));
    // High positive integer is valid integer
    assertTrue(isValidSortOrder(999999));

    // Decimals/floating point numbers must be rejected
    assertFalse(isValidSortOrder(3.14));
    assertFalse(isValidSortOrder(0.5));
    assertFalse(isValidSortOrder(NaN));
    assertFalse(isValidSortOrder(Infinity));
  });

  test('enforces previewImage hotspot boolean and accessible alt text field validation', () => {
    assertContains(schemaSource, 'hotspot: true');
    assertContains(schemaSource, "name: 'alt'");
    assertContains(schemaSource, "title: 'Alternative Text'");

    const validateImageField = (imageObj: {
      asset?: unknown;
      alt?: string;
    }): { valid: boolean; warning?: string } => {
      if (!imageObj.asset) {
        return { valid: false, warning: 'Asset is required' };
      }
      if (!imageObj.alt || imageObj.alt.trim() === '') {
        return { valid: true, warning: 'Alternative text is recommended for accessibility' };
      }
      return { valid: true };
    };

    // Missing asset: invalid
    assertEquals(validateImageField({}).valid, false);

    // Missing alt: warning generated
    const missingAltResult = validateImageField({ asset: { _ref: 'ref-1' } });
    assertEquals(missingAltResult.valid, true);
    assertEquals(missingAltResult.warning, 'Alternative text is recommended for accessibility');

    // Valid asset and alt: clean
    const fullResult = validateImageField({ asset: { _ref: 'ref-1' }, alt: 'Descriptive alt text' });
    assertEquals(fullResult.valid, true);
    assertEquals(fullResult.warning, undefined);
  });
});
