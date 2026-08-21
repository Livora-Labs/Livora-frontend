"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead, Kpi } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { fetchWalletTransactions } from "@/lib/api";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Hash, RefreshCw, AlertCircle, Clock } from "lucide-react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

function ipfsLink(cid: string): string {
  if (!cid) return "#";
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}${hash}`;
}

function contractAddress(addr: string): string {
  if (!addr) return "—";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function RecolectorTransfersPage() {
  const { token, balance, refreshBalance } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadTransactions();
  }, [token]);

  const loadTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await refreshBalance().catch(() => {});
      const data = await fetchWalletTransactions();
      setTransactions(data || []);
    } catch (err: any) {
      showToast("Error al cargar transacciones", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const incomingCount = transactions.filter(t => t.direction === "IN").length;
  const outgoingCount = transactions.filter(t => t.direction === "OUT").length;

  return (
    <Shell role="recolector">
      <ToastContainer />
      <PageHead
        eyebrow="Trazabilidad Financiera"
        title="Historial de EcoTokens (ECO)"
        description="Consulta las transferencias on-chain de tu unidad recolectora, incluyendo recompensas por reciclaje y canjes en comercios."
        action={
          <button onClick={loadTransactions} disabled={loading} className="btn secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Actualizar</span>
          </button>
        }
      />

      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <Kpi label="SALDO DISPONIBLE" value={`${balance} ECO`} trend="Billetera Stellar Testnet" accent="var(--green)" />
        <Kpi label="RECOMPENSAS RECIBIDAS" value={`${incomingCount}`} trend="Ingresos por recolección" accent="var(--blue)" />
        <Kpi label="PAGOS REALIZADOS" value={`${outgoingCount}`} trend="Pagos en comercios" accent="var(--amber)" />
      </div>

      <section className="card">
        <div className="section-title">
          <h2>Historial de Transferencias</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Cargando transacciones...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 14 }}>
            <AlertCircle size={24} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            No se encontraron transacciones registradas.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>TIPO</th>
                  <th>FECHA/HORA</th>
                  <th>DESTINATARIO / EMISOR</th>
                  <th>CLAVE PÚBLICA</th>
                  <th>CANTIDAD</th>
                  <th>STELLAR TX</th>
                  <th>METADATA IPFS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => {
                  const stellarExplorerUrl = t.txHash ? `https://stellar.expert/explorer/testnet/tx/${t.txHash}` : null;
                  const ipfsUrl = t.ipfsCid ? ipfsLink(t.ipfsCid) : null;
                  const isIncoming = t.direction === "IN";

                  return (
                    <tr key={t.id}>
                      <td>
                        <span
                          style={{
                            background: isIncoming ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: isIncoming ? "#10B981" : "#F59E0B",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {isIncoming ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          {t.type.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={11} style={{ color: "#64748B" }} />
                          <div>
                            <div>{new Date(t.createdAt).toLocaleDateString("es-PE")}</div>
                            <small style={{ color: "#64748B" }}>
                              {new Date(t.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#F8FAFC" }}>{t.recipientName}</strong>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 11, color: "#94A3B8" }} title={t.recipientWallet}>
                          {contractAddress(t.recipientWallet)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: isIncoming ? "#10B981" : "#EF4444", fontSize: 14 }}>
                          {isIncoming ? "+" : "-"}{Number(t.amount).toFixed(2)} ECO
                        </strong>
                      </td>
                      <td>
                        {stellarExplorerUrl ? (
                          <a
                            href={stellarExplorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#3B82F6",
                              fontSize: 11,
                              fontFamily: "monospace",
                              textDecoration: "none",
                            }}
                          >
                            <span>{t.txHash.slice(0, 10)}...</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>Pendiente</span>
                        )}
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
                          >
                            <Hash size={11} />
                            <span>Ver contenido</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: "#475569", fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}
