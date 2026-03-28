const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getIO } = require('../socket/socketManager');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/posts — all posts
router.get('/', auth, async (req, res) => {
  try {
    const { sort = 'recent', city, page = 1, limit = 20 } = req.query;
    const query = city ? { city } : {};
    const sortOpt = sort === 'trending' ? { trendScore: -1 } : { createdAt: -1 };

    const posts = await Post.find(query)
      .sort(sortOpt)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'username avatar city')
      .lean();

    // Mask author if anonymous
    const masked = posts.map(p => ({
      ...p,
      author: p.isAnonymous ? { username: 'مجهول', avatar: '' } : p.author,
      userReaction: getUserReaction(p.reactions, req.user._id)
    }));

    res.json(masked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/trending
router.get('/trending', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ trendScore: -1 })
      .limit(50)
      .populate('author', 'username avatar city')
      .lean();

    const masked = posts.map(p => ({
      ...p,
      author: p.isAnonymous ? { username: 'مجهول', avatar: '' } : p.author,
      userReaction: getUserReaction(p.reactions, req.user._id)
    }));

    res.json(masked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { content, city, isAnonymous } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      city: city || req.user.city || 'Tunis',
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    // Award points
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });

    const populated = await Post.findById(post._id).populate('author', 'username avatar city').lean();
    const result = {
      ...populated,
      author: post.isAnonymous ? { username: 'مجهول', avatar: '' } : populated.author,
      userReaction: null
    };

    // Broadcast new post via socket
    try { getIO().emit('new_post', result); } catch(e) {}

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/react
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reaction } = req.body; // laugh | fire | skull | heart
    const validReactions = ['laugh', 'fire', 'skull', 'heart'];
    if (!validReactions.includes(reaction)) return res.status(400).json({ message: 'Invalid reaction' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id;

    // Remove from all reaction arrays first (toggle)
    validReactions.forEach(r => {
      post.reactions[r] = post.reactions[r].filter(id => !id.equals(userId));
    });

    // Add new reaction (if not toggling off)
    const wasAlreadyReacted = false; // already removed above
    post.reactions[reaction].push(userId);

    post.computeTrendScore();
    await post.save();

    // Award points to post author
    await User.findByIdAndUpdate(post.author, { $inc: { points: 1 } });

    // Broadcast reaction update
    try { getIO().emit('reaction_update', { postId: post._id, reactions: post.reactions, trendScore: post.trendScore }); } catch(e) {}

    res.json({ reactions: post.reactions, trendScore: post.trendScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function getUserReaction(reactions, userId) {
  const id = userId.toString();
  if (reactions.laugh?.some(r => r.toString() === id)) return 'laugh';
  if (reactions.fire?.some(r => r.toString() === id)) return 'fire';
  if (reactions.skull?.some(r => r.toString() === id)) return 'skull';
  if (reactions.heart?.some(r => r.toString() === id)) return 'heart';
  return null;
}

module.exports = router;
