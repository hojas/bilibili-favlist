# Bilibili 收藏夹

一个使用 WXT 框架开发的 Chrome 浏览器插件，用于收藏 Bilibili 视频到本地存储。

## 功能特性

- 🎬 在 Bilibili 视频页面一键收藏视频
- 💾 收藏数据保存到浏览器本地存储
- 📋 在插件弹窗中查看所有收藏的视频
- 🗑️ 支持删除已收藏的视频
- 🔗 点击视频卡片可直接跳转到原视频页面

## 技术栈

- **框架**: WXT (Next-gen Web Extension Framework)
- **语言**: TypeScript
- **包管理器**: pnpm
- **存储**: Chrome Storage API

## 项目结构

```
bilibili-favlist/
├── entrypoints/
│   ├── content.ts          # 内容脚本 - 在 Bilibili 页面注入收藏按钮
│   ├── background.ts       # 后台脚本
│   └── popup/              # 弹窗 UI
│       ├── index.html
│       ├── main.ts
│       └── style.css
├── utils/
│   └── storage.ts          # 本地存储工具函数
├── types.ts                # TypeScript 类型定义
├── wxt.config.ts           # WXT 配置文件
├── package.json
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 16.x
- pnpm (推荐) 或 npm/yarn
- Chrome 浏览器（或基于 Chromium 的浏览器）

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动开发服务器，支持热更新：

```bash
pnpm dev
```

### 加载插件到 Chrome

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的 "开发者模式"
3. 点击 "加载已解压的扩展程序"
4. 选择项目中的 `.output/chrome-mv3` 目录

### 生产构建

构建生产版本：

```bash
pnpm build
```

构建产物位于 `.output/chrome-mv3` 目录。

### 打包为 ZIP

打包为可发布的 ZIP 文件：

```bash
pnpm zip
```

## 使用说明

### 收藏视频

1. 访问任意 Bilibili 视频页面
2. 在视频工具栏区域会出现一个粉色的 "收藏" 按钮
3. 点击按钮即可收藏该视频
4. 再次点击可取消收藏

### 查看收藏列表

1. 点击浏览器工具栏中的插件图标
2. 弹窗会显示所有已收藏的视频
3. 点击视频卡片可跳转到原视频页面
4. 点击删除图标可移除收藏

## 数据存储

插件使用 `chrome.storage.local` 存储收藏数据，数据结构如下：

```typescript
interface Video {
  id: string;           // 视频 BV 号
  title: string;        // 视频标题
  url: string;          // 视频链接
  cover: string;        // 封面图片
  author: string;       // UP 主名称
  createdAt: number;    // 收藏时间戳
}
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm zip` | 打包为 ZIP 文件 |
| `pnpm compile` | TypeScript 类型检查 |

## License

MIT
