const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');

const { updateProjectProgress } = require('../services/projectService');

// @desc    Get all projects with search and filters
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { status, category, search, page, limit } = req.query;
    let query = {};
    let andConditions = [];

    // Role filtering: non-admins only see projects they created or are involved in via assigned tasks
    if (req.user.role !== 'admin') {
      const userTasks = await Task.find({ assignedTo: req.user._id });
      const involvedProjectIds = userTasks.map(task => task.projectId);
      andConditions.push({
        $or: [
          { createdBy: req.user._id },
          { _id: { $in: involvedProjectIds } }
        ]
      });
    }

    // Apply status filter
    if (status) {
      andConditions.push({ status });
    }

    // Apply category filter
    if (category) {
      andConditions.push({ category: { $regex: category, $options: 'i' } });
    }

    // Apply search filter
    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    let queryBuilder = Project.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skipNum = (pageNum - 1) * limitNum;
      queryBuilder = queryBuilder.skip(skipNum).limit(limitNum);
    }

    const projects = await queryBuilder;
    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      count: projects.length,
      total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : total,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project details along with its tasks
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'username email');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: non-admins can only see projects they created or are involved in
    if (req.user.role !== 'admin') {
      const userTasks = await Task.find({ assignedTo: req.user._id });
      const involvedProjectIds = userTasks.map(task => task.projectId.toString());
      if (
        project.createdBy._id.toString() !== req.user._id.toString() &&
        !involvedProjectIds.includes(project._id.toString())
      ) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
      }
    }

    // Retrieve tasks for this project
    const tasks = await Task.find({ projectId: project._id }).populate('assignedTo', 'username email');

    res.json({ success: true, project, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description, category, status, deadline } = req.body;

    const project = await Project.create({
      title,
      description,
      category,
      status: status || 'planning',
      deadline,
      createdBy: req.user._id
    });

    // Log Activity
    await Activity.create({
      description: `Project '${title}' was created by ${req.user.username}.`,
      user: req.user._id,
      project: project._id
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: non-admins can only update projects they created
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    // Update the project
    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Log Activity
    await Activity.create({
      description: `Project '${project.title}' details were updated by ${req.user.username}.`,
      user: req.user._id,
      project: project._id
    });

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const project = await Project.findById(req.params.id).session(session);
    if (!project) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Role check: non-admins can only delete projects they created
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ projectId: project._id }).session(session);

    // Delete the project
    await Project.findByIdAndDelete(req.params.id).session(session);

    // Log Activity
    const activity = new Activity({
      description: `Project '${project.title}' and all its tasks were deleted by ${req.user.username}.`,
      user: req.user._id
    });
    await activity.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/projects/dashboard/stats
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    let projectQuery = {};
    let taskQuery = {};
    let activityQuery = {};

    if (req.user.role !== 'admin') {
      const userTasks = await Task.find({ assignedTo: req.user._id });
      const involvedProjectIds = userTasks.map(task => task.projectId);
      projectQuery.$or = [
        { createdBy: req.user._id },
        { _id: { $in: involvedProjectIds } }
      ];

      const userProjects = await Project.find({ createdBy: req.user._id });
      const userProjectIds = userProjects.map(proj => proj._id);
      taskQuery.$or = [
        { assignedTo: req.user._id },
        { projectId: { $in: userProjectIds } }
      ];

      activityQuery.$or = [
        { user: req.user._id },
        { project: { $in: [...userProjectIds, ...involvedProjectIds] } }
      ];
    }

    const totalProjects = await Project.countDocuments(projectQuery);
    const completedProjects = await Project.countDocuments({ ...projectQuery, status: 'completed' });
    const activeProjects = await Project.countDocuments({ ...projectQuery, status: 'active' });

    const totalTasks = await Task.countDocuments(taskQuery);
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $ne: 'completed' } });
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'completed' });
    const overdueTasks = await Task.countDocuments({
      ...taskQuery,
      status: { $ne: 'completed' },
      deadline: { $lt: now }
    });

    const totalUsers = await User.countDocuments();

    // Get 15 most recent activities populated with username
    const recentActivities = await Activity.find(activityQuery)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(15);

    // Get project breakdown by category
    const matchStage = Object.keys(projectQuery).length > 0 ? [{ $match: projectQuery }] : [];
    const categoryStats = await Project.aggregate([
      ...matchStage,
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProjects,
        completedProjects,
        activeProjects,
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        totalUsers
      },
      recentActivities,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getDashboardAnalytics,
  updateProjectProgress
};
