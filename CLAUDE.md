# PrimerManager 引物探针管理系统

## 项目概述

面向分子生物学实验室的引物探针管理系统，用于替代 Excel 管理 qPCR 引物探针的合成、定容、存放、用量追踪。支持 PC 和移动端浏览器访问，Docker 一键部署。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Python 3.12 + FastAPI + SQLAlchemy(async) + aiosqlite |
| 数据库 | SQLite (WAL 模式，单文件持久化) |
| 前端 | React 18 + TypeScript + Vite + TailwindCSS |
| 部署 | Docker Compose: nginx(前端静态) + uvicorn(后端) |
| 鉴权 | .env `AUTH_TOKEN`，Bearer Token 对比，单用户 |

## 数据模型

```
Primer 1───* PrimerTube 1───* UsageLog
                  │
                  *───1 BoxPosition *───1 FreezerBox

Project 1───* ProjectPrimer (关联 tube)
   │
   1───* ProjectGene (基因面板: 管号 × 荧光通道)
```

- **Primer**: 引物/探针核心信息(名称、序列、修饰、MW、GC%、Tm 等)。type 字段根据 modification_5prime/modification_3prime 是否存在自动判定 primer/probe
- **PrimerTube**: 每管物理管，属于某个 Primer 的某批次(batch_number)，记录初始体积和剩余体积
- **UsageLog**: 每次使用记录，自动扣减 tube 的 remaining_volume_ul
- **FreezerBox**: 冻存盒(可自定义行×列)，BoxPosition 稀疏存储已放置的管
- **Project**: 项目管理，ProjectPrimer 关联管，ProjectGene 记录试剂盒基因面板(荧光通道×管号矩阵)

## 后端结构

```
backend/app/
├── main.py          # FastAPI 入口, CORS, lifespan(自动建表)
├── config.py        # pydantic-settings, 从 .env 读 AUTH_TOKEN 和 DATABASE_URL
├── database.py      # async engine, WAL 模式, foreign_keys=ON
├── auth.py          # verify_token Depends
├── models/          # 8 个 SQLAlchemy 模型
├── schemas/         # Pydantic request/response schemas
├── routers/         # 9 个 API router (auth, primers, tubes, usage_logs, boxes, projects, search, import_data, stats)
└── services/        # 6 个业务逻辑 service
```

### API 路由总览

- `POST /api/auth/login` — Token 验证
- `GET/POST/PUT/DELETE /api/primers` — 引物 CRUD，列表支持 search/type/分页
- `GET/POST /api/primers/{id}/tubes` — 管 CRUD
- `PUT /api/tubes/{id}/archive` — 归档(清除位置)
- `PUT /api/tubes/{id}/move` — 移动到新盒位
- `POST /api/tubes/{id}/usage-logs` — 记录用量(自动扣减剩余体积)
- `GET/POST/PUT/DELETE /api/boxes` — 冻存盒 CRUD
- `GET /api/boxes/{id}` — 返回 grid 二维数组 `GridSlot[][]`，每个 slot 含 `{row, col, tube: {...} | null}`
- `PUT /api/boxes/{bid}/positions/{row}/{col}/place` — 放置管
- `POST /api/boxes/{bid}/positions/move` — 移动管
- `GET/POST/PUT/DELETE /api/projects` — 项目 CRUD + 基因面板 + 管关联
- `GET /api/search?q=` — 全局搜索(primers/tubes/boxes)
- `GET /api/stats` — 统计(引物数/探针数/活跃管数/低体积报警数)
- `GET /api/alerts/low-volume` — 低体积报警列表(remaining < initial × 5%)
- `GET /api/import/template` — 下载标准导入模板 xlsx
- `POST /api/import/preview` — 上传 xlsx 预览
- `POST /api/import/confirm` — 确认导入

### 关键实现细节

- **探针类型判定**: `Primer.type` 是 `@hybrid_property`，有任意修饰即为 probe
- **Grid 格式**: `GET /api/boxes/{id}` 返回 `GridSlot` 对象(含 row/col/tube)，非裸 SlotInfo，前端直接消费
- **活跃管数**: `PrimerResponse` 包含 `active_tube_count` 字段，在列表和详情 API 中均返回
- **导入模板**: Sheet1=引物信息，Sheet2=管信息，name+sequence 去重

## 前端结构

```
frontend/src/
├── api/            # axios client + 各模块 API (auth, primers, tubes, boxes, projects, search, import, stats)
├── types/index.ts  # 全部 TypeScript 接口
├── hooks/          # useAuth, useDebounce, useLongPress
├── utils/          # constants, format (isLowVolume, volumePercent, formatGcPercent, rowLabel 等)
├── components/
│   ├── Layout/     # AppLayout(flex 布局), Sidebar(sticky), MobileNav, MobileHeader
│   ├── PrimerList/ # StatCards, PrimerTable(table-fixed), PrimerCardList, AlertDrawer, TypeFilter
│   ├── PrimerDetail/ # PrimerInfoCard, TubeCard, UsageTimeline, RecordUsageModal, AddTubeModal
│   ├── Storage/    # BoxList, BoxGrid(CSS Grid), GridSlotCell, SlotContextMenu, PlaceTubeModal, CreateBoxModal, MoveTargetModal
│   ├── Project/    # CreateProjectModal, ProjectTubesTab, GenePanelTab
│   ├── Import/     # DropZone, PreviewTable
│   └── common/     # VolumeBar, ConfirmDialog, EmptyState, SearchInput, Modal, LoadingSpinner
└── pages/          # LoginPage, PrimerListPage, PrimerDetailPage, StoragePage, SearchResultsPage, ImportPage, ProjectListPage, ProjectDetailPage
```

### 设计风格

- **实验室工具美学**: 深蓝灰侧边栏(#1e293b)，白色内容区，蓝色强调(#3b82f6)，橙色探针(#f97316)
- **字体**: JetBrains Mono(序列)，Inter(正文)
- **响应式**: PC 侧边栏 / 移动端底部导航 + 顶部搜索

### 关键交互

- **序列点击复制**: 列表页和详情页的序列均可点击直接复制到剪贴板
- **冻存盒 Grid**: CSS Grid 可视化，颜色编码(引物蓝/探针橙/低体积红脉冲)，点击空位放置、长按已占位弹出菜单(移动/归档/详情)
- **低体积报警**: remaining < initial × 5% 时，首页红色报警卡片，详情页管卡片红色边框
- **基因面板**: 项目详情的表格视图，行=荧光通道，列=管号，直观展示 multiplex qPCR 分管配置

## Docker 部署

```bash
cp .env.example .env
# 编辑 .env: AUTH_TOKEN=你的密码, PORT=80
docker compose up --build -d
# 访问 http://localhost
```

- `backend` 容器: python:3.12-slim + uvicorn，SQLite 数据通过 volume `db_data` 持久化
- `frontend` 容器: node 多阶段构建 → nginx，`/api/` 代理到 backend:8000

## 协作模式

本项目使用 Claude Code 单模型直接开发，不进行 Codex 多模型协作。可使用 taskmaster skill 进行任务追踪，使用 multiagent teammate 并行处理独立子任务。

## 已知设计决策

1. **不适配现有 Excel 格式**: COA/合成订单/定容表的列结构变化太大，采用标准导入模板
2. **BoxPosition 稀疏存储**: 不预创建全部格位，仅在放置管时创建记录
3. **SQLite 单文件**: 数据量小(百级引物)，无需 PostgreSQL
4. **无多用户系统**: 单 Token 鉴权，适合实验室内部小团队使用
