"use client";

import React, { useState, useEffect } from "react";
import { Kpi, PageHead } from "@/components/Shell";
import { fetchInventory } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function InventorySkeleton() {
  return (
    <>
      <div className="grid kpis">
        {[1, 2, 3, 4].map((x) => (
          <div key={x} className="card kpi animate-pulse" style={{ height: 110, background: "#112240", border: "1px solid #1E293B", borderRadius: 12 }}>
            <div style={{ height: 12, width: "50%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 24, width: "70%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 10, width: "40%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <section className="card animate-pulse" style={{ height: 240, background: "#112240", border: "1px solid #1E293B", borderRadius: 12, marginTop: 24 }} />
    </>
  );
}

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  const lowStockCount = items.filter((i) => i.quantityKg < 100).length;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Control operativo"
        title="Inventario de materiales"
        description="Stock físico consolidado de los centros de acopio de la red."
        action={<button onClick={loadInventory} className="btn">Refrescar ↻</button>}
      />

      {loading ? (
        <InventorySkeleton />
      ) : (
        <>
          <div className="grid kpis">
            <Kpi label="STOCK TOTAL" value={kg(total)} trend="Actualizado en tiempo real" />
            <Kpi label="CENTROS ACTIVOS" value={String(centerEmails.length)} trend="Operativos" accent="var(--blue)" />
            <Kpi label="TIPOS DE MATERIAL" value={String(materialTypes.length)} trend="Trazados" accent="var(--amber)" />
            <Kpi label="STOCK BAJO" value={String(lowStockCount)} trend="Requieren recolecciones" accent="var(--red)" />
          </div>

          <section className="card">
            <div className="section-title">
              <h2>Stock por centro y material</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>MATERIAL</th>
                    <th>CENTRO</th>
                    <th>CANTIDAD</th>
                    <th>NIVEL</th>
                    <th>ACTUALIZADO</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
                        <div>No hay materiales en el stock actual de los centros.</div>
                      </td>
                    </tr>
                  ) : (
                    items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <strong>{i.materialType}</strong>
                        </td>
                        <td>{i.center?.email || "—"}</td>
                        <td>{kg(i.quantityKg)}</td>
                        <td style={{ minWidth: 160 }}>
                          <div className="progress">
                            <i
                              style={{
                                width: `${Math.min(100, i.quantityKg / 20)}%`,
                                background: i.quantityKg < 100 ? "var(--red)" : "var(--green)",
                              }}
                            />
                          </div>
                        </td>
                        <td>{date(i.updatedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
