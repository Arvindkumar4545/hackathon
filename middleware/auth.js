const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      process.env.JWT_SECRET || 'super_secret_jwt_key_student_expense_tracker_2026'
    );

    // Support demo/guest memory user
    if (decoded.id === 'guest_demo_user_id') {
      req.user = {
        _id: 'guest_demo_user_id',
        name: 'Guest Scholar',
        email: 'guest@student.edu',
        monthlyBudget: 5000,
        currency: 'INR',
      };
      return next();
    }

    try {
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (e) {
      // Fallback
    }

    // Default decoded payload
    req.user = {
      _id: decoded.id,
      name: decoded.name || 'Student User',
      email: decoded.email || 'user@example.com',
      monthlyBudget: decoded.monthlyBudget || 5000,
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
