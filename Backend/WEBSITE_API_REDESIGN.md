# Website AI - Scalable Routing System

## Overview

This document describes the redesigned website routing system that provides scalable, production-ready website serving with support for custom domains and proper file organization.

## New Architecture

### URL Structure

**Before (Legacy):**
```
/website-ai/output/business-name_theme.html
```

**After (New):**
```
/website/{website_id}
/website/{website_id}/assets/style.css
/website/{website_id}/assets/script.js
```

### File Storage Structure

**Local Storage:**
```
Backend/websites/
├── {website_id_1}/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   ├── images/
│   │   └── logo.png
│   └── assets/
│       └── custom-files.*
├── {website_id_2}/
│   └── ...
```

**S3/MinIO Storage:**
```
websites/
├── {website_id_1}/
│   ├── index.html
│   ├── css/styles.css
│   ├── js/script.js
│   └── assets/...
├── {website_id_2}/
│   └── ...
```

## API Endpoints

### 1. Website Generation

**POST** `/api/v1/website-ai/generate`

**Request:**
```json
{
  "business_name": "My Business",
  "business_type": "Restaurant",
  "description": "A cozy family restaurant",
  "services": ["Dining", "Takeout", "Catering"],
  "contact_email": "info@mybusiness.com",
  "contact_phone": "+1234567890",
  "theme": "magazine-grid"
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Website generation started. Use job_id to check status."
}
```

### 2. Job Status Tracking

**GET** `/api/v1/website-ai/jobs/{job_id}`

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "created_at": "2024-01-01T12:00:00Z",
  "started_at": "2024-01-01T12:00:01Z",
  "completed_at": "2024-01-01T12:00:30Z",
  "error_message": null
}
```

### 3. Job Result

**GET** `/api/v1/website-ai/jobs/{job_id}/result`

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "website_id": "123e4567-e89b-12d3-a456-426614174000",
  "html_url": "/website/123e4567-e89b-12d3-a456-426614174000",
  "preview_url": "/website/123e4567-e89b-12d3-a456-426614174000",
  "theme": "magazine-grid",
  "completed_at": "2024-01-01T12:00:30Z"
}
```

### 4. Website Serving (NEW)

**GET** `/website/{website_id}`

Serves the main website page (index.html)

**GET** `/website/{website_id}/{file_path}`

Serves website assets (CSS, JS, images, etc.)

**Examples:**
- `/website/123e4567-e89b-12d3-a456-426614174000` → Main website
- `/website/123e4567-e89b-12d3-a456-426614174000/css/styles.css` → CSS file
- `/website/123e4567-e89b-12d3-a456-426614174000/images/logo.png` → Image

### 5. Website Information

**GET** `/website/{website_id}/info`

**Response:**
```json
{
  "website_id": "123e4567-e89b-12d3-a456-426614174000",
  "business_name": "My Business",
  "business_type": "Restaurant",
  "theme": "magazine-grid",
  "status": "active",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:30Z",
  "files": {
    "index_exists": true,
    "total_files": 5,
    "file_list": ["index.html", "css/styles.css", "js/script.js"]
  },
  "urls": {
    "website_url": "/website/123e4567-e89b-12d3-a456-426614174000",
    "info_url": "/website/123e4567-e89b-12d3-a456-426614174000/info"
  }
}
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful request
- **202 Accepted**: Generation started (async)
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Website/Job not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "detail": "Website 123e4567-e89b-12d3-a456-426614174000 not found or is not active"
}
```

## Security Features

### Path Traversal Protection

The system prevents directory traversal attacks by:
- Validating file paths
- Rejecting paths containing `..` or starting with `/`
- Serving files only from the website's designated directory

### UUID Validation

All website IDs are validated as proper UUIDs before processing.

## Future Enhancements

### 1. Custom Domain Mapping

**Database Schema Addition:**
```sql
CREATE TABLE domain_mappings (
    id SERIAL PRIMARY KEY,
    website_id UUID REFERENCES websites(id),
    domain VARCHAR(255) UNIQUE NOT NULL,
    subdomain VARCHAR(100),
    ssl_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoint:**
```
POST /api/v1/website-ai/domains
{
  "website_id": "123e4567-e89b-12d3-a456-426614174000",
  "domain": "mybusiness.com",
  "subdomain": "www"
}
```

### 2. Reverse Proxy Configuration (Nginx)

```nginx
# Dynamic website serving
location ~ ^/website/([a-f0-9-]{36})(/.*)?$ {
    set $website_id $1;
    set $file_path $2;
    
    # Pass to FastAPI backend
    proxy_pass http://backend:8000/website/$website_id$file_path;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Custom domain mapping
server {
    server_name ~^(?<domain>.+)$;
    
    location / {
        # Lookup website_id by domain
        proxy_pass http://backend:8000/website/domain/$domain;
    }
}
```

### 3. Subdomain Support

```python
@router.get("/subdomain/{subdomain}")
async def serve_by_subdomain(subdomain: str, request: Request):
    # Extract main domain from request
    host = request.headers.get("host", "")
    main_domain = host.replace(f"{subdomain}.", "")
    
    # Lookup website by subdomain + domain
    website = get_website_by_domain(main_domain, subdomain)
    return serve_website_content(website.id)
```

### 4. CDN Integration

```python
class CDNStorageService(StorageService):
    def get_website_url(self, website_id: str) -> str:
        if settings.CDN_ENABLED:
            return f"{settings.CDN_BASE_URL}/website/{website_id}"
        return super().get_website_url(website_id)
```

## Migration Guide

### From Legacy System

1. **Update Frontend URLs:**
   ```javascript
   // Before
   const url = `/website-ai/output/${filename}`;
   
   // After
   const url = `/website/${website_id}`;
   ```

2. **Update Storage Service Calls:**
   ```python
   # Before
   storage_service.save_html(html, business_name, theme)
   
   # After
   storage_service.save_website_files(website_id, html)
   ```

3. **Database Migration:**
   - Existing websites continue to work via legacy endpoints
   - New websites use the new system automatically
   - Gradual migration of old websites can be done via regeneration

## Performance Considerations

### Caching Strategy

1. **Browser Caching:**
   ```python
   @router.get("/website/{website_id}")
   async def serve_website(website_id: str):
       response = HTMLResponse(content=html)
       response.headers["Cache-Control"] = "public, max-age=3600"
       return response
   ```

2. **CDN Caching:**
   - Static assets cached for 1 year
   - HTML cached for 1 hour
   - Proper cache invalidation on updates

### Database Optimization

1. **Indexes:**
   ```sql
   CREATE INDEX idx_websites_status ON websites(status);
   CREATE INDEX idx_websites_created_at ON websites(created_at);
   ```

2. **Query Optimization:**
   - Use database connection pooling
   - Implement query result caching
   - Add database read replicas for high traffic

## Monitoring and Logging

### Key Metrics

- Website generation time
- File serving response time
- Storage usage per website
- Error rates by endpoint

### Logging Format

```python
logger.info(f"🌐 Serving website: {website_id}")
logger.info(f"📁 Serving asset: {website_id}/{file_path}")
logger.error(f"❌ Website not found: {website_id}")
```

## Testing

### Unit Tests

```python
def test_serve_website_success():
    # Test successful website serving
    
def test_serve_website_not_found():
    # Test 404 handling
    
def test_path_traversal_protection():
    # Test security measures
```

### Integration Tests

```python
def test_end_to_end_generation():
    # Test complete flow: generate → serve → verify
```

This redesigned system provides a solid foundation for scaling to thousands of websites while maintaining clean URLs, proper security, and future extensibility for custom domains and advanced features.