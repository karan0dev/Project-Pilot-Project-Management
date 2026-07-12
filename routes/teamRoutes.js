const express = require('express');
const router = express.Router();
const {
  createTeam,
  sendInvitation,
  getPendingInvitationsAdmin,
  getTeamMembers,
  removeTeamMember,
  getInvitationsUser,
  respondToInvitation,
  leaveTeam,
  sendChatMessage,
  getChatMessages
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Admin-only endpoints
router.post('/create', authorize('admin'), createTeam);
router.post('/invite', authorize('admin'), sendInvitation);
router.get('/pending-invites', authorize('admin'), getPendingInvitationsAdmin);
router.get('/members', authorize('admin'), getTeamMembers);
router.delete('/remove/:id', authorize('admin'), removeTeamMember);

// Standard/User endpoints
router.get('/invitations', getInvitationsUser);
router.post('/invitations/:id/respond', respondToInvitation);
router.post('/leave', leaveTeam);

// Shared Chat endpoints
router.post('/chat', sendChatMessage);
router.get('/chat', getChatMessages);

module.exports = router;
