import { exec } from 'child_process';
import { appEnv } from './config.js';

export function reloadPM2Service(): void {

    appEnv.env === 'production' && exec('pm2 reload 0 --force', (error, stdout, stderr) => {
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