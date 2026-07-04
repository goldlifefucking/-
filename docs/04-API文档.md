# 04 - API 文档

## 1. 基础信息

### 1.1 认证方式

所有需要认证的API均需在请求头中携带JWT Token：

```
Authorization: Bearer <token>
```

登录成功后返回的 `accessToken` 即为所需 Token。

### 1.2 基础URL

| 环境 | 地址 |
|------|------|
| 本地开发 | `http://localhost:3000` |
| 生产环境 | `http://服务器IP` 或 `https://域名` |

### 1.3 通用响应格式

**成功响应:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { }
}
```

**分页列表响应:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

**错误响应:**

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": "Validation failed",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## 2. API 端点列表

---

### 2.1 认证模块 (Auth)

#### POST `/api/auth/login` - 用户登录

- **权限**: 公开
- **描述**: 使用用户名和密码登录，返回 JWT Token

**请求参数:**

```json
{
  "username": "admin",
  "password": "Admin123456"
}
```

**响应示例:**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "role": "ADMIN",
      "phone": "13800001111",
      "avatar": null
    }
  }
}
```

---

#### GET `/api/auth/profile` - 获取当前用户信息

- **权限**: 已登录
- **描述**: 根据 Token 获取当前登录用户的详细信息

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "系统管理员",
    "role": "ADMIN",
    "phone": "13800001111",
    "avatar": null,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 2.2 用户模块 (Users)

#### GET `/api/users` - 获取用户列表

- **权限**: `ADMIN`
- **描述**: 分页查询用户列表，支持按角色筛选

**请求参数 (Query):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `pageSize` | number | 否 | 每页条数，默认10 |
| `role` | string | 否 | 角色筛选：ADMIN/WORKER/STUDENT/TEACHER |
| `keyword` | string | 否 | 搜索关键字（匹配用户名/姓名） |

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "name": "系统管理员",
        "role": "ADMIN",
        "phone": "13800001111",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "total": 4,
    "page": 1,
    "pageSize": 10
  }
}
```

---

#### GET `/api/users/workers` - 获取维修人员列表

- **权限**: `ADMIN`
- **描述**: 获取所有在职维修人员列表（用于派单时选择）

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 2,
      "username": "repairer",
      "name": "李师傅",
      "phone": "13800002222"
    }
  ]
}
```

---

#### POST `/api/users` - 创建用户

- **权限**: `ADMIN`

**请求参数:**

```json
{
  "username": "worker2",
  "password": "Worker123456",
  "name": "刘师傅",
  "role": "WORKER",
  "phone": "13800005555"
}
```

**响应示例:**

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 5,
    "username": "worker2",
    "name": "刘师傅",
    "role": "WORKER"
  }
}
```

---

#### PATCH `/api/users/:id` - 编辑用户

- **权限**: `ADMIN`

**请求参数:**

```json
{
  "name": "刘师傅(已更新)",
  "phone": "13800006666",
  "isActive": true
}
```

---

#### DELETE `/api/users/:id` - 删除用户（软删除）

- **权限**: `ADMIN`
- **描述**: 将用户 `isActive` 设为 false，不物理删除

---

### 2.3 分类模块 (Categories)

#### GET `/api/categories` - 获取启用的分类列表

- **权限**: 已登录
- **描述**: 返回所有启用状态的分类，按 `sortOrder` 排序

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "水电维修",
      "description": "水龙头、下水道、电路故障等",
      "icon": "ThunderboltOutlined",
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "网络故障",
      "description": "校园网、路由器、交换机问题",
      "icon": "WifiOutlined",
      "sortOrder": 2
    }
  ]
}
```

---

#### GET `/api/categories/all` - 获取全部分类

- **权限**: `ADMIN`
- **描述**: 返回所有分类（含已禁用的），用于管理页面

---

#### POST `/api/categories` - 创建分类

- **权限**: `ADMIN`

**请求参数:**

```json
{
  "name": "环境卫生",
  "description": "教室、办公室卫生清洁",
  "icon": "EnvironmentOutlined",
  "sortOrder": 5
}
```

---

#### PATCH `/api/categories/:id` - 编辑分类

- **权限**: `ADMIN`

---

#### DELETE `/api/categories/:id` - 删除分类

- **权限**: `ADMIN`
- **说明**: 如果该分类下有工单，不可删除

---

### 2.4 工单模块 (Work Orders)

#### GET `/api/work-orders` - 获取工单列表

- **权限**: 已登录（按角色自动过滤数据）
- **描述**: 分页查询工单列表

