# PrimerManager

面向分子生物学实验室的 qPCR 引物探针管理系统，替代 Excel 管理引物探针的合成、定容、存放和用量追踪。

---

> 以下内容写给 AI 助手。如果你是人类用户，直接把这个仓库交给 AI 帮你部署即可。

## AI 部署指南

### 前置条件

- Docker + Docker Compose
- 一台有公网或内网 IP 的 Linux 机器（或 WSL2）

### 部署步骤

```bash
git clone <repo-url> PrimerManager && cd PrimerManager
cp .env.example .env
# 编辑 .env，必须修改 AUTH_TOKEN
docker compose up --build -d
# 默认 80 端口，通过 .env 的 PORT 变量修改
```

### .env 配置

| 变量 | 默认值 | 说明 |
|---|---|---|
| `AUTH_TOKEN` | `change-me` | 登录密码，必须修改 |
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/primer_manager.db` | SQLite 路径，无需改 |
| `PORT` | `80` | 对外暴露端口 |

### 架构

```
docker compose
├── frontend (nginx, 端口 PORT)
│   ├── 静态文件 (React SPA)
│   └── /api/* → 反向代理 → backend:8000
└── backend (uvicorn, 内部 8000)
    └── SQLite (volume: db_data 持久化)
```

### 数据备份

SQLite 数据在 Docker volume `db_data` 中。备份方式：
- 系统内：导入导出页 → 数据库全量备份
- 命令行：`docker cp $(docker compose ps -q backend):/app/data ./backup`

### 常见问题

- **忘记密码**：修改 `.env` 的 `AUTH_TOKEN`，然后 `docker compose restart backend`
- **端口冲突**：修改 `.env` 的 `PORT`，然后 `docker compose up -d`
- **数据迁移**：拷贝 `db_data` volume 即可，SQLite 单文件

## AI 开发指南

详细的项目结构、数据模型、API 路由、前端组件树、设计决策见 [`CLAUDE.md`](CLAUDE.md)。

主题系统的模块化改造记录见 [`THEME_GUIDE.md`](THEME_GUIDE.md)，包含每个组件的视觉属性映射表，方便制作新主题。

### 技术栈速查

| 层 | 技术 |
|---|---|
| 后端 | Python 3.12 · FastAPI · SQLAlchemy (async) · aiosqlite · SQLite (WAL) |
| 前端 | React 18 · TypeScript · Vite · TailwindCSS · IBM Plex Sans + JetBrains Mono |
| 部署 | Docker Compose · nginx + uvicorn |
| 鉴权 | `.env` `AUTH_TOKEN`，Bearer Token，单用户 |
| 主题 | CSS 变量驱动，支持暗色/亮色/跟随系统切换 |

### 本地开发

```bash
# 后端
cd backend && pip install -r requirements.txt
AUTH_TOKEN=dev uvicorn app.main:app --reload --port 8000

# 前端
cd frontend && npm install && npm run dev
```

### 关键文件

| 文件 | 用途 |
|---|---|
| `CLAUDE.md` | 完整项目上下文（数据模型、API、组件树、设计决策） |
| `THEME_GUIDE.md` | 主题改造指南（每个组件的视觉属性映射） |
| `frontend/tailwind.config.js` | 设计 token（颜色、阴影、渐变） |
| `frontend/src/index.css` | 全局组件类 + 暗/亮主题 CSS 变量 |
| `frontend/src/hooks/useTheme.ts` | 主题切换逻辑（localStorage + prefers-color-scheme） |
| `frontend/src/components/common/Logo.tsx` | SVG 拟物化 Logo |
