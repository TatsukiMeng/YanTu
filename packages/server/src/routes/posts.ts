import { Hono } from 'hono';
import { getPosts, getPostById, createPost } from '../db.js';

const posts = new Hono();

// GET /api/posts — 帖子列表
posts.get('/', (c) => {
  const category = c.req.query('category') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const userId = c.get('userId') as number | undefined;

  const result = getPosts({ category, page, limit, userId });
  return c.json({ code: 0, data: result, msg: 'success' });
});

// POST /api/posts — 发帖
posts.post('/', async (c) => {
  const userId = c.get('userId') as number;
  const { content, category, images } = await c.req.json();

  const id = createPost(userId, content, category, images || []);
  return c.json({ code: 0, data: { id }, msg: 'success' });
});

// GET /api/posts/:id — 帖子详情
posts.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = c.get('userId') as number | undefined;

  const post = getPostById(id, userId);
  if (!post) {
    return c.json({ code: 404, data: null, msg: '帖子不存在' }, 404);
  }
  return c.json({ code: 0, data: post, msg: 'success' });
});

export default posts;
