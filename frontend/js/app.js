const EXPENSE_CATEGORIES = [
    "food",
    "transport",
    "housing",
    "bills",
    "entertainment",
    "shopping",
    "health",
    "education",
    "other"
];

const INCOME_CATEGORIES = [
    "salary",
    "freelance",
    "other"
];

const CATEGORY_OPTIONS = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
const TYPE_OPTIONS = ["income", "expense"];
const PERIOD_OPTIONS = ["month", "week", "year", "day"];

const authState = {
    token: authApi.getToken(),
    user: null,
    survey: null
};

const appState = {
    selectedPeriod: "month",
    savedTransactions: [],
    latestSummary: null,
    latestInsights: [],
    transientAnalysis: null,
    parsedTransactionDraft: null,
    editingTransactionId: null,
    pendingVerification: null,
    entryType: "expense",
    entryAmount: "0",
    entryCategory: "food"
};

const views = {
    landing: document.getElementById("view-landing"),
    auth: document.getElementById("view-auth"),
    survey: document.getElementById("view-survey"),
    app: document.getElementById("view-app")
};

const elements = {
    toast: document.getElementById("toast"),
    lastUpdated: document.getElementById("last-updated"),
    primaryInsightTitle: document.getElementById("primary-insight-title"),
    primaryInsightMessage: document.getElementById("primary-insight-message"),
    dashboardStatus: document.getElementById("dashboard-status"),
    savingsRate: document.getElementById("savings-rate"),
    income: document.getElementById("income"),
    expenses: document.getElementById("expenses"),
    balance: document.getElementById("balance"),
    radialLegend: document.getElementById("radial-legend"),
    trackerCurrencyLabel: document.getElementById("tracker-currency-label"),
    insightsList: document.getElementById("insights-list"),
    transactionsBody: document.getElementById("transactions-body"),
    chatMessages: document.getElementById("chat-messages"),
    lineChartCanvas: document.getElementById("line-chart"),
    barChartCanvas: document.getElementById("bar-chart"),
    pieChartCanvas: document.getElementById("pie-chart"),
    statementFileInput: document.getElementById("statement-file-input"),
    drawerBackdrop: document.getElementById("drawer-backdrop"),
    leftDrawer: document.getElementById("left-drawer"),
    rightDrawer: document.getElementById("right-drawer"),
    textAnalysisSheet: document.getElementById("text-analysis-sheet"),
    entrySheet: document.getElementById("entry-sheet"),
    transactionsSheet: document.getElementById("transactions-sheet"),
    manualSheet: document.getElementById("manual-sheet"),
    chatWidget: document.getElementById("chat-widget"),
    aiPreview: document.getElementById("ai-preview"),
    aiPreviewContent: document.getElementById("ai-preview-content"),
    aiText: document.getElementById("ai-text"),
    chatInput: document.getElementById("chat-input"),
    entrySheetTitle: document.getElementById("entry-sheet-title"),
    entryCurrency: document.getElementById("entry-currency"),
    entryAmountDisplay: document.getElementById("entry-amount-display"),
    entryDate: document.getElementById("entry-date"),
    entryNote: document.getElementById("entry-note"),
    entryCategoryGrid: document.getElementById("entry-category-grid"),
    entryKeypad: document.getElementById("entry-keypad"),
    manualFormTitle: document.getElementById("manual-form-title"),
    submitBtn: document.getElementById("submit-btn"),
    cancelEditBtn: document.getElementById("cancel-edit-btn"),
    nameInput: document.getElementById("name"),
    amountInput: document.getElementById("amount"),
    typeInput: document.getElementById("type"),
    categoryInput: document.getElementById("category"),
    dateInput: document.getElementById("date"),
    filterType: document.getElementById("filter-type"),
    filterCategory: document.getElementById("filter-category"),
    filterFrom: document.getElementById("from-date"),
    filterTo: document.getElementById("to-date"),
    searchInput: document.getElementById("search"),
    periodFilter: document.getElementById("period-filter"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    registerName: document.getElementById("register-name"),
    registerEmail: document.getElementById("register-email"),
    registerPassword: document.getElementById("register-password"),
    verifyToken: document.getElementById("verify-token"),
    authTitle: document.getElementById("auth-title"),
    authSubtitle: document.getElementById("auth-subtitle"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    verifyPanel: document.getElementById("verify-panel"),
    surveyFinancialGoal: document.getElementById("survey-financial-goal"),
    surveyTrackerGoal: document.getElementById("survey-tracker-goal"),
    surveyCapital: document.getElementById("survey-capital"),
    surveyCapitalCurrency: document.getElementById("survey-capital-currency"),
    surveyAge: document.getElementById("survey-age"),
    surveySkills: document.getElementById("survey-skills"),
    surveyNonFinancialGoal: document.getElementById("survey-non-financial-goal"),
    sidebarUserEmail: document.getElementById("sidebar-user-email")
};

const buttons = {
    heroStart: document.getElementById("hero-start-btn"),
    heroLogin: document.getElementById("hero-login-btn"),
    switchToRegister: document.getElementById("switch-to-register"),
    switchToLogin: document.getElementById("switch-to-login"),
    verifyAccount: document.getElementById("verify-account-btn"),
    backToLogin: document.getElementById("back-to-login-btn"),
    skipSurvey: document.getElementById("skip-survey-btn"),
    openLeftDrawer: document.getElementById("open-left-drawer-btn"),
    closeLeftDrawer: document.getElementById("close-left-drawer-btn"),
    openRightDrawer: document.getElementById("open-right-drawer-btn"),
    closeRightDrawer: document.getElementById("close-right-drawer-btn"),
    openUpload: document.getElementById("open-upload-btn"),
    triggerUpload: document.getElementById("trigger-upload-btn"),
    openTextAnalysis: document.getElementById("open-text-analysis-btn"),
    closeTextAnalysis: document.getElementById("close-text-analysis-btn"),
    openSurvey: document.getElementById("open-survey-btn"),
    openTransactions: document.getElementById("open-transactions-btn"),
    closeTransactions: document.getElementById("close-transactions-sheet-btn"),
    openManualMode: document.getElementById("open-manual-mode-btn"),
    closeManual: document.getElementById("close-manual-sheet-btn"),
    openExpenseEntry: document.getElementById("open-expense-entry-btn"),
    openIncomeEntry: document.getElementById("open-income-entry-btn"),
    closeEntry: document.getElementById("close-entry-sheet-btn"),
    chatFab: document.getElementById("chat-fab-btn"),
    closeChat: document.getElementById("close-chat-widget-btn"),
    openDetails: document.getElementById("open-details-btn"),
    confirmAi: document.getElementById("confirm-ai-btn"),
    discardAi: document.getElementById("discard-ai-btn"),
    logoutDrawer: document.getElementById("logout-drawer-btn")
};

const forms = {
    survey: document.getElementById("survey-form"),
    login: document.getElementById("login-form"),
    register: document.getElementById("register-form"),
    aiParse: document.getElementById("ai-parse-form"),
    transaction: document.getElementById("transaction-form"),
    chat: document.getElementById("chat-form")
};

function showToast(message, kind = "info") {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${kind}`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        elements.toast.className = "toast hidden";
    }, 2800);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function toInputDate(value) {
    const date = value ? new Date(value) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatMoney(value, currency = "PLN", digits = 2) {
    const amount = Number(value || 0);
    return `${amount.toFixed(digits)} ${currency}`;
}

function getTrackerCurrency() {
    return authState.survey?.capital_currency || appState.latestSummary?.base_currency || "PLN";
}

function setSelectOptions(selectElement, values, withAllOption = false) {
    selectElement.innerHTML = "";
    if (withAllOption) {
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All";
        selectElement.appendChild(allOption);
    }

    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        selectElement.appendChild(option);
    });
}

function setActiveView(viewName) {
    Object.entries(views).forEach(([key, element]) => {
        element.classList.toggle("active", key === viewName);
    });
}

function showAuthMode(mode) {
    const loginVisible = mode === "login";
    const registerVisible = mode === "register";
    const verifyVisible = mode === "verify";
    elements.loginForm.classList.toggle("hidden", !loginVisible);
    elements.registerForm.classList.toggle("hidden", !registerVisible);
    elements.verifyPanel.classList.toggle("hidden", !verifyVisible);

    if (loginVisible) {
        elements.authTitle.textContent = "Welcome back";
        elements.authSubtitle.textContent = "Open your personal money review workspace.";
    } else if (registerVisible) {
        elements.authTitle.textContent = "Create account";
        elements.authSubtitle.textContent = "Create an account only if you want to save analyses and come back later.";
    } else {
        elements.authTitle.textContent = "Verify email";
        elements.authSubtitle.textContent = "Confirm your account and continue to the workspace.";
    }
}

function showSheet(sheet) {
    [elements.textAnalysisSheet, elements.entrySheet, elements.transactionsSheet, elements.manualSheet].forEach((item) => {
        item.classList.toggle("hidden", item !== sheet);
    });
    closeDrawers();
}

function hideSheets() {
    [elements.textAnalysisSheet, elements.entrySheet, elements.transactionsSheet, elements.manualSheet].forEach((sheet) => {
        sheet.classList.add("hidden");
    });
}

function openDrawer(drawer) {
    closeDrawers();
    drawer.classList.add("open");
    elements.drawerBackdrop.classList.remove("hidden");
}

function closeDrawers() {
    elements.leftDrawer.classList.remove("open");
    elements.rightDrawer.classList.remove("open");
    elements.drawerBackdrop.classList.add("hidden");
}

function openChatWidget() {
    elements.chatWidget.classList.remove("hidden");
}

function closeChatWidget() {
    elements.chatWidget.classList.add("hidden");
}

function discardAiPreview() {
    appState.parsedTransactionDraft = null;
    elements.aiPreview.classList.add("hidden");
    elements.aiPreviewContent.innerHTML = "";
}

function getCategoryPalette(index) {
    const palette = [
        "#6fa9ff",
        "#5dd0a5",
        "#f3b24f",
        "#f57ac4",
        "#9d7ef8",
        "#8f98a8",
        "#ff8a4c",
        "#8be0d1"
    ];
    return palette[index % palette.length];
}

function normalizeTransaction(transaction, fallbackCurrency = "PLN") {
    return {
        ...transaction,
        id: transaction.id || crypto.randomUUID(),
        name: transaction.note || transaction.name || "Untitled transaction",
        date: toInputDate(transaction.transaction_date || transaction.date),
        originalAmount: Number(transaction.amount || 0),
        convertedAmount: Number(transaction.amount_pln ?? transaction.converted_amount ?? transaction.amount ?? 0),
        currency: transaction.currency || fallbackCurrency,
        source: transaction.source || "analysis"
    };
}

function buildPeriodBreakdown(transactions) {
    const grouped = new Map();

    [...transactions]
        .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date))
        .forEach((transaction) => {
            const date = new Date(transaction.transaction_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const label = date.toLocaleDateString("en-US", { month: "short" });
            if (!grouped.has(key)) {
                grouped.set(key, {
                    period: key,
                    label,
                    income: 0,
                    expense: 0
                });
            }

            const bucket = grouped.get(key);
            const amount = Number(transaction.amount_pln ?? transaction.amount ?? 0);
            if (transaction.type === "income") {
                bucket.income += amount;
            } else {
                bucket.expense += amount;
            }
        });

    return Array.from(grouped.values());
}

function buildSummaryFromTransient(analysis) {
    const transactions = (analysis?.transactions || []).map((transaction) => normalizeTransaction(transaction, analysis.summary.currency || "PLN"));
    const categoryTotals = new Map();
    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
        const amount = Number(transaction.amount_pln ?? transaction.amount ?? 0);
        if (transaction.type === "income") {
            income += amount;
        } else {
            expense += amount;
            categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) || 0) + amount);
        }
    });

    const categoryBreakdown = Array.from(categoryTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => ({ category, amount }));

    return {
        balance: Number(analysis.summary.net_total || 0),
        starting_balance: 0,
        income_total: Number(analysis.summary.income_total || 0),
        expense_total: Number(analysis.summary.expense_total || 0),
        base_currency: analysis.summary.currency || "PLN",
        selected_period: appState.selectedPeriod,
        category_breakdown: categoryBreakdown,
        period_breakdown: buildPeriodBreakdown(transactions),
        transaction_count: transactions.length
    };
}

function getDisplaySummary() {
    if (appState.transientAnalysis) {
        return buildSummaryFromTransient(appState.transientAnalysis);
    }
    return appState.latestSummary;
}

function getDisplayTransactions() {
    if (appState.transientAnalysis) {
        return appState.transientAnalysis.transactions.map((item) => normalizeTransaction(item, appState.transientAnalysis.summary.currency || "PLN"));
    }
    return appState.savedTransactions;
}

function getDisplayInsights() {
    if (appState.transientAnalysis) {
        const insights = appState.transientAnalysis.insights || [];
        if (!insights.length) {
            return [
                { title: "Analysis ready", message: "We parsed the uploaded data and prepared a compact review." }
            ];
        }

        return insights.map((item, index) => ({
            title: index === 0 ? "Main finding" : `Insight ${index + 1}`,
            message: item
        }));
    }

    return appState.latestInsights;
}

function renderRadialLegend(summary) {
    elements.radialLegend.innerHTML = "";
    const categories = summary?.category_breakdown || [];

    if (!categories.length) {
        elements.radialLegend.innerHTML = '<p class="empty-legend">No expense categories yet.</p>';
        return;
    }

    const total = categories.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 1;
    categories.slice(0, 6).forEach((item, index) => {
        const percent = Math.round((Number(item.amount || 0) / total) * 100);
        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";
        legendItem.innerHTML = `
            <span class="legend-dot" style="background:${getCategoryPalette(index)}"></span>
            <strong>${escapeHtml(item.category)}</strong>
            <small>${percent}%</small>
        `;
        elements.radialLegend.appendChild(legendItem);
    });
}

function renderInsights(insights) {
    const list = insights?.length
        ? insights
        : [{ title: "No analysis yet", message: "Paste spending, upload a file, or add a transaction to see a review." }];

    const [primary, ...secondary] = list;
    elements.primaryInsightTitle.textContent = primary.title;
    elements.primaryInsightMessage.textContent = primary.message;
    elements.insightsList.innerHTML = "";

    secondary.slice(0, 3).forEach((item) => {
        const card = document.createElement("article");
        card.className = "insight-card";
        card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.message)}</p>`;
        elements.insightsList.appendChild(card);
    });

    if (!secondary.length) {
        const fallback = document.createElement("article");
        fallback.className = "insight-card";
        fallback.innerHTML = "<h3>Ready for follow-up</h3><p>Open the AI bubble and ask what changed, where you overspend, or what to fix next.</p>";
        elements.insightsList.appendChild(fallback);
    }
}

