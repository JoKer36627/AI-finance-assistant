function saveTransactions(storageKey, transactions) {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function loadTransactions(storageKey) {
    const savedTransactions = localStorage.getItem(storageKey);

    if (!savedTransactions) {
        return [];
    }

    try {
        return JSON.parse(savedTransactions);
    } catch (error) {
        console.error("Error parsing transactions from localStorage:", error);
        return [];
    }
}