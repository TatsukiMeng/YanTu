## ADDED Requirements

### Requirement: 个人信息展示
个人中心页 SHALL 展示当前用户的头像、昵称和等级徽章。用户信息通过 `GET /api/user/profile` 获取。

#### Scenario: 显示用户信息
- **WHEN** 进入个人中心页面
- **THEN** 显示用户头像、昵称和等级

#### Scenario: 未登录状态
- **WHEN** 未登录用户进入个人中心
- **THEN** 显示默认头像和"点击登录"提示

### Requirement: 数据看板
个人中心 SHALL 展示四项数据看板：累计打卡天数、我的发布数、我的评论数、获赞数。后端 SHALL 在单次 `GET /api/user/profile` 请求中通过并行查询（`Promise.all` 或等效方式）返回全部四项统计数据。

#### Scenario: 显示看板数据
- **WHEN** 已登录用户进入个人中心页面
- **THEN** 四项统计数据在一次 API 请求后全部展示

#### Scenario: 数据与操作联动
- **WHEN** 用户在研友圈发帖后切到个人中心
- **THEN** "我的发布"数字 +1

### Requirement: 发布历史
个人中心 SHALL 展示当前用户的帖子列表（按时间倒序，支持分页），点击帖子 SHALL 跳转到帖子详情页。数据通过 `GET /api/user/posts` 获取。

#### Scenario: 查看发布历史
- **WHEN** 个人中心页面加载完成
- **THEN** 显示当前用户的帖子列表

#### Scenario: 跳转帖子详情
- **WHEN** 点击发布历史中的某条帖子
- **THEN** 携带 postId 跳转到帖子详情页

#### Scenario: 无帖子空态
- **WHEN** 当前用户未发布过帖子
- **THEN** 显示"暂无发布"空态提示

#### Scenario: 发布历史分页
- **WHEN** 滚动到列表底部且还有更多数据
- **THEN** 自动加载下一页
