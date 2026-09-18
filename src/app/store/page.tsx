"use client";

import React, { useState, useEffect } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import { generateStoreQr, fetchStoreRedemptions } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Receipt,
  Store,
  Wallet,
  Coins,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

export default function StorePosPage() {
  const { user, token } = useAuth();

  // POS State
  const [fiatAmount, setFiatAmount] = useState<string>("10.00");
  const [description, setDescription] = useState<string>("");
  const [qrData, setQrData] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [paymentReceived, setPaymentReceived] = useState<any | null>(null);

  // Recent sales today
  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(true);

  // Load recent redemptions
  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    setLoadingRecent(true);
    try {
      const data = await fetchStoreRedemptions({ page: 1, limit: 5 });
      setRecentRedemptions(Array.isArray(data) ? data : data?.data || []);
    } catch {
      // Ignorar si aún no hay canjes
    } finally {
      setLoadingRecent(false);
    }
  };

  // Socket listener for real-time redemption confirmation
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    if (!socket) return;

    const handleRedemptionCompleted = (payload: any) => {
      // If matches the active QR reference or general store event
      if (!qrData || payload.qrCodeRef === qrData.qrCodeRef) {
        setPaymentReceived(payload);
        showToast(
          "¡Pago Recibido!",
          "success",
          `El cliente pagó exitosamente ${payload.tokenAmount || ""} EcoTokens (${money(Number(fiatAmount) || 0)}).`
        );
        loadRecent();
      }
    };

    socket.on("redemption:completed", handleRedemptionCompleted);

    return () => {
      socket.off("redemption:completed", handleRedemptionCompleted);
    };
  }, [token, qrData, fiatAmount]);

  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fiatAmount);
    if (!amount || amount <= 0) {
      showToast("Monto Inválido", "error", "Ingresa un monto mayor a S/ 0.00");
      return;
    }

    setIsGenerating(true);
    setPaymentReceived(null);
    try {
      const res = await generateStoreQr({
        fiatAmount: amount,
        description: description.trim() || undefined,
      });
      setQrData(res);
      showToast("Código QR Generado", "success", "Muestra este código al cliente en caja.");
    } catch (err: any) {
      showToast(
        "Error al generar cobro",
        "error",
        err.response?.data?.message || err.message
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetPos = () => {
    setQrData(null);
    setPaymentReceived(null);
    setFiatAmount("10.00");
    setDescription("");
  };

  // Fixed conversion estimate: 1 EcoToken = S/ 0.20
  const estimatedEcoTokens = Math.max(0, (parseFloat(fiatAmount) || 0) / 0.2).toFixed(1);

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Punto de Venta Oficial (POS)"
        title="Terminal de Cobro con EcoTokens"
        description="Genera códigos QR dinámicos para que tus clientes paguen en caja con su saldo acumulado de reciclaje."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/store/liquidaciones"
              className="btn primary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowUpRight size={14} />
              <span>Solicitar Liquidación a Banco</span>
            </Link>
            <button
              onClick={loadRecent}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi
          label="ESTADO DEL TERMINAL"
          value="EN LÍNEA"
          trend="Escucha activa por WebSockets"
          accent="var(--green)"
        />
        <Kpi
          label="TASA DE CONVERSIÓN"
          value="1 ECO = S/ 0.20"
          trend="Paridad oficial garantizada"
          accent="var(--blue)"
        />
        <Kpi
          label="CANJES RECIENTES"
          value={String(recentRedemptions.length)}
          trend="Operaciones registradas"
          accent="var(--purple, #8b5cf6)"
        />
      </div>

      <div className="grid split" style={{ gap: 24 }}>
        {/* Columna Izquierda: Generador de Cobro en Caja */}
        <section className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="section-title">
              <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16 }}>
                <QrCode size={18} style={{ color: "var(--green)" }} />
                <span>Generar Cobro en Caja</span>
              </h2>
            </div>

            <form onSubmit={handleGenerateQr} style={{ display: "grid", gap: 16, marginTop: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted, #64748b)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Monto a Cobrar en Soles (PEN)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--text, #0f172a)",
                    }}
                  >
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0.50"
                    placeholder="0.00"
                    value={fiatAmount}
                    onChange={(e) => setFiatAmount(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      paddingLeft: 44,
                      paddingRight: 14,
                      paddingTop: 12,
                      paddingBottom: 12,
                      fontSize: 20,
                      fontWeight: 800,
                      borderRadius: 12,
                      border: "2px solid var(--line, #cbd5e1)",
                      background: "var(--panel2, #f8fafc)",
                      color: "var(--text, #0f172a)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted, #64748b)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <Coins size={13} style={{ color: "var(--green)" }} />
                  <span>
                    El cliente pagará aproximadamente: <strong>{estimatedEcoTokens} EcoTokens</strong>
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted, #64748b)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Concepto / Detalle (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Víveres, compra de útiles, café con descuento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 13,
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    color: "var(--text, #0f172a)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="btn primary"
                style={{
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 12,
                }}
              >
                <QrCode size={16} />
                <span>{isGenerating ? "Generando código..." : "Mostrar QR de Cobro"}</span>
              </button>
            </form>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 12,
              background: "var(--panel2, #f8fafc)",
              border: "1px solid var(--line, #e2e8f0)",
              fontSize: 12,
              color: "var(--muted, #64748b)",
              lineHeight: 1.5,
            }}
          >
            <strong>Reglas de Cobro en Tienda:</strong>
            <ul style={{ margin: "6px 0 0 0", paddingLeft: 16 }}>
              <li>El cliente escanea el código desde su App Móvil Livora.</li>
              <li>La confirmación se recibe en tiempo real sin recargar la página.</li>
              <li>Si hubo un error en caja, puedes anular la operación dentro de las 24 horas siguientes.</li>
            </ul>
          </div>
        </section>

        {/* Columna Derecha: Pantalla de Código QR y Estado */}
        <section
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 30,
            background: paymentReceived
              ? "rgba(16, 185, 129, 0.05)"
              : "var(--panel, #ffffff)",
            border: paymentReceived
              ? "2px solid #10B981"
              : "1px solid var(--line, #e2e8f0)",
            minHeight: 440,
          }}
        >
          {paymentReceived ? (
            <div style={{ display: "grid", gap: 14, placeItems: "center" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "grid",
                  placeItems: "center",
                  color: "#059669",
                }}
              >
                <CheckCircle2 size={44} />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#059669" }}>
                ¡Pago Confirmado!
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text, #0f172a)", maxWidth: 320 }}>
                Se han acreditado <strong>{paymentReceived.tokenAmount || estimatedEcoTokens} EcoTokens</strong> a tu saldo comercial.
              </p>
              <div style={{ padding: "8px 16px", background: "var(--panel2, #f8fafc)", borderRadius: 10, border: "1px solid var(--line, #e2e8f0)", fontSize: 13 }}>
                Importe: <strong>{money(parseFloat(fiatAmount) || 0)}</strong>
              </div>
              <button
                onClick={handleResetPos}
                className="btn primary"
                style={{ marginTop: 10, padding: "10px 24px", fontSize: 13 }}
              >
                Cobrar otra compra
              </button>
            </div>
          ) : qrData ? (
            <div style={{ display: "grid", gap: 16, placeItems: "center" }}>
              <span className="live">Listo para escanear</span>
              <div
                style={{
                  padding: 16,
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid var(--line, #cbd5e1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <QRCodeSVG
                  value={qrData.qrCodeRef || qrData.qrString || JSON.stringify(qrData)}
                  size={200}
                  level="M"
                />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text, #0f172a)" }}>
                  {money(parseFloat(fiatAmount) || 0)}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted, #64748b)", marginTop: 2 }}>
                  Equivalente a: <strong style={{ color: "var(--green)" }}>{qrData.tokenAmount || estimatedEcoTokens} EcoTokens</strong>
                </div>
                {description && (
                  <div style={{ fontSize: 12, color: "var(--muted, #64748b)", marginTop: 4 }}>
                    "{description}"
                  </div>
                )}
              </div>
              <button
                onClick={handleResetPos}
                className="btn secondary"
                style={{ fontSize: 12, padding: "6px 14px" }}
              >
                Cancelar Cobro
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, placeItems: "center", color: "var(--muted, #64748b)" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "var(--panel2, #f8fafc)",
                  display: "grid",
                  placeItems: "center",
                  border: "1px dashed var(--line, #cbd5e1)",
                }}
              >
                <QrCode size={32} style={{ color: "var(--muted, #64748b)" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--text, #0f172a)" }}>
                Esperando nuevo cobro
              </h3>
              <p style={{ margin: 0, fontSize: 13, maxWidth: 280 }}>
                Ingresa el monto en soles en el formulario izquierdo y presiona "Mostrar QR de Cobro" para generar el código para tu cliente.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
