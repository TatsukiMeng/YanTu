import { getDb } from '../src/db';

const db = getDb();

// ============ 1. 用户数据 ============
const users = [
  { nick_name: '研途学长', avatar: 'https://i.pravatar.cc/150?img=12', level: 6 },
  { nick_name: '数学小王子', avatar: 'https://i.pravatar.cc/150?img=33', level: 4 },
  { nick_name: '英语渣的逆袭', avatar: 'https://i.pravatar.cc/150?img=45', level: 3 },
  { nick_name: '政治背到吐', avatar: 'https://i.pravatar.cc/150?img=20', level: 4 },
  { nick_name: '跨考计算机', avatar: 'https://i.pravatar.cc/150?img=51', level: 2 },
  { nick_name: '二战三跨', avatar: 'https://i.pravatar.cc/150?img=15', level: 5 },
  { nick_name: '上岸冲冲冲', avatar: 'https://i.pravatar.cc/150?img=29', level: 3 },
  { nick_name: '每天背单词', avatar: 'https://i.pravatar.cc/150?img=41', level: 2 },
  { nick_name: '张宇腿部粉丝', avatar: 'https://i.pravatar.cc/150?img=59', level: 4 },
  { nick_name: '汤家凤女孩', avatar: 'https://i.pravatar.cc/150?img=47', level: 3 },
  { nick_name: '肖秀荣的儿子', avatar: 'https://i.pravatar.cc/150?img=60', level: 5 },
  { nick_name: '考研加油生', avatar: 'https://i.pravatar.cc/150?img=68', level: 1 },
];

