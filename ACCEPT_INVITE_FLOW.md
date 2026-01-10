# Accept Invite Flow - Implementation Guide

## Overview

The accept-invite feature allows invited admins to complete their onboarding by setting a password via an email link.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVITE WORKFLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. SUPERADMIN CREATES INVITE
   ├─ UI: /dashboard/invites
   ├─ Action: Click "Create Invite" button
   ├─ API: POST /v1/superadmin/invites
   └─ Backend: Generates token, sends email to invitee

                    ↓

2. INVITEE RECEIVES EMAIL
   ├─ Email contains: https://yourapp.com/accept-invite?token=abc123xyz
   └─ Token embedded in URL query param

                    ↓

3. INVITEE CLICKS EMAIL LINK
   ├─ Opens: /accept-invite?token=abc123xyz (PUBLIC PAGE - no auth)
   ├─ Page validates token presence
   └─ Shows password creation form

                    ↓

4. INVITEE SETS PASSWORD
   ├─ Form: Create Password + Confirm Password
   ├─ Validation: min 8 chars, passwords match
   └─ Submit: POST /v1/auth/admin/accept-invite

                    ↓

5. BACKEND ACTIVATES ACCOUNT
   ├─ Validates invite token
   ├─ Creates/activates admin user with password
   ├─ Marks invite as "USED"
   ├─ Sets HTTP-only session cookie
   └─ Returns user data

                    ↓

6. FRONTEND AUTO-LOGS IN
   ├─ Stores user in auth store
   ├─ Fetches permissions
   ├─ Shows success toast
   └─ Redirects to /dashboard
```

## Files Implemented

### 1. Hook: `src/hooks/api/useAuth.ts`
```typescript
export function useAcceptInvite() {
  // React Query mutation
  // Calls authService.acceptInvite
  // On success: logs user in, fetches permissions, redirects
}
```

### 2. Form Component: `src/components/auth/AcceptInviteForm.tsx`
- Password input with strength validation
- Confirm password with match validation
- Real-time error feedback with icons
- Consistent glassmorphism styling
- Loading states with spinner
- Error handling for all backend error codes

### 3. Page: `src/app/accept-invite/page.tsx`
- Public route (no auth required)
- Reads `?token=...` from URL
- Shows error state if token missing
- Displays success indicator when token present
- Uses existing `AuthLayout`, `AuthHeader`, `AuthCard` components

## Error Handling

The form handles all backend error scenarios:

| Error Code | HTTP Status | User Message |
|------------|-------------|--------------|
| `INVALID_INVITE_TOKEN` | 404 | "Invalid or expired invitation link" |
| `INVITE_ALREADY_USED` | 409 | "This invitation has already been used" |
| `INVITE_CANCELLED` | 410 | "This invitation has been cancelled" |
| `INVITE_EXPIRED` | 410 | "This invitation has expired" |
| `EMAIL_ALREADY_IN_USE` | 409 | "This email is already registered" |
| `VALIDATION_ERROR` | 400 | "Invalid request. Check your password" |

## Styling Consistency

✅ Uses glassmorphism design (backdrop-blur, rgba backgrounds)
✅ Dark/light theme support via `useThemeStore`
✅ Consistent with login page styling
✅ Same auth layout components
✅ Motion animations for smooth UX
✅ Responsive and accessible

## Testing the Flow

### Step 1: Create an invite (as superadmin)
```bash
# In your browser (logged in as superadmin):
1. Go to /dashboard/invites
2. Click "Create Invite"
3. Enter email: test@example.com
4. Backend sends email with token
```

### Step 2: Simulate email link click
```bash
# Manually construct URL with token from backend logs or database:
http://localhost:3000/accept-invite?token=YOUR_TOKEN_HERE
```

### Step 3: Accept invite
```bash
1. Open the URL above
2. Enter password (min 8 chars)
3. Confirm password
4. Click "Accept Invitation & Continue"
5. → Auto-login → Redirect to /dashboard
```

## Routes Summary

| Route | Auth Required | Purpose |
|-------|---------------|---------|
| `/dashboard/invites` | ✅ Superadmin | Create/manage invites |
| `/accept-invite?token=...` | ❌ Public | Accept invite & set password |
| `/login` | ❌ Public | Standard login |
| `/dashboard` | ✅ Admin | Main dashboard |

## API Request/Response

### Request
```json
POST /api/v1/auth/admin/accept-invite
Content-Type: application/json

{
  "token": "abc123xyz",
  "password": "MySecurePass123"
}
```

### Success Response (200)
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "phone": null,
    "userType": "ADMIN",
    "status": "ACTIVE",
    "emailVerified": true
  }
}
```

Backend also sets `Set-Cookie` header with session cookie.

## Security Notes

1. ✅ Token is single-use (backend marks invite as USED)
2. ✅ Tokens expire after configured time
3. ✅ Session cookie is HTTP-only
4. ✅ Password validation enforced client + server
5. ✅ HTTPS required in production
6. ✅ No sensitive data in URL (token is opaque)

## Next Steps

If you want to test locally:
1. Start your backend server
2. Run `npm run dev` in `frontend/admin`
3. Create an invite as superadmin
4. Copy the token from backend logs
5. Visit `/accept-invite?token=YOUR_TOKEN`
6. Complete the password form

The flow is now fully implemented end-to-end! 🎉
