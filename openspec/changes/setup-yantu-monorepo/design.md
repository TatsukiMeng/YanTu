## Context

研途是一个期末大作业项目——考研交流社区微信小程序。原 PRD 基于微信云开发（CloudBase），现改为自托管架构。需在短时间内完成开发，优先功能实现。项目当前处于空白起步阶段，小程序端仅有脚手架，后端不存在。

## Goals / Non-Goals

- Goals:
  - 完整的 Monorepo 项目结构（npm workspaces）
  - 可运行的 Bun+Hono+SQLite 后端（13 个 API 端点）
  - 使用 TDesign 组件库的小程序前端（5 个页面）
  - MVP 功能闭环：登录 → 浏览帖子 → 发帖 → 点赞评论 → 打卡 → 查看个人看板
- Non-Goals:
  - 错误处理 / fallback / 重试机制
  - 测试覆盖
  - CI/CD 流水线
  - 消息推送、运营后台、AI 问答、收藏、搜索、关注

## Decisions

### Monorepo 目录规划

```
YanTu/
├── package.json                    # workspace root
├── packages/
│   ├── miniapp/                    # 微信小程序
│   │   ├── app.js                  # App 入口：onLaunch 登录、globalData 存用户/token
│   │   ├── app.json                # 页面路由、TabBar、TDesign 组件声明
│   │   ├── app.wxss                # 全局样式、TDesign 主题变量覆盖
│   │   ├── project.config.json     # 微信开发者工具配置
│   │   ├── sitemap.json
│   │   ├── miniprogram_npm/        # TDesign 构建产物（npm 构建）
│   │   ├── utils/
│   │   │   ├── api.js              # 统一请求层：baseURL、token 注入、响应解析
│   │   │   └── auth.js             # 登录流程：wx.login → API → Storage
│   │   ├── components/             # 自定义组件（帖子卡片等）
│   │   │   └── post-card/
│   │   │       ├── post-card.js
│   │   │       ├── post-card.json
│   │   │       ├── post-card.wxml
│   │   │       └── post-card.wxss
│   │   └── pages/
│   │       ├── index/              # Tab 1：研友圈
│   │       ├── post-create/        # 二级：发帖
│   │       ├── post-detail/        # 二级：帖子详情
│   │       ├── clock/              # Tab 2：备考时钟
│   │       └── profile/            # Tab 3：个人中心
│   └── server/                     # Bun + Hono 后端
│       ├── package.json
│       ├── tsconfig.json
│       ├── uploads/                # 图片上传目录
│       └── src/
│           ├── index.ts            # Hono 应用入口、CORS、静态文件服务、路由注册
│           ├── db.ts               # SQLite 初始化、建表、种子数据
│           ├── middleware/
│           │   └── auth.ts         # JWT 解析 → c.set('userId')
│           ├── routes/
│           │   ├── auth.ts         # POST /api/auth/login
│           │   ├── posts.ts        # GET/POST /api/posts, GET /api/posts/:id
│           │   ├── likes.ts        # POST /api/posts/:id/like
│           │   ├── comments.ts     # GET/POST /api/posts/:id/comments
│           │   ├── checkin.ts      # POST /api/checkin, GET /api/checkin/today
│           │   ├── quotes.ts       # GET /api/quotes/random
│           │   ├── user.ts         # GET /api/user/profile, GET /api/user/posts
│           │   └── upload.ts       # POST /api/upload
│           └── types.ts            # 共享类型定义（User, Post, Comment 等）
├── openspec/
└── CLAUDE.md
```

选择 npm workspaces 而非 turborepo/nx：项目只有两个 workspace，无额外工具链需求。

### 小程序端分层原则

