import { neon, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configure Neon for better performance
// neonConfig.fetchConnectionCache = true;

interface DatabaseConfig {
    connectionString: string;
}

/**
 * Get database configuration from env.json
 */
const getDatabaseConfig = (): DatabaseConfig => {
    const envPath = path.join(process.cwd(), 'env.json');

    if (!fs.existsSync(envPath)) {
        throw new Error('env.json not found. Please create it with your Neon database connection string.');
    }

    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8'));

    if (!envData.database?.connectionString) {
        throw new Error('Database connection string not found in env.json. Add "database": { "connectionString": "your-neon-connection-string" }');
    }

    return {
        connectionString: envData.database.connectionString
    };
};

/**
 * Create a SQL query function connected to Neon PostgreSQL
 */
export const getDbClient = () => {
    const config = getDatabaseConfig();
    return neon(config.connectionString);
};

/**
 * Execute a SQL query
 */
export const query = async <T = any>(sqlQuery: string, params?: any[]): Promise<T[]> => {
    const client = getDbClient();
    try {
        // Build parameterized query
        let finalQuery = sqlQuery;
        if (params && params.length > 0) {
            params.forEach((param, index) => {
                const placeholder = `$${index + 1}`;
                const value = param === null ? 'NULL' :
                    typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` :
                        typeof param === 'object' && param instanceof Date ? `'${param.toISOString()}'` :
                            String(param);
                finalQuery = finalQuery.replace(placeholder, value);
            });
        }
        const result = await client.unsafe(finalQuery);
        return result as unknown as T[];
    } catch (error: any) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Execute a single-row query
 */
export const queryOne = async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
    const results = await query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
};

/**
 * Initialize migration table
 */
export const initializeMigrationTable = async (): Promise<void> => {
    const sql = getDbClient();

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64),
                execution_time_ms INTEGER,
                status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending'))
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(name)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_migrations_status ON migrations(status)`;

        console.log('✅ Migration table initialized');
    } catch (error: any) {
        console.error('❌ Failed to initialize migration table:', error.message);
        throw error;
    }
};

/**
 * Check if a migration has been executed
 */
export const hasMigrationRun = async (migrationName: string): Promise<boolean> => {
    const sql = getDbClient();
    const result = await sql`
        SELECT EXISTS(
            SELECT 1 FROM migrations 
            WHERE name = ${migrationName} 
            AND status = 'success'
        ) as exists
    `;
    return result[0]?.exists || false;
};

/**
 * Record a migration execution
 */
export const recordMigration = async (
    name: string,
    checksum: string,
    executionTimeMs: number,
    status: 'success' | 'failed' = 'success'
): Promise<void> => {
    const sql = getDbClient();
    await sql`
        INSERT INTO migrations (name, checksum, execution_time_ms, status) 
        VALUES (${name}, ${checksum}, ${executionTimeMs}, ${status})
        ON CONFLICT (name) DO UPDATE 
        SET executed_at = CURRENT_TIMESTAMP,
            checksum = EXCLUDED.checksum,
            execution_time_ms = EXCLUDED.execution_time_ms,
            status = EXCLUDED.status
    `;
};

/**
 * Get all executed migrations
 */
export const getExecutedMigrations = async (): Promise<Array<{
    id: number;
    name: string;
    executed_at: Date;
    checksum: string;
    execution_time_ms: number;
    status: string;
}>> => {
    const sql = getDbClient();
    const result = await sql`SELECT * FROM migrations ORDER BY executed_at ASC`;
    return result as any[];
};

/**
 * Initialize database tables
 */
export const initializeAuthTables = async (): Promise<void> => {
    const sql = getDbClient();

    try {
        // Initialize migration table first
        await initializeMigrationTable();

        // Create users table
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

        // Create sessions table
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

        // Create audit log table for security
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

        // Create indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON auth_audit_log(action)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

        console.log('✅ Auth database tables initialized');
    } catch (error: any) {
        console.error('❌ Failed to initialize auth tables:', error.message);
        throw error;
    }
};

export default {
    query,
    queryOne,
    getDbClient,
    initializeAuthTables,
    initializeMigrationTable,
    hasMigrationRun,
    recordMigration,
    getExecutedMigrations
};
