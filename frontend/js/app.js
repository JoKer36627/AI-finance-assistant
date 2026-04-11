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
let parsedTransactionDraft = null;
let editingTransactionId = null;
let latestSummary = null;

const views = {
    landing: document.getElementById("view-landing"),
    auth: document.getElementById("view-auth"),
    survey: document.getElementById("view-survey"),
    app: document.getElementById("view-app")
};

const pages = {
    dashboard: document.getElementById("page-dashboard"),
    ai: document.getElementById("page-ai")
};

const dashboardStatus = document.getElementById("dashboard-status");
const logoutBtn = document.getElementById("logout-btn");
const toastEl = document.getElementById("toast");
const topbarLoginBtn = document.getElementById("go-login-btn");
const topbarRegisterBtn = document.getElementById("go-register-btn");
const heroStartBtn = document.getElementById("hero-start-btn");
const heroLoginBtn = document.getElementById("hero-login-btn");
const switchToRegisterBtn = document.getElementById("switch-to-register");
const switchToLoginBtn = document.getElementById("switch-to-login");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const surveyForm = document.getElementById("survey-form");
const transactionForm = document.getElementById("transaction-form");
const aiParseForm = document.getElementById("ai-parse-form");
const chatForm = document.getElementById("chat-form");

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const registerNameInput = document.getElementById("register-name");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");

const surveyAgeInput = document.getElementById("survey-age");
const surveyCapitalInput = document.getElementById("survey-capital");
const surveyCapitalCurrencyInput = document.getElementById("survey-capital-currency");
const surveySkillsInput = document.getElementById("survey-skills");
const surveyFinancialGoalInput = document.getElementById("survey-financial-goal");
const surveySportInput = document.getElementById("survey-sport");
const surveySportTypeInput = document.getElementById("survey-sport-type");
const surveyNonFinancialGoalInput = document.getElementById("survey-non-financial-goal");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const savingsRateEl = document.getElementById("savings-rate");
const lastUpdatedEl = document.getElementById("last-updated");
const insightsListEl = document.getElementById("insights-list");
const transactionsBody = document.getElementById("transactions-body");
const chatMessagesEl = document.getElementById("chat-messages");

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

const pieChartCanvas = document.getElementById("pie-chart");
const lineChartCanvas = document.getElementById("line-chart");
const barChartCanvas = document.getElementById("bar-chart");

const aiTextInput = document.getElementById("ai-text");
const aiPreviewEl = document.getElementById("ai-preview");
const aiPreviewContentEl = document.getElementById("ai-preview-content");
const confirmAiBtn = document.getElementById("confirm-ai-btn");
const discardAiBtn = document.getElementById("discard-ai-btn");
const promptSuggestionButtons = document.querySelectorAll(".prompt-chip");

const chatInput = document.getElementById("chat-input");

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

function isEmailAlreadyRegisteredError(error) {
    return typeof error?.message === "string" && error.message.toLowerCase().includes("already registered");
}

