type UserRole = 'admin' | 'user' | 'viewer' | string;

type UserRow = {
    id: string;
    username: string;
    email?: string | null;
    name: string;
    role: UserRole;
    is_active: boolean;
    avatar?: string | null;
    last_login_at?: string | null;
    created_at?: string | null;
};

type BootstrapData = {
    users?: UserRow[];
    error?: string;
};

declare global {
    interface Window {
        editUser: (userId: string) => void;
        deleteUser: (userId: string) => Promise<void>;
    }
}

const byId = <T extends HTMLElement>(id: string): T | null => {
    return document.getElementById(id) as T | null;
};

const bootstrapEl = byId<HTMLElement>('users-bootstrap');
let bootstrapData: BootstrapData = {};

if (bootstrapEl) {
    try {
        bootstrapData = JSON.parse(bootstrapEl.textContent || '{}');
    } catch (error) {
        bootstrapData = {};
    }
}

const initialUsers = Array.isArray(bootstrapData.users) ? bootstrapData.users : [];
const initialError = typeof bootstrapData.error === 'string' ? bootstrapData.error : '';

let users: UserRow[] = initialUsers;
let currentPage = 1;
const itemsPerPage = 10;
let filteredUsers: UserRow[] = users;

const readCookie = (name: string): string | undefined => {
    return document.cookie
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split("=")[1];
};

const getAccessToken = (): string => {
    return localStorage.getItem("accessToken") || readCookie("accessToken") || "";
};

const buildAuthHeaders = (): Record<string, string> => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (initialError) {
        users = [];
        filteredUsers = [];
        updateStats();
        renderEmptyState(initialError);
    } else {
        updateStats();
        renderUsers();
    }
    setupEventListeners();
});

// Fetch users from API
async function fetchUsers() {
    try {
        const response = await fetch('/api/auth/users', {
            headers: buildAuthHeaders()
        });

        // Check if response is ok
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showError('Unauthorized. Please login as admin.');
            } else {
                showError('Failed to load users');
            }
            users = [];
            filteredUsers = [];
            updateStats();
            renderEmptyState('Access denied or failed to load');
            return;
        }

        const data = await response.json();

        // Check for successful response (status 200 or result exists)
        if (data.status === 200 || data.result) {
            users = data.result || [];
            filteredUsers = users;
            updateStats();
            renderUsers();
        } else {
            users = [];
            filteredUsers = [];
            updateStats();
            renderEmptyState(data.message || 'Failed to load users');
            showError(data.message || 'Failed to load users');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        users = [];
        filteredUsers = [];
        updateStats();
        renderEmptyState('Failed to load users');
        showError('Failed to load users');
    }
}

// Render empty state
function renderEmptyState(message: string) {
    const tbody = byId<HTMLTableSectionElement>('usersTableBody');
    const loading = byId<HTMLTableRowElement>('loadingRow');

    if (!tbody) return;

    if (loading) loading.remove();

    tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-foreground/60">
                    ${message}
                </td>
            </tr>
        `;
}

// Update statistics
function updateStats() {
    const total = users.length;
    const active = users.filter((user) => user.is_active).length;
    const admins = users.filter((user) => user.role === 'admin').length;
    const inactive = users.filter((user) => !user.is_active).length;

    const totalUsers = byId<HTMLElement>('totalUsers');
    const activeUsers = byId<HTMLElement>('activeUsers');
    const adminUsers = byId<HTMLElement>('adminUsers');
    const inactiveUsers = byId<HTMLElement>('inactiveUsers');

    if (totalUsers) totalUsers.textContent = String(total);
    if (activeUsers) activeUsers.textContent = String(active);
    if (adminUsers) adminUsers.textContent = String(admins);
    if (inactiveUsers) inactiveUsers.textContent = String(inactive);
}

// Render users table
function renderUsers() {
    const tbody = byId<HTMLTableSectionElement>('usersTableBody');
    const loading = byId<HTMLTableRowElement>('loadingRow');

    if (!tbody) return;

    if (loading) loading.remove();

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    if (paginatedUsers.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-foreground/60">
                        No users found
                    </td>
                </tr>
            `;
        return;
    }

    tbody.innerHTML = paginatedUsers.map((user) => `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4">
                    <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-primary">
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-full object-cover">` :
                            `<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>`
                        }
                        <div>
                            <div class="font-medium text-slate-900">${user.name}</div>
                            <div class="text-sm text-foreground/60">@${user.username}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-foreground/80">${user.email || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user.role)}">
                        ${user.role}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-foreground/60">${formatDate(user.last_login_at)}</td>
                <td class="px-6 py-4 text-sm text-foreground/60">${formatDate(user.created_at)}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="editUser('${user.id}')" class="p-1 hover:bg-slate-100 rounded" title="Edit">
                            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteUser('${user.id}')" class="p-1 hover:bg-slate-100 rounded" title="Delete">
                            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    updatePagination();
}

// Helper functions
function getRoleBadgeClass(role: UserRole): string {
    const classes = {
        'admin': 'bg-orange-100 text-orange-700',
        'user': 'bg-primary/10 text-primary',
        'viewer': 'bg-slate-100 text-slate-700'
    };
    return classes[role as keyof typeof classes] || classes.user;
}

