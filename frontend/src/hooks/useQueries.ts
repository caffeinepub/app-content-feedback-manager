import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CommentList, AppEvent, Settings, PriceEntry, ListMetrics, WithdrawalRequest } from '../backend';
import { ExternalBlob } from '../backend';

// ── Comment Lists ─────────────────────────────────────────────────────────────

export function useCommentLists() {
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

export const useGetAllCommentLists = useCommentLists;

export function useAddCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: CommentList) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createCommentList(list);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useUpdateCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: CommentList) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createCommentList(list);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

/** Add templates to an existing list by merging and re-saving */
export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, templates }: { listId: string; templates: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      const existing = await actor.getCommentList(listId);
      if (!existing) throw new Error(`Comment list "${listId}" not found`);
      const merged: CommentList = {
        ...existing,
        templates: [...existing.templates, ...templates],
      };
      await actor.createCommentList(merged);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useDeleteCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {
      throw new Error('Delete comment list is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
    },
  });
}

// ── App Events ────────────────────────────────────────────────────────────────

export function useAppsEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<AppEvent[]>({
    queryKey: ['appEvents'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAppEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export const useGetAllAppEvents = useAppsEvents;

export function useAddAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: AppEvent) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createAppEvent(event.name, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useUpdateAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: AppEvent) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createAppEvent(event.name, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useDeleteAppEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_name: string) => {
      throw new Error('Delete app event is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

// ── Chat Messages ─────────────────────────────────────────────────────────────

export function useGetAllChatMessages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['chatMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChatMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useGetChatMessages = useGetAllChatMessages;

export function useAddChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_text: string) => {
      // Backend does not expose addChatMessage; stub
      throw new Error('addChatMessage is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
  });
}

// ── Images ────────────────────────────────────────────────────────────────────

export function useGetAllImages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllImages();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useGetImages = useGetAllImages;

export function useAddImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_image: { name: string; tags: string[]; dataUrl: string }) => {
      throw new Error('addImage is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useGetSettings = useSettings;

export function usePublicSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      if (!actor) return { bgMusicEnabled: false, musicFile: undefined };
      return actor.getPublicSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setAccessKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// Alias kept for backward compatibility — returns the mutation (not a query)
export const useAccessKey = useSetAccessKey;

export function useUploadMusicFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      await actor.uploadMusicFile(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
    },
  });
}

// Legacy alias kept for backward compatibility
export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partial: Partial<Settings> & { musicFileData?: File }) => {
      if (!actor) throw new Error('Actor not available');
      if (partial.musicFileData) {
        const bytes = new Uint8Array(await partial.musicFileData.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        await actor.uploadMusicFile(blob);
      }
      if (partial.accessKey !== undefined) {
        await actor.setAccessKey(partial.accessKey);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
    },
  });
}

// ── Price List ────────────────────────────────────────────────────────────────

export function usePriceList() {
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

export const useGetPriceList = usePriceList;

export function useAddPriceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_entry: PriceEntry) => {
      throw new Error('addPriceEntry is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

export function useUpdatePriceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_entry: PriceEntry) => {
      throw new Error('updatePriceEntry is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

// Alias used by AdminPricing
export const useSetPriceEntry = useUpdatePriceEntry;

export function useDeletePriceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_appName: string) => {
      throw new Error('deletePriceEntry is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

/** Bulk set prices — stub since backend has no bulk method */
export function useBulkSetPrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_entries: PriceEntry[]) => {
      throw new Error('bulkSetPrices is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
    },
  });
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export function useInventoryCount(listId: string) {
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

/** Stub — backend has no inventory update method */
export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { listId: string; delta: number }) => {
      throw new Error('updateInventory is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
    },
  });
}

// ── List Metrics ──────────────────────────────────────────────────────────────

export function useListMetrics() {
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

// ── Withdrawal Requests ───────────────────────────────────────────────────────

export function useWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawalRequest[]>({
    queryKey: ['withdrawalRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWithdrawalRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export const useGetAllWithdrawalRequests = useWithdrawalRequests;

/** Stub — backend has no withdrawal request creation method */
export function useCheckAndRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { username: string; walletNumber: string; amount: number }) => {
      throw new Error('checkAndRequestWithdrawal is not supported by the backend.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    },
  });
}

// ── Earnings (client-side calculation) ───────────────────────────────────────

export interface AppEarningsCalc {
  appName: string;
  totalUsernamesFound: number;
  pricePerEntry: number;
  totalAmount: number;
  isActive: boolean;
}

export interface AllEarningsSummary {
  appEarnings: AppEarningsCalc[];
  totalAppsWithPrices: number;
  totalValidEntries: number;
  totalEarnings: number;
}

export function useCalculateAllEarnings(): AllEarningsSummary {
  const { data: appEvents = [] } = useAppsEvents();
  const { data: priceList = [] } = usePriceList();

  const priceMap = new Map<string, PriceEntry>(
    priceList.map((p) => [p.appName.toLowerCase(), p])
  );

  const appEarnings: AppEarningsCalc[] = appEvents.map((event) => {
    const priceEntry = priceMap.get(event.name.toLowerCase());
    const pricePerEntry = priceEntry?.pricePerEntry ?? 0;
    const isActive = priceEntry?.isActive ?? false;
    const totalUsernamesFound = event.usernames.length;
    const totalAmount = isActive ? totalUsernamesFound * pricePerEntry : 0;
    return { appName: event.name, totalUsernamesFound, pricePerEntry, totalAmount, isActive };
  });

  const activeEarnings = appEarnings.filter((e) => e.isActive);
  const totalAppsWithPrices = activeEarnings.length;
  const totalValidEntries = activeEarnings.reduce((sum, e) => sum + e.totalUsernamesFound, 0);
  const totalEarnings = activeEarnings.reduce((sum, e) => sum + e.totalAmount, 0);

  return { appEarnings, totalAppsWithPrices, totalValidEntries, totalEarnings };
}

// ── Claim Comment ─────────────────────────────────────────────────────────────

export function useClaimComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      accessKey,
    }: {
      listId: string;
      accessKey?: string;
    }): Promise<{ __kind__: 'claimSuccess'; claimSuccess: string } | { __kind__: 'noCommentsRemaining' } | null> => {
      // Claim is handled client-side; this mutation is a no-op for cache invalidation
      void listId;
      void accessKey;
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

// ── Background Music ──────────────────────────────────────────────────────────

export function useBackgroundMusic() {
  const { data: publicSettings } = usePublicSettings();
  return {
    isEnabled: publicSettings?.bgMusicEnabled ?? false,
    musicFile: publicSettings?.musicFile,
    musicUrl: publicSettings?.musicFile ? publicSettings.musicFile.getDirectURL() : null,
  };
}
