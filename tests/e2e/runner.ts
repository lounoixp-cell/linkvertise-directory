#!/usr/bin/env tsx
/**
 * Linkvertise E2E Test Runner CLI
 *
 * Automatically discovers, categorizes, and executes test suites across:
 * - Tier 1: Category-Partition Equivalence Class Testing (tests/e2e/tier1-features/)
 * - Tier 2: Boundary Value Analysis & Error Cases (tests/e2e/tier2-boundaries/)
 * - Tier 3: Pairwise Combinatorial Interaction Testing (tests/e2e/tier3-combinations/)
 * - Tier 4: Real-World Application Workload Scenarios (tests/e2e/tier4-scenarios/)
 * - Harness: Test infrastructure verification (tests/e2e/harness/)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  runAllTests,
  setActiveTier,
  setCurrentFilePath,
  TierType,
  TestSummary,
} from './harness/index';

interface TierConfig {
  dir: string;
  tier: TierType;
  label: string;
}

const TIER_CONFIGS: TierConfig[] = [
  { dir: 'tests/e2e/harness', tier: 'Harness', label: 'Harness (Smoke)' },
  { dir: 'tests/e2e/tier1-features', tier: 'Tier 1', label: 'Tier 1 (Features)' },
  { dir: 'tests/e2e/tier2-boundaries', tier: 'Tier 2', label: 'Tier 2 (Boundaries)' },
  { dir: 'tests/e2e/tier3-combinations', tier: 'Tier 3', label: 'Tier 3 (Combinations)' },
  { dir: 'tests/e2e/tier4-scenarios', tier: 'Tier 4', label: 'Tier 4 (Scenarios)' },
];

function findTestFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts'))) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function pad(str: string | number, length: number, align: 'left' | 'right' = 'left'): string {
  const s = String(str);
  if (s.length >= length) return s;
  const padding = ' '.repeat(length - s.length);
  return align === 'left' ? s + padding : padding + s;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function renderTable(summary: TestSummary): void {
  const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };

  console.log(`\n${c.bold}================================================================================${c.reset}`);
  console.log(`${c.bold}                       LINKVERTISE E2E TEST RESULTS SUMMARY                     ${c.reset}`);
  console.log(`${c.bold}================================================================================${c.reset}\n`);

  console.log('┌─────────────────────────────┬────────┬───────────┬────────┬────────┬──────────┐');
  console.log('│ Tier                        │ Suites │ Tests Run │ Passed │ Failed │ Duration │');
  console.log('├─────────────────────────────┼────────┼───────────┼────────┼────────┼──────────┤');

  for (const cfg of TIER_CONFIGS) {
    const stat = summary.tierStats[cfg.tier];
    const passColor = stat.passed > 0 ? c.green : c.gray;
    const failColor = stat.failed > 0 ? c.red : c.gray;

    const row = [
      pad(cfg.label, 27, 'left'),
      pad(stat.suiteCount, 6, 'right'),
      pad(stat.total, 9, 'right'),
      `${passColor}${pad(stat.passed, 6, 'right')}${c.reset}`,
      `${failColor}${pad(stat.failed, 6, 'right')}${c.reset}`,
      pad(formatDuration(stat.durationMs), 8, 'right'),
    ].join(' │ ');

    console.log(`│ ${row} │`);
  }

  console.log('├─────────────────────────────┼────────┼───────────┼────────┼────────┼──────────┤');

  const totalSuites = Object.values(summary.tierStats).reduce((acc, s) => acc + s.suiteCount, 0);
  const totalPassColor = summary.passed > 0 ? c.green : c.gray;
  const totalFailColor = summary.failed > 0 ? c.red : c.green;

  const totalRow = [
    pad(`${c.bold}TOTAL${c.reset}`, 36, 'left'),
    pad(totalSuites, 6, 'right'),
    pad(summary.total, 9, 'right'),
    `${totalPassColor}${pad(summary.passed, 6, 'right')}${c.reset}`,
    `${totalFailColor}${pad(summary.failed, 6, 'right')}${c.reset}`,
    pad(formatDuration(summary.durationMs), 8, 'right'),
  ].join(' │ ');

  console.log(`│ ${totalRow} │`);
  console.log('└─────────────────────────────┴────────┴───────────┴────────┴────────┴──────────┘\n');
}

async function main(): Promise<void> {
  const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  const projectRoot = process.cwd();

  console.log(`[E2E Runner] Initializing test discovery in: ${projectRoot}`);
  let discoveredCount = 0;

  for (const cfg of TIER_CONFIGS) {
    const absDir = path.resolve(projectRoot, cfg.dir);
    const testFiles = findTestFiles(absDir);

    for (const file of testFiles) {
      discoveredCount++;
      const relativePath = path.relative(projectRoot, file);
      setActiveTier(cfg.tier);
      setCurrentFilePath(relativePath);

      try {
        await import(path.resolve(file));
      } catch (err: any) {
        console.error(`[E2E Runner] ❌ Failed to import test file: ${relativePath}`);
        console.error(err);
        process.exit(1);
      }
    }
  }

  console.log(`[E2E Runner] Discovered ${discoveredCount} test file(s). Executing test suites...\n`);

  const summary = await runAllTests({ verbose: isVerbose });

  renderTable(summary);

  if (summary.failed > 0) {
    console.error(`\x1b[31m\x1b[1mFAILED: ${summary.failed} test(s) failed.\x1b[0m\n`);

    const failedTests = summary.results.filter((r) => !r.passed);
    for (const test of failedTests) {
      console.error(`\x1b[31m● [${test.tier}] ${test.suiteName} > ${test.name}\x1b[0m`);
      if (test.filePath) {
        console.error(`  \x1b[90mat ${test.filePath}\x1b[0m`);
      }
      if (test.error) {
        console.error(`  \x1b[33mError: ${test.error.message}\x1b[0m`);
        if (test.error.stack) {
          const stackLines = test.error.stack.split('\n').slice(1, 4).join('\n');
          console.error(`  \x1b[90m${stackLines}\x1b[0m`);
        }
      }
      console.error('');
    }

    process.exit(1);
  } else {
    console.log(`\x1b[32m\x1b[1mSUCCESS: All ${summary.passed} test(s) passed cleanly.\x1b[0m\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[E2E Runner] Unhandled runner error:', err);
  process.exit(1);
});
