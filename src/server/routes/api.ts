import express, { Request, Response } from 'express';
import { getAllowOrigin } from '../utils/config.js';
import { getImage, uploadImages } from '../controllers/images.controller.js';
import { FilesController, uploadFiles } from '../controllers/files.controller.js';
import { FolderController } from '../controllers/folder.controller.js';
import { sendSuccess } from '../utils/response.js';
import { PreviewController } from '../controllers/preview.controller.js';
import { Database } from '../utils/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

/**
 * Middleware to parse JSON and urlencoded bodies
*/
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

/**
 * Middleware to parse JSON bodies
*/
app.use((req, res, next) => {
    const allowedOrigins = getAllowOrigin();

    const origin = req.headers.origin;
    if (origin) {
        const isAllowed = allowedOrigins.some(allowed =>
            typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
        );

        if (isAllowed) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

    next()
})

/**
 * Default End point
 * @method GET /
*/
app.get('/', (request: Request, response: Response) => {
    sendSuccess(response, request.query, 'Welcome to Assets Service', 200);
});

/**
 * Get application version from package.json
 * @method GET /version
*/
app.get('/version', (request: Request, response: Response) => {
    try {
        const packageJson = JSON.parse(
            readFileSync(join(__dirname, '../../package.json'), 'utf-8')
        );
        sendSuccess(response, { version: packageJson.version, name: packageJson.name }, 'Version retrieved successfully', 200);
    } catch (error) {
        sendSuccess(response, { version: '1.0.0' }, 'Version retrieved successfully', 200);
    }
});

/**
 * Image optimization endpoint
 * @method GET /assets/image/:filename
 *
 * Query Parameters:
 * - fm: Format (e.g., jpg, png, webp)
 * - q: Quality (e.g., 80)
 * - w: Width (e.g., 300)
 * - h: Height (e.g., 300)
 * - fit: Fit mode (e.g., cover, contain)
*/
app.get('/assets/image/:filename', getImage);

/**
 * Image upload endpoint
 *
 * @method POST /image/upload
 * Form Data:
 * - images: Images file to upload
*/
app.post('/image/upload', uploadImages);

/**
 * @title File upload endpoint
 *
 * @method POST /file/upload
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
app.post('/file/upload', (req, res) => {

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
 * @method GET /file/search?q=&type
 *
 * Query Parameters:
 * - q: Name of the file to search
 * - type: {image, office} Type of files to search (optional)
 */
app.get('/file/search', FilesController.searchFileByName);

/**
 * Move file to directory endpoint
 *
 * @method PUT /file/move/:filename
 */
app.put('/file/move/:filename', FilesController.moveFileToDir);


/**
 * File delete endpoint
 *
 * @method DELETE /file/delete/:filename
*/
app.delete('/file/delete/:filename', FilesController.deleteFile);

/**
 * File download endpoint
 *
 * @method GET /file/download/:filename
*/
app.get('/file/download/:filename', FilesController.downloadFile);

/**
 * File preview endpoint
 *
 * @method GET /file/preview/:filename
*/
app.get('/file/preview/:filename', PreviewController.all);


/**
 * Get folder structure dynamically based on the route
 * @method GET /folder
 * Dynamic Path:
 * - /folder -> Shows top-level folders and files in `storage`
 * - /folder/subfolder -> Shows contents of `subfolder`
 */
app.get('/folder', FolderController.getFolderStructure);
app.get(/^\/folder\/(.+)$/, FolderController.getFolderStructure);

/**
 * Database endpoints
 */

/**
 * Get all files from database
 * @method GET /database/files
 */
app.get('/database/files', async (req: Request, res: Response) => {
    try {
        const files = await Database.getAllFiles();
        sendSuccess(res, files, 'Files retrieved from database', 200);
    } catch (error: any) {
        sendSuccess(res, [], error.message, 500);
    }
});

/**
 * Get database statistics
 * @method GET /database/stats
 */
app.get('/database/stats', async (req: Request, res: Response) => {
    try {
        const stats = await Database.getStats();
        sendSuccess(res, stats, 'Database statistics retrieved', 200);
    } catch (error: any) {
        sendSuccess(res, {}, error.message, 500);
    }
});

/**
 * Search files in database
 * @method GET /database/search?q=query&type=type
 */
app.get('/database/search', async (req: Request, res: Response) => {
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
 * @method POST /database/backup
 */
app.post('/database/backup', async (req: Request, res: Response) => {
    try {
        const backupPath = await Database.backup();
        sendSuccess(res, { backupPath }, 'Database backed up successfully', 200);
    } catch (error: any) {
        sendSuccess(res, {}, error.message, 500);
    }
});

export default app;