// Form Validation and Submission Handler
// TechMinds Academy Afterschool Registration

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
        this.isSubmitting = false;
        
        this.init();
    }
    
    init() {
        if (!this.form) {
            console.error('Form not found!');
            return;
        }
        
        this.setupEventListeners();
        this.setupRealTimeValidation();
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Phone number formatting
        const phoneInput = document.getElementById('telefon_parinte');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.formatPhoneNumber.bind(this));
        }
        
        // Real-time validation on blur
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                // Clear error when user starts typing
                this.clearFieldError(input.name);
            });
        });
        
        // GDPR checkbox requirement
        const gdprCheckbox = document.getElementById('acord_gdpr');
        if (gdprCheckbox) {
            gdprCheckbox.addEventListener('change', () => {
                this.validateField(gdprCheckbox);
            });
        }
    }
    
    setupRealTimeValidation() {
        // Email validation
        const emailInput = document.getElementById('email_parinte');
        if (emailInput) {
            emailInput.addEventListener('input', this.debounce(() => {
                this.validateEmail(emailInput.value, 'email_parinte');
            }, 500));
        }
        
        // Phone validation
        const phoneInput = document.getElementById('telefon_parinte');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.debounce(() => {
                this.validatePhone(phoneInput.value, 'telefon_parinte');
            }, 500));
        }
    }
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Format phone number as user types
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Romanian phone format: 07XX XXX XXX
        if (value.length > 0) {
            if (value.length <= 4) {
                value = value.replace(/(\d{4})/, '$1');
            } else if (value.length <= 7) {
                value = value.replace(/(\d{4})(\d{3})/, '$1 $2');
            } else {
                value = value.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
            }
        }
        
        e.target.value = value;
    }
    
    // Field validation
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        
        // Clear previous errors
        this.clearFieldError(fieldName);
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            this.setFieldError(fieldName, 'Acest câmp este obligatoriu');
            return false;
        }
        
        // Specific validations
        switch (fieldName) {
            case 'nume_parinte':
            case 'prenume_parinte':
                return this.validateName(value, fieldName);
                
            case 'telefon_parinte':
                return this.validatePhone(value, fieldName);
                
            case 'email_parinte':
                return this.validateEmail(value, fieldName);
                
            case 'nume_copil':
                return this.validateChildName(value, fieldName);
                
            case 'varsta_copil':
                return this.validateAge(value, fieldName);
                
            case 'clasa_copil':
                return this.validateClass(value, fieldName);
                
            case 'scoala_copil':
                return this.validateSchool(value, fieldName);
                
            case 'acord_gdpr':
                return this.validateGDPR(field.checked, fieldName);
        }
        
        return true;
    }
    
    // Name validation
    validateName(value, fieldName) {
        if (!value) return false;
        
        if (value.length < 2) {
            this.setFieldError(fieldName, 'Numele trebuie să aibă cel puțin 2 caractere');
            return false;
        }
        
        if (!/^[a-zA-ZăîâșțĂÎÂȘȚ\s\-']+$/.test(value)) {
            this.setFieldError(fieldName, 'Numele poate conține doar litere, spații și cratimă');
            return false;
        }
        
        return true;
    }
    
    // Phone validation
    validatePhone(value, fieldName) {
        if (!value) return false;
        
        // Remove spaces and formatting
        const cleanPhone = value.replace(/\s/g, '');
        
        // Romanian phone patterns
        const phonePatterns = [
            /^07[0-9]{8}$/,  // 07XXXXXXXX
            /^02[0-9]{7}$/,  // 02XXXXXXX (București)
            /^03[0-9]{8}$/,  // 03XXXXXXXX (alte județe)
            /^\+407[0-9]{8}$/, // +407XXXXXXXX
            /^00407[0-9]{8}$/ // 00407XXXXXXXX
        ];
        
        const isValid = phonePatterns.some(pattern => pattern.test(cleanPhone));
        
        if (!isValid) {
            this.setFieldError(fieldName, 'Introduceți un număr de telefon valid (ex: 0745 123 456)');
            return false;
        }
        
        return true;
    }
    
    // Email validation
    validateEmail(value, fieldName) {
        if (!value) return false;
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        if (!emailRegex.test(value)) {
            this.setFieldError(fieldName, 'Introduceți o adresă de email validă');
            return false;
        }
        
        // Check for common typos
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const domain = value.split('@')[1];
        
        if (domain && !commonDomains.includes(domain) && domain.includes('.')) {
            // Could add suggestions here
        }
        
        return true;
    }
    
    // Child name validation
    validateChildName(value, fieldName) {
        if (!value) return false;
        
        if (value.length < 3) {
            this.setFieldError(fieldName, 'Numele copilului trebuie să aibă cel puțin 3 caractere');
            return false;
        }
        
        if (!/^[a-zA-ZăîâșțĂÎÂȘȚ\s\-']+$/.test(value)) {
            this.setFieldError(fieldName, 'Numele poate conține doar litere, spații și cratimă');
            return false;
        }
        
        // Check if it contains both first and last name
        const nameParts = value.trim().split(/\s+/);
        if (nameParts.length < 2) {
            this.setFieldError(fieldName, 'Introduceți numele complet (nume și prenume)');
            return false;
        }
        
        return true;
    }
    
    // Age validation
    validateAge(value, fieldName) {
        if (!value) return false;
        
        const age = parseInt(value);
        if (age < 6 || age > 18) {
            this.setFieldError(fieldName, 'Vârsta trebuie să fie între 6 și 18 ani');
            return false;
        }
        
        return true;
    }
    
    // Class validation
    validateClass(value, fieldName) {
        if (!value) return false;
        
        const validClasses = ['Pregătitoare', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        
        if (!validClasses.includes(value)) {
            this.setFieldError(fieldName, 'Selectați o clasă validă');
            return false;
        }
        
        return true;
    }
    
    // School validation
    validateSchool(value, fieldName) {
        if (!value) return false;
        
        if (value.length < 3) {
            this.setFieldError(fieldName, 'Numele școlii trebuie să aibă cel puțin 3 caractere');
            return false;
        }
        
        return true;
    }
    
    // GDPR validation
    validateGDPR(checked, fieldName) {
        if (!checked) {
            this.setFieldError(fieldName, 'Trebuie să acceptați politica de confidențialitate');
            return false;
        }
        
        return true;
    }
    
    // Set field error
    setFieldError(fieldName, message) {
        this.errors[fieldName] = message;
        
        const errorElement = document.getElementById(`error_${fieldName}`);
        const fieldElement = document.querySelector(`[name="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        if (fieldElement) {
            fieldElement.classList.add('error');
        }
    }
    
    // Clear field error
    clearFieldError(fieldName) {
        delete this.errors[fieldName];
        
        const errorElement = document.getElementById(`error_${fieldName}`);
        const fieldElement = document.querySelector(`[name="${fieldName}"]`);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
        
        if (fieldElement) {
            fieldElement.classList.remove('error');
        }
    }
    
    // Clear all errors
    clearAllErrors() {
        this.errors = {};
        
        const errorElements = this.form.querySelectorAll('.form-error');
        const fieldElements = this.form.querySelectorAll('.error');
        
        errorElements.forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        
        fieldElements.forEach(el => {
            el.classList.remove('error');
        });
    }
    
    // Validate entire form
    validateForm() {
        this.clearAllErrors();
        
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Validate non-required fields that have values
        const optionalFields = this.form.querySelectorAll('input:not([required]), select:not([required]), textarea:not([required])');
        optionalFields.forEach(field => {
            if (field.value.trim()) {
                this.validateField(field);
            }
        });
        
        return isValid && Object.keys(this.errors).length === 0;
    }
    
    // Collect form data
    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Handle regular fields
        for (let [key, value] of formData.entries()) {
            if (key.endsWith('[]')) {
                // Handle checkbox arrays
                const arrayKey = key.slice(0, -2);
                if (!data[arrayKey]) {
                    data[arrayKey] = [];
                }
                data[arrayKey].push(value);
            } else {
                data[key] = value;
            }
        }
        
        // Handle checkboxes that might not be checked
        const checkboxes = this.form.querySelectorAll('input[type="checkbox"]:not([name$="[]"])');
        checkboxes.forEach(checkbox => {
            if (!data.hasOwnProperty(checkbox.name)) {
                data[checkbox.name] = checkbox.checked ? '1' : '0';
            }
        });
        
        // Add timestamp
        data.timestamp = new Date().toISOString();
        
        return data;
    }
    
    // Show loading state
    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const submitBtn = this.form.querySelector('.submit-btn');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Se trimite...</span>';
        }
        
        this.isSubmitting = true;
    }
    
    // Hide loading state
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const submitBtn = this.form.querySelector('.submit-btn');
        
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Trimite Preînregistrarea</span>';
        }
        
        this.isSubmitting = false;
    }
    
    // Show message
    showMessage(message, type = 'success') {
        const messagesContainer = document.getElementById('form-messages');
        
        if (messagesContainer) {
            messagesContainer.textContent = message;
            messagesContainer.className = `form-messages ${type}`;
            messagesContainer.classList.remove('hidden');
            
            // Scroll to message
            messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Auto-hide success messages after 10 seconds
            if (type === 'success') {
                setTimeout(() => {
                    messagesContainer.classList.add('hidden');
                }, 10000);
            }
        }
    }
    
    // Handle form submission
    async handleSubmit() {
        if (this.isSubmitting) return;
        
        // Validate form
        if (!this.validateForm()) {
            this.showMessage('Vă rugăm să corectați erorile de mai jos și să încercați din nou.', 'error');
            
            // Scroll to first error
            const firstError = this.form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            
            return;
        }
        
        // Collect data
        const formData = this.collectFormData();
        
        // Show loading
        this.showLoading();
        
        try {
            // Submit to server
            const response = await fetch('backend/submit.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.handleSuccess(result);
            } else {
                this.handleError(result);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.handleError({
                message: 'A apărut o eroare la trimiterea formularului. Vă rugăm să încercați din nou.',
                error: error.message
            });
        } finally {
            this.hideLoading();
        }
    }
    
    // Handle successful submission
    handleSuccess(result) {
        this.showMessage(
            result.message || 'Preînregistrarea a fost trimisă cu succes! Vă vom contacta în cel mai scurt timp.',
            'success'
        );
        
        // Reset form
        this.form.reset();
        this.clearAllErrors();
        
        // Optional: redirect after delay
        setTimeout(() => {
            if (result.redirect) {
                window.location.href = result.redirect;
            }
        }, 3000);
        
        // Google Analytics / Facebook Pixel tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                event_category: 'engagement',
                event_label: 'afterschool_preregistration'
            });
        }
        
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_name: 'Afterschool Preregistration',
                content_category: 'Education'
            });
        }
    }
    
    // Handle submission error
    handleError(result) {
        let message = 'A apărut o eroare la trimiterea formularului.';
        
        if (result.message) {
            message = result.message;
        }
        
        if (result.errors && typeof result.errors === 'object') {
            // Show field-specific errors
            Object.keys(result.errors).forEach(fieldName => {
                this.setFieldError(fieldName, result.errors[fieldName]);
            });
            
            message += ' Vă rugăm să corectați erorile și să încercați din nou.';
        }
        
        this.showMessage(message, 'error');
    }
}

// Form Analytics and Tracking
class FormAnalytics {
    constructor() {
        this.startTime = Date.now();
        this.interactions = [];
        this.setupTracking();
    }
    
    setupTracking() {
        // Track form field interactions
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('focus', () => {
                this.trackInteraction('field_focus', field.name);
            });
            
            field.addEventListener('blur', () => {
                this.trackInteraction('field_blur', field.name);
            });
        });
        
        // Track form abandonment
        window.addEventListener('beforeunload', () => {
            if (this.interactions.length > 0) {
                this.trackInteraction('form_abandon');
            }
        });
    }
    
    trackInteraction(type, field = null) {
        this.interactions.push({
            type,
            field,
            timestamp: Date.now() - this.startTime
        });
    }
}

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form validator
    const validator = new FormValidator('preregistrationForm');
    
    // Initialize analytics
    const analytics = new FormAnalytics();
    
    // Mobile menu toggle (if exists)
    const menuButton = document.querySelector('.menu-button');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuButton && navLinks) {
        menuButton.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Auto-resize textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });
    
    console.log('Form validation initialized successfully');
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, FormAnalytics };
}