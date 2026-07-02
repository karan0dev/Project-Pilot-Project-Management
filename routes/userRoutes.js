const express = require('express');
const router = express.Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Protect all user routes
router.use(protect);

// Allow any authenticated user to view the list of team members (for task assignments)
router.route('/')
  .get(getUsers);

// Only admin role can delete user accounts
router.route('/:id')
  .delete(authorize('admin'), deleteUser);


module.exports = router;
