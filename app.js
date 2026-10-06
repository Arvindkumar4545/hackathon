/* ==========================================================================
   SPENDWISE · MONARCH EDITION CLIENT CONTROLLER
   Full-stack state sync, Sidebar tabs, Real-time scanner, Scenarios & Atlas
   ========================================================================== */

const TOKEN_KEY = 'spendwise_token';
const USER_KEY = 'spendwise_user';
const GOALS_KEY = 'spendwise_goals';
const CHOICE_LAB_KEY = 'spendwise_choice_lab';

let currentUser = null;
let currentToken = null;
let expensesList = [];
let categoryChartInstance = null;
let savingsGoals = [];

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
  setupScenarioSwitchers();
  loadSavedGoals();
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
      setAuthState(true);
      await refreshData();
    } catch (e) {
      startGuestSession();
    }
  } else {
    startGuestSession();
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
      dbStatusLabel.textContent = data.status.connected
        ? `MongoDB Atlas (${data.status.cluster})`
        : `MongoDB Cluster0`;
    }
  } catch (err) {
    dbStatusLabel.textContent = 'MongoDB Atlas Ready';
  }
}

// ==========================================================================
// AUTH & GUEST
// ==========================================================================
async function startGuestSession() {
  try {
    const res = await fetch('/api/auth/guest', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      currentToken = data.token;
      currentUser = data.user;
      setAuthState(false);
      await refreshData();
    }
  } catch (e) {
    currentUser = { _id: 'guest_demo_user_id', name: 'Student Explorer', monthlyBudget: 5000 };
    setAuthState(false);
    await refreshData();
  }
}

function setAuthState(isLoggedIn) {
  if (isLoggedIn) {
    authBtnRow.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    navUserName.textContent = currentUser.name || 'Arvind Kumar';
    navUserBudget.textContent = `${formatINR(currentUser.monthlyBudget)} / mo`;
  } else {
    authBtnRow.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    navUserName.textContent = 'Guest Explorer';
    navUserBudget.textContent = `${formatINR((currentUser && currentUser.monthlyBudget) || 5000)} / mo`;
  }
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentToken = null;
  currentUser = null;
  showToast('Logged out. Switched to Guest mode.');
  startGuestSession();
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
      const currentRemaining = ((currentUser && currentUser.monthlyBudget) || 5000) - getCurrentSpent();
      liveImpactSummary.textContent = `Remaining after: ${formatINR(currentRemaining)}`;
      return;
    }

    const parsed = clientSideParse(text);
    pillDetectedAmount.textContent = `₹${parsed.amount}`;
    pillDetectedCategory.textContent = `Category: ${parsed.category}`;
    pillDetectedNote.textContent = `Note: ${parsed.note}`;
    if (pillDetectedMode) pillDetectedMode.textContent = `Mode: ${parsed.paymentMethod}`;

    const currentRemaining = ((currentUser && currentUser.monthlyBudget) || 5000) - getCurrentSpent();
    const afterRemaining = currentRemaining - parsed.amount;
    liveImpactSummary.textContent = `Remaining after: ${formatINR(afterRemaining)} (${afterRemaining >= 0 ? 'Safe' : 'Alert: Overdraft'})`;
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
    if (!text) return;

    const parsed = clientSideParse(text);

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
      }
    } catch (err) {
      showToast('Failed to record transaction');
    }
  });
}

function clientSideParse(rawText) {
  const text = rawText.toLowerCase();
  let amount = 100;

  const match = text.match(/(?:(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?))|(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|bucks|inr)?/i);
  if (match) {
    const val = parseFloat(match[1] || match[2]);
    if (!isNaN(val) && val > 0) amount = val;
  }

  let category = 'Other';
  if (/canteen|food|lunch|dinner|breakfast|tea|chai|coffee|pizza|burger|snack|biryani|juice|maggi|samosa|momos/i.test(text)) category = 'Food';
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
    note: cleanNote,
    date: new Date().toISOString().slice(0, 10),
    paymentMethod,
  };
}

function getCurrentSpent() {
  return expensesList.reduce((sum, item) => sum + Number(item.amount), 0);
}

// ==========================================================================
// SCENARIO SWITCHERS (DEMO SYSTEM)
// ==========================================================================
function setupScenarioSwitchers() {
  document.querySelectorAll('.scenario-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const scenario = btn.getAttribute('data-scenario');
      await applyScenario(scenario);
    });
  });
}

