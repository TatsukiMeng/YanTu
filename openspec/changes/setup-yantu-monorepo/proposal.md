# Change: 初始化研途 Monorepo 全栈项目

## Why Now
研途项目当前处于空白起步阶段——小程序端仅有微信开发者工具生成的脚手架（index/logs 两页），后端不存在。PRD 已完成，功能范围已锁定到 MVP，技术选型已确定（Bun + Hono + SQLite 后端、微信原生小程序 + TDesign 前端），没有可以继续推迟的理由。

## 当前缺口
- **无后端**：PRD 原设计依赖微信云开发 CloudBase，但实际需求是自托管 API，需从零搭建。
- **无认证体系**：CloudBase 的 `_openid` 天然鉴权不可用，需要自行实现 JWT 认证。
- **无业务页面**：小程序只有脚手架页面，所有 Tab 页、二级页、组件均不存在。
- **无 Monorepo 结构**：当前所有文件平铺在根目录，前后端代码未隔离。
- **无请求层抽象**：小程序端没有统一的 API 请求封装，无法注入 token 和处理通用响应。

## What Changes
- **搭建 Monorepo**：npm workspaces 管理 `packages/miniapp`（微信小程序）+ `packages/server`（Bun+Hono 后端），迁移现有脚手架文件。
- **后端 API 服务**：Hono 路由 + SQLite 持久化，覆盖用户、帖子、点赞、评论、打卡、名言、上传共 13 个端点。
- **JWT 认证**：微信 code2session 换取 openid → 签发 JWT → 小程序 Bearer token 鉴权。
- **小程序前端**：5 个页面（研友圈首页 / 发帖 / 帖子详情 / 备考时钟 / 个人中心），使用 TDesign 组件库。
- **统一请求层**：小程序端封装 `utils/api.js`，统一 baseURL、token 注入和响应解析，页面和组件不直接调用 `wx.request`。

## 影响范围

| 维度 | 影响 |
|------|------|
| 小程序端 | 全部页面新建；公共层（api.js / auth.js / app.js）重写 |
| 后端 | 从零搭建，无既有代码影响 |
| API 契约 | 新建全部 RESTful 端点，定义请求/响应格式 |
| 状态管理 | 小程序端区分三类状态：服务端数据（通过 api.js 请求）、页面局部状态（data）、全局用户状态（app.globalData + Storage） |
| 登录/Session | wx.login → code → 后端换 JWT → Storage 持久化 token；token 过期后静默重新 wx.login |
| 权限 | 未登录可浏览，需登录才能发帖/评论/点赞/打卡；后端 JWT 中间件统一拦截 |
| 缓存 | 打卡状态使用 Storage + API 双重校验；其他数据不缓存 |

## Non-Goals（本轮不做）
- 错误重试、fallback 机制、网络断线提示
- 单元测试、集成测试、E2E 测试
- CI/CD 流水线
- 消息推送、运营管理后台
- AI 问答功能
- 院校圈、分数线查询
- 收藏、二级评论、搜索、关注、匿名发帖、热门排序（PRD 增强功能）
- 服务端日志、审计、可观测性
- 图片压缩、CDN 分发
- 多语言、无障碍适配

## 风险边界
- **SQLite 并发**：单用户演示场景无并发问题；如果开放多用户测试，写入可能成为瓶颈。
- **AppSecret 安全**：测试号不走 code2session，无需 AppSecret。后端用 wx.login code 模拟 openid。
- **图片存储**：本地文件系统存储，无 CDN；演示环境可接受，生产不可。
- **Token 过期**：JWT 无刷新机制，过期后需重新 wx.login；小程序使用周期短，影响有限。
- **无测试**：纯手动验收，后续变更无回归保障。
