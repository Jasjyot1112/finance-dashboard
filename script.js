const STORAGE_KEY = "zorvyn-finance-dashboard-v1";
const currencySymbols = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£"
};

const DEFAULT_TRANSACTIONS = [
  { id: crypto.randomUUID(), date: "2026-04-01", amount: 5200, category: "Salary", type: "income" },
  { id: crypto.randomUUID(), date: "2026-04-02", amount: 480, category: "Rent", type: "expense" },
  { id: crypto.randomUUID(), date: "2026-04-03", amount: 210, category: "Food", type: "expense" },
  { id: crypto.randomUUID(), date: "2026-04-04", amount: 320, category: "Freelance", type: "income" },
  { id: crypto.randomUUID(), date: "2026-03-28", amount: 140, category: "Transport", type: "expense" },
  { id: crypto.randomUUID(), date: "2026-03-21", amount: 180, category: "Utilities", type: "expense" },
  { id: crypto.randomUUID(), date: "2026-02-18", amount: 860, category: "Investments", type: "income" },
  { id: crypto.randomUUID(), date: "2026-02-20", amount: 260, category: "Shopping", type: "expense" }
];

const state = {
  role: "Admin",
  theme: "light",
  currency: "USD",
  savingsGoal: 10000,
  transactions: [],
  filters: {
    search: "",
    type: "all",
    month: "all",
    sort: "date-desc"
  }
};

let balanceChart;
let spendingChart;
let monthlyBarChart;
let chartLoadingTimeout;
let editingTransactionId = null;
let editingDraft = null;
let balanceAnimationFrame;
let pendingBalanceAnimation = null;
let pendingDeleteTransactionId = null;

const elements = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  loadState();
  bindEvents();
  populateMonthFilter();
  syncUIControls();
  updateCurrencyDisplay();
  updateFilterStyles();
  updateFormState();
  renderApp();
}

function cacheElements() {
  elements.roleSelect = document.getElementById("roleSelect");
  elements.currencyPill = document.getElementById("currencyPill");
  elements.currencySelect = document.getElementById("currencySelect");
  elements.themeToggle = document.getElementById("themeToggle");
  elements.themeToggleLabel = document.getElementById("themeToggleLabel");
  elements.viewerBanner = document.getElementById("viewerBanner");
  elements.transactionForm = document.getElementById("transactionForm");
  elements.addTransactionButton = document.getElementById("addTransactionButton");
  elements.exportCsvButton = document.getElementById("exportCsvButton");
  elements.dateInput = document.getElementById("dateInput");
  elements.amountInput = document.getElementById("amountInput");
  elements.categoryInput = document.getElementById("categoryInput");
  elements.typeInput = document.getElementById("typeInput");
  elements.dateField = document.getElementById("dateField");
  elements.amountField = document.getElementById("amountField");
  elements.categoryField = document.getElementById("categoryField");
  elements.typeField = document.getElementById("typeField");
  elements.dateError = document.getElementById("dateError");
  elements.amountError = document.getElementById("amountError");
  elements.categoryError = document.getElementById("categoryError");
  elements.typeError = document.getElementById("typeError");
  elements.searchInput = document.getElementById("searchInput");
  elements.typeFilter = document.getElementById("typeFilter");
  elements.monthFilter = document.getElementById("monthFilter");
  elements.sortSelect = document.getElementById("sortSelect");
  elements.tableShell = document.getElementById("tableShell");
  elements.transactionsTable = document.getElementById("transactionsTable");
  elements.transactionsBody = document.getElementById("transactionsBody");
  elements.emptyState = document.getElementById("emptyState");
  elements.chartLoadingOverlay = document.getElementById("chartLoadingOverlay");
  elements.adminPanel = document.getElementById("adminPanel");
  elements.roleBadge = document.getElementById("roleBadge");
  elements.toastContainer = document.getElementById("toastContainer");
  elements.deleteModal = document.getElementById("deleteModal");
  elements.confirmDeleteButton = document.getElementById("confirmDeleteButton");
  elements.cancelDeleteButton = document.getElementById("cancelDeleteButton");
  elements.lastUpdatedText = document.getElementById("lastUpdatedText");
  elements.balanceSummaryCard = document.getElementById("balanceSummaryCard");
  elements.totalBalance = document.getElementById("totalBalance");
  elements.totalIncome = document.getElementById("totalIncome");
  elements.totalExpenses = document.getElementById("totalExpenses");
  elements.savingsRateCard = document.getElementById("savingsRateCard");
  elements.savingsRateMeta = document.getElementById("savingsRateMeta");
  elements.balanceMeta = document.getElementById("balanceMeta");
  elements.incomeMeta = document.getElementById("incomeMeta");
  elements.expenseMeta = document.getElementById("expenseMeta");
  elements.savingsGoalValue = document.getElementById("savingsGoalValue");
  elements.currentBalanceValue = document.getElementById("currentBalanceValue");
  elements.savingsProgressLabel = document.getElementById("savingsProgressLabel");
  elements.savingsProgressBar = document.getElementById("savingsProgressBar");
  elements.savingsGoalStatus = document.getElementById("savingsGoalStatus");
  elements.savingsRemainingValue = document.getElementById("savingsRemainingValue");
  elements.balanceChartPanel = document.getElementById("balanceChartPanel");
  elements.spendingChartPanel = document.getElementById("spendingChartPanel");
  elements.spendingLegend = document.getElementById("spendingLegend");
  elements.monthlyBarChartPanel = document.getElementById("monthlyBarChartPanel");
  elements.chartEmptyPanel = document.getElementById("chartEmptyPanel");
  elements.topCategory = document.getElementById("topCategory");
  elements.topCategoryDetail = document.getElementById("topCategoryDetail");
  elements.spendingTrendHeadline = document.getElementById("spendingTrendHeadline");
  elements.spendingTrendDetail = document.getElementById("spendingTrendDetail");
  elements.topCategoriesHeadline = document.getElementById("topCategoriesHeadline");
  elements.topCategoriesList = document.getElementById("topCategoriesList");
}

