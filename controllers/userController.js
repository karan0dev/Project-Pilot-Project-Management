const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { updateProjectProgress } = require('../services/projectService');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { page, limit } = req.query;

    let queryBuilder = User.find({}).select('-password').sort({ createdAt: -1 });

    const total = await User.countDocuments({});

    let pageNum = 1;
    let limitNum = total;

    if (page || limit) {
      pageNum = parseInt(page, 10) || 1;
      limitNum = Math.min(parseInt(limit, 10) || 10, 100);
      const skipNum = (pageNum - 1) * limitNum;
      queryBuilder = queryBuilder.skip(skipNum).limit(limitNum);
    }

    const users = await queryBuilder;

    res.json({
      success: true,
      count: users.length,
      total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? limitNum : total,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.params.id;

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up: delete projects created by this user
    // First, find these projects to delete their tasks
    const projects = await Project.find({ createdBy: userId }).session(session);
    const deletedProjectIds = projects.map(project => project._id);
    for (const project of projects) {
      await Task.deleteMany({ projectId: project._id }).session(session);
    }
    await Project.deleteMany({ createdBy: userId }).session(session);

    const survivingAssignedProjectIds = await Task.distinct('projectId', {
      assignedTo: userId,
      projectId: { $nin: deletedProjectIds }
    }).session(session);

    // Clean up tasks assigned to this user
    await Task.deleteMany({ assignedTo: userId }).session(session);

    for (const projectId of survivingAssignedProjectIds) {
      await updateProjectProgress(projectId, session);
    }

    // Delete the user
    await User.findByIdAndDelete(userId).session(session);

    // Log Activity
    const activity = new Activity({
      description: `User account '${user.username}' was deleted by administrator ${req.user.username}.`,
      user: req.user._id
    });
    await activity.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'User and all their associated projects/tasks deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

module.exports = {
  getUsers,
  deleteUser
};
