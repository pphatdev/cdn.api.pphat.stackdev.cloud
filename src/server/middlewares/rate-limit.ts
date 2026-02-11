import { rateLimit } from 'express-rate-limit';
import { limitedMins } from '../utils/config.js';

/**
 * Rate limiter for upload endpoints
 *
 * Limits:
 * - 20 requests per 15 minutes per IP
 * - Prevents abuse of upload endpoints
 * - Returns 429 status code when limit exceeded
 */
export const uploadRateLimiter = rateLimit({
    windowMs: limitedMins, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many upload requests from this IP, please try again after 15 minutes',
        data: null
    },
    // Skip rate limiting for specific conditions (optional)
    skip: (req) => {
        // You can add logic here to skip rate limiting for certain requests
        // For example: trusted IPs, authenticated admin users, etc.
        return false;
    }
});

/**
 * Stricter rate limiter for image uploads
 *
 * Limits:
 * - 30 requests per 15 minutes per IP
 * - Specifically for image upload endpoint
 */
export const imageUploadRateLimiter = rateLimit({
    windowMs: limitedMins, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many image upload requests from this IP, please try again after 15 minutes',
        data: null
    }
});

/**
 * General file upload rate limiter
 *
 * Limits:
 * - 15 requests per 15 minutes per IP
 * - For general file uploads (potentially larger files)
 */
export const fileUploadRateLimiter = rateLimit({
    windowMs: limitedMins, // 15 minutes
    max: 15, // Limit each IP to 15 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many file upload requests from this IP, please try again after 15 minutes',
        data: null
    }
});
