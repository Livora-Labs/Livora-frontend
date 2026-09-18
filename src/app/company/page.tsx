"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { fetchCertificates, fetchIncomingB2bTransfers, receiveB2bTransfer, fetchSales } from "@/lib/api";
import { ShieldCheck, Award, RefreshCw, CheckCircle2, ExternalLink, Hash, Truck, ShoppingCart } from "lucide-react";
import { Web3ConfirmModal } from "@/components/Web3ConfirmModal";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/SkeletonUI";
import { ErrorState, EmptyState } from "@/components/StateFeedback";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function ipfsLink(cid: string): string {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) {
    return cid.replace("https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/");
  }
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

function formatMaterials(materials: Record<string, number> | null | undefined): string {
  if (!materials || Object.keys(materials).length === 0) return "—";
  return Object.entries(materials)
    .map(([m, kg]) => `${Number(kg).toFixed(1)} kg ${m}`)
    .join(" · ");
}

function totalKgFromMaterials(materials: Record<string, number> | null | undefined): number {
  if (!materials) return 0;
  return Object.values(materials).reduce((s, v) => s + Number(v), 0);
}

export default function B2bCompanyPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [web3PendingTransfer, setWeb3PendingTransfer] = useState<any>(null);

  const {
    data: certificates = [],
    isLoading: loadingCerts,
    isError: isErrorCerts,
    error: errorCerts,
    isRefetching: refetchingCerts,
    refetch: refetchCerts,
  } = useQuery({
    queryKey: ["certificates"],
    queryFn: fetchCertificates,
    enabled: Boolean(token),
  });

  const {
    data: incomingTransfers = [],
    isLoading: loadingIncoming,
    isError: isErrorIncoming,
    error: errorIncoming,
    isRefetching: refetchingIncoming,
    refetch: refetchIncoming,
  } = useQuery({
    queryKey: ["incomingB2bTransfers"],
    queryFn: fetchIncomingB2bTransfers,
    enabled: Boolean(token),
  });

  const {
    data: purchasesHistory = [],
    isLoading: loadingPurchases,
    isError: isErrorPurchases,
    error: errorPurchases,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
    enabled: Boolean(token),
  });

  const loading = loadingCerts || loadingIncoming || loadingPurchases;
  const isRefreshing = refetchingCerts || refetchingIncoming;

  const receiveMutation = useMutation({
    mutationFn: (transferId: string) => receiveB2bTransfer(transferId),
    onSuccess: (cert) => {
      showToast("Lote Recibido", "success", "Se ha emitido el certificado ESG en blockchain.");
      setSelectedCert(cert);
      queryClient.invalidateQueries({ queryKey: ["incomingB2bTransfers"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (err: any) => {
      showToast("Error al recibir lote", "error", err.response?.data?.message || err.message);
    },
  });

  const handleRefreshAll = () => {
    refetchCerts();
    refetchIncoming();
    refetchPurchases();
  };

  const totalKg = certificates.reduce(
    (sum: number, c: any) => sum + (c.esgImpact?.recycledKg || 0),
    0
  );

  let totalCo2 = 0;
  let totalWater = 0;

  certificates.forEach((c: any) => {
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
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="btn secondary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <RefreshCw
              size={16}
              style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}
            />
            <span>Refrescar Panel</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 kpis"
        style={{ marginBottom: 24 }}
      >
        <Kpi
          label="MATERIAL RECUPERADO"
          value={`${totalKg.toFixed(1)} kg`}
          trend="Stock verificado on-chain"
          accent="var(--green)"
        />
        <Kpi
          label="CO₂ EVITADO"
          value={`${totalCo2.toFixed(1)} kg`}
          trend="Equivalente en huella"
          accent="var(--blue)"
        />
        <Kpi
          label="AGUA AHORRADA"
          value={`${totalWater.toFixed(1)} L`}
          trend="Consumo neto evitado"
          accent="var(--blue)"
        />
        <Kpi
          label="CERTIFICADOS ACTIVOS"
          value={`${certificates.length}`}
          trend="100% auditable"
          accent="var(--amber)"
        />
      </div>

      <div className="grid split" style={{ marginBottom: 24 }}>
        {/* Envíos en Tránsito */}
        <section className="card">
          <div className="section-title">
            <h2>Envíos en Tránsito (B2B)</h2>
            <span className="live">{incomingTransfers.length} en camino</span>
          </div>

          {loadingIncoming ? (
            <CardSkeleton count={2} />
          ) : isErrorIncoming ? (
            <ErrorState
              title="Error al cargar despachos B2B"
              message={(errorIncoming as any)?.response?.data?.message || (errorIncoming as any)?.message || "No se pudo sincronizar la lista de despachos industriales."}
              onRetry={refetchIncoming}
            />
          ) : incomingTransfers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Sin envíos en tránsito"
              description="No tienes ningún envío de material industrial en camino actualmente."
              actionHref="/company/purchases"
              actionLabel="Ver historial de adquisiciones"
            />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {incomingTransfers.map((t: any) => {
                const mats = t.materials as Record<string, number> | null;
                const totalW = totalKgFromMaterials(mats);
                const isReceiving =
                  receiveMutation.isPending && receiveMutation.variables === t.id;

                return (
                  <div
                    key={t.id}
                    style={{
                      background: "var(--bg, #f8fafc)",
                      border: "1px solid var(--line, #e2e8f0)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <span className="status IN_TRANSIT" style={{ fontSize: 9 }}>
                            EN TRÁNSITO
                          </span>
                          <strong style={{ color: "var(--fg, #0f172a)", fontSize: 13 }}>
                            {totalW.toFixed(1)} kg totales
                          </strong>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted, #64748b)", marginBottom: 4 }}>
                          Despachado por:{" "}
                          <span style={{ color: "var(--fg, #0f172a)", fontWeight: 600 }}>
                            {t.center?.email?.split("@")[0]?.toUpperCase() || "Acopio"}
                          </span>
                        </div>
                        {/* Desglose de materiales */}
                        {mats &&
                          Object.entries(mats).map(([mat, kg]) => (
                            <div key={mat} style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                              <span style={{ color: "var(--fg, #0f172a)" }}>{mat}:</span>{" "}
                              <strong style={{ color: "#059669" }}>
                                {Number(kg).toFixed(1)} kg
                              </strong>
                            </div>
                          ))}
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                          {new Date(t.createdAt).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => setWeb3PendingTransfer(t)}
                        disabled={isReceiving}
                        className="btn primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          padding: "10px 14px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>{isReceiving ? "Procesando..." : "Confirmar Recepción"}</span>
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
          <div className="section-title">
            <h2>Últimas Adquisiciones</h2>
          </div>
          {loadingPurchases ? (
            <CardSkeleton count={2} />
          ) : isErrorPurchases ? (
            <ErrorState
              title="Error al cargar historial de compras"
              message={(errorPurchases as any)?.response?.data?.message || (errorPurchases as any)?.message || "No se pudo sincronizar el historial de adquisiciones."}
              onRetry={refetchPurchases}
            />
          ) : purchasesHistory.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Sin adquisiciones recientes"
              description="Tu empresa aún no registra compras de materiales industriales reciclados."
              actionHref="/company/purchases"
              actionLabel="Explorar catálogo de lotes"
            />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {purchasesHistory.slice(0, 4).map((p: any) => {
                const mats = p.materials as Record<string, number> | null;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: "var(--bg, #f8fafc)",
                      border: "1px solid var(--line, #e2e8f0)",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 4,
                            color: "var(--fg, #0f172a)",
                          }}
                        >
                          {totalKgFromMaterials(mats).toFixed(1)} kg
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                          {formatMaterials(mats)}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                          Origen:{" "}
                          {p.center?.email?.split("@")[0]?.toUpperCase() || "Acopio"} ·{" "}
                          {new Date(p.createdAt).toLocaleDateString("es-PE")}
                        </div>
                      </div>
                      <span
                        className="status COMPLETED"
                        style={{ fontSize: 9, whiteSpace: "nowrap" }}
                      >
                        RECIBIDO
                      </span>
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

        {loadingCerts ? (
          <TableSkeleton rows={4} columns={7} />
        ) : isErrorCerts ? (
          <ErrorState
            title="Error al cargar certificados verdes"
            message={(errorCerts as any)?.response?.data?.message || (errorCerts as any)?.message || "No se pudo sincronizar el registro de certificados ESG."}
            onRetry={refetchCerts}
          />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Sin certificados verdes emitidos"
            description="Los certificados se emitirán de forma automática on-chain al confirmar la recepción de tus lotes adquiridos."
            actionHref="/company/purchases"
            actionLabel="Gestionar adquisiciones"
          />
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
                      <td className="mono" style={{ fontSize: 11 }}>
                        #{c.id.slice(0, 8)}
                      </td>
                      <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(c.createdAt).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td>
                        <strong style={{ color: "#10B981" }}>
                          {c.esgImpact?.recycledKg?.toFixed(1)} kg
                        </strong>
                        <span style={{ color: "#64748B", fontSize: 10, marginLeft: 4 }}>
                          de {c.esgImpact?.recycledMaterial}
                        </span>
                      </td>
                      <td style={{ color: "#3B82F6", fontSize: 12 }}>
                        {c.esgImpact?.co2SavedKg?.toFixed(1)} kg CO₂
                      </td>
                      <td>
                        {ipfsUrl ? (
                          <a
                            href={ipfsUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#06B6D4",
                              fontSize: 11,
                              fontFamily: "monospace",
                              textDecoration: "none",
                            }}
                            title={c.ipfsHash}
                          >
                            <Hash size={11} />
                            {c.ipfsHash?.replace("ipfs://", "").slice(0, 12)}...
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            color: "#10B981",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {c.status || "ACTIVE"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedCert(c)}
                          className="btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            background: "rgba(16,185,129,0.1)",
                            color: "#10B981",
                            border: "1px solid rgba(16,185,129,0.3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Award size={13} />
                          <span>Ver Certificado</span>
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(10px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--panel, #ffffff)",
              border: "1px solid var(--line, #cbd5e1)",
              borderRadius: 24,
              padding: 28,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              borderTop: "5px solid #059669",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.12)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 14px",
                  border: "2px solid rgba(16, 185, 129, 0.4)",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)",
                }}
              >
                <Award size={32} style={{ color: "#059669" }} />
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  margin: "0 0 4px",
                  color: "var(--fg, #0f172a)",
                  letterSpacing: "0.03em",
                }}
              >
                CERTIFICADO DE IMPACTO ESG
              </h3>
              <span
                style={{ fontSize: 11, color: "var(--muted, #64748b)", fontFamily: "monospace" }}
              >
                ID: {selectedCert.id}
              </span>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--line, #e2e8f0)",
                margin: "14px 0",
              }}
            />

            <div
              style={{
                display: "grid",
                gap: 10,
                fontSize: 13,
                background: "var(--bg, #f8fafc)",
                border: "1px solid var(--line, #e2e8f0)",
                padding: 18,
                borderRadius: 14,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted, #64748b)" }}>Material Recuperado</span>
                <strong style={{ color: "#059669" }}>
                  {selectedCert.esgImpact?.recycledKg?.toFixed(1)} kg de{" "}
                  {selectedCert.esgImpact?.recycledMaterial}
                </strong>
              </div>
              {selectedCert.esgImpact?.materialsBreakdown &&
                Object.entries(selectedCert.esgImpact.materialsBreakdown).map(
                  ([m, kg]: any) => (
                    <div
                      key={m}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingLeft: 12,
                        borderLeft: "2px solid var(--line, #cbd5e1)",
                      }}
                    >
                      <span style={{ color: "var(--muted, #64748b)" }}>{m}</span>
                      <span style={{ color: "var(--fg, #0f172a)", fontWeight: 600 }}>
                        {Number(kg).toFixed(1)} kg
                      </span>
                    </div>
                  )
                )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted, #64748b)" }}>Emisiones de CO₂ Evitadas</span>
                <strong style={{ color: "#2563eb" }}>
                  {selectedCert.esgImpact?.co2SavedKg?.toFixed(1)} kg CO₂
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted, #64748b)" }}>Consumo de Agua Ahorrado</span>
                <strong style={{ color: "#0284c7" }}>
                  {selectedCert.esgImpact?.waterSavedLiters?.toFixed(0)} L H₂O
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted, #64748b)" }}>Fecha de Emisión</span>
                <strong style={{ color: "var(--fg, #0f172a)" }}>
                  {new Date(selectedCert.createdAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
            </div>

            {/* Evidencias Blockchain */}
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              {/* IPFS */}
              <div
                style={{
                  background: "var(--bg, #f8fafc)",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted, #64748b)",
                    fontWeight: 800,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Hash size={11} /> IPFS METADATA
                </div>
                {selectedCert.ipfsHash ? (
                  <div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#0369a1",
                        wordBreak: "break-all",
                        marginBottom: 8,
                      }}
                    >
                      {selectedCert.ipfsHash}
                    </div>
                    <a
                      href={ipfsLink(selectedCert.ipfsHash)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        padding: "8px 14px",
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        color: "#0284c7",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      <ExternalLink size={12} /> Ver metadata en IPFS
                    </a>
                  </div>
                ) : (
                  <div style={{ color: "var(--muted, #64748b)", fontSize: 12 }}>
                    CID IPFS no disponible
                  </div>
                )}
              </div>

              {/* Stellar */}
              <div
                style={{
                  background: "var(--bg, #f8fafc)",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted, #64748b)",
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  ⬡ RED STELLAR TESTNET
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted, #64748b)",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  Este certificado está anclado en la red Stellar Testnet con firma criptográfica delegada.
                </div>
                <a
                  href="https://stellar.expert/explorer/testnet"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    padding: "8px 14px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  <ExternalLink size={12} /> Abrir Stellar Expert
                </a>
              </div>
            </div>

            <button
              onClick={() => setSelectedCert(null)}
              style={{
                width: "100%",
                padding: 12,
                background: "var(--bg, #f1f5f9)",
                border: "1px solid var(--line, #cbd5e1)",
                color: "var(--fg, #0f172a)",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Cerrar Certificado
            </button>
          </div>
        </div>
      )}

      <Web3ConfirmModal
        isOpen={Boolean(web3PendingTransfer)}
        title="Confirmar Recepción y Certificado ESG"
        tokenAmount={web3PendingTransfer ? totalKgFromMaterials(web3PendingTransfer.materials as any).toFixed(1) : "0"}
        tokenSymbol="KG RECICLADO"
        destinationName={web3PendingTransfer?.center?.email?.split("@")[0]?.toUpperCase() || "Centro de Acopio"}
        actionDescription="Emisión de Certificado ESG Notarizado en Stellar Blockchain"
        warningText="Al confirmar, autorizas a Livora a emitir y firmar el certificado de impacto ambiental en la blockchain Stellar. Esta acción es inmutable."
        isLoading={receiveMutation.isPending}
        onConfirm={() => {
          if (web3PendingTransfer) {
            receiveMutation.mutate(web3PendingTransfer.id);
            setWeb3PendingTransfer(null);
          }
        }}
        onCancel={() => setWeb3PendingTransfer(null)}
      />
    </>
  );
}
