import express, { Request, Response } from 'express';
import { FilesController, uploadFiles } from '../controllers/files.controller.js';
import { PreviewController } from '../controllers/preview.controller.js';
import { fileUploadRateLimiter } from '../middlewares/rate-limit.js';

const router = express.Router();

/**
 * @title File upload endpoint
 *
 * @method POST /api/file/upload
 * --------------------------------------------------
 * @description Multipart Form Data Upload
 * --------------------------------------------------
 * Headers: {
 *      Content-Type: multipart/form-data,
 *      storage: string (optional),
 *      X-Prefix: string (optional)
 * }
 *
 * Form Data:
 * - files: Files to upload
 *
 * --------------------------------------------------
 * @description Single File Upload via JSON Body
 * --------------------------------------------------
 * Headers: {
 *      Content-Type: application/json
 * }
 *
 * JSON Body:
 * - base64: Base64 encoded file content
 * - filename: Name of the file
 * - mimetype: MIME type of the file
 *
 * --------------------------------------------------
 * @description Multiple File Uploads via JSON Body
 * --------------------------------------------------
 * Headers: {
 *      Content-Type: application/json
 * }
 *
 * Body Raw JSON:
 * - files: Array of files with base64, filename, mimetype
 *
*/
router.post('/upload', fileUploadRateLimiter, (req, res) => {

    /**
     * Single File Upload via JSON Body
    */
    if (req.is('application/json') && req.body && req.body.base64 && req.body.filename && req.body.mimetype) {
        return FilesController.uploadFileBase64(req, res);
    }

    /**
     * Multiple File Uploads via JSON Body
    */
    if (req.is('application/json') && req.body && req.body.files && Array.isArray(req.body.files)) {
        return FilesController.uploadMultipleFilesBase64(req, res);
    }

    /**
     * Multipart Form Data Upload
    */
    return uploadFiles(req, res);
});

/**
 * File search endpoint
 * @method GET /api/file/search?q=&type
 *
 * Query Parameters:
 * - q: Name of the file to search
 * - type: {image, office} Type of files to search (optional)
 */
router.get('/search', FilesController.searchFileByName);

/**
 * Move file to directory endpoint
 *
 * @method PUT /api/file/move/:filename
 */
router.put('/move/:filename', FilesController.moveFileToDir);

/**
 * File delete endpoint
 *
 * @method DELETE /api/file/delete/:filename
*/
router.delete('/delete/:filename', FilesController.deleteFile);

/**
 * File download endpoint
 *
 * @method GET /api/file/download/:filename
*/
router.get('/download/:filename', FilesController.downloadFile);

/**
 * File preview endpoint
 *
 * @method GET /api/file/preview/:filename
*/
router.get('/preview/:filename', PreviewController.all);

export default router;
