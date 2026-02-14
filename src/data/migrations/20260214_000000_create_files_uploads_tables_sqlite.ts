import { getSqliteClient } from '../../server/utils/db.js';

/**
 * Migration: Create files and uploads tables (SQLite)
 * Created: 2026-02-14T00:00:00.000Z
 * 
 * This migration creates tables for file management:
 * - files: File metadata and information
 * - uploads: Upload tracking
 */

export default {
    /**
     * Run the migration
     */
    async up() {
        const db = getSqliteClient();

        console.log('📦 Creating files table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                path TEXT NOT NULL,
                relative_path TEXT NOT NULL,
                folder_path TEXT NOT NULL,
                size INTEGER NOT NULL,
                extension TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                modified_at TEXT NOT NULL,
                uploaded_at TEXT DEFAULT (datetime('now')),
                user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                tags TEXT,
                metadata TEXT
            )
        `);

        console.log('📦 Creating uploads table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS uploads (
                id TEXT PRIMARY KEY,
                file_id TEXT REFERENCES files(id) ON DELETE CASCADE,
                user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                upload_type TEXT NOT NULL,
                status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
                ip_address TEXT,
                user_agent TEXT,
                uploaded_at TEXT DEFAULT (datetime('now'))
            )
        `);

        console.log('📦 Creating indexes...');
        db.exec(`CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_uploads_file_id ON uploads(file_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status)`);

        console.log('✅ Migration "Create files and uploads tables" completed');
    },

    /**
     * Rollback the migration
     */
    async down() {
        const db = getSqliteClient();

        console.log('🗑️  Dropping uploads table...');
        db.exec(`DROP TABLE IF EXISTS uploads`);

        console.log('🗑️  Dropping files table...');
        db.exec(`DROP TABLE IF EXISTS files`);

        console.log('✅ Migration "Create files and uploads tables" rolled back');
    }
};
