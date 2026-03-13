import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    name: 'Bilibili 收藏夹',
    description: '收藏 Bilibili 视频到本地',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://*.bilibili.com/*'],
  },
})
