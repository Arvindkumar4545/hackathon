const express = require('express');
const router = express.Router();
const FinancialInsights = require('../financial-insights');

const amountPattern = /(?:(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?))|([\d,]+(?:\.\d{1,2})?)\s*(?:rs|rupees|inr)?/i;
const parsedAmount = (match) => Number((match?.[1] || match?.[2] || '').replaceAll(',', ''));

function parseNaturalLanguageExpense(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const amountMatch = text.match(amountPattern);
  const amount = amountMatch ? parsedAmount(amountMatch) : null;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const raw = text.toLowerCase();
  const categoryKeywords = {
    Salary: ['salary', 'income', 'paycheck', 'received'],
    Food: ['food', 'lunch', 'dinner', 'breakfast', 'canteen', 'pizza', 'burger', 'chai', 'coffee', 'swiggy', 'zomato', 'grocery', 'restaurant'],
    Transport: ['metro', 'bus', 'auto', 'uber', 'ola', 'train', 'petrol', 'fuel', 'cab', 'travel', 'fare'],
    Education: ['book', 'course', 'stationery', 'xerox', 'tuition', 'exam', 'fees', 'notebook', 'library'],
    Entertainment: ['movie', 'netflix', 'spotify', 'gaming', 'cinema', 'concert', 'subscription'],
    Shopping: ['clothes', 'shirt', 'shoes', 'amazon', 'flipkart', 'myntra', 'mall', 'shopping'],
    Health: ['medicine', 'doctor', 'clinic', 'pharmacy', 'hospital', 'gym', 'fitness'],
    Rent: ['rent', 'lease'],
    Bills: ['bill', 'electricity', 'wifi', 'water', 'recharge'],
  };
  const category = Object.entries(categoryKeywords).find(([, words]) => words.some((word) => raw.includes(word)))?.[0] || 'Other';
  const type = category === 'Salary' || /\b(received|income|salary)\b/.test(raw) ? 'income' : 'expense';
  let date = new Date().toISOString().slice(0, 10);
  if (raw.includes('yesterday')) {
    const day = new Date();
    day.setDate(day.getDate() - 1);
    date = day.toISOString().slice(0, 10);
  }
  const paymentMethod = /\bcash\b/.test(raw) ? 'Cash' : /\b(card|credit|debit)\b/.test(raw) ? 'Card' : /\bnetbanking\b/.test(raw) ? 'NetBanking' : 'UPI';
  const note = text.replace(amountPattern, '').replace(/\b(spent|paid|received|earned|for|on|yesterday|today|via upi|via cash|via card)\b/gi, '').replace(/\s+/g, ' ').trim();
  return { amount, category, type, note: note || category, date, paymentMethod };
}

router.post('/parse', (req, res) => {
  const parsed = parseNaturalLanguageExpense(req.body?.text);
  if (!parsed) {
    return res.status(400).json({ success: false, message: 'Include an actual transaction amount and description.' });
  }
  res.json({ success: true, data: parsed });
});

router.post('/insights', (req, res) => {
  const { transactions, budget = 0 } = req.body || {};
  if (!Array.isArray(transactions)) {
    return res.status(400).json({ success: false, message: 'Provide your recorded transactions to calculate insights.' });
  }
  const insights = FinancialInsights.generateFinancialInsights(transactions, Number(budget) || 0);
  res.json({ success: true, insights });
});

