"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { fetchBatches, fetchCertificates } from "@/lib/api";
import { ExternalLink, ShieldCheck, Hash, RefreshCw, Package, Eye, X } from "lucide-react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function ipfsLink(cid: string) {
  if (!cid) return null;
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

export default function AdminPage() {
  const { token } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [batchData, certData] = await Promise.all([
        fetchBatches({ limit: 50 }),
        fetchCertificates().catch(() => []),
      ]);
      setBatches(batchData || []);
      setCertificates(certData || []);
    } catch (err: any) {
      showToast("Error al cargar datos", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const receivedBatches = batches.filter(b => b.status === "RECEIVED");
  const transitBatches = batches.filter(b => b.status === "IN_TRANSIT");
  const totalKg = receivedBatches.reduce((sum: number, b: any) =>
    sum + Object.values(b.materialsActual || {}).reduce((s: number, v: any) => s + Number(v), 0), 0);

  const statusColor: Record<string, string> = {
    RECEIVED: "#10B981",
    IN_TRANSIT: "#3B82F6",
    PROCESSING: "#F59E0B",
    OPEN: "#64748B",
  };

  return (
    <Shell role="admin">
      <ToastContainer />
      <PageHead
        eyebrow="Vista general del sistema"
        title="Panel de Administración"
        description="Auditoría completa de la cadena de reciclaje con evidencias digitales verificadas on-chain e IPFS."
        action={
          <button onClick={loadData} disabled={loading} className="btn ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refrescar</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <Kpi label="MATERIAL RECUPERADO" value={`${totalKg.toFixed(0)} kg`} trend="Total verificado on-chain" accent="var(--green)" />
        <Kpi label="LOTES TRAZADOS" value={`${receivedBatches.length}`} trend="Con evidencia blockchain" accent="var(--blue)" />
        <Kpi label="EN TRÁNSITO" value={`${transitBatches.length}`} trend="Camiones en ruta" accent="var(--amber)" />
        <Kpi label="CERTIFICADOS ESG" value={`${certificates.length}`} trend="100% auditables" />
      </div>

      {/* ── Tabla de lotes ── */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={18} style={{ color: "#10B981" }} />
            Lotes Recibidos — Trazabilidad Completa
          </h2>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{receivedBatches.length} lotes</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Cargando lotes...</div>
        ) : receivedBatches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>No hay lotes recibidos aún.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>LOTE ID</th>
                  <th>FECHA</th>
                  <th>RECOLECTOR</th>
                  <th>CENTRO</th>
                  <th>MATERIALES</th>
                  <th>IPFS</th>
                  <th>STELLAR TX</th>
                  <th>ESTADO</th>
                  <th>DETALLE</th>
                </tr>
              </thead>
              <tbody>
                {receivedBatches.map((b: any) => {
                  const ipfsUrl = b.ipfsCid ? ipfsLink(b.ipfsCid) : null;
                  const stellarExplorerUrl = b.txHash ? `https://stellar.expert/explorer/testnet/tx/${b.txHash}` : null;
                  const totalBatchKg = Object.values(b.materialsActual || {}).reduce((s: number, v: any) => s + Number(v), 0);

                  return (
                    <tr key={b.id}>
                      <td className="mono" style={{ fontSize: 11 }}>#{b.id.slice(0, 8)}</td>
                      <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(b.updatedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td style={{ fontSize: 12 }}>{b.collector?.email?.split("@")[0] || "—"}</td>
                      <td style={{ fontSize: 12 }}>{b.destinationCenter?.email?.split("@")[0] || "—"}</td>
                      <td style={{ fontSize: 11 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {Object.entries(b.materialsActual || {}).map(([mat, kg]: any) => (
                            <span key={mat} style={{ color: "#CBD5E1" }}>{mat}: <strong style={{ color: "#10B981" }}>{Number(kg).toFixed(1)} kg</strong></span>
                          ))}
                          {totalBatchKg > 0 && <span style={{ color: "#64748B", fontSize: 10 }}>Total: {totalBatchKg.toFixed(1)} kg</span>}
                        </div>
                      </td>
                      <td>
                        {ipfsUrl ? (
                          <a href={ipfsUrl} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#06B6D4", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}
                            title={b.ipfsCid}>
                            <Hash size={11} />
                            {b.ipfsCid.replace("ipfs://", "").slice(0, 12)}...
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        {stellarExplorerUrl ? (
                          <a href={stellarExplorerUrl} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#3B82F6", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}
                            title={b.txHash}>
                            {b.txHash.slice(0, 12)}...
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ background: `${statusColor[b.status]}22`, color: statusColor[b.status], padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setSelectedBatch(b)} className="btn ghost"
                          style={{ padding: "5px 10px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Eye size={12} /> Ver
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

      {/* ── Tabla de Certificados ESG ── */}
      <section className="card">
        <div className="section-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} style={{ color: "#10B981" }} />
            Certificados ESG — Registro Blockchain
          </h2>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{certificates.length} certificados</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}>Cargando certificados...</div>
        ) : certificates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}>No hay certificados emitidos.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>CERT ID</th>
                  <th>FECHA</th>
                  <th>EMPRESA</th>
                  <th>MATERIAL / KG</th>
                  <th>CO₂ EVITADO</th>
                  <th>IPFS METADATA</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c: any) => {
                  const ipfsUrl = c.ipfsHash ? ipfsLink(c.ipfsHash) : null;
                  return (
                    <tr key={c.id}>
                      <td className="mono" style={{ fontSize: 11 }}>#{c.id.slice(0, 8)}</td>
                      <td style={{ fontSize: 11 }}>
                        {new Date(c.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td style={{ fontSize: 12 }}>{c.buyer?.email?.split("@")[0] || "—"}</td>
                      <td style={{ fontSize: 12 }}>
                        <strong style={{ color: "#10B981" }}>{c.esgImpact?.recycledKg?.toFixed(1)} kg</strong>
                        <span style={{ color: "#64748B", fontSize: 10, marginLeft: 4 }}>de {c.esgImpact?.recycledMaterial}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#3B82F6" }}>{c.esgImpact?.co2SavedKg?.toFixed(1)} kg CO₂</td>
                      <td>
                        {ipfsUrl ? (
                          <a href={ipfsUrl} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#06B6D4", fontSize: 11, fontFamily: "monospace", textDecoration: "none" }}
                            title={c.ipfsHash}>
                            <Hash size={11} />
                            {c.ipfsHash?.replace("ipfs://", "").slice(0, 12)}...
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                          {c.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Detalle de Lote */}
      {selectedBatch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,25,47,0.9)", backdropFilter: "blur(10px)", display: "grid", placeItems: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#112240", border: "1px solid #1E293B", borderRadius: 20, padding: 28, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} style={{ color: "#10B981" }} />
                Trazabilidad Completa — Lote #{selectedBatch.id.slice(0, 8)}
              </h3>
              <button onClick={() => setSelectedBatch(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
              {/* ID Completo */}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>BATCH ID (UUID)</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#06B6D4", wordBreak: "break-all" }}>{selectedBatch.id}</div>
              </div>

              {/* Actores */}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8 }}>ACTORES INVOLUCRADOS</div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div><span style={{ color: "#64748B" }}>Recolector: </span><strong>{selectedBatch.collector?.email}</strong></div>
                  {selectedBatch.destinationCenter && <div><span style={{ color: "#64748B" }}>Centro de Acopio: </span><strong>{selectedBatch.destinationCenter.email}</strong></div>}
                  {(selectedBatch.requests || []).length > 0 && (
                    <div><span style={{ color: "#64748B" }}>Solicitudes de Hogar: </span><strong>{selectedBatch.requests.length}</strong></div>
                  )}
                </div>
              </div>

              {/* Materiales */}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8 }}>COMPOSICIÓN DE MATERIALES</div>
                {Object.entries(selectedBatch.materialsActual || {}).map(([mat, kg]: any) => (
                  <div key={mat} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#CBD5E1" }}>{mat}</span>
                    <strong style={{ color: "#10B981" }}>{Number(kg).toFixed(2)} kg</strong>
                  </div>
                ))}
              </div>

              {/* IPFS */}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <Hash size={11} /> IPFS — METADATA DEL LOTE
                </div>
                {selectedBatch.ipfsCid ? (
                  <>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#06B6D4", wordBreak: "break-all", marginBottom: 10 }}>
                      {selectedBatch.ipfsCid}
                    </div>
                    <a href={ipfsLink(selectedBatch.ipfsCid)!} target="_blank" rel="noreferrer"
                      className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid #06B6D4", color: "#06B6D4", borderRadius: 8, textDecoration: "none" }}>
                      <ExternalLink size={12} /> Ver en IPFS Gateway
                    </a>
                  </>
                ) : (
                  <div style={{ color: "#475569", fontSize: 12 }}>IPFS CID no disponible — lote anterior a la integración.</div>
                )}
              </div>

              {/* Stellar */}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  ⬡ STELLAR TESTNET — TX HASH
                </div>
                {selectedBatch.txHash ? (
                  <>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3B82F6", wordBreak: "break-all", marginBottom: 10 }}>
                      {selectedBatch.txHash}
                    </div>
                    <a href={`https://stellar.expert/explorer/testnet/tx/${selectedBatch.txHash}`} target="_blank" rel="noreferrer"
                      className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 14px", background: "rgba(59,130,246,0.1)", border: "1px solid #3B82F6", color: "#3B82F6", borderRadius: 8, textDecoration: "none" }}>
                      <ExternalLink size={12} /> Ver en Stellar Expert
                    </a>
                  </>
                ) : (
                  <div style={{ color: "#475569", fontSize: 12 }}>Tx Hash no disponible — lote anterior a la integración.</div>
                )}
              </div>

              {/* Timeline */}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8 }}>TIMELINE</div>
                <div style={{ display: "grid", gap: 4, fontSize: 11 }}>
                  <div><span style={{ color: "#64748B" }}>Creado: </span>{new Date(selectedBatch.createdAt).toLocaleString("es-PE")}</div>
                  <div><span style={{ color: "#64748B" }}>Última actualización: </span>{new Date(selectedBatch.updatedAt).toLocaleString("es-PE")}</div>
                </div>
              </div>
            </div>

            <button onClick={() => setSelectedBatch(null)} className="btn"
              style={{ width: "100%", marginTop: 16, padding: 12, background: "#1E293B", border: "none", color: "#F8FAFC", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
