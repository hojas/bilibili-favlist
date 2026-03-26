import { getCurrentPageType } from './content/utils'
import { getVideoInfo, initFavButton, reinitFavButton } from './content/video-page'

let currentPageType = getCurrentPageType()
let currentVideoId: string | null = null

export default defineContentScript({
  matches: ['*://*.bilibili.com/*'],
  main() {
    initPageContent()
    initMessageListener()
    initNavigationListener()
  },
})

function initPageContent() {
  const pageType = getCurrentPageType()
  currentPageType = pageType

  if (pageType === 'video') {
    initFavButton()
    updateCurrentVideoId()
  }
}

function updateCurrentVideoId() {
  const video = getVideoInfo()
  currentVideoId = video?.id || null
}

function initMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoInfo') {
      const video = getVideoInfo()
      sendResponse({ video })
    }
  })
}

function initNavigationListener() {
  let lastUrl = window.location.href

  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      handleUrlChange()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  window.addEventListener('popstate', () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      handleUrlChange()
    }
  })

  const originalPushState = history.pushState
  history.pushState = function (...args) {
    originalPushState.apply(history, args)
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      handleUrlChange()
    }
  }

  const originalReplaceState = history.replaceState
  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args)
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      handleUrlChange()
    }
  }
}

async function handleUrlChange() {
  const newPageType = getCurrentPageType()

  if (newPageType === 'video') {
    await new Promise(resolve => setTimeout(resolve, 500))

    const video = getVideoInfo()
    const newVideoId = video?.id || null

    if (newVideoId !== currentVideoId) {
      currentVideoId = newVideoId
      await reinitFavButton()
    }
  }
  else if (newPageType !== currentPageType) {
    currentPageType = newPageType
    initPageContent()
  }
}
