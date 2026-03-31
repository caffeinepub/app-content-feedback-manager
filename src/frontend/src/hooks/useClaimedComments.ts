import { useDeviceId } from "./useDeviceId";

const NEW_PREFIX = "commentClaims_";
const OLD_PREFIX = "claimed_comment_";
const MAX_CLAIMS = 6;

function getKey(deviceId: string, listId: string) {
  return `${NEW_PREFIX}${deviceId}_${listId}`;
}

export interface ClaimedComment {
  comment: string;
  listId: string;
  claimedAt: number;
}

export function useClaimedComments() {
  const deviceId = useDeviceId();

  function getClaimedComments(listId: string): string[] {
    // Try new format first
    const newKey = getKey(deviceId, listId);
    const raw = localStorage.getItem(newKey);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data.comments)) return data.comments;
      } catch {
        // ignore parse errors
      }
    }
    // Migrate old format (single comment)
    const oldKey = `${OLD_PREFIX}${deviceId}_${listId}`;
    const oldRaw = localStorage.getItem(oldKey);
    if (oldRaw) {
      try {
        const old = JSON.parse(oldRaw);
        const comment = old.comment as string;
        if (comment) {
          const migrated = { comments: [comment], listId };
          localStorage.setItem(newKey, JSON.stringify(migrated));
          localStorage.removeItem(oldKey);
          return [comment];
        }
      } catch {
        // ignore parse errors
      }
    }
    return [];
  }

  function getClaimedComment(listId: string): ClaimedComment | null {
    const comments = getClaimedComments(listId);
    if (comments.length === 0) return null;
    return {
      comment: comments[comments.length - 1],
      listId,
      claimedAt: Date.now(),
    };
  }

  function storeClaimedComment(listId: string, comment: string): void {
    const key = getKey(deviceId, listId);
    const existing = getClaimedComments(listId);
    if (existing.length >= MAX_CLAIMS) return;
    const updated = [...existing, comment];
    localStorage.setItem(key, JSON.stringify({ comments: updated, listId }));
  }

  function hasClaimedComment(listId: string): boolean {
    return getClaimedComments(listId).length > 0;
  }

  function hasReachedLimit(listId: string): boolean {
    return getClaimedComments(listId).length >= MAX_CLAIMS;
  }

  function getRemainingClaims(listId: string): number {
    return Math.max(0, MAX_CLAIMS - getClaimedComments(listId).length);
  }

  return {
    getClaimedComment,
    getClaimedComments,
    storeClaimedComment,
    hasClaimedComment,
    hasReachedLimit,
    getRemainingClaims,
  };
}
