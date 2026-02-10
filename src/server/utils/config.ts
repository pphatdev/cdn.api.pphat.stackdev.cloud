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
 * Get Allow Origin (merge exact origins and regex patterns) from env.json
 * @returns (string|RegExp)[]
*/
export const getAllowOrigin = (): (string | RegExp)[] => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../env.json');
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;

    const origins = (envData.allow && Array.isArray(envData.allow.origins)) ? envData.allow.origins : [];
    const patterns = (envData.allow && Array.isArray(envData.allow.patterns)) ? envData.allow.patterns : [];

    const regexes = patterns.map(p => {
        try { return new RegExp(p); } catch (err) { return null; }
    }).filter((r): r is RegExp => r !== null);

    return [...origins, ...regexes];
}

export const getAllowPatterns = (): RegExp[] => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../env.json');
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
    directories: [
        // can be dynamic directories via env.json
        ...getDirectories(),
        "./storage/**/**"
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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../env.json');
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig & { app?: AppEnv };
    return envData.app || { name: 'app', env: 'development' };
})();