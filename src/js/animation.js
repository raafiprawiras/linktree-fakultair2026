/**
 * Staggered Entrance Animation for Fakultair FTI 2026
 */

export function initStaggerAnimation() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const cards = document.querySelectorAll('.link-card');

  cards.forEach((card, index) => {
    card.animate(
      [{ transform: 'translateY(10px)' }, { transform: 'translateY(0)' }],
      { duration: 250, delay: index * 25, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  });
}
