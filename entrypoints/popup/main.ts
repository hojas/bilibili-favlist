import './style.css';
import type { Video } from '@/types';
import { getVideos, removeVideo, addVideo, isVideoCollected } from '@/utils/storage';

async function renderVideos() {
  const videos = await getVideos();
  const container = document.getElementById('videos-container')!;
  const countEl = document.getElementById('count')!;
  const emptyState = document.getElementById('empty-state')!;

  countEl.textContent = `${videos.length} 个视频`;

  if (videos.length === 0) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  container.classList.remove('hidden');
  emptyState.classList.add('hidden');
  container.innerHTML = videos.map(video => createVideoCard(video)).join('');

  container.querySelectorAll('.delete-btn').forEach((btn, index) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeVideo(videos[index].id);
      renderVideos();
    });
  });
}

function createVideoCard(video: Video): string {
  return `
    <div class="video-card">
      <a href="${video.url}" target="_blank" class="video-link">
        <img src="${video.cover}" alt="${video.title}" class="video-cover" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2268%22 viewBox=%220 0 120 68%22><rect fill=%22%23e3e5e7%22 width=%22120%22 height=%2268%22/></svg>'">
        <div class="video-info">
          <div class="video-title">${escapeHtml(video.title)}</div>
          <div class="video-meta">
            <span class="video-author">${escapeHtml(video.author)}</span>
          </div>
        </div>
      </a>
      <button class="delete-btn" title="删除">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function collectCurrentPage() {
  const btn = document.getElementById('collect-current-btn') as HTMLButtonElement;
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url?.includes('bilibili.com/video/')) {
      alert('请先打开一个 Bilibili 视频页面！');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });
    const video = response?.video;

    if (!video) {
      alert('未能获取视频信息，请刷新页面后重试！');
      return;
    }

    const collected = await isVideoCollected(video.id);
    if (collected) {
      alert('该视频已经收藏过了！');
      return;
    }

    await addVideo(video);
    alert('收藏成功！');
    renderVideos();
  } catch (error) {
    console.error('收藏失败:', error);
    alert('收藏失败，请确保在 Bilibili 视频页面上！');
  } finally {
    btn.disabled = false;
  }
}

document.getElementById('collect-current-btn')?.addEventListener('click', collectCurrentPage);
renderVideos();

