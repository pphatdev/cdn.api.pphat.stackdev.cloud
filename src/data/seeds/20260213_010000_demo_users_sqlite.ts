import { getSqliteClient, getDbClient } from '../../server/utils/db.js';
import bcrypt from 'bcrypt';
import { users } from '../schema/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Seed: Demo Users (SQLite)
 * Created: 2026-02-13T01:00:00.000Z
 * 
 * This seed creates demo user accounts for testing purposes
 */

export default {
    /**
     * Run the seed
     */
    async up() {
        const db = getDbClient();
        const sqlite = getSqliteClient();

        console.log('🌱 Creating demo users...');

        // Hash passwords
        const password = await bcrypt.hash('demo123', 12);

        try {
            // Check if demo users already exist
            const existingUsers = await db.select()
                .from(users)
                .where(eq(users.username, 'demo_user' as any))
                .limit(1);

            if (existingUsers.length > 0) {
                console.log('ℹ️  Demo users already exist, skipping...');
                return;
            }

            // Create demo admin user
            const adminId = crypto.randomUUID();
            sqlite.prepare(`
                INSERT INTO users (
                    id, username, email, password_hash, name, role, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                adminId,
                'admin',
                'admin@demo.com',
                password,
                'Admin User',
                'admin',
                1
            );

            // Create demo user with 'user' role
            const userId = crypto.randomUUID();
            sqlite.prepare(`
                INSERT INTO users (
                    id, username, email, password_hash, name, role, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                userId,
                'demo_user',
                'user@demo.com',
                password,
                'Demo User',
                'user',
                1
            );

            // Create demo viewer with 'viewer' role
            const viewerId = crypto.randomUUID();
            sqlite.prepare(`
                INSERT INTO users (
                    id, username, email, password_hash, name, role, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                viewerId,
                'demo_viewer',
                'viewer@demo.com',
                password,
                'Demo Viewer',
                'viewer',
                1
            );

            console.log('✅ Demo users created successfully:');
            console.log('   - admin (role: admin) - Password: demo123');
            console.log('   - demo_user (role: user) - Password: demo123');
            console.log('   - demo_viewer (role: viewer) - Password: demo123');
            console.log('✅ Seed "Demo Users" completed');
        } catch (error: any) {
            if (error.message?.includes('UNIQUE constraint')) {
                console.log('ℹ️  Demo users already exist');
            } else {
                throw error;
            }
        }
    }
};
