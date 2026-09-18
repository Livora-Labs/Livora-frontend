"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { fetchStoreSettlements, requestStoreSettlement, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Send,
  ShieldCheck,
  AlertCircle,
  FileCheck,
} from "lucide-react";

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

const formatDate = (val: string) => {
  if (!val) return "N/D";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(val));
};

export default function StoreLiquidacionesPage() {
  const { token } = useAuth();

  const [settlements, setSettlements] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Wallet balance
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Request form state
  const [tokenAmount, setTokenAmount] = useState<string>("100");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadBalance();
    loadSettlements();
  }, [page]);

  const loadBalance = async () => {
    if (!token) return;
    try {
      const res = await api.get("/wallets/me");
      if (res.data?.balance !== undefined) {
        setWalletBalance(Number(res.data.balance));
      }
    } catch {
      // Ignorar si no tiene wallet
    }
  };

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetchStoreSettlements({ page, limit });
      if (res && res.data) {
        setSettlements(res.data);
        setTotalCount(res.total || 0);
      } else if (Array.isArray(res)) {
        setSettlements(res);
        setTotalCount(res.length);
      } else {
        setSettlements([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      showToast("Error al cargar liquidaciones", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokens = parseFloat(tokenAmount);
    if (!tokens || tokens < 10) {
      showToast("Monto Inválido", "error", "El monto mínimo a liquidar es de 10 EcoTokens.");
      return;
    }
    if (tokens > walletBalance) {
      showToast(
        "Saldo Insuficiente",
        "error",
        `Tu saldo es de ${walletBalance.toFixed(1)} ECO. No puedes liquidar ${tokens} ECO.`
      );
      return;
    }
    if (!bankAccount.trim() || bankAccount.trim().length < 8) {
      showToast(
        "Cuenta Requerida",
        "error",
        "Ingresa un número de cuenta bancaria o CCI válido (mínimo 8 dígitos)."
      );
      return;
    }

    setSubmitting(true);
    try {
      await requestStoreSettlement({
        tokenAmount: tokens,
        bankAccount: bankAccount.trim(),
      });
      showToast(
        "Solicitud Registrada",
        "success",
        `Se solicitó la liquidación de ${tokens} ECO (${money(tokens * 0.2)}). Nuestro equipo de tesorería procesará la transferencia.`
      );
      setTokenAmount("100");
      loadBalance();
      loadSettlements();
    } catch (err: any) {
      showToast(
        "Error al solicitar liquidación",
        "error",
        err.response?.data?.message || err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const fiatEstimated = (parseFloat(tokenAmount) || 0) * 0.2;
  const totalPaidFiat = settlements
    .filter((s) => s.status === "PAID")
    .reduce((acc, s) => acc + Number(s.fiatAmount || Number(s.tokenAmount) * 0.2), 0);

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Tesorería Comercial"
        title="Liquidaciones a Cuenta Bancaria (FIAT)"
        description="Convierte los EcoTokens acumulados de las compras de tus clientes en dinero de curso legal (PEN) transferido directamente a tu cuenta bancaria."
        action={
          <button
            onClick={() => {
              loadBalance();
              loadSettlements();
            }}
            disabled={loading}
            className="btn secondary"
            style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refrescar</span>
          </button>
        }
      />

      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi
          label="SALDO DISPONIBLE"
          value={`${walletBalance.toFixed(1)} ECO`}
          trend={`Equivalente a ${money(walletBalance * 0.2)}`}
          accent="var(--green)"
        />
        <Kpi
          label="TASA FIAT"
          value="S/ 0.20 por ECO"
          trend="Sin comisiones bancarias"
          accent="var(--blue)"
        />
        <Kpi
          label="TOTAL LIQUIDADO"
          value={money(totalPaidFiat)}
          trend="Transferido a tu banco"
          accent="var(--purple, #8b5cf6)"
        />
        <Kpi
          label="PLAZO DE ABONO"
          value="24 a 48 Horas"
          trend="Días hábiles bancarios"
          accent="var(--amber)"
        />
      </div>

      <div className="grid split" style={{ gap: 24, marginBottom: 28 }}>
        {/* Formulario de Solicitud de Liquidación */}
        <section className="card">
          <div className="section-title">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16 }}>
              <Building2 size={18} style={{ color: "var(--green)" }} />
              <span>Solicitar Abono en Soles (PEN)</span>
            </h2>
          </div>

          <form onSubmit={handleCreateSettlement} style={{ display: "grid", gap: 16, marginTop: 14 }}>
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
                Cantidad de EcoTokens a Liquidar
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max={walletBalance}
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    color: "var(--text, #0f172a)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setTokenAmount(String(Math.floor(walletBalance)))}
                  className="btn secondary"
                  style={{ fontSize: 12, padding: "0 12px" }}
                >
                  Máximo
                </button>
              </div>
              <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 700, marginTop: 6 }}>
                Recibirás en tu cuenta: {money(fiatEstimated)}
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
                Cuenta Bancaria de Destino (CCI o N° de Cuenta)
              </label>
              <input
                type="text"
                placeholder="Ej: BCP CCI 002-194-001234567890-12 a nombre de tu razón social"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
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
              disabled={submitting || walletBalance < 10}
              className="btn primary"
              style={{
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 10,
              }}
            >
              <Send size={15} />
              <span>{submitting ? "Enviando solicitud..." : "Solicitar Transferencia Bancaria"}</span>
            </button>
          </form>
        </section>

        {/* Garantías de Liquidación */}
        <section className="card" style={{ background: "var(--panel2, #f8fafc)", border: "1px solid var(--line, #e2e8f0)" }}>
          <div className="section-title">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15 }}>
              <ShieldCheck size={18} style={{ color: "var(--green)" }} />
              <span>Garantía de Conversión Livora</span>
            </h3>
          </div>

          <div style={{ fontSize: 13, color: "var(--muted, #64748b)", lineHeight: 1.6, display: "grid", gap: 10 }}>
            <p style={{ margin: 0 }}>
              • <strong>Paridad Respaldada:</strong> Cada EcoToken recibido en tu tienda cuenta con respaldo de tesorería institucional financiado por compras de materiales ESG de empresas B2B.
            </p>
            <p style={{ margin: 0 }}>
              • <strong>Trazabilidad de Abono:</strong> Una vez efectuada la transferencia interbancaria, se adjuntará el comprobante bancario digital descargable en este panel.
            </p>
            <p style={{ margin: 0 }}>
              • <strong>Seguridad On-Chain:</strong> Al completar el pago, los tokens correspondientes son retirados de circulación en la blockchain Stellar para garantizar transparencia matemática total.
            </p>
          </div>
        </section>
      </div>

      {/* Historial de Liquidaciones */}
      <section className="card">
        <div className="section-title">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Banknote size={18} style={{ color: "var(--green)" }} />
            <span>Historial de Solicitudes de Liquidación ({totalCount})</span>
          </h2>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : settlements.length === 0 ? (
          <EmptyState
            title="Sin solicitudes de liquidación"
            description="Aún no has solicitado abonos a cuenta bancaria. Los fondos acumulados en caja permanecen seguros en tu monedero comercial."
          />
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Fecha de Solicitud</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Tokens Canjeados</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Importe Soles (PEN)</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Cuenta Bancaria</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Estado</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)", textAlign: "right" }}>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                    <td style={{ padding: "12px", fontSize: 12, color: "var(--muted, #64748b)" }}>
                      {formatDate(s.createdAt)}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                      {Number(s.tokenAmount || 0).toFixed(1)} ECO
                    </td>
                    <td style={{ padding: "12px", fontWeight: 800, color: "var(--green)" }}>
                      {money(Number(s.fiatAmount || Number(s.tokenAmount) * 0.2))}
                    </td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: 12, color: "var(--muted, #64748b)" }}>
                      {s.bankAccount || "Cuenta registrada"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        className={`status ${s.status}`}
                        style={{ fontSize: 10, textTransform: "uppercase" }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {s.receiptUrl ? (
                        <a
                          href={s.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn ghost"
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FileCheck size={13} style={{ color: "var(--green)" }} />
                          <span>Ver Voucher</span>
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                          En procesamiento
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line, #e2e8f0)",
                  fontSize: 12,
                  color: "var(--muted, #64748b)",
                }}
              >
                <span>
                  Página {page} de {totalPages} ({totalCount} solicitudes)
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn secondary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn secondary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