function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    state.transactions = DEFAULT_TRANSACTIONS.map((transaction) => ({ ...transaction }));
    elements.dateInput.value = getTodayDate();
    saveState();
    return;
  }

  try {
    const parsedState = JSON.parse(savedState);
    state.role = parsedState.role || "Admin";
    state.theme = parsedState.theme || "light";
    state.currency = currencySymbols[parsedState.currency] ? parsedState.currency : "USD";
    state.savingsGoal = Number(parsedState.savingsGoal) > 0 ? Number(parsedState.savingsGoal) : 10000;
    state.transactions = Array.isArray(parsedState.transactions) && parsedState.transactions.length
      ? parsedState.transactions
      : DEFAULT_TRANSACTIONS;
    state.filters = {
      ...state.filters,
      ...(parsedState.filters || {})
    };
  } catch (error) {
    state.transactions = DEFAULT_TRANSACTIONS.map((transaction) => ({ ...transaction }));
    saveState();
  }

  elements.dateInput.value = getTodayDate();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    role: state.role,
    theme: state.theme,
    currency: state.currency,
    savingsGoal: state.savingsGoal,
    transactions: state.transactions,
    filters: state.filters
  }));
}

function bindEvents() {
  elements.roleSelect.addEventListener("change", (event) => {
    state.role = event.target.value;
    saveState();
    renderRoleUI();
    renderTransactions();
    showToast(`${state.role} mode is now active.`, "success");
  });

  elements.currencySelect.addEventListener("change", (event) => {
    state.currency = event.target.value;
    updateCurrencyDisplay();
    saveState();
    renderDashboard();
    renderTransactions();
  });

  elements.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    applyTheme();
    updateCharts();
    saveState();
  });

  elements.transactionForm.addEventListener("submit", handleAddTransaction);
  elements.searchInput.addEventListener("input", handleSearch);
  elements.typeFilter.addEventListener("change", handleFilter);
  elements.monthFilter.addEventListener("change", handleFilter);
  elements.sortSelect.addEventListener("change", handleFilter);
  elements.exportCsvButton.addEventListener("click", exportTransactionsAsCsv);
  elements.confirmDeleteButton.addEventListener("click", confirmDeleteTransaction);
  elements.cancelDeleteButton.addEventListener("click", closeDeleteModal);
  elements.deleteModal.addEventListener("click", (event) => {
    if (event.target === elements.deleteModal) {
      closeDeleteModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.deleteModal.hidden) {
      closeDeleteModal();
    }
  });
  [elements.dateInput, elements.amountInput, elements.categoryInput, elements.typeInput].forEach((input) => {
    input.addEventListener("input", () => updateFormState(true));
    input.addEventListener("change", () => updateFormState(true));
    input.addEventListener("blur", () => updateFormState(true));
  });

  elements.transactionsBody.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const saveButton = event.target.closest("[data-save-id]");
    const cancelButton = event.target.closest("[data-cancel-id]");
    const deleteButton = event.target.closest("[data-delete-id]");
    if (editButton && state.role === "Admin") {
      startEditingTransaction(editButton.dataset.editId);
      return;
    }

    if (saveButton && state.role === "Admin") {
      saveEditedTransaction(saveButton.dataset.saveId);
      return;
    }

    if (cancelButton) {
      cancelEditingTransaction();
      return;
    }

    if (deleteButton && state.role === "Admin") {
      requestDeleteConfirmation(deleteButton.dataset.deleteId);
    }
  });

  elements.transactionsBody.addEventListener("input", handleInlineEditChange);
  elements.transactionsBody.addEventListener("change", handleInlineEditChange);
}

function syncUIControls() {
  elements.roleSelect.value = state.role;
  elements.currencySelect.value = state.currency;
  elements.searchInput.value = state.filters.search;
  elements.typeFilter.value = state.filters.type;
  elements.monthFilter.value = state.filters.month;
  elements.sortSelect.value = state.filters.sort;
  applyTheme();
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  elements.themeToggleLabel.textContent = state.theme === "light" ? "Dark mode" : "Light mode";
}

function updateCurrencyDisplay() {
  elements.currencySelect.value = state.currency;
  elements.currencyPill.classList.toggle("control-pill--currency", true);
}

function populateMonthFilter() {
  const monthOptions = new Map();
  monthOptions.set("all", "All months");

  state.transactions
    .slice()
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .forEach((transaction) => {
      const monthKey = transaction.date.slice(0, 7);
      if (!monthOptions.has(monthKey)) {
        monthOptions.set(monthKey, formatMonth(monthKey));
      }
    });

  elements.monthFilter.innerHTML = "";

  monthOptions.forEach((label, value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    elements.monthFilter.append(option);
  });

  if (!monthOptions.has(state.filters.month)) {
    state.filters.month = "all";
  }

  elements.monthFilter.value = state.filters.month;
}