function renderSummary(summary) {
    if (!summary) {
        return;
    }

    const currency = summary.base_currency || "PLN";
    const income = Number(summary.income_total || 0);
    const expense = Number(summary.expense_total || 0);
    const balance = Number(summary.balance || 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    elements.income.textContent = formatMoney(income, currency);
    elements.expenses.textContent = formatMoney(expense, currency);
    elements.balance.textContent = formatMoney(balance, currency);
    elements.savingsRate.textContent = `${savingsRate.toFixed(1)}%`;
    elements.trackerCurrencyLabel.textContent = currency;
    elements.entryCurrency.textContent = currency;
    elements.lastUpdated.textContent = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const statusLabel = appState.transientAnalysis
        ? `Showing imported review · ${summary.transaction_count} parsed transaction(s)`
        : `Saved tracker view · ${summary.selected_period}`;
    elements.dashboardStatus.textContent = statusLabel;
    renderRadialLegend(summary);
}

function renderAiPreview(draft) {
    const transactions = draft?.transactions || [];
    const summary = buildSummaryFromTransient(draft);
    const topCategory = summary.category_breakdown[0]?.category || "other";
    elements.aiPreviewContent.innerHTML = `
        <div><span>Parsed</span><strong>${transactions.length} item(s)</strong></div>
        <div><span>Income</span><strong>${formatMoney(summary.income_total, summary.base_currency)}</strong></div>
        <div><span>Expenses</span><strong>${formatMoney(summary.expense_total, summary.base_currency)}</strong></div>
        <div><span>Main category</span><strong>${escapeHtml(topCategory)}</strong></div>
        <div class="full-span"><span>Next</span><strong>Review the overview, then save parsed transactions if it looks correct.</strong></div>
    `;
    elements.aiPreview.classList.remove("hidden");
}

function renderTransactionsList() {
    const filtered = getFilteredTransactions(getDisplayTransactions(), {
        searchValue: elements.searchInput.value || "",
        typeValue: elements.filterType.value,
        categoryValue: elements.filterCategory.value,
        fromDateValue: elements.filterFrom.value,
        toDateValue: elements.filterTo.value
    });

    elements.transactionsBody.innerHTML = "";
    if (!filtered.length) {
        elements.transactionsBody.innerHTML = '<div class="empty-state small">No transactions match the current filters.</div>';
        return;
    }

    const showActions = !appState.transientAnalysis;
    filtered.forEach((transaction) => {
        const isIncome = transaction.type === "income";
        const card = document.createElement("article");
        card.className = "transaction-card";
        card.innerHTML = `
            <div class="transaction-card-top">
                <div>
                    <strong>${escapeHtml(transaction.name)}</strong>
                    <p>${escapeHtml(transaction.date)} · ${escapeHtml(transaction.category)}</p>
                </div>
                <div class="transaction-amount ${isIncome ? "positive" : "negative"}">
                    ${isIncome ? "+" : "-"}${formatMoney(transaction.originalAmount, transaction.currency || getTrackerCurrency())}
                </div>
            </div>
            <div class="transaction-card-bottom">
                <span class="pill">${escapeHtml(transaction.type)}</span>
                <span class="pill">${escapeHtml(transaction.source || "manual")}</span>
                ${showActions ? `
                    <div class="transaction-actions">
                        <button type="button" class="tiny-btn edit-btn" data-action="edit" data-id="${transaction.id}">Edit</button>
                        <button type="button" class="tiny-btn delete-btn" data-action="delete" data-id="${transaction.id}">Delete</button>
                    </div>
                ` : ""}
            </div>
        `;
        elements.transactionsBody.appendChild(card);
    });
}

function renderEntryCategories() {
    elements.entryCategoryGrid.innerHTML = "";
    const categories = appState.entryType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    categories.forEach((category) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `category-pill ${appState.entryCategory === category ? "active" : ""}`;
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        button.addEventListener("click", () => {
            appState.entryCategory = category;
            renderEntryCategories();
        });
        elements.entryCategoryGrid.appendChild(button);
    });
}

