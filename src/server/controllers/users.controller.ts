import { Request, Response } from 'express';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { sendBadRequest, sendSuccess, sendUnauthorized } from '../utils/response.js';
import { query, queryOne, getSqliteClient } from '../utils/db.js';
import { User } from '../types/user.js';
import { getAuthConfig, logAuditEvent } from '../utils/auth.js';
import { UploadController } from './upload.controller.js';

export class UsersController {
    /**
     * Get all users (Admin only)
     */
    static async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const usersResult = await query<User>(
                `SELECT
                    id, username, email, name, avatar, role,
                    is_active, last_login_at, created_at, updated_at
                FROM users
                ORDER BY created_at DESC`
            );

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

            // Check if username already exists
            const existingUser = await queryOne<User>(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUser) {
                sendBadRequest(res, 'Username already exists.');
                return;
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

            // Create user
            const userId = crypto.randomUUID();
            const sqlite = getSqliteClient();
            const stmt = sqlite.prepare(`
                INSERT INTO users (
                    id, username, email, password_hash, name, role, is_active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                userId,
                username,
                email || null,
                passwordHash,
                name,
                role || 'user',
                is_active !== undefined ? (is_active ? 1 : 0) : 1
            );

            // Fetch the created user
            const newUser = await queryOne<User>(
                'SELECT id, username, email, name, role, is_active, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (!newUser) {
                sendBadRequest(res, 'Failed to create user.');
                return;
            }

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

            // Check if user exists
            const existingUser = await queryOne<User>(
                'SELECT id FROM users WHERE id = ?',
                [userId]
            );

            if (!existingUser) {
                sendBadRequest(res, 'User not found.');
                return;
            }

            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];

            if (email !== undefined) {
                updates.push('email = ?');
                values.push(email);
            }
            if (name !== undefined) {
                updates.push('name = ?');
                values.push(name);
            }
            if (role !== undefined) {
                updates.push('role = ?');
                values.push(role);
            }
            if (is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(is_active ? 1 : 0);
            }
            if (password) {
                const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
                updates.push('password_hash = ?');
                values.push(passwordHash);
                updates.push(`password_changed_at = datetime('now')`);
            }

            if (updates.length === 0) {
                sendBadRequest(res, 'No fields to update.');
                return;
            }

            updates.push(`updated_at = datetime('now')`);
            values.push(userId);

            // Execute update
            const sqlite = getSqliteClient();
            const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            const stmt = sqlite.prepare(queryStr);
            stmt.run(...values);

            // Fetch updated user
            const updatedUser = await queryOne<User>(
                'SELECT id, username, email, name, role, is_active, updated_at FROM users WHERE id = ?',
                [userId]
            );

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

            // Check if user exists
            const existingUser = await queryOne<User>(
                'SELECT id, username FROM users WHERE id = ?',
                [userId]
            );

            if (!existingUser) {
                sendBadRequest(res, 'User not found.');
                return;
            }

            // Prevent deleting the current user
            if ((req as any).user?.id === userId) {
                sendBadRequest(res, 'You cannot delete your own account.');
                return;
            }

            // Delete user's sessions first
            const sqlite = getSqliteClient();
            const deleteSessionsStmt = sqlite.prepare('DELETE FROM sessions WHERE user_id = ?');
            deleteSessionsStmt.run(userId);

            // Delete user
            const deleteUserStmt = sqlite.prepare('DELETE FROM users WHERE id = ?');
            deleteUserStmt.run(userId);

            await logAuditEvent((req as any).user?.id, 'USER_DELETED', req, {
                deletedUserId: userId,
                username: existingUser.username
            });

            sendSuccess(res, null, 'User deleted successfully');

        } catch (error: any) {
            console.error('Delete user error:', error);
            sendBadRequest(res, error.message || 'Failed to delete user.');
        }
    }

    /**
     * Upload user avatar
     */
    static async uploadAvatar(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const storage = 'avatars';
            const upload = multer({
                storage: UploadController.storage(storage),
                limits: {
                    fileSize: 5 * 1024 * 1024 // 5MB limit
                },
                fileFilter: (req, file, cb) => {
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (allowedTypes.includes(file.mimetype)) {
                        cb(null, true);
                    } else {
                        cb(new Error('Invalid file type. Only JPG, PNG and WebP are allowed.'));
                    }
                }
            }).single('avatar');

            upload(req, res, async (err: any) => {
                if (err instanceof multer.MulterError) {
                    sendBadRequest(res, `Upload error: ${err.message}`);
                    return;
                } else if (err) {
                    sendBadRequest(res, err.message);
                    return;
                }

                if (!req.file) {
                    sendBadRequest(res, 'No file uploaded.');
                    return;
                }

                const avatarUrl = `/api/image/${req.file.filename}`;

                // Update user avatar in database
                const sqlite = getSqliteClient();
                const stmt = sqlite.prepare('UPDATE users SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?');
                stmt.run(avatarUrl, user.id);

                await logAuditEvent(user.id, 'USER_AVATAR_UPLOADED', req, {
                    avatarUrl
                });

                sendSuccess(res, { avatarUrl }, 'Avatar uploaded successfully');
            });

        } catch (error: any) {
            console.error('Upload avatar error:', error);
            sendBadRequest(res, error.message || 'Failed to upload avatar.');
        }
    }
}