function renderApp() {
  renderRoleUI();
  renderDashboard();
  renderTransactions();
}

function renderRoleUI() {
  const isAdmin = state.role === "Admin";
  const readOnlyHint = "Switch to Admin to add transactions";

  if (!isAdmin) {
    editingTransactionId = null;
    editingDraft = null;
  }

  elements.viewerBanner.classList.toggle("is-hidden", isAdmin);
  elements.viewerBanner.hidden = isAdmin;
  elements.adminPanel.classList.toggle("is-readonly", !isAdmin);
  elements.roleBadge.textContent = isAdmin ? "Admin access" : "Viewer access";
  elements.adminPanel.title = isAdmin ? "" : readOnlyHint;
  [elements.dateInput, elements.amountInput, elements.categoryInput, elements.typeInput].forEach((input) => {
    input.disabled = !isAdmin;
    input.title = isAdmin ? "" : readOnlyHint;
  });
  elements.addTransactionButton.title = isAdmin ? "" : readOnlyHint;
  elements.exportCsvButton.title = "Download all transactions as CSV";
  updateFormState();
}

function renderDashboard() {
  const dashboardTransactions = getDashboardTransactions();
  const summary = calculateSummary(dashboardTransactions);
  const insights = calculateInsights(dashboardTransactions, state.transactions);
  const hasAnyTransactions = state.transactions.length > 0;
  const hasDashboardData = dashboardTransactions.length > 0;
  const hasVisibleTransactions = getVisibleTransactions().length > 0;

  elements.totalIncome.textContent = formatCurrency(summary.income);
  elements.totalExpenses.textContent = formatCurrency(summary.expense);
  elements.savingsRateCard.textContent = `${summary.savingsRate}%`;
  elements.balanceMeta.textContent = `${dashboardTransactions.length} entries in scope`;
  elements.incomeMeta.textContent = `${summary.incomeCount} income transactions`;
  elements.expenseMeta.textContent = `${summary.expenseCount} expense transactions`;
  elements.savingsRateMeta.textContent = summary.income > 0 ? "Income retained" : "Awaiting income";

  if (pendingBalanceAnimation) {
    animateBalanceValue(pendingBalanceAnimation.from, pendingBalanceAnimation.to);
    pendingBalanceAnimation = null;
  } else {
    elements.totalBalance.textContent = formatCurrency(summary.balance);
  }

  updateSavingsProgress(summary);
  updateInsights(insights);
  updateLastUpdated();
  handleEmptyState({ hasAnyTransactions, hasDashboardData, hasVisibleTransactions });

  if (!hasAnyTransactions) {
    updateCharts([]);
    showChartLoading(false);
    return;
  }

  scheduleChartUpdate(dashboardTransactions);
}

function updateSavingsProgress(summary) {
  const scopedGoal = state.savingsGoal;
  const currentBalance = Math.max(summary.balance, 0);
  const progressPercent = Math.min((currentBalance / scopedGoal) * 100, 100);
  const remaining = Math.max(scopedGoal - currentBalance, 0);

  elements.savingsGoalValue.textContent = formatCurrency(scopedGoal);
  elements.currentBalanceValue.textContent = formatCurrency(summary.balance);
  elements.savingsProgressLabel.textContent = `${Math.round(progressPercent)}%`;
  elements.savingsRemainingValue.textContent = remaining > 0
    ? `${formatCurrency(remaining)} left`
    : `${formatCurrency(currentBalance - scopedGoal)} above goal`;
  elements.savingsGoalStatus.textContent = remaining > 0
    ? `You are ${formatCurrency(currentBalance)} into your savings journey.`
    : "Savings goal achieved. You are now building surplus.";

  requestAnimationFrame(() => {
    elements.savingsProgressBar.style.width = `${progressPercent}%`;
  });
}

function updateInsights(insights) {
  elements.topCategory.textContent = insights.topCategory;
  elements.topCategoryDetail.textContent = insights.topCategoryAmount > 0
    ? `${formatCurrency(insights.topCategoryAmount)} spent in ${insights.referenceMonthLabel}. Savings rate is ${insights.savingsRate}%.`
    : "Track outgoing categories to reveal your biggest cost center.";

  if (insights.expensesThisMonth === 0 && insights.expensesLastMonth === 0) {
    elements.spendingTrendHeadline.textContent = "No comparison yet";
  } else if (insights.spendingChangeDirection === "up") {
    elements.spendingTrendHeadline.textContent = `You spent ${insights.spendingChangePercent}% more than last month`;
  } else if (insights.spendingChangeDirection === "down") {
    elements.spendingTrendHeadline.textContent = `You spent ${insights.spendingChangePercent}% less than last month`;
  } else {
    elements.spendingTrendHeadline.textContent = "Spending stayed stable month over month";
  }

  const contextReason = insights.topCategoryAmount > 0
    ? insights.spendingChangeDirection === "up"
      ? `↑ due to ${insights.topCategory.toLowerCase()} added this month.`
      : insights.spendingChangeDirection === "down"
        ? `↓ ${insights.topCategory.toLowerCase()} remains your main expense driver.`
        : `${capitalize(insights.topCategory)} continues to be your largest spend category.`
    : "No strong category driver is available yet.";

  elements.spendingTrendDetail.textContent = `Expenses were ${formatCurrency(insights.expensesThisMonth)} in ${insights.referenceMonthLabel} versus ${formatCurrency(insights.expensesLastMonth)} in ${insights.previousMonthLabel}. ${contextReason}`;

  if (!insights.topCategories.length) {
    elements.topCategoriesHeadline.textContent = "No expense data";
    elements.topCategoriesList.innerHTML = "";
    return;
  }

  elements.topCategoriesHeadline.textContent = `${insights.topCategories.length} categories driving spend`;
  elements.topCategoriesList.innerHTML = insights.topCategories.map((entry) => `
    <span class="category-chip">
      <span>${escapeHTML(entry.category)}</span>
      <span class="category-chip__value">${formatCurrency(entry.amount)}</span>
    </span>
  `).join("");
}

