import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CommentList, AppEvent, ChatMessage, ImageMeta, Settings, AppImport, PriceEntry, ListMetrics, AllEarningsSummary, AppEarnings, WithdrawalRequest, ExternalBlob } from '../backend';

// ─── Comment Lists ────────────────────────────────────────────────────────────

export function useGetCommentLists() {
  const { actor, isFetching } = useActor();
  return useQuery<CommentList[]>({
    queryKey: ['commentLists'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const exported = await actor.exportAllData();
        if (exported) {
          const order = await actor.getCommentListsOrder();
          const orderedLists = order
            .map((id) => exported.commentLists.find((l) => l.id === id))
            .filter((l): l is CommentList => l !== undefined);
          return orderedLists;
        }
      } catch {
        // fallback
      }
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCommentListsOrder() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ['commentListsOrder'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentListsOrder();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, displayName, suffix }: { id: string; displayName: string; suffix: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCommentList(id, displayName, suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
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
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useRenameCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ oldId, newId, newDisplayName }: { oldId: string; newId: string; newDisplayName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.renameCommentList(oldId, newId, newDisplayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
    },
  });
}

export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, templates }: { listId: string; templates: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTemplatesToList(listId, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
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
      return actor.toggleListLock(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
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

// ─── App Events ───────────────────────────────────────────────────────────────

export function useGetAppsEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<AppEvent[]>({
    queryKey: ['appsEvents'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const exported = await actor.exportAllData();
        if (exported) return exported.appsEvents;
      } catch {
        // fallback
      }
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAppEvent(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
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
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

export function useRenameAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.renameAppEvent(oldName, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
    },
  });
}

export function useAddUsernamesToAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, usernames }: { name: string; usernames: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addUsernamesToAppEvent(name, usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

export function useImportLiveList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imports: AppImport[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importLiveList(imports);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appsEvents'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
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
      try {
        const exported = await actor.exportAllData();
        if (exported) return exported.chatMessages;
      } catch {
        // fallback
      }
      return [];
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
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
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
      try {
        const exported = await actor.exportAllData();
        if (exported) return exported.images;
      } catch {
        // fallback
      }
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      tags,
      dataUrl,
      data,
    }: {
      name: string;
      tags: string[];
      dataUrl: string;
      data: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addImage(name, tags, dataUrl, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<Settings | null>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const exported = await actor.exportAllData();
        if (exported) return exported.settings;
      } catch {
        // fallback
      }
      return null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bgMusicEnabled,
      musicFile,
    }: {
      bgMusicEnabled: boolean;
      musicFile: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSettings(bgMusicEnabled, musicFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['exportData'] });
    },
  });
}

// ─── Access Key ───────────────────────────────────────────────────────────────

export function useGetAccessKey() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['accessKey'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAccessKey();
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
      const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      return actor.setAccessKey(newKey);
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

export function useSetPriceEntry() {
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
      if (!actor) throw new Error('Actor not available');
      return actor.setPriceEntry(appName, pricePerEntry, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
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
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

export function useBulkSetPrices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Array<[string, number, boolean]>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkSetPrices(entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export function useCalculateAllEarnings() {
  const { actor, isFetching } = useActor();
  return useQuery<AllEarningsSummary | null>({
    queryKey: ['earnings'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.calculateAllEarnings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCalculateEarnings(appName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AppEarnings | null>({
    queryKey: ['earnings', appName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.calculateEarnings(appName);
    },
    enabled: !!actor && !isFetching && !!appName,
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
    mutationFn: async ({ commentListId, count }: { commentListId: string; count: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setInventoryCount(commentListId, count);
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
    mutationFn: async ({ commentListId, quantity }: { commentListId: string; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInventory(commentListId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
    },
  });
}

// ─── Claim Comment ────────────────────────────────────────────────────────────

export function useClaimComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.claimComment(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableCount'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useGetAvailableCount(listId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['availableCount', listId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getAvailableCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

export function useGetAvailableComments(listId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<{ comments: string[]; count: bigint }>({
    queryKey: ['availableComments', listId],
    queryFn: async () => {
      if (!actor) return { comments: [], count: BigInt(0) };
      return actor.getAvailableComments(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

export function useGetAllWithdrawalRequests() {
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

export function useCheckAndRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, walletNumber }: { username: string; walletNumber: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkAndRequestWithdrawal(username, walletNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    },
  });
}

// ─── Export Data ──────────────────────────────────────────────────────────────

export function useExportAllData() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['exportData'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.exportAllData();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Backward-compatible aliases ──────────────────────────────────────────────

export const useCommentLists = useGetCommentLists;
export const useCommentListsOrder = useGetCommentListsOrder;
export const useCommentListOrder = useGetCommentListsOrder;
export const useAppsEvents = useGetAppsEvents;
export const usePriceList = useGetPriceList;
export const useSettings = useGetSettings;
export const useAccessKey = useGetAccessKey;
export const useAvailableCount = useGetAvailableCount;
export const useAvailableComments = useGetAvailableComments;
export const useListMetrics = useGetListMetrics;
export const useAllWithdrawalRequests = useGetAllWithdrawalRequests;
export const useAllEarnings = useCalculateAllEarnings;
export const useAllInventory = useGetAllInventory;
export const useInventoryCount = useGetInventoryCount;
export const useChatMessages = useGetChatMessages;
export const useImages = useGetImages;
