const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Heuristic Natural Language NLP Parser for Expenses
const parseNaturalLanguageExpense = (text) => {
  if (!text || typeof text !== 'string') return null;

  const raw = text.toLowerCase().trim();

  // 1. Extract Amount (matches ₹500, 500rs, rs 500, 500.50, spent 300, etc.)
  let amount = null;
  const amountMatch = raw.match(/(?:(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?))|(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|bucks|inr)?/i);
  if (amountMatch) {
    const num = parseFloat(amountMatch[1] || amountMatch[2]);
    if (!isNaN(num) && num > 0) {
      amount = num;
    }
  }

  // 2. Extract Category by keywords
  let category = 'Other';
  const categoryKeywords = {
    Food: ['food', 'lunch', 'dinner', 'breakfast', 'canteen', 'pizza', 'burger', 'maggi', 'tea', 'chai', 'coffee', 'cafe', 'swiggy', 'zomato', 'snack', 'restaurant', 'meal', 'biryani', 'grocery', 'juice', 'shawarma', 'subway', 'mcdonalds', 'kfc'],
    Transport: ['metro', 'bus', 'auto', 'uber', 'ola', 'rapido', 'train', 'ticket', 'petrol', 'fuel', 'cab', 'travel', 'fare', 'flight', 'scooter'],
    Education: ['book', 'course', 'stationery', 'xerox', 'printout', 'tuition', 'exam', 'fees', 'pen', 'notebook', 'udemy', 'coursera', 'class', 'library', 'project'],
    Entertainment: ['movie', 'netflix', 'spotify', 'prime', 'game', 'gaming', 'cinema', 'concert', 'match', 'party', 'club', 'outing', 'subscription', 'youtube'],
    Shopping: ['clothes', 'shirt', 'shoes', 'dress', 'amazon', 'flipkart', 'myntra', 'mall', 'shopping', 'accessories', 'bag', 'jeans'],
    Health: ['medicine', 'doctor', 'clinic', 'pharmacy', 'hospital', 'tablets', 'bandaid', 'gym', 'protein', 'fitness'],
    Utilities: ['recharge', 'wifi', 'electricity', 'laundry', 'room rent', 'hostel rent', 'mobile bill', 'water']
  };

  for (const [cat, words] of Object.entries(categoryKeywords)) {
    if (words.some((word) => raw.includes(word))) {
      category = cat;
      break;
    }
  }

  // 3. Extract Date
  let date = new Date().toISOString().slice(0, 10);
  if (raw.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().slice(0, 10);
  } else if (raw.includes('2 days ago') || raw.includes('day before yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    date = d.toISOString().slice(0, 10);
  }

  // 4. Payment Method
  let paymentMethod = 'UPI';
  if (raw.includes('cash')) paymentMethod = 'Cash';
  else if (raw.includes('card') || raw.includes('credit') || raw.includes('debit')) paymentMethod = 'Card';
  else if (raw.includes('netbanking')) paymentMethod = 'NetBanking';

  // 5. Clean Clean Note
  let cleanNote = text
    .replace(/(?:(?:rs\.?|inr|₹)\s*\d+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*(?:rs|rupees|bucks|inr)?)/gi, '')
    .replace(/\b(spent|paid|bought|for|on|yesterday|today|via upi|via cash|via card)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanNote || cleanNote.length < 2) {
    cleanNote = `${category} expense`;
  }
  // Capitalize first letter
  cleanNote = cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1);

  return {
    amount: amount || 100,
    category,
    note: cleanNote,
    date,
    paymentMethod,
    confidence: amount ? 0.95 : 0.65
  };
};

// @route   POST /api/ai/parse
// @desc    Natural language AI expense parser
// @access  Public / Private
router.post('/parse', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Please provide expense text description.' });
  }

  const parsed = parseNaturalLanguageExpense(text);
  res.json({
    success: true,
    data: parsed,
    message: `AI identified ₹${parsed.amount} for "${parsed.category}" (${parsed.note})`
  });
});

