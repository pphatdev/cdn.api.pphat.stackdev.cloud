## Avatar upload endpoint
**Endpoint:**
`POST /auth/me/avatar`

**Description:**
This endpoint allows the currently authenticated user to upload or update their profile avatar. The avatar is stored in the `avatars` directory and the user's profile is updated with the new avatar URL.

### Form Data
| Key    | Type | Description          |
| ------ | ---- | -------------------- |
| avatar | File | The image file to set as avatar (JPG, PNG, WebP) |

### Requirements
- **Authentication**: Required (JWT Bearer Token)
- **Max File Size**: 5MB
- **Allowed Mime Types**: `image/jpeg`, `image/png`, `image/webp`

### Example Request in Postman
1. Set the request method to **POST**.
2. Set the URL to: `{{url}}/auth/me/avatar`
3. In the **Auth** tab, ensure you are using a Bearer Token.
4. In the **Body** tab, select **form-data**.
5. Add a key named `avatar` and set its type to **File**.
6. Choose the image file you want to upload.
7. Click **Send** to upload the avatar.

### Example cURL
```sh
curl -X POST "{{url}}/auth/me/avatar" \
    -H "Authorization: Bearer <your_access_token>" \
    -F "avatar=@/path/to/your/avatar.png"
```

### Example Response
```json
{
    "message": "Avatar uploaded successfully",
    "status": 200,
    "result": {
        "avatarUrl": "/api/image/avatars_123e4567-e89b-12d3_filename.png"
    }
}
```
