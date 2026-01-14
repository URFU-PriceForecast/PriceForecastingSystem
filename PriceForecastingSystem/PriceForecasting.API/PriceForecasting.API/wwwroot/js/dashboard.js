// Dashboard functionality for PRICER Platform
document.addEventListener("DOMContentLoaded", () => {
    initializeDashboard();
});

function initializeDashboard() {
    updateStats();
    initializeNotifications();
    setupEventListeners();

    // Auto-refresh every 30 seconds
    setInterval(updateStats, 30000);
}

function updateStats() {
    const cards = JSON.parse(localStorage.getItem("cards")) || [];
    const totalProducts = cards.length;

    // Update stats
    document.getElementById("totalProducts").textContent = totalProducts;

    // Calculate active alerts (simulated)
    const activeAlerts = Math.floor(totalProducts * 0.6); // 60% товаров имеют рекомендации
    document.getElementById("activeAlerts").textContent = activeAlerts;

    // Show notification if there are alerts
    if (activeAlerts > 0) {
        showNotification(`У вас ${activeAlerts} активных рекомендаций по ценам`, "info");
    }
}

function initializeNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById("notifications")) {
        const notifications = document.createElement("div");
        notifications.id = "notifications";
        notifications.className = "notifications";
        document.body.appendChild(notifications);
    }
}

function showNotification(message, type = "info") {
    const notifications = document.getElementById("notifications");
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;

    const icon = type === "success" ? "check-circle" :
                type === "error" ? "exclamation-circle" :
                type === "warning" ? "exclamation-triangle" : "info-circle";

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    notifications.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);

    // Close button
    notification.querySelector(".notification-close").onclick = () => {
        notification.remove();
    };
}

