export function initGuidebook(dialog) {
  if (!dialog) return;
  const page = dialog.querySelector('#guidebook-page');
  const previous = dialog.querySelector('#guidebook-prev');
  const next = dialog.querySelector('#guidebook-next');
  const zoom = dialog.querySelector('#guidebook-zoom');
  const count = dialog.querySelector('#guidebook-count');
  const status = dialog.querySelector('#guidebook-status');
  const container = dialog.querySelector('#guidebook-preview');
  const url = dialog.querySelector('#guidebook-download').href;
  let session = null;
  let pageNumber = 1;
  let timer;

  function controls(ready = false) {
    const total = session?.document?.numPages || 0;
    page.disabled = zoom.disabled = !ready;
    previous.disabled = !ready || pageNumber <= 1;
    next.disabled = !ready || pageNumber >= total;
    page.value = pageNumber;
    page.max = total || 1;
    count.textContent = `/ ${total || '-'}`;
  }

  function message(text, busy = false) {
    status.textContent = text;
    container.setAttribute('aria-busy', String(busy));
  }

  function syncZoom() {
    const viewer = session.viewer;
    const value = viewer.currentScaleValue === 'auto' ? 'auto' : String(viewer.currentScale);
    const custom = zoom.querySelector('[data-custom]');
    custom.hidden = [...zoom.options].some(option => option !== custom && option.value === value);
    custom.value = value;
    custom.textContent = `${Math.round(viewer.currentScale * 100)}%`;
    zoom.value = value;
  }

  async function open() {
    if (session || !dialog.open) return;
    const current = session = {};
    controls();
    message('Memuat buku panduan...', true);
    try {
      // Load the core first: the official viewer reads globalThis.pdfjsLib.
      const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
      const [{ PDFViewer, EventBus, PDFLinkService }, { default: worker }] = await Promise.all([
        import('pdfjs-dist/web/pdf_viewer.mjs'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        import('pdfjs-dist/web/pdf_viewer.css'),
      ]);
      if (session !== current) return;
      pdfjs.GlobalWorkerOptions.workerSrc = worker;
      const eventBus = new EventBus();
      const linkService = new PDFLinkService({ eventBus, externalLinkTarget: 2, externalLinkRel: 'noopener noreferrer' });
      current.abort = new AbortController();
      const viewer = current.viewer = new PDFViewer({
        container, eventBus, linkService,
        abortSignal: current.abort.signal,
        removePageBorders: true,
        maxCanvasPixels: 4 * 1024 * 1024,
        maxCanvasDim: 4096,
        enableDetailCanvas: false,
        textLayerMode: 1,
        annotationMode: pdfjs.AnnotationMode.ENABLE,
      });
      linkService.setViewer(viewer);
      const active = () => session === current && dialog.open;
      eventBus.on('pagesinit', () => {
        if (!active()) return;
        current.ready = true;
        pageNumber = Math.min(pageNumber, current.document.numPages);
        viewer.currentPageNumber = pageNumber;
        controls(true);
        viewer.currentScaleValue = zoom.value;
        syncZoom();
      });
      eventBus.on('scalechanging', () => { if (active()) syncZoom(); });
      eventBus.on('pagechanging', ({ pageNumber: number }) => {
        if (!active()) return;
        pageNumber = number;
        controls(current.ready);
        message(`Halaman ${pageNumber} dari ${current.document.numPages}`);
      });
      eventBus.on('pagerendered', ({ source, error }) => {
        if (!active() || source !== viewer.getPageView(pageNumber - 1)) return;
        message(error
          ? 'Halaman gagal ditampilkan. Pilih halaman lain atau unduh buku panduan.'
          : `Halaman ${pageNumber} dari ${current.document.numPages}`);
      });
      for (const event of ['textlayerrendered', 'annotationlayerrendered']) {
        eventBus.on(event, ({ pageNumber: number, error }) => {
          if (active() && number === pageNumber && error) {
            message('Sebagian isi halaman gagal ditampilkan. Unduh untuk membaca dokumen lengkap.');
          }
        });
      }
      current.loading = pdfjs.getDocument({ url, isEvalSupported: false });
      current.document = await current.loading.promise;
      if (!active()) return;
      linkService.setDocument(current.document);
      viewer.setDocument(current.document);
      await viewer.pagesPromise;
    } catch (error) {
      if (session !== current) return;
      current.ready = false;
      controls();
      message('Buku panduan gagal dimuat. Unduh langsung atau tutup lalu buka kembali.');
      console.error('Guidebook:', error);
    }
  }

  function close() {
    const current = session;
    session = null;
    clearTimeout(timer);
    current?.abort?.abort();
    current?.viewer?.setDocument(null);
    current?.loading?.destroy().catch((error) => console.error('Guidebook cleanup:', error));
    controls();
    message('Memuat buku panduan...');
  }

  function navigate(number) {
    if (!session?.ready) return;
    if (Number.isInteger(number) && number >= 1 && number <= session.document.numPages) {
      session.viewer.currentPageNumber = number;
    }
    controls(true);
  }
  previous.addEventListener('click', () => navigate(pageNumber - 1));
  next.addEventListener('click', () => navigate(pageNumber + 1));
  page.addEventListener('change', () => navigate(Number(page.value)));
  zoom.addEventListener('change', () => {
    if (session?.ready) {
      session.viewer.currentScaleValue = zoom.value;
      syncZoom();
    }
  });
  container.addEventListener('wheel', event => {
    if (!event.ctrlKey || !dialog.open) return;
    event.preventDefault();
    if (!session?.ready || !Number.isFinite(event.deltaY)) return;
    const viewer = session.viewer;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientHeight : 1);
    const scale = Math.min(4, Math.max(0.25, viewer.currentScale * Math.exp(-delta / 100)));
    const bounds = container.getBoundingClientRect();
    const [top, left] = viewer.containerTopLeft;
    // PDF.js preserves the pointer anchor and debounces expensive canvas rendering.
    viewer.updateScale({ scaleFactor: scale / viewer.currentScale, origin: [event.clientX - bounds.left + left, event.clientY - bounds.top + top], drawingDelay: 120 });
    syncZoom();
  }, { passive: false });
  dialog.addEventListener('close', () => { if (!dialog.open) close(); });
  new MutationObserver(() => dialog.open ? open() : close()).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (session?.ready && dialog.open && session.viewer.currentScaleValue === 'auto') {
        session.viewer.currentScaleValue = 'auto';
      }
    }, 120);
  }).observe(container);
  if (dialog.open) open();
}

document.addEventListener('DOMContentLoaded', () => initGuidebook(document.getElementById('guidebook-dialog')));
