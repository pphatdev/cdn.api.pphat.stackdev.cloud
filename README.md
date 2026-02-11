# CDN API - Image Optimization & Asset Management Service

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

A high-performance CDN API service for image optimization, file management, and asset delivery built with Express.js and TypeScript.

[Features](#features) • [Installation](#installation) • [API Documentation](#api-documentation) • [Contributing](#contributing)

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
- **Image Processing**: Sharp (high-performance image optimization)
- **File Handling**: Multer, fs-extra
- **Security**: Express Rate Limiting, CORS
- **Frontend**: EJS templating with Tailwind CSS
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
- **File Browser**: Visual interface for browsing and managing files
- **Quick Access**: Starred files and recent items
- **Search**: Powerful filename search capabilities
- **Responsive Design**: Mobile-friendly interface

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
git clone https://github.com/pphatdev/cdn.api.pphat.stackdev.cloud.git
cd cdn.api.pphat.stackdev.cloud

# Install dependencies
npm install

# Configure environment
cp env.json.example env.json
# Edit env.json with your configuration

# Run in development mode
npm run dev
```

### Detailed Installation

#### 1. Clone and Install

```bash
git clone https://github.com/pphatdev/cdn.api.pphat.stackdev.cloud.git
cd cdn.api.pphat.stackdev.cloud
npm install
```

#### 2. Configuration Setup

Create your configuration file:

```bash
cp env.json.example env.json
```

Edit `env.json` with your settings (see [Configuration](#configuration) section).

#### 3. Build Assets

```bash
# Build CSS (Tailwind)
npm run build:css

# Full production build
npm run build
```

#### 4. Start the Server

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

### Storage Structure

The default storage structure:

```
storage/
├── images/          # Optimized images
├── test/            # Test files
└── example/         # Example assets
```

You can customize storage locations in `env.json`.

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
- **Health Check**: http://localhost:3000/api/ping

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

Currently, the API does not require authentication. For production use, implement authentication middleware.

### Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Health** | `/ping` | GET | API health check |
| **Images** | `/image/upload` | POST | Upload images (rate limited) |
| **Images** | `/image/*` | GET | Retrieve optimized images |
| **Images** | `/image/cache` | GET | Cached images list |
| **Files** | `/file/upload` | POST | Upload files (rate limited) |
| **Files** | `/file/search` | GET | Search files by name |
| **Files** | `/file/move` | POST | Move files/folders |
| **Files** | `/file/delete` | DELETE | Delete files |
| **Files** | `/file/download/*` | GET | Download files |
| **Files** | `/file/preview/*` | GET | Preview documents |
| **Folders** | `/folder` | GET | Get folder structure |
| **Database** | `/database` | GET | Get database JSON |
| **Storage** | `/storage` | GET | Full storage statistics |
| **Storage** | `/storage/summary` | GET | Quick storage summary |

### Detailed API Documentation

For comprehensive API documentation with examples, see:
- [Image Upload Endpoint](docs/how-to-use/image-upload-endpoint.md)
- [File Upload Endpoint](docs/how-to-use/file-upload-endpoint.md)
- [Storage API Endpoint](docs/how-to-use/storage-api-endpoint.md)
- [Get Image Endpoint](docs/how-to-use/get-image-endpoint.md)
- [Move File Endpoint](docs/how-to-use/move-file-endpoint.md)
- [Search Filename](docs/how-to-use/search-filename.md)
- [Rate Limiting](docs/how-to-use/rate-limiting.md)

### Postman Collection

Import the Postman collection for testing:
```
docs/collections/collection.postman_collection.json
```

---

## 🛠️ Development

### Project Scripts

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
│   │   ├── routes/                     # Client routes
│   │   ├── styles/                     # CSS/Tailwind styles
│   │   ├── utils/                      # Client utilities
│   │   └── views/                      # EJS templates
│   │       ├── components/             # Reusable components
│   │       ├── layouts/                # Layout templates
│   │       └── pages/                  # Page templates
│   └── server/                         # Backend API
│       ├── controllers/                # API controllers
│       │   ├── files.controller.ts
│       │   ├── folder.controller.ts
│       │   ├── images.controller.ts
│       │   ├── preview.controller.ts
│       │   ├── storage.controller.ts
│       │   └── upload.controller.ts
│       ├── data/                       # Data storage
│       │   └── database.json
│       ├── middlewares/                # Express middlewares
│       │   ├── cors.ts
│       │   └── rate-limit.ts
│       ├── routes/                     # API routes
│       │   ├── api.ts                  # Main API router
│       │   ├── database.ts
│       │   ├── file.ts
│       │   ├── folder.ts
│       │   ├── image.ts
│       │   └── storage.ts
│       └── utils/                      # Server utilities
│           ├── config.ts               # Configuration loader
│           ├── database.ts             # Database operations
│           ├── directories.ts          # Directory utilities
│           ├── files.ts                # File operations
│           ├── image-cache.ts          # Image caching
│           ├── mine-types.ts           # MIME type detection
│           ├── response.ts             # Response helpers
│           └── storage.ts              # Storage statistics
├── storage/                            # File storage directory
│   ├── images/                         # Optimized images
│   ├── test/                           # Test files
│   └── example/                        # Example assets
├── docs/                               # Documentation
│   ├── collections/                    # Postman collections
│   └── how-to-use/                     # Endpoint documentation
├── dist/                               # Compiled output (gitignored)
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

- [ ] Image upload with various formats
- [ ] File upload with different file types
- [ ] Rate limiting verification
- [ ] CORS headers validation
- [ ] Storage statistics accuracy
- [ ] File operations (move, delete, search)
- [ ] Preview generation
- [ ] Error handling scenarios

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

---

## 📮 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/how-to-use/)
2. Review [existing issues](https://github.com/pphatdev/cdn.api.pphat.stackdev.cloud/issues)
3. Open a [new issue](https://github.com/pphatdev/cdn.api.pphat.stackdev.cloud/issues/new) with details

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] Authentication & Authorization (JWT)
- [ ] Image watermarking
- [ ] Video processing support
- [ ] CDN integration (CloudFlare, AWS CloudFront)
- [ ] Automatic backup system
- [ ] Advanced analytics dashboard
- [ ] Webhook notifications
- [ ] API versioning
- [ ] Rate limiting per API key
- [ ] File compression (ZIP archives)
- [ ] Batch operations API
- [ ] GraphQL API endpoint

### Version History

- **1.0.0** (Current)
  - Initial release
  - Image optimization
  - File management
  - Rate limiting
  - Storage statistics
  - Web dashboard

---

<div align="center">

**[⬆ Back to Top](#cdn-api---image-optimization--asset-management-service)**

Made with ❤️ by [pphatdev](https://github.com/pphatdev)

</div>
