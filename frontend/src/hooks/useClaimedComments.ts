import { useDeviceId } from "./useDeviceId";

const CLAIMED_COMMENT_PREFIX = "claimed_comment_";

function getClaimKey(deviceId: string, listId: string): string {
  return `${CLAIMED_COMMENT_PREFIX}${deviceId}_${listId}`;
}

export interface ClaimedComment {
  comment: string;
  listId: string;
  claimedAt: number;
}

export function useClaimedComments() {
  const deviceId = useDeviceId();

  function getClaimedComment(listId: string): ClaimedComment | null {
    try {
      const key = getClaimKey(deviceId, listId);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as ClaimedComment;
    } catch {
      return null;
    }
  }

  function storeClaimedComment(listId: string, comment: string): void {
    try {
      const key = getClaimKey(deviceId, listId);
      const data: ClaimedComment = {
        comment,
        listId,
        claimedAt: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // localStorage might be unavailable
    }
  }

  function hasClaimedComment(listId: string): boolean {
    return getClaimedComment(listId) !== null;
  }

  return {
    getClaimedComment,
    storeClaimedComment,
    hasClaimedComment,
  };
}
