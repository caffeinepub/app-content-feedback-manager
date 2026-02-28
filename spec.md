# Specification

## Summary
**Goal:** Remove the App/Event dropdown from the Single Comment Generator section in the User View tab only.

**Planned changes:**
- Remove the App/Event dropdown selector from the Single Comment Generator card in `UserView.tsx`.
- Update the Comment List dropdown to show all unlocked comment lists from all apps/events (no longer filtered by a selected app/event).
- Keep all other elements intact: available comments count, device lock notice, Generate Single Comment button, copy output, and out-of-comments badge.

**User-visible outcome:** In the User View tab, the Single Comment Generator no longer shows an App/Event dropdown. Users go directly to selecting a Comment List, which now displays all unlocked lists across all apps/events.
