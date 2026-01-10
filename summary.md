# Frontend — API & UI Implementation Summary

Date: 2026-01-09

This document summarizes the backend API surface (v1) you provided, which frontend routes/services/hooks implement them, where UI exists, and next steps / recommendations. Files referenced are relative to the `frontend/admin` workspace.

---

## 1) High-level status

- Most admin & superadmin API routes are implemented in the frontend as services + React Query hooks.
- UI pages/components exist for the major admin features: Auth (login/logout), Profile, Categories, Sources, Datasets, Users, Admins, Invites, Roles.
- Addresses endpoints are implemented server-call–wise and a styled address *list* was added to the Profile page; add/edit/delete UI is pending.
- Some endpoints (e.g., `accept-invite`) have service-level coverage but no dedicated frontend acceptance flow/component found.
- Audit endpoints exist in services; UI is partially present (some audit components or placeholders) and needs expansion for full audit pages.

---

## 2) Route-by-route mapping (what's implemented + UI)

Notes: "Service" -> call implemented in a service file. "Hook" -> React Query hook. "UI" -> pages/components consuming hooks.

### Auth
- POST /v1/auth/login
  - Service: `src/services/auth.service.ts` (function `login`)  
  - Hook: `src/hooks/api/useAuth.ts` (`useLogin`)  
  - UI: `src/components/auth/LoginForm.tsx`, pages: `src/app/login/page.tsx`, `src/app/auth/login/page.tsx`

- POST /v1/auth/logout
  - Service: `src/services/auth.service.ts` (`logout`)  
  - Hook: `src/hooks/api/useAuth.ts` (`useLogout`)  
  - UI: logout wired from `src/app/dashboard/layout.tsx`

- GET /v1/auth/me
  - Service: `src/services/auth.service.ts` (`getCurrentUser`)  
  - Hook: `src/hooks/api/useAuth.ts` (`useCurrentUser`)  
  - UI: used by many pages (profile header, session checks) — `src/app/dashboard/profile/page.tsx` uses the current user

- POST /v1/auth/admin/accept-invite
  - Service: `src/services/auth.service.ts` (`acceptInvite`) — implemented
  - Hook: `src/hooks/api/useAuth.ts` (`useAcceptInvite`)  
  - UI: `src/components/auth/AcceptInviteForm.tsx`, page: `src/app/accept-invite/page.tsx` (public page with token validation)


### Admin (self)
- GET /v1/admin/my-permissions
  - Service: `src/services/auth.service.ts` (`getMyPermissions`)  
  - Hook: `src/hooks/api/useAuth.ts` (`useMyPermissions`)  
  - UI: used across app to gate features (examples in `src/components/categories/CategoriesView.tsx`)

- GET /v1/admin/me/profile, PUT /v1/admin/me/profile
  - Service: `src/services/auth.service.ts` (`getProfile`, `updateProfile`) — `updateProfile` uses PUT
  - Hook: `src/hooks/api/useAuth.ts` (`useProfile`, `useUpdateProfile`)  
  - UI: full profile page `src/app/dashboard/profile/page.tsx` (shows account/personal/org information)

