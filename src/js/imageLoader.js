/**
 * Progressive Image Loader & Fallback System for Fakultair FTI 2026
 * Supports AVIF, WEBP, PNG, JPG, JPEG, SVG, ICO, GIF, BMP
 */

export const SUPPORTED_FORMATS = ['avif', 'webp', 'png', 'jpg', 'jpeg', 'svg'];

/**
 * Creates a responsive <picture> element with multi-format fallback sources.
 * @param {Object} options
 * @param {string} options.basePath - Path without extension e.g. "/assets/logo/fakultair-logo"
 * @param {string} options.alt - Alt text for image
 * @param {string} options.className - CSS class for <img> tag
 * @param {number} options.width - Intrinsic width
 * @param {number} options.height - Intrinsic height
 * @param {string} [options.loading="lazy"] - "lazy" or "eager"
 * @param {string} [options.fallbackExt="png"] - Fallback extension
 * @returns {HTMLPictureElement}
 */
export function createResponsivePicture({
  basePath,
  alt,
  className = '',
  width = 96,
  height = 96,
  loading = 'lazy',
  fallbackExt = 'png'
}) {
  const picture = document.createElement('picture');

  const mimeMap = {
    avif: 'image/avif',
    webp: 'image/webp',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml'
  };

  // Add source elements in priority order: AVIF -> WEBP -> PNG/JPG
  ['avif', 'webp', 'png', 'jpg'].forEach(ext => {
    const source = document.createElement('source');
    source.srcset = `${basePath}.${ext}`;
    source.type = mimeMap[ext];
    picture.appendChild(source);
  });

  // Fallback img element
  const img = document.createElement('img');
  img.src = `${basePath}.${fallbackExt}`;
  img.alt = alt;
  img.className = className;
  img.width = width;
  img.height = height;
  img.loading = loading;
  img.decoding = 'async';

  // Attach error handler fallback
  img.onerror = () => handleImageFallback(img, basePath);

  picture.appendChild(img);
  return picture;
}

/**
 * Handles image loading errors by trying alternative file extensions in sequence.
 * @param {HTMLImageElement} img
 * @param {string} basePath
 */
export function handleImageFallback(img, basePath) {
  const currentSrc = img.src;
  const currentExt = currentSrc.split('.').pop().toLowerCase();
  
  const nextExtMap = {
    avif: 'webp',
    webp: 'png',
    png: 'jpg',
    jpg: 'jpeg',
    jpeg: 'svg',
    svg: null
  };

  const nextExt = nextExtMap[currentExt];
  if (nextExt) {
    console.warn(`[ImageLoader] Failed to load ${currentExt}, falling back to ${nextExt}`);
    img.onerror = () => handleImageFallback(img, basePath); // Recursively try next
    img.src = `${basePath}.${nextExt}`;
  } else {
    console.error(`[ImageLoader] All image format fallbacks failed for ${basePath}`);
  }
}

/**
 * Initializes automatic image error fallback handlers for all <img> elements on the page.
 */
export function initImageFallbacks() {
  document.querySelectorAll('img[data-fallback-base]').forEach(img => {
    const basePath = img.getAttribute('data-fallback-base');
    img.addEventListener('error', () => handleImageFallback(img, basePath));
  });
}
