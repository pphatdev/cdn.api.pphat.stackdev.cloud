# Database Migration System - Quick Start Guide

## ✨ What Was Created

A complete database migration system has been set up for your project with the following components:

### 📁 Files Created

1. **`src/server/utils/migration-runner.ts`** - Core migration engine
   - Executes migrations in order
   - Tracks migration history
   - Handles rollbacks
   - Creates new migration files

2. **`scripts/migrate.ts`** - CLI tool for managing migrations
   - Command-line interface for all migration operations

3. **`src/server/migrations/`** - Migration files directory
   - Stores all migration scripts
   - Includes initial auth tables migration

4. **`src/server/utils/neon-db.ts`** - Updated with migration functions
   - `initializeMigrationTable()` - Creates migrations tracking table
   - `recordMigration()` - Records executed migrations
   - `hasMigrationRun()` - Checks if migration was executed
   - `getExecutedMigrations()` - Lists all executed migrations

## 🚀 Quick Start

### Check Migration Status
```bash
npm run migrate:status
```
Shows which migrations have been executed and which are pending.

### Run Pending Migrations
```bash
npm run migrate:up
```
Executes all migrations that haven't been run yet.

### Create a New Migration
```bash
npm run migrate create "add user profiles table"
```
Creates a new timestamped migration file.

### Rollback Last Migration
```bash
npm run migrate:down
```
Reverts the most recently executed migration (if it has a `down` function).

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run migrate:status` | Show migration status |
| `npm run migrate:up` | Run all pending migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate create <name>` | Create new migration file |

## 🎯 Example: Creating a Migration

### 1. Create the Migration File
```bash
npm run migrate create "add user settings table"
```

This creates: `src/server/migrations/20260213_120530_add_user_settings_table.ts`

### 2. Edit the Migration File
```typescript
import { getDbClient } from '../utils/neon-db.js';

export default {
    async up() {
        const sql = getDbClient();
        
        await sql`
            CREATE TABLE user_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                theme VARCHAR(20) DEFAULT 'light',
                language VARCHAR(10) DEFAULT 'en',
                notifications BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await sql`CREATE INDEX idx_user_settings_user_id ON user_settings(user_id)`;
        
        console.log('✅ User settings table created');
    },
    
    async down() {
        const sql = getDbClient();
        await sql`DROP TABLE IF EXISTS user_settings CASCADE`;
        console.log('✅ User settings table dropped');
    }
};
```

### 3. Run the Migration
```bash
npm run migrate:up
```

### 4. Verify
```bash
npm run migrate:status
```

## 🔍 Migration Status Example

```
📊 Migration Status:

Migration Files:
────────────────────────────────────────────────────────────────────────────────
✅ 20260213_000000_create_initial_auth_tables
   Executed: 2/13/2026, 1:16:28 AM (1485ms)
✅ 20260213_120530_add_user_settings_table
   Executed: 2/13/2026, 12:05:30 PM (234ms)
⏸️  20260213_143000_add_user_profiles (pending)
────────────────────────────────────────────────────────────────────────────────
Total: 3 | Executed: 2 | Pending: 1
```

## 🛠️ Features

### ✅ Automatic Tracking
- All migrations are tracked in the `migrations` table
- Prevents duplicate executions
- Records execution time and checksums

### ✅ Ordered Execution
- Migrations run in timestamp order
- Ensures consistency across environments

### ✅ Safety Features
- Validation before execution
- Detailed error messages
- Transaction support (when using SQL transactions)

### ✅ Rollback Support
- Each migration can include a `down` function
- Safely revert changes if needed

## 📚 Common Migration Patterns

### Create Table
```typescript
await sql`
    CREATE TABLE posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
`;
```

### Add Column
```typescript
await sql`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`;
```

### Create Index
```typescript
await sql`CREATE INDEX idx_posts_created_at ON posts(created_at)`;
```

### Seed Data
```typescript
await sql`
    INSERT INTO roles (name, permissions) VALUES
    ('admin', '["read", "write", "delete"]'),
    ('user', '["read", "write"]'),
    ('viewer', '["read"]')
`;
```

## ⚠️ Best Practices

1. **Test Migrations Locally First**
   - Always test on development database
   - Verify both `up` and `down` functions

2. **One Change Per Migration**
   - Keep migrations focused and atomic
   - Easier to debug and rollback

3. **Never Edit Executed Migrations**
   - Create a new migration instead
   - Editing changes the checksum

4. **Write Reversible Migrations**
   - Always include `down` function when possible
   - Some operations can't be reversed (data deletion)

5. **Use Descriptive Names**
   - ✅ `add_email_verification_to_users`
   - ❌ `update_users` or `fix1`

## 🔧 Troubleshooting

### Migration Failed?
1. Check error message in console
2. Fix the migration file
3. Delete failed record: `DELETE FROM migrations WHERE status = 'failed'`
4. Run migration again

### Need to Reset?
**⚠️ Development Only - This will delete all data!**
```sql
DROP TABLE migrations CASCADE;
DROP TABLE auth_audit_log CASCADE;
DROP TABLE sessions CASCADE;
DROP TABLE users CASCADE;
```
Then run: `npm run migrate:up`

## 📦 What's Included

### Initial Migration
The system includes one migration that creates:
- **users** table - User accounts with authentication
- **sessions** table - Active user sessions with JWT tokens
- **auth_audit_log** table - Security audit trail
- All necessary indexes for performance

This migration is already executed in your database.

## 🎉 You're All Set!

Your migration system is ready to use. Create new migrations as your database schema evolves!

For detailed documentation, see: `src/server/migrations/README.md`
