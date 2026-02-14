# Database Migrations

This directory contains database migration scripts for managing schema changes.

## Overview

The migration system uses a timestamp-based approach to track and execute database changes in order. Each migration file contains `up` (apply changes) and `down` (rollback changes) functions.

## Usage

### Run All Pending Migrations
```bash
npm run migrate:up
# or
npm run migrate up
```

### Check Migration Status
```bash
npm run migrate:status
# or
npm run migrate status
```

### Create a New Migration
```bash
npm run migrate create add_user_profiles
# or
npm run migrate create "Add user profiles table"
```

This will create a new migration file with a timestamp prefix:
```
src/server/migrations/20260213_120530_add_user_profiles.ts
```

### Rollback Last Migration
```bash
npm run migrate:down
# or
npm run migrate down
```

## Migration File Structure

Each migration file exports an object with `up` and `down` functions:

```typescript
import { getDbClient } from '../utils/neon-db.js';

export default {
    async up() {
        const sql = getDbClient();
        
        // Apply changes
        await sql`
            CREATE TABLE example (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        console.log('✅ Migration completed');
    },
    
    async down() {
        const sql = getDbClient();
        
        // Rollback changes
        await sql`DROP TABLE IF EXISTS example`;
        
        console.log('✅ Migration rolled back');
    }
};
```

## Migration Tracking

The system automatically:
- Creates a `migrations` table to track executed migrations
- Records execution time and checksum for each migration
- Prevents re-running already executed migrations
- Handles migration failures gracefully

## Best Practices

1. **Naming Convention**: Use descriptive names
   - ✅ `create_users_table`
   - ✅ `add_email_to_users`
   - ❌ `update1` or `fix`

2. **One Change Per Migration**: Keep migrations focused
   - Create separate migrations for different concerns
   - Makes rollbacks easier and safer

3. **Always Test Rollbacks**: Ensure `down` functions work
   - Test locally before deploying
   - Some changes may not be reversible (data loss)

4. **Use Transactions**: For multiple operations
   ```typescript
   await sql.begin(async sql => {
       await sql`CREATE TABLE ...`;
       await sql`CREATE INDEX ...`;
   });
   ```

5. **Never Modify Executed Migrations**: 
   - Create a new migration instead
   - Changing executed migrations breaks checksums

## Example Migrations

### Create a Table
```typescript
async up() {
    const sql = getDbClient();
    await sql`
        CREATE TABLE posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            content TEXT,
            author_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `;
}
```

### Add a Column
```typescript
async up() {
    const sql = getDbClient();
    await sql`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`;
}
```

### Create an Index
```typescript
async up() {
    const sql = getDbClient();
    await sql`CREATE INDEX idx_posts_author ON posts(author_id)`;
}
```

### Seed Data
```typescript
async up() {
    const sql = getDbClient();
    await sql`
        INSERT INTO categories (name, slug) VALUES
        ('Technology', 'technology'),
        ('Business', 'business'),
        ('Entertainment', 'entertainment')
    `;
}
```

## Troubleshooting

### Migration Failed
If a migration fails:
1. Check the error message in the console
2. The failed migration is marked in the database
3. Fix the migration file
4. Delete the failed record: `DELETE FROM migrations WHERE name = 'migration_name'`
5. Run migrations again

### Reset All Migrations (Development Only)
```sql
-- ⚠️ WARNING: This will drop all data!
DROP TABLE migrations CASCADE;
```

Then run migrations from scratch:
```bash
npm run migrate:up
```

## Migration Status Output

The status command shows:
- ✅ Successfully executed migrations
- ❌ Failed migrations
- ⏸️ Pending migrations

Example:
```
📊 Migration Status:

Migration Files:
────────────────────────────────────────────────────────────────────────────────
✅ 20260213_000000_create_initial_auth_tables
   Executed: 2/13/2026, 1:15:30 AM (234ms)
⏸️  20260213_120530_add_user_profiles (pending)
────────────────────────────────────────────────────────────────────────────────
Total: 2 | Executed: 1 | Pending: 1
```
