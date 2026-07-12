const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validateUpdatePassword } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limit login endpoint to protect against brute force
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15 // 15 attempts
});

// Rate limit registration to block automated signup spam
const registerLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 // 10 signups per hour per IP
});

// Rate limit password change attempts
const passwordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // 10 attempts
});

router.post('/register', registerLimiter, validateRegister, registerUser);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, passwordLimiter, validateUpdatePassword, updatePassword);

module.exports = router;