function formatMoney(value, currency = "PLN") {
    const numericValue = Number(value || 0);
    return `${numericValue.toFixed(2)} ${currency}`;
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

function showAuthMode(mode) {
    const loginVisible = mode === "login";
    loginForm.classList.toggle("hidden", !loginVisible);
    registerForm.classList.toggle("hidden", loginVisible);
    document.getElementById("auth-title").textContent = loginVisible ? "Login" : "Create account";
    document.getElementById("auth-subtitle").textContent = loginVisible
        ? "Use your account to open the tracker."
        : "Register to start with onboarding and the tracker.";
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
    if (prefill.email) {
        loginEmailInput.value = prefill.email;
    }
    if (prefill.password) {
        loginPasswordInput.value = prefill.password;
    }
}

function openRegisterView(prefill = {}) {
    setActiveView("auth");
    showAuthMode("register");
    if (prefill.name) {
        registerNameInput.value = prefill.name;
    }
    if (prefill.email) {
        registerEmailInput.value = prefill.email;
    }
}

function goToDashboardOrSurvey() {
    window.location.hash = authState.survey ? "#/app/dashboard" : "#/survey";
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

function resetManualForm() {
    editingTransactionId = null;
    transactionForm.reset();
    dateInput.value = toInputDate();
    submitBtn.textContent = "Add transaction";
    manualFormTitleEl.textContent = "Add transaction";
    cancelEditBtn.classList.add("hidden");
}

function renderSummary(summary) {
    const baseCurrency = summary.base_currency || "PLN";
    balanceEl.textContent = formatMoney(summary.balance, baseCurrency);
    incomeEl.textContent = formatMoney(summary.income_total, baseCurrency);
    expensesEl.textContent = formatMoney(summary.expense_total, baseCurrency);
    const income = Number(summary.income_total || 0);
    const expense = Number(summary.expense_total || 0);
    const savingsRate = income > 0 ? (((income - expense) / income) * 100) : 0;
    savingsRateEl.textContent = `${savingsRate.toFixed(1)}%`;
    lastUpdatedEl.textContent = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function renderInsights(insights) {
    insightsListEl.innerHTML = "";
    insights.forEach((insight) => {
        const card = document.createElement("article");
        card.className = "insight-card";
        card.innerHTML = `<h3>${insight.title}</h3><p>${insight.message}</p>`;
        insightsListEl.appendChild(card);
    });
}

function renderTransactions(list) {
    transactionsBody.innerHTML = "";

    if (!list.length) {
        transactionsBody.innerHTML = `<tr><td colspan="7">No transactions found for the current view.</td></tr>`;
        return;
    }

    list.forEach((transaction) => {
        const row = document.createElement("tr");
        const isConverted = (transaction.currency || "PLN") !== "PLN";
        const isIncome = transaction.type === "income";
        const amountMarkup = isConverted
            ? `
                <div class="${isIncome ? "amount-positive" : "amount-negative"}">${isIncome ? "+" : "-"}${formatMoney(transaction.originalAmount, transaction.currency || "PLN")}</div>
                <small class="amount-secondary">~ ${formatMoney(transaction.convertedAmount, "PLN")}</small>
            `
            : `<div class="${isIncome ? "amount-positive" : "amount-negative"}">${isIncome ? "+" : "-"}${formatMoney(transaction.convertedAmount, authState.survey?.capital_currency || "PLN")}</div>`;
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td><div class="transaction-note">${transaction.name}</div></td>
            <td><span class="tag-chip">${transaction.category}</span></td>
            <td><span class="tag-chip ${isIncome ? "tag-income" : "tag-expense"}">${transaction.type}</span></td>
            <td><span class="tag-chip">${transaction.source}</span></td>
            <td>${amountMarkup}</td>
            <td>
                <button class="small-btn edit-btn" data-id="${transaction.id}">Edit</button>
                <button class="small-btn delete-btn" data-id="${transaction.id}">Delete</button>
            </td>
        `;
        transactionsBody.appendChild(row);
    });
}

function renderAiPreview(parsed) {
    const convertedAmount = Number(parsed.amount_pln ?? parsed.amount);
    const originalAmount = Number(parsed.amount);
    const showConverted = (parsed.currency || "PLN") !== "PLN";
    aiPreviewContentEl.innerHTML = `
        <div><span>Type</span><strong>${parsed.type}</strong></div>
        <div><span>Category</span><strong>${parsed.category}</strong></div>
        <div><span>Amount</span><strong>${formatMoney(originalAmount, parsed.currency)}</strong></div>
        <div><span>Stored as</span><strong>${formatMoney(convertedAmount, "PLN")}${showConverted && parsed.exchange_rate ? ` at rate ${Number(parsed.exchange_rate).toFixed(4)}` : ""}</strong></div>
        <div><span>Date</span><strong>${toInputDate(parsed.transaction_date)}</strong></div>
        <div class="full-span"><span>Note</span><strong>${parsed.note}</strong></div>
    `;
    aiPreviewEl.classList.remove("hidden");
}

function renderChatMessage(role, message) {
    const item = document.createElement("article");
    item.className = `chat-message ${role}`;
    item.innerHTML = `<p>${message}</p>`;
    chatMessagesEl.appendChild(item);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function discardAiPreview() {
    parsedTransactionDraft = null;
    aiPreviewEl.classList.add("hidden");
    aiPreviewContentEl.innerHTML = "";
}

function applyFilters() {
    const filteredTransactions = getFilteredTransactions(transactions, {
        searchValue: searchInput.value,
        typeValue: filterTypeInput.value,
        categoryValue: filterCategoryInput.value,
        fromDateValue: fromDateInput.value,
        toDateValue: toDateInput.value
    });

    renderTransactions(filteredTransactions);
    drawCharts(latestSummary, pieChartCanvas, lineChartCanvas, barChartCanvas, filterTypeInput.value);
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
    setStatus("Loading transactions and dashboard data...");
    const [transactionList, summary, insights] = await Promise.all([
        transactionsApi.getMine(),
        transactionsApi.getSummary(),
        transactionsApi.getInsights()
    ]);

    latestSummary = summary;
    transactions = transactionList.map(normalizeTransaction);
    renderSummary(summary);
    renderInsights(insights.insights || []);
    applyFilters();
    setStatus(
        `Loaded ${transactions.length} transaction(s). Tracker currency: ${summary.base_currency || getTrackerCurrency()}. Starting balance: ${formatMoney(summary.starting_balance || 0, summary.base_currency || getTrackerCurrency())}.`
    );
}

async function refreshAppData() {
    await loadDashboardData();
}

function fillSurveyForm(survey) {
    if (!survey) {
        surveyForm.reset();
        return;
    }

    surveyAgeInput.value = survey.age || "";
    surveyCapitalInput.value = survey.capital || "";
    surveyCapitalCurrencyInput.value = survey.capital_currency || "PLN";
    surveySkillsInput.value = Array.isArray(survey.skills) ? survey.skills.join(", ") : "";
    surveyFinancialGoalInput.value = survey.financial_goal || "";
    surveySportInput.checked = Boolean(survey.sport);
    surveySportTypeInput.value = survey.sport_type || "";
    surveyNonFinancialGoalInput.value = survey.non_financial_goal || "";
}

function updateSidebarUser() {
    sidebarUserNameEl.textContent = authState.user?.name || "Welcome back";
    sidebarUserEmailEl.textContent = authState.user?.email || "";
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

    if (!authState.survey && hash !== "#/survey") {
        window.location.hash = "#/survey";
        return;
    }

    if (hash === "#/survey") {
        setActiveView("survey");
        fillSurveyForm(authState.survey);
        return;
    }

    if (hash === "#/login" || hash === "#/register" || hash === "#/") {
        window.location.hash = "#/app/dashboard";
        return;
    }

    setActiveView("app");

    if (hash === "#/app/ai") {
        setActivePage("ai");
        return;
    }

    setActivePage("dashboard");
    await refreshAppData();
}

async function loginAndBoot(email, password) {
    const token = await authApi.login({ email, password });
    authState.token = token.access_token;
    await ensureSession();
    showToast("Logged in successfully.", "success");
    goToDashboardOrSurvey();
}

async function continueAfterRegistration(payload) {
    try {
        await loginAndBoot(payload.email, payload.password);
        return true;
    } catch (loginError) {
        openLoginView({ email: payload.email, password: payload.password });
        showToast("Account created. Log in with the same credentials to continue.", "info");
        return false;
    }
}

function collectSurveyPayload() {
    return {
        age: Number(surveyAgeInput.value),
        capital: Number(surveyCapitalInput.value),
        capital_currency: surveyCapitalCurrencyInput.value,
        skills: surveySkillsInput.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        financial_goal: surveyFinancialGoalInput.value.trim(),
        sport: surveySportInput.checked,
        sport_type: surveySportTypeInput.value.trim() || null,
        non_financial_goal: surveyNonFinancialGoalInput.value.trim() || null
    };
}

topbarLoginBtn.addEventListener("click", () => {
    if (authState.token && authState.user) {
        goToDashboardOrSurvey();
        return;
    }
    window.location.hash = "#/login";
});

topbarRegisterBtn.addEventListener("click", () => {
    if (authState.token && authState.user) {
        goToDashboardOrSurvey();
        return;
    }
    window.location.hash = "#/register";
});

heroStartBtn.addEventListener("click", () => {
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

document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
        window.location.hash = button.dataset.route;
    });
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
            try {
                await authApi.verifyEmail(registeredUser.verification_token);
            } catch (verificationError) {
                console.warn("Verification step failed after successful registration.", verificationError);
            }
        }

        const autoLoggedIn = await continueAfterRegistration(payload);
        if (autoLoggedIn) {
            showToast("Account created and verified for demo flow.", "success");
        }
    } catch (error) {
        if (isEmailAlreadyRegisteredError(error)) {
            openLoginView({ email: payload.email });
            showToast("This email is already registered. Please log in instead.", "error");
            return;
        }

        showToast(error.message || "Registration failed.", "error");
    }
});

surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = collectSurveyPayload();

    try {
        if (authState.survey) {
            authState.survey = await surveyApi.updateMine(payload);
        } else {
            authState.survey = await surveyApi.create(payload);
        }

        showToast("Survey saved.", "success");
        window.location.hash = "#/app/dashboard";
    } catch (error) {
        showToast(error.message || "Could not save survey.", "error");
    }
});

transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = toTransactionPayload(editingTransactionId ? "manual" : "manual");

    try {
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
        window.location.hash = "#/app/dashboard";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

[searchInput, filterTypeInput, filterCategoryInput, fromDateInput, toDateInput].forEach((input) => {
    input.addEventListener(input.tagName === "SELECT" ? "change" : "input", applyFilters);
});

aiParseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        parsedTransactionDraft = await transactionsApi.parseText({ text: aiTextInput.value.trim() });
        renderAiPreview(parsedTransactionDraft);
        showToast("AI preview is ready.", "success");
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
        showToast("AI transaction saved.", "success");
        window.location.hash = "#/app/dashboard";
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

promptSuggestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        chatInput.value = button.dataset.prompt || "";
        chatInput.focus();
    });
});

setSelectOptions(typeInput, TYPE_OPTIONS);
setSelectOptions(categoryInput, CATEGORY_OPTIONS);
setSelectOptions(filterTypeInput, TYPE_OPTIONS, true, "All types");
setSelectOptions(filterCategoryInput, CATEGORY_OPTIONS, true, "All categories");
dateInput.value = toInputDate();
renderInsights([
    {
        title: "No insight yet",
        message: "Once transactions are loaded, this block will explain what stands out."
    }
]);
renderChatMessage("assistant", "Ask me to analyze your spending after you add some transactions.");
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
