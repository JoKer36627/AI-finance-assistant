const CATEGORY_OPTIONS = [
    "food",
    "transport",
    "housing",
    "bills",
    "entertainment",
    "shopping",
    "health",
    "education",
    "salary",
    "freelance",
    "other"
];

const TYPE_OPTIONS = ["income", "expense"];

const authState = {
    token: authApi.getToken(),
    user: null,
    survey: null
};

let transactions = [];
let latestSummary = null;
let parsedTransactionDraft = null;
let editingTransactionId = null;
let pendingVerification = null;

const views = {
    landing: document.getElementById("view-landing"),
    auth: document.getElementById("view-auth"),
    survey: document.getElementById("view-survey"),
    app: document.getElementById("view-app")
};

const pages = {
    analyze: document.getElementById("page-analyze"),
    details: document.getElementById("page-details"),
    ai: document.getElementById("page-ai")
};

const toastEl = document.getElementById("toast");
const dashboardStatus = document.getElementById("dashboard-status");
const lastUpdatedEl = document.getElementById("last-updated");
const insightsListEl = document.getElementById("insights-list");
const transactionsBody = document.getElementById("transactions-body");
const chatMessagesEl = document.getElementById("chat-messages");

const topbarLoginBtn = document.getElementById("go-login-btn");
const topbarRegisterBtn = document.getElementById("go-register-btn");
const logoutBtn = document.getElementById("logout-btn");
const heroStartBtn = document.getElementById("hero-start-btn");
const heroLoginBtn = document.getElementById("hero-login-btn");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const verifyPanel = document.getElementById("verify-panel");
const surveyForm = document.getElementById("survey-form");
const aiParseForm = document.getElementById("ai-parse-form");
const transactionForm = document.getElementById("transaction-form");
const chatForm = document.getElementById("chat-form");

const switchToRegisterBtn = document.getElementById("switch-to-register");
const switchToLoginBtn = document.getElementById("switch-to-login");
const verifyAccountBtn = document.getElementById("verify-account-btn");
const backToLoginBtn = document.getElementById("back-to-login-btn");
const skipSurveyBtn = document.getElementById("skip-survey-btn");
const askFollowUpBtn = document.getElementById("ask-follow-up-btn");
const seeDetailsBtn = document.getElementById("see-details-btn");

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const registerNameInput = document.getElementById("register-name");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const verifyTokenInput = document.getElementById("verify-token");

const surveyAgeInput = document.getElementById("survey-age");
const surveyCapitalInput = document.getElementById("survey-capital");
const surveyCapitalCurrencyInput = document.getElementById("survey-capital-currency");
const surveySkillsInput = document.getElementById("survey-skills");
const surveyFinancialGoalInput = document.getElementById("survey-financial-goal");
const surveyTrackerGoalInput = document.getElementById("survey-tracker-goal");
const surveyNonFinancialGoalInput = document.getElementById("survey-non-financial-goal");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const savingsRateEl = document.getElementById("savings-rate");
const balanceNoteEl = document.getElementById("balance-note");
const incomeNoteEl = document.getElementById("income-note");
const expenseNoteEl = document.getElementById("expense-note");
const savingsNoteEl = document.getElementById("savings-note");
const primaryInsightTitleEl = document.getElementById("primary-insight-title");
const primaryInsightMessageEl = document.getElementById("primary-insight-message");

const sidebarUserNameEl = document.getElementById("sidebar-user-name");
const sidebarUserEmailEl = document.getElementById("sidebar-user-email");

