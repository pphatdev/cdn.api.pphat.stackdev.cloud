import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DashboardController } from '../controller/dashboard.js';
import { MyFileController } from '../controller/my-file.js';
import { StarredController } from '../controller/starred.js';
import { Controller } from '../controller/controller.js';
import { UploadController } from '../controller/upload.js';
import { UploadHistoryController } from '../controller/upload-history.js';
import { RecentController } from '../controller/recent.js';
import { DetailController } from '../controller/detail.js';
import { ShareController } from '../controller/share.js';
import { UsersController } from '../controller/users.js';
import { LoginController } from '../controller/login.js';
import { clientAuthMiddleware } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the dist directory
app.use('/styles', express.static(path.join(__dirname, '../../../dist/client/styles')));
app.use(express.static(path.join(__dirname, '../../../dist/client')));
app.use('/utils', express.static(path.join(__dirname, '../../../dist/client/utils')));


// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './../views'));

app.use(clientAuthMiddleware);


app.get('/', DashboardController.get);
app.get('/login', LoginController.get);
app.get('/files', MyFileController.get);
app.get(/^\/files\/(.*)/, MyFileController.get);
app.get('/starred', StarredController.get);
app.get('/recent', RecentController.get);
app.get('/detail', DetailController.get);
app.get('/share', ShareController.get);
app.get('/upload', UploadController.get);
app.get('/upload/history', UploadHistoryController.get);
app.get('/users', UsersController.get);

// Catch-all 404 handler - render not-found page with default config
app.use((req, res, next) => {
    // Skip API routes - let them be handled by API router
    if (req.path.startsWith('/api')) {
        return next();
    }

    const pageData = {
        ...Controller.defaultConfig,
        page: 'not-found',
        title: '404 Not Found',
        currentPath: req.path
    };
    res.status(404).render('layouts/main', pageData);
});

export default app;