// ============ 2. 帖子数据 ============
const posts = [
  // 数学
  { idx: 1, category: '数学', content: '今天终于刷完了张宇1000题的第3章，错题率还是好高啊😭 大家有没有同感的？求错题整理方法！', imgs: [] },
  { idx: 1, category: '数学', content: '汤家凤基础班看完啦！高数入门的感觉真好，接下来强化班走起～ 推荐给大家', imgs: [] },
  { idx: 1, category: '数学', content: '求助：极限的ε-δ定义实在看不懂，有没有通俗易懂的解释？书本看了三遍还是懵的', imgs: [] },
  { idx: 8, category: '数学', content: '数学真题2010年第15题，这题怎么做？感觉答案有问题，有大佬帮忙看看吗', imgs: [] },
  { idx: 8, category: '数学', content: '今天做了2小时数学，脑子嗡嗡的。但坚持就是胜利！考研人们加油💪', imgs: [] },
  { idx: 8, category: '数学', content: '【资料分享】整理了一份高数公式大全，包含所有考点，需要的留言', imgs: ['https://picsum.photos/seed/math1/400/300'] },

  // 英语
  { idx: 2, category: '英语', content: '每天背单词150个，已经坚持30天了！考研英语必备App强烈推荐墨墨，简洁好用', imgs: [] },
  { idx: 2, category: '英语', content: '长难句分析第18天，慢慢找到感觉了。例句：It is not easy to explain why... 这个结构大家会拆吗？', imgs: [] },
  { idx: 2, category: '英语', content: '英语阅读真题05年第3篇，错的题都是细节题，定位不准怎么破？', imgs: [] },
  { idx: 9, category: '英语', content: '完型填空终于突破了！秘诀就是不要纠结单个空，先快速读全文把握大意', imgs: [] },
  { idx: 9, category: '英语', content: '唐迟老师的阅读逻辑太强了！强烈推荐他的真题班，逻辑链分析真的打通任督二脉', imgs: [] },
  { idx: 9, category: '英语', content: '今天背了300个单词+1篇外刊，感觉英语水平在慢慢提升，量变到质变需要时间', imgs: [] },

  // 政治
  { idx: 3, category: '政治', content: '肖秀荣1000题二刷完成，正确率从60%提升到85%！分享一下我的刷题方法：先做题后看视频', imgs: [] },
  { idx: 3, category: '政治', content: '徐涛的马原讲得太清楚了，茅塞顿开！特别是矛盾那一节，之前一直搞不懂', imgs: [] },
  { idx: 3, category: '政治', content: '今天背了20道分析题，头都要炸了。马原真的好抽象，但还是要背下去', imgs: [] },
  { idx: 10, category: '政治', content: '腿姐的技巧班yyds！选择题正确率提升明显，关键词定位法真的有效', imgs: [] },
  { idx: 10, category: '政治', content: '政治大纲出来了，今年变动好大。毛中特新增了不少内容，要重新梳理框架', imgs: [] },
  { idx: 10, category: '政治', content: '肖四肖八什么时候出啊？等不及了，已经做好背诵的准备了', imgs: [] },

  // 专业课
  { idx: 4, category: '专业课', content: '408数据结构二刷完成，红黑树终于搞懂了！分享一份手写笔记，需要的可以收藏', imgs: ['https://picsum.photos/seed/cs1/400/300', 'https://picsum.photos/seed/cs2/400/300'] },
  { idx: 4, category: '专业课', content: '计算机网络的三次握手四次挥手，背了忘忘了背。今天终于画出了完整的状态转换图', imgs: [] },
  { idx: 4, category: '专业课', content: '操作系统PV操作经典题总结，附详细解析，跨考生福利！ producers-consumers problem 永远的痛', imgs: ['https://picsum.photos/seed/os1/400/300'] },
  { idx: 11, category: '专业课', content: '机组浮点数运算看了三遍才理解，求安慰😭 IEEE754标准是真的难', imgs: [] },
  { idx: 11, category: '专业课', content: '跨考计算机，专业课真的好难，有大佬带带我吗？坐标双非一本目标985', imgs: [] },
  { idx: 11, category: '专业课', content: '王道数据结构课后习题第5章做完，递归终于不那么可怕了。坚持打卡', imgs: [] },

  // 经验
  { idx: 5, category: '经验', content: '【复习时间表分享】6:30起床，7:00到图书馆，23:00回宿舍，午休1h。坚持了3个月了', imgs: [] },
  { idx: 5, category: '经验', content: '二战考研人的心态调整：别把自己逼太紧。去年一战失败就是因为太焦虑，今年学会了适当放松', imgs: [] },
  { idx: 5, category: '经验', content: '暑假是黄金期！大家一定要把握住，没有课的干扰，是弯道超车的最佳时机', imgs: [] },
  { idx: 12, category: '经验', content: '图书馆座位预约攻略：早到比啥都强。我们学校6点开门，我5:50就在门口等', imgs: [] },
  { idx: 12, category: '经验', content: '我的考研作息：上午数学2h（脑子最清醒），下午英语2h（适应考试时间），晚上专业课3h', imgs: [] },
  { idx: 12, category: '经验', content: '给一战考研人的建议：别盲目跟风，找到适合自己的节奏最重要。不要看别人复习到哪了就焦虑', imgs: [] },

  // 其他
  { idx: 6, category: '其他', content: '今天打卡第88天！再坚持一下就上岸了。共勉，考研人们 ❤️', imgs: [] },
  { idx: 6, category: '其他', content: '求研友！坐标北京，目标985计算机，每天图书馆，有一起的吗？', imgs: [] },
  { idx: 6, category: '其他', content: '刚才听到一首歌《曾经的你》，突然泪目。考研这条路真的不容易，但风景很美', imgs: [] },
  { idx: 7, category: '其他', content: '考前焦虑症又犯了，昨晚失眠到3点。大家有什么缓解压力的方法吗？', imgs: [] },
  { idx: 7, category: '其他', content: '祝大家都能上岸！加油加油！送大家一句话：你只管努力，剩下的交给时间', imgs: [] },
  { idx: 7, category: '其他', content: '今天图书馆遇到一只猫，趴在我书上睡着了，考研也有人陪了🐱', imgs: ['https://picsum.photos/seed/cat/400/300'] },
];

// ============ 3. 评论池 ============
const commentPool = [
  '加油！坚持就是胜利💪',
  '同感同感，我也遇到一样的问题',
  '楼主求详细资料，谢谢！',
  '厉害了，向你学习',
  '我也是这样，互相鼓励',
  '谢谢分享，受益匪浅',
  '蹲一个详细回复',
  '666 学霸！',
  '感谢楼主的分享',
  '收藏了，回头细看',
  '加油楼主，共勉',
  '我也在准备这个，一起加油',
  '请问用的什么资料？',
  '真的很有用，谢谢！',
  '太难了，我也要加油了',
  '楼主好认真，我也要努力了',
  '赞一个，正能量满满',
  '抱抱，考研不容易',
  '一战加油，二战更稳',
  '一起上岸！冲冲冲',
];

