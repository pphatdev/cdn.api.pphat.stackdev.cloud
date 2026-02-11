import express from 'express';
import { StorageController } from '../controllers/storage.controller.js';

const router = express.Router();

/**
 * Get detailed storage statistics
 * @method GET /api/storage
 * 
 * Returns detailed information including:
 * - Total size and file count
 * - Folder breakdown with sizes
 * - File type breakdown
 * - Largest files
 */
router.get('/', StorageController.getStorageStats);

/**
 * Get quick storage summary
 * @method GET /api/storage/summary
 * 
 * Returns quick summary with:
 * - Total size and file count
 * - Total folders
 * - Storage directory path
 */
router.get('/summary', StorageController.getStorageSummary);

export default router;
