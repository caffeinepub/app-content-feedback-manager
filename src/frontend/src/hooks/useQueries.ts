import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AllEarningsSummary,
  AppEvent,
  AppEventWithImportDate,
  AppImport,
  BulkCommentsResult,
  ChatMessage,
  CommentList,
  CountdownState,
  GlobalCommentPoolStats,
  ImageMeta,
  ImportSummary,
  ListMetrics,
  PriceEntry,
  PublicSettings,
  Settings,
  UserProfile,
  WithdrawalRequest,
  WithdrawalStatus,
} from "../backend";

type SingleGlobalCommentResult =
  | { __kind__: "ok"; ok: string }
  | { __kind__: "err"; err: string };
import { useActor } from "./useActor";

// ── Admin Auth Helper ─────────────────────────────────────────────────────────

/**
 * Returns the admin code from localStorage.
 * Default is '7898' if not set.
 */
function getAdminCode(): string {
  return localStorage.getItem("adminCode") || "7898";
}

// Keep persistAdminToken as a no-op export for backward compatibility
export function persistAdminToken(): void {
  // No longer needed — admin code is stored in localStorage directly
}

// Keep initAdminActor as a no-op export for backward compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function initAdminActor(_actor: unknown): Promise<void> {
  // No longer needed — all admin functions now take adminCode as first arg
}

// ── Comment Lists ─────────────────────────────────────────────────────────────

