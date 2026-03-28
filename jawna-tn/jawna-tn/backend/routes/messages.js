const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getIO, getUserSocket } = require('../socket/socketManager');

// GET /api/messages/conversations — list of unique conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatar isOnline')
      .populate('receiver', 'username avatar isOnline')
      .lean();

    // Build conversation map (latest message per conversation)
    const convMap = new Map();
    for (const msg of messages) {
      const convId = msg.conversation;
      if (!convMap.has(convId)) {
        const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
        const unreadCount = await Message.countDocuments({
          conversation: convId,
          receiver: req.user._id,
          read: false
        });
        convMap.set(convId, {
          conversationId: convId,
          otherUser,
          lastMessage: msg,
          unreadCount
        });
      }
    }

    res.json(Array.from(convMap.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/:userId — get messages with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const convId = Message.getConversationId(req.user._id, req.params.userId);
    const messages = await Message.find({ conversation: convId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatar')
      .lean();

    // Mark as read
    await Message.updateMany(
      { conversation: convId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/:userId — send a message
router.post('/:userId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Message required' });

    const receiver = await User.findById(req.params.userId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const convId = Message.getConversationId(req.user._id, req.params.userId);
    const message = await Message.create({
      conversation: convId,
      sender: req.user._id,
      receiver: req.params.userId,
      content: content.trim()
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .lean();

    // Emit to receiver's socket room
    try {
      const receiverSocketId = getUserSocket(req.params.userId);
      if (receiverSocketId) {
        getIO().to(receiverSocketId).emit('new_message', populated);
      }
      getIO().to(`user_${req.user._id}`).emit('new_message', populated);
    } catch(e) {}

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
