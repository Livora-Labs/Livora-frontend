"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { fetchCollectionRequests, updateCollectionStatus, verifyCollectionPin, fetchOpenBatch, updateBatchCenterAndTransit, fetchCenters, fetchBatches, confirmRedemption, fetchRedemptionDetails } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { CollectionRequest, Batch, User } from "@/lib/types";
import { Truck, MapPin, Navigation, CheckCircle2, Factory, RefreshCw, KeyRound, ShieldCheck, Radio, Info, ArrowUpRight, ShoppingBag, Keyboard, QrCode } from "lucide-react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
function ipfsLink(cid: string): string {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

export default function RecolectorPage() {
  const { token, balance, refreshBalance } = useAuth();

  // Radar State
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [radius, setRadius] = useState<number>(50);

  // Centers List
  const [centers, setCenters] = useState<Pick<User, "id" | "email" | "walletAddress">[]>([]);

  // Batch / Truck State
  const [openBatch, setOpenBatch] = useState<Batch | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [startingTransit, setStartingTransit] = useState(false);

  // Batch History State
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // PIN Verification Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [verifyingReq, setVerifyingReq] = useState<CollectionRequest | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Store QR Redemption Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrRefInput, setQrRefInput] = useState("");
  const [confirmingQr, setConfirmingQr] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [redemptionDetails, setRedemptionDetails] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"INPUT" | "CONFIRM">("INPUT");
  const [qrMethod, setQrMethod] = useState<"CAMERA" | "MANUAL">("MANUAL");

  useEffect(() => {
    if (!token) return;
    loadRadar();
    loadBatch();
    loadCenters();
    loadHistory();

    const socket = getSocket(token || undefined);
    socket.on("collection:created", (data: any) => {
      showToast("¡Nueva Solicitud Cercana!", "info", `Materiales en radio de ${radius} km.`);
      loadRadar();
    });

    return () => {
      socket.off("collection:created");
    };
  }, [radius, token]);

  const loadHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const data = await fetchBatches();
      setRecentBatches(data);
    } catch (err: any) {
      showToast("Error al cargar historial", "error", err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFetchRedemptionDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrRefInput.trim()) return;

    setFetchingDetails(true);
    try {
      const details = await fetchRedemptionDetails(qrRefInput.trim());
      setRedemptionDetails(details);
      setCheckoutStep("CONFIRM");
    } catch (err: any) {
      showToast("Error al buscar cobro", "error", err.response?.data?.message || err.message);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleConfirmStorePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrRefInput.trim()) return;

    setConfirmingQr(true);
    try {
      await confirmRedemption(qrRefInput.trim());
      showToast("¡Pago en Tienda Confirmado!", "success", `Has pagado ${redemptionDetails?.tokenAmount} EcoTokens a ${redemptionDetails?.businessName}.`);
      setIsQrModalOpen(false);
      setQrRefInput("");
      setRedemptionDetails(null);
      setCheckoutStep("INPUT");
      refreshBalance();
    } catch (err: any) {
      showToast("Error en Canje QR", "error", err.response?.data?.message || err.message);
    } finally {
      setConfirmingQr(false);
    }
  };

  const loadRadar = async () => {
    if (!token) return;
    setLoadingRadar(true);
    const queryRadar = async (latitude: number, longitude: number) => {
      const currentToken = typeof window !== "undefined" ? localStorage.getItem("livora_token") : null;
      if (!currentToken) {
        setLoadingRadar(false);
        return;
      }
      try {
        const data = await fetchCollectionRequests({ lat: latitude, lng: longitude, radius });
        setRequests(data);
      } catch (err: any) {
        // Solo mostrar error si el token sigue existiendo (previene falsos positivos en deslogueo)
        if (typeof window !== "undefined" && localStorage.getItem("livora_token")) {
          showToast("Error al cargar radar", "error", err.message);
        }
      } finally {
        setLoadingRadar(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          queryRadar(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          queryRadar(-12.0864, -77.0351);
        }
      );
    } else {
      queryRadar(-12.0864, -77.0351);
    }
  };

  const loadBatch = async () => {
    if (!token) return;
    try {
      const batch = await fetchOpenBatch();
      setOpenBatch(batch);
    } catch (err: any) {
      showToast("Error al cargar lote", "error", err.message);
    }
  };

  const loadCenters = async () => {
    if (!token) return;
    try {
      const data = await fetchCenters();
      setCenters(data);
      if (data && data.length > 0) {
        setSelectedCenter(data[0].id);
      }
    } catch (err: any) {
      showToast("Error al cargar centros de acopio", "error", err.message);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await updateCollectionStatus(id, "ACCEPTED");
      showToast("Solicitud Aceptada", "success", "En camino. Revisa el PIN dictado por el Hogar al llegar.");
      loadRadar();
      loadBatch();
    } catch (err: any) {
      showToast("Error al aceptar", "error", err.message);
    }
  };

  const handleOpenPinModal = (req: CollectionRequest) => {
    setVerifyingReq(req);
    setPinInput("");
    setIsPinModalOpen(true);
  };

  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingReq || !pinInput.trim()) return;

    if (pinInput.trim().length !== 4) {
      showToast("PIN Inválido", "error", "El PIN debe constar de 4 dígitos.");
      return;
    }

    setVerifyingPin(true);
    try {
      const res = await verifyCollectionPin(verifyingReq.id, pinInput.trim());
      if (res.success) {
        setIsPinModalOpen(false);
        showToast("¡Entrega Verificada!", "success", "Material verificado físicamente y cargado al camión.");
        loadRadar();
        loadBatch();
      } else {
        showToast("Verificación Fallida", "error", res.message || "El PIN dictado no coincide.");
      }
    } catch (err: any) {
      showToast("Error de verificación", "error", err.response?.data?.message || err.message);
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleStartTransit = async () => {
    if (!openBatch || !selectedCenter) {
      showToast("Configuración requerida", "error", "Selecciona un centro de acopio destino.");
      return;
    }
    setStartingTransit(true);
    try {
      await updateBatchCenterAndTransit(openBatch.id, selectedCenter);
      showToast("¡Traslado Iniciado!", "success", `Lote #${openBatch.id} en tránsito al centro de acopio.`);
      loadBatch();
    } catch (err: any) {
      showToast("Error al iniciar traslado", "error", err.message);
    } finally {
      setStartingTransit(false);
    }
  };

  const getTruckWeight = () => {
    if (!openBatch) return 0;
    if (openBatch.materialsActual && Object.keys(openBatch.materialsActual).length > 0) {
      return Object.values(openBatch.materialsActual).reduce((sum, wt) => sum + wt, 0);
    }
    let sum = 0;
    if (openBatch.requests) {
      openBatch.requests.forEach((req) => {
        if (req.itemsEstimated) {
          Object.values(req.itemsEstimated).forEach((wt) => {
            sum += wt;
          });
        }
      });
    }
    return sum;
  };

  return (
    <Shell role="recolector">
      <ToastContainer />
      <PageHead
        eyebrow="Radar de campo"
        title="Ruta de Recolección"
        description="Navega por solicitudes de hogares cercanas y traslada lotes recolectados."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="btn primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
              }}
            >
              <QrCode size={18} />
              <span>Pagar en Tienda</span>
            </button>
            <button
              onClick={() => {
                loadRadar();
                loadBatch();
                showToast("Radar actualizado", "success", "Se ha forzado la recarga de las solicitudes.");
              }}
              className="btn secondary"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <RefreshCw size={16} />
              <span>Forzar Recarga</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <Kpi
          label="LOTE ABIERTO ID"
          value={openBatch ? `#${openBatch.id.slice(0, 8)}` : "Ninguno"}
          trend={openBatch ? `Estado: ${openBatch.status}` : "Crea uno recogiendo material"}
          accent="var(--green)"
        />
        <Kpi
          label="MATERIALES EN CAMIÓN"
          value={openBatch ? `${getTruckWeight().toFixed(1)} kg` : "0.0 kg"}
          trend="Peso acumulado en camión"
          accent="var(--blue)"
        />
        <Kpi label="CENTROS DE ACOPIO" value={`${centers.length} activos`} trend="Destinos de descarga física" accent="var(--amber)" />
      </div>

      <div className="grid split">
        {/* Lote Activo en Camión Banner */}
        <section className="card">
          <div className="section-title">
            <h2>Lote Activo en Camión</h2>
          </div>

          {openBatch ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "#0A192F", padding: 12, borderRadius: 10 }}>
                <small style={{ color: "#94A3B8", fontSize: 11, display: "block", marginBottom: 6 }}>Materiales Cargados Estimados</small>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
                  {Object.keys(openBatch.materialsActual || {}).length === 0 ? (
                    <span style={{ color: "#94A3B8" }}>No hay materiales en este lote aún.</span>
                  ) : (
                    Object.entries(openBatch.materialsActual || {}).map(([mat, weight]) => (
                      <span key={mat} style={{ color: "#06B6D4" }}>
                        {mat}: {weight} kg
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Solicitudes del Lote */}
              <div style={{ display: "grid", gap: 10 }}>
                <small style={{ color: "#94A3B8", fontSize: 11, display: "block" }}>Solicitudes en Ruta / Por Recoger</small>
                {(!openBatch.requests || openBatch.requests.length === 0) ? (
                  <div style={{ fontSize: 12, color: "#94A3B8", padding: "10px 0", textAlign: "center", border: "1px dashed #1E293B", borderRadius: 10 }}>
                    Ninguna solicitud cargada o en ruta.
                  </div>
                ) : (
                  openBatch.requests.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: "#0A192F",
                        border: "1px solid #1E293B",
                        borderRadius: 10,
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#06B6D4", fontWeight: 700 }}>Solicitud #{req.id.substring(0, 8)}</span>
                        <span className={`status ${req.status}`} style={{ fontSize: 9 }}>{req.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#F8FAFC" }}>
                        {req.description || "Recolección de hogar"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>
                        Materiales: {Object.entries(req.itemsEstimated || {}).map(([k, v]) => `${v}kg ${k}`).join(", ")}
                      </div>
                      {req.status === "ACCEPTED" && (
                        <button
                          onClick={() => handleOpenPinModal(req)}
                          className="btn"
                          style={{
                            width: "100%",
                            background: "linear-gradient(135deg, #06B6D4, #0891B2)",
                            border: "none",
                            color: "#0A192F",
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <KeyRound size={14} />
                          <span>Verificar Entrega</span>
                        </button>
                      )}
                      {req.status === "COMPLETED" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10B981", fontSize: 11, fontWeight: 700 }}>
                          <ShieldCheck size={14} />
                          <span>Material verificado con PIN y cargado</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Selector de Centro de Acopio & Botón Traslado */}
              {(() => {
                const isBatchEmpty = !openBatch.requests || openBatch.requests.length === 0;
                return (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>Centro de Acopio Destino</label>
                      {centers.length === 0 ? (
                        <div style={{ fontSize: 12, color: "#EF4444" }}>Debes registrar al menos un Centro de Acopio en el sistema primero.</div>
                      ) : (
                        <select
                          value={selectedCenter}
                          onChange={(e) => setSelectedCenter(e.target.value)}
                          style={{
                            width: "100%",
                            background: "#0A192F",
                            border: "1px solid #1E293B",
                            color: "#F8FAFC",
                            padding: 12,
                            borderRadius: 10,
                            fontSize: 13,
                            outline: "none",
                          }}
                        >
                          {centers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.email.split("@")[0].toUpperCase()} ({c.walletAddress?.slice(0, 6)}...)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <button
                      onClick={handleStartTransit}
                      disabled={startingTransit || centers.length === 0 || isBatchEmpty}
                      className="btn primary"
                      style={{
                        width: "100%",
                        padding: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        opacity: (startingTransit || centers.length === 0 || isBatchEmpty) ? 0.5 : 1,
                        cursor: (startingTransit || centers.length === 0 || isBatchEmpty) ? "not-allowed" : "pointer"
                      }}
                    >
                      <Factory size={18} />
                      <span>
                        {isBatchEmpty
                          ? "Camión vacío"
                          : startingTransit
                          ? "Iniciando Traslado..."
                          : "Iniciar Traslado a Centro de Acopio"}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No hay ningún lote abierto asignado a tu cuenta.</div>
          )}
        </section>

        {/* Radar de Solicitudes */}
        <section className="card">
          <div className="section-title">
            <h2>Radar Solicitudes (&lt;{radius}km)</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {[5, 10, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  style={{
                    background: radius === r ? "#10B981" : "#0A192F",
                    color: radius === r ? "#0A192F" : "#94A3B8",
                    border: "1px solid #1E293B",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* Radar View */}
          <div
            style={{
              height: 140,
              background: "radial-gradient(circle at 50% 50%, #064e3b 0%, #0a192f 70%)",
              border: "1px solid #1E293B",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", border: "1px dashed rgba(16, 185, 129, 0.3)" }} />
            <div style={{ zIndex: 10, background: "#10B981", color: "#0A192F", padding: 8, borderRadius: "50%", boxShadow: "0 0 16px #10B981" }}>
              <Navigation size={16} />
            </div>
            <span style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "#94A3B8" }}>Radar GPS</span>
          </div>

          {loadingRadar ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>Escaneando radar...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>No hay solicitudes pendientes en este radio.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {requests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: "#0A192F",
                    border: "1px solid #1E293B",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 11, color: "#06B6D4", fontWeight: 700 }}>Solicitud #{req.id.substring(0, 8)}</span>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: "2px 0", color: "#F8FAFC" }}>
                        {req.description || "Recolección de hogar"}
                      </h4>
                    </div>
                    <span className={`status ${req.status}`} style={{ fontSize: 9 }}>{req.status}</span>
                  </div>

                  <div style={{ background: "#112240", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
                    <span style={{ color: "#94A3B8" }}>Materiales: </span>
                    <strong style={{ color: "#10B981" }}>
                      {Object.entries(req.itemsEstimated || {})
                        .map(([k, v]) => `${v}kg ${k}`)
                        .join(", ")}
                    </strong>
                  </div>

                  {req.status === "PENDING" && (
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="btn primary"
                      style={{
                        width: "100%",
                        padding: 10,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Aceptar Solicitud</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mis Lotes Recientes */}
      <section className="card" style={{ marginTop: 24 }}>
        <div className="section-title">
          <h2>Mis Lotes Recientes</h2>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>Cargando lotes recientes...</div>
        ) : recentBatches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>No tienes lotes registrados en tu historial.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {recentBatches.slice(0, 3).map((b) => {
              const totalKg = Object.values(b.materialsActual || {}).reduce((sum, wt) => sum + wt, 0);
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
              let totalECO = 0;
              Object.entries(b.materialsActual || {}).forEach(([mat, wt]) => {
                const rate = rates[mat.toUpperCase()] || 5;
                totalECO += wt * rate;
              });
              const collectorTokens = b.requests?.length === 0 ? totalECO : totalECO * 0.2;
              return (
                <div
                  key={b.id}
                  style={{
                    background: "#0A192F",
                    border: "1px solid #1E293B",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className={`status ${b.status}`} style={{ fontSize: 9 }}>{b.status}</span>
                      <small style={{ color: "#94A3B8", fontSize: 11 }}>{new Date(b.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>
                      Lote #{b.id.slice(0, 8)} - {totalKg.toFixed(1)} kg ({Object.keys(b.materialsActual || {}).join(", ") || "Sin pesar"})
                    </div>
                    {b.status === "RECEIVED" && (
                      <small style={{ color: "#10B981", fontSize: 11, fontWeight: 700 }}>
                        Ganado: +{collectorTokens.toFixed(1)} ECO
                      </small>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedBatch(b)}
                    className="btn"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "#3B82F6",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <span>Detalles</span>
                  </button>
                </div>
              );
            })}

            {recentBatches.length > 3 && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <Link href="/recolector/historial" className="btn" style={{ fontSize: 12, display: "inline-block" }}>
                  Ver historial completo →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Validación con PIN */}
      {isPinModalOpen && verifyingReq && (
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
              maxWidth: 400,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={20} style={{ color: "#06B6D4" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Validación de Entrega Física</h3>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, marginBottom: 16 }}>
              Solicita al Hogar el **PIN de 4 dígitos** que figura en su aplicación e ingrésalo para validar la entrega.
            </p>

            <form onSubmit={handleVerifyPinSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>PIN del Ciudadano (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Ej. 4829"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  style={{
                    width: "100%",
                    background: "#0A192F",
                    border: "1px solid #1E293B",
                    borderRadius: 14,
                    padding: 14,
                    color: "#06B6D4",
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: 8,
                    textAlign: "center",
                    outline: "none",
                  }}
                  autoFocus
                />
              </div>

              {/* Teclado Numérico */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "C") setPinInput("");
                      else if (key === "←") setPinInput((prev) => prev.slice(0, -1));
                      else if (pinInput.length < 4) setPinInput((prev) => prev + key);
                    }}
                    style={{
                      background: "#0A192F",
                      border: "1px solid #1E293B",
                      color: "#F8FAFC",
                      padding: 10,
                      borderRadius: 10,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  style={{ flex: 1, background: "#1E293B", border: "none", color: "#F8FAFC", padding: 12, borderRadius: 12, cursor: "pointer", fontSize: 13 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={verifyingPin || pinInput.length !== 4}
                  style={{
                    flex: 1,
                    background: pinInput.length === 4 ? "linear-gradient(135deg, #06B6D4, #0891B2)" : "#1E293B",
                    border: "none",
                    color: pinInput.length === 4 ? "#0A192F" : "#94A3B8",
                    padding: 12,
                    borderRadius: 12,
                    cursor: pinInput.length === 4 ? "pointer" : "not-allowed",
                    fontSize: 13,
                    fontWeight: 800,
                    opacity: pinInput.length === 4 ? 1 : 0.5,
                  }}
                >
                  {verifyingPin ? "Confirmando..." : "Confirmar Entrega"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
                  {(() => {
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
                    Object.entries(selectedBatch.materialsActual || {}).forEach(([mat, wt]) => {
                      const rate = rates[mat.toUpperCase()] || 5;
                      total += wt * rate;
                    });
                    const houseCount = selectedBatch.requests?.length || 0;
                    const collectorShare = houseCount === 0 ? total : total * 0.2;
                    const householdShareTotal = houseCount === 0 ? 0 : total * 0.8;
                    const householdShareEach = houseCount === 0 ? 0 : householdShareTotal / houseCount;
                    return (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Mi Ganancia de Recolector</span>
                          <strong style={{ color: "var(--green)" }}>
                            +{collectorShare.toFixed(1)} ECO
                          </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Hogares Vinculados ({houseCount})</span>
                          <strong>
                            +{householdShareTotal.toFixed(1)} ECO (total)
                          </strong>
                        </div>
                        {houseCount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: 11, paddingLeft: 12 }}>
                            <span>Por cada hogar:</span>
                            <span>+{householdShareEach.toFixed(1)} ECO</span>
                          </div>
                        )}
                        <hr style={{ border: "none", borderTop: "1px solid #1E293B", margin: "4px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                          <span>Total Emitido en Arbitrum</span>
                          <span>{total.toFixed(1)} ECO</span>
                        </div>
                      </>
                    );
                  })()}
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

                  {selectedBatch.status === "RECEIVED" && selectedBatch.txHash ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span>IPFS Metadata CID</span>
                        {selectedBatch.ipfsCid ? (
                          <a
                            href={ipfsLink(selectedBatch.ipfsCid)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#06B6D4",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              textDecoration: "underline",
                              fontWeight: 600,
                              fontSize: 11,
                              fontFamily: "monospace",
                            }}
                          >
                            <span>{selectedBatch.ipfsCid.slice(0, 10)}...</span>
                            <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>No disponible</span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Transacción Stellar</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${selectedBatch.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#10B981", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "underline", fontWeight: 600 }}
                        >
                          <span>Ver en Stellar Expert</span>
                          <ArrowUpRight size={12} />
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
      {/* Modal Canje en Tienda */}
      {isQrModalOpen && (
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
              maxWidth: 440,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingBag size={20} style={{ color: "#10B981" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {checkoutStep === "INPUT" ? "Pagar en Tienda Aliada" : "Confirmación de Pago"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsQrModalOpen(false);
                  setCheckoutStep("INPUT");
                  setRedemptionDetails(null);
                  setQrRefInput("");
                }}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {checkoutStep === "INPUT" ? (
              <div>
                {/* Method Tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "#0A192F", padding: 4, borderRadius: 10 }}>
                  <button
                    onClick={() => setQrMethod("CAMERA")}
                    style={{
                      flex: 1,
                      background: qrMethod === "CAMERA" ? "#1E293B" : "none",
                      border: "none",
                      color: qrMethod === "CAMERA" ? "#10B981" : "#94A3B8",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <QrCode size={14} />
                    <span>Lector de Cámara</span>
                  </button>
                  <button
                    onClick={() => setQrMethod("MANUAL")}
                    style={{
                      flex: 1,
                      background: qrMethod === "MANUAL" ? "#1E293B" : "none",
                      border: "none",
                      color: qrMethod === "MANUAL" ? "#10B981" : "#94A3B8",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Keyboard size={14} />
                    <span>Código Alfanumérico</span>
                  </button>
                </div>

                {qrMethod === "CAMERA" ? (
                  <div style={{ display: "grid", gap: 16, textAlign: "center" }}>
                    <div
                      style={{
                        background: "#0A192F",
                        border: "2px dashed #1E293B",
                        borderRadius: 16,
                        height: 180,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <QrCode size={48} style={{ opacity: 0.3 }} />
                      <span style={{ fontSize: 12, marginTop: 8 }}>Permiso de cámara no concedido</span>
                      <div
                        style={{
                          position: "absolute",
                          inset: "0 0 auto",
                          height: 2,
                          background: "#10B981",
                          boxShadow: "0 0 10px #10B981",
                          animation: "scan 2s linear infinite",
                        }}
                      />
                      <style>{`
                        @keyframes scan {
                          0% { transform: translateY(0); }
                          100% { transform: translateY(180px); }
                        }
                      `}</style>
                    </div>

                    <p style={{ fontSize: 11, color: "#94A3B8" }}>
                      Posiciona el código QR de cobro de la tienda frente a la cámara.
                    </p>

                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>O ingresa el código manual:</label>
                      <input
                        type="text"
                        placeholder="LIVORA-QR-..."
                        value={qrRefInput}
                        onChange={(e) => setQrRefInput(e.target.value)}
                        style={{
                          width: "100%",
                          background: "#0A192F",
                          border: "1px solid #1E293B",
                          borderRadius: 10,
                          padding: 10,
                          color: "#F8FAFC",
                          textAlign: "center",
                          fontSize: 13,
                        }}
                      />
                    </div>

                    <button
                      onClick={handleFetchRedemptionDetails}
                      disabled={fetchingDetails || !qrRefInput.trim()}
                      className="btn primary"
                      style={{ width: "100%" }}
                    >
                      {fetchingDetails ? "Buscando cobro..." : "Escanear / Cargar Código"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFetchRedemptionDetails} style={{ display: "grid", gap: 14 }}>
                    <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                      Ingresa el código alfanumérico que aparece debajo del código QR de la tienda.
                    </p>

                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>Referencia de Cobro (qrCodeRef)</label>
                      <input
                        type="text"
                        placeholder="Ej. LIVORA-QR-..."
                        value={qrRefInput}
                        onChange={(e) => setQrRefInput(e.target.value)}
                        style={{
                          width: "100%",
                          background: "#0A192F",
                          border: "1px solid #1E293B",
                          borderRadius: 12,
                          padding: 12,
                          color: "#F8FAFC",
                          fontSize: 14,
                          fontWeight: 700,
                          outline: "none",
                        }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={fetchingDetails || !qrRefInput.trim()}
                      className="btn primary"
                      style={{ width: "100%", padding: 12 }}
                    >
                      {fetchingDetails ? "Verificando..." : "Consultar Detalles de Pago"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleConfirmStorePayment} style={{ display: "grid", gap: 16 }}>
                <div style={{ background: "#0A192F", borderRadius: 16, padding: 18, border: "1px solid #1E293B", display: "grid", gap: 12 }}>
                  <div style={{ textAlign: "center", borderBottom: "1px solid #1E293B", paddingBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>TIENDA DESTINO</span>
                    <h4 style={{ fontSize: 18, fontWeight: 900, color: "#F8FAFC", margin: "4px 0 0" }}>
                      {redemptionDetails?.businessName}
                    </h4>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>Monto a Transferir</span>
                    <strong style={{ fontSize: 18, color: "#10B981" }}>{redemptionDetails?.tokenAmount} ECO</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>Tu Saldo Actual</span>
                    <strong style={{ fontSize: 14, color: "#F8FAFC" }}>{balance} ECO</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep("INPUT");
                      setRedemptionDetails(null);
                    }}
                    style={{ flex: 1, background: "#1E293B", border: "none", color: "#F8FAFC", padding: 12, borderRadius: 12, cursor: "pointer", fontSize: 13 }}
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={confirmingQr || (parseFloat(balance) || 0) < (redemptionDetails?.tokenAmount || 0)}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      border: "none",
                      color: "#0A192F",
                      padding: 12,
                      borderRadius: 12,
                      cursor: confirmingQr ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 800,
                      opacity: (confirmingQr || (parseFloat(balance) || 0) < (redemptionDetails?.tokenAmount || 0)) ? 0.5 : 1,
                    }}
                  >
                    {confirmingQr ? "Pagando..." : "Confirmar y Pagar"}
                  </button>
                </div>
                {(parseFloat(balance) || 0) < (redemptionDetails?.tokenAmount || 0) && (
                  <small style={{ color: "#EF4444", fontSize: 11, textAlign: "center", display: "block" }}>
                    Saldo insuficiente para completar este canje.
                  </small>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
