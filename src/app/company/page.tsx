"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { fetchCertificates, fetchIncomingB2bTransfers, receiveB2bTransfer, fetchSales } from "@/lib/api";
import { ShieldCheck, ArrowUpRight, Award, RefreshCw, CheckCircle2, ExternalLink, Hash, Package } from "lucide-react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function ipfsLink(cid: string): string {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

function formatMaterials(materials: Record<string, number> | null | undefined): string {
  if (!materials || Object.keys(materials).length === 0) return "—";
  return Object.entries(materials).map(([m, kg]) => `${Number(kg).toFixed(1)} kg ${m}`).join(" · ");
}

function totalKgFromMaterials(materials: Record<string, number> | null | undefined): number {
  if (!materials) return 0;
  return Object.values(materials).reduce((s, v) => s + Number(v), 0);
}

export default function B2bCompanyPage() {
  const { token } = useAuth();

  const [certificates, setCertificates] = useState<any[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<any[]>([]);
  const [purchasesHistory, setPurchasesHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [certs, incoming, purchases] = await Promise.all([
        fetchCertificates(),
        fetchIncomingB2bTransfers(),
        fetchSales().catch(() => []),
      ]);
      setCertificates(certs || []);
      setIncomingTransfers(incoming || []);
      setPurchasesHistory(purchases || []);
    } catch (err: any) {
      showToast("Error al cargar datos", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTransfer = async (transferId: string) => {
    setReceivingId(transferId);
    try {
      const cert = await receiveB2bTransfer(transferId);
      showToast("Lote Recibido", "success", "Se ha emitido el certificado ESG en blockchain.");
      setSelectedCert(cert);
      loadData();
    } catch (err: any) {
      showToast("Error al recibir lote", "error", err.response?.data?.message || err.message);
    } finally {
      setReceivingId(null);
    }
  };

  const totalKg = certificates.reduce((sum, c) => sum + (c.esgImpact?.recycledKg || 0), 0);
  
  let totalCo2 = 0;
  let totalWater = 0;

  certificates.forEach((c) => {
    const kg = c.esgImpact?.recycledKg || 0;
    const material = (c.esgImpact?.recycledMaterial || "").toUpperCase();
    
    let co2Factor = 1.5; // PET factor
    let waterFactor = 10; // PET factor
    
    if (material.includes("ALUMINIO")) {
      co2Factor = 9.0;
      waterFactor = 50;
    } else if (material.includes("VIDRIO")) {
      co2Factor = 0.3;
      waterFactor = 5;
    } else if (material.includes("PAPEL") || material.includes("CARTON")) {
      co2Factor = 0.9;
      waterFactor = 15;
    }
    
    totalCo2 += kg * co2Factor;
    totalWater += kg * waterFactor;
  });

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Resumen corporativo"
        title="Tu impacto, respaldado por datos"
        description="Resultados ambientales y trazabilidad verificados on-chain e IPFS."
        action={
          <button onClick={loadData} className="btn secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={16} />
            <span>Refrescar Panel</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <Kpi label="MATERIAL RECUPERADO" value={`${totalKg.toFixed(1)} kg`} trend="Stock verificado on-chain" accent="var(--green)" />
        <Kpi label="CO₂ EVITADO" value={`${totalCo2.toFixed(1)} kg`} trend="Equivalente en huella" accent="var(--blue)" />
        <Kpi label="AGUA AHORRADA" value={`${totalWater.toFixed(1)} L`} trend="Consumo neto evitado" accent="var(--blue)" />
        <Kpi label="CERTIFICADOS ACTIVOS" value={`${certificates.length}`} trend="100% auditable" accent="var(--amber)" />
      </div>

      <div className="grid split" style={{ marginBottom: 24 }}>
        {/* Envíos en Tránsito */}
        <section className="card">
          <div className="section-title">
            <h2>Envíos en Tránsito (B2B)</h2>
            <span className="live">{incomingTransfers.length} en camino</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>Cargando envíos...</div>
          ) : incomingTransfers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>
              No tienes ningún envío de material en tránsito en este momento.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {incomingTransfers.map((t: any) => {
                const mats = t.materials as Record<string, number> | null;
                const totalW = totalKgFromMaterials(mats);
                return (
                  <div key={t.id} style={{ background: "#0A192F", border: "1px solid #1E293B", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span className="status IN_TRANSIT" style={{ fontSize: 9 }}>EN TRÁNSITO</span>
                          <strong style={{ color: "#F8FAFC", fontSize: 13 }}>{totalW.toFixed(1)} kg totales</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>
                          Despachado por: <span style={{ color: "#F8FAFC" }}>{t.center?.email?.split("@")[0]?.toUpperCase() || "Acopio"}</span>
                        </div>
                        {/* Desglose de materiales */}
                        {mats && Object.entries(mats).map(([mat, kg]) => (
                          <div key={mat} style={{ fontSize: 11, color: "#94A3B8" }}>
                            <span style={{ color: "#CBD5E1" }}>{mat}:</span> <strong style={{ color: "#10B981" }}>{Number(kg).toFixed(1)} kg</strong>
                          </div>
                        ))}
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                          {new Date(t.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReceiveTransfer(t.id)}
                        disabled={receivingId === t.id}
                        className="btn primary"
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "10px 14px", whiteSpace: "nowrap" }}
                      >
                        <CheckCircle2 size={15} />
                        <span>{receivingId === t.id ? "Procesando..." : "Confirmar Recepción"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Historial de Compras */}
        <section className="card">
          <div className="section-title"><h2>Últimas Adquisiciones</h2></div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>Cargando compras...</div>
          ) : purchasesHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>
              No has realizado compras de material aún.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {purchasesHistory.slice(0, 4).map((p: any) => {
                const mats = p.materials as Record<string, number> | null;
                return (
                  <div key={p.id} style={{ background: "#0A192F", border: "1px solid #1E293B", borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                          {totalKgFromMaterials(mats).toFixed(1)} kg
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>
                          {formatMaterials(mats)}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                          Origen: {p.center?.email?.split("@")[0]?.toUpperCase() || "Acopio"} · {new Date(p.createdAt).toLocaleDateString("es-PE")}
                        </div>
                      </div>
                      <span className="status COMPLETED" style={{ fontSize: 9, whiteSpace: "nowrap" }}>RECIBIDO</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Certificados ESG con enlaces blockchain ── */}
      <section className="card">
        <div className="section-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} style={{ color: "#10B981" }} />
            Certificados Verdes Activos — Evidencia Blockchain
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}>Cargando certificados...</div>
        ) : certificates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}>
            No se han emitido certificados para tu cuenta todavía.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>CERT ID</th>
                  <th>FECHA EMISIÓN</th>
                  <th>MATERIAL / PESO</th>
                  <th>CO₂ EVITADO</th>
                  <th>IPFS METADATA</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c: any) => {
                  const ipfsUrl = c.ipfsHash ? ipfsLink(c.ipfsHash) : null;
                  return (
                    <tr key={c.id}>
                      <td className="mono" style={{ fontSize: 11 }}>#{c.id.slice(0, 8)}</td>
                      <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(c.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td>
                        <strong style={{ color: "#10B981" }}>{c.esgImpact?.recycledKg?.toFixed(1)} kg</strong>
                        <span style={{ color: "#64748B", fontSize: 10, marginLeft: 4 }}>de {c.esgImpact?.recycledMaterial}</span>
                      </td>
                      <td style={{ color: "#3B82F6", fontSize: 12 }}>{c.esgImpact?.co2SavedKg?.toFixed(1)} kg CO₂</td>
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
                      <td>
                        <button onClick={() => setSelectedCert(c)} className="btn"
                          style={{ padding: "6px 12px", fontSize: 12, background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Award size={13} /><span>Ver Certificado</span>
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

      {/* ── Modal de Certificado ESG ── */}
      {selectedCert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,25,47,0.9)", backdropFilter: "blur(10px)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#112240", border: "1px solid #1E293B", borderRadius: 24, padding: 30, maxWidth: 520, width: "100%", boxShadow: "0 0 60px rgba(16,185,129,0.2)", borderTop: "5px solid #10B981", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "grid", placeItems: "center", margin: "0 auto 14px", border: "2px solid rgba(16,185,129,0.4)", boxShadow: "0 0 20px rgba(16,185,129,0.2)" }}>
                <Award size={32} style={{ color: "#10B981" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "#F8FAFC" }}>CERTIFICADO DE IMPACTO ESG</h3>
              <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>ID: {selectedCert.id}</span>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #1E293B", margin: "16px 0" }} />

            <div style={{ display: "grid", gap: 10, fontSize: 13, background: "#0A192F", padding: 18, borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>Material Recuperado</span>
                <strong style={{ color: "#10B981" }}>
                  {selectedCert.esgImpact?.recycledKg?.toFixed(1)} kg de {selectedCert.esgImpact?.recycledMaterial}
                </strong>
              </div>
              {selectedCert.esgImpact?.materialsBreakdown && Object.entries(selectedCert.esgImpact.materialsBreakdown).map(([m, kg]: any) => (
                <div key={m} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12, borderLeft: "2px solid #1E293B" }}>
                  <span style={{ color: "#64748B" }}>{m}</span>
                  <span style={{ color: "#CBD5E1" }}>{Number(kg).toFixed(1)} kg</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>Emisiones de CO₂ Evitadas</span>
                <strong style={{ color: "var(--blue)" }}>{selectedCert.esgImpact?.co2SavedKg?.toFixed(1)} kg CO₂</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>Consumo de Agua Ahorrado</span>
                <strong style={{ color: "var(--blue)" }}>{selectedCert.esgImpact?.waterSavedLiters?.toFixed(0)} L H₂O</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>Fecha de Emisión</span>
                <strong>{new Date(selectedCert.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              </div>
            </div>

            {/* Evidencias Blockchain */}
            <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
              {/* IPFS */}
              <div style={{ background: "#0A192F", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <Hash size={11} /> IPFS METADATA
                </div>
                {selectedCert.ipfsHash ? (
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#06B6D4", wordBreak: "break-all", marginBottom: 10 }}>
                      {selectedCert.ipfsHash}
                    </div>
                    <a href={ipfsLink(selectedCert.ipfsHash)} target="_blank" rel="noreferrer"
                      className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid #06B6D4", color: "#06B6D4", borderRadius: 8, textDecoration: "none" }}>
                      <ExternalLink size={12} /> Ver metadata en IPFS
                    </a>
                  </div>
                ) : (
                  <div style={{ color: "#475569", fontSize: 12 }}>CID IPFS no disponible</div>
                )}
              </div>

              {/* Stellar — los certificados ESG no tienen txHash propio, pero se puede navegar */}
              <div style={{ background: "#0A192F", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 8 }}>⬡ RED STELLAR TESTNET</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>
                  Este certificado está anclado en la red Stellar Testnet. Puedes verificar la actividad del contrato o buscar el hash en el explorador.
                </div>
                <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer"
                  className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 14px", background: "rgba(59,130,246,0.1)", border: "1px solid #3B82F6", color: "#3B82F6", borderRadius: 8, textDecoration: "none" }}>
                  <ExternalLink size={12} /> Abrir Stellar Expert
                </a>
              </div>
            </div>

            <button onClick={() => setSelectedCert(null)} className="btn"
              style={{ width: "100%", padding: 12, background: "#1E293B", border: "none", color: "#F8FAFC", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>
              Cerrar Certificado
            </button>
          </div>
        </div>
      )}
    </>
  );
}
