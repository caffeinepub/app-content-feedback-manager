# Specification

## Summary
**Goal:** Fix the Motoko backend (`backend/main.mo`) to fully implement all create/upload/settings operations across all four admin sections, eliminating all "does not support" stub errors.

**Planned changes:**
- Implement comment list operations in the backend: create list, add templates, set inventory count, rename, delete, lock/unlock
- Implement app event (live list) operations: create event, bulk upload usernames, delete event, auto-import parsed live list reports
- Implement access key operations: set access key, regenerate access key, validate access key on comment generation
- Implement music/settings operations: store and update background music URL, toggle music enabled/disabled state
- Audit and fix all remaining backend operations: chat messages (add/fetch), images (upload/list/tags), pricing (add/edit/delete/bulk upload), withdrawal requests (submit/list), and countdown/settings data — ensuring no function returns a placeholder or unsupported error

**User-visible outcome:** All admin panel operations across comment lists, live lists, access key settings, and music/settings will work end-to-end without errors. All other website features (chat, images, pricing, withdrawals, countdown) will also function correctly with no stub or "not supported" responses from the backend.
