const STORAGE_EXPENSES = "student_expenses";
const STORAGE_BUDGET = "student_budget";

const categories = ["Food", "Transport", "Education", "Entertainment", "Shopping", "Other"];

const expenseDialog = document.querySelector("#expenseDialog");
const budgetDialog = document.querySelector("#budgetDialog");
const expenseForm = document.querySelector("#expenseForm");
const budgetForm = document.querySelector("#budgetForm");

const amountInput = document.querySelector("#amount");
const categoryInput = document.querySelector("#category");
const noteInput = document.querySelector("#note");
const dateInput = document.querySelector("#date");
const budgetInput = document.querySelector("#budgetInput");

const budgetAmount = document.querySelector("#budgetAmount");
const spentAmount = document.querySelector("#spentAmount");
const remainingAmount = document.querySelector("#remainingAmount");
const progressBar = document.querySelector("#progressBar");
const progressText = document.querySelector("#progressText");
const categoryBreakdown = document.querySelector("#categoryBreakdown");
const transactionList = document.querySelector("#transactionList");

let expenses = JSON.parse(localStorage.getItem(STORAGE_EXPENSES) || "[]");
let budget = Number(localStorage.getItem(STORAGE_BUDGET) || 0);

const money = (value) => `₹${Number(value).toLocaleString("en-IN", {
  maximumFractionDigits: 2
})}`;

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const monthExpenses = () =>
  expenses.filter((expense) => expense.date.startsWith(currentMonth()));

function save() {
  localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(expenses));
  localStorage.setItem(STORAGE_BUDGET, String(budget));
}

function render() {
  const monthData = monthExpenses();
  const spent = monthData.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = budget - spent;
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  budgetAmount.textContent = money(budget);
  spentAmount.textContent = money(spent);
  remainingAmount.textContent = money(remaining);

  progressBar.style.width = `${percentage}%`;

  if (!budget) {
    progressText.textContent = "Set a budget to start tracking.";
  } else if (spent >= budget) {
    progressText.textContent = `Budget exceeded by ${money(spent - budget)}.`;
  } else if (spent >= budget * 0.8) {
    progressText.textContent = `You've used ${Math.round((spent / budget) * 100)}% of your budget.`;
  } else {
    progressText.textContent = `${Math.round((spent / budget) * 100)}% of your monthly budget used.`;
  }

  renderCategories(monthData, spent);
  renderTransactions(monthData);
}

function renderCategories(data, total) {
  categoryBreakdown.innerHTML = "";

  if (!data.length) {
    categoryBreakdown.innerHTML = `<div class="empty">No expenses this month yet.</div>`;
    return;
  }

  const totals = Object.fromEntries(categories.map((category) => [category, 0]));
  data.forEach((item) => {
    totals[item.category] = (totals[item.category] || 0) + Number(item.amount);
  });

  categories
    .filter((category) => totals[category] > 0)
    .sort((a, b) => totals[b] - totals[a])
    .forEach((category) => {
      const value = totals[category];
      const percent = total ? Math.round((value / total) * 100) : 0;

      const row = document.createElement("div");
      row.className = "category-row";
      row.innerHTML = `
        <div class="category-info">
          <div class="category-name">${category}</div>
          <div class="category-meta">${percent}% of spending</div>
        </div>
        <strong>${money(value)}</strong>
      `;
      categoryBreakdown.appendChild(row);
    });
}

function renderTransactions(data) {
  transactionList.innerHTML = "";

  if (!data.length) {
    transactionList.innerHTML = `<div class="empty">Your spending will appear here. Add your first expense.</div>`;
    return;
  }

  [...data]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 10)
    .forEach((expense) => {
      const row = document.createElement("div");
      row.className = "transaction-row";
      row.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-note">${escapeHtml(expense.note || expense.category)}</div>
          <div class="transaction-date">${expense.category} · ${formatDate(expense.date)}</div>
        </div>
        <div>
          <div class="transaction-amount">${money(expense.amount)}</div>
          <button class="delete-btn" data-id="${expense.id}">Delete</button>
        </div>
      `;
      transactionList.appendChild(row);
    });

  transactionList.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      expenses = expenses.filter((expense) => expense.id !== button.dataset.id);
      save();
      render();
    });
  });
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#addBtn").addEventListener("click", () => {
  dateInput.value = new Date().toISOString().slice(0, 10);
  expenseDialog.showModal();
});

document.querySelector("#closeExpense").addEventListener("click", () => {
  expenseDialog.close();
});

document.querySelector("#budgetBtn").addEventListener("click", () => {
  budgetInput.value = budget || "";
  budgetDialog.showModal();
});

document.querySelector("#closeBudget").addEventListener("click", () => {
  budgetDialog.close();
});

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  if (!amount || amount <= 0 || !categoryInput.value || !dateInput.value) {
    alert("Please enter a valid amount, category, and date.");
    return;
  }

  expenses.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    amount,
    category: categoryInput.value,
    note: noteInput.value.trim(),
    date: dateInput.value
  });

  save();
  expenseForm.reset();
  expenseDialog.close();
  render();
});

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = Number(budgetInput.value);
  if (!value || value <= 0) {
    alert("Please enter a valid monthly budget.");
    return;
  }

  budget = value;
  save();
  budgetDialog.close();
  render();
});

render();
