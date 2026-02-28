import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { ExternalBlob, BulkCommentsResult, OnePerListResult, CommentAssignmentResponse } from "../backend";

// ── Comment Lists ──────────────────────────────────────────────────────────────

export function useCommentLists() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["commentLists"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.exportAllData();
      return data.commentLists;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCommentList() {
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.addCommentList(id, displayName, suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCounts"] });
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteCommentList(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCounts"] });
    },
  });
}

export function useEditListName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.editListName(id, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      templates,
    }: {
      listId: string;
      templates: string[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addTemplatesToList(listId, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCounts"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

export function useToggleListLock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.toggleListLock(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

// ── Available Count ────────────────────────────────────────────────────────────

export function useAvailableCount(listId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["availableCount", listId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getAvailableCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

/**
 * Polls available comment counts for a set of list IDs every 5 seconds.
 * Returns a map of listId -> number (available count).
 */
export function useAvailableCountsForLists(listIds: string[]) {
  const { actor, isFetching } = useActor();
  const key = listIds.slice().sort().join(",");
  return useQuery<Record<string, number>>({
    queryKey: ["availableCounts", key],
    queryFn: async () => {
      if (!actor || listIds.length === 0) return {};
      const entries = await Promise.all(
        listIds.map(async (id) => {
          const count = await actor.getAvailableCount(id);
          return [id, Number(count)] as [string, number];
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: !!actor && !isFetching && listIds.length > 0,
    refetchInterval: 5000,
  });
}

// ── List Metrics ───────────────────────────────────────────────────────────────

export function useListMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["listMetrics"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListMetrics();
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: true,
  });
}

// ── Generate Bulk Comments ─────────────────────────────────────────────────────

export function useGenerateBulkComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<BulkCommentsResult, Error, { listId: string; count: number }>({
    mutationFn: async ({ listId, count }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.generateBulkComments(listId, BigInt(count));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["availableCount", variables.listId] });
      queryClient.invalidateQueries({ queryKey: ["availableCounts"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Generate One Per List ──────────────────────────────────────────────────────

export function useGenerateOnePerList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<OnePerListResult[], Error, string>({
    mutationFn: async (deviceId: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.generateOnePerList(deviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCounts"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
    },
  });
}

// ── Assign Next Comment From List (per-device, per-list) ───────────────────────

export function useAssignComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    CommentAssignmentResponse & { isAlreadyGenerated: boolean },
    Error,
    { listId: string; deviceId: string }
  >({
    mutationFn: async ({ listId, deviceId }) => {
      if (!actor) throw new Error("Actor not initialized");
      const result = await actor.assignNextCommentFromList(listId, deviceId);
      return {
        comment: result.comment,
        alreadyGenerated: result.alreadyGenerated,
        isAlreadyGenerated: result.alreadyGenerated,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
      queryClient.invalidateQueries({ queryKey: ["availableCounts"] });
    },
  });
}

// ── Apps / Events ──────────────────────────────────────────────────────────────

export function useAppsEvents() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["appsEvents"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.exportAllData();
      return data.appsEvents;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addAppEvent(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appsEvents"] });
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.addUsernamesToAppEvent(name, usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appsEvents"] });
    },
  });
}

export function useRenameAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.renameAppEvent(id, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appsEvents"] });
    },
  });
}

export function useDeleteAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deleteAppEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appsEvents"] });
    },
  });
}

// ── Chat Messages ──────────────────────────────────────────────────────────────

export function useChatMessages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["chatMessages"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.exportAllData();
      return data.chatMessages;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addChatMessage(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });
}

// ── Images ─────────────────────────────────────────────────────────────────────

export function useImages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      const data = await actor.exportAllData();
      return data.images;
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.addImage(name, tags, dataUrl, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

// ── Settings ───────────────────────────────────────────────────────────────────

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return null;
      const data = await actor.exportAllData();
      return data.settings;
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateSettings(bgMusicEnabled, musicFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useAccessKey() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["accessKey"],
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
      if (!actor) throw new Error("Actor not initialized");
      return actor.setAccessKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accessKey"] });
    },
  });
}
