/**
 * Traduce valores de enums del backend (roles, estados) a texto legible en español.
 * Si el valor no está mapeado, se hace un fallback razonable (guiones bajos -> espacios).
 */

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  EMPRESA_B2B: "Empresa B2B",
  CENTRO_ACOPIO: "Centro de Acopio",
  HOGAR: "Hogar",
  RECOLECTOR: "Recolector",
  TIENDA: "Tienda",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activo",
  IN_TRANSIT: "En Tránsito",
  PROCESSING: "Procesando",
  RECEIVED: "Recibido",
  CONSOLIDATED: "Consolidado",
  FLAGGED_FOR_REVIEW: "En Revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  REVOKED: "Revocado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

function humanizeFallback(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatRole(role?: string | null): string {
  if (!role) return "";
  return ROLE_LABELS[role] || humanizeFallback(role);
}

export function formatStatus(status?: string | null): string {
  if (!status) return "";
  return STATUS_LABELS[status] || humanizeFallback(status);
}
