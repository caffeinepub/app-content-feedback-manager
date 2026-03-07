# Review Empire

## Current State

The app is a navy-neon dashboard for managing app review comments, live user lists, earnings/payouts, and an admin panel. The backend is a Motoko canister with persistent storage. The frontend is React + TailwindCSS.

**Critical broken state:** All admin actions (createCommentList, createAppEvent, importLiveLists, setAccessKey, uploadImage, etc.) throw "Unauthorized" errors. The root cause is that the backend uses `AccessControl.isAdmin(accessControlState, caller)` — a principal-based check from the `authorization` component — to gate all admin mutations. However the app is designed to be fully public with NO Internet Identity login. The frontend uses an anonymous actor, and the anonymous principal is never registered as admin, so every admin call fails.

## Requested Changes (Diff)

### Add
- Backend: a simple `adminCode` variable stored in stable state (default: `"7898"`)
- Backend: a public `verifyAdminCode(code: Text) : Bool` query function
- Backend: all admin-gated functions now accept an extra `adminCode: Text` parameter and compare it to the stored code
- Frontend: all admin mutation hooks pass the stored admin code from localStorage

### Modify
- Backend: replace ALL `AccessControl.isAdmin(...)` checks with `adminCode == storedAdminCode` comparisons on the extra parameter
- Backend: replace ALL `AccessControl.hasPermission(..., #user)` checks with no-auth (allow anonymous callers for user-level actions like claimComment, submitWithdrawalRequest, etc.)
- Backend: remove the `MixinAuthorization` include and `accessControlState` since they are no longer needed
- Frontend `useQueries.ts`: every admin mutation must read `localStorage.getItem("adminCode") ?? "7898"` and pass it as the extra arg
- Frontend `useAdminAuth.ts`: keep existing PIN validation logic (already correct)

### Remove
- Backend: `AccessControl.isAdmin(...)` and `AccessControl.hasPermission(...)` calls
- Backend: `import MixinAuthorization` and `include MixinAuthorization(accessControlState)`
- Backend: `let accessControlState = AccessControl.initState()`

## Implementation Plan

1. Rewrite `src/backend/main.mo`:
   - Add `var adminPin : Text = "7898"` as stable state
   - Remove MixinAuthorization include and AccessControl state
   - Add helper `func isAdmin(code: Text) : Bool { code == adminPin }`
   - Add `public query func verifyAdminCode(code: Text) : async Bool { code == adminPin }`
   - Add `public shared func changeAdminCode(oldCode: Text, newCode: Text) : async Bool` for admin to change PIN
   - All admin-only functions: add `adminCode: Text` param, replace `AccessControl.isAdmin` check with `if (not isAdmin(adminCode)) Runtime.trap("Unauthorized")`
   - All user-level functions (claimComment, submitWithdrawalRequest, checkWithdrawalEligibility, getMyWithdrawalRequests, addChatMessage, generateSingle, generateBulk, consumeFromList): remove the permission check entirely (allow anonymous)
   - Query functions that were admin-gated (getSettings, getAllEarningsSummary, getAllWithdrawalRequests): add `adminCode: Text` param
   - Keep all data structures, types, and business logic exactly as-is

2. Update `src/frontend/src/hooks/useQueries.ts`:
   - Add helper `getAdminCode(): string` that reads `localStorage.getItem("adminCode") ?? "7898"`
   - Pass `getAdminCode()` as the first or appropriate argument to every admin mutation call
   - Remove `initAdminActor` calls (no longer needed)
   - Update query hooks that call admin-gated query functions to also pass the admin code

3. Update `src/frontend/src/backend.d.ts` to match the new function signatures (admin functions now take an extra `adminCode: string` param)

4. Update admin views that display earnings/withdrawal data to pass admin code in queries
