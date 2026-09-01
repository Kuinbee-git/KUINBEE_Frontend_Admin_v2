# Admin panel deep audit and remediation record

Audit completed: 2026-09-01
Scope: `frontend/admin` plus the backend contracts, authentication, authorization, storage, mail, and admin workflows it directly depends on. Public and supplier KDTS consumers were included where the trust contract crosses applications.

## Completion verdict

The audited code-level admin rework is complete locally. No known code-level blocker remains in the defined scope after static checks, workflow tests, production builds, dependency audits, and browser rendering.

This is not a deployment or hosted-environment acceptance. The remaining release gates require deployment credentials, a real database, and external integrations; they are listed at the end of this record. No commit, push, database migration, or deployment was performed.

## Incidents resolved

### Dashboard unavailable and console error overlay

- Added the missing `/v1/admin/dashboard/summary` endpoint and exact-count compatibility behavior for rolling deployments.
- Removed misleading invented fallback metrics. A failed metric remains explicitly unavailable.
- Reworked API errors so expected request failures are represented in the UI without triggering the Next.js development console-error overlay.
- Corrected session handling so an unauthenticated dashboard request returns to sign-in rather than rendering a broken shell.

### Supplier KYC queue unavailable

- Corrected router precedence so `/v1/admin/suppliers/kyc/*` cannot be swallowed by the generic supplier-detail route.
- Aligned the frontend URL, standard `{ success, data }` response envelope, pagination fields, and rolling-deployment compatibility parser.
- Made malformed queue responses fail visibly instead of being converted to a false “No suppliers” state.
- Returned supplier identity, reviewer identity, submitted/picked/verified/rejected timestamps, and rejection reason.
- Added deterministic ordering and normalized legacy blank rejection reasons.
- Enforced atomic pick ownership, assigned-reviewer-only decisions, idempotent terminal behavior, audit events, and best-effort notification isolation.
- Added confirmation dialogs for verification and rejection, bounded reasons, truthful loading/error/empty states, and page correction after the last row is resolved.
- Preserved the dense desktop table and replaced the mobile horizontal-scroll trap with responsive supplier action cards.

The queue was rendered in production mode against a controlled contract fixture at 1440 px and 390 px. Both supplier rows, reviewer state, and the permitted `View`, `Pick`, `Verify`, and `Reject` actions were visible. This proves the rendered frontend contract; real staging data remains a release gate.

## Phase 1 — Authentication and security boundary

### Gaps repaired

- Centralized strict allowed-origin handling for CORS, redirects, and authenticated browser mutations.
- Restricted admin login to active admin identities, equalized ineligible-account timing, rate-limited sensitive flows, and rotated sessions after authentication and password changes.
- Added admin forgot-password, reset-password, and authenticated password-change flows with password-reuse protection.
- Removed persisted browser identity claims; the HTTP-only session and `/auth/me` are authoritative.
- Cleared identity-scoped query caches on session loss and logout.
- Added an optional same-origin Next.js API proxy so secure staging cookies work locally without weakening cookie policy.
- Added per-request CSP nonces, `strict-dynamic`, HSTS, frame denial, MIME sniffing protection, restrictive permissions policy, and no-store dashboard responses.
- Added bounded JSON request timeouts and a separate upload timeout.
- Hardened direct object-storage uploads with required signed headers, a 5 GiB client/server limit, and backend `HEAD` verification of size, type, and ETag before completion.
- Removed vulnerable and unused packages; complete admin and backend dependency audits now report zero known vulnerabilities.

## Phase 2 — Authorization and administrative safety

### Gaps repaired

- Established one mechanically checked 41-permission contract across backend and admin.
- Enforced fail-closed access in navigation, route guards, page actions, and backend handlers.
- Preserved superadmin bypass only where intended and protected self-target, delegated-superadmin, and final-active-superadmin operations.
- Required bounded reasons for sensitive mutations and recorded the relevant audit events.
- Restricted the platform dataset catalog to platform-owned datasets at schema, query, detail, route, and UI layers. Supplier datasets can no longer leak through platform permissions.
- Removed redundant owner and assignment controls that implied unsupported catalog scopes.

## Phase 3 — Workflow and data integrity

### Gaps repaired

- Replaced placeholder/demo data paths with live APIs and explicit loading, empty, error, and retry states.
- Aligned request schemas, pagination, query filters, response envelopes, frontend models, and lifecycle transitions across review queues.
- Made dashboard signals exact and added pending supplier KYC as a first-class operational alert.
- Corrected dataset review, update-request, pricing, discount, invitation, question, custom-service, lead, and data-requirement controls and permission boundaries.
- Restored a real discount-rule test target; the previous package script referenced a nonexistent file.
- Added the pending question audit-entity migration without applying it.

### KDTS trust contract

