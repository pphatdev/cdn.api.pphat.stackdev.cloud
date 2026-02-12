import { getDbClient } from '../utils/db.js';
import bcrypt from 'bcrypt';

/**
 * Seed: Demo Users
 * Created: 2026-02-13T01:00:00.000Z
 * 
 * This seed creates demo user accounts for testing purposes
 */

export default {
    /**
     * Run the seed
     */
    async up() {
        const sql = getDbClient();

        console.log('🌱 Creating demo users...');

        // Hash passwords
        const password = await bcrypt.hash('demo123', 12);

        try {
            // Check if demo users already exist
            const existingUsers = await sql`
                SELECT username FROM users 
                WHERE username IN ('demo_user', 'demo_viewer')
            `;

            if (existingUsers.length > 0) {
                console.log('ℹ️  Demo users already exist, skipping...');
                return;
            }

            // Create demo user with 'user' role
            await sql`
                INSERT INTO users (
                    username, 
                    email, 
                    password_hash, 
                    name, 
                    role, 
                    is_active
                ) VALUES (
                    'demo_user',
                    'user@demo.com',
                    ${password},
                    'Demo User',
                    'user',
                    true
                )
            `;

            // Create demo viewer with 'viewer' role
            await sql`
                INSERT INTO users (
                    username, 
                    email, 
                    password_hash, 
                    name, 
                    role, 
                    is_active
                ) VALUES (
                    'demo_viewer',
                    'viewer@demo.com',
                    ${password},
                    'Demo Viewer',
                    'viewer',
                    true
                )
            `;

            console.log('✅ Demo users created successfully:');
            console.log('   - demo_user (role: user) - Password: demo123');
            console.log('   - demo_viewer (role: viewer) - Password: demo123');
            console.log('✅ Seed "Demo Users" completed');
        } catch (error: any) {
            if (error.code === '23505') {
                // Unique constraint violation
                console.log('ℹ️  Demo users already exist');
            } else {
                throw error;
            }
        }
    }
};