**请求参数 (Query):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `pageSize` | number | 否 | 每页条数，默认10 |
| `status` | string | 否 | 状态筛选 |
| `priority` | string | 否 | 优先级筛选 |
| `categoryId` | number | 否 | 分类筛选 |
| `keyword` | string | 否 | 搜索标题 |

**角色过滤规则:**
- `ADMIN`: 查看所有工单
- `WORKER`: 仅查看自己被指派的工单
- `STUDENT`/`TEACHER`: 仅查看自己提交的工单

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "图书馆3楼饮水机故障",
        "description": "饮水机不出热水",
        "location": "图书馆3楼东侧",
        "priority": "MEDIUM",
        "status": "PENDING",
        "category": {
          "id": 1,
          "name": "水电维修"
        },
        "reporter": {
          "id": 3,
          "name": "张三"
        },
        "worker": null,
        "createdAt": "2025-01-01T10:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10
  }
}
```

---

#### GET `/api/work-orders/stats` - 获取统计数据

- **权限**: `ADMIN`
- **描述**: 获取工单各维度的统计数据

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "total": 150,
    "pending": 5,
    "accepted": 3,
    "assigned": 4,
    "processing": 2,
    "pendingConfirm": 6,
    "completed": 120,
    "unresolved": 8,
    "cancelled": 2,
    "todayCreated": 12,
    "todayCompleted": 8,
    "byCategory": [
      { "category": "水电维修", "count": 60 },
      { "category": "网络故障", "count": 40 }
    ],
    "trend": [
      { "date": "2024-12-28", "created": 10, "completed": 8 },
      { "date": "2024-12-29", "created": 15, "completed": 12 }
    ]
  }
}
```

---

#### GET `/api/work-orders/:id` - 获取工单详情

- **权限**: 已登录（数据权限控制）
- **描述**: 获取工单完整信息，含附件、日志

**数据权限规则:**
- `ADMIN`: 可查看所有工单
- `WORKER`: 仅可查看自己被指派的工单
- `STUDENT`/`TEACHER`: 仅可查看自己提交的工单

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "title": "图书馆3楼饮水机故障",
    "description": "饮水机不出热水",
    "location": "图书馆3楼东侧",
    "priority": "MEDIUM",
    "status": "COMPLETED",
    "resolution": "已更换加热管，恢复正常",
    "feedback": "维修很快，满意",
    "category": { "id": 1, "name": "水电维修" },
    "reporter": { "id": 3, "name": "张三", "phone": "13800003333" },
    "worker": { "id": 2, "name": "李师傅", "phone": "13800002222" },
    "attachments": [
      { "id": 1, "url": "/uploads/xxx.jpg", "filename": "photo.jpg", "type": "BEFORE" },
      { "id": 2, "url": "/uploads/yyy.jpg", "filename": "result.jpg", "type": "AFTER" }
    ],
    "logs": [
      { "id": 1, "action": "创建工单", "userName": "张三", "createdAt": "2025-01-01T10:00:00.000Z" },
      { "id": 2, "action": "受理工单", "userName": "系统管理员", "createdAt": "2025-01-01T10:30:00.000Z" }
    ],
    "acceptedAt": "2025-01-01T10:30:00.000Z",
    "assignedAt": "2025-01-01T10:35:00.000Z",
    "startedAt": "2025-01-01T11:00:00.000Z",
    "resolvedAt": "2025-01-01T11:30:00.000Z",
    "confirmedAt": "2025-01-01T12:00:00.000Z",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

---

#### POST `/api/work-orders` - 创建工单

- **权限**: `STUDENT`, `TEACHER`
- **描述**: 提交新的报修工单

**请求参数 (multipart/form-data 或 JSON):**

```json
{
  "title": "图书馆3楼饮水机故障",
  "description": "饮水机不出热水，已经持续三天了",
  "location": "图书馆3楼东侧",
  "priority": "MEDIUM",
  "categoryId": 1,
  "attachmentIds": [101, 102]
}
```

**响应示例:**

