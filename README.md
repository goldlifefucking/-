# 校园工单管理系统

>短学期实践项目 — 校园报修与维修工单管理系统

从需求分析到全栈闭环交付的校园工单管理系统，采用 pnpm workspace monorepo 架构。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + TypeScript + Ant Design Vue 4 + Pinia + Vue Router + Axios + Socket.IO Client |
| 后端 | NestJS + TypeScript + Prisma + PostgreSQL + JWT + Socket.IO + Multer + Swagger |
| 共享 | packages/shared（前后端共享枚举和类型） |
| 部署 | Docker + Docker Compose + Nginx |

## 项目结构

```
campus-work-order-system/
├── apps/
│   ├── api/          # NestJS 后端
│   └── web/          # Vue3 前端
├── packages/
│   └── shared/       # 共享类型和枚举
├── docs/             # 开发文档
├── docker-compose.yml        # 开发环境（PostgreSQL）
├── docker-compose.prod.yml   # 生产环境（完整部署）
└── pnpm-workspace.yaml
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 8+
- Docker Desktop

### 本地开发

```bash
# 1. 配置环境变量
cp .env.example .env

# 2. 启动 PostgreSQL
docker compose up -d postgres

# 3. 安装依赖
pnpm install

# 4. 初始化数据库
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:seed

# 5. 启动开发服务器
pnpm dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:3000 |
| Swagger 文档 | http://localhost:3000/api/docs |
| 健康检查 | http://localhost:3000/api/health |

## 默认账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | Admin123456 |
| 维修人员 | repairer | Repair123456 |
| 学生 | student | Student123456 |
| 教师 | teacher | Teacher123456 |

## 业务流程

```
师生提交报修 → 管理员受理 → 管理员派单 → 维修人员处理 → 报修人确认完成
                                                    ↓
                                              反馈未解决 → 重新派单
```

### 工单状态流转

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| PENDING | 待受理 | 管理员受理 / 取消 |
| ACCEPTED | 待派单 | 管理员派单 / 取消 |
| ASSIGNED | 待处理 | 维修人员开始处理 / 取消 |
| PROCESSING | 处理中 | 维修人员提交结果 / 取消 |
| PENDING_CONFIRM | 待确认 | 报修人确认 / 反馈未解决 |
| COMPLETED | 已完成 | 终态 |
| UNRESOLVED | 未解决 | 管理员重新派单 |
| CANCELLED | 已取消 | 终态 |

## Docker 部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 DB_PASSWORD 和 JWT_SECRET

# 构建并启动
docker compose -f docker-compose.prod.yml up -d --build

# 初始化数据库（首次）
docker compose exec api node -e "require('./apps/api/dist/prisma/seed.js')"
```

部署后访问：http://服务器地址/

详细部署说明请参考 [docs/05-部署手册.md](docs/05-部署手册.md)

## 开发文档

- [需求分析](docs/01-需求分析.md)
- [架构设计](docs/02-架构设计.md)
- [数据库设计](docs/03-数据库设计.md)
- [API 文档](docs/04-API文档.md)
- [部署手册](docs/05-部署手册.md)
- [开发指南](docs/06-开发指南.md)

## 常用命令

```bash
pnpm dev              # 启动前后端开发服务器
pnpm build            # 构建所有包
pnpm prisma:generate  # 生成 Prisma Client
pnpm prisma:push      # 推送数据库 Schema
pnpm prisma:seed      # 初始化种子数据
pnpm prisma:studio    # 打开 Prisma Studio
```
