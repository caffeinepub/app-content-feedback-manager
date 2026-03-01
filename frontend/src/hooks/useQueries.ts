import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { AppImport, CommentList, AppEvent, PriceEntry, ImportSummary, UserProfile } from '../backend';
import type { backendInterface } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Comment Lists ────────────────────────────────────────────────────────────

export function useGetCommentLists() {
  const { actor, isFetching } = useActor();

  return useQuery<CommentList[]>({
    queryKey: ['commentLists'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const data = await actor.exportAllData();
        return data.commentLists;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCommentListsOrdered() {
  const { actor, isFetching } = useActor();

  return useQuery<CommentList[]>({
    queryKey: ['commentListsOrdered'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const [order, data] = await Promise.all([
          actor.getCommentListsOrder(),
          actor.exportAllData(),
        ]);
        const listMap = new Map(data.commentLists.map((l) => [l.id, l]));
        const ordered: CommentList[] = [];
        for (const id of order) {
          const l = listMap.get(id);
          if (l) ordered.push(l);
        }
        // append any not in order
        for (const l of data.commentLists) {
          if (!order.includes(l.id)) ordered.push(l);
        }
        return ordered;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatible aliases
export const useCommentLists = useGetCommentListsOrdered;

// Helper to get the current actor from query cache
function getActorFromCache(queryClient: ReturnType<typeof useQueryClient>): backendInterface | null {
  // Find the actor query data - it may have any identity key
  const queries = queryClient.getQueriesData<backendInterface>({ queryKey: ['actor'] });
  for (const [, data] of queries) {
    if (data) return data;
  }
  return null;
}

export function useAddCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, displayName, suffix }: { id: string; displayName: string; suffix: string }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        const result = await currentActor.addCommentList(id, displayName, suffix);
        if (!result) throw new Error('Failed to create comment list');
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrdered'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
    onError: (error: Error) => {
      console.error('addCommentList error:', error);
    },
  });
}

export function useRenameCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldId, newId, newDisplayName }: { oldId: string; newId: string; newDisplayName: string }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        return await currentActor.renameCommentList(oldId, newId, newDisplayName);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrdered'] });
    },
    onError: (error: Error) => {
      console.error('renameCommentList error:', error);
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        return await currentActor.deleteCommentList(listId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrdered'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
    },
    onError: (error: Error) => {
      console.error('deleteCommentList error:', error);
    },
  });
}

export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, templates }: { listId: string; templates: string[] }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        return await currentActor.addTemplatesToList(listId, templates);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrdered'] });
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['availableComments'] });
    },
    onError: (error: Error) => {
      console.error('addTemplatesToList error:', error);
    },
  });
}

export function useToggleListLock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        return await currentActor.toggleListLock(listId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentListsOrdered'] });
    },
    onError: (error: Error) => {
      console.error('toggleListLock error:', error);
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
      try {
        const data = await actor.exportAllData();
        return data.appsEvents;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatible aliases
export const useAppsEvents = useGetAppEvents;
export const useAppEvents = useGetAppEvents;

export function useAddAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        const result = await currentActor.addAppEvent(name);
        if (!result) throw new Error('Failed to create list (returned false)');
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
    onError: (error: Error) => {
      console.error('addAppEvent error:', error);
    },
  });
}

export function useAddUsernamesToAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, usernames }: { name: string; usernames: string[] }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        const result = await currentActor.addUsernamesToAppEvent(name, usernames);
        if (!result) throw new Error('Failed to add usernames (returned false)');
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
    onError: (error: Error) => {
      console.error('addUsernamesToAppEvent error:', error);
    },
  });
}

export function useRenameAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldName, newName, id }: { oldName?: string; newName: string; id?: string }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      const resolvedOldName = oldName ?? id ?? '';
      try {
        const result = await currentActor.renameAppEvent(resolvedOldName, newName);
        if (!result) throw new Error('Failed to rename list (returned false)');
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
    onError: (error: Error) => {
      console.error('renameAppEvent error:', error);
    },
  });
}

