import express from 'express';
import { FolderController } from '../controllers/folder.controller.js';

const router = express.Router();

/**
 * Get folder structure dynamically based on the route
 * @method GET /api/folder
 * Dynamic Path:
 * - /api/folder -> Shows top-level folders and files in `storage`
 * - /api/folder/subfolder -> Shows contents of `subfolder`
 */
router.get('/', FolderController.getFolderStructure);
router.get(/^\/(.+)$/, FolderController.getFolderStructure);

export default router;
