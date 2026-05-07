# Business Input Engine

Complete implementation of the Business Input Engine for Saadhyam AI.

## Overview

The Business Input Engine allows users to provide business information through multiple input methods:
- **Manual Text Entry** - Traditional textarea input
- **PDF Upload** - Extract text from business documents
- **Voice Input** - Record or upload audio for transcription
- **Website Import** - Scrape business information from websites

All inputs are automatically processed, cleaned, and merged into a unified business description.

## Architecture

### Backend Structure

```
Backend/
├── routes/
│   └── business_input.py          # API endpoints for all input methods
├── services/
│   ├── pdf_service.py              # PDF text extraction with OCR fallback
│   ├── voice_service.py            # Audio transcription (Whisper)
│   ├── website_service.py          # Website scraping (BeautifulSoup + Playwright)
│   ├── business_parser.py          # Extract business-relevant content
│   └── text_cleaner.py             # Clean and normalize text
├── models/
│   └── business_profile.py         # Database model for business inputs
├── migrations/
│   └── add_business_profile_table.py
├── uploads/                        # PDF storage
└── temp_audio/                     # Audio file storage
```

### Frontend Structure

```
Frontend/src/
├── components/business/
│   ├── PDFUpload.tsx              # PDF upload component
│   ├── VoiceInput.tsx             # Voice recording/upload component
│   └── WebsiteImport.tsx          # Website URL import component
├── lib/
│   └── api.ts                     # API client with business input methods
└── routes/
    └── onboarding.tsx             # Integrated onboarding page
```

## Features

### 1. PDF Upload

**Endpoint:** `POST /api/business/upload-pdf`

**Features:**
- Accepts PDF files up to 10MB
- Extracts text using PyPDF2 (fast)
- Falls back to pdfplumber for complex PDFs
- OCR support for scanned PDFs (pytesseract + pdf2image)
- Automatic text cleaning and parsing
- Stores file and extracted text in database

**Frontend:**
- Drag & drop or click to upload
- Real-time upload progress
- Success/error feedback
- Automatic textarea update

### 2. Voice Input

**Endpoint:** `POST /api/business/upload-voice`

**Features:**
- Record audio directly in browser
- Upload audio files (mp3, wav, webm, m4a, ogg, flac)
- Transcription using Faster Whisper (local) or Groq API
- Multi-language support (English, Hindi, Telugu)
- Files up to 25MB
- Automatic text cleaning

**Frontend:**
- Browser-based recording with timer
- Upload existing audio files
- Real-time recording indicator
- Automatic transcription and textarea update

### 3. Website Import

**Endpoint:** `POST /api/business/import-website`

**Features:**
- Scrape website content using BeautifulSoup
- Fallback to Playwright for JavaScript-heavy sites
- Extract:
  - Page title
  - Meta description
  - Headings (h1, h2, h3)
  - Paragraphs
  - About section
  - Services section
  - Contact information
- Remove navigation, footer, scripts
- Clean and parse business-relevant content

**Frontend:**
- URL input with validation
- Loading state during scraping
- Success feedback with extracted title
- Automatic textarea update

### 4. Intelligent Text Merging

All input sources are intelligently merged:
- Manual text takes priority
- Voice input appends if different
- PDF content adds document details
- Website content adds online presence info
- Avoids duplicate content
- Preserves user edits

## API Endpoints

### Upload PDF
```http
POST /api/business/upload-pdf
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <PDF file>
```

**Response:**
```json
{
  "success": true,
  "source": "pdf",
  "file_url": "/uploads/user_1_20260507_120000_document.pdf",
  "text": "Extracted and cleaned business description...",
  "message": "PDF uploaded and processed successfully"
}
```

### Upload Voice
```http
POST /api/business/upload-voice
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <Audio file>
language: "en" (optional)
```

**Response:**
```json
{
  "success": true,
  "source": "voice",
  "file_url": "/temp_audio/user_1_20260507_120000.webm",
  "text": "Transcribed business description...",
  "message": "Audio transcribed successfully"
}
```

### Import Website
```http
POST /api/business/import-website
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "source": "website",
  "website_url": "https://example.com",
  "title": "Example Business",
  "text": "Extracted business information...",
  "message": "Website imported successfully"
}
```

### Get Business Profile
```http
GET /api/business/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "business_description": "Complete merged description...",
  "pdf_file_url": "/uploads/document.pdf",
  "audio_file_url": "/temp_audio/recording.webm",
  "website_url": "https://example.com",
  "pdf_extracted_text": "Text from PDF...",
  "audio_extracted_text": "Text from audio...",
  "website_extracted_text": "Text from website..."
}
```

### Update Business Description
```http
PUT /api/business/profile
Content-Type: multipart/form-data
Authorization: Bearer <token>

business_description: "Updated description..."
```

### Delete File
```http
DELETE /api/business/profile/file
Content-Type: multipart/form-data
Authorization: Bearer <token>

file_type: "pdf" or "audio"
```

## Database Schema

```sql
CREATE TABLE business_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_description TEXT,
    pdf_file_url TEXT,
    audio_file_url TEXT,
    website_url TEXT,
    pdf_extracted_text TEXT,
    audio_extracted_text TEXT,
    website_extracted_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
```