router.post('/chat', (req, res) => {
  const { message, context = {} } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Ask a question about your recorded finances.' });
  }
  const transactions = Array.isArray(context.transactions) ? context.transactions : [];
  const goals = Array.isArray(context.goals) ? context.goals : [];
  const budget = Number(context.budget) || 0;
  const query = message.toLowerCase();
  const summary = FinancialInsights.summarize(transactions);
  let reply;

  if (query.includes('afford') || query.includes('buy') || query.includes('purchase')) {
    const match = message.match(amountPattern);
    const price = match ? parsedAmount(match) : NaN;
    if (!Number.isFinite(price) || price <= 0) {
      reply = 'Include the actual purchase amount in your question so I can compare it with your recorded monthly net.';
    } else {
      const check = FinancialInsights.evaluatePurchase(transactions, price);
      reply = check.available
        ? `${check.level}: ${check.explanation} After a ₹${Math.round(price).toLocaleString('en-IN')} purchase, the month’s recorded net would be ₹${Math.round(check.remainingAfterPurchase).toLocaleString('en-IN')}. This check only includes transactions you have entered.`
        : check.reason;
    }
  } else if (query.includes('goal')) {
    if (!goals.length) {
      reply = 'You have not added any savings goals yet. Add a goal with its target, current savings and optional date to get a plan.';
    } else {
      reply = goals.map((goal) => {
        const plan = FinancialInsights.calculateGoalPlan(goal);
        return `${goal.title}: ₹${Math.round(plan.remaining).toLocaleString('en-IN')} remaining${plan.monthlyRequired ? `; approximately ₹${Math.round(plan.monthlyRequired).toLocaleString('en-IN')}/month` : '; add a target date to calculate the monthly amount'}.`;
      }).join('\n');
    }
  } else if (query.includes('saving') || query.includes('save')) {
    const months = [...new Set(transactions.map((transaction) => String(transaction.date || '').slice(0, 7)).filter(Boolean))].sort().slice(-3);
    const monthly = months.map((month) => FinancialInsights.summarize(transactions, month));
    const monthsWithIncome = monthly.filter((record) => record.income > 0);
    if (monthsWithIncome.length >= 2) {
      const previous = monthsWithIncome.at(-2);
      const latest = monthsWithIncome.at(-1);
      const change = latest.net - previous.net;
      const evidence = FinancialInsights.detectSpendingPatterns(transactions).map((pattern) => pattern.evidence);
      reply = `Your recorded monthly net changed from ₹${Math.round(previous.net).toLocaleString('en-IN')} (${previous.month}) to ₹${Math.round(latest.net).toLocaleString('en-IN')} (${latest.month}), a ${change >= 0 ? 'increase' : 'decrease'} of ₹${Math.round(Math.abs(change)).toLocaleString('en-IN')}.${evidence.length ? ` Recorded category changes: ${evidence.join(' ')}` : ' No category increase between the latest two months is supported by the entries.'} This compares logged transactions only; unrecorded money is not included.`;
    } else {
      reply = 'Record income in at least two months to compare changes in your savings. I will not infer missing income or savings.';
    }
  } else if (query.includes('category') || query.includes('spend') || query.includes('expense') || query.includes('month')) {
    const patterns = FinancialInsights.detectSpendingPatterns(transactions);
    const categories = summary.expenses
      ? Object.entries(transactions.filter((transaction) => transaction.type !== 'income' && String(transaction.date || '').startsWith(summary.month)).reduce((totals, transaction) => {
        const category = transaction.category || 'Other';
        totals[category] = (totals[category] || 0) + Number(transaction.amount || 0);
        return totals;
      }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3)
      : [];
    reply = summary.count
      ? `For ${summary.month}, you recorded ₹${Math.round(summary.income).toLocaleString('en-IN')} income and ₹${Math.round(summary.expenses).toLocaleString('en-IN')} expenses, leaving a net of ₹${Math.round(summary.net).toLocaleString('en-IN')}.${categories.length ? ` Highest recorded categories: ${categories.map(([name, amount]) => `${name} ₹${Math.round(amount).toLocaleString('en-IN')}`).join(', ')}.` : ''}${patterns.length ? ` Month-over-month evidence: ${patterns.map((pattern) => pattern.evidence).join(' ')}` : ''}`
      : 'There are no transactions recorded for this month yet. Add actual income and expenses to get a grounded summary.';
  } else if (budget > 0) {
    reply = `Your monthly spending limit is ₹${Math.round(budget).toLocaleString('en-IN')}. This month you have recorded ₹${Math.round(summary.expenses).toLocaleString('en-IN')} in expenses${summary.income ? ` and ₹${Math.round(summary.income).toLocaleString('en-IN')} in income` : ''}. Ask about a purchase, a savings goal or a spending category for a more focused calculation.`;
  } else {
    reply = 'I can answer questions using your recorded transactions and savings goals. Add income and expenses to build a useful personal summary; I will not fill in missing financial details.';
  }
  res.json({ success: true, reply });
});

module.exports = router;
