# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Sentry (React SDK) - error tracking, performance monitoring
- **Backend Monitoring:** Sentry (Node SDK) + Railway metrics
- **Error Tracking:** Sentry for unified error grouping
- **Performance Monitoring:** Sentry Performance + Railway APM

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- JavaScript errors
- API response times
- User interactions

**Backend Metrics:**
- Request rate (requests/second)
- Error rate (5xx errors/total)
- Response time (P50, P95, P99)
- Database query performance
- OCR API usage

---
