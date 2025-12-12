## How to Use: File Upload Endpoint

**Endpoint:**
`POST /file/upload`

**Description:**
This endpoint allows you to upload one or more files to the server.

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
6. (Optional) Add any required headers (e.g., `storage: smarterp`).
7. Click **Send** to upload the file(s).


### Example cURL

```sh
curl -X POST "{{url}}/file/upload"
    -H "storage: folder/smarterp"
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
            "filename": "40d018f6-6638-4c93-a677-4d3126c9002c.docx",
            "path": "storage\\smarterp\\40d018f6-6638-4c93-a677-4d3126c9002c.docx",
            "size": 234685
        }
    ]
}
```