import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Settings {
    accessKey?: string;
    bgMusicEnabled: boolean;
    musicFile?: ExternalBlob;
}
export interface ExportData {
    chatMessages: Array<ChatMessage>;
    settings: Settings;
    appsEvents: Array<AppEvent>;
    commentLists: Array<CommentList>;
    images: Array<ImageMeta>;
}
export type Time = bigint;
export interface CommentList {
    id: string;
    templates: Array<string>;
    displayName: string;
    locked: boolean;
    suffix: string;
}
export interface AppEvent {
    name: string;
    usernames: Array<string>;
}
export interface ChatMessage {
    id: bigint;
    text: string;
    timestamp: Time;
}
export interface ImageMeta {
    id: bigint;
    dataUrl: string;
    data?: ExternalBlob;
    name: string;
    tags: Array<string>;
}
export interface backendInterface {
    addAppEvent(name: string): Promise<boolean>;
    addChatMessage(text: string): Promise<void>;
    addCommentList(id: string, displayName: string, suffix: string): Promise<boolean>;
    addImage(name: string, tags: Array<string>, dataUrl: string, data: ExternalBlob | null): Promise<void>;
    addTemplatesToList(listId: string, templates: Array<string>): Promise<boolean>;
    addUsernamesToAppEvent(name: string, usernames: Array<string>): Promise<boolean>;
    deleteAppEvent(id: string): Promise<boolean>;
    exportAllData(): Promise<ExportData>;
    getAccessKey(): Promise<string | null>;
    renameAppEvent(id: string, newName: string): Promise<boolean>;
    setAccessKey(key: string): Promise<void>;
    toggleListLock(listId: string): Promise<boolean>;
    updateSettings(bgMusicEnabled: boolean, musicFile: ExternalBlob | null): Promise<void>;
}
