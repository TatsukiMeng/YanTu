## 依赖关系总览

```
Phase 1: 基础设施（串行）
  1.1 根 package.json ──▶ 1.2 迁移小程序 ──▶ 1.3 app.json/TabBar
                                              │
  1.4 TDesign 安装 ◀─────────────────────────┘
  1.5 server 初始化 ──▶ 1.6 安装依赖

Phase 2: 后端核心（依赖 Phase 1，内部可部分并行）
  2.1 db.ts ─┬─▶ 2.2 index.ts ──▶ 2.13 启动验证
             │
  2.3 auth 中间件 ─┤
             │
  2.4-2.12 各路由 ─┘（2.4-2.12 可并行，但都依赖 2.1 + 2.3）

Phase 3: 小程序公共层（依赖 Phase 1 + 2.4，可与 Phase 2 路由并行）
  3.1 api.js ──▶ 3.2 auth.js ──▶ 3.3 app.js ──▶ 3.4 app.wxss

Phase 4: 前端页面（依赖 Phase 3，内部可并行）
  4.x 研友圈 ─┐
  5.x 发帖   ─┤（并行）
  6.x 详情   ─┤
  7.x 时钟   ─┤
  8.x 个人   ─┘

Phase 5: 验收（依赖全部）
  9.x 端到端验证
```

---

## Phase 1: 基础设施搭建

- [ ] 1.1 创建根 `package.json` 配置 npm workspaces
  - **写入范围**: 根目录 `package.json`
  - **验证**: `npm ls --workspaces` 显示 miniapp + server
  - **依赖**: 无

- [ ] 1.2 创建 `packages/miniapp/`，迁移现有小程序文件
  - **写入范围**: 将 `pages/`、`utils/`、`app.js`、`app.json`、`app.wxss`、`project.config.json`、`project.private.config.json`、`sitemap.json` 移入 `packages/miniapp/`，删除原位置文件
  - **验证**: 原根目录仅剩 `package.json`、`packages/`、`openspec/`、`CLAUDE.md`、`.claude/`
  - **依赖**: 1.1

- [ ] 1.3 更新小程序 `app.json`
  - **写入范围**: `packages/miniapp/app.json`
  - **内容**: 配置 5 个页面路由（index/post-create/post-detail/clock/profile）、3 个 TabBar（研友圈/备考时钟/我的）、`navigationBarTitleText` 改为"研途"
  - **验证**: 微信开发者工具打开 `packages/miniapp/` 不报路由错误
  - **依赖**: 1.2

- [ ] 1.4 初始化 TDesign
  - **写入范围**: `packages/miniapp/package.json` 添加 `tdesign-miniprogram` 依赖
  - **验证**: `npm install` 后 `miniprogram_npm/` 目录存在，页面 JSON 中可声明 `t-button`
  - **依赖**: 1.3

- [ ] 1.5 创建 `packages/server/` 目录，初始化项目
  - **写入范围**: `packages/server/package.json`、`tsconfig.json`
  - **验证**: `bun --version` 可执行
  - **依赖**: 1.1（可与 1.2-1.4 并行）

- [ ] 1.6 安装后端依赖
  - **写入范围**: `packages/server/package.json` 添加 hono、better-sqlite3、jsonwebtoken 及类型声明
  - **验证**: `bun install` 无报错
  - **依赖**: 1.5

---

## Phase 2: 后端核心（2.1 和 2.3 必须先完成，2.4-2.12 可并行）

- [ ] 2.1 创建 `packages/server/src/db.ts`
  - **写入范围**: SQLite 连接初始化、6 张表 CREATE TABLE IF NOT EXISTS、quotes 种子数据、导出 `getDb()` 和各表查询/写入函数
  - **验证**: `bun run src/db.ts` 无报错，数据库文件生成
  - **依赖**: 1.6
  - **Review Gate**: SQL 语句使用参数化查询，`getDb()` 单例模式

- [ ] 2.2 创建 `packages/server/src/index.ts`
  - **写入范围**: Hono 实例、CORS 中间件、静态文件服务（`/uploads/*`）、路由注册、端口监听
  - **验证**: `bun run src/index.ts` 启动无报错
  - **依赖**: 2.1

