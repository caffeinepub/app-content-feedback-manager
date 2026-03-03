import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  CommentList,
  AppEvent,
  ChatMessage,
  ImageMeta,
  Settings,
  PublicSettings,
  PriceEntry,
  ListMetrics,
  WithdrawalRequest,
  AppImport,
} from '../backend';

// ─── Comment Lists ────────────────────────────────────────────────────────────

export function useGetAllCommentLists() {
  const { actor, isFetching } = useActor();
  return useQuery<CommentList[]>({
    queryKey: ['commentLists'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCommentLists();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useCommentLists = useGetAllCommentLists;

export function useGetCommentList(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CommentList | null>({
    queryKey: ['commentList', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCommentList(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useAddCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; displayName: string; suffix: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCommentList(args.id, args.displayName, args.suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCommentList(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
    },
  });
}

export function useRenameCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { oldId: string; newId: string; newDisplayName: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend renameCommentList only updates displayName, id stays the same
      return actor.renameCommentList(args.oldId, args.newDisplayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { listId: string; templates: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTemplatesToCommentList(args.listId, args.templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useToggleListLock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      // Fetch current state to determine lock/unlock
      const list = await actor.getCommentList(listId);
      if (!list) throw new Error('Comment list not found');
      if (list.locked) {
        return actor.unlockCommentList(listId);
      } else {
        return actor.lockCommentList(listId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
    },
  });
}

export function useGetListMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<ListMetrics[]>({
    queryKey: ['listMetrics'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListMetrics();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compat
export const useCommentListsOrder = () =>
  useQuery<string[]>({
    queryKey: ['commentListsOrder'],
    queryFn: async () => [],
    enabled: false,
  });

export const useGetCommentListsOrder = useCommentListsOrder;

// ─── App Events ───────────────────────────────────────────────────────────────

export function useGetAllAppEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<AppEvent[]>({
    queryKey: ['appsEvents'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAppEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useAppsEvents = useGetAllAppEvents;

export function useAddAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createAppEvent(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
    },
  });
}

export function useDeleteAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAppEvent(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
    },
  });
}

export function useRenameAppEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { oldName: string; newName: string }) => {
      // Backend does not have a rename app event method; this is a no-op placeholder
      throw new Error('Renaming app events is not supported. Delete and recreate instead.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
    },
  });
}

export function useAddUsernamesToAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { name: string; usernames: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addUsernamesToAppEvent(args.name, args.usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
    },
  });
}

export function useImportLiveList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imports: Array<{ appName: string; usernames: string[]; importDate?: string }>) => {
      if (!actor) throw new Error('Actor not available');
      const appImports: AppImport[] = imports.map((imp) => ({
        appName: imp.appName,
        usernames: imp.usernames,
        importDate: imp.importDate,
      }));
      return actor.importLiveLists(appImports);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
    },
  });
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export function useGetChatMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ['chatMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChatMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addChatMessage(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
  });
}

export function useDeleteChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteChatMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
  });
}

// ─── Images ───────────────────────────────────────────────────────────────────

export function useGetImages() {
  const { actor, isFetching } = useActor();
  return useQuery<ImageMeta[]>({
    queryKey: ['images'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllImages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      tags: string[];
      dataUrl: string;
      data: unknown;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadImage(args.name, args.tags, args.dataUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
}

export function useDeleteImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteImage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useGetPublicSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<PublicSettings | null>({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPublicSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<Settings | null>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getSettings();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Aliases
export const useSettings = useGetSettings;

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { bgMusicEnabled: boolean; musicFile: unknown }) => {
      if (!actor) throw new Error('Actor not available');
      // updateSettings takes bgMusicEnabled and optional musicUrl
      // musicFile is an ExternalBlob; we pass null for musicUrl since music is handled via file upload
      return actor.updateSettings(args.bgMusicEnabled, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
    },
  });
}

export function useSetBgMusicEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setBgMusicEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
    },
  });
}

