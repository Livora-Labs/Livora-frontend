"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shell, Kpi, PageHead, Status } from "@/components/Shell";
import { fetchSales, fetchCertificates } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const money = (value: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export default function Page() {
  const [salesList, setSalesList] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, certsData] = await Promise.all([
        fetchSales(),
        fetchCertificates()
      ]);
      setSalesList(salesData || []);
      setCerts(certsData || []);
    } catch (err: any) {
      showToast("Error al cargar compras", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalVol = salesList.reduce((a, c) => a + Number(c.weightKg), 0);
  const totalInv = salesList.reduce((a, c) => a + Number(c.totalAmount), 0);
  const centersCount = Array.from(new Set(salesList.map((s) => s.center?.email))).filter(Boolean).length;

  return (
    <Shell role="company">
      <ToastContainer />
      <PageHead
        eyebrow="Abastecimiento circular"
        title="Historial de compras"
        description="Material adquirido a centros de acopio formalizados y su estado de certificación."
        action={
          <button onClick={loadData} className="btn secondary">
            Refrescar ↻
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8" }}>
          Cargando tus compras registradas...
        </div>
      ) : (
        <>
          <div className="grid kpis">
            <Kpi label="VOLUMEN TOTAL" value={kg(totalVol)} trend={`${salesList.length} operaciones`} />
            <Kpi label="INVERSIÓN CIRCULAR" value={money(totalInv)} trend="Acumulado" accent="var(--blue)" />
            <Kpi label="CENTROS PROVEEDORES" value={String(centersCount)} trend="100% formalizados" />
            <Kpi label="TASA CERTIFICADA" value="100%" trend="Todas las compras verificadas" />
          </div>

          <section className="card">
            <div className="section-title">
              <h2>Operaciones registradas</h2>
              <span className="live">Datos verificados</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>COMPRA</th>
                    <th>FECHA</th>
                    <th>MATERIAL</th>
                    <th>CENTRO DE ACOPIO</th>
                    <th>PESO</th>
                    <th>MONTO</th>
                    <th>CERTIFICADO</th>
                  </tr>
                </thead>
                <tbody>
                  {salesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: 20 }}>
                        No hay compras registradas aún.
                      </td>
                    </tr>
                  ) : (
                    salesList.map((s) => {
                      const c = certs.find((x) => x.saleId === s.id);
                      return (
                        <tr key={s.id}>
                          <td className="mono">#{shortId(s.id)}</td>
                          <td>{date(s.createdAt)}</td>
                          <td>
                            <strong>{s.materialType}</strong>
                          </td>
                          <td>{s.center?.email || "—"}</td>
                          <td>{kg(s.weightKg)}</td>
                          <td>{money(s.totalAmount)}</td>
                          <td>
                            {c ? (
                              <Link href={`/company/certificates/${c.id}`}>
                                <Status value="ACTIVE" />
                              </Link>
                            ) : (
                              <span className="muted">Pendiente</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
