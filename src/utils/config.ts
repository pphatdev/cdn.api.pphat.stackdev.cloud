import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

interface EnvConfig {
    directories: string[];
    port: number;
}

export const configured = {
    directories: getDirectories(),
    port: 3000,
}

/**
 * Get destination directories from env.json
 * @returns string[]
*/
export function getDirectories(): string[] {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../../env.json');
    const envData = JSON.parse(fs.readFileSync(envPath, 'utf-8')) as EnvConfig;
    return envData.directories;
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