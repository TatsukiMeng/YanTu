import { Hono } from 'hono';
import { getComments, createComment } from '../db.js';

const comments = new Hono();

// GET /api/posts/:id/comments
comments.get('/:id/comments', (c) => {
  const postId = parseInt(c.req.param('id'));
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const result = getComments(postId, page, limit);
  return c.json({ code: 0, data: result, msg: 'success' });
});

// POST /api/posts/:id/comments
comments.post('/:id/comments', async (c) => {
  const userId = c.get('userId') as number;
  const postId = parseInt(c.req.param('id'));
  const { content } = await c.req.json();
  const id = createComment(userId, postId, content);
  return c.json({ code: 0, data: { id }, msg: 'success' });
});

export default comments;
