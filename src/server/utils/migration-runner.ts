import { getDbClient, initializeMigrationTable, hasMigrationRun, recordMigration, getExecutedMigrations } from './db.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pathToFileURL } from 'url';

export interface Migration {
    name: string;
    up: () => Promise<void>;
    down?: () => Promise<void>;
}

/**
 * Generate checksum for migration content
 */
const generateChecksum = (content: string): string => {
    return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Get all migration files from the migrations directory
 */
export const getMigrationFiles = async (migrationsDir: string): Promise<string[]> => {
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        console.log(`✅ Created migrations directory: ${migrationsDir}`);
        return [];
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort(); // Sort by filename (timestamp prefix ensures correct order)

    return files;
};

/**
 * Load a migration module
 */
const loadMigration = async (filePath: string): Promise<Migration> => {
    try {
        // Convert Windows path to file:// URL for ESM import
        const fileUrl = pathToFileURL(filePath).href;
        const migration = await import(fileUrl);
        return migration.default || migration;
    } catch (error: any) {
        throw new Error(`Failed to load migration ${filePath}: ${error.message}`);
    }
};

/**
 * Run all pending migrations
 */
export const runMigrations = async (migrationsDir: string): Promise<void> => {
    console.log('🔄 Starting migration process...');

    // Initialize migration table
    await initializeMigrationTable();

    // Get all migration files
    const migrationFiles = await getMigrationFiles(migrationsDir);

    if (migrationFiles.length === 0) {
        console.log('ℹ️  No migration files found');
        return;
    }

    console.log(`📁 Found ${migrationFiles.length} migration file(s)`);

    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations();
    const executedNames = new Set(
        executedMigrations
            .filter(m => m.status === 'success')
            .map(m => m.name)
    );

    let executedCount = 0;
    let skippedCount = 0;

    // Run each migration
    for (const file of migrationFiles) {
        const migrationName = file.replace(/\.(ts|js)$/, '');

        // Skip if already executed
        if (executedNames.has(migrationName)) {
            console.log(`⏭️  Skipping ${migrationName} (already executed)`);
            skippedCount++;
            continue;
        }

        const filePath = path.join(migrationsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const checksum = generateChecksum(fileContent);

        console.log(`⚡ Running migration: ${migrationName}`);

        const startTime = Date.now();

        try {
            const migration = await loadMigration(filePath);

            if (typeof migration.up !== 'function') {
                throw new Error(`Migration ${migrationName} does not export an 'up' function`);
            }

            // Run the migration
            await migration.up();

            const executionTime = Date.now() - startTime;

            // Record successful migration
            await recordMigration(migrationName, checksum, executionTime, 'success');

            console.log(`✅ Successfully executed ${migrationName} (${executionTime}ms)`);
            executedCount++;

        } catch (error: any) {
            const executionTime = Date.now() - startTime;

            // Record failed migration
            await recordMigration(migrationName, checksum, executionTime, 'failed');

            console.error(`❌ Migration ${migrationName} failed:`, error.message);
            throw new Error(`Migration failed: ${migrationName}. Error: ${error.message}`);
        }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Executed: ${executedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${migrationFiles.length}`);
};

/**
 * Rollback the last migration (if down function is provided)
 */
export const rollbackLastMigration = async (migrationsDir: string): Promise<void> => {
    console.log('🔄 Rolling back last migration...');

    const executedMigrations = await getExecutedMigrations();

    if (executedMigrations.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migrationName = lastMigration.name;

    console.log(`⚡ Rolling back: ${migrationName}`);

    // Find migration file
    const migrationFiles = await getMigrationFiles(migrationsDir);
    const migrationFile = migrationFiles.find(f => f.startsWith(migrationName));

    if (!migrationFile) {
        throw new Error(`Migration file not found for: ${migrationName}`);
    }

    const filePath = path.join(migrationsDir, migrationFile);
    const migration = await loadMigration(filePath);

    if (!migration.down || typeof migration.down !== 'function') {
        throw new Error(`Migration ${migrationName} does not have a 'down' function`);
    }

    try {
        // Run the rollback
        await migration.down();

        // Delete the migration record
        const sql = getDbClient();
        await sql`DELETE FROM migrations WHERE name = ${migrationName}`;

        console.log(`✅ Successfully rolled back ${migrationName}`);
    } catch (error: any) {
        console.error(`❌ Rollback failed:`, error.message);
        throw error;
    }
};

/**
 * Get migration status
 */
export const getMigrationStatus = async (migrationsDir: string): Promise<void> => {
    console.log('📊 Migration Status:\n');

    await initializeMigrationTable();

    const migrationFiles = await getMigrationFiles(migrationsDir);
    const executedMigrations = await getExecutedMigrations();
    const executedMap = new Map(executedMigrations.map(m => [m.name, m]));

    if (migrationFiles.length === 0) {
        console.log('ℹ️  No migration files found\n');
        return;
    }

    console.log('Migration Files:');
    console.log('─'.repeat(80));

    for (const file of migrationFiles) {
        const migrationName = file.replace(/\.(ts|js)$/, '');
        const executed = executedMap.get(migrationName);

        if (executed) {
            const status = executed.status === 'success' ? '✅' : '❌';
            const time = new Date(executed.executed_at).toLocaleString();
            const duration = `${executed.execution_time_ms}ms`;
            console.log(`${status} ${migrationName}`);
            console.log(`   Executed: ${time} (${duration})`);
        } else {
            console.log(`⏸️  ${migrationName} (pending)`);
        }
    }

    console.log('─'.repeat(80));
    console.log(`Total: ${migrationFiles.length} | Executed: ${executedMigrations.length} | Pending: ${migrationFiles.length - executedMigrations.length}\n`);
};

/**
 * Create a new migration file
 */
export const createMigration = (migrationsDir: string, name: string): string => {
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
    const fileName = `${timestamp}_${name.replace(/\s+/g, '_')}.ts`;
    const filePath = path.join(migrationsDir, fileName);

    // Migration template
    const template = `import { getDbClient } from '../utils/neon-db.js';

/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

export default {
    /**
     * Run the migration
     */
    async up() {
        const sql = getDbClient();

        // TODO: Write your migration logic here
        // Example:
        // await sql\`
        //     CREATE TABLE example (
        //         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        //         name VARCHAR(255) NOT NULL,
        //         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        //     )
        // \`;

        console.log('✅ Migration ${name} completed');
    },

    /**
     * Rollback the migration (optional)
     */
    async down() {
        const sql = getDbClient();

        // TODO: Write your rollback logic here
        // Example:
        // await sql\`DROP TABLE IF EXISTS example\`;

        console.log('✅ Migration ${name} rolled back');
    }
};
`;

    fs.writeFileSync(filePath, template);
    console.log(`✅ Created migration: ${fileName}`);
    
    return filePath;
};

export default {
    runMigrations,
    rollbackLastMigration,
    getMigrationStatus,
    createMigration,
    getMigrationFiles
};
