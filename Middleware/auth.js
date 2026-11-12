const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = Number(decoded.userId);
    // Both `id` and `userId` are exposed for backward compatibility.
    req.user = { id: userId, userId };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
