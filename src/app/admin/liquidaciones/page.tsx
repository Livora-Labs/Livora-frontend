"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import {
  fetchAdminSettlements,
  payStoreSettlement,
  updateStoreSettlementStatus,
} from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  Send,
  FileCheck,
  Eye,
} from "lucide-react";

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

const formatDate = (val: string) => {
  if (!val) return "N/D";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(val));
};

export default function AdminLiquidacionesPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Modal State
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<string>("APPROVED_PENDING_PAYMENT");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    loadSettlements();
  }, [page, statusFilter]);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminSettlements({
        page,
        limit,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      if (res && res.data) {
        setSettlements(res.data);
        setTotalCount(res.total || 0);
      } else if (Array.isArray(res)) {
        setSettlements(res);
        setTotalCount(res.length);
      } else {
        setSettlements([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      showToast("Error al cargar liquidaciones", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (settlement: any) => {
    setSelectedSettlement(settlement);
    setReceiptUrl(settlement.receiptUrl || "");
    if (settlement.status === "PENDING") {
      setTargetStatus("APPROVED_PENDING_PAYMENT");
    } else if (settlement.status === "APPROVED_PENDING_PAYMENT") {
      setTargetStatus("PAID");
    } else {
      setTargetStatus(settlement.status);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedSettlement) return;

    if (targetStatus === "PAID") {
      if (!receiptUrl.trim()) {
        showToast(
          "Comprobante Requerido",
          "error",
          "Ingresa el enlace o número de operación bancaria del pago realizado."
        );
        return;
      }

      setIsProcessing(true);
      try {
        await payStoreSettlement(selectedSettlement.id, {
          receiptUrl: receiptUrl.trim(),
        });
        showToast(
          "Pago Registrado y Tokens Retirados",
          "success",
          `Liquidación de ${money(selectedSettlement.fiatAmount || Number(selectedSettlement.tokenAmount) * 0.2)} completada. Tokens transferidos a tesorería on-chain.`
        );
        setSelectedSettlement(null);
        loadSettlements();
      } catch (err: any) {
        showToast(
          "Error al registrar pago",
          "error",
          err.response?.data?.message || err.message
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(true);
      try {
        await updateStoreSettlementStatus(selectedSettlement.id, {
          status: targetStatus,
          receiptUrl: receiptUrl.trim() || undefined,
        });
        showToast(
          "Estado Actualizado",
          "success",
          `Solicitud actualizada a ${targetStatus}.`
        );
        setSelectedSettlement(null);
        loadSettlements();
      } catch (err: any) {
        showToast(
          "Error al actualizar estado",
          "error",
          err.response?.data?.message || err.message
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        s.id?.toLowerCase().includes(q) ||
        s.store?.businessName?.toLowerCase().includes(q) ||
        s.store?.ruc?.includes(q) ||
        s.store?.user?.email?.toLowerCase().includes(q) ||
        s.bankAccount?.toLowerCase().includes(q)
      );
    });
  }, [settlements, search]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // KPIs
  const pendingCount = settlements.filter(
    (s) => s.status === "PENDING" || s.status === "APPROVED_PENDING_PAYMENT"
  ).length;
  const totalPaidFiat = settlements
    .filter((s) => s.status === "PAID")
    .reduce((acc, s) => acc + Number(s.fiatAmount || Number(s.tokenAmount) * 0.2), 0);
  const totalPendingTokens = settlements
    .filter((s) => s.status === "PENDING" || s.status === "APPROVED_PENDING_PAYMENT")
    .reduce((acc, s) => acc + Number(s.tokenAmount || 0), 0);

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Tesorería y Finanzas"
        title="Liquidaciones a Tiendas y Comercios Aliados"
        description="Supervisión, aprobación y ejecución de transferencias bancarias en moneda nacional (PEN) para los comercios que aceptan LIVOs."
        action={
          <button
            onClick={loadSettlements}
            disabled={loading}
            className="btn secondary"
            style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refrescar</span>
          </button>
        }
      />

      <div className="grid kpis" style={{ marginBottom: 20 }}>
        <Kpi
          label="PENDIENTES DE PAGO"
          value={String(pendingCount)}
          trend="En cola de tesorería"
          accent={pendingCount > 0 ? "var(--amber)" : "var(--green)"}
        />
        <Kpi
          label="TOKENS POR RETIRAR"
          value={`${totalPendingTokens.toFixed(1)} LIVO`}
          trend={`Equivalente a ${money(totalPendingTokens * 0.2)}`}
          accent="var(--blue)"
        />
        <Kpi
          label="TOTAL LIQUIDADO (FIAT)"
          value={money(totalPaidFiat)}
          trend="Transferido a cuentas bancarias"
          accent="var(--purple, #8b5cf6)"
        />
        <Kpi
          label="ESTADO BLOCKCHAIN"
          value="TESORERÍA ACTIVA"
          trend="Subsidized transfer encolada"
          accent="var(--green)"
        />
      </div>

      <section className="card">
        <div
          className="section-title"
          style={{
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Banknote size={18} style={{ color: "var(--green)" }} />
            <span>Solicitudes de Liquidación ({filteredSettlements.length})</span>
          </h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted, #64748b)",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por comercio, RUC o banco..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 30,
                  paddingRight: 10,
                  paddingTop: 6,
                  paddingBottom: 6,
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--bg, #f8fafc)",
                  color: "var(--text, #0f172a)",
                  minWidth: 220,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={14} style={{ color: "var(--muted, #64748b)" }} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--bg, #f8fafc)",
                  color: "var(--text, #0f172a)",
                }}
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDING">PENDING - Pendientes</option>
                <option value="APPROVED_PENDING_PAYMENT">APPROVED - Aprobadas para abono</option>
                <option value="PAID">PAID - Pagadas y cerradas</option>
                <option value="REJECTED">REJECTED - Rechazadas</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : filteredSettlements.length === 0 ? (
          <EmptyState
            title="No se encontraron solicitudes de liquidación"
            description="Ninguna solicitud coincide con los filtros aplicados."
          />
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Fecha</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Comercio Aliado</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Tokens</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Importe a Pagar</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Cuenta de Destino</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Estado</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                    <td style={{ padding: "12px", fontSize: 12, color: "var(--muted, #64748b)" }}>
                      {formatDate(s.createdAt)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <strong style={{ display: "block", color: "var(--text, #0f172a)" }}>
                        {s.store?.businessName || s.store?.user?.email?.split("@")[0] || "Tienda Aliada"}
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                        RUC: {s.store?.ruc || "Sin RUC"} · {s.store?.user?.email}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                      {Number(s.tokenAmount || 0).toFixed(1)} LIVO
                    </td>
                    <td style={{ padding: "12px", fontWeight: 800, color: "var(--green)" }}>
                      {money(Number(s.fiatAmount || Number(s.tokenAmount) * 0.2))}
                    </td>
                    <td style={{ padding: "12px", fontSize: 12, fontFamily: "monospace", color: "var(--text, #0f172a)" }}>
                      {s.bankAccount || s.store?.bankAccount || "Cuenta registrada"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        className={`status ${s.status}`}
                        style={{ fontSize: 10, textTransform: "uppercase" }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="btn secondary"
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Eye size={12} />
                        <span>Gestionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line, #e2e8f0)",
                  fontSize: 12,
                  color: "var(--muted, #64748b)",
                }}
              >
                <span>
                  Página {page} de {totalPages} ({totalCount} solicitudes)
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn secondary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn secondary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Gestión y Pago de Liquidación */}
      {selectedSettlement && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--panel, #ffffff)",
              border: "1px solid var(--line, #cbd5e1)",
              borderRadius: 20,
              padding: 26,
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                borderBottom: "1px solid var(--line, #e2e8f0)",
                paddingBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Banknote size={24} style={{ color: "var(--green)" }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text, #0f172a)" }}>
                    Gestionar Liquidación a Tienda
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
                    ID: #{selectedSettlement.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                style={{
                  background: "var(--bg, #f1f5f9)",
                  border: "none",
                  color: "var(--muted, #64748b)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 16, fontSize: 13 }}>
              {/* Resumen del Comercio y Cuenta */}
              <div style={{ background: "var(--panel2, #f8fafc)", padding: 14, borderRadius: 12, border: "1px solid var(--line, #e2e8f0)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><strong>Comercio:</strong> {selectedSettlement.store?.businessName || "Tienda"}</div>
                  <div><strong>RUC:</strong> {selectedSettlement.store?.ruc || "Sin RUC"}</div>
                  <div style={{ gridColumn: "span 2" }}>
                    <strong>Cuenta de Abono:</strong> {selectedSettlement.bankAccount || selectedSettlement.store?.bankAccount}
                  </div>
                  <div>
                    <strong>LIVOs a Quemar:</strong> {Number(selectedSettlement.tokenAmount || 0).toFixed(1)} LIVO
                  </div>
                  <div>
                    <strong>Monto a Transferir:</strong>{" "}
                    <span style={{ color: "var(--green)", fontWeight: 800 }}>
                      {money(Number(selectedSettlement.fiatAmount || Number(selectedSettlement.tokenAmount) * 0.2))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acción a realizar */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted, #64748b)", marginBottom: 6 }}>
                  Estado de la Solicitud
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    color: "var(--text, #0f172a)",
                    fontSize: 13,
                  }}
                >
                  <option value="PENDING">PENDING - En revisión</option>
                  <option value="APPROVED_PENDING_PAYMENT">APPROVED_PENDING_PAYMENT - Aprobada para abono bancario</option>
                  <option value="PAID">PAID - Pagada (Adjuntar comprobante y encolar retiro on-chain)</option>
                  <option value="REJECTED">REJECTED - Rechazada</option>
                </select>
              </div>

              {targetStatus === "PAID" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted, #64748b)", marginBottom: 6 }}>
                    Enlace o N° de Operación del Comprobante Bancario
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: https://banco.com/voucher-12345.pdf o N° OP: 8947291"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--line, #cbd5e1)",
                      background: "var(--bg, #f8fafc)",
                      color: "var(--text, #0f172a)",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                  <small style={{ color: "var(--muted, #64748b)", display: "block", marginTop: 4 }}>
                    Al confirmar como PAID, se retirarán los tokens de la wallet del comercio en la blockchain Stellar y se notificará por WebSockets.
                  </small>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedSettlement(null)}
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={isProcessing}
                  className="btn primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Send size={15} />
                  <span>{isProcessing ? "Procesando..." : "Confirmar Estado"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
