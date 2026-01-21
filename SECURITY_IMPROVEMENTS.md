# Security & Code Quality Improvements Tracker

## P0 - Critical (Must Fix Before Production)

### ✅ P0: Add input validation (Zod schemas)
- [x] Install Zod
- [x] Create validation schemas for:
  - [x] Tasks (create/update)
  - [x] Routines (create/update)
  - [x] Notes (create/update)
  - [x] Moods (create)
  - [x] Routine instances (create/update)
  - [ ] Team operations
- [x] Apply validation to all API routes (tasks, routines, notes, moods, routine instances)
- [ ] Add client-side validation to forms

### ✅ P0: Add rate limiting
- [x] Install rate limiting library (@upstash/ratelimit + @upstash/redis)
- [x] Create rate limiting utility (`lib/rate-limit.ts`)
- [x] Apply to all API routes (tasks, routines, notes, moods)
- [x] Configure different limits for different endpoints:
  - [x] Auth endpoints: 5 requests per 15 minutes
  - [x] Write operations: 30 requests per minute
  - [x] Read operations: 100 requests per minute
  - [x] Sensitive operations (DELETE): 10 requests per minute
- [x] Add rate limit headers to responses (X-RateLimit-*)
- [ ] Add environment variables documentation

### ⏳ P0: Add tests (at least for critical paths)
- [ ] Set up testing framework (Jest + React Testing Library)
- [ ] Write tests for:
  - [ ] Authentication/authorization
  - [ ] API route validation
  - [ ] Critical business logic
  - [ ] Store operations
  - [ ] Key user flows

## P1 - High Priority

### ⏳ P1: Standardize authorization checks (middleware)
- [ ] Create auth middleware helper
- [ ] Create team membership check helper
- [ ] Create access level check helper
- [ ] Refactor all API routes to use middleware
- [ ] Ensure consistent error responses

### ⏳ P1: Sanitize error messages in production
- [ ] Create error handling utility
- [ ] Differentiate dev vs production error messages
- [ ] Remove stack traces from production responses
- [ ] Add proper error logging
- [ ] Update all API routes

### ⏳ P1: Add error boundaries
- [ ] Create ErrorBoundary component
- [ ] Add to layout
- [ ] Add to key pages
- [ ] Create fallback UI
- [ ] Add error reporting

## P2 - Medium Priority

### ⏳ P2: Eliminate any types
- [ ] Enable strict TypeScript mode
- [ ] Find all `any` types
- [ ] Replace with proper types
- [ ] Fix type errors
- [ ] Add type guards where needed

### ⏳ P2: Reduce code duplication
- [ ] Identify duplicate patterns
- [ ] Create shared utilities:
  - [ ] API error handling
  - [ ] Auth checks
  - [ ] Data fetching patterns
- [ ] Refactor duplicate code
- [ ] Update all usages

### ⏳ P2: Add proper logging
- [ ] Install logging library (Winston/Pino)
- [ ] Replace console.log/error with logger
- [ ] Add log levels
- [ ] Configure production logging
- [ ] Add structured logging

---

## Progress Summary

- **Completed**: 1.5/9 (Input Validation + Rate Limiting)
- **In Progress**: 0/9
- **Pending**: 7.5/9

**Last Updated**: 2025-01-20

## Notes

### Input Validation (P0) - Partially Complete
- ✅ Zod installed
- ✅ Validation schemas created for all main entities
- ✅ Applied to all API routes (tasks, routines, notes, moods, routine instances)
- ⏳ Client-side validation in forms still needed (can be done with react-hook-form + zod)

### Rate Limiting (P0) - Complete
- ✅ @upstash/ratelimit and @upstash/redis installed
- ✅ Rate limiting utility created with different tiers
- ✅ Applied to all main API routes (GET, POST, PATCH, DELETE)
- ✅ Rate limit headers added to responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- ⚠️ **Note**: Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables
- ⚠️ Rate limiting gracefully degrades if Redis is not configured (fails open for development)
- 📝 **Next Steps**: Add environment variable documentation to README or .env.example
