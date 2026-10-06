const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// In-memory user store fallback if MongoDB is in offline mode
const memoryUsers = [];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      monthlyBudget: user.monthlyBudget,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_student_expense_tracker_2026',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register a new student account
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, monthlyBudget } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Try MongoDB first if connected
    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : 5000,
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Student account registered successfully in MongoDB Atlas!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          monthlyBudget: user.monthlyBudget,
          currency: user.currency,
        },
      });
    } else {
      // Memory Store Fallback
      const existing = memoryUsers.find((u) => u.email === email.toLowerCase());
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: 'mem_' + Date.now(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : 5000,
        currency: 'INR',
      };
      memoryUsers.push(newUser);

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully (Memory/Demo Mode).',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          monthlyBudget: newUser.monthlyBudget,
          currency: newUser.currency,
        },
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during sign up: ' + error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate student & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const token = generateToken(user);

      return res.json({
        success: true,
        message: 'Logged in successfully via MongoDB Atlas!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          monthlyBudget: user.monthlyBudget,
          currency: user.currency,
        },
      });
    } else {
      // Memory Store verification
      const user = memoryUsers.find((u) => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or user not found in session.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Logged in successfully (Memory mode).',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          monthlyBudget: user.monthlyBudget,
          currency: user.currency,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login: ' + error.message,
    });
  }
});

// @route   POST /api/auth/guest
// @desc    One-click instant guest login with sample student expenses
// @access  Public
router.post('/guest', (req, res) => {
  const guestUser = {
    _id: 'guest_demo_user_id',
    name: 'Alex Rivera (Guest Demo)',
    email: 'guest.student@demo.app',
    monthlyBudget: 6000,
    currency: 'INR',
  };

  const token = generateToken(guestUser);

  res.json({
    success: true,
    message: 'Welcome to Guest Explorer Mode!',
    token,
    user: guestUser,
  });
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   PUT /api/auth/budget
// @desc    Update user's monthly budget
// @access  Private
router.put('/budget', protect, async (req, res) => {
  try {
    const { monthlyBudget } = req.body;
    if (!monthlyBudget || Number(monthlyBudget) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid budget amount greater than 0.',
      });
    }

    if (mongoose.connection.readyState === 1 && req.user._id !== 'guest_demo_user_id') {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { monthlyBudget: Number(monthlyBudget) },
        { new: true }
      );
      return res.json({
        success: true,
        message: 'Monthly budget updated successfully in database.',
        monthlyBudget: user.monthlyBudget,
      });
    } else {
      req.user.monthlyBudget = Number(monthlyBudget);
      return res.json({
        success: true,
        message: 'Monthly budget updated successfully.',
        monthlyBudget: req.user.monthlyBudget,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update budget: ' + error.message,
    });
  }
});

module.exports = router;
