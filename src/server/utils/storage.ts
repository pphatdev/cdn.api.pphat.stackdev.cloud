import fs from 'fs-extra';
import path from 'path';
import { configured } from './config.js';

interface FileInfo {
    path: string;
    name: string;
    size: number;
    type: string;
}

interface FolderStats {
    name: string;
    path: string;
    fileCount: number;
    totalSize: number;
    formattedSize: string;
}

interface StorageStats {
    totalSize: number;
    totalSizeFormatted: string;
    totalFiles: number;
    totalFolders: number;
    folderBreakdown: FolderStats[];
    fileTypeBreakdown: Record<string, { count: number; size: number; formattedSize: string }>;
    largestFiles: FileInfo[];
    storageDirectory: string;
}

/**
 * Storage utility class for calculating storage statistics
 */
export class StorageUtils {
    /**
     * Format bytes to human-readable format
     * @param bytes Number of bytes
     * @returns Formatted string
     */
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension from filename
     * @param filename Filename
     * @returns Extension without dot
     */
    static getFileExtension(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        return ext ? ext.substring(1) : 'unknown';
    }

    /**
     * Recursively scan directory and collect file information
     * @param dirPath Directory path to scan
     * @param files Array to collect files
     */
    private static async scanDirectory(dirPath: string, files: FileInfo[] = []): Promise<FileInfo[]> {
        try {
            const items = await fs.readdir(dirPath);

            for (const item of items) {
                const itemPath = path.join(dirPath, item);

                try {
                    const stat = await fs.stat(itemPath);

                    if (stat.isDirectory()) {
                        await this.scanDirectory(itemPath, files);
                    } else if (stat.isFile()) {
                        files.push({
                            path: itemPath,
                            name: item,
                            size: stat.size,
                            type: this.getFileExtension(item)
                        });
                    }
                } catch (error) {
                    // Skip files/folders that can't be accessed
                    console.warn(`Cannot access: ${itemPath}`);
                    continue;
                }
            }

            return files;
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
            return files;
        }
    }

    /**
     * Get storage statistics for the storage directory
     * @returns StorageStats object with detailed storage information
     */
    static async getStorageStats(): Promise<StorageStats> {
        const storageDir = configured.baseDirectory;

        // Check if storage directory exists
        if (!fs.existsSync(storageDir)) {
            await fs.ensureDir(storageDir);
        }

        // Collect all files
        const allFiles = await this.scanDirectory(storageDir);

        // Calculate total size
        const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

        // Get folder breakdown
        const folderMap = new Map<string, { files: FileInfo[]; size: number }>();

        for (const file of allFiles) {
            const relativePath = path.relative(storageDir, file.path);
            const folderPath = path.dirname(relativePath);
            const topLevelFolder = folderPath.split(path.sep)[0] || 'root';

            if (!folderMap.has(topLevelFolder)) {
                folderMap.set(topLevelFolder, { files: [], size: 0 });
            }

            const folder = folderMap.get(topLevelFolder)!;
            folder.files.push(file);
            folder.size += file.size;
        }

        const folderBreakdown: FolderStats[] = Array.from(folderMap.entries()).map(([name, data]) => ({
            name,
            path: path.join(storageDir, name),
            fileCount: data.files.length,
            totalSize: data.size,
            formattedSize: this.formatBytes(data.size)
        })).sort((a, b) => b.totalSize - a.totalSize);

        // Get file type breakdown
        const typeMap = new Map<string, { count: number; size: number }>();

        for (const file of allFiles) {
            if (!typeMap.has(file.type)) {
                typeMap.set(file.type, { count: 0, size: 0 });
            }

            const type = typeMap.get(file.type)!;
            type.count++;
            type.size += file.size;
        }

        const fileTypeBreakdown: Record<string, { count: number; size: number; formattedSize: string }> = {};
        for (const [type, data] of typeMap.entries()) {
            fileTypeBreakdown[type] = {
                count: data.count,
                size: data.size,
                formattedSize: this.formatBytes(data.size)
            };
        }

        // Get largest files (top 10)
        const largestFiles = allFiles
            .sort((a, b) => b.size - a.size)
            .slice(0, 10)
            .map(file => ({
                ...file,
                path: path.relative(storageDir, file.path)
            }));

        // Count total folders
        const allFolders = new Set<string>();
        for (const file of allFiles) {
            const relativePath = path.relative(storageDir, file.path);
            const dirPath = path.dirname(relativePath);

            if (dirPath !== '.') {
                const parts = dirPath.split(path.sep);
                for (let i = 1; i <= parts.length; i++) {
                    allFolders.add(parts.slice(0, i).join(path.sep));
                }
            }
        }

        return {
            totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            totalFiles: allFiles.length,
            totalFolders: allFolders.size,
            folderBreakdown,
            fileTypeBreakdown,
            largestFiles,
            storageDirectory: storageDir
        };
    }

    /**
     * Get quick storage summary (lighter version)
     * @returns Quick storage summary
     */
    static async getStorageSummary(): Promise<{
        totalSize: number;
        totalSizeFormatted: string;
        totalFiles: number;
        totalFolders: number;
        storageDirectory: string;
    }> {
        const storageDir = configured.baseDirectory;

        if (!fs.existsSync(storageDir)) {
            await fs.ensureDir(storageDir);
        }

        const allFiles = await this.scanDirectory(storageDir);
        const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

        const allFolders = new Set<string>();
        for (const file of allFiles) {
            const relativePath = path.relative(storageDir, file.path);
            const dirPath = path.dirname(relativePath);

            if (dirPath !== '.') {
                const parts = dirPath.split(path.sep);
                for (let i = 1; i <= parts.length; i++) {
                    allFolders.add(parts.slice(0, i).join(path.sep));
                }
            }
        }

        return {
            totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            totalFiles: allFiles.length,
            totalFolders: allFolders.size,
            storageDirectory: storageDir
        };
    }
}