function updateEntryDisplay() {
    elements.entryAmountDisplay.textContent = appState.entryAmount;
    elements.entrySheetTitle.textContent = appState.entryType === "income" ? "New income" : "New expense";
    elements.entryCurrency.textContent = getTrackerCurrency();
    renderEntryCategories();
}

function openEntrySheet(type) {
    appState.entryType = type;
    appState.entryAmount = "0";
    appState.entryCategory = type === "income" ? "salary" : "food";
    elements.entryDate.value = toInputDate();
    elements.entryNote.value = "";
    updateEntryDisplay();
    showSheet(elements.entrySheet);
}

function openManualSheet(transaction = null) {
    if (transaction) {
        appState.editingTransactionId = transaction.id;
        elements.manualFormTitle.textContent = "Edit transaction";
        elements.submitBtn.textContent = "Save changes";
        elements.cancelEditBtn.classList.remove("hidden");
        elements.nameInput.value = transaction.name;
        elements.amountInput.value = transaction.originalAmount;
        elements.typeInput.value = transaction.type;
        elements.categoryInput.value = transaction.category;
        elements.dateInput.value = transaction.date;
    } else {
        appState.editingTransactionId = null;
        elements.manualFormTitle.textContent = "Manual input";
        elements.submitBtn.textContent = "Add transaction";
        elements.cancelEditBtn.classList.add("hidden");
        forms.transaction.reset();
        elements.dateInput.value = toInputDate();
        elements.typeInput.value = "expense";
        elements.categoryInput.value = "food";
    }

    showSheet(elements.manualSheet);
}

