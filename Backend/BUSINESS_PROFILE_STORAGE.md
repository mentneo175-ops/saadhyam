# Business Profile Storage Documentation

## Overview
This document explains how business profile data, including PDF uploads and website imports, are stored and can be edited.

## Database Schema

### 1. `users` Table (Main Business Info)
Stores the primary business profile information that users can edit:

```sql
-- Core business fields
business_name VARCHAR(255)
business_type VARCHAR(100)
business_location VARCHAR(255)
business_description TEXT
business_setup_completed BOOLEAN

-- Input source tracking (for edit functionality)
pdf_file_url TEXT          -- Path to uploaded PDF file
website_url TEXT           -- Imported website URL
```

### 2. `business_profiles` Table (Detailed Input History)
Stores detailed extraction history from all input sources:

```sql
user_id INTEGER (FK to users.id)
business_description TEXT

-- File uploads
pdf_file_url TEXT
audio_file_url TEXT (deprecated)
website_url TEXT

-- Extracted text from each source
pdf_extracted_text TEXT
audio_extracted_text TEXT (deprecated)
website_extracted_text TEXT

created_at TIMESTAMP
updated_at TIMESTAMP
```

## Data Flow

### During Onboarding/Initial Setup:

1. **User uploads PDF:**
   - PDF saved to `/uploads/` directory
   - Text extracted using PyPDF2/pdfplumber
   - Stored in:
     - `business_profiles.pdf_file_url` → File path
     - `business_profiles.pdf_extracted_text` → Extracted text
     - `users.pdf_file_url` → File path (for edit access)

2. **User imports website:**
   - Website scraped using Playwright
   - Business content extracted
   - Stored in:
     - `business_profiles.website_url` → Website URL
     - `business_profiles.website_extracted_text` → Extracted content
     - `users.website_url` → Website URL (for edit access)

3. **User enters manual description:**
   - Stored in `users.business_description`
   - Merged with PDF/Website text in `business_profiles.business_description`

### During Edit:

1. **GET `/api/profile/business`:**
   - Returns current business info from `users` table
   - Includes `pdf_file_url` and `website_url` if previously uploaded/imported
   - Frontend can show "Previously uploaded: document.pdf" or "Previously imported: example.com"

2. **User can re-upload PDF or re-import website:**
   - New PDF/Website replaces old one
   - Both `users` and `business_profiles` tables updated
   - Old PDF file can be deleted from disk

3. **PUT `/api/profile/business`:**
   - Updates `users` table with new business info
   - Maintains PDF/Website URLs if not changed

## API Endpoints

### Get Business Profile
```http
GET /api/profile/business
Authorization: Bearer <token>

Response:
{
  "business_name": "Sweet Crumbs Bakery",
  "business_type": "Bakery & Cafe",
  "business_location": "Madhapur, Hyderabad",
  "business_description": "...",
  "business_setup_completed": true,
  "pdf_file_url": "/uploads/user_11_20260507_document.pdf",
  "website_url": "https://www.sweetcrumbsbakery.com"
}
```

### Update Business Profile
```http
PUT /api/profile/business
Authorization: Bearer <token>
Content-Type: application/json

{
  "business_name": "Sweet Crumbs Bakery",
  "business_type": "Bakery & Cafe",
  "business_location": "Madhapur, Hyderabad",
  "business_description": "Updated description..."
}
```

### Upload PDF (Can be used during edit)
```http
POST /api/business/upload-pdf
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF file>

Response:
{
  "success": true,
  "source": "pdf",
  "file_url": "/uploads/user_11_20260507_document.pdf",
  "text": "Extracted text...",
  "message": "PDF uploaded and processed successfully"
}
```

### Import Website (Can be used during edit)
```http
POST /api/business/import-website
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://www.example.com"
}

Response:
{
  "success": true,
  "source": "website",
  "website_url": "https://www.example.com",
  "title": "Example Business",
  "text": "Extracted content...",
  "message": "Website imported successfully"
}
```

## Frontend Implementation

### Edit Business Profile Page

The edit page should:

1. **Load existing data:**
   ```typescript
   const profile = await apiClient.getBusinessProfile();
   
   // Show existing values
   setBusinessName(profile.business_name);
   setBusinessType(profile.business_type);
   setBusinessLocation(profile.business_location);
   setDescription(profile.business_description);
   
   // Show previously uploaded/imported sources
   if (profile.pdf_file_url) {
     showPDFIndicator(profile.pdf_file_url);
   }
   if (profile.website_url) {
     showWebsiteIndicator(profile.website_url);
   }
   ```

2. **Allow re-uploading PDF:**
   ```typescript
   // User can upload new PDF
   const handlePDFUpload = async (file) => {
     const response = await apiClient.uploadPDF(file);
     // Append or replace description
     setDescription(prev => prev + "\n\n" + response.text);
   };
   ```

3. **Allow re-importing website:**
   ```typescript
   // User can import new website
   const handleWebsiteImport = async (url) => {
     const response = await apiClient.importWebsite(url);
     // Append or replace description
     setDescription(prev => prev + "\n\n" + response.text);
   };
   ```

4. **Save changes:**
   ```typescript
   const handleSave = async () => {
     await apiClient.updateBusinessProfile({
       business_name: businessName,
       business_type: businessType,
       business_location: businessLocation,
       business_description: description
     });
   };
   ```

## Migration

Run the migration to add new fields to users table:

```bash
cd Backend
python migrations/add_pdf_website_to_users.py
```

This adds:
- `users.pdf_file_url`
- `users.website_url`

## Benefits

1. ✅ **Easy Edit Access:** PDF and Website URLs stored in users table for quick retrieval
2. ✅ **Full History:** Detailed extraction history maintained in business_profiles table
3. ✅ **Re-upload Support:** Users can upload new PDF or import new website anytime
4. ✅ **Data Integrity:** Both tables stay in sync
5. ✅ **Backward Compatible:** Existing data continues to work

## Example User Journey

### Initial Setup (Onboarding):
1. User uploads PDF → Stored in both tables
2. User imports website → Stored in both tables
3. User enters manual text → Merged with PDF/Website text
4. Business profile created ✅

### Later Edit:
1. User goes to Settings → Edit Business Profile
2. Sees current info + indicators: "📄 document.pdf uploaded" and "🌐 example.com imported"
3. User can:
   - Edit text fields directly
   - Upload new PDF (replaces old one)
   - Import new website (replaces old one)
   - Or keep existing sources
4. Saves changes → Both tables updated ✅

## Notes

- PDF files are stored in `Backend/uploads/` directory
- Website URLs are just stored as text (no file storage needed)
- Voice audio is no longer stored (browser-based transcription only)
- Old PDF files should be cleaned up when replaced (implement cleanup logic)
