## Image optimization endpoint
**Endpoint:**
`GET /assets/image/:filename`

**Description:**
This endpoint allows you to retrieve and optimize an image file stored on the server by specifying the filename as a URL parameter. You can apply various optimization options through query parameters.

### URL Parameters
| Key      | Type   | Description                     |
| -------- | ------ | ------------------------------- |
| filename | String | The name of the image file to retrieve and optimize |

### Query Parameters
| Key | Type   | Description                                      |
| --- | ------ | ------------------------------------------------ |
| fm  | String | (Optional) Format (e.g., jpg, png, webp) |
| q   | Number | (Optional) Quality (e.g., 80) |
| w   | Number | (Optional) Width (e.g., 300) |
| h   | Number | (Optional) Height (e.g., 300) |
| fit | String | (Optional) Fit mode (e.g., cover, contain) |

### Example Request in Postman
1. Set the request method to **GET**.
2. Set the URL to: `{{url}}/assets/image/sample.png?fm=webp&q=80&w=300&h=300&fit=cover`
3. (Optional) Add any required headers.
4. Click **Send** to retrieve and optimize the image.

### Example cURL
```sh
curl -X GET "{{url}}/assets/image/sample.png?fm=webp&q=80&w=300&h=300&fit=cover"
```

### Example Response
The response will be the optimized image file. The content type will depend on the requested format (e.g., `image/webp` for WebP format).

```http
HTTP/1.1 200 OK
Content-Type: image/webp
Content-Length: 12345
(binary image data)
```