async function applyScenario(scenario) {
  let sampleExpenses = [];
  let scenarioBudget = 5000;

  if (scenario === 'normal') {
    scenarioBudget = 5000;
    sampleExpenses = [
      { amount: 140, category: 'Food', note: 'Canteen Thali & Chai', date: '2026-10-02', paymentMethod: 'UPI' },
      { amount: 60, category: 'Transport', note: 'Metro Ticket to College', date: '2026-10-03', paymentMethod: 'UPI' },
      { amount: 120, category: 'Education', note: 'Semester Xerox & Notes', date: '2026-10-04', paymentMethod: 'Cash' },
      { amount: 80, category: 'Food', note: 'Evening Snacks with Friends', date: '2026-10-05', paymentMethod: 'UPI' },
    ];
    showToast('Loaded: 🍕 Regular College Week');
  } else if (scenario === 'exam') {
    scenarioBudget = 5000;
    sampleExpenses = [
      { amount: 450, category: 'Education', note: 'Reference Textbook (Algorithms)', date: '2026-10-01', paymentMethod: 'UPI' },
      { amount: 180, category: 'Education', note: 'Previous Year Question Prints', date: '2026-10-02', paymentMethod: 'UPI' },
      { amount: 120, category: 'Food', note: 'Late Night Coffee & Energy Drink', date: '2026-10-03', paymentMethod: 'UPI' },
      { amount: 80, category: 'Education', note: 'Exam Stationery & Pens', date: '2026-10-04', paymentMethod: 'Cash' },
      { amount: 150, category: 'Food', note: 'Library Snack Run', date: '2026-10-05', paymentMethod: 'UPI' },
    ];
    showToast('Loaded: 📚 Exam Prep & Books Scenario');
  } else if (scenario === 'party') {
    scenarioBudget = 6000;
    sampleExpenses = [
      { amount: 650, category: 'Entertainment', note: 'Weekend Movie & Popcorn', date: '2026-10-01', paymentMethod: 'UPI' },
      { amount: 850, category: 'Food', note: 'Cafe Pizza Party with Group', date: '2026-10-02', paymentMethod: 'UPI' },
      { amount: 350, category: 'Transport', note: 'Late Night Cab Share', date: '2026-10-03', paymentMethod: 'UPI' },
      { amount: 400, category: 'Shopping', note: 'Fest T-Shirt & Badge', date: '2026-10-04', paymentMethod: 'Card' },
    ];
    showToast('Loaded: 🎉 Outing & Cafe Trip Scenario');
  } else if (scenario === 'reset') {
    scenarioBudget = 5000;
    sampleExpenses = [];
    showToast('Data reset to fresh clean state');
  }

  // Clear current expenses and add scenario expenses
  if (currentUser) {
    currentUser.monthlyBudget = scenarioBudget;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    // Update budget
    await fetch('/api/auth/budget', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ monthlyBudget: scenarioBudget }),
    });

    // Delete existing
    for (const exp of expensesList) {
      await fetch(`/api/expenses/${exp._id || exp.id}`, { method: 'DELETE', headers });
    }

    // Insert scenario items
    for (const item of sampleExpenses) {
      await fetch('/api/expenses', {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });
    }

    await refreshData();
  } catch (err) {
    console.error('Scenario error:', err);
    await refreshData();
  }
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
    expenseModal.showModal();
  } else if (action === 'set-budget') {
    budgetModal.showModal();
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
  await fetchExpenses();
  await fetchStats();
  renderGoals();
}

