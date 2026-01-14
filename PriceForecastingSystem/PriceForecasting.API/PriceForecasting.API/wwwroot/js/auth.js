/**
 * PRICER Platform - Authentication Module (Demo Mode)
 * Авторизация отключена - все пользователи имеют доступ
 */

class AuthManager {
    constructor() {
        this.baseUrl = 'http://localhost:5229';
        this.token = 'demo-token-no-auth-required';
        this.user = { id: 1, email: 'demo@example.com', username: 'DemoUser' };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAuthUI();
    }

    setupEventListeners() {
        // Кнопки в хедере
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal());
        if (registerBtn) registerBtn.addEventListener('click', () => this.showRegisterModal());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

        // Модальные окна
        const closeLoginModal = document.getElementById('closeLoginModal');
        const closeRegisterModal = document.getElementById('closeRegisterModal');

        if (closeLoginModal) closeLoginModal.addEventListener('click', () => this.hideLoginModal());
        if (closeRegisterModal) closeRegisterModal.addEventListener('click', () => this.hideRegisterModal());

        // Переключение между формами
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToLogin = document.getElementById('switchToLogin');

        if (switchToRegister) switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideLoginModal();
            this.showRegisterModal();
        });

        if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideRegisterModal();
            this.showLoginModal();
        });

        // Формы
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Закрытие модальных окон по клику вне их
        document.addEventListener('click', (e) => {
            const loginModal = document.getElementById('loginModal');
            const registerModal = document.getElementById('registerModal');

            if (e.target === loginModal) this.hideLoginModal();
            if (e.target === registerModal) this.hideRegisterModal();
        });
    }

    // Управление отображением
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            // Фокус на email поле
            setTimeout(() => {
                const emailInput = document.getElementById('loginEmail');
                if (emailInput) emailInput.focus();
            }, 100);
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            // Очистка формы
            const form = document.getElementById('loginForm');
            if (form) form.reset();
        }
    }

    showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'flex';
            // Фокус на email поле
            setTimeout(() => {
                const emailInput = document.getElementById('registerEmail');
                if (emailInput) emailInput.focus();
            }, 100);
        }
    }

    hideRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'none';
            // Очистка формы
            const form = document.getElementById('registerForm');
            if (form) form.reset();
        }
    }

    // Управление UI аутентификации
    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');

        if (this.isAuthenticated()) {
            // Показать информацию о пользователе
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userEmail && this.user) userEmail.textContent = this.user.email;
        } else {
            // Показать кнопки входа/регистрации
            if (authButtons) authButtons.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    // Проверка статуса аутентификации (всегда авторизован в демо-режиме)
    checkAuthStatus() {
        // В демо-режиме всегда авторизован
        this.updateAuthUI();
    }

    isAuthenticated() {
        // В демо-режиме всегда возвращаем true
        return true;
    }

    // Обработка форм (в демо-режиме просто показываем уведомление)
    async handleLogin(e) {
        e.preventDefault();
        this.hideLoginModal();
        this.showNotification('Демо-режим: вход выполнен автоматически', 'success');
        this.updateAuthUI();
    }

    async handleRegister(e) {
        e.preventDefault();
        this.hideRegisterModal();
        this.showNotification('Демо-режим: регистрация не требуется', 'info');
    }

    logout() {
        // В демо-режиме выход не требуется
        this.showNotification('Демо-режим: выход недоступен', 'info');
    }

    // Вспомогательные методы
    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showLoading(show) {
        // Используем существующую систему загрузки
        if (window.showLoading) {
            window.showLoading(show);
        }
    }

    // Метод для получения заголовков (в демо-режиме авторизация не требуется)
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    // Метод для выполнения запросов (в демо-режиме все запросы разрешены)
    async authenticatedFetch(url, options = {}) {
        const defaultOptions = {
            headers: this.getAuthHeaders(),
            ...options
        };

        return fetch(url, defaultOptions);
    }
}

// Глобальный экземпляр менеджера аутентификации
const authManager = new AuthManager();

// Экспорт для использования в других модулях
window.authManager = authManager;