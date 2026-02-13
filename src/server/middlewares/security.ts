import { Request, Response, NextFunction } from 'express';
import { appEnv } from '../utils/config.js';

const isDevelopment = appEnv.env === 'development';

const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://cdn.jsdelivr.net',
    "'unsafe-eval'"
].join(' ');

const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src ${scriptSrc};`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://ui-avatars.com",
    "connect-src 'self' https://cdn.jsdelivr.net",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
].join('; ');

export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', contentSecurityPolicy);
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    next();
};
