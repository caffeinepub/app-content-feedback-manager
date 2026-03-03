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
export type Time = bigint;
export interface PublicSettings {
    bgMusicEnabled: boolean;
    musicFile?: ExternalBlob;
}
export interface ListMetrics {
    usedTemplates: bigint;
    listName: string;
    availableTemplates: bigint;
    percentUsed: number;
    totalTemplates: bigint;
    listId: string;
}
export interface CountdownState {
    startedBy?: Principal;
    isActive: boolean;
    targetTime?: Time;
}
export interface CommentList {
    id: string;
    templates: Array<string>;
    displayName: string;
    locked: boolean;
    suffix: string;
}
export interface PriceEntry {
    pricePerEntry: number;
    appName: string;
    isActive: boolean;
}
export interface Settings {
    accessKey?: string;
    bgMusicEnabled: boolean;
    musicFile?: ExternalBlob;
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
export interface WithdrawalRequest {
    status: WithdrawalStatus;
    username: string;
    timestamp: Time;
    walletNumber: string;
    amount: number;
}
export interface ImageMeta {
    id: bigint;
    dataUrl: string;
    data?: ExternalBlob;
    name: string;
    tags: Array<string>;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WithdrawalStatus {
    pending = "pending",
    completed = "completed",
    rejected = "rejected"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAppEvent(appName: string, event: AppEvent): Promise<void>;
    createCommentList(list: CommentList): Promise<void>;
    getAllAppEvents(): Promise<Array<AppEvent>>;
    getAllChatMessages(): Promise<Array<ChatMessage>>;
    getAllCommentLists(): Promise<Array<CommentList>>;
    getAllImages(): Promise<Array<ImageMeta>>;
    getAllInventory(): Promise<Array<[string, bigint]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getAppEvent(name: string): Promise<AppEvent | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessage(id: bigint): Promise<ChatMessage | null>;
    getCommentList(id: string): Promise<CommentList | null>;
    getCountdownState(): Promise<CountdownState>;
    getImage(id: bigint): Promise<ImageMeta | null>;
    getInventoryCount(listId: string): Promise<bigint>;
    getListMetrics(): Promise<Array<ListMetrics>>;
    getPriceEntry(appName: string): Promise<PriceEntry | null>;
    getPriceList(): Promise<Array<PriceEntry>>;
    getPublicSettings(): Promise<PublicSettings>;
    getSettings(): Promise<Settings>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAccessKey(key: string): Promise<void>;
    uploadMusicFile(blob: ExternalBlob): Promise<void>;
}
