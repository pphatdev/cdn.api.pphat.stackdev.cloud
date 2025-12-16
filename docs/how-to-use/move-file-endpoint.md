## How to Use: Move File Endpoint

**Endpoint:**
`PUT /file/move/:filename`

**Description:**
This endpoint allows you to move a file from its current location to a specified directory. The file is searched across all configured storage directories and moved to the target directory specified in the `storage` header.

### URL Parameters

| Key | Type | Description |
| --- | --- | --- |
| filename | String | The name of the file to move |

### Headers

| Key | Type | Description |
| --- | --- | --- |
| storage | String | The target directory path where the file should be moved |

### Example Request in Postman

1. Set the request method to **PUT**.
2. Set the URL to: `{{url}}/file/move/example.pdf`
3. In the **Headers** tab, add:
   - Key: `storage`
   - Value: `smarterp/documents` (or your desired target directory)
4. Click **Send** to move the file.

### Example cURL

```sh
curl -X PUT "{{url}}/file/move/example.pdf" \
    -H "storage: smarterp/documents"
```

### Example Response

**Success (200):**
```json
{
    "message": "File moved successfully",
    "status": 200,
    "data": {
        "oldPath": "/storage/previous/location/example.pdf",
        "newPath": "/storage/smarterp/documents/example.pdf"
    }
}
```

**Error Responses:**

**Bad Request (400) - Missing parameters:**
```json
{
    "message": "filename and targetDir are required.",
    "status": 400
}
```

**Not Found (404) - File not found:**
```json
{
    "message": "File not found.",
    "status": 404
}
```

**Bad Request (400) - Move operation failed:**
```json
{
    "message": "Failed to move file.",
    "status": 400
}
```

### Notes

- The file is automatically searched across all configured storage directories
- The target directory will be created if it doesn't exist
- Proper file and directory permissions are set automatically after the move
- The service is automatically reloaded after a successful move operation
- If a file with the same name already exists in the target directory, the operation may fail