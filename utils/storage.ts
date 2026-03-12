import type { Video, StorageData } from '@/types';

const STORAGE_KEY = 'bilibili_favlist';

export async function getStorage(): Promise<StorageData> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || { videos: [] };
}

export async function setStorage(data: StorageData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

export async function addVideo(video: Video): Promise<void> {
  const storage = await getStorage();
  const exists = storage.videos.some(v => v.id === video.id);
  if (!exists) {
    storage.videos.unshift(video);
    await setStorage(storage);
  }
}

export async function removeVideo(videoId: string): Promise<void> {
  const storage = await getStorage();
  storage.videos = storage.videos.filter(v => v.id !== videoId);
  await setStorage(storage);
}

export async function getVideos(): Promise<Video[]> {
  const storage = await getStorage();
  return storage.videos;
}

export async function isVideoCollected(videoId: string): Promise<boolean> {
  const storage = await getStorage();
  return storage.videos.some(v => v.id === videoId);
}
