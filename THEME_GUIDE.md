# PrimerManager 主题改造指南

本文档模块化地记录了拟物化（Skeuomorphism）主题改造的全部修改点，方便后续 AI 或开发者基于此制作新主题。

---

## 1. 主题基础系统

制作新主题时，**只需修改以下两个文件**即可改变全局视觉风格。

### 1.1 `frontend/tailwind.config.js` — 设计 Token

| Token 路径 | 当前值（拟物化） | 用途 |
|---|---|---|
| `colors.lab.bg` | `#111318` | 最深背景（机箱/chassis） |
| `colors.lab.surface` | `#1c2028` | 主面板背景 |
| `colors.lab.raised` | `#252a35` | 凸起面板/卡片背景 |
| `colors.lab.highlight` | `#2d333f` | Hover 高亮背景 |
| `colors.lab.metal` | `#353c4a` | 金属交互元素基色 |
| `colors.lab.metal-light` | `#414959` | 金属亮色 |
| `colors.lab.metal-edge` | `#4a5368` | 金属边缘高光 |
| `colors.lab.border` | `#2a3040` | 主边框色 |
| `colors.lab.border-light` | `#3a4258` | 亮边框色 |
| `colors.lab.text` | `#e8ecf4` | 主文字色 |
| `colors.lab.muted` | `#8b95a8` | 次要文字 |
| `colors.lab.faint` | `#5a6478` | 最淡文字/禁用态 |
| `colors.lab.accent` | `#4a9eff` | 强调色（引物/链接） |
| `colors.lab.probe` | `#ff8a3d` | 探针色 |
| `colors.lab.success` | `#3dd68c` | 成功/活跃指示 |
| `colors.lab.danger` | `#ff4757` | 危险/报警指示 |
| `colors.lab.warning` | `#ffd43b` | 警告指示 |

还定义了：
- `boxShadow.*` — panel / recess / raised / pressed / glow-* / modal 等阴影预设
- `backgroundImage.*` — metal-panel / metal-button / led-* 等渐变预设
- `animation.*` / `keyframes.*` — pulse-ring / led-blink / btn-press 动效
- `fontFamily` — `sans: IBM Plex Sans`，`mono: JetBrains Mono`

### 1.2 `frontend/src/index.css` — 基础组件类

以下 CSS 类在全局定义，被所有组件共享。**修改这些类即可批量改变全局视觉。**

| CSS 类 | 拟物化效果 | 换主题时改什么 |
|---|---|---|
| `.card` | 金属面板：渐变背景 + 拉丝纹理 + 阴影 + 顶部高光 | `background` / `border` / `box-shadow` |
| `.stat-card` | 仪表面板：同 card + hover 上浮 | 同 card |
| `.btn-primary` | 蓝色 LED 背光按钮：渐变 + 凸起阴影 → hover 亮 → active 内陷 | `background` / `border` / `box-shadow`（三态） |
| `.btn-secondary` | 金属拉丝按钮：金属渐变 + 边缘高光 | 同 btn-primary |
| `.btn-danger` | 红色 LED 按钮 | 同 btn-primary |
| `.input-field` | 凹陷显示屏：深色底 + inset shadow | `background` / `box-shadow` / `border` |
| `.badge-primer` | 蓝色 LED 指示灯：radial-gradient + glow shadow | `background` / `box-shadow` / `color` |
| `.badge-probe` | 橙色 LED 指示灯 | 同 badge-primer |
| `select.input-field` | 仪器选择器：自定义箭头 SVG | `background-image`（箭头 SVG） |
| `table thead th` | 数据表头：深色底 + 大写 + 字母间距 | `background` / `color` / `text-transform` |
| `tbody tr:hover` | 行 hover：微亮 | `background` |
| `.animate-pulse-ring` | 红色报警脉冲 | `@keyframes` 中的颜色 |

