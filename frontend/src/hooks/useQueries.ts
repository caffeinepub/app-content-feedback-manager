import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { CommentList, AppEvent, ChatMessage, ImageMeta, Settings, ListMetrics, BulkCommentsResult } from "../backend";

// ── Comment Lists ──────────────────────────────────────────────────────────────

export function useCommentLists() {
  const { actor, isFetching } = useActor();
  return useQuery<CommentList[]>({
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
    mutationFn: async ({ id, displayName, suffix }: { id: string; displayName: string; suffix: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addCommentList(id, displayName, suffix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
    },
  });
}

export function useAddTemplatesToList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, templates }: { listId: string; templates: string[] }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addTemplatesToList(listId, templates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commentLists"] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["availableCount"] });
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
  return useQuery<bigint>({
    queryKey: ["availableCount", listId],
    queryFn: async () => {
      if (!actor || !listId) return BigInt(0);
      return actor.getAvailableCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
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
      // Invalidate available count for the specific list and all metrics
      queryClient.invalidateQueries({ queryKey: ["availableCount", variables.listId] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Generate Single Comment (device-locked, uses shared pool) ─────────────────

export function useGenerateSingleComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<BulkCommentsResult, Error, { listId: string }>({
    mutationFn: async ({ listId }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.generateBulkComments(listId, BigInt(1));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["availableCount", variables.listId] });
      queryClient.invalidateQueries({ queryKey: ["listMetrics"] });
    },
  });
}

// ── Device Claim Helpers ───────────────────────────────────────────────────────

const CLAIMS_KEY_PREFIX = "claim_";

export function getLocalClaim(listId: string): { deviceId: string; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(`${CLAIMS_KEY_PREFIX}${listId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalClaim(listId: string, deviceId: string) {
  localStorage.setItem(
    `${CLAIMS_KEY_PREFIX}${listId}`,
    JSON.stringify({ deviceId, timestamp: Date.now() })
  );
}

// ── List Metrics ───────────────────────────────────────────────────────────────

export function useListMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<ListMetrics[]>({
    queryKey: ["listMetrics"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListMetrics();
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: true,
  });
}

// ── Apps / Events ──────────────────────────────────────────────────────────────

export function useAppsEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<AppEvent[]>({
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
    mutationFn: async ({ name, usernames }: { name: string; usernames: string[] }) => {
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
  return useQuery<ChatMessage[]>({
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
  return useQuery<ImageMeta[]>({
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
      data: import("../backend").ExternalBlob | null;
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
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
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
      musicFile: import("../backend").ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateSettings(bgMusicEnabled, musicFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// ── Access Key ─────────────────────────────────────────────────────────────────

export function useAccessKey() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
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
