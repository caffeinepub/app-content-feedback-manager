# Specification

## Summary
**Goal:** Fix the admin authorization error ("Unauthorized: Only admins can add comment lists") for all comment list mutation operations in the Admin Panel.

**Planned changes:**
- Fix the `addCommentList` backend authorization check in `backend/main.mo` to use the same admin principal check pattern applied to other admin-gated functions (e.g., `addAppEvent`, `setAccessKey`)
- Update `AdminComments.tsx` to retrieve and use the authenticated admin actor for all mutation calls (createCommentList, renameCommentList, deleteCommentList, addTemplatesToList, etc.), matching the pattern used in `AdminLiveList.tsx` and `AdminSettings.tsx`

**User-visible outcome:** Admin users can create, rename, delete, and modify comment lists from the Admin Panel without receiving authorization errors.