### 1.3 `frontend/index.html` — 字体加载

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
<body class="font-sans antialiased">
```

换主题时可替换 `IBM Plex Sans` 为其他 Google Fonts。

---

## 2. 布局与导航组件

### 2.1 `components/Layout/AppLayout.tsx`

| 修改项 | 改了什么 |
|---|---|
| 外层 `div` | 添加 `bg-lab-bg` 作为机箱底色 |
| `main` 区域 | 添加 `bg-lab-bg` |

### 2.2 `components/Layout/Sidebar.tsx`

| 修改项 | 改了什么 |
|---|---|
| `aside` 背景 | `bg-lab-surface` → `bg-metal-sidebar`（渐变）+ `shadow-panel` |
| 搜索框 | 用 `input-field` 凹陷风格 |
| 导航项常态 | `text-lab-muted hover:bg-lab-bg hover:text-lab-text` |
| 导航项选中态 | `bg-lab-accent/10 text-lab-accent` + `shadow-glow-blue` LED 发光 |
| 品牌区 | 用 `<Logo>` 组件 + 文字 |

### 2.3 `components/Layout/MobileHeader.tsx`

| 修改项 | 改了什么 |
|---|---|
| 顶栏背景 | `bg-metal-sidebar` + `shadow-panel` + `border-lab-border` |
| 搜索框 | `input-field` 凹陷风格 |
| 品牌区 | `<Logo size={28}>` |

### 2.4 `components/Layout/MobileNav.tsx`

| 修改项 | 改了什么 |
|---|---|
| 底部栏背景 | `bg-metal-sidebar` + `border-lab-border` |
| 选中图标 | `text-lab-accent` + LED 蓝色 drop-shadow |
| 未选图标 | `text-lab-muted` |

---

## 3. 核心公共组件

### 3.1 `components/common/Modal.tsx`

| 修改项 | 改了什么 |
|---|---|
| 遮罩层 | `bg-black/40` → `bg-black/60` |
| 弹窗面板 | `.card` + `shadow-modal` |
| 标题 | `text-lab-text` |
| 关闭按钮 | `text-lab-muted hover:text-lab-text` |

### 3.2 `components/common/VolumeBar.tsx`

| 修改项 | 改了什么 |
|---|---|
| 轨道 | `bg-slate-100` → `bg-[var(--chassis)]` + `shadow-recess` 凹陷液位槽 |
| 填充条（低量） | 红色 LED 渐变 |
| 填充条（>50%） | 绿色 LED 渐变 |
| 填充条（>20%） | 黄色渐变 |
| 填充条（其他） | 橙色渐变 |
| 文字 | `text-lab-danger` / `text-lab-muted` |

### 3.3 `components/common/ConfirmDialog.tsx`

| 修改项 | 改了什么 |
|---|---|
| 遮罩 | `bg-black/60` |
| 面板 | `.card` + `shadow-modal` |
| 文字 | `text-lab-text` / `text-lab-muted` |

### 3.4 `components/common/EmptyState.tsx`

| 修改项 | 改了什么 |
|---|---|
| 标题 | `text-lab-muted` |
| 描述 | `text-lab-faint` |

### 3.5 `components/common/LoadingSpinner.tsx`

| 修改项 | 改了什么 |
|---|---|
| Spinner 颜色 | `text-blue-500` → `text-lab-accent` |

### 3.6 `components/common/SearchInput.tsx`

| 修改项 | 改了什么 |
|---|---|
| 图标 | `text-lab-muted` |
| 清除按钮 | `text-lab-muted hover:text-lab-text` |

### 3.7 `components/common/Logo.tsx`（新增）

纯 SVG Logo 组件，接收 `size` prop。包含：
- 金属铭牌底座（linearGradient + bevel overlay）
- "PP" 文字蓝色 LED 发光（feGaussianBlur filter）
- DNA 双螺旋暗示（蓝/橙交替 LED 点）
- 四角螺丝钉、绿色状态指示灯

---

## 4. 引探管理页面

### 4.1 `components/PrimerList/StatCards.tsx`

| 修改项 | 改了什么 |
|---|---|
| 卡片背景 | 各颜色浅色底 → 统一 `border-lab-border bg-lab-surface` 暗色面板 |
| 数字颜色 | 对应 LED 色：`text-lab-accent` / `text-lab-probe` / `text-lab-success` / `text-lab-danger` |
| 标签 | `text-lab-muted` |

### 4.2 `components/PrimerList/PrimerTable.tsx`

| 修改项 | 改了什么 |
|---|---|
| 表头 | `bg-lab-surface text-lab-muted` |
| 行 hover | `hover:bg-lab-highlight/50` |
| 边框 | `border-lab-border` |
| 链接 | `text-lab-accent` |
| 序列文字 | `text-lab-muted` |

### 4.3 `components/PrimerList/PrimerCardList.tsx`

| 修改项 | 改了什么 |
|---|---|
| 卡片 | `.card` |
| 文字 | `text-lab-text` / `text-lab-muted` |
| 复制反馈 | `text-lab-success` |

### 4.4 `components/PrimerList/AlertDrawer.tsx`

| 修改项 | 改了什么 |
|---|---|
| 面板 | `bg-lab-surface border-lab-border` |
| 头部 | `bg-lab-raised` |
| 报警条目 | `border-lab-danger/30` 红色 LED 微光 |

### 4.5 `components/PrimerList/CreatePrimerModal.tsx`

| 修改项 | 改了什么 |
|---|---|
| 标签 | `text-lab-muted` |
| 错误消息 | `bg-lab-danger/10 text-lab-danger border-lab-danger/30` |

### 4.6 `pages/PrimerListPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 标题 | `text-lab-text` |
| FilterSelect 选中态 | `border-lab-accent bg-lab-accent/10` |
| 分页文字 | `text-lab-muted` |