function closeAllOverlays() {
    hideSheets();
    closeDrawers();
    closeChatWidget();
}

function fillSurveyForm() {
    elements.surveyFinancialGoal.value = authState.survey?.financial_goal || "";
    elements.surveyTrackerGoal.value = authState.survey?.tracker_goal || "";
    elements.surveyCapital.value = authState.survey?.capital || "";
    elements.surveyCapitalCurrency.value = authState.survey?.capital_currency || "PLN";
    elements.surveyAge.value = authState.survey?.age || 25;
    elements.surveySkills.value = Array.isArray(authState.survey?.skills) ? authState.survey.skills.join(", ") : "analysis";
    elements.surveyNonFinancialGoal.value = authState.survey?.non_financial_goal || "";
}

function collectSurveyPayload() {
    return {
        age: Number(elements.surveyAge.value || 25),
        capital: Number(elements.surveyCapital.value || 0),
        capital_currency: elements.surveyCapitalCurrency.value || "PLN",
        skills: elements.surveySkills.value
            ? elements.surveySkills.value.split(",").map((item) => item.trim()).filter(Boolean)
            : ["analysis"],
        financial_goal: elements.surveyFinancialGoal.value.trim() || "Understand my spending",
        tracker_goal: elements.surveyTrackerGoal.value.trim() || "Get a quick financial review",
        non_financial_goal: elements.surveyNonFinancialGoal.value.trim() || null
    };
}