function toggleChartState(hasDashboardData) {
  elements.balanceChartPanel.classList.toggle("is-hidden", !hasDashboardData);
  elements.spendingChartPanel.classList.toggle("is-hidden", !hasDashboardData);
  elements.monthlyBarChartPanel.classList.toggle("is-hidden", !hasDashboardData);
  elements.chartEmptyPanel.classList.toggle("is-hidden", hasDashboardData);
  elements.chartEmptyPanel.hidden = hasDashboardData;
}

function handleEmptyState({ hasAnyTransactions, hasDashboardData, hasVisibleTransactions }) {
  if (!hasAnyTransactions) {
    elements.balanceChartPanel.classList.add("is-hidden");
    elements.spendingChartPanel.classList.add("is-hidden");
    elements.monthlyBarChartPanel.classList.add("is-hidden");
    elements.chartEmptyPanel.classList.add("is-hidden");
    elements.chartEmptyPanel.hidden = true;
  } else {
    toggleChartState(hasDashboardData);
  }

  elements.transactionsTable.hidden = !hasVisibleTransactions;
  elements.emptyState.hidden = hasVisibleTransactions;

  if (hasVisibleTransactions) {
    return;
  }

  elements.emptyState.innerHTML = hasAnyTransactions
    ? `
      <div class="empty-state__icon">
        <i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>
      </div>
      <strong>No transactions found</strong>
      <p>Try a different month, type, or search term to bring transactions back into focus.</p>
    `
    : `
      <div class="empty-state__icon">
        <i class="fa-solid fa-wallet" aria-hidden="true"></i>
      </div>
      <strong>No transactions found</strong>
      <p>Add your first transaction to populate the table, charts, and insights.</p>
    `;
}

function scheduleChartUpdate(dashboardTransactions) {
  window.clearTimeout(chartLoadingTimeout);
  showChartLoading(true);

  chartLoadingTimeout = window.setTimeout(() => {
    updateCharts(dashboardTransactions);
    showChartLoading(false);
  }, 180);
}

function showChartLoading(isLoading) {
  elements.chartLoadingOverlay.classList.toggle("is-hidden", !isLoading);
  elements.chartLoadingOverlay.setAttribute("aria-hidden", String(!isLoading));
}

function renderTransactions() {
  const visibleTransactions = getVisibleTransactions();
  const topExpenseIds = getTopExpenseIds(visibleTransactions);
  const peaks = getPeakTransactions(visibleTransactions);
  const isAdmin = state.role === "Admin";

  elements.transactionsBody.innerHTML = "";

  if (!visibleTransactions.length) {
    handleEmptyState({
      hasAnyTransactions: state.transactions.length > 0,
      hasDashboardData: getDashboardTransactions().length > 0,
      hasVisibleTransactions: false
    });
    return;
  }

  elements.transactionsTable.hidden = false;
  elements.emptyState.hidden = true;

  visibleTransactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const isEditing = editingTransactionId === transaction.id;
    const isTopExpense = topExpenseIds.includes(transaction.id);
    const isHighestExpense = peaks.highestExpenseId === transaction.id;
    const isHighestIncome = peaks.highestIncomeId === transaction.id;
    const amountCellClass = isHighestExpense
      ? "amount-cell--top-expense"
      : isHighestIncome
        ? "amount-cell--top-income"
        : "";
    const rowClass = isHighestExpense
      ? "row-highlight--expense"
      : isHighestIncome
        ? "row-highlight--income"
        : "";
    const highlightBadge = isHighestExpense
      ? `<span class="highlight-badge highlight-badge--expense"><i class="fa-solid fa-fire"></i>Top Expense</span>`
      : isHighestIncome
        ? `<span class="highlight-badge highlight-badge--income"><i class="fa-solid fa-arrow-up-right-dots"></i>Top Income</span>`
        : "";

    if (rowClass) {
      row.classList.add(rowClass);
    }

    if (isEditing) {
      row.classList.add("editing-row");
      row.innerHTML = `
        <td class="transaction-date-cell ${isTopExpense ? "transaction-date-cell--highlight" : ""}">
          <input class="inline-edit-input" type="date" value="${editingDraft.date}" data-edit-field="date">
        </td>
        <td>
          <input class="inline-edit-input" type="number" min="0.01" step="0.01" value="${editingDraft.amount}" data-edit-field="amount">
        </td>
        <td>
          <input class="inline-edit-input" type="text" value="${escapeHTML(editingDraft.category)}" data-edit-field="category">
        </td>
        <td>
          <select class="inline-edit-select" data-edit-field="type">
            <option value="income" ${editingDraft.type === "income" ? "selected" : ""}>Income</option>
            <option value="expense" ${editingDraft.type === "expense" ? "selected" : ""}>Expense</option>
          </select>
        </td>
        <td>
          <div class="transaction-actions">
            <button class="save-button" type="button" data-save-id="${transaction.id}"><i class="fa-solid fa-floppy-disk"></i><span>Save</span></button>
            <button class="cancel-button" type="button" data-cancel-id="${transaction.id}"><i class="fa-solid fa-xmark"></i><span>Cancel</span></button>
          </div>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td class="transaction-date-cell ${isTopExpense ? "transaction-date-cell--highlight" : ""}">${formatDate(transaction.date)}</td>
        <td class="amount ${amountCellClass} amount--${transaction.type}">
          ${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}
        </td>
        <td>
          <div class="category-cell__content">
            <span>${escapeHTML(transaction.category)}</span>
            ${highlightBadge}
          </div>
        </td>
        <td>
          <span class="pill pill--${transaction.type}">
            ${capitalize(transaction.type)}
          </span>
        </td>
        <td>
          ${isAdmin
            ? `<div class="transaction-actions"><button class="edit-button" type="button" data-edit-id="${transaction.id}"><i class="fa-solid fa-pen"></i><span>Edit</span></button><button class="delete-button" type="button" data-delete-id="${transaction.id}"><i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Delete</span></button></div>`
            : `<span class="viewer-note">Read only</span>`}
        </td>
      `;
    }

    elements.transactionsBody.append(row);
  });
}

