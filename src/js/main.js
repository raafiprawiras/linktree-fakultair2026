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

  // Attach click listeners to link cards for tracking
  const linkCards = document.querySelectorAll('.link-card, .social-button');
  linkCards.forEach((card) => {
    card.addEventListener('click', () => {
      const title = card.querySelector('.link-title')?.textContent || card.getAttribute('aria-label') || 'Link';
      const url = card.getAttribute('href');
      trackLinkClick(title, url);
    });
  });

  console.log('⚡ Fakultair FTI 2026 — Multi-format Image Loader Ready');
});
