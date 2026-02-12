#!/usr/bin/env node

import { runMigrations, rollbackLastMigration, getMigrationStatus, createMigration } from '../src/server/utils/migration-runner.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'server', 'migrations');

/**
 * Display help message
 */
const showHelp = () => {
    console.log(`
📦 Database Migration Tool

Usage: npm run migrate [command] [options]

Commands:
    up              Run all pending migrations
    down            Rollback the last migration
    status          Show migration status
    create <name>   Create a new migration file

Examples:
    npm run migrate up
    npm run migrate down
    npm run migrate status
    npm run migrate create add_users_table

Options:
    --help, -h      Show this help message
    `);
};

/**
 * Main function
 */
const main = async () => {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case 'up':
            case 'run':
                await runMigrations(MIGRATIONS_DIR);
                break;

            case 'down':
            case 'rollback':
                await rollbackLastMigration(MIGRATIONS_DIR);
                break;

            case 'status':
            case 'list':
                await getMigrationStatus(MIGRATIONS_DIR);
                break;

            case 'create':
            case 'new':
                const migrationName = args.slice(1).join(' ');
                if (!migrationName) {
                    console.error('❌ Error: Migration name is required');
                    console.log('Usage: npm run migrate create <name>');
                    process.exit(1);
                }
                createMigration(MIGRATIONS_DIR, migrationName);
                break;

            case '--help':
            case '-h':
            case 'help':
                showHelp();
                break;

            default:
                console.error(`❌ Unknown command: ${command}\n`);
                showHelp();
                process.exit(1);
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
};

// Run the CLI
main();