// @route   POST /api/ai/insights
// @desc    Generate financial health audit and AI recommendations
// @access  Public / Private
router.post('/insights', (req, res) => {
  try {
    const { budget = 5000, spent = 0, categories = [], transactions = [] } = req.body;
    const numBudget = Number(budget) || 5000;
    const numSpent = Number(spent) || 0;
    const remaining = numBudget - numSpent;
    const percent = numBudget > 0 ? (numSpent / numBudget) * 100 : 0;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate());
    const safeDailySpend = remaining > 0 ? (remaining / daysLeft).toFixed(0) : 0;

    // Calculate Financial Health Score (0 - 100)
    let score = 100;
    if (percent > 100) score = Math.max(15, 100 - (percent - 100) * 1.5);
    else if (percent > 80) score = 65;
    else if (percent > 60) score = 82;
    else score = 94;

    // AI Tips and Insights based on actual figures
    const recommendations = [];

    if (percent >= 100) {
      recommendations.push({
        type: 'danger',
        icon: '🚨',
        title: 'Budget Limit Exceeded',
        advice: `You have spent ₹${Math.abs(remaining).toLocaleString('en-IN')} over your monthly pocket money. Try freezing non-essential entertainment and retail purchases until next month.`
      });
    } else if (percent >= 80) {
      recommendations.push({
        type: 'warning',
        icon: '⚠️',
        title: '80% Threshold Reached',
        advice: `You have ₹${remaining.toLocaleString('en-IN')} left for ${daysLeft} days. Stick to a daily budget of ₹${safeDailySpend}/day to survive comfortably.`
      });
    } else {
      recommendations.push({
        type: 'success',
        icon: '🎯',
        title: 'Healthy Spending Pace',
        advice: `Great job! You have ₹${remaining.toLocaleString('en-IN')} available. Your safe spending limit is ₹${safeDailySpend}/day.`
      });
    }

    // Category analysis
    const foodCat = categories.find((c) => c.category === 'Food');
    if (foodCat && (foodCat.amount / (numSpent || 1)) > 0.45) {
      recommendations.push({
        type: 'info',
        icon: '🍔',
        title: 'High Food & Canteen Share',
        advice: `Food accounts for ${Math.round((foodCat.amount / numSpent) * 100)}% of your expenses. Packing snacks or sharing college lunch combos could save up to ₹500/month.`
      });
    }

    const entCat = categories.find((c) => c.category === 'Entertainment');
    if (entCat && entCat.amount > 1000) {
      recommendations.push({
        type: 'tip',
        icon: '💡',
        title: 'Subscription & Outing Tip',
        advice: `Check if you are using student discount plans for Spotify (₹59/mo) and Prime Student to cut monthly entertainment costs in half.`
      });
    }

    recommendations.push({
      type: 'tip',
      icon: '🧠',
      title: 'The Student 50/30/20 Rule',
      advice: `Allocate ₹${Math.round(numBudget * 0.5)} for Needs (Food, Transport, Books), ₹${Math.round(numBudget * 0.3)} for Fun/Wants, and save ₹${Math.round(numBudget * 0.2)} for emergencies.`
    });

    res.json({
      success: true,
      insights: {
        healthScore: Math.round(score),
        healthRating: score > 80 ? 'Excellent' : score > 60 ? 'Moderate' : 'Critical Attention',
        safeDailySpend: Number(safeDailySpend),
        daysRemaining: daysLeft,
        burnRate: percent > 0 ? (percent / ((now.getDate() / daysInMonth) * 100 || 1)).toFixed(2) : 1,
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI insight calculation failed: ' + error.message });
  }
});

// @route   POST /api/ai/chat
// @desc    Interactive AI Financial Coach Chat
// @access  Public / Private
router.post('/chat', (req, res) => {
  const { message, context } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Please provide a message for the AI coach.' });
  }

  const q = message.toLowerCase();
  let reply = '';

  if (q.includes('save') || q.includes('saving')) {
    reply = "💡 **Top Student Saving Strategies:**\n1. **Track Small UPI Payments:** Micro-expenses on tea, snacks & printouts add up quickly.\n2. **Use Student IDs:** Always claim student discounts for transport passes, software (GitHub Student Pack, Notion), and streaming.\n3. **Set a Daily Pocket Cap:** If your budget is ₹5,000, keep daily spend below ₹160.\n4. **The 24-Hour Rule:** Wait 24 hours before making any non-essential purchase over ₹300.";
  } else if (q.includes('budget') || q.includes('50/30/20') || q.includes('plan')) {
    reply = "📊 **The Recommended Student 50/30/20 Rule:**\n- **50% Essentials (Needs):** College canteen meals, metro/bus fares, books, exam stationery.\n- **30% Lifestyle (Wants):** Weekend coffee, movies, gaming, hanging out with friends.\n- **20% Emergency Savings:** Keep this in a separate UPI wallet or account for unexpected college expenses or tech repairs.";
  } else if (q.includes('food') || q.includes('canteen') || q.includes('mess')) {
    reply = "🍔 **Managing Food Expenses:** Food is usually 40-50% of a student's budget. To optimize: buy snacks in bulk, use campus mess coupons instead of outside food deliveries, and split restaurant bills via instant UPI.";
  } else if (q.includes('overspend') || q.includes('debt') || q.includes('broke') || q.includes('exceeded')) {
    reply = "🚨 **Don't panic! Here is your emergency recovery plan:**\n1. Pause all non-essential shopping & entertainment for the next 7 days.\n2. Utilize campus mess/home meals and walking/public transit.\n3. Check your recent transactions in the list below to identify high-spending days.\n4. Reset your monthly limit with realistic category caps.";
  } else if (q.includes('ai') || q.includes('who are you') || q.includes('how it works')) {
    reply = "🤖 I am your **Expenz AI Student Financial Coach**! I analyze your spending transactions, detect high-spend categories, calculate safe daily limits, and help you parse natural language expenses instantly.";
  } else {
    reply = `🎓 **AI Coach Insight for "${message}":**\nManaging student finances is all about building sustainable daily habits. Based on your current spending progress, focus on keeping your daily average within your pocket money target. Feel free to ask me for saving tips, category budget splits, or how to manage end-of-month cashflow!`;
  }

  res.json({
    success: true,
    reply,
    timestamp: new Date().toLocaleTimeString()
  });
});

module.exports = router;
