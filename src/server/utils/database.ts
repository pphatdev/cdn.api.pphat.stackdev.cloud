import fs from 'fs';
import path from 'path';
import { and, eq, inArray, like, or } from 'drizzle-orm';
import { getDbClient, getSqliteClient } from './db.js';
import { files as filesTable } from '../../data/schema/schema.js';

interface FileRecord {
    id: string;
    filename: string;
    originalFilename: string;
    path: string;
    relativePath: string;
    folderPath: string;
    size: number;
    extension: string;
    mimeType: string;
    createdAt: string;
    modifiedAt: string;
    uploadedAt: string;
    tags?: string[];
    metadata?: any;
}

export class Database {
    private static initialized = false;

    /**
     * Initialize the database
     */
    static async initialize(): Promise<void> {
        try {
            if (this.initialized) {
                return;
            }

            const sqlite = getSqliteClient();
            sqlite.exec(`
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

            sqlite.exec(`
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

            sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename)`);
            sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension)`);
            sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)`);
            sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at)`);

            this.initialized = true;
        } catch (error: any) {
            console.error('Error initializing database:', error.message);
            throw error;
        }
    }

    private static serializeTags(tags?: string[] | null): string | null {
        if (!tags || tags.length === 0) {
            return null;
        }
        return JSON.stringify(tags);
    }

    private static serializeMetadata(metadata?: any): string | null {
        if (metadata === undefined || metadata === null) {
            return null;
        }
        return JSON.stringify(metadata);
    }

    private static parseJsonField<T>(value?: string | null): T | undefined {
        if (!value) {
            return undefined;
        }
        try {
            return JSON.parse(value) as T;
        } catch {
            return undefined;
        }
    }

    private static normalizeRecord(row: any): FileRecord {
        return {
            id: row.id,
            filename: row.filename,
            originalFilename: row.originalFilename,
            path: row.path,
            relativePath: row.relativePath,
            folderPath: row.folderPath,
            size: row.size,
            extension: row.extension,
            mimeType: row.mimeType,
            createdAt: row.createdAt,
            modifiedAt: row.modifiedAt,
            uploadedAt: row.uploadedAt,
            tags: this.parseJsonField<string[]>(row.tags),
            metadata: this.parseJsonField<any>(row.metadata)
        };
    }

    private static getDb() {
        return getDbClient();
    }

    /**
     * Add a file record to the database
     */
    static async addFile(fileData: Omit<FileRecord, 'id'>): Promise<FileRecord> {
        await this.initialize();

        const db = this.getDb();

        // Check if file already exists
        const existing = await db
            .select()
            .from(filesTable)
            .where(and(eq(filesTable.filename, fileData.filename), eq(filesTable.folderPath, fileData.folderPath)))
            .limit(1);

        if (existing.length > 0) {
            console.log('File already exists, updating record:', fileData.filename);
            const updated = await this.updateFile(existing[0].id, fileData);
            return updated || this.normalizeRecord(existing[0]);
        }

        const id = this.generateId();
        await db.insert(filesTable).values({
            id,
            filename: fileData.filename,
            originalFilename: fileData.originalFilename,
            path: fileData.path,
            relativePath: fileData.relativePath,
            folderPath: fileData.folderPath,
            size: fileData.size,
            extension: fileData.extension,
            mimeType: fileData.mimeType,
            createdAt: fileData.createdAt,
            modifiedAt: fileData.modifiedAt,
            uploadedAt: fileData.uploadedAt,
            tags: this.serializeTags(fileData.tags) || undefined,
            metadata: this.serializeMetadata(fileData.metadata) || undefined
        });

        return {
            id,
            ...fileData
        };
    }

    /**
     * Get file by filename
     */
    static async getFileByName(filename: string): Promise<FileRecord | null> {
        await this.initialize();

        const db = this.getDb();
        const results = await db
            .select()
            .from(filesTable)
            .where(or(eq(filesTable.filename, filename), eq(filesTable.originalFilename, filename)))
            .limit(1);

        if (results.length === 0) {
            return null;
        }

        return this.normalizeRecord(results[0]);
    }

    /**
     * Get file by ID
     */
    static async getFileById(id: string): Promise<FileRecord | null> {
        await this.initialize();

        const db = this.getDb();
        const results = await db
            .select()
            .from(filesTable)
            .where(eq(filesTable.id, id))
            .limit(1);

        if (results.length === 0) {
            return null;
        }

        return this.normalizeRecord(results[0]);
    }

    /**
     * Get all files
     */
    static async getAllFiles(): Promise<FileRecord[]> {
        await this.initialize();

        const db = this.getDb();
        const results = await db.select().from(filesTable);
        return results.map((row) => this.normalizeRecord(row));
    }

    /**
     * Search files by query
     */
    static async searchFiles(query: string, type?: string): Promise<FileRecord[]> {
        await this.initialize();

        const db = this.getDb();
        const searchLike = `%${query}%`;

        const baseFilter = or(
            like(filesTable.filename, searchLike),
            like(filesTable.originalFilename, searchLike),
            like(filesTable.path, searchLike)
        );

        let typeFilter;
        if (type) {
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
            const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];

            if (type === 'image') {
                typeFilter = inArray(filesTable.extension, imageExtensions);
            } else if (type === 'office') {
                typeFilter = inArray(filesTable.extension, officeExtensions);
            } else {
                typeFilter = eq(filesTable.extension, type.toLowerCase());
            }
        }

        const whereClause = typeFilter ? and(baseFilter, typeFilter) : baseFilter;
        const results = await db.select().from(filesTable).where(whereClause);
        return results.map((row) => this.normalizeRecord(row));
    }

    /**
     * Get files by folder path
     */
    static async getFilesByFolder(folderPath: string): Promise<FileRecord[]> {
        await this.initialize();

        const db = this.getDb();
        const results = await db
            .select()
            .from(filesTable)
            .where(eq(filesTable.folderPath, folderPath));

        return results.map((row) => this.normalizeRecord(row));
    }

    /**
     * Update file record
     */
    static async updateFile(id: string, updates: Partial<FileRecord>): Promise<FileRecord | null> {
        await this.initialize();

        const db = this.getDb();
        const payload: any = {
            ...updates,
            modifiedAt: new Date().toISOString()
        };

        if ('tags' in payload) {
            payload.tags = this.serializeTags(payload.tags) || undefined;
        }
        if ('metadata' in payload) {
            payload.metadata = this.serializeMetadata(payload.metadata) || undefined;
        }

        await db.update(filesTable).set(payload).where(eq(filesTable.id, id));

        const updated = await this.getFileById(id);
        if (updated) {
            console.log('File updated in database:', updated.filename);
        }
        return updated;
    }

    /**
     * Delete file record
     */
    static async deleteFile(filename: string): Promise<boolean> {
        await this.initialize();

        const db = this.getDb();
        const result = await db
            .delete(filesTable)
            .where(or(eq(filesTable.filename, filename), eq(filesTable.originalFilename, filename)));

        const changes = (result as any)?.changes ?? 0;
        if (changes > 0) {
            console.log('File deleted from database:', filename);
            return true;
        }

        return false;
    }

    /**
     * Get database statistics
     */
    static async getStats(): Promise<any> {
        await this.initialize();

        const files = await this.getAllFiles();
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);
        const fileTypes = files.reduce((acc, f) => {
            acc[f.extension] = (acc[f.extension] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalFiles: files.length,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            fileTypes,
            lastUpdated: new Date().toISOString(),
            version: 'sqlite'
        };
    }

    /**
     * Generate unique ID
     */
    private static generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Backup database
     */
    static async backup(): Promise<string> {
        await this.initialize();

        const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const sqlite = getSqliteClient();
        const dbList = sqlite.prepare('PRAGMA database_list').all() as Array<{ name: string; file: string }>;
        const mainDb = dbList.find((entry) => entry.name === 'main');
        const dbFilePath = mainDb?.file;

        if (!dbFilePath) {
            throw new Error('Database file path not found');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `database-backup-${timestamp}.db`);

        fs.copyFileSync(dbFilePath, backupPath);
        console.log('Database backed up to:', backupPath);

        return backupPath;
    }

    /**
     * Clear all records (use with caution!)
     */
    static async clear(): Promise<void> {
        await this.initialize();

        const db = this.getDb();
        await db.delete(filesTable);
        console.log('Database cleared');
    }
}
