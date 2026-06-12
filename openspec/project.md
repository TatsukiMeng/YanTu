# Project Context

## Purpose
研途 (YanTu) — 考研人专属交流社区微信小程序。结合社区交流与备考工具，为考研人提供纯粹、高效、有温度的自律交流空间。

## Tech Stack
- **小程序前端**: 微信原生框架 + TDesign 微信小程序组件库
- **后端**: Bun + Hono + better-sqlite3
- **架构**: Monorepo (npm workspaces)
- **认证**: 微信 OpenID 鉴权

## Project Conventions

### Code Style
- 优先实现功能，不过度考虑兜底、fallback、错误处理
- 不写测试（除非用户明确要求）
- 代码简洁直接，避免过度抽象

### Architecture Patterns
- Monorepo 结构: `packages/miniapp` + `packages/server`
- 小程序通过 HTTP API 与后端通信（替代原 CloudBase）
- 后端 RESTful API，SQLite 单文件数据库

### Git Workflow
- conventional commits

## Domain Context
- 考研：全国硕士研究生统一招生考试
- 研友圈：社区帖子板块，分类包括数学/英语/政治/专业课/经验分享
- 备考时钟：倒计时 + 每日名言 + 能量打卡
- 打卡：每日签到，Storage + DB 双重缓存去重

## Important Constraints
- 期末大作业项目，需在短时间内完成
- 微信小程序 appid: wxf9d1770d37b36e86
- 后端使用 SQLite，无需外部数据库服务
