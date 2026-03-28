/**
 * Seed script — creates demo users and posts
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jawna-tn';

const USERS = [
  { username: 'jawna',    password: 'jawna123',  city: 'تونس',   bio: 'مؤسس JAWNA TN 🔥' },
  { username: 'soussi7',  password: 'pass1234',  city: 'سوسة',   bio: 'شباب سوسة 💪' },
  { username: 'sfaxboy',  password: 'pass1234',  city: 'صفاقس',  bio: 'صفاقسي أصيل 😂' },
  { username: 'tounsi',   password: 'pass1234',  city: 'تونس',   bio: 'تونسي وفاخر بيه 🇹🇳' },
];

const POSTS_DATA = [
  { userIdx: 0, content: 'مرحبا بيكم في JAWNA TN! المنصة الجديدة للشباب التونسي 🔥🇹🇳\nشاركوا أفكاركم وتفاعلوا مع بعض!', city: 'تونس' },
  { userIdx: 1, content: 'سوسة في الصيف = جنة على الأرض 🌊☀️ شكون معايا؟', city: 'سوسة' },
  { userIdx: 2, content: 'صفاقسي ما يشريش... صفاقسي يبيع 😂💀\nهاذي الحقيقة الصعيبة', city: 'صفاقس' },
  { userIdx: 3, content: 'الشعب التونسي أذكى شعب في العالم العربي وأنا قلتها 🔥💪', city: 'تونس', isAnonymous: false },
  { userIdx: 0, content: 'شكون يحب الكسكسي بالحليب؟ 👋 لا تخافوش من الحكم... مجهول 🎭', city: 'تونس', isAnonymous: true },
  { userIdx: 1, content: 'الباكالوريا تعدّت... الحمد لله على كل حال 😅🎓\nدعواتكم لكل الطلبة!', city: 'سوسة' },
  { userIdx: 2, content: 'هاذي البلاد عندها مستقبل باهي إذا شبابها كمّل ⚡️\nنتموا شو رأيكم؟', city: 'صفاقس' },
  { userIdx: 3, content: 'كان حلم نشوف تونس تتقدم... واش هو مجرد حلم؟ 💀', city: 'تونس' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Post.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create users
  const users = [];
  for (const u of USERS) {
    const created = await User.create(u);
    users.push(created);
    console.log(`👤 Created user: @${created.username}`);
  }

  // Create posts with some reactions
  for (const pd of POSTS_DATA) {
    const author = users[pd.userIdx];
    const otherUsers = users.filter((_, i) => i !== pd.userIdx);

    const post = new Post({
      author: author._id,
      content: pd.content,
      city: pd.city,
      isAnonymous: pd.isAnonymous || false,
      reactions: {
        laugh: otherUsers.slice(0, Math.floor(Math.random() * 3)).map(u => u._id),
        fire:  otherUsers.slice(0, Math.floor(Math.random() * 3)).map(u => u._id),
        skull: otherUsers.slice(0, Math.floor(Math.random() * 2)).map(u => u._id),
        heart: otherUsers.slice(0, Math.floor(Math.random() * 3)).map(u => u._id),
      }
    });
    post.computeTrendScore();
    await post.save();
    console.log(`📝 Created post by @${author.username}: ${pd.content.substring(0, 40)}...`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('\n🔑 Demo credentials:');
  USERS.forEach(u => console.log(`   @${u.username} / ${u.password}`));
  process.exit(0);
}

seed().catch(err => { console.error('❌', err); process.exit(1); });