- Standardized the published score as `Q×0.30 + L×0.25 + P×0.20 + U×0.15 + F×0.10`.
- Matched score inputs to integer database storage and made labels consistent across admin, supplier, and public views.
- Required a current KDTS assessment and `L >= 60` before every publication path.
- Automatically moved a published dataset back to `VERIFIED`, cleared publication pointers, and recorded an explicit unpublish audit event when a new legal score falls below 60.
- Restricted public KDTS reads to currently public, published, legally eligible datasets and removed internal reviewer history from the public response.
- Enforced ownership/assignment boundaries on internal KDTS reads.

## Phase 4 — Information architecture, design system, and accessibility

### Gaps repaired

- Consolidated the current permission-aware navigation and route-access source of truth.
- Added responsive desktop/sidebar and mobile/drawer behavior with coherent active states.
- Standardized page hierarchy, surfaces, borders, spacing, focus rings, semantic status colors, skeletons, filters, tables, dialogs, and destructive actions on design tokens.
- Removed hard-coded component colors and raw enum rendering from audited admin source.
- Preserved intentional business identifiers such as dataset/reference/employee IDs while removing accidental internal-ID exposure.
- Added accessible control names, label associations, dialog titles/descriptions, keyboard row navigation, focus-visible states, decorative-icon hiding, and safe external-link handling.
- Added recoverable root, route, and not-found error surfaces.
- Prevented production public links from falling back to localhost when the marketplace origin is not configured.

## Phase 5 — Maintainability

### Gaps repaired

- Removed 26 unused files and 6 unused dependencies identified during the audit.
- Removed obsolete legacy models, duplicate response types, unused query contracts, and unnecessary public type exports.
- The final dead-code scan reports no unused admin files, dependencies, runtime exports, or exported types.
- Removed explicit `any`, TypeScript/ESLint suppressions, native alert/confirm/prompt usage, component console calls, unsafe new-tab links, and hard-coded palette values from audited admin source.
- Added an AST-based UI contract check for design-token, accessibility, typing, and unsafe-pattern regressions.
- Repaired backend type-check, lint, and discount-test scripts so repository quality commands represent real checks.

## Verification evidence

### Admin frontend

- `npm run type-check`: pass.
- `npm run lint`: pass.
- `npm run check:permissions`: pass, 41 canonical permissions.
- `npm run check:ui`: pass.
- `npm run format:check`: pass.
- `npm run build`: pass, 30 production routes generated.
- Knip files/dependencies/exports/types scan: pass with no findings.
- `npm audit --audit-level=low`: zero vulnerabilities.

### Backend and contracts

- `pnpm check-types`: pass across the backend workspace.
- `pnpm lint`: pass across lint-enabled workspace packages.
- `pnpm build`: pass across buildable workspace packages.
- Prisma client generation: pass.
- `pnpm audit --audit-level low`: no known vulnerabilities.
- Focused suites: 68/68 tests pass:
  - security/origin/admin-contract/login/KDTS policy: 39;
  - custom-collection workflow: 7;
  - data-requirement workflow: 5;
  - supplier password recovery/change: 9;
  - discount pricing rules: 6;
  - mailer templates: 2.

### Cross-application KDTS consumers

- User frontend type-check and production build: pass.
- Supplier frontend type-check and production build: pass.
- The four changed KDTS consumer files pass targeted ESLint and Prettier checks.
- Full user and supplier lint still expose substantial pre-existing debt outside this admin-panel scope; no unrelated files were rewritten to conceal that fact.

### Browser and HTTP smoke checks

- Production login rendered cleanly at 1440 px and 390 px.
- Protected dashboard and supplier-KYC URLs redirected an unauthenticated browser to sign-in.
- Unknown routes returned HTTP 404.
- Production responses carried nonce-based CSP, HSTS, frame denial, MIME protection, restrictive permissions policy, and dashboard no-store headers.
- Controlled authenticated KYC rendering showed real rows and correct action availability at desktop and mobile widths.
- Static scans found no admin-source TODO/demo data, hard-coded colors, explicit `any`, suppression directives, unsafe external links, or component console calls.

## Release acceptance gates

These are environment operations, not unfinished local code:

1. Review and commit the local diffs in appropriately scoped commits.
2. Apply `backend/packages/database/prisma/migrations/20260828223000_add_question_audit_entity/migration.sql` through the normal migration pipeline.
3. Deploy compatible admin and backend builds; the staging screenshots that initiated this audit were hitting backend routes that did not yet exist there.
4. Configure and verify `ADMIN_API_PROXY_TARGET` when using `/api`, `NEXT_PUBLIC_USER_APP_URL`, trusted frontend origins, and password-reset destinations.
5. Audit existing published database rows created before the KDTS gate; legacy published datasets without a current assessment or with `L < 60` must be reviewed before release.
6. Run authenticated staging acceptance with at least one account per real admin role and confirm denied routes/actions fail closed.
7. Exercise KYC, review, publication, storage upload, report export, password email, supplier notification, Redis session, SMTP, S3, and payment integrations against their real services.
8. Repeat production builds, audits, tests, and authenticated browser checks in CI after deployment.
