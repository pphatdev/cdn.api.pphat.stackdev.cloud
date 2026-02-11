# Rate Limiting for Upload APIs

## Overview

Rate limiting has been implemented for all upload endpoints to prevent abuse and ensure fair usage of the CDN API.

## Implementation Details

### Rate Limits

1. **File Upload Endpoint** (`/api/file/upload`)
   - **Limit:** 15 requests per 15 minutes per IP
   - **Applies to:** General file uploads (potentially larger files)
   - **Response on limit exceeded:** HTTP 429 (Too Many Requests)

2. **Image Upload Endpoint** (`/api/image/upload`)
   - **Limit:** 30 requests per 15 minutes per IP
   - **Applies to:** Image file uploads specifically
   - **Response on limit exceeded:** HTTP 429 (Too Many Requests)

### How It Works

- Rate limiting is based on **IP address**
- Each IP address has its own independent counter
- The counter resets after the 15-minute window expires
- Rate limit information is included in response headers:
  - `RateLimit-Limit`: Maximum number of requests allowed
  - `RateLimit-Remaining`: Number of requests remaining
  - `RateLimit-Reset`: Time when the rate limit resets

### Error Response

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "message": "Too many upload requests from this IP, please try again after 15 minutes",
  "data": null
}
```

**Status Code:** `429 Too Many Requests`

## Configuration

The rate limiting configuration can be adjusted in [`src/server/middlewares/rate-limit.ts`](../src/server/middlewares/rate-limit.ts):

- `windowMs`: Time window in milliseconds (default: 15 minutes)
- `max`: Maximum number of requests per window
- `keyGenerator`: Function to generate unique keys (default: IP address)

## Customization

### Skip Rate Limiting for Trusted IPs

You can modify the `skip` function in the rate limiter configuration to bypass rate limiting for specific conditions:

```typescript
skip: (req) => {
    // Example: Skip rate limiting for localhost
    const trustedIPs = ['127.0.0.1', '::1'];
    return trustedIPs.includes(req.ip);
}
```

### Change Rate Limits

To adjust the rate limits, modify the `max` value:

```typescript
export const fileUploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Change this value
    // ... other options
});
```

## Testing

To test rate limiting:

1. Make multiple upload requests to the endpoint
2. After exceeding the limit, you should receive a 429 status code
3. Check the `RateLimit-*` headers in the response to see remaining requests

## Best Practices

1. Always check the `RateLimit-Remaining` header before making requests
2. Implement exponential backoff when receiving 429 responses
3. Consider caching uploaded files to minimize repeat uploads
4. For high-volume applications, contact the API administrator for increased limits
