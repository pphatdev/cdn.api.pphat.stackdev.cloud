import { Request, Response } from 'express';
import { sendSuccess, sendBadRequest, sendUnauthorized } from '../utils/response.js';
import { query, queryOne, getDbClient, initializeAuthTables } from '../utils/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ==================== CONFIGURATION ====================

interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    maxSessionsPerUser: number;
}

const getAuthConfig = (): AuthConfig => {
    const envPath = path.join(process.cwd(), 'env.json');
    let envData: any = {};

    if (fs.existsSync(envPath)) {
        envData = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
    }

    const authConfig = envData.auth || {};

    return {
        jwtSecret: authConfig.jwtSecret || process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        jwtExpiresIn: authConfig.jwtExpiresIn || '1h',
        refreshTokenExpiresIn: authConfig.refreshTokenExpiresIn || '7d',
        bcryptRounds: authConfig.bcryptRounds || 12,
        maxLoginAttempts: authConfig.maxLoginAttempts || 5,
        lockoutDuration: authConfig.lockoutDuration || 15,
        maxSessionsPerUser: authConfig.maxSessionsPerUser || 5
    };
};

// ==================== INTERFACES ====================

interface User {
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

interface Session {
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

interface JwtPayload {
    userId: string;
    username: string;
    role: string;
    sessionId: string;
    type: 'access' | 'refresh';
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Hash a token for secure storage
 */
const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Log audit event
 */
const logAuditEvent = async (
    userId: string | null,
    action: string,
    req: Request,
    details?: any
): Promise<void> => {
    try {
        const sql = getDbClient();
        await sql`
            INSERT INTO auth_audit_log (user_id, action, ip_address, user_agent, details)
            VALUES (${userId}, ${action}, ${getClientIp(req)}, ${req.headers['user-agent'] || null}, ${details ? JSON.stringify(details) : null})
        `;
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
};

/**
 * Parse duration string to milliseconds
 */
const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 3600000;
    }
};

// ==================== AUTH CONTROLLER ====================

export class AuthController {
    private static initialized = false;

    /**
     * Initialize auth system
     */
    static async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await initializeAuthTables();
            await this.ensureDefaultAdmin();
            this.initialized = true;
            console.log('✅ Auth system initialized');
        } catch (error: any) {
            console.error('❌ Failed to initialize auth system:', error.message);
            // Don't throw - allow app to run without DB if not configured
        }
    }