async function loadSurvey() {
    try {
        authState.survey = await surveyApi.getMine();
        return authState.survey;
    } catch (error) {
        if (error.status === 404) {
            authState.survey = null;
            return null;
        }
        throw error;
    }
}

async function ensureSession() {
    if (!authState.token) {
        authState.user = null;
        authState.survey = null;
        return false;
    }

    try {
        authState.user = await authApi.getProfile();
        await loadSurvey();
        elements.sidebarUserEmail.textContent = authState.user?.email || "AI money review";
        return true;
    } catch (error) {
        authApi.clearToken();
        authState.token = null;
        authState.user = null;
        authState.survey = null;
        return false;
    }
}

async function loadTrackerData() {
    const period = appState.selectedPeriod;
    const [transactions, summary, insights] = await Promise.all([
        transactionsApi.getMine(period),
        transactionsApi.getSummary(period),
        transactionsApi.getInsights(period)
    ]);

    appState.savedTransactions = transactions.map((transaction) => normalizeTransaction(transaction, summary.base_currency || "PLN"));
    appState.latestSummary = summary;
    appState.latestInsights = insights?.insights || [];
    appState.transientAnalysis = null;

    renderSummary(summary);
    renderInsights(appState.latestInsights);
    renderTransactionsList();
    drawCharts(summary, elements.pieChartCanvas, elements.lineChartCanvas, elements.barChartCanvas, "all");
}

function applyAnalysisResult(analysis) {
    appState.transientAnalysis = analysis;
    const summary = buildSummaryFromTransient(analysis);
    const insights = getDisplayInsights();
    renderSummary(summary);
    renderInsights(insights);
    renderTransactionsList();
    drawCharts(summary, elements.pieChartCanvas, elements.lineChartCanvas, elements.barChartCanvas, "all");
    setActiveView("app");
}

