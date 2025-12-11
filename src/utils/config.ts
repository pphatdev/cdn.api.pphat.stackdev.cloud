import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

interface FileSettings {
    maxSize: number;
    maxFilesUpload: number;
    allowedTypes: string[];
}

interface EnvConfig {
    directories: string[];
    port: number;
    baseDirectory: string;
    defaultStoragePath: string;
    files: FileSettings;
    images: FileSettings;
}

/**
 * Get port from env.json
 * @returns number
*/
export const getPort = (): number => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../env.json');
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;
    return envData.port;
}

/**
 * Configured settings
*/
export const configured = {
    directories: getDirectories(),
    port: getPort(),
    baseDirectory: 'storage',
    defaultStoragePath: 'files',
    files: {
        maxSize: 500 * 1024 * 1024, // 500MB
        maxFilesUpload: 10,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
    },
    images: {
        maxSize: 50 * 1024 * 1024, // 50MB
        maxFilesUpload: 10,
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/tiff',
            'image/bmp',
            'image/svg+xml'
        ]
    }
};


/**
 * Get destination directories from env.json
 * @returns string[]
*/
export function getDirectories(): string[] {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../env.json');
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;

    const expandedDirectories: string[] = [];

    for (const dir of envData.directories) {
        if (dir.includes('**')) {
            // Pattern like /dir/**/**/path - find all matching folders
            const parts = dir.split('**');
            const basePath = parts[0].replace(/\/$/, '');
            const endPath = parts[parts.length - 1].replace(/^\//, '');

            const cwdPath = process.cwd();
            const fullBasePath = path.join(cwdPath, basePath);

            if (fs.existsSync(fullBasePath)) {
                const findMatchingDirs = (currentPath: string, depth: number = 0): void => {
                    if (depth > 10) return; // Prevent infinite recursion

                    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            const fullPath = path.join(currentPath, entry.name);
                            const relativePath = path.relative(cwdPath, fullPath);

                            // Check if this matches the end pattern
                            if (endPath) {
                                const potentialMatch = path.join(relativePath, endPath);
                                if (fs.existsSync(path.join(cwdPath, potentialMatch))) {
                                    expandedDirectories.push(potentialMatch);
                                }
                            } else {
                                expandedDirectories.push(relativePath);
                            }

                            // Continue searching recursively
                            findMatchingDirs(fullPath, depth + 1);
                        }
                    }
                };

                findMatchingDirs(fullBasePath);
            }
        } else {
            expandedDirectories.push(dir);
        }
    }

    return expandedDirectories.reduce((uniqueDirs, dir) => {

        if (/\\/g.test(dir) && !dir.startsWith('./')) {
            dir = "./" + dir;
        }
        const toRightPath = dir.replace(/\\/g, '/').replace(/\/+$/g, '/');

        if (!uniqueDirs.includes(toRightPath)) {
            uniqueDirs.push(toRightPath);
        }

        return uniqueDirs;
    }, [] as string[]);
}

/**
 * Find file in configured directories
 * @param filename string
 * @returns string | null
*/
export const findFileInDirectories = (filename: string): string | null => {
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