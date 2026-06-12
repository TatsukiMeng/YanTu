import { Hono } from 'hono';
import { toggleLike } from '../db.js';

const likes = new Hono();

// POST /api/posts/:id/like
likes.post('/:id/like', (c) => {
  const userId = c.get('userId') as number;
  const postId = parseInt(c.req.param('id'));
  const liked = toggleLike(userId, postId);
  return c.json({ code: 0, data: { liked }, msg: 'success' });
});

export default likes;
