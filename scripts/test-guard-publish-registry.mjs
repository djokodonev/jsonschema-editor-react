#!/usr/bin/env node
/**
 * Tests for the publish-registry guard (KAN-473).
 *
 * Byte-identical across every repo carrying the guard — see the BYTE-IDENTITY
 * note in `guard-publish-registry.mjs`. Change once, copy to all.
 *
 * HOW THIS WORKS WITHOUT PUBLISHING ANYTHING
 * ------------------------------------------
 * The guard resolves the publish target by spawning npm and reading its output.
 * It prefers npm's own CLI entrypoint from `npm_execpath` when that path ends
 * in `.js`, invoking it with the current node binary. So pointing
 * `npm_execpath` at a stub `.js` file substitutes a fake npm completely: no
 * network, no registry, no tarball. The ticket says explicitly: do NOT publish
 * to prove any of this.
 *
 * WHAT IS ASSERTED
 * ----------------
 * Each of the three npm refusals observed in real CI runs must produce a
 * refusal naming THAT cause, and an unrecognised npm failure must still fall
 * back to the generic one. Every path must exit non-zero — this is a
 * diagnostics change, and a diagnostics change that opens an allow path is a
 * regression, so `exit !== 0` is asserted on every case including the fallback.
 *
 * Each case also carries a negative control: the output must NOT be the
 * generic "could not determine" headline. Without it a test asserting only
 * "mentions the version number" would pass on the old code, since the old
 * refusal already dumped npm's output underneath its wrong headline.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const GUARD = resolve(HERE, 'guard-publish-registry.mjs');

const GENERIC = 'Could not determine which registry this publish would reach';

const work = mkdtempSync(join(tmpdir(), 'guard-test-'));
let failures = 0;

/** Write a stub that impersonates npm by printing `out` on stderr. */
function fakeNpm(name, out, code = 1) {
  const p = join(work, `${name}.js`);
  writeFileSync(
    p,
    `process.stderr.write(${JSON.stringify(out)});\nprocess.exit(${code});\n`,
    'utf8',
  );
  return p;
}

function runGuard(npmStub) {
  const r = spawnSync(process.execPath, [GUARD], {
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_execpath: npmStub,
      EGAV_PUBLISH_GUARD_ACTIVE: '',
      EGAV_PUBLISH_REGISTRY: '',
      EGAV_PUBLISH_RELEASE: '',
    },
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

function check(name, cond, detail) {
  if (cond) {
    console.log(`  ok    ${name}`);
  } else {
    console.error(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`);
    failures += 1;
  }
}

/**
 * @param {string} name
 * @param {string} npmOutput   what the fake npm prints
 * @param {RegExp} expect      must appear in the guard's refusal
 */
function refusalCase(name, npmOutput, expect) {
  const { code, out } = runGuard(fakeNpm(name.replace(/\W+/g, '-'), npmOutput));
  check(`${name}: exits non-zero`, code !== 0, `exit=${code}`);
  check(`${name}: names the cause`, expect.test(out), out.slice(0, 400));
  check(`${name}: not the generic headline`, !out.includes(GENERIC));
  // Control: the optional-peer gate runs first and would mask everything here.
  check(`${name}: reached the registry step`, !out.includes('optional peers'));
}

console.log('guard-publish-registry — npm refusal classification (KAN-473)');

refusalCase(
  'already published',
  'npm error code E403\nnpm error 403 Forbidden - PUT https://npm.pkg.github.com/@djokodonev%2fpkg - You cannot publish over the previously published versions: 0.31.0.\n',
  /version 0\.31\.0 is already published/i,
);

refusalCase(
  'prerelease without tag',
  'npm error code EPRERELEASEISNTAG\nnpm error You must specify a tag using --tag when publishing a prerelease version.\n',
  /prerelease and needs an explicit tag/i,
);

refusalCase(
  'implicit latest blocked',
  'npm error code EPUBLISHCONFLICT\nnpm error Cannot implicitly apply the "latest" tag because previously published version 0.31.0 is higher than the new version 0.30.2.\n',
  /lower than the published 0\.31\.0/i,
);

// Fallback: an npm failure the table does not recognise must still refuse, and
// must still refuse with the generic headline rather than a wrong specific one.
{
  const { code, out } = runGuard(
    fakeNpm('unknown', 'npm error code ENEEDAUTH\nnpm error need auth This command requires you to be logged in.\n'),
  );
  check('unknown failure: exits non-zero', code !== 0, `exit=${code}`);
  check('unknown failure: falls back to the generic refusal', out.includes(GENERIC));
  check('unknown failure: still shows npm output', /ENEEDAUTH/.test(out));
}

// Control on the harness itself: if the stub mechanism silently stopped
// substituting npm, every case above would be measuring the real npm instead.
// A stub printing the notice must get PAST resolution and fail at step 2.
{
  const { code, out } = runGuard(
    fakeNpm('resolves', 'npm notice Publishing to https://127.0.0.1:4873/ with tag latest\n', 0),
  );
  check('harness control: the stub is what the guard read', !out.includes(GENERIC), out.slice(0, 300));
  check(
    'harness control: reached the intent check',
    /EGAV_PUBLISH_REGISTRY is unset/.test(out),
    out.slice(0, 300),
  );
  check('harness control: still refuses', code !== 0, `exit=${code}`);
}

rmSync(work, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
