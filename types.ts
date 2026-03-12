export interface Video {
  id: string;
  title: string;
  url: string;
  cover: string;
  author: string;
  createdAt: number;
}

export interface StorageData {
  videos: Video[];
}
