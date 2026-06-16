import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { absUrl, absUrls } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'yantu.db');

let db: Database;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true });
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');
    initTables();
    seedQuotes();
  }
  return db;
}

function initTables() {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, openid TEXT NOT NULL UNIQUE, nick_name TEXT NOT NULL DEFAULT \'微信用户\', avatar_url TEXT NOT NULL DEFAULT \'\', level INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
  db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), content TEXT NOT NULL, category TEXT NOT NULL, images TEXT NOT NULL DEFAULT \'[]\', created_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
  db.run('CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), post_id INTEGER NOT NULL REFERENCES posts(id), created_at TEXT NOT NULL DEFAULT (datetime(\'now\')), UNIQUE(user_id, post_id))');
  db.run('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), post_id INTEGER NOT NULL REFERENCES posts(id), content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime(\'now\')))');
  db.run('CREATE TABLE IF NOT EXISTS check_ins (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), check_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime(\'now\')), UNIQUE(user_id, check_date))');
  db.run('CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, author TEXT NOT NULL DEFAULT \'考研能量站\')');
}

function seedQuotes() {
  const count = db.query('SELECT COUNT(*) as c FROM quotes').get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare('INSERT INTO quotes (text, author) VALUES (?, ?)');
  const quotes = [
    ['不积跬步，无以至千里；不积小流，无以成江海。', '荀子'],
    ['锲而不舍，金石可镂。', '荀子'],
    ['宝剑锋从磨砺出，梅花香自苦寒来。', '古训'],
    ['天行健，君子以自强不息。', '周易'],
    ['书山有路勤为径，学海无涯苦作舟。', '韩愈'],
    ['路漫漫其修远兮，吾将上下而求索。', '屈原'],
    ['千淘万漉虽辛苦，吹尽狂沙始到金。', '刘禹锡'],
    ['博观而约取，厚积而薄发。', '苏轼'],
    ['有志者事竟成，破釜沉舟，百二秦关终属楚。', '蒲松龄'],
    ['苦心人天不负，卧薪尝胆，三千越甲可吞吴。', '蒲松龄'],
    ['黑发不知勤学早，白首方悔读书迟。', '颜真卿'],
    ['业精于勤荒于嬉，行成于思毁于随。', '韩愈'],
  ];
  for (const [text, author] of quotes) {
    insert.run(text, author);
  }
}

// User queries
export function findUserByOpenid(openid: string) {
  return getDb().prepare('SELECT * FROM users WHERE openid = ?').get(openid) as any | undefined;
}

export function createUser(openid: string) {
  const result = getDb().prepare('INSERT INTO users (openid) VALUES (?)').run(openid);
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
}

