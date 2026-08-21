"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchBatches } from "@/lib/api";
import { Batch } from "@/lib/types";
import { Shell, PageHead, Status } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ArrowLeft, ExternalLink, Info, Search, ShieldCheck } from "lucide-react";

export default function RecolectorHistorialPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await fetchBatches();
      setBatches(data);
    } catch (err: any) {
      showToast("Error al cargar historial", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const destEmail = b.destinationCenter?.email?.toLowerCase() || "";
    const materials = Object.keys(b.materialsActual || {}).join(" ").toLowerCase();
    const matchesSearch = destEmail.includes(searchQuery.toLowerCase()) || materials.includes(searchQuery.toLowerCase()) || b.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getEcoTokenDistribution = (batch: Batch) => {
    const rates: Record<string, number> = {
      PET: 10,
      CARTON: 5,
      CARTÓN: 5,
      VIDRIO: 3,
      PLASTICO: 10,
      PLÁSTICO: 10,
      ALUMINIO: 15,
      TETRAPAK: 4,
      PAPEL: 5,
    };
    let total = 0;
    Object.entries(batch.materialsActual || {}).forEach(([mat, wt]) => {
      const rate = rates[mat.toUpperCase()] || 5;
      total += wt * rate;
    });

    const houseCount = batch.requests?.length || 0;
    let collectorShare = 0;
    let householdShareTotal = 0;
    let householdShareEach = 0;

    if (houseCount === 0) {
      collectorShare = total;
    } else {
      householdShareTotal = total * 0.8;
      collectorShare = total * 0.2;
      householdShareEach = householdShareTotal / houseCount;
    }

    return {
      total,
      collectorShare,
      householdShareTotal,
      householdShareEach,
      houseCount,
    };
  };

  return (
    <Shell role="recolector">
      <ToastContainer />
      <PageHead
        eyebrow="Trazabilidad del transportista"
        title="Historial de Lotes Cargados"
        description="Revisa el registro histórico de tus traslados, estados de descarga y dividendos EcoToken asignados."
        action={
          <Link href="/recolector" className="btn" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} />
            <span>Volver al panel</span>
          </Link>
        }
      />

      <div className="toolbar" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="search" style={{ flex: 1, minWidth: 200, position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: "#94A3B8" }} />
          <input
            placeholder="Buscar por ID, material o destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "#0A192F",
              border: "1px solid #1E293B",
              borderRadius: 10,
              padding: "10px 12px 10px 38px",
              color: "#F8FAFC",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            background: "#0A192F",
            border: "1px solid #1E293B",
            color: "#F8FAFC",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="ALL">Todos los estados</option>
          <option value="OPEN">Abiertos</option>
          <option value="IN_TRANSIT">En tránsito</option>
          <option value="RECEIVED">Recibidos (Descargados)</option>
        </select>
      </div>

      <section className="card">
        <div className="section-title">
          <h2>Listado de Lotes</h2>
          <span className="live">{filteredBatches.length} lotes encontrados</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Cargando datos del historial...</div>
        ) : filteredBatches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
            No hay lotes disponibles para esta consulta.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>LOTE ID</th>
                  <th>FECHA CREACIÓN</th>
                  <th>MATERIALES</th>
                  <th>DESTINO</th>
                  <th>ESTADO</th>
                  <th>ECOTOKENS OBTENIDOS</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b) => {
                  const dist = getEcoTokenDistribution(b);
                  const totalKg = Object.values(b.materialsActual || {}).reduce((sum, wt) => sum + wt, 0);
                  return (
                    <tr key={b.id}>
                      <td className="mono">#{b.id.slice(0, 8)}</td>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong>{totalKg.toFixed(1)} kg</strong>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>
                          {Object.keys(b.materialsActual || {}).join(" + ") || "Sin recolectar"}
                        </div>
                      </td>
                      <td>{b.destinationCenter?.email ? b.destinationCenter.email.split("@")[0].toUpperCase() : "N/A"}</td>
                      <td>
                        <Status value={b.status} />
                      </td>
                      <td>
                        <span style={{ color: "var(--green)", fontWeight: 700 }}>
                          {b.status === "RECEIVED" ? `+${dist.collectorShare.toFixed(1)} ECO` : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedBatch(b)}
                          className="btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "#3B82F6",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Info size={13} />
                          <span>Detalles</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Trazabilidad */}
      {selectedBatch && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 25, 47, 0.85)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#112240",
              border: "1px solid #1E293B",
              borderRadius: 20,
              padding: 24,
              maxWidth: 500,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={20} style={{ color: "#06B6D4" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Trazabilidad e Impacto de Lote</h3>
              </div>
              <button onClick={() => setSelectedBatch(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 14, fontSize: 13 }}>
              <div style={{ background: "#0A192F", padding: 14, borderRadius: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>COMPOSICIÓN FÍSICA</span>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: "#F8FAFC" }}>
                  {Object.keys(selectedBatch.materialsActual || {}).length === 0
                    ? "Sin materiales registrados"
                    : Object.entries(selectedBatch.materialsActual || {})
                        .map(([k, v]) => `${v} kg de ${k}`)
                        .join(" + ")}
                </div>
              </div>

              <div style={{ background: "#0A192F", padding: 14, borderRadius: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>REPARTO ECOTOKENS</span>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Mi Ganancia de Recolector</span>
                    <strong style={{ color: "var(--green)" }}>
                      +{getEcoTokenDistribution(selectedBatch).collectorShare.toFixed(1)} ECO
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Hogares Vinculados ({getEcoTokenDistribution(selectedBatch).houseCount})</span>
                    <strong>
                      +{getEcoTokenDistribution(selectedBatch).householdShareTotal.toFixed(1)} ECO (total)
                    </strong>
                  </div>
                  {getEcoTokenDistribution(selectedBatch).houseCount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: 11, paddingLeft: 12 }}>
                      <span>Por cada hogar:</span>
                      <span>+{getEcoTokenDistribution(selectedBatch).householdShareEach.toFixed(1)} ECO</span>
                    </div>
                  )}
                  <hr style={{ border: "none", borderTop: "1px solid #1E293B", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Total Emitido en Arbitrum</span>
                    <span>{getEcoTokenDistribution(selectedBatch).total.toFixed(1)} ECO</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "#0A192F", padding: 14, borderRadius: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>TRAZABILIDAD ON-CHAIN</span>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Estado en Blockchain</span>
                    <strong style={{ color: selectedBatch.status === "RECEIVED" ? "#10B981" : "#F59E0B" }}>
                      {selectedBatch.status === "RECEIVED" ? "MINADO Y VERIFICADO" : "PENDIENTE DE RECEPCIÓN"}
                    </strong>
                  </div>

                  {selectedBatch.status === "RECEIVED" && selectedBatch.trace?.txHash ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span>IPFS Metadata CID</span>
                        <span className="mono" style={{ fontSize: 11, color: "#94A3B8" }}>
                          {selectedBatch.trace.ipfsCid?.slice(0, 10)}...
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Transacción Stellar</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${selectedBatch.trace.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#06B6D4",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            textDecoration: "underline",
                            fontWeight: 600,
                          }}
                        >
                          <span>Ver en Stellar Expert</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>
                      La evidencia en blockchain se emite automáticamente cuando el Centro de Acopio confirma la recepción física y pesa el lote.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBatch(null)}
              className="btn"
              style={{ width: "100%", marginTop: 16, padding: "12px", background: "#1E293B", border: "none", color: "#F8FAFC", borderRadius: 12, cursor: "pointer" }}
            >
              Cerrar detalles
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
