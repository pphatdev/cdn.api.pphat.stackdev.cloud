import express, { Request, Response } from 'express';
import { sendNotFound } from './server/utils/response.js';
import { configured } from './server/utils/config.js';
import { Database } from './server/utils/database.js';
import API from './server/routes/api.js';
import WEB from './client/routes/web.js';
const app = express();

/**
 * Initialize Database
*/
Database.initialize().then(() => {
    console.log('✅ Database initialized successfully');
}).catch((error) => {
    console.error('❌ Failed to initialize database:', error);
});

/**
 * API Routes
*/
app.use('/api', API);

/**
 * Web UI Routes
*/
app.use('/', WEB);


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