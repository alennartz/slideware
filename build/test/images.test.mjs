import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inlineImages, referencedAssets, LARGE_IMAGE } from '../images.mjs';

const files = { 'assets/a.png': Buffer.from('PNGDATA'), 'assets/big.jpg': Buffer.alloc(LARGE_IMAGE + 1) };
const reader = rel => { if (!(rel in files)) throw new Error(`missing ${rel}`); return files[rel]; };

test('img src is replaced by a data URI with the right type', () => {
  const { slides } = inlineImages('<img src="assets/a.png" alt="x">', reader);
  assert.equal(slides, `<img src="data:image/png;base64,${Buffer.from('PNGDATA').toString('base64')}" alt="x">`);
});

test('escaped Mermaid label images are inlined and watched', () => {
  const source = `<pre class="mermaid" data-html-labels>flowchart LR\nA["&lt;img src='assets/a.png' width='40' height='40' /&gt; K3s"]</pre>`;
  const { slides } = inlineImages(source, reader);
  assert.match(slides, /&lt;img src='data:image\/png;base64,/);
  assert.deepEqual(referencedAssets(source), ['assets/a.png']);
});

test('css url() is inlined too', () => {
  const { slides } = inlineImages('<div style="background:url(\'assets/a.png\')"></div>', reader);
  assert.match(slides, /url\('data:image\/png;base64,/);
});

test('a missing file fails the build', () => {
  assert.throws(() => inlineImages('<img src="assets/nope.png">', reader), /missing assets\/nope.png/);
});

test('paths outside the deck and unknown types are refused', () => {
  assert.throws(() => inlineImages('<img src="assets/../secret.png">', reader), /relative path/);
  assert.throws(() => inlineImages('<img src="assets/a.bmp">', reader), /extension/);
});

test('remote and non-asset sources are left alone', () => {
  const html = '<img src="https://example.com/a.png"><img src="data:image/png;base64,AAAA">';
  assert.equal(inlineImages(html, reader).slides, html);
});

test('large images warn', () => {
  const { warnings } = inlineImages('<img src="assets/big.jpg">', reader);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /large image assets\/big.jpg/);
});

test('referencedAssets lists each asset once', () => {
  assert.deepEqual(referencedAssets('<img src="assets/a.png"><img src="assets/a.png"><div style="url(assets/b.jpg)">'), ['assets/a.png', 'assets/b.jpg']);
});
