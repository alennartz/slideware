import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble, warnings, ENGINE_BLOCKS, deckPaths, themeDependencies } from '../build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixture = readFileSync(join(ROOT, 'build/test/fixtures/demo/slides.html'), 'utf8');
const plain = '<section class="slide"><h2>Plain</h2></section>';

test('deck paths distinguish source from published output and include the slug', () => {
  const paths = deckPaths('demo');
  assert.equal(paths.sourceDir, join(ROOT, 'decks/demo/source'));
  assert.equal(paths.slidesPath, join(ROOT, 'decks/demo/source/slides.html'));
  assert.equal(paths.outputPath, join(ROOT, 'decks/demo/output/demo.html'));
});

test('title comes from the header, else the slug', () => {
  assert.match(assemble(fixture, { slug: 'demo' }), /<title>Demo deck<\/title>/);
  assert.match(assemble(plain, { slug: 'fallback' }), /<title>fallback<\/title>/);
});

test('header comments do not leak into the slides', () => {
  assert.doesNotMatch(assemble(fixture, { slug: 'demo' }), /<!-- (title|theme|libs):/);
});

test('omitting a theme uses the deckfile default', () => {
  assert.match(assemble(plain, { slug: 'default' }), /--action:#0071E3/);
});

test('built-in themes do not require a valid add-on configuration', () => {
  const dir = mkdtempSync(join(tmpdir(), 'slideware-bad-addon-config-'));
  const configPath = join(dir, 'slideware.json');
  writeFileSync(configPath, '{invalid');
  try {
    assert.match(assemble(plain, { slug: 'default', addonConfigPath: configPath }), /--action:#0071E3/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('local themes are discovered without editing the built-in manifest', () => {
  const localDir = join(ROOT, '.local', 'themes');
  const name = `test-theme-${randomUUID()}`;
  mkdirSync(localDir, { recursive: true });
  const path = join(localDir, `${name}.css`);
  writeFileSync(path, ':root{--local-theme-test:#123456}');
  try {
    const html = assemble(`<!-- theme: ${name} -->\n${plain}`, { slug: 'local-theme' });
    assert.match(html, /--local-theme-test:#123456/);
    assert.doesNotMatch(html, /<!-- theme:/);
  } finally {
    rmSync(path, { force: true });
  }
});

test('external add-on themes and their assets are inlined without executing add-on code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'slideware-addon-build-'));
  const addonRoot = join(dir, 'addon');
  const configPath = join(dir, 'slideware.json');
  mkdirSync(join(addonRoot, 'themes', 'assets'), { recursive: true });
  mkdirSync(join(addonRoot, 'commands'), { recursive: true });
  const markerPath = join(dir, 'command-ran');
  writeFileSync(join(addonRoot, 'themes', 'assets', 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  writeFileSync(join(addonRoot, 'themes', 'brand.css'), ':root{--external-addon-color:#654321}.slide{background-image:url("assets/mark.svg")}');
  writeFileSync(join(addonRoot, 'commands', 'assets.mjs'), `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(markerPath)}, 'ran');`);
  writeFileSync(join(addonRoot, 'slideware-addon.json'), JSON.stringify({
    schemaVersion: 1,
    id: 'test-addon',
    name: 'Test add-on',
    themes: { 'test-addon-brand': { css: 'themes/brand.css', assetRoot: 'themes' } },
    commands: { assets: { entry: 'commands/assets.mjs' } },
  }));
  writeFileSync(configPath, JSON.stringify({ schemaVersion: 1, addons: [addonRoot] }));
  try {
    const slides = `<!-- theme: test-addon-brand -->\n${plain}`;
    const html = assemble(slides, { slug: 'external-addon', addonConfigPath: configPath });
    const deps = themeDependencies(slides, { addonConfigPath: configPath });
    assert.match(html, /--external-addon-color:#654321/);
    assert.match(html, /data:image\/svg\+xml;base64,/);
    assert.ok(deps.includes(configPath));
    const resolvedAddonRoot = realpathSync(addonRoot);
    assert.ok(deps.includes(join(resolvedAddonRoot, 'slideware-addon.json')));
    assert.ok(deps.includes(join(resolvedAddonRoot, 'themes', 'brand.css')));
    assert.ok(deps.includes(join(resolvedAddonRoot, 'themes', 'assets', 'mark.svg')));
    assert.equal(existsSync(markerPath), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('unknown themes fail with the available theme names', () => {
  assert.throws(() => assemble('<!-- theme: missing -->\n' + plain, { slug: 'x' }),
    /unknown theme "missing".*deckfile-default/);
});

test('no libs declared: none inlined', () => {
  const html = assemble(plain, { slug: 'x' });
  assert.doesNotMatch(html, /Chart\.js v4/);
  assert.doesNotMatch(html, /Tabulator v6/);
  assert.doesNotMatch(html, /globalThis\["mermaid"\]/);
});

test('no libs declared: no library glue either', () => {
  assert.doesNotMatch(assemble(plain, { slug: 'x' }), /data-deck="libs"/);
  assert.match(assemble(fixture, { slug: 'demo' }), /data-deck="libs"/);
});

test('declared libs are inlined with their own stylesheets', () => {
  const html = assemble(fixture, { slug: 'demo' });
  assert.match(html, /Chart\.js v4\.6\.1/);
  assert.match(html, /Tabulator v6\.7\.1/);
});

test('Mermaid is optional, self-contained, and carries its licence into the deck', () => {
  const html = assemble('<!-- libs: mermaid -->\n' + plain, { slug: 'diagrams' });
  const bundle = readFileSync(join(ROOT, 'libs/mermaid/12.3.0/mermaid.tiny.js'), 'utf8');
  const license = readFileSync(join(ROOT, 'libs/mermaid/12.3.0/LICENSE'), 'utf8');
  assert.ok(html.includes(bundle), 'the vendored browser bundle is inlined unchanged');
  assert.ok(html.includes(license), 'the MIT notice is included in shipped output');
  assert.match(html, /\.diagram-box\{height:640px/);
  assert.doesNotMatch(html, /Chart\.js v4|Tabulator v6|<script[^>]+src=/);
});

test('shared library styles are included once when Mermaid joins charts and tables', () => {
  const html = assemble(fixture.replace('libs: chart tabulator', 'libs: chart tabulator mermaid'), { slug: 'mixed' });
  assert.equal([...html.matchAll(/\.diagram-box\{height:640px/g)].length, 1);
  assert.match(html, /Chart\.js v4\.6\.1/);
  assert.match(html, /Tabulator v6\.7\.1/);
  assert.match(html, /globalThis\["mermaid"\]/);
});

test('unknown library fails the build', () => {
  assert.throws(() => assemble('<!-- libs: d3 -->\n' + plain, { slug: 'x' }), /unknown library "d3"/);
});

test('slides may not declare the page structure', () => {
  assert.throws(() => assemble('<section class="slide" data-deck="engine"></section>', { slug: 'x' }), /must not contain/);
});

test('engine blocks are the engine files, byte for byte', () => {
  const html = assemble(plain, { slug: 'x' });
  const blocks = ENGINE_BLOCKS.map(b => [...html.matchAll(b.re)].filter(m => !m[0].startsWith('<!--'))[0]);
  const [style, script] = blocks;
  assert.equal(style[0].replace(/^<style[^>]*>|<\/style>$/g, '').trim(), readFileSync(join(ROOT, 'engine/deck.css'), 'utf8').trim());
  assert.equal(script[0].replace(/^<script[^>]*>|<\/script>$/g, '').trim(), readFileSync(join(ROOT, 'engine/deck.js'), 'utf8').trim());
});

test('deckfile update is a no-op on a fresh build', () => {
  // deckfile's update rule: replace each engine block's body with the engine file. Output must not change.
  const html = assemble(fixture, { slug: 'demo' });
  const updated = ENGINE_BLOCKS.reduce((h, b) => h.replace(b.re, (m, open, close) => {
    if (!open) return m; // a comment
    return open + '\n' + readFileSync(join(ROOT, 'engine', b.file), 'utf8') + close;
  }), html);
  assert.equal(updated, html);
});

test('remote resources in slides are reported', () => {
  assert.deepEqual(warnings('<img src="https://example.com/a.png">'), ['remote resource: https://example.com/a.png']);
  assert.deepEqual(warnings(plain), []);
});
