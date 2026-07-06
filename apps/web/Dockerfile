# 构建阶段
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY apps/web/nginx.conf ./nginx.conf

# 安装依赖
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 构建 shared 包
RUN pnpm --filter @campus-work-order/shared build

# 构建前端
RUN pnpm --filter @campus-work-order/web build

# 生产阶段
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY --from=builder /nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
