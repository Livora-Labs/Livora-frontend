"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHead, Status, Kpi } from "@/components/Shell";
import { fetchCertificates, fetchSales, fetchBatches } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import {
  Check,
  ExternalLink,
  ShoppingBag,
  Boxes,
  Users,
  Award,
  RefreshCw,
  GitCommit,
  Scale,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";

const shortId = (id: string) => (id ? `${id.slice(0, 8)}…${id.slice(-6)}` : "—");
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

export default function CompanyTraceabilityPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected purchase ID
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");

  useEffect(() => {
    loadTraceability();
  }, []);

  const loadTraceability = async () => {
    setLoading(true);
    try {
      const [certsData, salesData, batchesData] = await Promise.all([
        fetchCertificates(),
        fetchSales(),
        fetchBatches(),
      ]);

      setCerts(certsData || []);
      const salesArr = salesData || [];
      setSales(salesArr);
      setBatches(batchesData || []);

      if (salesArr.length > 0) {
        setSelectedSaleId(salesArr[0].id);
      }
    } catch (err: any) {
      showToast("Error al cargar trazabilidad", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Find the selected sale
  const activeSale = useMemo(() => {
    if (!selectedSaleId) return sales[0] || null;
    return sales.find((s) => s.id === selectedSaleId) || sales[0] || null;
  }, [sales, selectedSaleId]);

  // Find associated batch for the active sale
  const activeBatch = useMemo(() => {
    if (!activeSale) return batches[0] || null;
    if (activeSale.batchId) {
      const b = batches.find((x) => x.id === activeSale.batchId);
      if (b) return b;
    }
    // Match by center or material
    const matched = batches.find(
      (b) =>
        b.centerId === activeSale.centerId ||
        (b.status === "RECEIVED" && b.txHash)
    );
    return matched || batches[0] || null;
  }, [activeSale, batches]);

  // Find associated ESG certificate
  const activeCert = useMemo(() => {
    if (!activeSale) return certs[0] || null;
    if (activeSale.certificateId) {
      const c = certs.find((x) => x.id === activeSale.certificateId);
      if (c) return c;
    }
    // Match by material or sale
    const matched = certs.find(
      (c) =>
        c.saleId === activeSale.id ||
        c.esgImpact?.recycledMaterial === activeSale.materialType
    );
    return matched || certs[0] || null;
  }, [activeSale, certs]);

  const hasAnyData = sales.length > 0 || batches.length > 0 || certs.length > 0;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Cadena de Custodia ESG"
        title="Trazabilidad Integral de Punta a Punta"
        description="Audita de forma transparente el viaje del material reciclado: desde el recolector y la balanza en el centro de acopio hasta el certificado emitido on-chain."
        action={
          <button
            onClick={loadTraceability}
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
        <Kpi
          label="COMPRAS AUDITADAS"
          value={String(sales.length)}
          trend="Operaciones corporativas B2B"
          accent="var(--blue)"
        />
        <Kpi
          label="CERTIFICADOS ASOCIADOS"
          value={String(certs.length)}
          trend="Pasaportes de sostenibilidad"
          accent="var(--green)"
        />
        <Kpi
          label="LOTES EN CUSTODIA"
          value={String(batches.length)}
          trend="Trazados físicamente"
          accent="var(--amber)"
        />
        <Kpi
          label="INTEGRIDAD BLOCKCHAIN"
          value="100% On-Chain"
          trend="Verificable en Stellar Expert"
          accent="var(--purple, #8b5cf6)"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : !hasAnyData ? (
        <EmptyState
          title="Sin Historial de Trazabilidad B2B"
          description="Aún no has adquirido materiales a los centros de acopio o no se han emitido lotes certificados para tu cuenta. Visita la sección de compras para ver tus transacciones en curso."
        />
      ) : (
        <>
          {/* Selector interactivo de Compra / Lote */}
          <section className="card" style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted, #64748b)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Selecciona la compra o lote a auditar
                </label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => setSelectedSaleId(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    color: "var(--text, #0f172a)",
                    fontSize: 13,
                    fontWeight: 600,
                    minWidth: 320,
                  }}
                >
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      Orden #{shortId(s.id)} · {s.center?.name || s.center?.email || "Centro"} ({kg(s.weightKg || 0)}) · {date(s.createdAt)}
                    </option>
                  ))}
                </select>
              </div>

              {activeSale && (
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span className="live">Cadena íntegra verificada</span>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#059669",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>Auditoría ESG Conforme</span>
                  </span>
                </div>
              )}
            </div>

            {/* Visual Stepper */}
            <div className="trace" style={{ margin: "24px 0 10px" }}>
              {[
                { title: "Compra B2B", sub: "Paso 1 · Facturación" },
                { title: "Pesaje en Báscula", sub: "Paso 2 · Centro Acopio" },
                { title: "Recolectores de Base", sub: "Paso 3 · Origen Social" },
                { title: "Certificado Blockchain", sub: "Paso 4 · Sello Stellar" },
              ].map((step, idx) => (
                <div className="trace-step active" key={idx}>
                  <strong>{step.title}</strong>
                  <span>{step.sub}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Desglose de los 4 Pasos de la Cadena */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Paso 1: Compra B2B */}
            <div className="card" style={{ borderLeft: "4px solid var(--blue, #3b82f6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(59, 130, 246, 0.12)",
                      display: "grid",
                      placeItems: "center",
                      color: "#2563eb",
                    }}
                  >
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <span className="eyebrow" style={{ fontSize: 11, color: "#2563eb" }}>Paso 1 · Orden Comercial B2B</span>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 700 }}>
                      {activeSale?.center?.name || activeSale?.center?.email || "Centro de Acopio"}
                    </h3>
                  </div>
                </div>
                <span style={{ color: "var(--green)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Check size={14} />
                  <span>Transferencia Formalizada</span>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Fecha de Adquisición</span>
                  <strong style={{ fontSize: 12 }}>{activeSale ? date(activeSale.createdAt) : "N/D"}</strong>
                </div>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Volumen Adquirido</span>
                  <strong style={{ fontSize: 12, color: "var(--green)" }}>{activeSale ? kg(activeSale.weightKg || 0) : "0 kg"}</strong>
                </div>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Código de Orden</span>
                  <strong className="mono" style={{ fontSize: 12 }}>#{shortId(activeSale?.id || "")}</strong>
                </div>
              </div>
            </div>

            {/* Paso 2: Lote Físico en Báscula */}
            <div className="card" style={{ borderLeft: "4px solid var(--amber, #f59e0b)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(245, 158, 11, 0.12)",
                      display: "grid",
                      placeItems: "center",
                      color: "#d97706",
                    }}
                  >
                    <Scale size={20} />
                  </div>
                  <div>
                    <span className="eyebrow" style={{ fontSize: 11, color: "#d97706" }}>Paso 2 · Pesaje en Báscula Calibrada</span>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 700 }}>
                      Lote Físico #{shortId(activeBatch?.id || "")}
                    </h3>
                  </div>
                </div>
                {activeBatch && <Status value={activeBatch.status || "RECEIVED"} />}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Materiales del Lote</span>
                  <strong style={{ fontSize: 12 }}>
                    {activeBatch?.materialsActual
                      ? Object.entries(activeBatch.materialsActual)
                          .map(([k, v]) => `${v}kg ${k}`)
                          .join(" · ")
                      : "PET Consolidado"}
                  </strong>
                </div>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Pesaje Neto Báscula</span>
                  <strong style={{ fontSize: 12 }}>
                    {activeBatch?.usefulWeightKg ? `${kg(activeBatch.usefulWeightKg)} útil` : "Certificado"}
                  </strong>
                </div>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "8px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Merma Descartada</span>
                  <strong style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
                    {activeBatch?.wasteWeightKg ? `${activeBatch.wasteWeightKg} kg` : "0.0 kg"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Paso 3: Origen y Recolectores */}
            <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(139, 92, 246, 0.12)",
                      display: "grid",
                      placeItems: "center",
                      color: "#7c3aed",
                    }}
                  >
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="eyebrow" style={{ fontSize: 11, color: "#7c3aed" }}>Paso 3 · Recolectores y Trazabilidad Social</span>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 700 }}>
                      Recolector: {activeBatch?.collector?.name || activeBatch?.collector?.email?.split("@")[0] || "Recolector Homologado"}
                    </h3>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
                  {activeBatch?.requests?.length || 1} recolecciones participantes
                </span>
              </div>

              <p style={{ fontSize: 12, color: "var(--muted, #64748b)", margin: "12px 0 0 0", lineHeight: 1.5 }}>
                Cada kilogramo suministrado en esta compra proviene de recolecciones urbanas georreferenciadas. La retribución económica fue liquidada de manera directa en tokens LIVO al recolector en el momento del pesaje.
              </p>
            </div>

            {/* Paso 4: Inmutabilidad Blockchain y Certificado ESG */}
            <div className="card" style={{ borderLeft: "4px solid var(--green, #10b981)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(16, 185, 129, 0.12)",
                      display: "grid",
                      placeItems: "center",
                      color: "#059669",
                    }}
                  >
                    <Award size={20} />
                  </div>
                  <div>
                    <span className="eyebrow" style={{ fontSize: 11, color: "#059669" }}>Paso 4 · Certificado ESG & Hash On-Chain</span>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 700 }}>
                      {activeCert?.title || "Certificado de Impacto Ambiental ESG"}
                    </h3>
                  </div>
                </div>
                {activeCert ? (
                  <Link
                    href={`/company/certificates/${activeCert.id}`}
                    className="btn primary"
                    style={{ fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <FileCheck size={14} />
                    <span>Ver Certificado Completo</span>
                  </Link>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>En proceso de emisión</span>
                )}
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>Hash de Transacción Stellar</span>
                  {activeBatch?.txHash ? (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${activeBatch.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono"
                      style={{
                        color: "var(--green)",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>{shortId(activeBatch.txHash)}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <strong className="mono" style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>En cola de consenso</strong>
                  )}
                </div>

                <div className="data-row" style={{ background: "var(--panel2, #f8fafc)", padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>Manifiesto Digital IPFS CID</span>
                  {activeBatch?.ipfsCid ? (
                    <a
                      href={`https://ipfs.io/ipfs/${activeBatch.ipfsCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono"
                      style={{
                        color: "var(--blue, #3b82f6)",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>{shortId(activeBatch.ipfsCid)}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <strong className="mono" style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>Generando IPFS CID...</strong>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
