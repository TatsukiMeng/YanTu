import { Hono } from 'hono';
import { checkIn, getTodayCheckIn } from '../db.js';

const checkin = new Hono();

// POST /api/checkin
checkin.post('/', (c) => {
  const userId = c.get('userId') as number;
  checkIn(userId);
  return c.json({ code: 0, data: { success: true }, msg: 'success' });
});

// GET /api/checkin/today
checkin.get('/today', (c) => {
  const userId = c.get('userId') as number;
  const checked = getTodayCheckIn(userId);
  return c.json({ code: 0, data: { checked }, msg: 'success' });
});

export default checkin;
