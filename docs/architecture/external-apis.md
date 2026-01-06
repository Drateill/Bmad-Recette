# External APIs

Based on PRD requirements, the system integrates with several third-party services for OCR, authentication, and communication.

## Google Cloud Vision API

- **Purpose:** OCR text extraction from scanned recipe images (cookbooks, magazines, printed recipes)
- **Documentation:** https://cloud.google.com/vision/docs/ocr
- **Base URL(s):** https://vision.googleapis.com/v1
- **Authentication:** API Key (server-side only, never exposed to clients)
- **Rate Limits:** 1,000 requests/month free tier, then $1.50 per 1,000 images

**Key Endpoints Used:**
- `POST /images:annotate` - Text detection with bounding boxes and confidence scores

**Integration Notes:** Fallback to Tesseract.js (open-source OCR) if quota exceeded. Implement exponential backoff for rate limit errors. Log confidence scores to track OCR accuracy.

## Google OAuth 2.0

- **Purpose:** User authentication via Google accounts
- **Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Base URL(s):** https://accounts.google.com/o/oauth2/v2/auth
- **Authentication:** OAuth 2.0 authorization code flow
- **Rate Limits:** 10,000 requests/day

**Key Endpoints Used:**
- `GET /o/oauth2/v2/auth` - Initiate OAuth flow
- `POST /token` - Exchange authorization code for tokens

**Integration Notes:** Store only OAuth provider ID and email. Implement PKCE for mobile apps. Handle account linking scenarios.

## SendGrid Email API

- **Purpose:** Transactional emails for shopping list sharing and account notifications
- **Documentation:** https://docs.sendgrid.com/api-reference/
- **Base URL(s):** https://api.sendgrid.com/v3
- **Authentication:** API Key in Authorization header
- **Rate Limits:** 100 emails/day free tier

**Key Endpoints Used:**
- `POST /mail/send` - Send transactional email with template support

**Integration Notes:** Use dynamic templates for consistent branding. Track email opens/clicks via SendGrid analytics.

## Twilio Programmable Messaging API

- **Purpose:** SMS sharing for shopping lists
- **Documentation:** https://www.twilio.com/docs/sms/api
- **Base URL(s):** https://api.twilio.com/2010-04-01
- **Authentication:** HTTP Basic Auth with Account SID and Auth Token
- **Rate Limits:** Pay-per-message (~$0.0075/SMS)

**Key Endpoints Used:**
- `POST /Accounts/{AccountSid}/Messages.json` - Send SMS message with link to shopping list

**Integration Notes:** Generate short URLs for SMS. Validate phone numbers before sending. Rate limit per user (max 10/day) to prevent abuse.

## AWS S3 (Storage API)

- **Purpose:** Recipe photo storage, OCR scan storage, data export files
- **Documentation:** https://docs.aws.amazon.com/s3/
- **Authentication:** AWS Signature V4
- **Rate Limits:** 3,500 PUT/sec, 5,500 GET/sec

**Key Endpoints Used:**
- `PUT /{key}` - Upload object
- `GET /{key}` - Retrieve object
- `DELETE /{key}` - Remove object

**Integration Notes:** Front S3 with Cloudflare CDN. Use lifecycle policies to auto-delete temp OCR images after 24 hours. Generate presigned URLs for client uploads.

---