function startEditingTransaction(transactionId) {
  const targetTransaction = state.transactions.find((transaction) => transaction.id === transactionId);
  if (!targetTransaction) {
    return;
  }

  editingTransactionId = transactionId;
  editingDraft = { ...targetTransaction };
  renderTransactions();
}

function handleInlineEditChange(event) {
  const target = event.target;
  if (!target.matches("[data-edit-field]") || !editingDraft) {
    return;
  }

  editingDraft[target.dataset.editField] = target.value;
}

function cancelEditingTransaction() {
  editingTransactionId = null;
  editingDraft = null;
  renderTransactions();
}

function saveEditedTransaction(transactionId) {
  if (!editingDraft) {
    return;
  }

  const normalizedDraft = {
    ...editingDraft,
    amount: Number(editingDraft.amount),
    category: String(editingDraft.category).trim()
  };

  if (!normalizedDraft.date || !normalizedDraft.category || normalizedDraft.amount <= 0 || !normalizedDraft.type) {
    showToast("Please enter a valid date, amount, category, and type.", "error");
    return;
  }

  state.transactions = state.transactions.map((transaction) => (
    transaction.id === transactionId ? { ...transaction, ...normalizedDraft } : transaction
  ));

  editingTransactionId = null;
  editingDraft = null;
  populateMonthFilter();
  saveState();
  renderDashboard();
  renderTransactions();
  showToast("Transaction updated successfully.", "success");
}

