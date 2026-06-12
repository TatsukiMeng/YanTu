## ADDED Requirements

### Requirement: 考研倒计时
备考时钟页 SHALL 大字号显示距离当年考研初试（12 月倒数第二个周六）的剩余天数。目标日期 SHALL 在 `onShow` 中动态计算，不硬编码具体日期。

#### Scenario: 显示倒计时
- **WHEN** 进入备考时钟页面
- **THEN** 显示"距考研还有 XX 天"大字

#### Scenario: 跨年自动切换
- **WHEN** 当前年份的考研日期已过
- **THEN** 自动计算到下一年考研日期的天数

### Requirement: 每日随机名言
备考时钟页 SHALL 每次进入页面从后端 `GET /api/quotes/random` 获取一条随机考研励志名言并展示在卡片中，包含正文和出处。

#### Scenario: 加载名言
- **WHEN** 进入备考时钟页面
- **THEN** 显示一条随机考研励志名言及出处

#### Scenario: 多次进入显示不同名言
- **WHEN** 退出后重新进入备考时钟页面
- **THEN** 显示不同的名言（后端 ORDER BY RANDOM）

### Requirement: 每日能量打卡
用户 SHALL 每日打卡一次。点击打卡按钮后调用 `POST /api/checkin`，后端通过 `check_ins` 表的 `UNIQUE(user_id, check_date)` 约束去重。前端使用 `wx.Storage` 缓存当天打卡状态实现按钮 0 延迟置灰。

#### Scenario: 首次打卡成功
- **WHEN** 用户当天首次点击打卡按钮
- **THEN** t-toast 提示"打卡成功"，按钮置灰，Storage 写入 `{ checkedDate: "YYYY-MM-DD" }`

#### Scenario: Storage 缓存加速
- **WHEN** 用户当天再次进入页面
- **THEN** 先读 Storage，若 checkedDate 为今天则按钮立即置灰，不等待 API

#### Scenario: 后端去重
- **WHEN** 同一用户当天重复调用 POST /api/checkin
- **THEN** 后端 UNIQUE 约束阻止重复插入，返回成功但不新增记录

#### Scenario: 次日打卡恢复
- **WHEN** 第二天进入备考时钟页面
- **THEN** Storage 缓存的 checkedDate 不是今天，按钮恢复可点击状态

#### Scenario: 未登录用户打卡
- **WHEN** 未登录用户点击打卡按钮
- **THEN** 触发登录/授权流程
