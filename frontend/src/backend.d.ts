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
export interface ImageMeta {
    id: bigint;
    dataUrl: string;
    data?: ExternalBlob;
    name: string;
    tags: Array<string>;
}
export type Time = bigint;
export interface AllEarningsSummary {
    totalAppsWithPrices: bigint;
    totalValidEntries: bigint;
    appEarnings: Array<AppEarnings>;
    totalEarnings: number;
}
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
export interface GlobalCommentPoolStats {
    totalClaimed: bigint;
    totalTemplates: bigint;
    templatesRemaining: bigint;
    batchSupport: boolean;
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
export interface AppEventWithImportDate {
    importDate?: string;
    appEvent: AppEvent;
}
export interface PriceEntry {
    pricePerEntry: number;
    appName: string;
    isActive: boolean;
}
export interface AppImport {
    appName: string;
    importDate?: string;
    usernames: Array<string>;
}
export interface Settings {
    accessKey?: string;
    bgMusicEnabled: boolean;
    musicFile?: ExternalBlob;
}
export interface BulkCommentsResult {
    commentListId: string;
    templateCount: bigint;
    generatedCount: bigint;
    comments: Array<string>;
}
export interface AppEvent {
    name: string;
    usernames: Array<string>;
}
export interface ImportSummary {
    totalUsernamesAdded: bigint;
    totalDuplicatesSkipped: bigint;
    totalAppsDetected: bigint;
}
export type SingleGlobalCommentResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type ClaimCommentResult = {
    __kind__: "noCommentsRemaining";
    noCommentsRemaining: null;
} | {
    __kind__: "claimSuccess";
    claimSuccess: string;
};
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
export interface AppEarnings {
    totalUsernamesFound: bigint;
    pricePerEntry: number;
    appName: string;
    isActive: boolean;
    totalAmount: number;
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
    addChatMessage(text: string): Promise<ChatMessage>;
    addGlobalComment(comment: string): Promise<void>;
    addGlobalComments(newComments: Array<string>): Promise<void>;
    addPriceEntry(appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
    addTemplatesToCommentList(id: string, newTemplates: Array<string>): Promise<void>;
    addUsernamesToAppEvent(name: string, newUsernames: Array<string>): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkUploadPrices(entries: Array<PriceEntry>): Promise<bigint>;
    checkWithdrawalEligibility(username: string): Promise<boolean>;
    claimComment(listId: string, username: string): Promise<ClaimCommentResult>;
    clearAccessKey(): Promise<void>;
    clearCountdown(): Promise<void>;
    createAppEvent(name: string): Promise<void>;
    createCommentList(id: string, displayName: string, suffix: string): Promise<void>;
    deleteAppEvent(name: string): Promise<void>;
    deleteChatMessage(id: bigint): Promise<void>;
    deleteCommentList(id: string): Promise<void>;
    deleteImage(id: bigint): Promise<void>;
    deletePriceEntry(appName: string): Promise<void>;
    editPriceEntry(appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
    generateBulk(n: bigint): Promise<{
        __kind__: "ok";
        ok: Array<string>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateSingle(): Promise<SingleGlobalCommentResult>;
    getAllAppEvents(): Promise<Array<AppEvent>>;
    getAllAppEventsWithImportDate(): Promise<Array<AppEventWithImportDate>>;
    getAllChatMessages(): Promise<Array<ChatMessage>>;
    getAllCommentLists(): Promise<Array<CommentList>>;
    getAllEarningsSummary(): Promise<AllEarningsSummary>;
    getAllImages(): Promise<Array<ImageMeta>>;
    getAllInventory(): Promise<Array<[string, bigint]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getAppEvent(name: string): Promise<AppEvent | null>;
    getBulkComments(listId: string, count: bigint): Promise<BulkCommentsResult>;
    getBulkGlobalComments(count: bigint): Promise<{
        batchRequested: bigint;
        batchFulfilled: bigint;
        comments: Array<string>;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessage(id: bigint): Promise<ChatMessage | null>;
    getCommentList(id: string): Promise<CommentList | null>;
    getCountdownState(): Promise<CountdownState>;
    getGlobalCommentPoolStats(): Promise<GlobalCommentPoolStats>;
    getImage(id: bigint): Promise<ImageMeta | null>;
    getInventoryCount(listId: string): Promise<bigint>;
    getListMetrics(): Promise<Array<ListMetrics>>;
    getMusicUrl(): Promise<string | null>;
    getMyWithdrawalRequests(username: string): Promise<Array<WithdrawalRequest>>;
    getPoolStats(): Promise<{
        totalPoolSize: bigint;
        availableCount: bigint;
    }>;
    getPriceEntry(appName: string): Promise<PriceEntry | null>;
    getPriceList(): Promise<Array<PriceEntry>>;
    getPublicSettings(): Promise<PublicSettings>;
    getSettings(): Promise<Settings>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importLiveLists(imports: Array<AppImport>): Promise<ImportSummary>;
    isCallerAdmin(): Promise<boolean>;
    isPriceListInitialized(): Promise<boolean>;
    lockCommentList(id: string): Promise<void>;
    regenerateAccessKey(): Promise<string>;
    renameCommentList(id: string, newDisplayName: string): Promise<void>;
    resetUsedTemplates(listId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAccessKey(key: string): Promise<void>;
    setBgMusicEnabled(enabled: boolean): Promise<void>;
    setCommentListTemplates(id: string, templates: Array<string>): Promise<void>;
    setCountdown(targetTime: Time): Promise<void>;
    setInventoryCount(listId: string, count: bigint): Promise<void>;
    setMusicUrl(url: string): Promise<void>;
    setPriceListInitialized(value: boolean): Promise<void>;
    stopCountdown(): Promise<void>;
    submitWithdrawalRequest(username: string, walletNumber: string, amount: number): Promise<WithdrawalRequest>;
    unlockCommentList(id: string): Promise<void>;
    updateImageTags(id: bigint, tags: Array<string>): Promise<void>;
    updateSettings(bgMusicEnabled: boolean, newMusicUrl: string | null): Promise<void>;
    updateWithdrawalStatus(key: string, status: WithdrawalStatus): Promise<void>;
    uploadImage(name: string, tags: Array<string>, dataUrl: string): Promise<ImageMeta>;
    validateAccessKey(key: string): Promise<boolean>;
}
