#!/usr/bin/env node
/**
 * Publish-registry guard (KAN-409).
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-05 two `npm publish` calls intended for a local test registry went
 * to the PRODUCTION registry (npm.pkg.github.com) instead. They failed only
 * because those version numbers already existed upstream. Against the staged
 * new versions they would have SUCCEEDED, shipping unreviewed releases to every
 * consumer.
 *
 * The reason is npm's registry precedence for a *scoped* package, which is not
 * what most people assume. Measured on npm 11.11.0:
 *
 *   @scope:registry        (from ANY .npmrc layer, incl. ~/.npmrc)   <-- HIGHEST
 *   --registry <url>       (CLI flag)
 *   publishConfig.registry (package.json)
 *   registry               (default)
 *
 * Consequences:
 *   * A project-level `registry=` line does NOT redirect a scoped package —
 *     the user-level `@scope:registry` mapping wins.
 *   * `npm publish --registry http://localhost:4873/` does NOT redirect it
 *     either, for the same reason.
 *   * Only overriding the SCOPE (`@scope:registry=...`) actually redirects,
 *     and that override even beats `publishConfig.registry`.
 *
 * Because that ordering is subtle and version-dependent, this guard does NOT
 * reimplement it. It asks npm itself where this exact publish is headed, by
 * running `npm publish --dry-run --ignore-scripts` in a child process. The
 * child inherits `npm_config_*` from the parent publish — including
 * `npm_config_userconfig` and `npm_config_registry` — so it resolves under
 * exactly the configuration the real publish will use.
 *
 * THE GATE
 * --------
 *   1. Resolve the effective registry (ask npm). Cannot parse => REFUSE.
 *   2. `EGAV_PUBLISH_REGISTRY` must be set, stating the intended target.
 *      Unset => REFUSE. This is what stops a bare `npm publish`.
 *   3. Intended must equal resolved. Mismatch => REFUSE. This is what would
 *      have stopped the 2026-08-05 near-miss: the operator intended a local
 *      registry, npm had resolved production, and the two disagree.
 *   4. If the resolved registry is a PRODUCTION host, `EGAV_PUBLISH_RELEASE`
 *      must additionally equal exactly `<name>@<version>`. A release is a
 *      product-owner decision, so it requires naming the artifact being cut.
 *      A stale or copy-pasted value fails closed on the next version bump.
 *
 * Every failure path exits non-zero BEFORE npm contacts any network registry
 * (`prepublishOnly` is the first thing `npm publish` runs, and it runs on
 * `--dry-run` too).
 *
 * INTENDED PATHS
 * --------------
 *   Production release:   ./publish.sh          (sets both vars for you)
 *   Local test registry:  see README "Testing a publish locally"
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/** Registries that serve real consumers. Publishing here needs the extra token. */
const PRODUCTION_HOSTS = new Set(['npm.pkg.github.com', 'registry.npmjs.org']);

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8'));
const RELEASE = `${pkg.name}@${pkg.version}`;
const SCOPE = pkg.name.startsWith('@') ? pkg.name.split('/')[0] : null;

const RULE = '='.repeat(74);

/**
 * Print a refusal and exit non-zero.
 * `detail` entries that are `false`/`null`/`undefined` are dropped, so callers
 * can inline conditional lines. Empty strings are kept as blank lines.
 */
function refuse(headline, detail) {
  console.error(`\n${RULE}`);
  console.error(`  PUBLISH REFUSED  —  ${RELEASE}`);
  console.error(`  ${headline}`);
  console.error(RULE);
  for (const line of detail) {
    if (line === false || line === null || line === undefined) continue;
    console.error(line);
  }
  console.error(`${RULE}\n`);
  process.exit(1);
}

/** Trailing slashes and case are not meaningful in a registry URL. */
function normalize(url) {
  return String(url).trim().toLowerCase().replace(/\/+$/, '');
}

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Ask npm where this publish is actually going.
 * Returns the registry URL as npm itself resolved it.
 */
