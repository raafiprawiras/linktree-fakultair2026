import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const elements = Object.fromEntries(['page', 'prev', 'next', 'zoom', 'count', 'status', 'preview', 'download'].map(id => [
  `#guidebook-${id}`, { value: '1', href: '/guide.pdf', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }, setAttribute() {} },
]));
const dialog = { open: false, querySelector: id => elements[id], addEventListener() {} };
let observe;
let imports = 0;
const source = readFileSync(new URL('../src/js/guidebook.js', import.meta.url), 'utf8');
runInNewContext(source.replace('export function', 'function').replace(/import\([^)]*\)/g, 'load()'), {
  document: { addEventListener: (_, fn) => fn(), getElementById: () => dialog },
  MutationObserver: class { constructor(fn) { observe = fn; } observe() {} },
  ResizeObserver: class { observe() {} },
  load: async () => { imports++; throw new Error('offline'); },
  clearTimeout, setTimeout, console: { error() {} },
});
assert.equal(imports, 0, 'PDF dependencies stay lazy');
dialog.open = true;
observe();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(imports, 1);
assert.match(elements['#guidebook-status'].textContent, /gagal dimuat/);
for (const id of ['page', 'prev', 'next', 'zoom']) assert.equal(elements[`#guidebook-${id}`].disabled, true);
assert.equal(elements['#guidebook-download'].href, '/guide.pdf', 'Download survives failure');
dialog.open = false;
observe();
dialog.open = true;
observe();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(imports, 2, 'Reopen retries failed initialization');
console.log('Guidebook lazy loading, failure controls, download and retry checks passed');

let viewer;
let resize;
let destroyed = 0;
const options = ['auto', '0.5', '0.75', '1', '1.25', '1.5', '2'].map(value => ({ value }));
const custom = { value: 'custom', hidden: true };
options.push(custom);
Object.assign(elements['#guidebook-zoom'], { value: 'auto', options, querySelector: () => custom });
const events = {};
class PDFViewer {
  constructor(config) { viewer = this; this.config = config; this.currentScale = 1; }
  set currentScaleValue(value) {
    this.scaleValue = String(value);
    this.currentScale = value === 'auto' ? 1.25 : Number(value);
    events.scalechanging?.({});
  }
  get currentScaleValue() { return this.scaleValue; }
  set currentPageNumber(number) { events.pagechanging({ pageNumber: number }); }
  setDocument(doc) { if (doc) events.pagesinit(); else destroyed++; }
  refresh() {}
  updateScale(options) {
    this.update = options;
    this.currentScaleValue = Math.round(this.currentScale * options.scaleFactor * 100) / 100;
  }
}
dialog.open = false;
runInNewContext(source.replace('export function', 'function').replace(/import\([^)]*\)/g, 'load()'), {
  document: { addEventListener: (_, fn) => fn(), getElementById: () => dialog },
  MutationObserver: class { constructor(fn) { observe = fn; } observe() {} },
  ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} },
  load: async () => ({
    PDFViewer, EventBus: class { on(name, fn) { events[name] = fn; } },
    PDFLinkService: class { setViewer() {} setDocument() {} },
    GlobalWorkerOptions: {}, AnnotationMode: { ENABLE: 1 },
    getDocument: () => ({ promise: Promise.resolve({ numPages: 14 }), destroy: async () => {} }),
  }),
  AbortController, clearTimeout, setTimeout, console,
});
dialog.open = true;
observe();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(viewer.currentScaleValue, 'auto');
assert.equal(viewer.currentScale, 1.25);
assert.equal(viewer.config.maxCanvasPixels, 4 * 1024 * 1024);
for (const scale of ['0.5', '0.75']) {
  elements['#guidebook-zoom'].value = scale;
  elements['#guidebook-zoom'].listeners.change();
  assert.equal(viewer.currentScale, Number(scale));
  resize();
  await new Promise(resolve => setTimeout(resolve, 140));
  assert.equal(viewer.currentScale, Number(scale), 'Resize preserves manual scale');
}
events.pagechanging({ pageNumber: 2 });
assert.equal(elements['#guidebook-page'].value, 2);
assert.equal(viewer.currentScale, 0.75, 'Scrolling never refits or resets pages');
let prevented = 0;
const wheel = { ctrlKey: false, deltaY: -10, deltaMode: 0, clientX: 100, clientY: 200, preventDefault() { prevented++; } };
elements['#guidebook-preview'].listeners.wheel(wheel);
assert.equal(prevented, 0, 'Ordinary scrolling stays native');
wheel.ctrlKey = true;
elements['#guidebook-preview'].listeners.wheel(wheel);
assert.equal(prevented, 1);
assert.ok(viewer.currentScale > 0.75);
assert.equal(viewer.update.drawingDelay, 120);
assert.deepEqual(Array.from(viewer.update.origin), [100, 200]);
assert.equal(custom.hidden, false);
assert.equal(elements['#guidebook-zoom'].value, String(viewer.currentScale));
for (const [deltaY, scale] of [[-100000, 4], [100000, 0.25]]) {
  elements['#guidebook-preview'].listeners.wheel({ ...wheel, deltaY });
  assert.equal(viewer.currentScale, scale);
}
dialog.open = false;
observe();
assert.equal(viewer.config.abortSignal.aborted, true);
assert.equal(destroyed, 1);
console.log('Continuous page events, absolute scales, pinch bounds/anchor/debounce, resize and cleanup passed');
