import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble, RELOAD_HOOK } from '../../build/build.mjs';
import { startDev } from '../dev.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixture = readFileSync(join(ROOT, 'build/test/fixtures/demo/slides.html'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('the reload hook is in dev output only', () => {
  assert.doesNotMatch(assemble(fixture, { slug: 'demo' }), /__version/);
  assert.match(assemble(fixture, { slug: 'demo', dev: true }), /__version/);
});

test('dev output equals shipped output plus the hook', () => {
  const shipped = assemble(fixture, { slug: 'demo' });
  const dev = assemble(fixture, { slug: 'demo', dev: true });
  assert.equal(dev.replace(RELOAD_HOOK + '\n', ''), shipped);
});

test('the reload hook follows Mermaid rather than a body tag inside its bundle', () => {
  const slides = '<!-- libs: mermaid -->\n<section class="slide"></section>';
  const shipped = assemble(slides, { slug: 'diagrams' });
  const dev = assemble(slides, { slug: 'diagrams', dev: true });
  const closingBody = shipped.lastIndexOf('</body>');
  assert.ok(shipped.indexOf('</body>') < closingBody);
  assert.equal(dev.indexOf(RELOAD_HOOK), closingBody);
  assert.equal(dev.replace(RELOAD_HOOK + '\n', ''), shipped);
});

test('the server rebuilds when a selected local theme changes', async () => {
  const localDir = join(ROOT, '.local', 'themes');
  const name = `preview-theme-${randomUUID()}`;
  mkdirSync(localDir, { recursive: true });
  const themePath = join(localDir, `${name}.css`);
  writeFileSync(themePath, ':root{--preview-theme-test:#123456}');
  const dir = mkdtempSync(join(tmpdir(), 'dev-theme-'));
  const slidesPath = join(dir, 'slides.html');
  writeFileSync(slidesPath, `<!-- theme: ${name} -->\n<section class="slide"><h2>Theme</h2></section>`);
  let server;
  try {
    server = await startDev({ slidesPath, slug: 'tmp', port: 0 });
    assert.match(await (await fetch(server.url)).text(), /--preview-theme-test:#123456/);
    const firstVersion = server.version();
    writeFileSync(themePath, ':root{--preview-theme-test:#654321}');
    await sleep(800);
    assert.ok(server.version() > firstVersion);
    assert.match(await (await fetch(server.url)).text(), /--preview-theme-test:#654321/);
  } finally {
    await server?.close();
    rmSync(themePath, { force: true });
  }
});

test('the server rebuilds when a selected external add-on theme changes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dev-addon-'));
  const addonRoot = join(dir, 'addon');
  const configPath = join(dir, 'slideware.json');
  const themePath = join(addonRoot, 'themes', 'brand.css');
  mkdirSync(join(addonRoot, 'themes'), { recursive: true });
  writeFileSync(themePath, ':root{--preview-addon-color:#123456}');
  writeFileSync(join(addonRoot, 'slideware-addon.json'), JSON.stringify({
    schemaVersion: 1,
    id: 'preview-addon',
    name: 'Preview add-on',
    themes: { 'preview-external': { css: 'themes/brand.css' } },
  }));
  writeFileSync(configPath, JSON.stringify({ schemaVersion: 1, addons: [addonRoot] }));
  const slidesDir = mkdtempSync(join(tmpdir(), 'dev-addon-deck-'));
  const slidesPath = join(slidesDir, 'slides.html');
  writeFileSync(slidesPath, '<!-- theme: preview-external -->\n<section class="slide"><h2>Theme</h2></section>');
  const previousConfig = process.env.SLIDEWARE_ADDONS_CONFIG;
  process.env.SLIDEWARE_ADDONS_CONFIG = configPath;
  let server;
  try {
    server = await startDev({ slidesPath, slug: 'tmp', port: 0 });
    assert.match(await (await fetch(server.url)).text(), /--preview-addon-color:#123456/);
    const version = server.version();
    writeFileSync(themePath, ':root{--preview-addon-color:#654321}');
    await sleep(800);
    assert.ok(server.version() > version);
    assert.match(await (await fetch(server.url)).text(), /--preview-addon-color:#654321/);
  } finally {
    await server?.close();
    if (previousConfig === undefined) delete process.env.SLIDEWARE_ADDONS_CONFIG;
    else process.env.SLIDEWARE_ADDONS_CONFIG = previousConfig;
    rmSync(dir, { recursive: true, force: true });
    rmSync(slidesDir, { recursive: true, force: true });
  }
});

test('the server rebuilds on save and keeps the last good build on a bad one', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dev-'));
  const slidesPath = join(dir, 'slides.html');
  writeFileSync(slidesPath, '<section class="slide"><h2>One</h2></section>');
  const server = await startDev({ slidesPath, slug: 'tmp', port: 0 });
  try {
    const first = await (await fetch(server.url)).text();
    assert.match(first, /<h2>One<\/h2>/);
    const v1 = server.version();
    writeFileSync(slidesPath, '<section class="slide"><h2>Two</h2></section>');
    await sleep(800);
    assert.ok(server.version() > v1);
    assert.match(await (await fetch(server.url)).text(), /<h2>Two<\/h2>/);
    writeFileSync(slidesPath, '<!-- libs: nope -->\n<section class="slide"></section>');
    await sleep(800);
    assert.match(await (await fetch(server.url)).text(), /<h2>Two<\/h2>/);
  } finally {
    await server.close();
  }
});