## Dependencies

### Backend

```txt
# PDF Processing
PyPDF2==3.0.1
pdfplumber==0.11.0
pytesseract==0.3.10
pdf2image==1.17.0

# Audio Processing
faster-whisper==1.0.3
pydub==0.25.1

# Web Scraping
beautifulsoup4==4.12.3
lxml==5.3.0
requests==2.31.0

# Optional: Playwright for JS-heavy sites
playwright==1.40.0
```

### Frontend

All dependencies already included in package.json.

## Installation

### 1. Install Backend Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Install Optional Dependencies

For OCR support (scanned PDFs):
```bash
# Install Tesseract OCR
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Mac: brew install tesseract
# Linux: sudo apt-get install tesseract-ocr

# Install poppler (for pdf2image)
# Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases
# Mac: brew install poppler
# Linux: sudo apt-get install poppler-utils
```

For Playwright (JavaScript-heavy websites):
```bash
pip install playwright
playwright install chromium
```

### 3. Configure Environment Variables

Add to `Backend/.env`:
```env
# Optional: Groq API for faster transcription
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run Migrations

Migrations run automatically on startup, or manually:
```bash
cd Backend
python migrations/add_business_profile_table.py
```

### 5. Create Upload Directories

Directories are created automatically, or manually:
```bash
mkdir -p Backend/uploads
mkdir -p Backend/temp_audio
```

## Usage

### Frontend Integration

```tsx
import { PDFUpload } from "@/components/business/PDFUpload";
import { VoiceInput } from "@/components/business/VoiceInput";
import { WebsiteImport } from "@/components/business/WebsiteImport";

function BusinessForm() {
  const [description, setDescription] = useState("");

  const handleTextExtracted = (text: string, title?: string) => {
    // Merge with existing description
    setDescription(prev => 
      prev ? `${prev}\n\n${text}` : text
    );
  };

  return (
    <div>
      <textarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <div className="grid grid-cols-3 gap-4">
        <PDFUpload onTextExtracted={handleTextExtracted} />
        <VoiceInput onTextExtracted={handleTextExtracted} />
        <WebsiteImport onTextExtracted={handleTextExtracted} />
      </div>
    </div>
  );
}
```

### API Client Usage

```typescript
import { apiClient } from "@/lib/api";

// Upload PDF
const pdfFile = document.querySelector('input[type="file"]').files[0];
const pdfResponse = await apiClient.uploadPDF(pdfFile);

// Upload Voice
const audioFile = document.querySelector('input[type="file"]').files[0];
const voiceResponse = await apiClient.uploadVoice(audioFile, "en");

// Import Website
const websiteResponse = await apiClient.importWebsite("https://example.com");

// Get Profile
const profile = await apiClient.getBusinessInputProfile();

// Update Description
await apiClient.updateBusinessDescription("New description...");

// Delete File
await apiClient.deleteBusinessFile("pdf");
```

## Error Handling

All endpoints return structured errors:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- **400 Bad Request** - Invalid file format, size limit exceeded, invalid URL
- **401 Unauthorized** - Missing or invalid authentication token
- **500 Internal Server Error** - Processing failure, service unavailable

## Performance Considerations

1. **PDF Processing**: PyPDF2 is fast, OCR is slow (use only for scanned PDFs)
2. **Voice Transcription**: Groq API is faster than local Whisper
3. **Website Scraping**: Basic scraping is fast, Playwright is slower
4. **File Storage**: Clean up old files periodically
5. **Text Length**: Limited to 5000 characters to prevent database bloat

## Security

1. **File Validation**: Type and size checks before processing
2. **Authentication**: All endpoints require valid JWT token
3. **File Storage**: Unique filenames prevent overwrites
4. **Input Sanitization**: HTML tags and scripts removed
5. **URL Validation**: Proper URL format required for website import

## Testing

### Test PDF Upload
```bash
curl -X POST http://localhost:8000/api/business/upload-pdf \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf"
```

### Test Voice Upload
```bash
curl -X POST http://localhost:8000/api/business/upload-voice \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.mp3" \
  -F "language=en"
```

### Test Website Import
```bash
curl -X POST http://localhost:8000/api/business/import-website \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Troubleshooting

### PDF Extraction Fails
- Ensure PDF is not password-protected
- For scanned PDFs, install Tesseract OCR
- Check file is valid PDF format

### Voice Transcription Fails
- Ensure audio file is not corrupted
- Check supported formats: mp3, wav, webm, m4a, ogg, flac
- For faster transcription, add GROQ_API_KEY to .env

### Website Import Fails
- Check URL is accessible and valid
- For JavaScript-heavy sites, install Playwright
- Some sites may block scraping (403/429 errors)

## Future Enhancements

1. **Batch Processing**: Upload multiple PDFs at once
2. **Real-time Transcription**: Stream audio transcription
3. **Language Detection**: Auto-detect language in voice/PDF
4. **Content Summarization**: AI-powered text summarization
5. **Image OCR**: Extract text from uploaded images
6. **Social Media Import**: Import from Facebook, LinkedIn pages
7. **Google My Business**: Import from GMB profile
8. **File Management UI**: View, download, delete uploaded files

## License

Part of Saadhyam AI project.
