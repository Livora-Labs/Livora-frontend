export type Role = "ADMIN" | "EMPRESA_B2B";
export type BatchStatus =
  "OPEN" | "IN_TRANSIT" | "PROCESSING" | "RECEIVED" | "CONSOLIDATED";
export type CertificateStatus = "ACTIVE" | "REVOKED";

export interface User {
  id: string;
  email: string;
  role:
    | "HOGAR"
    | "RECOLECTOR"
    | "CENTRO_ACOPIO"
    | "EMPRESA_B2B"
    | "ALMACEN"
    | "ADMIN";
  walletAddress?: string;
}
export interface CollectionRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  itemsEstimated: Record<string, number>;
  photoUrl?: string;
  description?: string;
  latitude: number;
  longitude: number;
  householdId: string;
  createdAt: string;
}
export interface Batch {
  id: string;
  status: BatchStatus;
  collectorId: string;
  destinationCenterId?: string;
  materialsActual?: Record<string, number>;
  consolidatedBatchId?: string;
  createdAt: string;
  updatedAt: string;
  collector: Pick<User, "id" | "email">;
  destinationCenter?: Pick<User, "id" | "email">;
  requests: CollectionRequest[];
  trace?: {
    ipfsCid: string;
    txHash: string;
    jobId: string;
    processedAt: string;
  };
}
export interface ConsolidatedBatch {
  id: string;
  centerId: string;
  totalWeight: number;
  status: "PENDING_SALE" | "SOLD";
  createdAt: string;
  batchIds: string[];
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
