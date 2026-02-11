# Storage API Endpoints

## Overview

The Storage API provides comprehensive information about storage usage, including file counts, folder sizes, file type breakdowns, and largest files.

## Endpoints

### 1. Get Storage Statistics

**Endpoint:** `GET /api/storage`

**Description:** Retrieve detailed storage statistics including folder breakdown, file type analysis, and largest files.

**Response:**

```json
{
    "status": 200,
    "message": "Storage statistics retrieved successfully",
    "data": {
        "totalSize": 5368709120,
        "totalSizeFormatted": "5.0 GB",
        "totalFiles": 1250,
        "totalFolders": 45,
        "folderBreakdown": [
            {
                "name": "images",
                "path": "storage/images",
                "fileCount": 800,
                "totalSize": 4294967296,
                "formattedSize": "4.0 GB"
            },
            {
                "name": "files",
                "path": "storage/files",
                "fileCount": 350,
                "totalSize": 1073741824,
                "formattedSize": "1.0 GB"
            }
        ],
        "fileTypeBreakdown": {
            "jpg": {
                "count": 450,
                "size": 2147483648,
                "formattedSize": "2.0 GB"
            },
            "png": {
                "count": 350,
                "size": 2147483648,
                "formattedSize": "2.0 GB"
            },
            "pdf": {
                "count": 200,
                "size": 536870912,
                "formattedSize": "512 MB"
            }
        },
        "largestFiles": [
            {
                "path": "images/large-image.jpg",
                "name": "large-image.jpg",
                "size": 104857600,
                "type": "jpg"
            },
            {
                "path": "files/presentation.pptx",
                "name": "presentation.pptx",
                "size": 52428800,
                "type": "pptx"
            }
        ],
        "storageDirectory": "/path/to/storage"
    }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/storage"
```

**Use Cases:**

- Storage analytics dashboards
- Capacity planning
- Identifying largest files for cleanup
- Understanding storage distribution by folder
- File type analysis for optimization

---

### 2. Get Storage Summary

**Endpoint:** `GET /api/storage/summary`

**Description:** Retrieve a quick summary of storage usage. This is a lighter and faster version that provides essential metrics without detailed breakdowns.

**Response:**

```json
{
    "status": 200,
    "message": "Storage summary retrieved successfully",
    "data": {
        "totalSize": 5368709120,
        "totalSizeFormatted": "5.0 GB",
        "totalFiles": 1250,
        "totalFolders": 45,
        "storageDirectory": "/path/to/storage"
    }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/storage/summary"
```

**Use Cases:**

- Quick dashboard widgets
- API responses where detailed breakdown is not needed
- Frequent polling for storage metrics
- Mobile applications with limited bandwidth
- Monitoring and alerting systems

---

## Response Fields

### Storage Statistics (Full)

| Field | Type | Description |
|-------|------|-------------|
| `totalSize` | number | Total storage size in bytes |
| `totalSizeFormatted` | string | Human-readable total size (e.g., "5.0 GB") |
| `totalFiles` | number | Total number of files |
| `totalFolders` | number | Total number of folders |
| `folderBreakdown` | array | Array of folder statistics |
| `fileTypeBreakdown` | object | Statistics grouped by file extension |
| `largestFiles` | array | Top 10 largest files |
| `storageDirectory` | string | Absolute path to storage directory |

### Folder Breakdown Item

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Folder name |
| `path` | string | Full folder path |
| `fileCount` | number | Number of files in folder |
| `totalSize` | number | Total size in bytes |
| `formattedSize` | string | Human-readable size |

### File Type Breakdown Item

| Field | Type | Description |
|-------|------|-------------|
| `count` | number | Number of files of this type |
| `size` | number | Total size in bytes |
| `formattedSize` | string | Human-readable size |

### Largest Files Item

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Relative path to file |
| `name` | string | File name |
| `size` | number | File size in bytes |
| `type` | string | File extension |

---

## Performance Considerations

### Full Statistics (`/api/storage`)
- **Response Time:** Varies based on file count (typically 1-5 seconds)
- **Recommended Usage:** On-demand requests, not for frequent polling
- **Best For:** Detailed analysis, reports, administrative dashboards

### Summary (`/api/storage/summary`)
- **Response Time:** Faster than full statistics
- **Recommended Usage:** Suitable for frequent polling
- **Best For:** Quick metrics, monitoring, status indicators

---

## Error Responses

### 500 Internal Server Error

```json
{
    "status": 500,
    "message": "Error retrieving storage statistics: [error details]",
    "data": null
}
```

**Common Causes:**
- Storage directory doesn't exist (will be created automatically)
- Permission issues accessing files
- Disk I/O errors

---

## Example Integration

### JavaScript/TypeScript

```typescript
// Get full statistics
async function getStorageStats() {
    const response = await fetch('http://localhost:3000/api/storage');
    const data = await response.json();
    console.log('Total Storage:', data.data.totalSizeFormatted);
    console.log('Total Files:', data.data.totalFiles);
    return data.data;
}

// Get quick summary
async function getStorageSummary() {
    const response = await fetch('http://localhost:3000/api/storage/summary');
    const data = await response.json();
    return data.data;
}
```

### Python

```python
import requests

# Get full statistics
response = requests.get('http://localhost:3000/api/storage')
stats = response.json()['data']
print(f"Total Storage: {stats['totalSizeFormatted']}")
print(f"Total Files: {stats['totalFiles']}")

# Get quick summary
response = requests.get('http://localhost:3000/api/storage/summary')
summary = response.json()['data']
print(f"Storage: {summary['totalSizeFormatted']}")
```

---

## Notes

- Both endpoints scan the entire storage directory recursively
- File sizes are calculated accurately including all nested folders
- Storage directory is determined from application configuration
- Folders without files are not counted in folder breakdown
- File type breakdown is based on file extensions (case-insensitive)
- The summary endpoint is optimized for faster response times
- All size formatting uses binary units (1024 bytes = 1 KB)
