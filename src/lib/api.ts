import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";
import { getSecureCookie, setSecureCookie, deleteSecureCookie } from "./cookies";
function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // En el navegador, usar la misma ruta relativa del reverse proxy Caddy
    return "";
  }
  // En SSR dentro de Docker, comunicar directamente con el servicio livora_api
  return process.env.INTERNAL_API_URL || "http://livora_api:3000";
}

const API_URL = resolveBaseUrl();

/**
 * Generador de UUID v4 seguro para navegador y entornos serverless.
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtiene o inicializa el Correlation ID persistente para la sesión de navegación.
 */
function getCorrelationId(): string {
  if (typeof window !== "undefined") {
    try {
      let correlationId = sessionStorage.getItem("livora_correlation_id");
      if (!correlationId) {
        correlationId = generateUuid();
        sessionStorage.setItem("livora_correlation_id", correlationId);
      }
      return correlationId;
    } catch {
      return generateUuid();
    }
  }
  return generateUuid();
}

/**
 * Instancia central de Axios para toda la aplicación Livora.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Interceptor de Peticiones:
 * 1. Inyecta Bearer JWT desde cookies seguras o fallback localStorage.
 * 2. Inyecta X-Correlation-ID en el 100% de las solicitudes.
 * 3. Inyecta Idempotency-Key en mutaciones financieras y de estado críticas.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inyección de Correlation ID
    config.headers.set("X-Correlation-ID", getCorrelationId());

    // 2. Inyección de Bearer JWT
    if (typeof window !== "undefined") {
      const token =
        getSecureCookie("livora_token") || localStorage.getItem("livora_token");
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // 3. Inyección de Idempotency-Key en mutaciones críticas
    const url = config.url || "";
    const method = (config.method || "get").toUpperCase();
    const isCriticalMutation =
      method === "POST" &&
      (url.includes("/stores/redemptions/confirm") ||
        url.includes("/receive") ||
        url.includes("/b2b-transfers") ||
        url.includes("/stores/settlements") ||
        url.includes("/collection-requests") ||
        url.includes("/complaints"));

    if (isCriticalMutation && !config.headers.get("Idempotency-Key")) {
      config.headers.set("Idempotency-Key", generateUuid());
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Estado de control para refresco silencioso de token (Silent Refresh) con cola de espera.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Interceptor de Respuestas:
 * Captura errores 401 Unauthorized para renovar la sesión silenciosamente vía /auth/refresh.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si no hay configuración o el error no es 401, rechazar
    if (!originalRequest || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Evitar loop infinito si falla la propia ruta de auth
    const requestUrl = originalRequest.url || "";
    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/verify-email")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresco en vuelo, encolar la petición
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken =
      getSecureCookie("livora_refresh_token") ||
      (typeof window !== "undefined"
        ? localStorage.getItem("livora_refresh_token")
        : null);

    if (!storedRefreshToken) {
      isRefreshing = false;
      deleteSecureCookie("livora_token");
      deleteSecureCookie("livora_refresh_token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("livora_token");
        localStorage.removeItem("livora_refresh_token");
        localStorage.removeItem("livora_role");
        localStorage.removeItem("livora_user");
        if (
          window.location.pathname !== "/" &&
          !window.location.pathname.startsWith("/verificar")
        ) {
          window.location.href = "/";
        }
      }
      return Promise.reject(error);
    }

    try {
      // Llamada directa sin interceptor recursivo
      const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: storedRefreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, user } =
        refreshRes.data;

      setSecureCookie("livora_token", accessToken, 7);
      if (newRefreshToken) {
        setSecureCookie("livora_refresh_token", newRefreshToken, 30);
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("livora_token");
        localStorage.removeItem("livora_refresh_token");
        if (user) {
          localStorage.setItem("livora_user", JSON.stringify(user));
        }
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      processQueue(null, accessToken);

      originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("livora_token");
        localStorage.removeItem("livora_refresh_token");
        localStorage.removeItem("livora_role");
        localStorage.removeItem("livora_user");
        if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/verificar")) {
          window.location.href = "/";
        }
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES DE API CENTRALIZADAS
// ─────────────────────────────────────────────────────────────

export async function fetchBalance(): Promise<{ balance: string | number }> {
  const res = await api.get("/wallets/me/balance");
  return res.data;
}

export async function createCollectionRequest(
  data: FormData | {
    latitude: number;
    longitude: number;
    itemsEstimated: Record<string, number>;
    description?: string;
    photoUrl?: string;
  }
) {
  const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined;
  const res = await api.post("/collection-requests", data, { headers });
  return res.data;
}

export async function fetchCollectionRequests(query?: {
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (query?.lat !== undefined) params.append("lat", String(query.lat));
  if (query?.lng !== undefined) params.append("lng", String(query.lng));
  if (query?.radius !== undefined) params.append("radius", String(query.radius));
  if (query?.page !== undefined) params.append("page", String(query.page));
  if (query?.limit !== undefined) params.append("limit", String(query.limit));

  const res = await api.get(`/collection-requests?${params.toString()}`);
  return res.data?.data ?? res.data;
}

export async function updateCollectionStatus(id: string, status: "ACCEPTED" | "COMPLETED" | "CANCELLED") {
  const res = await api.patch(`/collection-requests/${id}`, { status });
  return res.data;
}

export async function overrideBatchDiscrepancy(batchId: string, discrepancyNote: string) {
  const res = await api.post(`/batches/${batchId}/override-discrepancy`, { discrepancyNote });
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
  return res.data?.data ?? res.data;
}

export async function fetchBatchesPaginated(params?: any) {
  const res = await api.get("/batches", { params });
  return {
    data: (res.data?.data ?? (Array.isArray(res.data) ? res.data : [])) as any[],
    meta: res.data?.meta ?? {
      total: Array.isArray(res.data) ? res.data.length : 0,
      page: Number(params?.page) || 1,
      limit: Number(params?.limit) || 15,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

export async function fetchBatchById(id: string) {
  const res = await api.get(`/batches/${id}`);
  return res.data;
}

export async function updateBatchCenterAndTransit(batchId: string, destinationCenterId: string) {
  const res = await api.patch(`/batches/${batchId}`, {
    destinationCenterId,
    status: "IN_TRANSIT",
  });
  return res.data;
}

export async function receiveBatch(
  batchId: string,
  materialsActual: Record<string, number>,
  usefulWeightKg?: number,
  wasteWeightKg?: number,
) {
  const res = await api.post(`/batches/${batchId}/receive`, {
    materialsActual,
    usefulWeightKg,
    wasteWeightKg,
  });
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

export async function confirmRedemption(
  qrCodeRef: string,
  options?:
    | {
        termsAccepted?: boolean;
        donationOptIn?: boolean;
        insuranceOptIn?: boolean;
        householdUserId?: string;
      }
    | string
) {
  let body: any = {};
  if (typeof options === "string") {
    body = { householdUserId: options, termsAccepted: true };
  } else if (options) {
    body = {
      termsAccepted: options.termsAccepted,
      donationOptIn: options.donationOptIn,
      insuranceOptIn: options.insuranceOptIn,
      householdUserId: options.householdUserId,
    };
  }
  const res = await api.post(`/stores/redemptions/confirm/${qrCodeRef}`, body);
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
  return res.data?.data ?? res.data;
}

export async function fetchProcessingBatches() {
  const res = await api.get("/batches?status=PROCESSING");
  return res.data?.data ?? res.data;
}

export async function fetchReceivedBatches() {
  const res = await api.get("/batches?status=RECEIVED");
  return res.data?.data ?? res.data;
}

export async function fetchFlaggedBatches() {
  const res = await api.get("/batches?status=FLAGGED_FOR_REVIEW");
  return res.data?.data ?? res.data;
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

export async function fetchCenterPools() {
  const res = await api.get("/b2b-transfers/pools");
  return res.data;
}

export async function createB2bPurchaseRequest(data: {
  centerId: string;
  materials: { material: string; weightKg: number }[];
  notes?: string;
}) {
  const res = await api.post("/b2b-transfers/request", data);
  return res.data;
}

export async function acceptB2bTransfer(
  id: string,
  data: {
    actualMaterials: { material: string; weightKg: number }[];
    notes?: string;
  }
) {
  const res = await api.patch(`/b2b-transfers/${id}/accept`, data);
  return res.data;
}

export async function fetchB2bTransfers(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get("/b2b-transfers", { params });
  return res.data;
}

export async function createB2bTransfer(data: { materials: { material: string; weightKg: number }[]; buyerId: string; notes?: string }) {
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

export async function fetchInventory() {
  const res = await api.get("/inventory");
  return res.data;
}

export async function fetchStoreRedemptions(params?: { page?: number; limit?: number }) {
  const res = await api.get("/stores/redemptions", { params });
  return res.data?.data ?? res.data;
}

export async function fetchStoreSettlements(params?: { page?: number; limit?: number }) {
  const res = await api.get("/stores/settlements/history", { params });
  return res.data?.data ?? res.data;
}

export async function fetchRedemptionDetails(qrCodeRef: string) {
  const res = await api.get(`/stores/redemptions/${qrCodeRef}`);
  return res.data;
}

export async function generateStoreQr(dto: { fiatAmount: number; description?: string }) {
  const res = await api.post("/stores/redemptions/qr", dto);
  return res.data;
}

export async function refundStoreRedemption(id: string) {
  const res = await api.post(`/stores/redemptions/${id}/refund`);
  return res.data;
}

export async function requestStoreSettlement(dto: { tokenAmount: number; bankAccount: string }) {
  const res = await api.post("/stores/settlements", dto);
  return res.data;
}

export async function fetchStoreProfile() {
  const res = await api.get("/stores/profile");
  return res.data;
}

export async function updateStoreProfile(dto: {
  businessName: string;
  ruc: string;
  address: string;
  bankAccount: string;
  logoUrl?: string;
}) {
  const res = await api.patch("/stores/profile", dto);
  return res.data;
}

export async function fetchAdminSettlements(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const res = await api.get("/stores/settlements/admin", { params });
  return res.data;
}

export async function payStoreSettlement(id: string, dto: { receiptUrl: string }) {
  const res = await api.patch(`/stores/settlements/${id}/pay`, dto);
  return res.data;
}

export async function updateStoreSettlementStatus(
  id: string,
  dto: { status: string; receiptUrl?: string }
) {
  const res = await api.patch(`/stores/settlements/${id}/status`, dto);
  return res.data;
}

export async function fetchWalletTransactions(params?: { page?: number; limit?: number }) {
  const res = await api.get("/wallets/transactions/history", { params });
  return res.data?.data ?? res.data;
}

export async function fetchDashboardMetrics() {
  const res = await api.get("/users/me/dashboard");
  return res.data;
}

export async function updateProfile(data: {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  marketingAccepted?: boolean;
}) {
  const res = await api.patch("/users/me", data);
  return res.data;
}

export async function changePassword(data: { newPassword: string }) {
  const res = await api.patch("/users/me/password", data);
  return res.data;
}

export async function fetchKycApplications() {
  const res = await api.get("/admin/kyc-applications");
  return res.data;
}

export async function updateKycStatus(
  userId: string,
  status: "APPROVED" | "REJECTED" | "OBSERVED",
  observationNotes?: string,
) {
  const res = await api.patch(`/users/${userId}/kyc-status`, { status, observationNotes });
  return res.data;
}

export async function fetchAdminUsers(params?: {
  role?: string;
  userStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const res = await api.get("/admin/users", { params });
  return res.data;
}

export async function updateAdminUserStatus(
  userId: string,
  data: { userStatus?: string; isActive?: boolean }
) {
  const res = await api.patch(`/users/${userId}/status`, data);
  return res.data;
}

export async function fetchBlockchainHealth() {
  const res = await api.get("/admin/blockchain/health");
  return res.data;
}

// --- Technical Audit & Zero-Loss Reconciliation ---

export async function fetchFinancialReconciliation() {
  const res = await api.get("/admin/audit/reconciliation");
  return res.data;
}

export async function fetchLedgerAudit(params?: {
  page?: number;
  limit?: number;
  correlationId?: string;
  txHash?: string;
  search?: string;
}) {
  const res = await api.get("/admin/audit/ledger", { params });
  return res.data;
}

export async function fetchQueueAudit() {
  const res = await api.get("/admin/audit/queues");
  return res.data;
}

export async function retryQueueJob(jobId: string) {
  const res = await api.post(`/admin/audit/queues/retry-job/${jobId}`);
  return res.data;
}

export async function retryOutboxEvent(eventId: string) {
  const res = await api.post(`/admin/audit/outbox/retry-event/${eventId}`);
  return res.data;
}

export async function fetchServerLogs(params?: {
  level?: string;
  correlationId?: string;
  search?: string;
  limit?: number;
  skip?: number;
}) {
  const res = await api.get("/admin/audit/logs", { params });
  return res.data;
}

export async function retryPaymentMint(paymentId: string) {
  const res = await api.post(`/admin/payments/${paymentId}/retry-mint`);
  return res.data;
}

// --- Dynamic Prices & Auctions ---

export async function fetchCenterPrices(centerId: string) {
  const res = await api.get(`/centers/${centerId}/prices`);
  return res.data;
}

export async function updateCenterPrices(prices: { materialType: string; pricePerKg: number }[]) {
  const res = await api.post("/centers/me/prices", { prices });
  return res.data;
}

export async function fetchAllCenterPrices() {
  const res = await api.get("/centers/prices/all");
  return res.data;
}

export async function submitAcopioBid(requestId: string, proposedRates?: Record<string, number>) {
  const res = await api.post(`/collection-requests/${requestId}/bids`, { proposedRates });
  return res.data;
}

export async function withdrawAcopioBid(requestId: string, bidId?: string) {
  const url = bidId
    ? `/collection-requests/${requestId}/bids/${bidId}`
    : `/collection-requests/${requestId}/bids`;
  const res = await api.delete(url);
  return res.data;
}

export async function selectAcopioBid(requestId: string, bidId: string) {
  const res = await api.post(`/collection-requests/${requestId}/select-bid`, { bidId });
  return res.data;
}

export async function claimAutomaticCollection(requestId: string) {
  const res = await api.post(`/collection-requests/${requestId}/claim-automatic`);
  return res.data;
}

// --- Dispute, Fiat Settlement, Refund & Ratings ---

export async function refundRedemption(redemptionId: string) {
  const res = await api.post(`/stores/redemptions/${redemptionId}/refund`);
  return res.data;
}

export async function settleBatchFiat(batchId: string) {
  const res = await api.post(`/batches/${batchId}/fiat-settlement`);
  return res.data;
}

export async function disputeBatch(batchId: string, reason: string) {
  const res = await api.post(`/batches/${batchId}/dispute`, { reason });
  return res.data;
}

export async function resolveBatchDispute(
  batchId: string,
  dto: { resolution: "ACCEPT_REVISION" | "REJECT_DISPUTE"; adjustedWeights?: Record<string, number>; notes?: string }
) {
  const res = await api.post(`/batches/${batchId}/resolve-dispute`, dto);
  return res.data;
}

export async function rateCollection(requestId: string, dto: { rating: number; feedback?: string }) {
  const res = await api.post(`/collection-requests/${requestId}/rate`, dto);
  return res.data;
}

// --- Admin Complaints Management (Ley 29571 / Indecopi) ---

export async function fetchAdminComplaints(params?: {
  page?: number;
  limit?: number;
  status?: string;
  claimType?: string;
  search?: string;
}) {
  const res = await api.get("/complaints", { params });
  return res.data;
}

export async function updateAdminComplaintStatus(
  id: string,
  dto: { status: string; legalResponseNote?: string }
) {
  const res = await api.patch(`/complaints/${id}/status`, dto);
  return res.data;
}

export async function fetchAdminComplaintByCorrelative(correlativeNumber: string) {
  const res = await api.get(`/complaints/correlative/${correlativeNumber}`);
  return res.data;
}
