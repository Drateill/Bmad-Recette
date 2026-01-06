# Error Handling Strategy

## Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

## Error Flow

Client makes request → API validates → Service processes → Catches errors → HttpExceptionFilter formats → Client receives standardized error → Displays user-friendly message → Logs to Sentry

---
