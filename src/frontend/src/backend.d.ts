import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppConfig {
    vipMonthlyPrice: number;
    maintenanceMode: boolean;
    vipYearlyPrice: number;
    coinRewardPerAd: bigint;
    dailyBonusCoins: bigint;
}
export interface User {
    id: bigint;
    favorites: Array<string>;
    displayName: string;
    isBlocked: boolean;
    createdAt: bigint;
    coins: bigint;
    watchHistory: Array<string>;
    isVIP: boolean;
    phone: string;
    following: Array<string>;
    vipExpiry?: bigint;
    dailyRewardClaimed: boolean;
    avatar: string;
}
export interface AnalyticsDay {
    activeUsers: bigint;
    revenue: number;
    totalViews: bigint;
    date: string;
    totalUsers: bigint;
    newUsers: bigint;
    coinsDistributed: bigint;
}
export interface Creator {
    id: string;
    bio: string;
    verified: boolean;
    name: string;
    totalVideos: bigint;
    followers: bigint;
    avatar: string;
}
export interface Subscription {
    id: string;
    status: SubscriptionStatus;
    endDate: bigint;
    userId: bigint;
    plan: SubscriptionPlan;
    price: number;
    startDate: bigint;
}
export interface Episode {
    id: string;
    title: string;
    duration: bigint;
    thumbnail: string;
    partNumber: bigint;
    order: bigint;
    views: bigint;
    isPremium: boolean;
    coinsRequired: bigint;
    createdAt: bigint;
    videoUrl: string;
    dramaId: string;
}
export interface CoinTransaction {
    id: string;
    transactionType: TransactionType;
    userId: bigint;
    createdAt: bigint;
    description: string;
    amount: bigint;
}
export interface Notification {
    id: string;
    title: string;
    body: string;
    sentAt: bigint;
    sentBy: string;
    targetAudience: TargetAudience;
    imageUrl: string;
}
export interface Category {
    id: string;
    active: boolean;
    order: bigint;
    icon: string;
    name: string;
    color: string;
}
export interface Drama {
    id: string;
    categoryId: string;
    status: Status;
    title: string;
    shares: bigint;
    thumbnail: string;
    views: bigint;
    isPremium: boolean;
    coinsRequired: bigint;
    createdAt: bigint;
    tags: Array<string>;
    creatorId: string;
    description: string;
    likes: bigint;
    updatedAt: bigint;
    totalParts: bigint;
}
export enum Status {
    active = "active",
    draft = "draft",
    archived = "archived"
}
export enum SubscriptionPlan {
    monthly = "monthly",
    yearly = "yearly"
}
export enum SubscriptionStatus {
    active = "active",
    cancelled = "cancelled",
    expired = "expired"
}
export enum TargetAudience {
    all = "all",
    vip = "vip",
    free = "free"
}
export enum TransactionType {
    adReward = "adReward",
    vipPurchase = "vipPurchase",
    episodeUnlock = "episodeUnlock",
    dailyBonus = "dailyBonus",
    purchase = "purchase"
}
export interface backendInterface {
    adjustUserCoins(uid: bigint, amount: bigint, _reason: string): Promise<boolean>;
    blockUser(uid: bigint): Promise<boolean>;
    createCategory(id: string, name: string, icon: string, color: string, order: bigint): Promise<Category>;
    createCreator(id: string, name: string, avatar: string, bio: string): Promise<Creator>;
    createDrama(id: string, title: string, desc: string, thumbnail: string, categoryId: string, creatorId: string, tags: Array<string>, isPremium: boolean, coinsRequired: bigint): Promise<Drama>;
    createEpisode(dramaId: string, id: string, partNumber: bigint, title: string, videoUrl: string, thumbnail: string, duration: bigint, isPremium: boolean, coinsRequired: bigint): Promise<Episode>;
    deleteCategory(id: string): Promise<boolean>;
    deleteDrama(id: string): Promise<boolean>;
    deleteEpisode(id: string): Promise<boolean>;
    getAppConfig(): Promise<AppConfig>;
    getCategories(): Promise<Array<Category>>;
    getCoinTransactions(_limit: bigint): Promise<Array<CoinTransaction>>;
    getCreators(): Promise<Array<Creator>>;
    getDailyAnalytics(_days: bigint): Promise<Array<AnalyticsDay>>;
    getDrama(id: string): Promise<Drama | null>;
    getDramas(): Promise<Array<Drama>>;
    getEpisodesByDrama(dramaId: string): Promise<Array<Episode>>;
    getNotifications(): Promise<Array<Notification>>;
    getSubscriptions(): Promise<Array<Subscription>>;
    getSummaryStats(): Promise<{
        revenue: number;
        totalViews: bigint;
        activeToday: bigint;
        totalUsers: bigint;
    }>;
    getUser(uid: bigint): Promise<User | null>;
    getUserTransactions(uid: bigint): Promise<Array<CoinTransaction>>;
    getUsers(): Promise<Array<User>>;
    preupgrade(): Promise<void>;
    reorderEpisode(id: string, newOrder: bigint): Promise<boolean>;
    sendNotification(_title: string, _body: string, _imageUrl: string, _targetAudience: TargetAudience, _sentBy: string): Promise<Notification>;
    setDramaStatus(id: string, status: Status): Promise<boolean>;
    toggleCategoryActive(id: string): Promise<boolean>;
    unblockUser(uid: bigint): Promise<boolean>;
    updateAppConfig(fields: AppConfig): Promise<AppConfig>;
    updateCategory(id: string, fields: Category): Promise<Category | null>;
    updateCreator(id: string, fields: Creator): Promise<Creator | null>;
    updateDrama(id: string, fields: Drama): Promise<Drama | null>;
    updateEpisode(id: string, fields: Episode): Promise<Episode | null>;
    updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<boolean>;
}
