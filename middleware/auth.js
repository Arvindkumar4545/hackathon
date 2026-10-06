const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const jwtSecret = require('../config/jwt');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      jwtSecret
    );

    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (error) {
        if (error.name !== 'CastError') throw error;
      }
    }

    // Default decoded payload
    req.user = {
      _id: decoded.id,
      name: decoded.name || 'Student User',
      email: decoded.email || 'user@example.com',
      monthlyBudget: Number(decoded.monthlyBudget) || 0,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid or expired. Please login again.',
    });
  }
};

module.exports = { protect };
