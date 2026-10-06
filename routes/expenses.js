const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// In-memory fallback expenses storage
let memoryExpenses = [
  {
    _id: 'exp_1',
    user: 'guest_demo_user_id',
    amount: 180,
    category: 'Food',
    note: 'College Canteen Lunch & Chai',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    isAiSuggested: false,
    createdAt: new Date(),
  },
  {
    _id: 'exp_2',
    user: 'guest_demo_user_id',
    amount: 350,
    category: 'Education',
    note: 'Python & Data Structures Handbook',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    isAiSuggested: false,
    createdAt: new Date(),
  },
  {
    _id: 'exp_3',
    user: 'guest_demo_user_id',
    amount: 80,
    category: 'Transport',
    note: 'Metro Recharge',
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    isAiSuggested: false,
    createdAt: new Date(),
  },
  {
    _id: 'exp_4',
    user: 'guest_demo_user_id',
    amount: 299,
    category: 'Entertainment',
    note: 'Spotify Student Subscription',
    date: new Date(Date.now() - 259200000).toISOString().slice(0, 10),
    paymentMethod: 'Card',
    isAiSuggested: true,
    createdAt: new Date(),
  },
  {
    _id: 'exp_5',
    user: 'guest_demo_user_id',
    amount: 540,
    category: 'Shopping',
    note: 'Backpack Stationery & Notebooks',
    date: new Date(Date.now() - 345600000).toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    isAiSuggested: false,
    createdAt: new Date(),
  },
];

// @route   GET /api/expenses
// @desc    Get all expenses for the logged-in student
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { month, category, search } = req.query;
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1 && userId !== 'guest_demo_user_id') {
      let query = { user: req.user._id };

      if (month) {
        query.date = { $regex: `^${month}` };
      }
      if (category && category !== 'All') {
        query.category = category;
      }
      if (search) {
        query.note = { $regex: search, $options: 'i' };
      }

      const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
      return res.json({
        success: true,
        count: expenses.length,
        data: expenses,
      });
    } else {
      // Memory Store Query
      let results = memoryExpenses.filter((e) => e.user === userId || userId === 'guest_demo_user_id');

      if (month) {
        results = results.filter((e) => e.date.startsWith(month));
      }
      if (category && category !== 'All') {
        results = results.filter((e) => e.category === category);
      }
      if (search) {
        const s = search.toLowerCase();
        results = results.filter(
          (e) => (e.note && e.note.toLowerCase().includes(s)) || e.category.toLowerCase().includes(s)
        );
      }

      results.sort((a, b) => b.date.localeCompare(a.date));

      return res.json({
        success: true,
        count: results.length,
        data: results,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses: ' + error.message,
    });
  }
});

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { amount, category, note, date, paymentMethod, isAiSuggested } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid expense amount greater than 0.',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please select an expense category.',
      });
    }

    const expenseDate = date || new Date().toISOString().slice(0, 10);
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1 && userId !== 'guest_demo_user_id') {
      const expense = await Expense.create({
        user: req.user._id,
        amount: Number(amount),
        category,
        note: note ? note.trim() : category,
        date: expenseDate,
        paymentMethod: paymentMethod || 'UPI',
        isAiSuggested: !!isAiSuggested,
      });

      return res.status(201).json({
        success: true,
        message: 'Expense saved successfully to MongoDB Atlas!',
        data: expense,
      });
    } else {
      // Memory Store
      const newExpense = {
        _id: 'exp_' + Date.now(),
        user: userId,
        amount: Number(amount),
        category,
        note: note ? note.trim() : category,
        date: expenseDate,
        paymentMethod: paymentMethod || 'UPI',
        isAiSuggested: !!isAiSuggested,
        createdAt: new Date(),
      };
      memoryExpenses.unshift(newExpense);

      return res.status(201).json({
        success: true,
        message: 'Expense saved successfully (Demo/Session Mode)!',
        data: newExpense,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save expense: ' + error.message,
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1 && userId !== 'guest_demo_user_id') {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense transaction not found.',
        });
      }

      if (expense.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this expense.',
        });
      }

      await expense.deleteOne();
      return res.json({
        success: true,
        message: 'Expense deleted successfully from MongoDB Atlas.',
      });
    } else {
      const initialLength = memoryExpenses.length;
      memoryExpenses = memoryExpenses.filter((e) => e._id !== expenseId);

      if (memoryExpenses.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: 'Expense transaction not found.',
        });
      }

      return res.json({
        success: true,
        message: 'Expense deleted successfully.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense: ' + error.message,
    });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get summary statistics and category distribution
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = req.query.month || currentMonth;
    const userId = req.user._id.toString();
    const monthlyBudget = Number(req.user.monthlyBudget) || 5000;

    let expenses = [];
    if (mongoose.connection.readyState === 1 && userId !== 'guest_demo_user_id') {
      expenses = await Expense.find({
        user: req.user._id,
        date: { $regex: `^${selectedMonth}` },
      });
    } else {
      expenses = memoryExpenses.filter(
        (e) => (e.user === userId || userId === 'guest_demo_user_id') && e.date.startsWith(selectedMonth)
      );
    }

    const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = monthlyBudget - totalSpent;
    const percentageUsed = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

    // Category Aggregations
    const categories = ['Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Other'];
    const categoryTotals = {};
    categories.forEach((cat) => (categoryTotals[cat] = 0));

    expenses.forEach((item) => {
      const cat = item.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
    });

    const categoryBreakdown = Object.keys(categoryTotals)
      .filter((cat) => categoryTotals[cat] > 0)
      .map((cat) => ({
        category: cat,
        amount: categoryTotals[cat],
        percentage: totalSpent > 0 ? Math.round((categoryTotals[cat] / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Day of month calculation for daily average & forecast
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = currentDay > 0 ? (totalSpent / currentDay).toFixed(1) : 0;
    const projectedTotal = (Number(dailyAverage) * daysInMonth).toFixed(0);

    // Status warning
    let statusText = 'Normal';
    let statusMessage = 'Spending within comfortable limits.';
    if (totalSpent >= monthlyBudget) {
      statusText = 'Exceeded';
      statusMessage = `Warning! Budget exceeded by ₹${(totalSpent - monthlyBudget).toLocaleString('en-IN')}`;
    } else if (percentageUsed >= 80) {
      statusText = 'Alert';
      statusMessage = `Alert: You have reached ${Math.round(percentageUsed)}% of your monthly pocket money limit.`;
    }

    res.json({
      success: true,
      stats: {
        month: selectedMonth,
        monthlyBudget,
        totalSpent,
        remaining,
        percentageUsed: Number(percentageUsed.toFixed(1)),
        dailyAverage: Number(dailyAverage),
        projectedTotal: Number(projectedTotal),
        statusText,
        statusMessage,
        transactionCount: expenses.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to compute spending stats: ' + error.message,
    });
  }
});

module.exports = router;
