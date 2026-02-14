import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Users table - User accounts with authentication
 */
export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    username: text('username').notNull().unique(),
    email: text('email').unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    avatar: text('avatar'),
    role: text('role', { enum: ['admin', 'user', 'viewer'] }).default('user').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
    lockedUntil: text('locked_until'), // ISO 8601 datetime string
    lastLoginAt: text('last_login_at'), // ISO 8601 datetime string
    passwordChangedAt: text('password_changed_at').default(sql`(datetime('now'))`).notNull(),
    createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull(),
});

/**
 * Sessions table - Active user sessions with JWT tokens
 */
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    refreshTokenHash: text('refresh_token_hash'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    isValid: integer('is_valid', { mode: 'boolean' }).default(true).notNull(),
    expiresAt: text('expires_at').notNull(), // ISO 8601 datetime string
    refreshExpiresAt: text('refresh_expires_at'), // ISO 8601 datetime string
    createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
    lastUsedAt: text('last_used_at').default(sql`(datetime('now'))`).notNull(),
});

/**
 * Auth audit log table - Security audit trail
 */
export const authAuditLog = sqliteTable('auth_audit_log', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    details: text('details'), // JSON string
    createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
});

/**
 * Migrations table - Track executed migrations
 */
export const migrations = sqliteTable('migrations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    executedAt: text('executed_at').default(sql`(datetime('now'))`).notNull(),
    checksum: text('checksum'),
    executionTimeMs: integer('execution_time_ms'),
    status: text('status', { enum: ['success', 'failed', 'pending'] }).default('success').notNull(),
});

/**
 * Files table - Uploaded files metadata
 */
export const files = sqliteTable('files', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    filename: text('filename').notNull(),
    originalFilename: text('original_filename').notNull(),
    path: text('path').notNull(),
    relativePath: text('relative_path').notNull(),
    folderPath: text('folder_path').notNull(),
    size: integer('size').notNull(),
    extension: text('extension').notNull(),
    mimeType: text('mime_type').notNull(),
    createdAt: text('created_at').notNull(),
    modifiedAt: text('modified_at').notNull(),
    uploadedAt: text('uploaded_at').default(sql`(datetime('now'))`).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    tags: text('tags'), // JSON array string
    metadata: text('metadata'), // JSON object string
});

/**
 * Uploads table - Upload tracking
 */
export const uploads = sqliteTable('uploads', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    fileId: text('file_id').references(() => files.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    uploadType: text('upload_type').notNull(), // 'image', 'file', 'document'
    status: text('status', { enum: ['pending', 'completed', 'failed'] }).default('completed').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    uploadedAt: text('uploaded_at').default(sql`(datetime('now'))`).notNull(),
});

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type NewAuthAuditLog = typeof authAuditLog.$inferInsert;

export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
