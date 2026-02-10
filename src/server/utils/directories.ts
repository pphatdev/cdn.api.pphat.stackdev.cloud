import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
 * Get directories from env.json
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
        return (envData.directories && Array.isArray(envData.directories)) ? envData.directories : [];
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
        const filePath = path.join(cwdPath, `${dir}`, filename);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}