function formatDate(dateString?: string | null): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const deltaDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        deltaDays,
        'day'
    );
}

function updatePagination() {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredUsers.length);

    const showingFrom = byId<HTMLElement>('showingFrom');
    const showingTo = byId<HTMLElement>('showingTo');
    const totalCount = byId<HTMLElement>('totalCount');
    const prevPage = byId<HTMLButtonElement>('prevPage');
    const nextPage = byId<HTMLButtonElement>('nextPage');

    if (showingFrom) showingFrom.textContent = String(start);
    if (showingTo) showingTo.textContent = String(end);
    if (totalCount) totalCount.textContent = String(filteredUsers.length);

    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = end >= filteredUsers.length;
}

function showError(message: string) {
    // Simple error display - can be enhanced with a toast library
    alert(message);
}

// Event Listeners
function setupEventListeners() {
    // Add user button
    const addUserBtn = byId<HTMLButtonElement>('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            openModal();
        });
    }

    const closeModalBtn = byId<HTMLButtonElement>('closeModal');
    const cancelBtn = byId<HTMLButtonElement>('cancelBtn');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    const searchInput = byId<HTMLInputElement>('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const target = event.target as HTMLInputElement | null;
            const search = target?.value?.toLowerCase() || '';
            filteredUsers = users.filter((user) =>
                user.name.toLowerCase().includes(search) ||
                user.username.toLowerCase().includes(search) ||
                (user.email && user.email.toLowerCase().includes(search))
            );
            currentPage = 1;
            renderUsers();
        });
    }

    const roleFilter = byId<HTMLSelectElement>('roleFilter');
    const statusFilter = byId<HTMLSelectElement>('statusFilter');

    if (roleFilter) roleFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    const prevPage = byId<HTMLButtonElement>('prevPage');
    const nextPage = byId<HTMLButtonElement>('nextPage');

    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderUsers();
            }
        });
    }

    if (nextPage) {
        nextPage.addEventListener('click', () => {
            if (currentPage * itemsPerPage < filteredUsers.length) {
                currentPage++;
                renderUsers();
            }
        });
    }

    const userForm = byId<HTMLFormElement>('userForm');
    if (userForm) userForm.addEventListener('submit', handleSubmit);
}

function applyFilters() {
    const roleFilterEl = byId<HTMLSelectElement>('roleFilter');
    const statusFilterEl = byId<HTMLSelectElement>('statusFilter');

    if (!roleFilterEl || !statusFilterEl) return;

    const roleFilter = roleFilterEl.value;
    const statusFilter = statusFilterEl.value;

    filteredUsers = users.filter((user) => {
        const roleMatch = !roleFilter || user.role === roleFilter;
        const statusMatch = !statusFilter ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);
        return roleMatch && statusMatch;
    });

    currentPage = 1;
    renderUsers();
}

function openModal(user: UserRow | null = null) {
    const modal = byId<HTMLElement>('userModal');
    const title = byId<HTMLElement>('modalTitle');
    const form = byId<HTMLFormElement>('userForm');

    if (!modal || !title || !form) return;

    if (user) {
        title.textContent = 'Edit User';
        const userId = byId<HTMLInputElement>('userId');
        const username = byId<HTMLInputElement>('username');
        const email = byId<HTMLInputElement>('email');
        const name = byId<HTMLInputElement>('name');
        const role = byId<HTMLSelectElement>('role');
        const isActive = byId<HTMLSelectElement>('isActive');
        const password = byId<HTMLInputElement>('password');

        if (userId) userId.value = user.id;
        if (username) username.value = user.username;
        if (email) email.value = user.email || '';
        if (name) name.value = user.name;
        if (role) role.value = user.role;
        if (isActive) isActive.value = user.is_active.toString();
        if (password) password.required = false;
    } else {
        title.textContent = 'Add New User';
        form.reset();
        const password = byId<HTMLInputElement>('password');
        if (password) password.required = true;
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = byId<HTMLElement>('userModal');
    const form = byId<HTMLFormElement>('userForm');

    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
}

async function handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement | null;
    if (!form) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData) as Record<string, string>;

    // Convert is_active to boolean
    const payload = {
        ...data,
        is_active: data.is_active === 'true'
    };

    try {
        const userId = byId<HTMLInputElement>('userId')?.value || '';
        const method = userId ? 'PUT' : 'POST';
        const url = userId ? `/api/auth/users/${userId}` : '/api/auth/users';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...buildAuthHeaders()
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === 200 || response.ok) {
            closeModal();
            fetchUsers();
        } else {
            showError(result.message || 'Failed to save user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showError('Failed to save user');
    }
}

// Global functions for inline onclick handlers
window.editUser = (userId: string) => {
    const user = users.find((item) => item.id === userId);
    if (user) openModal(user);
};

window.deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            headers: buildAuthHeaders()
        });

        const result = await response.json();

        if (result.status === 200 || response.ok) {
            fetchUsers();
        } else {
            showError(result.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user');
    }
};

export {};