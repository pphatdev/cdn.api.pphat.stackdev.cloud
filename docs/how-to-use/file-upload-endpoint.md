## How to Use: File Upload Endpoint

**Endpoint:**
`POST /file/upload`

**Description:**
This endpoint allows you to upload one or more files to the server using three different methods:
1. Multipart Form Data Upload
2. Single File Upload via JSON Body (Base64)
3. Multiple File Uploads via JSON Body (Base64)

---

## Method 1: Multipart Form Data Upload

**Headers:**
- `Content-Type: multipart/form-data`
- `storage: string` (optional) - Specify storage folder
- `X-Prefix: string` (optional) - Add prefix to filename

### Form Data

| Key | Type | Description |
| --- | --- | --- |
| files | File | The file(s) to upload |

### Example Request in Postman

1. Set the request method to **POST**.
2. Set the URL to: `{{url}}/file/upload`
3. In the **Body** tab, select **form-data**.
4. Add a key named `files` and set its type to **File**.
5. Choose the file(s) you want to upload.
6. (Optional) Add any required headers (e.g., `storage: smarterp`, `X-Prefix: profile`).
7. Click **Send** to upload the file(s).

### Example cURL

```sh
curl -X POST "{{url}}/file/upload" \
    -H "storage: smarterp" \
    -H "X-Prefix: profile" \
    -F "files=@/path/to/your/file.png"
```

### Example Response

```json
{
    "message": "Files uploaded successfully",
    "status": 200,
    "result": [
        {
            "originalname": "_CV Template.docx",
            "encoding": "7bit",
            "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "destination": "storage/smarterp",
            "filename": "profile_40d018f6-6638-4c93-a677-4d3126c9002c.docx",
            "path": "storage\\smarterp\\profile_40d018f6-6638-4c93-a677-4d3126c9002c.docx",
            "size": 234685,
            "fileName": "_CV Template.docx",
            "pathFile": "/file/preview/profile_40d018f6-6638-4c93-a677-4d3126c9002c.docx",
            "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "name": "profile_40d018f6-6638-4c93-a677-4d3126c9002c.docx",
            "extension": "docx"
        }
    ]
}
```

---

## Method 2: Single File Upload via JSON Body (Base64)

**Headers:**
- `Content-Type: application/json`
- `storage: string` (optional) - Specify storage folder
- `X-Prefix: string` (optional) - Add prefix to filename

### JSON Body

| Key | Type | Description |
| --- | --- | --- |
| base64 | string | Base64 encoded file content (with or without data URI prefix) |
| filename | string | Name of the file |
| mimetype | string | MIME type of the file |

### Example Request in Postman

1. Set the request method to **POST**.
2. Set the URL to: `{{url}}/file/upload`
3. In the **Headers** tab, add `Content-Type: application/json`.
4. (Optional) Add headers: `storage: smarterp`, `X-Prefix: profile`.
5. In the **Body** tab, select **raw** and choose **JSON**.
6. Add the JSON body with base64, filename, and mimetype.
7. Click **Send** to upload the file.

### Example JSON Body

```json
{
    "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "filename": "myimage.png",
    "mimetype": "image/png"
}
```

### Example cURL

```sh
curl -X POST "{{url}}/file/upload" \
    -H "Content-Type: application/json" \
    -H "storage: smarterp" \
    -H "X-Prefix: profile" \
    -d '{
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "filename": "myimage.png",
        "mimetype": "image/png"
    }'
```

### Example Response

```json
{
    "status": 200,
    "message": "File uploaded successfully",
    "result": {
        "fileName": "myimage.png",
        "path": "/file/preview/profile_myimage.png",
        "pathFile": "/file/preview/profile_myimage.png",
        "type": "image/png",
        "name": "profile_myimage.png",
        "extension": "png",
        "size": 18456
    }
}
```

---

## Method 3: Multiple File Uploads via JSON Body (Base64)

**Headers:**
- `Content-Type: application/json`
- `storage: string` (optional) - Specify storage folder
- `X-Prefix: string` (optional) - Add prefix to filename

### JSON Body

| Key | Type | Description |
| --- | --- | --- |
| files | array | Array of file objects with base64, filename, and mimetype |

### Example Request in Postman

1. Set the request method to **POST**.
2. Set the URL to: `{{url}}/file/upload`
3. In the **Headers** tab, add `Content-Type: application/json`.
4. (Optional) Add headers: `storage: smarterp`, `X-Prefix: profile`.
5. In the **Body** tab, select **raw** and choose **JSON**.
6. Add the JSON body with an array of files.
7. Click **Send** to upload the files.

### Example JSON Body

```json
{
    "files": [
        {
            "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            "filename": "myimage.png",
            "mimetype": "image/png"
        },
        {
            "base64": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK...",
            "filename": "document.pdf",
            "mimetype": "application/pdf"
        }
    ]
}
```

### Example cURL

```sh
curl -X POST "{{url}}/file/upload" \
    -H "Content-Type: application/json" \
    -H "storage: smarterp" \
    -H "X-Prefix: profile" \
    -d '{
        "files": [
            {
                "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                "filename": "myimage.png",
                "mimetype": "image/png"
            },
            {
                "base64": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK...",
                "filename": "document.pdf",
                "mimetype": "application/pdf"
            }
        ]
    }'
```

### Example Response

```json
{
    "status": 200,
    "message": "Files uploaded successfully",
    "result": [
        {
            "fileName": "myimage.png",
            "path": "/file/preview/profile_myimage.png",
            "pathFile": "/file/preview/profile_myimage.png",
            "type": "image/png",
            "name": "profile_myimage.png",
            "extension": "png",
            "size": 18456
        },
        {
            "fileName": "document.pdf",
            "path": "/file/preview/profile_document.pdf",
            "pathFile": "/file/preview/profile_document.pdf",
            "type": "application/pdf",
            "name": "profile_document.pdf",
            "extension": "pdf",
            "size": 45678
        }
    ]
}
```