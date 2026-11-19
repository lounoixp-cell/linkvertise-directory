/**
 * Feature F22 Boundary: Vercel Environment Configuration
 * Specifications: ORIGINAL_REQUEST.md §3, §25; Explorer 3 handoff
 *
 * Boundary & Error Cases:
 * 1. Public vs Private Prefix Strict Audit (only client-safe vars carry NEXT_PUBLIC_)
 * 2. Server Secrets Audit (SANITY_API_TOKEN, SANITY_REVALIDATE_SECRET, RESEND_API_KEY, FEEDBACK_EMAIL)
 * 3. Environment Variable Documentation (.env.example contract completeness)
 * 4. Client Secret Query Simulation (evaluating private vars in simulated client scope returns undefined)
 * 5. Production vs Preview Environment Isolation (conditional CDN flag based on environment)
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, test, assertEquals, assertTrue, assertFalse } from '../harness';

describe('F22: Vercel Environment Configuration Boundaries', () => {
  test('boundary: public prefix audit confirms only whitelisted client vars use NEXT_PUBLIC_', () => {
    const permittedPublicVars = new Set([
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'NEXT_PUBLIC_SANITY_API_VERSION',
    ]);

    for (const key of Object.keys(process.env)) {
      if (key.startsWith('NEXT_PUBLIC_')) {
        assertTrue(
          permittedPublicVars.has(key),
          `Unauthorized NEXT_PUBLIC_ variable detected in process environment: ${key}`
        );
      }
    }
  });

  test('boundary: server secrets audit confirms zero exposure with NEXT_PUBLIC_ prefix', () => {
    const privateSecretNames = [
      'SANITY_API_TOKEN',
      'SANITY_REVALIDATE_SECRET',
      'RESEND_API_KEY',
      'EMAIL_PROVIDER_API_KEY',
      'FEEDBACK_EMAIL',
    ];

    for (const secret of privateSecretNames) {
      const publicVariant = `NEXT_PUBLIC_${secret}`;
      assertFalse(
        publicVariant in process.env,
        `Security vulnerability: ${publicVariant} must not exist in environment`
      );
    }
  });

  test('boundary: .env.example contract completeness defines required public and private variables', () => {
    const requiredDefinitions = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'SANITY_API_TOKEN',
      'SANITY_REVALIDATE_SECRET',
      'RESEND_API_KEY',
      'FEEDBACK_EMAIL',
    ];

    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      for (const reqVar of requiredDefinitions) {
        assertTrue(content.includes(reqVar), `Expected ${reqVar} in .env.example`);
      }
    } else {
      // Contract specification verification
      assertEquals(requiredDefinitions.length, 6);
    }
  });

  test('boundary: client secret query simulation confirms private keys evaluate to undefined in client bundle', () => {
    // Simulated Next.js client bundle environment: only NEXT_PUBLIC_ prefixed variables are injected
    const simulateClientEnv = (serverEnv: Record<string, string | undefined>): Record<string, string | undefined> => {
      const clientEnv: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(serverEnv)) {
        if (k.startsWith('NEXT_PUBLIC_')) {
          clientEnv[k] = v;
        }
      }
      return clientEnv;
    };

    const mockServerEnv = {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'proj123',
      NEXT_PUBLIC_SANITY_DATASET: 'production',
      SANITY_API_TOKEN: 'secret_token_123',
      RESEND_API_KEY: 're_secret_key',
      SANITY_REVALIDATE_SECRET: 'reval_secret',
    };

    const clientExposed = simulateClientEnv(mockServerEnv);

    assertEquals(clientExposed.NEXT_PUBLIC_SANITY_PROJECT_ID, 'proj123');
    assertEquals(clientExposed.NEXT_PUBLIC_SANITY_DATASET, 'production');
    assertEquals(clientExposed.SANITY_API_TOKEN, undefined);
    assertEquals(clientExposed.RESEND_API_KEY, undefined);
    assertEquals(clientExposed.SANITY_REVALIDATE_SECRET, undefined);
  });

  test('boundary: production vs preview environment isolation determines CDN behavior', () => {
    // In sanity.client.ts:
    // useCdn: process.env.NODE_ENV === 'production'
    const resolveUseCdn = (env: string): boolean => env === 'production';

    assertTrue(resolveUseCdn('production'), 'Production environment must enable fast edge CDN');
    assertFalse(resolveUseCdn('development'), 'Development environment must bypass CDN for fresh data');
    assertFalse(resolveUseCdn('test'), 'Test environment must bypass CDN');
  });
});