---

## 5. 引探详情页面

### 5.1 `components/PrimerDetail/PrimerInfoCard.tsx`

| 修改项 | 改了什么 |
|---|---|
| 序列区域 | `bg-lab-bg` 凹陷显示屏风格 |
| 标签 | `text-lab-muted` |
| 值 | `text-lab-text` |
| 复制成功 | `text-lab-success` |

### 5.2 `components/PrimerDetail/TubeCard.tsx`

| 修改项 | 改了什么 |
|---|---|
| 低体积边框 | `border-lab-danger/50 ring-1 ring-lab-danger/30` |
| 位置标签 | `bg-lab-accent/10 text-lab-accent` |
| 归档卡片 | `opacity-50` |

### 5.3 `components/PrimerDetail/UsageTimeline.tsx`

| 修改项 | 改了什么 |
|---|---|
| 时间轴点 | `bg-lab-accent` |
| 连线 | `bg-lab-border` |
| 文字 | `text-lab-muted` / `text-lab-danger` |

### 5.4 各 Modal（RecordUsage/AddTube/EditTube/EditPrimer）

| 修改项 | 改了什么 |
|---|---|
| 标签 | `text-lab-muted` |
| 错误消息 | `bg-lab-danger/10 text-lab-danger` |

### 5.5 `pages/PrimerDetailPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 面包屑 | `text-lab-muted` / `text-lab-text` |
| 链接 | `text-lab-accent` |
| 项目标签 | `bg-lab-accent/10 text-lab-accent` |

---

## 6. 存放管理页面

### 6.1 `components/Storage/BoxList.tsx`

| 修改项 | 改了什么 |
|---|---|
| 选中盒子 | `ring-2 ring-lab-accent border-lab-accent/50` LED 蓝色选中光 |
| 占用率轨道 | `bg-lab-bg` 凹陷 |
| 占用率填充 | `bg-lab-accent` |
| 文字 | `text-lab-text` / `text-lab-muted` |

### 6.2 `components/Storage/GridSlotCell.tsx`

| 修改项 | 改了什么 |
|---|---|
| 空位 | `bg-lab-bg border-dashed border-lab-border` |
| 放置目标 hover | `bg-lab-success/10 border-lab-success` |
| 引物管 | `bg-lab-accent/10 border-lab-accent/40` 蓝色 LED 微光 |
| 探针管 | `bg-lab-probe/10 border-lab-probe/40` 橙色 LED 微光 |
| 低体积 | `ring-2 ring-lab-danger animate-pulse-ring` 红色报警灯 |
| 搜索高亮 | `ring-2 ring-lab-warning animate-pulse` |
| 文字 | `text-lab-text` / `text-lab-muted` / `text-lab-accent` |

### 6.3 `components/Storage/SlotPopupMenu.tsx` & `SlotContextMenu.tsx`

| 修改项 | 改了什么 |
|---|---|
| 面板 | `bg-lab-raised border-lab-border shadow-panel-lg` |
| 菜单项 hover | `hover:bg-lab-highlight` |
| 归档项 | `text-lab-danger hover:bg-lab-danger/10` |

### 6.4 `components/Storage/BoxGrid.tsx`

| 修改项 | 改了什么 |
|---|---|
| 行/列头 | `bg-lab-surface text-lab-muted` |
| 拖拽浮动元素 | `bg-lab-accent shadow-glow-blue` |

### 6.5 各 Modal（PlaceTube/CreateBox/EditBox/MoveTarget）

| 修改项 | 改了什么 |
|---|---|
| 管选择卡片 | `bg-lab-raised border-lab-border hover:border-lab-accent/50` |
| 小网格已占位 | `bg-lab-metal border-lab-metal-edge` |
| 小网格空位 | `bg-lab-success/10 border-lab-success/40` |

### 6.6 `pages/StoragePage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 搜索下拉 | `bg-lab-raised border-lab-border shadow-panel-lg` |
| 结果项 hover | `hover:bg-lab-highlight` |

---

## 7. 项目页面

### 7.1 `pages/ProjectListPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 项目卡片 | `.card hover:border-lab-accent/40` |
| 文字 | `text-lab-text` / `text-lab-muted` |

### 7.2 `pages/ProjectDetailPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| Tab 组背景 | `bg-lab-bg` 凹陷选择器 |
| 选中 Tab | `bg-lab-raised text-lab-text shadow-raised` |
| 未选 Tab | `text-lab-muted hover:text-lab-text` |

