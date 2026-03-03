# Specification

## Summary
**Goal:** Fix four missing backend methods in the admin panel so that create list, app event, set access key, and upload music operations no longer return "backend does not support" errors.

**Planned changes:**
- Add a Motoko backend method to create and persist a new comment list, and wire the AdminComments frontend view to call it.
- Add a Motoko backend method to create and persist an app event, and wire the AdminLiveList frontend view to call it.
- Add a Motoko backend method to set and persist an access key, and wire the AdminSettings frontend view to call it.
- Add a Motoko backend method to upload and persist music data/URL with metadata, and wire the AdminSettings music upload view to call it.

**User-visible outcome:** Admin panel users can successfully create lists, record app events, set the access key, and upload background music without encountering "backend does not support" errors.
