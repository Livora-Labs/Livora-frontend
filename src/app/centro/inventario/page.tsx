"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { fetchInventory } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { RefreshCw, Warehouse, Search, Filter, Package, ArrowUpRight, Scale } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";
import Link from "next/link";

const kg = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";

const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const MATERIAL_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  PET: { bg: "rgba(16, 185, 129, 0.12)", text: "#059669", bar: "#10B981" },
  HDPE: { bg: "rgba(59, 130, 246, 0.12)", text: "#2563EB", bar: "#3B82F6" },
  CARTON: { bg: "rgba(245, 158, 11, 0.12)", text: "#D97706", bar: "#F59E0B" },
  VIDRIO: { bg: "rgba(139, 92, 246, 0.12)", text: "#7C3AED", bar: "#8B5CF6" },
  ALUMINIO: { bg: "rgba(14, 165, 233, 0.12)", text: "#0284C7", bar: "#0EA5E9" },
  TETRAPAK: { bg: "rgba(236, 72, 153, 0.12)", text: "#DB2777", bar: "#EC4899" },
  PAPEL: { bg: "rgba(100, 116, 139, 0.12)", text: "#475569", bar: "#64748B" },
};

export default function CentroInventarioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory();
      setItems(data || []);
    } catch (err: any) {
      showToast("Error al cargar inventario", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalStockKg = items.reduce((a, c) => a + Number(c.quantityKg || 0), 0);
  const materialTypes = Array.from(new Set(items.map((i) => i.materialType))).filter(Boolean);
  const topMaterial = [...items].sort((a, b) => Number(b.quantityKg || 0) - Number(a.quantityKg || 0))[0];

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchSearch =
        !searchQuery ||
        i.materialType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.batchId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMaterial =
        selectedMaterial === "ALL" || i.materialType === selectedMaterial;
      return matchSearch && matchMaterial;
    });
  }, [items, searchQuery, selectedMaterial]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Operaciones de Almacén"
        title="Inventario de Materiales"
        description="Monitoreo en tiempo real del pesaje consolidado y reservas listas para despacho a empresas B2B."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/centro/despachos"
              className="btn primary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowUpRight size={14} />
              <span>Despachar Lote B2B</span>
            </Link>
            <button
              onClick={loadInventory}
              disabled={loading}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      <div className="grid kpis" style={{ marginBottom: 20 }}>
        <Kpi
          label="STOCK TOTAL"
          value={kg(totalStockKg)}
          trend="Consolidado en almacén"
          accent="var(--green)"
        />
        <Kpi
          label="MATERIALES EN STOCK"
          value={String(materialTypes.length)}
          trend="Categorías activas"
          accent="var(--blue)"
        />
        <Kpi
          label="MAYOR VOLUMEN"
          value={topMaterial ? `${topMaterial.materialType} (${kg(Number(topMaterial.quantityKg))})` : "N/D"}
          trend="Material predominante"
          accent="var(--amber)"
        />
        <Kpi
          label="DISPONIBLE B2B"
          value={kg(totalStockKg * 0.95)}
          trend="Listo para facturación ESG"
          accent="var(--purple, #8b5cf6)"
        />
      </div>

      {/* Tarjetas de Resumen por Categoría */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={18} style={{ color: "var(--green)" }} />
            <span>Distribución de Stock por Material</span>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 14,
          }}
        >
          {["PET", "HDPE", "CARTON", "VIDRIO", "ALUMINIO", "TETRAPAK", "PAPEL"].map((mat) => {
            const item = items.find(
              (i) =>
                i.materialType?.toUpperCase() === mat ||
                (mat === "CARTON" && i.materialType?.toUpperCase() === "CARTÓN")
            );
            const stock = Number(item?.quantityKg || 0);
            const pct = totalStockKg > 0 ? Math.min(100, (stock / totalStockKg) * 100) : 0;
            const theme = MATERIAL_COLORS[mat] || { bg: "rgba(100, 116, 139, 0.12)", text: "#475569", bar: "#64748B" };

            return (
              <div
                key={mat}
                style={{
                  background: "var(--panel2, #f8fafc)",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: theme.text,
                        background: theme.bg,
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {mat}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text, #0f172a)", marginTop: 4 }}>
                    {kg(stock)}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      background: "var(--line, #e2e8f0)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: theme.bar,
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabla Detallada con Filtros y Paginación */}
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
            <Warehouse size={18} style={{ color: "var(--green)" }} />
            <span>Detalle de Lotes y Existencias ({filteredItems.length})</span>
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
                placeholder="Buscar por lote o material..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{
                  paddingLeft: 32,
                  paddingRight: 12,
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
                value={selectedMaterial}
                onChange={(e) => {
                  setSelectedMaterial(e.target.value);
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
                <option value="ALL">Todos los materiales</option>
                {materialTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No se encontraron registros de inventario"
            description={
              searchQuery || selectedMaterial !== "ALL"
                ? "Ningún lote coincide con los filtros aplicados."
                : "No hay materiales registrados en el inventario actual de este centro."
            }
          />
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                  <th style={{ padding: "10px 14px", color: "var(--muted, #64748b)" }}>Material</th>
                  <th style={{ padding: "10px 14px", color: "var(--muted, #64748b)" }}>Cantidad Actual</th>
                  <th style={{ padding: "10px 14px", color: "var(--muted, #64748b)" }}>Lote Asociado</th>
                  <th style={{ padding: "10px 14px", color: "var(--muted, #64748b)" }}>Última Actualización</th>
                  <th style={{ padding: "10px 14px", color: "var(--muted, #64748b)", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: "1px solid var(--line, #f1f5f9)",
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: MATERIAL_COLORS[item.materialType]?.text || "var(--text, #0f172a)",
                          background: MATERIAL_COLORS[item.materialType]?.bg || "var(--panel2, #f8fafc)",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {item.materialType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                      {kg(Number(item.quantityKg || 0))}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #64748b)" }}>
                      {item.batchId ? (
                        <Link
                          href={`/centro/lotes`}
                          style={{
                            color: "var(--green)",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontFamily: "monospace",
                          }}
                        >
                          #{String(item.batchId).slice(0, 8)}...
                        </Link>
                      ) : (
                        "Stock consolidado"
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted, #64748b)", fontSize: 12 }}>
                      {item.updatedAt ? date(item.updatedAt) : "Reciente"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <Link
                        href="/centro/despachos"
                        className="btn ghost"
                        style={{
                          fontSize: 11,
                          padding: "4px 8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>Despachar</span>
                        <ArrowUpRight size={12} />
                      </Link>
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
                  Página {page} de {totalPages} ({filteredItems.length} registros en total)
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
    </>
  );
}
