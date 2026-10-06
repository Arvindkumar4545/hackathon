const test = require('node:test');
const assert = require('node:assert/strict');
const insights = require('../financial-insights');

const monthOffset = (offset) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 7);
};

const transaction = (date, amount, category, type = 'expense', note = category) => ({
  date: `${date}-15`,
  amount,
  category,
  type,
  note,
});

test('summarizes only the requested month and separates income from expenses', () => {
  const records = [
    transaction(monthOffset(0), 50000, 'Salary', 'income'),
    transaction(monthOffset(0), 12000, 'Rent'),
    transaction(monthOffset(-1), 7000, 'Food'),
  ];
  assert.deepEqual(insights.summarize(records), {
    month: monthOffset(0),
    income: 50000,
    expenses: 12000,
    net: 38000,
    count: 2,
  });
});

test('does not score finances without enough recorded income history', () => {
  const result = insights.calculateFinancialHealth([
    transaction(monthOffset(0), 50000, 'Salary', 'income'),
  ]);
  assert.equal(result.available, false);
});

test('detects category increases and repeated merchants only from dated records', () => {
  const records = [
    transaction(monthOffset(-1), 1000, 'Food', 'expense', 'Cafe'),
    transaction(monthOffset(0), 1400, 'Food', 'expense', 'Cafe'),
    transaction(monthOffset(-2), 300, 'Transport', 'expense', 'Metro'),
  ];
  assert.equal(insights.detectSpendingPatterns(records).length, 1);
  const recurring = insights.detectMoneyLeaks(records);
  assert.equal(recurring.length, 1);
  assert.equal(recurring[0].merchant, 'Cafe');
  assert.equal(recurring[0].monthlyAverage, 1200);
});

test('scenario deltas use the entered monthly change and require recorded income', () => {
  const noData = insights.simulateScenario([], 3000);
  assert.equal(noData.available, false);
  const records = [
    transaction(monthOffset(0), 50000, 'Salary', 'income'),
    transaction(monthOffset(0), 30000, 'Rent'),
  ];
  const result = insights.simulateScenario(records, 3000, 12);
  assert.equal(result.available, true);
  assert.equal(result.difference, 36000);
  assert.equal(result.newPath - result.currentPath, 36000);
});

test('purchase checks do not assume missing income', () => {
  assert.equal(insights.evaluatePurchase([], 5000).available, false);
  const records = [
    transaction(monthOffset(0), 50000, 'Salary', 'income'),
    transaction(monthOffset(0), 30000, 'Rent'),
  ];
  assert.equal(insights.evaluatePurchase(records, 1500).level, 'SAFE');
});

test('goal plan uses only the supplied target and saved amount', () => {
  const result = insights.calculateGoalPlan({ target: 20000, saved: 5000 });
  assert.equal(result.remaining, 15000);
  assert.equal(result.progress, 25);
  assert.equal(result.monthlyRequired, null);
});
