import express, { Request, Response } from 'express';
import { configured } from './utils/config.js';
import { getImage, uploadImages } from './controllers/images.controller.js';
import { FilesController, uploadFiles } from './controllers/files.controller.js';
import { FolderController } from './controllers/folder.controller.js';
import { sendNotFound, sendSuccess } from './utils/response.js';

const app = express();

/**
 * Default End point
*/
app.get('/', (request: Request, response: Response) => {
    sendSuccess(response, request.query, 'Welcome to Assets Service', 200);
});

/**
 * Image optimization endpoint
 * GET /source/v1/files/image/:filename
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
 * POST /image/upload
 * Form Data:
 * - images: Images file to upload
*/
app.post('/image/upload', uploadImages);

/**
 * File upload endpoint
 *
 * POST /file/upload
 * Form Data:
 * - files: Files to upload
*/
app.post('/file/upload', uploadFiles);

/**
 * File search endpoint
 * GET /file/search?q=&type
 *
 * Query Parameters:
 * - q: Name of the file to search
 * - type: {image, office} Type of files to search (optional)
 */
app.get('/file/search', FilesController.searchFileByName);


/**
 * Get folder structure dynamically based on the route
 * GET /folder
 * Dynamic Path:
 * - /folder/ -> Shows top-level folders and files in `storage`
 */
app.get('/folder', FolderController.getFolderStructure);

/**
 * Get folder structure dynamically based on the route
 * GET /folder/*
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
app.listen( configured.port, () => {
    console.log(`Server is running on port ${configured.port}`);
    console.log(`🚀 \x1b[30mLocalhost:\x1b[32m http://localhost:${configured.port}\x1b[0m`)
    console.log(`🚀 \x1b[30mLocal Service:\x1b[32m http://127.0.0.1:${configured.port}\x1b[0m`)
});

export default app;