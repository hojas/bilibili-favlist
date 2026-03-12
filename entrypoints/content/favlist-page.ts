import type { Video } from '@/types';
import { addVideo, isVideoCollected } from '@/utils/storage';
import { normalizeUrl, sleep, waitForElement } from './utils';

export async function initFavlistBatchButton() {
  console.log('初始化批量收藏按钮...');
  
  const button = createBatchButton();
  document.body.appendChild(button);
  console.log('批量收藏按钮已添加到页面');
  
  await waitForElement(10000);
  positionButton(button);
  
  const observer = new MutationObserver(() => {
    positionButton(button);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function positionButton(button: HTMLElement) {
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: linear-gradient(135deg, #fb7299 0%, #ff8a9d 100%);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(251, 114, 153, 0.4);
    z-index: 2147483647;
  `;
}

function createBatchButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'bili-favlist-batch-btn';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="margin-right: 8px;">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
    <span id="batch-btn-text">批量收藏</span>
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px) scale(1.02)';
    button.style.boxShadow = '0 6px 20px rgba(251, 114, 153, 0.5)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0) scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(251, 114, 153, 0.4)';
  });
  
  button.addEventListener('click', handleBatchCollect);
  
  return button;
}

async function handleBatchCollect() {
  const button = document.getElementById('bili-favlist-batch-btn') as HTMLButtonElement;
  const btnText = document.getElementById('batch-btn-text');
  
  if (!button || !btnText) return;
  
  button.disabled = true;
  btnText.textContent = '收集中...';
  
  try {
    const videos = parseFavlistVideos();
    console.log('找到视频数量:', videos.length);
    
    if (videos.length === 0) {
      alert('未找到任何视频！请确保在 B 站收藏夹或视频列表页面。');
      return;
    }
    
    let collected = 0;
    let skipped = 0;
    
    for (const video of videos) {
      const exists = await isVideoCollected(video.id);
      if (!exists) {
        await addVideo(video);
        collected++;
      } else {
        skipped++;
      }
      
      btnText.textContent = `${collected}/${videos.length}`;
      await sleep(50);
    }
    
    alert(`批量收藏完成！\n成功收藏：${collected} 个\n已存在跳过：${skipped} 个`);
    
  } catch (error) {
    console.error('批量收藏失败:', error);
    alert('批量收藏失败，请刷新页面后重试！');
  } finally {
    button.disabled = false;
    btnText.textContent = '批量收藏';
  }
}

function parseFavlistVideos(): Video[] {
  const videos: Video[] = [];
  
  const containers = [
    document.querySelector('.fav-container'),
    document.querySelector('.video-list'),
    document.querySelector('.list-container'),
    document.querySelector('.small-item-list'),
    document.querySelector('.bili-video-list'),
    document.querySelector('[class*="fav-list"]'),
    document.querySelector('[class*="video-list"]'),
    document.querySelector('[class*="list-container"]'),
  ];
  
  let targetContainer: Element | null = null;
  for (const container of containers) {
    if (container && container.children.length > 0) {
      targetContainer = container;
      break;
    }
  }
  
  if (!targetContainer) {
    console.log('未找到收藏夹容器，使用 document.body');
    targetContainer = document.body;
  }
  
  console.log('使用的容器:', targetContainer.className || targetContainer.tagName);
  
  const items = targetContainer.querySelectorAll('.fav-video-item, .small-item, .video-item, .list-item, .bili-video-card, [class*="video-card"], [class*="video-item"]');
  
  console.log('找到视频项数量:', items.length);
  
  items.forEach((item, index) => {
    try {
      const link = item.querySelector('a[href*="/video/"]') as HTMLAnchorElement;
      if (!link) return;
      
      const url = link.href;
      const bvMatch = url.match(/BV\w+/);
      if (!bvMatch) return;
      
      const id = bvMatch[0];
      
      const titleSelectors = [
        '.title', '.video-title', '.name', 'h3', 'h4', 
        '[class*="title"]', '[class*="name"]'
      ];
      let title = '未知标题';
      for (const sel of titleSelectors) {
        const el = item.querySelector(sel);
        if (el && el.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }
      
      const authorSelectors = [
        '.up', '.author', '.username', '.up-name', '[class*="up"], [class*="author"], [class*="user"]'
      ];
      let author = '未知作者';
      for (const sel of authorSelectors) {
        const el = item.querySelector(sel);
        if (el && el.textContent?.trim()) {
          author = el.textContent.trim();
          break;
        }
      }
      
      let cover = '';
      const coverImg = item.querySelector('img') as HTMLImageElement;
      if (coverImg) {
        cover = coverImg.src || coverImg.getAttribute('src') || '';
        if (!cover) {
          cover = coverImg.getAttribute('data-src') || '';
        }
        if (!cover) {
          cover = coverImg.getAttribute('data-url') || '';
        }
      }
      
      videos.push({
        id,
        title,
        url: normalizeUrl(url),
        cover: normalizeUrl(cover),
        author,
        createdAt: Date.now(),
      });
    } catch (e) {
      console.error('解析视频项失败:', index, e);
    }
  });
  
  console.log('成功解析视频数量:', videos.length);
  return videos;
}
