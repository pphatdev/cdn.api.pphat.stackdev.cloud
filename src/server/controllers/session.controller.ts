import { Request, Response } from 'express';
import { sendBadRequest, sendSuccess, sendUnauthorized } from '../utils/response.js';
import { query, getSqliteClient } from '../utils/db.js';
import { Session } from '../types/user.js';
import { hashToken, logAuditEvent } from '../utils/auth.js';

export class SessionController {
    /**
     * Get active sessions
     * GET /api/auth/sessions
     */
    static getSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const sessions = await query<Session>(
                `SELECT id, ip_address, user_agent, created_at, last_used_at, expires_at
                FROM sessions
                WHERE user_id = ? AND is_valid = 1 AND expires_at > datetime('now')
                ORDER BY last_used_at DESC`,
                [user.id]
            );

            const currentToken = req.headers.authorization?.replace('Bearer ', '');
            const currentTokenHash = currentToken ? hashToken(currentToken) : null;

            const sessionsWithCurrent = sessions.map(session => ({
                ...session,
                isCurrent: currentTokenHash ? session.token_hash === currentTokenHash : false
            }));

            sendSuccess(res, sessionsWithCurrent, 'Sessions retrieved');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to get sessions.');
        }
    };

    /**
     * Revoke a specific session
     * DELETE /api/auth/sessions/:sessionId
     */
    static revokeSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            if (!user) {
                sendUnauthorized(res, 'Authentication required.');
                return;
            }

            const { sessionId } = req.params;

            const sqlite = getSqliteClient();
            const stmt = sqlite.prepare(
                'UPDATE sessions SET is_valid = 0 WHERE id = ? AND user_id = ?'
            );
            const result = stmt.run(sessionId, user.id);

            if (result.changes === 0) {
                sendBadRequest(res, 'Session not found.');
                return;
            }

            await logAuditEvent(user.id, 'SESSION_REVOKED', req, { sessionId });

            sendSuccess(res, null, 'Session revoked');

        } catch (error: any) {
            sendBadRequest(res, error.message || 'Failed to revoke session.');
        }
    };
}
