## Image upload endpoint
**Endpoint:**
`POST /image/upload`

**Description:**
This endpoint allows you to upload one or more image files to the server.

### Form Data
| Key    | Type | Description          |
| ------ | ---- | -------------------- |
| images | File | The image file(s) to upload |

### Example Request in Postman
1. Set the request method to **POST**.
2. Set the URL to: `{{url}}/image/upload`
3. In the **Body** tab, select **form-data**.
4. Add a key named `images` and set its type to **File**.
5. Choose the image file(s) you want to upload.
6. (Optional) Add any required headers (e.g., `storage: smarterp`).
7. Click **Send** to upload the image file(s).

### Example cURL
```sh
curl -X POST "{{url}}/image/upload"
    -H "storage: folder/smarterp"
    -F "images=@/path/to/your/image.png"
```
### Example Response
```json
{
    "message": "Images uploaded successfully",
    "status": 200,
    "result": [
        {
            "originalname": "image1.png",
            "encoding": "7bit",
            "mimetype": "image/png",
            "destination": "storage/smarterp",
            "filename": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.png",
            "path": "storage\\smarterp\\a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.png",
            "size": 123456
        }
    ]
}
```