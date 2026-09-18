"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Kpi, PageHead } from "@/components/Shell";
import { fetchInventory } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { RefreshCw, Warehouse, Search, Filter, Package } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";

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

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const total = items.reduce((a, c) => a + Number(c.quantityKg), 0);
  const centerEmails = Array.from(new Set(items.map((i) => i.center?.email))).filter(Boolean);
  const materialTypes = Array.from(new Set(items.map((i) => i.materialType))).filter(Boolean);
  const lowStockCount = items.filter((i) => Number(i.quantityKg) < 100).length;

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchSearch =
        !searchQuery ||
        i.materialType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.center?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.center?.name?.toLowerCase().includes(searchQuery.toLowerCase());
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
        eyebrow="Control operativo"
        title="Inventario de materiales"
        description="Stock físico consolidado de los centros de acopio de la red Livora."
        action={
          <button
            onClick={loadInventory}
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
        <Kpi label="STOCK TOTAL" value={kg(total)} trend="Actualizado en tiempo real" />
        <Kpi label="CENTROS ACTIVOS" value={String(centerEmails.length)} trend="Operativos" accent="var(--blue)" />
        <Kpi label="TIPOS DE MATERIAL" value={String(materialTypes.length)} trend="Trazados" accent="var(--amber)" />
        <Kpi label="STOCK BAJO" value={String(lowStockCount)} trend="Requieren recolecciones" accent="var(--red)" />
      </div>

      <section className="card">
        <div className="section-title" style={{ flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Warehouse size={18} style={{ color: "var(--green)" }} />
            Stock por centro y material
          </h2>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {filteredItems.length} registros encontrados
          </span>
        </div>

        {/* Toolbar de Búsqueda y Filtros */}
        <div
          className="toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div className="search" style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <input
              placeholder="Buscar por centro, material o email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "inherit", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} style={{ color: "var(--muted)" }} />
            <select
              value={selectedMaterial}
              onChange={(e) => {
                setSelectedMaterial(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "var(--panel)",
                color: "var(--text)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <option value="ALL">Todos los materiales</option>
              {materialTypes.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin registros de inventario"
            description={
              searchQuery || selectedMaterial !== "ALL"
                ? "No se hallaron materiales que coincidan con los filtros ingresados."
                : "No hay materiales registrados en el inventario actual de los centros."
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>MATERIAL</th>
                    <th>CENTRO DE ACOPIO</th>
                    <th>CANTIDAD</th>
                    <th>CAPACIDAD / NIVEL</th>
                    <th>ÚLTIMA ACTUALIZACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.materialType}</strong>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {i.center?.name ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{i.center.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{i.center.email}</div>
                          </>
                        ) : (
                          i.center?.email || "—"
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--green)" }}>
                        {kg(i.quantityKg)}
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div className="progress" style={{ height: 6, borderRadius: 3, background: "var(--line)", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, (Number(i.quantityKg) / 2000) * 100)}%`,
                              background: Number(i.quantityKg) < 100 ? "var(--red)" : "var(--green)",
                              borderRadius: 3,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, display: "block" }}>
                          {Number(i.quantityKg) < 100 ? "Nivel crítico" : "Abastecido"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>
                        {date(i.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--muted)" }}>
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({filteredItems.length} materiales en total)
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn secondary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