function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            updateStats();
            showNotification("Данные обновлены", "success");

            // Animate refresh icon
            const icon = refreshBtn.querySelector("i");
            icon.style.animation = "spin 1s linear";
            setTimeout(() => {
                icon.style.animation = "";
            }, 1000);
        });
    }

    // Navigation
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove("active"));

            // Add active class to clicked link
            link.classList.add("active");

            const section = link.getAttribute("href").substring(1); // Remove #

            // Show different content based on section
            showSection(section);
        });
    });

    // Show section content
    function showSection(section) {
        // Hide all main content
        const mainContent = document.querySelector(".main-content");
        const originalContent = mainContent.innerHTML;

        if (section === "dashboard") {
            // Show original dashboard
            location.reload(); // Simple reload for now
        } else if (section === "analytics") {
            showAnalyticsSection();
        } else if (section === "settings") {
            showSettingsSection();
        }
    }

    function showAnalyticsSection() {
        const mainContent = document.querySelector(".main-content");
        mainContent.innerHTML = `
            <div class="analytics-section">
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> Расширенная аналитика</h2>
                </div>

                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h3><i class="fas fa-brain"></i> ML Модели</h3>
                        <div class="model-list">
                            <div class="model-item">
                                <span class="model-name">Linear Regression</span>
                                <span class="model-accuracy">87.3%</span>
                            </div>
                            <div class="model-item">
                                <span class="model-name">ARIMA</span>
                                <span class="model-accuracy">82.1%</span>
                            </div>
                            <div class="model-item">
                                <span class="model-name">Exponential Smoothing</span>
                                <span class="model-accuracy">79.8%</span>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3><i class="fas fa-chart-line"></i> Тренды рынка</h3>
                        <div class="trend-info">
                            <p>📈 Рост цен на электронику: +2.3%/месяц</p>
                            <p>📉 Снижение цен на аксессуары: -1.1%/месяц</p>
                            <p>🎯 Стабильные цены на бытовую технику</p>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3><i class="fas fa-coins"></i> ROI Анализ</h3>
                        <div class="roi-info">
                            <p>💰 Потенциальная экономия: <strong>625,000 ₽/месяц</strong></p>
                            <p>📊 Окупаемость подписки: <strong>1.4 месяца</strong></p>
                            <p>🎯 Рост маржинальности: <strong>+5.5%</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles for analytics section
        const style = document.createElement('style');
        style.textContent = `
            .analytics-section { padding: 2rem; max-width: 1200px; margin: 0 auto; }
            .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
            .analytics-card { background: var(--card-background); padding: 1.5rem; border-radius: 0.75rem; box-shadow: var(--shadow); }
            .analytics-card h3 { margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; }
            .model-list { display: flex; flex-direction: column; gap: 0.75rem; }
            .model-item { display: flex; justify-content: space-between; padding: 0.5rem; background: var(--background-color); border-radius: 0.375rem; }
            .model-name { font-weight: 500; }
            .model-accuracy { color: var(--success-color); font-weight: 600; }
            .trend-info p, .roi-info p { margin: 0.5rem 0; padding: 0.5rem; background: var(--background-color); border-radius: 0.375rem; }
            .roi-info strong { color: var(--success-color); }
        `;
        document.head.appendChild(style);
    }

    function showSettingsSection() {
        const mainContent = document.querySelector(".main-content");
        mainContent.innerHTML = `
            <div class="settings-section">
                <div class="section-header">
                    <h2><i class="fas fa-cog"></i> Настройки системы</h2>
                </div>

                <div class="settings-grid">
                    <div class="settings-card">
                        <h3><i class="fas fa-brain"></i> ML Настройки</h3>
                        <div class="setting-item">
                            <label>Автовыбор модели:</label>
                            <select id="modelSelection">
                                <option value="auto" selected>Автоматический</option>
                                <option value="linear">Linear Regression</option>
                                <option value="arima">ARIMA</option>
                                <option value="exponential">Exponential Smoothing</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Горизонт прогноза:</label>
                            <select id="forecastHorizon">
                                <option value="7">7 дней</option>
                                <option value="30" selected>30 дней</option>
                                <option value="90">90 дней</option>
                                <option value="365">1 год</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-card">
                        <h3><i class="fas fa-bell"></i> Уведомления</h3>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" checked> Новые рекомендации
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" checked> Изменения цен
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox"> Еженедельный отчет
                            </label>
                        </div>
                    </div>

                    <div class="settings-card">
                        <h3><i class="fas fa-database"></i> Данные</h3>
                        <button class="btn-secondary" onclick="clearAllData()">
                            <i class="fas fa-trash"></i> Очистить все товары
                        </button>
                        <button class="btn-primary" onclick="exportData()">
                            <i class="fas fa-download"></i> Экспорт данных
                        </button>
                        <button class="btn-secondary" onclick="importData()">
                            <i class="fas fa-upload"></i> Импорт данных
                        </button>
                    </div>
                </div>

                <div class="save-settings">
                    <button class="btn-primary" onclick="saveSettings()">
                        <i class="fas fa-save"></i> Сохранить настройки
                    </button>
                </div>
            </div>
        `;

        // Add styles for settings section
        const style = document.createElement('style');
        style.textContent = `
            .settings-section { padding: 2rem; max-width: 1200px; margin: 0 auto; }
            .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
            .settings-card { background: var(--card-background); padding: 1.5rem; border-radius: 0.75rem; box-shadow: var(--shadow); }
            .settings-card h3 { margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; }
            .setting-item { margin-bottom: 1rem; }
            .setting-item label { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; }
            .setting-item select { margin-left: auto; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 0.375rem; }
            .save-settings { margin-top: 2rem; text-align: center; }
            .save-settings .btn-primary { padding: 1rem 2rem; }
        `;
        document.head.appendChild(style);
    }

    // Category selector in modal
    const categoryBtns = document.querySelectorAll(".category-btn");
    categoryBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
}

// Utility functions for dashboard
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatPercentage(value) {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getTrendIcon(trend) {
    if (trend === 'up') return 'fas fa-arrow-up';
    if (trend === 'down') return 'fas fa-arrow-down';
    return 'fas fa-minus';
}

function getConfidenceColor(confidence) {
    if (confidence >= 80) return '#28a745';
    if (confidence >= 60) return '#ffc107';
    return '#dc3545';
}

// Settings functions
function saveSettings() {
    const modelSelection = document.getElementById('modelSelection')?.value || 'auto';
    const forecastHorizon = document.getElementById('forecastHorizon')?.value || '30';

    localStorage.setItem('pricer_ml_model', modelSelection);
    localStorage.setItem('pricer_forecast_horizon', forecastHorizon);

    showNotification('Настройки сохранены', 'success');
}

function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить все товары? Это действие нельзя отменить.')) {
        localStorage.removeItem('cards');
        location.reload();
        showNotification('Все данные удалены', 'warning');
    }
}

function exportData() {
    const cards = JSON.parse(localStorage.getItem('cards') || '[]');
    const data = {
        products: cards,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricer-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Данные экспортированы', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.products && Array.isArray(data.products)) {
                        localStorage.setItem('cards', JSON.stringify(data.products));
                        location.reload();
                        showNotification('Данные импортированы', 'success');
                    } else {
                        showNotification('Неверный формат файла', 'error');
                    }
                } catch (err) {
                    showNotification('Ошибка чтения файла', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Load settings on page load
function loadSettings() {
    const modelSelection = localStorage.getItem('pricer_ml_model') || 'auto';
    const forecastHorizon = localStorage.getItem('pricer_forecast_horizon') || '30';

    // Apply settings to UI if elements exist
    const modelSelect = document.getElementById('modelSelection');
    const horizonSelect = document.getElementById('forecastHorizon');

    if (modelSelect) modelSelect.value = modelSelection;
    if (horizonSelect) horizonSelect.value = forecastHorizon;
}

// Enhanced fetch with error handling
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});

// Export functions for use in other modules
window.DashboardUtils = {
    showNotification,
    formatCurrency,
    formatPercentage,
    getTrendIcon,
    getConfidenceColor,
    safeFetch,
    saveSettings,
    clearAllData,
    exportData,
    importData
};

