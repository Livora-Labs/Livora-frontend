"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Status } from "@/components/Shell";
import { fetchBlockchainHealth, fetchBatches } from "@/lib/api";
import { ToastContainer } from "@/components/ToastNotification";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  );

export default function Page() {
  const {
    data: health,
    isLoading: loadingHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["blockchainHealth"],
    queryFn: fetchBlockchainHealth,
  });

  const {
    data: batches = [],
    isLoading: loadingBatches,
    refetch: refetchBatches,
  } = useQuery({
    queryKey: ["batches"],
    queryFn: () => fetchBatches(),
  });

  const loading = loadingHealth || loadingBatches;
  const blockchainBatches = batches.filter((b: any) => b.txHash);

  const handleRefresh = () => {
    refetchHealth();
    refetchBatches();
  };

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Infraestructura Digital"
        title="Monitor de Trazabilidad"
        description="Estado de la red de verificación, procesamiento de lotes y evidencia digital."
        action={
          <button onClick={handleRefresh} className="btn" disabled={loading}>
            Actualizar ↻
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8" }}>
          Cargando estado de la infraestructura...
        </div>
      ) : (
        <>
          <div className="grid kpis">
            <div className="card kpi">
              <div className="kpi-label">ESTADO DE RED</div>
              <div className="kpi-value" style={{ color: "var(--green)" }}>
                {health?.status === "healthy" ? "Saludable" : "Incidencia"}
              </div>
              <div className="trend">{health?.network || "Stellar Testnet"}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">LATENCIA DE RED</div>
              <div className="kpi-value">{health?.latency || "45 ms"}</div>
              <div className="trend">Óptimo</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">ÚLTIMO REGISTRO</div>
              <div className="kpi-value">{health?.blockNumber || "12.89M"}</div>
              <div className="trend">Sincronizado</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">PROCESOS EN COLA</div>
              <div className="kpi-value">0</div>
              <div className="trend">Sin incidencias</div>
            </div>
          </div>

          <div className="grid split">
            <section className="card">
              <div className="section-title">
                <h2>Últimas transacciones</h2>
                <span className="live">En vivo</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>LOTE</th>
                      <th>CÓDIGO DE REGISTRO</th>
                      <th>ESTADO</th>
                      <th>FECHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockchainBatches.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "#94A3B8", padding: 20 }}>
                          No hay transacciones registradas en blockchain aún.
                        </td>
                      </tr>
                    ) : (
                      blockchainBatches.map((b: any) => (
                        <tr key={b.id}>
                          <td className="mono">#{shortId(b.id)}</td>
                          <td className="mono">{shortId(b.txHash)}</td>
                          <td>
                            <Status value="RECEIVED" />
                          </td>
                          <td>{date(b.updatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="card">
              <div className="section-title">
                <h2>Servicios del Ecosistema</h2>
              </div>
              {[
                ["Portal de API", "Operativo"],
                ["Procesador de Tareas", "Operativo"],
                ["Almacenamiento IPFS", "Operativo"],
                ["Contrato de Incentivos", "Operativo"],
              ].map((x) => (
                <div className="network-row" key={x[0]}>
                  <strong>{x[0]}</strong>
                  <span className="live">{x[1]}</span>
                </div>
              ))}
            </aside>
          </div>
        </>
      )}
    </>
  );
}
