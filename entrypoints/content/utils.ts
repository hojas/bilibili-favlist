export function normalizeUrl(url: string): string {
  if (!url)
    return ''
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  if (url.startsWith('/')) {
    return `https://www.bilibili.com${url}`
  }
  if (!url.startsWith('http')) {
    return `https://${url}`
  }
  return url
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function waitForElement(timeout: number = 5000): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const el = document.querySelector('.fav-container, .video-list, .small-item-list, .list-item, [class*="video"], [class*="item"]')
      if (el) {
        resolve()
      }
      else {
        setTimeout(check, 200)
      }
    }
    check()
    setTimeout(resolve, timeout)
  })
}

export function getCurrentPageType(): 'video' | 'favlist' | 'unknown' {
  const url = window.location.href
  if (url.includes('/video/')) {
    return 'video'
  }
  if (url.includes('/favlist') || url.includes('/medialist/play/')) {
    return 'favlist'
  }
  return 'unknown'
}

let toastContainer: HTMLDivElement | null = null

function getToastContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'bili-favlist-toast-container'
    toastContainer.style.position = 'fixed'
    toastContainer.style.top = '20px'
    toastContainer.style.left = '50%'
    toastContainer.style.transform = 'translateX(-50%)'
    toastContainer.style.zIndex = '2147483647'
    toastContainer.style.display = 'flex'
    toastContainer.style.flexDirection = 'column'
    toastContainer.style.gap = '10px'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function showToast(message: string, duration: number = 3000): void {
  const container = getToastContainer()

  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.padding = '12px 24px'
  toast.style.background = 'rgba(0, 0, 0, 0.85)'
  toast.style.color = 'white'
  toast.style.borderRadius = '8px'
  toast.style.fontSize = '14px'
  toast.style.whiteSpace = 'pre-wrap'
  toast.style.maxWidth = '400px'
  toast.style.textAlign = 'center'
  toast.style.animation = 'bili-favlist-toast-in 0.3s ease-out'

  container.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'bili-favlist-toast-out 0.3s ease-in'
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, duration)
}

const style = document.createElement('style')
style.textContent = `
  @keyframes bili-favlist-toast-in {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes bili-favlist-toast-out {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`
document.head.appendChild(style)
