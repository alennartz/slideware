import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assemble } from '../../build/build.mjs';
import { inlineImages } from '../../build/images.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const fixture = readFileSync(join(ROOT, 'build/test/fixtures/diagrams/slides.html'), 'utf8');

test('Mermaid renders offline with slide themes, hidden slides, errors, and print readiness', () => {
  const session = execFileSync('agent-browser', ['session', 'id', '--scope', 'worktree', '--prefix', `diagrams-${process.pid}`], { encoding: 'utf8' }).trim();
  const directory = mkdtempSync(join(tmpdir(), 'slideware-diagrams-'));
  const browser = (...args) => {
    const output = execFileSync('agent-browser', ['--session', session, '--json', ...args], {
      encoding: 'utf8', timeout: 30_000, maxBuffer: 1024 * 1024,
    });
    const response = JSON.parse(output);
    assert.equal(response.success, true, response.error);
    return response.data;
  };
  const evaluate = script => browser('eval', script).result;
  const writeDeck = (name, source, transform = html => html) => {
    const path = join(directory, name);
    writeFileSync(path, transform(assemble(source, { slug: 'diagrams' })));
    return pathToFileURL(path).href;
  };
  const waitForDiagrams = () => browser('wait', '--fn', "document.querySelector('#stage')?.dataset.diagrams && document.querySelector('#stage').dataset.diagrams !== 'pending'");

  try {
    browser('set', 'offline', 'on');
    browser('open', writeDeck('diagrams.html', fixture));
    waitForDiagrams();
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'ready');
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid[data-diagram-status=ready] > svg').length"), 4);
    assert.equal(evaluate("getComputedStyle(document.querySelectorAll('.slide')[1]).display"), 'none');
    assert.equal(evaluate("document.querySelectorAll('.diagram-measure').length"), 0);
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid svg foreignObject').length"), 0);

    const accessible = evaluate(`Array.from(document.querySelectorAll('pre.mermaid > svg'), svg => ({
      title: document.getElementById(svg.getAttribute('aria-labelledby'))?.textContent,
      description: document.getElementById(svg.getAttribute('aria-describedby'))?.textContent,
      viewBox: svg.viewBox.baseVal.width > 0 && svg.viewBox.baseVal.height > 0,
      font: getComputedStyle(svg).fontFamily,
    }))`);
    assert.equal(accessible.length, 4);
    accessible.forEach(diagram => {
      assert.ok(diagram.title?.length && diagram.description?.length);
      assert.equal(diagram.viewBox, true);
      assert.match(diagram.font, /Inter/);
    });

    const themes = evaluate(`Array.from(document.querySelectorAll('pre.mermaid > svg'), svg => {
      const shape = svg.querySelector('.highlight rect, .highlight polygon, .highlight path');
      return shape ? { fill: getComputedStyle(shape).fill, stroke: getComputedStyle(shape).stroke } : null;
    })`);
    assert.deepEqual(themes[0], { fill: 'rgb(245, 245, 247)', stroke: 'rgb(0, 113, 227)' });
    assert.deepEqual(themes[2], { fill: 'rgb(248, 238, 244)', stroke: 'rgb(166, 38, 111)' });
    assert.deepEqual(themes[3], { fill: 'rgb(20, 20, 20)', stroke: 'rgb(41, 151, 255)' });
    assert.equal(evaluate("getComputedStyle(document.querySelector('#slideware-diagram-1 text.actor > tspan')).fill"), 'rgb(255, 255, 255)');
    assert.equal(evaluate("getComputedStyle(document.querySelector('#slideware-diagram-1 .messageText')).fontSize"), '32px');
    assert.deepEqual(evaluate("Array.from(document.querySelectorAll('#slideware-diagram-2 .highlight .label text tspan')).filter(e => !e.children.length).map(e => e.textContent)"), ['Approved?']);

    for (let index = 0; index < 4; index++) {
      if (index) browser('press', 'ArrowRight');
      const bounds = evaluate(`(() => {
        const slide = document.querySelector('.slide.current');
        const svg = slide.querySelector('pre.mermaid > svg');
        const frame = slide.getBoundingClientRect(), box = svg.getBoundingClientRect();
        const inside = r => r.left >= box.left - 1 && r.right <= box.right + 1 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
        return {
          visible: box.width > 0 && box.height > 0,
          fits: box.left >= frame.left && box.right <= frame.right + 1 && box.top >= frame.top && box.bottom <= frame.bottom + 1,
          labelsFit: Array.from(svg.querySelectorAll('text, tspan')).filter(e => e.textContent.trim()).every(e => inside(e.getBoundingClientRect())),
        };
      })()`);
      assert.deepEqual(bounds, { visible: true, fits: true, labelsFit: true }, `slide ${index + 1}`);
    }
    browser('press', 'ArrowRight');
    browser('wait', '--fn', "Chart.getChart(document.querySelector('canvas[data-chart]')).width > 0 && document.querySelectorAll('.tabulator-row').length === 1");
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'ready');
    const pdf = join(directory, 'deck.pdf');
    browser('pdf', pdf);
    const pdfText = readFileSync(pdf, 'latin1');
    assert.ok(pdfText.startsWith('%PDF-'));
    assert.equal([...pdfText.matchAll(/\/Type\s*\/Page\b/g)].length, 5);

    const labelSource = `<!-- libs: mermaid -->
<section class="slide"><h2>Images inside nodes</h2><div class="diagram-box"><pre class="mermaid" data-html-labels>
flowchart LR
  accTitle: Node logo
  accDescr: An image and its text label are inside the same node.
  A["&lt;a href='https://k3s.io/'&gt;&lt;img src='assets/logo.svg' width='48' height='48' alt='K3s logo' onerror='window.__unsafeLabel=true' /&gt;&lt;/a&gt; K3s"] --> B[Workloads]
</pre></div></section>
<section class="slide"><h2>Plain labels remain SVG</h2><div class="diagram-box"><pre class="mermaid">
flowchart LR
  accTitle: Plain node
  accDescr: A plain node is rendered without HTML labels.
  A[Plain] --> B[Workloads]
</pre></div></section>`;
    const logo = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="blue"/></svg>');
    const labelled = inlineImages(labelSource, () => logo).slides;
    assert.ok(labelled.includes('data:image/svg+xml;base64,'));
    browser('open', writeDeck('labels.html', labelled));
    waitForDiagrams();
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'ready');
    const image = evaluate(`(() => {
      const img = document.querySelector('pre[data-html-labels] .node img');
      const node = img?.closest('.node');
      const a = img?.getBoundingClientRect(), b = node?.getBoundingClientRect();
      return { loaded: !!img?.naturalWidth, embedded: img?.getAttribute('src').startsWith('data:image/svg+xml;base64,'),
        link: img?.closest('a')?.getAttribute('href'), unsafe: img?.hasAttribute('onerror'),
        inside: !!a && !!b && a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1 };
    })()`);
    assert.deepEqual(image, { loaded: true, embedded: true, link: 'https://k3s.io/', unsafe: false, inside: true });
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid:not([data-html-labels]) foreignObject').length"), 0);
    const labelPdf = join(directory, 'labels.pdf');
    browser('pdf', labelPdf);
    const labelPdfText = readFileSync(labelPdf, 'latin1');
    assert.ok(labelPdfText.startsWith('%PDF-'));
    assert.match(labelPdfText, /\/Alt \(K3s logo\)/);

    const pngLogo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEElEQVR4nGNgcPj/H4xhDABJUgj5SWTXhwAAAABJRU5ErkJggg==', 'base64');
    const pngLabel = inlineImages(labelSource.replace('assets/logo.svg', 'assets/logo.png'), () => pngLogo).slides;
    browser('open', writeDeck('png-label.html', pngLabel));
    waitForDiagrams();
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'ready');
    const pngPdf = join(directory, 'png-label.pdf');
    browser('pdf', pngPdf);
    assert.match(readFileSync(pngPdf, 'latin1'), /\/Subtype\s*\/Image\b/);

    const brokenLabel = inlineImages(labelSource, () => Buffer.from('not an image')).slides;
    browser('open', writeDeck('broken-label.html', brokenLabel));
    waitForDiagrams();
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'error');
    assert.match(evaluate("document.querySelector('pre.mermaid').textContent"), /Diagram error on slide 1.*Images inside nodes/);
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid[data-diagram-status=ready]').length"), 1);

    const guide = readFileSync(join(ROOT, '.agents/skills/deck-markup/diagrams.md'), 'utf8');
    const examples = [...guide.matchAll(/```html\n([\s\S]*?)```/g)].map(([, source]) => source.includes('<section')
      ? source : `<section class="slide dark"><h2>Review exchange</h2><div class="cols"><div>${source}</div><p>Every message has a clear owner.</p></div></section>`);
    assert.equal(examples.length, 3);
    const examplesWithLogo = inlineImages(examples.join('\n'), () => logo).slides;
    browser('open', writeDeck('examples.html', examplesWithLogo));
    waitForDiagrams();
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'ready');
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid > svg').length"), 3);

    const invalid = fixture.replace(/(<pre class="mermaid">)[\s\S]*?(<\/pre>)/, '$1\nflowchart LR\nA[Unclosed\n$2');
    browser('open', writeDeck('invalid.html', invalid));
    waitForDiagrams();
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'error');
    assert.match(evaluate("document.querySelector('pre.mermaid').textContent"), /Diagram error on slide 1.*A shared syntax/);
    assert.equal(evaluate("document.querySelector('pre.mermaid').getAttribute('role')"), 'alert');
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid[data-diagram-status=ready]').length"), 3);
    assert.equal(evaluate("document.querySelectorAll('.diagram-measure').length"), 0);

    const delayed = writeDeck('print.html', fixture, html => html.replace('<body>', `<body><script>
      window.printStates = [];
      window.print = () => window.printStates.push(document.querySelector('#stage').dataset.diagrams);
      Object.defineProperty(document.fonts, 'ready', { value: new Promise(resolve => { window.releaseFonts = resolve; }) });
    </script>`));
    browser('open', delayed + '?print');
    assert.equal(evaluate("document.querySelector('#stage').dataset.diagrams"), 'pending');
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid > svg').length"), 0);
    browser('press', 'p');
    assert.deepEqual(evaluate('window.printStates'), []);
    evaluate('window.releaseFonts()');
    browser('wait', '--fn', 'window.printStates.length === 2');
    assert.deepEqual(evaluate('window.printStates'), ['ready', 'ready']);
    assert.equal(evaluate("document.querySelectorAll('pre.mermaid[data-diagram-status=ready] > svg').length"), 4);
  } finally {
    try { browser('close'); } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});
