# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; img-src 'self' https://bmad-recette.s3.amazonaws.com`
- XSS Prevention: React's built-in escaping, DOMPurify for user content
- Secure Storage: JWT in memory, refresh tokens in httpOnly cookies

**Backend Security:**
- Input Validation: class-validator on all DTOs
- Rate Limiting: 100 req/min (general), 10 req/min (auth), 5 req/min (OCR)
- CORS Policy: Allow only app.bmadrecette.com, staging.bmadrecette.com

**Authentication Security:**
- Token Storage: Access tokens 15 min, refresh tokens 7 days
- Session Management: Refresh tokens in Redis with auto-expiration
- Password Policy: Min 8 chars, 1 uppercase, 1 number

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <300KB initial bundle (gzipped)
- Loading Strategy: Code splitting by route, lazy loading
- Caching Strategy: Service Worker caches recipes for 7 days

**Backend Performance:**
- Response Time Target: P95 <500ms
- Database Optimization: Indexed foreign keys, covering indexes
- Caching Strategy: Redis caches ingredient catalog (1h), system tags (24h)

---
