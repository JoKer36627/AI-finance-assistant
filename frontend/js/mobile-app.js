// Mobile App for Monefy-style AI Finance Tracker
const CATEGORY_CONFIG = {
    food: { icon: 'fa-utensils', color: '#ff9800', label: 'Їжа' },
    transport: { icon: 'fa-taxi', color: '#ffeb3b', label: 'Транспорт' },
    housing: { icon: 'fa-home', color: '#03a9f4', label: 'Житло' },
    bills: { icon: 'fa-file-invoice', color: '#9c27b0', label: 'Рахунки' },
    entertainment: { icon: 'fa-gamepad', color: '#e91e63', label: 'Розваги' },
    shopping: { icon: 'fa-shopping-bag', color: '#f06292', label: 'Покупки' },
    health: { icon: 'fa-heartbeat', color: '#4caf50', label: 'Здоров\'я' },
    education: { icon: 'fa-graduation-cap', color: '#009688', label: 'Освіта' },
    salary: { icon: 'fa-money-bill-wave', color: '#4caf50', label: 'Зарплата' },
    freelance: { icon: 'fa-laptop', color: '#8bc34a', label: 'Фріланс' },
    other: { icon: 'fa-ellipsis-h', color: '#607d8b', label: 'Інше' }
};

const EXPENSE_CATEGORIES = ['food', 'transport', 'housing', 'bills', 'entertainment', 'shopping', 'health', 'education', 'other'];
const INCOME_CATEGORIES = ['salary', 'freelance', 'other'];

const DEFAULT_CURRENCY = 'USD';

// State
const state = {
    token: authApi.getToken(),
    user: null,
    transactions: [],
    summary: null,
    currentPeriod: 'month',
    transactionType: 'expense',
    selectedCategory: null,
    amountValue: '0',
    parsedTransactions: [],
    _pendingEmail: null,
    _pendingPassword: null,
    _appListenersAttached: false
};

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const verifyPanel = document.getElementById('verify-panel');
const toastEl = document.getElementById('toast');

// Chart instance
let mainDonutChart = null;

// Helper Functions
function showToast(message, type = 'info') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    setTimeout(() => {
        toastEl.className = 'toast hidden';
    }, 3000);
}

function formatMoney(amount, currency = DEFAULT_CURRENCY) {
    const num = Number(amount || 0);
    const formatted = Math.abs(num).toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${formatted} $`;
}

function formatDate(date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Сьогодні';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчора';
    
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

function toInputDate(date) {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().split('T')[0];
}

// Auth Functions
function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
}

function showMainScreen() {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    try {
        initializeApp();
    } catch (e) {
        console.error('[initializeApp error]', e);
    }
}

function showAuthMode(mode) {
    loginForm.classList.toggle('hidden', mode !== 'login');
    registerForm.classList.toggle('hidden', mode !== 'register');
    verifyPanel.classList.toggle('hidden', mode !== 'verify');
}

async function checkAuth() {
    state.token = authApi.getToken();
    
    if (!state.token) {
        showAuthScreen();
        return false;
    }
    
    try {
        state.user = await authApi.getProfile();
        document.getElementById('menu-user-name').textContent = state.user.name || 'Користувач';
        document.getElementById('menu-user-email').textContent = state.user.email || '';
        showMainScreen();
        return true;
    } catch (error) {
        if (error.status === 401 || error.status === 403 || error.message?.includes('Cannot reach backend')) {
            authApi.clearToken();
            state.token = null;
        }
        showAuthScreen();
        return false;
    }
}

// Data Loading
async function loadData() {
    try {
        const [transactions, summary] = await Promise.all([
            transactionsApi.getMine(state.currentPeriod),
            transactionsApi.getSummary(state.currentPeriod)
        ]);
        
        state.transactions = transactions;
        state.summary = summary;
        
        renderSummary();
        renderDonutChart();
        renderCategoryIcons();
    } catch (error) {
        showToast('Помилка завантаження даних', 'error');
        console.error(error);
    }
}

// Rendering
function renderSummary() {
    const summary = state.summary || {};
    const income = Number(summary.income_total || 0);
    const expense = Number(summary.expense_total || 0);
    const balance = Number(summary.balance || 0);
    
    document.getElementById('total-income').textContent = `+${formatMoney(income)}`;
    document.getElementById('total-expense').textContent = `-${formatMoney(expense)}`;
    document.getElementById('period-balance').textContent = formatMoney(income - expense);
    document.getElementById('total-balance').textContent = formatMoney(balance);
}

function renderDonutChart() {
    const canvas = document.getElementById('main-donut-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const categories = state.summary?.category_breakdown || [];
    
    if (mainDonutChart) {
        mainDonutChart.destroy();
    }
    
    if (!categories.length) {
        // Empty state - draw empty donut
        mainDonutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Немає даних'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e0e0e0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        return;
    }
    
    const colors = categories.map(c => CATEGORY_CONFIG[c.category]?.color || '#607d8b');
    
    mainDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => CATEGORY_CONFIG[c.category]?.label || c.category),
            datasets: [{
                data: categories.map(c => Number(c.amount)),
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${formatMoney(context.raw)}`
                    }
                }
            }
        }
    });
}

