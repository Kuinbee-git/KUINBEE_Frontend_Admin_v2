# Claru admin delivery verification

## Local automated checks

```bash
npm ci
npm run test:claru
npm run type-check
npm run lint
npm run format:check
npm run check:ui
npm run check:permissions
npm run build
```

`test:claru` runs the actual upload engine with a deterministic storage transport.
It covers supplied multipart boundaries, saved-slice resume, exact PUT headers,
sidecars without an invented Content-Type, missing ETags, sibling cancellation,
draining outstanding checkpoints before retry, pause, file mismatch, and skipping
files already confirmed by Claru. It also tests v5 metadata serialization,
nested type validation, timestamp time zones, calendar dates, reserved JSON
keys, UTF-8 size limits, warning-only schemas and preservation of unlisted data.
`npm run test:claru:queue` verifies that custom metadata survives queueing,
refresh and retry with the same external reference.

## Browser acceptance

Install the test browser once:

```bash
npx playwright install chromium --only-shell
```

Run the built admin panel in one terminal:

```bash
npm run start -- --port 3018
```

Run acceptance in another terminal:

```bash
CLARU_TEST_BASE_URL=http://localhost:3018 \
CLARU_TEST_ARTIFACTS=/tmp/claru-production-review \
npm run test:claru:browser
```

The browser suite intercepts API and storage requests. It uses synthetic files,
does not contact Claru, and does not prove hosted storage CORS or media acceptance.
It saves screenshots and `results.json` in the artifact directory.

Scenarios cover batch creation and defaults; searchable activity selection from
220 categories; declaration, direct upload, completion, and seal; storage failure
and retry; pause and resume; refused footage and replacement consent; adding
missing sidecars; exact timestamp and duration preservation during corrections;
view-only, upload-only, seal-only, unauthorized-admin, and superadmin access;
blocked teams; unavailable discovery; 390px, 768px, and desktop layouts; and the
panel's dark-mode toggle. Every scenario checks for uncaught browser errors, and
screen captures check for horizontal page overflow.

V5 scenarios cover all eleven required project fields, nested camera
intrinsics, preventing create/upload before required metadata is ready,
time-zone errors, shared bulk metadata with per-clip edits, declaration-only
corrections preserving extra metadata, human reviewer comments, and pending
activation. Run `npm run test:claru:bulk:browser` against the same server for
bulk, queue and interruption acceptance.

## Review fixes

- Category selection supports text search and keyboard navigation.
- Forms show file sizes, removal controls, inline errors, and explicit consent
  confirmation when replacing footage. Corrections can add missing file roles
  and remove optional files.
- The workspace explains the next action and distinguishes upload, seal, and
  subsequent Claru approval. Blocked and unavailable states remain actionable.
- Transfers abort on page unmount or account changes. In-flight multipart
  checkpoints finish before another transfer can start for the same clip.
- Checkpoints include the multipart upload ID, preventing progress from an old
  upload being attached to a restarted upload.
- Create, completion, and seal requests allow two minutes in the browser.
  Errors preserve the same reference for retry; a timeout is not proof that the
  remote operation failed.
- Backend corrections confirm Claru's response before replacing local metadata
  and file records. Matching checkpoints survive a reopened form, retired
  categories remain valid for existing clips, expired seals become restartable,
  and stale responses cannot overwrite newer local submission versions.

## Hosted acceptance still required

Before release, deploy the backend and frontend together: the checkpoint request
now requires `uploadId`. Apply the Claru database migration, configure the
server-side `CLARU_API_KEY`, and assign the three permissions as appropriate.
Superadmins retain all Claru access; manage and seal are independent for admins.
The v5 backend additionally needs migration
`20261104120000_claru_reviewer_comment` before startup. No API credential belongs
in a `NEXT_PUBLIC_*` variable or in browser storage.

Use the backend guide at `backend/docs/claru-backend-testing.md` from the workspace
root for the live checklist. From the deployed admin origin, verify real PUT and
multipart upload CORS, readable ETags, interruption/resume, and completion using
approved test footage. Then seal and follow the real processing/review state.
Mocked browser success and production compilation do not replace that test.

The supplied integration guide has no vendor sandbox or automated test suite.
Do not seal synthetic files used by these local tests into the real Claru team.
