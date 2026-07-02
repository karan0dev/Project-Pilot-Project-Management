const rateLimits = new Map();

/**
 * IP-based in-memory rate limiter middleware.
 * Restricts the number of API calls a single client IP can make within a specified timeframe.
 * Useful for securing sensitive routes (e.g. login endpoints) against brute force attacks.
 * 
 * @param {object} options Configuration options
 * @param {number} [options.windowMs] Time window in milliseconds (default 15 minutes)
 * @param {number} [options.max] Maximum requests allowed per windowMs (default 30 requests)
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 30; // Max 30 requests

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }

    const requests = rateLimits.get(ip);
    
    // Filter timestamps to only retain requests within the current window
    const activeRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (activeRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: `Too many requests from this IP. Please try again after ${Math.ceil(windowMs / 60000)} minutes.`
      });
    }

    activeRequests.push(now);
    rateLimits.set(ip, activeRequests);
    next();
  };
};

module.exports = rateLimiter;
