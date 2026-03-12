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
  btnText.textContent = '准备中...';
  
  try {
    let totalCollected = 0;
    let totalSkipped = 0;
    let pageCount = 0;
    const maxPageAttempts = 100;
    const seenIds = new Set<string>();
    
    console.log('开始批量收藏，先等待页面稳定...');
    await sleep(2000);
    
    while (pageCount < maxPageAttempts) {
      pageCount++;
      btnText.textContent = `第${pageCount}页...`;
      console.log(`正在处理第 ${pageCount} 页...`);
      
      await sleep(1500);
      
      const pageVideos = parseCurrentPageVideos();
      console.log(`第 ${pageCount} 页找到 ${pageVideos.length} 个视频`);
      
      if (pageVideos.length === 0 && pageCount === 1) {
        alert('未找到任何视频！请确保在 B 站收藏夹或视频列表页面。');
        break;
      }
      
      let pageCollected = 0;
      let pageSkipped = 0;
      
      for (const video of pageVideos) {
        if (seenIds.has(video.id)) {
          continue;
        }
        seenIds.add(video.id);
        
        const exists = await isVideoCollected(video.id);
        if (!exists) {
          await addVideo(video);
          pageCollected++;
          totalCollected++;
        } else {
          pageSkipped++;
          totalSkipped++;
        }
        
        btnText.textContent = `${totalCollected}/${totalCollected + totalSkipped}`;
        await sleep(30);
      }
      
      console.log(`第 ${pageCount} 页完成：收藏 ${pageCollected}，跳过 ${pageSkipped}`);
      
      const hasNextPage = await goToNextPage();
      if (!hasNextPage) {
        console.log('没有更多页面了');
        break;
      }
      
      await sleep(1500);
    }
    
    alert(`批量收藏完成！\n共处理 ${pageCount} 页\n成功收藏：${totalCollected} 个\n已存在跳过：${totalSkipped} 个`);
    
  } catch (error) {
    console.error('批量收藏失败:', error);
    alert('批量收藏失败，请刷新页面后重试！');
  } finally {
    button.disabled = false;
    btnText.textContent = '批量收藏';
  }
}

function parseCurrentPageVideos(): Video[] {
  const videos: Video[] = [];
  const items = document.querySelectorAll('.fav-video-item, .small-item, .video-item, .list-item, .bili-video-card, [class*="video-card"], [class*="video-item"]');
  
  console.log('当前页找到视频项数量:', items.length);
  
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
  
  return videos;
}

function getVideoItemCount(): number {
  const items = document.querySelectorAll('.fav-video-item, .small-item, .video-item, .list-item, .bili-video-card, [class*="video-card"], [class*="video-item"]');
  return items.length;
}

async function goToNextPage(): Promise<boolean> {
  const nextPageSelectors = [
    '.next-page-btn',
    '.next-btn',
    '.pagination-next',
    '.page-next',
    '[class*="next-page"]',
    '[class*="next-btn"]',
  ];
  
  let nextButton: HTMLElement | null = null;
  
  for (const selector of nextPageSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetParent !== null && !htmlEl.hasAttribute('disabled') && !htmlEl.classList.contains('disabled')) {
        nextButton = htmlEl;
        break;
      }
    }
    if (nextButton) break;
  }
  
  if (!nextButton) {
    const allButtons = document.querySelectorAll('button, a');
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      const htmlBtn = btn as HTMLElement;
      if ((text.includes('下一页') || text.includes('next') || text.includes('→')) && 
          htmlBtn.offsetParent !== null && 
          !htmlBtn.hasAttribute('disabled') && 
          !htmlBtn.classList.contains('disabled')) {
        nextButton = htmlBtn;
        break;
      }
    }
  }
  
  if (nextButton) {
    const currentHtml = document.body.innerHTML.substring(0, 1000);
    nextButton.click();
    console.log('点击了下一页按钮');
    
    let attempts = 0;
    const maxAttempts = 50;
    while (attempts < maxAttempts) {
      await sleep(200);
      const newHtml = document.body.innerHTML.substring(0, 1000);
      if (newHtml !== currentHtml) {
        console.log('检测到页面内容变化');
        break;
      }
      attempts++;
    }
    
    return true;
  }
  
  console.log('未找到下一页按钮');
  return false;
}

function parseFavlistVideos(): Video[] {
  const videos: Video[] = [];
  const seenIds = new Set<string>();
  
  const items = document.querySelectorAll('.fav-video-item, .small-item, .video-item, .list-item, .bili-video-card, [class*="video-card"], [class*="video-item"]');
  
  console.log('找到视频项数量:', items.length);
  
  items.forEach((item, index) => {
    try {
      const link = item.querySelector('a[href*="/video/"]') as HTMLAnchorElement;
      if (!link) return;
      
      const url = link.href;
      const bvMatch = url.match(/BV\w+/);
      if (!bvMatch) return;
      
      const id = bvMatch[0];
      
      if (seenIds.has(id)) {
        return;
      }
      
      seenIds.add(id);
      
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
