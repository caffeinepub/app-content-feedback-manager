# Specification

## Summary
**Goal:** Refactor the comment pool to use a status-based record structure with atomic dispensing logic, and add modal error handling in the frontend for both single and bulk generators.

**Planned changes:**
- Refactor the backend comment pool to store each comment as a record with a unique `commentId`, `text`, and `status` (`#available` or `#used`), migrating all existing comments to `#available` status
- Rewrite `generateSingle` to atomically select and mark one `#available` comment as `#used`, returning `#ok(text)` or `#err("Pool is empty")`
- Rewrite `generateBulk` with strict all-or-nothing semantics: mark N comments used if enough are available, otherwise return an error with the remaining count and mark zero comments used
- Update `getPoolStats` to return `{ available: Nat; total: Nat }` reflecting only `#available` comments for the live count
- Update `SingleGeneratorView.tsx` to show a modal popup with an OK button when `generateSingle` returns an error, and refetch pool stats after a successful generation
- Update `BulkGeneratorView.tsx` to show a modal popup with an OK button when `generateBulk` returns an error, remove any partial fulfillment UI messaging, and refetch pool stats after every generate attempt

**User-visible outcome:** Users see a modal with the exact error message when generation fails (empty pool or insufficient comments), and the "Comments left" count updates immediately after every generate action. No silent failures or partial fulfillment messages appear.