const manualFormTitleEl = document.getElementById("manual-form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const searchInput = document.getElementById("search");
const filterTypeInput = document.getElementById("filter-type");
const filterCategoryInput = document.getElementById("filter-category");
const fromDateInput = document.getElementById("from-date");
const toDateInput = document.getElementById("to-date");
const periodFilterInput = document.getElementById("period-filter");

const aiTextInput = document.getElementById("ai-text");
const aiPreviewEl = document.getElementById("ai-preview");
const aiPreviewContentEl = document.getElementById("ai-preview-content");
const confirmAiBtn = document.getElementById("confirm-ai-btn");
const discardAiBtn = document.getElementById("discard-ai-btn");
const chatInput = document.getElementById("chat-input");

const pieChartCanvas = document.getElementById("pie-chart");
const lineChartCanvas = document.getElementById("line-chart");
const barChartCanvas = document.getElementById("bar-chart");

const promptButtons = document.querySelectorAll(".prompt-chip[data-prompt]");
const promptFillButtons = document.querySelectorAll(".prompt-chip[data-fill]");

function showToast(message, kind = "info") {
    toastEl.textContent = message;
    toastEl.className = `toast ${kind}`;
    setTimeout(() => {
        toastEl.className = "toast hidden";
    }, 2800);
}

function setStatus(message) {
    dashboardStatus.textContent = message;
}

function formatMoney(value, currency = "PLN") {
    const amount = Number(value || 0);
    return `${amount.toFixed(2)} ${currency}`;
}

function getTrackerCurrency() {
    return authState.survey?.capital_currency || "PLN";
}

function toInputDate(value) {
    const date = value ? new Date(value) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function setSelectOptions(selectElement, values, withAllOption = false, labelPrefix = "") {
    selectElement.innerHTML = "";

    if (withAllOption) {
        const option = document.createElement("option");
        option.value = "all";
        option.textContent = labelPrefix || "All";
        selectElement.appendChild(option);
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

function setActivePage(pageName) {
    Object.entries(pages).forEach(([key, element]) => {
        element.classList.toggle("active", key === pageName);
    });

    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.route === `#/app/${pageName}`);
    });
}

function showAuthMode(mode) {
    const loginVisible = mode === "login";
    const registerVisible = mode === "register";
    const verifyVisible = mode === "verify";
    loginForm.classList.toggle("hidden", !loginVisible);
    registerForm.classList.toggle("hidden", !registerVisible);
    verifyPanel.classList.toggle("hidden", !verifyVisible);

    if (loginVisible) {
        document.getElementById("auth-title").textContent = "Login";
        document.getElementById("auth-subtitle").textContent = "Open your finance review workspace.";
        return;
    }

    if (registerVisible) {
        document.getElementById("auth-title").textContent = "Create account";
        document.getElementById("auth-subtitle").textContent = "Use an account only if you want to save sessions and return later.";
        return;
    }

    document.getElementById("auth-title").textContent = "Verify account";
    document.getElementById("auth-subtitle").textContent = "Confirm your email, then continue.";
}

function updateTopbarAuthState() {
    const isAuthenticated = Boolean(authState.token && authState.user);
    topbarLoginBtn.classList.toggle("hidden", isAuthenticated);
    topbarRegisterBtn.classList.toggle("hidden", isAuthenticated);
    logoutBtn.classList.toggle("hidden", !isAuthenticated);
}

function openLoginView(prefill = {}) {
    setActiveView("auth");
    showAuthMode("login");
    loginEmailInput.value = prefill.email || "";
    loginPasswordInput.value = prefill.password || "";
}

function openRegisterView(prefill = {}) {
    setActiveView("auth");
    showAuthMode("register");
    registerNameInput.value = prefill.name || "";
    registerEmailInput.value = prefill.email || "";
}

function openVerifyView(token, credentials = null) {
    setActiveView("auth");
    showAuthMode("verify");
    verifyTokenInput.value = token || "";
    pendingVerification = { token, credentials };
}

function resetManualForm() {
    editingTransactionId = null;
    transactionForm.reset();
    dateInput.value = toInputDate();
    submitBtn.textContent = "Add transaction";
    manualFormTitleEl.textContent = "Add transaction";
    cancelEditBtn.classList.add("hidden");
}

function normalizeTransaction(transaction) {
    return {
        ...transaction,
        name: transaction.note || "Untitled transaction",
        date: toInputDate(transaction.transaction_date),
        amount: Number(transaction.amount),
        originalAmount: Number(transaction.amount),
        convertedAmount: Number(transaction.amount_pln ?? transaction.amount),
        exchangeRate: Number(transaction.exchange_rate ?? 1),
        source: transaction.source || "manual"
    };
}

function isEmailAlreadyRegisteredError(error) {
    return typeof error?.message === "string" && error.message.toLowerCase().includes("already registered");
}

function toTransactionPayload(source = "manual") {
    return {
        note: nameInput.value.trim(),
        amount: Number(amountInput.value),
        type: typeInput.value,
        category: categoryInput.value,
        transaction_date: new Date(`${dateInput.value}T12:00:00`).toISOString(),
        currency: getTrackerCurrency(),
        source
    };
}

function renderSummary(summary) {
    const baseCurrency = summary?.base_currency || getTrackerCurrency();
    const income = Number(summary?.income_total || 0);
    const expense = Number(summary?.expense_total || 0);
    const savingsRate = income > 0 ? (((income - expense) / income) * 100) : 0;
    const periodLabel = summary?.selected_period || periodFilterInput.value || "month";

    balanceEl.textContent = formatMoney(summary?.balance || 0, baseCurrency);
    incomeEl.textContent = formatMoney(income, baseCurrency);
    expensesEl.textContent = formatMoney(expense, baseCurrency);
    savingsRateEl.textContent = `${savingsRate.toFixed(1)}%`;

    balanceNoteEl.textContent = `Including starting balance · ${periodLabel}`;
    incomeNoteEl.textContent = `Tracked inflows · ${periodLabel}`;
    expenseNoteEl.textContent = `Tracked outflows · ${periodLabel}`;
    savingsNoteEl.textContent = income > 0 ? `${(income - expense).toFixed(2)} ${baseCurrency} net` : "No income recorded";

    lastUpdatedEl.textContent = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function renderInsights(insights) {
    const list = insights?.length
        ? insights
        : [
            {
                title: "No analysis yet",
                message: "Add transactions or run the parser to generate a focused finance review."
            }
        ];

    const [primary, ...secondary] = list;
    primaryInsightTitleEl.textContent = primary.title;
    primaryInsightMessageEl.textContent = primary.message;

    insightsListEl.innerHTML = "";
    secondary.slice(0, 3).forEach((insight) => {
        const card = document.createElement("article");
        card.className = "insight-card";
        card.innerHTML = `<h3>${insight.title}</h3><p>${insight.message}</p>`;
        insightsListEl.appendChild(card);
    });

    if (!secondary.length) {
        const placeholder = document.createElement("article");
        placeholder.className = "insight-card";
        placeholder.innerHTML = "<h3>More context appears here</h3><p>As soon as there is enough data, we will highlight extra patterns and recommendations.</p>";
        insightsListEl.appendChild(placeholder);
    }
}

function renderTransactions(list) {
    transactionsBody.innerHTML = "";

    if (!list.length) {
        transactionsBody.innerHTML = '<tr><td colspan="7">No transactions found for the current filters.</td></tr>';
        return;
    }

    list.forEach((transaction) => {
        const row = document.createElement("tr");
        const isIncome = transaction.type === "income";
        const usesOriginalCurrency = (transaction.currency || "PLN") !== getTrackerCurrency();
        const amountHtml = usesOriginalCurrency
            ? `
                <div class="${isIncome ? "amount-positive" : "amount-negative"}">${isIncome ? "+" : "-"}${formatMoney(transaction.originalAmount, transaction.currency || "PLN")}</div>
                <small class="amount-secondary">~ ${formatMoney(transaction.convertedAmount, "PLN")}</small>
            `
            : `<div class="${isIncome ? "amount-positive" : "amount-negative"}">${isIncome ? "+" : "-"}${formatMoney(transaction.originalAmount, transaction.currency || getTrackerCurrency())}</div>`;

        row.innerHTML = `
            <td>${transaction.date}</td>
            <td><div class="transaction-note">${transaction.name}</div></td>
            <td><span class="tag-chip">${transaction.category}</span></td>
            <td><span class="tag-chip ${isIncome ? "tag-income" : "tag-expense"}">${transaction.type}</span></td>
            <td><span class="tag-chip">${transaction.source}</span></td>
            <td>${amountHtml}</td>
            <td>
                <button class="small-btn edit-btn" data-id="${transaction.id}">Edit</button>
                <button class="small-btn delete-btn" data-id="${transaction.id}">Delete</button>
            </td>
        `;
        transactionsBody.appendChild(row);
    });
}

function renderAiPreview(parsed) {
    const originalAmount = Number(parsed.amount || 0);
    const convertedAmount = Number(parsed.amount_pln ?? parsed.amount ?? 0);
    aiPreviewContentEl.innerHTML = `
        <div><span>Type</span><strong>${parsed.type}</strong></div>
        <div><span>Category</span><strong>${parsed.category}</strong></div>
        <div><span>Amount</span><strong>${formatMoney(originalAmount, parsed.currency || "PLN")}</strong></div>
        <div><span>Stored as</span><strong>${formatMoney(convertedAmount, "PLN")}</strong></div>
        <div><span>Date</span><strong>${toInputDate(parsed.transaction_date)}</strong></div>
        <div class="full-span"><span>Note</span><strong>${parsed.note}</strong></div>
    `;
    aiPreviewEl.classList.remove("hidden");
}

function discardAiPreview() {
    parsedTransactionDraft = null;
    aiPreviewEl.classList.add("hidden");
    aiPreviewContentEl.innerHTML = "";
}

function renderChatMessage(role, message) {
    const item = document.createElement("article");
    item.className = `chat-message ${role}`;
    item.innerHTML = `<p>${message}</p>`;
    chatMessagesEl.appendChild(item);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function fillSurveyForm(survey) {
    surveyAgeInput.value = survey?.age || "";
    surveyCapitalInput.value = survey?.capital || "";
    surveyCapitalCurrencyInput.value = survey?.capital_currency || "PLN";
    surveySkillsInput.value = Array.isArray(survey?.skills) ? survey.skills.join(", ") : "";
    surveyFinancialGoalInput.value = survey?.financial_goal || "";
    surveyTrackerGoalInput.value = survey?.tracker_goal || "";
    surveyNonFinancialGoalInput.value = survey?.non_financial_goal || "";
}

function updateSidebarUser() {
    sidebarUserNameEl.textContent = authState.user?.name || "Your workspace";
    sidebarUserEmailEl.textContent = authState.user?.email || "";
}

function applyFilters() {
    const filtered = getFilteredTransactions(transactions, {
        searchValue: searchInput.value || "",
        typeValue: filterTypeInput.value,
        categoryValue: filterCategoryInput.value,
        fromDateValue: fromDateInput.value,
        toDateValue: toDateInput.value
    });

    renderTransactions(filtered);
}

async function loadSurvey() {
    try {
        const survey = await surveyApi.getMine();
        authState.survey = survey;
        return survey;
    } catch (error) {
        if (error.status === 404) {
            authState.survey = null;
            return null;
        }
        throw error;
    }
}

async function loadDashboardData() {
    const period = periodFilterInput.value || "month";
    setStatus("Refreshing your finance review...");

    const [transactionList, summary, insights] = await Promise.all([
        transactionsApi.getMine(period),
        transactionsApi.getSummary(period),
        transactionsApi.getInsights(period)
    ]);

    transactions = transactionList.map(normalizeTransaction);
    latestSummary = summary;

    renderSummary(summary);
    renderInsights(insights?.insights || []);
    applyFilters();
    drawCharts(summary, pieChartCanvas, lineChartCanvas, barChartCanvas, "all");

    setStatus(`Loaded ${transactions.length} transaction(s) for the ${period} view.`);
}

async function refreshAppData() {
    await loadDashboardData();
}

async function ensureSession() {
    if (!authState.token) {
        authState.user = null;
        authState.survey = null;
        updateTopbarAuthState();
        return false;
    }

    try {
        authState.user = await authApi.getProfile();
        await loadSurvey();
        updateSidebarUser();
        updateTopbarAuthState();
        return true;
    } catch (error) {
        authApi.clearToken();
        authState.token = null;
        authState.user = null;
        authState.survey = null;
        updateTopbarAuthState();
        return false;
    }
}

async function navigateTo(hash) {
    if (window.location.hash === hash) {
        await handleRouteChange();
        return;
    }
    window.location.hash = hash;
}

async function loginAndBoot(email, password) {
    const token = await authApi.login({ email, password });
    authState.token = token.access_token;
    await ensureSession();
    showToast("Logged in successfully.", "success");
    await navigateTo(authState.survey ? "#/app/analyze" : "#/survey");
}

function collectSurveyPayload() {
    const financialGoal = surveyFinancialGoalInput.value.trim();
    const trackerGoal = surveyTrackerGoalInput.value.trim();
    const capitalValue = surveyCapitalInput.value.trim();

    return {
        age: Number(surveyAgeInput.value || 18),
        capital: capitalValue ? Number(capitalValue) : 0,
        capital_currency: surveyCapitalCurrencyInput.value || "PLN",
        skills: surveySkillsInput.value
            ? surveySkillsInput.value.split(",").map((item) => item.trim()).filter(Boolean)
            : ["budgeting"],
        financial_goal: financialGoal || "Understand my spending patterns",
        tracker_goal: trackerGoal || "Get faster financial insights",
        non_financial_goal: surveyNonFinancialGoalInput.value.trim() || null
    };
}

async function handleRouteChange() {
    const hash = window.location.hash || "#/";
    const isAuthenticated = await ensureSession();

    if (!isAuthenticated) {
        if (hash === "#/register") {
            openRegisterView();
            return;
        }
        if (hash === "#/login") {
            openLoginView();
            return;
        }
        if (hash.startsWith("#/app") || hash === "#/survey") {
            openLoginView();
            return;
        }

        setActiveView("landing");
        return;
    }

    if (hash === "#/survey") {
        setActiveView("survey");
        fillSurveyForm(authState.survey);
        return;
    }

    if (hash === "#/" || hash === "#/login" || hash === "#/register") {
        await navigateTo("#/app/analyze");
        return;
    }

    setActiveView("app");

    if (hash === "#/app/details") {
        setActivePage("details");
        await refreshAppData();
        return;
    }

    if (hash === "#/app/ai") {
        setActivePage("ai");
        return;
    }

    setActivePage("analyze");
    await refreshAppData();
}

topbarLoginBtn.addEventListener("click", () => {
    if (authState.token && authState.user) {
        window.location.hash = "#/app/analyze";
        return;
    }
    window.location.hash = "#/login";
});

topbarRegisterBtn.addEventListener("click", () => {
    if (authState.token && authState.user) {
        window.location.hash = "#/app/analyze";
        return;
    }
    window.location.hash = "#/register";
});

heroStartBtn.addEventListener("click", () => {
    if (authState.token && authState.user) {
        window.location.hash = "#/app/analyze";
        return;
    }
    window.location.hash = "#/register";
});

heroLoginBtn.addEventListener("click", () => {
    window.location.hash = "#/login";
});

switchToRegisterBtn.addEventListener("click", () => {
    window.location.hash = "#/register";
});

switchToLoginBtn.addEventListener("click", () => {
    window.location.hash = "#/login";
});

backToLoginBtn.addEventListener("click", () => {
    openLoginView(pendingVerification?.credentials || {});
});

document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        window.location.hash = button.dataset.route;
    });
});