- [ ] 2.3 创建 `packages/server/src/middleware/auth.ts`
  - **写入范围**: JWT 解析中间件，提取 `userId` 存入 `c.set('userId')`，无 token 时返回 401
  - **验证**: curl 无 token 访问受保护端点返回 401
  - **依赖**: 2.2

- [ ] 2.4 创建 `packages/server/src/routes/auth.ts`
  - **写入范围**: POST /api/auth/login — 接收 `{ code }` → 以 code 值作为模拟 openid → 查询/创建 user → 签发 JWT 返回
  - **验证**: curl `POST /api/auth/login {"code":"test123"}` 返回 token
  - **依赖**: 2.3

- [ ] 2.5 创建 `packages/server/src/routes/posts.ts`
  - **写入范围**: GET /api/posts（分类筛选 + 分页 + JOIN 用户信息 + 子查询点赞数和点赞状态）、POST /api/posts、GET /api/posts/:id
  - **验证**: curl 测试列表/创建/详情三个端点
  - **依赖**: 2.3

- [ ] 2.6 创建 `packages/server/src/routes/likes.ts`
  - **写入范围**: POST /api/posts/:id/like — 查询是否已点赞 → 存在则删除/不存在则插入 → 返回 `{ liked }`
  - **验证**: 连续两次 POST 验证点赞/取消切换
  - **依赖**: 2.3

- [ ] 2.7 创建 `packages/server/src/routes/comments.ts`
  - **写入范围**: GET /api/posts/:id/comments（分页 + JOIN 用户信息）、POST /api/posts/:id/comments
  - **验证**: curl 测试获取和创建评论
  - **依赖**: 2.3

- [ ] 2.8 创建 `packages/server/src/routes/checkin.ts`
  - **写入范围**: POST /api/checkin（UNIQUE 约束去重）、GET /api/checkin/today
  - **验证**: 当天重复打卡不创建新记录
  - **依赖**: 2.3

- [ ] 2.9 创建 `packages/server/src/routes/quotes.ts`
  - **写入范围**: GET /api/quotes/random — `ORDER BY RANDOM() LIMIT 1`
  - **验证**: curl 多次请求返回不同名言
  - **依赖**: 2.2（无需 auth）

- [ ] 2.10 创建 `packages/server/src/routes/user.ts`
  - **写入范围**: GET /api/user/profile（用户信息 + 4 项统计 Promise.all 并行查询）、GET /api/user/posts（分页）
  - **验证**: curl 带 token 请求返回用户信息和统计数据
  - **依赖**: 2.3

- [ ] 2.11 创建 `packages/server/src/routes/upload.ts`
  - **写入范围**: POST /api/upload — 接收 multipart 文件 → 写入 `uploads/` → 返回 URL
  - **验证**: curl 上传文件后可通过 URL 访问
  - **依赖**: 2.2

- [ ] 2.12 后端启动验证
  - **验证动作**: `bun run src/index.ts` 启动后，curl 遍历全部 13 个端点（公开端点直接访问、受保护端点先 mock 登录拿 token）
  - **Review Gate**: 每个端点返回符合 envelope 格式 `{ code, data, msg }`
  - **依赖**: 2.4-2.11 全部完成

---

## Phase 3: 小程序公共层（2.4 完成后可与 Phase 2 其他路由并行）

- [ ] 3.1 创建 `packages/miniapp/utils/api.js`
  - **写入范围**: 封装 `request(method, path, data)` 函数 — 读取 Storage 中的 token → 注入 Authorization header → wx.request → 解析 envelope → 401 时触发重新登录并重试一次
  - **验证**: 调用 `api.get('/api/quotes/random')` 返回 data 字段
  - **依赖**: 1.4 + 2.4（需要后端 login 端点可用）

- [ ] 3.2 创建 `packages/miniapp/utils/auth.js`
  - **写入范围**: `login()` 函数 — wx.login 获取 code → POST /api/auth/login → Storage 存 token → app.globalData 存 userInfo
  - **验证**: 调用 `login()` 后 Storage 中存在 token
  - **依赖**: 3.1

- [ ] 3.3 更新 `packages/miniapp/app.js`
  - **写入范围**: onLaunch 中调用 `auth.login()`，globalData 声明 `userInfo`、`token`
  - **验证**: 小程序启动后 globalData.token 非空
  - **依赖**: 3.2

