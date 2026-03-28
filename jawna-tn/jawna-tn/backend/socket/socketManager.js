const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const userSocketMap = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jawna_secret');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    userSocketMap.set(userId, socket.id);

    // Join personal room
    socket.join(`user_${userId}`);

    // Mark online
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user_online', userId);

    console.log(`🟢 ${socket.user.username} connected`);

    // Join post room for realtime comments
    socket.on('join_post', (postId) => {
      socket.join(`post_${postId}`);
    });

    socket.on('leave_post', (postId) => {
      socket.leave(`post_${postId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, to }) => {
      const receiverSocket = userSocketMap.get(to);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_typing', { userId, conversationId });
      }
    });

    socket.on('stop_typing', ({ conversationId, to }) => {
      const receiverSocket = userSocketMap.get(to);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_stop_typing', { userId, conversationId });
      }
    });

    socket.on('disconnect', async () => {
      userSocketMap.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user_offline', userId);
      console.log(`🔴 ${socket.user.username} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket not initialized');
  return io;
};

const getUserSocket = (userId) => userSocketMap.get(userId.toString());

module.exports = { initSocket, getIO, getUserSocket };