```json
{
  "code": 201,
  "message": "工单创建成功",
  "data": {
    "id": 1,
    "title": "图书馆3楼饮水机故障",
    "status": "PENDING",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

---

#### POST `/api/work-orders/:id/accept` - 受理工单

- **权限**: `ADMIN`
- **描述**: 管理员受理工单，状态从 PENDING 变为 ACCEPTED

**前置条件**: 工单状态必须为 `PENDING`

**响应示例:**

```json
{
  "code": 200,
  "message": "工单已受理",
  "data": {
    "id": 1,
    "status": "ACCEPTED",
    "acceptedAt": "2025-01-01T10:30:00.000Z"
  }
}
```

---

#### POST `/api/work-orders/:id/assign` - 派发工单

- **权限**: `ADMIN`
- **描述**: 管理员将工单分配给指定维修人员

**前置条件**: 工单状态必须为 `ACCEPTED` 或 `UNRESOLVED`

**请求参数:**

```json
{
  "workerId": 2
}
```

**响应示例:**

```json
{
  "code": 200,
  "message": "工单已派发",
  "data": {
    "id": 1,
    "status": "ASSIGNED",
    "worker": { "id": 2, "name": "李师傅" },
    "assignedAt": "2025-01-01T10:35:00.000Z"
  }
}
```

---

#### POST `/api/work-orders/:id/start` - 开始处理

- **权限**: `WORKER`（仅被指派的维修人员）
- **描述**: 维修人员开始处理工单

**前置条件**: 工单状态必须为 `ASSIGNED`，且操作者为被指派的维修人员

**响应示例:**

```json
{
  "code": 200,
  "message": "已开始处理",
  "data": {
    "id": 1,
    "status": "PROCESSING",
    "startedAt": "2025-01-01T11:00:00.000Z"
  }
}
```

---

#### POST `/api/work-orders/:id/resolve` - 提交处理结果

- **权限**: `WORKER`（仅被指派的维修人员）
- **描述**: 维修人员提交处理结果和维修后照片

**前置条件**: 工单状态必须为 `PROCESSING`

**请求参数:**

```json
{
  "resolution": "已更换加热管，饮水机恢复正常工作",
  "attachmentIds": [201, 202]
}
```

**响应示例:**

```json
{
  "code": 200,
  "message": "处理结果已提交",
  "data": {
    "id": 1,
    "status": "PENDING_CONFIRM",
    "resolution": "已更换加热管，饮水机恢复正常工作",
    "resolvedAt": "2025-01-01T11:30:00.000Z"
  }
}
```

---

#### POST `/api/work-orders/:id/confirm` - 确认完成

- **权限**: `STUDENT`, `TEACHER`（仅报修人本人）
- **描述**: 报修人确认维修完成

**前置条件**: 工单状态必须为 `PENDING_CONFIRM`，且操作者为报修人

**请求参数:**

```json
{
  "feedback": "维修很快，服务态度好"
}
```

**响应示例:**

```json
{
  "code": 200,
  "message": "已确认完成",
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "feedback": "维修很快，服务态度好",
    "confirmedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

---

#### POST `/api/work-orders/:id/unresolve` - 反馈未解决

- **权限**: `STUDENT`, `TEACHER`（仅报修人本人）
- **描述**: 报修人反馈问题未解决，工单回到已受理状态待重新派单

**前置条件**: 工单状态必须为 `PENDING_CONFIRM`，且操作者为报修人

**请求参数:**

```json
{
  "feedback": "饮水机还是不出热水，请重新处理"
}
```

**响应示例:**

```json
{
  "code": 200,
  "message": "已反馈未解决",
  "data": {
    "id": 1,
    "status": "UNRESOLVED",
    "feedback": "饮水机还是不出热水，请重新处理"
  }
}
```

---

#### POST `/api/work-orders/:id/cancel` - 取消工单

- **权限**: `ADMIN`
- **描述**: 管理员取消工单

**前置条件**: 工单状态不能为终态（`COMPLETED` / `CANCELLED`）

**请求参数:**

```json
{
  "reason": "重复提交，需合并处理"
}
```

**响应示例:**

```json
{
  "code": 200,
  "message": "工单已取消",
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "cancelledAt": "2025-01-01T13:00:00.000Z"
  }
}
```

---

### 2.5 文件模块 (Files)

#### POST `/api/files/upload` - 上传文件

- **权限**: 已登录
- **描述**: 上传图片文件，支持压缩

**请求**: `multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 图片文件，支持 jpg/png/gif/webp |

**限制**: 文件大小 ≤ 10MB

**响应示例:**

```json
{
  "code": 201,
  "message": "上传成功",
  "data": {
    "id": 101,
    "url": "/uploads/2025/01/1704096000000-abc123.jpg",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 245760
  }
}
```

---

### 2.6 通知模块 (Notifications)

#### GET `/api/notifications` - 获取通知列表

- **权限**: 已登录
- **描述**: 分页查询当前用户的通知

**请求参数 (Query):**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认1 |
| `pageSize` | number | 否 | 每页条数，默认20 |
| `isRead` | boolean | 否 | 已读筛选 |

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "工单已受理",
        "content": "您的工单「图书馆3楼饮水机故障」已被管理员受理",
        "type": "WORK_ORDER_ACCEPTED",
        "isRead": false,
        "workOrderId": 1,
        "createdAt": "2025-01-01T10:30:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

---

#### GET `/api/notifications/unread-count` - 获取未读通知数量

- **权限**: 已登录

**响应示例:**

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "count": 5
  }
}
```

---

#### PATCH `/api/notifications/:id/read` - 标记单条通知为已读

- **权限**: 已登录

---

#### PATCH `/api/notifications/read-all` - 全部标记已读

- **权限**: 已登录

---

### 2.7 系统模块 (System)

#### GET `/api/health` - 健康检查

- **权限**: 公开

**响应示例:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 86400
}
```

---

#### GET `/api/docs` - Swagger API 文档

- **权限**: 公开
- **访问地址**: `http://localhost:3000/api/docs`
- **描述**: 交互式 API 文档页面（Swagger UI）

