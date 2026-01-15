import express, { Request, Response } from 'express';
import { configured, getAllowOrigin } from './utils/config.js';
import { getImage, uploadImages } from './controllers/images.controller.js';
import { FilesController, uploadFiles } from './controllers/files.controller.js';
import { FolderController } from './controllers/folder.controller.js';
import { sendNotFound, sendSuccess } from './utils/response.js';
import { PreviewController } from './controllers/preview.controller.js';

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
 * Image optimization endpoint
 * @method GET /source/v1/files/image/:filename
 *
 * Query Parameters:
 * - fm: Format (e.g., jpg, png, webp)
 * - q: Quality (e.g., 80)
 * - w: Width (e.g., 300)
 * - h: Height (e.g., 300)
 * - fit: Fit mode (e.g., cover, contain)
*/
app.get('/source/v1/files/image/:filename', getImage);

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
 * - /folder/ -> Shows top-level folders and files in `storage`
 */
app.get('/folder', FolderController.getFolderStructure);

/**
 * Get folder structure dynamically based on the route
 * @method GET /folder/*
 * Dynamic Path:
 * - /folder/ -> Shows top-level folders and files in `storage`
 * - /folder/folder1 -> Shows contents of `folder1`
 */
app.get('/folder/*path', FolderController.getFolderStructure);

/**
 * Catch-all route for undefined endpoints
*/
app.use((request: Request, response: Response) => {
    sendNotFound(response, 'Oops! The endpoint you are looking for does not exist.');
});

/**
 * Listening on port
*/
app.listen(configured.port, () => {
    console.log(`Server is running on port ${configured.port}`);
    console.log(`🚀 \x1b[30mLocalhost:\x1b[32m http://localhost:${configured.port}\x1b[0m`)
    console.log(`🚀 \x1b[30mLocal Service:\x1b[32m http://127.0.0.1:${configured.port}\x1b[0m`)
});

export default app;