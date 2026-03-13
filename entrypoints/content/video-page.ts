import type { Video } from '@/types';
import { addVideo, removeVideo, isVideoCollected } from '@/utils/storage';
import { normalizeUrl } from './utils';

export function getVideoInfo(): Video | null {
  try {
    const videoUrl = window.location.href;
    const bvMatch = videoUrl.match(/BV\w+/);
    if (!bvMatch) return null;

    const id = bvMatch[0];
    const title = document.querySelector('h1.video-title, h1.title')?.textContent?.trim() || '未知标题';
    const author = document.querySelector('.up-name__text, .user-name, .up-name')?.textContent?.trim() || '未知作者';
    
    let cover = '';
    const coverMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    if (coverMeta) {
      cover = coverMeta.content;
    }
    
    if (!cover && id) {
      cover = `https://api.i0.hdslb.com/bfs/archive/${id}.jpg`;
    }

    return {
      id,
      title,
      url: videoUrl,
      cover: normalizeUrl(cover),
      author,
      createdAt: Date.now(),
    };
  } catch (e) {
    console.error('获取视频信息失败:', e);
    return null;
  }
}

export async function initFavButton() {
  console.log('开始初始化收藏按钮...');
  
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    try {
      const video = getVideoInfo();
      const toolbar = document.querySelector('.toolbar-right, .ops');
      
      if (video && toolbar) {
        console.log('找到视频信息和工具栏');
        
        const isCollected = await isVideoCollected(video.id);
        
        const button = document.createElement('button');
        button.textContent = isCollected ? '已收藏' : '收藏';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.padding = '8px 16px';
        button.style.marginRight = '12px';
        button.style.background = isCollected ? '#fb7299' : '#f1f2f3';
        button.style.color = isCollected ? '#fff' : '#18191c';
        button.style.border = 'none';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        
        button.addEventListener('click', async () => {
          try {
            const currentCollected = await isVideoCollected(video.id);
            if (currentCollected) {
              await removeVideo(video.id);
              button.textContent = '收藏';
              button.style.background = '#f1f2f3';
              button.style.color = '#18191c';
            } else {
              await addVideo(video);
              button.textContent = '已收藏';
              button.style.background = '#fb7299';
              button.style.color = '#fff';
            }
          } catch (e) {
            console.error('收藏操作失败:', e);
          }
        });
        
        toolbar.prepend(button);
        return;
      }
    } catch (e) {
      console.error('初始化收藏按钮出错:', e);
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('初始化收藏按钮失败，超时');
}
