/**
 * 给指定用户补一段连续打卡历史（仅开发用）。
 *
 * 用法：
 *   bun run scripts/seed-my-checkin.ts                  # 默认给最近的本地用户补 14 天
 *   bun run scripts/seed-my-checkin.ts 30               # 补 30 天
 *   bun run scripts/seed-my-checkin.ts 18 14            # 给 user_id=18 补 14 天
 *   bun run scripts/seed-my-checkin.ts 18 14 --random   # 随机漏 30% 的天（更真实）
 */
import { getDb } from '../src/db';

const db = getDb();

const args = process.argv.slice(2);
const randomMode = args.includes('--random');

let userId: number;
let days: number;

if (args.length >= 2 && !args[0].startsWith('--')) {
  userId = parseInt(args[0], 10);
  days = parseInt(args[1], 10);
} else if (args.length >= 1 && !args[0].startsWith('--')) {
  days = parseInt(args[0], 10);
  // 没指定 userId，挑最近的本地用户
  const latest = db.query(
    "SELECT id, nick_name FROM users WHERE openid LIKE 'mock_local_%' ORDER BY id DESC LIMIT 1"
  ).get() as { id: number; nick_name: string } | undefined;
  if (!latest) {
    console.error('❌ 没找到本地用户，请先在小程序登录一次');
    process.exit(1);
  }
  userId = latest.id;
  console.log(`📌 自动选择最近的本地用户: id=${userId} (${latest.nick_name})`);
} else {
  days = 14;
  const latest = db.query(
    "SELECT id, nick_name FROM users WHERE openid LIKE 'mock_local_%' ORDER BY id DESC LIMIT 1"
  ).get() as { id: number; nick_name: string } | undefined;
  if (!latest) {
    console.error('❌ 没找到本地用户，请先在小程序登录一次');
    process.exit(1);
  }
  userId = latest.id;
  console.log(`📌 自动选择最近的本地用户: id=${userId} (${latest.nick_name})`);
}

const insert = db.prepare(
  'INSERT OR IGNORE INTO check_ins (user_id, check_date) VALUES (?, ?)'
);

const now = new Date();
let inserted = 0;
let skipped = 0;

// 从昨天往前补 days 天（不含今天，避免覆盖今天的真实打卡）
for (let i = 1; i <= days; i++) {
  // random 模式下，约 30% 概率跳过（模拟偶尔忘打卡）
  if (randomMode && Math.random() < 0.3) {
    skipped++;
    continue;
  }
  const d = new Date(now.getTime() - i * 86400000);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const before = (db.query('SELECT COUNT(*) as c FROM check_ins WHERE user_id = ?').get(userId) as any).c;
  insert.run(userId, dateStr);
  const after = (db.query('SELECT COUNT(*) as c FROM check_ins WHERE user_id = ?').get(userId) as any).c;
  if (after > before) inserted++;
}

const total = (db.query('SELECT COUNT(*) as c FROM check_ins WHERE user_id = ?').get(userId) as any).c;
console.log(`\n✅ 给用户 ${userId} 补打卡完成`);
console.log(`   本次新增: ${inserted} 天`);
console.log(`   跳过(已存在或随机跳过): ${skipped} 天`);
console.log(`   用户总打卡数: ${total}`);
console.log(`\n💡 现在去小程序的"备考时钟"页面，streak 和日历应该都有数据了`);