- [ ] 3.4 更新 `packages/miniapp/app.wxss`
  - **写入范围**: 全局样式重置、TDesign 主题色 CSS 变量覆盖（--td-brand-color 等）
  - **验证**: 页面中 TDesign 组件使用自定义主题色
  - **依赖**: 1.4

---

## Phase 4: 前端页面（全部依赖 Phase 3，内部 5 个页面可并行）

- [ ] 4.1 研友圈首页 `pages/index/`
  - **写入范围**: index.js/wxml/wxss/json — TDesign `t-tabs` 分类切换 + 帖子列表 + 悬浮发帖按钮 + 触底分页
  - **数据流**: onLoad → api.get('/api/posts') → setData；onReachBottom → 追加下一页
  - **验证**: 进入页面显示帖子列表，切换分类刷新，触底加载更多
  - **依赖**: Phase 3

- [ ] 4.2 帖子卡片组件 `components/post-card/`
  - **写入范围**: post-card.js/wxml/wxss/json — 接收 post 对象作为 property，展示头像/昵称/时间/分类/摘要/图片/点赞数
  - **验证**: 传入 mock post 数据，卡片正确渲染
  - **依赖**: 1.4（TDesign 可用）
  - **可并行**: 与 3.x 并行

- [ ] 5.1 发帖页 `pages/post-create/`
  - **写入范围**: create.js/wxml/wxss/json — `t-textarea` + `t-picker` + 图片网格 + 发布按钮
  - **数据流**: 选图 → 逐张 api.post('/api/upload') → 拿到 url[] → api.post('/api/posts') → navigateBack
  - **验证**: 填写内容 → 选分类 → 添加图片 → 发布成功 → 返回首页列表刷新
  - **依赖**: Phase 3

- [ ] 6.1 帖子详情页 `pages/post-detail/`
  - **写入范围**: detail.js/wxml/wxss/json — 完整正文 + 大图预览 + 作者信息 + 点赞按钮 + 评论列表 + 底部评论输入框
  - **数据流**: onLoad(postId) → api.get('/api/posts/:id') + api.get('/api/posts/:id/comments') → setData
  - **验证**: 进入详情显示完整帖子，点赞切换正常，评论即时显示
  - **依赖**: Phase 3

- [ ] 7.1 备考时钟页 `pages/clock/`
  - **写入范围**: clock.js/wxml/wxss/json — 倒计时卡片 + 名言卡片 + 打卡按钮
  - **数据流**: onShow → 读 Storage(checkedDate) 置灰按钮 → api.get('/api/checkin/today') 核对 → api.get('/api/quotes/random')
  - **验证**: 显示倒计时天数、名言、打卡按钮可用
  - **依赖**: Phase 3

- [ ] 7.2 打卡交互
  - **写入范围**: clock.js 中的 checkIn 方法 — api.post('/api/checkin') → Storage 写入 → 按钮置灰 → t-toast 提示
  - **验证**: 首次打卡成功，再次进入按钮已置灰
  - **依赖**: 7.1

- [ ] 8.1 个人中心页 `pages/profile/`
  - **写入范围**: profile.js/wxml/wxss/json — 用户信息卡 + `t-grid` 数据看板 + 我的帖子列表
  - **数据流**: onShow → api.get('/api/user/profile') + api.get('/api/user/posts') → setData
  - **验证**: 显示用户头像昵称、4 项统计数据、我的帖子列表，点击帖子跳转详情
  - **依赖**: Phase 3

---

## Phase 5: 端到端验收

- [ ] 9.1 后端 API 验收
  - **验证动作**: `bun run src/index.ts` 启动 → curl 遍历全部 13 个端点，确认返回 envelope 格式
  - **依赖**: Phase 2

- [ ] 9.2 小程序编译验收
  - **验证动作**: 微信开发者工具打开 `packages/miniapp/` → 编译无报错 → 3 个 Tab 正常切换
  - **依赖**: Phase 4

- [ ] 9.3 完整用户路径验收
  - **验证动作**: 手动走完：打开小程序 → 自动登录 → 浏览研友圈 → 点击帖子看详情 → 点赞评论 → 返回 → 点击"+"发帖（填写+选分类+上传图片+发布）→ 切到备考时钟看倒计时+打卡 → 切到我的看数据看板和发布历史
  - **Review Gate**: 全路径不报错，数据持久化正确
  - **依赖**: 9.1 + 9.2
