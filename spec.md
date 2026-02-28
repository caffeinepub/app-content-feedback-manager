# Specification

## Summary
**Goal:** Add device-based comment locking, dynamic available comment counts, and admin metrics charts (SVG/CSS donut) to the App Review Comment Manager.

**Planned changes:**

**Backend (Motoko):**
- Add stable HashMaps for (1) device claims keyed by `listId#deviceId` and (2) used template indices per list, both persisted via `preupgrade`/`postupgrade` hooks
- Add atomic `generateComment(listId, deviceId)` update function that checks device claim, finds first unused template index, marks it used, records the claim, and returns the template text (with suffix if set); returns errors for duplicate device or exhausted list
- Add `getListMetrics()` query returning per-list records with listId, listName, totalTemplates, usedTemplates, availableTemplates, and percentUsed — all calculated from real stored data
- Add `getAvailableCount(listId)` query returning the count of unused templates for a given list

**Frontend (UserView):**
- On app load, read or generate a persistent `deviceId` via `crypto.randomUUID()` stored in localStorage
- Redesign the Single Comment Generator section to match the screenshot: blue gradient sparkle icon, title, subtitle, App/Event selector, "Select Comment List" dropdown (unlocked lists only), "Available Comments" display box fetching real count from `getAvailableCount`, blue-tinted lock notice when device has already claimed from the selected list, blue-to-teal gradient "Generate Single Comment" button (disabled when locked)
- After successful generation, display the generated comment text with a Copy button; show "Out of comments" badge on exhausted list error
- Store claim state in localStorage keyed by listId so lock notice appears immediately after generation without a page reload

**Frontend (Admin panel):**
- Add a Metrics sub-section in the Admin > Comments tab showing a card per list with: list name, Total/Used/Available counts from `getListMetrics`, a horizontal progress bar, and a pure SVG/CSS donut chart (stroke-dasharray/stroke-dashoffset) — no external chart library

**User-visible outcome:** Users see a redesigned Single Comment Generator that shows the real available comment count, prevents duplicate generation per device with a lock notice, and copies the generated comment easily. Admins can view per-list usage metrics with progress bars and donut charts inside the admin panel.
