const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getDashboardAnalytics
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');

// All project routes are protected
router.use(protect);

router.get('/dashboard/stats', getDashboardAnalytics);

router.route('/')
  .get(getProjects)
  .post(validateProject, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(validateProject, updateProject)
  .delete(deleteProject);

module.exports = router;
