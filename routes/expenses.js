const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const memoryExpenses = [];
const categories = ['Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Rent', 'Bills', 'Salary', 'Other'];
const paymentMethods = ['UPI', 'Cash', 'Card', 'NetBanking', 'Other'];
const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

// @route   GET /api/expenses
// @desc    Get all expenses for the logged-in student
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { month, category, search } = req.query;
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1) {
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
      let results = memoryExpenses.filter((e) => e.user === userId);

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
    const { amount, category, note, date, paymentMethod, isAiSuggested, type = 'expense' } = req.body;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid expense amount greater than 0.',
      });
    }

    if (!categories.includes(category) || !['income', 'expense'].includes(type)
      || (date && !isValidDate(date)) || (paymentMethod && !paymentMethods.includes(paymentMethod))
      || (note && (typeof note !== 'string' || note.length > 100))) {
      return res.status(400).json({
        success: false,
        message: 'Provide a valid transaction category, type, date, payment method and note.',
      });
    }

    const expenseDate = date || new Date().toISOString().slice(0, 10);
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1) {
      const expense = await Expense.create({
        user: req.user._id,
        amount: Number(amount),
        category,
        type: category === 'Salary' ? 'income' : type,
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
        type: category === 'Salary' ? 'income' : type,
        note: note ? note.trim() : category,
        date: expenseDate,
        paymentMethod: paymentMethod || 'UPI',
        isAiSuggested: !!isAiSuggested,
        createdAt: new Date(),
      };
      memoryExpenses.unshift(newExpense);

      return res.status(201).json({
        success: true,
        message: 'Transaction recorded for this server session. Configure MongoDB to keep it across restarts.',
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

router.put('/:id', protect, async (req, res) => {
  try {
    const { amount, category, note, date, paymentMethod, type = 'expense' } = req.body;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !categories.includes(category) || !['income', 'expense'].includes(type)
      || (date && !isValidDate(date)) || (paymentMethod && !paymentMethods.includes(paymentMethod))
      || (note && (typeof note !== 'string' || note.length > 100))) {
      return res.status(400).json({ success: false, message: 'Provide a valid amount, category and transaction type.' });
    }
    const userId = req.user._id.toString();
    const updates = {
      amount: numericAmount,
      category,
      type: category === 'Salary' ? 'income' : type,
      note: note ? String(note).trim() : category,
      date: date || new Date().toISOString().slice(0, 10),
      paymentMethod: paymentMethod || 'UPI',
    };
    if (mongoose.connection.readyState === 1) {
      const transaction = await Expense.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        updates,
        { new: true, runValidators: true }
      );
      if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found for this account.' });
      return res.json({ success: true, message: 'Transaction updated.', data: transaction });
    }
    const transaction = memoryExpenses.find((item) => item._id === req.params.id && item.user === userId);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found for this account.' });
    Object.assign(transaction, updates);
    return res.json({ success: true, message: 'Transaction updated for this server session.', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update transaction: ' + error.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user._id.toString();

    if (mongoose.connection.readyState === 1) {
      const expense = await Expense.findOneAndDelete({ _id: expenseId, user: req.user._id });
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found for this account.',
        });
      }
      return res.json({
        success: true,
        message: 'Transaction deleted.',
      });
    } else {
      const index = memoryExpenses.findIndex((e) => e._id === expenseId && e.user === userId);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found for this account.',
        });
      }
      memoryExpenses.splice(index, 1);
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
    const monthlyBudget = Number(req.user.monthlyBudget) || 0;

    let expenses = [];
    if (mongoose.connection.readyState === 1) {
      expenses = await Expense.find({
        user: req.user._id,
        date: { $regex: `^${selectedMonth}` },
      });
    } else {
      expenses = memoryExpenses.filter((e) => e.user === userId && e.date.startsWith(selectedMonth));
    }

    const totalSpent = expenses.filter((item) => item.type !== 'income').reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = expenses.filter((item) => item.type === 'income' || item.category === 'Salary').reduce((sum, item) => sum + Number(item.amount), 0);
    const availableFunds = totalIncome || monthlyBudget;
    const remaining = availableFunds - totalSpent;
    const percentageUsed = availableFunds > 0 ? (totalSpent / availableFunds) * 100 : 0;

    // Category Aggregations
    const categories = ['Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Rent', 'Bills', 'Other'];
    const categoryTotals = {};
    categories.forEach((cat) => (categoryTotals[cat] = 0));

    expenses.forEach((item) => {
      if (item.type === 'income' || item.category === 'Salary') return;
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
    if (availableFunds > 0 && totalSpent >= availableFunds) {
      statusText = 'Exceeded';
      statusMessage = `Recorded spending exceeded the available monthly funds by ₹${(totalSpent - availableFunds).toLocaleString('en-IN')}`;
    } else if (availableFunds > 0 && percentageUsed >= 80) {
      statusText = 'Alert';
      statusMessage = `Alert: You have reached ${Math.round(percentageUsed)}% of your monthly pocket money limit.`;
    }

    res.json({
      success: true,
      stats: {
        month: selectedMonth,
        monthlyBudget,
        totalIncome,
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
