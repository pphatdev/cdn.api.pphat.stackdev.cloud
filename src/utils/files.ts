import fs from 'fs-extra';
import path from 'path';

/**
 * Utility functions for file and directory operations with proper permissions
 */
export class FileUtils {
    /**
     * Create a directory with full write permissions (777)
     * @param dirPath Path to the directory to create
     */
    static async ensureDirectoryWithPermissions(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            await fs.ensureDir(dirPath);
            await fs.chmod(dirPath, 0o777);
        } else {
            // Ensure existing directory has proper permissions
            await fs.chmod(dirPath, 0o777);
        }
    }

    /**
     * Create a file with proper write permissions (666)
     * @param filePath Path to the file
     * @param content Content to write
     */
    static async createFileWithPermissions(filePath: string, content: any): Promise<void> {
        // Ensure parent directory exists with proper permissions
        const dir = path.dirname(filePath);
        await this.ensureDirectoryWithPermissions(dir);
        
        // Create/write file
        await fs.writeFile(filePath, content);
        
        // Set file permissions
        await fs.chmod(filePath, 0o666);
    }

    /**
     * Set proper permissions for existing file or directory
     * @param targetPath Path to file or directory
     * @param isDirectory Whether the target is a directory
     */
    static async setProperPermissions(targetPath: string, isDirectory: boolean = false): Promise<void> {
        if (fs.existsSync(targetPath)) {
            const mode = isDirectory ? 0o777 : 0o666;
            await fs.chmod(targetPath, mode);
        }
    }
}

export class FileCache {
    protected cacheDir: string;
    protected ttl: number;

    constructor(options: { cacheDir?: string; ttl?: number } = {}) {
        this.cacheDir = options.cacheDir || '.cache-local';
        this.ttl = options.ttl || 3600; // 1 hour default
        // Initialize asynchronously - call init() when creating instance
        this.init();
    }

    async init() {
        await FileUtils.ensureDirectoryWithPermissions(this.cacheDir);
    }

    getCacheFilePath(key: string) {
        return path.join(this.cacheDir, `${key}.json`);
    }

    async set(key: string, data: any) {
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl: this.ttl
        };
        await fs.writeJson(this.getCacheFilePath(key), cacheData);
        // Set file permissions to allow write access for all
        const filePath = this.getCacheFilePath(key);
        await fs.chmod(filePath, 0o666);
    }

    async get(key: string) {
        try {
            const filePath = this.getCacheFilePath(key);
            if (!fs.existsSync(filePath)) return null;

            const cacheData = await fs.readJson(filePath);
            const age = (Date.now() - cacheData.timestamp) / 1000;

            if (age > cacheData.ttl) {
                await this.del(key);
                return null;
            }
            return cacheData.data;
        } catch (error) {
            return null;
        }
    }

    async del(key: string) {
        try {
            await fs.unlink(this.getCacheFilePath(key));
        } catch (error) {
            // Ignore deletion errors
        }
    }

    async clear() {
        try {
            await fs.emptyDir(this.cacheDir);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
}