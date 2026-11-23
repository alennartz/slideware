import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FACTORY_ROOT } from '../registry.mjs';

const CLI = fileURLToPath(new URL('../cli.mjs', import.meta.url));

function fixture() {
  const factoryRoot = mkdtempSync(join(tmpdir(), 'slideware-factory-'));
  const addonRoot = mkdtempSync(join(tmpdir(), 'slideware-addon-'));
  const configPath = join(factoryRoot, 'slideware.json');
  const markerPath = join(factoryRoot, 'invoked.json');
  mkdirSync(join(addonRoot, 'tools'));
  writeFileSync(join(addonRoot, 'tools', 'assets.mjs'), `
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.ADDON_TEST_MARKER, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), root: process.env.SLIDEWARE_ROOT }));
`);
  writeFileSync(join(addonRoot, 'slideware-addon.json'), JSON.stringify({
    schemaVersion: 1,
    id: 'example',
    name: 'Example add-on',
    commands: { assets: { entry: 'tools/assets.mjs', description: 'Test asset command' } },
  }));
  writeFileSync(configPath, JSON.stringify({ schemaVersion: 1, addons: [addonRoot] }));
  const env = { ...process.env, SLIDEWARE_ADDONS_CONFIG: configPath, ADDON_TEST_MARKER: markerPath };
  const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env });
  return {
    factoryRoot,
    addonRoot,
    markerPath,
    env,
    run,
    cleanup() {
      rmSync(factoryRoot, { recursive: true, force: true });
      rmSync(addonRoot, { recursive: true, force: true });
    },
  };
}

test('listing add-ons describes capabilities without running their command', () => {
  const f = fixture();
  try {
    const result = f.run('list');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /example — Example add-on/);
    assert.match(result.stdout, /command: assets — Test asset command/);
    assert.equal(existsSync(f.markerPath), false);
  } finally {
    f.cleanup();
  }
});

test('asset command runs only when explicitly selected and receives arguments in factory context', () => {
  const f = fixture();
  try {
    const result = f.run('assets', 'example', '--', 'search', 'red logo');
    assert.equal(result.status, 0, result.stderr);
    const invoked = JSON.parse(readFileSync(f.markerPath, 'utf8'));
    assert.deepEqual(invoked.args, ['search', 'red logo']);
    assert.equal(invoked.cwd, FACTORY_ROOT);
    assert.equal(invoked.root, FACTORY_ROOT);
  } finally {
    f.cleanup();
  }
});

test('asset command fails clearly when no add-on is configured', () => {
  const missing = join(tmpdir(), `slideware-missing-config-${process.pid}.json`);
  const result = spawnSync(process.execPath, [CLI, 'assets', '--', 'search'], {
    encoding: 'utf8',
    env: { ...process.env, SLIDEWARE_ADDONS_CONFIG: missing },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no configured add-on provides command "assets"; run make addons/);
});
