## ADDED Requirements

### Requirement: 微信登录
小程序 SHALL 在 `app.js` 的 `onLaunch` 中调用 `wx.login()` 获取临时 code，通过 `utils/api.js` 发送到后端 `POST /api/auth/login` 换取 JWT token。后端使用测试号本地模式，不走微信 code2session，直接以 code 值作为模拟 openid 查询/创建用户记录。token SHALL 存储到 `wx.Storage` 和 `app.globalData.token`。

#### Scenario: 首次打开小程序自动登录
- **WHEN** 用户首次打开小程序
- **THEN** 自动完成 wx.login → 后端用 code 模拟 openid 创建/查询用户 → 签发 JWT → Storage 存储流程

#### Scenario: 再次打开小程序复用 token
- **WHEN** 用户再次打开小程序且 Storage 中 token 未过期
- **THEN** 使用已有 token，不重新调用后端登录

#### Scenario: token 过期自动重新登录
- **WHEN** Storage 中 token 已过期，API 返回 401
- **THEN** `utils/api.js` 自动触发 wx.login → 重新换 token → 重放原请求（仅重试一次）

### Requirement: 头像昵称授权
用户首次进行互动操作（发帖/评论/打卡）时，若 `app.globalData.userInfo` 为空，SHALL 使用微信头像昵称填写能力（`<button open-type="chooseAvatar">` + `<input type="nickname">`）获取用户信息，并调用后端更新用户记录。

#### Scenario: 首次发帖触发授权
- **WHEN** 用户首次点击发帖且 `app.globalData.userInfo` 为空
- **THEN** 展示头像昵称填写界面，用户填写后信息更新到后端和本地

#### Scenario: 已授权用户跳过
- **WHEN** 已授权用户点击发帖且 `app.globalData.userInfo` 非空
- **THEN** 直接进入发帖页，不重复拉起授权

### Requirement: 未授权浏览
未登录或未授权用户 SHALL 可浏览帖子列表、帖子详情和备考时钟倒计时，但 SHALL 不可发帖、评论、点赞或打卡。

#### Scenario: 未授权用户浏览帖子
- **WHEN** 未授权用户打开研友圈
- **THEN** 可正常浏览帖子列表和帖子详情

#### Scenario: 未授权用户操作被拦截
- **WHEN** 未授权用户点击点赞按钮或评论发送
- **THEN** 拉起登录/授权流程

### Requirement: 统一请求层
小程序端所有 API 请求 SHALL 通过 `utils/api.js` 发出，不直接在页面或组件中调用 `wx.request`。请求层 SHALL 负责 baseURL 拼接、token 注入、响应 envelope 解析和 401 自动重登录。

#### Scenario: 请求自动注入 token
- **WHEN** 调用 `api.post('/api/posts', data)`
- **THEN** 请求自动携带 `Authorization: Bearer <token>` header

#### Scenario: 响应自动解析 envelope
- **WHEN** 后端返回 `{ code: 0, data: { ... }, msg: "success" }`
- **THEN** `api.js` 返回 `data` 部分，调用方不接触 envelope 结构

#### Scenario: 401 自动重试
- **WHEN** 后端返回 401 且非登录接口
- **THEN** `api.js` 自动执行重新登录流程并重放原请求（仅一次）
