import type { Config } from 'drizzle-kit';

export default {
    schema: './src/data/schema/schema.ts',
    out: './src/data/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: './src/data/app.db',
    },
} satisfies Config;
