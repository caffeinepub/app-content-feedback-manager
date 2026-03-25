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
export interface WhatsAppSettings {
    whatsAppLink: string;
    communityDescription: string;
    contactNumber: string;
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
export interface AllEarningsSummary {
    totalAppsWithPrices: bigint;
    totalValidEntries: bigint;
    appEarnings: Array<AppEarnings>;
    totalEarnings: number;
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
    addGlobalComment(code: string, comment: string): Promise<void>;
    addGlobalComments(code: string, commentsToAdd: Array<string>): Promise<void>;
    addPriceEntry(code: string, appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
    addTemplatesToCommentList(code: string, id: string, newTemplates: Array<string>): Promise<void>;
    addUsernamesToAppEvent(code: string, name: string, newUsernames: Array<string>): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkUploadPrices(code: string, entries: Array<PriceEntry>): Promise<bigint>;
    checkWithdrawalEligibility(username: string): Promise<boolean>;
    claimComment(listId: string, username: string): Promise<ClaimCommentResult>;
    clearAccessKey(code: string): Promise<void>;
    clearCountdown(code: string): Promise<void>;
    clearMusicUrl(code: string): Promise<void>;
    consumeFromList(listId: string, count: bigint): Promise<{
        __kind__: "ok";
        ok: Array<string>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createAppEvent(code: string, name: string): Promise<void>;
    createCommentList(code: string, id: string, displayName: string, suffix: string): Promise<void>;
    deleteAppEvent(code: string, name: string): Promise<void>;
    deleteChatMessage(code: string, id: bigint): Promise<void>;
    deleteCommentList(code: string, id: string): Promise<void>;
    deleteImage(code: string, id: bigint): Promise<void>;
    deletePriceEntry(code: string, appName: string): Promise<void>;
    editPriceEntry(code: string, appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
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
    getAllEarningsSummary(code: string): Promise<AllEarningsSummary>;
    getAllImages(): Promise<Array<ImageMeta>>;
    getAllInventory(): Promise<Array<[string, bigint]>>;
    getAllWithdrawalRequests(code: string): Promise<Array<WithdrawalRequest>>;
    getAppEvent(name: string): Promise<AppEvent | null>;
    getAvailableCount(listId: string): Promise<bigint>;
    getBulkComments(code: string, listId: string, count: bigint): Promise<BulkCommentsResult>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentList(id: string): Promise<CommentList | null>;
    getCountdownState(): Promise<CountdownState>;
    getEarningsMode(): Promise<string>;
    getSingleCheckerEarningsEnabled(): Promise<boolean>;
    getBulkCheckerEarningsEnabled(): Promise<boolean>;
    getGlobalCommentPoolStats(): Promise<GlobalCommentPoolStats>;
    getImage(id: bigint): Promise<ImageMeta | null>;
    getInventoryCount(listId: string): Promise<bigint>;
    getListMetrics(): Promise<Array<ListMetrics>>;
    getMusicUrl(): Promise<string | null>;
    getMyWithdrawalRequests(username: string): Promise<Array<WithdrawalRequest>>;
    getPerLinkRate(): Promise<number>;
    getPoolStats(): Promise<{
        totalPoolSize: bigint;
        availableCount: bigint;
    }>;
    getPriceEntry(appName: string): Promise<PriceEntry | null>;
    getPriceList(): Promise<Array<PriceEntry>>;
    getPublicSettings(): Promise<PublicSettings>;
    getSettings(code: string): Promise<Settings>;
    getSpotifyUrl(): Promise<string | null>;
    getWhatsAppSettings(): Promise<WhatsAppSettings>;
    importLiveLists(code: string, imports: Array<AppImport>): Promise<ImportSummary>;
    isCallerAdmin(): Promise<boolean>;
    isPriceListInitialized(): Promise<boolean>;
    lockCommentList(code: string, id: string): Promise<void>;
    regenerateAccessKey(code: string): Promise<string>;
    renameCommentList(code: string, id: string, newDisplayName: string): Promise<void>;
    resetUsedTemplates(code: string, listId: string): Promise<void>;
    setAccessKey(code: string, key: string): Promise<void>;
    setAdminCode(currentCode: string, newCode: string): Promise<boolean>;
    setBgMusicEnabled(code: string, enabled: boolean): Promise<void>;
    setCommentListTemplates(code: string, id: string, templates: Array<string>): Promise<void>;
    setCountdown(code: string, targetTime: Time): Promise<void>;
    setEarningsMode(code: string, mode: string): Promise<void>;
    setInventoryCount(code: string, listId: string, count: bigint): Promise<void>;
    setSingleCheckerEarningsEnabled(code: string, enabled: boolean): Promise<void>;
    setBulkCheckerEarningsEnabled(code: string, enabled: boolean): Promise<void>;
    setMusicBlob(code: string, blob: ExternalBlob): Promise<void>;
    setMusicUrl(code: string, url: string): Promise<void>;
    setPerLinkRate(code: string, rate: number): Promise<void>;
    setPriceListInitialized(code: string, value: boolean): Promise<void>;
    setSpotifyUrl(code: string, url: string): Promise<void>;
    setWhatsAppSettings(code: string, link: string, number: string, description: string): Promise<void>;
    stopCountdown(code: string): Promise<void>;
    submitWithdrawalRequest(username: string, walletNumber: string, amount: number): Promise<WithdrawalRequest>;
    unlockCommentList(code: string, id: string): Promise<void>;
    updateImageTags(code: string, id: bigint, tags: Array<string>): Promise<void>;
    updateSettings(code: string, bgMusicEnabled: boolean, newMusicUrl: string | null): Promise<void>;
    updateWithdrawalStatus(code: string, key: string, status: WithdrawalStatus): Promise<void>;
    uploadImage(code: string, name: string, tags: Array<string>, dataUrl: string): Promise<ImageMeta>;
    validateAccessKey(key: string): Promise<boolean>;
    verifyAdminCode(code: string): Promise<boolean>;
    wipeAllData(code: string): Promise<void>;
    wipeCompletedWithdrawals(code: string): Promise<bigint>;
}
