import express, { Request, Response } from 'express';
import { getImage, uploadImage, uploadImages } from './controllers/images.controller.js';
import { configured } from './utils/config.js';
import { uploadFile, uploadFiles } from './controllers/files.controller.js';

const app = express();

/**
 * Default End point
*/
app.get('/', (request: Request, response: Response) => {
    response.send({
        status: 200,
        method: request.method,
        message: "Welcome! This is Image Optimize Service.",
        query: request.query,
    });
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
 * - image: Image file to upload
*/
app.post('/image/upload', uploadImage);

/**
 * Multiple Image upload endpoint
 *
 * POST /image/uploads
 * Form Data:
 * - images: Multiple image files to upload
*/
app.post('/image/uploads', uploadImages);

/**
 * File upload endpoint
 *
 * POST /file/upload
 * Form Data:
 * - file: File to upload
*/
app.post('/file/upload', uploadFile);

/**
 * File upload endpoint
 *
 * POST /file/upload
 * Form Data:
 * - files: Files to uploads
*/
app.post('/file/uploads', uploadFiles);

/**
 * Catch-all route for undefined endpoints
*/
app.use((request: Request, response: Response) => {
    response.send({
        status: 404,
        method: request.method,
        message: "Welcome! This is Image Optimize Service.",
        query: request.query,
    });
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