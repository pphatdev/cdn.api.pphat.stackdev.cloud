import { exec } from 'child_process';

export function reloadPM2Service(): void {
    exec('pm2 reload 0', (error, stdout, stderr) => {
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
