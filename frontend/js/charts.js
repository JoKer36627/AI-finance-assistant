let spendingChartInstance = null;
let balanceTrendChartInstance = null;
let cashFlowChartInstance = null;

const chartPalette = {
    blue: "#3b82f6",
    blueSoft: "rgba(59, 130, 246, 0.18)",
    emerald: "#10b981",
    emeraldSoft: "rgba(16, 185, 129, 0.18)",
    red: "#ef4444",
    redSoft: "rgba(239, 68, 68, 0.18)",
    gray: "#94a3b8",
    grid: "rgba(148, 163, 184, 0.16)"
};

function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
}

function formatChartMoney(value, currency = "PLN") {
    return `${Number(value || 0).toFixed(0)} ${currency}`;
}

function buildBalanceTrendSeries(summary) {
    const periods = summary?.period_breakdown || [];
    const labels = [];
    const values = [];
    let runningBalance = Number(summary?.starting_balance || 0);

    periods.forEach((period) => {
        runningBalance += Number(period.income || 0) - Number(period.expense || 0);
        labels.push(period.period);
        values.push(runningBalance);
    });

    return { labels, values };
}

function buildCashFlowSeries(summary, activeTypeFilter = "all") {
    const periods = summary?.period_breakdown || [];
    const labels = periods.map((period) => period.period);

    const datasets = [];
    if (activeTypeFilter === "all" || activeTypeFilter === "income") {
        datasets.push({
            label: "Income",
            data: periods.map((period) => Number(period.income || 0)),
            backgroundColor: chartPalette.emerald,
            borderRadius: 10,
            maxBarThickness: 30
        });
    }

    if (activeTypeFilter === "all" || activeTypeFilter === "expense") {
        datasets.push({
            label: "Expenses",
            data: periods.map((period) => Number(period.expense || 0)),
            backgroundColor: chartPalette.red,
            borderRadius: 10,
            maxBarThickness: 30
        });
    }

    return { labels, datasets };
}

function buildCategorySeries(summary) {
    const categories = summary?.category_breakdown || [];
    return {
        labels: categories.map((item) => item.category),
        values: categories.map((item) => Number(item.amount || 0))
    };
}

function getSharedOptions(currency = "PLN") {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: "#475467",
                    font: {
                        family: "Manrope",
                        size: 13,
                        weight: "700"
                    },
                    boxWidth: 12,
                    boxHeight: 12,
                    usePointStyle: true,
                    pointStyle: "circle"
                }
            },
            tooltip: {
                backgroundColor: "rgba(255,255,255,0.96)",
                titleColor: "#0f172a",
                bodyColor: "#334155",
                borderColor: "rgba(226, 232, 240, 1)",
                borderWidth: 1,
                padding: 14,
                displayColors: true,
                titleFont: {
                    family: "Sora",
                    weight: "700"
                },
                bodyFont: {
                    family: "Manrope",
                    weight: "700"
                },
                callbacks: {
                    label(context) {
                        const label = context.dataset?.label || context.label || "";
                        return `${label ? `${label}: ` : ""}${formatChartMoney(context.parsed.y ?? context.parsed, currency)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: "#667085",
                    font: {
                        family: "Manrope",
                        weight: "700"
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: chartPalette.grid
                },
                ticks: {
                    color: "#667085",
                    font: {
                        family: "Manrope",
                        weight: "700"
                    },
                    callback(value) {
                        return formatChartMoney(value, currency);
                    }
                }
            }
        }
    };
}

function drawSpendingChart(summary, canvas, currency) {
    if (!canvas || !window.Chart) {
        return;
    }

    const series = buildCategorySeries(summary);
    destroyChart(spendingChartInstance);

    if (!series.values.length) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    spendingChartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: series.labels,
            datasets: [
                {
                    data: series.values,
                    backgroundColor: [
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#8b5cf6",
                        "#ec4899",
                        "#64748b",
                        "#06b6d4",
                        "#f97316"
                    ],
                    borderColor: "#ffffff",
                    borderWidth: 5,
                    hoverOffset: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#475467",
                        font: {
                            family: "Manrope",
                            size: 13,
                            weight: "700"
                        },
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(255,255,255,0.96)",
                    titleColor: "#0f172a",
                    bodyColor: "#334155",
                    borderColor: "rgba(226, 232, 240, 1)",
                    borderWidth: 1,
                    padding: 14,
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatChartMoney(context.parsed, currency)}`;
                        }
                    }
                }
            }
        }
    });
}

function drawBalanceTrendChart(summary, canvas, currency) {
    if (!canvas || !window.Chart) {
        return;
    }

    const series = buildBalanceTrendSeries(summary);
    destroyChart(balanceTrendChartInstance);

    if (!series.values.length) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    balanceTrendChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: series.labels,
            datasets: [
                {
                    label: "Balance",
                    data: series.values,
                    borderColor: chartPalette.blue,
                    backgroundColor: chartPalette.blueSoft,
                    fill: true,
                    tension: 0.36,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#ffffff",
                    pointBorderColor: chartPalette.blue,
                    pointBorderWidth: 3
                }
            ]
        },
        options: {
            ...getSharedOptions(currency),
            plugins: {
                ...getSharedOptions(currency).plugins,
                legend: {
                    display: false
                }
            }
        }
    });
}

function drawCashFlowChart(summary, canvas, activeTypeFilter, currency) {
    if (!canvas || !window.Chart) {
        return;
    }

    const series = buildCashFlowSeries(summary, activeTypeFilter);
    destroyChart(cashFlowChartInstance);

    if (!series.datasets.length) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    cashFlowChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: series.labels,
            datasets: series.datasets
        },
        options: {
            ...getSharedOptions(currency),
            plugins: {
                ...getSharedOptions(currency).plugins,
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#475467",
                        font: {
                            family: "Manrope",
                            size: 13,
                            weight: "700"
                        },
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                }
            }
        }
    });
}

function drawCharts(summary, pieChartCanvas, lineChartCanvas, barChartCanvas, activeTypeFilter = "all") {
    const currency = summary?.base_currency || "PLN";
    drawSpendingChart(summary, pieChartCanvas, currency);
    drawBalanceTrendChart(summary, lineChartCanvas, currency);
    drawCashFlowChart(summary, barChartCanvas, activeTypeFilter, currency);
}
