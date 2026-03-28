const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { getIO } = require('../socket/socketManager');

// GET /api/comments/:postId
router.get('/:postId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .lean();

    const masked = comments.map(c => ({
      ...c,
      author: c.isAnonymous ? { username: 'مجهول', avatar: '' } : c.author
    }));

    res.json(masked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments/:postId
router.post('/:postId', auth, async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Comment required' });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      content: content.trim(),
      isAnonymous: isAnonymous === true || isAnonymous === 'true'
    });

    // Increment comment count
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentCount: 1 } });

    const populated = await Comment.findById(comment._id).populate('author', 'username avatar').lean();
    const result = {
      ...populated,
      author: comment.isAnonymous ? { username: 'مجهول', avatar: '' } : populated.author
    };

    // Broadcast to post room
    try { getIO().to(`post_${req.params.postId}`).emit('new_comment', result); } catch(e) {}

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
