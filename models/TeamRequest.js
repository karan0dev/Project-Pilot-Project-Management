const mongoose = require('mongoose');

const TeamRequestSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Database indexes for invitation lookups
TeamRequestSchema.index({ admin: 1 });
TeamRequestSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('TeamRequest', TeamRequestSchema);
