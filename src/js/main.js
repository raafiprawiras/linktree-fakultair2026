/**
 * Main Entry Point for Fakultair FTI 2026 Linktree
 */

import '../css/style.css';
import { initStaggerAnimation } from './animation.js';
import { initImageFallbacks } from './imageLoader.js';
import { trackLinkClick } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  initStaggerAnimation();
  initImageFallbacks();

  document.querySelectorAll('[aria-haspopup="dialog"]').forEach((trigger) => {
    const dialog = document.getElementById(trigger.getAttribute('aria-controls'));
    trigger.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
        dialog.close();
      }
    });
  });

  // Attach click listeners to link cards for tracking
  const linkCards = document.querySelectorAll('.link-card');
  linkCards.forEach((card) => {
    card.addEventListener('click', () => {
      const title = card.querySelector('.link-title')?.textContent || card.getAttribute('aria-label') || 'Link';
      const url = card.getAttribute('href');
      trackLinkClick(title, url);
    });
  });

  console.log('⚡ Fakultair FTI 2026 — Multi-format Image Loader Ready');
});
