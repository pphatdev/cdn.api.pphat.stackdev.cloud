import { Request, Response } from 'express';
import { sendSuccess, sendBadRequest, sendUnauthorized } from '../utils/response.js';
import { query, queryOne, initializeAuthTables, getSqliteClient } from '../utils/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload, Session, User } from '../types/user.js';
import { getAuthConfig, getClientIp, hashToken, logAuditEvent, parseDuration } from '../utils/auth.js';

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
        const config = getAuthConfig();

        const existingAdmin = await queryOne<User>(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);

        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash('admin123', config.bcryptRounds);
            const sqlite = getSqliteClient();
            const stmt = sqlite.prepare(`
                INSERT INTO users (id, username, email, password_hash, name, role)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (username) DO NOTHING
            `);
            stmt.run(crypto.randomUUID(), 'admin', 'admin@stackdev.cloud', passwordHash, 'Administrator', 'admin');
            console.log('✅ Default admin user created (admin/admin123)');
        }
    }

    /**
     * Clean up expired sessions
     */
    private static async cleanupExpiredSessions(): Promise<void> {
        const sqlite = getSqliteClient();
        const stmt = sqlite.prepare(`
            DELETE FROM sessions 
            WHERE expires_at < datetime('now') OR is_valid = 0
        `);
        stmt.run();
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
        const config = getAuthConfig();

        try {
            const { username, password } = req.body;

            if (!username || !password) {
                sendBadRequest(res, 'Username and password are required.');
                return;
            }

            // Find user
            const user = await queryOne<User>(
                `SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1`,
                [username, username]
            );

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
                let lockUntil: string | null = null;

                if (newFailedAttempts >= config.maxLoginAttempts) {
                    lockUntil = new Date(Date.now() + config.lockoutDuration * 60 * 1000).toISOString();
                }

                const sqlite = getSqliteClient();
                const stmt = sqlite.prepare(`
                    UPDATE users 
                    SET failed_login_attempts = ?,
                        locked_until = ?
                    WHERE id = ?
                `);
                stmt.run(newFailedAttempts, lockUntil, user.id);

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
                'SELECT id FROM sessions WHERE user_id = ? AND is_valid = 1 ORDER BY created_at ASC',
                [user.id]
            );

            if (userSessions.length >= config.maxSessionsPerUser) {
                // Invalidate oldest session
                const sqlite = getSqliteClient();
                const stmt = sqlite.prepare('UPDATE sessions SET is_valid = 0 WHERE id = ?');
                stmt.run(userSessions[0].id);
            }

            // Create session
            const sessionId = crypto.randomUUID();
            const { accessToken, refreshToken, expiresAt, refreshExpiresAt } = this.generateTokens(user, sessionId);

            const sqlite = getSqliteClient();
            const insertStmt = sqlite.prepare(`
                INSERT INTO sessions (id, user_id, token_hash, refresh_token_hash, ip_address, user_agent, expires_at, refresh_expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insertStmt.run(
                sessionId,
                user.id,
                hashToken(accessToken),
                hashToken(refreshToken),
                getClientIp(req),
                req.headers['user-agent'] || null,
                expiresAt.toISOString(),
                refreshExpiresAt.toISOString()
            );

            // Reset failed attempts and update last login
            const updateStmt = sqlite.prepare(`
                UPDATE users
                SET failed_login_attempts = 0,
                    locked_until = NULL,
                    last_login_at = datetime('now')
                WHERE id = ?
            `);
            updateStmt.run(user.id);

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
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                sendBadRequest(res, 'Token is required.');
                return;
            }

            const tokenHash = hashToken(token);

            // Get user_id first
            const session = await queryOne<{ user_id: string }>(
                'SELECT user_id FROM sessions WHERE token_hash = ?',
                [tokenHash]
            );

            // Invalidate session
            const sqlite = getSqliteClient();
            const stmt = sqlite.prepare('UPDATE sessions SET is_valid = 0 WHERE token_hash = ?');
            stmt.run(tokenHash);

            if (session) {
                await logAuditEvent(session.user_id, 'LOGOUT', req);
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
        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const sqlite = getSqliteClient();
            const stmt = sqlite.prepare('UPDATE sessions SET is_valid = 0 WHERE user_id = ?');
            stmt.run(user.id);

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

            const fullUser = await queryOne<User>(
                `SELECT id, username, email, name, avatar, role, last_login_at, created_at 
                FROM users WHERE id = ?`,
                [user.id]
            );

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
            const session = await queryOne<Session>(
                `SELECT * FROM sessions
                WHERE id = ? AND refresh_token_hash = ? AND is_valid = 1`,
                [payload.sessionId, hashToken(refreshToken)]
            );

            if (!session) {
                sendUnauthorized(res, 'Session not found or invalid.');
                return;
            }

            // Get user
            const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [payload.userId]);
            if (!user || !user.is_active) {
                sendUnauthorized(res, 'User not found or disabled.');
                return;
            }

            // Generate new tokens
            const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt, refreshExpiresAt } =
                this.generateTokens(user, session.id);

            // Update session
            const sqlite = getSqliteClient();
            const stmt = sqlite.prepare(`
                UPDATE sessions 
                SET token_hash = ?,
                    refresh_token_hash = ?,
                    expires_at = ?,
                    refresh_expires_at = ?,
                    last_used_at = datetime('now')
                WHERE id = ?
            `);
            stmt.run(
                hashToken(newAccessToken),
                hashToken(newRefreshToken),
                expiresAt.toISOString(),
                refreshExpiresAt.toISOString(),
                session.id
            );

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
            const fullUser = await queryOne<User>('SELECT * FROM users WHERE id = ?', [user.id]);
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
            const sqlite = getSqliteClient();
            const updateStmt = sqlite.prepare(`
                UPDATE users
                SET password_hash = ?,
                    password_changed_at = datetime('now'),
                    updated_at = datetime('now')
                WHERE id = ?
            `);
            updateStmt.run(newPasswordHash, user.id);

            // Invalidate all sessions except current
            const currentToken = req.headers.authorization?.replace('Bearer ', '');
            if (currentToken) {
                const sessionStmt = sqlite.prepare(
                    'UPDATE sessions SET is_valid = 0 WHERE user_id = ? AND token_hash != ?'
                );
                sessionStmt.run(user.id, hashToken(currentToken));
            }

            await logAuditEvent(user.id, 'PASSWORD_CHANGED', req);

            sendSuccess(res, null, 'Password changed successfully');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to change password.');
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
            const session = await queryOne<{ is_valid: number }>(
                `SELECT is_valid FROM sessions WHERE id = ? AND token_hash = ?`,
                [payload.sessionId, hashToken(token)]
            );

            if (!session || !session.is_valid) {
                return null;
            }

            return payload;

        } catch (error) {
            return null;
        }
    }
}

// Initialize on import (async)
AuthController.initialize().catch(console.error);
