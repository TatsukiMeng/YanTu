import { Hono } from 'hono';
import { getUserById, getUserStats, getUserPosts, updateUser } from '../db.js';

const user = new Hono();

// GET /api/user/profile
user.get('/profile', (c) => {
  const userId = c.get('userId') as number;
  const userInfo = getUserById(userId);
  const stats = getUserStats(userId);
  return c.json({
    code: 0,
    data: {
      userInfo: {
        id: userInfo.id,
        nick_name: userInfo.nick_name,
        avatar_url: userInfo.avatar_url,
        level: userInfo.level,
      },
      stats,
    },
    msg: 'success',
  });
});

// GET /api/user/posts
user.get('/posts', (c) => {
  const userId = c.get('userId') as number;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const result = getUserPosts(userId, page, limit);
  return c.json({ code: 0, data: result, msg: 'success' });
});

// PUT /api/user/profile — 更新头像昵称
user.put('/profile', async (c) => {
  const userId = c.get('userId') as number;
  const { nick_name, avatar_url } = await c.req.json();
  updateUser(userId, { nick_name, avatar_url });
  const userInfo = getUserById(userId);
  return c.json({
    code: 0,
    data: {
      id: userInfo.id,
      nick_name: userInfo.nick_name,
      avatar_url: userInfo.avatar_url,
      level: userInfo.level,
    },
    msg: 'success',
  });
});

export default user;
