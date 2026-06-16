# 研途 YanTu 🎓

考研备考社区小程序 —— 让孤独的考研路有人陪。

研友圈 · 备考时钟 · 个人中心，三大核心模块。包含社区帖子、点赞评论、每日打卡、倒计时激励等功能。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 微信小程序（原生 + TDesign） |
| 后端 | Bun + Hono + SQLite（bun:sqlite） |
| 认证 | JWT（测试号 mock openid 模式） |
| 工程化 | npm workspaces monorepo |

## 项目结构

```
YanTu/
├── packages/
│   ├── miniapp/              # 微信小程序
│   │   ├── app.js / app.json / app.wxss
│   │   ├── pages/            # 5 个页面
│   │   │   ├── index/        # 研友圈（Tab 1）
│   │   │   ├── clock/        # 备考时钟（Tab 2）
│   │   │   ├── profile/      # 我的（Tab 3）
│   │   │   ├── post-create/  # 发帖
│   │   │   └── post-detail/  # 帖子详情
│   │   ├── components/
│   │   │   └── post-card/    # 帖子卡片组件
│   │   ├── utils/
│   │   │   ├── api.js        # 统一请求封装
│   │   │   └── auth.js       # 登录/身份管理
│   │   └── assets/tabbar/    # TabBar 图标
│   │
│   └── server/               # Bun + Hono 后端
│       ├── src/
│       │   ├── index.ts      # 路由入口（13 个 RESTful 接口）
│       │   ├── db.ts         # SQLite 连接 + 查询函数
│       │   ├── config.ts     # 配置 + URL 工具
│       │   └── middleware/auth.ts  # JWT 鉴权中间件
│       ├── scripts/
│       │   ├── seed-mock.ts       # 填充社区模拟数据
│       │   └── seed-my-checkin.ts # 给当前账号补打卡（测试用）
│       └── data/yantu.db     # SQLite 数据库（git 忽略）
│
├── scripts/
│   └── gen-tabbar-icons.py   # 生成 TabBar 图标
│
└── openspec/                  # OpenSpec 设计文档
    └── changes/setup-yantu-monorepo/
```

## 环境要求

