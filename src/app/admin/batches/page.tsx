"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHead, Status } from "@/components/Shell";
import { BatchCard } from "@/components/Assets";
import { fetchBatchesPaginated } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ViewStatesContainer } from "@/components/ui/view-states-container";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { LayoutGrid, List, RefreshCw, ExternalLink } from "lucide-react";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function BatchesGridSkeleton() {
  return (
    <div className="grid collection-grid">
      {[1, 2, 3, 4, 5, 6].map((x) => (
        <div
          key={x}
          className="card animate-pulse"
          style={{
            height: 180,
            background: "var(--panel, #ffffff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: 16, width: "40%", background: "var(--line, #e2e8f0)", borderRadius: 4 }} />
            <div style={{ height: 16, width: "25%", background: "var(--line, #e2e8f0)", borderRadius: 10 }} />
          </div>
          <div style={{ height: 50, background: "var(--panel2, #f1f5f9)", borderRadius: 8 }} />
          <div style={{ height: 14, width: "60%", background: "var(--line, #e2e8f0)", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function Batches() {
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadBatches = useCallback(async (targetPage = page) => {
    setLoading(true);
    setIsError(false);
    try {
      const params: any = {
        page: targetPage,
        limit,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await fetchBatchesPaginated(params);
      setBatchesList(response.data || []);
      if (response.meta) {
        setMeta(response.meta);
      }
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "No se pudieron obtener los lotes");
      showToast("Error al cargar lotes", "error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    loadBatches(page);
  }, [loadBatches, page]);

  // Filtro de búsqueda local sobre la página actual
  const filteredBatches = batchesList.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.id?.toLowerCase().includes(q) ||
      b.collector?.name?.toLowerCase().includes(q) ||
      b.collector?.email?.toLowerCase().includes(q) ||
      b.destinationCenter?.name?.toLowerCase().includes(q) ||
      b.destinationCenter?.email?.toLowerCase().includes(q) ||
      b.stellarTxHash?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Activos trazables"
        title="Explorador de Lotes"
        description="Audita y rastrea cada lote desde su recolección urbana hasta el pesaje industrial y certificación en la red Stellar."
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                display: "inline-flex",
                background: "var(--panel2, #f1f5f9)",
                padding: 4,
                borderRadius: 10,
                border: "1px solid var(--line, #e2e8f0)",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  background: viewMode === "grid" ? "var(--panel, #ffffff)" : "transparent",
                  color: viewMode === "grid" ? "var(--text, #0f172a)" : "var(--muted, #64748b)",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <LayoutGrid size={13} />
                <span>Cuadrícula</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  background: viewMode === "list" ? "var(--panel, #ffffff)" : "transparent",
                  color: viewMode === "list" ? "var(--text, #0f172a)" : "var(--muted, #64748b)",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <List size={13} />
                <span>Lista</span>
              </button>
            </div>
            <button
              onClick={() => loadBatches(page)}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      <div className="toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div className="search" style={{ flex: "1 1 280px" }}>
          <input
            placeholder="Buscar por ID, recolector, centro o hash Stellar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto", minWidth: 170 }}
        >
          <option value="all">Todos los estados</option>
          <option value="OPEN">OPEN (Abierto)</option>
          <option value="IN_TRANSIT">IN_TRANSIT (En Tránsito)</option>
          <option value="PROCESSING">PROCESSING (En Balanza)</option>
          <option value="RECEIVED">RECEIVED (Recibido)</option>
          <option value="FLAGGED_FOR_REVIEW">FLAGGED_FOR_REVIEW</option>
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, fontSize: 12, color: "var(--muted)" }}>
        <span>
          {loading
            ? "Consultando catálogo de lotes..."
            : `Página ${meta.page} de ${meta.totalPages} · Mostrando ${filteredBatches.length} lote(s) (${meta.total} registrados en total)`}
        </span>
      </div>

      <ViewStatesContainer
        isLoading={loading}
        error={errorMessage || (isError ? "No se pudieron obtener los lotes" : null)}
        isEmpty={!loading && !isError && filteredBatches.length === 0}
        onRetry={() => loadBatches(page)}
        skeleton={viewMode === "grid" ? <BatchesGridSkeleton /> : <TableSkeleton rows={6} columns={6} />}
        emptyTitle={batchesList.length === 0 ? "Sin Lotes Registrados" : "Sin Coincidencias"}
        emptyDescription={
          batchesList.length === 0
            ? "No se encontraron lotes activos para este filtro en el sistema."
            : "No hay lotes que coincidan con los términos de búsqueda ingresados."
        }
        emptyActionLabel={batchesList.length === 0 ? "Actualizar Lista" : "Limpiar Filtros"}
        onEmptyAction={() => {
          if (batchesList.length === 0) {
            loadBatches(1);
          } else {
            setSearchQuery("");
            setStatusFilter("all");
            setPage(1);
          }
        }}
      >
        {viewMode === "grid" ? (
          <div className="grid collection-grid">
            {filteredBatches.map((b) => (
              <BatchCard batch={b} key={b.id} />
            ))}
          </div>
        ) : (
          <div className="table-wrap" style={{ background: "var(--panel)", borderRadius: 14, border: "1px solid var(--line)", overflow: "hidden" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--panel2)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>ID Lote</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Fecha Recepción</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Recolector</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Centro Destino</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Peso Útil / Total</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Notarización Stellar</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b) => {
                  const totalKg = Object.values(b.materialsActual || {}).reduce((sum: number, v: any) => sum + Number(v), 0);
                  const materials = Object.keys(b.materialsActual || b.requests?.[0]?.itemsEstimated || {});
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        <Link href={`/admin/batches/${b.id}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                          #{shortId(b.id)}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{date(b.createdAt)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <Status value={b.status} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500 }}>{b.collector?.name || b.collector?.email || "Sin asignar"}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500 }}>{b.destinationCenter?.name || b.destinationCenter?.email || "En tránsito"}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div>
                          <strong style={{ color: totalKg > 0 ? "var(--green)" : "var(--muted)" }}>
                            {totalKg > 0 ? kg(totalKg) : (b.usefulWeightKg ? kg(Number(b.usefulWeightKg)) : "Por pesar")}
                          </strong>
                          {materials.length > 0 && (
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                              {materials.join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {b.stellarTxHash ? (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${b.stellarTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11,
                              color: "var(--blue)",
                              background: "rgba(114, 167, 255, 0.1)",
                              padding: "4px 8px",
                              borderRadius: 6,
                              textDecoration: "none",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>Stellar Tx</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>Pendiente</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <Link
                          href={`/admin/batches/${b.id}`}
                          className="btn ghost"
                          style={{ fontSize: 12, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <span>Ver Pasaporte</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ViewStatesContainer>

      {/* Controles Universales de Paginación */}
      {meta.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            padding: "16px 20px",
            background: "var(--panel)",
            borderRadius: 12,
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong> ({meta.total} lotes totales)
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage || loading}
              className="btn secondary"
              style={{
                fontSize: 12,
                padding: "7px 14px",
                opacity: !meta.hasPrevPage || loading ? 0.5 : 1,
                cursor: !meta.hasPrevPage || loading ? "not-allowed" : "pointer",
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNextPage || loading}
              className="btn secondary"
              style={{
                fontSize: 12,
                padding: "7px 14px",
                opacity: !meta.hasNextPage || loading ? 0.5 : 1,
                cursor: !meta.hasNextPage || loading ? "not-allowed" : "pointer",
              }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
