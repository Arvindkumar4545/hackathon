/* FinPilot AI client controller */

const TOKEN_KEY = 'spendwise_token';
const USER_KEY = 'spendwise_user';
const CHOICE_LAB_KEY = 'finpilot_choice_lab';

let currentUser = null;
let currentToken = null;
let expensesList = [];
let categoryChartInstance = null;
let cashflowChartInstance = null;
let savingsGoals = [];
let editingTransactionId = null;

// DOM Elements
const dbStatusLabel = document.getElementById('dbStatusLabel');
const navUserName = document.getElementById('navUserName');
const navUserBudget = document.getElementById('navUserBudget');
const authBtnRow = document.getElementById('authBtnRow');
const logoutBtn = document.getElementById('logoutBtn');
const monthBadge = document.getElementById('monthBadge');
const currentViewTitle = document.getElementById('currentViewTitle');

// Metrics
const valMonthlyBudget = document.getElementById('valMonthlyBudget');
const valTotalSpent = document.getElementById('valTotalSpent');
const valSpentCount = document.getElementById('valSpentCount');
const valRemaining = document.getElementById('valRemaining');
const valRemainingPercent = document.getElementById('valRemainingPercent');
const valDailyCap = document.getElementById('valDailyCap');
const valDaysRemaining = document.getElementById('valDaysRemaining');

// Progress
const mainProgressBar = document.getElementById('mainProgressBar');
const budgetStatusPill = document.getElementById('budgetStatusPill');
const budgetPercentageText = document.getElementById('budgetPercentageText');
const budgetMaxLabel = document.getElementById('budgetMaxLabel');
const runwayText = document.getElementById('runwayText');

// Real-Time Scanner
const liveDetectorForm = document.getElementById('liveDetectorForm');
const liveDetectorInput = document.getElementById('liveDetectorInput');
const pillDetectedAmount = document.getElementById('pillDetectedAmount');
const pillDetectedCategory = document.getElementById('pillDetectedCategory');
const pillDetectedNote = document.getElementById('pillDetectedNote');
const pillDetectedMode = document.getElementById('pillDetectedMode');
const liveImpactSummary = document.getElementById('liveImpactSummary');

// Tables & Categories
const transactionsTableBody = document.getElementById('transactionsTableBody');
const tableEmptyState = document.getElementById('tableEmptyState');
const categorySummaryList = document.getElementById('categorySummaryList');
const categoryFilter = document.getElementById('categoryFilter');
const transactionSearchInput = document.getElementById('transactionSearchInput');

// 50/30/20 Elements
const allocNeedsVal = document.getElementById('allocNeedsVal');
const allocWantsVal = document.getElementById('allocWantsVal');
const allocSavingsVal = document.getElementById('allocSavingsVal');

// Savings Goals
const goalsListGrid = document.getElementById('goalsListGrid');
const goalModal = document.getElementById('goalModal');
const goalEntryForm = document.getElementById('goalEntryForm');
const btnAddGoal = document.getElementById('btnAddGoal');
const closeGoalModalBtn = document.getElementById('closeGoalModalBtn');
const cancelGoalBtn = document.getElementById('cancelGoalBtn');

// Advisor & Coach
const healthScoreNum = document.getElementById('healthScoreNum');
const adviceCardsGrid = document.getElementById('adviceCardsGrid');
const chatThread = document.getElementById('chatThread');
const advisorChatForm = document.getElementById('advisorChatForm');
const advisorChatInput = document.getElementById('advisorChatInput');

// Command Palette (Ctrl+K)
const commandPaletteModal = document.getElementById('commandPaletteModal');
const btnOpenCommandPalette = document.getElementById('btnOpenCommandPalette');
const paletteSearchInput = document.getElementById('paletteSearchInput');
const paletteResultsList = document.getElementById('paletteResultsList');
const closePaletteBtn = document.getElementById('closePaletteBtn');

// Modals
const expenseModal = document.getElementById('expenseModal');
const budgetModal = document.getElementById('budgetModal');
const authModal = document.getElementById('authModal');
const expenseEntryForm = document.getElementById('expenseEntryForm');
const budgetSettingForm = document.getElementById('budgetSettingForm');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFeedback = document.getElementById('loginFeedback');
const signupFeedback = document.getElementById('signupFeedback');

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupSidebarNavigation();
  setupEventListeners();
  setupRealTimeDetector();
  setupCommandPalette();
  setupFinancialTools();
  setupCampusChoiceLab();
  setupBillSplitter();
  await checkDatabase();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  if (monthBadge) {
    monthBadge.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);

  if (savedToken && savedUser) {
    try {
      currentToken = savedToken;
      currentUser = JSON.parse(savedUser);
      if (currentUser._id === 'guest_demo_user_id' || currentUser.id === 'guest_demo_user_id' || String(currentUser.email || '').endsWith('@demo.app')) {
        throw new Error('Guest accounts are no longer supported.');
      }
      const sessionResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (sessionResponse.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        currentToken = null;
        currentUser = null;
        setAuthState(false);
        loadSavedGoals();
        await refreshData();
        showToast('Your previous session expired. Sign in to access your account.');
      } else {
        if (!sessionResponse.ok) {
          throw new Error(`Unable to validate the saved session (${sessionResponse.status}).`);
        }
        setAuthState(true);
        loadSavedGoals();
        await refreshData();
      }
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      currentToken = null;
      currentUser = null;
      setAuthState(false);
      loadSavedGoals();
      await refreshData();
      console.error('Saved session could not be restored:', error);
    }
  } else {
    setAuthState(false);
    loadSavedGoals();
    await refreshData();
  }

  const expDateInput = document.getElementById('expDate');
  if (expDateInput) {
    expDateInput.value = new Date().toISOString().slice(0, 10);
  }
});

// ==========================================================================
// DB STATUS
// ==========================================================================
async function checkDatabase() {
  try {
    const res = await fetch('/api/public/status');
    const data = await res.json();
    if (data.success && data.status) {
      dbStatusLabel.textContent = data.status.connected ? 'Persistent account storage' : 'Temporary server storage';
      document.querySelector('#sidebarDbStatus .pulse-dot').classList.toggle('offline', !data.status.connected);
      document.getElementById('sidebarDbStatus').title = data.status.connected
        ? 'Account and transaction records use MongoDB persistence.'
        : data.status.error || 'Account and transaction records are temporary until the server stops.';
    }
  } catch (err) {
    dbStatusLabel.textContent = 'Database status unavailable';
  }
}

