import { getSqliteClient } from '../../server/utils/db.js';

/**
 * Migration: Create initial auth tables (SQLite)
 * Created: 2026-02-13T00:00:00.000Z
 * 
 * This migration creates the core authentication tables:
 * - users: User accounts with authentication
 * - sessions: Active user sessions with JWT tokens
 * - auth_audit_log: Security audit trail
 */

export default {
    /**
     * Run the migration
     */
    async up() {
        const db = getSqliteClient();

        console.log('📦 Creating users table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT,
                role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
                is_active INTEGER DEFAULT 1,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TEXT,
                last_login_at TEXT,
                password_changed_at TEXT DEFAULT (datetime('now')),
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);

        console.log('📦 Creating sessions table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash TEXT NOT NULL,
                refresh_token_hash TEXT,
                ip_address TEXT,
                user_agent TEXT,
                is_valid INTEGER DEFAULT 1,
                expires_at TEXT NOT NULL,
                refresh_expires_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                last_used_at TEXT DEFAULT (datetime('now'))
            )
        `);

        console.log('📦 Creating auth_audit_log table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS auth_audit_log (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                action TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                details TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);

        console.log('📦 Creating indexes...');
        db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON auth_audit_log(action)`);

        console.log('✅ Migration "Create initial auth tables" completed');
    },

    /**
     * Rollback the migration
     */
    async down() {
        const db = getSqliteClient();

        console.log('🗑️  Dropping auth_audit_log table...');
        db.exec(`DROP TABLE IF EXISTS auth_audit_log`);

        console.log('🗑️  Dropping sessions table...');
        db.exec(`DROP TABLE IF EXISTS sessions`);

        console.log('🗑️  Dropping users table...');
        db.exec(`DROP TABLE IF EXISTS users`);

        console.log('✅ Migration "Create initial auth tables" rolled back');
    }
};
