export type UserRole = 'admin' | 'user' | 'viewer' | string;

export interface User {
    id: string;
    username: string;
    email?: string | null;
    name: string;
    role: UserRole;
    avatar?: string | null;
}

type AuthListener = (user: User | null) => void;

class AuthProvider {
    private user: User | null = null;
    private listeners: Set<AuthListener> = new Set();

    constructor() {
        this.loadUser();
    }

    private loadUser() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user', e);
                this.user = null;
            }
        }
    }

    public getUser(): User | null {
        return this.user;
    }

    public getAccessToken(): string {
        return localStorage.getItem('accessToken') || this.readCookie('accessToken') || '';
    }

    private readCookie(name: string): string | undefined {
        return document.cookie
            .split(';')
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith(`${name}=`))
            ?.split('=')[1];
    }

    public getAuthHeaders(): Record<string, string> {
        const token = this.getAccessToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    public subscribe(listener: AuthListener) {
        this.listeners.add(listener);
        listener(this.user);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.user));
    }

    public updateUser(userData: Partial<User>) {
        if (!this.user) return;
        this.user = { ...this.user, ...userData };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.notify();
    }

    public async uploadAvatar(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/auth/me/avatar', {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload avatar');
        }

        const result = await response.json();
        const avatarUrl = result.result.avatarUrl;
        
        this.updateUser({ avatar: avatarUrl });
        return avatarUrl;
    }

    public logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Clear cookies if any
        document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        this.user = null;
        this.notify();
        window.location.href = '/login';
    }

    public isAuthenticated(): boolean {
        return !!this.getAccessToken() && !!this.user;
    }
}

export const authProvider = new AuthProvider();
// @ts-ignore - expose to window for easier access in inline scripts if needed
window.authProvider = authProvider;