// ==========================================================================
// AUTH & GUEST
// ==========================================================================
function setAuthState(isLoggedIn) {
  if (isLoggedIn) {
    authBtnRow.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    navUserName.textContent = currentUser.name;
    navUserBudget.textContent = currentUser.monthlyBudget > 0 ? `${formatINR(currentUser.monthlyBudget)} / mo limit` : 'No spending limit set';
  } else {
    authBtnRow.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    navUserName.textContent = 'Sign in to begin';
    navUserBudget.textContent = 'Your data, your account';
  }
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentToken = null;
  currentUser = null;
  expensesList = [];
  savingsGoals = [];
  setAuthState(false);
  loadSavedGoals();
  refreshData();
  showToast('Signed out.');
}

// ==========================================================================
// REAL-TIME LIVE DETECTOR
// ==========================================================================
function setupRealTimeDetector() {
  if (!liveDetectorInput) return;

  liveDetectorInput.addEventListener('input', () => {
    const text = liveDetectorInput.value.trim();
    if (!text) {
      pillDetectedAmount.textContent = '₹0.00';
      pillDetectedCategory.textContent = 'Category: -';
      pillDetectedNote.textContent = 'Note: -';
      if (pillDetectedMode) pillDetectedMode.textContent = 'Mode: UPI';
      liveImpactSummary.textContent = 'Enter a transaction description to preview it.';
      return;
    }

    const parsed = clientSideParse(text);
    pillDetectedAmount.textContent = parsed.amount ? formatINR(parsed.amount) : 'Amount needed';
    pillDetectedCategory.textContent = `Category: ${parsed.category}`;
    pillDetectedNote.textContent = `Note: ${parsed.note}`;
    if (pillDetectedMode) pillDetectedMode.textContent = `Mode: ${parsed.paymentMethod}`;

    liveImpactSummary.textContent = parsed.amount
      ? `Recorded spending after entry: ${formatINR(getCurrentSpent() + parsed.amount)}`
      : 'Include the actual amount before saving.';
  });

  document.querySelectorAll('.scanner-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const sample = chip.getAttribute('data-sample');
      liveDetectorInput.value = sample;
      liveDetectorInput.dispatchEvent(new Event('input'));
      liveDetectorInput.focus();
    });
  });

  liveDetectorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = liveDetectorInput.value.trim();
    if (!text || !currentToken) {
      showToast(currentToken ? 'Enter an actual transaction description.' : 'Sign in before recording a transaction.');
      return;
    }

    const parsed = clientSideParse(text);
    if (!parsed.amount) {
      showToast('Could not find an amount. Include the actual transaction amount.');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: parsed.amount,
          category: parsed.category,
          type: parsed.type,
          note: parsed.note,
          date: parsed.date,
          paymentMethod: parsed.paymentMethod,
          isAiSuggested: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Saved: ₹${parsed.amount} for ${parsed.category}`);
        liveDetectorInput.value = '';
        pillDetectedAmount.textContent = '₹0.00';
        pillDetectedCategory.textContent = 'Category: -';
        pillDetectedNote.textContent = 'Note: -';
        await refreshData();
      } else {
        showToast(data.message || 'Could not record transaction.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to record transaction.');
    }
  });
}

function clientSideParse(rawText) {
  const text = rawText.toLowerCase();
  let amount = null;

  const match = text.match(/(?:(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?))|([\d,]+(?:\.\d{1,2})?)\s*(?:rs|rupees|bucks|inr)?/i);
  if (match) {
    const val = parseFloat((match[1] || match[2]).replaceAll(',', ''));
    if (!isNaN(val) && val > 0) amount = val;
  }

  let category = 'Other';
  if (/\bsalary|income|received|earned\b/i.test(text)) category = 'Salary';
  else if (/canteen|food|lunch|dinner|breakfast|tea|chai|coffee|pizza|burger|snack|biryani|juice|maggi|samosa|momos/i.test(text)) category = 'Food';
  else if (/metro|bus|auto|cab|uber|ola|rapido|ticket|fuel|petrol|rickshaw/i.test(text)) category = 'Transport';
  else if (/book|xerox|print|notes|stationery|pen|notebook|exam|tuition|assignment|course|udemy/i.test(text)) category = 'Education';
  else if (/movie|cinema|netflix|spotify|game|match|party|concert|hotstar|club/i.test(text)) category = 'Entertainment';
  else if (/clothes|shoes|dress|amazon|flipkart|shopping|bag|myntra|zudio/i.test(text)) category = 'Shopping';
  else if (/medicine|doctor|pharmacy|gym|protein|health|clinic/i.test(text)) category = 'Health';
  else if (/recharge|wifi|electricity|rent|bill|jio|airtel/i.test(text)) category = 'Utilities';

  let paymentMethod = 'UPI';
  if (/cash/i.test(text)) paymentMethod = 'Cash';
  else if (/card|credit|debit/i.test(text)) paymentMethod = 'Card';

  let cleanNote = rawText.replace(/(?:(?:rs\.?|inr|₹)\s*\d+|\d+\s*(?:rs|rupees|bucks)?)/gi, '').trim();
  if (!cleanNote || cleanNote.length < 2) cleanNote = `${category} expense`;

  return {
    amount,
    category,
    type: category === 'Salary' ? 'income' : 'expense',
    note: cleanNote,
    date: new Date().toISOString().slice(0, 10),
    paymentMethod,
  };
}

function getCurrentSpent() {
  return expensesList.reduce((sum, item) => sum + (item.type === 'income' || item.category === 'Salary' ? 0 : Number(item.amount)), 0);
}

// ==========================================================================
// COMMAND PALETTE (CTRL+K)
// ==========================================================================
function setupCommandPalette() {
  if (!commandPaletteModal) return;

  // Open with Ctrl+K or Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
  });

  if (btnOpenCommandPalette) {
    btnOpenCommandPalette.addEventListener('click', openCommandPalette);
  }

  if (closePaletteBtn) {
    closePaletteBtn.addEventListener('click', () => commandPaletteModal.close());
  }

  if (paletteSearchInput) {
    paletteSearchInput.addEventListener('input', () => {
      const q = paletteSearchInput.value.toLowerCase().trim();
      const items = paletteResultsList.querySelectorAll('.palette-item');
      items.forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }

  paletteResultsList.querySelectorAll('.palette-item').forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      commandPaletteModal.close();
      handlePaletteAction(action);
    });
  });
}

function openCommandPalette() {
  if (paletteSearchInput) paletteSearchInput.value = '';
  paletteResultsList.querySelectorAll('.palette-item').forEach((i) => (i.style.display = 'flex'));
  commandPaletteModal.showModal();
  if (paletteSearchInput) paletteSearchInput.focus();
}

function handlePaletteAction(action) {
  if (action === 'add-expense') {
    document.getElementById('openAddExpenseBtn').click();
  } else if (action === 'set-budget') {
    document.getElementById('setBudgetBtn').click();
  } else if (action === 'choice-lab') {
    document.getElementById('choiceLabSection').scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'bill-split') {
    document.getElementById('billSplitSection').scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'view-allocator') {
    document.getElementById('allocatorSection').scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'view-advisor') {
    document.getElementById('advisorSection').scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'add-goal') {
    goalModal.showModal();
  }
}

// ==========================================================================
// DATA REFRESH & RENDER
// ==========================================================================
async function refreshData() {
  if (!currentToken) {
    expensesList = [];
    valTotalSpent.textContent = '—';
    valSpentCount.textContent = 'Sign in to view recorded activity';
    valMonthlyBudget.textContent = '—';
    valRemaining.textContent = '—';
    valRemainingPercent.textContent = 'Sign in to view your finances';
    renderTable(expensesList);
    renderGoals();
    renderFinancialTools();
    renderCategoryList([]);
    renderChart([]);
    if (healthScoreNum) healthScoreNum.textContent = '—';
    if (adviceCardsGrid) adviceCardsGrid.innerHTML = '<p class="empty-table-msg">Sign in and record your income and expenses to calculate your financial health.</p>';
    return;
  }
  await fetchExpenses();
  await fetchStats();
  renderGoals();
  renderFinancialTools();
}

async function fetchExpenses() {
  if (!currentToken) return;
  try {
    const headers = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
    const res = await fetch('/api/expenses', { headers });
    const data = await res.json();
    if (data.success) {
      expensesList = data.data || [];
      renderTable(expensesList);
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchStats() {
  if (!currentToken) return;
  try {
    const headers = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
    const res = await fetch('/api/expenses/stats', { headers });
    const data = await res.json();
    if (data.success && data.stats) {
      renderMetrics(data.stats);
      renderChart(data.stats.categoryBreakdown);
      renderCategoryList(data.stats.categoryBreakdown);
      render503020Allocator(data.stats.monthlyBudget);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderMetrics(stats) {
  const budget = Number(stats.totalIncome) || Number(stats.monthlyBudget) || 0;
  const spent = stats.totalSpent || 0;
  const remaining = stats.totalIncome > 0 ? stats.totalIncome - spent : (stats.monthlyBudget > 0 ? stats.monthlyBudget - spent : null);
  const percent = stats.percentageUsed || 0;

  document.querySelector('.metric-tile:first-child .tile-label').textContent = stats.totalIncome > 0 ? 'Income This Month' : 'Monthly Spending Limit';
  document.querySelector('.metric-tile:nth-child(3) .tile-label').textContent = stats.totalIncome > 0 ? 'Net This Month' : 'Remaining vs Limit';
  valMonthlyBudget.textContent = budget > 0 ? formatINR(budget) : '—';
  valTotalSpent.textContent = formatINR(spent);
  valSpentCount.textContent = `${stats.transactionCount} transactions recorded`;
  valRemaining.textContent = remaining === null ? '—' : formatINR(remaining);
  budgetMaxLabel.textContent = stats.totalIncome > 0 ? `Income: ${formatINR(stats.totalIncome)}` : `Limit: ${formatINR(budget)}`;

  if (remaining === null) {
    valRemainingPercent.textContent = 'Record income or set a limit';
    valRemainingPercent.style.color = '#64748b';
    budgetPercentageText.textContent = '—';
    mainProgressBar.style.width = '0%';
    mainProgressBar.classList.remove('warn', 'danger');
    budgetStatusPill.className = 'badge';
    budgetStatusPill.textContent = 'No baseline';
    runwayText.textContent = 'Record income or set a monthly spending limit to calculate your remaining funds.';
    valDailyCap.textContent = '—';
    valDaysRemaining.textContent = 'No spending baseline';
    return;
  }

  valDailyCap.innerHTML = spent > 0 ? `${formatINR(stats.dailyAverage)}<small>/day</small>` : '—';
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());
  valDaysRemaining.textContent = spent > 0 ? `average over ${now.getDate()} days` : 'Record activity to estimate';

  budgetPercentageText.textContent = `${Math.round(percent)}%`;
  mainProgressBar.style.width = `${Math.min(percent, 100)}%`;

  mainProgressBar.classList.remove('warn', 'danger');
  budgetStatusPill.className = 'badge';

  if (remaining !== null && remaining < 0) {
    mainProgressBar.classList.add('danger');
    budgetStatusPill.classList.add('badge-danger');
    budgetStatusPill.textContent = 'Limit Exceeded';
    valRemainingPercent.textContent = 'Overspent!';
    valRemainingPercent.style.color = '#dc2626';
    runwayText.textContent = `Recorded spending exceeds your ${stats.totalIncome > 0 ? 'recorded income' : 'monthly limit'} by ${formatINR(Math.abs(remaining))}.`;
  } else if (percent >= 80) {
    mainProgressBar.classList.add('warn');
    budgetStatusPill.classList.add('badge-warning');
    budgetStatusPill.textContent = '80% Warning';
    valRemainingPercent.textContent = `${Math.round(100 - percent)}% left`;
    valRemainingPercent.style.color = '#d97706';
    runwayText.textContent = `You have used ${Math.round(percent)}% of the recorded ${stats.totalIncome > 0 ? 'income' : 'limit'}.`;
  } else {
    budgetStatusPill.classList.add('badge-success');
    budgetStatusPill.textContent = 'Within Safe Limit';
    valRemainingPercent.textContent = `${Math.round(100 - percent)}% available`;
    valRemainingPercent.style.color = '#059669';
    runwayText.textContent = spent > 0 ? `Recorded average spending: ${formatINR(stats.dailyAverage)}/day. This is an estimate, not a guarantee.` : 'No expenses recorded for this month yet.';
  }
}

function renderFinancialTools() {
  const insights = FinancialInsights.generateFinancialInsights(expensesList, currentUser?.monthlyBudget || 0);
  const health = insights.health;
  if (healthScoreNum) healthScoreNum.textContent = health.available ? health.score : '—';
  if (adviceCardsGrid) {
    adviceCardsGrid.innerHTML = '';
    if (!health.available) {
      adviceCardsGrid.innerHTML = `<p class="empty-table-msg">${escapeHtml(health.reason)}</p>`;
    } else {
      const cards = [
        { title: `Risk level: ${health.risk}`, details: `Savings rate across the latest recorded months: ${health.savingsRate.toFixed(1)}%.` },
        ...health.strengths.map((details) => ({ title: 'Strength', details })),
        ...health.problems.map((details) => ({ title: 'Needs attention', details })),
      ];
      cards.forEach(({ title, details }) => {
        const card = document.createElement('div');
        card.className = 'tip-card tip-neutral';
        card.innerHTML = `<span class="tip-tag">${escapeHtml(title)}</span><p>${escapeHtml(details)}</p>`;
        adviceCardsGrid.appendChild(card);
      });
    }
  }

  const patternsNode = document.getElementById('spendingPatterns');
  const patterns = insights.patterns;
  patternsNode.innerHTML = patterns.length
    ? patterns.map((pattern) => `<article class="analysis-item"><strong>${escapeHtml(pattern.title)}</strong><p>${escapeHtml(pattern.evidence)}</p></article>`).join('')
    : '<p class="empty-table-msg">No category increase is supported by consecutive-month records yet.</p>';

  const leaksNode = document.getElementById('moneyLeaks');
  const recurring = insights.recurring;
  leaksNode.innerHTML = recurring.length
    ? recurring.map((item) => `<article class="analysis-item"><strong>${escapeHtml(item.merchant)}</strong><p>Appears in ${item.months} different recorded months; average recorded amount is ${formatINR(item.monthlyAverage)}/month. Consider reviewing whether it is recurring and still useful.</p></article>`).join('')
    : '<p class="empty-table-msg">No merchant repeats across multiple recorded months yet. A repeated merchant does not necessarily mean a subscription.</p>';

  const cash = insights.cashFlow;
  document.getElementById('cashFlowResult').textContent = cash.available
    ? `Estimated remainder: ${formatINR(cash.projectedRemainder)} based on ${cash.basis} and straight-line spending through month-end. Actual bills or income not yet recorded are not included.`
    : cash.reason;

  const futureNode = document.getElementById('futureResult');
  const future = FinancialInsights.simulateScenario(expensesList, 0, 12);
  if (!future.available) {
    futureNode.textContent = future.reason;
  } else {
    const years = [12, 24, 36].map((months) => FinancialInsights.simulateScenario(expensesList, 0, months));
    const suggested = years.map((scenario, index) => `<div class="projection-row"><span>${index + 1} year${index ? 's' : ''}</span><strong>${formatINR(scenario.currentPath)}</strong><span>estimated net path</span></div>`).join('');
    futureNode.innerHTML = `<p>Illustrative accumulation from zero using your recent recorded monthly net, held constant; excludes any starting balance, interest and unrecorded activity. Not a guarantee.</p>${suggested}`;
  }

  renderIncomeExpenseChart();
  renderChallenges();
}

function renderIncomeExpenseChart() {
  const canvas = document.getElementById('incomeExpenseChart');
  const empty = document.getElementById('incomeExpenseEmpty');
  if (!canvas || !empty) return;
  if (cashflowChartInstance) cashflowChartInstance.destroy();
  const months = [...new Set(expensesList.map((transaction) => String(transaction.date || '').slice(0, 7)).filter(Boolean))].sort().slice(-6);
  if (!months.length) {
    canvas.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  if (typeof Chart === 'undefined') {
    canvas.classList.add('hidden');
    empty.textContent = 'The chart library is unavailable; your recorded totals are still available elsewhere.';
    empty.classList.remove('hidden');
    return;
  }
  const income = months.map((month) => FinancialInsights.summarize(expensesList, month).income);
  const expenses = months.map((month) => FinancialInsights.summarize(expensesList, month).expenses);
  canvas.classList.remove('hidden');
  empty.classList.add('hidden');
  cashflowChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Income recorded', data: income, backgroundColor: '#0f766e', borderRadius: 5 },
        { label: 'Expenses recorded', data: expenses, backgroundColor: '#2563eb', borderRadius: 5 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, ticks: { callback: (value) => `₹${Number(value).toLocaleString('en-IN')}` } } },
    },
  });
}

function challengeStorageKey() {
  return currentUser ? `finpilot_checkins_${currentUser.id || currentUser._id}` : null;
}

function renderChallenges() {
  const node = document.getElementById('challengeList');
  if (!node) return;
  const tasks = [
    'Review this month’s recorded transactions',
    'Check one recurring merchant in your history',
    'Update a savings goal contribution',
    'Compare this month with last month',
    'Review your monthly spending limit',
    'Record a missing income or expense',
    'Check your month-end cash-flow estimate',
  ];
  let completed = [];
  try {
    const key = challengeStorageKey();
    const saved = key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
    completed = Array.isArray(saved) ? saved : [];
  } catch (error) {
    completed = [];
  }
  node.innerHTML = tasks.map((task, index) => `<label class="challenge-item"><input type="checkbox" data-challenge="${index}" ${completed.includes(index) ? 'checked' : ''}><span>${escapeHtml(task)}</span></label>`).join('');
  document.getElementById('challengeProgress').textContent = `${completed.length} of ${tasks.length} check-ins completed.`;
}

function setupFinancialTools() {
  document.getElementById('twinQueryForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('twinQueryInput').value.trim();
    if (!message) return;
    const answer = document.getElementById('twinAnswer');
    answer.textContent = 'Checking your recorded finances…';
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: { transactions: expensesList, goals: savingsGoals, budget: currentUser?.monthlyBudget || 0 } }),
      });
      const result = await response.json();
      answer.textContent = result.success ? result.reply : result.message;
    } catch (error) {
      answer.textContent = 'Could not analyze your records. Please try again.';
    }
  });

  document.getElementById('whatIfForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number(document.getElementById('whatIfSaving').value);
    const mode = document.getElementById('whatIfMode').value;
    const monthlyChange = mode === 'spend' ? -amount : amount;
    const result = FinancialInsights.simulateScenario(expensesList, monthlyChange, 12);
    document.getElementById('whatIfResult').textContent = result.available
      ? `Estimated net after 12 months: ${formatINR(result.newPath)} versus ${formatINR(result.currentPath)} on your current recorded path. Difference: ${result.difference >= 0 ? '+' : '−'}${formatINR(Math.abs(result.difference))}. Assumes income and expenses stay constant; this is not guaranteed.`
      : result.reason;
  });

  document.getElementById('purchaseCheckForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const result = FinancialInsights.evaluatePurchase(expensesList, Number(document.getElementById('purchaseAmount').value));
    const node = document.getElementById('purchaseCheckResult');
    node.textContent = result.available
      ? `${result.level}: ${result.explanation} Estimated monthly net after purchase: ${formatINR(result.remainingAfterPurchase)}. This uses recorded income and expenses only.`
      : result.reason;
  });

  document.getElementById('challengeList').addEventListener('change', () => {
    if (!currentUser) return;
    const checked = [...document.querySelectorAll('[data-challenge]:checked')].map((input) => Number(input.dataset.challenge));
    localStorage.setItem(challengeStorageKey(), JSON.stringify(checked));
    renderChallenges();
  });
}

function render503020Allocator(budget) {
  const total = Number(budget) || 0;
  if (allocNeedsVal) allocNeedsVal.textContent = total ? formatINR(total * 0.5) : '—';
  if (allocWantsVal) allocWantsVal.textContent = total ? formatINR(total * 0.3) : '—';
  if (allocSavingsVal) allocSavingsVal.textContent = total ? formatINR(total * 0.2) : '—';
}

function renderChart(categories) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (categoryChartInstance) categoryChartInstance.destroy();

  if (!categories || !categories.length || typeof Chart === 'undefined') {
    ctx.style.display = 'none';
    return;
  }
  ctx.style.display = 'block';

  const labels = categories.map((c) => c.category);
  const data = categories.map((c) => c.amount);
  const colors = ['#2563eb', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { family: "-apple-system, sans-serif", size: 11 }, boxWidth: 10, padding: 8 },
        },
      },
      cutout: '72%',
    },
  });
}

function renderCategoryList(categories) {
  categorySummaryList.innerHTML = '';

  if (!categories || !categories.length) {
    categorySummaryList.innerHTML = `<div class="empty-table-msg">No expenses recorded yet.</div>`;
    return;
  }

  categories.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cat-row-pill';
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="cat-title-text">${item.category}</span>
        <span style="font-size: 11px; color: #64748b;">${item.percentage}%</span>
      </div>
      <span class="cat-val-text">${formatINR(item.amount)}</span>
    `;
    categorySummaryList.appendChild(row);
  });
}