function updateCharts(dashboardTransactions = getDashboardTransactions()) {
  if (!dashboardTransactions.length) {
    if (balanceChart) {
      balanceChart.destroy();
      balanceChart = null;
    }

    if (spendingChart) {
      spendingChart.destroy();
      spendingChart = null;
    }

    if (elements.spendingLegend) {
      elements.spendingLegend.innerHTML = "";
    }

    if (monthlyBarChart) {
      monthlyBarChart.destroy();
      monthlyBarChart = null;
    }

    return;
  }

  const textColor = getCSSVariable("--text-secondary");
  const legendTextColor = getCSSVariable("--text-primary");
  const borderColor = getCSSVariable("--border");

  // The line chart uses a running balance so the trend reflects net movement over time.
  const balanceTrendData = buildBalanceTrendData(dashboardTransactions);
  const spendingData = buildSpendingBreakdown(dashboardTransactions);
  const monthlyComparisonData = buildMonthlyComparisonData(dashboardTransactions);
  const spendingPalette = spendingData.empty
    ? ["rgba(148, 163, 184, 0.45)"]
    : ["#2563EB", "#0EA5E9", "#F59E0B", "#DC2626", "#8B5CF6", "#16A34A"];

  if (balanceChart) {
    balanceChart.destroy();
  }

  if (spendingChart) {
    spendingChart.destroy();
  }

  if (monthlyBarChart) {
    monthlyBarChart.destroy();
  }

  balanceChart = new Chart(document.getElementById("balanceChart"), {
    type: "line",
    data: {
      labels: balanceTrendData.labels,
      datasets: [{
        label: "Balance",
        data: balanceTrendData.values,
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 5
      }]
    },
    options: {
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: "easeOutQuart"
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              return `Balance: ${formatCurrency(context.raw)}`;
            }
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: borderColor }
        },
        y: {
          ticks: {
            color: textColor,
            callback(value) {
              return formatCompactCurrency(value);
            }
          },
          grid: { color: borderColor }
        }
      }
    }
  });

  spendingChart = new Chart(document.getElementById("spendingChart"), {
    type: "doughnut",
    data: {
      labels: spendingData.labels,
      datasets: [{
        data: spendingData.values,
        backgroundColor: spendingPalette,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: "70%",
      animation: {
        animateRotate: true,
        duration: 750,
        easing: "easeOutQuart"
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatCurrency(context.raw)}`;
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });

  renderSpendingLegend(spendingData, spendingPalette);

  monthlyBarChart = new Chart(document.getElementById("monthlyBarChart"), {
    type: "bar",
    data: {
      labels: monthlyComparisonData.labels,
      datasets: [
        {
          label: "Income",
          data: monthlyComparisonData.incomeValues,
          backgroundColor: "rgba(22, 163, 74, 0.82)",
          borderRadius: 10,
          maxBarThickness: 26
        },
        {
          label: "Expense",
          data: monthlyComparisonData.expenseValues,
          backgroundColor: "rgba(220, 38, 38, 0.82)",
          borderRadius: 10,
          maxBarThickness: 26
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      animation: {
        duration: 720,
        easing: "easeOutQuart"
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        },
        legend: {
          position: "top",
          labels: {
            color: legendTextColor,
            padding: 18,
            usePointStyle: true,
            boxWidth: 12,
            font: {
              size: 13,
              weight: "600"
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: textColor,
            callback(value) {
              return formatCompactCurrency(value);
            }
          },
          grid: { color: borderColor }
        }
      }
    }
  });
}

function calculateSummary(transactions = []) {
  return transactions.reduce((summary, transaction) => {
    if (transaction.type === "income") {
      summary.income += transaction.amount;
      summary.incomeCount += 1;
    } else {
      summary.expense += transaction.amount;
      summary.expenseCount += 1;
    }

    summary.balance = summary.income - summary.expense;
    summary.savingsRate = summary.income > 0
      ? Math.max(0, Math.round(((summary.income - summary.expense) / summary.income) * 100))
      : 0;
    return summary;
  }, {
    balance: 0,
    income: 0,
    expense: 0,
    savingsRate: 0,
    incomeCount: 0,
    expenseCount: 0
  });
}

function calculateInsights(transactions = [], allTransactions = transactions) {
  const expensesByCategory = new Map();
  const referenceMonthKey = state.filters.month === "all" ? getLocalMonthKey() : state.filters.month;
  const previousMonthKey = getPreviousMonthKey(referenceMonthKey);

  let income = 0;
  let expense = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
      return;
    }

    expense += transaction.amount;
    expensesByCategory.set(
      transaction.category,
      (expensesByCategory.get(transaction.category) || 0) + transaction.amount
    );

  });

  const expensesThisMonth = allTransactions.reduce((total, transaction) => {
    if (transaction.type !== "expense" || !transaction.date.startsWith(referenceMonthKey)) {
      return total;
    }

    return total + transaction.amount;
  }, 0);

  const expensesLastMonth = allTransactions.reduce((total, transaction) => {
    if (transaction.type !== "expense" || !transaction.date.startsWith(previousMonthKey)) {
      return total;
    }

    return total + transaction.amount;
  }, 0);

  const topCategoryEntry = [...expensesByCategory.entries()]
    .sort((left, right) => right[1] - left[1])[0];

  const savingsRate = income > 0
    ? Math.max(0, Math.round(((income - expense) / income) * 100))
    : 0;

  const spendingChange = getSpendingChange(expensesThisMonth, expensesLastMonth);
  const topCategories = [...expensesByCategory.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount }));

  return {
    topCategory: topCategoryEntry ? topCategoryEntry[0] : "No expense data",
    topCategoryAmount: topCategoryEntry ? topCategoryEntry[1] : 0,
    expensesThisMonth,
    expensesLastMonth,
    savingsRate,
    referenceMonthLabel: formatMonth(referenceMonthKey),
    previousMonthLabel: formatMonth(previousMonthKey),
    spendingChangePercent: spendingChange.percent,
    spendingChangeDirection: spendingChange.direction,
    topCategories
  };
}

function validateForm() {
  const errors = {
    date: elements.dateInput.value ? "" : "Please select a date.",
    amount: Number(elements.amountInput.value) > 0 ? "" : "Enter an amount greater than zero.",
    category: elements.categoryInput.value.trim() ? "" : "Please enter a category.",
    type: elements.typeInput.value ? "" : "Please choose a transaction type."
  };

  return {
    isValid: Object.values(errors).every((error) => !error),
    errors
  };
}

function updateFormErrors(errors) {
  const fieldMap = [
    ["date", elements.dateField, elements.dateError],
    ["amount", elements.amountField, elements.amountError],
    ["category", elements.categoryField, elements.categoryError],
    ["type", elements.typeField, elements.typeError]
  ];

  fieldMap.forEach(([key, field, errorNode]) => {
    const hasError = Boolean(errors[key]);
    field.classList.toggle("is-invalid", hasError);
    errorNode.textContent = errors[key] || "";
  });
}

function updateFormState(showErrors = false) {
  const validation = validateForm();

  // Keep the submit state in sync with the current inputs while only surfacing inline errors after interaction.
  updateFormErrors(showErrors ? validation.errors : {
    date: "",
    amount: "",
    category: "",
    type: ""
  });
  elements.addTransactionButton.disabled = !validation.isValid || state.role !== "Admin";
}

function resetTransactionForm() {
  elements.transactionForm.reset();
  elements.typeInput.value = "income";
  updateFormState(false);
  elements.dateInput.focus();
}

function updateFilterStyles() {
  [elements.typeFilter, elements.monthFilter, elements.sortSelect].forEach((input) => {
    const field = input.closest(".field");
    if (!field) {
      return;
    }

    const isDefault = input.id === "typeFilter"
      ? input.value === "all"
      : input.id === "monthFilter"
        ? input.value === "all"
        : input.value === "date-desc";

    field.classList.toggle("is-active", !isDefault);
  });
}

function getCurrencySymbol() {
  return currencySymbols[state.currency] || "$";
}

function handleFilter() {
  state.filters.type = elements.typeFilter.value;
  state.filters.month = elements.monthFilter.value;
  state.filters.sort = elements.sortSelect.value;
  saveState();
  updateFilterStyles();
  filterByMonth();
  renderDashboard();
  renderTransactions();
}

function handleSearch(event) {
  state.filters.search = event.target.value.trim();
  saveState();
  renderTransactions();
}

function handleAddTransaction(event) {
  event.preventDefault();

  if (state.role !== "Admin") {
    showToast("Switch to Admin to add transactions.", "error");
    return;
  }

  const validation = validateForm();
  if (!validation.isValid) {
    updateFormErrors(validation.errors);
    showToast("Please fix the form errors before submitting.", "error");
    return;
  }

  const newTransaction = {
    id: crypto.randomUUID(),
    date: elements.dateInput.value,
    amount: Number(elements.amountInput.value),
    category: elements.categoryInput.value.trim(),
    type: elements.typeInput.value
  };

  const previousBalance = calculateSummary(getDashboardTransactions()).balance;

  // New transactions are inserted at the top so the table feels immediately responsive.
  state.transactions.unshift(newTransaction);
  const nextBalance = calculateSummary(getDashboardTransactions()).balance;
  pendingBalanceAnimation = { from: previousBalance, to: nextBalance };
  resetTransactionForm();

  populateMonthFilter();
  saveState();
  renderDashboard();
  renderTransactions();
  showToast("Transaction added successfully.", "success");
}

function deleteTransaction(transactionId) {
  const targetTransaction = state.transactions.find((transaction) => transaction.id === transactionId);
  if (editingTransactionId === transactionId) {
    cancelEditingTransaction();
  }
  state.transactions = state.transactions.filter((transaction) => transaction.id !== transactionId);

  populateMonthFilter();
  saveState();
  renderDashboard();
  renderTransactions();
  showToast("Transaction deleted.", "success");
}

function requestDeleteConfirmation(transactionId) {
  pendingDeleteTransactionId = transactionId;
  elements.deleteModal.classList.remove("is-hidden");
  elements.deleteModal.hidden = false;
  elements.confirmDeleteButton.focus();
}

function closeDeleteModal() {
  pendingDeleteTransactionId = null;
  elements.deleteModal.classList.add("is-hidden");
  elements.deleteModal.hidden = true;
}

function confirmDeleteTransaction() {
  if (!pendingDeleteTransactionId) {
    closeDeleteModal();
    return;
  }

  const transactionId = pendingDeleteTransactionId;
  closeDeleteModal();
  deleteTransaction(transactionId);
}

function exportTransactionsAsCsv() {
  const header = ["Date", "Amount", "Category", "Type"];
  const rows = state.transactions.map((transaction) => ([
    transaction.date,
    transaction.amount,
    transaction.category,
    capitalize(transaction.type)
  ]));
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zorvyn-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported successfully.", "success");
}

function getDashboardTransactions() {
  // Search is intentionally table-only; the dashboard responds to scoped month and type filters.
  const scopedTransactions = state.transactions.filter((transaction) => {
    return state.filters.type === "all" || transaction.type === state.filters.type;
  });

  return filterByMonth(scopedTransactions);
}

function filterByMonth(transactions = state.transactions) {
  if (state.filters.month === "all") {
    return transactions;
  }

  return transactions.filter((transaction) => transaction.date.startsWith(state.filters.month));
}

function getVisibleTransactions() {
  const query = state.filters.search.toLowerCase();
  const transactions = getDashboardTransactions().filter((transaction) => {
    if (!query) {
      return true;
    }

    return transaction.category.toLowerCase().includes(query) ||
      String(transaction.amount).includes(query) ||
      capitalize(transaction.type).toLowerCase().includes(query);
  });

  return transactions.sort(sortTransactions);
}

function sortTransactions(left, right) {
  switch (state.filters.sort) {
    case "date-asc":
      return new Date(left.date) - new Date(right.date);
    case "amount-desc":
      return right.amount - left.amount;
    case "amount-asc":
      return left.amount - right.amount;
    case "date-desc":
    default:
      return new Date(right.date) - new Date(left.date);
  }
}

function buildBalanceTrendData(transactions) {
  if (!transactions.length) {
    return {
      labels: ["No data"],
      values: [0]
    };
  }

  const sortedTransactions = transactions
    .slice()
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  let runningBalance = 0;

  return sortedTransactions.reduce((trend, transaction) => {
    runningBalance += transaction.type === "income" ? transaction.amount : -transaction.amount;
    trend.labels.push(formatDate(transaction.date, true));
    trend.values.push(Number(runningBalance.toFixed(2)));
    return trend;
  }, { labels: [], values: [] });
}

function buildSpendingBreakdown(transactions) {
  const expensesByCategory = transactions.reduce((categories, transaction) => {
    if (transaction.type !== "expense") {
      return categories;
    }

    categories.set(
      transaction.category,
      (categories.get(transaction.category) || 0) + transaction.amount
    );

    return categories;
  }, new Map());

  if (!expensesByCategory.size) {
    return {
      labels: ["No expenses"],
      values: [1],
      items: [{ label: "No expenses", value: 1, percent: 100 }],
      empty: true
    };
  }

  const sortedEntries = [...expensesByCategory.entries()].sort((left, right) => right[1] - left[1]);
  const topEntries = sortedEntries.slice(0, 5);
  const remainingEntries = sortedEntries.slice(5);
  const otherTotal = remainingEntries.reduce((sum, [, value]) => sum + value, 0);
  const entries = otherTotal > 0
    ? [...topEntries, ["Others", otherTotal]]
    : topEntries;
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return {
    labels: entries.map(([label]) => label),
    values: entries.map(([, value]) => Number(value.toFixed(2))),
    items: entries.map(([label, value]) => ({
      label,
      value: Number(value.toFixed(2)),
      percent: total > 0 ? Math.round((value / total) * 100) : 0
    })),
    empty: false
  };
}

function renderSpendingLegend(spendingData, palette) {
  if (!elements.spendingLegend) {
    return;
  }

  if (spendingData.empty) {
    elements.spendingLegend.innerHTML = `
      <div class="spending-legend__item">
        <span class="spending-legend__dot" style="background:${palette[0]}"></span>
        <div class="spending-legend__content">
          <span class="spending-legend__name">No expenses</span>
          <span class="spending-legend__meta">Add expense transactions to populate the chart.</span>
        </div>
      </div>
    `;
    return;
  }

  elements.spendingLegend.innerHTML = spendingData.items.map((item, index) => `
    <div class="spending-legend__item">
      <span class="spending-legend__dot" style="background:${palette[index % palette.length]}"></span>
      <div class="spending-legend__content">
        <span class="spending-legend__name">${escapeHTML(item.label)}</span>
        <span class="spending-legend__meta">${formatCurrency(item.value)} (${item.percent}%)</span>
      </div>
    </div>
  `).join("");
}

function buildMonthlyComparisonData(transactions) {
  const monthlyTotals = new Map();

  transactions
    .slice()
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .forEach((transaction) => {
      const monthKey = transaction.date.slice(0, 7);
      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, { income: 0, expense: 0 });
      }

      const totals = monthlyTotals.get(monthKey);
      totals[transaction.type] += transaction.amount;
    });

  const entries = [...monthlyTotals.entries()];
  return {
    labels: entries.map(([monthKey]) => formatMonth(monthKey)),
    incomeValues: entries.map(([, totals]) => totals.income),
    expenseValues: entries.map(([, totals]) => totals.expense)
  };
}

function getTopExpenseIds(transactions) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 3)
    .map((transaction) => transaction.id);
}

function getPeakTransactions(transactions) {
  const highestExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .sort((left, right) => right.amount - left.amount)[0];
  const highestIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .sort((left, right) => right.amount - left.amount)[0];

  return {
    highestExpenseId: highestExpense?.id || null,
    highestIncomeId: highestIncome?.id || null
  };
}

function showToast(message, type = "success") {
  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark"
  };

  const labels = {
    success: "Success",
    error: "Error"
  };

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div class="toast__top">
      <i class="toast__icon ${icons[type] || icons.success}" aria-hidden="true"></i>
      <strong>${labels[type] || "Notice"}</strong>
    </div>
    <p>${escapeHTML(message)}</p>
  `;

  elements.toastContainer.prepend(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2600);
}

function animateBalanceValue(from, to) {
  window.cancelAnimationFrame(balanceAnimationFrame);
  const duration = 650;
  const startTime = performance.now();
  elements.balanceSummaryCard.classList.add("is-pulsing");

  const step = (timestamp) => {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = from + (to - from) * eased;
    elements.totalBalance.textContent = formatCurrency(currentValue);

    if (progress < 1) {
      balanceAnimationFrame = window.requestAnimationFrame(step);
      return;
    }

    elements.totalBalance.textContent = formatCurrency(to);
    window.setTimeout(() => {
      elements.balanceSummaryCard.classList.remove("is-pulsing");
    }, 220);
  };

  balanceAnimationFrame = window.requestAnimationFrame(step);
}

function getSpendingChange(current, previous) {
  if (previous <= 0 && current <= 0) {
    return { percent: 0, direction: "flat" };
  }

  if (previous <= 0 && current > 0) {
    return { percent: 100, direction: "up" };
  }

  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 1) {
    return { percent: 0, direction: "flat" };
  }

  return {
    percent: Math.round(Math.abs(delta)),
    direction: delta > 0 ? "up" : "down"
  };
}

function formatCurrency(value) {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);
  return `${sign}${getCurrencySymbol()}${formatNumber(absoluteValue)}`;
}

function formatCompactCurrency(value) {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);
  return `${sign}${getCurrencySymbol()}${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(absoluteValue)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(dateString, short = false) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", short
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMonth(monthString) {
  const [year, month] = monthString.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function updateLastUpdated() {
  if (!elements.lastUpdatedText) {
    return;
  }

  const timestamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());

  elements.lastUpdatedText.textContent = `Last updated: ${timestamp}`;
}

function getTodayDate() {
  return formatDateKey(new Date());
}

function getLocalMonthKey() {
  return formatDateKey(new Date()).slice(0, 7);
}

function getPreviousMonthKey(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 2, 1);
  return formatDateKey(date).slice(0, 7);
}

function formatDateKey(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().split("T")[0];
}

function getCSSVariable(variableName) {
  return getComputedStyle(document.body).getPropertyValue(variableName).trim();
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
