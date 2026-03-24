import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    name: 'Bilibili 收藏夹',
    description: '收藏 Bilibili 视频到本地',
    permissions: ['storage', 'activeTab', 'tabs'],
    host_permissions: ['*://*.bilibili.com/*'],
    action: {
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        96: 'icon/96.png',
        128: 'icon/128.png',
      },
    },
  },
})