export function useGetAllCommentLists() {
  const { actor, isFetching } = useActor();
  return useQuery<CommentList[]>({
    queryKey: ["commentLists"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCommentLists();
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatibility alias
export const useCommentLists = useGetAllCommentLists;

export function useGetCommentList(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CommentList | null>({
    queryKey: ["commentList", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCommentList(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      displayName,
      suffix,
    }: {
      id: string;
      displayName: string;
      suffix: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createCommentList(getAdminCode(), id, displayName, suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

// Backward-compatibility alias
export const useAddCommentList = useCreateCommentList;

export function useAddTemplatesToCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      templates,
    }: {
      id: string;
      templates: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTemplatesToCommentList(getAdminCode(), id, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useSetCommentListTemplates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      templates,
    }: {
      id: string;
      templates: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setCommentListTemplates(getAdminCode(), id, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useRenameCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newDisplayName,
    }: {
      id: string;
      newDisplayName: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.renameCommentList(getAdminCode(), id, newDisplayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useLockCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.lockCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useUnlockCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unlockCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useToggleListLock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      if (locked) {
        return actor.unlockCommentList(getAdminCode(), id);
      }
      return actor.lockCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useResetUsedTemplates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.resetUsedTemplates(getAdminCode(), listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export function useGetAllInventory() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, bigint][]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInventory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInventoryCount(listId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["inventoryCount", listId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getInventoryCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

export function useSetInventoryCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      count,
    }: {
      listId: string;
      count: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setInventoryCount(getAdminCode(), listId, count);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ── Claim Comment ─────────────────────────────────────────────────────────────

export function useClaimComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      username,
    }: {
      listId: string;
      username: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.claimComment(listId, username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Bulk Comments ─────────────────────────────────────────────────────────────

export function useGetBulkComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      count,
    }: {
      listId: string;
      count: bigint;
    }): Promise<BulkCommentsResult> => {
      if (!actor) throw new Error("Actor not available");
      return actor.getBulkComments(getAdminCode(), listId, count);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Global Comment Pool ───────────────────────────────────────────────────────

export function useGetGlobalCommentPoolStats() {
  const { actor, isFetching } = useActor();
  return useQuery<GlobalCommentPoolStats>({
    queryKey: ["globalCommentPoolStats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalTemplates: BigInt(0),
          templatesRemaining: BigInt(0),
          totalClaimed: BigInt(0),
          batchSupport: false,
        };
      return actor.getGlobalCommentPoolStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

// New hook for the status-based pool stats (available/total)
export function useGetPoolStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{ totalPoolSize: bigint; availableCount: bigint }>({
    queryKey: ["poolStats"],
    queryFn: async () => {
      if (!actor)
        return { totalPoolSize: BigInt(0), availableCount: BigInt(0) };
      return actor.getPoolStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useGenerateSingle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      const result: SingleGlobalCommentResult = await actor.generateSingle();
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
      queryClient.invalidateQueries({ queryKey: ["globalCommentPoolStats"] });
    },
  });
}

// Updated to use the new atomic generateBulk endpoint (strict all-or-nothing)
export function useGenerateBulkGlobal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (count: bigint): Promise<string[]> => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.generateBulk(count);
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
      queryClient.invalidateQueries({ queryKey: ["globalCommentPoolStats"] });
    },
  });
}

export function useAddGlobalComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addGlobalComment(getAdminCode(), comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
      queryClient.invalidateQueries({ queryKey: ["globalCommentPoolStats"] });
    },
  });
}

export function useAddGlobalComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comments: string[]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addGlobalComments(getAdminCode(), comments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
      queryClient.invalidateQueries({ queryKey: ["globalCommentPoolStats"] });
    },
  });
}

// ── App Events ────────────────────────────────────────────────────────────────

export function useGetAllAppEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<AppEvent[]>({
    queryKey: ["appEvents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAppEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatibility aliases
export const useAppsEvents = useGetAllAppEvents;

export function useGetAllAppEventsWithImportDate() {
  const { actor, isFetching } = useActor();
  return useQuery<AppEventWithImportDate[]>({
    queryKey: ["appEventsWithImportDate"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAppEventsWithImportDate();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createAppEvent(getAdminCode(), name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appEvents"] });
      queryClient.invalidateQueries({ queryKey: ["appEventsWithImportDate"] });
    },
  });
}

// Backward-compatibility alias
export const useAddAppEvent = useCreateAppEvent;

// Stub for rename app event (no backend support; kept for compatibility)
export function useRenameAppEvent() {
  return useMutation({
    mutationFn: async (_args: { name: string; newName: string }) => {
      throw new Error("Rename app event is not supported");
    },
  });
}

export function useAddUsernamesToAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      usernames,
    }: {
      name: string;
      usernames: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addUsernamesToAppEvent(getAdminCode(), name, usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appEvents"] });
      queryClient.invalidateQueries({ queryKey: ["appEventsWithImportDate"] });
    },
  });
}

export function useDeleteAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAppEvent(getAdminCode(), name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appEvents"] });
      queryClient.invalidateQueries({ queryKey: ["appEventsWithImportDate"] });
    },
  });
}

export function useImportLiveLists() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imports: AppImport[]): Promise<ImportSummary> => {
      if (!actor) throw new Error("Actor not available");
      return actor.importLiveLists(getAdminCode(), imports);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appEvents"] });
      queryClient.invalidateQueries({ queryKey: ["appEventsWithImportDate"] });
    },
  });
}

// Backward-compatibility alias
export const useImportLiveList = useImportLiveLists;

// ── Chat Messages ─────────────────────────────────────────────────────────────

export function useGetAllChatMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["chatMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChatMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatibility alias
export const useGetChatMessages = useGetAllChatMessages;

export function useAddChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string): Promise<ChatMessage> => {
      if (!actor) throw new Error("Actor not available");
      return actor.addChatMessage(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}

export function useDeleteChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteChatMessage(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}

// ── Images ────────────────────────────────────────────────────────────────────

export function useGetAllImages() {
  const { actor, isFetching } = useActor();
  return useQuery<ImageMeta[]>({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllImages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      tags,
      dataUrl,
    }: {
      name: string;
      tags: string[];
      dataUrl: string;
    }): Promise<ImageMeta> => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadImage(getAdminCode(), name, tags, dataUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

export function useDeleteImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteImage(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

export function useUpdateImageTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tags }: { id: bigint; tags: string[] }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateImageTags(getAdminCode(), id, tags);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<Settings | null>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return null;
      const adminCode = getAdminCode();
      return actor.getSettings(adminCode);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPublicSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<PublicSettings | null>({
    queryKey: ["publicSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPublicSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMusicUrl() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["musicUrl"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMusicUrl();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAccessKey(getAdminCode(), key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useRegenerateAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.regenerateAccessKey(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useClearAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearAccessKey(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useSetBgMusicEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setBgMusicEnabled(getAdminCode(), enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["publicSettings"] });
    },
  });
}

export function useSetMusicUrl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setMusicUrl(getAdminCode(), url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicUrl"] });
    },
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bgMusicEnabled,
      musicUrl,
    }: {
      bgMusicEnabled: boolean;
      musicUrl: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSettings(getAdminCode(), bgMusicEnabled, musicUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["publicSettings"] });
      queryClient.invalidateQueries({ queryKey: ["musicUrl"] });
    },
  });
}

export function useValidateAccessKey() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (key: string): Promise<boolean> => {
      if (!actor) throw new Error("Actor not available");
      return actor.validateAccessKey(key);
    },
  });
}

// ── Price List ────────────────────────────────────────────────────────────────