function renderCategoryIcons() {
    const container = document.getElementById('category-icons');
    container.innerHTML = '';
    
    const categories = state.summary?.category_breakdown || [];
    if (!categories.length) return;
    
    const total = categories.reduce((sum, c) => sum + Number(c.amount), 0);
    const containerRect = container.parentElement.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const radius = Math.min(centerX, centerY) - 50;
    
    categories.forEach((cat, index) => {
        const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.other;
        const percentage = Math.round((Number(cat.amount) / total) * 100);
        
        // Position around circle
        const angle = (index / categories.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle) - 20;
        const y = centerY + radius * Math.sin(angle) - 20;
        
        const icon = document.createElement('div');
        icon.className = `category-icon cat-${cat.category}`;
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        icon.innerHTML = `
            <i class="fas ${config.icon}"></i>
            <span>${percentage}%</span>
        `;
        icon.addEventListener('click', () => showCategoryTransactions(cat.category));
        container.appendChild(icon);
    });
}

function showCategoryTransactions(category) {
    const filtered = state.transactions.filter(t => t.category === category);
    renderTransactionsList(filtered);
    document.getElementById('transactions-modal').classList.remove('hidden');
}

function renderTransactionsList(transactions = state.transactions) {
    const container = document.getElementById('transactions-list');
    
    if (!transactions.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Немає транзакцій</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(t => {
        const config = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.other;
        const isIncome = t.type === 'income';
        return `
            <div class="transaction-item" data-id="${t.id}">
                <div class="icon" style="background: ${config.color}20; color: ${config.color}">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="info">
                    <div class="note">${t.note || config.label}</div>
                    <div class="category">${config.label}</div>
                </div>
                <div class="right">
                    <div class="amount ${t.type}">${isIncome ? '+' : '-'}${formatMoney(t.amount)}</div>
                    <div class="date">${formatDate(t.transaction_date)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Transaction Modal
function openTransactionModal(type) {
    state.transactionType = type;
    state.amountValue = '0';
    state.selectedCategory = null;
    
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('transaction-modal-title');
    title.textContent = type === 'income' ? 'Новий дохід' : 'Нова витрата';
    
    document.getElementById('amount-input').value = '0';
    document.getElementById('note-input-field').value = '';
    document.getElementById('transaction-date-display').textContent = 'Сьогодні';
    document.getElementById('transaction-date-input').value = toInputDate();
    
    renderCategoryGrid(type);
    modal.classList.remove('hidden');
}

function renderCategoryGrid(type) {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const grid = document.getElementById('category-grid');
    
    grid.innerHTML = categories.map(cat => {
        const config = CATEGORY_CONFIG[cat];
        return `
            <div class="category-item cat-${cat}" data-category="${cat}">
                <i class="fas ${config.icon}" style="color: ${config.color}"></i>
                <span>${config.label}</span>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    grid.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => selectCategory(item.dataset.category));
    });
}

function selectCategory(category) {
    state.selectedCategory = category;
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.category === category);
    });
}

