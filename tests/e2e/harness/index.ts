/**
 * E2E Test Harness Core
 *
 * Provides test registration, assertions, execution engine, and statistics tracking
 * adhering to the 4-tier testing methodology.
 */

export type TierType = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Harness';

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
  tier: TierType;
  suiteName: string;
  filePath?: string;
}

export interface TestResult {
  name: string;
  suiteName: string;
  tier: TierType;
  passed: boolean;
  durationMs: number;
  error?: Error;
  filePath?: string;
}

export interface SuiteHook {
  beforeAll: Array<() => void | Promise<void>>;
  afterAll: Array<() => void | Promise<void>>;
  beforeEach: Array<() => void | Promise<void>>;
  afterEach: Array<() => void | Promise<void>>;
}

export interface TestSuite {
  name: string;
  tier: TierType;
  filePath?: string;
  tests: TestCase[];
  hooks: SuiteHook;
}

export interface TierStats {
  tier: TierType;
  suiteCount: number;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
  tierStats: Record<TierType, TierStats>;
}

// Registry State
const suites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;
let activeTier: TierType = 'Tier 1';
let currentFilePath: string | undefined = undefined;

export function setActiveTier(tier: TierType): void {
  activeTier = tier;
}

export function getActiveTier(): TierType {
  return activeTier;
}

export function setCurrentFilePath(path: string | undefined): void {
  currentFilePath = path;
}

export function getCurrentFilePath(): string | undefined {
  return currentFilePath;
}

export function resetRegistry(): void {
  suites.length = 0;
  currentSuite = null;
  activeTier = 'Tier 1';
  currentFilePath = undefined;
}

export function getRegisteredSuites(): TestSuite[] {
  return [...suites];
}

/**
 * Define a test suite
 */
export function describe(name: string, fn: () => void, tierOverride?: TierType): void {
  const suiteTier = tierOverride || activeTier;
  const suite: TestSuite = {
    name,
    tier: suiteTier,
    filePath: currentFilePath,
    tests: [],
    hooks: {
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: [],
    },
  };

  const prevSuite = currentSuite;
  currentSuite = suite;
  suites.push(suite);

  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

/**
 * Register a test case
 */
export function test(name: string, fn: () => void | Promise<void>, tierOverride?: TierType): void {
  const testTier = tierOverride || (currentSuite ? currentSuite.tier : activeTier);
  const suiteName = currentSuite ? currentSuite.name : 'Global';

  const testCase: TestCase = {
    name,
    fn,
    tier: testTier,
    suiteName,
    filePath: currentFilePath,
  };

  if (currentSuite) {
    currentSuite.tests.push(testCase);
  } else {
    // Create an ad-hoc suite
    const defaultSuite: TestSuite = {
      name: 'Global',
      tier: testTier,
      filePath: currentFilePath,
      tests: [testCase],
      hooks: { beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] },
    };
    suites.push(defaultSuite);
  }
}

export const it = test;

export function beforeAll(fn: () => void | Promise<void>): void {
  if (currentSuite) {
    currentSuite.hooks.beforeAll.push(fn);
  }
}

export function afterAll(fn: () => void | Promise<void>): void {
  if (currentSuite) {
    currentSuite.hooks.afterAll.push(fn);
  }
}

export function beforeEach(fn: () => void | Promise<void>): void {
  if (currentSuite) {
    currentSuite.hooks.beforeEach.push(fn);
  }
}

export function afterEach(fn: () => void | Promise<void>): void {
  if (currentSuite) {
    currentSuite.hooks.afterEach.push(fn);
  }
}

// ============================================================================
// Assertion Library
// ============================================================================

export class AssertionError extends Error {
  public actual: any;
  public expected: any;
  public override name = 'AssertionError';

  constructor(message: string, actual?: any, expected?: any) {
    super(message);
    this.actual = actual;
    this.expected = expected;
  }
}

function formatValue(val: any): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
  if (val instanceof RegExp) return val.toString();
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b;
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isDeepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(
      message || 'Expected condition to be truthy, but got falsy value.',
      condition,
      true
    );
  }
}

export function assertTrue(condition: any, message?: string): void {
  if (condition !== true) {
    throw new AssertionError(
      message || `Expected true, but got ${formatValue(condition)}`,
      condition,
      true
    );
  }
}

