import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const filename = 'BUKU PANDUAN FAKULTAIR FTI 2026-compressed.pdf';
const directory = new URL('../public/assets/guidebook/', import.meta.url);
assert.deepEqual(readdirSync(directory).filter(name => /\.pdf$/i.test(name)), [filename]);
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const href = html.match(/id="guidebook-download" href="([^"]+)"/)[1];
assert.equal(decodeURIComponent(href), `/assets/guidebook/${filename}`);
const data = new Uint8Array(readFileSync(new URL(filename, directory)));
assert.ok(data.length < 5_000_000, 'Keep the compressed guidebook below 5 MB');
const task = getDocument({ data, isEvalSupported: false });
const pdf = await task.promise;
try {
  assert.equal(pdf.numPages, 14);
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 1 });
    assert.ok(Math.abs(viewport.width - 419.25) < 0.001);
    assert.ok(Math.abs(viewport.height - 595.5) < 0.001);
    assert.ok((await page.getOperatorList()).fnArray.length > 0);
    await page.getTextContent();
    page.cleanup();
  }
} finally {
  await task.destroy();
}
console.log('Compressed-only URL, size, 14 page dimensions and PDF.js decoding passed');
