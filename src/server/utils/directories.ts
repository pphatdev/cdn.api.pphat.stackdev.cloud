import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

export interface FileSettings {
    maxSize: number;
    maxFilesUpload: number;
    allowedTypes: string[];
}

export interface EnvConfig {
    port?: number;
    directories?: string[];
    allow?: {
        origins?: string[];
        patterns?: string[];
    };
    app?: {
        name: string;
        env: string;
    };
}

/**
 * Get the root directory path
 * @returns string
*/
const getRootPath = (): string => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // From src/server/utils/ go up 3 levels to root
    return path.resolve(__dirname, '../../../');
}

/**
 * Get directories from env.json and expand glob patterns
 * @returns string[]
*/
export const getDirectories = (): string[] => {
    const envPath = path.join(getRootPath(), 'env.json');

    if (!fs.existsSync(envPath)) {
        console.warn(`env.json not found at ${envPath}, using default directories`);
        return [];
    }

    try {
        const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;
        const patterns = (envData.directories && Array.isArray(envData.directories)) ? envData.directories : ["./storage/**/**"];

        const expandedDirs = new Set<string>();
        const rootPath = getRootPath();

        for (const pattern of patterns) {
            // Normalize pattern to use forward slashes for glob
            const normalizedPattern = pattern.replace(/\\/g, '/');

            // If pattern is relative, resolve from root, otherwise use as-is
            let globPattern = normalizedPattern;
            if (normalizedPattern.startsWith('./') || normalizedPattern.startsWith('../')) {
                // Remove leading ./ or ../ and let glob work from cwd
                globPattern = normalizedPattern.replace(/^\.\//, '');
            }

            // Find all matching paths (files and directories)
            const matches = glob.sync(globPattern, {
                cwd: rootPath,
                dot: false,
                absolute: true
            });

            // Convert absolute paths to relative paths from storage directory
            // Filter to only include directories
            for (const match of matches) {
                try {
                    const stat = fs.statSync(match);
                    if (stat.isDirectory()) {
                        const relativePath = path.relative(path.join(rootPath, 'storage'), match);
                        if (relativePath && !relativePath.startsWith('..')) {
                            expandedDirs.add(relativePath.replace(/\\/g, '/'));
                        }
                    }
                } catch (error) {
                    // Skip files that can't be accessed
                    continue;
                }
            }
        }

        return Array.from(expandedDirs);
    } catch (error) {
        console.error('Error reading env.json:', error);
        return [];
    }
}

/**
 * Find file in configured directories
 * @param filename string
 * @returns string | null
*/
export const findFileInDirectories = async (filename: string): Promise<string | null> => {
    const directories = getDirectories();
    for (const dir of directories) {

        const cwdPath = process.cwd();
        const filePath = path.join(cwdPath, `./storage/${dir}`, filename);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}