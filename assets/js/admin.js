// Admin Panel JavaScript
// TechMinds Academy Afterschool Admin Dashboard

class AdminLogin {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.messagesContainer = document.getElementById('login-messages');
        
        this.isSubmitting = false;
        this.maxAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
        this.setupPasswordToggle();
        this.setupModal();
        this.loadSecurityFeatures();
    }
    
    setupEventListeners() {
        // Form submission
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Real-time validation
        this.usernameInput?.addEventListener('input', () => {
            this.clearErrors();
            this.validateUsername();
        });
        
        this.passwordInput?.addEventListener('input', () => {
            this.clearErrors();
            this.validatePassword();
        });
        
        // Enter key handling
        [this.usernameInput, this.passwordInput].forEach(input => {
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isSubmitting) {
                    this.handleLogin();
                }
            });
        });
        
        // Security monitoring
        this.setupSecurityMonitoring();
    }
    
    setupPasswordToggle() {
        const passwordToggle = document.getElementById('passwordToggle');
        if (!passwordToggle || !this.passwordInput) return;
        
        passwordToggle.addEventListener('click', () => {
            const isPassword = this.passwordInput.type === 'password';
            this.passwordInput.type = isPassword ? 'text' : 'password';
            
            const icon = passwordToggle.querySelector('i');
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            
            // Security: Hide password after 3 seconds if shown
            if (isPassword) {
                setTimeout(() => {
                    if (this.passwordInput.type === 'text') {
                        this.passwordInput.type = 'password';
                        icon.className = 'fas fa-eye';
                    }
                }, 3000);
            }
        });
    }
    
    setupModal() {
        const modal = document.getElementById('forgotPasswordModal');
        const forgotPasswordLink = document.getElementById('forgotPassword');
        const modalClose = document.getElementById('modalClose');
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        
        const showModal = () => {
            modal?.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };
        
        const hideModal = () => {
            modal?.classList.add('hidden');
            document.body.style.overflow = '';
        };
        
        forgotPasswordLink?.addEventListener('click', (e) => {
            e.preventDefault();
            showModal();
        });
        
        modalClose?.addEventListener('click', hideModal);
        modalCloseBtn?.addEventListener('click', hideModal);
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
        
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
                hideModal();
            }
        });
    }
    
    setupSecurityMonitoring() {
        // Monitor for suspicious activity
        let suspiciousActivity = 0;
        
        // Track rapid form submissions
        let lastSubmission = 0;
        const minSubmissionInterval = 2000; // 2 seconds
        
        this.form?.addEventListener('submit', () => {
            const now = Date.now();
            if (now - lastSubmission < minSubmissionInterval) {
                suspiciousActivity++;
                if (suspiciousActivity > 3) {
                    this.handleSuspiciousActivity();
                }
            }
            lastSubmission = now;
        });
        
        // Monitor for automated scripts
        let humanInteraction = false;
        
        ['mousemove', 'click', 'keydown'].forEach(event => {
            document.addEventListener(event, () => {
                humanInteraction = true;
            }, { once: true });
        });
        
        // Check for human interaction before allowing login
        this.form?.addEventListener('submit', (e) => {
            if (!humanInteraction) {
                e.preventDefault();
                this.showMessage('Activitate suspectă detectată. Vă rugăm să reîncărcați pagina.', 'error');
            }
        });
    }
    
    handleSuspiciousActivity() {
        this.showMessage('Activitate suspectă detectată. Accesul a fost temporar blocat.', 'error');
        this.disableForm(30000); // 30 seconds
        
        // Log security event
        this.logSecurityEvent('suspicious_activity', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'client-side-detection'
        });
    }
    
    checkLoginStatus() {
        const token = localStorage.getItem('admin_token');
        const tokenExpiry = localStorage.getItem('admin_token_expiry');
        
        if (token && tokenExpiry) {
            const now = Date.now();
            if (now < parseInt(tokenExpiry)) {
                // Valid token exists, redirect to dashboard
                window.location.href = 'dashboard.html';
                return;
            } else {
                // Token expired, clear it
                this.clearSession();
            }
        }
        
        // Check for remember me
        const rememberMe = localStorage.getItem('admin_remember_me');
        if (rememberMe) {
            this.usernameInput.value = rememberMe;
            document.getElementById('remember_me').checked = true;
        }
    }
    
    loadSecurityFeatures() {
        // Implement additional security checks
        this.checkBrowserSecurity();
        this.setupCSRFProtection();
        this.monitorNetworkConditions();
    }
    
    checkBrowserSecurity() {
        const securityChecks = {
            https: location.protocol === 'https:',
            localStorage: typeof Storage !== 'undefined',
            console: this.detectDevTools(),
            javascript: true // Obviously true if this runs
        };
        
        if (!securityChecks.https && location.hostname !== 'localhost') {
            this.showMessage('Conexiune nesigură detectată. Folosiți HTTPS pentru securitate.', 'warning');
        }
        
        if (!securityChecks.localStorage) {
            this.showMessage('LocalStorage indisponibil. Funcționalitatea poate fi limitată.', 'warning');
        }
    }
    
    detectDevTools() {
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.warn('🔒 TechMinds Academy Admin Panel - Unauthorized access monitoring active');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
        
        return devtools;
    }
    
    setupCSRFProtection() {
        // Get CSRF token from meta tag or generate one
        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        if (!csrfToken) {
            csrfToken = this.generateCSRFToken();
        }
        
        this.csrfToken = csrfToken;
    }
    
    generateCSRFToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    monitorNetworkConditions() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.showMessage('Conexiune lentă detectată. Încărcarea poate dura mai mult.', 'warning');
            }
            
            connection.addEventListener('change', () => {
                if (connection.effectiveType === 'slow-2g') {
                    this.showMessage('Conexiunea s-a deteriorat. Verificați rețeaua.', 'warning');
                }
            });
        }
    }
    
    validateUsername() {
        const username = this.usernameInput.value.trim();
        
        if (username.length === 0) return false;
        
        if (username.length < 3) {
            this.setFieldError(this.usernameInput, 'Username-ul trebuie să aibă cel puțin 3 caractere');
            return false;
        }
        
        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            this.setFieldError(this.usernameInput, 'Username-ul conține caractere nevalide');
            return false;
        }
        
        this.clearFieldError(this.usernameInput);
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        
        if (password.length === 0) return false;
        
        if (password.length < 6) {
            this.setFieldError(this.passwordInput, 'Parola trebuie să aibă cel puțin 6 caractere');
            return false;
        }
        
        this.clearFieldError(this.passwordInput);
        return true;
    }
    
    setFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: var(--error-color);
            font-size: 0.875rem;
            margin-top: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        `;
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        field.parentElement.appendChild(errorElement);
    }
    
    clearFieldError(field) {
        field.classList.remove('error', 'success');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    clearErrors() {
        this.messagesContainer?.classList.add('hidden');
        
        [this.usernameInput, this.passwordInput].forEach(input => {
            if (input) {
                this.clearFieldError(input);
            }
        });
    }
    
    showMessage(message, type = 'error') {
        if (!this.messagesContainer) return;
        
        this.messagesContainer.textContent = message;
        this.messagesContainer.className = `form-messages ${type}`;
        this.messagesContainer.classList.remove('hidden');
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.messagesContainer.classList.add('hidden');
            }, 5000);
        }
        
        // Scroll to message
        this.messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    setLoadingState(loading) {
        this.isSubmitting = loading;
        
        if (this.loginBtn) {
            this.loginBtn.disabled = loading;
            
            const btnText = this.loginBtn.querySelector('.btn-text');
            const btnLoader = this.loginBtn.querySelector('.btn-loader');
            
            if (loading) {
                this.loginBtn.classList.add('loading');
                btnText?.classList.add('hidden');
                btnLoader?.classList.remove('hidden');
            } else {
                this.loginBtn.classList.remove('loading');
                btnText?.classList.remove('hidden');
                btnLoader?.classList.add('hidden');
            }
        }
        
        // Disable form inputs
        [this.usernameInput, this.passwordInput].forEach(input => {
            if (input) {
                input.disabled = loading;
            }
        });
    }
    
    disableForm(duration) {
        this.setLoadingState(true);
        
        setTimeout(() => {
            this.setLoadingState(false);
        }, duration);
    }
    
    async handleLogin() {
        if (this.isSubmitting) return;
        
        this.clearErrors();
        
        // Check lockout
        if (this.isLockedOut()) {
            const remaining = this.getRemainingLockoutTime();
            this.showMessage(`Cont blocat. Încercați din nou în ${Math.ceil(remaining / 60000)} minute.`, 'error');
            return;
        }
        
        // Validate inputs
        const isUsernameValid = this.validateUsername();
        const isPasswordValid = this.validatePassword();
        
        if (!isUsernameValid || !isPasswordValid) {
            this.showMessage('Vă rugăm să corectați erorile și să încercați din nou.', 'error');
            return;
        }
        
        this.setLoadingState(true);
        
        try {
            const loginData = {
                username: this.usernameInput.value.trim(),
                password: this.passwordInput.value,
                remember_me: document.getElementById('remember_me')?.checked || false,
                csrf_token: this.csrfToken,
                timestamp: Date.now(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`
            };
            
            const response = await fetch('../backend/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(loginData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.handleLoginSuccess(result);
            } else {
                this.handleLoginError(result);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Eroare de conexiune. Verificați internetul și încercați din nou.', 'error');
            this.incrementFailedAttempts();
        } finally {
            this.setLoadingState(false);
        }
    }
    
    handleLoginSuccess(result) {
        this.showMessage('Autentificare reușită! Redirecționare...', 'success');
        
        // Store authentication data
        if (result.token) {
            localStorage.setItem('admin_token', result.token);
            localStorage.setItem('admin_token_expiry', (Date.now() + (2 * 60 * 60 * 1000)).toString()); // 2 hours
            localStorage.setItem('admin_user', JSON.stringify(result.user));
        }
        
        // Handle remember me
        if (document.getElementById('remember_me')?.checked) {
            localStorage.setItem('admin_remember_me', this.usernameInput.value.trim());
        } else {
            localStorage.removeItem('admin_remember_me');
        }
        
        // Clear failed attempts
        this.clearFailedAttempts();
        
        // Log successful login
        this.logSecurityEvent('login_success', {
            username: this.usernameInput.value.trim(),
            timestamp: new Date().toISOString()
        });
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = result.redirect || 'dashboard.html';
        }, 1500);
    }
    
    handleLoginError(result) {
        let message = result.message || 'Autentificare eșuată. Verificați datele și încercați din nou.';
        
        if (result.error_code) {
            switch (result.error_code) {
                case 'INVALID_CREDENTIALS':
                    message = 'Username sau parolă incorectă.';
                    break;
                case 'ACCOUNT_LOCKED':
                    message = 'Contul este blocat. Contactați administratorul.';
                    break;
                case 'TOO_MANY_ATTEMPTS':
                    message = 'Prea multe încercări eșuate. Încercați din nou mai târziu.';
                    break;
                case 'INVALID_TOKEN':
                    message = 'Sesiunea a expirat. Reîncărcați pagina.';
                    break;
            }
        }
        
        this.showMessage(message, 'error');
        
        // Increment failed attempts
        this.incrementFailedAttempts();
        
        // Clear password field for security
        this.passwordInput.value = '';
        
        // Focus username field
        this.usernameInput.focus();
        
        // Log failed attempt
        this.logSecurityEvent('login_failed', {
            username: this.usernameInput.value.trim(),
            error_code: result.error_code,
            timestamp: new Date().toISOString()
        });
    }
    
    incrementFailedAttempts() {
        const attempts = this.getFailedAttempts() + 1;
        localStorage.setItem('admin_failed_attempts', attempts.toString());
        localStorage.setItem('admin_last_failed_attempt', Date.now().toString());
        
        if (attempts >= this.maxAttempts) {
            localStorage.setItem('admin_lockout_until', (Date.now() + this.lockoutTime).toString());
            this.showMessage(`Prea multe încercări eșuate. Contul este blocat pentru ${this.lockoutTime / 60000} minute.`, 'error');
        } else {
            const remaining = this.maxAttempts - attempts;
            this.showMessage(`Încercare eșuată. Mai aveți ${remaining} încercări.`, 'warning');
        }
    }
    
    getFailedAttempts() {
        return parseInt(localStorage.getItem('admin_failed_attempts') || '0');
    }
    
    clearFailedAttempts() {
        localStorage.removeItem('admin_failed_attempts');
        localStorage.removeItem('admin_last_failed_attempt');
        localStorage.removeItem('admin_lockout_until');
    }
    
    isLockedOut() {
        const lockoutUntil = localStorage.getItem('admin_lockout_until');
        if (!lockoutUntil) return false;
        
        return Date.now() < parseInt(lockoutUntil);
    }
    
    getRemainingLockoutTime() {
        const lockoutUntil = localStorage.getItem('admin_lockout_until');
        if (!lockoutUntil) return 0;
        
        return Math.max(0, parseInt(lockoutUntil) - Date.now());
    }
    
    clearSession() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expiry');
        localStorage.removeItem('admin_user');
    }
    
    logSecurityEvent(event, data) {
        // Log security events for monitoring
        const logEntry = {
            event,
            data,
            timestamp: new Date().toISOString(),
            session_id: this.getSessionId()
        };
        
        // Store in localStorage for now (in production, send to server)
        const logs = JSON.parse(localStorage.getItem('admin_security_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('admin_security_logs', JSON.stringify(logs));
        
        console.log('Security Event:', logEntry);
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('admin_session_id');
        if (!sessionId) {
            sessionId = this.generateSessionId();
            sessionStorage.setItem('admin_session_id', sessionId);
        }
        return sessionId;
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Dashboard functionality
class AdminDashboard {
    constructor() {
        this.token = localStorage.getItem('admin_token');
        this.user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        this.init();
    }
    
    init() {
        this.checkAuthentication();
        this.setupNavigation();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.setupLogout();
    }
    
    checkAuthentication() {
        const tokenExpiry = localStorage.getItem('admin_token_expiry');
        
        if (!this.token || !tokenExpiry) {
            this.redirectToLogin();
            return;
        }
        
        if (Date.now() >= parseInt(tokenExpiry)) {
            this.showTokenExpiredMessage();
            this.redirectToLogin();
            return;
        }
        
        // Extend token if close to expiry (within 30 minutes)
        if (Date.now() >= parseInt(tokenExpiry) - (30 * 60 * 1000)) {
            this.refreshToken();
        }
    }
    
    setupNavigation() {
        // Setup sidebar navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('data-page');
                this.loadPage(target);
            });
        });
        
        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        menuToggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('mobile-open');
        });
    }
    
    async loadDashboardData() {
        try {
            const response = await this.apiCall('/backend/admin_functions.php', {
                action: 'get_dashboard_data'
            });
            
            if (response.success) {
                this.updateDashboardStats(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    updateDashboardStats(data) {
        // Update statistics cards
        const stats = {
            'total-registrations': data.total_preinscrieri || 0,
            'pending-registrations': data.pending_preinscrieri || 0,
            'confirmed-registrations': data.confirmed_preinscrieri || 0,
            'rejected-registrations': data.rejected_preinscrieri || 0
        };
        
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateCounter(element, value);
            }
        });
    }
    
    animateCounter(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const increment = (targetValue - startValue) / (duration / 16);
        let currentValue = startValue;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if ((increment > 0 && currentValue >= targetValue) || 
                (increment < 0 && currentValue <= targetValue)) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue);
        }, 16);
    }
    
    setupAutoRefresh() {
        // Refresh dashboard data every 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }
    
    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }
    
    async logout() {
        try {
            await this.apiCall('/backend/auth.php', {
                action: 'logout',
                token: this.token
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
            this.redirectToLogin();
        }
    }
    
    async refreshToken() {
        try {
            const response = await this.apiCall('/backend/auth.php', {
                action: 'refresh_token',
                token: this.token
            });
            
            if (response.success && response.token) {
                localStorage.setItem('admin_token', response.token);
                localStorage.setItem('admin_token_expiry', (Date.now() + (2 * 60 * 60 * 1000)).toString());
                this.token = response.token;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
        }
    }
    
    async apiCall(endpoint, data) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    clearSession() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expiry');
        localStorage.removeItem('admin_user');
    }
    
    redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    showTokenExpiredMessage() {
        // Show a notification that the session expired
        console.log('Session expired, redirecting to login...');
    }
    
    loadPage(page) {
        // Load different admin pages
        console.log(`Loading page: ${page}`);
        // Implementation depends on your routing strategy
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatPhoneNumber(phone) {
    // Format Romanian phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('07')) {
        return `${cleaned.substr(0, 4)} ${cleaned.substr(4, 3)} ${cleaned.substr(7, 3)}`;
    }
    return phone;
}

function generateCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + data.map(row => row.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginForm')) {
        // Login page
        window.adminLogin = new AdminLogin();
    } else if (document.querySelector('.dashboard-container')) {
        // Dashboard page
        window.adminDashboard = new AdminDashboard();
    }
    
    console.log('Admin scripts initialized');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminLogin, AdminDashboard };
}