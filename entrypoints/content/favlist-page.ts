import type { Video } from '@/types'
import { addVideo, isVideoCollected } from '@/utils/storage'
import { normalizeUrl, showToast, sleep } from './utils'

const BV_REGEX = /BV\w+/

export async function initFavlistBatchButton() {
  console.log('初始化批量收藏按钮...')

  const button = document.createElement('button')
  button.id = 'bili-favlist-batch-btn'
  button.textContent = '批量收藏'
  button.style.position = 'fixed'
  button.style.top = '20px'
  button.style.right = '20px'
  button.style.padding = '12px 24px'
  button.style.background = 'linear-gradient(135deg, #fb7299 0%, #ff8a9d 100%)'
  button.style.color = 'white'
  button.style.border = 'none'
  button.style.borderRadius = '50px'
  button.style.cursor = 'pointer'
  button.style.fontSize = '14px'
  button.style.fontWeight = '500'
  button.style.zIndex = '2147483647'

  button.addEventListener('click', handleBatchCollect)

  document.body.appendChild(button)
}

async function handleBatchCollect() {
  const button = document.getElementById('bili-favlist-batch-btn')
  if (!button)
    return

  const originalText = button.textContent
  button.textContent = '处理中...'
  button.disabled = true

  try {
    let totalCollected = 0
    let totalSkipped = 0
    let pageCount = 0
    const maxPageAttempts = 50
    const seenIds = new Set<string>()

    while (pageCount < maxPageAttempts) {
      pageCount++
      button.textContent = `第${pageCount}页...`

      await sleep(1000)

      const pageVideos = parseCurrentPageVideos()

      for (const video of pageVideos) {
        if (seenIds.has(video.id))
          continue
        seenIds.add(video.id)

        const exists = await isVideoCollected(video.id)
        if (!exists) {
          await addVideo(video)
          totalCollected++
        }
        else {
          totalSkipped++
        }

        button.textContent = `${totalCollected}/${totalCollected + totalSkipped}`
        await sleep(30)
      }

      const hasNextPage = goToNextPage()
      if (!hasNextPage)
        break

      await sleep(1500)
    }

    showToast(`批量收藏完成！\n共处理 ${pageCount} 页\n成功收藏：${totalCollected} 个\n已存在跳过：${totalSkipped} 个`, 5000)
  }
  catch (error) {
    console.error('批量收藏失败:', error)
    showToast('批量收藏失败，请刷新页面后重试！')
  }
  finally {
    button.textContent = originalText || '批量收藏'
    button.disabled = false
  }
}

function parseCurrentPageVideos(): Video[] {
  const videos: Video[] = []
  const items = document.querySelectorAll('.fav-video-item, .small-item, .video-item, .list-item, .bili-video-card, [class*="video-card"], [class*="video-item"]')

  items.forEach((item) => {
    try {
      const link = item.querySelector('a[href*="/video/"]') as HTMLAnchorElement
      if (!link)
        return

      const url = link.href
      const bvMatch = url.match(BV_REGEX)
      if (!bvMatch)
        return

      const id = bvMatch[0]

      const titleSelectors = [
        '.title',
        '.video-title',
        '.name',
        'h3',
        'h4',
        '[class*="title"]',
        '[class*="name"]',
      ]
      let title = '未知标题'
      for (const sel of titleSelectors) {
        const el = item.querySelector(sel)
        if (el && el.textContent?.trim()) {
          title = el.textContent.trim()
          break
        }
      }

      const authorSelectors = [
        '.up',
        '.author',
        '.username',
        '.up-name',
        '[class*="up"]',
        '[class*="author"]',
        '[class*="user"]',
      ]
      let author = '未知作者'
      for (const sel of authorSelectors) {
        const el = item.querySelector(sel)
        if (el && el.textContent?.trim()) {
          author = el.textContent.trim()
          break
        }
      }

      let cover = ''
      const coverImg = item.querySelector('img') as HTMLImageElement
      if (coverImg) {
        cover = coverImg.src || coverImg.getAttribute('src') || ''
      }

      videos.push({
        id,
        title,
        url: normalizeUrl(url),
        cover: normalizeUrl(cover),
        author,
        createdAt: Date.now(),
      })
    }
    catch {
    }
  })

  return videos
}

function goToNextPage(): boolean {
  const nextPageSelectors = [
    '.next-page-btn',
    '.next-btn',
    '.pagination-next',
    '.page-next',
    '[class*="next-page"]',
    '[class*="next-btn"]',
  ]

  let nextButton: HTMLElement | null = null

  for (const selector of nextPageSelectors) {
    const elements = document.querySelectorAll(selector)
    for (const el of elements) {
      const htmlEl = el as HTMLElement
      if (htmlEl.offsetParent !== null
        && !htmlEl.hasAttribute('disabled')
        && !htmlEl.classList.contains('disabled')) {
        nextButton = htmlEl
        break
      }
    }
    if (nextButton)
      break
  }

  if (!nextButton) {
    const allButtons = document.querySelectorAll('button, a')
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || ''
      const htmlBtn = btn as HTMLElement
      if ((text.includes('下一页') || text.includes('next') || text.includes('→'))
        && htmlBtn.offsetParent !== null
        && !htmlBtn.hasAttribute('disabled')
        && !htmlBtn.classList.contains('disabled')) {
        nextButton = htmlBtn
        break
      }
    }
  }

  if (nextButton) {
    nextButton.click()
    return true
  }

  return false
}
