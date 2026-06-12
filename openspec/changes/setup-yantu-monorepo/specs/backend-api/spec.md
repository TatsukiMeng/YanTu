## ADDED Requirements

### Requirement: SQLite 数据库初始化
后端 SHALL 在启动时通过 `src/db.ts` 自动创建 SQLite 数据库文件并执行建表语句（users, posts, likes, comments, check_ins, quotes），quotes 表 SHALL 预置不少于 10 条种子数据。

#### Scenario: 首次启动自动建表
- **WHEN** 后端首次启动且数据库文件不存在
- **THEN** 自动创建数据库文件和全部 6 张表，quotes 表包含预置名言数据

#### Scenario: 重复启动不重建
- **WHEN** 后端再次启动且数据库文件已存在
- **THEN** 使用 `CREATE TABLE IF NOT EXISTS`，不删除已有数据

### Requirement: API 统一响应信封
所有 API 端点 SHALL 返回统一 JSON 信封格式 `{ code, data, msg }`，其中 `code` 为 0 表示成功，非 0 表示业务错误。

#### Scenario: 成功响应格式
- **WHEN** 请求 GET /api/quotes/random
- **THEN** 返回 `{ code: 0, data: { text, author }, msg: "success" }`

#### Scenario: 错误响应格式
- **WHEN** 无 token 访问受保护端点
- **THEN** 返回 `{ code: 401, data: null, msg: "未授权" }`

### Requirement: RESTful API 端点
后端 SHALL 提供以下 RESTful API 端点：

| 方法 | 路径 | 认证 |
|------|------|------|
| POST | /api/auth/login | 无（测试号本地模式，以 code 模拟 openid） |
| GET | /api/posts | 无 |
| POST | /api/posts | JWT |
| GET | /api/posts/:id | 无 |
| POST | /api/posts/:id/like | JWT |
| GET | /api/posts/:id/comments | 无 |
| POST | /api/posts/:id/comments | JWT |
| POST | /api/checkin | JWT |
| GET | /api/checkin/today | JWT |
| GET | /api/quotes/random | 无 |
| GET | /api/user/profile | JWT |
| GET | /api/user/posts | JWT |
| POST | /api/upload | JWT |

#### Scenario: 全部端点可访问
- **WHEN** 后端启动后通过 curl 逐个访问全部 13 个端点
- **THEN** 每个端点返回符合信封格式的 JSON 响应和正确的 HTTP 状态码

### Requirement: 帖子列表接口
GET /api/posts SHALL 支持通过 `category` 参数筛选分类（全部/数学/英语/政治/专业课/经验分享），通过 `page` 和 `limit` 参数分页，按创建时间倒序返回。每条帖子 SHALL 包含作者信息（nick_name, avatar_url）、点赞数和当前用户是否已点赞。

#### Scenario: 按分类筛选
- **WHEN** 请求 `GET /api/posts?category=数学`
- **THEN** 返回分类为"数学"的帖子列表，每条包含 author 和 like_count

#### Scenario: 分页加载
- **WHEN** 请求 `GET /api/posts?page=2&limit=10`
- **THEN** 返回第 11-20 条帖子，响应包含 total 和 page 字段

#### Scenario: 包含点赞状态
- **WHEN** 已登录用户请求帖子列表
- **THEN** 每条帖子包含 `liked_by_me` 布尔字段

### Requirement: 图片上传接口
POST /api/upload SHALL 接受 multipart/form-data 图片文件，存储到本地 `uploads/` 目录，返回可通过 HTTP 访问的图片 URL。

#### Scenario: 上传图片成功
- **WHEN** POST 上传一张 PNG 图片
- **THEN** 图片存储到 uploads 目录，响应包含 `{ url: "/uploads/<filename>" }`

#### Scenario: 上传文件可通过 HTTP 访问
- **WHEN** 上传成功后通过 GET 请求返回的 URL
- **THEN** 可正常获取图片

### Requirement: JWT 鉴权中间件
需要身份验证的 API 端点 SHALL 通过 JWT Bearer token 进行鉴权。中间件 SHALL 从 token 中提取 `userId` 并存入请求上下文。

#### Scenario: 无 token 访问受保护接口
- **WHEN** 不携带 Authorization header 访问 POST /api/posts
- **THEN** 返回 HTTP 401 和信封 `{ code: 401, msg: "未授权" }`

#### Scenario: 有效 token 访问
- **WHEN** 携带有效 Bearer token 访问受保护接口
- **THEN** 正常处理请求，响应 code 为 0

#### Scenario: 过期 token
- **WHEN** 携带已过期 token 访问受保护接口
- **THEN** 返回 HTTP 401

### Requirement: SQL 参数化查询
后端所有涉及用户输入的 SQL 查询 SHALL 使用参数化查询（`?` 占位符），不允许字符串拼接 SQL。

#### Scenario: 防注入
- **WHEN** 用户输入包含 SQL 特殊字符（如 `' OR 1=1 --`）作为搜索或筛选条件
- **THEN** 查询正常执行，不会被注入非预期 SQL

### Requirement: CORS 配置
后端 SHALL 配置 CORS 中间件，允许小程序端跨域访问 API 端点。

#### Scenario: 小程序端请求不被 CORS 拦截
- **WHEN** 小程序通过 wx.request 请求后端 API
- **THEN** 请求正常处理，不返回 CORS 错误
