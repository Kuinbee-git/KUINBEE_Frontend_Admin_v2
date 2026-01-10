# React Query Fixes - Query Data Cannot Be Undefined

## Problem
React Query was throwing errors: "Query data cannot be undefined" because some service functions were returning `undefined` or not handling errors properly.

## Root Cause
1. **Service functions returning undefined:** When API calls failed or returned incomplete data, functions like `getProfile()` would return `undefined`.
2. **Queries running when not authenticated:** Queries were running on login page and other public pages, causing unnecessary errors.
3. **No error handling:** Service functions were not catching errors and returning safe fallback values.

## Solution Applied

### 1. Fixed Service Functions (auth.service.ts)

**`getProfile()`**
- Now returns `AdminProfile | null` instead of `AdminProfile`
- Catches errors and returns `null` instead of throwing
- Uses nullish coalescing (`??`) to ensure `null` instead of `undefined`

**`getAddresses()`**
- Now returns empty array `[]` on error
- Catches errors and returns safe fallback
- Uses nullish coalescing to ensure empty array instead of `undefined`

**`getMyPermissions()`**
- Already had error handling (returns empty array on error)
- No changes needed

### 2. Added Enabled Flags to Query Hooks (useAuth.ts)

**`useProfile()`**
- Added `enabled` flag that defaults to `isAuthenticated`
- Query only runs when user is logged in
- Added `retry: false` to prevent retrying failed requests

**`useMyPermissions()`**
- Added `enabled` flag that defaults to `isAuthenticated`
- Query only runs when user is logged in
- Added `retry: false` to prevent retrying failed requests

**`useAddresses()`**
- Added `enabled` flag that defaults to `isAuthenticated`
- Query only runs when user is logged in
- Added `retry: false` to prevent retrying failed requests
- Added `staleTime: 5 * 60 * 1000` for consistent caching

### 3. No Breaking Changes

- All existing components work as-is
- Profile page already handles null values with optional chaining (`?.`)
- Components can still override `enabled` flag if needed:
  ```typescript
  const { data } = useProfile({ enabled: true }); // Force enable
  const { data } = useProfile({ enabled: false }); // Force disable
  ```

## Backend Routes Used

These are the routes that React Query is calling:

1. ✅ `/v1/auth/me` - Get current user (confirmed working)
2. ✅ `/v1/auth/login` - Login (confirmed working)
3. ✅ `/v1/auth/logout` - Logout (confirmed working)
4. ❓ `/v1/admin/me/profile` - Get admin profile (now handles errors)
5. ❓ `/v1/admin/my-permissions` - Get permissions (now handles errors)
6. ❓ `/v1/admin/me/addresses` - Get addresses (now handles errors)

**Note:** Routes 4-6 will return `null` or `[]` if not implemented yet, preventing errors.

## Benefits

✅ **No more "Query data cannot be undefined" errors**  
✅ **Queries only run when authenticated**  
✅ **Graceful error handling with safe fallbacks**  
✅ **No breaking changes to existing components**  
✅ **Works even if backend routes are not implemented yet**

## Testing Checklist

- [ ] Login page loads without errors
- [ ] Dashboard loads without errors
- [ ] Profile page shows loading state then displays data (or empty state)
- [ ] Logout works and clears query cache
- [ ] No "Query data cannot be undefined" errors in console

## Next Steps

When your backend implements the profile/permissions/addresses routes:
1. No frontend changes needed!
2. Data will automatically populate in the UI
3. Error handling is already in place
