import fs from 'fs';
import path from 'path';
import { FileUtils } from './files.js';

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

interface DatabaseSchema {
    files: FileRecord[];
    version: string;
    lastUpdated: string;
}

export class Database {
    private static dbPath = path.join(process.cwd(), 'src',  'server', 'data', 'database.json');
    private static db: DatabaseSchema | null = null;

    /**
     * Initialize the database
     */
    static async initialize(): Promise<void> {
        try {
            const dataDir = path.join(process.cwd(), 'src', 'server', 'data');

            // Create data directory if it doesn't exist
            if (!fs.existsSync(dataDir)) {
                await FileUtils.ensureDirectoryWithPermissions(dataDir);
            }

            // Create database file if it doesn't exist
            if (!fs.existsSync(this.dbPath)) {
                const initialData: DatabaseSchema = {
                    files: [],
                    version: '1.0.0',
                    lastUpdated: new Date().toISOString()
                };
                fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
                console.log('Database initialized at:', this.dbPath);
            }

            // Load database into memory
            await this.load();
        } catch (error: any) {
            console.error('Error initializing database:', error.message);
            throw error;
        }
    }

    /**
     * Load database from file
     */
    static async load(): Promise<DatabaseSchema> {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf-8');
            this.db = JSON.parse(data);
            return this.db!;
        } catch (error: any) {
            console.error('Error loading database:', error.message);
            throw error;
        }
    }

    /**
     * Save database to file
     */
    static async save(): Promise<void> {
        try {
            if (!this.db) {
                await this.load();
            }

            this.db!.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
        } catch (error: any) {
            console.error('Error saving database:', error.message);
            throw error;
        }
    }

    /**
     * Add a file record to the database
     */
    static async addFile(fileData: Omit<FileRecord, 'id'>): Promise<FileRecord> {
        if (!this.db) {
            await this.load();
        }

        // Check if file already exists
        const existingFile = this.db!.files.find(f =>
            f.filename === fileData.filename && f.folderPath === fileData.folderPath
        );

        if (existingFile) {
            // Update existing file instead of creating duplicate
            console.log('File already exists, updating record:', fileData.filename);
            return await this.updateFile(existingFile.id, fileData) || existingFile;
        }

        const id = this.generateId();
        const record: FileRecord = {
            id,
            ...fileData
        };

        this.db!.files.push(record);
        await this.save();

        // console.log('File added to database:', record.filename);
        return record;
    }

    /**
     * Get file by filename
     */
    static async getFileByName(filename: string): Promise<FileRecord | null> {
        if (!this.db) {
            await this.load();
        }

        return this.db!.files.find(f => f.filename === filename || f.originalFilename === filename) || null;
    }

    /**
     * Get file by ID
     */
    static async getFileById(id: string): Promise<FileRecord | null> {
        if (!this.db) {
            await this.load();
        }

        return this.db!.files.find(f => f.id === id) || null;
    }

    /**
     * Get all files
     */
    static async getAllFiles(): Promise<FileRecord[]> {
        if (!this.db) {
            await this.load();
        }

        return this.db!.files;
    }

    /**
     * Search files by query
     */
    static async searchFiles(query: string, type?: string): Promise<FileRecord[]> {
        if (!this.db) {
            await this.load();
        }

        const lowerQuery = query.toLowerCase();
        return this.db!.files.filter(file => {
            const matchesQuery =
                file.filename.toLowerCase().includes(lowerQuery) ||
                file.originalFilename.toLowerCase().includes(lowerQuery) ||
                file.path.toLowerCase().includes(lowerQuery);

            if (type) {
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
                const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];

                if (type === 'image') {
                    return matchesQuery && imageExtensions.includes(file.extension);
                } else if (type === 'office') {
                    return matchesQuery && officeExtensions.includes(file.extension);
                }
                return matchesQuery && file.extension === type;
            }

            return matchesQuery;
        });
    }

    /**
     * Get files by folder path
     */
    static async getFilesByFolder(folderPath: string): Promise<FileRecord[]> {
        if (!this.db) {
            await this.load();
        }

        return this.db!.files.filter(f => f.folderPath === folderPath);
    }

    /**
     * Update file record
     */
    static async updateFile(id: string, updates: Partial<FileRecord>): Promise<FileRecord | null> {
        if (!this.db) {
            await this.load();
        }

        const index = this.db!.files.findIndex(f => f.id === id);
        if (index === -1) {
            return null;
        }

        this.db!.files[index] = {
            ...this.db!.files[index],
            ...updates,
            modifiedAt: new Date().toISOString()
        };

        await this.save();
        console.log('File updated in database:', this.db!.files[index].filename);
        return this.db!.files[index];
    }

    /**
     * Delete file record
     */
    static async deleteFile(filename: string): Promise<boolean> {
        if (!this.db) {
            await this.load();
        }

        const initialLength = this.db!.files.length;
        this.db!.files = this.db!.files.filter(f => f.filename !== filename && f.originalFilename !== filename);

        if (this.db!.files.length < initialLength) {
            await this.save();
            console.log('File deleted from database:', filename);
            return true;
        }

        return false;
    }

    /**
     * Get database statistics
     */
    static async getStats(): Promise<any> {
        if (!this.db) {
            await this.load();
        }

        const files = this.db!.files;
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
            lastUpdated: this.db!.lastUpdated,
            version: this.db!.version
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
        const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
        if (!fs.existsSync(backupDir)) {
            await FileUtils.ensureDirectoryWithPermissions(backupDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `database-backup-${timestamp}.json`);

        fs.copyFileSync(this.dbPath, backupPath);
        console.log('Database backed up to:', backupPath);

        return backupPath;
    }

    /**
     * Clear all records (use with caution!)
     */
    static async clear(): Promise<void> {
        if (!this.db) {
            await this.load();
        }

        this.db!.files = [];
        await this.save();
        console.log('Database cleared');
    }
}
