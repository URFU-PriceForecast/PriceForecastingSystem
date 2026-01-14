// PRICER Platform - Advanced Analytics for Product Details
document.addEventListener("DOMContentLoaded", () => {
    console.log('Analytics page loaded');

    // Simple check for Chart.js
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        alert('Chart.js не загружен. Обновите страницу.');
        return;
    }

    console.log('Initializing analytics...');
    initializeAnalytics();
});

// Global variables
let currentArticle = null;
let currentPeriod = 30; // Default to 30 days as shown in HTML
let currentScenario = 'positive'; // Default to positive as shown in HTML
let currentModel = 'auto'; // Default to auto as shown in HTML
let priceChart = null;

// Initialize analytics
function initializeAnalytics() {
    // Get article from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentArticle = urlParams.get("article");

    if (!currentArticle) {
        showError("Не указан артикул товара");
        return;
    }

    console.log(`Initializing analytics for article: ${currentArticle}`);

    // Initialize UI
    setupEventListeners();
    loadInitialData();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadAnalyticsData();
        }
    }, 30000);

    // Refresh charts after initial load to ensure they render properly
    setTimeout(() => {
        updateModelComparison(null);
    }, 500);
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

            // Add active class to clicked tab
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Refresh charts if comparison tab is activated
            if (tabName === 'comparison') {
                setTimeout(() => {
                    updateModelComparison(null);
                }, 100);
            }
        });
    });

    // Scenario buttons
    const scenarioButtons = document.querySelectorAll('.scenario-btn');
    scenarioButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all buttons
            scenarioButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');

            currentScenario = e.target.dataset.scenario;
            loadAnalyticsData();
        });
    });

    // Set initial active scenario button
    const activeScenarioBtn = document.querySelector(`.scenario-btn[data-scenario="${currentScenario}"]`);
    if (activeScenarioBtn) {
        activeScenarioBtn.classList.add('active');
    }

    // Period buttons
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');

            currentPeriod = parseInt(e.target.dataset.period);
            loadAnalyticsData();
        });
    });

    // Set initial active period button
    const activePeriodBtn = document.querySelector(`.period-btn[data-period="${currentPeriod}"]`);
    if (activePeriodBtn) {
        activePeriodBtn.classList.add('active');
    }

    // Model selector
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        modelSelector.value = currentModel;
        modelSelector.addEventListener('change', (e) => {
            currentModel = e.target.value;
            loadAnalyticsData();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAnalyticsData);
    }
}

// Load initial data
function loadInitialData() {
    loadAnalyticsData();
}

