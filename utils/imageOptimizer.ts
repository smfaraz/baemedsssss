import type React from 'react';

/**
 * Utility to ensure all product images load in crystal-clear high-definition (HD)
 * Transforms tiny McKesson thumbnails (/Item_Detail/) into full-resolution studio shots (/Item_Zoom/)
 * and Cloudfront thumbnails (_t.png) into large assets (_l.png).
 */
export function getHighResImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  return url
    .replace(/\/Item_Detail\//g, '/Item_Zoom/')
    .replace(/_01_t\.png/g, '_01_l.png')
    .replace(/_02_t\.png/g, '_02_l.png')
    .replace(/_03_t\.png/g, '_03_l.png');
}

/**
 * Image error handler that gracefully falls back to the original thumbnail
 * if an Item_Zoom asset fails to load, guaranteeing zero broken images.
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  onFatalFailure?: () => void
): void {
  const target = event.currentTarget;
  if (target.src.includes('Item_Zoom')) {
    target.src = target.src.replace('Item_Zoom', 'Item_Detail');
  } else if (target.src.includes('_01_l.png')) {
    target.src = target.src.replace('_01_l.png', '_01_t.png');
  } else if (onFatalFailure) {
    onFatalFailure();
  }
}
