const express = require('express');
const router = express.Router();
const { getDbStatus } = require('../config/db');

// @route   GET /api/public/overview
// @desc    Get public metrics, student benchmark insights, and feature statistics without login
// @access  Public
router.get('/overview', (req, res) => {
  const dbStatus = getDbStatus();

  res.json({
    success: true,
    platform: 'Expenz AI - Student Smart Expense Tracker',
    databaseStatus: {
      connected: dbStatus.connected,
      cluster: dbStatus.cluster,
      engine: 'MongoDB Atlas Cloud',
      host: dbStatus.host,
    },
    publicBenchmarks: {
      avgMonthlyPocketMoney: 6000,
      avgMonthlySpent: 4350,
      avgSavingsRate: '27.5%',
      topSpendingCategories: [
        { category: 'Food & Canteen', percentage: 38, avgAmount: 1650, icon: '🍔' },
        { category: 'Education & Books', percentage: 22, avgAmount: 950, icon: '📚' },
        { category: 'Transport & Commute', percentage: 16, avgAmount: 700, icon: '🚌' },
        { category: 'Entertainment & Subs', percentage: 14, avgAmount: 600, icon: '🎬' },
        { category: 'Stationery & Shopping', percentage: 10, avgAmount: 450, icon: '🛍️' },
      ],
      studentHabitsInsight: [
        'Students who track daily expenses save 2.4x more pocket money each month.',
        'Over 64% of unplanned spending happens on small UPI canteen transactions below ₹100.',
        'Setting a 50/30/20 pocket money rule helps avoid end-of-month financial stress.',
        'Automated AI categorization prevents forgotten cash and digital payments.'
      ]
    },
    liveSimulatorSample: {
      defaultBudget: 5000,
      sampleSpent: 3120,
      sampleRemaining: 1880,
      samplePercentage: 62.4,
      sampleTransactions: [
        { id: 'sim_1', title: 'College Mess & Breakfast', amount: 120, category: 'Food', date: 'Today' },
        { id: 'sim_2', title: 'Metro Smart Card Top-up', amount: 200, category: 'Transport', date: 'Yesterday' },
        { id: 'sim_3', title: 'Semester Lab Manual', amount: 250, category: 'Education', date: '2 days ago' },
        { id: 'sim_4', title: 'Movie Ticket with Hostel Mates', amount: 350, category: 'Entertainment', date: '3 days ago' }
      ]
    },
    keyFeatures: [
      {
        title: 'Instant Public & Guest Mode',
        desc: 'Explore analytics and test spending budgets instantly without mandatory signup.',
        badge: 'No Friction'
      },
      {
        title: 'MongoDB Atlas Cloud Sync',
        desc: 'Secure multi-user cloud database persistence with real-time sync across devices.',
        badge: 'MongoDB Atlas'
      },
      {
        title: 'AI Natural Language Parser',
        desc: 'Type or speak naturally (e.g. "₹250 on lunch at cafe") and AI extracts amount, category and notes.',
        badge: 'AI Powered'
      },
      {
        title: 'Smart Budget Alerts',
        desc: 'Automatic warnings at 80% threshold and instant overdraft calculation.',
        badge: 'Proactive'
      },
      {
        title: 'Pure White Clean UI/UX',
        desc: 'Sleek, minimalist, distraction-free white aesthetic crafted for students.',
        badge: 'Minimalist'
      }
    ]
  });
});

// @route   GET /api/public/status
// @desc    Check MongoDB Atlas status
// @access  Public
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: getDbStatus(),
  });
});

module.exports = router;
