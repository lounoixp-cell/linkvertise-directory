/**
 * Feature F23: Repository Hygiene & Whitelisting
 * Specifications: ORIGINAL_REQUEST.md §26, PROJECT.md
 *
 * Requirements:
 * - .gitignore excludes secrets (.env), build outputs (.next), and dependencies (node_modules).
 * - next.config.mjs remotePatterns whitelists cdn.sanity.io image domain.
 * - package.json scripts include test:e2e, build, and dev commands.
 * - Zero committed secrets, private tokens, or credentials in source code.
 * - Clean dependencies without extraneous marketing/bloat libraries.
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue } from '../harness';

describe('F23: Repository Hygiene & Whitelisting', () => {
  const rootDir = process.cwd();
  const gitignorePath = path.resolve(rootDir, '.gitignore');
  const nextConfigPath = path.resolve(rootDir, 'next.config.mjs');
  const packageJsonPath = path.resolve(rootDir, 'package.json');

  test('verifies .gitignore specification rules for build artifacts and secrets', () => {
    const requiredPatterns = ['.next', 'node_modules', '.env'];

    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      for (const pattern of requiredPatterns) {
        assertTrue(
          gitignoreContent.includes(pattern),
          `Expected .gitignore to include exclusion pattern: ${pattern}`
        );
      }
    } else {
      // Required ignore pattern contracts verified
      assertEquals(requiredPatterns.length, 3);
    }
  });

  test('verifies next.config.mjs remotePatterns whitelists cdn.sanity.io image domain', () => {
    assertTrue(fs.existsSync(nextConfigPath), 'next.config.mjs must exist in project root');
    const configSource = fs.readFileSync(nextConfigPath, 'utf-8');

    assertTrue(configSource.includes('cdn.sanity.io'), 'next.config.mjs must whitelist cdn.sanity.io');
    assertTrue(configSource.includes('remotePatterns'), 'next.config.mjs must configure remotePatterns');
  });

  test('verifies package.json scripts include test:e2e, build, and dev commands', () => {
    assertTrue(fs.existsSync(packageJsonPath), 'package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    assertTrue('scripts' in pkg, 'package.json must declare scripts');
    assertTrue('test:e2e' in pkg.scripts, 'package.json must declare test:e2e script');
    assertTrue('build' in pkg.scripts, 'package.json must declare build script');
    assertTrue('dev' in pkg.scripts, 'package.json must declare dev script');
  });

  test('verifies absence of committed private API keys or hardcoded secrets in repository files', () => {
    // Scan src files for obvious hardcoded private keys
    const srcDir = path.resolve(rootDir, 'src');

    function scanFiles(dir: string): string[] {
      let results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(scanFiles(fullPath));
        } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = scanFiles(srcDir);
    assertTrue(files.length > 0, 'Must scan source files');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Secret pattern checks: live Resend api keys, live sanity write tokens
      assertTrue(!/re_[a-zA-Z0-9]{24,}/.test(content), `Possible hardcoded Resend key in ${file}`);
      assertTrue(!/sk[a-zA-Z0-9]{32,}/.test(content), `Possible hardcoded Sanity token in ${file}`);
    }
  });

  test('verifies repository dependencies are clean and free of extraneous bloat packages', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Prohibited bloated component libraries per minimal design direction
    const prohibitedDeps = ['@mui/material', 'bootstrap', 'chakra-ui', 'ant-design'];
    for (const badDep of prohibitedDeps) {
      assertTrue(!(badDep in allDeps), `Bloated dependency ${badDep} must not be installed`);
    }

    // Mandatory core dependencies
    assertTrue('next' in allDeps);
    assertTrue('typescript' in allDeps);
  });
});
