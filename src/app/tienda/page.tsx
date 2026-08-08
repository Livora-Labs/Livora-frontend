"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { getStoreProfile, createStoreProfile, generateQrRedemption, requestSettlement, fetchStoreRedemptions, fetchStoreSettlements, confirmRedemption } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { StoreProfile, QrRedemption, SettlementRequest } from "@/lib/types";
import { Store, QrCode, Coins, CheckCircle2, Banknote, RefreshCw, ArrowUpRight, Tag, Eye, Camera, Keyboard, Award } from "lucide-react";

export default function TiendaAliadaPage() {
  const { user, token, balance, refreshBalance } = useAuth();

  // Profile Setup State
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [ruc, setRuc] = useState("");
  const [address, setAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // POS Charging State
  const [chargeAmount, setChargeAmount] = useState<string>("15.00");
  const [activeQr, setActiveQr] = useState<QrRedemption | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"QR_SHOW" | "QR_SCAN" | "MANUAL">("QR_SHOW");
  const [citizenInputCode, setCitizenInputCode] = useState("");
  const [confirmingCitizenPay, setConfirmingCitizenPay] = useState(false);

  // Histories State
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);
  const [recentSettlements, setRecentSettlements] = useState<any[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(true);

  // Cash-Out Settlement State
  const [settlementRequests, setSettlementRequests] = useState<SettlementRequest[]>([]);
  const [requestingCashout, setRequestingCashout] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadProfile();
    loadHistoriesData();

    const socket = getSocket(token || undefined);
    socket.on("redemption:completed", (data: any) => {
      setPaymentSuccess(true);
      setActiveQr(null);
      setIsChargeModalOpen(false);
      showToast("¡Pago Recibido Exitosamente!", "success", `Has recibido ${data.tokenAmount || chargeAmount} EcoTokens.`);
      refreshBalance();
      loadHistoriesData();
    });

    return () => {
      socket.off("redemption:completed");
    };
  }, [token]);

  const loadHistoriesData = async () => {
    if (!token) return;
    setLoadingHistories(true);
    try {
      const red = await fetchStoreRedemptions();
      setRecentRedemptions(red || []);
      const setts = await fetchStoreSettlements();
      setRecentSettlements(setts || []);
      setSettlementRequests(setts || []);
    } catch (err) {
      // Quiet fail
    } finally {
      setLoadingHistories(false);
    }
  };

  const loadProfile = async () => {
    if (!token) return;
    setLoadingProfile(true);
    try {
      const data = await getStoreProfile();
      setProfile(data);
    } catch (err: any) {
      // Profile not set up yet
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ruc || !address || !bankAccount) {
      showToast("Campos obligatorios", "error", "Completa todos los datos requeridos.");
      return;
    }
    setSavingProfile(true);
    try {
      const newProf = await createStoreProfile({ businessName, ruc, address, bankAccount });
      setProfile(newProf as StoreProfile);
      showToast("Perfil de Tienda Creado", "success", businessName);
    } catch (err: any) {
      showToast("Error al crear perfil", "error", err.response?.data?.message || err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(chargeAmount);
    if (!amount || amount <= 0) {
      showToast("Monto Inválido", "error", "Ingresa una cantidad mayor a 0.");
      return;
    }

    setGeneratingQr(true);
    setPaymentSuccess(false);
    try {
      const qrData = await generateQrRedemption(amount);
      setActiveQr(qrData as QrRedemption);
      showToast("Código QR Generado", "info", `Ref: ${qrData.qrCodeRef}`);
    } catch (err: any) {
      showToast("Error al generar QR", "error", err.response?.data?.message || err.message);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleConfirmCitizenPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQr || !citizenInputCode.trim()) {
      showToast("Monto o código faltante", "error", "Espera a generar el cobro e ingresa el código del ciudadano.");
      return;
    }

    setConfirmingCitizenPay(true);
    try {
      await confirmRedemption(activeQr.qrCodeRef, citizenInputCode.trim());
      setPaymentSuccess(true);
      setActiveQr(null);
      setIsChargeModalOpen(false);
      setCitizenInputCode("");
      showToast("¡Cobro Exitoso!", "success", `Se canjearon ${chargeAmount} EcoTokens.`);
      refreshBalance();
      loadHistoriesData();
    } catch (err: any) {
      showToast("Error de validación", "error", err.response?.data?.message || err.message);
    } finally {
      setConfirmingCitizenPay(false);
    }
  };

  const handleRequestCashOut = async () => {
    const currentBal = parseFloat(balance) || 0;
    if (currentBal < 50) {
      showToast("Saldo Insuficiente", "error", "Mínimo 50 EcoTokens para retirar fondos.");
      return;
    }

    setRequestingCashout(true);
    try {
      const req = await requestSettlement(currentBal);
      setSettlementRequests((prev) => [req as SettlementRequest, ...prev]);
      showToast("Solicitud de Liquidación Enviada", "success", "Estado: Pendiente de Pago por Livora");
      refreshBalance();
    } catch (err: any) {
      showToast("Error al retirar fondos", "error", err.response?.data?.message || err.message);
    } finally {
      setRequestingCashout(false);
    }
  };

  if (loadingProfile) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#0A192F", color: "#F8FAFC" }}>
        <div style={{ textAlign: "center", color: "#94A3B8" }}>Cargando perfil de tienda...</div>
      </div>
    );
  }

  return (
    <Shell role="tienda">
      <ToastContainer />
      <PageHead
        eyebrow="Punto de Venta POS"
        title={profile ? profile.businessName : "Configuración de Tienda"}
        description="Genera códigos QR de cobro en EcoTokens y solicita liquidaciones a tu cuenta bancaria."
        action={
          profile && (
            <button onClick={loadProfile} className="btn ghost" style={{ display: "grid", placeItems: "center", padding: 10 }}>
              <RefreshCw size={18} />
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <Kpi label="SALDO EN TIENDA" value={`${balance} ECO`} trend={`~ S/ ${(parseFloat(balance) * 3.75).toFixed(2)} PEN`} accent="var(--green)" />
        <Kpi label="RETENCIONES PENDIENTES" value={`${settlementRequests.length} solicitudes`} trend="Tasa de canje fija 1:1" accent="var(--blue)" />
        <Kpi label="RUC / REGISTRO FISCAL" value={profile ? profile.ruc : "No configurado"} trend="Identificación de comercio" accent="var(--amber)" />
      </div>

      {/* Si no tiene perfil configurado -> Formulario de Registro */}
      {!profile ? (
        <div style={{ maxWidth: 500, margin: "0 auto", background: "#112240", border: "1px solid #1E293B", borderRadius: 20, padding: 26 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Configuración Inicial de Tienda</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>
            Completa los datos de tu comercio para comenzar a aceptar EcoTokens y recibir liquidaciones bancarias.
          </p>

          <form onSubmit={handleCreateProfile} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Nombre comercial o Razón social</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{ width: "100%", background: "#0A192F", border: "1px solid #1E293B", color: "#F8FAFC", padding: 12, borderRadius: 10, fontSize: 14 }}
                placeholder="Ej. Eco Tienda Orgánica S.A.C."
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>RUC (11 dígitos)</label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                style={{ width: "100%", background: "#0A192F", border: "1px solid #1E293B", color: "#F8FAFC", padding: 12, borderRadius: 10, fontSize: 14 }}
                placeholder="Ej. 20601234567"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Dirección comercial física</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: "100%", background: "#0A192F", border: "1px solid #1E293B", color: "#F8FAFC", padding: 12, borderRadius: 10, fontSize: 14 }}
                placeholder="Ej. Av. Larco 123, Miraflores, Lima"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>CCI / Cuenta Bancaria para Liquidación</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                style={{ width: "100%", background: "#0A192F", border: "1px solid #1E293B", color: "#F8FAFC", padding: 12, borderRadius: 10, fontSize: 14 }}
                placeholder="Ej. BCP - CCI: 002-191001234567890-54"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn primary"
              style={{
                width: "100%",
                padding: 14,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {savingProfile ? "Guardando..." : "Guardar Perfil de Tienda"}
            </button>
          </form>
        </div>
      ) : (
        /* Grid POS Terminal + Cash-Out Module */
        <div style={{ display: "grid", gap: 24 }}>
          <div className="grid split">
            {/* POS Terminal & QR */}
            <section className="card">
              <div className="section-title">
                <h2>Terminal de Cobro POS</h2>
              </div>

              {paymentSuccess ? (
                <div
                  style={{
                    background: "linear-gradient(145deg, #064e3b, #047857)",
                    borderRadius: 16,
                    padding: 30,
                    textAlign: "center",
                    boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <CheckCircle2 size={64} style={{ color: "#F8FAFC", margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: "#F8FAFC", margin: 0 }}>Pago Recibido Exitosamente</h3>
                  <p style={{ fontSize: 14, color: "#a7f3d0", margin: "8px 0 20px" }}>
                    Los EcoTokens han sido transferidos a la cuenta de tu tienda.
                  </p>
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setActiveQr(null);
                    }}
                    className="btn"
                    style={{
                      background: "#0A192F",
                      color: "#10B981",
                      border: "1px solid #10B981",
                      padding: "12px 24px",
                      fontWeight: 800,
                    }}
                  >
                    Nuevo Cobro POS
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 20 }}>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleGenerateQr(e);
                      setIsChargeModalOpen(true);
                    }}
                    style={{ display: "grid", gap: 16 }}
                  >
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Monto a Cobrar (EcoTokens)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        style={{
                          width: "100%",
                          background: "#0A192F",
                          border: "1px solid #1E293B",
                          color: "#10B981",
                          padding: "16px",
                          borderRadius: 14,
                          fontSize: 26,
                          fontWeight: 900,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      {["5.00", "10.00", "15.00", "25.00"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setChargeAmount(amt)}
                          style={{
                            flex: 1,
                            background: chargeAmount === amt ? "#10B981" : "#0A192F",
                            color: chargeAmount === amt ? "#0A192F" : "#F8FAFC",
                            border: "1px solid #1E293B",
                            padding: "8px",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {amt} ECO
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const isChargeAmountValid = chargeAmount.trim() !== "" && parseFloat(chargeAmount) > 0;
                      return (
                        <button
                          type="submit"
                          disabled={generatingQr || !isChargeAmountValid}
                          className="btn primary"
                          style={{
                            padding: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            opacity: (!isChargeAmountValid || generatingQr) ? 0.5 : 1,
                            cursor: (!isChargeAmountValid || generatingQr) ? "not-allowed" : "pointer"
                          }}
                        >
                          <QrCode size={18} />
                          <span>{generatingQr ? "Iniciando..." : "Cobrar EcoTokens"}</span>
                        </button>
                      );
                    })()}
                  </form>
                </div>
              )}
            </section>

            {/* Cash-Out & Liquidación */}
            <div style={{ display: "grid", gap: 20 }}>
              <section className="card">
                <div className="section-title">
                  <h2>Retiro Bancario (Cash-Out)</h2>
                </div>

                <div style={{ background: "#0A192F", padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Coins size={18} style={{ color: "#10B981" }} />
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>Saldo Disponible para Liquidación</span>
                  </div>
                  <strong style={{ fontSize: 28, color: "#10B981" }}>{balance} ECO</strong>
                  <div style={{ fontSize: 12, color: "#06B6D4", marginTop: 4 }}>
                    Equivalente: S/ {(parseFloat(balance) * 1.0).toFixed(2)} PEN (CCI: {profile.bankAccount.slice(-8)})
                  </div>
                </div>

                {(() => {
                  const isBalanceSufficient = (parseFloat(balance) || 0) >= 50;
                  return (
                    <div style={{ display: "grid", gap: 12 }}>
                      <button
                        onClick={handleRequestCashOut}
                        disabled={requestingCashout || !isBalanceSufficient}
                        className="btn primary"
                        style={{
                          width: "100%",
                          padding: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          opacity: (!isBalanceSufficient || requestingCashout) ? 0.5 : 1,
                          cursor: (!isBalanceSufficient || requestingCashout) ? "not-allowed" : "pointer",
                        }}
                      >
                        <Banknote size={18} />
                        <span>
                          {!isBalanceSufficient
                            ? "Retiro Bloqueado (Mínimo 50 ECO)"
                            : requestingCashout
                            ? "Enviando..."
                            : "Retirar Fondos a Cuenta Bancaria"}
                        </span>
                      </button>
                      {!isBalanceSufficient && (
                        <small style={{ color: "#EF4444", fontSize: 11, display: "block", textAlign: "center" }}>
                          Requiere un saldo mínimo de 50.0 EcoTokens para solicitar liquidación bancaria.
                        </small>
                      )}
                    </div>
                  );
                })()}
              </section>
            </div>
          </div>

          <div className="grid split">
            {/* Canjes Recientes */}
            <section className="card">
              <div className="section-title">
                <h2>Últimos Canjes Recibidos</h2>
                <Link href="/tienda/historial" style={{ fontSize: 12, color: "#3B82F6", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>Ver todo</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              {loadingHistories ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>Cargando canjes...</div>
              ) : recentRedemptions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>No has recibido pagos aún.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {recentRedemptions.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: "#0A192F",
                        border: "1px solid #1E293B",
                        borderRadius: 12,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>+{r.tokenAmount} ECO</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                          Ref: <span className="mono">{r.qrCodeRef}</span>
                        </div>
                      </div>
                      <span className={`status ${r.status}`} style={{ fontSize: 9 }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Solicitudes de Retiro */}
            <section className="card">
              <div className="section-title">
                <h2>Historial de Retiros</h2>
                <Link href="/tienda/historial" style={{ fontSize: 12, color: "#3B82F6", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>Ver todo</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              {loadingHistories ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>Cargando retiros...</div>
              ) : recentSettlements.length === 0 ? (
                <div style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", padding: "10px 0" }}>No hay retiros registrados.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {recentSettlements.slice(0, 3).map((s) => (
                    <div key={s.id} style={{ background: "#0A192F", padding: 12, borderRadius: 10, border: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ fontSize: 13, color: "#F8FAFC" }}>{s.tokenAmount} ECO</strong>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Equiv: S/. {s.fiatAmount}</div>
                      </div>
                      <span className={`status ${s.status}`} style={{ fontSize: 9 }}>{s.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Modal de Cobro Híbrido */}
      {isChargeModalOpen && activeQr && (
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
              maxWidth: 480,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <QrCode size={20} style={{ color: "#10B981" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Opciones de Cobro POS ({chargeAmount} ECO)</h3>
              </div>
              <button
                onClick={() => {
                  setIsChargeModalOpen(false);
                  setActiveQr(null);
                }}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {/* Selector de Método Híbrido */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "#0A192F", padding: 4, borderRadius: 10 }}>
              <button
                onClick={() => setSelectedMethod("QR_SHOW")}
                style={{
                  flex: 1,
                  background: selectedMethod === "QR_SHOW" ? "#1E293B" : "none",
                  border: "none",
                  color: selectedMethod === "QR_SHOW" ? "#10B981" : "#94A3B8",
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
                <span>Mostrar QR</span>
              </button>
              <button
                onClick={() => setSelectedMethod("MANUAL")}
                style={{
                  flex: 1,
                  background: selectedMethod === "MANUAL" ? "#1E293B" : "none",
                  border: "none",
                  color: selectedMethod === "MANUAL" ? "#10B981" : "#94A3B8",
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
                <span>Código Manual</span>
              </button>
            </div>

            {selectedMethod === "QR_SHOW" ? (
              <div
                style={{
                  background: "#0A192F",
                  border: "1px solid #1E293B",
                  borderRadius: 12,
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 12, display: "inline-block", marginBottom: 12 }}>
                  <QRCodeSVG value={activeQr.qrCodeRef} size={180} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#10B981", wordBreak: "break-all", fontFamily: "monospace" }}>
                  {activeQr.qrCodeRef}
                </div>
                <small style={{ color: "#94A3B8", fontSize: 12, display: "block", marginTop: 6 }}>
                  Muestra este código QR al ciudadano para que lo escanee desde su aplicación y autorice el pago.
                </small>
              </div>
            ) : (
              <form onSubmit={handleConfirmCitizenPayment} style={{ display: "grid", gap: 14 }}>
                <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                  Ingresa el ID único de la billetera o cuenta del ciudadano (User ID) para debitar EcoTokens manualmente.
                </p>

                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>ID del Ciudadano (UUID del Hogar)</label>
                  <input
                    type="text"
                    placeholder="Ej. d3b07384d113..."
                    value={citizenInputCode}
                    onChange={(e) => setCitizenInputCode(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#0A192F",
                      border: "1px solid #1E293B",
                      borderRadius: 10,
                      padding: 12,
                      color: "#F8FAFC",
                      fontSize: 13,
                      outline: "none",
                    }}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChargeModalOpen(false);
                      setActiveQr(null);
                    }}
                    style={{ flex: 1, background: "#1E293B", border: "none", color: "#F8FAFC", padding: 12, borderRadius: 12, cursor: "pointer", fontSize: 13 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={confirmingCitizenPay || !citizenInputCode.trim()}
                    style={{
                      flex: 1,
                      background: citizenInputCode.trim() ? "linear-gradient(135deg, #10B981, #059669)" : "#1E293B",
                      border: "none",
                      color: citizenInputCode.trim() ? "#0A192F" : "#94A3B8",
                      padding: 12,
                      borderRadius: 12,
                      cursor: citizenInputCode.trim() ? "pointer" : "not-allowed",
                      fontSize: 13,
                      fontWeight: 800,
                      opacity: citizenInputCode.trim() ? 1 : 0.5,
                    }}
                  >
                    {confirmingCitizenPay ? "Cobrando..." : "Validar y Cobrar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