```
┌─────────────────────────────────────────────────────────┐
│                    小程序端分层                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  pages/*                                                │
│  ┌──────────────────────────────────────────┐           │
│  │ 只做：生命周期衔接、页面组合、data 声明    │           │
│  │ 调用：utils/api.js 的方法                 │           │
│  │ 不做：直接 wx.request、业务逻辑计算       │           │
│  └──────────────────┬───────────────────────┘           │
│                     │ 调用                               │
│  utils/api.js       │                                   │
│  ┌──────────────────▼───────────────────────┐           │
│  │ 统一请求层                                │           │
│  │ - baseURL 拼接                            │           │
│  │ - 从 app.globalData 或 Storage 读取 token  │           │
│  │ - 注入 Authorization: Bearer <token>       │           │
│  │ - 解析响应 JSON，提取 data 字段             │           │
│  │ - token 失效时触发重新登录                  │           │
│  └──────────────────┬───────────────────────┘           │
│                     │ wx.request                         │
│  ┌──────────────────▼───────────────────────┐           │
│  │ 后端 API (Hono)                           │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  components/*                                           │
│  ┌──────────────────────────────────────────┐           │
│  │ 只做：展示、局部交互、接收 properties      │           │
│  │ 不做：直接调 API、持有完整后端 response     │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

三类状态边界：

| 状态类型 | 存储位置 | 示例 | 特点 |
|----------|---------|------|------|
| 服务端数据 | 通过 api.js 请求后写入 data | 帖子列表、评论列表 | 每次进入页面重新请求 |
| 页面局部状态 | page.data | 当前分类标签、输入框内容、加载中状态 | 页面生命周期内有效 |
| 全局用户状态 | app.globalData + Storage | token、userInfo、打卡缓存 | 跨页面共享，Storage 持久化 |

### 后端分层原则

```
┌─────────────────────────────────────────────────────────┐
│                    后端分层                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  routes/*.ts                                            │
│  ┌──────────────────────────────────────────┐           │
│  │ HTTP 薄层                                │           │
│  │ - 参数解析和校验                          │           │
│  │ - JWT 中间件注入 userId 后直接使用         │           │
│  │ - 调用 db.ts 的查询函数                   │           │
│  │ - 组装响应 envelope                      │           │
│  │ - 不做：业务逻辑 if-else 分支             │           │
│  └──────────────────┬───────────────────────┘           │
│                     │ 调用                               │
│  db.ts              │                                   │
│  ┌──────────────────▼───────────────────────┐           │
│  │ 数据库访问                                │           │
│  │ - 初始化连接、建表、种子数据               │           │
│  │ - 导出查询/写入函数供 routes 调用          │           │
│  │ - SQL 参数化，防止注入                     │           │
│  │ - 不做：HTTP 协议、响应格式                │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  注：项目规模小（单文件 db.ts + 8 个路由文件），          │
│  不引入 service/repository 层。当 db.ts 或某个路由        │
│  文件超过 200 行时再考虑拆分。                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### API 响应 Envelope

所有 API 响应使用统一信封：

```typescript
{
  code: number,    // 0 = 成功，非 0 = 业务错误
  data: any,       // 业务数据
  msg: string      // 人类可读消息
}
```

小程序端 `utils/api.js` 统一解析 envelope，页面只拿到 `data` 部分。

### 认证流程（测试号本地模式）

测试号无需 AppSecret，不走真实 code2session。后端用 `wx.login()` 返回的 code 直接作为用户标识（每次小程序启动 code 不同，但同一设备短时间内 code 有效期可用）。

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ wx.login │────▶│ POST     │────▶│ code 作为 │
│ 获取 code│     │ /login   │     │ 模拟 openid│
└──────────┘     └──────────┘     └────┬─────┘
                                        │
                         ┌──────────────▼──────────┐
                         │ 查询/创建 user (openid=code)│
                         │ 签发 JWT (含 userId)       │
                         │ 返回 { token, userInfo }   │
                         └──────────────┬──────────┘
                                        │
                         ┌──────────────▼──────────┐
                         │ 小程序 Storage 存 token   │
                         │ app.globalData 存用户     │
                         └─────────────────────────┘
```

后端 `routes/auth.ts` 实现：接收 `{ code }` → 以 code 值作为 openid 查询 users 表 → 不存在则创建 → 签发 JWT 返回。

Token 注入：`utils/api.js` 每次请求从 Storage 读取 token，注入 `Authorization: Bearer <token>`。

Token 失效处理：后端返回 401 时，`utils/api.js` 自动触发 `wx.login` → 重新换 token → 重放原请求。仅重试一次。

### 头像昵称授权

微信小程序已废弃 `wx.getUserProfile`，使用头像昵称填写能力（`<button open-type="chooseAvatar">` + `<input type="nickname">`）。首次互动操作（发帖/评论/打卡）时，若 `app.globalData.userInfo` 为空，先跳转授权流程获取头像昵称，再提交业务操作。

### 数据库 Schema (SQLite)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL UNIQUE,
  nick_name TEXT NOT NULL DEFAULT '微信用户',
  avatar_url TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER NOT NULL REFERENCES posts(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, post_id)
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER NOT NULL REFERENCES posts(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE check_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  check_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, check_date)
);

CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '考研能量站'
);
```

索引策略：`likes` 和 `check_ins` 的 UNIQUE 约束自动创建索引；`posts` 按 `created_at DESC` 查询，数据量小不需额外索引。

### API 端点与 DTO 草案

| 方法 | 路径 | 请求 | 响应 data | 认证 |
|------|------|------|-----------|------|
| POST | /api/auth/login | `{ code }` | `{ token, userInfo }` | 无 |
| GET | /api/posts | `?category=&page=1&limit=10` | `{ list: PostWithAuthor[], total, page }` | 无 |
| POST | /api/posts | `{ content, category, images }` | `{ id }` | JWT |
| GET | /api/posts/:id | - | `PostDetail` | 无 |
| POST | /api/posts/:id/like | - | `{ liked: boolean }` | JWT |
| GET | /api/posts/:id/comments | `?page=1&limit=20` | `{ list: CommentWithUser[], total }` | 无 |
| POST | /api/posts/:id/comments | `{ content }` | `{ id }` | JWT |
| POST | /api/checkin | - | `{ success: true }` | JWT |
| GET | /api/checkin/today | - | `{ checked: boolean }` | JWT |
| GET | /api/quotes/random | - | `{ text, author }` | 无 |
| GET | /api/user/profile | - | `{ userInfo, stats: { checkInDays, postCount, commentCount, likeCount } }` | JWT |
| GET | /api/user/posts | `?page=1&limit=10` | `{ list: Post[], total }` | JWT |
| POST | /api/upload | multipart file | `{ url }` | JWT |

关键 DTO：

```typescript
// PostWithAuthor — 帖子列表项
{
  id, content, category, images, created_at,
  author: { id, nick_name, avatar_url },
  like_count, liked_by_me
}

// PostDetail — 帖子详情（含评论数）
{
  ...PostWithAuthor,
  comment_count
}

// CommentWithUser — 评论
{
  id, content, created_at,
  user: { id, nick_name, avatar_url }
}
```

### TDesign 组件映射

| 业务场景 | TDesign 组件 | 用途 |
|----------|-------------|------|
| 分类标签栏 | `t-tabs` | 顶部横向分类切换 |
| 帖子卡片 | `t-cell` + 自定义 `post-card` | 列表项展示 |
| 发帖输入 | `t-textarea` | 正文输入 |
| 分类选择 | `t-picker` | 分类选择器 |
| 图片展示 | `t-image` | 缩略图和大图 |
| 提示 | `t-toast` | 操作反馈 |
| 弹窗 | `t-dialog` | 确认弹窗 |
| 数据看板 | `t-grid` | 四项统计数字 |
| 加载 | `t-loading` | 加载状态 |
| 按钮 | `t-button` | 各种操作按钮 |
| 头像 | `t-avatar` | 用户头像 |
| 图标 | `t-icon` | 点赞图标等 |
| 导航 | `t-navbar` | 二级页面导航栏 |

### 数据流

#### 发帖流程
```
用户点击"+" → 进入发帖页
  → textarea 输入内容
  → picker 选分类
  → wx.chooseMedia 选图（≤3张）
  → 逐张 POST /api/upload → 获取 url[]
  → 点击发布 → POST /api/posts { content, category, images: url[] }
  → t-toast 成功 → 延迟 1.5s navigateBack → 研友圈刷新
```

#### 打卡流程（双重缓存）
```
进入备考时钟页
  → 先读 Storage(checkedDate) → 若为今天，按钮立即置灰
  → 同时 GET /api/checkin/today → 确认服务端状态
  → 用户点击打卡 → POST /api/checkin
  → 成功后 Storage 写入 checkedDate = today → 按钮置灰
```

## Risks / Trade-offs

- **不引入 service/repository 层**：项目规模小，路由文件直接调 db.ts 函数。当单文件超过 200 行时再拆分。
- **SQLite 并发**：单用户演示场景无影响，多用户时写入可能成为瓶颈。
- **无测试**：纯手动验收，无回归保障。MVP 阶段接受此风险。
- **图片本地存储**：无 CDN，演示可接受。`uploads/` 目录需在 `.gitignore` 中排除。
- **Token 无刷新机制**：过期后重新 wx.login 换新 token，小程序使用周期短影响有限。

## Open Questions

- 图片上传大小限制：建议 5MB，在小程序端 `wx.chooseMedia` 的 `sizeType` 和后端同时限制。
- 多设备测试时，同一用户每次启动 code 不同会创建多个 user 记录。如需多设备共用同一用户，可手动在 SQLite 中合并。