export function useGetPriceList() {
  const { actor, isFetching } = useActor();
  return useQuery<PriceEntry[]>({
    queryKey: ["priceList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPriceList();
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatibility alias
export const usePriceList = useGetPriceList;

export function useGetPriceEntry(appName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PriceEntry | null>({
    queryKey: ["priceEntry", appName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPriceEntry(appName);
    },
    enabled: !!actor && !isFetching && !!appName,
  });
}

export function useAddPriceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appName,
      pricePerEntry,
      isActive,
    }: {
      appName: string;
      pricePerEntry: number;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPriceEntry(
        getAdminCode(),
        appName,
        pricePerEntry,
        isActive,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useEditPriceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appName,
      pricePerEntry,
      isActive,
    }: {
      appName: string;
      pricePerEntry: number;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.editPriceEntry(
        getAdminCode(),
        appName,
        pricePerEntry,
        isActive,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useDeletePriceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appName: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePriceEntry(getAdminCode(), appName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useBulkUploadPrices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: PriceEntry[]): Promise<bigint> => {
      if (!actor) throw new Error("Actor not available");
      return actor.bulkUploadPrices(getAdminCode(), entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useIsPriceListInitialized() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["priceListInitialized"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isPriceListInitialized();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPriceListInitialized() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setPriceListInitialized(getAdminCode(), value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceListInitialized"] });
    },
  });
}

// ── Earnings ──────────────────────────────────────────────────────────────────

export function useGetAllEarningsSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<AllEarningsSummary | null>({
    queryKey: ["allEarnings"],
    queryFn: async () => {
      if (!actor) return null;
      const adminCode = getAdminCode();
      return actor.getAllEarningsSummary(adminCode);
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatibility alias
export const useCalculateAllEarnings = useGetAllEarningsSummary;

// ── List Metrics ──────────────────────────────────────────────────────────────

export function useGetListMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<ListMetrics[]>({
    queryKey: ["listMetrics"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListMetrics();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Withdrawal Requests ───────────────────────────────────────────────────────

export function useGetAllWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRequest[]>({
    queryKey: ["withdrawalRequests"],
    queryFn: async () => {
      if (!actor) return [];
      const adminCode = getAdminCode();
      return actor.getAllWithdrawalRequests(adminCode);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyWithdrawalRequests(username: string) {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRequest[]>({
    queryKey: ["myWithdrawalRequests", username],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyWithdrawalRequests(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useSubmitWithdrawalRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      walletNumber,
      amount,
    }: {
      username: string;
      walletNumber: string;
      amount: number;
    }): Promise<WithdrawalRequest> => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitWithdrawalRequest(username, walletNumber, amount);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
      queryClient.invalidateQueries({
        queryKey: ["myWithdrawalRequests", variables.username],
      });
    },
  });
}

export function useCheckAndRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      walletNumber,
      amount,
    }: {
      username: string;
      walletNumber: string;
      amount: number;
    }): Promise<WithdrawalRequest> => {
      if (!actor) throw new Error("Actor not available");
      const eligible = await actor.checkWithdrawalEligibility(username);
      if (!eligible) {
        throw new Error(
          "You already have a pending withdrawal request. Please wait for it to be processed.",
        );
      }
      return actor.submitWithdrawalRequest(username, walletNumber, amount);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
      queryClient.invalidateQueries({
        queryKey: ["myWithdrawalRequests", variables.username],
      });
    },
  });
}

export function useUpdateWithdrawalStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      status,
    }: {
      key: string;
      status: WithdrawalStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWithdrawalStatus(getAdminCode(), key, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
    },
  });
}

// ── Countdown ─────────────────────────────────────────────────────────────────

export function useGetCountdownState() {
  const { actor, isFetching } = useActor();
  return useQuery<CountdownState | null>({
    queryKey: ["countdownState"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCountdownState();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 1000,
  });
}

export function useSetCountdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetTime: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setCountdown(getAdminCode(), targetTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countdownState"] });
    },
  });
}

export function useStopCountdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.stopCountdown(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countdownState"] });
    },
  });
}

export function useClearCountdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearCountdown(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countdownState"] });
    },
  });
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ── Per-List Available Count & Consume ────────────────────────────────────────

export function useGetAvailableCount(listId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["availableCount", listId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getAvailableCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    refetchInterval: 3000,
  });
}

export function useConsumeFromList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      count,
    }: { listId: string; count: bigint }): Promise<string[]> => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.consumeFromList(listId, count);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["availableCount", variables.listId],
      });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

// ── Wipe All Data ─────────────────────────────────────────────────────────────

export function useWipeAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.wipeAllData(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
