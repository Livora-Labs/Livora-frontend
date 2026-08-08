"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { receiveBatch, fetchReceptionPin, refreshReceptionPin, fetchIncomingBatches, fetchProcessingBatches, fetchReceivedBatches, fetchInventory, fetchB2bCompanies, createB2bTransfer } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Batch } from "@/lib/types";
import { Scale, Truck, Cpu, RefreshCw, Factory, ShieldCheck, ArrowUpRight, ListFilter, Eye, Plus, Trash2, Package, ExternalLink, Users, Clock, Hash } from "lucide-react";

interface MaterialLine { material: string; weightKg: number; }

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
function ipfsLink(cid: string): string {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

export default function CentroAcopioPage() {
  const { token } = useAuth();

  const [transitBatches, setTransitBatches] = useState<Batch[]>([]);
  const [processingBatches, setProcessingBatches] = useState<Batch[]>([]);
  const [completedBatches, setCompletedBatches] = useState<Batch[]>([]);
  const [loadingTransit, setLoadingTransit] = useState(true);

  // Batch detail modal state
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<Batch | null>(null);

  // Inventory and B2B Transfers State
  const [inventory, setInventory] = useState<any[]>([]);
  const [b2bCompanies, setB2bCompanies] = useState<any[]>([]);
  const [selectedMaterialForTrace, setSelectedMaterialForTrace] = useState<string | null>(null);

  // B2B Sale Form State — multi-material
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleBuyerId, setSaleBuyerId] = useState("");
  const [saleLines, setSaleLines] = useState<MaterialLine[]>([{ material: "PET", weightKg: 0 }]);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Scale Modal State
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [petWeight, setPetWeight] = useState<number>(0);
  const [hdpeWeight, setHdpeWeight] = useState<number>(0);
  const [cartonWeight, setCartonWeight] = useState<number>(0);
  const [submittingScale, setSubmittingScale] = useState(false);

  // Blockchain Processing Animation State
  const [isBlockchainProcessing, setIsBlockchainProcessing] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string>("");

  // Reception PIN state
  const [pin, setPin] = useState("");
  const [refreshingPin, setRefreshingPin] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadPin();
    loadTransitBatches();
    loadInventory();
    loadB2bCompanies();

    const socket = getSocket(token || undefined);
    socket.on("batch:completed", (data: any) => {
      const completedId = data.batchId;
      showToast("Lote Procesado en Blockchain", "success", `Lote #${completedId?.slice(0, 8) || "01"} liquidado.`);
      setProcessingBatches((prev) => {
        const found = prev.find(b => b.id === completedId);
        if (found) {
          const finalizedBatch = {
            ...found,
            status: "RECEIVED" as const,
            ipfsCid: data.ipfsCid || undefined,
            txHash: data.txHash || undefined,
          };
          setCompletedBatches((old) => [finalizedBatch, ...old]);
        }
        return prev.filter(b => b.id !== completedId);
      });
      loadPin();
      loadTransitBatches();
      loadInventory();
    });

    return () => { socket.off("batch:completed"); };
  }, [token]);

  useEffect(() => {
    if (!token || processingBatches.length === 0) return;
    const interval = setInterval(() => {
      loadTransitBatches();
      loadInventory();
    }, 4500);
    return () => clearInterval(interval);
  }, [processingBatches.length, token]);

  const loadInventory = async () => {
    if (!token) return;
    try { const data = await fetchInventory(); setInventory(data || []); }
    catch (err: any) { showToast("Error al cargar inventario", "error", err.message); }
  };

  const loadB2bCompanies = async () => {
    if (!token) return;
    try {
      const data = await fetchB2bCompanies();
      setB2bCompanies(data || []);
      if (data && data.length > 0) setSaleBuyerId(data[0].id);
    } catch (err: any) { showToast("Error al cargar empresas B2B", "error", err.message); }
  };

  const loadPin = async () => {
    if (!token) return;
    try { const data = await fetchReceptionPin(); if (data.receptionPin) setPin(data.receptionPin); }
    catch (err: any) { showToast("Error al cargar PIN", "error", err.message); }
  };

  const loadTransitBatches = async () => {
    if (!token) return;
    setLoadingTransit(true);
    try {
      const [transitData, processingData, receivedData] = await Promise.all([
        fetchIncomingBatches(),
        fetchProcessingBatches(),
        fetchReceivedBatches(),
      ]);
      setTransitBatches(transitData || []);
      setProcessingBatches(processingData || []);
      setCompletedBatches(receivedData || []);
    } catch (err: any) { showToast("Error al cargar lotes", "error", err.message); }
    finally { setLoadingTransit(false); }
  };

  const handleRefreshPin = async () => {
    setRefreshingPin(true);
    try {
      const data = await refreshReceptionPin();
      if (data.receptionPin) setPin(data.receptionPin);
      showToast("PIN Actualizado", "success", `Nuevo PIN: ${data.receptionPin}`);
    } catch (err: any) { showToast("Error al regenerar PIN", "error", err.message); }
    finally { setRefreshingPin(false); }
  };

  const handleOpenScale = (batch: Batch) => {
    setSelectedBatch(batch);
    setPetWeight(batch.materialsActual?.PET || 0);
    setHdpeWeight(batch.materialsActual?.HDPE || 0);
    setCartonWeight(batch.materialsActual?.CARTON || 0);
  };

  const handleConfirmWeighing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setSubmittingScale(true);
    const materialsActual = { PET: petWeight, HDPE: hdpeWeight, CARTON: cartonWeight };
    try {
      const res = await receiveBatch(selectedBatch.id, materialsActual);
      setSubmittingScale(false);
      setIsBlockchainProcessing(true);
      setProcessingJobId(res.transactionJobId || "job-" + Date.now());
      const movedBatch: Batch = {
        ...selectedBatch, status: "PROCESSING", materialsActual,
        trace: { ipfsCid: "", txHash: "", jobId: res.transactionJobId || "job-" + Date.now(), processedAt: new Date().toISOString() },
      };
      setTransitBatches((prev) => prev.filter((b) => b.id !== selectedBatch.id));
      setProcessingBatches((prev) => [movedBatch, ...prev]);
      setSelectedBatch(null);
      setTimeout(() => { setIsBlockchainProcessing(false); showToast("HTTP 202 Accepted", "success", "Lote en cola de blockchain."); }, 2500);
    } catch (err: any) { setSubmittingScale(false); showToast("Error en pesaje", "error", err.response?.data?.message || err.message); }
  };

  // Multi-material sale form handlers
  const addSaleLine = () => setSaleLines(prev => [...prev, { material: "HDPE", weightKg: 0 }]);
  const removeSaleLine = (idx: number) => setSaleLines(prev => prev.filter((_, i) => i !== idx));
  const updateSaleLine = (idx: number, field: keyof MaterialLine, value: string | number) => {
    setSaleLines(prev => prev.map((line, i) => i === idx ? { ...line, [field]: value } : line));
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = saleLines.filter(l => l.weightKg > 0);
    if (!saleBuyerId || validLines.length === 0) {
      showToast("Campos inválidos", "error", "Selecciona una empresa y agrega al menos un material con peso mayor a 0.");
      return;
    }
    setSubmittingSale(true);
    try {
      await createB2bTransfer({ buyerId: saleBuyerId, materials: validLines.map(l => ({ material: l.material.toUpperCase(), weightKg: l.weightKg })) });
      const summary = validLines.map(l => `${l.weightKg}kg ${l.material}`).join(", ");
      showToast("¡Envío Registrado!", "success", `Despachado: ${summary}`);
      setIsSaleModalOpen(false);
      setSaleLines([{ material: "PET", weightKg: 0 }]);
      loadInventory();
    } catch (err: any) { showToast("Error en venta", "error", err.response?.data?.message || err.message); }
    finally { setSubmittingSale(false); }
  };

  const inputStyle = { width: "100%", background: "#0A192F", border: "1px solid #1E293B", color: "#F8FAFC", padding: "10px 12px", borderRadius: 10, fontSize: 13, boxSizing: "border-box" as const };
  const selectStyle = { ...inputStyle };

  return (
    <Shell role="centro">
      <ToastContainer />
      <PageHead
        eyebrow="Dashboard industrial"
        title="Recepción y Báscula"
        description="Pesa los materiales recibidos por los recolectores y liquida las transacciones en blockchain."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleRefreshPin} disabled={refreshingPin} className="btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", color: "#10B981" }}>
              <RefreshCw size={14} />
              <span>PIN Báscula: {pin || "..."}</span>
            </button>
            <button onClick={loadTransitBatches} className="btn ghost" style={{ display: "grid", placeItems: "center", padding: 10 }}>
              <RefreshCw size={18} />
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <Kpi label="CAMIONES EN CAMINO" value={`${transitBatches.length}`} trend="Estado IN_TRANSIT" accent="var(--blue)" />
        <Kpi label="LOTES RECIBIDOS" value={`${completedBatches.length}`} trend="Procesados en blockchain" accent="var(--green)" />
        <Kpi label="PIN DE RECEPCIÓN" value={pin || "Cargando..."} trend="Requerido para pesaje" accent="var(--amber)" />
      </div>

      <div className="grid split">
        {/* Camiones en camino */}
        <section className="card">
          <div className="section-title"><h2>Camiones en Camino (IN_TRANSIT)</h2></div>
          {loadingTransit ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>Cargando camiones...</div>
          ) : transitBatches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>No hay camiones en traslado hacia este centro.</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {transitBatches.map((batch) => (
                <div key={batch.id} style={{ background: "#0A192F", border: "1px solid #1E293B", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className={`status ${batch.status}`} style={{ fontSize: 9 }}>{batch.status}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>Lote #{batch.id.slice(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>
                      Recolector: <strong style={{ color: "#F8FAFC" }}>{batch.collector?.email.split("@")[0]}</strong>
                    </div>
                    <small style={{ color: "#94A3B8", fontSize: 11 }}>
                      Carga Estimada: {Object.values(batch.materialsActual || {}).reduce((a, b) => Number(a) + Number(b), 0).toFixed(1)} kg
                    </small>
                  </div>
                  <button onClick={() => handleOpenScale(batch)} className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Scale size={16} /><span>Pesar Lote</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Columna Derecha: Inventario y B2B */}
        <div style={{ display: "grid", gap: 20 }}>
          <section className="card">
            <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Inventario de Materiales</h2>
              <button onClick={() => setIsSaleModalOpen(true)} className="btn primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12 }}>
                <ArrowUpRight size={14} /><span>Despachar a Empresa B2B</span>
              </button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}>
              {["PET", "HDPE", "CARTON", "VIDRIO", "ALUMINIO"].map((material) => {
                const item = inventory.find(i => i.materialType.toUpperCase() === material || (material === "CARTON" && i.materialType.toUpperCase() === "CARTÓN"));
                const stock = item?.quantityKg || 0;
                return (
                  <div key={material} onClick={() => { if (stock > 0) setSelectedMaterialForTrace(material); }}
                    style={{ background: "#0A192F", border: "1px solid #1E293B", borderRadius: 12, padding: 14, cursor: stock > 0 ? "pointer" : "default", position: "relative" }}>
                    <span className="eyebrow" style={{ fontSize: 10, color: "#94A3B8" }}>TOTAL {material}</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: stock > 0 ? "var(--green)" : "#94A3B8", marginTop: 4 }}>
                      {stock.toFixed(1)} kg
                    </div>
                    {stock > 0 && (
                      <span style={{ fontSize: 10, color: "#3B82F6", display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                        <Eye size={12} /><span>Ver trazabilidad</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Lotes en Procesamiento Blockchain */}
          {processingBatches.length > 0 && (
            <section className="card" style={{ border: "1px dashed #10B981" }}>
              <div className="section-title">
                <h2 style={{ color: "#10B981", display: "flex", alignItems: "center", gap: 8 }}>
                  <Cpu size={18} style={{ animation: "spin 2s linear infinite" }} />
                  <span>Procesando en Blockchain...</span>
                </h2>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {processingBatches.map((b) => (
                  <div key={b.id} style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, color: "#10B981" }}>Lote #{b.id.slice(0, 8)}</strong>
                      <span className="status PROCESSING" style={{ fontSize: 9 }}>MINANDO TX</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>
                      Pesaje Real: {Object.entries(b.materialsActual || {}).map(([k, v]) => `${v}kg ${k}`).join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Historial de Lotes Recibidos (compacto) */}
          <section className="card">
            <div className="section-title"><h2>Lotes Recibidos Recientemente</h2></div>
            {completedBatches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>No se han recibido lotes.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {completedBatches.slice(0, 4).map((b) => (
                  <div key={b.id} style={{ background: "#0A192F", border: "1px solid #1E293B", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: 13, color: "#10B981" }}>Lote #{b.id.slice(0, 8)}</strong>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                        {Object.entries(b.materialsActual || {}).map(([k, v]) => `${v}kg ${k}`).join(" · ")}
                      </div>
                    </div>
                    <button onClick={() => setSelectedBatchDetail(b)} className="btn ghost" style={{ fontSize: 11, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                      <Eye size={12} /><span>Trazabilidad</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ─── HISTORIAL COMPLETO DE LOTES RECIBIDOS ─── */}
      <section className="card" style={{ marginTop: 24 }}>
        <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} style={{ color: "#10B981" }} />
              Historial de Trazabilidad — Todos los Lotes Recibidos
            </h2>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>
              Registro completo de actores, materiales, fechas y pruebas on-chain por cada lote procesado en blockchain.
            </p>
          </div>
          <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981", border: "1px solid #10B981", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            {completedBatches.length} lotes
          </span>
        </div>

        {completedBatches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
            <Package size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>No hay lotes recibidos aún.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {completedBatches.map((b) => {
              const totalWeight = Object.values(b.materialsActual || {}).reduce((s, v) => s + Number(v), 0);
              const hasTx = !!(b.txHash);
              const hasIpfs = !!(b.ipfsCid);
              const householdEmails = b.requests?.map((r: any) => r.household?.email || r.householdId?.slice(0, 8)).filter(Boolean) || [];
              const uniqueHouseholds = [...new Set(householdEmails)];

              return (
                <div key={b.id} style={{ background: "#0A192F", border: `1px solid ${hasTx ? "rgba(16,185,129,0.4)" : "#1E293B"}`, borderRadius: 16, padding: 20, position: "relative" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ background: hasTx ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: hasTx ? "#10B981" : "#F59E0B", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                          {hasTx ? "✓ VERIFICADO EN BLOCKCHAIN" : "⚙ PROCESADO"}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>#{b.id}</span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#F8FAFC" }}>
                        {totalWeight.toFixed(2)} kg totales
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <Clock size={11} />
                        {new Date(b.updatedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        {new Date(b.updatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    {/* Composición de Materiales */}
                    <div style={{ background: "#112240", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>COMPOSICIÓN FÍSICA</div>
                      {Object.entries(b.materialsActual || {}).length === 0 ? (
                        <div style={{ color: "#64748B", fontSize: 12 }}>Sin datos de materiales</div>
                      ) : (
                        <div style={{ display: "grid", gap: 6 }}>
                          {Object.entries(b.materialsActual || {}).map(([mat, kg]) => (
                            <div key={mat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "#CBD5E1", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                                {mat}
                              </span>
                              <strong style={{ fontSize: 13, color: "#10B981" }}>{Number(kg).toFixed(1)} kg</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actores Involucrados */}
                    <div style={{ background: "#112240", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={11} /> ACTORES INVOLUCRADOS
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 11, color: "#CBD5E1" }}>
                          <span style={{ color: "#64748B" }}>Recolector: </span>
                          <strong>{b.collector?.email || b.collectorId?.slice(0, 12)}</strong>
                        </div>
                        {b.destinationCenter && (
                          <div style={{ fontSize: 11, color: "#CBD5E1" }}>
                            <span style={{ color: "#64748B" }}>Centro: </span>
                            <strong>{b.destinationCenter.email}</strong>
                          </div>
                        )}
                        {uniqueHouseholds.length > 0 && (
                          <div style={{ fontSize: 11, color: "#CBD5E1" }}>
                            <span style={{ color: "#64748B" }}>Hogares ({uniqueHouseholds.length}): </span>
                            <span style={{ fontSize: 10 }}>{uniqueHouseholds.slice(0, 2).join(", ")}{uniqueHouseholds.length > 2 ? ` +${uniqueHouseholds.length - 2} más` : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prueba On-Chain */}
                    <div style={{ background: "#112240", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                        <Hash size={11} /> PRUEBA ON-CHAIN
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {hasIpfs ? (
                          <div>
                            <div style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>IPFS CID</div>
                            <a
                              href={ipfsLink(b.ipfsCid!)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: "#06B6D4",
                                wordBreak: "break-all",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>{b.ipfsCid!.slice(0, 24)}...</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#F59E0B" }}>CID IPFS no disponible</div>
                        )}
                        {hasTx ? (
                          <div>
                            <div style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>TX HASH</div>
                            <a
                              href={`https://sepolia.arbiscan.io/tx/${b.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontFamily: "monospace", fontSize: 11, color: "#3B82F6", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, wordBreak: "break-all" }}
                            >
                              {b.txHash!.slice(0, 18)}...
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#F59E0B" }}>Tx Hash no disponible</div>
                        )}
                        {hasTx && (
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${b.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn"
                            style={{ fontSize: 11, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(59,130,246,0.1)", border: "1px solid #3B82F6", color: "#3B82F6", borderRadius: 8, textDecoration: "none" }}
                          >
                            <ExternalLink size={11} /> Ver en Arbiscan
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline de fechas */}
                  <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid #1E293B" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      <span style={{ color: "#94A3B8" }}>Creado: </span>
                      {new Date(b.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      <span style={{ color: "#94A3B8" }}>Recibido: </span>
                      {new Date(b.updatedAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {b.trace?.processedAt && (
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        <span style={{ color: "#94A3B8" }}>Blockchain: </span>
                        {new Date(b.trace.processedAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      <span style={{ color: "#94A3B8" }}>Solicitudes: </span>
                      {b.requests?.length || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Pesaje */}
      {selectedBatch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10, 25, 47, 0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#112240", border: "1px solid #1E293B", borderRadius: 20, padding: 26, maxWidth: 480, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Scale size={22} style={{ color: "#10B981" }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Pesaje en Báscula Industrial</h3>
              </div>
              <button onClick={() => setSelectedBatch(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>
              Lote <strong style={{ color: "#F8FAFC" }}>#{selectedBatch.id.slice(0, 8)}</strong> — Recolector: {selectedBatch.collector?.email}
            </p>
            <form onSubmit={handleConfirmWeighing} style={{ display: "grid", gap: 14 }}>
              {[["PET (Plástico)", petWeight, setPetWeight], ["HDPE (Plástico Rígido)", hdpeWeight, setHdpeWeight], ["Cartón / Papel", cartonWeight, setCartonWeight]].map(([label, val, setter]: any) => (
                <div key={String(label)} style={{ background: "#0A192F", padding: 12, borderRadius: 12 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>{label} (kg)</label>
                  <input type="number" step="0.1" min="0" value={val} onChange={(e) => setter(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", background: "#112240", border: "1px solid #1E293B", color: "#F8FAFC", padding: 10, borderRadius: 10, fontSize: 15, fontWeight: 700 }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setSelectedBatch(null)} style={{ flex: 1, background: "#1E293B", border: "none", color: "#F8FAFC", padding: 12, borderRadius: 12, cursor: "pointer" }}>Cancelar</button>
                {(() => {
                  const valid = petWeight > 0 || hdpeWeight > 0 || cartonWeight > 0;
                  return (
                    <button type="submit" disabled={submittingScale || !valid} style={{ flex: 1, background: valid ? "linear-gradient(135deg, #10B981, #059669)" : "#1E293B", border: "none", color: valid ? "#0A192F" : "#94A3B8", padding: 12, borderRadius: 12, cursor: valid ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 800, opacity: valid ? 1 : 0.5 }}>
                      {submittingScale ? "Procesando..." : "Confirmar y Liquidar Lote"}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Procesamiento Blockchain */}
      {isBlockchainProcessing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10, 25, 47, 0.92)", backdropFilter: "blur(12px)", display: "grid", placeItems: "center", zIndex: 200, padding: 20 }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid #10B981", display: "grid", placeItems: "center", margin: "0 auto 20px", boxShadow: "0 0 30px #10B981" }}>
              <Cpu size={36} style={{ color: "#10B981" }} />
            </div>
            <span style={{ fontSize: 11, background: "rgba(16,185,129,0.2)", color: "#10B981", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>HTTP 202 ACCEPTED</span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 6px" }}>Procesando en Blockchain</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>Generando hash IPFS, enviando transacción a Arbitrum Sepolia y liquidando EcoTokens...</p>
            <div style={{ fontSize: 11, color: "#06B6D4", fontFamily: "monospace", marginTop: 10 }}>Job ID: {processingJobId}</div>
          </div>
        </div>
      )}

      {/* Modal de Despacho B2B Multi-Material */}
      {isSaleModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10, 25, 47, 0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#112240", border: "1px solid #1E293B", borderRadius: 20, padding: 26, maxWidth: 540, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Factory size={22} style={{ color: "#10B981" }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Despacho a Empresa B2B</h3>
              </div>
              <button onClick={() => setIsSaleModalOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleConfirmSale} style={{ display: "grid", gap: 16 }}>
              {/* Empresa Destino */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6, fontWeight: 600 }}>Empresa B2B Destino</label>
                {b2bCompanies.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#EF4444" }}>No hay empresas B2B registradas.</div>
                ) : (
                  <select value={saleBuyerId} onChange={(e) => setSaleBuyerId(e.target.value)} style={selectStyle}>
                    {b2bCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.email}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Líneas de Material */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Materiales a Despachar</label>
                  <button type="button" onClick={addSaleLine} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(16,185,129,0.1)", border: "1px solid #10B981", color: "#10B981", padding: "4px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    <Plus size={12} /> Agregar Material
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {saleLines.map((line, idx) => {
                    const invItem = inventory.find(i => i.materialType.toUpperCase() === line.material.toUpperCase() || (line.material === "CARTON" && i.materialType.toUpperCase() === "CARTÓN"));
                    const maxStock = invItem?.quantityKg || 0;
                    const overStock = line.weightKg > maxStock && maxStock > 0;

                    return (
                      <div key={idx} style={{ background: "#0A192F", borderRadius: 12, padding: 14, border: overStock ? "1px solid #EF4444" : "1px solid #1E293B" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Material</label>
                            <select value={line.material} onChange={(e) => updateSaleLine(idx, "material", e.target.value)} style={{ ...selectStyle, padding: "8px 10px" }}>
                              {["PET", "HDPE", "CARTON", "VIDRIO", "ALUMINIO"].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                              Peso (kg) <span style={{ color: maxStock > 0 ? "#10B981" : "#64748B" }}>máx. {maxStock.toFixed(1)} kg</span>
                            </label>
                            <input type="number" step="0.1" min="0" max={maxStock || undefined} value={line.weightKg || ""} onChange={(e) => updateSaleLine(idx, "weightKg", parseFloat(e.target.value) || 0)}
                              style={{ ...inputStyle, padding: "8px 10px", border: overStock ? "1px solid #EF4444" : "1px solid #1E293B" }} />
                          </div>
                          {saleLines.length > 1 && (
                            <button type="button" onClick={() => removeSaleLine(idx)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #EF4444", color: "#EF4444", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {overStock && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>⚠ El peso supera el stock disponible ({maxStock.toFixed(1)} kg)</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen */}
              {saleLines.some(l => l.weightKg > 0) && (
                <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>RESUMEN DEL DESPACHO</div>
                  {saleLines.filter(l => l.weightKg > 0).map((l, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#CBD5E1" }}>{l.material}</span>
                      <strong style={{ color: "#10B981" }}>{l.weightKg.toFixed(1)} kg</strong>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(16,185,129,0.2)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: "#10B981" }}>{saleLines.filter(l => l.weightKg > 0).reduce((s, l) => s + l.weightKg, 0).toFixed(1)} kg</span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setIsSaleModalOpen(false)} style={{ flex: 1, background: "#1E293B", border: "none", color: "#F8FAFC", padding: 12, borderRadius: 12, cursor: "pointer", fontSize: 13 }}>
                  Cancelar
                </button>
                {(() => {
                  const valid = saleBuyerId && saleLines.some(l => l.weightKg > 0) && !saleLines.some(l => { const inv = inventory.find(i => i.materialType.toUpperCase() === l.material.toUpperCase()); return l.weightKg > 0 && l.weightKg > (inv?.quantityKg || 0); });
                  return (
                    <button type="submit" disabled={submittingSale || !valid} style={{ flex: 1, background: valid ? "linear-gradient(135deg, #10B981, #059669)" : "#1E293B", border: "none", color: valid ? "#0A192F" : "#94A3B8", padding: 12, borderRadius: 12, cursor: valid ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 800, opacity: valid ? 1 : 0.5 }}>
                      {submittingSale ? "Despachando..." : "Confirmar Despacho"}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Trazabilidad por Material */}
      {selectedMaterialForTrace && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10, 25, 47, 0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#112240", border: "1px solid #1E293B", borderRadius: 20, padding: 24, maxWidth: 550, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={20} style={{ color: "#10B981" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Trazabilidad de {selectedMaterialForTrace}</h3>
              </div>
              <button onClick={() => setSelectedMaterialForTrace(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>Lotes que aportaron al stock actual:</p>
            <div style={{ display: "grid", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
              {(() => {
                const materialBatches = completedBatches.filter((b) => {
                  const keys = Object.keys(b.materialsActual || {}).map(k => k.toUpperCase().trim());
                  return keys.includes(selectedMaterialForTrace.toUpperCase()) || (selectedMaterialForTrace.toUpperCase() === "CARTON" && keys.includes("CARTÓN"));
                });
                if (materialBatches.length === 0) return <div style={{ color: "#94A3B8", fontSize: 12, textAlign: "center" }}>No hay lotes con este material.</div>;
                return materialBatches.map((b) => {
                  const key = Object.keys(b.materialsActual || {}).find(k => k.toUpperCase().trim() === selectedMaterialForTrace.toUpperCase() || (selectedMaterialForTrace.toUpperCase() === "CARTON" && k.toUpperCase().trim() === "CARTÓN")) || "";
                  const weight = (b.materialsActual as any)[key] || 0;
                  return (
                    <div key={b.id} style={{ background: "#0A192F", border: "1px solid #1E293B", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Lote #{b.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                          {b.collector?.email} · {new Date(b.createdAt).toLocaleDateString("es-PE")}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <strong style={{ color: "#10B981" }}>+{Number(weight).toFixed(1)} kg</strong>
                        {b.txHash && (
                          <a href={`https://sepolia.arbiscan.io/tx/${b.txHash}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: 10, color: "#3B82F6", display: "inline-flex", alignItems: "center", gap: 2 }}>
                            <span>Arbitrum</span><ArrowUpRight size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <button onClick={() => setSelectedMaterialForTrace(null)} className="btn" style={{ width: "100%", marginTop: 16, padding: "12px", background: "#1E293B", border: "none", color: "#F8FAFC", borderRadius: 12, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Lote */}
      {selectedBatchDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10, 25, 47, 0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#112240", border: "1px solid #1E293B", borderRadius: 20, padding: 24, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} style={{ color: "#10B981" }} />
                Trazabilidad Completa — Lote #{selectedBatchDetail.id.slice(0, 8)}
              </h3>
              <button onClick={() => setSelectedBatchDetail(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>ID COMPLETO</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#06B6D4", wordBreak: "break-all" }}>{selectedBatchDetail.id}</div>
              </div>
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>MATERIALES</div>
                {Object.entries(selectedBatchDetail.materialsActual || {}).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{k}</span><strong style={{ color: "#10B981" }}>{Number(v).toFixed(1)} kg</strong>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>ACTORES</div>
                <div style={{ marginBottom: 4 }}><span style={{ color: "#94A3B8" }}>Recolector: </span>{selectedBatchDetail.collector?.email}</div>
                {selectedBatchDetail.destinationCenter && <div><span style={{ color: "#94A3B8" }}>Centro: </span>{selectedBatchDetail.destinationCenter.email}</div>}
              </div>
              {selectedBatchDetail.ipfsCid && (
                <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>IPFS CID</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#06B6D4", wordBreak: "break-all", marginBottom: 8 }}>
                    {selectedBatchDetail.ipfsCid}
                  </div>
                  <a
                    href={ipfsLink(selectedBatchDetail.ipfsCid)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn"
                    style={{
                      fontSize: 12,
                      padding: "8px 14px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(6, 182, 212, 0.1)",
                      border: "1px solid #06B6D4",
                      color: "#06B6D4",
                      borderRadius: 8,
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={12} /> Ver contenido IPFS
                  </a>
                </div>
              )}
              {selectedBatchDetail.txHash && (
                <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>TX HASH ARBITRUM</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#3B82F6", wordBreak: "break-all", marginBottom: 8 }}>{selectedBatchDetail.txHash}</div>
                  <a href={`https://sepolia.arbiscan.io/tx/${selectedBatchDetail.txHash}`} target="_blank" rel="noreferrer"
                    className="btn" style={{ fontSize: 12, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.1)", border: "1px solid #3B82F6", color: "#3B82F6", borderRadius: 8, textDecoration: "none" }}>
                    <ExternalLink size={12} /> Ver en Arbiscan Sepolia
                  </a>
                </div>
              )}
              <div style={{ background: "#0A192F", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>TIMELINE</div>
                <div style={{ marginBottom: 4 }}><span style={{ color: "#94A3B8" }}>Creado: </span>{new Date(selectedBatchDetail.createdAt).toLocaleString("es-PE")}</div>
                <div><span style={{ color: "#94A3B8" }}>Actualizado: </span>{new Date(selectedBatchDetail.updatedAt).toLocaleString("es-PE")}</div>
              </div>
            </div>
            <button onClick={() => setSelectedBatchDetail(null)} className="btn" style={{ width: "100%", marginTop: 16, padding: "12px", background: "#1E293B", border: "none", color: "#F8FAFC", borderRadius: 12, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
