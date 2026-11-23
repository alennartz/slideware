/*! slideware libs-init · MIT · starts the optional libraries a deck declares, in the theme's colours */
(() => {
  const stage = document.getElementById('stage');
  const token = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const charts = new Map(), tables = new Map();

  // Chart.js: <canvas data-chart='{ ...Chart.js config... }'>
  if (window.Chart) {
    Chart.defaults.color = token('--muted');
    Chart.defaults.borderColor = token('--line');
    Chart.defaults.font.family = token('--font-body');
    Chart.defaults.font.size = 28; // the slide is 1920 px wide
    Chart.defaults.animation = false;
    // datasets without their own colour take the theme's accent, then ink, then muted, in turn
    const palette = [token('--accent'), token('--ink'), token('--muted')];
    document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
      const config = JSON.parse(canvas.dataset.chart);
      config.options = Object.assign({ responsive: true, maintainAspectRatio: false }, config.options);
      (config.data?.datasets ?? []).forEach((ds, i) => {
        if (!ds.backgroundColor) ds.backgroundColor = palette[i % palette.length];
        if (!ds.borderColor) ds.borderColor = ds.backgroundColor;
      });
      charts.set(canvas, new Chart(canvas, config));
    });
  }

  // Tabulator: <div data-tabulator='{ ...Tabulator options... }'>
  if (window.Tabulator) {
    document.querySelectorAll('[data-tabulator]').forEach(el => {
      const options = Object.assign({ layout: 'fitColumns' }, JSON.parse(el.dataset.tabulator));
      tables.set(el, new Tabulator(el, options));
    });
  }

  // Disable Mermaid's load listener before waiting for fonts; only this adapter owns rendering.
  window.mermaid?.initialize({ startOnLoad: false });
  const diagrams = [...stage.querySelectorAll('pre.mermaid')];
  if (diagrams.length) {
    const slides = [...stage.querySelectorAll('.slide')];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    const host = document.createElement('div');
    host.className = 'diagram-measure';
    host.setAttribute('aria-hidden', 'true');
    document.body.append(host);

    const colour = (value, background = '#ffffff') => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return '#' + [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
        .map(channel => channel.toString(16).padStart(2, '0')).join('');
    };

    const diagramTheme = slide => {
      const style = getComputedStyle(slide);
      const background = colour(style.backgroundColor);
      const readColour = name => colour(style.getPropertyValue(name).trim(), background);
      const ink = readColour('--ink'), muted = readColour('--muted');
      const accent = readColour('--accent'), panel = readColour('--panel'), line = readColour('--line');
      return {
        background, primaryColor: panel, primaryTextColor: ink, primaryBorderColor: line,
        secondaryColor: panel, secondaryTextColor: ink, secondaryBorderColor: line,
        tertiaryColor: panel, tertiaryTextColor: ink, tertiaryBorderColor: line,
        textColor: ink, lineColor: muted, mainBkg: panel,
        edgeLabelBackground: background,
        actorBkg: panel, actorBorder: line, actorTextColor: ink, actorLineColor: muted,
        signalColor: muted, signalTextColor: ink,
        noteBkgColor: panel, noteTextColor: ink, noteBorderColor: accent,
        labelBoxBkgColor: panel, labelBoxBorderColor: line, labelTextColor: ink,
        activationBkgColor: panel, activationBorderColor: accent,
        fontFamily: style.getPropertyValue('--font-body').trim(), fontSize: '32px',
        // These colours also define the author-facing flowchart classes.
        accent, muted,
      };
    };

    const showDiagramError = (element, error) => {
      const slide = element.closest('.slide');
      const number = slides.indexOf(slide) + 1;
      const headline = slide?.querySelector('h1,h2,h3')?.textContent.trim();
      const message = `Diagram error on slide ${number}${headline ? ` · ${headline}` : ''}: ${error.message ?? error}`;
      element.textContent = message;
      element.dataset.diagramStatus = 'error';
      element.setAttribute('role', 'alert');
      console.error(message);
    };

    stage.dataset.diagrams = 'pending';
    diagrams.forEach(element => { element.dataset.diagramStatus = 'pending'; });
    const renderDiagrams = async () => {
      try {
        await document.fonts.ready;
        for (const [index, element] of diagrams.entries()) {
          try {
            if (!window.mermaid) throw new Error('Mermaid is not loaded. Add mermaid to the libs header.');
            const theme = diagramTheme(element.closest('.slide'));
            window.mermaid.initialize({
              startOnLoad: false, securityLevel: 'strict', theme: 'base', look: 'classic',
              layout: 'dagre', htmlLabels: element.hasAttribute('data-html-labels'), fontFamily: theme.fontFamily, fontSize: 32,
              themeVariables: theme, flowchart: { wrappingWidth: 320 },
            });
            const source = element.textContent.trim();
            const classes = /^flowchart/.test(window.mermaid.detectType(source))
              ? `\nclassDef highlight fill:${theme.primaryColor},stroke:${theme.accent},stroke-width:4px,color:${theme.primaryTextColor};\nclassDef muted fill:${theme.primaryColor},stroke:${theme.muted},color:${theme.muted};`
              : '';
            const { svg } = await window.mermaid.render(`slideware-diagram-${index}`, source + classes, host);
            element.innerHTML = svg;
            await Promise.all([...element.querySelectorAll('img')].map(img => img.decode()));
            element.dataset.diagramStatus = 'ready';
          } catch (error) {
            showDiagramError(element, error);
          } finally {
            host.replaceChildren();
          }
        }
      } catch (error) {
        diagrams.filter(element => element.dataset.diagramStatus === 'pending')
          .forEach(element => showDiagramError(element, error));
      } finally {
        host.remove();
        stage.dataset.diagrams = diagrams.some(element => element.dataset.diagramStatus === 'error') ? 'error' : 'ready';
      }
    };
    const ready = renderDiagrams();
    // The engine's P key and ?print route through window.print; beforeprint itself cannot await rendering.
    const print = window.print.bind(window);
    window.print = () => { ready.then(print); };
    ready.then(() => { window.print = print; });
  }

  // Hidden slides measure as zero. Re-measure a slide's charts and tables when it becomes current, and before printing.
  const refresh = root => {
    root.querySelectorAll('canvas[data-chart]').forEach(c => charts.get(c)?.resize());
    root.querySelectorAll('[data-tabulator]').forEach(el => tables.get(el)?.redraw(true));
  };
  new MutationObserver(records => {
    records.forEach(r => { if (r.target.classList.contains('current')) refresh(r.target); });
  }).observe(stage, { attributes: true, attributeFilter: ['class'], subtree: true });
  addEventListener('beforeprint', () => refresh(stage));
})();