export function useDeleteAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        const result = await currentActor.deleteAppEvent(name);
        if (!result) throw new Error('Failed to delete list (returned false)');
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
    onError: (error: Error) => {
      console.error('deleteAppEvent error:', error);
    },
  });
}

export function useImportLiveList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imports: AppImport[]): Promise<ImportSummary> => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        const sanitized: AppImport[] = imports.map((imp) => {
          const base: AppImport = { appName: imp.appName, usernames: imp.usernames };
          if (imp.importDate !== undefined) base.importDate = imp.importDate;
          return base;
        });
        return await currentActor.importLiveList(sanitized);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appEvents'] });
    },
    onError: (error: Error) => {
      console.error('importLiveList error:', error);
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useGetSettings() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const data = await actor.exportAllData();
        return data.settings;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatible alias
export const useSettings = useGetSettings;

export function useGetAccessKey() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['accessKey'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getAccessKey();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatible alias
export const useAccessKey = useGetAccessKey;

export function useSetAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.setAccessKey(key);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKey'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: Error) => {
      console.error('setAccessKey error:', error);
    },
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
      musicFile: import('../backend').ExternalBlob | null;
    }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.updateSettings(bgMusicEnabled, musicFile);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: Error) => {
      console.error('updateSettings error:', error);
    },
  });
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export function useGetListMetrics() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['listMetrics'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListMetrics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

// Backward-compatible alias
export const useListMetrics = useGetListMetrics;

export function useAvailableComments(listId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['availableComments', listId],
    queryFn: async () => {
      if (!actor || !listId) return { comments: [] as string[], count: BigInt(0) };
      return actor.getAvailableComments(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    refetchInterval: 5000,
  });
}

export function useAvailableCount(listId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['availableCount', listId],
    queryFn: async () => {
      if (!actor || !listId) return BigInt(0);
      return actor.getAvailableCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

export function useClaimComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      return currentActor.claimComment(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['availableComments'] });
      queryClient.invalidateQueries({ queryKey: ['availableCount'] });
    },
  });
}

// ─── Price List ───────────────────────────────────────────────────────────────

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

// Backward-compatible alias
export const usePriceList = useGetPriceList;

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
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.setPriceEntry(appName, pricePerEntry, isActive);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
    onError: (error: Error) => {
      console.error('setPriceEntry error:', error);
    },
  });
}

export function useDeletePriceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appName: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.deletePriceEntry(appName);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
    onError: (error: Error) => {
      console.error('deletePriceEntry error:', error);
    },
  });
}

export function useBulkSetPrices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entries: Array<[string, number, boolean]>) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.bulkSetPrices(entries);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceList'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
    onError: (error: Error) => {
      console.error('bulkSetPrices error:', error);
    },
  });
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export function useCalculateAllEarnings() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.calculateAllEarnings();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCalculateEarnings(appName: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['earnings', appName],
    queryFn: async () => {
      if (!actor || !appName) return null;
      try {
        return await actor.calculateEarnings(appName);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!appName,
  });
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export function useGetChatMessages() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['chatMessages'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const data = await actor.exportAllData();
        return data.chatMessages;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatible alias
export const useChatMessages = useGetChatMessages;

export function useAddChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.addChatMessage(text);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
    onError: (error: Error) => {
      console.error('addChatMessage error:', error);
    },
  });
}

// ─── Images ───────────────────────────────────────────────────────────────────

export function useGetImages() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const data = await actor.exportAllData();
        return data.images;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Backward-compatible alias
export const useImages = useGetImages;

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
      data: import('../backend').ExternalBlob | null;
    }) => {
      const currentActor = getActorFromCache(queryClient) || actor;
      if (!currentActor) throw new Error('Actor not available');
      try {
        await currentActor.addImage(name, tags, dataUrl, data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error: Error) => {
      console.error('addImage error:', error);
    },
  });
}
