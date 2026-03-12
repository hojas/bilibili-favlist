import type { Video } from '@/types';

export function normalizeUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  if (url.startsWith('/')) {
    return 'https://www.bilibili.com' + url;
  }
  if (!url.startsWith('http')) {
    return 'https://' + url;
  }
  return url;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function waitForElement(timeout: number = 5000): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const el = document.querySelector('.fav-container, .video-list, .small-item-list, .list-item, [class*="video"], [class*="item"]');
      if (el) {
        resolve();
      } else {
        setTimeout(check, 200);
      }
    };
    check();
    setTimeout(resolve, timeout);
  });
}

export function getCurrentPageType(): 'video' | 'favlist' | 'unknown' {
  const url = window.location.href;
  if (url.includes('/video/')) {
    return 'video';
  }
  if (url.includes('/favlist') || url.includes('/medialist/play/')) {
    return 'favlist';
  }
  return 'unknown';
}
