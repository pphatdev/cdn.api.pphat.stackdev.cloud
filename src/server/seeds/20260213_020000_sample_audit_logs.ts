import { getDbClient } from '../utils/db.js';

/**
 * Seed: Sample Audit Logs
 * Created: 2026-02-13T01:00:00.000Z
 * 
 * This seed creates sample audit log entries for demonstration
 */

export default {
    /**
     * Run the seed
     */
    async up() {
        const sql = getDbClient();

        console.log('🌱 Creating sample audit logs...');

        try {
            // Get admin user ID
            const adminUser = await sql`
                SELECT id FROM users WHERE username = 'admin' LIMIT 1
            `;

            if (adminUser.length === 0) {
                console.log('ℹ️  Admin user not found, skipping audit log seed');
                return;
            }

            const adminId = adminUser[0].id;

            // Check if audit logs already exist
            const existingLogs = await sql`
                SELECT COUNT(*) as count FROM auth_audit_log
            `;

            if (existingLogs[0].count > 10) {
                console.log('ℹ️  Audit logs already seeded, skipping...');
                return;
            }

            // Create sample audit log entries
            await sql`
                INSERT INTO auth_audit_log (
                    user_id,
                    action,
                    ip_address,
                    user_agent,
                    details
                ) VALUES 
                (
                    ${adminId},
                    'login',
                    '127.0.0.1',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    '{"method": "password", "success": true}'::jsonb
                ),
                (
                    ${adminId},
                    'password_change',
                    '127.0.0.1',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    '{"reason": "security", "success": true}'::jsonb
                ),
                (
                    ${adminId},
                    'profile_update',
                    '127.0.0.1',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    '{"fields": ["name", "avatar"], "success": true}'::jsonb
                )
            `;

            console.log('✅ Sample audit logs created successfully');
            console.log('✅ Seed "Sample Audit Logs" completed');
        } catch (error: any) {
            console.error('❌ Error creating audit logs:', error.message);
            throw error;
        }
    }
};
