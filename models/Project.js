const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a project description']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    trim: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on_hold'],
    default: 'planning'
  },
  deadline: {
    type: Date,
    required: [true, 'Please set a deadline']
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add database index for creator queries
ProjectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
