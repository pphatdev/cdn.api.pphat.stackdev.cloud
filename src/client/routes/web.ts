import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DashboardController } from '../controller/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the dist directory
app.use('/styles', express.static(path.join(__dirname, '../../../dist/client/styles')));
app.use(express.static(path.join(__dirname, '../../../dist/client')));


// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './../views'));


app.get('/', DashboardController.get);


export default app;
