import { getDbClient } from '../utils/db.js';

/**
 * Migration: Create initial auth tables
 * Created: ${new Date().toISOString()}
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
        const sql = getDbClient();

        console.log('📦 Creating users table...');
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                avatar VARCHAR(500),
                role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
                is_active BOOLEAN DEFAULT true,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP WITH TIME ZONE,
                last_login_at TIMESTAMP WITH TIME ZONE,
                password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('📦 Creating sessions table...');
        await sql`
            CREATE TABLE IF NOT EXISTS sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(255) NOT NULL,
                refresh_token_hash VARCHAR(255),
                ip_address VARCHAR(45),
                user_agent TEXT,
                is_valid BOOLEAN DEFAULT true,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                refresh_expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('📦 Creating auth_audit_log table...');
        await sql`
            CREATE TABLE IF NOT EXISTS auth_audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('📦 Creating indexes...');
        await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON auth_audit_log(action)`;

        console.log('✅ Migration "Create initial auth tables" completed');
    },

    /**
     * Rollback the migration
     */
    async down() {
        const sql = getDbClient();

        console.log('🗑️  Dropping auth_audit_log table...');
        await sql`DROP TABLE IF EXISTS auth_audit_log CASCADE`;

        console.log('🗑️  Dropping sessions table...');
        await sql`DROP TABLE IF EXISTS sessions CASCADE`;

        console.log('🗑️  Dropping users table...');
        await sql`DROP TABLE IF EXISTS users CASCADE`;

        console.log('✅ Migration "Create initial auth tables" rolled back');
    }
};
