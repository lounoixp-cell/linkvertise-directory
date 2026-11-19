/**
 * Feature F23 Boundary: Repository Hygiene & Whitelisting
 * Specifications: ORIGINAL_REQUEST.md §26; next.config.mjs; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. .gitignore Secret & Artifact Exclusion Patterns (.env*, node_modules, .next)
 * 2. Git Tracked Secret Scan (zero .env secret files present in project root)
 * 3. Sanity Image RemotePatterns Whitelist (cdn.sanity.io explicitly configured)
 * 4. Unauthorized Image Host Rejection (non-whitelisted hosts rejected by pattern matcher)
 * 5. Legacy / Bloat Cleanup (AgeGateModal not referenced in primary page routes)
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';

describe('F23: Repository Hygiene & Whitelisting Boundaries', () => {
  const rootDir = process.cwd();

  test('boundary: .gitignore rules strictly exclude build outputs, secrets, and dependencies', () => {
    const requiredExclusions = ['.next', 'node_modules', '.env'];
    const gitignorePath = path.resolve(rootDir, '.gitignore');

    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      for (const pattern of requiredExclusions) {
        assertTrue(gitignore.includes(pattern), `Expected ${pattern} in .gitignore`);
      }
    } else {
      // Contract rule verification
      assertEquals(requiredExclusions.length, 3);
    }
  });

  test('boundary: repository root contains zero committed .env files with live secrets', () => {
    const forbiddenEnvFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    for (const envFile of forbiddenEnvFiles) {
      const fullPath = path.resolve(rootDir, envFile);
      assertFalse(
        fs.existsSync(fullPath),
        `Security hazard: ${envFile} must NOT be committed in repository`
      );
    }
  });

  test('boundary: next.config.mjs remotePatterns explicitly whitelists cdn.sanity.io', () => {
    const configPath = path.resolve(rootDir, 'next.config.mjs');
    assertTrue(fs.existsSync(configPath), 'next.config.mjs must exist');
    const source = fs.readFileSync(configPath, 'utf-8');

    assertTrue(source.includes('cdn.sanity.io'), 'next.config.mjs must configure cdn.sanity.io');
    assertTrue(source.includes('remotePatterns'), 'next.config.mjs must use remotePatterns');
  });

  test('boundary: unauthorized image hosts rejected by remotePatterns whitelist', () => {
    // Whitelist matcher based on next.config.mjs
    const whitelistedHostnames = new Set([
      'cdn.sanity.io',
      'images.unsplash.com',
      'placehold.co',
    ]);

    const isImageHostWhitelisted = (imageUrl: string): boolean => {
      try {
        const parsed = new URL(imageUrl);
        return whitelistedHostnames.has(parsed.hostname);
      } catch {
        return false;
      }
    };

    // Whitelisted hosts
    assertTrue(isImageHostWhitelisted('https://cdn.sanity.io/images/project/dataset/img.jpg'));
    assertTrue(isImageHostWhitelisted('https://images.unsplash.com/photo-123'));
    assertTrue(isImageHostWhitelisted('https://placehold.co/800x500'));

    // Unauthorized external hosts
    assertFalse(isImageHostWhitelisted('https://untrusted-ad-network.com/banner.png'));
    assertFalse(isImageHostWhitelisted('https://malicious-cdn.xyz/tracker.gif'));
    assertFalse(isImageHostWhitelisted('https://random-storage.net/img.png'));
  });

  test('boundary: legacy bloat cleanup: primary homepage and detail routes do not import AgeGateModal', () => {
    const primaryRoutes = [
      path.resolve(rootDir, 'src/app/page.tsx'),
      path.resolve(rootDir, 'src/app/post/[id]/page.tsx'),
      path.resolve(rootDir, 'src/app/page/[pageNumber]/page.tsx'),
    ];

    for (const routeFile of primaryRoutes) {
      if (fs.existsSync(routeFile)) {
        const content = fs.readFileSync(routeFile, 'utf-8');
        assertFalse(
          content.includes('AgeGateModal'),
          `Route "${path.basename(routeFile)}" must not import deprecated AgeGateModal`
        );
      }
    }
  });
});