- **Node.js** ≥ 18（用于 npm workspaces）
- **Bun** ≥ 1.0（后端运行时）—— [安装指南](https://bun.sh/)
- **微信开发者工具**（最新稳定版）
- **Python 3** + Pillow（可选，仅重新生成 TabBar 图标时需要）

## 快速开始

### 1. 克隆并安装依赖

```bash
git clone https://github.com/TatsukiMeng/YanTu.git
cd YanTu
npm install              # 一次性安装所有 workspace 依赖
```

### 2. 启动后端

```bash
cd packages/server
bun run dev              # 开发模式（文件变化自动重启）
# 或者：bun run start    # 普通启动
```

启动后访问 `http://localhost:3000`。后端默认监听 3000 端口。

健康检查：

```bash
curl http://localhost:3000/api/quotes/random
# {"code":0,"data":{"text":"...","author":"..."},"msg":"success"}
```

### 3. 打开小程序

1. 打开**微信开发者工具**
2. 导入项目 → 选择 `packages/miniapp/` 目录
3. AppID 填测试号（或点击"使用测试号"）
4. 项目会自动读取配置（已关闭域名校验）

## 开发指南

### 后端开发

```bash
cd packages/server
bun run dev              # 热重载模式
```

#### 项目结构

- **路由**：全部内联在 `src/index.ts`，方便快速迭代
- **数据库**：`src/db.ts` 用 `bun:sqlite`，启动时自动建表 + 灌入名言种子数据
- **认证**：JWT，7 天过期，密钥见 `src/middleware/auth.ts`

#### API 端点（13 个）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | ❌ | 登录（mock openid） |
| GET  | `/api/quotes/random` | ❌ | 随机名言 |
| GET  | `/api/posts` | ❌ | 帖子列表（支持分类筛选 + 分页） |
| GET  | `/api/posts/:id` | ❌ | 帖子详情 |
| GET  | `/api/posts/:id/comments` | ❌ | 帖子评论列表 |
| POST | `/api/posts` | ✅ | 发帖 |
| POST | `/api/posts/:id/like` | ✅ | 点赞 / 取消点赞 |
| POST | `/api/posts/:id/comments` | ✅ | 发评论 |
| POST | `/api/checkin` | ✅ | 当日打卡 |
| GET  | `/api/checkin/today` | ✅ | 今日是否已打卡 |
| GET  | `/api/checkin/streak` | ✅ | 连续打卡天数 + 本月打卡率 |
| GET  | `/api/checkin/calendar` | ✅ | 指定月份打卡日期列表 |
| GET  | `/api/user/profile` | ✅ | 个人资料 + 统计 |
| GET  | `/api/user/posts` | ✅ | 我的发布 |
| PUT  | `/api/user/profile` | ✅ | 更新昵称 / 头像 |
| POST | `/api/upload` | ✅ | 上传图片 |

**返回格式（envelope）**：

```json
{ "code": 0, "data": { ... }, "msg": "success" }
```

### 前端开发

直接用微信开发者工具的"编译"按钮即可，无需额外构建步骤。

修改文件后：
- **JS/WXML/WXSS/JSON 变更**：开发者工具自动热重载
- **新增页面/组件**：需要在 `app.json` 或对应页面的 `json` 里注册

#### 关键约定

- 所有 API 调用走 `utils/api.js`（自动注入 token、解析 envelope、401 自动重登）
- 登录态通过 `utils/auth.js` 管理（基于 Storage 的 `localUserId`）
- 图片资源统一在后端做绝对 URL 补全（`config.ts` 的 `absUrl`）

## 测试

### 后端 API 验证

后端跑起来后，用以下命令快速冒烟测试：

```bash
# 1. 登录拿 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"code":"smoke","localUserId":"smoke_test"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

# 2. 列出帖子
curl -s http://localhost:3000/api/posts | python3 -m json.tool

# 3. 发帖（带 token）
curl -s -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"content":"测试帖子","category":"数学","images":[]}'

# 4. 打卡
curl -s -X POST http://localhost:3000/api/checkin \
  -H "Authorization: Bearer $TOKEN"

# 5. 看打卡统计
curl -s http://localhost:3000/api/checkin/streak \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 填充模拟数据

仓库带两个种子脚本，方便你立刻看到"满"的应用：

```bash
cd packages/server

# 1. 填充社区数据：12 个用户 + 36 条帖子 + 88 条评论 + 220 条点赞
bun run scripts/seed-mock.ts

# 2. 给当前账号补打卡历史（测试 streak / 日历热力图）
bun run scripts/seed-my-checkin.ts             # 默认 14 天
bun run scripts/seed-my-checkin.ts 30          # 30 天
bun run scripts/seed-my-checkin.ts 18 14 --random  # 指定用户 + 随机漏打卡
```

两个脚本都是幂等的，可以反复运行。

### 重新生成 TabBar 图标（可选）

如果觉得 TabBar 图标不好看，改完 `scripts/gen-tabbar-icons.py` 后重新跑：

```bash
python3 scripts/gen-tabbar-icons.py
```

需要先安装 Pillow：`pip3 install Pillow`

## 常见问题

### Q: 小程序报 "url not in domain list"

微信开发者工具 → 右上角"详情" → "本地设置" → 勾选"不校验合法域名、web-view、TLS 版本以及 HTTPS 证书"。

配置已经在 `project.private.config.json` 里写好了（`urlCheck: false`），但首次打开项目时仍需手动确认。

### Q: 打卡页 streak 永远是 0

检查是不是每次启动都"换号"了。本项目用 Storage 里的 `localUserId`（首次启动生成）作为稳定标识。如果"清缓存"了，会生成新 localUserId，相当于新用户。

修复：跑一下 `bun run scripts/seed-my-checkin.ts` 给当前账号补打卡。

### Q: 图片加载不出来

后端在所有响应里把图片路径补全为 `http://localhost:3000/uploads/xxx.jpg`。如果看不到图片：

1. 确认后端在跑（`curl http://localhost:3000/api/posts` 应该有响应）
2. 确认开发者工具关闭了域名校验（见上一条）
3. macOS 真机预览需要把 localhost 换成电脑的内网 IP

### Q: 数据库在哪里？怎么看？

`packages/server/data/yantu.db`。被 `.gitignore` 忽略，重启不会丢数据。

查看方式：

```bash
cd packages/server
bun -e "import { getDb } from './src/db'; console.table(getDb().query('SELECT * FROM users').all())"
# 或者用任何 SQLite 客户端（如 DB Browser for SQLite）打开
```

### Q: 如何重置数据库？

```bash
cd packages/server
rm data/yantu.db data/yantu.db-*        # 删除数据库 + WAL 文件
bun run src/index.ts                     # 重启后自动重建 + 灌入名言
bun run scripts/seed-mock.ts             # 重新填充社区数据
```

## 部署

本项目目前定位为**本地开发与课堂演示**，未做生产部署配置。

如需上线：

1. 后端用 HTTPS 域名（不能是 localhost）
2. 在小程序管理后台 → 开发管理 → 服务器域名 → 添加 request 合法域名
3. 真正申请 AppID + AppSecret，把 `mock_${localUserId}` 换成 `code2session` 拿到的真实 openid
4. SQLite 换成 MySQL/PostgreSQL（如果需要多实例）
5. 上传的图片放到对象存储（OSS/COS）

## OpenSpec 设计文档

完整的需求 / 架构 / 任务拆解在 `openspec/changes/setup-yantu-monorepo/` 下：

- `proposal.md` —— 变更提案
- `design.md` —— 技术设计
- `tasks.md` —— 任务清单（含验收标准）
- `specs/` —— 7 个 capability 的 spec deltas

## 路线图

- [x] **Phase 1** Monorepo 基础设施
- [x] **Phase 2** 后端 API（13 个端点）
- [x] **Phase 3** 小程序公共层（api/auth/utils）
- [x] **Phase 4** 前端 5 个页面 + post-card 组件
- [x] **Phase 5** 端到端验证
- [x] **Tier 1 打卡增强** 实时倒计时 + 连续天数 + 日历热力图
- [ ] **Tier 2** 每日学习任务清单 + 可编辑考试日期
- [ ] **Tier 3** 打卡分享卡片 + 排行榜

## License

MIT