// ============ 4. 执行 Seed ============
console.log('🧹 清空旧数据...');
db.run('DELETE FROM check_ins');
db.run('DELETE FROM comments');
db.run('DELETE FROM likes');
db.run('DELETE FROM posts');
db.run('DELETE FROM users');
// 重置自增 ID
db.run("DELETE FROM sqlite_sequence WHERE name IN ('users','posts','likes','comments','check_ins')");

console.log(`👥 插入 ${users.length} 个用户...`);
const userInsert = db.prepare('INSERT INTO users (openid, nick_name, avatar_url, level) VALUES (?, ?, ?, ?)');
for (let i = 0; i < users.length; i++) {
  const u = users[i];
  userInsert.run(`mock_seed_${i + 1}`, u.nick_name, u.avatar, u.level);
}

console.log(`📝 插入 ${posts.length} 条帖子...`);
const postInsert = db.prepare('INSERT INTO posts (user_id, content, category, images, created_at) VALUES (?, ?, ?, ?, ?)');
const now = Date.now();
for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  const daysAgo = Math.floor(i / 3); // 按顺序分散到不同天
  const hoursAgo = (i % 8) * 3;
  const created = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000)
    .toISOString().replace('T', ' ').slice(0, 19);
  postInsert.run(p.idx, p.content, p.category, JSON.stringify(p.imgs), created);
}

console.log('❤️ 生成点赞数据...');
const likeInsert = db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)');
let likeCount = 0;
for (let postId = 1; postId <= posts.length; postId++) {
  // 每个帖子 3-10 个赞（不能超过用户总数 12）
  const numLikes = Math.min(users.length, 3 + Math.floor(Math.random() * 8));
  const likers = new Set<number>();
  let safety = 0;
  while (likers.size < numLikes && safety++ < 100) {
    likers.add(1 + Math.floor(Math.random() * users.length));
  }
  for (const uid of likers) {
    const created = new Date(now - Math.floor(Math.random() * 7) * 86400000)
      .toISOString().replace('T', ' ').slice(0, 19);
    likeInsert.run(uid, postId, created);
    likeCount++;
  }
}
console.log(`   ✓ ${likeCount} 条点赞`);

console.log('💬 生成评论数据...');
const commentInsert = db.prepare('INSERT INTO comments (user_id, post_id, content, created_at) VALUES (?, ?, ?, ?)');
let commentTotal = 0;
for (let postId = 1; postId <= posts.length; postId++) {
  // 50% 的帖子有评论，每条 1-6 条
  if (Math.random() < 0.7) {
    const numComments = 1 + Math.floor(Math.random() * 6);
    for (let j = 0; j < numComments; j++) {
      const uid = 1 + Math.floor(Math.random() * users.length);
      const content = commentPool[Math.floor(Math.random() * commentPool.length)];
      const created = new Date(now - Math.floor(Math.random() * 5) * 86400000 - j * 3600000)
        .toISOString().replace('T', ' ').slice(0, 19);
      commentInsert.run(uid, postId, content, created);
      commentTotal++;
    }
  }
}
console.log(`   ✓ ${commentTotal} 条评论`);

console.log('📅 生成打卡数据...');
const checkInInsert = db.prepare('INSERT OR IGNORE INTO check_ins (user_id, check_date) VALUES (?, ?)');
let checkInTotal = 0;
for (let uid = 1; uid <= users.length; uid++) {
  // 每个用户过去 30 天打卡 5-25 天
  const numDays = 5 + Math.floor(Math.random() * 21);
  const days = new Set<number>();
  while (days.size < numDays) {
    days.add(Math.floor(Math.random() * 30));
  }
  for (const d of days) {
    const date = new Date(now - d * 86400000).toISOString().slice(0, 10);
    try {
      checkInInsert.run(uid, date);
      checkInTotal++;
    } catch {}
  }
}
console.log(`   ✓ ${checkInTotal} 条打卡`);

// ============ 5. 数据统计 ============
console.log('\n📊 数据统计：');
const stats = {
  users: db.query('SELECT COUNT(*) as c FROM users').get() as any,
  posts: db.query('SELECT COUNT(*) as c FROM posts').get() as any,
  likes: db.query('SELECT COUNT(*) as c FROM likes').get() as any,
  comments: db.query('SELECT COUNT(*) as c FROM comments').get() as any,
  check_ins: db.query('SELECT COUNT(*) as c FROM check_ins').get() as any,
  quotes: db.query('SELECT COUNT(*) as c FROM quotes').get() as any,
};
console.table(stats);
console.log('✅ 种子数据填充完成！');