function resolveEffectiveRegistry() {
  const args = ['publish', '--dry-run', '--ignore-scripts'];

  // Prefer invoking npm's CLI entrypoint with the current node binary. npm sets
  // npm_execpath for lifecycle scripts, so this needs no shell — which matters
  // on Windows, where `npm` is a .cmd shim that Node refuses to spawn without
  // one (CVE-2024-27980), and where `shell: true` with an argv array is
  // deprecated (DEP0190).
  const npmCli = process.env.npm_execpath;
  const useCli = typeof npmCli === 'string' && npmCli.endsWith('.js');

  const result = spawnSync(
    useCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm',
    useCli ? [npmCli, ...args] : args,
    {
      cwd: pkgDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: !useCli && process.platform === 'win32',
      // Sentinel: if --ignore-scripts ever stops being honoured, the nested
      // guard short-circuits instead of recursing forever.
      env: { ...process.env, EGAV_PUBLISH_GUARD_ACTIVE: '1' },
    },
  );

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  const match = output.match(/Publishing to (\S+)/i);

  if (!match) {
    refuse('Could not determine which registry this publish would reach.', [
      '  The guard runs `npm publish --dry-run --ignore-scripts` and reads the',
      '  "Publishing to <url>" notice. npm printed no such line, so the target',
      '  is unknown and the guard fails closed rather than guessing.',
      '',
      result.error && `  spawn error: ${result.error.message}`,
      result.error && '',
      '  npm output was:',
      ...(output.split('\n').filter((l) => l.trim()).slice(-15).map((l) => `    ${l}`)),
      output.trim() === '' && '    (no output)',
    ]);
  }

  return match[1];
}

function localRecipe(target) {
  return [
    `    printf '${SCOPE}:registry=${target}\\n' > /tmp/local.npmrc`,
    `    npm config get ${SCOPE}:registry --userconfig=/tmp/local.npmrc   # must print ${hostOf(target) || target}`,
    `    EGAV_PUBLISH_REGISTRY=${target} npm publish --userconfig=/tmp/local.npmrc`,
  ];
}

// ── Recursion sentinel ──────────────────────────────────────────────────────
if (process.env.EGAV_PUBLISH_GUARD_ACTIVE === '1') {
  process.exit(0);
}

// ── 1. Where is this publish actually going? ────────────────────────────────
const resolved = resolveEffectiveRegistry();
const resolvedHost = hostOf(resolved);
const isProduction = resolvedHost !== null && PRODUCTION_HOSTS.has(resolvedHost);

// ── 2. Intent must be stated ────────────────────────────────────────────────
const intended = process.env.EGAV_PUBLISH_REGISTRY;

if (!intended) {
  refuse('No intended registry was declared (EGAV_PUBLISH_REGISTRY is unset).', [
    `  npm resolved this publish to: ${resolved}`,
    isProduction && '  ^^ that is the PRODUCTION registry, serving every consumer.',
    '',
    '  Publishing is a product-owner decision, so the target must be stated',
    '  explicitly and must match where npm would actually send the tarball.',
    '',
    '  To cut a real release:',
    '    ./publish.sh',
    '',
    '  To publish to a local test registry, override the SCOPE — a project-level',
    '  `registry=` line and `--registry` are both ignored for scoped packages:',
    '',
    ...localRecipe('http://127.0.0.1:4873/'),
  ]);
}

// ── 3. Intent must match reality ────────────────────────────────────────────
if (normalize(intended) !== normalize(resolved)) {
  refuse('Intended registry does not match where npm would actually publish.', [
    `  you intended : ${intended}`,
    `  npm resolved : ${resolved}`,
    isProduction && '  ^^ npm resolved to the PRODUCTION registry.',
    '',
    '  This is exactly the 2026-08-05 near-miss (KAN-409): a scoped package',
    '  ignores both a project-level `registry=` line and `--registry`, because',
    `  the \`${SCOPE}:registry\` mapping in ~/.npmrc outranks them.`,
    '',
    '  Redirect the SCOPE, not the default registry:',
    '',
    ...localRecipe(intended),
  ]);
}

// ── 4. Production needs the artifact named ──────────────────────────────────
if (isProduction) {
  const declared = process.env.EGAV_PUBLISH_RELEASE;

  if (declared !== RELEASE) {
    refuse('Production publish is not authorised for this exact version.', [
      `  registry : ${resolved}  (PRODUCTION)`,
      `  release  : ${RELEASE}`,
      `  declared : ${declared === undefined ? '(EGAV_PUBLISH_RELEASE unset)' : declared}`,
      '',
      '  Shipping to production requires naming the exact artifact, so that a',
      '  stale or copy-pasted authorisation cannot carry over to a later',
      '  version bump.',
      '',
      `    EGAV_PUBLISH_RELEASE=${RELEASE} ./publish.sh`,
    ]);
  }
}

// ── Allowed ─────────────────────────────────────────────────────────────────
console.log(RULE);
console.log(`  publish allowed  —  ${RELEASE}`);
console.log(`  registry: ${resolved}${isProduction ? '   (PRODUCTION — authorised)' : '   (non-production)'}`);
console.log(RULE);
