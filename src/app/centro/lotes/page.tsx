"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHead, Status } from "@/components/Shell";
import { BatchCard } from "@/components/Assets";
import { fetchBatchesPaginated } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ViewStatesContainer } from "@/components/ui/view-states-container";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { LayoutGrid, List, RefreshCw, ExternalLink, Printer, Search, Boxes } from "lucide-react";

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
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: 16, width: "40%", background: "var(--line)", borderRadius: 4 }} />
            <div style={{ height: 16, width: "25%", background: "var(--line)", borderRadius: 10 }} />
          </div>
          <div style={{ height: 50, background: "var(--panel2)", borderRadius: 8 }} />
          <div style={{ height: 14, width: "60%", background: "var(--line)", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function CentroLotesPage() {
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
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);
  const limit = 10;

  const loadBatches = useCallback(async (targetPage = page) => {
    setLoading(true);
    setIsError(false);
    try {
      const params: any = { page: targetPage, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (materialFilter !== "all") params.materialType = materialFilter;

      const res = await fetchBatchesPaginated(params);
      setBatchesList(res.data);
      setMeta(res.meta);
      setPage(res.meta.page);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Error al cargar historial de lotes");
      showToast("Error al cargar lotes", "error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, materialFilter]);

  useEffect(() => {
    loadBatches(page);
  }, [loadBatches, page]);

  const filteredBatches = batchesList.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.id?.toLowerCase().includes(q) ||
      b.collectorId?.toLowerCase().includes(q) ||
      b.collector?.name?.toLowerCase().includes(q) ||
      b.collector?.email?.toLowerCase().includes(q) ||
      b.materialType?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Operaciones de acopio"
        title="Historial de Lotes"
        description="Audita, filtra y revisa la trazabilidad de todos los lotes recibidos, en tránsito o con discrepancia."
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 10, padding: 3 }}>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Vista en tarjetas"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "grid" ? "var(--panel)" : "transparent",
                  color: viewMode === "grid" ? "var(--green)" : "var(--muted)",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Vista en lista"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: viewMode === "list" ? "var(--panel)" : "transparent",
                  color: viewMode === "list" ? "var(--green)" : "var(--muted)",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                }}
              >
                <List size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => loadBatches(page)}
              disabled={loading}
              className="btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Actualizar</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Buscar por código de lote, recolector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "10px 14px",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
            minWidth: 160,
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="RECEIVED">RECEIVED (Recibido)</option>
          <option value="PROCESSING">PROCESSING (En Proceso)</option>
          <option value="FLAGGED_FOR_REVIEW">FLAGGED (Discrepancia)</option>
          <option value="IN_TRANSIT">IN_TRANSIT (En Tránsito)</option>
          <option value="OPEN">OPEN (Abierto)</option>
        </select>

        <select
          value={materialFilter}
          onChange={(e) => {
            setMaterialFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "10px 14px",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
            minWidth: 150,
          }}
        >
          <option value="all">Todos los materiales</option>
          <option value="PET">Plástico PET</option>
          <option value="HDPE">Plástico HDPE</option>
          <option value="CARTON">Cartón / Papel</option>
          <option value="VIDRIO">Vidrio</option>
          <option value="ALUMINIO">Aluminio / Metal</option>
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
            setMaterialFilter("all");
          }
        }}
      >
        {viewMode === "grid" ? (
          <div className="grid collection-grid">
            {filteredBatches.map((b) => (
              <BatchCard key={b.id} batch={b} />
            ))}
          </div>
        ) : (
          <div className="card table-wrap" style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
            <table>
              <thead>
                <tr>
                  <th>Código Lote</th>
                  <th>Material</th>
                  <th>Peso Total</th>
                  <th>Recolector</th>
                  <th>Fecha de Ingreso</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Boxes size={14} style={{ color: "var(--green)" }} />
                        <strong style={{ fontFamily: "monospace", color: "var(--text)" }}>{shortId(b.id)}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: "var(--panel2)", border: "1px solid var(--line)" }}>
                        {b.materialType || "Varios"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--text)" }}>{kg(b.totalWeightKg || b.weightKg || 0)}</strong>
                    </td>
                    <td>
                      <span style={{ color: "var(--muted)", fontSize: 13 }}>
                        {b.collector?.name || b.collector?.email?.split("@")[0] || shortId(b.collectorId || "") || "Sin recolector"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>{date(b.createdAt)}</span>
                    </td>
                    <td>
                      <Status value={b.status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/batches/${b.id}`}
                        className="btn small ghost"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <span>Detalle</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, padding: "12px 16px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong> ({meta.total} lotes totales)
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta.hasPrevPage || loading}
                className="btn small"
                style={{ cursor: meta.hasPrevPage ? "pointer" : "not-allowed", opacity: meta.hasPrevPage ? 1 : 0.5 }}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasNextPage || loading}
                className="btn small"
                style={{ cursor: meta.hasNextPage ? "pointer" : "not-allowed", opacity: meta.hasNextPage ? 1 : 0.5 }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </ViewStatesContainer>
    </>
  );
}
