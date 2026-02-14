import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';
import * as schema from '../../data/schema/schema.js';

interface DatabaseConfig {
    dbPath: string;
}

/**
 * Get database configuration from env.json
 */
const getDatabaseConfig = (): DatabaseConfig => {
    const envPath = path.join(process.cwd(), 'env.json');

    let dbPath = path.join(process.cwd(), 'src', 'data', 'app.db');

    if (fs.existsSync(envPath)) {
        try {
            const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
            if (envData.database?.dbPath) {
                dbPath = path.join(process.cwd(), envData.database.dbPath);
            }
        } catch (error) {
            console.warn('⚠️  Failed to parse env.json, using default database path');
        }
    }

    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    return { dbPath };
};

// Database instances (lazy initialization)
let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize the database connection
 */
const initializeConnection = () => {
    if (sqlite && db) {
        return { sqlite, db };
    }

    const config = getDatabaseConfig();
    
    // Ensure database directory exists
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    sqlite = new Database(config.dbPath);
    
    // Enable WAL mode for better concurrent performance
    sqlite.pragma('journal_mode = WAL');
    
    // Create Drizzle ORM instance
    db = drizzle(sqlite, { schema });

    return { sqlite, db };
};

/**
 * Get the Drizzle database instance
 */
export const getDbClient = () => {
    const { db } = initializeConnection();
    return db;
};

/**
 * Get the underlying SQLite instance
 */
export const getSqliteClient = (): Database.Database => {
    const { sqlite } = initializeConnection();
    return sqlite;
};

/**
 * Execute a raw SQL query (for backward compatibility)
 */
export const query = async <T = any>(sqlQuery: string, params?: any[]): Promise<T[]> => {
    try {
        const sqlite = getSqliteClient();
        const stmt = sqlite.prepare(sqlQuery);
        const result = params ? stmt.all(...params) : stmt.all();
        return result as T[];
    } catch (error: any) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Execute a single-row query
 */
export const queryOne = async <T = any>(sqlQuery: string, params?: any[]): Promise<T | null> => {
    try {
        const sqlite = getSqliteClient();
        const stmt = sqlite.prepare(sqlQuery);
        const result = params ? stmt.get(...params) : stmt.get();
        return result as T | null;
    } catch (error: any) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Initialize migration table
 */
export const initializeMigrationTable = async (): Promise<void> => {
    try {
        const sqlite = getSqliteClient();
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                executed_at TEXT DEFAULT (datetime('now')),
                checksum TEXT,
                execution_time_ms INTEGER,
                status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending'))
            )
        `);

        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(name)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_migrations_status ON migrations(status)`);

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
    try {
        const result = await queryOne<{ count: number }>(
            `SELECT COUNT(*) as count FROM migrations WHERE name = ? AND status = 'success'`,
            [migrationName]
        );
        return (result?.count ?? 0) > 0;
    } catch (error: any) {
        console.error('Error checking migration:', error.message);
        return false;
    }
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
    try {
        const sqlite = getSqliteClient();
        const stmt = sqlite.prepare(`
            INSERT INTO migrations (name, checksum, execution_time_ms, status) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE 
            SET executed_at = datetime('now'),
                checksum = excluded.checksum,
                execution_time_ms = excluded.execution_time_ms,
                status = excluded.status
        `);
        stmt.run(name, checksum, executionTimeMs, status);
    } catch (error: any) {
        console.error('Error recording migration:', error.message);
        throw error;
    }
};

/**
 * Get all executed migrations
 */
export const getExecutedMigrations = async (): Promise<Array<{
    id: number;
    name: string;
    executed_at: string;
    checksum: string;
    execution_time_ms: number;
    status: string;
}>> => {
    try {
        const results = await query<{
            id: number;
            name: string;
            executed_at: string;
            checksum: string;
            execution_time_ms: number;
            status: string;
        }>(`SELECT * FROM migrations ORDER BY executed_at ASC`);
        return results;
    } catch (error: any) {
        console.error('Error getting migrations:', error.message);
        return [];
    }
};

/**
 * Initialize database tables
 */
export const initializeAuthTables = async (): Promise<void> => {
    try {
        const sqlite = getSqliteClient();
        
        // Initialize migration table first
        await initializeMigrationTable();

        // Create users table
        sqlite.exec(`
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

        // Create sessions table
        sqlite.exec(`
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

        // Create audit log table for security
        sqlite.exec(`
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

        // Create indexes for better performance
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id)`);
        sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON auth_audit_log(action)`);

        console.log('✅ Auth database tables initialized');
    } catch (error: any) {
        console.error('❌ Failed to initialize auth tables:', error.message);
        throw error;
    }
};

/**
 * Close the database connection
 */
export const closeDatabase = (): void => {
    if (sqlite) {
        sqlite.close();
        sqlite = null;
        db = null;
    }
};

// Export the db instance getter for use with Drizzle ORM
export default getDbClient;