export function updateUser(id: number, data: { nick_name?: string; avatar_url?: string }) {
  const sets: string[] = [];
  const values: any[] = [];
  if (data.nick_name !== undefined) { sets.push('nick_name = ?'); values.push(data.nick_name); }
  if (data.avatar_url !== undefined) { sets.push('avatar_url = ?'); values.push(data.avatar_url); }
  if (sets.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

export function getUserById(id: number) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as any | undefined;
}

// Post queries
export function getPosts(params: { category?: string; page: number; limit: number; userId?: number }) {
  const { category, page, limit, userId } = params;
  const offset = (page - 1) * limit;

  let where = '';
  const args: any[] = [];
  if (category && category !== '全部') {
    where = 'WHERE p.category = ?';
    args.push(category);
  }

  const posts = getDb().prepare(`
    SELECT p.*, u.nick_name as author_name, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      ${userId ? `, (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as liked_by_me` : ', 0 as liked_by_me'}
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...(userId ? [userId, ...args, limit, offset] : [...args, limit, offset])) as any[];

  const total = getDb().prepare(`SELECT COUNT(*) as c FROM posts p ${where}`).get(...args) as { c: number };

  return {
    list: posts.map(p => ({
      id: p.id,
      content: p.content,
      category: p.category,
      images: absUrls(JSON.parse(p.images)),
      created_at: p.created_at,
      author: { id: p.user_id, nick_name: p.author_name, avatar_url: absUrl(p.author_avatar) },
      like_count: p.like_count,
      liked_by_me: p.liked_by_me > 0,
    })),
    total: total.c,
    page,
  };
}

export function getPostById(id: number, userId?: number) {
  const post = getDb().prepare(`
    SELECT p.*, u.nick_name as author_name, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
      ${userId ? `, (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as liked_by_me` : ', 0 as liked_by_me'}
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ${userId ? '?' : '?'}
  `).get(...(userId ? [userId, id] : [id])) as any;

  if (!post) return null;
  return {
    id: post.id,
    content: post.content,
    category: post.category,
    images: absUrls(JSON.parse(post.images)),
    created_at: post.created_at,
    author: { id: post.user_id, nick_name: post.author_name, avatar_url: absUrl(post.author_avatar) },
    like_count: post.like_count,
    liked_by_me: post.liked_by_me > 0,
    comment_count: post.comment_count,
  };
}

export function createPost(userId: number, content: string, category: string, images: string[]) {
  const result = getDb().prepare(
    'INSERT INTO posts (user_id, content, category, images) VALUES (?, ?, ?, ?)'
  ).run(userId, content, category, JSON.stringify(images));
  return result.lastInsertRowid;
}

// Like queries
export function toggleLike(userId: number, postId: number): boolean {
  const existing = getDb().prepare(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);
  if (existing) {
    getDb().prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId);
    return false;
  } else {
    getDb().prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
    return true;
  }
}

// Comment queries
export function getComments(postId: number, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const comments = getDb().prepare(`
    SELECT c.*, u.nick_name, u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(postId, limit, offset) as any[];

  const total = getDb().prepare(
    'SELECT COUNT(*) as c FROM comments WHERE post_id = ?'
  ).get(postId) as { c: number };

  return {
    list: comments.map(c => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user: { id: c.user_id, nick_name: c.nick_name, avatar_url: absUrl(c.avatar_url) },
    })),
    total: total.c,
  };
}

export function createComment(userId: number, postId: number, content: string) {
  const result = getDb().prepare(
    'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)'
  ).run(userId, postId, content);
  return result.lastInsertRowid;
}

// Check-in queries
export function checkIn(userId: number) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    getDb().prepare('INSERT INTO check_ins (user_id, check_date) VALUES (?, ?)').run(userId, today);
    return true;
  } catch {
    return false;
  }
}

export function getTodayCheckIn(userId: number) {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb().prepare(
    'SELECT id FROM check_ins WHERE user_id = ? AND check_date = ?'
  ).get(userId, today);
  return !!row;
}

// Quote queries
export function getRandomQuote() {
  return getDb().prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get() as any;
}

// User stats
export function getUserStats(userId: number) {
  const db = getDb();
  const [checkIns, posts, comments, likes] = [
    db.prepare('SELECT COUNT(*) as c FROM check_ins WHERE user_id = ?').get(userId) as { c: number },
    db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(userId) as { c: number },
    db.prepare('SELECT COUNT(*) as c FROM comments WHERE user_id = ?').get(userId) as { c: number },
    db.prepare(`SELECT COUNT(*) as c FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)`).get(userId) as { c: number },
  ];
  return {
    checkInDays: checkIns.c,
    postCount: posts.c,
    commentCount: comments.c,
    likeCount: likes.c,
  };
}

export function getUserPosts(userId: number, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const posts = getDb().prepare(`
    SELECT p.*, u.nick_name as author_name, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as liked_by_me
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, userId, limit, offset) as any[];

  const total = getDb().prepare(
    'SELECT COUNT(*) as c FROM posts WHERE user_id = ?'
  ).get(userId) as { c: number };

  return {
    list: posts.map(p => ({
      id: p.id,
      content: p.content,
      category: p.category,
      images: absUrls(JSON.parse(p.images)),
      created_at: p.created_at,
      author: { id: p.user_id, nick_name: p.author_name, avatar_url: absUrl(p.author_avatar) },
      like_count: p.like_count,
      liked_by_me: p.liked_by_me > 0,
    })),
    total: total.c,
  };
}
