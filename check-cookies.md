# Cookie Issue Diagnosis

## Open Browser DevTools → Network Tab

### 1. Check Login Response
Look at the login request response headers:
- Should have: `Set-Cookie: session_id=...; SameSite=None; Secure; HttpOnly`
- **Missing SameSite=None means cookies won't work cross-origin**

### 2. Check Permissions Request
Look at the permissions request headers:
- Should have: `Cookie: session_id=...`
- **If Cookie header is missing, browser blocked the cookie**

## Quick Test in Console

```javascript
// After login, run this in browser console:
document.cookie

// If empty or no session cookie → backend didn't set cookie properly
```

## The Problem

Cross-origin requests (localhost:3000 → staging.kuinbee.com) require:

**Backend MUST set cookies with:**
```
Set-Cookie: session_id=xyz; 
  Path=/; 
  SameSite=None;   ← REQUIRED for cross-origin
  Secure;          ← REQUIRED with SameSite=None
  HttpOnly;
```

**Backend MUST have CORS:**
```python
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

## Contact Backend Team

Your backend needs to update their cookie configuration. Share this with them:

### Python/FastAPI Fix:
```python
response.set_cookie(
    key="session_id",
    value=session_token,
    httponly=True,
    secure=True,           # Required
    samesite="none",       # Required for cross-origin
    path="/",
)
```

### Node.js/Express Fix:
```javascript
res.cookie('session_id', sessionToken, {
  httpOnly: true,
  secure: true,      // Required
  sameSite: 'none',  // Required for cross-origin
  path: '/',
});
```

## Until Backend is Fixed

You can't fix this from the frontend. The browser blocks cross-origin cookies unless the backend sets them correctly.