function renderTable(list) {
  transactionsTableBody.innerHTML = '';

  const selectedCat = categoryFilter.value;
  const search = transactionSearchInput.value.toLowerCase().trim();

  let filtered = [...list];
  if (selectedCat !== 'All') filtered = filtered.filter((t) => t.category === selectedCat);
  if (search) {
    filtered = filtered.filter(
      (t) => (t.note && t.note.toLowerCase().includes(search)) || t.category.toLowerCase().includes(search)
    );
  }

  if (!filtered.length) {
    tableEmptyState.classList.remove('hidden');
    return;
  }
  tableEmptyState.classList.add('hidden');

  filtered.forEach((tx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(tx.note || tx.category)}</strong><small class="tx-type">${tx.type === 'income' || tx.category === 'Salary' ? 'Income' : 'Expense'}</small></td>
      <td><span class="cat-badge">${tx.category}</span></td>
      <td style="color: #64748b;">${formatDate(tx.date)}</td>
      <td style="color: #64748b;">${tx.paymentMethod || 'UPI'}</td>
      <td class="text-right" style="font-weight: 700;">${formatINR(tx.amount)}</td>
      <td class="text-center">
        <button class="btn-edit-row" data-id="${tx._id || tx.id}" title="Edit transaction">Edit</button>
        <button class="btn-del-row" data-id="${tx._id || tx.id}" title="Delete">×</button>
      </td>
    `;
    transactionsTableBody.appendChild(tr);
  });

  transactionsTableBody.querySelectorAll('.btn-del-row').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        const headers = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
        const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers });
        const data = await res.json();
        if (data.success) {
          showToast('Expense removed');
          await refreshData();
        }
      } catch (err) {
        showToast('Failed to delete');
      }
    });
  });
  transactionsTableBody.querySelectorAll('.btn-edit-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const transaction = expensesList.find((item) => String(item._id || item.id) === btn.dataset.id);
      if (!transaction) return;
      editingTransactionId = btn.dataset.id;
      document.getElementById('expAmount').value = transaction.amount;
      document.getElementById('expCategory').value = transaction.category;
      document.getElementById('expType').value = transaction.type || (transaction.category === 'Salary' ? 'income' : 'expense');
      document.getElementById('expPaymentMethod').value = transaction.paymentMethod || 'UPI';
      document.getElementById('expDate').value = transaction.date;
      document.getElementById('expNote').value = transaction.note || '';
      document.querySelector('#expenseModal .modal-title').textContent = 'Edit Transaction';
      document.querySelector('#expenseEntryForm button[type="submit"]').textContent = 'Save Changes';
      expenseModal.showModal();
    });
  });
}

// ==========================================================================
// SAVINGS GOALS SYSTEM
// ==========================================================================
function loadSavedGoals() {
  if (!currentUser) {
    savingsGoals = [];
    return;
  }
  const saved = localStorage.getItem(goalsStorageKey());
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      savingsGoals = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      savingsGoals = [];
    }
  } else {
    savingsGoals = [];
  }
}

function goalsStorageKey() {
  return `spendwise_goals_${currentUser.id || currentUser._id}`;
}

function saveGoals() {
  if (!currentUser) return;
  localStorage.setItem(goalsStorageKey(), JSON.stringify(savingsGoals));
  renderGoals();
  renderChoiceGoalOptions();
}

function renderGoals() {
  if (!goalsListGrid) return;
  goalsListGrid.innerHTML = '';
  if (!savingsGoals.length) {
    goalsListGrid.innerHTML = '<p class="empty-table-msg">No financial goals yet. Add a goal to calculate its progress and plan.</p>';
    renderChoiceGoalOptions();
    return;
  }

  savingsGoals.forEach((goal) => {
    const plan = FinancialInsights.calculateGoalPlan(goal);
    const pct = Math.round(plan.progress);
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.innerHTML = `
      <div class="goal-top">
        <span class="goal-icon">${goal.icon || '🎯'}</span>
        <div style="flex: 1;">
          <h4 class="goal-title">${escapeHtml(goal.title)}</h4>
          <span class="goal-target">Target: ${formatINR(goal.target)}</span>
        </div>
        <button class="btn-goal-add" data-id="${goal.id}" title="Record a contribution">Add</button>
      </div>
      <div class="goal-progress-bar">
        <div class="goal-fill" style="width: ${pct}%;"></div>
      </div>
      <div class="goal-footer">
        <span>Saved: ${formatINR(goal.saved)} · Remaining: ${formatINR(plan.remaining)}</span>
        <span style="color: ${pct >= 100 ? '#059669' : '#2563eb'}; font-weight: 600;">${pct}% Completed</span>
      </div>
      <p class="goal-plan">${goal.targetDate ? `Target ${formatDate(goal.targetDate)} · ` : ''}${plan.monthlyRequired ? `Plan for ${formatINR(plan.monthlyRequired)}/month` : 'Add a target date to calculate a monthly plan'}</p>
    `;
    goalsListGrid.appendChild(card);
  });

  goalsListGrid.querySelectorAll('.btn-goal-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gid = btn.getAttribute('data-id');
      const g = savingsGoals.find((x) => x.id === gid);
      if (g) {
        const contribution = Number(window.prompt(`How much did you actually add to ${g.title}?`));
        if (!Number.isFinite(contribution) || contribution <= 0) return;
        g.saved = Math.min(g.target, g.saved + contribution);
        saveGoals();
        showToast(`Recorded ${formatINR(contribution)} for ${g.title}.`);
      }
    });
  });
}

function setupCampusChoiceLab() {
  const inputIds = [
    'choiceAName',
    'choiceACost',
    'choiceAFrequency',
    'choiceBName',
    'choiceBCost',
    'choiceBFrequency',
    'choiceSemesterWeeks',
  ];
  const inputs = inputIds.map((id) => document.getElementById(id));
  const goalSelect = document.getElementById('choiceGoalSelect');
  if (inputs.some((input) => !input) || !goalSelect) return;

  try {
    const saved = JSON.parse(localStorage.getItem(CHOICE_LAB_KEY) || '{}');
    inputs.forEach((input) => {
      if (saved[input.id] !== undefined) input.value = saved[input.id];
    });
    if (saved.goalId) goalSelect.value = saved.goalId;
  } catch (error) {}

  renderChoiceGoalOptions();
  inputs.forEach((input) => input.addEventListener('input', updateCampusChoiceLab));
  goalSelect.addEventListener('change', updateCampusChoiceLab);
  updateCampusChoiceLab();
}

function renderChoiceGoalOptions() {
  const goalSelect = document.getElementById('choiceGoalSelect');
  if (!goalSelect) return;

  const selectedGoalId = goalSelect.value;
  goalSelect.replaceChildren();
  savingsGoals.forEach((goal) => {
    const option = document.createElement('option');
    option.value = goal.id;
    option.textContent = goal.title;
    goalSelect.appendChild(option);
  });
  if (savingsGoals.some((goal) => goal.id === selectedGoalId)) {
    goalSelect.value = selectedGoalId;
  }
  updateCampusChoiceLab();
}

function updateCampusChoiceLab() {
  const getValue = (id) => document.getElementById(id)?.value ?? '';
  const costA = Number(getValue('choiceACost'));
  const frequencyA = Number(getValue('choiceAFrequency'));
  const costB = Number(getValue('choiceBCost'));
  const frequencyB = Number(getValue('choiceBFrequency'));
  const weeks = Number(getValue('choiceSemesterWeeks'));
  const values = [costA, frequencyA, costB, frequencyB, weeks];
  const isValid = values.every(Number.isFinite)
    && costA > 0 && costB > 0
    && frequencyA >= 0 && frequencyA <= 14
    && frequencyB >= 0 && frequencyB <= 14
    && weeks >= 1 && weeks <= 52;

  if (!isValid) return;

  const nameA = getValue('choiceAName').trim() || 'Option A';
  const nameB = getValue('choiceBName').trim() || 'Option B';
  const totalA = costA * frequencyA * weeks;
  const totalB = costB * frequencyB * weeks;
  const difference = Math.abs(totalA - totalB);
  const cheaperName = totalA <= totalB ? nameA : nameB;
  const selectedGoal = savingsGoals.find((goal) => goal.id === getValue('choiceGoalSelect'));

  document.getElementById('choiceWeeksLabel').textContent = weeks;
  document.getElementById('choiceAResultName').textContent = nameA;
  document.getElementById('choiceBResultName').textContent = nameB;
  document.getElementById('choiceATotal').textContent = formatINR(totalA);
  document.getElementById('choiceBTotal').textContent = formatINR(totalB);
  document.getElementById('choiceDelta').textContent = formatINR(difference);
  document.getElementById('choiceRecommendation').textContent = totalA === totalB
    ? 'Both choices cost the same over the semester.'
    : `${cheaperName} costs less over the semester.`;

  const goalImpact = document.getElementById('choiceGoalImpact');
  if (selectedGoal && difference > 0) {
    const remaining = Math.max(0, selectedGoal.target - selectedGoal.saved);
    const coverage = remaining > 0 ? Math.min(100, Math.round((difference / remaining) * 100)) : 100;
    goalImpact.textContent = remaining > 0
      ? `That difference could cover ${coverage}% of the remaining ${selectedGoal.title} goal.`
      : `${selectedGoal.title} is already fully funded; this difference would be extra savings.`;
  } else if (difference === 0) {
    goalImpact.textContent = 'These choices have no cost difference over this semester.';
  } else {
    goalImpact.textContent = 'Create a savings goal to see what this difference could fund.';
  }

  const savedSettings = Object.fromEntries(
    [...document.querySelectorAll('#choiceLabSection input')].map((input) => [input.id, input.value])
  );
  savedSettings.goalId = getValue('choiceGoalSelect');
  localStorage.setItem(CHOICE_LAB_KEY, JSON.stringify(savedSettings));
}

function setupBillSplitter() {
  const inputIds = ['splitBillAmount', 'splitPeople', 'splitPaidAmount', 'splitDescription', 'splitCategory'];
  const inputs = inputIds.map((id) => document.getElementById(id));
  const logButton = document.getElementById('logBillShareBtn');
  if (inputs.some((input) => !input) || !logButton) return;

  inputs.forEach((input) => input.addEventListener('input', updateBillSplit));
  logButton.addEventListener('click', logBillShare);
  updateBillSplit();
}

function getBillSplit() {
  const total = Number(document.getElementById('splitBillAmount').value);
  const people = Number(document.getElementById('splitPeople').value);
  const paid = Number(document.getElementById('splitPaidAmount').value);
  const valid = Number.isFinite(total) && total > 0
    && Number.isInteger(people) && people >= 2 && people <= 20
    && Number.isFinite(paid) && paid >= 0 && paid <= total;

  if (!valid) return null;

  const totalPaise = Math.round(total * 100);
  const baseSharePaise = Math.floor(totalPaise / people);
  return { total, people, paid, share: baseSharePaise / 100, roundingRemainderPaise: totalPaise % people };
}

function formatSplitINR(value) {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateBillSplit() {
  const split = getBillSplit();
  const shareOutput = document.getElementById('splitPerPerson');
  const settlementOutput = document.getElementById('splitSettlement');
  const summaryOutput = document.getElementById('splitSummary');
  const logButton = document.getElementById('logBillShareBtn');

  if (!split) {
    shareOutput.textContent = 'Check the amounts';
    settlementOutput.textContent = 'Enter a valid bill split';
    summaryOutput.textContent = 'Use 2 to 20 people and keep your payment between zero and the bill total.';
    logButton.disabled = true;
    return;
  }

  const balance = Math.round((split.paid - split.share) * 100) / 100;
  shareOutput.textContent = formatSplitINR(split.share);
  settlementOutput.classList.toggle('is-owed', balance > 0);
  settlementOutput.classList.toggle('is-due', balance < 0);
  settlementOutput.textContent = balance > 0
    ? `Group owes you ${formatSplitINR(balance)}`
    : balance < 0
      ? `You owe the group ${formatSplitINR(Math.abs(balance))}`
      : 'You are all settled';
  const roundingNote = split.roundingRemainderPaise
    ? ` ${formatSplitINR(split.roundingRemainderPaise / 100)} remains from paise rounding.`
    : '';
  summaryOutput.textContent = `You paid ${formatSplitINR(split.paid)} of a ${formatSplitINR(split.total)} bill split ${split.people} ways.${roundingNote}`;
  logButton.textContent = `Log my ${formatSplitINR(split.share)} share`;
  logButton.disabled = false;
}

async function logBillShare() {
  const split = getBillSplit();
  if (!split) return;

  const button = document.getElementById('logBillShareBtn');
  const description = document.getElementById('splitDescription').value.trim() || 'Shared bill';
  const category = document.getElementById('splitCategory').value;
  button.disabled = true;

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: split.share,
        category,
        note: `${description} (my ${split.people}-way share)`,
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: document.getElementById('splitPaymentMethod').value,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Unable to save your share.');

    showToast(`${formatSplitINR(split.share)} share added to expenses`);
    await refreshData();
  } catch (error) {
    showToast(error.message || 'Unable to save your share.');
  } finally {
    button.disabled = false;
  }
}

// ==========================================================================
// ADVISOR & CHAT
// ==========================================================================
advisorChatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = advisorChatInput.value.trim();
  if (!q) return;

  appendChat(q, 'user');
  advisorChatInput.value = '';

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q, context: { transactions: expensesList, goals: savingsGoals, budget: currentUser?.monthlyBudget || 0 } }),
    });

    const data = await res.json();
    if (data.success) appendChat(data.reply, 'assistant');
  } catch (err) {
    appendChat('Sorry, please try again.', 'assistant');
  }
});

function appendChat(text, sender) {
  const div = document.createElement('div');
  div.className = `bubble bubble-${sender}`;
  div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  chatThread.appendChild(div);
  chatThread.scrollTop = chatThread.scrollHeight;
}

document.querySelectorAll('.quick-chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    advisorChatInput.value = btn.getAttribute('data-query');
    advisorChatForm.dispatchEvent(new Event('submit'));
  });
});

// ==========================================================================
// MODAL FORMS
// ==========================================================================
expenseEntryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = Number(document.getElementById('expAmount').value);
  const category = document.getElementById('expCategory').value;
  const type = document.getElementById('expType').value;
  const paymentMethod = document.getElementById('expPaymentMethod').value;
  const date = document.getElementById('expDate').value;
  const note = document.getElementById('expNote').value.trim();

  if (!currentToken) {
    showToast('Sign in before saving a transaction.');
    authModal.showModal();
    return;
  }
  if (!amount || amount <= 0 || !category) return;

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    const res = await fetch(editingTransactionId ? `/api/expenses/${editingTransactionId}` : '/api/expenses', {
      method: editingTransactionId ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify({ amount, category, paymentMethod, date, note, type: category === 'Salary' ? 'income' : type }),
    });

    const data = await res.json();
    if (data.success) {
      showToast(editingTransactionId ? 'Transaction updated' : 'Transaction saved');
      editingTransactionId = null;
      expenseEntryForm.reset();
      document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
      document.querySelector('#expenseModal .modal-title').textContent = 'Add New Expense';
      document.querySelector('#expenseEntryForm button[type="submit"]').textContent = 'Save Expense';
      expenseModal.close();
      await refreshData();
    } else {
      showToast(data.message || 'Could not save transaction.');
    }
  } catch (err) {
    showToast(err.message || 'Failed to save transaction.');
  }
});

budgetSettingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const monthlyBudget = Number(document.getElementById('budgetInputVal').value);
  if (!monthlyBudget || monthlyBudget <= 0) return;

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    const res = await fetch('/api/auth/budget', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ monthlyBudget }),
    });

    const data = await res.json();
    if (data.success) {
      if (currentUser) {
        currentUser.monthlyBudget = monthlyBudget;
        if (data.token) {
          currentToken = data.token;
          localStorage.setItem(TOKEN_KEY, currentToken);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        navUserBudget.textContent = `${formatINR(monthlyBudget)} / mo`;
      }
      showToast('Budget updated');
      budgetModal.close();
      await refreshData();
    } else {
      showToast(data.message || 'Could not update the spending limit.');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update the spending limit.');
  }
});

document.querySelectorAll('.preset-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById('budgetInputVal').value = btn.getAttribute('data-amount');
  });
});

// Goal Modal Form
if (goalEntryForm) {
  goalEntryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('goalTitleInput').value.trim();
    const target = Number(document.getElementById('goalTargetInput').value);
    const saved = Number(document.getElementById('goalSavedInput').value) || 0;
    const targetDate = document.getElementById('goalDateInput').value || null;

    if (!currentToken) {
      showToast('Sign in before creating a goal.');
      authModal.showModal();
      return;
    }
    if (!title || !Number.isFinite(target) || target <= 0 || saved < 0) return;

    const newGoal = {
      id: 'g_' + Date.now(),
      title,
      icon: '🎯',
      target,
      saved,
      targetDate,
    };

    savingsGoals.push(newGoal);
    saveGoals();
    showToast(`Savings goal "${title}" created!`);
    goalEntryForm.reset();
    goalModal.close();
  });
}

// Auth Forms
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  loginFeedback.classList.add('hidden');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem(TOKEN_KEY, currentToken);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      setAuthState(true);
      loadSavedGoals();
      authModal.close();
      showToast(`Welcome back, ${currentUser.name}!`);
      await refreshData();
    } else {
      loginFeedback.textContent = data.message || 'Login failed.';
      loginFeedback.classList.remove('hidden');
    }
  } catch (err) {
    loginFeedback.textContent = 'Connection error.';
    loginFeedback.classList.remove('hidden');
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const monthlyBudget = Number(document.getElementById('signupBudget').value) || 0;

  signupFeedback.classList.add('hidden');

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, monthlyBudget }),
    });

    const data = await res.json();
    if (data.success) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem(TOKEN_KEY, currentToken);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      setAuthState(true);
      loadSavedGoals();
      authModal.close();
      showToast(data.message || 'Account created.');
      await refreshData();
    } else {
      signupFeedback.textContent = data.message || 'Signup failed.';
      signupFeedback.classList.remove('hidden');
    }
  } catch (err) {
    signupFeedback.textContent = 'Connection error.';
    signupFeedback.classList.remove('hidden');
  }
});

// ==========================================================================
// NAVIGATION & SIDEBAR
// ==========================================================================
function setupSidebarNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      const tab = item.getAttribute('data-tab');
      if (tab === 'dashboard') {
        currentViewTitle.textContent = 'Dashboard';
        document.querySelector('.dashboard-scrollable').scrollTo({ top: 0, behavior: 'smooth' });
      } else if (tab === 'tour') {
        currentViewTitle.textContent = 'How FinPilot Works';
        document.getElementById('onboardingTourCard').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'transactions') {
        currentViewTitle.textContent = 'Transactions';
        document.querySelector('.finpilot-table').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'choice-lab') {
        currentViewTitle.textContent = 'Campus Choice Lab';
        document.getElementById('choiceLabSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'bill-split') {
        currentViewTitle.textContent = 'Campus Bill Splitter';
        document.getElementById('billSplitSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'allocator') {
        currentViewTitle.textContent = '50/30/20 Planner';
        document.getElementById('allocatorSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'goals') {
        currentViewTitle.textContent = 'Savings Goals';
        document.getElementById('goalsSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'advisor') {
        currentViewTitle.textContent = 'AI Financial Coach';
        document.getElementById('advisorSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'twin') {
        currentViewTitle.textContent = 'Financial Twin';
        document.getElementById('financialTwinSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'what-if') {
        currentViewTitle.textContent = 'What If?';
        document.getElementById('whatIfSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'insights') {
        currentViewTitle.textContent = 'Spending Detective';
        document.getElementById('insightsSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'future') {
        currentViewTitle.textContent = 'Financial Future';
        document.getElementById('futureSection').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'challenges') {
        currentViewTitle.textContent = 'Money Check-ins';
        document.getElementById('challengesSection').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function setupEventListeners() {
  document.getElementById('openAddExpenseBtn').addEventListener('click', () => {
    if (!currentToken) {
      switchAuth('login');
      authModal.showModal();
      return;
    }
    editingTransactionId = null;
    document.querySelector('#expenseModal .modal-title').textContent = 'Add New Transaction';
    document.querySelector('#expenseEntryForm button[type="submit"]').textContent = 'Save Transaction';
    expenseEntryForm.reset();
    document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
    expenseModal.showModal();
  });

  document.getElementById('closeExpenseModalBtn').addEventListener('click', () => expenseModal.close());
  document.getElementById('cancelExpenseBtn').addEventListener('click', () => expenseModal.close());

  document.getElementById('setBudgetBtn').addEventListener('click', () => {
    if (!currentToken) {
      switchAuth('login');
      authModal.showModal();
      return;
    }
    document.getElementById('budgetInputVal').value = currentUser?.monthlyBudget || '';
    budgetModal.showModal();
  });

  document.getElementById('closeBudgetModalBtn').addEventListener('click', () => budgetModal.close());
  document.getElementById('cancelBudgetBtn').addEventListener('click', () => budgetModal.close());

  if (btnAddGoal) {
    btnAddGoal.addEventListener('click', () => {
      if (!currentToken) {
        switchAuth('login');
        authModal.showModal();
        return;
      }
      goalModal.showModal();
    });
  }
  if (closeGoalModalBtn) {
    closeGoalModalBtn.addEventListener('click', () => goalModal.close());
  }
  if (cancelGoalBtn) {
    cancelGoalBtn.addEventListener('click', () => goalModal.close());
  }

  document.getElementById('openLoginBtn').addEventListener('click', () => {
    switchAuth('login');
    authModal.showModal();
  });

  document.getElementById('openSignupBtn').addEventListener('click', () => {
    switchAuth('signup');
    authModal.showModal();
  });

  document.getElementById('closeAuthModalBtn').addEventListener('click', () => authModal.close());
  logoutBtn.addEventListener('click', handleLogout);

  document.getElementById('tabLoginBtn').addEventListener('click', () => switchAuth('login'));
  document.getElementById('tabSignupBtn').addEventListener('click', () => switchAuth('signup'));

  categoryFilter.addEventListener('change', () => renderTable(expensesList));
  transactionSearchInput.addEventListener('input', () => renderTable(expensesList));
  document.getElementById('refreshStatsBtn').addEventListener('click', refreshData);
}

function switchAuth(tab) {
  const tabLogin = document.getElementById('tabLoginBtn');
  const tabSignup = document.getElementById('tabSignupBtn');

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

function formatDate(date) {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