async function fetchExpenses() {
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
  try {
    const headers = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
    const res = await fetch('/api/expenses/stats', { headers });
    const data = await res.json();
    if (data.success && data.stats) {
      renderMetrics(data.stats);
      renderChart(data.stats.categoryBreakdown);
      renderCategoryList(data.stats.categoryBreakdown);
      render503020Allocator(data.stats.monthlyBudget);
      await fetchAdvisor(data.stats);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderMetrics(stats) {
  const budget = stats.monthlyBudget || 5000;
  const spent = stats.totalSpent || 0;
  const remaining = stats.remaining;
  const percent = stats.percentageUsed || 0;

  valMonthlyBudget.textContent = formatINR(budget);
  valTotalSpent.textContent = formatINR(spent);
  valSpentCount.textContent = `${stats.transactionCount} expenses logged`;
  valRemaining.textContent = formatINR(remaining);
  budgetMaxLabel.textContent = `Limit: ${formatINR(budget)}`;

  valDailyCap.innerHTML = `${formatINR(stats.dailyAverage)}<small>/day</small>`;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());
  valDaysRemaining.textContent = `for next ${daysLeft} days`;

  budgetPercentageText.textContent = `${Math.round(percent)}%`;
  mainProgressBar.style.width = `${Math.min(percent, 100)}%`;

  mainProgressBar.classList.remove('warn', 'danger');
  budgetStatusPill.className = 'badge';

  if (spent >= budget && budget > 0) {
    mainProgressBar.classList.add('danger');
    budgetStatusPill.classList.add('badge-danger');
    budgetStatusPill.textContent = 'Limit Exceeded';
    valRemainingPercent.textContent = 'Overspent!';
    valRemainingPercent.style.color = '#dc2626';
    runwayText.innerHTML = `<strong>⚠️ Alert:</strong> You have reached 100% of your pocket money allowance! Cut non-essential spending immediately.`;
  } else if (percent >= 80) {
    mainProgressBar.classList.add('warn');
    budgetStatusPill.classList.add('badge-warning');
    budgetStatusPill.textContent = '80% Warning';
    valRemainingPercent.textContent = `${Math.round(100 - percent)}% left`;
    valRemainingPercent.style.color = '#d97706';
    runwayText.innerHTML = `<strong>⚠️ Caution:</strong> You have spent ${Math.round(percent)}% of your pocket budget. Keep daily spending under ${formatINR(stats.dailyAverage)} to last until month end.`;
  } else {
    budgetStatusPill.classList.add('badge-success');
    budgetStatusPill.textContent = 'Within Safe Limit';
    valRemainingPercent.textContent = `${Math.round(100 - percent)}% available`;
    valRemainingPercent.style.color = '#059669';
    runwayText.innerHTML = `<strong>🚀 Healthy Runway:</strong> At your current pace, your pocket money is on track to last the entire month comfortably! (${formatINR(stats.dailyAverage)}/day safe cap)`;
  }
}

function render503020Allocator(budget) {
  const total = budget || 5000;
  if (allocNeedsVal) allocNeedsVal.textContent = formatINR(total * 0.5);
  if (allocWantsVal) allocWantsVal.textContent = formatINR(total * 0.3);
  if (allocSavingsVal) allocSavingsVal.textContent = formatINR(total * 0.2);
}

function renderChart(categories) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (categoryChartInstance) categoryChartInstance.destroy();

  if (!categories || !categories.length) {
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
      <td><strong>${escapeHtml(tx.note || tx.category)}</strong></td>
      <td><span class="cat-badge">${tx.category}</span></td>
      <td style="color: #64748b;">${formatDate(tx.date)}</td>
      <td style="color: #64748b;">${tx.paymentMethod || 'UPI'}</td>
      <td class="text-right" style="font-weight: 700;">${formatINR(tx.amount)}</td>
      <td class="text-center">
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
}

// ==========================================================================
// SAVINGS GOALS SYSTEM
// ==========================================================================
function loadSavedGoals() {
  const saved = localStorage.getItem(GOALS_KEY);
  if (saved) {
    try {
      savingsGoals = JSON.parse(saved);
    } catch (e) {
      savingsGoals = getDefaultGoals();
    }
  } else {
    savingsGoals = getDefaultGoals();
  }
}

function getDefaultGoals() {
  return [
    { id: 'g1', title: 'Semester College Trip', icon: '🎒', target: 3000, saved: 1950 },
    { id: 'g2', title: 'Wireless ANC Earbuds', icon: '🎧', target: 2200, saved: 880 },
    { id: 'g3', title: 'Python Certification Fund', icon: '💻', target: 1500, saved: 1100 },
  ];
}

function saveGoals() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(savingsGoals));
  renderGoals();
  renderChoiceGoalOptions();
}

