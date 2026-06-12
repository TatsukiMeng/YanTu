import { Hono } from 'hono';
import { findUserByOpenid, createUser } from '../db.js';
import { signToken } from '../middleware/auth.js';

const auth = new Hono();

auth.post('/login', async (c) => {
  const { code } = await c.req.json();

  // 测试号本地模式：直接用 code 模拟 openid
  const openid = `mock_${code}`;

  let user = findUserByOpenid(openid);
  if (!user) {
    user = createUser(openid);
  }

  const token = signToken(user.id);

  return c.json({
    code: 0,
    data: {
      token,
      userInfo: {
        id: user.id,
        nick_name: user.nick_name,
        avatar_url: user.avatar_url,
        level: user.level,
      },
    },
    msg: 'success',
  });
});

export default auth;