promptButtons.forEach((button) => {
    button.addEventListener("click", () => {
        chatInput.value = button.dataset.prompt || "";
        chatInput.focus();
    });
});

promptFillButtons.forEach((button) => {
    button.addEventListener("click", () => {
        aiTextInput.value = button.dataset.fill || "";
        aiTextInput.focus();
    });
});

askFollowUpBtn.addEventListener("click", () => {
    window.location.hash = "#/app/ai";
});

seeDetailsBtn.addEventListener("click", () => {
    window.location.hash = "#/app/details";
});

logoutBtn.addEventListener("click", async () => {
    try {
        await authApi.logout();
    } catch (error) {
        console.error(error);
    }

    authApi.clearToken();
    authState.token = null;
    authState.user = null;
    authState.survey = null;
    transactions = [];
    updateTopbarAuthState();
    showToast("Logged out.", "info");
    window.location.hash = "#/login";
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await loginAndBoot(loginEmailInput.value.trim(), loginPasswordInput.value);
    } catch (error) {
        if (error.status === 403) {
            showToast("Your account is not verified yet. Complete verification first.", "error");
            return;
        }
        showToast(error.message || "Login failed.", "error");
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
        name: registerNameInput.value.trim() || null,
        email: registerEmailInput.value.trim(),
        password: registerPasswordInput.value
    };

    try {
        const registeredUser = await authApi.register(payload);
        if (registeredUser.verification_token) {
            openVerifyView(registeredUser.verification_token, {
                email: payload.email,
                password: payload.password
            });
            showToast("Account created. Verify it to continue.", "success");
            return;
        }

        openLoginView({ email: payload.email });
        showToast("Account created. Please log in.", "success");
    } catch (error) {
        if (isEmailAlreadyRegisteredError(error)) {
            openLoginView({ email: payload.email });
            showToast("This email is already registered. Please log in instead.", "error");
            return;
        }

        showToast(error.message || "Registration failed.", "error");
    }
});