function handleNumpadInput(value) {
    if (value === '=') {
        try {
            const result = eval(state.amountValue.replace('×', '*').replace('÷', '/').replace('−', '-'));
            state.amountValue = String(Math.abs(result) || 0);
        } catch {
            // Invalid expression
        }
    } else if (['+', '-', '*', '/'].includes(value)) {
        state.amountValue += value;
    } else if (value === '.') {
        const parts = state.amountValue.split(/[\+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if (!lastPart.includes('.')) {
            state.amountValue += '.';
        }
    } else {
        if (state.amountValue === '0') {
            state.amountValue = value;
        } else {
            state.amountValue += value;
        }
    }
    
    document.getElementById('amount-input').value = state.amountValue;
}

function handleBackspace() {
    if (state.amountValue.length > 1) {
        state.amountValue = state.amountValue.slice(0, -1);
    } else {
        state.amountValue = '0';
    }
    document.getElementById('amount-input').value = state.amountValue;
}

async function saveTransaction() {
    let amount;
    try {
        amount = eval(state.amountValue.replace('×', '*').replace('÷', '/').replace('−', '-'));
    } catch {
        amount = parseFloat(state.amountValue) || 0;
    }
    
    if (!amount || amount <= 0) {
        showToast('Введіть суму', 'error');
        return;
    }
    
    if (!state.selectedCategory) {
        showToast('Виберіть категорію', 'error');
        return;
    }
    
    const dateInput = document.getElementById('transaction-date-input').value;
    const note = document.getElementById('note-input-field').value.trim();
    
    try {
        await transactionsApi.create({
            type: state.transactionType,
            amount: amount,
            currency: DEFAULT_CURRENCY,
            category: state.selectedCategory,
            note: note || CATEGORY_CONFIG[state.selectedCategory]?.label || '',
            transaction_date: new Date(`${dateInput}T12:00:00`).toISOString(),
            source: 'manual'
        });
        
        showToast('Транзакцію збережено', 'success');
        document.getElementById('transaction-modal').classList.add('hidden');
        await loadData();
    } catch (error) {
        showToast(error.message || 'Помилка збереження', 'error');
    }
}

// AI Input Modal
function openAiInputModal() {
    document.getElementById('ai-input-modal').classList.remove('hidden');
    document.getElementById('ai-transaction-input').value = '';
    document.getElementById('ai-parse-preview').classList.add('hidden');
    state.parsedTransactions = [];
}

async function parseAiInput() {
    const text = document.getElementById('ai-transaction-input').value.trim();
    if (!text) {
        showToast('Введіть текст транзакцій', 'error');
        return;
    }
    
    try {
        // Split text by lines or common delimiters for multiple transactions
        const lines = text.split(/[,\n;]/).map(l => l.trim()).filter(Boolean);
        const parsed = [];
        
        for (const line of lines) {
            if (line.length < 3) continue;
            try {
                const result = await transactionsApi.parseText({ text: line });
                parsed.push(result);
            } catch (e) {
                console.warn('Failed to parse:', line, e);
            }
        }
        
        if (!parsed.length) {
            showToast('Не вдалося розпізнати транзакції', 'error');
            return;
        }
        
        state.parsedTransactions = parsed;
        renderParsedTransactions();
        document.getElementById('ai-parse-preview').classList.remove('hidden');
    } catch (error) {
        showToast(error.message || 'Помилка парсингу', 'error');
    }
}

function renderParsedTransactions() {
    const container = document.getElementById('parsed-transactions-list');
    container.innerHTML = state.parsedTransactions.map((t, i) => {
        const config = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.other;
        return `
            <div class="parsed-item">
                <span class="type-badge ${t.type}">${t.type === 'income' ? 'Дохід' : 'Витрата'}</span>
                <div class="details">
                    <div class="note">${t.note}</div>
                    <div class="meta">${config.label} · ${formatDate(t.transaction_date)}</div>
                </div>
                <div class="amount" style="color: ${t.type === 'income' ? '#2e7d32' : '#c62828'}">
                    ${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount, t.currency)}
                </div>
            </div>
        `;
    }).join('');
}

async function confirmAiTransactions() {
    if (!state.parsedTransactions.length) return;
    
    try {
        for (const t of state.parsedTransactions) {
            await transactionsApi.create({
                ...t,
                currency: t.currency || DEFAULT_CURRENCY,
                transaction_date: new Date(t.transaction_date).toISOString()
            });
        }
        
        showToast(`Збережено ${state.parsedTransactions.length} транзакцій`, 'success');
        document.getElementById('ai-input-modal').classList.add('hidden');
        state.parsedTransactions = [];
        await loadData();
    } catch (error) {
        showToast(error.message || 'Помилка збереження', 'error');
    }
}

// AI Chat
function openChatModal() {
    document.getElementById('ai-chat-modal').classList.remove('hidden');
}

function addChatMessage(role, content) {
    const container = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `chat-message ${role}`;
    message.innerHTML = `<p>${content}</p>`;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

async function sendChatMessage(message) {
    if (!message.trim()) return;
    
    addChatMessage('user', message);
    document.getElementById('chat-input').value = '';
    addTypingIndicator();
    
    try {
        const response = await assistantApi.sendMessage({ message });
        removeTypingIndicator();
        addChatMessage('assistant', response.reply);
    } catch (error) {
        removeTypingIndicator();
        addChatMessage('assistant', 'Вибачте, сталася помилка. Спробуйте ще раз.');
    }
}

// Side Menu
function toggleMenu(show) {
    document.getElementById('side-menu').classList.toggle('hidden', !show);
}

function handleMenuAction(action) {
    toggleMenu(false);
    
    switch (action) {
        case 'transactions':
            renderTransactionsList();
            document.getElementById('transactions-modal').classList.remove('hidden');
            break;
        case 'ai-input':
            openAiInputModal();
            break;
        case 'logout':
            authApi.clearToken();
            state.token = null;
            state.user = null;
            showAuthScreen();
            showToast('Вихід виконано', 'info');
            break;
        case 'categories':
        case 'accounts':
        case 'settings':
            showToast('Функція в розробці', 'info');
            break;
    }
}

// Initialize App
function initializeApp() {
    loadData();
    if (!state._appListenersAttached) {
        setupAppEventListeners();
        state._appListenersAttached = true;
    }
}

// Auth listeners - called immediately on page load
function setupAuthEventListeners() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            await authApi.login({ email, password });
            state.token = authApi.getToken();
            await checkAuth();
        } catch (error) {
            if (error.status === 403) {
                showToast('Акаунт не підтверджено', 'error');
            } else {
                showToast(error.message || 'Помилка входу', 'error');
            }
        }
    });
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const result = await authApi.register({ name, email, password });
            if (result.verification_token) {
                state._pendingEmail = email;
                state._pendingPassword = password;
                document.getElementById('verify-token').value = result.verification_token;
                showAuthMode('verify');
                showToast('Підтвердіть акаунт', 'success');
            } else {
                showAuthMode('login');
                showToast('Зареєстровано! Увійдіть', 'success');
            }
        } catch (error) {
            showToast(error.message || 'Помилка реєстрації', 'error');
        }
    });
    
    document.getElementById('verify-btn').addEventListener('click', async () => {
        const token = document.getElementById('verify-token').value;
        try {
            await authApi.verifyEmail(token);
            // Auto-login after verification
            const email = state._pendingEmail;
            const password = state._pendingPassword;
            if (email && password) {
                try {
                    await authApi.login({ email, password });
                    state.token = authApi.getToken();
                    showToast('Акаунт підтверджено! Вхід...', 'success');
                    await checkAuth();
                    return;
                } catch (e) {
                    // fallback to manual login
                }
            }
            showAuthMode('login');
            showToast('Акаунт підтверджено', 'success');
        } catch (error) {
            showToast(error.message || 'Помилка підтвердження', 'error');
        }
    });
    
    document.getElementById('switch-to-register').addEventListener('click', () => showAuthMode('register'));
    document.getElementById('switch-to-login').addEventListener('click', () => showAuthMode('login'));
    document.getElementById('back-to-login').addEventListener('click', () => showAuthMode('login'));
}

