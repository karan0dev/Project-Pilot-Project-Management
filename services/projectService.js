const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * Recalculate and update project progress based on completed tasks.
 * Supports running within an active MongoDB transaction session.
 * 
 * @param {string} projectId 
 * @param {object} [session] Optional Mongoose ClientSession
 * @returns {Promise<number>} Updated progress percentage
 */
const updateProjectProgress = async (projectId, session = null) => {
  const totalQuery = Task.countDocuments({ projectId });
  if (session) totalQuery.session(session);
  const totalTasks = await totalQuery;

  if (totalTasks === 0) {
    const updateQuery = Project.findByIdAndUpdate(projectId, { progress: 0 });
    if (session) updateQuery.session(session);
    await updateQuery;
    return 0;
  }

  const completedQuery = Task.countDocuments({ projectId, status: 'completed' });
  if (session) completedQuery.session(session);
  const completedTasks = await completedQuery;

  const progress = Math.round((completedTasks / totalTasks) * 100);

  const progressUpdateQuery = Project.findByIdAndUpdate(projectId, { progress });
  if (session) progressUpdateQuery.session(session);
  await progressUpdateQuery;

  return progress;
};

module.exports = {
  updateProjectProgress
};