export function assertFalse(condition: any, message?: string): void {
  if (condition !== false) {
    throw new AssertionError(
      message || `Expected false, but got ${formatValue(condition)}`,
      condition,
      false
    );
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (!isDeepEqual(actual, expected)) {
    const msg = message
      ? `${message} — Expected: ${formatValue(expected)}, but got: ${formatValue(actual)}`
      : `Expected: ${formatValue(expected)}, but got: ${formatValue(actual)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertDeepEquals<T>(actual: T, expected: T, message?: string): void {
  assertEquals(actual, expected, message);
}

export function assertNotEquals<T>(actual: T, expected: T, message?: string): void {
  if (isDeepEqual(actual, expected)) {
    const msg = message
      ? `${message} — Expected values to not equal, but both are: ${formatValue(actual)}`
      : `Expected values to not equal, but both are: ${formatValue(actual)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertContains(
  actual: string | any[] | Set<any> | Map<any, any>,
  expected: any,
  message?: string
): void {
  if (typeof actual === 'string') {
    if (!actual.includes(String(expected))) {
      const msg = message
        ? `${message} — String does not contain expected substring.`
        : `Expected string to contain ${formatValue(expected)}, but got: ${formatValue(actual)}`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  if (Array.isArray(actual)) {
    const found = actual.some((item) => isDeepEqual(item, expected));
    if (!found) {
      const msg = message
        ? `${message} — Array does not contain expected element.`
        : `Expected array to contain ${formatValue(expected)}, but element was not found.`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  if (actual instanceof Set) {
    if (!actual.has(expected)) {
      const msg = message
        ? `${message} — Set does not contain expected element.`
        : `Expected Set to contain ${formatValue(expected)}, but element was not found.`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  if (actual instanceof Map) {
    if (!actual.has(expected)) {
      const msg = message
        ? `${message} — Map does not contain key.`
        : `Expected Map to contain key ${formatValue(expected)}, but key was not found.`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  throw new AssertionError(`assertContains: unsupported container type ${typeof actual}`);
}

export function assertNotContains(
  actual: string | any[] | Set<any>,
  expected: any,
  message?: string
): void {
  if (typeof actual === 'string') {
    if (actual.includes(String(expected))) {
      const msg = message
        ? `${message} — String should not contain substring.`
        : `Expected string to NOT contain ${formatValue(expected)}, but it was found in: ${formatValue(actual)}`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  if (Array.isArray(actual)) {
    const found = actual.some((item) => isDeepEqual(item, expected));
    if (found) {
      const msg = message
        ? `${message} — Array should not contain element.`
        : `Expected array to NOT contain ${formatValue(expected)}, but it was found.`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  if (actual instanceof Set) {
    if (actual.has(expected)) {
      const msg = message
        ? `${message} — Set should not contain element.`
        : `Expected Set to NOT contain ${formatValue(expected)}, but it was found.`;
      throw new AssertionError(msg, actual, expected);
    }
    return;
  }

  throw new AssertionError(`assertNotContains: unsupported container type ${typeof actual}`);
}

export function assertMatches(actual: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(actual)) {
    const msg = message
      ? `${message} — Expected string to match ${pattern}, but got: ${formatValue(actual)}`
      : `Expected string to match pattern ${pattern}, but got: ${formatValue(actual)}`;
    throw new AssertionError(msg, actual, pattern);
  }
}

export function assertNull(actual: any, message?: string): void {
  if (actual !== null) {
    const msg = message
      ? `${message} — Expected null, but got: ${formatValue(actual)}`
      : `Expected null, but got: ${formatValue(actual)}`;
    throw new AssertionError(msg, actual, null);
  }
}

export function assertNotNull(actual: any, message?: string): void {
  if (actual === null) {
    const msg = message
      ? `${message} — Expected non-null value, but got null`
      : `Expected non-null value, but got null`;
    throw new AssertionError(msg, actual, 'non-null');
  }
}

export function assertUndefined(actual: any, message?: string): void {
  if (actual !== undefined) {
    const msg = message
      ? `${message} — Expected undefined, but got: ${formatValue(actual)}`
      : `Expected undefined, but got: ${formatValue(actual)}`;
    throw new AssertionError(msg, actual, undefined);
  }
}

export function assertThrows(
  fn: () => void,
  expectedError?: string | RegExp | Function,
  message?: string
): void {
  let threw = false;
  let caughtError: any = null;

  try {
    fn();
  } catch (err: any) {
    threw = true;
    caughtError = err;
  }

  if (!threw) {
    throw new AssertionError(
      message || 'Expected function to throw an error, but it did not throw.'
    );
  }

  if (expectedError) {
    if (typeof expectedError === 'string') {
      const errorMsg = caughtError?.message || String(caughtError);
      if (!errorMsg.includes(expectedError)) {
        throw new AssertionError(
          `Expected thrown error message to include "${expectedError}", but got "${errorMsg}"`,
          errorMsg,
          expectedError
        );
      }
    } else if (expectedError instanceof RegExp) {
      const errorMsg = caughtError?.message || String(caughtError);
      if (!expectedError.test(errorMsg)) {
        throw new AssertionError(
          `Expected thrown error to match ${expectedError}, but got "${errorMsg}"`,
          errorMsg,
          expectedError
        );
      }
    } else if (typeof expectedError === 'function') {
      if (!(caughtError instanceof expectedError)) {
        throw new AssertionError(
          `Expected error of type ${expectedError.name}, but caught: ${caughtError}`,
          caughtError,
          expectedError
        );
      }
    }
  }
}

export async function assertRejects(
  fn: () => Promise<void>,
  expectedError?: string | RegExp | Function,
  message?: string
): Promise<void> {
  let rejected = false;
  let caughtError: any = null;

  try {
    await fn();
  } catch (err: any) {
    rejected = true;
    caughtError = err;
  }

  if (!rejected) {
    throw new AssertionError(
      message || 'Expected asynchronous function to reject, but it resolved.'
    );
  }

  if (expectedError) {
    if (typeof expectedError === 'string') {
      const errorMsg = caughtError?.message || String(caughtError);
      if (!errorMsg.includes(expectedError)) {
        throw new AssertionError(
          `Expected rejected error message to include "${expectedError}", but got "${errorMsg}"`,
          errorMsg,
          expectedError
        );
      }
    } else if (expectedError instanceof RegExp) {
      const errorMsg = caughtError?.message || String(caughtError);
      if (!expectedError.test(errorMsg)) {
        throw new AssertionError(
          `Expected rejected error to match ${expectedError}, but got "${errorMsg}"`,
          errorMsg,
          expectedError
        );
      }
    } else if (typeof expectedError === 'function') {
      if (!(caughtError instanceof expectedError)) {
        throw new AssertionError(
          `Expected error of type ${expectedError.name}, but caught: ${caughtError}`,
          caughtError,
          expectedError
        );
      }
    }
  }
}

// ============================================================================
// Execution Engine
// ============================================================================

export async function runAllTests(options: { verbose?: boolean; bail?: boolean } = {}): Promise<TestSummary> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  const tierStats: Record<TierType, TierStats> = {
    'Tier 1': { tier: 'Tier 1', suiteCount: 0, total: 0, passed: 0, failed: 0, durationMs: 0 },
    'Tier 2': { tier: 'Tier 2', suiteCount: 0, total: 0, passed: 0, failed: 0, durationMs: 0 },
    'Tier 3': { tier: 'Tier 3', suiteCount: 0, total: 0, passed: 0, failed: 0, durationMs: 0 },
    'Tier 4': { tier: 'Tier 4', suiteCount: 0, total: 0, passed: 0, failed: 0, durationMs: 0 },
    'Harness': { tier: 'Harness', suiteCount: 0, total: 0, passed: 0, failed: 0, durationMs: 0 },
  };

  for (const suite of suites) {
    tierStats[suite.tier].suiteCount++;
    const suiteStartTime = Date.now();

    // Run beforeAll hooks
    for (const hook of suite.hooks.beforeAll) {
      await hook();
    }

    for (const testCase of suite.tests) {
      const testStart = Date.now();
      let passed = true;
      let testError: Error | undefined = undefined;

      try {
        // Run beforeEach hooks
        for (const hook of suite.hooks.beforeEach) {
          await hook();
        }

        // Execute test
        await testCase.fn();

        // Run afterEach hooks
        for (const hook of suite.hooks.afterEach) {
          await hook();
        }
      } catch (err: any) {
        passed = false;
        testError = err instanceof Error ? err : new Error(String(err));
      }

      const durationMs = Date.now() - testStart;
      const result: TestResult = {
        name: testCase.name,
        suiteName: testCase.suiteName,
        tier: testCase.tier,
        passed,
        durationMs,
        error: testError,
        filePath: testCase.filePath,
      };

      results.push(result);

      // Track statistics
      tierStats[testCase.tier].total++;
      if (passed) {
        tierStats[testCase.tier].passed++;
      } else {
        tierStats[testCase.tier].failed++;
      }

      if (options.verbose) {
        const symbol = passed ? '✓' : '✗';
        console.log(`  ${symbol} [${testCase.tier}] ${testCase.suiteName} > ${testCase.name} (${durationMs}ms)`);
        if (!passed && testError) {
          console.error(`     Error: ${testError.message}`);
        }
      }

      if (!passed && options.bail) {
        break;
      }
    }

    // Run afterAll hooks
    for (const hook of suite.hooks.afterAll) {
      await hook();
    }

    tierStats[suite.tier].durationMs += (Date.now() - suiteStartTime);
  }

  const totalDurationMs = Date.now() - startTime;
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed: totalPassed,
    failed: totalFailed,
    durationMs: totalDurationMs,
    results,
    tierStats,
  };
}

export function expect<T = any>(actual: T) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} to be ${formatValue(expected)}`,
          actual,
          expected
        );
      }
    },
    toEqual(expected: any) {
      assertEquals(actual, expected);
    },
    toDeepEqual(expected: any) {
      assertDeepEquals(actual, expected);
    },
    toContain(expected: any) {
      assertContains(actual as any, expected);
    },
    notToContain(expected: any) {
      assertNotContains(actual as any, expected);
    },
    toMatch(pattern: RegExp) {
      assertMatches(String(actual), pattern);
    },
    toBeNull() {
      assertNull(actual);
    },
    toBeDefined() {
      assert(actual !== undefined, 'Expected value to be defined');
    },
    toBeUndefined() {
      assertUndefined(actual);
    },
    toBeTruthy() {
      assert(Boolean(actual), `Expected ${formatValue(actual)} to be truthy`);
    },
    toBeFalsy() {
      assert(!actual, `Expected ${formatValue(actual)} to be falsy`);
    },
  };
}

// Barrel re-exports
export * from './dom';
export * from './http';
export * from './fixtures';

