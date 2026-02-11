import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import { StorageUtils } from '../utils/storage.js';

/**
 * Storage Controller
 * Handles storage statistics and information endpoints
 */
export class StorageController {
    /**
     * Get detailed storage statistics
     * @method GET /api/storage
     */
    static async getStorageStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await StorageUtils.getStorageStats();
            sendSuccess(res, stats, 'Storage statistics retrieved successfully', 200);
        } catch (error: any) {
            console.error('Error getting storage stats:', error);
            sendSuccess(res, null, `Error retrieving storage statistics: ${error.message}`, 500);
        }
    }

    /**
     * Get quick storage summary
     * @method GET /api/storage/summary
     */
    static async getStorageSummary(req: Request, res: Response): Promise<void> {
        try {
            const summary = await StorageUtils.getStorageSummary();
            sendSuccess(res, summary, 'Storage summary retrieved successfully', 200);
        } catch (error: any) {
            console.error('Error getting storage summary:', error);
            sendSuccess(res, null, `Error retrieving storage summary: ${error.message}`, 500);
        }
    }
}
