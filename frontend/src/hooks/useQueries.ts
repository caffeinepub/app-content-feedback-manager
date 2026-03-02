import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CommentList, AppEvent, ChatMessage, ImageMeta, Settings, ListMetrics, PriceEntry, AppEarnings, AllEarningsSummary, AppImport, ExternalBlob, Earning, PayoutRequest } from '../backend';

// Helper to get admin code from localStorage
function getAdminCode(): string {
  const code = localStorage.getItem('adminCode');
  if (!code) {
    throw new Error('Admin access required. Please unlock with code 7898.');
  }
  return code;
}

// ─── Comment Lists ────────────────────────────────────────────────────────────

export function useGetCommentLists() {
  const { actor, isFetching } = useActor();

  return useQuery<CommentList[]>({
    queryKey: ['commentLists'],
    queryFn: async () => {
      if (!actor) return [];
      const order = await actor.getCommentListsOrder();
      const allLists = await actor.exportAllData();
      if (!allLists) return [];
      const listMap = new Map(allLists.commentLists.map(l => [l.id, l]));
      return order.map(id => listMap.get(id)).filter(Boolean) as CommentList[];
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

export function useCreateCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, displayName, suffix }: { id: string; displayName: string; suffix: string }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.addCommentList(id, displayName, suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useRenameCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldId, newId, newDisplayName }: { oldId: string; newId: string; newDisplayName: string }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.renameCommentList(oldId, newId, newDisplayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCommentList(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, templates }: { listId: string; templates: string[] }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.addTemplatesToList(listId, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['availableComments'] });
    },
  });
}

export function useToggleListLock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.toggleListLock(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
    },
  });
}

// ─── App Events ───────────────────────────────────────────────────────────────

export function useGetAppEvents() {
  const { actor, isFetching } = useActor();

  return useQuery<AppEvent[]>({
    queryKey: ['appEvents'],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.exportAllData();
      return data?.appsEvents ?? [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.addAppEvent(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useRenameAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldName, newName, id }: { oldName?: string; newName: string; id?: string }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      const resolvedOldName = oldName ?? id ?? '';
      return actor.renameAppEvent(resolvedOldName, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useDeleteAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAppEvent(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useAddUsernamesToEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, usernames }: { name: string; usernames: string[] }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.addUsernamesToAppEvent(name, usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useImportLiveList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imports: AppImport[]) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.importLiveList(imports);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
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
      const data = await actor.exportAllData();
      return data?.chatMessages ?? [];
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

// ─── Images ───────────────────────────────────────────────────────────────────

export function useGetImages() {
  const { actor, isFetching } = useActor();

  return useQuery<ImageMeta[]>({
    queryKey: ['images'],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.exportAllData();
      return data?.images ?? [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, tags, dataUrl, data }: { name: string; tags: string[]; dataUrl: string; data: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addImage(name, tags, dataUrl, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useGetSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) return { bgMusicEnabled: false };
      const data = await actor.exportAllData();
      return data?.settings ?? { bgMusicEnabled: false };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bgMusicEnabled, musicFile }: { bgMusicEnabled: boolean; musicFile: ExternalBlob | null }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.updateSettings(bgMusicEnabled, musicFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useSetAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.setAccessKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['accessKey'] });
    },
  });
}

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

// ─── List Metrics ─────────────────────────────────────────────────────────────

export function useGetListMetrics() {
  const { actor, isFetching } = useActor();

  return useQuery<ListMetrics[]>({
    queryKey: ['listMetrics'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListMetrics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

// ─── Comments (Claim) ─────────────────────────────────────────────────────────

export function useClaimComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.claimComment(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['availableComments'] });
      queryClient.invalidateQueries({ queryKey: ['availableCount'] });
    },
  });
}

export function useGetAvailableComments(listId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['availableComments', listId],
    queryFn: async () => {
      if (!actor) return { comments: [], count: BigInt(0) };
      return actor.getAvailableComments(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
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
    mutationFn: async ({ appName, pricePerEntry, isActive }: { appName: string; pricePerEntry: number; isActive: boolean }) => {
      getAdminCode();
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
      getAdminCode();
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
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.bulkSetPrices(entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

// ─── Earnings (calculated) ────────────────────────────────────────────────────

export function useCalculateAllEarnings() {
  const { actor, isFetching } = useActor();

  return useQuery<AllEarningsSummary>({
    queryKey: ['earnings'],
    queryFn: async () => {
      if (!actor) return { appEarnings: [], totalAppsWithPrices: BigInt(0), totalValidEntries: BigInt(0), totalEarnings: 0 };
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

// ─── Export ───────────────────────────────────────────────────────────────────

export function useExportAllData() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.exportAllData();
    },
  });
}

// ─── User Earnings Store ──────────────────────────────────────────────────────

export function useGetEarning(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Earning | null>({
    queryKey: ['earning', username],
    queryFn: async () => {
      if (!actor || !username) return null;
      return actor.getEarning(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useGetAllEarnings() {
  const { actor, isFetching } = useActor();

  return useQuery<Earning[]>({
    queryKey: ['allEarnings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEarnings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOrUpdateEarning() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, totalAmount }: { username: string; totalAmount: bigint }) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.addOrUpdateEarning(username, totalAmount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEarnings'] });
    },
  });
}

export function useSetWalletPhone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, phone }: { username: string; phone: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setWalletPhone(username, phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allEarnings'] });
    },
  });
}

// ─── Payout Requests ─────────────────────────────────────────────────────────

export function useGetAllPayoutRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<PayoutRequest[]>({
    queryKey: ['allPayoutRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayoutRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useSubmitPayoutRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, totalAmount, walletPhone }: { username: string; totalAmount: bigint; walletPhone: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPayoutRequest(username, totalAmount, walletPhone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayoutRequests'] });
    },
  });
}

export function useApprovePayoutRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.approvePayoutRequest(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayoutRequests'] });
    },
  });
}

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

export function useBulkDeleteLiveLists() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.bulkDeleteLiveLists();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
  });
}

export function useBulkDeleteCommentLists() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      getAdminCode();
      if (!actor) throw new Error('Actor not available');
      return actor.bulkDeleteCommentLists();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrder'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
  });
}

// ─── Backward-compatible aliases ──────────────────────────────────────────────

// Comment lists
export const useCommentLists = useGetCommentLists;
export const useGetCommentListsOrdered = useGetCommentLists;
export const useAddCommentList = useCreateCommentList;

// App events
export const useAppEvents = useGetAppEvents;
export const useAppsEvents = useGetAppEvents;
export const useAddAppEvent = useCreateAppEvent;
export const useAddUsernamesToAppEvent = useAddUsernamesToEvent;

// Chat messages
export const useChatMessages = useGetChatMessages;

// Images
export const useImages = useGetImages;

// Settings
export const useSettings = useGetSettings;
export const useAccessKey = useGetAccessKey;

// Metrics / comments
export const useListMetrics = useGetListMetrics;
export const useAvailableComments = useGetAvailableComments;
export const useAvailableCount = useGetAvailableCount;

// Pricing
export const usePriceList = useGetPriceList;

// Earnings
export const useAllEarnings = useCalculateAllEarnings;
