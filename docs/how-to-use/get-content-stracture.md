## Get folder structure dynamically based on the route

**Endpoint:**
`GET /folder/*path`

**Description:**
This endpoint allows you to retrieve the structure of folders and files dynamically based on the specified path.

### Dynamic Path
| Path               | Description                                 |
| ------------------ | ------------------------------------------- |
| /folder/          | Shows top-level folders and files in `storage` |
| /folder/folder1   | Shows contents of `folder1`                 |

### Example Request in Postman
1. Set the request method to **GET**.
2. Set the URL to: `{{url}}/folder/folder1`
3. (Optional) Add any required headers.
4. Click **Send** to retrieve the folder structure.

### Example cURL

```sh
curl -X GET "{{url}}/folder/folder1"
```

### Example Response

```json
{
    "message": "Folder structure retrieved successfully",
    "status": 200,
    "result": {
        "folderName": "folder1",
        "files": [
            {
                "filename": "example1.png",
                "path": "storage/folder1/example1.png",
                "size": 204800
            },
            {
                "filename": "example2.docx",
                "path": "storage/folder1/example2.docx",
                "size": 102400
            }
        ],
        "subfolders": [
            {
                "folderName": "subfolder1",
                "path": "storage/folder1/subfolder1"
            }
        ]
    }
}
```