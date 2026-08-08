"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { createCollectionRequest, fetchCollectionRequests, updateCollectionStatus, confirmRedemption, fetchRedemptionDetails } from "@/lib/api";
import { CollectionRequest } from "@/lib/types";
import { MapPin, Upload, KeyRound, QrCode, Sparkles, CheckCircle2, Trash2, ArrowUpRight, Leaf, Recycle, Keyboard, ShoppingBag, ExternalLink } from "lucide-react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
function ipfsLink(cid: string): string {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

export default function HogarPage() {
  const { token, balance, receptionPin, refreshBalance } = useAuth();

  // Form State
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [petWeight, setPetWeight] = useState<number>(0.0);
  const [cartonWeight, setCartonWeight] = useState<number>(0.0);
  const [vidrioWeight, setVidrioWeight] = useState<number>(0.0);
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedReq, setSelectedReq] = useState<CollectionRequest | null>(null);

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
    loadRequests();
  }, [token]);

  const loadRequests = async () => {
    if (!token) return;
    setLoadingRequests(true);
    try {
      const data = await fetchCollectionRequests();
      setRequests(data);
    } catch (err: any) {
      showToast("Error al cargar solicitudes", "error", err.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocalización no soportada", "error", "Tu navegador no permite detectar la ubicación.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoLoading(false);
        showToast("Ubicación obtenida", "success", `Coordenadas: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        setLat(-12.0864);
        setLng(-77.0351);
        setGeoLoading(false);
        showToast("Ubicación aproximada obtenida", "info", "Ubicación fijada en Lima Centro (Simulación GPS).");
      }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const fakeUrl = URL.createObjectURL(file);
      setPhotoUrl(fakeUrl);
      showToast("Fotografía seleccionada", "info", file.name);
    }
  };

  const hasActiveRequest = requests.some(
    (r) => r.status === "PENDING" || r.status === "ACCEPTED"
  );

  const isFormValid =
    lat !== null &&
    lng !== null &&
    (petWeight > 0 || cartonWeight > 0 || vidrioWeight > 0) &&
    photoFile !== null &&
    !hasActiveRequest;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !photoFile) return;

    setSubmitting(true);

    const itemsEstimated: Record<string, number> = {};
    if (petWeight > 0) itemsEstimated["PET"] = petWeight;
    if (cartonWeight > 0) itemsEstimated["CARTON"] = cartonWeight;
    if (vidrioWeight > 0) itemsEstimated["VIDRIO"] = vidrioWeight;

    const formData = new FormData();
    formData.append("latitude", String(Number(lat)));
    formData.append("longitude", String(Number(lng)));
    formData.append("itemsEstimated", JSON.stringify(itemsEstimated));
    formData.append("description", description || "Solicitud de reciclaje del hogar");
    formData.append("photo", photoFile);

    try {
      const newReq = await createCollectionRequest(formData);
      showToast("¡Solicitud creada!", "success", "Se ha registrado correctamente en la base de datos.");
      setRequests((prev) => [newReq as CollectionRequest, ...prev]);
      setDescription("");
      setPhotoFile(null);
      setPhotoUrl("");
      refreshBalance();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      showToast("Error de Creación", "error", Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      await updateCollectionStatus(id, "CANCELLED");
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
      );
      showToast("Solicitud cancelada", "info", `ID: ${id}`);
    } catch (err: any) {
      showToast("Error al cancelar", "error", err.message);
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

  return (
    <Shell role="hogar">
      <ToastContainer />
      <PageHead
        eyebrow="Portal ciudadano"
        title="Mi Hogar Ecológico"
        description="Gestiona tus residuos, solicita recolecciones on-chain y canjea EcoTokens."
        action={
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
        }
      />

      {/* KPI Cards */}
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <Kpi label="SALDO ECOTOKENS" value={`${balance} ECO`} trend="Billetera Arbitrum Sepolia" accent="var(--green)" />
        <Kpi
          label="PIN DE VERIFICACIÓN"
          value={receptionPin || "1234"}
          trend="Dictar al recolector al entregar"
          accent="var(--blue)"
        />
        <Kpi label="IMPACTO ESG ESTIMADO" value="18.5 kg CO₂" trend="Trazabilidad verde verificada" accent="var(--amber)" />
      </div>

      <div className="grid split">
        {/* Formulario de Nueva Solicitud */}
        <section className="card">
          <div className="section-title">
            <h2>Nueva Solicitud de Recolección</h2>
          </div>

          <form onSubmit={handleSubmitRequest} style={{ display: "grid", gap: 16 }}>
            {/* Ubicación Actual */}
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Ubicación Georreferenciada</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={geoLoading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: lat ? "rgba(16, 185, 129, 0.15)" : "#0A192F",
                  border: `1px solid ${lat ? "#10B981" : "#1E293B"}`,
                  color: lat ? "#10B981" : "#F8FAFC",
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <MapPin size={16} />
                <span>{geoLoading ? "Obteniendo ubicación GPS..." : lat ? `Ubicación Capturada (${lat.toFixed(4)}, ${lng?.toFixed(4)})` : "Obtener mi ubicación actual"}</span>
              </button>
            </div>

            {/* Estimación de Materiales */}
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>Estimación de Residuos (kg)</label>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ background: "#0A192F", padding: 12, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>PET (Plástico Botellas)</span>
                    <strong style={{ color: "#10B981" }}>{petWeight} kg</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={petWeight}
                    onChange={(e) => setPetWeight(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#10B981" }}
                  />
                </div>

                <div style={{ background: "#0A192F", padding: 12, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>Cartón / Papel</span>
                    <strong style={{ color: "#06B6D4" }}>{cartonWeight} kg</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={cartonWeight}
                    onChange={(e) => setCartonWeight(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#06B6D4" }}
                  />
                </div>

                <div style={{ background: "#0A192F", padding: 12, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>Vidrio / Latas</span>
                    <strong style={{ color: "#3B82F6" }}>{vidrioWeight} kg</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={vidrioWeight}
                    onChange={(e) => setVidrioWeight(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#3B82F6" }}
                  />
                </div>
              </div>
            </div>

            {/* Descripción & Foto */}
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Notas o Descripción</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Dejaré las bolsas rotuladas en la puerta..."
                style={{
                  width: "100%",
                  background: "#0A192F",
                  border: "1px solid #1E293B",
                  borderRadius: 10,
                  padding: 12,
                  color: "#F8FAFC",
                  fontSize: 13,
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Fotografía del Material</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "#0A192F",
                    border: "1px dashed #1E293B",
                    padding: 12,
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#94A3B8",
                  }}
                >
                  <Upload size={16} />
                  <span>Subir Foto</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                </label>
                {photoUrl && (
                  <img src={photoUrl} alt="Preview" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid #10B981" }} />
                )}
              </div>
            </div>

            {hasActiveRequest && (
              <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#F59E0B", padding: 12, borderRadius: 10, fontSize: 12, lineHeight: 1.5 }}>
                Ya tienes una solicitud de recolección en curso. Por favor, espera a que se complete o cancélala antes de generar una nueva.
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="btn primary"
              style={{
                width: "100%",
                padding: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: isFormValid ? 1 : 0.5,
                cursor: isFormValid ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? "Enviando..." : "Solicitar Recolección Ahora"}
              <ArrowUpRight size={18} />
            </button>
          </form>
        </section>

        {/* Historial de Solicitudes */}
        <section className="card">
          <div className="section-title">
            <h2>Mis Solicitudes Recientes</h2>
            <button onClick={loadRequests} style={{ background: "none", border: "none", color: "#10B981", fontSize: 12, cursor: "pointer" }}>
              Refrescar
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>Cargando solicitudes...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>No tienes solicitudes registradas.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {requests.slice(0, 3).map((req) => {
                const totalKg = Object.values(req.itemsEstimated || {}).reduce((a, b) => a + b, 0);
                return (
                  <div
                    key={req.id}
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
                        <span
                          className={`status ${req.status}`}
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 12,
                          }}
                        >
                          {req.status}
                        </span>
                        <small style={{ color: "#94A3B8", fontSize: 11 }}>{new Date(req.createdAt).toLocaleDateString()}</small>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>
                        Est. ~{totalKg.toFixed(1)} kg ({Object.keys(req.itemsEstimated || {}).join(", ") || "Materiales"})
                      </div>
                      <small style={{ color: "#94A3B8", fontSize: 11 }}>{req.description}</small>

                      {(req.status === "PENDING" || req.status === "ACCEPTED") && (
                        <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)", padding: "4px 8px", borderRadius: 8, fontSize: 11, color: "#06B6D4" }}>
                          <KeyRound size={12} />
                          <span>Dicta tu PIN al Recolector: <strong style={{ color: "#F8FAFC", letterSpacing: 1 }}>{req.verificationPin || receptionPin}</strong></span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => setSelectedReq(req)}
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

                      {req.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#EF4444",
                            padding: "6px 10px",
                            borderRadius: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {requests.length > 3 && (
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <Link href="/hogar/historial" className="btn" style={{ fontSize: 12, display: "inline-block" }}>
                    Ver historial completo →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

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
                <CheckCircle2 size={20} style={{ color: "#10B981" }} />
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
                    <strong style={{ color: "#10B981" }}>+{(Object.entries(selectedReq.itemsEstimated || {}).reduce((total, [mat, wt]) => total + wt * ({ PET: 10, CARTON: 5, CARTÓN: 5, VIDRIO: 3, PLASTICO: 10, PLÁSTICO: 10, ALUMINIO: 15, TETRAPAK: 4, PAPEL: 5 }[mat.toUpperCase()] || 5), 0) * 0.8).toFixed(1)} ECO</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Participación del Recolector (20%)</span>
                    <strong style={{ color: "#3B82F6" }}>+{(Object.entries(selectedReq.itemsEstimated || {}).reduce((total, [mat, wt]) => total + wt * ({ PET: 10, CARTON: 5, CARTÓN: 5, VIDRIO: 3, PLASTICO: 10, PLÁSTICO: 10, ALUMINIO: 15, TETRAPAK: 4, PAPEL: 5 }[mat.toUpperCase()] || 5), 0) * 0.2).toFixed(1)} ECO</strong>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid #1E293B", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Generado Total Lote</span>
                    <span>{Object.entries(selectedReq.itemsEstimated || {}).reduce((total, [mat, wt]) => total + wt * ({ PET: 10, CARTON: 5, CARTÓN: 5, VIDRIO: 3, PLASTICO: 10, PLÁSTICO: 10, ALUMINIO: 15, TETRAPAK: 4, PAPEL: 5 }[mat.toUpperCase()] || 5), 0).toFixed(1)} ECO</span>
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
                  
                  {selectedReq.status === "COMPLETED" && ((selectedReq as any).batch?.txHash || (selectedReq as any).batch?.trace?.txHash) ? (
                    <>
                      {(() => {
                        const batch = (selectedReq as any).batch || {};
                        const txHash = batch.txHash || batch.trace?.txHash;
                        const ipfsCid = batch.ipfsCid || batch.trace?.ipfsCid;
                        return (
                          <>
                            {ipfsCid && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                <span>Manifiesto IPFS CID</span>
                                <a
                                  href={ipfsLink(ipfsCid)}
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
                                  <span>{ipfsCid.slice(0, 10)}...</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                            {txHash && (
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>Explorador Blockchain</span>
                                <a
                                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
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
                                  <span>Arbiscan Sepolia</span>
                                  <ArrowUpRight size={12} />
                                </a>
                              </div>
                            )}
                          </>
                        );
                      })()}
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