async function analyzeUploadedFile(file) {
    const analysis = await transactionsApi.analyzeFile(file);
    const normalizedTransactions = (analysis.transactions || []).map((transaction) => ({
        ...transaction,
        source: transaction.source || "ai_text"
    }));

    const normalizedAnalysis = {
        ...analysis,
        transactions: normalizedTransactions
    };

    appState.parsedTransactionDraft = normalizedAnalysis;
    renderAiPreview(normalizedAnalysis);
    applyAnalysisResult(normalizedAnalysis);
    hideSheets();
    showToast(`Parsed ${normalizedTransactions.length} transaction(s). Review and save if needed.`, "success");
}

async function saveParsedDraft() {
    if (!appState.parsedTransactionDraft?.transactions?.length) {
        showToast("There is nothing to save yet.", "error");
        return;
    }

    const draftTransactions = appState.parsedTransactionDraft.transactions;
    for (const transaction of draftTransactions) {
        await transactionsApi.create({
            type: transaction.type,
            amount: Number(transaction.amount),
            currency: transaction.currency || "PLN",
            category: transaction.category,
            note: transaction.note,
            transaction_date: transaction.transaction_date,
            source: transaction.source || "ai_text"
        });
    }

    discardAiPreview();
    appState.parsedTransactionDraft = null;
    await loadTrackerData();
    showToast(`Saved ${draftTransactions.length} transaction(s).`, "success");
}

function buildAssistantContext() {
    const summary = getDisplaySummary();
    const insights = getDisplayInsights();
    const transactions = getDisplayTransactions().slice(0, 10);

    return {
        screen: "mobile_analysis",
        current_summary: summary,
        current_insights: insights,
        current_transactions: transactions,
        tracker_goal: authState.survey?.tracker_goal || null,
        financial_goal: authState.survey?.financial_goal || null
    };
}

function renderChatMessage(role, message) {
    const item = document.createElement("article");
    item.className = `chat-message ${role}`;
    item.innerHTML = `<p>${escapeHtml(message)}</p>`;
    elements.chatMessages.appendChild(item);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function resetRouteTo(hash) {
    if (window.location.hash !== hash) {
        window.location.hash = hash;
        return;
    }
    handleRouteChange();
}

function openVerifyView(token, credentials = null) {
    setActiveView("auth");
    showAuthMode("verify");
    elements.verifyToken.value = token || "";
    appState.pendingVerification = { token, credentials };
}

function openLoginView(prefill = {}) {
    setActiveView("auth");
    showAuthMode("login");
    elements.loginEmail.value = prefill.email || "";
    elements.loginPassword.value = prefill.password || "";
}

function openRegisterView(prefill = {}) {
    setActiveView("auth");
    showAuthMode("register");
    elements.registerName.value = prefill.name || "";
    elements.registerEmail.value = prefill.email || "";
    elements.registerPassword.value = prefill.password || "";
}

async function loginAndBoot(email, password) {
    const token = await authApi.login({ email, password });
    authState.token = token.access_token;
    await ensureSession();
    showToast("Logged in successfully.", "success");
    resetRouteTo(authState.survey ? "#/app" : "#/survey");
}

async function handleRouteChange() {
    const hash = window.location.hash || "#/";
    const isAuthenticated = await ensureSession();

    if (!isAuthenticated) {
        if (hash === "#/register") {
            openRegisterView();
        } else if (hash === "#/login") {
            openLoginView();
        } else {
            setActiveView("landing");
        }
        return;
    }

    if (hash === "#/survey") {
        fillSurveyForm();
        setActiveView("survey");
        return;
    }

    setActiveView("app");
    await loadTrackerData();
}

function bindFilters() {
    [elements.filterType, elements.filterCategory, elements.filterFrom, elements.filterTo, elements.searchInput].forEach((input) => {
        input.addEventListener("input", renderTransactionsList);
        input.addEventListener("change", renderTransactionsList);
    });
}

function bindPeriodTabs() {
    document.querySelectorAll(".period-tab").forEach((button) => {
        button.addEventListener("click", async () => {
            const period = button.dataset.period;
            if (!PERIOD_OPTIONS.includes(period)) {
                return;
            }

            appState.selectedPeriod = period;
            elements.periodFilter.value = period;
            document.querySelectorAll(".period-tab").forEach((item) => {
                item.classList.toggle("active", item === button);
            });
            await loadTrackerData();
        });
    });
}

function bindEntryKeypad() {
    elements.entryKeypad.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-key]");
        if (!button) {
            return;
        }

        const key = button.dataset.key;
        if (key === "⌫") {
            appState.entryAmount = appState.entryAmount.length > 1
                ? appState.entryAmount.slice(0, -1)
                : "0";
        } else if (key === "C") {
            appState.entryAmount = "0";
        } else if (key === "save") {
            const amount = Number(appState.entryAmount);
            if (!amount) {
                showToast("Enter an amount first.", "error");
                return;
            }

            await transactionsApi.create({
                type: appState.entryType,
                amount,
                currency: getTrackerCurrency(),
                category: appState.entryCategory,
                note: elements.entryNote.value.trim() || `${appState.entryType} via quick add`,
                transaction_date: new Date(`${elements.entryDate.value}T12:00:00`).toISOString(),
                source: "manual"
            });

            hideSheets();
            await loadTrackerData();
            showToast("Transaction added.", "success");
            return;
        } else if (key === "." && appState.entryAmount.includes(".")) {
            return;
        } else {
            if (appState.entryAmount === "0" && key !== "." && key !== "00") {
                appState.entryAmount = key;
            } else {
                appState.entryAmount += key;
            }
        }

        updateEntryDisplay();
    });
}

