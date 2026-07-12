const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { JWT_SECRET } = require('../config/jwt');

const isDatabaseUnavailableError = (error) => {
  return [
    'MongoNetworkError',
    'MongoServerSelectionError',
    'MongooseServerSelectionError'
  ].includes(error.name) ||
    error.message.includes('buffering timed out') ||
    error.message.includes('before initial connection');
};

const handleAuthError = (res, error) => {
  console.error(error);
  if (isDatabaseUnavailableError(error)) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please check MongoDB Atlas access and try again.'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Authentication service is temporarily unavailable. Please try again.'
  });
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    let requestedRole = (req.body.role || 'user').trim().toLowerCase();
    if (!['user', 'admin'].includes(requestedRole)) {
      requestedRole = 'user';
    }

    const ADMIN_ALLOWLIST = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    let role = requestedRole;
    if (ADMIN_ALLOWLIST.length > 0) {
      if (ADMIN_ALLOWLIST.includes(normalizedEmail)) {
        role = 'admin';
      }
    } else {
      const isFirstUser = (await User.countDocuments()) === 0;
      if (isFirstUser) {
        role = 'admin';
      }
    }

    // Create user
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role
    });

    if (user) {
      // Log Activity
      await Activity.create({
        description: `New user '${normalizedUsername}' registered.`,
        user: user._id
      });

      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    handleAuthError(res, error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Nchqzt5ynAKW7l/gS4A0Wg8w8Y8Vy'; // any valid bcrypt hash
    
    let isMatch = false;
    if (user) {
      isMatch = await user.matchPassword(password);
    } else {
      await bcrypt.compare(password, DUMMY_HASH);
    }

    if (user && isMatch) {
      // Log Activity
      await Activity.create({
        description: `User '${user.username}' logged in.`,
        user: user._id
      });

      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    handleAuthError(res, error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('teamAdmin', 'username email teamName');
    if (user) {
      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        teamAdmin: user.teamAdmin,
        teamName: user.teamName,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    handleAuthError(res, error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();

      // Log Activity
      await Activity.create({
        description: `User '${user.username}' changed their password.`,
        user: user._id
      });

      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect current password' });
    }
  } catch (error) {
    handleAuthError(res, error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updatePassword
};
