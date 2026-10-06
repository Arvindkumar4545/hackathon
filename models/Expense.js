const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add an expense amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Food',
      'Transport',
      'Education',
      'Entertainment',
      'Shopping',
      'Health',
      'Utilities',
      'Other',
    ],
    default: 'Other',
  },
  note: {
    type: String,
    trim: true,
    maxlength: [100, 'Note cannot exceed 100 characters'],
  },
  date: {
    type: String, // YYYY-MM-DD format for student simplicity
    required: true,
    default: () => new Date().toISOString().slice(0, 10),
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'NetBanking', 'Other'],
    default: 'UPI',
  },
  isAiSuggested: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexing for rapid queries per user & date
ExpenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