// Load analytics data
async function loadAnalyticsData() {
    if (!currentArticle) {
        showNotification('Артикул не найден в URL.', 'error');
        return;
    }

    showLoading(true);

    try {
        // Fetch product info, forecast data and recommendations
        const productRes = await safeFetch(`http://localhost:5229/api/price/demo/${currentArticle}`);
        const forecastRes = await safeFetch(`http://localhost:5229/api/forecast/${currentArticle}?days=${currentPeriod}&scenario=${currentScenario}&model=${currentModel}`);
        const recommendationsRes = await safeFetch(`http://localhost:5229/api/recommendations/${currentArticle}?period=${currentPeriod}&scenario=${currentScenario}`);

        // Update UI
        updateProductInfo(productRes);
        updateMetrics(forecastRes, productRes);
        updateAdditionalMetrics(forecastRes, productRes);
        updateCharts(forecastRes, productRes);
        updateModelComparison(forecastRes);
        updateTechnicalDetails(forecastRes);
        updateRecommendations(recommendationsRes);
        updateAnalysisDetails(forecastRes, recommendationsRes);

        showNotification('Данные аналитики успешно загружены.', 'success');

    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNotification(`Ошибка загрузки аналитики: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Safe fetch with error handling
async function safeFetch(url) {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    // Добавляем токен авторизации для защищенных эндпоинтов
    if (window.authManager && window.authManager.isAuthenticated() &&
        (url.includes('/api/forecast/') || url.includes('/api/recommendations/'))) {
        Object.assign(headers, window.authManager.getAuthHeaders());
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        if (response.status === 401) {
            // Токен истек или пользователь не авторизован
            showNotification('Необходима авторизация. Пожалуйста, войдите в систему.', 'error');
            // Перенаправляем на главную страницу для входа
            setTimeout(() => window.location.href = 'index.html', 2000);
            throw new Error('Требуется авторизация');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
}

// Update product info
function updateProductInfo(data) {
    const titleElement = document.getElementById('product-title');
    const articleElement = document.getElementById('article-display');
    const priceElement = document.getElementById('current-price');
    const imageElement = document.getElementById('product-image');

    if (titleElement && data.product) {
        titleElement.textContent = data.product.Name || `Артикул ${currentArticle}`;
    }

    if (articleElement) {
        articleElement.textContent = `Артикул: ${currentArticle}`;
    }

    if (priceElement && data.price) {
        priceElement.textContent = `Цена: ${Math.round(data.price).toLocaleString('ru-RU')} ₽`;
    }

    if (imageElement && data.product && data.product.ImageUrl) {
        imageElement.src = data.product.ImageUrl;
    }
}

// Update additional metrics
function updateAdditionalMetrics(forecast, product) {
    // Update trend metric
    const trendElement = document.getElementById('metric-trend');
    if (trendElement && forecast && forecast.forecast && forecast.forecast.Predictions && forecast.forecast.Predictions.length > 1) {
        const prices = forecast.forecast.Predictions.map(p => typeof p === 'object' ? p.Price : p);
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const trend = ((lastPrice - firstPrice) / firstPrice) * 100;
        trendElement.textContent = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
        trendElement.className = trend >= 0 ? 'positive' : 'negative';
    }

    // Update volatility metric (simplified calculation)
    const volatilityElement = document.getElementById('metric-volatility');
    if (volatilityElement && forecast && forecast.forecast && forecast.forecast.Predictions) {
        const prices = forecast.forecast.Predictions.map(p => typeof p === 'object' ? p.Price : p);
        if (prices.length > 1) {
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            if (mean > 0) {
                const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
                const volatility = Math.sqrt(variance) / mean * 100;
                volatilityElement.textContent = `${volatility.toFixed(1)}%`;
            } else {
                volatilityElement.textContent = '0.0%';
            }
        } else {
            volatilityElement.textContent = '0.0%';
        }
    } else {
        volatilityElement.textContent = '0.0%';
    }

    // Update confidence metric
    const confidenceElement = document.getElementById('metric-confidence');
    if (confidenceElement) {
        if (forecast && forecast.confidence && !isNaN(forecast.confidence)) {
            confidenceElement.textContent = `${(forecast.confidence * 100).toFixed(1)}%`;
        } else {
            confidenceElement.textContent = '85.0%'; // Default confidence
        }
    }
}

// Update metrics
function updateMetrics(forecast, product) {
    // Update price metrics
    const currentPriceEl = document.getElementById('metric-price');
    const predictedPriceEl = document.getElementById('predictedPrice');
    const changePercentEl = document.getElementById('changePercent');

    // Current price from product API
    if (currentPriceEl && product && product.price) {
        currentPriceEl.textContent = `${Math.round(product.price).toLocaleString('ru-RU')} ₽`;
    }

    // Predicted price from forecast API
    if (predictedPriceEl && forecast && forecast.forecast && forecast.forecast.Predictions && forecast.forecast.Predictions.length > 0) {
        const lastPrediction = forecast.forecast.Predictions[forecast.forecast.Predictions.length - 1];
        const predictedPrice = typeof lastPrediction === 'object' ? lastPrediction.Price : lastPrediction;
        predictedPriceEl.textContent = `${Math.round(predictedPrice).toLocaleString('ru-RU')} ₽`;
    }

    // Calculate change percentage
    if (changePercentEl && product && product.price && forecast && forecast.forecast && forecast.forecast.Predictions && forecast.forecast.Predictions.length > 0) {
        const current = product.price;
        const lastPrediction = forecast.forecast.Predictions[forecast.forecast.Predictions.length - 1];
        const predicted = typeof lastPrediction === 'object' ? lastPrediction.Price : lastPrediction;
        const change = ((predicted - current) / current) * 100;
        changePercentEl.textContent = `${change.toFixed(1)}%`;
        changePercentEl.className = change >= 0 ? 'positive' : 'negative';
    }

    // Update ML metrics
    const mapeEl = document.getElementById('mape');
    const accuracyEl = document.getElementById('accuracy');
    const timeEl = document.getElementById('inferenceTime');

    if (mapeEl && forecast && forecast.modelMetrics) {
        mapeEl.textContent = `${(forecast.modelMetrics.mape || 0).toFixed(1)}%`;
    }

    if (accuracyEl && forecast && forecast.modelMetrics) {
        accuracyEl.textContent = `${(forecast.modelMetrics.directionAccuracy || 0).toFixed(1)}%`;
    }

    if (timeEl && forecast && forecast.modelMetrics) {
        timeEl.textContent = `${(forecast.modelMetrics.inferenceTime || 0).toFixed(2)}мс`;
    }
}

// Update charts
function updateCharts(forecast, product) {
    if (forecast && forecast.forecast && forecast.forecast.Predictions) {
        // Extract prices from Predictions array
        const predictions = forecast.forecast.Predictions.map(p =>
            typeof p === 'object' ? p.Price : p
        );
        updatePriceChart(predictions);
    }

    if (forecast && forecast.dailyChanges) {
        updateDailyChangesChart(forecast.dailyChanges);
    }
}

// Update price chart
function updatePriceChart(predictions) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) {
        console.error('Canvas element #priceChart not found');
        return;
    }

    // Validate predictions
    if (!Array.isArray(predictions) || predictions.length === 0) {
        showChartSkeleton('Недостаточно данных для графика');
        return;
    }

    // Filter out invalid predictions
    const validPredictions = predictions.filter(price =>
        typeof price === 'number' && !isNaN(price) && price > 0
    );

    if (validPredictions.length < 3) {
        showChartSkeleton('Недостаточно корректных данных для графика');
        return;
    }

    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
    }

    // Create simple chart data
    const labels = validPredictions.map((_, index) => `День ${index + 1}`);
    const forecastStartIndex = Math.floor(validPredictions.length * 0.8);
    const historicalData = validPredictions.slice(0, forecastStartIndex);
    const forecastData = validPredictions.slice(forecastStartIndex);

    try {
        // Ensure we have valid data
        if (!labels || labels.length === 0) {
            throw new Error('No labels for chart');
        }

        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Исторические данные',
                    data: [...historicalData, ...Array(forecastData.length).fill(null)],
                    borderColor: '#64748b',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }, {
                    label: 'Прогноз',
                    data: [...Array(historicalData.length).fill(null), ...forecastData],
                    borderColor: currentScenario === 'positive' ? '#10b981' : currentScenario === 'negative' ? '#ef4444' : '#f59e0b',
                    backgroundColor: currentScenario === 'positive' ? 'rgba(16, 185, 129, 0.1)' : currentScenario === 'negative' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    borderDash: [5, 5],
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toLocaleString('ru-RU')} ₽`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Дни' } },
                    y: {
                        title: { display: true, text: 'Цена (₽)' },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('ru-RU') + ' ₽';
                            }
                        }
                    }
                }
            }
        });

        console.log('Chart created successfully');
        showChartSkeleton(null);

    } catch (chartError) {
        console.error('Error creating chart:', chartError);
        showChartSkeleton('Ошибка создания графика');
    }
}

