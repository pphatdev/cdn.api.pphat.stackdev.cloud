import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { AuthConfig } from '../types/user.js';
import { getSqliteClient } from './db.js';
import { Request } from 'express';

export const getAuthConfig = (): AuthConfig => {
    const envPath = path.join(process.cwd(), 'env.json');
    let envData: any = {};

    if (fs.existsSync(envPath)) {
        envData = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
    }

    const authConfig = envData.auth || {};

    return {
        jwtSecret: authConfig.jwtSecret || process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        jwtExpiresIn: authConfig.jwtExpiresIn || '1h',
        refreshTokenExpiresIn: authConfig.refreshTokenExpiresIn || '7d',
        bcryptRounds: authConfig.bcryptRounds || 12,
        maxLoginAttempts: authConfig.maxLoginAttempts || 5,
        lockoutDuration: authConfig.lockoutDuration || 15,
        maxSessionsPerUser: authConfig.maxSessionsPerUser || 5
    };
};


/**
 * Hash a token for secure storage
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};


/**
 * Get client IP address
 */
export const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Log audit event
 */
export const logAuditEvent = async (
    userId: string | null,
    action: string,
    req: Request,
    details?: any
): Promise<void> => {
    try {
        const sqlite = getSqliteClient();
        const stmt = sqlite.prepare(`
            INSERT INTO auth_audit_log (id, user_id, action, ip_address, user_agent, details)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            crypto.randomUUID(),
            userId,
            action,
            getClientIp(req),
            req.headers['user-agent'] || null,
            details ? JSON.stringify(details) : null
        );
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
};

/**
 * Parse duration string to milliseconds
 */
export const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 3600000;
    }
};