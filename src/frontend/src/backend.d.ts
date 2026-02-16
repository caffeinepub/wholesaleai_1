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
export interface AnalyticsData {
    closeRate: number;
    averageAssignmentFee: number;
    dealConversionPercent: number;
    monthlyRevenue: bigint;
    leadToContractPercent: number;
    profitByZipCode: Array<[string, bigint]>;
}
export interface MembershipPricing {
    annualPriceCents: bigint;
    monthlyPriceCents: bigint;
    salePriceCents?: bigint;
    isOnSale: boolean;
}
export interface MembershipCatalog {
    pro: MembershipPricing;
    enterprise: MembershipPricing;
    lastUpdated: bigint;
    basic: MembershipPricing;
}
export interface Buyer {
    id: bigint;
    owner: Principal;
    name: string;
    createdAt: bigint;
    email: string;
    notes: string;
    propertyTypePreference: string;
    phone: string;
    budgetMax: bigint;
    budgetMin: bigint;
    preferredAreas: Array<string>;
}
export interface DealAnalysis {
    suggestedOfferPrice: bigint;
    estimatedARV: bigint;
    estimatedMAO: bigint;
    lastSoldPrice?: bigint;
    estimatedAssignmentFee: bigint;
    dealRating: Variant_A_B_C_Risky;
    address: string;
    comparableSales: Array<ComparableSale>;
    estimatedRehabCost: bigint;
}
export interface ComparableSale {
    distance: number;
    soldPrice: bigint;
    address: string;
    soldDate: bigint;
}
export interface Deal {
    id: bigint;
    arv: bigint;
    contractDeadline?: bigint;
    sellerPhone: string;
    owner: Principal;
    askingPrice: bigint;
    createdAt: bigint;
    actualProfit?: bigint;
    sellerName: string;
    updatedAt: bigint;
    stage: DealStage;
    address: string;
    notes: string;
    repairs: bigint;
    yourOffer: bigint;
    estimatedProfit: bigint;
    assignedBuyer?: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    membershipTier: MembershipTier;
}
export interface ContractDocument {
    id: bigint;
    emd?: bigint;
    documentType: Variant_PurchaseContract_AssignmentContract;
    owner: Principal;
    blob: ExternalBlob;
    fileName: string;
    dealId: bigint;
    closingDate?: bigint;
    signingStatus: Variant_Unsigned_Signed;
    uploadedAt: bigint;
}
export enum DealStage {
    Closed = "Closed",
    ContactedSeller = "ContactedSeller",
    UnderContract = "UnderContract",
    NewLead = "NewLead",
    Negotiating = "Negotiating",
    Assigned = "Assigned"
}
export enum MembershipTier {
    Pro = "Pro",
    Enterprise = "Enterprise",
    Basic = "Basic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_A_B_C_Risky {
    A = "A",
    B = "B",
    C = "C",
    Risky = "Risky"
}
export enum Variant_PurchaseContract_AssignmentContract {
    PurchaseContract = "PurchaseContract",
    AssignmentContract = "AssignmentContract"
}
export enum Variant_Unsigned_Signed {
    Unsigned = "Unsigned",
    Signed = "Signed"
}
export interface backendInterface {
    analyzeDeal(address: string): Promise<DealAnalysis>;
    assignBuyerToDeal(dealId: bigint, buyerId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBuyer(name: string, phone: string, email: string, preferredAreas: Array<string>, budgetMin: bigint, budgetMax: bigint, propertyTypePreference: string, notes: string): Promise<bigint>;
    createDeal(sellerName: string, sellerPhone: string, address: string, arv: bigint, repairs: bigint, askingPrice: bigint, yourOffer: bigint, notes: string, estimatedProfit: bigint): Promise<bigint>;
    createDealFromAnalysis(analysis: DealAnalysis, sellerName: string, sellerPhone: string): Promise<bigint>;
    deleteBuyer(buyerId: bigint): Promise<void>;
    deleteDeal(dealId: bigint): Promise<void>;
    getAnalytics(): Promise<AnalyticsData>;
    getBuyer(buyerId: bigint): Promise<Buyer | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContract(contractId: bigint): Promise<ContractDocument | null>;
    getDeal(dealId: bigint): Promise<Deal | null>;
    getMembershipCatalog(): Promise<MembershipCatalog>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listBuyers(): Promise<Array<Buyer>>;
    listContractsByDeal(dealId: bigint): Promise<Array<ContractDocument>>;
    listDeals(): Promise<Array<Deal>>;
    moveDealToStage(dealId: bigint, newStage: DealStage): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBuyer(buyerId: bigint, name: string, phone: string, email: string, preferredAreas: Array<string>, budgetMin: bigint, budgetMax: bigint, propertyTypePreference: string, notes: string): Promise<void>;
    updateContractStatus(contractId: bigint, signingStatus: Variant_Unsigned_Signed, closingDate: bigint | null, emd: bigint | null): Promise<void>;
    updateDeal(dealId: bigint, stage: DealStage, sellerName: string, sellerPhone: string, address: string, arv: bigint, repairs: bigint, askingPrice: bigint, yourOffer: bigint, assignedBuyer: bigint | null, contractDeadline: bigint | null, notes: string, estimatedProfit: bigint, actualProfit: bigint | null): Promise<void>;
    updateMembershipPricing(basic: MembershipPricing, pro: MembershipPricing, enterprise: MembershipPricing): Promise<void>;
    updateMembershipTier(userId: Principal, tier: MembershipTier): Promise<void>;
    uploadContract(dealId: bigint, documentType: Variant_PurchaseContract_AssignmentContract, fileName: string, closingDate: bigint | null, emd: bigint | null, blob: ExternalBlob): Promise<bigint>;
}
