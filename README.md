# CDN API - Image Optimization & Asset Management Service

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

A high-performance CDN API service for image optimization, file management, and asset delivery built with Express.js and TypeScript.

[Features](#features) • [Installation](#installation) • [API Documentation](#api-documentation) • [Development](#development)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

CDN API is a production-ready content delivery network service that provides intelligent image optimization, secure file storage, and efficient asset management. Built with modern web technologies, it offers both a RESTful API and a web-based dashboard for managing your digital assets.

### Key Technologies

- **Backend**: Express.js 5.x with TypeScript
- **Database**: Drizzle ORM with SQLite (Better-SQLite3)
- **Authentication**: JWT-based with bcrypt password hashing
- **Image Processing**: Sharp (high-performance image optimization)
- **Document Preview**: Puppeteer for PDF generation and document previews
- **TIFF Support**: TIFF.js for TIFF image handling
- **File Handling**: Multer, fs-extra
- **Security**: Express Rate Limiting, CORS, Session Management
- **Frontend**: EJS templating with Tailwind CSS 4.x
- **Development**: TypeScript, ts-node with hot reload

---

## ✨ Features

### 🖼️ Image Management
- **Intelligent Optimization**: Automatic image compression and format conversion
- **Multi-format Support**: JPEG, PNG, WebP, AVIF, GIF, TIFF
- **Responsive Images**: Generate multiple sizes for responsive design
- **Caching**: Built-in image caching for improved performance
- **Metadata Extraction**: EXIF data preservation and extraction

### 📁 File Management
- **Secure Upload**: Validated file uploads with type checking
- **Folder Organization**: Hierarchical folder structure support
- **File Operations**: Move, delete, rename, and search files
- **Preview Generation**: Document preview for supported formats
- **Direct Download**: Secure file download endpoints
- **Upload Tracking**: Complete audit trail of all uploads with user association
- **Metadata Storage**: File metadata and tags in SQLite database

### 🔐 Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin, user, and viewer roles
- **Session Management**: Active session tracking with refresh tokens
- **Account Security**: Failed login attempt tracking and account locking
- **Audit Logging**: Complete authentication audit trail
- **Password Security**: Bcrypt hashing with configurable rounds
- **Default Admin**: Auto-created admin account for initial setup

### 💾 Database & Migrations
- **SQLite Database**: Lightweight, serverless database with Drizzle ORM
- **Type-Safe Queries**: Full TypeScript support with Drizzle
- **Migration System**: Timestamp-based schema migration tracking
- **Seed Data**: Database seeding for demo users and test data
- **Database Studio**: Built-in Drizzle Studio for visual database management
- **Schema Export**: Export database schema for documentation

### 🔒 Security & Performance
- **Rate Limiting**: Configurable rate limits for all endpoints
  - Image uploads: 30 requests per 15 minutes
  - File uploads: 15 requests per 15 minutes
- **CORS Protection**: Configurable origin and pattern-based access control
- **IPv6 Support**: Full IPv4/IPv6 compatibility
- **Input Validation**: Comprehensive request validation

### 📊 Monitoring & Analytics
- **Storage Statistics**: Real-time storage usage analytics
- **File Type Analysis**: Breakdown by file type and folder
- **Largest Files Tracking**: Identify storage-heavy assets
- **Performance Metrics**: Response time and throughput monitoring

### 🎨 Web Dashboard
- **Authentication**: Login page with JWT-based authentication
- **Dashboard**: Overview of storage usage and recent activity
- **File Browser**: Visual interface for browsing and managing files with breadcrumb navigation
- **My Files**: Organize and manage files in folders
- **Quick Access**: Starred files and recent items for fast retrieval
- **Upload Interface**: User-friendly file upload with progress tracking
- **Upload History**: Track all upload activities with user information
- **Shared Files**: Manage and view shared resources
- **User Management**: Admin interface for managing user accounts
- **Search**: Powerful filename search capabilities
- **Responsive Design**: Mobile-friendly interface with modern UI

---

## 📦 Prerequisites

Before installing, ensure you have the following:

- **Node.js**: >= 18.0.0 (LTS recommended)
- **npm**: >= 9.0.0 or **yarn**: >= 1.22.0
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 512MB RAM (2GB+ recommended for image processing)
- **Disk Space**: Varies based on storage needs

### Optional Dependencies

- **Docker**: For containerized deployment
- **PM2**: For production process management
- **Nginx**: For reverse proxy setup

---

## 🚀 Installation

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd assets.stackdev.cloud

# Install dependencies
npm install

# Configure environment
cp env.json.example env.json
# Edit env.json with your configuration

# Initialize database
npm run migrate:up

# (Optional) Seed demo data
npm run seed

# Run in development mode
npm run dev
```

### Detailed Installation

#### 1. Clone and Install

```bash
git clone <repository-url>
cd assets.stackdev.cloud
npm install
```

#### 2. Configuration Setup

Create your configuration file:

```bash
cp env.json.example env.json
```

Edit `env.json` with your settings (see [Configuration](#configuration) section).

#### 3. Initialize Database

```bash
# Run database migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# (Optional) Seed demo users
npm run seed
```

#### 4. Build Assets

```bash
# Build CSS (Tailwind)
npm run build:css

# Full production build
npm run build
```

#### 5. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server will be available at `http://localhost:3000` (or your configured port).

---

## ⚙️ Configuration

### Environment Configuration (`env.json`)

```json
{
    "app": {
        "name": "CDN API",
        "env": "development"           // "development" or "production"
    },
    "port": 3000,                      // Server port
    "directories": [
        "./storage/**/**"               // Storage directory pattern
    ],
    "allow": {
        "origins": [                    // Allowed CORS origins
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        "patterns": [                   // Regex patterns for origins
            "^https?://.*\\.stackdev\\.cloud$"
        ]
    },
    "database": {
        "dbPath": "src/data/app.db",   // SQLite database path
        "autoRunMigrations": true,      // Run migrations on startup
        "autoRunSeeds": false           // Run seeds on startup
    },
    "auth": {
        "jwtSecret": "your-super-secret-jwt-key-min-32-characters-long",
        "jwtExpiresIn": "1h",           // Access token expiration
        "refreshTokenExpiresIn": "7d",  // Refresh token expiration
        "bcryptRounds": 12,             // Password hashing rounds
        "maxLoginAttempts": 5,          // Failed login limit
        "lockoutDuration": 15,          // Account lockout minutes
        "maxSessionsPerUser": 5         // Max concurrent sessions
    }
}
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `app.name` | string | Application name | "CDN API" |
| `app.env` | string | Environment mode | "development" |
| `port` | number | Server port | 3000 |
| `directories` | array | Storage directory patterns | `["./storage/**/**"]` |
| `allow.origins` | array | Exact CORS origins | `[]` |
| `allow.patterns` | array | Regex patterns for CORS | `[]` |
| `database.dbPath` | string | SQLite database file path | "src/data/app.db" |
| `database.autoRunMigrations` | boolean | Auto-run migrations on startup | true |
| `database.autoRunSeeds` | boolean | Auto-run seeds on startup | false |
| `auth.jwtSecret` | string | JWT secret key (min 32 chars) | Required |
| `auth.jwtExpiresIn` | string | Access token TTL | "1h" |
| `auth.refreshTokenExpiresIn` | string | Refresh token TTL | "7d" |
| `auth.bcryptRounds` | number | Password hashing strength | 12 |
| `auth.maxLoginAttempts` | number | Failed login threshold | 5 |
| `auth.lockoutDuration` | number | Lockout duration (minutes) | 15 |
| `auth.maxSessionsPerUser` | number | Max concurrent sessions per user | 5 |

### Storage Structure

The default storage structure:

```
storage/
├── background/      # Background images
│   └── cover/       # Cover images
├── documents/       # Document uploads
├── example/         # Example assets
│   └── site.webmanifest
└── files/           # General file uploads
```

You can customize storage locations in `env.json`.

---

## 🗄️ Database Management

### Database Overview

The application uses **SQLite** with **Drizzle ORM** for data persistence. The database file is stored at `src/data/app.db`.

### Database Schema

The system includes the following tables:

- **users** - User accounts with role-based access
- **sessions** - JWT session management with refresh tokens
- **auth_audit_log** - Security audit trail for authentication events
- **files** - Uploaded files metadata
- **uploads** - Upload tracking with user association
- **migrations** - Migration execution history

### Migration Commands

```bash
# Check migration status
npm run migrate:status

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create a new migration
npm run migrate:create "migration_name"
```

### Seeding Data

```bash
# Run all seed files
npm run seed

# Create a new seed file
npm run seed:create "seed_name"
```

### Drizzle Studio

Launch the visual database browser:

```bash
npm run db:studio
```

Then visit http://localhost:4983/ to:
- Browse all tables and data
- Run queries visually
- Edit records directly
- Export/import data

### Manual Database Operations

```bash
# Generate schema from TypeScript code
npm run db:generate

# Push schema changes directly to database
npm run db:push
```

⚠️ **Note**: Use `db:push` for rapid development, but use migrations (`migrate:up`) for production environments.

### Database Backup

To backup the database:

```bash
# Windows
copy src\data\app.db src\data\app.db.backup

# Linux/macOS
cp src/data/app.db src/data/app.db.backup
```

Or use the API endpoint:
```bash
curl -X POST http://localhost:3000/api/database/backup
```

---

## 🎮 Usage

### Starting the Server

```bash
# Development mode (with hot reload and detailed logging)
npm run dev

# Production mode
npm start

# Watch CSS changes (separate terminal)
npm run css
```

### Accessing the Application

- **Web Dashboard**: http://localhost:3000/
- **API Base URL**: http://localhost:3000/api/
- **API Welcome**: http://localhost:3000/api/
- **API Version**: http://localhost:3000/api/version
- **Database Studio**: Run `npm run db:studio` and visit http://localhost:4983/

### Default Admin Credentials

After running migrations, a default admin account is created:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@stackdev.cloud`

⚠️ **Important**: Change the admin password immediately after first login!

### Basic Examples

#### Upload an Image

```bash
curl -X POST http://localhost:3000/api/image/upload \
  -F "images=@photo.jpg"
```

#### Upload a File

```bash
curl -X POST http://localhost:3000/api/file/upload \
  -F "files=@document.pdf" \
  -F "path=/documents"
```

#### Get Storage Statistics

```bash
curl http://localhost:3000/api/storage
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

The API supports JWT-based authentication. While many endpoints work without authentication, protected endpoints require a valid JWT token.

#### Getting a Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### Using the Token

Include the JWT token in the Authorization header:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Token Management

- **Access Token**: Valid for 1 hour (configurable)
- **Refresh Token**: Valid for 7 days (configurable)
- Use `/auth/logout` to invalidate current session
- Use `/auth/logout-all` to invalidate all user sessions

### Endpoints Overview

| Category | Endpoint | Method | Description | Auth Required |
|----------|----------|--------|-------------|---------------|
| **Health** | `/` | GET | API welcome message | No |
| **Health** | `/version` | GET | Get API version info | No |
| **Auth** | `/auth/login` | POST | User login (rate limited) | No |
| **Auth** | `/auth/logout` | POST | Logout current session | Yes |
| **Auth** | `/auth/logout-all` | POST | Logout all sessions | Yes |
| **Auth** | `/auth/me` | GET | Get current user info | Yes |
| **Images** | `/image/upload` | POST | Upload images (rate limited) | Optional |
| **Images** | `/image/*` | GET | Retrieve optimized images | No |
| **Files** | `/file/upload` | POST | Upload files (rate limited) | Optional |
| **Files** | `/file/search` | GET | Search files by name | No |
| **Files** | `/file/move` | PUT | Move files/folders | Optional |
| **Files** | `/file/delete` | DELETE | Delete files | Optional |
| **Files** | `/file/download/*` | GET | Download files | No |
| **Files** | `/file/preview/*` | GET | Preview documents | No |
| **Folders** | `/folder` | GET | Get folder structure | No |
| **Database** | `/database/files` | GET | Get files database | No |
| **Database** | `/database/stats` | GET | Database statistics | No |
| **Database** | `/database/search` | GET | Search database | No |
| **Database** | `/database/backup` | POST | Backup database | Optional |
| **Storage** | `/storage` | GET | Full storage statistics | No |
| **Storage** | `/storage/summary` | GET | Quick storage summary | No |

### Detailed API Documentation

For comprehensive API documentation with examples, see:
- [Migration Guide](docs/how-to-use/MIGRATION_GUIDE.md) - Database migration system
- [Image Upload Endpoint](docs/how-to-use/image-upload-endpoint.md)
- [File Upload Endpoint](docs/how-to-use/file-upload-endpoint.md)
- [Storage API Endpoint](docs/how-to-use/storage-api-endpoint.md)
- [Get Image Endpoint](docs/how-to-use/get-image-endpoint.md)
- [Get Content Structure](docs/how-to-use/get-content-stracture.md)
- [Move File Endpoint](docs/how-to-use/move-file-endpoint.md)
- [Search Filename](docs/how-to-use/search-filename.md)
- [Rate Limiting](docs/how-to-use/rate-limiting.md)

### Postman Collection

Import the Postman collection for testing:
```
docs/collections/collection.postman_collection.json
```

### Web Dashboard Routes

The application includes a full-featured web interface accessible via browser:

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Dashboard overview with storage stats | Yes |
| `/login` | User authentication page | No |
| `/files` | File browser and manager | Yes |
| `/files/*` | Navigate through folder structure | Yes |
| `/starred` | Quick access to starred files | Yes |
| `/recent` | Recently accessed files | Yes |
| `/detail` | Detailed file information | Yes |
| `/share` | Shared files management | Yes |
| `/upload` | File upload interface | Yes |
| `/upload/history` | Upload activity history | Yes |
| `/users` | User management (Admin only) | Yes |

**Note**: Web authentication is handled via JWT tokens stored in browser cookies. Users are automatically redirected to `/login` if not authenticated.

---

## 🛠️ Development

### Project Scripts

#### Development
```bash
# Development server with hot reload
npm run dev

# Watch CSS changes (Tailwind)
npm run css

# Build CSS for production
npm run build:css

# Build TypeScript
npm run build

# Production server
npm start
```

#### Database Management
```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status

# Create new migration
npm run migrate:create "migration name"

# Run database seeds
npm run seed

# Create new seed file
npm run seed:create "seed name"

# Generate Drizzle schema
npm run db:generate

# Push schema changes
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Development Workflow

1. **Make Changes**: Edit TypeScript files in `src/`
2. **Auto Reload**: Server automatically restarts (ts-node watch mode)
3. **CSS Updates**: Run `npm run css` in separate terminal for Tailwind
4. **Testing**: Test endpoints using Postman collection
5. **Build**: Run `npm run build` before deployment

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use consistent indentation (2 spaces)
- **Imports**: ES modules with `.js` extensions
- **Error Handling**: Use try-catch with proper error responses
- **Comments**: Document complex logic and public APIs

### Adding New Features

1. **Create Route**: Add route file in `src/server/routes/`
2. **Create Controller**: Add controller in `src/server/controllers/`
3. **Add Utilities**: Add helper functions in `src/server/utils/`
4. **Register Route**: Import and use in `src/server/routes/api.ts`
5. **Update Documentation**: Add endpoint docs to `docs/how-to-use/`
6. **Update Postman**: Add to collection

---

## 📁 Project Structure

```
cdn.api.pphat.stackdev.cloud/
├── src/
│   ├── app.ts                          # Application entry point
│   ├── client/                         # Frontend application
│   │   ├── controller/                 # Client controllers
│   │   ├── middlewares/                # Client middlewares
│   │   │   └── auth.ts                 # Client auth middleware
│   │   ├── routes/                     # Client routes
│   │   │   └── web.ts                  # Web routes
│   │   ├── styles/                     # CSS/Tailwind styles
│   │   ├── utils/                      # Client utilities
│   │   └── views/                      # EJS templates
│   │       ├── components/             # Reusable components
│   │       ├── layouts/                # Layout templates
│   │       └── pages/                  # Page templates
│   ├── data/                           # Data storage
│   │   ├── app.db                      # SQLite database
│   │   ├── database.json               # Legacy JSON store
│   │   ├── migrations/                 # Database migrations
│   │   │   ├── 0000_youthful_ozymandias.sql
│   │   │   ├── 20260213_000000_create_initial_auth_tables_sqlite.ts
│   │   │   ├── 20260214_000000_create_files_uploads_tables_sqlite.ts
│   │   │   ├── meta/                   # Drizzle metadata
│   │   │   └── README.md
│   │   ├── schema/                     # Database schemas
│   │   │   └── schema.ts               # Drizzle ORM schema
│   │   └── seeds/                      # Database seeds
│   │       └── 20260213_010000_demo_users_sqlite.ts
│   └── server/                         # Backend API
│       ├── controllers/                # API controllers
│       │   ├── auth.controller.ts      # Authentication controller
│       │   ├── files.controller.ts
│       │   ├── folder.controller.ts
│       │   ├── images.controller.ts
│       │   ├── preview.controller.ts
│       │   ├── session.controller.ts   # Session management
│       │   ├── storage.controller.ts
│       │   ├── upload.controller.ts
│       │   └── users.controller.ts     # User management
│       ├── middlewares/                # Express middlewares
│       │   ├── auth.ts                 # JWT auth middleware
│       │   ├── cors.ts
│       │   ├── rate-limit.ts
│       │   └── security.ts             # Security headers
│       ├── routes/                     # API routes
│       │   ├── api.ts                  # Main API router
│       │   ├── auth.ts                 # Auth routes
│       │   ├── database.ts
│       │   ├── file.ts
│       │   ├── folder.ts
│       │   ├── image.ts
│       │   └── storage.ts
│       ├── types/                      # TypeScript types
│       │   └── user.ts                 # User & auth types
│       └── utils/                      # Server utilities
│           ├── auth.ts                 # Auth utilities
│           ├── config.ts               # Configuration loader
│           ├── database.ts             # Database operations (legacy)
│           ├── db.ts                   # Drizzle DB client
│           ├── directories.ts          # Directory utilities
│           ├── files.ts                # File operations
│           ├── image-cache.ts          # Image caching
│           ├── migration-runner.ts     # Migration system
│           ├── mine-types.ts           # MIME type detection
│           ├── response.ts             # Response helpers
│           └── storage.ts              # Storage statistics
├── storage/                            # File storage directory
│   ├── background/                     # Background images
│   │   └── cover/                      # Cover images
│   ├── documents/                      # Document files
│   ├── example/                        # Example assets
│   └── files/                          # General file uploads
├── docs/                               # Documentation
│   ├── collections/                    # Postman collections
│   │   └── collection.postman_collection.json
│   └── how-to-use/                     # Endpoint documentation
├── scripts/                            # Build and utility scripts
│   ├── migrate.ts                      # Migration CLI
│   └── register.mjs                    # TS-Node registration
├── dist/                               # Compiled output (gitignored)
├── drizzle.config.ts                   # Drizzle ORM config
├── env.json                            # Configuration (gitignored)
├── env.json.example                    # Configuration template
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── postcss.config.js                   # PostCSS config
├── Dockerfile                          # Docker configuration
└── README.md                           # This file
```

---

## 🚢 Deployment

### Production Build

```bash
# Install dependencies
npm ci --production=false

# Build application
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t cdn-api .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/storage:/app/storage \
  -v $(pwd)/env.json:/app/env.json \
  --name cdn-api \
  cdn-api
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/app.js --name cdn-api

# Enable startup script
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name cdn.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variables

For production, consider using environment variables instead of `env.json`:

```bash
export NODE_ENV=production
export PORT=3000
export APP_NAME="CDN API"
```

---

## 🧪 Testing

### Manual Testing

Use the provided Postman collection:

```bash
# Import collection
docs/collections/collection.postman_collection.json
```

### Testing Checklist

#### Authentication Tests
- [ ] User login with valid credentials
- [ ] Login rate limiting (5 attempts)
- [ ] Account locking after failed attempts
- [ ] JWT token validation
- [ ] Protected endpoint access
- [ ] Logout functionality
- [ ] Current user info retrieval

#### File Operations Tests
- [ ] Image upload with various formats (JPEG, PNG, WebP, TIFF)
- [ ] File upload with different file types
- [ ] File search by name
- [ ] File move operations
- [ ] File deletion
- [ ] File download
- [ ] Document preview generation

#### System Tests
- [ ] Rate limiting verification (all endpoints)
- [ ] CORS headers validation
- [ ] Storage statistics accuracy
- [ ] Database migrations (up/down)
- [ ] Seed data creation
- [ ] Error handling scenarios
- [ ] Session management

#### Database Tests
- [ ] Migration execution
- [ ] Rollback functionality
- [ ] Seed data integrity
- [ ] Foreign key constraints
- [ ] Data validation

### Performance Testing

```bash
# Install Apache Bench
apt-get install apache2-utils  # Linux
brew install httpd              # macOS

# Test image endpoint
ab -n 1000 -c 10 http://localhost:3000/api/storage/summary

# Test upload rate limiting
ab -n 50 -c 5 -p file.jpg -T multipart/form-data \
  http://localhost:3000/api/image/upload
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Make** your changes
5. **Test** thoroughly
6. **Commit** with clear messages (`git commit -m 'Add amazing feature'`)
7. **Push** to your branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### Code Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation for new features
- Ensure TypeScript compiles without errors
- Test your changes before submitting

### Commit Message Format

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(storage): add file type filtering to storage stats

Added optional query parameter to filter storage statistics by file type.
This allows users to get specific analytics for images, documents, etc.

Closes #123
```

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sophat (PPhat)**
- GitHub: [@pphatdev](https://github.com/pphatdev)
- Website: [stackdev.cloud](https://stackdev.cloud)

---

## 🙏 Acknowledgments

- **Sharp** - High-performance image processing
- **Express.js** - Fast, minimalist web framework
- **Multer** - Multipart/form-data handling
- **Tailwind CSS** - Utility-first CSS framework
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **Better-SQLite3** - Fast SQLite3 driver for Node.js

---

## 📮 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/how-to-use/)
2. Review [existing issues](https://github.com/pphatdev/cdn.api.pphat.stackdev.cloud/issues)
3. Open a [new issue](https://github.com/pphatdev/cdn.api.pphat.stackdev.cloud/issues/new) with details

---

## 🗺️ Roadmap

### Completed Features ✅

- [x] **Authentication & Authorization** - JWT-based auth with role-based access
- [x] **Database System** - SQLite with Drizzle ORM and migrations
- [x] **Session Management** - Refresh tokens and session tracking
- [x] **Security Audit** - Complete authentication audit trail
- [x] **Image Optimization** - Multi-format support with Sharp
- [x] **File Management** - Upload, organize, and manage files
- [x] **Rate Limiting** - Endpoint-specific rate limiting
- [x] **Storage Analytics** - Real-time storage statistics
- [x] **Web Dashboard** - Visual interface for file management

### Upcoming Features

- [ ] User profile management UI
- [ ] Two-factor authentication (2FA)
- [ ] Image watermarking
- [ ] Video processing support
- [ ] CDN integration (CloudFlare, AWS CloudFront)
- [ ] Automatic backup system
- [ ] Advanced analytics dashboard
- [ ] Webhook notifications
- [ ] API versioning
- [ ] API key system with per-key rate limiting
- [ ] File compression (ZIP archives)
- [ ] Batch operations API
- [ ] GraphQL API endpoint
- [ ] Email notifications
- [ ] Shared folder/file links

### Version History

- **1.0.0** (February 2026)
  - ✅ JWT authentication system
  - ✅ SQLite database with Drizzle ORM
  - ✅ Database migration system
  - ✅ User management with roles
  - ✅ Session tracking and refresh tokens
  - ✅ Security audit logging
  - ✅ File upload tracking in database
  - ✅ Image optimization engine
  - ✅ File management system
  - ✅ Rate limiting
  - ✅ Storage statistics
  - ✅ Web dashboard
  - ✅ Drizzle Studio integration

---

<div align="center">

**[⬆ Back to Top](#cdn-api---image-optimization--asset-management-service)**

Made with ❤️ by [pphatdev](https://github.com/pphatdev)

</div>
