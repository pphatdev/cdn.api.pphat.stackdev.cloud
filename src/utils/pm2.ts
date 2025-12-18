import { exec } from 'child_process';
import { appEnv } from './config.js';

let isReloading = false;

export function reloadPM2Service(): void {
    if (appEnv.env !== 'production') return;
    
    if (isReloading) {
        console.log('PM2 reload already in progress, skipping...');
        return;
    }

    isReloading = true;
    
    exec('pm2 reload 0 --force', (error, stdout, stderr) => {
        isReloading = false;
        
        if (error) {
            console.error(`PM2 reload error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`PM2 reload stderr: ${stderr}`);
            return;
        }
        console.log(`PM2 reload stdout: ${stdout}`);
    });
}