# Specification

## Summary
**Goal:** Fix the admin authorization error that blocks admins from performing user-level actions, and merge the Earnings tab into the Live Checker tab.

**Planned changes:**
- Update backend authorization logic to accept both `admin` and `user` roles for all operations currently gated to users only (creating comment lists, adding templates, uploading, etc.), while still rejecting unauthenticated principals
- Remove the standalone `Earnings` tab from the main navigation in App.tsx
- Embed the EarningsChecker view (username lookup, wallet entry, payout request) as a sub-section within the Live Checker tab

**User-visible outcome:** Admin users can create comment lists, add templates, and upload content without receiving "Unauthorized" errors. The Earnings functionality is accessible directly within the Live Checker tab instead of a separate navigation tab.
