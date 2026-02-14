import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { SessionController } from '../controllers/session.controller.js';
import { UsersController } from '../controllers/users.controller.js';
import { jwtAuthMiddleware, adminOnlyMiddleware } from '../middlewares/auth.js';
import { authRateLimiter, loginRateLimiter } from '../middlewares/rate-limit.js';

const router = express.Router();

/**
 * Login endpoint
 * 
 * @method POST /api/auth/login
 * @body { username: string, password: string }
 * @returns { accessToken, refreshToken, expiresAt, refreshExpiresAt, user }
 * 
 * @security
 * - Rate limited to 5 attempts per 15 minutes
 * - Account lockout after 5 failed attempts
 * - Bcrypt password hashing (12 rounds)
 * - JWT tokens with expiration
 */
router.post('/login', loginRateLimiter, AuthController.login);

/**
 * Logout endpoint
 * 
 * @method POST /api/auth/logout
 * @header Authorization: Bearer <accessToken>
 */
router.post('/logout', AuthController.logout);

/**
 * Logout from all devices
 * 
 * @method POST /api/auth/logout-all
 * @header Authorization: Bearer <accessToken>
 */
router.post('/logout-all', jwtAuthMiddleware, AuthController.logoutAll);

/**
 * Get current user info
 * 
 * @method GET /api/auth/me
 * @header Authorization: Bearer <accessToken>
 * @returns { id, username, email, name, avatar, role, last_login_at, created_at }
 */
router.get('/me', jwtAuthMiddleware, AuthController.me);

/**
 * Refresh access token
 * 
 * @method POST /api/auth/refresh
 * @body { refreshToken: string }
 * @returns { accessToken, refreshToken, expiresAt, refreshExpiresAt }
 */
router.post('/refresh', authRateLimiter, AuthController.refresh);

/**
 * Change password
 * 
 * @method POST /api/auth/change-password
 * @header Authorization: Bearer <accessToken>
 * @body { currentPassword: string, newPassword: string }
 * 
 * @security
 * - Password must be at least 8 characters
 * - Must contain uppercase, lowercase, and number
 * - Invalidates all other sessions after change
 */
router.post('/change-password', jwtAuthMiddleware, AuthController.changePassword);

/**
 * Get active sessions
 * 
 * @method GET /api/auth/sessions
 * @header Authorization: Bearer <accessToken>
 * @returns Array of sessions with { id, ip_address, user_agent, created_at, last_used_at, expires_at }
 */
router.get('/sessions', jwtAuthMiddleware, SessionController.getSessions);

/**
 * Revoke a specific session
 * 
 * @method DELETE /api/auth/sessions/:sessionId
 * @header Authorization: Bearer <accessToken>
 */
router.delete('/sessions/:sessionId', jwtAuthMiddleware, SessionController.revokeSession);

/**
 * Get all users (admin only)
 * 
 * @method GET /api/auth/users
 * @header Authorization: Bearer <accessToken>
 * @returns Array of users
 */
router.get('/users', jwtAuthMiddleware, adminOnlyMiddleware, UsersController.getAllUsers);

/**
 * Create new user (admin only)
 * 
 * @method POST /api/auth/users
 * @header Authorization: Bearer <accessToken>
 * @body { username, email, name, password, role, is_active }
 */
router.post('/users', jwtAuthMiddleware, adminOnlyMiddleware, UsersController.createUser);

/**
 * Update user (admin only)
 * 
 * @method PUT /api/auth/users/:userId
 * @header Authorization: Bearer <accessToken>
 * @body { email, name, password, role, is_active }
 */
router.put('/users/:userId', jwtAuthMiddleware, adminOnlyMiddleware, UsersController.updateUser);

/**
 * Delete user (admin only)
 * 
 * @method DELETE /api/auth/users/:userId
 * @header Authorization: Bearer <accessToken>
 */
router.delete('/users/:userId', jwtAuthMiddleware, adminOnlyMiddleware, UsersController.deleteUser);

export default router;