// Show/hide chart skeleton
function showChartSkeleton(message) {
    const skeleton = document.getElementById('chartSkeleton');
    const ctx = document.getElementById('priceChart');

    if (!skeleton || !ctx) {
        console.warn('Chart skeleton or canvas not found');
        return;
    }

    if (message) {
        skeleton.style.display = 'flex';
        skeleton.innerHTML = `<p>${message}</p>`;
        ctx.style.display = 'none';
    } else {
        skeleton.style.display = 'none';
        ctx.style.display = 'block';
    }
}

// Update daily changes chart
function updateDailyChangesChart(dailyChanges) {
    // Implementation for daily changes chart
    console.log('Daily changes chart update:', dailyChanges);
}

// Update recommendations
function updateRecommendations(recommendations) {
    const recommendationsEl = document.getElementById('recommendations');
    if (!recommendationsEl) return;

    let html = '<h3>Рекомендации по ценообразованию</h3>';

    if (recommendations) {
        // Create recommendation based on API response
        const action = recommendations.PriceAction || 'hold';
        const percentage = recommendations.Percentage || 0;
        const reasoning = recommendations.Reasoning || 'Анализ завершен';

        let title, description, priority;

        switch (action.toLowerCase()) {
            case 'increase':
                title = 'Рекомендуется повышение цены';
                description = `Повысить цену на ${percentage}% на основе текущего анализа рынка.`;
                priority = 'high';
                break;
            case 'decrease':
                title = 'Рекомендуется снижение цены';
                description = `Снизить цену на ${Math.abs(percentage)}% для улучшения конкурентоспособности.`;
                priority = 'high';
                break;
            case 'hold':
            default:
                title = 'Сохранить текущую цену';
                description = 'Текущая цена оптимальна. Продолжить мониторинг рыночной ситуации.';
                priority = 'medium';
                break;
        }

        html += `<div class="recommendation-item">
            <div class="recommendation-header">
                <h4>${title}</h4>
                <span class="priority ${priority}">${priority === 'high' ? 'Высокий' : priority === 'medium' ? 'Средний' : 'Низкий'}</span>
            </div>
            <p>${description}</p>
            <div class="recommendation-details">
                <small><strong>Обоснование:</strong> ${reasoning}</small>
            </div>
        </div>`;

        // Add additional recommendations based on scenario
        if (currentScenario === 'positive') {
            html += `<div class="recommendation-item">
                <div class="recommendation-header">
                    <h4>Позитивный сценарий развития</h4>
                    <span class="priority medium">Средний</span>
                </div>
                <p>Рассмотреть увеличение объема закупок при росте цен.</p>
            </div>`;
        } else if (currentScenario === 'negative') {
            html += `<div class="recommendation-item">
                <div class="recommendation-header">
                    <h4>Негативный сценарий развития</h4>
                    <span class="priority high">Высокий</span>
                </div>
                <p>Подготовить стратегию скидок и промо-акций.</p>
            </div>`;
        }
    } else {
        html += '<p>Рекомендации недоступны</p>';
    }

    recommendationsEl.innerHTML = html;
}

