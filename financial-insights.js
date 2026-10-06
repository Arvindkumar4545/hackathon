(() => {
  const toAmount = (transaction) => Number(transaction.amount) || 0;
  const isIncome = (transaction) => transaction.type === 'income' || transaction.category === 'Salary';
  const monthKey = (date) => String(date || '').slice(0, 7);

  function summarize(transactions, month = new Date().toISOString().slice(0, 7)) {
    const monthTransactions = transactions.filter((transaction) => monthKey(transaction.date) === month);
    const income = monthTransactions.filter(isIncome).reduce((sum, transaction) => sum + toAmount(transaction), 0);
    const expenses = monthTransactions.filter((transaction) => !isIncome(transaction)).reduce((sum, transaction) => sum + toAmount(transaction), 0);
    return { month, income, expenses, net: income - expenses, count: monthTransactions.length };
  }

  function calculateFinancialHealth(transactions) {
    const months = [...new Set(transactions.map((transaction) => monthKey(transaction.date)).filter(Boolean))].sort().slice(-3);
    const relevant = transactions.filter((transaction) => months.includes(monthKey(transaction.date)));
    const income = relevant.filter(isIncome).reduce((sum, transaction) => sum + toAmount(transaction), 0);
    const expenses = relevant.filter((transaction) => !isIncome(transaction)).reduce((sum, transaction) => sum + toAmount(transaction), 0);
    if (!income || months.length < 2) return { available: false, reason: 'Log income and expenses across at least two months to calculate a meaningful score.' };

    const savingsRate = (income - expenses) / income;
    const score = Math.round(Math.max(0, Math.min(100, 50 + savingsRate * 100)));
    const savings = income - expenses;
    return {
      available: true,
      score,
      savingsRate: savingsRate * 100,
      strengths: savings > 0 ? [`Net savings across ${months.length} logged months: ₹${Math.round(savings).toLocaleString('en-IN')}.`] : [],
      problems: savings < 0 ? [`Logged expenses exceeded income by ₹${Math.round(Math.abs(savings)).toLocaleString('en-IN')} across ${months.length} months.`] : [],
      risk: savings < 0 ? 'Elevated' : savingsRate < 0.1 ? 'Watch' : 'Lower',
    };
  }

  function detectSpendingPatterns(transactions) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    const monthTotals = (month) => transactions
      .filter((transaction) => !isIncome(transaction) && monthKey(transaction.date) === month)
      .reduce((totals, transaction) => {
        const category = transaction.category || 'Other';
        totals[category] = (totals[category] || 0) + toAmount(transaction);
        return totals;
      }, {});
    const current = monthTotals(currentMonth);
    const previous = monthTotals(previousMonth);
    const patterns = [];
    Object.entries(current).forEach(([category, amount]) => {
      const oldAmount = previous[category] || 0;
      if (oldAmount > 0 && amount > oldAmount) {
        patterns.push({
          title: `${category} spending increased`,
          evidence: `${category} is ₹${Math.round(amount - oldAmount).toLocaleString('en-IN')} higher than last month (₹${Math.round(oldAmount).toLocaleString('en-IN')} → ₹${Math.round(amount).toLocaleString('en-IN')}).`,
        });
      }
    });
    return patterns;
  }

  function detectMoneyLeaks(transactions) {
    const recurring = new Map();
    transactions.filter((transaction) => !isIncome(transaction) && transaction.note).forEach((transaction) => {
      const merchant = transaction.note.trim().toLowerCase();
      if (!merchant) return;
      const record = recurring.get(merchant) || { label: transaction.note.trim(), months: new Set(), total: 0, count: 0 };
      record.months.add(monthKey(transaction.date));
      record.total += toAmount(transaction);
      record.count += 1;
      recurring.set(merchant, record);
    });
    return [...recurring.values()]
      .filter((record) => record.months.size >= 2)
      .map((record) => ({
        merchant: record.label,
        monthlyAverage: record.total / record.months.size,
        months: record.months.size,
        count: record.count,
      }))
      .sort((a, b) => b.monthlyAverage - a.monthlyAverage);
  }

  function calculateGoalPlan(goal, monthlyContribution = 0) {
    const remaining = Math.max(0, Number(goal.target) - Number(goal.saved || 0));
    const targetDate = goal.targetDate ? new Date(`${goal.targetDate}T00:00:00`) : null;
    const monthsLeft = targetDate && targetDate > new Date()
      ? Math.max(1, (targetDate.getFullYear() - new Date().getFullYear()) * 12 + targetDate.getMonth() - new Date().getMonth())
      : null;
    return {
      remaining,
      progress: Number(goal.target) > 0 ? Math.min(100, (Number(goal.saved || 0) / Number(goal.target)) * 100) : 0,
      monthlyRequired: monthsLeft ? remaining / monthsLeft : (monthlyContribution > 0 ? monthlyContribution : null),
      monthsToGoal: monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : null,
    };
  }

  function simulateScenario(transactions, additionalMonthlySaving, months = 12) {
    const latestMonths = [...new Set(transactions.map((transaction) => monthKey(transaction.date)).filter(Boolean))].sort().slice(-3);
    const recent = transactions.filter((transaction) => latestMonths.includes(monthKey(transaction.date)));
    const incomeMonths = new Set(recent.filter(isIncome).map((transaction) => monthKey(transaction.date)));
    if (!incomeMonths.size) return { available: false, reason: 'Log income transactions to build a savings projection.' };
    const income = recent.filter(isIncome).reduce((sum, transaction) => sum + toAmount(transaction), 0) / incomeMonths.size;
    const expenses = recent.filter((transaction) => !isIncome(transaction)).reduce((sum, transaction) => sum + toAmount(transaction), 0) / Math.max(1, latestMonths.length);
    const baseline = income - expenses;
    return {
      available: true,
      monthlyBaseline: baseline,
      currentPath: baseline * months,
      newPath: (baseline + Number(additionalMonthlySaving || 0)) * months,
      difference: Number(additionalMonthlySaving || 0) * months,
      months,
    };
  }

  function predictCashFlow(transactions, monthlyBudget = 0) {
    const current = summarize(transactions);
    const now = new Date();
    const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const daysElapsed = Math.max(1, now.getDate());
    const dailySpend = current.expenses / daysElapsed;
    const projectedSpend = current.expenses + dailySpend * daysRemaining;
    if (!current.income && !monthlyBudget) return { available: false, reason: 'Log income or set a monthly spending limit to estimate your cash flow.' };
    const availableFunds = current.income || Number(monthlyBudget);
    return {
      available: true,
      availableFunds,
      projectedSpend,
      projectedRemainder: availableFunds - projectedSpend,
      daysRemaining,
      basis: current.income ? 'income transactions recorded this month' : 'your monthly spending limit',
    };
  }

  function evaluatePurchase(transactions, amount) {
    const current = summarize(transactions);
    if (!current.income) return { available: false, reason: 'Log income for this month before assessing purchase affordability.' };
    const remaining = current.net;
    const price = Number(amount);
    const level = price <= remaining * 0.1 ? 'SAFE' : price <= remaining * 0.3 ? 'THINK ABOUT IT' : 'HIGH RISK';
    return {
      available: true,
      level: remaining <= 0 ? 'HIGH RISK' : level,
      monthlyNet: remaining,
      remainingAfterPurchase: remaining - price,
      price,
      explanation: remaining <= 0
        ? 'Your logged expenses already meet or exceed this month’s logged income.'
        : `${Math.round((price / remaining) * 100)}% of your current logged monthly net would be committed to this purchase.`,
    };
  }

  function generateFinancialInsights(transactions, monthlyBudget = 0) {
    return {
      health: calculateFinancialHealth(transactions),
      patterns: detectSpendingPatterns(transactions),
      recurring: detectMoneyLeaks(transactions),
      cashFlow: predictCashFlow(transactions, monthlyBudget),
      month: summarize(transactions),
    };
  }

  const api = {
    summarize,
    calculateFinancialHealth,
    detectSpendingPatterns,
    detectMoneyLeaks,
    calculateGoalPlan,
    simulateScenario,
    predictCashFlow,
    evaluatePurchase,
    generateFinancialInsights,
  };
  if (typeof window !== 'undefined') window.FinancialInsights = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
