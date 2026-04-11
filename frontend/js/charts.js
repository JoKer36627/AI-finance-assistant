function drawCharts(list, pieChartCanvas, barChartCanvas, activeTypeFilter = "all") {
    drawPieChart(list, pieChartCanvas);
    drawBarChart(list, barChartCanvas, activeTypeFilter);
}

function getTotalsByCategory(list) {
    const filteredTransactions = list.filter((t) => t.type === "expense");

    return filteredTransactions.reduce((acc, transaction) => {
        const category = transaction.category;

        if (!acc[category]) {
            acc[category] = 0;
        }

        acc[category] += transaction.amount;
        return acc;
    }, {});
}

function getMonthlyTotalsByType(list) {
    return list.reduce((acc, transaction) => {
        const monthKey = transaction.date.slice(0, 7);

        if (!acc[monthKey]) {
            acc[monthKey] = {
                income: 0,
                expense: 0
            };
        }

        acc[monthKey][transaction.type] += transaction.amount;
        return acc;
    }, {});
}

function drawEmptyState(ctx, canvas, message) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#666";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
}

function drawPieChart(list, pieChartCanvas) {
    if (!pieChartCanvas) {
        return;
    }

    const ctx = pieChartCanvas.getContext("2d");
    const categoryTotals = getTotalsByCategory(list);
    const entries = Object.entries(categoryTotals);
    const chartTitle = "Expenses by category";

    if (entries.length === 0) {
        drawEmptyState(ctx, pieChartCanvas, "No expense data for pie chart");
        return;
    }

    ctx.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    const centerX = 150;
    const centerY = 170;
    const radius = 100;

    const colors = [
        "#4F46E5",
        "#06B6D4",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#84CC16"
    ];

    let startAngle = 0;

    entries.forEach(([category, value], index) => {
        const sliceAngle = (value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();

        startAngle += sliceAngle;
    });

    ctx.fillStyle = "#111";
    ctx.font = "14px Arial";
    ctx.fillText(chartTitle, 20, 24);

    entries.forEach(([category, value], index) => {
        const legendY = 300 + index * 24;
        const color = colors[index % colors.length];
        const percentage = ((value / total) * 100).toFixed(1);

        ctx.fillStyle = color;
        ctx.fillRect(20, legendY - 12, 14, 14);

        ctx.fillStyle = "#222";
        ctx.fillText(`${category}: ${value.toFixed(2)} PLN (${percentage}%)`, 44, legendY);
    });
}

function drawBarChart(list, barChartCanvas, activeTypeFilter = "all") {
    if (!barChartCanvas) {
        return;
    }

    const ctx = barChartCanvas.getContext("2d");
    const monthlyTotals = getMonthlyTotalsByType(list);
    const entries = Object.entries(monthlyTotals).sort(([a], [b]) => a.localeCompare(b));

    if (entries.length === 0) {
        drawEmptyState(ctx, barChartCanvas, "No data for bar chart");
        return;
    }

    ctx.clearRect(0, 0, barChartCanvas.width, barChartCanvas.height);

    const chartTitle =
        activeTypeFilter === "income"
            ? "Income by period"
            : activeTypeFilter === "expense"
              ? "Expenses by period"
              : "Income and expenses by period";
    const maxValue = Math.max(
        ...entries.flatMap(([, totals]) =>
            activeTypeFilter === "all"
                ? [totals.income, totals.expense]
                : [totals[activeTypeFilter]]
        )
    );
    const chartLeft = 50;
    const chartBottom = 340;
    const chartHeight = 220;
    const chartWidth = 380;
    const barWidth = activeTypeFilter === "all" ? 24 : 40;
    const gap = 20;

    ctx.strokeStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(chartLeft, 40);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.lineTo(chartLeft + chartWidth, chartBottom);
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.font = "14px Arial";
    ctx.fillText(chartTitle, 20, 24);

    entries.forEach(([month, totals], index) => {
        const groupX = chartLeft + 20 + index * (activeTypeFilter === "all" ? (barWidth * 2 + 8 + gap) : (barWidth + gap));
        const series =
            activeTypeFilter === "all"
                ? [
                    { key: "income", color: "#10B981", x: groupX },
                    { key: "expense", color: "#EF4444", x: groupX + barWidth + 8 }
                ]
                : [
                    {
                        key: activeTypeFilter,
                        color: activeTypeFilter === "income" ? "#10B981" : "#EF4444",
                        x: groupX
                    }
                ];

        series.forEach(({ key, color, x }) => {
            const value = totals[key];
            const barHeight = maxValue === 0 ? 0 : (value / maxValue) * chartHeight;
            const y = chartBottom - barHeight;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = "#222";
            ctx.font = "12px Arial";
            if (value > 0) {
                ctx.fillText(value.toFixed(0), x, y - 8);
            }
        });

        ctx.fillStyle = "#222";
        ctx.font = "12px Arial";
        ctx.fillText(month, groupX - 4, chartBottom + 18);
    });

    if (activeTypeFilter === "all") {
        const legendItems = [
            { label: "Income", color: "#10B981", x: 220 },
            { label: "Expense", color: "#EF4444", x: 310 }
        ];

        legendItems.forEach(({ label, color, x }) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, 12, 14, 14);
            ctx.fillStyle = "#222";
            ctx.fillText(label, x + 20, 24);
        });
    }
}
