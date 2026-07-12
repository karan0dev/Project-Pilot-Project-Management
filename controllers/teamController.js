const User = require('../models/User');
const TeamRequest = require('../models/TeamRequest');
const Activity = require('../models/Activity');
const ChatMessage = require('../models/ChatMessage');

// @desc    Create/rename team
// @route   POST /api/team/create
// @access  Private/Admin
const createTeam = async (req, res) => {
  try {
    const { teamName } = req.body;
    if (!teamName || teamName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a team name' });
    }

    const user = await User.findById(req.user._id);
    user.teamName = teamName.trim();
    await user.save();

    // Log Activity
    await Activity.create({
      description: `Admin created/renamed team to '${user.teamName}'.`,
      user: req.user._id
    });

    res.json({
      success: true,
      message: `Team '${user.teamName}' saved successfully`,
      teamName: user.teamName
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Send invitation request to user by ID
// @route   POST /api/team/invite
// @access  Private/Admin
const sendInvitation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Please provide a recipient user ID' });
    }

    const adminUser = await User.findById(req.user._id);
    if (!adminUser.teamName) {
      return res.status(400).json({ success: false, message: 'Please create a team name before inviting members' });
    }

    // Find recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (recipient.role === 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot invite an administrator to a team' });
    }

    // Check if recipient is already in a team
    if (recipient.teamAdmin) {
      return res.status(400).json({ success: false, message: 'User is already a member of a team' });
    }

    // Check for existing pending request from this admin
    const pendingRequest = await TeamRequest.findOne({
      admin: req.user._id,
      recipient: recipientId,
      status: 'pending'
    });

    if (pendingRequest) {
      return res.status(400).json({ success: false, message: 'A pending invitation has already been sent to this user' });
    }

    // Create TeamRequest
    const request = await TeamRequest.create({
      admin: req.user._id,
      recipient: recipientId,
      status: 'pending'
    });

    // Log Activity
    await Activity.create({
      description: `Admin invited user '${recipient.username}' to join team.`,
      user: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Invitation successfully sent to ${recipient.username}`,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Get admin's pending invites
// @route   GET /api/team/pending-invites
// @access  Private/Admin
const getPendingInvitationsAdmin = async (req, res) => {
  try {
    const invites = await TeamRequest.find({
      admin: req.user._id,
      status: 'pending'
    }).populate('recipient', 'username email');

    res.json({
      success: true,
      count: invites.length,
      data: invites
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Get team members list
// @route   GET /api/team/members
// @access  Private/Admin
const getTeamMembers = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user._id).populate('teamMembers', 'username email');
    res.json({
      success: true,
      count: adminUser.teamMembers.length,
      data: adminUser.teamMembers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Remove team member
// @route   DELETE /api/team/remove/:id
// @access  Private/Admin
const removeTeamMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    const admin = await User.findById(req.user._id);

    if (!admin.teamMembers.includes(memberId)) {
      return res.status(400).json({ success: false, message: 'User is not a member of your team' });
    }

    // Remove from admin's members list
    admin.teamMembers = admin.teamMembers.filter(id => id.toString() !== memberId);
    await admin.save();

    // Clear user's teamAdmin field
    const member = await User.findById(memberId);
    if (member) {
      member.teamAdmin = undefined;
      await member.save();
    }

    // Log Activity
    await Activity.create({
      description: `Admin removed user '${member ? member.username : memberId}' from team.`,
      user: req.user._id
    });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Get pending invitations sent to user
// @route   GET /api/team/invitations
// @access  Private
const getInvitationsUser = async (req, res) => {
  try {
    const invites = await TeamRequest.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('admin', 'username email teamName');

    res.json({
      success: true,
      count: invites.length,
      data: invites
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Accept/decline invitation
// @route   POST /api/team/invitations/:id/respond
// @access  Private
const respondToInvitation = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid response action' });
    }

    const invitation = await TeamRequest.findById(req.params.id);
    if (!invitation || invitation.recipient.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invitation has already been processed' });
    }

    if (action === 'accept') {
      // Check if user is already in a team
      const user = await User.findById(req.user._id);
      if (user.teamAdmin) {
        return res.status(400).json({ success: false, message: 'You are already a member of a team. Leave your current team first.' });
      }

      // Add to admin's teamMembers list
      const admin = await User.findById(invitation.admin);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Team administrator account no longer exists' });
      }

      if (!admin.teamMembers.includes(req.user._id)) {
        admin.teamMembers.push(req.user._id);
        await admin.save();
      }

      // Set user's teamAdmin
      user.teamAdmin = invitation.admin;
      await user.save();

      // Set request status to accepted
      invitation.status = 'accepted';
      await invitation.save();

      // Decline all other pending requests for this user
      await TeamRequest.updateMany(
        { recipient: req.user._id, status: 'pending' },
        { status: 'declined' }
      );

      // Log Activity
      await Activity.create({
        description: `User '${req.user.username}' accepted invitation to join team '${admin.teamName}'.`,
        user: req.user._id
      });
    } else {
      // Decline request
      invitation.status = 'declined';
      await invitation.save();

      // Log Activity
      await Activity.create({
        description: `User '${req.user.username}' declined invitation to join team.`,
        user: req.user._id
      });
    }

    res.json({
      success: true,
      message: `Invitation successfully ${action}ed`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Leave current team
// @route   POST /api/team/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.teamAdmin) {
      return res.status(400).json({ success: false, message: 'You do not belong to any team' });
    }

    const adminId = user.teamAdmin;
    const admin = await User.findById(adminId);
    if (admin) {
      // Remove from admin's members list
      admin.teamMembers = admin.teamMembers.filter(id => id.toString() !== req.user._id.toString());
      await admin.save();
    }

    user.teamAdmin = undefined;
    await user.save();

    // Log Activity
    await Activity.create({
      description: `User '${req.user.username}' left their team.`,
      user: req.user._id
    });

    res.json({
      success: true,
      message: 'You have left the team successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Send team chat message
// @route   POST /api/team/chat
// @access  Private
const sendChatMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const user = await User.findById(req.user._id);
    let teamAdminId;

    if (user.role === 'admin') {
      if (!user.teamName) {
        return res.status(400).json({ success: false, message: 'You must set a team name to unlock the chat room' });
      }
      teamAdminId = user._id;
    } else {
      if (!user.teamAdmin) {
        return res.status(400).json({ success: false, message: 'You do not belong to any team. Join a team first to use chat.' });
      }
      teamAdminId = user.teamAdmin;
    }

    const message = await ChatMessage.create({
      sender: user._id,
      teamAdmin: teamAdminId,
      text: text.trim()
    });

    const populatedMsg = await ChatMessage.findById(message._id).populate('sender', 'username email role');

    res.status(201).json({
      success: true,
      data: populatedMsg
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

// @desc    Get team chat history
// @route   GET /api/team/chat
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let teamAdminId;

    if (user.role === 'admin') {
      if (!user.teamName) {
        return res.json({ success: true, count: 0, data: [] });
      }
      teamAdminId = user._id;
    } else {
      if (!user.teamAdmin) {
        return res.json({ success: true, count: 0, data: [] });
      }
      teamAdminId = user.teamAdmin;
    }

    const messages = await ChatMessage.find({ teamAdmin: teamAdminId })
      .populate('sender', 'username email role')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
  }
};

module.exports = {
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
};
