import type { StorageData, Video } from '@/types'

const STORAGE_KEY = 'bilibili_favlist'
let storageCache: StorageData | null = null

export async function getStorage(): Promise<StorageData> {
  if (storageCache) {
    return storageCache
  }
  const data = await chrome.storage.local.get(STORAGE_KEY)
  storageCache = data[STORAGE_KEY] || { videos: [] }
  return storageCache
}

export async function setStorage(data: StorageData): Promise<void> {
  storageCache = data
  await chrome.storage.local.set({ [STORAGE_KEY]: data })
}

export async function addVideo(video: Video): Promise<void> {
  const storage = await getStorage()
  const exists = storage.videos.some(v => v.id === video.id)
  if (!exists) {
    storage.videos.unshift(video)
    await setStorage(storage)
  }
}

export async function removeVideo(videoId: string): Promise<void> {
  const storage = await getStorage()
  storage.videos = storage.videos.filter(v => v.id !== videoId)
  await setStorage(storage)
}

export async function getVideos(): Promise<Video[]> {
  const storage = await getStorage()
  return storage.videos
}

export async function isVideoCollected(videoId: string): Promise<boolean> {
  const storage = await getStorage()
  return storage.videos.some(v => v.id === videoId)
}

export async function clearAllVideos(): Promise<void> {
  storageCache = { videos: [] }
  await setStorage({ videos: [] })
}

export async function importVideos(videos: Video[]): Promise<{ added: number, skipped: number }> {
  const storage = await getStorage()
  const existingIds = new Set(storage.videos.map(v => v.id))
  let added = 0
  let skipped = 0

  for (const video of videos) {
    if (existingIds.has(video.id)) {
      skipped++
    }
    else {
      storage.videos.push(video)
      existingIds.add(video.id)
      added++
    }
  }

  await setStorage(storage)
  return { added, skipped }
}
