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

router.post('/register', validateRegister, registerUser);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, validateUpdatePassword, updatePassword);

module.exports = router;
