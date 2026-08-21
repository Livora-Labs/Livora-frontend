"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCollectionRequests } from "@/lib/api";
import { CollectionRequest } from "@/lib/types";
import { Shell, PageHead, Status } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ArrowLeft, ExternalLink, Calendar, Info, Search, ShieldCheck } from "lucide-react";

export default function HogarHistorialPage() {
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReq, setSelectedReq] = useState<CollectionRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchCollectionRequests();
      setRequests(data);
    } catch (err: any) {
      showToast("Error al cargar historial", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === "ALL" || req.status === filterStatus;
    const desc = req.description?.toLowerCase() || "";
    const materials = Object.keys(req.itemsEstimated || {}).join(" ").toLowerCase();
    const matchesSearch = desc.includes(searchQuery.toLowerCase()) || materials.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getEcoTokenDistribution = (req: CollectionRequest) => {
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
    Object.entries(req.itemsEstimated || {}).forEach(([mat, wt]) => {
      const rate = rates[mat.toUpperCase()] || 5;
      total += wt * rate;
    });
    return {
      total,
      householdShare: total * 0.8,
      collectorShare: total * 0.2,
    };
  };

  return (
    <Shell role="hogar">
      <ToastContainer />
      <PageHead
        eyebrow="Historial de reciclaje"
        title="Mis Solicitudes Históricas"
        description="Explora todas tus entregas, la trazabilidad del blockchain y los EcoTokens distribuidos."
        action={
          <Link href="/hogar" className="btn" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} />
            <span>Volver al panel</span>
          </Link>
        }
      />

      <div className="toolbar" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="search" style={{ flex: 1, minWidth: 200, position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: "#94A3B8" }} />
          <input
            placeholder="Buscar por notas o material..."
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
          <option value="PENDING">Pendientes</option>
          <option value="ACCEPTED">Aceptados</option>
          <option value="COMPLETED">Completados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      <section className="card">
        <div className="section-title">
          <h2>Listado de solicitudes</h2>
          <span className="live">{filteredRequests.length} operaciones encontradas</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Cargando datos...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
            No hay datos disponibles para el criterio seleccionado.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>ESTIMACIÓN</th>
                  <th>NOTAS / DESCRIPCIÓN</th>
                  <th>ESTADO</th>
                  <th>ECOTOKENS</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const dist = getEcoTokenDistribution(req);
                  const totalKg = Object.values(req.itemsEstimated || {}).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={req.id}>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong>{totalKg.toFixed(1)} kg</strong>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>
                          {Object.entries(req.itemsEstimated || {})
                            .map(([k, v]) => `${k}: ${v}kg`)
                            .join(", ")}
                        </div>
                      </td>
                      <td>{req.description}</td>
                      <td>
                        <Status value={req.status} />
                      </td>
                      <td>
                        <span style={{ color: "var(--green)", fontWeight: 700 }}>+{dist.householdShare.toFixed(1)} ECO</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedReq(req)}
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
      {selectedReq && (
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
                <ShieldCheck size={20} style={{ color: "#10B981" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Distribución y Trazabilidad Web3</h3>
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 14, fontSize: 13 }}>
              <div style={{ background: "#0A192F", padding: 14, borderRadius: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>MATERIAL ESTIMADO</span>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: "#F8FAFC" }}>
                  {Object.entries(selectedReq.itemsEstimated || {})
                    .map(([k, v]) => `${v} kg de ${k}`)
                    .join(" + ") || "Sin registrar"}
                </div>
              </div>

              <div style={{ background: "#0A192F", padding: 14, borderRadius: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>REPARTO DE RECOMPENSAS ECOTOKEN</span>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Participación del Hogar (80%)</span>
                    <strong style={{ color: "#10B981" }}>+{getEcoTokenDistribution(selectedReq).householdShare.toFixed(1)} ECO</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Participación del Recolector (20%)</span>
                    <strong style={{ color: "#3B82F6" }}>+{getEcoTokenDistribution(selectedReq).collectorShare.toFixed(1)} ECO</strong>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid #1E293B", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Generado Total Lote</span>
                    <span>{getEcoTokenDistribution(selectedReq).total.toFixed(1)} ECO</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "#0A192F", padding: 14, borderRadius: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>EVIDENCIA DE SMART CONTRACTS</span>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Estado del registro</span>
                    <strong style={{ color: selectedReq.status === "COMPLETED" ? "#10B981" : "#F59E0B" }}>
                      {selectedReq.status === "COMPLETED" ? "MINADO Y VERIFICADO" : "PENDIENTE DE RECEPCIÓN"}
                    </strong>
                  </div>
                  
                  {selectedReq.status === "COMPLETED" && (selectedReq as any).batch?.trace?.txHash ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span>Manifiesto IPFS CID</span>
                        <span className="mono" style={{ fontSize: 11, color: "#94A3B8" }}>
                          {(selectedReq as any).batch?.trace?.ipfsCid?.slice(0, 10)}...
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Explorador Blockchain</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${(selectedReq as any).batch?.trace?.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#10B981",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            textDecoration: "underline",
                            fontWeight: 600,
                          }}
                        >
                          <span>Stellar Expert</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>
                      La evidencia criptográfica se emitirá cuando el Centro de Acopio pese industrialmente el lote.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedReq(null)}
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
