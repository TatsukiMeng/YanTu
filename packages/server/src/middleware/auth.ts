import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'yantu-dev-secret';

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ code: 401, data: null, msg: '未授权' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ code: 401, data: null, msg: 'token 无效或已过期' }, 401);
  }

  c.set('userId', payload.userId);
  await next();
}