---

## 3. 错误码说明

| HTTP状态码 | 含义 | 常见场景 |
|-----------|------|----------|
| `200` | 成功 | 请求正常处理 |
| `201` | 创建成功 | POST 请求创建资源成功 |
| `400` | 请求参数错误 | 参数校验失败、必填字段缺失 |
| `401` | 未认证 | Token 缺失、过期或无效 |
| `403` | 无权限 | 角色/数据权限不足 |
| `404` | 资源不存在 | 工单/用户/分类ID不存在 |
| `409` | 状态冲突 | 工单状态不允许当前操作 |
| `413` | 文件过大 | 上传文件超过10MB限制 |
| `500` | 服务器错误 | 未预期的内部错误 |

### 常见错误示例

**401 未认证:**

```json
{
  "code": 401,
  "message": "未登录或Token已过期，请重新登录"
}
```

**403 无权限:**

```json
{
  "code": 403,
  "message": "您没有权限执行此操作"
}
```

**409 状态冲突:**

```json
{
  "code": 409,
  "message": "当前工单状态为 COMPLETED，不允许取消操作"
}
```

---

## 4. API 端点汇总

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 公开 | 登录 |
| GET | `/api/auth/profile` | 已登录 | 当前用户信息 |
| GET | `/api/users` | ADMIN | 用户列表 |
| POST | `/api/users` | ADMIN | 创建用户 |
| PATCH | `/api/users/:id` | ADMIN | 编辑用户 |
| DELETE | `/api/users/:id` | ADMIN | 删除用户 |
| GET | `/api/users/workers` | ADMIN | 维修人员列表 |
| GET | `/api/categories` | 已登录 | 启用分类列表 |
| GET | `/api/categories/all` | ADMIN | 全部分类 |
| POST | `/api/categories` | ADMIN | 创建分类 |
| PATCH | `/api/categories/:id` | ADMIN | 编辑分类 |
| DELETE | `/api/categories/:id` | ADMIN | 删除分类 |
| GET | `/api/work-orders` | 已登录 | 工单列表 |
| GET | `/api/work-orders/stats` | ADMIN | 统计数据 |
| GET | `/api/work-orders/:id` | 已登录 | 工单详情 |
| POST | `/api/work-orders` | STUDENT/TEACHER | 创建工单 |
| POST | `/api/work-orders/:id/accept` | ADMIN | 受理 |
| POST | `/api/work-orders/:id/assign` | ADMIN | 派单 |
| POST | `/api/work-orders/:id/start` | WORKER | 开始处理 |
| POST | `/api/work-orders/:id/resolve` | WORKER | 提交结果 |
| POST | `/api/work-orders/:id/confirm` | STUDENT/TEACHER | 确认完成 |
| POST | `/api/work-orders/:id/unresolve` | STUDENT/TEACHER | 反馈未解决 |
| POST | `/api/work-orders/:id/cancel` | ADMIN | 取消 |
| POST | `/api/files/upload` | 已登录 | 文件上传 |
| GET | `/api/notifications` | 已登录 | 通知列表 |
| GET | `/api/notifications/unread-count` | 已登录 | 未读计数 |
| PATCH | `/api/notifications/:id/read` | 已登录 | 标记已读 |
| PATCH | `/api/notifications/read-all` | 已登录 | 全部已读 |
| GET | `/api/health` | 公开 | 健康检查 |
| GET | `/api/docs` | 公开 | Swagger |