### 7.3 `components/Project/GenePanelTab.tsx`

| 修改项 | 改了什么 |
|---|---|
| 表格 | `border-lab-border bg-lab-surface` |
| 表头 | `text-lab-muted bg-lab-raised` |

### 7.4 `components/Project/ProjectPrimerOverviewRows.tsx`

| 修改项 | 改了什么 |
|---|---|
| Hover 行 | `hover:bg-lab-highlight/50` |
| 报警行 | `bg-lab-danger/5` |
| 链接 | `text-lab-accent` |

---

## 8. 辅助页面

### 8.1 `pages/ImportPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| Section 标题 | `text-lab-muted` |
| 错误消息 | `bg-lab-danger/10 text-lab-danger border-lab-danger/30` |
| 成功消息 | `bg-lab-success/10 text-lab-success border-lab-success/30` |

### 8.2 `components/Import/DropZone.tsx`

| 修改项 | 改了什么 |
|---|---|
| 虚线边框 | `border-lab-border` |
| 拖拽激活 | `border-lab-accent bg-lab-accent/5` |
| 图标 | `text-lab-faint` |

### 8.3 `components/Import/PreviewTable.tsx`

| 修改项 | 改了什么 |
|---|---|
| 统计标签颜色 | `text-lab-success` / `text-lab-warning` / `text-lab-probe` / `text-lab-danger` |
| 表格边框/背景 | `border-lab-border bg-lab-surface` |

### 8.4 `pages/SearchResultsPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 结果卡片 | `.card hover:border-lab-accent/40` |
| 标签 | `bg-lab-raised text-lab-muted` |

### 8.5 `pages/TubeLifecycleLogsPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 筛选按钮选中 | `border-lab-accent bg-lab-accent/10 text-lab-accent` |
| 筛选按钮未选 | `border-lab-border bg-lab-surface text-lab-muted` |

### 8.6 `components/Logs/TubeLifecycleLogList.tsx`

| 修改项 | 改了什么 |
|---|---|
| 事件卡片（created） | `border-lab-accent/30 bg-lab-accent/5 text-lab-accent` |
| 事件卡片（placed） | `border-lab-success/30 bg-lab-success/5 text-lab-success` |
| 事件卡片（moved） | `border-lab-warning/30 bg-lab-warning/5 text-lab-warning` |
| 事件卡片（used） | `border-lab-danger/30 bg-lab-danger/5 text-lab-danger` |
| 事件卡片（archived） | `border-lab-border bg-lab-surface text-lab-muted` |
| 时间轴线 | `bg-lab-border` |

---

## 9. 登录页

### 9.1 `pages/LoginPage.tsx`

| 修改项 | 改了什么 |
|---|---|
| 页面背景 | `bg-lab-bg` |
| 登录面板 | `.card` 金属面板 |
| 标题 | `text-lab-text` |
| 副标题 | `text-lab-muted` |
| 品牌 Logo | `<Logo size={64}>` |
| 标签 | `text-lab-muted` |
| 错误消息 | `bg-lab-danger/10 text-lab-danger` |

---

## 制作新主题的步骤

1. **修改 `tailwind.config.js`** 中 `colors.lab.*` 的全部色值、`boxShadow.*` 阴影预设、`backgroundImage.*` 渐变预设
2. **修改 `index.css`** 中 `:root` CSS 变量和 `@layer components` 内的所有组件类
3. **修改 `index.html`** 中的 Google Fonts 链接和 `tailwind.config.js` 中的 `fontFamily`
4. **修改 `Logo.tsx`** 中的 SVG 渐变/颜色/滤镜以匹配新主题
5. 各页面和组件使用的都是 `lab-*` Tailwind 类和全局 CSS 类，**不需要逐个修改组件**，除非要改变某个特定组件的独有视觉效果
6. 运行 `npx tsc --noEmit && npx vite build` 验证

### 核心改造模式（3 条规则）

| 旧模式（扁平化） | 新模式（拟物化） | 规则 |
|---|---|---|
| `bg-white` / `bg-gray-50` | `bg-lab-surface` / `bg-lab-bg` | 背景用 lab 色阶 |
| `text-slate-800` / `text-slate-500` | `text-lab-text` / `text-lab-muted` | 文字用 lab 色阶 |
| `border-slate-200` | `border-lab-border` | 边框用 lab 色阶 |

所有语义色（蓝/橙/绿/红）统一走 `lab-accent` / `lab-probe` / `lab-success` / `lab-danger`，而非直接写 `blue-500` / `orange-500`。
