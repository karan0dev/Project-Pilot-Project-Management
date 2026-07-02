// API helper client and session manager for ProjectPilot
const API_URL = '/api';

const API = {
  // Session storage keys
  TOKEN_KEY: 'projectpilot_token',
  USER_KEY: 'projectpilot_user',

  // Token management
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  getUser() {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  logout() {
    this.clearSession();
    window.location.href = '/login';
  },

  // HTTP request wrapper with automatic JWT inclusion
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Attach JWT token if logged in
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized token, force logout
        if (response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
          this.logout();
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Request Error: ${error.message}`);
      throw error;
    }
  },

  // Auth Operations
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success) {
      this.setToken(res.token);
      this.setUser({
        _id: res._id,
        username: res.username,
        email: res.email,
        role: res.role
      });
    }
    return res;
  },

  async register(username, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    if (res.success) {
      this.setToken(res.token);
      this.setUser({
        _id: res._id,
        username: res.username,
        email: res.email,
        role: res.role
      });
    }
    return res;
  },

  async getProfile() {
    return await this.request('/auth/me');
  },

  async updatePassword(currentPassword, newPassword) {
    return await this.request('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  // Project Operations
  async getProjects(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return await this.request(`/projects${query ? '?' + query : ''}`);
  },

  async getProject(id) {
    return await this.request(`/projects/${id}`);
  },

  async createProject(projectData) {
    return await this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },

  async updateProject(id, projectData) {
    return await this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  },

  async deleteProject(id) {
    return await this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  async getDashboardStats() {
    return await this.request('/projects/dashboard/stats');
  },

  // Task Operations
  async getTasks(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return await this.request(`/tasks${query ? '?' + query : ''}`);
  },

  async getTask(id) {
    return await this.request(`/tasks/${id}`);
  },

  async createTask(taskData) {
    return await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  async updateTask(id, taskData) {
    return await this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  },

  async deleteTask(id) {
    return await this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  },

  // User Administration Operations (Admin only)
  async getUsers() {
    return await this.request('/users');
  },

  async deleteUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Check Page Protection
  checkPageAuth() {
    const path = window.location.pathname;
    const isPublicPage = path === '/' || path === '/login' || path === '/register' || path.endsWith('.html') && (path.endsWith('index.html') || path.endsWith('login.html') || path.endsWith('register.html'));
    
    if (!isPublicPage && !this.isAuthenticated()) {
      window.location.href = '/login';
      return false;
    }

    if ((path === '/login' || path === '/register') && this.isAuthenticated()) {
      window.location.href = '/dashboard';
      return false;
    }

    // Admin page protection
    const isAdminPage = path.includes('/users') || path.endsWith('users.html');
    if (isAdminPage && !this.isAdmin()) {
      window.location.href = '/dashboard';
      return false;
    }

    return true;
  },

  // Init Theme and Toggle Handler
  initTheme() {
    const savedTheme = localStorage.getItem('projectpilot_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
    }
  },

  toggleTheme() {
    if (document.body.classList.contains('light-mode')) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('projectpilot_theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('projectpilot_theme', 'light');
    }
  },

  // Render Top Navigation Header (styled as a horizontal bar)
  renderSidebar() {
    const sidebarEl = document.getElementById('sidebar-placeholder');
    if (!sidebarEl) return;

    const user = this.getUser() || { username: 'Guest', role: 'user' };
    const avatarInitials = user.username.substring(0, 2).toUpperCase();
    const currentPath = window.location.pathname;

    const navItems = [
      { name: 'Dashboard', path: '/dashboard', icon: '📊' },
      { name: 'Projects', path: '/projects', icon: '📂' },
      { name: 'Tasks', path: '/tasks', icon: '✅' },
      { name: 'Reports', path: '/reports', icon: '📈' },
      { name: 'Profile', path: '/profile', icon: '👤' },
      { name: 'Users', path: '/users', icon: '👥', adminOnly: true }
    ];

    let navHtml = '';
    navItems.forEach(item => {
      if (item.adminOnly && user.role !== 'admin') return;

      const isActive = currentPath === item.path || currentPath.endsWith(item.path) || (item.path === '/projects' && currentPath.includes('/project-details'));
      const activeClass = isActive ? 'active' : '';
      navHtml += `
        <li class="horizontal-nav-item ${activeClass}">
          <a href="${item.path}">
            <span>${item.icon}</span>
            <span>${item.name}</span>
          </a>
        </li>
      `;
    });

    sidebarEl.innerHTML = `
      <!-- Left Logo -->
      <div class="logo-container" style="margin-bottom: 0; padding-left: 0;">
        <div class="logo-icon">P</div>
        <span class="logo-text">ProjectPilot</span>
      </div>

      <!-- Center Horizontal Navigation Menu -->
      <ul class="horizontal-nav" style="display: flex; list-style: none; gap: 8px; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 20px; border: 1px solid var(--glass-border);">
        ${navHtml}
      </ul>

      <!-- Right Actions & User Controls -->
      <div style="display: flex; align-items: center; gap: 15px;">
        
        <!-- Global Action Buttons (Matching Mockup) -->
        <div style="display: flex; gap: 10px; margin-right: 5px;">
          <a href="/projects" class="btn-clay neutral" style="padding: 8px 16px; font-size: 0.85rem;">📁 View Projects</a>
          <a href="/tasks" class="btn-clay success" style="padding: 8px 16px; font-size: 0.85rem; background: linear-gradient(135deg, #00c853, #00994d); box-shadow: 0 6px 12px rgba(0,200,83,0.25);">✅ Manage Tasks</a>
        </div>

        <!-- Theme Toggle -->
        <button id="theme-toggle" style="background: none; border: 1px solid var(--glass-border); color: var(--text-primary); cursor: pointer; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: inset 1px 1px 2px rgba(255,255,255,0.05);">
          🌙
        </button>

        <!-- User Avatar & Logout Capsule -->
        <div class="user-info-widget" style="padding: 4px 10px; border-radius: 18px; display: flex; align-items: center; gap: 8px;">
          <div class="user-avatar" style="width: 28px; height: 28px; font-size: 0.72rem; box-shadow: none;">${avatarInitials}</div>
          <span class="user-name" style="font-size: 0.85rem; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.username}</span>
          <button id="logout-btn" style="background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
            🚪
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        this.logout();
      }
    });
  }
};

