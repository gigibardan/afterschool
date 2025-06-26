// Dashboard JavaScript
// TechMinds Academy Afterschool Admin Dashboard

class DashboardManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.token = localStorage.getItem('admin_token');
        this.user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        
        this.charts = {};
        this.data = {
            registrations: [],
            stats: {},
            activities: []
        };
        
        this.filters = {
            status: '',
            age: '',
            dateFrom: '',
            dateTo: ''
        };
        
        this.pagination = {
            currentPage: 1,
            perPage: 10,
            total: 0
        };
        
        this.init();
    }
    
    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.setupCharts();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.setupNotifications();
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
        
        // Update user info in sidebar
        this.updateUserInfo();
        
        // Extend token if close to expiry
        if (Date.now() >= parseInt(tokenExpiry) - (30 * 60 * 1000)) {
            this.refreshToken();
        }
    }
    
updateUserInfo() {
       const userNameElements = document.querySelectorAll('#userName, #userNameSmall');
       userNameElements.forEach(element => {
           element.textContent = this.user.nume_complet || this.user.username || 'Admin';
       });
   }
   
   setupEventListeners() {
       // Sidebar navigation
       document.querySelectorAll('.nav-item').forEach(item => {
           item.addEventListener('click', (e) => {
               e.preventDefault();
               const page = item.getAttribute('data-page');
               this.switchPage(page);
           });
       });
       
       // Mobile menu toggle
       const mobileMenuBtn = document.getElementById('mobileMenuBtn');
       const sidebar = document.getElementById('sidebar');
       
       mobileMenuBtn?.addEventListener('click', () => {
           sidebar.classList.toggle('mobile-open');
       });
       
       // Close sidebar when clicking outside on mobile
       document.addEventListener('click', (e) => {
           if (window.innerWidth <= 768) {
               if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                   sidebar.classList.remove('mobile-open');
               }
           }
       });
       
       // Sidebar toggle
       const sidebarToggle = document.getElementById('sidebarToggle');
       const mainContent = document.getElementById('mainContent');
       
       sidebarToggle?.addEventListener('click', () => {
           sidebar.classList.toggle('collapsed');
           mainContent.classList.toggle('sidebar-collapsed');
       });
       
       // User menu dropdown
       const userMenuBtn = document.getElementById('userMenuBtn');
       const userDropdown = document.getElementById('userDropdown');
       
       userMenuBtn?.addEventListener('click', (e) => {
           e.stopPropagation();
           userMenuBtn.parentElement.classList.toggle('active');
       });
       
       // Close dropdown when clicking outside
       document.addEventListener('click', () => {
           userMenuBtn?.parentElement.classList.remove('active');
       });
       
       // Logout buttons
       document.querySelectorAll('#logoutBtn, #logoutBtnHeader').forEach(btn => {
           btn.addEventListener('click', (e) => {
               e.preventDefault();
               this.logout();
           });
       });
       
       // Refresh button
       const refreshBtn = document.getElementById('refreshBtn');
       refreshBtn?.addEventListener('click', () => {
           this.refreshData();
       });
       
       // Export button
       const exportBtn = document.getElementById('exportBtn');
       exportBtn?.addEventListener('click', () => {
           this.exportData();
       });
       
       // Quick actions
       document.querySelectorAll('.quick-action-card').forEach(card => {
           card.addEventListener('click', () => {
               const action = card.getAttribute('data-action');
               this.handleQuickAction(action);
           });
       });
       
       // Filters
       const filterBtn = document.getElementById('filterBtn');
       const filtersPanel = document.getElementById('filtersPanel');
       
       filterBtn?.addEventListener('click', () => {
           filtersPanel.classList.toggle('hidden');
       });
       
       const applyFiltersBtn = document.getElementById('applyFilters');
       applyFiltersBtn?.addEventListener('click', () => {
           this.applyFilters();
       });
       
       const clearFiltersBtn = document.getElementById('clearFilters');
       clearFiltersBtn?.addEventListener('click', () => {
           this.clearFilters();
       });
       
       // Chart period selector
       const chartPeriod = document.getElementById('chartPeriod');
       chartPeriod?.addEventListener('change', () => {
           this.updateChartPeriod(chartPeriod.value);
       });
       
       // Modal close
       const modalClose = document.getElementById('modalClose');
       const modal = document.getElementById('registrationModal');
       
       modalClose?.addEventListener('click', () => {
           this.closeModal();
       });
       
       modal?.addEventListener('click', (e) => {
           if (e.target === modal) {
               this.closeModal();
           }
       });
       
       // ESC key to close modal
       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape') {
               this.closeModal();
           }
       });
       
       // Table select all
       const selectAll = document.getElementById('selectAll');
       selectAll?.addEventListener('change', (e) => {
           this.toggleSelectAll(e.target.checked);
       });
       
       // Notification toast close
       const toastClose = document.getElementById('toastClose');
       toastClose?.addEventListener('click', () => {
           this.hideNotification();
       });
   }
   
   switchPage(page) {
       // Update active navigation
       document.querySelectorAll('.nav-item').forEach(item => {
           item.classList.remove('active');
       });
       
       document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
       
       // Hide all content views
       document.querySelectorAll('.content-view').forEach(view => {
           view.classList.remove('active');
       });
       
       // Show selected view
       const targetView = document.getElementById(`${page}View`);
       if (targetView) {
           targetView.classList.add('active');
           
           // Update page title
           const pageTitle = document.getElementById('pageTitle');
           const pageTitles = {
               'dashboard': 'Dashboard',
               'preinscrieri': 'Preînscriieri',
               'comunicare': 'Comunicare',
               'rapoarte': 'Rapoarte',
               'setari': 'Setări'
           };
           
           if (pageTitle) {
               pageTitle.textContent = pageTitles[page] || 'Dashboard';
           }
       }
       
       this.currentPage = page;
       
       // Load page-specific data
       switch (page) {
           case 'dashboard':
               this.loadDashboardData();
               break;
           case 'preinscrieri':
               this.loadRegistrations();
               break;
           case 'comunicare':
               this.loadCommunication();
               break;
           case 'rapoarte':
               this.loadReports();
               break;
           case 'setari':
               this.loadSettings();
               break;
       }
   }
   
   async loadDashboardData() {
       try {
           this.showLoading();
           
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'get_dashboard_data'
           });
           
           if (response.success) {
               this.data.stats = response.data;
               this.updateDashboardStats(response.data);
               this.updateCharts(response.data);
               this.loadRecentActivity();
           } else {
               this.showNotification('Eroare la încărcarea datelor dashboard', 'error');
           }
       } catch (error) {
           console.error('Dashboard data error:', error);
           this.showNotification('Eroare de conexiune la încărcarea datelor', 'error');
       } finally {
           this.hideLoading();
       }
   }
   
   updateDashboardStats(data) {
       // Update stat cards with animation
       const stats = {
           'totalRegistrations': data.total_preinscrieri || 0,
           'pendingRegistrations': data.pending_preinscrieri || 0,
           'confirmedRegistrations': data.confirmed_preinscrieri || 0,
           'totalChildren': data.total_copii || 0
       };
       
       Object.entries(stats).forEach(([id, value]) => {
           const element = document.getElementById(id);
           if (element) {
               this.animateCounter(element, value);
           }
       });
       
       // Update pending badge in sidebar
       const pendingBadge = document.getElementById('pendingCount');
       if (pendingBadge) {
           pendingBadge.textContent = data.pending_preinscrieri || 0;
           pendingBadge.style.display = data.pending_preinscrieri > 0 ? 'block' : 'none';
       }
       
       // Update change percentages
       this.updateStatChanges(data);
   }
   
   updateStatChanges(data) {
       const changes = {
           'registrationsChange': {
               value: data.registrations_change || 0,
               text: `${data.registrations_change > 0 ? '+' : ''}${data.registrations_change}% față de luna trecută`
           },
           'pendingChange': {
               text: data.pending_preinscrieri > 5 ? 'Necesită atenție urgentă' : 'Sub control'
           },
           'confirmedChange': {
               value: data.confirmed_change || 0,
               text: `${data.confirmed_change > 0 ? '+' : ''}${data.confirmed_change}% această săptămână`
           },
           'childrenChange': {
               text: `${data.age_groups_count || 3} grupe de vârstă`
           }
       };
       
       Object.entries(changes).forEach(([id, change]) => {
           const element = document.getElementById(id);
           if (element) {
               element.textContent = change.text;
               if (change.value !== undefined) {
                   element.className = `stat-change ${change.value >= 0 ? 'positive' : 'negative'}`;
               }
           }
       });
   }
   
   animateCounter(element, targetValue) {
       const startValue = parseInt(element.textContent) || 0;
       const duration = 1500;
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
   
   setupCharts() {
       // Weekly registrations chart
       const weeklyCtx = document.getElementById('weeklyChart');
       if (weeklyCtx) {
           this.charts.weekly = new Chart(weeklyCtx, {
               type: 'line',
               data: {
                   labels: [],
                   datasets: [{
                       label: 'Preînscriieri',
                       data: [],
                       borderColor: 'rgb(102, 126, 234)',
                       backgroundColor: 'rgba(102, 126, 234, 0.1)',
                       borderWidth: 3,
                       fill: true,
                       tension: 0.4
                   }]
               },
               options: {
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: {
                       legend: {
                           display: false
                       }
                   },
                   scales: {
                       y: {
                           beginAtZero: true,
                           grid: {
                               color: 'rgba(0,0,0,0.1)'
                           }
                       },
                       x: {
                           grid: {
                               display: false
                           }
                       }
                   }
               }
           });
       }
       
       // Age distribution chart
       const ageCtx = document.getElementById('ageChart');
       if (ageCtx) {
           this.charts.age = new Chart(ageCtx, {
               type: 'doughnut',
               data: {
                   labels: ['6-8 ani', '9-11 ani', '12-14 ani', '15+ ani'],
                   datasets: [{
                       data: [0, 0, 0, 0],
                       backgroundColor: [
                           'rgb(102, 126, 234)',
                           'rgb(118, 75, 162)',
                           'rgb(240, 147, 251)',
                           'rgb(99, 179, 237)'
                       ],
                       borderWidth: 0
                   }]
               },
               options: {
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: {
                       legend: {
                           position: 'bottom'
                       }
                   }
               }
           });
       }
       
       // Setup mini charts for stat cards
       this.setupMiniCharts();
   }
   
   setupMiniCharts() {
       const miniChartConfigs = [
           { id: 'registrationsChart', color: 'rgb(102, 126, 234)' },
           { id: 'pendingChart', color: 'rgb(237, 137, 54)' },
           { id: 'confirmedChart', color: 'rgb(72, 187, 120)' },
           { id: 'childrenChart', color: 'rgb(66, 153, 225)' }
       ];
       
       miniChartConfigs.forEach(config => {
           const ctx = document.getElementById(config.id);
           if (ctx) {
               this.charts[config.id] = new Chart(ctx, {
                   type: 'line',
                   data: {
                       labels: ['', '', '', '', '', '', ''],
                       datasets: [{
                           data: [12, 19, 8, 25, 18, 30, 24],
                           borderColor: config.color,
                           backgroundColor: 'transparent',
                           borderWidth: 2,
                           pointRadius: 0,
                           tension: 0.4
                       }]
                   },
                   options: {
                       responsive: true,
                       maintainAspectRatio: false,
                       plugins: {
                           legend: { display: false }
                       },
                       scales: {
                           x: { display: false },
                           y: { display: false }
                       }
                   }
               });
           }
       });
   }
   
   updateCharts(data) {
       // Update weekly chart
       if (this.charts.weekly && data.weekly_data) {
           this.charts.weekly.data.labels = data.weekly_data.labels;
           this.charts.weekly.data.datasets[0].data = data.weekly_data.values;
           this.charts.weekly.update('none');
       }
       
       // Update age chart
       if (this.charts.age && data.age_distribution) {
           this.charts.age.data.datasets[0].data = data.age_distribution;
           this.charts.age.update('none');
       }
       
       // Update mini charts with recent trends
       if (data.mini_charts) {
           Object.keys(data.mini_charts).forEach(chartId => {
               if (this.charts[chartId]) {
                   this.charts[chartId].data.datasets[0].data = data.mini_charts[chartId];
                   this.charts[chartId].update('none');
               }
           });
       }
   }
   
   async loadRecentActivity() {
       try {
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'get_recent_activity',
               limit: 10
           });
           
           if (response.success) {
               this.data.activities = response.data;
               this.renderRecentActivity(response.data);
           }
       } catch (error) {
           console.error('Recent activity error:', error);
       }
   }
   
   renderRecentActivity(activities) {
       const container = document.getElementById('recentActivity');
       if (!container) return;
       
       if (activities.length === 0) {
           container.innerHTML = `
               <div class="activity-item">
                   <div class="activity-content">
                       <p class="activity-text">Nu există activitate recentă</p>
                   </div>
               </div>
           `;
           return;
       }
       
       container.innerHTML = activities.map(activity => {
           const timeAgo = this.timeAgo(activity.data_inscriere);
           const iconClass = this.getActivityIcon(activity.status);
           
           return `
               <div class="activity-item">
                   <div class="activity-icon ${activity.status}">
                       <i class="fas ${iconClass}"></i>
                   </div>
                   <div class="activity-content">
                       <p class="activity-text">
                           <strong>Preînregistrare nouă</strong> de la 
                           <span class="highlight">${activity.nume_parinte} ${activity.prenume_parinte}</span> 
                           pentru copilul <span class="highlight">${activity.nume_copil} (${activity.varsta_copil} ani)</span>
                       </p>
                       <span class="activity-time">${timeAgo}</span>
                   </div>
                   <div class="activity-actions">
                       <button class="action-btn-small view" title="Vizualizează" onclick="dashboard.viewRegistration(${activity.id})">
                           <i class="fas fa-eye"></i>
                       </button>
                       ${activity.status === 'nou' ? `
                           <button class="action-btn-small approve" title="Aprobă" onclick="dashboard.approveRegistration(${activity.id})">
                               <i class="fas fa-check"></i>
                           </button>
                       ` : ''}
                   </div>
               </div>
           `;
       }).join('');
   }
   
   getActivityIcon(status) {
       const icons = {
           'nou': 'fa-user-plus',
           'contactat': 'fa-phone',
           'confirmat': 'fa-check-circle',
           'respins': 'fa-times-circle'
       };
       return icons[status] || 'fa-user-plus';
   }
   
   timeAgo(dateString) {
       const date = new Date(dateString);
       const now = new Date();
       const diffInSeconds = Math.floor((now - date) / 1000);
       
       if (diffInSeconds < 60) return 'Acum câteva secunde';
       if (diffInSeconds < 3600) return `Acum ${Math.floor(diffInSeconds / 60)} minute`;
       if (diffInSeconds < 86400) return `Acum ${Math.floor(diffInSeconds / 3600)} ore`;
       if (diffInSeconds < 604800) return `Acum ${Math.floor(diffInSeconds / 86400)} zile`;
       
       return date.toLocaleDateString('ro-RO');
   }
   
   async loadRegistrations() {
       try {
           this.showTableLoading();
           
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'get_registrations',
               page: this.pagination.currentPage,
               per_page: this.pagination.perPage,
               filters: this.filters
           });
           
           if (response.success) {
               this.data.registrations = response.data.registrations;
               this.pagination.total = response.data.total;
               this.renderRegistrationsTable(response.data.registrations);
               this.updatePagination();
           } else {
               this.showNotification('Eroare la încărcarea preînscriierilor', 'error');
           }
       } catch (error) {
           console.error('Registrations loading error:', error);
           this.showNotification('Eroare de conexiune', 'error');
       } finally {
           this.hideTableLoading();
       }
   }
   
   renderRegistrationsTable(registrations) {
       const tbody = document.getElementById('registrationsTableBody');
       if (!tbody) return;
       
       if (registrations.length === 0) {
           tbody.innerHTML = `
               <tr>
                   <td colspan="8" class="text-center">
                       <p>Nu există preînscriieri care să corespundă criteriilor selectate.</p>
                   </td>
               </tr>
           `;
           return;
       }
       
       tbody.innerHTML = registrations.map(reg => `
           <tr data-id="${reg.id}">
               <td>
                   <input type="checkbox" class="row-select" value="${reg.id}">
               </td>
               <td data-label="Data">${this.formatDate(reg.data_inscriere)}</td>
               <td data-label="Părinte">${reg.nume_parinte} ${reg.prenume_parinte}</td>
               <td data-label="Copil">${reg.nume_copil}</td>
               <td data-label="Vârsta">${reg.varsta_copil} ani</td>
               <td data-label="Școala">${reg.scoala_copil}</td>
               <td data-label="Status">
                   <span class="status-badge ${reg.status}">${this.getStatusText(reg.status)}</span>
               </td>
               <td data-label="Acțiuni">
                   <div class="table-actions">
                       <button class="action-btn-small view" title="Vizualizează" onclick="dashboard.viewRegistration(${reg.id})">
                           <i class="fas fa-eye"></i>
                       </button>
                       <button class="action-btn-small edit" title="Editează" onclick="dashboard.editRegistration(${reg.id})">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button class="action-btn-small delete" title="Șterge" onclick="dashboard.deleteRegistration(${reg.id})">
                           <i class="fas fa-trash"></i>
                       </button>
                   </div>
               </td>
           </tr>
       `).join('');
       
       // Setup row selection
       this.setupRowSelection();
   }
   
   getStatusText(status) {
       const statusTexts = {
           'nou': 'Nou',
           'contactat': 'Contactat',
           'confirmat': 'Confirmat',
           'respins': 'Respins'
       };
       return statusTexts[status] || status;
   }
   
   formatDate(dateString) {
       const date = new Date(dateString);
       return date.toLocaleDateString('ro-RO', {
           day: '2-digit',
           month: '2-digit',
           year: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
       });
   }
   
   setupRowSelection() {
       const checkboxes = document.querySelectorAll('.row-select');
       checkboxes.forEach(checkbox => {
           checkbox.addEventListener('change', () => {
               this.updateSelectAllState();
           });
       });
   }
   
   toggleSelectAll(checked) {
       const checkboxes = document.querySelectorAll('.row-select');
       checkboxes.forEach(checkbox => {
           checkbox.checked = checked;
       });
   }
   
   updateSelectAllState() {
       const checkboxes = document.querySelectorAll('.row-select');
       const checkedBoxes = document.querySelectorAll('.row-select:checked');
       const selectAll = document.getElementById('selectAll');
       
       if (selectAll) {
           selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
           selectAll.checked = checkedBoxes.length === checkboxes.length && checkboxes.length > 0;
       }
   }
   
   updatePagination() {
       const totalPages = Math.ceil(this.pagination.total / this.pagination.perPage);
       const start = (this.pagination.currentPage - 1) * this.pagination.perPage + 1;
       const end = Math.min(start + this.pagination.perPage - 1, this.pagination.total);
       
       // Update pagination info
       document.getElementById('paginationStart').textContent = start;
       document.getElementById('paginationEnd').textContent = end;
       document.getElementById('paginationTotal').textContent = this.pagination.total;
       
       // Generate pagination buttons
       const paginationContainer = document.getElementById('pagination');
       if (!paginationContainer) return;
       
       let paginationHTML = '';
       
       // Previous button
       paginationHTML += `
           <button class="pagination-btn" ${this.pagination.currentPage === 1 ? 'disabled' : ''} 
                   onclick="dashboard.changePage(${this.pagination.currentPage - 1})">
               <i class="fas fa-chevron-left"></i>
           </button>
       `;
       
       // Page numbers
       const startPage = Math.max(1, this.pagination.currentPage - 2);
       const endPage = Math.min(totalPages, this.pagination.currentPage + 2);
       
       if (startPage > 1) {
           paginationHTML += `<button class="pagination-btn" onclick="dashboard.changePage(1)">1</button>`;
           if (startPage > 2) {
               paginationHTML += `<span class="pagination-ellipsis">...</span>`;
           }
       }
       
       for (let i = startPage; i <= endPage; i++) {
           paginationHTML += `
               <button class="pagination-btn ${i === this.pagination.currentPage ? 'active' : ''}" 
                       onclick="dashboard.changePage(${i})">${i}</button>
           `;
       }
       
       if (endPage < totalPages) {
           if (endPage < totalPages - 1) {
               paginationHTML += `<span class="pagination-ellipsis">...</span>`;
           }
           paginationHTML += `<button class="pagination-btn" onclick="dashboard.changePage(${totalPages})">${totalPages}</button>`;
       }
       
       // Next button
       paginationHTML += `
           <button class="pagination-btn" ${this.pagination.currentPage === totalPages ? 'disabled' : ''} 
                   onclick="dashboard.changePage(${this.pagination.currentPage + 1})">
               <i class="fas fa-chevron-right"></i>
           </button>
       `;
       
       paginationContainer.innerHTML = paginationHTML;
   }
   
   changePage(page) {
       if (page < 1 || page > Math.ceil(this.pagination.total / this.pagination.perPage)) return;
       
       this.pagination.currentPage = page;
       this.loadRegistrations();
   }
   
   applyFilters() {
       this.filters = {
           status: document.getElementById('statusFilter')?.value || '',
           age: document.getElementById('ageFilter')?.value || '',
           dateFrom: document.getElementById('dateFromFilter')?.value || '',
           dateTo: document.getElementById('dateToFilter')?.value || ''
       };
       
       this.pagination.currentPage = 1; // Reset to first page
       this.loadRegistrations();
       
       // Hide filters panel
       document.getElementById('filtersPanel')?.classList.add('hidden');
   }
   
   clearFilters() {
       this.filters = {
           status: '',
           age: '',
           dateFrom: '',
           dateTo: ''
       };
       
       // Clear form inputs
       document.getElementById('statusFilter').value = '';
       document.getElementById('ageFilter').value = '';
       document.getElementById('dateFromFilter').value = '';
       document.getElementById('dateToFilter').value = '';
       
       this.pagination.currentPage = 1;
       this.loadRegistrations();
   }
   
   async viewRegistration(id) {
       try {
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'get_registration_details',
               id: id
           });
           
           if (response.success) {
               this.showRegistrationModal(response.data);
           } else {
               this.showNotification('Eroare la încărcarea detaliilor', 'error');
           }
       } catch (error) {
           console.error('View registration error:', error);
           this.showNotification('Eroare de conexiune', 'error');
       }
   }
   
   showRegistrationModal(registration) {
       const modal = document.getElementById('registrationModal');
       const modalTitle = document.getElementById('modalTitle');
       const modalBody = document.getElementById('modalBody');
       const modalFooter = document.getElementById('modalFooter');
       
       modalTitle.textContent = `Preînregistrare #${registration.id}`;
       
       modalBody.innerHTML = `
           <div class="registration-details">
               <div class="details-section">
                   <h4><i class="fas fa-user-circle"></i> Date Părinte</h4>
                   <div class="details-grid">
                       <div class="detail-item">
                           <label>Nume complet</label>
                           <span>${registration.nume_parinte} ${registration.prenume_parinte}</span>
                       </div>
                       <div class="detail-item">
                           <label>Telefon</label>
                           <span>${registration.telefon_parinte}</span>
                       </div>
                       <div class="detail-item">
                           <label>Email</label>
                           <span>${registration.email_parinte}</span>
                       </div>
                   </div>
               </div>
               
               <div class="details-section">
                   <h4><i class="fas fa-child"></i> Date Copil</h4>
                   <div class="details-grid">
                       <div class="detail-item">
                           <label>Nume complet</label>
                           <span>${registration.nume_copil}</span>
                       </div>
                       <div class="detail-item">
                           <label>Vârsta</label>
                           <span>${registration.varsta_copil} ani</span>
                       </div>
                       <div class="detail-item">
                           <label>Clasa</label>
                           <span>${registration.clasa_copil}</span>
                       </div>
                       <div class="detail-item">
                           <label>Școala</label>
                           <span>${registration.scoala_copil}</span>
                       </div>
                   </div>
               </div>
               
               ${registration.experienta_copil || registration.interese_copil || registration.observatii ? `
                   <div class="details-section">
                       <h4><i class="fas fa-info-circle"></i> Informații Suplimentare</h4>
                       ${registration.experienta_copil ? `
                           <div class="detail-item">
                               <label>Experiență</label>
                               <span>${registration.experienta_copil}</span>
                           </div>
                       ` : ''}
                       ${registration.interese_copil ? `
                           <div class="detail-item">
                               <label>Interese</label>
                               <span>${registration.interese_copil}</span>
                           </div>
                       ` : ''}
                       ${registration.observatii ? `
                           <div class="detail-item">
                               <label>Observații</label>
                               <span>${registration.observatii}</span>
                           </div>
                       ` : ''}
                   </div>
               ` : ''}
               
               <div class="details-section">
                   <h4><i class="fas fa-cog"></i> Status și Istoric</h4>
                   <div class="details-grid">
                       <div class="detail-item">
                           <label>Status</label>
                           <span class="status-badge ${registration.status}">${this.getStatusText(registration.status)}</span>
                       </div>
                       <div class="detail-item">
                           <label>Data înregistrării</label>
                           <span>${this.formatDate(registration.data_inscriere)}</span>
                       </div>
                       <div class="detail-item">
                           <label>IP Adresă</label>
                           <span>${registration.ip_adresa || 'N/A'}</span>
                       </div>
                   </div>
               </div>
               
               <div class="details-section">
                   <h4><i class="fas fa-check-circle"></i> Acorduri</h4>
                   <div class="agreements-list">
                       <div class="agreement-item">
                           <i class="fas ${registration.acord_gdpr ? 'fa-check-circle text-success' : 'fa-times-circle text-error'}"></i>
                           <span>Acord GDPR</span>
                       </div>
                       <div class="agreement-item">
                           <i class="fas ${registration.acord_marketing ? 'fa-check-circle text-success' : 'fa-times-circle text-error'}"></i>
                           <span>Acord Marketing</span>
                       </div>
                       <div class="agreement-item">
                           <i class="fas ${registration.acord_foto ? 'fa-check-circle text-success' : 'fa-times-circle text-error'}"></i>
                           <span>Acord Foto/Video</span>
                       </div>
                   </div>
               </div>
           </div>
       `;
       
       modalFooter.innerHTML = `
           <div class="modal-actions">
               <div class="action-group">
                   <button class="btn btn-secondary" onclick="dashboard.closeModal()">Închide</button>
               </div>
               <div class="action-group">
                   ${registration.status === 'nou' ? `
                       <button class="btn btn-success" onclick="dashboard.changeRegistrationStatus(${registration.id}, 'confirmat')">
                           <i class="fas fa-check"></i> Confirmă
                       </button>
                       <button class="btn btn-warning" onclick="dashboard.changeRegistrationStatus(${registration.id}, 'contactat')">
                           <i class="fas fa-phone"></i> Marchează ca Contactat
                       </button>
                   ` : ''}
                   ${registration.status !== 'respins' ? `
                       <button class="btn btn-danger" onclick="dashboard.changeRegistrationStatus(${registration.id}, 'respins')">
                           <i class="fas fa-times"></i> Respinge
                       </button>
                   ` : ''}
                   <button class="btn btn-primary" onclick="dashboard.editRegistration(${registration.id})">
                       <i class="fas fa-edit"></i> Editează
                   </button>
               </div>
           </div>
       `;
       
       modal.classList.remove('hidden');
   }
   
   closeModal() {
       const modal = document.getElementById('registrationModal');
       modal?.classList.add('hidden');
   }
   
   async changeRegistrationStatus(id, status) {
       try {
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'update_registration_status',
               id: id,
               status: status
           });
           
           if (response.success) {
               this.showNotification(`Status actualizat cu succes la "${this.getStatusText(status)}"`, 'success');
               this.closeModal();
               this.loadRegistrations();
               this.loadDashboardData(); // Refresh stats
           } else {
               this.showNotification('Eroare la actualizarea statusului', 'error');
           }
       } catch (error) {
           console.error('Status update error:', error);
           this.showNotification('Eroare de conexiune', 'error');
       }
   }
   
   async approveRegistration(id) {
       await this.changeRegistrationStatus(id, 'confirmat');
   }
   
   async editRegistration(id) {
       // Implementation for editing registration
       this.showNotification('Funcționalitatea de editare va fi implementată în curând', 'warning');
   }
   
   async deleteRegistration(id) {
       if (!confirm('Sunteți sigur că doriți să ștergeți această preînregistrare? Acțiunea nu poate fi anulată.')) {
           return;
       }
       
       try {
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'delete_registration',
               id: id
           });
           
           if (response.success) {
               this.showNotification('Preînregistrarea a fost ștearsă cu succes', 'success');
               this.loadRegistrations();
               this.loadDashboardData(); // Refresh stats
           } else {
               this.showNotification('Eroare la ștergerea preînregistrării', 'error');
           }
       } catch (error) {
           console.error('Delete registration error:', error);
           this.showNotification('Eroare de conexiune', 'error');
       }
   }
   
   handleQuickAction(action) {
       switch (action) {
           case 'new-registration':
               this.showNotification('Funcționalitatea de adăugare manuală va fi implementată în curând', 'warning');
               break;
           case 'send-email':
               this.switchPage('comunicare');
               break;
           case 'export-data':
               this.exportData();
               break;
           case 'system-settings':
               this.switchPage('setari');
               break;
       }
   }
   
   async exportData() {
       try {
           this.showLoading();
           
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'export_registrations',
               format: 'csv',
               filters: this.filters
           });
           
           if (response.success) {
               // Create and download file
               const blob = new Blob([response.data], { type: 'text/csv' });
               const url = window.URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `preinscrieri_${new Date().toISOString().split('T')[0]}.csv`;
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               window.URL.revokeObjectURL(url);
               
               this.showNotification('Export realizat cu succes', 'success');
           } else {
               this.showNotification('Eroare la exportul datelor', 'error');
           }
       } catch (error) {
           console.error('Export error:', error);
           this.showNotification('Eroare de conexiune la export', 'error');
       } finally {
           this.hideLoading();
       }
   }
   
   refreshData() {
       switch (this.currentPage) {
           case 'dashboard':
               this.loadDashboardData();
               break;
           case 'preinscrieri':
               this.loadRegistrations();
               break;
           default:
               this.loadDashboardData();
       }
       
       this.showNotification('Datele au fost actualizate', 'success');
   }
   
   updateChartPeriod(period) {
       // Update chart based on selected period
       this.loadDashboardData();
   }
   
   setupAutoRefresh() {
       // Refresh data every 5 minutes
       setInterval(() => {
           if (this.currentPage === 'dashboard') {
               this.loadDashboardData();
           }
       }, 5 * 60 * 1000);
       
       // Refresh notifications every minute
       setInterval(() => {
           this.updateNotificationBadge();
       }, 60 * 1000);
   }
   
   setupNotifications() {
       // Setup real-time notifications if needed
       this.updateNotificationBadge();
   }
   
   async updateNotificationBadge() {
       try {
           const response = await this.apiCall('/backend/admin_functions.php', {
               action: 'get_notification_count'
           });
           
           if (response.success) {
               const badge = document.getElementById('notificationBadge');
               if (badge) {
                   const count = response.data.count || 0;
                   badge.textContent = count;
                   badge.style.display = count > 0 ? 'block' : 'none';
               }
           }
       } catch (error) {
           console.error('Notification update error:', error);
       }
   }
   
   loadCommunication() {
       // Placeholder for communication module
       this.showNotification('Modulul de comunicare va fi implementat în curând', 'warning');
   }
   
   loadReports() {
       // Placeholder for reports module
       this.showNotification('Modulul de rapoarte va fi implementat în curând', 'warning');
   }
   
   loadSettings() {
       // Placeholder for settings module
       this.showNotification('Modulul de setări va fi implementat în curând', 'warning');
   }
   
   // Utility methods
   showLoading() {
       const overlay = document.getElementById('loadingOverlay');
       overlay?.classList.remove('hidden');
   }
   
   hideLoading() {
       const overlay = document.getElementById('loadingOverlay');
       overlay?.classList.add('hidden');
   }
   
   showTableLoading() {
       const loading = document.getElementById('tableLoading');
       loading?.classList.remove('hidden');
   }
   
   hideTableLoading() {
       const loading = document.getElementById('tableLoading');
       loading?.classList.add('hidden');
   }
   
   showNotification(message, type = 'success') {
       const toast = document.getElementById('notificationToast');
       const toastMessage = document.getElementById('toastMessage');
       const toastIcon = document.getElementById('toastIcon');
       
       if (!toast || !toastMessage || !toastIcon) return;
       
       // Set message
       toastMessage.textContent = message;
       
       // Set icon based on type
       const icons = {
           'success': 'fas fa-check-circle',
           'error': 'fas fa-exclamation-circle',
           'warning': 'fas fa-exclamation-triangle',
           'info': 'fas fa-info-circle'
       };
       
       toastIcon.className = `toast-icon ${type}`;
       toastIcon.innerHTML = `<i class="${icons[type] || icons.info}"></i>`;
       
       // Show toast
       toast.classList.remove('hidden');
       toast.classList.add('show');
       
       // Auto-hide after 5 seconds
       setTimeout(() => {
           this.hideNotification();
       }, 5000);
   }
   
   hideNotification() {
       const toast = document.getElementById('notificationToast');
       toast?.classList.remove('show');
       
       setTimeout(() => {
           toast?.classList.add('hidden');
       }, 300);
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
           if (response.status === 401) {
               this.redirectToLogin();
               throw new Error('Unauthorized');
           }
           throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const result = await response.json();
       
       if (!result.success && result.error_code === 'INVALID_TOKEN') {
           this.redirectToLogin();
           throw new Error('Invalid token');
       }
       
       return result;
   }
   
   async refreshToken() {
       try {
           const response = await fetch('../backend/auth.php', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'X-Requested-With': 'XMLHttpRequest'
               },
               body: JSON.stringify({
                   action: 'refresh_token',
                   token: this.token
               })
           });
           
           const result = await response.json();
           
           if (result.success && result.token) {
               localStorage.setItem('admin_token', result.token);
               localStorage.setItem('admin_token_expiry', (Date.now() + (2 * 60 * 60 * 1000)).toString());
               this.token = result.token;
           }
       } catch (error) {
           console.error('Token refresh error:', error);
       }
   }
   
   async logout() {
       try {
           await this.apiCall('../backend/auth.php', {
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
   
   clearSession() {
       localStorage.removeItem('admin_token');
       localStorage.removeItem('admin_token_expiry');
       localStorage.removeItem('admin_user');
   }
   
   redirectToLogin() {
       window.location.href = 'login.html';
   }
   
   showTokenExpiredMessage() {
       this.showNotification('Sesiunea a expirat. Vă rugăm să vă autentificați din nou.', 'warning');
   }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
   // Check if we're on the dashboard page
   if (document.querySelector('.dashboard-container') || document.querySelector('.dashboard-body')) {
       window.dashboard = new DashboardManager();
       console.log('Dashboard initialized successfully');
   }
});

// Handle window resize for responsive design
window.addEventListener('resize', function() {
   if (window.dashboard && window.dashboard.charts) {
       // Resize charts
       Object.values(window.dashboard.charts).forEach(chart => {
           if (chart && typeof chart.resize === 'function') {
               chart.resize();
           }
       });
   }
});

// Handle page visibility change to refresh data when tab becomes active
document.addEventListener('visibilitychange', function() {
   if (!document.hidden && window.dashboard) {
       // Refresh data when page becomes visible
       window.dashboard.updateNotificationBadge();
       
       // Refresh dashboard data if on dashboard page
       if (window.dashboard.currentPage === 'dashboard') {
           window.dashboard.loadDashboardData();
       }
   }
});

// Export dashboard for global access
if (typeof module !== 'undefined' && module.exports) {
   module.exports = DashboardManager;
}