function bindTransactionActions() {
    elements.transactionsBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button || appState.transientAnalysis) {
            return;
        }

        const transaction = appState.savedTransactions.find((item) => String(item.id) === button.dataset.id);
        if (!transaction) {
            return;
        }

        if (button.dataset.action === "edit") {
            openManualSheet(transaction);
            return;
        }

        if (button.dataset.action === "delete") {
            await transactionsApi.remove(transaction.id);
            await loadTrackerData();
            showToast("Transaction removed.", "success");
        }
    });
}

buttons.heroStart.addEventListener("click", () => {
    if (authState.user) {
        resetRouteTo("#/app");
        return;
    }
    resetRouteTo("#/register");
});

buttons.heroLogin.addEventListener("click", () => resetRouteTo("#/login"));
buttons.switchToRegister.addEventListener("click", () => openRegisterView({ email: elements.loginEmail.value.trim() }));
buttons.switchToLogin.addEventListener("click", () => openLoginView({ email: elements.registerEmail.value.trim() }));
buttons.backToLogin.addEventListener("click", () => openLoginView(appState.pendingVerification?.credentials || {}));

buttons.openLeftDrawer.addEventListener("click", () => openDrawer(elements.leftDrawer));
buttons.closeLeftDrawer.addEventListener("click", closeDrawers);
buttons.openRightDrawer.addEventListener("click", () => openDrawer(elements.rightDrawer));
buttons.closeRightDrawer.addEventListener("click", closeDrawers);
elements.drawerBackdrop.addEventListener("click", closeAllOverlays);

buttons.openUpload.addEventListener("click", () => elements.statementFileInput.click());
buttons.triggerUpload.addEventListener("click", () => {
    closeDrawers();
    elements.statementFileInput.click();
});

buttons.openTextAnalysis.addEventListener("click", () => showSheet(elements.textAnalysisSheet));
buttons.closeTextAnalysis.addEventListener("click", hideSheets);
buttons.openTransactions.addEventListener("click", () => showSheet(elements.transactionsSheet));
buttons.closeTransactions.addEventListener("click", hideSheets);
buttons.openManualMode.addEventListener("click", () => openManualSheet());
buttons.closeManual.addEventListener("click", hideSheets);
buttons.openExpenseEntry.addEventListener("click", () => openEntrySheet("expense"));
buttons.openIncomeEntry.addEventListener("click", () => openEntrySheet("income"));
buttons.closeEntry.addEventListener("click", hideSheets);
buttons.openSurvey.addEventListener("click", () => {
    fillSurveyForm();
    closeDrawers();
    setActiveView("survey");
});
buttons.chatFab.addEventListener("click", openChatWidget);
buttons.closeChat.addEventListener("click", closeChatWidget);
buttons.openDetails.addEventListener("click", () => showSheet(elements.transactionsSheet));
buttons.discardAi.addEventListener("click", async () => {
    discardAiPreview();
    await loadTrackerData();
    showToast("Returned to your saved tracker data.", "info");
});
buttons.confirmAi.addEventListener("click", saveParsedDraft);

buttons.logoutDrawer.addEventListener("click", async () => {
    try {
        await authApi.logout();
    } catch (error) {
        console.error(error);
    }

    authApi.clearToken();
    authState.token = null;
    authState.user = null;
    authState.survey = null;
    appState.transientAnalysis = null;
    appState.savedTransactions = [];
    closeAllOverlays();
    showToast("Logged out.", "info");
    resetRouteTo("#/");
});

elements.statementFileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    try {
        await analyzeUploadedFile(file);
    } catch (error) {
        showToast(error.message || "Could not analyze this file.", "error");
    } finally {
        elements.statementFileInput.value = "";
    }
});

