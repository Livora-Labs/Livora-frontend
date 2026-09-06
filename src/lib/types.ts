export type Role = "HOGAR" | "RECOLECTOR" | "CENTRO_ACOPIO" | "TIENDA" | "EMPRESA_B2B" | "ADMIN";
export type BatchStatus = "OPEN" | "IN_TRANSIT" | "PROCESSING" | "RECEIVED" | "CONSOLIDATED" | "FLAGGED_FOR_REVIEW" | "DISPUTED";
export type CertificateStatus = "ACTIVE" | "REVOKED";
export type AssignmentMode = "AUTOMATIC" | "AUCTION";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AcopioPriceList {
  id: string;
  centerId: string;
  materialType: string;
  pricePerKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcopioBid {
  id: string;
  requestId: string;
  centerId: string;
  proposedRates: Record<string, number>;
  totalEstimatedPenn: number;
  totalEstimatedEco: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  center?: { id: string; name?: string; email: string; address?: string };
}

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  address?: string;
  walletAddress?: string;
  receptionPin?: string;
  reputationScore?: number;
  totalRatings?: number;
  requiresQaReview?: boolean;
}

export interface CollectionRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  assignmentMode?: AssignmentMode;
  itemsEstimated: Record<string, number>;
  actualWeights?: Record<string, number>;
  photoUrl?: string;
  description?: string;
  verificationPin?: string;
  latitude: number;
  longitude: number;
  householdId: string;
  collectorId?: string;
  assignedCenterId?: string;
  agreedRates?: Record<string, number>;
  escrowLocked?: number;
  rating?: number;
  feedback?: string;
  createdAt: string;
  household?: { id: string; email: string; name?: string };
  assignedCenter?: { id: string; email: string; name?: string; address?: string };
  collector?: { id: string; email: string; name?: string };
  bids?: AcopioBid[];
}

export interface Batch {
  id: string;
  status: BatchStatus;
  collectorId: string;
  destinationCenterId?: string;
  materialsActual?: Record<string, number>;
  consolidatedBatchId?: string;
  ipfsCid?: string;
  txHash?: string;
  hasDiscrepancy?: boolean;
  discrepancyNote?: string;
  totalWeightKg?: number;
  receptionWeightKg?: number;
  weightDiscrepancyKg?: number;
  fiatSettled?: boolean;
  fiatSettledAt?: string;
  disputeReason?: string;
  disputedAt?: string;
  createdAt: string;
  updatedAt: string;
  collector: Pick<User, "id" | "email">;
  destinationCenter?: Pick<User, "id" | "email">;
  requests: CollectionRequest[];
  /** Legacy local-only field kept for backward compat with WebSocket patching */
  trace?: { ipfsCid: string; txHash: string; jobId: string; processedAt: string };
}

export interface ConsolidatedBatch {
  id: string;
  centerId: string;
  totalWeight: number;
  status: "PENDING_SALE" | "SOLD";
  createdAt: string;
  batchIds: string[];
}

export interface StoreProfile {
  id: string;
  userId: string;
  businessName: string;
  ruc: string;
  address: string;
  bankAccount: string;
  balanceEcoTokens?: number;
  createdAt: string;
}

export interface QrRedemption {
  qrCodeRef: string;
  amountEcoTokens: number;
  storeId: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED" | "REFUNDED";
  expiresAt: string;
}

export interface SettlementRequest {
  id: string;
  storeId: string;
  tokenAmount: number;
  fiatAmount: number;
  status: "PENDING" | "PAID" | "REJECTED";
  bankAccount: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  weightKg: number;
  totalAmount: number;
  buyerId: string;
  centerId: string;
  createdAt: string;
  consolidatedBatchId: string;
  materialType: string;
  center: Pick<User, "id" | "email">;
}

export interface Certificate {
  id: string;
  status: CertificateStatus;
  ipfsHash: string;
  esgImpact: {
    co2SavedKg: number;
    waterSavedLiters: number;
    recycledMaterial: string;
    recycledKg: number;
  };
  buyerId: string;
  createdAt: string;
  saleId: string;
  txHash: string;
}

export interface InventoryItem {
  id: string;
  materialType: string;
  quantityKg: number;
  centerId: string;
  updatedAt: string;
  center: Pick<User, "id" | "email">;
}

export interface KycApplication {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl?: string;
  userId: string;
  createdAt: string;
  user: Pick<User, "id" | "email" | "role">;
}
