#!/bin/sh
set -e

echo "=========================================="
echo "  校园工单管理系统 - API 启动脚本"
echo "=========================================="

# 等待数据库就绪
echo ">>> 等待 PostgreSQL 就绪..."
max_retries=30
retry=0
while [ $retry -lt $max_retries ]; do
  if npx prisma db push --schema=apps/api/prisma/schema.prisma --accept-data-loss 2>/dev/null; then
    echo ">>> 数据库表结构已同步"
    break
  fi
  retry=$((retry + 1))
  echo "  数据库尚未就绪，重试 ($retry/$max_retries)..."
  sleep 2
done

if [ $retry -eq $max_retries ]; then
  echo "!!! 数据库连接超时，退出"
  exit 1
fi

# 初始化种子数据
echo ">>> 初始化种子数据..."
npx ts-node apps/api/prisma/seed.ts || echo "  种子数据可能已存在，跳过"

# 启动应用
echo ">>> 启动 NestJS 应用服务器..."
exec node apps/api/dist/main.js