forms.login.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
        await loginAndBoot(elements.loginEmail.value.trim(), elements.loginPassword.value);
    } catch (error) {
        showToast(error.message || "Login failed.", "error");
    }
});

forms.register.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
        const payload = {
            name: elements.registerName.value.trim() || null,
            email: elements.registerEmail.value.trim(),
            password: elements.registerPassword.value
        };

        const registeredUser = await authApi.register(payload);
        if (registeredUser.verification_token) {
            openVerifyView(registeredUser.verification_token, {
                email: payload.email,
                password: payload.password
            });
            showToast("Account created. Verify the account to continue.", "success");
            return;
        }

        openLoginView({ email: payload.email });
        showToast("Account created. Please log in.", "success");
    } catch (error) {
        showToast(error.message || "Registration failed.", "error");
    }
});

buttons.verifyAccount.addEventListener("click", async () => {
    const token = elements.verifyToken.value.trim();
    if (!token) {
        showToast("Verification token is missing.", "error");
        return;
    }

    try {
        await authApi.verifyEmail(token);
        showToast("Account verified.", "success");
        if (appState.pendingVerification?.credentials) {
            const credentials = appState.pendingVerification.credentials;
            appState.pendingVerification = null;
            await loginAndBoot(credentials.email, credentials.password);
            return;
        }

        openLoginView();
    } catch (error) {
        showToast(error.message || "Could not verify the account.", "error");
    }
});

forms.survey.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const payload = collectSurveyPayload();
        authState.survey = authState.survey
            ? await surveyApi.updateMine(payload)
            : await surveyApi.create(payload);
        showToast("Preferences saved.", "success");
        resetRouteTo("#/app");
    } catch (error) {
        showToast(error.message || "Could not save personalization.", "error");
    }
});

buttons.skipSurvey.addEventListener("click", () => resetRouteTo("#/app"));

forms.aiParse.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = elements.aiText.value.trim();
    if (!text) {
        showToast("Add some spending text first.", "error");
        return;
    }

    try {
        const blob = new File([text], "statement.txt", { type: "text/plain" });
        await analyzeUploadedFile(blob);
    } catch (error) {
        showToast(error.message || "Could not analyze this text.", "error");
    }
});

forms.transaction.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        note: elements.nameInput.value.trim(),
        amount: Number(elements.amountInput.value),
        type: elements.typeInput.value,
        category: elements.categoryInput.value,
        transaction_date: new Date(`${elements.dateInput.value}T12:00:00`).toISOString(),
        currency: getTrackerCurrency(),
        source: "manual"
    };

    try {
        if (appState.editingTransactionId) {
            await transactionsApi.update(appState.editingTransactionId, payload);
            showToast("Transaction updated.", "success");
        } else {
            await transactionsApi.create(payload);
            showToast("Transaction added.", "success");
        }

        hideSheets();
        appState.editingTransactionId = null;
        forms.transaction.reset();
        elements.dateInput.value = toInputDate();
        await loadTrackerData();
    } catch (error) {
        showToast(error.message || "Could not save transaction.", "error");
    }
});

elements.cancelEditBtn.addEventListener("click", () => openManualSheet());

forms.chat.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = elements.chatInput.value.trim();
    if (!message) {
        return;
    }

    renderChatMessage("user", message);
    elements.chatInput.value = "";

    try {
        const response = await assistantApi.sendMessage({
            message,
            context: buildAssistantContext()
        });
        renderChatMessage("assistant", response.reply);
    } catch (error) {
        showToast(error.message || "Assistant is unavailable right now.", "error");
    }
});

document.querySelectorAll(".prompt-chip[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
        elements.chatInput.value = button.dataset.prompt || "";
        elements.chatInput.focus();
        openChatWidget();
    });
});

document.querySelectorAll(".prompt-fill-chip").forEach((button) => {
    button.addEventListener("click", () => {
        elements.aiText.value = button.dataset.fill || "";
        elements.aiText.focus();
    });
});

function initializeStaticUi() {
    setSelectOptions(elements.typeInput, TYPE_OPTIONS);
    setSelectOptions(elements.categoryInput, CATEGORY_OPTIONS);
    setSelectOptions(elements.filterType, TYPE_OPTIONS, true);
    setSelectOptions(elements.filterCategory, CATEGORY_OPTIONS, true);
    elements.dateInput.value = toInputDate();
    elements.entryDate.value = toInputDate();
    elements.periodFilter.value = appState.selectedPeriod;
    bindFilters();
    bindPeriodTabs();
    bindEntryKeypad();
    bindTransactionActions();
    updateEntryDisplay();
    renderTransactionsList();
    renderInsights([]);
}

window.addEventListener("hashchange", handleRouteChange);

initializeStaticUi();
handleRouteChange();