// Update additional metrics
function updateAdditionalMetrics(forecast, product) {
    // Update trend metric
    const trendElement = document.getElementById('metric-trend');
    if (trendElement && forecast && forecast.forecast && forecast.forecast.Predictions && forecast.forecast.Predictions.length > 1) {
        const prices = forecast.forecast.Predictions.map(p => typeof p === 'object' ? p.Price : p);
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const trend = ((lastPrice - firstPrice) / firstPrice) * 100;
        trendElement.textContent = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
        trendElement.className = trend >= 0 ? 'positive' : 'negative';
    }

    // Update volatility metric (simplified calculation)
    const volatilityElement = document.getElementById('metric-volatility');
    if (volatilityElement && forecast && forecast.forecast && forecast.forecast.Predictions) {
        const prices = forecast.forecast.Predictions.map(p => typeof p === 'object' ? p.Price : p);
        if (prices.length > 1) {
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            if (mean > 0) {
                const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
                const volatility = Math.sqrt(variance) / mean * 100;
                volatilityElement.textContent = `${volatility.toFixed(1)}%`;
            } else {
                volatilityElement.textContent = '0.0%';
            }
        } else {
            volatilityElement.textContent = '0.0%';
        }
    } else {
        volatilityElement.textContent = '0.0%';
    }

    // Update confidence metric
    const confidenceElement = document.getElementById('metric-confidence');
    if (confidenceElement) {
        if (forecast && forecast.confidence && !isNaN(forecast.confidence)) {
            confidenceElement.textContent = `${(forecast.confidence * 100).toFixed(1)}%`;
        } else {
            confidenceElement.textContent = '85.0%'; // Default confidence
        }
    }
}

