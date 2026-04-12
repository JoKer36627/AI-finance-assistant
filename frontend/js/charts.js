let spendingChartInstance = null;
let balanceTrendChartInstance = null;
let cashFlowChartInstance = null;

const chartPalette = {
    blue: "#77aef8",
    blueSoft: "rgba(119, 174, 248, 0.16)",
    emerald: "#58b97f",
    emeraldSoft: "rgba(88, 185, 127, 0.16)",
    red: "#f08c8c",
    redSoft: "rgba(240, 140, 140, 0.16)",
    gray: "#8f98a8",
    grid: "rgba(95, 130, 110, 0.12)"
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
        labels.push(period.label || period.period);
        values.push(runningBalance);
    });

    return { labels, values };
}

function buildCashFlowSeries(summary, activeTypeFilter = "all") {
    const periods = summary?.period_breakdown || [];
    const labels = periods.map((period) => period.label || period.period);

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
        animation: {
            duration: 850,
            easing: "easeOutQuart"
        },
        interaction: {
            mode: "nearest",
            intersect: false
        },
        plugins: {
            legend: {
                labels: {
                    color: "#406057",
                    font: {
                        family: "Nunito Sans",
                        size: 12,
                        weight: "700"
                    },
                    boxWidth: 12,
                    boxHeight: 12,
                    usePointStyle: true,
                    pointStyle: "circle"
                }
            },
            tooltip: {
                backgroundColor: "rgba(255,255,255,0.98)",
                titleColor: "#193229",
                bodyColor: "#406057",
                borderColor: "rgba(73, 127, 93, 0.14)",
                borderWidth: 1,
                padding: 14,
                displayColors: true,
                titleFont: {
                    family: "Nunito Sans",
                    weight: "700"
                },
                bodyFont: {
                    family: "Nunito Sans",
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
                    color: "#69857b",
                    font: {
                        family: "Nunito Sans",
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
                    color: "#69857b",
                    font: {
                        family: "Nunito Sans",
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
                        "#77aef8",
                        "#58b97f",
                        "#efc84d",
                        "#9d7ef8",
                        "#ef7db4",
                        "#8f98a8",
                        "#8be0d1",
                        "#f4a261"
                    ],
                    borderColor: "#f9fff9",
                    borderWidth: 6,
                    hoverOffset: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            animation: {
                duration: 900,
                easing: "easeOutQuart"
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: "rgba(255,255,255,0.98)",
                    titleColor: "#193229",
                    bodyColor: "#406057",
                    borderColor: "rgba(73, 127, 93, 0.14)",
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
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: "#f9fff9",
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
                    position: "bottom"
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
