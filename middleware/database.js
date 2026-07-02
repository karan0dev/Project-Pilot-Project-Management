const mongoose = require('mongoose');

const getDatabaseStatusMessage = () => {
  switch (mongoose.connection.readyState) {
    case 2:
      return 'Database is still connecting. Please wait a few seconds and try again.';
    case 3:
      return 'Database connection is closing. Please try again shortly.';
    default:
      return 'Database is not connected. Please check your MongoDB Atlas connection, network access, and MONGO_URI.';
  }
};

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: getDatabaseStatusMessage()
  });
};

module.exports = {
  requireDatabase
};
