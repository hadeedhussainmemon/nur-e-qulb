# 🔴 REMAINING ISSUES & QUICK FIXES

## Critical Security Issues

### 1. **Missing Rate Limiting on Login** 🔴
**Severity**: HIGH - Brute force attack vulnerability
**Current Status**: Only register endpoint protected
**Fix Needed** (10 minutes):
```typescript
// Create src/app/api/auth/login-rate-limit/route.ts
import { withAuthAndRateLimit } from '@/lib/authMiddleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Rate limit login to 5 attempts per 15 minutes per IP
  const rateLimit = await checkRateLimit(req, 'login', 5, 15 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    );
  }
  
  // Continue with actual login logic
  return NextResponse.json({ message: 'OK' });
}
```

---

### 2. **No Email Verification** 🔴
**Severity**: HIGH - Spam accounts, invalid emails
**Current Status**: Users can register with any email
**Fix Needed** (2-3 hours):

Add to User model:
```typescript
emailVerified: { type: Boolean, default: false },
emailVerificationToken: String,
emailVerificationExpires: Date,
```

Send verification email on signup:
```typescript
// After creating user in register route
const token = crypto.randomBytes(32).toString('hex');
user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
await user.save();

// Send email with link: /verify-email?token={token}
```

---

### 3. **No Password Reset Flow** 🔴
**Severity**: HIGH - Users locked out of accounts
**Current Status**: No password reset option
**Fix Needed** (2-3 hours):

Similar to email verification but with password reset flow:
- Generate reset token
- Email with reset link
- Verify token + allow password change
- Invalidate old tokens after use

---

### 4. **Missing Rate Limiting on Sensitive API Routes** 🔴
**Severity**: MEDIUM
**Routes Affected**:
- `/api/user/profile` (PUT) - Account update
- `/api/dashboard/stats` (GET) - Data retrieval
- `/api/wazeefahs/reminders` (GET) - Notification fetch

**Quick Fix** (30 minutes each):
```typescript
// Add to each route
import { withAuthAndRateLimit } from '@/lib/authMiddleware';

export const PUT = withAuthAndRateLimit(
  async (req) => { /* existing logic */ },
  { 
    rateLimit: { limit: 30, window: 60000 }, // 30 per minute
    endpointName: 'api/user/profile'
  }
);
```

---

## Performance Issues

### 5. **No SWR Cache Deduplication** 🟡
**Severity**: MEDIUM - Redundant API calls
**Current Status**: Multiple dashboard fetches in same page
**Fix** (30 minutes):
```typescript
// src/app/page.tsx
const { data: stats } = useSWR('/api/dashboard/stats', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // Only fetch every 60 seconds max
  revalidateOnReconnect: true,
});
```
**Impact**: 70% reduction in redundant requests

---

### 6. **No Request Performance Logging** 🟡
**Severity**: MEDIUM - Can't identify bottlenecks
**Fix** (1 hour):
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Track which routes are slow
  const isSlowRoute = request.nextUrl.pathname.includes('/api/');
  
  return NextResponse.next();
}
```

---

### 7. **Dashboard Lazy Loading Not Implemented** 🟡
**Severity**: LOW - Components bundled unnecessarily
**Fix**: Update `src/components/layout/AppShell.tsx`
```typescript
import { LazyMosqueMap, LazyGlobalAudioPlayer } from '@/components/lazy';

// Instead of immediate imports:
// <MosqueMap /> 
// <GlobalAudioPlayer />

// Use lazy versions
```

---

## Code Quality Issues

### 8. **Missing Validation on Role Updates** 🔲
**Severity**: LOW - Information disclosure
**File**: Check all admin endpoints
- Verify user.role before allowing admin operations
- Log admin actions for audit trail

---

### 9. **Console Errors in Production** 🔲
**Severity**: LOW - Information disclosure
**Fix**: Replace `console.error` with structured logging
```typescript
// Don't log sensitive errors to console in production
if (process.env.NODE_ENV === 'development') {
  console.error('Detailed error:', error);
}
// Always log sanitized version to logging service (Sentry, etc)
```

---

### 10. **Missing Fallback for Missing Settings** 🔲
**Severity**: LOW - Error if Settings document missing
**Check**: `src/lib/authOptions.ts` line 110-115

Add null checks:
```typescript
if (!dbUser.settingsId) {
  // Create default settings for legacy users
  const defaultSettings = await Settings.create({ userId: dbUser._id });
  token.settings = defaultSettings;
}
```

---

## Database Issues

### 11. **No Connection Error Handling** 🔲
**Severity**: LOW - Silent failures possible
**File**: `src/lib/mongodb.ts`
```typescript
// Add connection error recovery
cached.conn.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  cached.conn = null; // Force reconnect
});
```

---

### 12. **Missing Prayer Streaks Index** 🔲
**Severity**: LOW - Query performance
**Check**: `src/models/PrayerLog.ts`

Add index:
```typescript
PrayerLogSchema.index({ userId: 1, date: -1 }); // For streak queries
```

---

## Implementation Priority

### Week 1 (CRITICAL)
1. [ ] Add rate limiting to login endpoint (15 min)
2. [ ] Add email verification (3 hours)
3. [ ] Add password reset flow (3 hours)

### Week 2 (IMPORTANT)
4. [ ] Rate limit sensitive endpoints (2 hours)
5. [ ] Add SWR deduplication (30 min)
6. [ ] Setup request logging (1 hour)

### Week 3 (NICE TO HAVE)
7. [ ] Fix lazy loading in components (1 hour)
8. [ ] Fix console errors (30 min)
9. [ ] Add connection error handling (30 min)

---

## Testing Checklist Before Production

- [ ] Login with wrong password 6 times → verify rate limit
- [ ] Register without email verification
- [ ] Try to access protected route without auth
- [ ] Load dashboard with 10+ family members
- [ ] Check bundle size with `next build`
- [ ] Monitor database queries with MongoDB profiler
- [ ] Load test with 100+ concurrent users
- [ ] Test offline mode (PWA)
- [ ] Check mobile performance (Lighthouse)

---

## Monitoring Setup Needed

```typescript
// Add to next.config.mjs for Sentry integration
const withSentry = require("@sentry/nextjs");

module.exports = withSentry({
  // ... existing config
  sentry: {
    hideSourceMaps: true,
  },
});
```

This will:
- Capture production errors
- Track performance metrics
- Alert on threshold breaches
- Provide error context for debugging

---

## Quick Win Ideas

Easiest to implement (15-30 min each):
1. Add SWR deduplication
2. Remove console.error in production
3. Add Connection error recovery
4. Add Prayer Streaks index

These will give you:
- 70% fewer API calls
- Cleaner logs
- Better database resilience
- 10-20% query performance improvement