- Addresses
  - GET /v1/admin/me/addresses
  - POST /v1/admin/me/addresses
  - PATCH /v1/admin/me/addresses/:addressId
  - DELETE /v1/admin/me/addresses/:addressId
    - Services: implemented in `src/services/auth.service.ts` (`getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`) and a separate `src/services/addresses.service.ts` file was added (duplicate helper — consider consolidation).
    - Hooks: `src/hooks/api/useAuth.ts` and specific hooks present: `useAddresses`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress`
    - UI: I added a styled address list to the Profile page: `src/app/dashboard/profile/page.tsx` (section "Saved Addresses"). Add/edit/delete forms and actions are pending (next tasks).


### Categories
- GET/POST/PUT/DELETE /v1/admin/categories
  - Service: `src/services/categories.service.ts`  
  - Hooks/UI: `src/components/categories/CategoriesView.tsx` + `CategoryTable`/dialogs — page present at `src/app/dashboard/categories/page.tsx`


### Sources
- GET/POST/PUT/DELETE /v1/admin/sources
  - Service: `src/services/sources.service.ts`  
  - Hooks/UI: `src/components/sources/SourcesView.tsx` + dialogs/tables, page present


### Datasets
- GET /v1/admin/datasets, GET /v1/admin/datasets/{id}, POST, PUT/DELETE, publish/unpublish, metadata, uploads
  - Service: `src/services/datasets.service.ts` (complete; includes uploads/presigned flows)  
  - Hooks/UI: `src/components/datasets/DatasetsView.tsx`, dataset detail components, create flows (pages exist)


### Users
- GET /v1/admin/users, GET /v1/admin/users/{userId}, POST /v1/admin/users/{userId}/suspend, DELETE /v1/admin/users/{userId}
  - Service: `src/services/users.service.ts`  
  - Hooks/UI: `src/components/users/UsersListView.tsx`, `UserTable`, user detail components exist


### Superadmin: Invites
- GET /v1/superadmin/invites, GET /{inviteId}, POST, POST resend, POST cancel
  - **Note**: UI now uses `/v1/admin/admin-invites` API instead (superior functionality)
  - Service: `src/services/invites.service.ts` (updated to use admin-invites API)
  - Hooks/UI: `src/components/invites/InvitesView.tsx` with dialogs for create/resend/cancel; page exists at `src/app/dashboard/invites/page.tsx`
  - **Permission-gated**: `CREATE_ADMIN` (works for superadmins + delegated admins)
  - **Features**: role assignment, configurable expiry (24h-30d), send-email toggle


### Superadmin: Roles
- GET /v1/superadmin/roles, GET/{roleId}, POST, PUT/{roleId} and permissions endpoints
  - Service: `src/services/roles.service.ts` (roles + permissions management)  
  - Hooks/UI: `src/components/roles/RolesView.tsx` + role dialogs (manage permissions) — page exists


### Superadmin: Admin Roles
- GET /v1/superadmin/admins/{adminId}/roles, PUT /v1/superadmin/admins/{adminId}/roles
  - Service/hooks: `src/services/admins.service.ts` and `src/hooks/api/useAdmins.ts` (`useAdminRoles`, `useUpdateAdminRoles`)  
  - UI: `src/components/admins/AdminProfileDetail.tsx` shows assigned roles and includes role management areas


### Superadmin: Audit
- GET /v1/superadmin/audit/invites, admin-roles, role-permissions
  - Services: implemented in `src/services/invites.service.ts` and `src/services/roles.service.ts` (audit endpoints)  
  - UI: `AdminAuditSection` exists and is used in `AdminProfileDetail` as a mock/placeholder; full audit pages are partially implemented or need expansion.


---

## 3) Files I added/changed during work

- Added address domain types and service hooks (to support profile addresses):
  - `src/services/addresses.service.ts`  (new)
  - `src/types/address.types.ts`       (new)
  - `src/hooks/api/useAddresses.ts`    (new)
- Updated `src/app/dashboard/profile/page.tsx`: removed "Preferences & Security" section and added a styled "Saved Addresses" list (read-only) to match the app design language.
- Added accept-invite flow (public onboarding page):
  - `src/app/accept-invite/page.tsx`   (new - public page)
  - `src/components/auth/AcceptInviteForm.tsx`  (new)
  - Updated `src/hooks/api/useAuth.ts`: added `useAcceptInvite` hook
- **Upgraded invites system to use `/admin/admin-invites` API**:
  - Updated `src/services/invites.service.ts` to call new endpoints
  - Updated `src/components/invites/InviteDialogs.tsx`: added `sendEmail` toggle
  - Updated `src/components/invites/InvitesView.tsx`: improved permission handling
  - Added `ADMIN.ADMIN_INVITES` routes to `src/lib/constants/api-routes.ts`
  - Now supports: role assignment at creation, configurable expiry, send-email toggle
  - Permission-based access (`CREATE_ADMIN` instead of superadmin-only)
- TODOs tracked and address-list added; next is add form + edit/delete UI.

---

##Duplicate address implementations: addresses handling lives in `src/services/auth.service.ts` and the new `src/services/addresses.service.ts`. Choose one place to avoid drift. I recommend consolidating into `src/services/addresses.service.ts` and updating hooks to import from there.

- `accept-invite` flow: service exists, but I couldn't find a dedicated frontend accept-invite page. If your user onboarding requires a public accept-invite page, we should implement it.

- Audit UI: services provide audit endpoints; UI pages/components exist in parts (e.g., `AdminAuditSection`) but full navigable audit pages may not exist for all audits — expand as required.

- Address UI (next actions): I added the list display; add/edit/delete forms and default-address toggle should be implemented and wired to these hooks:
  - `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress` in `src/hooks/api/useAuth.ts` (already present)

- React Query caching: many hooks set stale times; when developing test flows, invalidate relevant queries or call refetches to verify live behavior.

---

## 5) Recommendations & next steps

Priority next steps I can implement for you (pick one to start):

1. Complete address CRUD on profile page (add modal form, edit modal, delete with confirmation, default-switch). This will finish the address feature end-to-end. (Recommended)
2. Consolidate `addresses` code: migrate address functions to `src/services/addresses.service.ts` and update uses to remove duplicates.
3. Add an `accept-invite` public page if invitees should accept via the frontend (wire `auth.service.acceptInvite`).
4. Expand audit UIs to full pages: invites audit, admin-roles audit, role-permissions audit.
you pick (1), I will implement the Add Address dialog next (form + validation + create mutation + UI styles consistent with the profile page). I already prepared the hooks and service to support that.

---

## 6) How to run & test locally

From `frontend/admin` run the dev server:

```bash
npm install
npm run dev
```

Then open the admin UI in the browser (usually http://localhost:3000). To test addresses:
- Visit the profile page: `/dashboard/profile` and confirm the Saved Addresses card loads.
- After I implement add/edit/delete, use the UI dialogs to exercise POST/PATCH/DELETE and verify the network requests in browser devtools.

---

## 7) Where things live (key file quick-links)

- API routes constants: `src/lib/constants/api-routes.ts`
- Auth & profile & addresses (service): `src/services/auth.service.ts`
- Addresses service (added): `src/services/addresses.service.ts`
- Address types (added): `src/types/address.types.ts`
- Hooks (auth & addresses): `src/hooks/api/useAuth.ts`, `src/hooks/api/useAddresses.ts`
- Login page: `src/app/login/page.tsx`
- Accept invite page (added): `src/app/accept-invite/page.tsx`
- Profile page (profile + saved addresses): `src/app/dashboard/profile/page.tsx`
- Categories UI: `src/components/categories/CategoriesView.tsx`
- Sources UI: `src/components/sources/SourcesView.tsx`
- Datasets service/UI: `src/services/datasets.service.ts`, `src/components/datasets/DatasetsView.tsx`
- Users UI: `src/components/users/UsersListView.tsx`
- Invites UI: `src/components/invites/InvitesView.tsx`
- Roles UI: `src/components/roles/RolesView.tsx`
- Admins UI: `src/components/admins/AdminsListView.tsx`, `src/components/admins/AdminProfileDetail.tsx`

---

If you want, I will now implement the "Add Address" dialog on the profile page (form + validation + `useCreateAddress`). Say "go ahead" and I'll proceed. If you want the summary adjusted or moved to a different path/name, tell me where.