API.renderSidebar = function() {
  const sidebarEl = document.getElementById('sidebar-placeholder');
  if (!sidebarEl) return;

  const user = this.getUser() || { username: 'Guest', role: 'user' };
  const avatarInitials = user.username.substring(0, 2).toUpperCase();
  const currentPath = window.location.pathname;
  const iconAttrs = 'viewBox="0 0 24 24" aria-hidden="true"';

  const icons = {
    dashboard: `<svg ${iconAttrs}><rect x="3" y="3" width="8" height="8" rx="2"></rect><rect x="13" y="3" width="8" height="8" rx="2"></rect><rect x="3" y="13" width="8" height="8" rx="2"></rect><rect x="13" y="13" width="8" height="8" rx="2"></rect></svg>`,
    projects: `<svg ${iconAttrs}><path d="M3 7.2A2.2 2.2 0 0 1 5.2 5h4.2l2 2H19a2 2 0 0 1 2 2v8.8A2.2 2.2 0 0 1 18.8 20H5.2A2.2 2.2 0 0 1 3 17.8V7.2Z"></path></svg>`,
    tasks: `<svg ${iconAttrs}><rect x="4" y="3.5" width="16" height="17" rx="3"></rect><path d="m8 12 2.4 2.4L16 8.8"></path></svg>`,
    reports: `<svg ${iconAttrs}><path d="M5 20V9"></path><path d="M12 20V4"></path><path d="M19 20v-7"></path><path d="M3 20h18"></path></svg>`,
    profile: `<svg ${iconAttrs}><circle cx="12" cy="8" r="3.6"></circle><path d="M5 20c1.2-4 3.5-6 7-6s5.8 2 7 6"></path></svg>`,
    users: `<svg ${iconAttrs}><circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.5"></circle><path d="M3.8 19c.9-3.6 2.7-5.4 5.2-5.4s4.3 1.8 5.2 5.4"></path><path d="M14.4 15c1.9.2 3.3 1.5 4 4"></path></svg>`
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
    { name: 'Projects', path: '/projects', icon: icons.projects },
    { name: 'Tasks', path: '/tasks', icon: icons.tasks },
    { name: 'Reports', path: '/reports', icon: icons.reports },
    { name: 'Profile', path: '/profile', icon: icons.profile },
    { name: 'Users', path: '/users', icon: icons.users, adminOnly: true }
  ];

  const navHtml = navItems.map((item) => {
    if (item.adminOnly && user.role !== 'admin') return '';
    const isActive = currentPath === item.path || currentPath.endsWith(item.path) || (item.path === '/projects' && currentPath.includes('/project-details'));
    return `
      <li class="horizontal-nav-item ${isActive ? 'active' : ''}">
        <a href="${item.path}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.name}</span>
        </a>
      </li>
    `;
  }).join('');

  sidebarEl.innerHTML = `
    <div class="logo-container">
      <div class="logo-icon">P</div>
      <span class="logo-text">ProjectPilot</span>
    </div>

    <ul class="horizontal-nav">
      ${navHtml}
    </ul>

    <div class="topbar-actions">
      <a href="/tasks" class="btn-clay success">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>
        <span>Manage Tasks</span>
      </a>

      <button id="theme-toggle" aria-label="Toggle theme">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.1A7.4 7.4 0 0 1 8.9 3.6 8.3 8.3 0 1 0 20.4 15.1Z"></path></svg>
      </button>

      <div class="user-info-widget">
        <div class="user-avatar">${avatarInitials}</div>
        <span class="user-name">${user.username}</span>
        <button id="logout-btn" aria-label="Log out">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"></path></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('theme-toggle').addEventListener('click', () => {
    this.toggleTheme();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
      this.logout();
    }
  });
};

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
  API.initTheme();
  if (API.checkPageAuth()) {
    API.renderSidebar();
  }
});
