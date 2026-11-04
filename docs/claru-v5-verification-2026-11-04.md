# Claru contract v5 implementation and verification

Date: 2026-11-04. Scope: update the existing admin delivery integration, retain
RBAC and superadmin access, configure the local backend credential and verify
read-only vendor connectivity. No deployment or database migration was applied.
No live submission, upload, seal, invitation or account was created.

## Implemented

- Keep the existing six-step delivery workflow, audit history, external-reference
  idempotency, multipart checkpoints and separate seal action.
- Discover the current project contract, categories, frame rates, required files
  and metadata schema. Refresh discovery on panel requests and do not cache
  inactive, empty or blocked responses.
- Render project metadata in single-clip, bulk and declaration-correction forms.
  Shared bulk values can be changed per clip. Dates, zoned timestamps, booleans,
  numbers, enums, objects and arrays retain their JSON types. Nested metadata
  validation reports all missing/invalid paths together.
- Forward and store `declared.custom`, including fields not listed by Claru.
  Preserve it across queueing, page refresh, retries and corrections. Enforce the
  32 KiB UTF-8 ceiling and reject reserved keys and non-finite JSON numbers.
- Keep project-specific enforcement at Claru's create endpoint, before upload;
  existing stored declarations are not revalidated against changed schemas on
  idempotent replay.
- Persist and display human reviewer comments with the rejection reason and
  failed checks. Clear human comments on machine outcomes. Accept null final
  listing cursors and refuse credential-bearing API redirects.
- Keep the supplied credential in the ignored backend environment file with
  mode `0600`. No browser environment variable, source file or bundle contains
  it. Hosted environments must use their existing secret manager.

## Access checks

All eleven real router endpoints were exercised with synthetic requests and
stubbed controllers. Anonymous users receive `401`; ordinary admins without
Claru permissions and supplier accounts receive `403`. Superadmins can perform
every operation without separately assigned permissions.

| Admin permission | Access |
| --- | --- |
| `VIEW_CLARU_DELIVERIES` | Discover and read deliveries, refresh status |
| `MANAGE_CLARU_DELIVERIES` | Read, create, resume, checkpoint and complete uploads |
| `SEAL_CLARU_DELIVERIES` | Read and seal submissions |

Manage permission does not grant sealing; seal permission does not grant upload
or declaration changes. Existing navigation and page gates retain these rules.

## Verification

Checks used Node.js 24.21.0 and the installed project dependencies.

| Check | Result |
| --- | --- |
| Backend API contracts and application compilation/type checks | Pass |
| Prisma generation and schema validation | Pass; no migration applied |
| Backend Claru and admin security tests | 56 pass, with the CI network guard |
| Frontend metadata, transfer and queue tests | 30 pass |
| Single-clip browser suite | 21 scenarios pass |
| Bulk browser suite | 20 scenarios pass |
| Admin production build | Pass |
| Backend changed-file ESLint and full admin ESLint | Pass |
| Admin UI and permission contracts | Pass |
| Changed admin source formatting and Git whitespace | Pass |
| API-key pattern scan of changes and admin static bundles | Pass |
| Full admin source formatting | Existing violations in 12 unchanged files |

The formatting failures are in existing supplier, catalogue, application-layout
and service files. Their Git diffs are empty; they were left unchanged.

Browser tests use intercepted APIs and synthetic media. Local artifacts are
`/tmp/claru-v5-browser` and `/tmp/claru-v5-bulk-browser`, including screenshots and
scenario result files. They do not establish hosted media acceptance.

Backend guarded tests are selected from current source files, as in CI. A
directory scan of compiled output can include stale tests from the previously
parked storage-relay implementation; those artifacts are not current source.

## Live read-only result

The supplied credential succeeded through the actual backend Claru client and
its response schema. Discovery returned an active Kuinbee team, contract v5
(minimum accepted v1), one assigned project, 220 categories, 120–3600 second
clips, frame rates `[30, 50, 60]`, and eleven enforced metadata fields. Motion
data is optional and stereo is off. No signed URLs or credentials are recorded
in this report.

## Release sequence

1. Apply the original Claru migration if absent and the new
   `20261104120000_claru_reviewer_comment` migration before starting the updated
   backend. The new migration adds one nullable text column.
2. Provision the backend-only key in the target environment's secret manager,
   retain contract version 5, and deploy backend and admin together through the
   normal staging release process.
3. From the hosted admin origin, use approved real footage to verify PUT and
   multipart CORS, readable ETags, interruption/resume, exact byte-size
   completion, metadata correction, seal and status polling. No vendor bucket
   CORS change has been assumed or verified by these local tests.
4. Verify role access on the hosted application. Record the external reference,
   Claru submission ID and real verdict without recording secrets or signed
   URLs. Promote to production only when authorized and staging acceptance has
   passed.

Operating instructions: [Claru deliveries guide](claru-bulk-uploads.md).