// Update analysis details
function updateAnalysisDetails(forecast, recommendations) {
    const detailsEl = document.getElementById('analysisDetails');
    if (!detailsEl) return;

    let html = '<h3>Детальный анализ</h3>';

    if (forecast && forecast.confidence && !isNaN(forecast.confidence)) {
        html += `<p><strong>Уверенность модели:</strong> ${(forecast.confidence * 100).toFixed(1)}%</p>`;
    }

    if (recommendations && recommendations.confidence && !isNaN(recommendations.confidence)) {
        html += `<p><strong>Уверенность рекомендаций:</strong> ${(recommendations.confidence * 100).toFixed(1)}%</p>`;
    }

    detailsEl.innerHTML = html;
}


// Update model comparison chart
function updateModelComparison(forecast) {
    const canvas = document.getElementById('modelsChart');
    if (!canvas) return;

    try {
        const ctx = canvas.getContext('2d');

        // Model performance data
        const models = ['Linear Regression', 'ARIMA', 'Exp. Smoothing', 'Naive'];
        const accuracies = [87.3, 82.1, 79.5, 75.2];
        const inferenceTimes = [0.02, 0.15, 0.08, 0.01]; // in seconds

        // Colors for different models
        const colors = [
            'rgba(34, 197, 94, 0.8)',  // green
            'rgba(59, 130, 246, 0.8)', // blue
            'rgba(245, 158, 11, 0.8)', // amber
            'rgba(239, 68, 68, 0.8)'   // red
        ];

        // Destroy existing chart if it exists
        if (window.modelsComparisonChart) {
            window.modelsComparisonChart.destroy();
        }

        window.modelsComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: models,
                datasets: [{
                    label: 'Точность (%)',
                    data: accuracies,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const time = inferenceTimes[context.dataIndex];
                                return [
                                    `Точность: ${context.parsed.y}%`,
                                    `Время: ${time.toFixed(3)} сек`
                                ];
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
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: '#f3f4f6'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });

    } catch (error) {
        console.error('Error creating models comparison chart:', error);
    }
}

// Update technical details
function updateTechnicalDetails(forecast) {
    // Update technical metrics
    const mapeEl = document.getElementById('tech-mape');
    const rmseEl = document.getElementById('tech-rmse');
    const r2El = document.getElementById('tech-r2');
    const directionEl = document.getElementById('tech-direction');

    if (mapeEl && forecast && forecast.modelMetrics) {
        mapeEl.textContent = forecast.modelMetrics.mape ? `${forecast.modelMetrics.mape.toFixed(1)}%` : '--%';
    }

    if (rmseEl && forecast && forecast.modelMetrics) {
        rmseEl.textContent = forecast.modelMetrics.rmse ? forecast.modelMetrics.rmse.toFixed(2) : '--';
    }

    if (r2El && forecast && forecast.modelMetrics) {
        r2El.textContent = forecast.modelMetrics.r2 ? forecast.modelMetrics.r2.toFixed(3) : '--';
    }

    if (directionEl && forecast && forecast.modelMetrics) {
        directionEl.textContent = forecast.modelMetrics.directionAccuracy ? `${forecast.modelMetrics.directionAccuracy.toFixed(1)}%` : '--%';
    }
}

// Update analysis details
function updateAnalysisDetails(forecast, recommendations) {
    // Update overview tab elements
    const periodEl = document.getElementById('analysis-period');
    const modelEl = document.getElementById('analysis-model');
    const accuracyEl = document.getElementById('analysis-accuracy');
    const timeEl = document.getElementById('analysis-time');

    if (periodEl) {
        periodEl.textContent = `${currentPeriod} дней исторических данных`;
    }

    if (modelEl) {
        modelEl.textContent = currentModel === 'auto' ? 'Автовыбор' : currentModel;
    }

    if (accuracyEl && forecast && forecast.confidence) {
        accuracyEl.textContent = `${(forecast.confidence * 100).toFixed(1)}%`;
    }

    if (timeEl) {
        timeEl.textContent = '< 1 сек';
    }

    // Update technical tab
    updateTechnicalDetails(forecast);
}

