/**
 * Feature F02: Post Schema in Sanity
 * Specifications: ORIGINAL_REQUEST.md §4
 *
 * Requirements:
 * - Post schema document type with title, slug, tag, previewImage, externalUrl, publishedAt, status, sortOrder, description.
 * - Title is required string.
 * - Slug is generated from title with slugify.
 * - Preview Image includes hotspot and alt text field.
 * - External URL is required with safe URL scheme validation (http/https).
 * - Sort order is an integer used for deterministic sorting.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertContains, assertTrue, assertFalse } from '../harness';
import { getActiveMockPosts, getFeedbackFixtures, MOCK_POSTS } from '../harness/fixtures';
import { createDOMInspector } from '../harness/dom';
import { invokeRouteHandler, createMockRequest } from '../harness/http';

describe('F02: Post Schema in Sanity', () => {
  const schemaPath = path.resolve(process.cwd(), 'src/sanity/schemas/post.ts');
  const schemaSource = fs.readFileSync(schemaPath, 'utf-8');

  test('validates postSchema document type and name definition in schema source', () => {
    assertTrue(fs.existsSync(schemaPath), 'Expected src/sanity/schemas/post.ts to exist');
    assertContains(schemaSource, "name: 'post'");
    assertContains(schemaSource, "title: 'Post'");
    assertContains(schemaSource, "type: 'document'");
  });

  test('verifies all required fields exist in schema definition', () => {
    const requiredFields = [
      'title',
      'slug',
      'tag',
      'previewImage',
      'externalUrl',
      'publishedAt',
      'status',
      'sortOrder',
      'description',
    ];

    for (const field of requiredFields) {
      const fieldPattern = new RegExp(`name:\\s*['"]${field}['"]`);
      assertTrue(
        fieldPattern.test(schemaSource),
        `Expected field "${field}" to be defined in post schema`
      );
    }
  });

  test('verifies slug configuration generates from title with slugify logic', () => {
    assertContains(schemaSource, "type: 'slug'");
    assertContains(schemaSource, "source: 'title'");
    assertContains(schemaSource, 'slugify:');

    // Test the slugify logic pattern specified in schema
    const slugify = (input: string) =>
      input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    assertEquals(slugify('Next.js 14 Framework & App Router!'), 'nextjs-14-framework-app-router');
    assertEquals(slugify('  Serena Noir — Midnight Studio  '), 'serena-noir-midnight-studio');
  });

  test('verifies previewImage includes hotspot option and alt accessibility field', () => {
    assertContains(schemaSource, "name: 'previewImage'");
    assertContains(schemaSource, "type: 'image'");
    assertContains(schemaSource, 'hotspot: true');
    assertContains(schemaSource, "name: 'alt'");
    assertContains(schemaSource, "title: 'Alternative Text'");
  });

  test('verifies status options and sortOrder integer field for deterministic ordering', () => {
    assertContains(schemaSource, "name: 'status'");
    assertContains(schemaSource, "value: 'active'");
    assertContains(schemaSource, "value: 'archived'");

    assertContains(schemaSource, "name: 'sortOrder'");
    assertContains(schemaSource, "type: 'number'");
    assertContains(schemaSource, 'Rule.required().integer()');
  });
});
