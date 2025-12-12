## File search endpoint
**Endpoint:**
`GET /file/search?q=&type`

**Description:**
This endpoint allows you to search for files by their filename and type.

### Query Parameters
| Key  | Type   | Description                          |
| ---- | ------ | ------------------------------------ |
| q    | String | The search query for the filename    |
| type | String | (Optional) The type of file (e.g., image, document) |


### Example Request in Postman
1. Set the request method to **GET**.
2. Set the URL to: `{{url}}/file/search?q=sample&type=image`
3. (Optional) Add any required headers.
4. Click **Send** to search for files.

### Example cURL
```sh
curl -X GET "{{url}}/file/search?q=sample&type=image"
```

### Example Response
```json
{
    "message": "Files retrieved successfully",
    "status": 200,
    "result": [
        {
            "originalname": "sample.png",
            "encoding": "7bit",
            "mimetype": "image/png",
            "destination": "storage/images",
            "filename": "123e4567-e89b-12d3-a456-426614174000.png",
            "path": "storage\\images\\123e4567-e89b-12d3-a456-426614174000.png",
            "size": 204800
        }
    ]
}
```