// App listeners - called after successful auth
function setupAppEventListeners() {
    function safeAddListener(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    }

    // Period selector
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentPeriod = btn.dataset.period;
            await loadData();
        });
    });
    
    // Action buttons
    safeAddListener('add-expense-btn', 'click', () => openTransactionModal('expense'));
    safeAddListener('add-income-btn', 'click', () => openTransactionModal('income'));
    
    // Transaction modal
    safeAddListener('close-transaction-modal', 'click', () => {
        document.getElementById('transaction-modal').classList.add('hidden');
    });
    
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNumpadInput(btn.dataset.value));
    });
    
    safeAddListener('backspace-btn', 'click', handleBackspace);
    safeAddListener('select-category-btn', 'click', saveTransaction);
    
    safeAddListener('transaction-date-wrapper', 'click', () => {
        const input = document.getElementById('transaction-date-input');
        if (input) {
            input.classList.toggle('hidden');
            input.focus();
        }
    });
    
    safeAddListener('transaction-date-input', 'change', (e) => {
        const date = new Date(e.target.value);
        document.getElementById('transaction-date-display').textContent = formatDate(date);
    });
    
    // AI Input modal
    safeAddListener('send-ai-input', 'click', parseAiInput);
    safeAddListener('close-ai-input-modal', 'click', () => {
        document.getElementById('ai-input-modal').classList.add('hidden');
    });
    safeAddListener('confirm-ai-transactions', 'click', confirmAiTransactions);
    safeAddListener('discard-ai-transactions', 'click', () => {
        document.getElementById('ai-parse-preview').classList.add('hidden');
        state.parsedTransactions = [];
    });
    
    document.querySelectorAll('.example-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.getElementById('ai-transaction-input').value = chip.dataset.example;
        });
    });
    
    // AI Chat
    safeAddListener('ai-chat-btn', 'click', openChatModal);
    safeAddListener('close-chat-modal', 'click', () => {
        document.getElementById('ai-chat-modal').classList.add('hidden');
    });
    
    safeAddListener('chat-form', 'submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        sendChatMessage(input.value);
    });
    
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => sendChatMessage(chip.dataset.prompt));
    });
    
    // Side menu
    safeAddListener('menu-btn', 'click', () => toggleMenu(true));
    safeAddListener('menu-overlay', 'click', () => toggleMenu(false));
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => handleMenuAction(item.dataset.action));
    });
    
    // Transactions modal
    safeAddListener('close-transactions-modal', 'click', () => {
        document.getElementById('transactions-modal').classList.add('hidden');
    });
    
    // Sync button
    safeAddListener('sync-btn', 'click', async () => {
        showToast('Оновлення...', 'info');
        await loadData();
        showToast('Дані оновлено', 'success');
    });
}

// Start
setupAuthEventListeners();
checkAuth();
