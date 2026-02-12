import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { sendUnauthorized } from '../utils/response.js';

/**
 * JWT Authentication middleware
 * Validates the Bearer token in the Authorization header using JWT
 */
export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendUnauthorized(res, 'Authorization token is required.');
        return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const payload = await AuthController.validateToken(token);

        if (!payload) {
            sendUnauthorized(res, 'Invalid or expired token.');
            return;
        }

        // Attach user info to request
        (req as any).user = {
            id: payload.userId,
            username: payload.username,
            role: payload.role,
            sessionId: payload.sessionId
        };

        next();
    } catch (error) {
        sendUnauthorized(res, 'Invalid or expired token.');
    }
};

/**
 * Optional JWT authentication middleware
 * Attaches user info if token is valid, but doesn't block the request
 */
export const optionalJwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');

        try {
            const payload = await AuthController.validateToken(token);

            if (payload) {
                (req as any).user = {
                    id: payload.userId,
                    username: payload.username,
                    role: payload.role,
                    sessionId: payload.sessionId
                };
            }
        } catch (error) {
            // Ignore errors - optional auth
        }
    }

    next();
};

/**
 * Admin only middleware
 * Requires authenticated user with admin role
 */
export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
        sendUnauthorized(res, 'Authentication required.');
        return;
    }

    if (user.role !== 'admin') {
        sendUnauthorized(res, 'Admin access required.');
        return;
    }

    next();
};

/**
 * Role-based middleware factory
 * Allows access only to users with specified roles
 */
export const requireRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            sendUnauthorized(res, 'Authentication required.');
            return;
        }

        if (!roles.includes(user.role)) {
            sendUnauthorized(res, `Access denied. Required roles: ${roles.join(', ')}`);
            return;
        }

        next();
    };
};

/**
 * Rate limiting for auth endpoints
 */
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: {
        status: 429,
        message: 'Too many login attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window for auth endpoints
    message: {
        status: 429,
        message: 'Too many authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
