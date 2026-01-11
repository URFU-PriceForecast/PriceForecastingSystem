/**
 * PRICER Platform - Authentication Module
 * Обработка входа, регистрации и управления сессиями
 */

class AuthManager {
    constructor() {
        this.baseUrl = 'http://localhost:5229';
        this.token = null;
        this.user = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
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

    // Проверка статуса аутентификации
    checkAuthStatus() {
        const token = localStorage.getItem('pricer_token');
        const user = localStorage.getItem('pricer_user');

        if (token && user) {
            this.token = token;
            this.user = JSON.parse(user);
            this.updateAuthUI();
        } else {
            this.updateAuthUI();
        }
    }

    isAuthenticated() {
        return this.token !== null && this.user !== null;
    }

    // Обработка форм
    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch(`${this.baseUrl}/Auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Сохраняем токен и данные пользователя
                this.token = data.token;
                this.user = {
                    id: data.userId,
                    email: data.email,
                    username: data.username
                };

                // Сохраняем в localStorage
                localStorage.setItem('pricer_token', this.token);
                localStorage.setItem('pricer_user', JSON.stringify(this.user));

                this.updateAuthUI();
                this.hideLoginModal();
                this.showNotification('Вход выполнен успешно!', 'success');

                // Перезагрузка страницы для обновления данных
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.showNotification(data.message || 'Ошибка входа', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Ошибка сети. Попробуйте позже.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!email || !password || !confirmPassword) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        try {
            this.showLoading(true);

            const response = await fetch(`${this.baseUrl}/Auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.hideRegisterModal();
                this.showNotification('Регистрация успешна! Теперь войдите в систему.', 'success');

                // Показать форму входа через 2 секунды
                setTimeout(() => this.showLoginModal(), 2000);
            } else {
                this.showNotification(data.message || 'Ошибка регистрации', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showNotification('Ошибка сети. Попробуйте позже.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        // Очистка данных
        this.token = null;
        this.user = null;

        // Очистка localStorage
        localStorage.removeItem('pricer_token');
        localStorage.removeItem('pricer_user');

        this.updateAuthUI();
        this.showNotification('Вы вышли из системы', 'info');

        // Перезагрузка страницы
        setTimeout(() => window.location.reload(), 500);
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

    // Метод для получения заголовков с авторизацией
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Метод для выполнения авторизованных запросов
    async authenticatedFetch(url, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Пользователь не авторизован');
        }

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