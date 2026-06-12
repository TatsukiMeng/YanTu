## ADDED Requirements

### Requirement: Monorepo 项目结构
项目 SHALL 使用 npm workspaces 管理 Monorepo，包含 `packages/miniapp`（微信小程序）和 `packages/server`（Bun+Hono 后端）两个 workspace。根目录 SHALL 只包含 workspace 配置、OpenSpec 和协作文档，不包含业务代码。

#### Scenario: workspace 可识别
- **WHEN** 在项目根目录执行 `npm ls --workspaces`
- **THEN** 输出包含 `miniapp` 和 `server` 两个 workspace

#### Scenario: 根目录无业务代码
- **WHEN** 在项目根目录执行 `ls`
- **THEN** 不存在 `pages/`、`utils/`、`app.js` 等小程序业务文件

### Requirement: 小程序代码迁移
现有小程序脚手架代码（pages/utils/app.js/app.json/app.wxss/project.config.json/sitemap.json）SHALL 迁移至 `packages/miniapp/` 目录下，原位置文件 SHALL 删除。

#### Scenario: 迁移后小程序可编译
- **WHEN** 在微信开发者工具中打开 `packages/miniapp/` 目录
- **THEN** 小程序可正常编译预览，无文件缺失错误

#### Scenario: 原位置已清理
- **WHEN** 在项目根目录检查原文件
- **THEN** `pages/`、`utils/`、`app.js`、`app.json`、`app.wxss` 不存在

### Requirement: TDesign 组件库集成
小程序 SHALL 使用 TDesign 微信小程序组件库，通过 npm 安装并通过微信开发者工具「构建 npm」生成 `miniprogram_npm/` 目录。

#### Scenario: TDesign 组件可声明
- **WHEN** 在页面 JSON 中配置 `"usingComponents": { "t-button": "tdesign-miniprogram/button/button" }`
- **THEN** WXML 中使用 `<t-button>` 可正常渲染

#### Scenario: 主题色可覆盖
- **WHEN** 在 `app.wxss` 中定义 TDesign CSS 变量（如 `--td-brand-color`）
- **THEN** 全局 TDesign 组件使用自定义主题色

### Requirement: 后端项目初始化
`packages/server/` SHALL 初始化为 Bun + Hono + TypeScript 项目，依赖 hono、better-sqlite3、jsonwebtoken，支持通过 `.env` 文件配置环境变量。

#### Scenario: 后端可启动
- **WHEN** 在 `packages/server/` 下执行 `bun run src/index.ts`
- **THEN** 服务在配置端口启动，控制台输出启动日志

#### Scenario: 端口可配置
- **WHEN** 在 `packages/server/` 下配置 `PORT=3001`
- **THEN** 后端启动时读取配置，监听 3001 端口
