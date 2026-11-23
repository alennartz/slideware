import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadAddons, resolveCommand, resolveTheme } from '../registry.mjs';

function makeAddonFixture() {
  const factoryRoot = mkdtempSync(join(tmpdir(), 'slideware-factory-'));
  const addonRoot = mkdtempSync(join(tmpdir(), 'slideware-addon-'));
  const configPath = join(factoryRoot, '.local', 'slideware.json');
  mkdirSync(join(factoryRoot, '.local'), { recursive: true });
  mkdirSync(join(addonRoot, 'themes', 'assets'), { recursive: true });
  mkdirSync(join(addonRoot, 'tools'), { recursive: true });
  writeFileSync(join(addonRoot, 'README.md'), '# Add-on guide');
  writeFileSync(join(addonRoot, 'themes', 'brand.css'), ':root{--test-brand:#123456}');
  writeFileSync(join(addonRoot, 'themes', 'assets', 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  writeFileSync(join(addonRoot, 'tools', 'assets.mjs'), '');
  writeFileSync(join(addonRoot, 'slideware-addon.json'), JSON.stringify({
    schemaVersion: 1,
    id: 'example',
    name: 'Example add-on',
    description: 'Test add-on',
    guide: 'README.md',
    themes: { 'example-brand': { css: 'themes/brand.css', assetRoot: 'themes' } },
    commands: { assets: { entry: 'tools/assets.mjs', description: 'Example assets' } },
  }));
  writeFileSync(configPath, JSON.stringify({ schemaVersion: 1, addons: [addonRoot] }));
  return {
    factoryRoot,
    addonRoot,
    configPath,
    cleanup() {
      rmSync(factoryRoot, { recursive: true, force: true });
      rmSync(addonRoot, { recursive: true, force: true });
    },
  };
}

test('missing local configuration means no add-ons', () => {
  const factoryRoot = mkdtempSync(join(tmpdir(), 'slideware-factory-'));
  try {
    assert.deepEqual(loadAddons({ factoryRoot }).addons, []);
  } finally {
    rmSync(factoryRoot, { recursive: true, force: true });
  }
});

test('loads add-on metadata and resolves theme and command paths', () => {
  const fixture = makeAddonFixture();
  try {
    const registry = loadAddons({ factoryRoot: fixture.factoryRoot });
    assert.equal(registry.addons[0].id, 'example');
    assert.equal(registry.addons[0].guidePath, join(realpathSync(fixture.addonRoot), 'README.md'));
    const resolvedAddonRoot = realpathSync(fixture.addonRoot);
    assert.equal(resolveTheme('example-brand', { addons: registry.addons }).cssPath, join(resolvedAddonRoot, 'themes', 'brand.css'));
    assert.equal(resolveCommand('assets', { addons: registry.addons }).entryPath, join(resolvedAddonRoot, 'tools', 'assets.mjs'));
  } finally {
    fixture.cleanup();
  }
});

test('rejects an add-on located inside the factory checkout', () => {
  const factoryRoot = mkdtempSync(join(tmpdir(), 'slideware-factory-'));
  const addonRoot = join(factoryRoot, 'vendor-addon');
  mkdirSync(addonRoot, { recursive: true });
  writeFileSync(join(factoryRoot, '.local-slideware.json'), JSON.stringify({ schemaVersion: 1, addons: ['vendor-addon'] }));
  try {
    assert.throws(
      () => loadAddons({ factoryRoot, configPath: join(factoryRoot, '.local-slideware.json') }),
      /must live outside the factory checkout/,
    );
  } finally {
    rmSync(factoryRoot, { recursive: true, force: true });
  }
});

test('rejects resource paths that escape the add-on package', () => {
  const fixture = makeAddonFixture();
  try {
    const manifestPath = join(fixture.addonRoot, 'slideware-addon.json');
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: 1,
      id: 'example',
      name: 'Example add-on',
      themes: { 'example-brand': { css: '../outside.css' } },
    }));
    assert.throws(() => loadAddons({ factoryRoot: fixture.factoryRoot }), /path escapes the add-on directory/);
  } finally {
    fixture.cleanup();
  }
});

test('requires an explicit add-on when multiple packages provide an asset command', () => {
  const fixture = makeAddonFixture();
  const second = mkdtempSync(join(tmpdir(), 'slideware-addon-'));
  try {
    mkdirSync(join(second, 'tools'));
    writeFileSync(join(second, 'tools', 'assets.mjs'), '');
    writeFileSync(join(second, 'slideware-addon.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'second',
      name: 'Second add-on',
      commands: { assets: { entry: 'tools/assets.mjs' } },
    }));
    writeFileSync(fixture.configPath, JSON.stringify({ schemaVersion: 1, addons: [fixture.addonRoot, second] }));
    const addons = loadAddons({ factoryRoot: fixture.factoryRoot }).addons;
    assert.throws(() => resolveCommand('assets', { addons }), /multiple add-ons provide "assets"; set ADDON=<id>/);
    assert.equal(resolveCommand('assets', { addons, addonId: 'second' }).addonId, 'second');
  } finally {
    rmSync(second, { recursive: true, force: true });
    fixture.cleanup();
  }
});
