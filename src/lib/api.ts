import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor para inyectar token JWT automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("livora_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Direct API Helper functions
export async function fetchBalance(): Promise<{ balance: string | number }> {
  const res = await api.get("/wallets/me/balance");
  return res.data;
}

export async function createCollectionRequest(data: FormData | {
  latitude: number;
  longitude: number;
  itemsEstimated: Record<string, number>;
  description?: string;
  photoUrl?: string;
}) {
  const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined;
  const res = await api.post("/collection-requests", data, { headers });
  return res.data;
}

export async function fetchCollectionRequests(query?: { lat?: number; lng?: number; radius?: number }) {
  const params = new URLSearchParams();
  if (query?.lat !== undefined) params.append("lat", String(query.lat));
  if (query?.lng !== undefined) params.append("lng", String(query.lng));
  if (query?.radius !== undefined) params.append("radius", String(query.radius));

  const res = await api.get(`/collection-requests?${params.toString()}`);
  return res.data;
}

export async function updateCollectionStatus(id: string, status: "ACCEPTED" | "COLLECTED" | "CANCELLED") {
  const res = await api.patch(`/collection-requests/${id}`, { status });
  return res.data;
}

export async function verifyCollectionPin(id: string, pin: string) {
  try {
    const res = await api.post(`/collection-requests/${id}/verify`, { pin });
    return { success: true, data: res.data };
  } catch (err: any) {
    const message = Array.isArray(err.response?.data?.message)
      ? err.response.data.message.join(", ")
      : err.response?.data?.message || "PIN de verificación incorrecto";
    return { success: false, message };
  }
}

export async function fetchOpenBatch() {
  const res = await api.get("/batches/open");
  return res.data;
}

export async function fetchBatches(params?: any) {
  const res = await api.get("/batches", { params });
  return res.data;
}

export async function updateBatchCenterAndTransit(batchId: string, destinationCenterId: string) {
  const res = await api.patch(`/batches/${batchId}`, {
    destinationCenterId,
    status: "IN_TRANSIT",
  });
  return res.data;
}

export async function receiveBatch(batchId: string, materialsActual: Record<string, number>) {
  const res = await api.post(`/batches/${batchId}/receive`, { materialsActual });
  return res.data;
}

export async function getStoreProfile() {
  const res = await api.get("/stores/profile");
  return res.data;
}

export async function createStoreProfile(dto: { businessName: string; ruc: string; address: string; bankAccount: string }) {
  const res = await api.post("/stores/profile", dto);
  return res.data;
}

export async function generateQrRedemption(tokenAmount: number) {
  const res = await api.post("/stores/redemptions/qr", { tokenAmount });
  return res.data;
}

export async function confirmRedemption(qrCodeRef: string, householdUserId?: string) {
  const res = await api.post(`/stores/redemptions/confirm/${qrCodeRef}`, { householdUserId });
  return res.data;
}

export async function requestSettlement(tokenAmount: number) {
  const res = await api.post("/stores/settlements", { tokenAmount });
  return res.data;
}

export async function fetchReceptionPin() {
  const res = await api.get("/centers/me/reception-pin");
  return res.data;
}

export async function refreshReceptionPin() {
  const res = await api.post("/centers/me/reception-pin/refresh");
  return res.data;
}

export async function fetchCenters() {
  const res = await api.get("/centers");
  return res.data;
}

export async function fetchIncomingBatches() {
  const res = await api.get("/batches?status=IN_TRANSIT");
  return res.data;
}

export async function fetchProcessingBatches() {
  const res = await api.get("/batches?status=PROCESSING");
  return res.data;
}

export async function fetchCertificates() {
  const res = await api.get("/certificates");
  return res.data;
}

export async function fetchCertificateById(id: string) {
  const res = await api.get(`/certificates/${id}`);
  return res.data;
}

export async function fetchSales() {
  const res = await api.get("/sales");
  return res.data;
}

export async function fetchB2bCompanies() {
  const res = await api.get("/b2b-transfers/companies");
  return res.data;
}

export async function createB2bTransfer(data: { materials: { material: string; weightKg: number }[]; buyerId: string }) {
  const res = await api.post("/b2b-transfers", data);
  return res.data;
}

export async function fetchIncomingB2bTransfers() {
  const res = await api.get("/b2b-transfers/incoming");
  return res.data;
}

export async function receiveB2bTransfer(id: string) {
  const res = await api.patch(`/b2b-transfers/${id}/receive`);
  return res.data;
}

export async function fetchReceivedBatches() {
  const res = await api.get("/batches?status=RECEIVED");
  return res.data;
}

export async function fetchInventory() {
  const res = await api.get("/inventory");
  return res.data;
}

export async function fetchStoreRedemptions() {
  const res = await api.get("/stores/redemptions");
  return res.data;
}

export async function fetchStoreSettlements() {
  const res = await api.get("/stores/settlements/history");
  return res.data;
}

export async function fetchRedemptionDetails(qrCodeRef: string) {
  const res = await api.get(`/stores/redemptions/${qrCodeRef}`);
  return res.data;
}

export async function fetchWalletTransactions() {
  const res = await api.get("/wallets/transactions/history");
  return res.data;
}






