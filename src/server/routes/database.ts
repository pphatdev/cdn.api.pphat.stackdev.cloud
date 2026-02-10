import express, { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import { Database } from '../utils/database.js';

const router = express.Router();

/**
 * Get all files from database
 * @method GET /api/database/files
 */
router.get('/files', async (req: Request, res: Response) => {
    try {
        const files = await Database.getAllFiles();
        sendSuccess(res, files, 'Files retrieved from database', 200);
    } catch (error: any) {
        sendSuccess(res, [], error.message, 500);
    }
});

/**
 * Get database statistics
 * @method GET /api/database/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = await Database.getStats();
        sendSuccess(res, stats, 'Database statistics retrieved', 200);
    } catch (error: any) {
        sendSuccess(res, {}, error.message, 500);
    }
});

/**
 * Search files in database
 * @method GET /api/database/search?q=query&type=type
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q, type } = req.query;
        if (!q) {
            sendSuccess(res, [], 'Query parameter required', 400);
            return;
        }
        const results = await Database.searchFiles(q as string, type as string);
        sendSuccess(res, results, 'Search results retrieved', 200);
    } catch (error: any) {
        sendSuccess(res, [], error.message, 500);
    }
});

/**
 * Backup database
 * @method POST /api/database/backup
 */
router.post('/backup', async (req: Request, res: Response) => {
    try {
        const backupPath = await Database.backup();
        sendSuccess(res, { backupPath }, 'Database backed up successfully', 200);
    } catch (error: any) {
        sendSuccess(res, {}, error.message, 500);
    }
});

export default router;
