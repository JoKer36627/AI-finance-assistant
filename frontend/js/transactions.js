function createTransaction(name, amount, type, category, date) {
    return {
        id: crypto.randomUUID(),
        name: name,
        amount: amount,
        type: type,
        category: category,
        date: date
    };
}

function deleteTransactionById(transactions, id) {
    return transactions.filter((t) => t.id !== id);
}

function updateTransactionById(transactions, id, updatedData) {
    return transactions.map((t) => {
        if (t.id === id) {
            return {
                ...t,
                ...updatedData
            };
        }

        return t;
    });
}

function getTransactionById(transactions, id) {
    return transactions.find((t) => t.id === id);
}

function getFilteredTransactions(transactions, filters) {   
    const searchValue = filters.searchValue.trim().toLowerCase();
    const typeValue = filters.typeValue;
    const categoryValue = filters.categoryValue;
    const fromDateValue = filters.fromDateValue;
    const toDateValue = filters.toDateValue;

    return transactions.filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(searchValue);
        const matchesType = typeValue === "all" || t.type === typeValue;
        const matchesCategory = categoryValue === "all" || t.category === categoryValue;
        const matchesFromDate = !fromDateValue || t.date >= fromDateValue;
        const matchesToDate = !toDateValue || t.date <= toDateValue;

        return (
            matchesSearch &&
            matchesType &&
            matchesCategory &&
            matchesFromDate &&
            matchesToDate
        );
    });
}