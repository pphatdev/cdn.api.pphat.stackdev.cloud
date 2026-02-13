import express, { Request, Response } from 'express';
import { sendNotFound } from './server/utils/response.js';
import { configured } from './server/utils/config.js';
import { Database } from './server/utils/database.js';
import { securityHeadersMiddleware } from './server/middlewares/security.js';
import API from './server/routes/api.js';
import WEB from './client/routes/web.js';

// Add global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const app = express();

app.use(securityHeadersMiddleware);

/**
 * Initialize Database
*/
Database.initialize().then(() => {
    console.log('✅ Database initialized successfully');
}).catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
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