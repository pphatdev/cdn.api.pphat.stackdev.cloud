import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../public')));

// Serve the main UI for root and all client routes
app.get('/', (request: Request, response: Response) => {
    response.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Handle client-side routes (dashboard, upload, browse, search, optimize)
app.get('/dashboard', (request: Request, response: Response) => {
    response.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/upload', (request: Request, response: Response) => {
    response.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/browse', (request: Request, response: Response) => {
    response.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/search', (request: Request, response: Response) => {
    response.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/optimize', (request: Request, response: Response) => {
    response.sendFile(path.join(__dirname, '../../public/index.html'));
});

export default app;
