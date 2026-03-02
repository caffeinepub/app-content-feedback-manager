# Specification

## Summary
**Goal:** Add Internet Identity-based admin authentication, background music upload and playback, a backend-persisted countdown timer, and a day/night theme toggle to the Content & Feedback Manager app.

**Planned changes:**
- Replace the existing password-based AdminUnlock screen with Internet Identity (II) login; only principals on an admin allowlist can access the admin panel, others see "Access Denied"
- Add a music upload input in AdminSettings that stores an audio file as a blob in the backend; all users' clients load and loop the track automatically
- Add a play/pause music toggle button in the top-right of the top navigation bar, visible to all users; hidden/disabled if no music has been uploaded
- Implement a backend-persisted countdown timer (HH:MM:SS) visible to all users; admin can set a target duration or datetime and reset it at any time; stops at 00:00:00
- Add a sun/moon day/night toggle button in the top navigation bar that switches the app between light and dark themes; preference persisted in localStorage

**User-visible outcome:** Admins log in via Internet Identity to access the admin panel. All users see a shared countdown timer and can toggle background music on/off. Any user can switch between light and dark mode using a top-bar button.
