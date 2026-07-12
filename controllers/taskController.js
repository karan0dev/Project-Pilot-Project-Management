const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { updateProjectProgress } = require('../services/projectService');

const isObjectId = value => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

// @desc    Get all tasks with filters and search
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, priority, projectId, assignedTo, search, page, limit } = req.query;
    let query = {};
    let andConditions = [];

    // Role filtering: non-admins only see tasks assigned to them or tasks in projects they created
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ createdBy: req.user._id });
      const userProjectIds = userProjects.map(proj => proj._id);
      andConditions.push({
        $or: [
          { assignedTo: req.user._id },
          { projectId: { $in: userProjectIds } }
        ]
      });
    }

    // Filter by project ID
    if (projectId && isObjectId(projectId)) {
      andConditions.push({ projectId });
    }

    // Filter by status
    const VALID_TASK_STATUSES = ['pending', 'in_progress', 'completed'];
    if (status && VALID_TASK_STATUSES.includes(status)) {
      andConditions.push({ status });
    }

    // Filter by priority
    const VALID_TASK_PRIORITIES = ['low', 'medium', 'high'];
    if (priority && VALID_TASK_PRIORITIES.includes(priority)) {
      andConditions.push({ priority });
    }

    // Filter by assignee
    if (assignedTo && isObjectId(assignedTo)) {
      andConditions.push({ assignedTo });
    }

    // Filter by text search
    if (search && typeof search === 'string') {
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedSearch = escapeRegex(search);
      andConditions.push({
        $or: [
          { title: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    let queryBuilder = Task.find(query)
      .populate('projectId', 'title')
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);

    let pageNum = 1;
    let limitNum = total;

    if (page || limit) {
      pageNum = parseInt(page, 10) || 1;
      limitNum = Math.min(parseInt(limit, 10) || 10, 100);
      const skipNum = (pageNum - 1) * limitNum;
      queryBuilder = queryBuilder.skip(skipNum).limit(limitNum);
    }

    const tasks = await queryBuilder;

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? limitNum : total,
      data: tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'title createdBy')
      .populate('assignedTo', 'username email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role check: non-admins can only view tasks assigned to them or in projects they created
    if (
      req.user.role !== 'admin' &&
      task.assignedTo._id.toString() !== req.user._id.toString() &&
      (!task.projectId || task.projectId.createdBy.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, description, projectId, assignedTo, priority, deadline } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId).session(session);
    if (!project) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const assignedUser = await User.findById(assignedTo).session(session);
    if (!assignedUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    if (req.user.role === 'admin') {
      const isSelf = assignedUser._id.toString() === req.user._id.toString();
      const isTeamMember = assignedUser.teamAdmin && assignedUser.teamAdmin.toString() === req.user._id.toString();
      if (!isSelf && !isTeamMember) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Admins can only assign tasks to themselves or their team members' });
      }
    } else {
      if (assignedUser._id.toString() !== req.user._id.toString()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Standard users can only assign tasks to themselves' });
      }
    }

    const tasks = await Task.create([{
      title,
      description,
      projectId,
      assignedTo,
      priority: priority || 'medium',
      deadline
    }], { session });
    const task = tasks[0];

    // Recalculate project progress
    await updateProjectProgress(projectId, session);

    // Log Activity
    const activity = new Activity({
      description: `Task '${title}' added to project '${project.title}' by ${req.user.username}.`,
      user: req.user._id,
      project: projectId,
      task: task._id
    });
    await activity.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Update task details or status
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let task = await Task.findById(req.params.id).session(session);
    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role check: non-admins can only update tasks assigned to them or in projects they created
    const taskProject = await Project.findById(task.projectId).session(session);
    if (
      req.user.role !== 'admin' &&
      task.assignedTo.toString() !== req.user._id.toString() &&
      (!taskProject || taskProject.createdBy.toString() !== req.user._id.toString())
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const originalProjectId = task.projectId;
    const originalStatus = task.status;

    if (req.body.projectId && req.body.projectId !== originalProjectId.toString()) {
      const newProject = await Project.findById(req.body.projectId).session(session);
      if (!newProject) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
    }

    if (req.body.assignedTo) {
      const assignedUser = await User.findById(req.body.assignedTo).session(session);
      if (!assignedUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Assigned user not found' });
      }

      if (req.user.role === 'admin') {
        const isSelf = assignedUser._id.toString() === req.user._id.toString();
        const isTeamMember = assignedUser.teamAdmin && assignedUser.teamAdmin.toString() === req.user._id.toString();
        if (!isSelf && !isTeamMember) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: 'Admins can only assign tasks to themselves or their team members' });
        }
      } else {
        if (assignedUser._id.toString() !== req.user._id.toString()) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: 'Standard users can only assign tasks to themselves' });
        }
      }
    }

    // Whitelist task fields explicitly
    const allowedFields = ['title', 'description', 'projectId', 'assignedTo', 'priority', 'status', 'deadline'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    
    // Update task
    task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
      session
    });

    const projectChanged = task.projectId.toString() !== originalProjectId.toString();
    const statusChanged = req.body.status && req.body.status !== originalStatus;

    // Recalculate progress for every affected project.
    if (projectChanged) {
      await updateProjectProgress(originalProjectId, session);
      await updateProjectProgress(task.projectId, session);
    } else if (statusChanged) {
      await updateProjectProgress(task.projectId, session);
    }

    // Get project title for logging
    const project = await Project.findById(task.projectId).session(session);
    const projTitle = project ? project.title : 'Unknown';

    // Log Activity
    const activity = new Activity({
      description: `Task '${task.title}' in '${projTitle}' was updated by ${req.user.username} (Status: ${task.status}).`,
      user: req.user._id,
      project: task.projectId,
      task: task._id
    });
    await activity.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, data: task });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const task = await Task.findById(req.params.id).session(session);
    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role check: non-admins can only delete tasks assigned to them or in projects they created
    const taskProject = await Project.findById(task.projectId).session(session);
    if (
      req.user.role !== 'admin' &&
      task.assignedTo.toString() !== req.user._id.toString() &&
      (!taskProject || taskProject.createdBy.toString() !== req.user._id.toString())
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    const projectId = task.projectId;
    const taskTitle = task.title;

    // Delete task
    await Task.findByIdAndDelete(req.params.id).session(session);

    // Recalculate project progress
    await updateProjectProgress(projectId, session);

    // Get project details for logging
    const project = await Project.findById(projectId).session(session);
    const projTitle = project ? project.title : 'Unknown';

    // Log Activity
    const activity = new Activity({
      description: `Task '${taskTitle}' in '${projTitle}' was deleted by ${req.user.username}.`,
      user: req.user._id,
      project: projectId
    });
    await activity.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
