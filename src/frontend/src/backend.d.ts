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
    addChatMessage(text: string): Promise<ChatMessage>;
    addGlobalComment(adminCode: string, comment: string): Promise<void>;
    addGlobalComments(adminCode: string, commentsToAdd: Array<string>): Promise<void>;
    addPriceEntry(adminCode: string, appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
    addTemplatesToCommentList(adminCode: string, id: string, newTemplates: Array<string>): Promise<void>;
    addUsernamesToAppEvent(adminCode: string, name: string, newUsernames: Array<string>): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkUploadPrices(adminCode: string, entries: Array<PriceEntry>): Promise<bigint>;
    checkWithdrawalEligibility(username: string): Promise<boolean>;
    claimComment(listId: string, username: string): Promise<ClaimCommentResult>;
    clearAccessKey(adminCode: string): Promise<void>;
    clearCountdown(adminCode: string): Promise<void>;
    consumeFromList(listId: string, count: bigint): Promise<{
        __kind__: "ok";
        ok: Array<string>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createAppEvent(adminCode: string, name: string): Promise<void>;
    createCommentList(adminCode: string, id: string, displayName: string, suffix: string): Promise<void>;
    deleteAppEvent(adminCode: string, name: string): Promise<void>;
    deleteChatMessage(adminCode: string, id: bigint): Promise<void>;
    deleteCommentList(adminCode: string, id: string): Promise<void>;
    deleteImage(adminCode: string, id: bigint): Promise<void>;
    deletePriceEntry(adminCode: string, appName: string): Promise<void>;
    editPriceEntry(adminCode: string, appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
    generateBulk(n: bigint): Promise<{
        __kind__: "ok";
        ok: Array<string>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateSingle(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllAppEvents(): Promise<Array<AppEvent>>;
    getAllAppEventsWithImportDate(): Promise<Array<AppEventWithImportDate>>;
    getAllChatMessages(): Promise<Array<ChatMessage>>;
    getAllCommentLists(): Promise<Array<CommentList>>;
    getAllEarningsSummary(adminCode: string): Promise<AllEarningsSummary>;
    getAllImages(): Promise<Array<ImageMeta>>;
    getAllInventory(): Promise<Array<[string, bigint]>>;
    getAllWithdrawalRequests(adminCode: string): Promise<Array<WithdrawalRequest>>;
    getAppEvent(name: string): Promise<AppEvent | null>;
    getAvailableCount(listId: string): Promise<bigint>;
    getBulkComments(adminCode: string, listId: string, count: bigint): Promise<BulkCommentsResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
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
    getSettings(adminCode: string): Promise<Settings>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importLiveLists(adminCode: string, imports: Array<AppImport>): Promise<ImportSummary>;
    isCallerAdmin(): Promise<boolean>;
    isPriceListInitialized(): Promise<boolean>;
    lockCommentList(adminCode: string, id: string): Promise<void>;
    regenerateAccessKey(adminCode: string): Promise<string>;
    renameCommentList(adminCode: string, id: string, newDisplayName: string): Promise<void>;
    resetUsedTemplates(adminCode: string, listId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAccessKey(adminCode: string, key: string): Promise<void>;
    setAdminCode(currentCode: string, newCode: string): Promise<boolean>;
    setBgMusicEnabled(adminCode: string, enabled: boolean): Promise<void>;
    setCommentListTemplates(adminCode: string, id: string, templates: Array<string>): Promise<void>;
    setCountdown(adminCode: string, targetTime: Time): Promise<void>;
    setInventoryCount(adminCode: string, listId: string, count: bigint): Promise<void>;
    setMusicUrl(adminCode: string, url: string): Promise<void>;
    setPriceListInitialized(adminCode: string, value: boolean): Promise<void>;
    stopCountdown(adminCode: string): Promise<void>;
    submitWithdrawalRequest(username: string, walletNumber: string, amount: number): Promise<WithdrawalRequest>;
    unlockCommentList(adminCode: string, id: string): Promise<void>;
    updateImageTags(adminCode: string, id: bigint, tags: Array<string>): Promise<void>;
    updateSettings(adminCode: string, bgMusicEnabled: boolean, newMusicUrl: string | null): Promise<void>;
    updateWithdrawalStatus(adminCode: string, key: string, status: WithdrawalStatus): Promise<void>;
    uploadImage(adminCode: string, name: string, tags: Array<string>, dataUrl: string): Promise<ImageMeta>;
    validateAccessKey(key: string): Promise<boolean>;
    verifyAdminCode(code: string): Promise<boolean>;
    wipeAllData(adminCode: string): Promise<void>;
}
