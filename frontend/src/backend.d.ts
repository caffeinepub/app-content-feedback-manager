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
export interface ExportData {
    chatMessages: Array<ChatMessage>;
    settings: Settings;
    appsEvents: Array<AppEvent>;
    commentLists: Array<CommentList>;
    images: Array<ImageMeta>;
}
export type Time = bigint;
export interface AllEarningsSummary {
    totalAppsWithPrices: bigint;
    totalValidEntries: bigint;
    appEarnings: Array<AppEarnings>;
    totalEarnings: number;
}
export interface CommentList {
    id: string;
    templates: Array<string>;
    displayName: string;
    locked: boolean;
    suffix: string;
}
export interface ListMetrics {
    usedTemplates: bigint;
    listName: string;
    availableTemplates: bigint;
    percentUsed: number;
    totalTemplates: bigint;
    listId: string;
}
export interface Earning {
    walletPhone?: string;
    username: string;
    totalAmount: bigint;
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
export interface PayoutRequest {
    walletPhone: string;
    status: Variant_pending_approved;
    username: string;
    totalAmount: bigint;
    timestamp: bigint;
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
export enum Variant_pending_approved {
    pending = "pending",
    approved = "approved"
}
export interface backendInterface {
    addAppEvent(name: string): Promise<boolean>;
    addChatMessage(text: string): Promise<void>;
    addCommentList(id: string, displayName: string, suffix: string): Promise<boolean>;
    addImage(name: string, tags: Array<string>, dataUrl: string, data: ExternalBlob | null): Promise<void>;
    addOrUpdateEarning(username: string, totalAmount: bigint): Promise<void>;
    addTemplatesToList(listId: string, templates: Array<string>): Promise<boolean>;
    addUsernamesToAppEvent(name: string, usernames: Array<string>): Promise<boolean>;
    approvePayoutRequest(username: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkDeleteCommentLists(): Promise<void>;
    bulkDeleteLiveLists(): Promise<void>;
    bulkSetPrices(entries: Array<[string, number, boolean]>): Promise<void>;
    calculateAllEarnings(): Promise<AllEarningsSummary>;
    calculateEarnings(appName: string): Promise<AppEarnings | null>;
    claimComment(listId: string): Promise<ClaimCommentResult>;
    deleteAllPayoutRequests(): Promise<void>;
    deleteAppEvent(name: string): Promise<boolean>;
    deleteCommentList(listId: string): Promise<boolean>;
    deleteEarningsRecords(): Promise<void>;
    deletePriceEntry(appName: string): Promise<void>;
    exportAllData(): Promise<ExportData | null>;
    generateBulkComments(arg0: string, arg1: bigint): Promise<BulkCommentsResult>;
    getAccessKey(): Promise<string | null>;
    getAllEarnings(): Promise<Array<Earning>>;
    getAllPayoutRequests(): Promise<Array<PayoutRequest>>;
    getAvailableComments(listId: string): Promise<{
        count: bigint;
        comments: Array<string>;
    }>;
    getAvailableCount(listId: string): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentListsOrder(): Promise<Array<string>>;
    getEarning(username: string): Promise<Earning | null>;
    getListMetrics(): Promise<Array<ListMetrics>>;
    getPriceList(): Promise<Array<PriceEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importLiveList(imports: Array<AppImport>): Promise<ImportSummary>;
    isCallerAdmin(): Promise<boolean>;
    renameAppEvent(oldName: string, newName: string): Promise<boolean>;
    renameCommentList(oldId: string, newId: string, newDisplayName: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAccessKey(key: string): Promise<void>;
    setPriceEntry(appName: string, pricePerEntry: number, isActive: boolean): Promise<void>;
    setWalletPhone(username: string, phone: string): Promise<void>;
    submitPayoutRequest(username: string, totalAmount: bigint, walletPhone: string): Promise<void>;
    toggleListLock(listId: string): Promise<boolean>;
    updateSettings(bgMusicEnabled: boolean, musicFile: ExternalBlob | null): Promise<void>;
}
