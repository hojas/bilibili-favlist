import type { Video } from '@/types';
import { addVideo, removeVideo, isVideoCollected } from '@/utils/storage';

export default defineContentScript({
  matches: ['*://*.bilibili.com/video/*'],
  main() {
    initFavButton();
    initMessageListener();
  },
});

function getVideoInfo(): Video | null {
  const url = window.location.href;
  const bvMatch = url.match(/BV\w+/);
  if (!bvMatch) return null;

  const id = bvMatch[0];
  const title = document.querySelector('h1.video-title')?.textContent?.trim() || '未知标题';
  const cover = document.querySelector('.bili-video-card__pic img, .video-cover img')?.getAttribute('src') || '';
  const author = document.querySelector('.up-name__text, .user-name')?.textContent?.trim() || '未知作者';

  return {
    id,
    title,
    url,
    cover: cover.startsWith('//') ? 'https:' + cover : cover,
    author,
    createdAt: Date.now(),
  };
}

async function initFavButton() {
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

function initMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoInfo') {
      const video = getVideoInfo();
      sendResponse({ video });
    }
  });
}

