import type { Video } from '@/types'
import { addVideo, isVideoCollected, removeVideo } from '@/utils/storage'
import { normalizeUrl, showToast } from './utils'

const BV_REGEX = /BV\w+/
const BUTTON_ID = 'bili-local-fav-btn'

export function getVideoInfo(): Video | null {
  try {
    const videoUrl = window.location.href
    const bvMatch = videoUrl.match(BV_REGEX)
    if (!bvMatch)
      return null

    const id = bvMatch[0]
    const title = document.querySelector('h1.video-title, h1.title, .video-title')?.textContent?.trim() || '未知标题'
    const author = document.querySelector('.up-name__text, .user-name, .up-name, .username')?.textContent?.trim() || '未知作者'

    let cover = ''
    const coverMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement
    if (coverMeta) {
      cover = coverMeta.content
    }

    if (!cover && id) {
      cover = `https://api.i0.hdslb.com/bfs/archive/${id}.jpg`
    }

    return {
      id,
      title,
      url: videoUrl,
      cover: normalizeUrl(cover),
      author,
      createdAt: Date.now(),
    }
  }
  catch (e) {
    console.error('获取视频信息失败:', e)
    return null
  }
}

async function updateButtonState(button: HTMLButtonElement, videoId: string, video: Video) {
  const isCollected = await isVideoCollected(videoId)

  if (isCollected) {
    button.classList.add('collected')
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `
    button.title = '已收藏，点击取消'
  }
  else {
    button.classList.remove('collected')
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
      </svg>
    `
    button.title = '收藏视频'
  }

  button.onclick = async () => {
    try {
      button.disabled = true
      const currentCollected = await isVideoCollected(videoId)

      if (currentCollected) {
        await removeVideo(videoId)
        showToast('已取消收藏')
        updateButtonState(button, videoId, video)
      }
      else {
        await addVideo(video)
        showToast('收藏成功！')
        updateButtonState(button, videoId, video)
      }
    }
    catch (e) {
      console.error('收藏操作失败:', e)
      showToast('操作失败，请重试')
    }
    finally {
      button.disabled = false
    }
  }
}

function createButton(video: Video): HTMLButtonElement {
  const button = document.createElement('button')
  button.id = BUTTON_ID
  button.className = 'bili-local-fav-btn'

  updateButtonState(button, video.id, video)

  return button
}

function injectStyles() {
  if (document.getElementById('bili-local-fav-btn-styles'))
    return

  const style = document.createElement('style')
  style.id = 'bili-local-fav-btn-styles'
  style.textContent = `
    .bili-local-fav-btn {
      position: fixed;
      right: 24px;
      bottom: 80px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #fff;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9499a0;
      transition: all 0.2s ease;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .bili-local-fav-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .bili-local-fav-btn:active {
      transform: scale(1.05);
    }
    
    .bili-local-fav-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .bili-local-fav-btn.collected {
      background: linear-gradient(135deg, #fb7299 0%, #ff8a9d 100%);
      color: white;
    }
    
    .bili-local-fav-btn.collected:hover {
      box-shadow: 0 6px 16px rgba(251, 114, 153, 0.4);
    }
    
    .bili-local-fav-btn svg {
      flex-shrink: 0;
    }
  `
  document.head.appendChild(style)
}

export async function initFavButton() {
  console.log('开始初始化收藏按钮...')

  injectStyles()

  let attempts = 0
  const maxAttempts = 50

  while (attempts < maxAttempts) {
    const existingBtn = document.getElementById(BUTTON_ID)
    if (existingBtn) {
      return
    }

    const video = getVideoInfo()

    if (video) {
      console.log('找到视频信息，创建收藏按钮')

      const button = createButton(video)
      document.body.appendChild(button)
      return
    }

    attempts++
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('初始化收藏按钮失败，超时')
}

export async function reinitFavButton() {
  const existingBtn = document.getElementById(BUTTON_ID)
  if (existingBtn) {
    existingBtn.remove()
  }
  await initFavButton()
}