function renderGoals() {
  if (!goalsListGrid) return;
  goalsListGrid.innerHTML = '';

  savingsGoals.forEach((goal) => {
    const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.innerHTML = `
      <div class="goal-top">
        <span class="goal-icon">${goal.icon || '🎯'}</span>
        <div style="flex: 1;">
          <h4 class="goal-title">${escapeHtml(goal.title)}</h4>
          <span class="goal-target">Target: ${formatINR(goal.target)}</span>
        </div>
        <button class="btn-goal-add" data-id="${goal.id}" title="Add ₹200 to this goal">+₹200</button>
      </div>
      <div class="goal-progress-bar">
        <div class="goal-fill" style="width: ${pct}%;"></div>
      </div>
      <div class="goal-footer">
        <span>Saved: ${formatINR(goal.saved)}</span>
        <span style="color: ${pct >= 100 ? '#059669' : '#2563eb'}; font-weight: 600;">${pct}% Completed</span>
      </div>
    `;
    goalsListGrid.appendChild(card);
  });

  goalsListGrid.querySelectorAll('.btn-goal-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gid = btn.getAttribute('data-id');
      const g = savingsGoals.find((x) => x.id === gid);
      if (g) {
        g.saved = Math.min(g.target, g.saved + 200);
        saveGoals();
        showToast(`Added ₹200 to ${g.title}!`);
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
async function fetchAdvisor(stats) {
  try {
    const res = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: stats.monthlyBudget,
        spent: stats.totalSpent,
        categories: stats.categoryBreakdown,
        transactions: expensesList,
      }),
    });

    const data = await res.json();
    if (data.success && data.insights) {
      healthScoreNum.textContent = data.insights.healthScore;
      adviceCardsGrid.innerHTML = '';

      data.insights.recommendations.slice(0, 2).forEach((rec) => {
        const card = document.createElement('div');
        const isSafe = rec.type === 'success' || rec.type === 'tip';
        card.className = `tip-card ${isSafe ? 'tip-success' : 'tip-neutral'}`;
        card.innerHTML = `
          <span class="tip-tag">${escapeHtml(rec.title)}</span>
          <h4>${escapeHtml(rec.title)}</h4>
          <p>${escapeHtml(rec.advice)}</p>
        `;
        adviceCardsGrid.appendChild(card);
      });
    }
  } catch (e) {}
}

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
      body: JSON.stringify({ message: q }),
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
  const paymentMethod = document.getElementById('expPaymentMethod').value;
  const date = document.getElementById('expDate').value;
  const note = document.getElementById('expNote').value.trim();

  if (!amount || amount <= 0 || !category) return;

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, category, paymentMethod, date, note }),
    });

    const data = await res.json();
    if (data.success) {
      showToast('Transaction saved');
      expenseEntryForm.reset();
      document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
      expenseModal.close();
      await refreshData();
    }
  } catch (err) {
    showToast('Failed to save');
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
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        navUserBudget.textContent = `${formatINR(monthlyBudget)} / mo`;
      }
      showToast('Budget updated');
      budgetModal.close();
      await refreshData();
    }
  } catch (err) {
    showToast('Failed to update');
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

    if (!title || !target) return;

    const newGoal = {
      id: 'g_' + Date.now(),
      title,
      icon: '🎯',
      target,
      saved,
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
  const monthlyBudget = Number(document.getElementById('signupBudget').value) || 5000;

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
      authModal.close();
      showToast('Account created in MongoDB Atlas!');
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
        currentViewTitle.textContent = 'How SpendWise Works';
        document.getElementById('onboardingTourCard').scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'transactions') {
        currentViewTitle.textContent = 'Transactions';
        document.querySelector('.monarch-table').scrollIntoView({ behavior: 'smooth' });
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
      }
    });
  });
}

function setupEventListeners() {
  document.getElementById('openAddExpenseBtn').addEventListener('click', () => {
    document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
    expenseModal.showModal();
  });

  document.getElementById('closeExpenseModalBtn').addEventListener('click', () => expenseModal.close());
  document.getElementById('cancelExpenseBtn').addEventListener('click', () => expenseModal.close());

  document.getElementById('setBudgetBtn').addEventListener('click', () => {
    document.getElementById('budgetInputVal').value = (currentUser && currentUser.monthlyBudget) || 5000;
    budgetModal.showModal();
  });

  document.getElementById('closeBudgetModalBtn').addEventListener('click', () => budgetModal.close());
  document.getElementById('cancelBudgetBtn').addEventListener('click', () => budgetModal.close());

  if (btnAddGoal) {
    btnAddGoal.addEventListener('click', () => goalModal.showModal());
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