verifyAccountBtn.addEventListener("click", async () => {
    const token = verifyTokenInput.value.trim();
    if (!token) {
        showToast("Verification token is missing.", "error");
        return;
    }

    try {
        await authApi.verifyEmail(token);
        showToast("Account verified.", "success");

        if (pendingVerification?.credentials?.email && pendingVerification?.credentials?.password) {
            const credentials = pendingVerification.credentials;
            pendingVerification = null;
            await loginAndBoot(credentials.email, credentials.password);
            return;
        }

        pendingVerification = null;
        openLoginView();
    } catch (error) {
        showToast(error.message || "Could not verify account.", "error");
    }
});

surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const payload = collectSurveyPayload();
        authState.survey = authState.survey
            ? await surveyApi.updateMine(payload)
            : await surveyApi.create(payload);

        showToast("Preferences saved.", "success");
        window.location.hash = "#/app/analyze";
    } catch (error) {
        showToast(error.message || "Could not save preferences.", "error");
    }
});

skipSurveyBtn.addEventListener("click", () => {
    window.location.hash = "#/app/analyze";
});

transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const payload = toTransactionPayload("manual");
        if (editingTransactionId) {
            await transactionsApi.update(editingTransactionId, payload);
            showToast("Transaction updated.", "success");
        } else {
            await transactionsApi.create(payload);
            showToast("Transaction created.", "success");
        }

        resetManualForm();
        await refreshAppData();
    } catch (error) {
        showToast(error.message || "Could not save transaction.", "error");
    }
});