// Show loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else {
        alert(message);
    }
    showLoading(false);
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple notification implementation
    console.log(`${type.toUpperCase()}: ${message}`);

    // You can implement a more sophisticated notification system here
    if (type === 'error') {
        alert(`Ошибка: ${message}`);
    }
}

// Update recommendations section
function updateRecommendations(recommendations) {
    // Update main recommendation
    const mainRecEl = document.getElementById('main-recommendation');
    if (mainRecEl && recommendations) {
        const action = recommendations.priceAction || recommendations.action || 'hold';
        const percentage = recommendations.percentage || 0;
        const confidence = recommendations.confidence || 0;

        let actionText = '';
        let actionIcon = '';

        switch (action.toLowerCase()) {
            case 'increase':
                actionText = `Увеличить цену на ${percentage}%`;
                actionIcon = '<i class="fas fa-arrow-up" style="color: #10b981;"></i>';
                break;
            case 'decrease':
                actionText = `Снизить цену на ${percentage}%`;
                actionIcon = '<i class="fas fa-arrow-down" style="color: #ef4444;"></i>';
                break;
            case 'hold':
            default:
                actionText = `Держать текущую цену`;
                actionIcon = '<i class="fas fa-pause" style="color: #f59e0b;"></i>';
                break;
        }

        const confidenceText = confidence > 0 ? ` (уверенность: ${(confidence * 100).toFixed(0)}%)` : '';

        mainRecEl.innerHTML = `
            <div class="rec-action">
                ${actionIcon}
                <span class="action-text">${actionText}${confidenceText}</span>
            </div>
            <div class="rec-reasoning">
                ${recommendations.reasoning || 'Рекомендация основана на анализе трендов и рыночных данных.'}
            </div>
        `;
    }

    // Update timeframe
    const timeframeEl = document.getElementById('timeframe-rec');
    if (timeframeEl) {
        timeframeEl.textContent = recommendations?.timeframe || 'Анализ данных...';
    }

    // Update impact
    const impactEl = document.getElementById('impact-rec');
    if (impactEl && recommendations) {
        const action = recommendations.priceAction || recommendations.action || 'hold';
        const percentage = recommendations.percentage || 0;

        let impactText = '';
        if (action === 'increase' && percentage > 0) {
            impactText = `Потенциальный рост прибыли на ${percentage * 0.7}%`;
        } else if (action === 'decrease' && percentage > 0) {
            impactText = `Снижение убытков на ${percentage * 0.5}%`;
        } else {
            impactText = 'Поддержание стабильной прибыли';
        }

        impactEl.textContent = impactText;
    }

    // Update risks
    const risksEl = document.getElementById('risks-rec');
    if (risksEl && recommendations) {
        const confidence = recommendations.confidence || 0;
        let riskText = '';

        if (confidence > 0.8) {
            riskText = 'Низкий риск: высокая уверенность в прогнозе';
        } else if (confidence > 0.6) {
            riskText = 'Средний риск: стабильные рыночные условия';
        } else {
            riskText = 'Высокий риск: волатильный рынок, требуется мониторинг';
        }

        risksEl.textContent = riskText;
    }
}

// Update analysis details
function updateAnalysisDetails(forecast) {
    const detailsEl = document.getElementById('analysisDetails');
    if (!detailsEl) return;

    let html = '<h3>Детальный анализ</h3>';

    if (forecast && forecast.confidence && !isNaN(forecast.confidence)) {
        html += `<p><strong>Уверенность модели:</strong> ${(forecast.confidence * 100).toFixed(1)}%</p>`;
    }

    html += `<p><strong>Период анализа:</strong> ${currentPeriod} дней</p>`;
    html += `<p><strong>Сценарий:</strong> ${currentScenario === 'positive' ? 'Позитивный' : currentScenario === 'negative' ? 'Негативный' : 'Нейтральный'}</p>`;
    html += `<p><strong>Модель:</strong> ${currentModel === 'auto' ? 'Автовыбор' : currentModel}</p>`;

    detailsEl.innerHTML = html;
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showNotification('Произошла ошибка в приложении', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('Ошибка асинхронной операции', 'error');
});

