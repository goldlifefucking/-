# 构建阶段
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# 安装依赖
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 构建 shared 包
RUN pnpm --filter @campus-work-order/shared build

# 生成 Prisma Client
RUN pnpm --filter @campus-work-order/api prisma:generate

# 编译
RUN pnpm --filter @campus-work-order/api build

# 生产阶段
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# 创建上传目录
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
