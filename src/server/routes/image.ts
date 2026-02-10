import express, { Request, Response } from 'express';
import { getImage, uploadImages } from '../controllers/images.controller.js';

const router = express.Router();

/**
 * Legacy route for backward compatibility
 * @method GET /api/assets/image/:filename
 * @deprecated Use /api/image/assets/:filename instead
 */
router.get('/:filename', getImage);

/**
 * Image optimization endpoint
 * @method GET /api/image/assets/:filename
 *
 * Query Parameters:
 * - fm: Format (e.g., jpg, png, webp)
 * - q: Quality (e.g., 80)
 * - w: Width (e.g., 300)
 * - h: Height (e.g., 300)
 * - fit: Fit mode (e.g., cover, contain)
*/
router.get('/assets/:filename', getImage);


/**
 * Image upload endpoint
 *
 * @method POST /api/image/upload
 * Form Data:
 * - images: Images file to upload
*/
router.post('/upload', uploadImages);

export default router;
