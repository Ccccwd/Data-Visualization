# 黄宾虹年谱可视化 · 部署文档

> 交互式黄宾虹年谱数据可视化大屏，采用 Vue 3 + ECharts + Pinia 构建，以水墨画风格呈现。

---

## 环境要求

| 工具 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| Git | 2.x | 最新版 |

> 推荐使用 VS Code 作为编辑器，安装以下扩展以获得最佳体验：
> - Vue - Official（Vue 语言支持）
> - ESLint（代码规范）

---

## 快速开始

### 1. 克隆项目

```bash
# HTTPS 方式
git clone https://github.com/Ccccwd/Data-Visualization.git

# 或 SSH 方式（需要提前配置 SSH Key）
git clone git@github.com:Ccccwd/Data-Visualization.git
```

### 2. 进入项目目录

```bash
cd Data-Visualization/binhong-visualization
```

### 3. 安装依赖

```bash
npm install
```

> 首次安装会下载所有依赖包（含 ECharts、GSAP、Pinia 等），请耐心等待。

### 4. 启动开发服务器

```bash
npm run dev
```

启动成功后会看到类似输出：

```
VITE v8.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

在浏览器中打开 `http://localhost:5173/` 即可访问。

### 5. 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 6. 预览构建产物

```bash
npm run preview
```

---

## 项目结构

```
binhong-visualization/
├── public/
│   └── data/
│       └── china.json            # 中国地图 GeoJSON 数据
├── src/
│   ├── assets/                   # 静态资源
│   ├── components/
│   │   ├── A-Map/
│   │   │   ├── InkMap.vue        # 墨迹地图（ECharts 中国地图）
│   │   │   └── Landmarks.vue     # 地标装饰（长城、雷峰塔等 SVG）
│   │   ├── B-Narrative/
│   │   │   ├── DocumentCard.vue  # 文档卡片（年谱条目展示）
│   │   │   └── SealStamp.vue     # 印章动画组件
│   │   ├── C-Graph/
│   │   │   └── RelationshipGraph.vue  # 文人交游关系图谱
│   │   └── D-Timeline/
│   │       └── TimelineRuler.vue # 时间轴标尺
│   ├── composables/
│   │   └── useInkMapOptions.ts   # 地图 ECharts 配置构建
│   ├── data/
│   │   └── binhong_data.json     # 年谱数据（1811条记录）
│   ├── stores/
│   │   └── globalStore.ts        # Pinia 全局状态管理
│   ├── styles/
│   │   ├── _variables.scss       # SCSS 变量（墨色、纸色、布局）
│   │   ├── _ink-wash.scss        # 水墨风格样式
│   │   ├── _animations.scss      # 动画样式
│   │   └── main.scss             # 全局样式入口
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── App.vue                   # 根组件（视口缩放 + 2×2 网格布局）
│   ├── main.ts                   # 应用入口
│   └── index.html                # HTML 模板
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 界面布局

应用采用 **1920×1080 固定视口**，自动缩放适配不同分辨率，分为四个区域：

```
┌──────────────────┬──────────────────┐
│                  │                  │
│   A 区 · 地图    │  B 区 · 文档卡片 │
│  （墨迹中国地图  │  （年谱条目详情  │
│   旅行路线标注） │   印章·年份·文本）│
│                  │──────────────────│
│                  │                  │
│                  │  C 区 · 关系图谱 │
│                  │ （文人交游网络） │
├──────────────────┴──────────────────┤
│         D 区 · 时间轴标尺           │
│  （1861-1956 年份刻度·点击选择年份） │
└─────────────────────────────────────┘
```

---

## 交互说明

| 操作 | 触发区域 | 效果 |
|------|---------|------|
| 点击年份刻度 | D 区 时间轴 | 筛选该年条目 → 地图放大显示相关地点和路线，文档卡片更新 |
| 点击地点标记 | A 区 地图 | 筛选该地点条目 → 时间轴跳转到最频繁年份，图谱更新 |
| 点击人物节点 | C 区 关系图谱 | 筛选该人物条目 → 时间轴跳转，地图更新 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript |
| 构建 | Vite 8 |
| 可视化 | ECharts 6 + vue-echarts |
| 状态管理 | Pinia 3 |
| 动画 | GSAP 3 |
| 样式 | SCSS（水墨色系变量系统） |
| 字体 | Ma Shan Zheng / Noto Serif SC / ZCOOL XiaoWei |

---

## 常见问题

### Q: `npm install` 失败或很慢？

切换到国内镜像源：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: 启动后页面空白？

检查控制台是否有报错。常见原因：
- 浏览器版本过低（推荐 Chrome 90+）
- 端口 5173 被占用（Vite 会自动尝试 5174）

### Q: Git clone 时 SSL 报错？

```bash
# 方案一：切换 SSL 后端
git config --global http.sslBackend openssl

# 方案二：使用 SSH 方式克隆
git clone git@github.com:Ccccwd/Data-Visualization.git
```

### Q: VS Code 中 TypeScript 报红？

确保打开了 `binhong-visualization/` 目录作为工作区根目录，而非上层目录。

### Q: 如何修改设计稿尺寸？

编辑 `src/styles/_variables.scss` 中的 `$screen-width` 和 `$screen-height`，以及 `src/App.vue` 中的 `.viewport-scale` 宽高。

---

## 许可证

本项目仅供学习交流使用。
