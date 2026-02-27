# Specification

## Summary
**Goal:** Add bulk comment generation with access key protection, AI template symbol appending, live list app/event edit/delete, and a global music play/pause button.

**Planned changes:**
- Backend: Add `accessKey` field to Settings, expose `setAccessKey` and `getAccessKey` methods that persist across upgrades
- Backend: Add `renameAppEvent` and `deleteAppEvent` methods; deleting an app/event also removes all its associated usernames
- Admin > Settings: Add Access Key Management section with masked key display, show/hide toggle, custom key input, Save Key button, and Regenerate button
- User View: Replace existing Comment Generator with a Bulk Comments Generator featuring App dropdown, Comment List dropdown, quantity selector (5/10/20/50), Access Key input, Generate button, scrollable output, and Copy All button; validate key against backend before generating
- Admin > AI Templates: Add optional "Append Symbol" text input that appends the entered symbol to every generated comment template in the output
- Admin > Live List: Add Edit (inline rename) and Delete (with confirmation) buttons to each app/event entry row
- Add a fixed play/pause music button in the top-right corner visible to all users, reusing the existing `useBackgroundMusic` hook; disabled with tooltip when no track is uploaded

**User-visible outcome:** Admins can manage a single access key and use it to gate bulk comment generation for users; AI template generation supports symbol appending; live list app/event entries can be renamed or deleted; all users see a persistent music play/pause button in the top-right corner.