export function useSetMusicUrl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setMusicUrl(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
      queryClient.invalidateQueries({ queryKey: ['musicUrl'] });
    },
  });
}

export function useGetMusicUrl() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['musicUrl'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMusicUrl();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Access Key ───────────────────────────────────────────────────────────────

export function useGetAccessKey() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['accessKey'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const s = await actor.getSettings();
        return s?.accessKey ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const useAccessKey = useGetAccessKey;

export function useSetAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setAccessKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKey'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useRegenerateAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.regenerateAccessKey();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKey'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useClearAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearAccessKey();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKey'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export function useGetPriceList() {
  const { actor, isFetching } = useActor();
  return useQuery<PriceEntry[]>({
    queryKey: ['priceList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPriceList();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias
export const usePriceList = useGetPriceList;

export function useSetPriceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      appName: string;
      pricePerEntry: number;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Try edit first, fall back to add if not found
      try {
        const existing = await actor.getPriceEntry(args.appName);
        if (existing) {
          return actor.editPriceEntry(args.appName, args.pricePerEntry, args.isActive);
        } else {
          return actor.addPriceEntry(args.appName, args.pricePerEntry, args.isActive);
        }
      } catch {
        return actor.addPriceEntry(args.appName, args.pricePerEntry, args.isActive);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

export function useDeletePriceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePriceEntry(appName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

export function useBulkSetPrices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Array<[string, number, boolean]>) => {
      if (!actor) throw new Error('Actor not available');
      const priceEntries = entries.map(([appName, pricePerEntry, isActive]) => ({
        appName,
        pricePerEntry,
        isActive,
      }));
      return actor.bulkUploadPrices(priceEntries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

// ─── Earnings (client-side calculation) ──────────────────────────────────────

interface AppEarnings {
  appName: string;
  totalUsernamesFound: number;
  pricePerEntry: number;
  totalAmount: number;
  isActive: boolean;
}

interface AllEarningsSummary {
  appEarnings: AppEarnings[];
  totalAppsWithPrices: number;
  totalValidEntries: number;
  totalEarnings: number;
}

export function useCalculateAllEarnings() {
  const { data: appEvents = [] } = useGetAllAppEvents();
  const { data: priceList = [] } = useGetPriceList();

  return useQuery<AllEarningsSummary | null>({
    queryKey: ['earnings', appEvents.length, priceList.length],
    queryFn: async () => {
      if (appEvents.length === 0 && priceList.length === 0) return null;

      const appEarnings: AppEarnings[] = [];
      let totalValidEntries = 0;
      let totalEarnings = 0;

      for (const event of appEvents) {
        const priceEntry = priceList.find(
          (p) => p.appName === event.name && p.isActive
        );
        if (priceEntry) {
          const count = event.usernames.length;
          const amount = count * priceEntry.pricePerEntry;
          appEarnings.push({
            appName: event.name,
            totalUsernamesFound: count,
            pricePerEntry: priceEntry.pricePerEntry,
            totalAmount: amount,
            isActive: priceEntry.isActive,
          });
          totalValidEntries += count;
          totalEarnings += amount;
        }
      }

      return {
        appEarnings,
        totalAppsWithPrices: appEarnings.length,
        totalValidEntries,
        totalEarnings,
      };
    },
    enabled: true,
  });
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function useGetInventoryCount(listId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['inventoryCount', listId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getInventoryCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

// Alias
export const useInventoryCount = useGetInventoryCount;

export function useGetAllInventory() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ['allInventory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInventory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetInventoryCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { commentListId: string; count: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setInventoryCount(args.commentListId, args.count);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
    },
  });
}

export function useUpdateInventory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { commentListId: string; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setInventoryCount(args.commentListId, args.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
    },
  });
}

// ─── Claim Comment ────────────────────────────────────────────────────────────

type ClaimCommentResult =
  | { __kind__: 'noCommentsRemaining' }
  | { __kind__: 'claimSuccess'; claimSuccess: string };

export function useClaimComment() {
  const { actor } = useActor();
  const { data: commentLists = [] } = useGetAllCommentLists();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { listId: string; username: string }): Promise<ClaimCommentResult> => {
      // If actor is available, use backend claim (tracks used templates)
      if (actor) {
        try {
          const result = await actor.claimComment(args.listId, args.username);
          return result as ClaimCommentResult;
        } catch {
          // Fall back to client-side if backend call fails
        }
      }
      // Client-side fallback: pick a random template from the list
      const list = commentLists.find((l) => l.id === args.listId);
      if (!list || list.templates.length === 0) {
        return { __kind__: 'noCommentsRemaining' };
      }
      const idx = Math.floor(Math.random() * list.templates.length);
      const comment = list.templates[idx] + (list.suffix ? list.suffix : '');
      return { __kind__: 'claimSuccess', claimSuccess: comment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableCount'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
    },
  });
}

export function useGetAvailableCount(listId: string) {
  const { data: commentLists = [] } = useGetAllCommentLists();
  return useQuery<bigint>({
    queryKey: ['availableCount', listId],
    queryFn: async () => {
      const list = commentLists.find((l) => l.id === listId);
      if (!list) return BigInt(0);
      return BigInt(list.templates.length);
    },
    enabled: !!listId,
  });
}

export function useGetAvailableComments(listId: string) {
  const { data: commentLists = [] } = useGetAllCommentLists();
  return useQuery<string[]>({
    queryKey: ['availableComments', listId],
    queryFn: async () => {
      const list = commentLists.find((l) => l.id === listId);
      if (!list) return [];
      return list.templates;
    },
    enabled: !!listId,
  });
}

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

export function useGetAllWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRequest[]>({
    queryKey: ['withdrawalRequests'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllWithdrawalRequests();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitWithdrawalRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { username: string; walletNumber: string; amount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitWithdrawalRequest(args.username, args.walletNumber, args.amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    },
  });
}

export function useCheckAndRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { username: string; walletNumber: string; amount?: number }) => {
      if (!actor) throw new Error('Actor not available');
      const eligible = await actor.checkWithdrawalEligibility(args.username);
      if (!eligible) throw new Error('You already have a pending withdrawal request.');
      return actor.submitWithdrawalRequest(args.username, args.walletNumber, args.amount ?? 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    },
  });
}

// ─── Reset Used Templates ─────────────────────────────────────────────────────

export function useResetUsedTemplates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetUsedTemplates(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
    },
  });
}

