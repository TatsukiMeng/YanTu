import { Hono } from 'hono';
import { writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const UPLOAD_DIR = join(__dirname, '..', 'uploads');

const upload = new Hono();

// POST /api/upload
upload.post('/', async (c) => {
  mkdirSync(UPLOAD_DIR, { recursive: true });

  const body = await c.req.parseBody();
  const file = body['file'] as File;

  if (!file) {
    return c.json({ code: 400, data: null, msg: '请上传文件' }, 400);
  }

  const ext = extname(file.name) || '.png';
  const filename = `${randomUUID()}${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const buffer = await file.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buffer));

  return c.json({ code: 0, data: { url: `/uploads/${filename}` }, msg: 'success' });
});

export default upload;