    /**
     * Ensure default admin user exists
     */
    private static async ensureDefaultAdmin(): Promise<void> {
        const sql = getDbClient();
        const config = getAuthConfig();

        const existingAdminResult = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
        const existingAdmin = existingAdminResult.length > 0 ? existingAdminResult[0] as User : null;

        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash('admin123', config.bcryptRounds);
            await sql`
                INSERT INTO users (username, email, password_hash, name, role)
                VALUES ('admin', 'admin@stackdev.cloud', ${passwordHash}, 'Administrator', 'admin')
                ON CONFLICT (username) DO NOTHING
            `;
            console.log('✅ Default admin user created (admin/admin123)');
        }
    }

    /**
     * Clean up expired sessions
     */
    private static async cleanupExpiredSessions(): Promise<void> {
        const sql = getDbClient();
        await sql`
            DELETE FROM sessions 
            WHERE expires_at < CURRENT_TIMESTAMP OR is_valid = false
        `;
    }

    /**
     * Generate tokens
     */
    private static generateTokens(user: User, sessionId: string): {
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
        refreshExpiresAt: Date;
    } {
        const config = getAuthConfig();

        const accessPayload: JwtPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            sessionId,
            type: 'access'
        };

        const refreshPayload: JwtPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            sessionId,
            type: 'refresh'
        };

        const accessExpiresInMs = parseDuration(config.jwtExpiresIn);
        const refreshExpiresInMs = parseDuration(config.refreshTokenExpiresIn);

        const accessToken = jwt.sign(accessPayload, config.jwtSecret, {
            expiresIn: Math.floor(accessExpiresInMs / 1000)
        });

        const refreshToken = jwt.sign(refreshPayload, config.jwtSecret, {
            expiresIn: Math.floor(refreshExpiresInMs / 1000)
        });

        const expiresAt = new Date(Date.now() + accessExpiresInMs);
        const refreshExpiresAt = new Date(Date.now() + refreshExpiresInMs);

        return { accessToken, refreshToken, expiresAt, refreshExpiresAt };
    }

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    static login = async (req: Request, res: Response): Promise<void> => {
        const sql = getDbClient();
        const config = getAuthConfig();

        try {
            const { username, password } = req.body;

            if (!username || !password) {
                sendBadRequest(res, 'Username and password are required.');
                return;
            }

            // Find user - using Neon SQL directly instead of queryOne helper
            const users = await sql`
                SELECT * FROM users 
                WHERE username = ${username} OR email = ${username}
                LIMIT 1
            `;
            const user = users.length > 0 ? users[0] as User : null;

            if (!user) {
                await logAuditEvent(null, 'LOGIN_FAILED_USER_NOT_FOUND', req, { username });
                sendUnauthorized(res, 'Invalid credentials.');
                return;
            }

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
                await logAuditEvent(user.id, 'LOGIN_FAILED_ACCOUNT_LOCKED', req);
                sendUnauthorized(res, `Account is locked. Try again in ${remainingMinutes} minutes.`);
                return;
            }

            // Check if account is active
            if (!user.is_active) {
                await logAuditEvent(user.id, 'LOGIN_FAILED_ACCOUNT_DISABLED', req);
                sendUnauthorized(res, 'Account is disabled.');
                return;
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                // Increment failed attempts
                const newFailedAttempts = user.failed_login_attempts + 1;
                let lockUntil: Date | null = null;

                if (newFailedAttempts >= config.maxLoginAttempts) {
                    lockUntil = new Date(Date.now() + config.lockoutDuration * 60 * 1000);
                }

                await sql`
                    UPDATE users 
                    SET failed_login_attempts = ${newFailedAttempts},
                        locked_until = ${lockUntil}
                    WHERE id = ${user.id}
                `;

                await logAuditEvent(user.id, 'LOGIN_FAILED_INVALID_PASSWORD', req, {
                    failedAttempts: newFailedAttempts
                });

                if (lockUntil) {
                    sendUnauthorized(res, `Too many failed attempts. Account locked for ${config.lockoutDuration} minutes.`);
                } else {
                    sendUnauthorized(res, `Invalid credentials. ${config.maxLoginAttempts - newFailedAttempts} attempts remaining.`);
                }
                return;
            }

            // Clean up expired sessions
            await this.cleanupExpiredSessions();

            // Check max sessions per user
            const userSessions = await query<Session>(
                'SELECT id FROM sessions WHERE user_id = $1 AND is_valid = true ORDER BY created_at ASC',
                [user.id]
            );

            if (userSessions.length >= config.maxSessionsPerUser) {
                // Invalidate oldest session
                await sql`
                    UPDATE sessions SET is_valid = false 
                    WHERE id = ${userSessions[0].id}
                `;
            }

            // Create session
            const sessionId = crypto.randomUUID();
            const { accessToken, refreshToken, expiresAt, refreshExpiresAt } = this.generateTokens(user, sessionId);

            await sql`
                INSERT INTO sessions (id, user_id, token_hash, refresh_token_hash, ip_address, user_agent, expires_at, refresh_expires_at)
                VALUES (
                    ${sessionId},
                    ${user.id},
                    ${hashToken(accessToken)},
                    ${hashToken(refreshToken)},
                    ${getClientIp(req)},
                    ${req.headers['user-agent'] || null},
                    ${expiresAt},
                    ${refreshExpiresAt}
                )
            `;

            // Reset failed attempts and update last login
            await sql`
                UPDATE users 
                SET failed_login_attempts = 0,
                    locked_until = NULL,
                    last_login_at = CURRENT_TIMESTAMP
                WHERE id = ${user.id}
            `;

            await logAuditEvent(user.id, 'LOGIN_SUCCESS', req);

            sendSuccess(res, {
                accessToken,
                refreshToken,
                expiresAt: expiresAt.toISOString(),
                refreshExpiresAt: refreshExpiresAt.toISOString(),
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    role: user.role
                }
            }, 'Login successful');

        } catch (error: any) {
            console.error('Login error:', error);
            sendBadRequest(res, error.message || 'Login failed.');
        }
    };

    /**
     * Logout endpoint
     * POST /api/auth/logout
     */
    static logout = async (req: Request, res: Response): Promise<void> => {
        const sql = getDbClient();

        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                sendBadRequest(res, 'Token is required.');
                return;
            }

            const tokenHash = hashToken(token);

            // Invalidate session
            const result = await sql`
                UPDATE sessions SET is_valid = false 
                WHERE token_hash = ${tokenHash}
                RETURNING user_id
            `;

            if (result.length > 0) {
                await logAuditEvent(result[0].user_id, 'LOGOUT', req);
            }

            sendSuccess(res, null, 'Logout successful');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Logout failed.');
        }
    };

    /**
     * Logout from all devices
     * POST /api/auth/logout-all
     */
    static logoutAll = async (req: Request, res: Response): Promise<void> => {
        const sql = getDbClient();

        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            await sql`
                UPDATE sessions SET is_valid = false 
                WHERE user_id = ${user.id}
            `;

            await logAuditEvent(user.id, 'LOGOUT_ALL_DEVICES', req);

            sendSuccess(res, null, 'Logged out from all devices');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Logout failed.');
        }
    };

    /**
     * Get current user info
     * GET /api/auth/me
     */
    static me = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const sql = getDbClient();
            const fullUserResult = await sql`
                SELECT id, username, email, name, avatar, role, last_login_at, created_at 
                FROM users WHERE id = ${user.id}
            `;
            const fullUser = fullUserResult.length > 0 ? fullUserResult[0] as User : null;

            if (!fullUser) {
                sendUnauthorized(res, 'User not found.');
                return;
            }

            sendSuccess(res, fullUser, 'User info retrieved');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to get user info.');
        }
    };

    /**
     * Refresh token
     * POST /api/auth/refresh
     */
    static refresh = async (req: Request, res: Response): Promise<void> => {
        const sql = getDbClient();
        const config = getAuthConfig();

        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                sendBadRequest(res, 'Refresh token is required.');
                return;
            }

            // Verify refresh token
            let payload: JwtPayload;
            try {
                payload = jwt.verify(refreshToken, config.jwtSecret) as JwtPayload;
            } catch (error) {
                sendUnauthorized(res, 'Invalid or expired refresh token.');
                return;
            }

            if (payload.type !== 'refresh') {
                sendUnauthorized(res, 'Invalid token type.');
                return;
            }

            // Verify session exists and is valid
            const sql = getDbClient();
            const sessionResult = await sql`
                SELECT * FROM sessions 
                WHERE id = ${payload.sessionId} 
                AND refresh_token_hash = ${hashToken(refreshToken)} 
                AND is_valid = true
            `;
            const session = sessionResult.length > 0 ? sessionResult[0] as Session : null;

            if (!session) {
                sendUnauthorized(res, 'Session not found or invalid.');
                return;
            }

            // Get user
            const userResult = await sql`SELECT * FROM users WHERE id = ${payload.userId}`;
            const user = userResult.length > 0 ? userResult[0] as User : null;
            if (!user || !user.is_active) {
                sendUnauthorized(res, 'User not found or disabled.');
                return;
            }

            // Generate new tokens
            const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt, refreshExpiresAt } =
                this.generateTokens(user, session.id);

            // Update session
            await sql`
                UPDATE sessions 
                SET token_hash = ${hashToken(newAccessToken)},
                    refresh_token_hash = ${hashToken(newRefreshToken)},
                    expires_at = ${expiresAt},
                    refresh_expires_at = ${refreshExpiresAt},
                    last_used_at = CURRENT_TIMESTAMP
                WHERE id = ${session.id}
            `;

            await logAuditEvent(user.id, 'TOKEN_REFRESHED', req);

            sendSuccess(res, {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresAt: expiresAt.toISOString(),
                refreshExpiresAt: refreshExpiresAt.toISOString()
            }, 'Token refreshed');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to refresh token.');
        }
    };

    /**
     * Change password
     * POST /api/auth/change-password
     */
    static changePassword = async (req: Request, res: Response): Promise<void> => {
        const sql = getDbClient();
        const config = getAuthConfig();

        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                sendBadRequest(res, 'Current password and new password are required.');
                return;
            }

            if (newPassword.length < 8) {
                sendBadRequest(res, 'New password must be at least 8 characters.');
                return;
            }

            // Password strength validation
            const hasUppercase = /[A-Z]/.test(newPassword);
            const hasLowercase = /[a-z]/.test(newPassword);
            const hasNumber = /[0-9]/.test(newPassword);

            if (!hasUppercase || !hasLowercase || !hasNumber) {
                sendBadRequest(res, 'Password must contain at least one uppercase letter, one lowercase letter, and one number.');
                return;
            }

            // Get full user data
            const sql = getDbClient();
            const fullUserResult = await sql`SELECT * FROM users WHERE id = ${user.id}`;
            const fullUser = fullUserResult.length > 0 ? fullUserResult[0] as User : null;
            if (!fullUser) {
                sendBadRequest(res, 'User not found.');
                return;
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, fullUser.password_hash);
            if (!isValidPassword) {
                await logAuditEvent(user.id, 'PASSWORD_CHANGE_FAILED', req);
                sendBadRequest(res, 'Current password is incorrect.');
                return;
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

            // Update password
            await sql`
                UPDATE users 
                SET password_hash = ${newPasswordHash},
                    password_changed_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${user.id}
            `;

            // Invalidate all sessions except current
            const currentToken = req.headers.authorization?.replace('Bearer ', '');
            if (currentToken) {
                await sql`
                    UPDATE sessions SET is_valid = false 
                    WHERE user_id = ${user.id} AND token_hash != ${hashToken(currentToken)}
                `;
            }

            await logAuditEvent(user.id, 'PASSWORD_CHANGED', req);

            sendSuccess(res, null, 'Password changed successfully');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to change password.');
        }
    };

    /**
     * Get active sessions
     * GET /api/auth/sessions
     */
    static getSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const sessions = await query<Session>(
                `SELECT id, ip_address, user_agent, created_at, last_used_at, expires_at 
                 FROM sessions 
                 WHERE user_id = $1 AND is_valid = true AND expires_at > CURRENT_TIMESTAMP
                 ORDER BY last_used_at DESC`,
                [user.id]
            );

            const currentToken = req.headers.authorization?.replace('Bearer ', '');
            const currentTokenHash = currentToken ? hashToken(currentToken) : null;

            const sessionsWithCurrent = sessions.map(session => ({
                ...session,
                isCurrent: false // We can't easily determine this without storing token hash comparison
            }));

            sendSuccess(res, sessionsWithCurrent, 'Sessions retrieved');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to get sessions.');
        }
    };

    /**
     * Revoke a specific session
     * DELETE /api/auth/sessions/:sessionId
     */
    static revokeSession = async (req: Request, res: Response): Promise<void> => {
        const sql = getDbClient();

        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const { sessionId } = req.params;

            const result = await sql`
                UPDATE sessions SET is_valid = false 
                WHERE id = ${sessionId} AND user_id = ${user.id}
                RETURNING id
            `;

            if (result.length === 0) {
                sendBadRequest(res, 'Session not found.');
                return;
            }

            await logAuditEvent(user.id, 'SESSION_REVOKED', req, { sessionId });

            sendSuccess(res, null, 'Session revoked');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to revoke session.');
        }
    };

    /**
     * Validate token (for middleware use)
     */
    static async validateToken(token: string): Promise<JwtPayload | null> {
        const config = getAuthConfig();

        try {
            const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;

            if (payload.type !== 'access') {
                return null;
            }

            // Verify session is still valid
            const sql = getDbClient();
            const sessionResult = await sql`
                SELECT is_valid FROM sessions 
                WHERE id = ${payload.sessionId} 
                AND token_hash = ${hashToken(token)}
            `;
            const session = sessionResult.length > 0 ? sessionResult[0] as Session : null;

            if (!session || !session.is_valid) {
                return null;
            }

            return payload;

        } catch (error) {
            return null;
        }
    }

    /**
     * Get all users (Admin only)
     */
    static async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const sql = getDbClient();

            const usersResult = await sql`
                SELECT 
                    id, username, email, name, avatar, role, 
                    is_active, last_login_at, created_at, updated_at
                FROM users 
                ORDER BY created_at DESC
            `;

            const users = usersResult.map((user: any) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                is_active: user.is_active,
                last_login_at: user.last_login_at,
                created_at: user.created_at,
                updated_at: user.updated_at
            }));

            await logAuditEvent((req as any).user?.id, 'USERS_LISTED', req);

            sendSuccess(res, users, 'Users retrieved successfully');

        } catch (error: any) {
            console.error('Get all users error:', error);
            sendBadRequest(res, error.message || 'Failed to retrieve users.');
        }
    }

    /**
     * Create new user (Admin only)
     */
    static async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { username, email, name, password, role, is_active } = req.body;

            // Validate required fields
            if (!username || !name || !password) {
                sendBadRequest(res, 'Username, name, and password are required.');
                return;
            }

            // Validate role
            if (role && !['admin', 'user', 'viewer'].includes(role)) {
                sendBadRequest(res, 'Invalid role. Must be admin, user, or viewer.');
                return;
            }

            const config = getAuthConfig();
            const sql = getDbClient();

            // Check if username already exists
            const existingUserResult = await sql`
                SELECT id FROM users WHERE username = ${username}
            `;

            if (existingUserResult.length > 0) {
                sendBadRequest(res, 'Username already exists.');
                return;
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

            // Create user
            const newUserResult = await sql`
                INSERT INTO users (
                    username, email, password_hash, name, role, is_active
                )
                VALUES (
                    ${username},
                    ${email || null},
                    ${passwordHash},
                    ${name},
                    ${role || 'user'},
                    ${is_active !== undefined ? is_active : true}
                )
                RETURNING id, username, email, name, role, is_active, created_at
            `;

            const newUser = newUserResult[0];

            await logAuditEvent((req as any).user?.id, 'USER_CREATED', req, {
                createdUserId: newUser.id,
                username: newUser.username
            });

            sendSuccess(res, newUser, 'User created successfully', 201);

        } catch (error: any) {
            console.error('Create user error:', error);
            sendBadRequest(res, error.message || 'Failed to create user.');
        }
    }

    /**
     * Update user (Admin only)
     */
    static async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { email, name, password, role, is_active } = req.body;

            if (!userId) {
                sendBadRequest(res, 'User ID is required.');
                return;
            }

            // Validate role if provided
            if (role && !['admin', 'user', 'viewer'].includes(role)) {
                sendBadRequest(res, 'Invalid role. Must be admin, user, or viewer.');
                return;
            }

            const config = getAuthConfig();
            const sql = getDbClient();

            // Check if user exists
            const existingUserResult = await sql`
                SELECT id FROM users WHERE id = ${userId}
            `;

            if (existingUserResult.length === 0) {
                sendBadRequest(res, 'User not found.');
                return;
            }

            // Build update query
            const updates: string[] = [];
            const values: any[] = [];

            if (email !== undefined) {
                updates.push(`email = $${values.length + 1}`);
                values.push(email);
            }
            if (name !== undefined) {
                updates.push(`name = $${values.length + 1}`);
                values.push(name);
            }
            if (role !== undefined) {
                updates.push(`role = $${values.length + 1}`);
                values.push(role);
            }
            if (is_active !== undefined) {
                updates.push(`is_active = $${values.length + 1}`);
                values.push(is_active);
            }
            if (password) {
                const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
                updates.push(`password_hash = $${values.length + 1}`);
                values.push(passwordHash);
                updates.push(`password_changed_at = CURRENT_TIMESTAMP`);
            }

            if (updates.length === 0) {
                sendBadRequest(res, 'No fields to update.');
                return;
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            // Execute update
            const queryStr = `
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE id = $${values.length + 1}
                RETURNING id, username, email, name, role, is_active, updated_at
            `;
            values.push(userId);

            let finalQuery = queryStr;
            values.forEach((value, index) => {
                const placeholder = `$${index + 1}`;
                const sqlValue = value === null ? 'NULL' :
                    typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` :
                        String(value);
                finalQuery = finalQuery.replace(placeholder, sqlValue);
            });

            const updatedUserResult = await sql.unsafe(finalQuery);
            // @ts-ignore
            const updatedUser = updatedUserResult[0];

            await logAuditEvent((req as any).user?.id, 'USER_UPDATED', req, {
                updatedUserId: userId,
                changes: req.body
            });

            sendSuccess(res, updatedUser, 'User updated successfully');

        } catch (error: any) {
            console.error('Update user error:', error);
            sendBadRequest(res, error.message || 'Failed to update user.');
        }
    }

    /**
     * Delete user (Admin only)
     */
    static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!userId) {
                sendBadRequest(res, 'User ID is required.');
                return;
            }

            const sql = getDbClient();

            // Check if user exists
            const existingUserResult = await sql`
                SELECT id, username FROM users WHERE id = ${userId}
            `;

            if (existingUserResult.length === 0) {
                sendBadRequest(res, 'User not found.');
                return;
            }

            const userToDelete = existingUserResult[0] as User;

            // Prevent deleting the current user
            if ((req as any).user?.id === userId) {
                sendBadRequest(res, 'You cannot delete your own account.');
                return;
            }

            // Delete user's sessions first
            await sql`DELETE FROM sessions WHERE user_id = ${userId}`;

            // Delete user
            await sql`DELETE FROM users WHERE id = ${userId}`;

            await logAuditEvent((req as any).user?.id, 'USER_DELETED', req, {
                deletedUserId: userId,
                username: userToDelete.username
            });

            sendSuccess(res, null, 'User deleted successfully');

        } catch (error: any) {
            console.error('Delete user error:', error);
            sendBadRequest(res, error.message || 'Failed to delete user.');
        }
    }
}

// Initialize on import (async)
AuthController.initialize().catch(console.error);
