"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { fetchStoreRedemptions, refundStoreRedemption } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";
import {
  Receipt,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
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

export default function StoreCanjesPage() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<any | null>(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    loadRedemptions();
  }, [page]);

  const loadRedemptions = async () => {
    setLoading(true);
    try {
      const res = await fetchStoreRedemptions({ page, limit });
      if (res && res.data) {
        setRedemptions(res.data);
        setTotalCount(res.total || 0);
      } else if (Array.isArray(res)) {
        setRedemptions(res);
        setTotalCount(res.length);
      } else {
        setRedemptions([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      showToast("Error al cargar canjes", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await refundStoreRedemption(refundTarget.id);
      showToast(
        "Canje Anulado con Éxito",
        "success",
        `Se devolvieron los ${refundTarget.tokenAmount} EcoTokens al monedero del cliente.`
      );
      setRefundTarget(null);
      loadRedemptions();
    } catch (err: any) {
      showToast(
        "Error al anular canje",
        "error",
        err.response?.data?.message || err.message
      );
    } finally {
      setRefunding(false);
    }
  };

  const filteredRedemptions = useMemo(() => {
    return redemptions.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.id?.toLowerCase().includes(q) ||
        r.qrCodeRef?.toLowerCase().includes(q) ||
        r.buyer?.email?.toLowerCase().includes(q) ||
        r.buyer?.name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [redemptions, search, statusFilter]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // KPIs
  const totalEcoTokens = redemptions
    .filter((r) => r.status === "COMPLETED")
    .reduce((acc, r) => acc + Number(r.tokenAmount || 0), 0);
  const totalFiatValue = totalEcoTokens * 0.2;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Auditoría Comercial"
        title="Historial de Canjes en Caja"
        description="Consulta las transacciones cobradas a clientes en punto de venta y gestiona devoluciones dentro del plazo normativo de 24 horas."
        action={
          <button
            onClick={loadRedemptions}
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
          label="TOTAL CANJES"
          value={String(totalCount)}
          trend="Operaciones en caja"
          accent="var(--blue)"
        />
        <Kpi
          label="ECOTOKENS COBRADOS"
          value={`${totalEcoTokens.toFixed(1)} ECO`}
          trend="En billetera comercial"
          accent="var(--green)"
        />
        <Kpi
          label="VALOR EQUIVALENTE"
          value={money(totalFiatValue)}
          trend="Disponible para liquidar"
          accent="var(--purple, #8b5cf6)"
        />
        <Kpi
          label="PLAZO DE DEVOLUCIÓN"
          value="24 Horas"
          trend="Garantía de anulación POS"
          accent="var(--amber)"
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
            <Receipt size={18} style={{ color: "var(--green)" }} />
            <span>Transacciones de Canje ({filteredRedemptions.length})</span>
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
                placeholder="Buscar por cliente o código..."
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="COMPLETED">Completados</option>
                <option value="REFUNDED">Anulados / Reembolsados</option>
                <option value="PENDING">Pendientes</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : filteredRedemptions.length === 0 ? (
          <EmptyState
            title="No se encontraron canjes"
            description={
              search || statusFilter !== "ALL"
                ? "Ninguna transacción coincide con los filtros aplicados."
                : "Aún no se han procesado pagos con EcoTokens en este comercio."
            }
          />
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Fecha</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Ref. Cobro</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Cliente</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Tokens Acreditados</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Importe Soles</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Estado</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredRedemptions.map((r) => {
                  const isCompleted = r.status === "COMPLETED";
                  // Check if within 24h for refund
                  const hoursDiff =
                    (new Date().getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
                  const canRefund = isCompleted && hoursDiff <= 24;

                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                      <td style={{ padding: "12px", fontSize: 12, color: "var(--muted, #64748b)" }}>
                        {formatDate(r.createdAt)}
                      </td>
                      <td style={{ padding: "12px", fontFamily: "monospace", fontSize: 12, color: "var(--text, #0f172a)" }}>
                        #{r.qrCodeRef?.slice(0, 10) || r.id?.slice(0, 8)}...
                      </td>
                      <td style={{ padding: "12px" }}>
                        <strong style={{ display: "block", color: "var(--text, #0f172a)" }}>
                          {r.buyer?.name || r.buyer?.email?.split("@")[0] || "Cliente Livora"}
                        </strong>
                        <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                          {r.buyer?.email || "App Móvil"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--green)" }}>
                        +{Number(r.tokenAmount || 0).toFixed(1)} ECO
                      </td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                        {money(Number(r.fiatAmount || Number(r.tokenAmount || 0) * 0.2))}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          className={`status ${r.status}`}
                          style={{ fontSize: 10, textTransform: "uppercase" }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {canRefund ? (
                          <button
                            onClick={() => setRefundTarget(r)}
                            className="btn secondary"
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#ef4444",
                              borderColor: "rgba(239, 68, 68, 0.4)",
                            }}
                          >
                            <RotateCcw size={12} />
                            <span>Anular</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                            {isCompleted ? "Firme" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                  Página {page} de {totalPages} ({totalCount} canjes en total)
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

      {/* Modal de Confirmación de Anulación */}
      {refundTarget && (
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
              borderRadius: 18,
              padding: 24,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.12)",
                  display: "grid",
                  placeItems: "center",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text, #0f172a)" }}>
                ¿Anular canje en caja?
              </h3>
            </div>

            <p style={{ fontSize: 13, color: "var(--muted, #64748b)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Esta acción reembolsará <strong>{refundTarget.tokenAmount} EcoTokens</strong> ({money(Number(refundTarget.fiatAmount || Number(refundTarget.tokenAmount) * 0.2))}) al monedero del cliente y deducirá los tokens de tu saldo comercial.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="btn secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={refunding}
                className="btn"
                style={{
                  flex: 1,
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                {refunding ? "Anulando..." : "Confirmar Anulación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
