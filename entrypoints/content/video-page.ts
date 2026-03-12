import type { Video } from '@/types';
import { addVideo, removeVideo, isVideoCollected } from '@/utils/storage';
import { normalizeUrl } from './utils';

export function getVideoInfo(): Video | null {
  const url = window.location.href;
  const bvMatch = url.match(/BV\w+/);
  if (!bvMatch) return null;

  const id = bvMatch[0];
  const title = document.querySelector('h1.video-title, h1.title')?.textContent?.trim() || '未知标题';
  
  let cover = '';
  
  const coverSelectors = [
    '.bpx-player-video-wrap video',
    '.video-cover img',
    '.bili-video-card__pic img',
    'meta[property="og:image"]',
    'link[rel="image_src"]'
  ];
  
  for (const selector of coverSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      if (el.tagName === 'VIDEO') {
        cover = (el as HTMLVideoElement).poster;
      } else if (el.tagName === 'META') {
        cover = (el as HTMLMetaElement).content;
      } else if (el.tagName === 'LINK') {
        cover = (el as HTMLLinkElement).href;
      } else {
        cover = (el as HTMLImageElement).src || (el as HTMLImageElement).getAttribute('src') || '';
      }
      if (cover) break;
    }
  }
  
  if (!cover && id) {
    cover = `https://api.i0.hdslb.com/bfs/archive/${id}.jpg`;
  }
  
  const author = document.querySelector('.up-name__text, .user-name, .up-name')?.textContent?.trim() || '未知作者';

  return {
    id,
    title,
    url,
    cover: normalizeUrl(cover),
    author,
    createdAt: Date.now(),
  };
}

export async function initFavButton() {
  const video = getVideoInfo();
  if (!video) return;

  const toolbar = document.querySelector('.toolbar-right, .ops');
  if (!toolbar) return;

  const isCollected = await isVideoCollected(video.id);
  const button = createFavButton(isCollected);

  button.addEventListener('click', async () => {
    const currentCollected = await isVideoCollected(video.id);
    if (currentCollected) {
      await removeVideo(video.id);
      updateButtonState(button, false);
    } else {
      await addVideo(video);
      updateButtonState(button, true);
    }
  });

  toolbar.prepend(button);
}

function createFavButton(isCollected: boolean): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'bili-favlist-btn';
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    margin-right: 12px;
    background: ${isCollected ? '#fb7299' : '#f1f2f3'};
    color: ${isCollected ? '#fff' : '#18191c'};
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  `;
  updateButtonState(button, isCollected);
  return button;
}

function updateButtonState(button: HTMLButtonElement, isCollected: boolean) {
  button.style.background = isCollected ? '#fb7299' : '#f1f2f3';
  button.style.color = isCollected ? '#fff' : '#18191c';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
    ${isCollected ? '已收藏' : '收藏'}
  `;
  button.addEventListener('mouseenter', () => {
    button.style.opacity = '0.8';
  });
  button.addEventListener('mouseleave', () => {
    button.style.opacity = '1';
  });
}
