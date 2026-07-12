/**
 * Custom request body input validation middleware.
 * Validates request payload structure and data types before processing in controllers.
 */

const VALID_PROJECT_STATUSES = ['planning', 'active', 'completed', 'on_hold'];
const VALID_PROJECT_CATEGORIES = ['Development', 'Design', 'Marketing', 'Research', 'Operations'];
const VALID_TASK_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TASK_STATUSES = ['pending', 'in_progress', 'completed'];

const isObjectId = value => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3 || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim())) {
    return res.status(400).json({ success: false, message: 'Username must be 3-30 characters and may only contain letters, numbers, underscores, periods, and hyphens' });
  }
  if (!email || typeof email !== 'string' || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password is required and must be at least 6 characters' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  next();
};

const validateUpdatePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({ success: false, message: 'Current password is required' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password is required and must be at least 6 characters' });
  }
  next();
};

const validateProject = (req, res, next) => {
  const { title, description, category, status, deadline } = req.body;
  
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }
    if (title.length > 100) {
      return res.status(400).json({ success: false, message: 'Project title cannot exceed 100 characters' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Project description is required' });
    }
    if (description.length > 2000) {
      return res.status(400).json({ success: false, message: 'Project description cannot exceed 2000 characters' });
    }
    if (!category || !VALID_PROJECT_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Project category is invalid. Must be one of: Development, Design, Marketing, Research, Operations' });
    }
    if (!deadline || isNaN(Date.parse(deadline))) {
      return res.status(400).json({ success: false, message: 'A valid project deadline date is required' });
    }
    if (status !== undefined && !VALID_PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Project status is invalid' });
    }
  } else if (req.method === 'PUT') {
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Project title cannot be empty' });
    }
    if (title && title.length > 100) {
      return res.status(400).json({ success: false, message: 'Project title cannot exceed 100 characters' });
    }
    if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Project description cannot be empty' });
    }
    if (description && description.length > 2000) {
      return res.status(400).json({ success: false, message: 'Project description cannot exceed 2000 characters' });
    }
    if (category !== undefined && !VALID_PROJECT_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Project category is invalid' });
    }
    if (deadline !== undefined && isNaN(Date.parse(deadline))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid project deadline date' });
    }
    if (status !== undefined && !VALID_PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Project status is invalid' });
    }
  }
  next();
};

const validateTask = (req, res, next) => {
  const { title, description, projectId, assignedTo, priority, status, deadline } = req.body;
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }
    if (title.length > 100) {
      return res.status(400).json({ success: false, message: 'Task title cannot exceed 100 characters' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Task description is required' });
    }
    if (description.length > 2000) {
      return res.status(400).json({ success: false, message: 'Task description cannot exceed 2000 characters' });
    }
    if (!projectId || !isObjectId(projectId)) {
      return res.status(400).json({ success: false, message: 'A valid Project ID is required' });
    }
    if (!assignedTo || !isObjectId(assignedTo)) {
      return res.status(400).json({ success: false, message: 'A valid assigned User ID is required' });
    }
    if (!deadline || isNaN(Date.parse(deadline))) {
      return res.status(400).json({ success: false, message: 'A valid task deadline date is required' });
    }
    if (priority !== undefined && !VALID_TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Task priority is invalid' });
    }
    if (status !== undefined && !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Task status is invalid' });
    }
  } else if (req.method === 'PUT') {
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Task title cannot be empty' });
    }
    if (title && title.length > 100) {
      return res.status(400).json({ success: false, message: 'Task title cannot exceed 100 characters' });
    }
    if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
      return res.status(400).json({ success: false, message: 'Task description cannot be empty' });
    }
    if (description && description.length > 2000) {
      return res.status(400).json({ success: false, message: 'Task description cannot exceed 2000 characters' });
    }
    if (projectId !== undefined && !isObjectId(projectId)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Project ID' });
    }
    if (assignedTo !== undefined && !isObjectId(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid assigned User ID' });
    }
    if (deadline !== undefined && isNaN(Date.parse(deadline))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid task deadline date' });
    }
    if (priority !== undefined && !VALID_TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Task priority is invalid' });
    }
    if (status !== undefined && !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Task status is invalid' });
    }
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdatePassword,
  validateProject,
  validateTask
};