cancelEditBtn.addEventListener("click", resetManualForm);

transactionsBody.addEventListener("click", async (event) => {
    const transactionId = Number(event.target.dataset.id);
    if (!transactionId) {
        return;
    }

    if (event.target.classList.contains("delete-btn")) {
        if (!window.confirm("Delete this transaction?")) {
            return;
        }

        try {
            await transactionsApi.remove(transactionId);
            showToast("Transaction deleted.", "success");
            await refreshAppData();
        } catch (error) {
            showToast(error.message || "Could not delete transaction.", "error");
        }
    }

    if (event.target.classList.contains("edit-btn")) {
        const transaction = transactions.find((item) => item.id === transactionId);
        if (!transaction) {
            return;
        }

        editingTransactionId = transaction.id;
        manualFormTitleEl.textContent = "Edit transaction";
        submitBtn.textContent = "Save changes";
        cancelEditBtn.classList.remove("hidden");
        nameInput.value = transaction.name;
        amountInput.value = transaction.amount;
        typeInput.value = transaction.type;
        categoryInput.value = transaction.category;
        dateInput.value = transaction.date;
        window.location.hash = "#/app/details";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

[searchInput, filterTypeInput, filterCategoryInput, fromDateInput, toDateInput].forEach((input) => {
    input.addEventListener(input.tagName === "SELECT" ? "change" : "input", applyFilters);
});

periodFilterInput.addEventListener("change", async () => {
    try {
        await refreshAppData();
    } catch (error) {
        showToast(error.message || "Could not update the selected period.", "error");
    }
});

aiParseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = aiTextInput.value.trim();
    if (!text) {
        showToast("Add some spending text first.", "error");
        return;
    }

    try {
        parsedTransactionDraft = await transactionsApi.parseText({ text });
        renderAiPreview(parsedTransactionDraft);
        showToast("Analysis preview is ready.", "success");
    } catch (error) {
        showToast(error.message || "Could not parse the text.", "error");
    }
});

confirmAiBtn.addEventListener("click", async () => {
    if (!parsedTransactionDraft) {
        return;
    }

    try {
        await transactionsApi.create({
            ...parsedTransactionDraft,
            transaction_date: new Date(parsedTransactionDraft.transaction_date).toISOString()
        });
        discardAiPreview();
        aiTextInput.value = "";
        showToast("Transaction saved.", "success");
        await refreshAppData();
    } catch (error) {
        showToast(error.message || "Could not save parsed transaction.", "error");
    }
});

discardAiBtn.addEventListener("click", discardAiPreview);

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) {
        return;
    }

    renderChatMessage("user", message);
    chatInput.value = "";

    try {
        const response = await assistantApi.sendMessage({ message });
        renderChatMessage("assistant", response.reply);
    } catch (error) {
        renderChatMessage("assistant", error.message || "Assistant is unavailable right now.");
    }
});

setSelectOptions(typeInput, TYPE_OPTIONS);
setSelectOptions(categoryInput, CATEGORY_OPTIONS);
setSelectOptions(filterTypeInput, TYPE_OPTIONS, true, "All types");
setSelectOptions(filterCategoryInput, CATEGORY_OPTIONS, true, "All categories");
dateInput.value = toInputDate();
renderInsights([]);
renderChatMessage("assistant", "Run an analysis first, then ask me what changed, what hurts your budget most, or what to do next.");
updateTopbarAuthState();

window.addEventListener("hashchange", () => {
    handleRouteChange().catch((error) => {
        console.error(error);
        showToast(error.message || "Navigation failed.", "error");
    });
});

handleRouteChange().catch((error) => {
    console.error(error);
    showToast(error.message || "Could not initialize the app.", "error");
});
