const jwt = require('jsonwebtoken');
const config = require('config');
const MaleUser = require('../models/MaleUser');
const FemaleUser = require('../models/FemaleUser');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // Attach user from payload to request object
    req.user = decoded.user;

    // Fetch user from database and attach to request
    let user = await MaleUser.findById(req.user.id).select('-password');
    if (!user) {
      user = await FemaleUser.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Something went wrong with the auth middleware', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
