import express, { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { corsMiddleware } from '../middlewares/cors.js';
import imageRoutes from './image.js';
import fileRoutes from './file.js';
import databaseRoutes from './database.js';
import folderRoutes from './folder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

/**
 * Middleware to parse JSON and urlencoded bodies
*/
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

/**
 * CORS Middleware
*/
app.use(corsMiddleware);

/**
 * Image routes
 */
app.use('/image', imageRoutes);

/**
 * File routes
 */
app.use('/file', fileRoutes);

/**
 * Database routes
 */
app.use('/database', databaseRoutes);

/**
 * Folder routes
 */
app.use('/folder', folderRoutes);

/**
 * Default End point
 * @method GET /api
*/
app.get('/', (request: Request, response: Response) => {
    sendSuccess(response, request.query, 'Welcome to Assets Service', 200);
});

/**
 * Get application version from package.json
 * @method GET /api/version
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

export default app;