// ─── Validate Access Key (public) ────────────────────────────────────────────

export function useValidateAccessKey() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateAccessKey(key);
    },
  });
}

// ─── Countdown ────────────────────────────────────────────────────────────────

export function useGetCountdownState() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['countdownState'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCountdownState();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useSetCountdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetTime: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCountdown(targetTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdownState'] });
    },
  });
}

export function useStopCountdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.stopCountdown();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdownState'] });
    },
  });
}

export function useClearCountdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearCountdown();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdownState'] });
    },
  });
}

// ─── Export Data (stub for backward compat) ───────────────────────────────────

export function useExportData() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['exportData'],
    queryFn: async () => {
      if (!actor) return null;
      const [commentLists, appsEvents, chatMessages, images, settings] = await Promise.all([
        actor.getAllCommentLists(),
        actor.getAllAppEvents(),
        actor.getAllChatMessages(),
        actor.getAllImages(),
        actor.getSettings().catch(() => null),
      ]);
      return { commentLists, appsEvents, chatMessages, images, settings };
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Bulk Comments ────────────────────────────────────────────────────────────

export function useGetBulkComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { listId: string; count: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBulkComments(args.listId, args.count);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

// ─── Set Comment List Templates (replace all) ─────────────────────────────────

export function useSetCommentListTemplates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { listId: string; templates: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCommentListTemplates(args.listId, args.templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}
