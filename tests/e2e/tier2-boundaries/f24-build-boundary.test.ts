/**
 * Feature F24 Boundary: Type Safety & Clean Build
 * Specifications: ORIGINAL_REQUEST.md §26, §38; tsconfig.json; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Strict TypeScript Compiler Settings (strict: true, noEmit: true in tsconfig.json)
 * 2. Zero Unsafe Any-Casts in Core Contracts (src/types/post.ts contains 0 "any" types)
 * 3. Production Build Script Specification (build and test:e2e declared in package.json)
 * 4. Static Route Pre-rendering Param Coverage (generateStaticParams returns valid entries)
 * 5. Minimal Dependency Footprint (zero heavy CSS or heavy component framework bloat)
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';
import { generateStaticParams } from '@/app/post/[id]/page';

describe('F24: Type Safety & Build Boundary Verification', () => {
  const rootDir = process.cwd();
  const tsconfigPath = path.resolve(rootDir, 'tsconfig.json');
  const postTypesPath = path.resolve(rootDir, 'src/types/post.ts');
  const packageJsonPath = path.resolve(rootDir, 'package.json');

  test('boundary: tsconfig.json enforces strict compiler flags and path alias resolution', () => {
    assertTrue(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const opts = tsconfig.compilerOptions;

    assertEquals(opts?.strict, true, 'Compiler options must have strict: true');
    assertEquals(opts?.noEmit, true, 'Compiler options must have noEmit: true');
    assertTrue(opts?.moduleResolution === 'bundler' || opts?.moduleResolution === 'node');
  });

  test('boundary: src/types/post.ts contains zero unsafe "any" type annotations', () => {
    assertTrue(fs.existsSync(postTypesPath), 'src/types/post.ts must exist');
    const source = fs.readFileSync(postTypesPath, 'utf-8');

    // Remove comments
    const codeOnly = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // Check for ': any' or '<any>' or 'as any'
    const hasAnyAnnotation = /:\s*any\b|<any>|\bas\s+any\b/.test(codeOnly);
    assertFalse(
      hasAnyAnnotation,
      'src/types/post.ts must enforce strong typing with zero unsafe any annotations'
    );
  });

  test('boundary: package.json scripts define reproducible build and test commands', () => {
    assertTrue(fs.existsSync(packageJsonPath), 'package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    assertEquals(pkg.scripts?.build, 'next build');
    assertTrue(typeof pkg.scripts?.['test:e2e'] === 'string');
    assertEquals(pkg.scripts?.start, 'next start');
  });

  test('boundary: generateStaticParams produces valid pre-rendering targets for all catalog items', async () => {
    const params = await generateStaticParams();

    assertTrue(Array.isArray(params));
    assertTrue(params.length > 0, 'generateStaticParams must return non-empty target list');

    // Every entry must have a non-empty string id property
    for (const p of params) {
      assertTrue(typeof p.id === 'string');
      assertTrue(p.id.length > 0);
    }
  });

  test('boundary: bundle size and dependency economy: zero bloated UI framework dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDependencies = { ...pkg.dependencies, ...pkg.devDependencies };

    const bloatedLibraries = [
      'bootstrap',
      '@mui/material',
      'antd',
      'semantic-ui-react',
      'jquery',
      'lodash',
    ];

    for (const lib of bloatedLibraries) {
      assertFalse(
        lib in allDependencies,
        `Performance violation: heavy dependency "${lib}" must not be included`
      );
    }
  });
});
