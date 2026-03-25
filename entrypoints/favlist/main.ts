import type { Video } from '@/types'
import { clearAllVideos, getVideos, removeVideo } from '@/utils/storage'
import './style.css'

let allVideos: Video[] = []
let currentKeyword = ''

function showModal(message: string, buttons: Array<{ text: string, primary?: boolean, onClose?: () => void }>): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay')!
    const content = document.getElementById('modal-content')!
    const buttonsContainer = document.getElementById('modal-buttons')!

    content.textContent = message
    buttonsContainer.innerHTML = ''

    buttons.forEach((btn) => {
      const button = document.createElement('button')
      button.className = `modal-btn ${btn.primary ? 'modal-btn-primary' : 'modal-btn-secondary'}`
      button.textContent = btn.text
      button.addEventListener('click', () => {
        overlay.classList.add('hidden')
        btn.onClose?.()
        resolve()
      })
      buttonsContainer.appendChild(button)
    })

    overlay.classList.remove('hidden')
  })
}

function showAlert(message: string): Promise<void> {
  return showModal(message, [{ text: '确定', primary: true }])
}

function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay')!
    const content = document.getElementById('modal-content')!
    const buttonsContainer = document.getElementById('modal-buttons')!

    content.textContent = message
    buttonsContainer.innerHTML = ''

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'modal-btn modal-btn-secondary'
    cancelBtn.textContent = '取消'
    cancelBtn.addEventListener('click', () => {
      overlay.classList.add('hidden')
      resolve(false)
    })

    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'modal-btn modal-btn-primary'
    confirmBtn.textContent = '确定'
    confirmBtn.addEventListener('click', () => {
      overlay.classList.add('hidden')
      resolve(true)
    })

    buttonsContainer.appendChild(cancelBtn)
    buttonsContainer.appendChild(confirmBtn)

    overlay.classList.remove('hidden')
  })
}

function filterVideos(videos: Video[], keyword: string): Video[] {
  if (!keyword.trim())
    return videos

  const lowerKeyword = keyword.toLowerCase()
  return videos.filter(video =>
    video.title.toLowerCase().includes(lowerKeyword)
    || video.author.toLowerCase().includes(lowerKeyword),
  )
}

function renderVideos() {
  const filteredVideos = filterVideos(allVideos, currentKeyword)
  const container = document.getElementById('videos-container')!
  const countEl = document.getElementById('count')!
  const emptyState = document.getElementById('empty-state')!
  const noResults = document.getElementById('no-results')!
  const clearSearchBtn = document.getElementById('clear-search-btn')!

  if (currentKeyword.trim()) {
    countEl.textContent = `找到 ${filteredVideos.length} 个视频（共 ${allVideos.length} 个）`
    clearSearchBtn.classList.remove('hidden')
  }
  else {
    countEl.textContent = `${allVideos.length} 个视频`
    clearSearchBtn.classList.add('hidden')
  }

  if (allVideos.length === 0) {
    container.classList.add('hidden')
    noResults.classList.add('hidden')
    emptyState.classList.remove('hidden')
    return
  }

  if (filteredVideos.length === 0) {
    container.classList.add('hidden')
    emptyState.classList.add('hidden')
    noResults.classList.remove('hidden')
    return
  }

  emptyState.classList.add('hidden')
  noResults.classList.add('hidden')
  container.classList.remove('hidden')
  container.innerHTML = filteredVideos.map(video => createVideoCard(video)).join('')

  container.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const videoId = (btn as HTMLElement).dataset.videoId
      if (videoId) {
        await removeVideo(videoId)
        allVideos = allVideos.filter(v => v.id !== videoId)
        renderVideos()
      }
    })
  })
}

function createVideoCard(video: Video): string {
  const defaultCover = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="68" viewBox="0 0 120 68">
      <rect fill="#e3e5e7" width="120" height="68"/>
      <rect x="45" y="24" width="30" height="20" rx="3" fill="#fb7299" opacity="0.8"/>
      <polygon points="55,30 70,34 55,38" fill="white"/>
      <text x="60" y="55" font-size="10" fill="#9499a0" text-anchor="middle">Bilibili</text>
    </svg>
  `)}`

  return `
    <div class="video-card">
      <a href="${video.url}" target="_blank" class="video-link">
        <img src="${video.cover || defaultCover}" alt="${escapeHtml(video.title)}" class="video-cover" 
             onerror="this.onerror=null; this.src='${defaultCover}';">
        <div class="video-info">
          <div class="video-title">${escapeHtml(video.title)}</div>
          <div class="video-meta">
            <span class="video-author">${escapeHtml(video.author)}</span>
          </div>
        </div>
      </a>
      <button class="delete-btn" title="删除" data-video-id="${video.id}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </div>
  `
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

async function handleClearAll() {
  if (allVideos.length === 0) {
    await showAlert('收藏夹已经是空的了！')
    return
  }

  const confirmed = await showConfirm(`确定要清空收藏夹吗？\n将删除 ${allVideos.length} 个视频，此操作不可恢复！`)
  if (!confirmed)
    return

  try {
    await clearAllVideos()
    allVideos = []
    renderVideos()
  }
  catch (error) {
    console.error('清空收藏夹失败:', error)
    await showAlert('清空收藏夹失败，请重试！')
  }
}

function handleSearch(e: Event) {
  const input = e.target as HTMLInputElement
  currentKeyword = input.value
  renderVideos()
}

function handleClearSearch() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  searchInput.value = ''
  currentKeyword = ''
  renderVideos()
}

async function init() {
  allVideos = await getVideos()
  renderVideos()

  document.getElementById('clear-all-btn')?.addEventListener('click', handleClearAll)
  document.getElementById('search-input')?.addEventListener('input', handleSearch)
  document.getElementById('clear-search-btn')?.addEventListener('click', handleClearSearch)
}

init()
