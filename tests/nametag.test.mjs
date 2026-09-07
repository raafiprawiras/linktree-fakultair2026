import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const modals = ['nametag', 'pin'].map((id) => {
  const listeners = {};
  const dialog = {
  open: false,
  showModal() { this.open = true; },
  close() { this.open = false; },
  addEventListener(type, handler) { listeners[type] = handler; },
  getBoundingClientRect() { return { left: 20, right: 300, top: 20, bottom: 400 }; },
};
  const trigger = {
    getAttribute() { return `${id}-dialog`; },
    addEventListener(type, handler) { listeners.trigger = handler; },
  };
  return { id, listeners, dialog, trigger };
});
const source = readFileSync(new URL('../src/js/main.js', import.meta.url), 'utf8');
runInNewContext(source.replace(/^import .*;$/gm, ''), {
  document: {
    addEventListener(type, handler) { handler(); },
    getElementById(id) { return modals.find((modal) => `${modal.id}-dialog` === id).dialog; },
    querySelectorAll(selector) {
      return selector === '[aria-haspopup="dialog"]' ? modals.map((modal) => modal.trigger) : [];
    },
  },
  initStaggerAnimation() {},
  initImageFallbacks() {},
  console: { log() {} },
});

for (const { listeners, dialog } of modals) {
modals.forEach((modal) => modal.dialog.close());
listeners.trigger();
assert.equal(dialog.open, true, 'CTA opens modal');
assert.equal(modals.filter((modal) => modal.dialog.open).length, 1, 'Only the selected modal opens');
listeners.click({ target: dialog, clientX: 100, clientY: 100 });
assert.equal(dialog.open, true, 'Click inside modal keeps it open');
listeners.click({ target: {}, clientX: 0, clientY: 0 });
assert.equal(dialog.open, true, 'Child clicks do not dismiss modal');
listeners.click({ target: dialog, clientX: 10, clientY: 100 });
assert.equal(dialog.open, false, 'Backdrop click closes modal');
listeners.trigger();
assert.equal(dialog.open, true, 'Modal can reopen');
}

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const { id } of modals) {
const html = page.match(new RegExp(`<dialog id="${id}-dialog"[\\s\\S]*?</dialog>`))?.[0];
assert.ok(html, `${id} dialog exists`);
assert.ok(page.includes(`aria-controls="${id}-dialog"`));
assert.equal((html.match(/class="nametag-option"/g) || []).length, 3);
for (const name of ['Teknik Elektro', 'Teknik Industri', 'Teknik Informatika']) {
  assert.ok(html.includes(name));
}
for (const option of html.matchAll(/<a class="nametag-option"([^>]*)>/g)) {
  assert.match(option[1], /target="_blank"/);
  assert.match(option[1], /rel="noopener noreferrer"/);
  assert.doesNotMatch(option[1], /aria-disabled/);
  assert.match(option[1], /href="https:\/\/drive\.google\.com\/file\/d\/[^"/]+\/view\?usp=sharing"/);
}
assert.match(html, /<form method="dialog">/);
}
console.log('Nametag and Pin checks passed');
