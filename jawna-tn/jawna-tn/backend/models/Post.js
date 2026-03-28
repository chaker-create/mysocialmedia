const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  image: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: 'Tunis'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  reactions: {
    laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // 😂 ×2
    fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],    // 🔥 ×3
    skull: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // 💀 ×1
    heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]    // ❤️ ×2
  },
  commentCount: {
    type: Number,
    default: 0
  },
  trendScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compute trend score before save
postSchema.methods.computeTrendScore = function() {
  const { laugh, fire, skull, heart } = this.reactions;
  this.trendScore =
    (laugh.length * 2) +
    (fire.length * 3) +
    (skull.length * 1) +
    (heart.length * 2);
  return this.trendScore;
};

postSchema.index({ trendScore: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
