import type { Video } from '@/types'
import { getVideos, importVideos, removeVideo } from '@/utils/storage'
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

function handleExport() {
  if (allVideos.length === 0) {
    showAlert('收藏夹是空的，无法导出！')
    return
  }

  const data = JSON.stringify(allVideos, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bilibili-favlist-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  showAlert(`成功导出 ${allVideos.length} 个视频！`)
}

function handleImportClick() {
  const fileInput = document.getElementById('import-file') as HTMLInputElement
  fileInput.click()
}

async function handleImportFile(e: Event) {
  const fileInput = e.target as HTMLInputElement
  const file = fileInput.files?.[0]
  if (!file)
    return

  try {
    const text = await file.text()
    const videos = JSON.parse(text) as Video[]

    if (!Array.isArray(videos)) {
      showAlert('文件格式错误：需要视频数组')
      return
    }

    const validVideos = videos.filter(v =>
      v.id && v.title && v.url,
    )

    if (validVideos.length === 0) {
      showAlert('文件中没有有效的视频数据')
      return
    }

    const result = await importVideos(validVideos)
    allVideos = await getVideos()
    renderVideos()

    let message = `导入完成！\n新增：${result.added} 个视频`
    if (result.skipped > 0) {
      message += `\n跳过（已存在）：${result.skipped} 个`
    }
    showAlert(message)
  }
  catch (error) {
    console.error('导入失败:', error)
    showAlert('导入失败，请确保文件格式正确！')
  }
  finally {
    fileInput.value = ''
  }
}

async function init() {
  allVideos = await getVideos()
  renderVideos()

  document.getElementById('search-input')?.addEventListener('input', handleSearch)
  document.getElementById('clear-search-btn')?.addEventListener('click', handleClearSearch)
  document.getElementById('export-btn')?.addEventListener('click', handleExport)
  document.getElementById('import-btn')?.addEventListener('click', handleImportClick)
  document.getElementById('import-file')?.addEventListener('change', handleImportFile)
}

init()
