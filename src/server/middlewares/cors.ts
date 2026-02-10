import { Request, Response, NextFunction } from 'express';
import { getAllowOrigin } from '../utils/config.js';

/**
 * CORS Middleware to handle allowed origins
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    next();
};
