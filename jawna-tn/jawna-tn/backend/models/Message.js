const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: String,  // sorted userId pair: "uid1_uid2"
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Helper: build conversation ID
messageSchema.statics.getConversationId = function(uid1, uid2) {
  return [uid1.toString(), uid2.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
