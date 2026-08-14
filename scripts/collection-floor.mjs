/**
 * KAN-436 / KAN-456 — collection floor.
 *
 * Vitest reports "N passed (N)" where N is the number of test files that
 * *happened to load*. When a file is dropped during collection — in this
 * package, because vitest 1.6.1 round-trips every transformed module through
 * a file in %TEMP% and that write can fail transiently on Windows with
 * `UNKNOWN: unknown error, open ...` — the file simply never appears in the
 * summary. Nothing says "skipped". Worse, the exit code only becomes 1 if the
 * resulting unhandled error reaches the reporter before the summary is
 * printed; otherwise the run reports success having never executed part of
 * the suite.
 *
 * This reporter closes that hole. It compares the files vitest actually
 * collected against the test files that exist on disk, and fails the run if
 * any are missing — so a silent drop can never be reported as a pass again.
 *
 * Deliberately dumb by design:
 *   - It reads the filesystem, not vitest's config, so a config-level
 *     `exclude` cannot quietly shrink the suite either.
 *   - It does not parse argv. An earlier version tried to detect CLI filters
 *     and skip the check for filtered runs; `--exclude <glob>` put its value
 *     in argv as a bare word, which was read as a filter and silently
 *     disabled the whole floor. A floor with an off-switch is not a floor.
 *     A deliberately filtered run (`npx vitest run WatchToggle`) therefore
 *     ends with a loud "partial run" failure. That is the intended trade:
 *     annoying is fine, misleading is not. Use `npm run test:watch` for
 *     iterating; watch mode is exempt.
 *
 * Registered in vitest.config.ts rather than in an npm script wrapper, so
 * `npx vitest run` is covered as well as `npm test`.
 */
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const TEST_FILE_RE = /\.test\.(?:[cm]?tsx?|[cm]?jsx?)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);

const norm = (p) => p.replace(/\\/g, '/').toLowerCase();

function discoverTestFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) discoverTestFiles(full, out);
    } else if (TEST_FILE_RE.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function countTests(task) {
  if (!task) return 0;
  if (task.type === 'test' || task.type === 'custom') return 1;
  return (task.tasks || []).reduce((n, child) => n + countTests(child), 0);
}

/**
 * @param {{ testDir?: string }} [options]
 */
export function collectionFloor(options = {}) {
  const testDir = options.testDir ?? 'tests';
  let log = (msg) => console.error(msg);
  let isWatch = false;

  return {
    onInit(ctx) {
      if (ctx?.logger?.error) log = (msg) => ctx.logger.error(msg);
      isWatch = Boolean(ctx?.config?.watch);
    },

    onFinished(files = [], errors = []) {
      const root = resolve(process.cwd(), testDir);
      const expected = discoverTestFiles(root);

      const collected = new Map();
      for (const file of files) {
        const path = file?.filepath || file?.name;
        if (path) collected.set(norm(path), file);
      }

      const totalTests = [...collected.values()].reduce((n, f) => n + countTests(f), 0);
      const problems = [];

      if (expected.length === 0) {
        problems.push(`no test files found under ${testDir}/ — the floor cannot verify anything`);
      }

      for (const file of expected) {
        if (!collected.has(norm(file))) {
          problems.push(`exists on disk but was never collected: ${file}`);
        }
      }

      if (collected.size === 0) {
        problems.push('vitest collected zero test files');
      }

      for (const [path, file] of collected) {
        if (countTests(file) === 0) {
          problems.push(`collected but registered zero tests: ${path}`);
        }
      }

      // The JSON reporter (unlike the default one) never fails the run on
      // unhandled errors. Close that hole here too.
      if (errors.length > 0) {
        problems.push(`${errors.length} unhandled error(s) during the run`);
      }

      if (problems.length === 0) {
        log(` COLLECTION FLOOR: ok — ${collected.size}/${expected.length} test files, ${totalTests} tests`);
        return;
      }

      if (!isWatch) process.exitCode = 1;

      log('');
      log('-'.repeat(64));
      log(` COLLECTION FLOOR: ${isWatch ? 'PARTIAL RUN' : 'FAILED'}  (KAN-436/KAN-456)`);
      log(`   collected ${collected.size}/${expected.length} test files, ${totalTests} tests`);
      for (const problem of problems) log(`   - ${problem}`);
      if (!isWatch) {
        log('   This run did NOT execute the whole suite. Its result proves nothing.');
      }
      log('-'.repeat(64));
      log('');
    },
  };
}

export default collectionFloor;
