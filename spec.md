# Specification

## Summary
**Goal:** Implement a shared available-index pool per comment list with atomic generation, consumed-template tracking, and admin reset controls with audit logging.

**Planned changes:**
- Add a stable `availablePoolByList` HashMap (keyed by listId) to the backend, initialized to `[0..N-1]` on list creation, updated on template add/delete, and persisted across upgrades
- Replace `generateComment` with an atomic version that checks device claims, consumes one index from the shared pool, and returns metadata (`availableBefore`, `availableAfter`, `totalTemplates`)
- Replace `generateBulkComments` with an atomic version that validates the access key, clamps count to pool size, consumes indices from the shared pool, and returns metadata (no device lock)
- Update `getAvailableCount` to return `availablePoolByList[listId].size()` and update `getListMetrics` to derive `availableTemplates` and `usedTemplates` from pool size
- Add `resetPool(listId, clearClaims)` backend method that restores the pool to `[0..N-1]`, optionally clears device claims for that list, and appends an audit log entry
- Add a stable `auditLog` array and a `getAuditLog()` query to the backend
- Update `useQueries.ts` to handle response metadata from both generate mutations and invalidate `getListMetrics`/`getAvailableCount` after success; add `useResetPool` mutation hook
- Update `UserView.tsx` so the available count updates immediately from `response.availableAfter`, out-of-comments badge shows when pool is empty, and lock notice appears from localStorage
- Update `BulkCommentGenerator.tsx` to immediately reflect `availableAfter`, show a toast when count is clamped, and disable the Generate button when pool is empty
- Add per-list "Reset Pool" and "Reset Pool + Clear Claims" buttons in `AdminComments.tsx`, each with a confirmation dialog, success toast, and metrics refetch

**User-visible outcome:** Comment pools are tracked atomically per list; users and admins see live available-count updates immediately after generation; admins can reset a list's pool (with optional device-claim clearing) from the Admin Comments panel, with all reset actions recorded in an audit log.
