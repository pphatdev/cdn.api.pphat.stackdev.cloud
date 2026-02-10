import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { appMimeTypes, audioMimeTypes, imageMimeTypes } from './mine-types.js';
import { EnvConfig, getDirectories } from './directories.js';

interface AppEnv {
    name: string;
    env: string;
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
 * Get Allow Origin (merge exact origins and regex patterns) from env.json
 * @returns (string|RegExp)[]
*/
export const getAllowOrigin = (): (string | RegExp)[] => {
    const envPath = path.join(getRootPath(), 'env.json');

    if (!fs.existsSync(envPath)) {
        console.warn(`env.json not found at ${envPath}, using defaults`);
        return [];
    }

    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;

    const origins = (envData.allow && Array.isArray(envData.allow.origins)) ? envData.allow.origins : [];
    const patterns = (envData.allow && Array.isArray(envData.allow.patterns)) ? envData.allow.patterns : [];

    const regexes = patterns.map(p => {
        try { return new RegExp(p); } catch (err) { return null; }
    }).filter((r): r is RegExp => r !== null);

    return [...origins, ...regexes];
}

export const getAllowPatterns = (): RegExp[] => {
    const envPath = path.join(getRootPath(), 'env.json');

    if (!fs.existsSync(envPath)) {
        console.warn(`env.json not found at ${envPath}, using defaults`);
        return [];
    }

    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;
    const patterns = (envData.allow && Array.isArray(envData.allow.patterns)) ? envData.allow.patterns : [];
    return patterns.map(p => {
        try { return new RegExp(p); } catch (err) { return null; }
    }).filter((r): r is RegExp => r !== null);
}

/**
 * Get port from env.json
 * @returns number
*/
export const getPort = (): number => {
    const envPath = path.join(getRootPath(), 'env.json');

    if (!fs.existsSync(envPath)) {
        console.warn(`env.json not found at ${envPath}, using default port 3000`);
        return 3000;
    }

    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;
    return envData.port || 3000;
}

/**
 * Configured settings
*/
export const configured = {
    directories: [
        // can be dynamic directories via env.json
        ...getDirectories(),
    ],
    port: getPort(),
    baseDirectory: 'storage',
    defaultStoragePath: 'files',
    uploadOriginalName: false,
    files: {
        maxSize: 500 * 1024 * 1024, // 500MB
        maxFilesUpload: 10,
        allowedTypes: [
            ...appMimeTypes,
            ...imageMimeTypes,
            ...audioMimeTypes
        ]
    },
    images: {
        maxSize: 50 * 1024 * 1024, // 50MB
        maxFilesUpload: 10,
        allowedTypes: imageMimeTypes
    }
};

/**
 * Get application environment info
*/
export const appEnv: AppEnv = (() => {
    const envPath = path.join(getRootPath(), 'env.json');

    if (!fs.existsSync(envPath)) {
        console.warn(`env.json not found at ${envPath}, using defaults`);
        return { name: 'app', env: 'development' };
    }

    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig & { app?: AppEnv };
    return envData.app || { name: 'app', env: 'development' };
})();