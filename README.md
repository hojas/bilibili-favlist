# Bilibili 收藏夹

一个轻量级的浏览器扩展，用于收藏和管理 Bilibili 视频到本地存储。

## 功能特性

### 核心功能
- 🎬 **视频收藏** - 在 Bilibili 视频页面一键收藏/取消收藏
- 🔍 **搜索功能** - 支持按标题或作者搜索已收藏的视频
- 📥 **导入导出** - 支持导出为 JSON 文件，方便备份和迁移
- 💾 **本地存储** - 数据保存在浏览器本地，无需登录注册

### 界面特性
- 📱 **响应式设计** - 适配桌面端和移动端
- ✨ **优雅交互** - 自定义弹窗和提示，无浏览器原生弹窗
- 🔄 **SPA 支持** - 页面切换时自动更新按钮状态

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | WXT (Next-gen Web Extension Framework) |
| 语言 | TypeScript |
| 包管理 | pnpm |
| 存储 | Chrome Storage API |
| 规范 | ESLint + @antfu/eslint-config |

## 项目结构

```
bilibili-favlist/
├── entrypoints/
│   ├── content.ts              # 内容脚本入口，处理页面路由
│   ├── background.ts           # 后台脚本，处理图标点击
│   ├── content/
│   │   ├── video-page.ts       # 视频页面收藏按钮
│   │   ├── favlist-page.ts     # B站收藏夹批量收藏
│   │   └── utils.ts            # 工具函数（toast 等）
│   └── favlist/                # 收藏列表页面（新标签页）
│       ├── index.html
│       ├── main.ts
│       └── style.css
├── utils/
│   └── storage.ts              # 存储操作封装
├── types.ts                    # 类型定义
├── wxt.config.ts               # WXT 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 16.x
- pnpm（推荐）/ npm / yarn
- Chrome 或基于 Chromium 的浏览器

### 安装与运行

```bash
# 安装依赖
pnpm install

# 开发模式（支持热更新）
pnpm dev

# 生产构建
pnpm build

# 打包为 ZIP
pnpm zip
```

### 加载扩展

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `.output/chrome-mv3` 目录

## 使用指南

### 收藏视频

1. 访问任意 Bilibili 视频页面
2. 页面右下角会出现一个心形收藏按钮
3. 点击收藏，按钮变为粉色表示已收藏
4. 再次点击可取消收藏

### 查看收藏

1. 点击浏览器工具栏的扩展图标
2. 在新标签页打开收藏列表
3. 点击视频卡片跳转到原视频

### 搜索视频

- 在收藏列表页面的搜索框输入关键词
- 支持搜索视频标题和作者名
- 实时过滤显示结果

### 导入/导出

- **导出**：点击「导出」按钮，下载 JSON 文件
- **导入**：点击「导入」按钮，选择 JSON 文件
- 导入时自动跳过已存在的视频

### 删除视频

- 点击视频卡片上的删除按钮
- 确认后即可删除

## 数据结构

```typescript
interface Video {
  id: string        // 视频 BV 号
  title: string     // 视频标题
  url: string       // 视频链接
  cover: string     // 封面图片 URL
  author: string    // UP 主名称
  createdAt: number // 收藏时间戳
}
```

存储位置：`chrome.storage.local`，键名：`bilibili_favlist`

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（热更新） |
| `pnpm build` | 构建生产版本 |
| `pnpm zip` | 打包为 ZIP 文件 |
| `pnpm compile` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | 自动修复 ESLint 问题 |

## 注意事项

- 数据存储在浏览器本地，卸载扩展会丢失数据
- 建议定期使用导出功能备份数据
- 仅支持 Bilibili 视频页面（`bilibili.com/video/*`）

## License

MIT
