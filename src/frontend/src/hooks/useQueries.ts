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
  UserRole,
  WithdrawalRequest,
  WithdrawalStatus,
} from "../backend";
import type { backendInterface } from "../backend";

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

// ── Actor Availability Helper ─────────────────────────────────────────────────

/** Module-level reference kept in sync by useRegisterGlobalActor() */
let _globalActor: backendInterface | null = null;

/**
 * Call once in App.tsx to keep _globalActor current on every render.
 * Allows waitForActor() to poll without closure capture issues.
 */
export function useRegisterGlobalActor(): void {
  const { actor } = useActor();
  _globalActor = actor;
}

/**
 * Polls until the backend actor is ready (max 5 s).
 * Solves the "Actor not available" race on initial page load.
 */
async function waitForActor(maxWait = 15000): Promise<backendInterface> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (_globalActor) return _globalActor;
    await new Promise<void>((r) => setTimeout(r, 200));
  }
  throw new Error("Actor not available — please refresh the page");
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
      const a = await waitForActor();
      return a.createCommentList(getAdminCode(), id, displayName, suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

// Backward-compatibility alias
export const useAddCommentList = useCreateCommentList;

export function useAddTemplatesToCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      templates,
    }: {
      id: string;
      templates: string[];
    }) => {
      const a = await waitForActor();
      return a.addTemplatesToCommentList(getAdminCode(), id, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useSetCommentListTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      templates,
    }: {
      id: string;
      templates: string[];
    }) => {
      const a = await waitForActor();
      return a.setCommentListTemplates(getAdminCode(), id, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useRenameCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newDisplayName,
    }: {
      id: string;
      newDisplayName: string;
    }) => {
      const a = await waitForActor();
      return a.renameCommentList(getAdminCode(), id, newDisplayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useDeleteCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const a = await waitForActor();
      return a.deleteCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useLockCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const a = await waitForActor();
      return a.lockCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useUnlockCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const a = await waitForActor();
      return a.unlockCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useToggleListLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      const a = await waitForActor();
      if (locked) {
        return a.unlockCommentList(getAdminCode(), id);
      }
      return a.lockCommentList(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

export function useResetUsedTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const a = await waitForActor();
      return a.resetUsedTemplates(getAdminCode(), listId);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      count,
    }: {
      listId: string;
      count: bigint;
    }) => {
      const a = await waitForActor();
      return a.setInventoryCount(getAdminCode(), listId, count);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ── Claim Comment ─────────────────────────────────────────────────────────────

export function useClaimComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      username,
    }: {
      listId: string;
      username: string;
    }) => {
      const a = await waitForActor();
      return a.claimComment(listId, username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Bulk Comments ─────────────────────────────────────────────────────────────

export function useGetBulkComments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      count,
    }: {
      listId: string;
      count: bigint;
    }): Promise<BulkCommentsResult> => {
      const a = await waitForActor();
      return a.getBulkComments(getAdminCode(), listId, count);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const a = await waitForActor();
      const result: SingleGlobalCommentResult = await a.generateSingle();
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (count: bigint): Promise<string[]> => {
      const a = await waitForActor();
      const result = await a.generateBulk(count);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: string) => {
      const a = await waitForActor();
      return a.addGlobalComment(getAdminCode(), comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolStats"] });
      queryClient.invalidateQueries({ queryKey: ["globalCommentPoolStats"] });
    },
  });
}

export function useAddGlobalComments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comments: string[]) => {
      const a = await waitForActor();
      return a.addGlobalComments(getAdminCode(), comments);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const a = await waitForActor();
      return a.createAppEvent(getAdminCode(), name);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      usernames,
    }: {
      name: string;
      usernames: string[];
    }) => {
      const a = await waitForActor();
      return a.addUsernamesToAppEvent(getAdminCode(), name, usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appEvents"] });
      queryClient.invalidateQueries({ queryKey: ["appEventsWithImportDate"] });
    },
  });
}

export function useDeleteAppEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const a = await waitForActor();
      return a.deleteAppEvent(getAdminCode(), name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appEvents"] });
      queryClient.invalidateQueries({ queryKey: ["appEventsWithImportDate"] });
    },
  });
}

export function useImportLiveLists() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imports: AppImport[]): Promise<ImportSummary> => {
      const a = await waitForActor();
      return a.importLiveLists(getAdminCode(), imports);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string): Promise<ChatMessage> => {
      const a = await waitForActor();
      return a.addChatMessage(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}

export function useDeleteChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const a = await waitForActor();
      return a.deleteChatMessage(getAdminCode(), id);
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
      const a = await waitForActor();
      return a.uploadImage(getAdminCode(), name, tags, dataUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const a = await waitForActor();
      return a.deleteImage(getAdminCode(), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

export function useUpdateImageTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tags }: { id: bigint; tags: string[] }) => {
      const a = await waitForActor();
      return a.updateImageTags(getAdminCode(), id, tags);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const a = await waitForActor();
      return a.setAccessKey(getAdminCode(), key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useRegenerateAccessKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const a = await waitForActor();
      return a.regenerateAccessKey(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useClearAccessKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await waitForActor();
      return a.clearAccessKey(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useSetBgMusicEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const a = await waitForActor();
      return a.setBgMusicEnabled(getAdminCode(), enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["publicSettings"] });
    },
  });
}

export function useSetMusicUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const a = await waitForActor();
      return a.setMusicUrl(getAdminCode(), url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicUrl"] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bgMusicEnabled,
      musicUrl,
    }: {
      bgMusicEnabled: boolean;
      musicUrl: string | null;
    }) => {
      const a = await waitForActor();
      return a.updateSettings(getAdminCode(), bgMusicEnabled, musicUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["publicSettings"] });
      queryClient.invalidateQueries({ queryKey: ["musicUrl"] });
    },
  });
}

