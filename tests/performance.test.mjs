import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { initStaggerAnimation } from '../src/js/animation.js';

const root = new URL('../', import.meta.url);
for (const name of ['logo/Logo-Nobg', 'background/BG-Mobile', 'background/BG-Desktop']) {
  assert.ok(statSync(new URL(`public/assets/${name}.webp`, root)).size < statSync(new URL(`public/assets/${name}.png`, root)).size);
}
assert.ok(statSync(new URL('public/assets/favicon/icon-32.png', root)).size < 10000);
const html = readFileSync(new URL('index.html', root), 'utf8');
assert.match(html, /src="\/assets\/logo\/Logo-Nobg.webp"/);
const css = readFileSync(new URL('src/css/style.css', root), 'utf8');
assert.doesNotMatch(css, /BG-Desktop\.webp"\), url/);

let animations = 0;
globalThis.window = { matchMedia: () => ({ matches: false }) };
globalThis.document = {
  querySelectorAll: () => Array.from({ length: 6 }, () => ({
    animate(frames, options) {
      assert.ok(frames.every((frame) => !('opacity' in frame)));
      assert.ok(options.duration + options.delay <= 400);
      animations++;
    },
  })),
};
initStaggerAnimation();
assert.equal(animations, 6);
window.matchMedia = () => ({ matches: true });
initStaggerAnimation();
assert.equal(animations, 6, 'Reduced motion skips animation');
console.log('Performance checks passed');
