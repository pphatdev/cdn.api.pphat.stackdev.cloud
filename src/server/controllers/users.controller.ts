import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { sendBadRequest, sendSuccess } from '../utils/response.js';
import { getDbClient } from '../utils/db.js';
import { User } from '../types/user.js';
import { getAuthConfig, logAuditEvent } from '../utils/auth.js';

export class UsersController {
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