export function useValidateAccessKey() {
  return useMutation({
    mutationFn: async (key: string): Promise<boolean> => {
      const a = await waitForActor();
      return a.validateAccessKey(key);
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
      const a = await waitForActor();
      return a.addPriceEntry(getAdminCode(), appName, pricePerEntry, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useEditPriceEntry() {
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
      const a = await waitForActor();
      return a.editPriceEntry(getAdminCode(), appName, pricePerEntry, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useDeletePriceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appName: string) => {
      const a = await waitForActor();
      return a.deletePriceEntry(getAdminCode(), appName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
  });
}

export function useBulkUploadPrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: PriceEntry[]): Promise<bigint> => {
      const a = await waitForActor();
      return a.bulkUploadPrices(getAdminCode(), entries);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: boolean) => {
      const a = await waitForActor();
      return a.setPriceListInitialized(getAdminCode(), value);
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
    refetchInterval: 4000,
  });
}

export function useSubmitWithdrawalRequest() {
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
      const a = await waitForActor();
      return a.submitWithdrawalRequest(username, walletNumber, amount);
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
      const a = await waitForActor();
      const eligible = await a.checkWithdrawalEligibility(username);
      if (!eligible) {
        throw new Error(
          "You already have a pending withdrawal request. Please wait for it to be processed.",
        );
      }
      return a.submitWithdrawalRequest(username, walletNumber, amount);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      status,
    }: {
      key: string;
      status: WithdrawalStatus;
    }) => {
      const a = await waitForActor();
      return a.updateWithdrawalStatus(getAdminCode(), key, status);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetTime: bigint) => {
      const a = await waitForActor();
      return a.setCountdown(getAdminCode(), targetTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countdownState"] });
    },
  });
}

export function useStopCountdown() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await waitForActor();
      return a.stopCountdown(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countdownState"] });
    },
  });
}

export function useClearCountdown() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await waitForActor();
      return a.clearCountdown(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countdownState"] });
    },
  });
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserRole | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_profile: unknown) => {
      // saveCallerUserProfile removed in backend v2; no-op
      void _profile;
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      count,
    }: { listId: string; count: bigint }): Promise<string[]> => {
      const a = await waitForActor();
      const result = await a.consumeFromList(listId, count);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await waitForActor();
      return a.wipeAllData(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

// ── Spotify URL ───────────────────────────────────────────────────────────────

export function useGetSpotifyUrl() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["spotifyUrl"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getSpotifyUrl();
      if (Array.isArray(result)) return result[0] ?? null;
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSpotifyUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const a = await waitForActor();
      return a.setSpotifyUrl(getAdminCode(), url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spotifyUrl"] });
    },
  });
}

// ── Public actor access for System Override ────────────────────────────────────
export async function waitForActorPublic(
  maxWait = 15000,
): Promise<backendInterface> {
  return waitForActor(maxWait);
}

// ── Per Link Rate ──────────────────────────────────────────────────────────────

export function useGetPerLinkRate() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["perLinkRate"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getPerLinkRate();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPerLinkRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rate: number) => {
      const a = await waitForActor();
      return a.setPerLinkRate(getAdminCode(), rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perLinkRate"] });
    },
  });
}

export function useWipeCompletedWithdrawals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await waitForActor();
      return a.wipeCompletedWithdrawals(getAdminCode());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalRequests"] });
    },
  });
}

// ── Earnings Mode ─────────────────────────────────────────────────────────────

export function useGetEarningsMode() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["earningsMode"],
    queryFn: async () => {
      if (!actor) return "flatRate";
      return actor.getEarningsMode();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useSetEarningsMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: string) => {
      const a = await waitForActor();
      return a.setEarningsMode(getAdminCode(), mode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earningsMode"] });
    },
  });
}

// ── Music Blob Upload ─────────────────────────────────────────────────────────

export function useSetMusicBlob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const a = await waitForActor();
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const { ExternalBlob } = await import("../backend");
      const blob = ExternalBlob.fromBytes(bytes);
      await a.setMusicBlob(getAdminCode(), blob);
      // After blob upload, retrieve the URL and save it as the musicUrl text field
      const settings = await a.getPublicSettings();
      if (settings?.musicFile) {
        const url = settings?.musicFile?.getDirectURL();
        if (url) {
          await a.setMusicUrl(getAdminCode(), url);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicUrl"] });
      queryClient.invalidateQueries({ queryKey: ["publicSettings"] });
    },
  });
}

// ── Checker Earnings Enabled Flags ────────────────────────────────────────────

export function useGetSingleCheckerEarningsEnabled() {
  return useQuery({
    queryKey: ["singleCheckerEarningsEnabled"],
    queryFn: async () => {
      const a = await waitForActor();
      return a.getSingleCheckerEarningsEnabled();
    },
    staleTime: 30_000,
  });
}

export function useSetSingleCheckerEarningsEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const a = await waitForActor();
      return a.setSingleCheckerEarningsEnabled(getAdminCode(), enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["singleCheckerEarningsEnabled"],
      });
    },
  });
}

export function useGetBulkCheckerEarningsEnabled() {
  return useQuery({
    queryKey: ["bulkCheckerEarningsEnabled"],
    queryFn: async () => {
      const a = await waitForActor();
      return a.getBulkCheckerEarningsEnabled();
    },
    staleTime: 30_000,
  });
}

export function useSetBulkCheckerEarningsEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const a = await waitForActor();
      return a.setBulkCheckerEarningsEnabled(getAdminCode(), enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bulkCheckerEarningsEnabled"],
      });
    },
  });
}
