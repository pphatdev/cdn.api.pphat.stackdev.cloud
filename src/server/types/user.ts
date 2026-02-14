export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    maxSessionsPerUser: number;
}


export interface User {
    id: string;
    username: string;
    email?: string;
    password_hash: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'user' | 'viewer';
    is_active: boolean;
    failed_login_attempts: number;
    locked_until?: Date;
    last_login_at?: Date;
    password_changed_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface Session {
    id: string;
    user_id: string;
    token_hash: string;
    refresh_token_hash?: string;
    ip_address?: string;
    user_agent?: string;
    is_valid: boolean;
    expires_at: Date;
    refresh_expires_at?: Date;
    created_at: Date;
    last_used_at: Date;
}

export interface JwtPayload {
    userId: string;
    username: string;
    role: string;
    sessionId: string;
    type: 'access' | 'refresh';
}