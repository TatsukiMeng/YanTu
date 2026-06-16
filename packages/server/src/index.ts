import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { authMiddleware, signToken } from './middleware/auth.js';
import { absUrl } from './config.js';

import './db.js';

const app = new Hono();

app.use('*', cors());

// 静态文件服务：上传的图片
app.use('/uploads/*', serveStatic({ root: './' }));

// 公开端点
app.post('/api/auth/login', async (c) => {
  const { findUserByOpenid, createUser } = await import('./db.js');
  const { code, localUserId } = await c.req.json();
  // 测试号没有 AppSecret，无法用 code 换 openid
  // 优先用小程序本地生成的 localUserId 做稳定标识，否则退回 code（每次都变）
  const openid = localUserId ? `mock_${localUserId}` : `mock_${code}`;
  let user = findUserByOpenid(openid);
  if (!user) user = createUser(openid);
  const token = signToken(user.id);
  return c.json({
    code: 0,
    data: {
      token,
      userInfo: { id: user.id, nick_name: user.nick_name, avatar_url: absUrl(user.avatar_url), level: user.level },
    },
    msg: 'success',
  });
});

app.get('/api/quotes/random', async (c) => {
  const { getRandomQuote } = await import('./db.js');
  const quote = getRandomQuote();
  return c.json({ code: 0, data: { text: quote.text, author: quote.author }, msg: 'success' });
});
app.post('/api/posts', authMiddleware, async (c) => {
  const userId = c.get('userId') as number;
  const { content, category, images } = await c.req.json();
  const { createPost } = await import('./db.js');
  const id = createPost(userId, content, category, images || []);
  return c.json({ code: 0, data: { id }, msg: 'success' });
});

app.get('/api/posts', async (c) => {
  const { getPosts } = await import('./db.js');
  const category = c.req.query('category') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const result = getPosts({ category, page, limit });
  return c.json({ code: 0, data: result, msg: 'success' });
});

app.get('/api/posts/:id', async (c) => {
  const { getPostById } = await import('./db.js');
  const id = parseInt(c.req.param('id'));
  const post = getPostById(id);
  if (!post) return c.json({ code: 404, data: null, msg: '帖子不存在' }, 404);
  return c.json({ code: 0, data: post, msg: 'success' });
});

// 点赞
app.post('/api/posts/:id/like', authMiddleware, async (c) => {
  const { toggleLike } = await import('./db.js');
  const userId = c.get('userId') as number;
  const postId = parseInt(c.req.param('id'));
  const liked = toggleLike(userId, postId);
  return c.json({ code: 0, data: { liked }, msg: 'success' });
});

// 评论
app.get('/api/posts/:id/comments', async (c) => {
  const { getComments } = await import('./db.js');
  const postId = parseInt(c.req.param('id'));
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const result = getComments(postId, page, limit);
  return c.json({ code: 0, data: result, msg: 'success' });
});

app.post('/api/posts/:id/comments', authMiddleware, async (c) => {
  const { createComment } = await import('./db.js');
  const userId = c.get('userId') as number;
  const postId = parseInt(c.req.param('id'));
  const { content } = await c.req.json();
  const id = createComment(userId, postId, content);
  return c.json({ code: 0, data: { id }, msg: 'success' });
});

// 打卡
app.post('/api/checkin', authMiddleware, async (c) => {
  const { checkIn } = await import('./db.js');
  const userId = c.get('userId') as number;
  checkIn(userId);
  return c.json({ code: 0, data: { success: true }, msg: 'success' });
});

app.get('/api/checkin/today', authMiddleware, async (c) => {
  const { getTodayCheckIn } = await import('./db.js');
  const userId = c.get('userId') as number;
  const checked = getTodayCheckIn(userId);
  return c.json({ code: 0, data: { checked }, msg: 'success' });
});

app.get('/api/checkin/streak', authMiddleware, async (c) => {
  const { getUserStreak } = await import('./db.js');
  const userId = c.get('userId') as number;
  const data = getUserStreak(userId);
  return c.json({ code: 0, data, msg: 'success' });
});

app.get('/api/checkin/calendar', authMiddleware, async (c) => {
  const { getCheckinCalendar } = await import('./db.js');
  const userId = c.get('userId') as number;
  const month = c.req.query('month');
  const now = new Date();
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dates = getCheckinCalendar(userId, month || fallback);
  return c.json({ code: 0, data: { dates }, msg: 'success' });
});

// 用户
app.get('/api/user/profile', authMiddleware, async (c) => {
  const { getUserById, getUserStats } = await import('./db.js');
  const userId = c.get('userId') as number;
  const userInfo = getUserById(userId);
  const stats = getUserStats(userId);
  return c.json({
    code: 0,
    data: {
      userInfo: { id: userInfo.id, nick_name: userInfo.nick_name, avatar_url: absUrl(userInfo.avatar_url), level: userInfo.level },
      stats,
    },
    msg: 'success',
  });
});

app.get('/api/user/posts', authMiddleware, async (c) => {
  const { getUserPosts } = await import('./db.js');
  const userId = c.get('userId') as number;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const result = getUserPosts(userId, page, limit);
  return c.json({ code: 0, data: result, msg: 'success' });
});

app.put('/api/user/profile', authMiddleware, async (c) => {
  const { getUserById, updateUser } = await import('./db.js');
  const userId = c.get('userId') as number;
  const { nick_name, avatar_url } = await c.req.json();
  updateUser(userId, { nick_name, avatar_url });
  const userInfo = getUserById(userId);
  return c.json({
    code: 0,
    data: { id: userInfo.id, nick_name: userInfo.nick_name, avatar_url: absUrl(userInfo.avatar_url), level: userInfo.level },
    msg: 'success',
  });
});

// 上传
app.post('/api/upload', authMiddleware, async (c) => {
  const { writeFileSync, mkdirSync } = await import('fs');
  const { join, extname } = await import('path');
  const { randomUUID } = await import('crypto');
  const { fileURLToPath } = await import('url');

  const __dirname = join(fileURLToPath(import.meta.url), '..');
  const UPLOAD_DIR = join(__dirname, '..', 'uploads');
  mkdirSync(UPLOAD_DIR, { recursive: true });

  const body = await c.req.parseBody();
  const file = body['file'] as File;
  if (!file) return c.json({ code: 400, data: null, msg: '请上传文件' }, 400);

  const ext = extname(file.name) || '.png';
  const filename = `${randomUUID()}${ext}`;
  const filepath = join(UPLOAD_DIR, filename);
  const buffer = await file.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buffer));

  return c.json({ code: 0, data: { url: `/uploads/${filename}` }, msg: 'success' });
});

const port = parseInt(process.env.PORT || '3000');
console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
