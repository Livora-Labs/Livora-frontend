"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHead, Status } from "@/components/Shell";
import {
  fetchBlockchainHealth,
  fetchFinancialReconciliation,
  fetchLedgerAudit,
  fetchQueueAudit,
  retryQueueJob,
  retryOutboxEvent,
  fetchServerLogs,
  retryPaymentMint,
} from "@/lib/api";
import { ToastContainer, showToast } from "@/components/ToastNotification";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Terminal,
  RotateCcw,
  Search,
  ShieldCheck,
  Zap,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Eye,
} from "lucide-react";

const shortId = (id?: string) =>
  id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "—";

const formatDateTime = (value?: string | number) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
};

export default function AdminAuditCenterPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "rpc" | "reconciliation" | "queues" | "logs"
  >("rpc");

  // --- Search & Filter States ---
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerCorrelationId, setLedgerCorrelationId] = useState("");
  const [logLevel, setLogLevel] = useState("ALL");
  const [logCorrelationId, setLogCorrelationId] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // --- Queries ---
  const {
    data: health,
    isLoading: loadingHealth,
    refetch: refetchHealth,
    isRefetching: refetchingHealth,
  } = useQuery({
    queryKey: ["adminBlockchainHealth"],
    queryFn: fetchBlockchainHealth,
    refetchInterval: 15000,
  });

  const {
    data: reconciliation,
    isLoading: loadingReconciliation,
    refetch: refetchReconciliation,
    isRefetching: refetchingReconciliation,
  } = useQuery({
    queryKey: ["adminFinancialReconciliation"],
    queryFn: fetchFinancialReconciliation,
    enabled: activeTab === "reconciliation",
  });

  const {
    data: ledgerData,
    isLoading: loadingLedger,
    refetch: refetchLedger,
  } = useQuery({
    queryKey: [
      "adminLedgerAudit",
      ledgerSearch,
      ledgerCorrelationId,
    ],
    queryFn: () =>
      fetchLedgerAudit({
        search: ledgerSearch || undefined,
        correlationId: ledgerCorrelationId || undefined,
        limit: 25,
      }),
    enabled: activeTab === "reconciliation",
  });

  const {
    data: queueData,
    isLoading: loadingQueues,
    refetch: refetchQueues,
    isRefetching: refetchingQueues,
  } = useQuery({
    queryKey: ["adminQueueAudit"],
    queryFn: fetchQueueAudit,
    enabled: activeTab === "queues",
    refetchInterval: 10000,
  });

  const {
    data: serverLogs,
    isLoading: loadingLogs,
    refetch: refetchLogs,
    isRefetching: refetchingLogs,
  } = useQuery({
    queryKey: ["adminServerLogs", logLevel, logCorrelationId, logSearch],
    queryFn: () =>
      fetchServerLogs({
        level: logLevel,
        correlationId: logCorrelationId || undefined,
        search: logSearch || undefined,
        limit: 50,
      }),
    enabled: activeTab === "logs",
  });

  // --- Mutations ---
  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => retryQueueJob(jobId),
    onSuccess: (data) => {
      showToast(
        "Trabajo Re-encolado",
        "success",
        data.message || "El trabajo fue enviado a la cola primaria para reprocesamiento.",
      );
      queryClient.invalidateQueries({ queryKey: ["adminQueueAudit"] });
    },
    onError: (err: any) => {
      showToast(
        "Error al reintentar trabajo",
        "error",
        err?.response?.data?.message || err.message,
      );
    },
  });

  const retryOutboxMutation = useMutation({
    mutationFn: (eventId: string) => retryOutboxEvent(eventId),
    onSuccess: () => {
      showToast(
        "Evento Outbox Restaurado",
        "success",
        "El evento fue devuelto a estado PENDING para ser procesado por el worker.",
      );
      queryClient.invalidateQueries({ queryKey: ["adminQueueAudit"] });
    },
    onError: (err: any) => {
      showToast(
        "Error al restaurar evento",
        "error",
        err?.response?.data?.message || err.message,
      );
    },
  });

  const retryMintMutation = useMutation({
    mutationFn: (paymentId: string) => retryPaymentMint(paymentId),
    onSuccess: (data) => {
      showToast(
        "Minteo Encolado",
        "success",
        data.message || "La orden de minteo fue encolada exitosamente.",
      );
      queryClient.invalidateQueries({ queryKey: ["adminQueueAudit"] });
    },
    onError: (err: any) => {
      showToast(
        "Error al forzar minteo",
        "error",
        err?.response?.data?.message || err.message,
      );
    },
  });

  const handleGlobalRefresh = () => {
    if (activeTab === "rpc") refetchHealth();
    if (activeTab === "reconciliation") {
      refetchReconciliation();
      refetchLedger();
    }
    if (activeTab === "queues") refetchQueues();
    if (activeTab === "logs") refetchLogs();
    showToast("Datos actualizados", "info", "Panel sincronizado con el servidor");
  };

  const isRefreshing =
    refetchingHealth ||
    refetchingReconciliation ||
    refetchingQueues ||
    refetchingLogs;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Operaciones & Soporte Técnico"
        title="Centro de Auditoría y Prevención de Pérdidas"
        description="Monitor en tiempo real de nodos Stellar, conciliación de partida doble, inspección de colas BullMQ/DLQ y visor de logs con Correlation ID."
        action={
          <button
            onClick={handleGlobalRefresh}
            className="btn"
            disabled={isRefreshing}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Sincronizando..." : "Actualizar"}
          </button>
        }
      />

      {/* Navegación por Pestañas */}
      <div
        style={{
          display: "flex",
          gap: 10,
          borderBottom: "1px solid var(--line)",
          marginBottom: 24,
          paddingBottom: 4,
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("rpc")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px 8px 0 0",
            background:
              activeTab === "rpc" ? "var(--panel)" : "transparent",
            color: activeTab === "rpc" ? "var(--green)" : "var(--muted)",
            border: activeTab === "rpc" ? "1px solid var(--line)" : "none",
            borderBottom: activeTab === "rpc" ? "2px solid var(--green)" : "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Activity size={16} /> Nodos RPC Stellar
        </button>

        <button
          onClick={() => setActiveTab("reconciliation")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px 8px 0 0",
            background:
              activeTab === "reconciliation" ? "var(--panel)" : "transparent",
            color:
              activeTab === "reconciliation"
                ? "var(--green)"
                : "var(--muted)",
            border:
              activeTab === "reconciliation"
                ? "1px solid var(--line)"
                : "none",
            borderBottom:
              activeTab === "reconciliation"
                ? "2px solid var(--green)"
                : "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ShieldCheck size={16} /> Conciliación Partida Doble
        </button>

        <button
          onClick={() => setActiveTab("queues")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px 8px 0 0",
            background:
              activeTab === "queues" ? "var(--panel)" : "transparent",
            color:
              activeTab === "queues" ? "var(--green)" : "var(--muted)",
            border: activeTab === "queues" ? "1px solid var(--line)" : "none",
            borderBottom:
              activeTab === "queues" ? "2px solid var(--green)" : "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Layers size={16} /> Colas BullMQ & Outbox
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px 8px 0 0",
            background:
              activeTab === "logs" ? "var(--panel)" : "transparent",
            color: activeTab === "logs" ? "var(--green)" : "var(--muted)",
            border: activeTab === "logs" ? "1px solid var(--line)" : "none",
            borderBottom:
              activeTab === "logs" ? "2px solid var(--green)" : "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Terminal size={16} /> Consola de Logs Servidor
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NODOS RPC Y RED STELLAR */}
      {/* ========================================================================= */}
      {activeTab === "rpc" && (
        <>
          {loadingHealth ? (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              Consultando telemetría del cluster Stellar RPC...
            </div>
          ) : (
            <>
              <div className="grid kpis" style={{ marginBottom: 24 }}>
                <div className="card kpi">
                  <div className="kpi-label">ESTADO DEL CLUSTER</div>
                  <div
                    className="kpi-value"
                    style={{
                      color:
                        health?.status === "healthy"
                          ? "var(--green)"
                          : "var(--amber)",
                    }}
                  >
                    {health?.status === "healthy"
                      ? "Saludable"
                      : "Degradado"}
                  </div>
                  <div className="trend">
                    {health?.network || "Stellar Testnet"}
                  </div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">LATENCIA RPC REAL</div>
                  <div className="kpi-value">{health?.latency || "—"}</div>
                  <div className="trend">Medición activa HTTP/RPC</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">ÚLTIMO LEDGER STELLAR</div>
                  <div className="kpi-value">
                    {health?.blockNumber
                      ? `#${health.blockNumber.toLocaleString()}`
                      : "Sincronizando"}
                  </div>
                  <div className="trend">Consenso Soroban</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">NODO ACTIVO</div>
                  <div
                    className="kpi-value"
                    style={{
                      fontSize: 16,
                      wordBreak: "break-all",
                      color: "var(--blue)",
                    }}
                  >
                    {health?.activeNodeUrl
                      ? health.activeNodeUrl.replace(/^https?:\/\//, "")
                      : "Desconocido"}
                  </div>
                  <div className="trend">QuickNode / Soroban Pool</div>
                </div>
              </div>

              <section className="card">
                <div className="section-title">
                  <h2>Pool de Nodos RPC Configurados con Failover Activo</h2>
                  <span className="live">Tolerancia a Fallas O(1)</span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>NIVEL (TIER)</th>
                        <th>URL DEL NODO</th>
                        <th>ESTADO</th>
                        <th>SOLICITUDES</th>
                        <th>ÉXITOS</th>
                        <th>FALLOS</th>
                        <th>FALLOS CONSECUTIVOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!health?.nodes || health.nodes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: "center",
                              color: "var(--muted)",
                              padding: 24,
                            }}
                          >
                            No hay información de nodos reportada por el servidor.
                          </td>
                        </tr>
                      ) : (
                        health.nodes.map((node: any, idx: number) => (
                          <tr key={idx}>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background:
                                    node.tier === "PRIMARY"
                                      ? "rgba(85, 230, 165, 0.15)"
                                      : node.tier === "SECONDARY"
                                      ? "rgba(114, 167, 255, 0.15)"
                                      : "rgba(255, 205, 112, 0.15)",
                                  color:
                                    node.tier === "PRIMARY"
                                      ? "var(--green)"
                                      : node.tier === "SECONDARY"
                                      ? "var(--blue)"
                                      : "var(--amber)",
                                }}
                              >
                                {node.tier}
                              </span>
                            </td>
                            <td className="mono" style={{ fontSize: 13 }}>
                              {node.url}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  color:
                                    node.status === "HEALTHY"
                                      ? "var(--green)"
                                      : "var(--red)",
                                  fontWeight: 600,
                                }}
                              >
                                {node.status === "HEALTHY" ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <AlertTriangle size={14} />
                                )}
                                {node.status}
                              </span>
                            </td>
                            <td>{node.totalRequests}</td>
                            <td style={{ color: "var(--green)" }}>
                              {node.totalSuccesses}
                            </td>
                            <td
                              style={{
                                color:
                                  node.totalFailures > 0
                                    ? "var(--red)"
                                    : "var(--muted)",
                              }}
                            >
                              {node.totalFailures}
                            </td>
                            <td>{node.consecutiveFailures}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECONCILIACIÓN CONTABLE (ZERO LOSS) */}
      {/* ========================================================================= */}
      {activeTab === "reconciliation" && (
        <>
          {loadingReconciliation ? (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              Auditando cuentas y calculando sumatorias de partida doble...
            </div>
          ) : (
            <>
              {/* Badge de Integridad Global */}
              <div
                style={{
                  background: reconciliation?.isReconciled
                    ? "rgba(85, 230, 165, 0.1)"
                    : "rgba(255, 125, 125, 0.15)",
                  border: `1px solid ${
                    reconciliation?.isReconciled
                      ? "var(--green)"
                      : "var(--red)"
                  }`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {reconciliation?.isReconciled ? (
                    <ShieldCheck size={32} style={{ color: "var(--green)" }} />
                  ) : (
                    <AlertTriangle size={32} style={{ color: "var(--red)" }} />
                  )}
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        color: reconciliation?.isReconciled
                          ? "var(--green)"
                          : "var(--red)",
                      }}
                    >
                      {reconciliation?.isReconciled
                        ? "INVARIANTE CONTABLE SATISFECHO: CERO FUGAS DE TOKENS"
                        : "ALERTA CRÍTICA: DISCREPANCIA EN PARTIDA DOBLE DETECTADA"}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "var(--muted)",
                      }}
                    >
                      {reconciliation?.isReconciled
                        ? `El 100% de las cuentas auditadas (${reconciliation?.summary?.totalAccountsAudited || 0}) cuadran exactamente con la sumatoria histórica de créditos y débitos.`
                        : `Se encontraron ${reconciliation?.discrepanciesCount} cuentas con discrepancia entre cachedBalance y el Libro Mayor.`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)" }}>
                  Auditoría ejecutada: {formatDateTime(reconciliation?.timestamp)}
                </div>
              </div>

              {/* KPIs de Suministro y Partida Doble */}
              <div className="grid kpis" style={{ marginBottom: 24 }}>
                <div className="card kpi">
                  <div className="kpi-label">TOKENS EN CIRCULACIÓN</div>
                  <div className="kpi-value" style={{ color: "var(--green)" }}>
                    {reconciliation?.summary?.totalCirculatingTokens?.toLocaleString() ||
                      0}{" "}
                    <span style={{ fontSize: 14 }}>LIVORA</span>
                  </div>
                  <div className="trend">Billeteras de usuarios</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">RESERVA DEL SISTEMA</div>
                  <div className="kpi-value">
                    {reconciliation?.summary?.totalTreasuryTokens?.toLocaleString() ||
                      0}{" "}
                    <span style={{ fontSize: 14 }}>LIVORA</span>
                  </div>
                  <div className="trend">Pools de emisión y quema</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">CRÉDITOS HISTÓRICOS</div>
                  <div className="kpi-value" style={{ color: "var(--blue)" }}>
                    +{reconciliation?.summary?.totalCredits?.toLocaleString() || 0}
                  </div>
                  <div className="trend">Total créditos procesados</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">DÉBITOS HISTÓRICOS</div>
                  <div className="kpi-value" style={{ color: "var(--amber)" }}>
                    -{reconciliation?.summary?.totalDebits?.toLocaleString() || 0}
                  </div>
                  <div className="trend">Canjes y quemas de tokens</div>
                </div>
              </div>

              {/* Tabla de Discrepancias (Si existieran) */}
              {reconciliation?.discrepancies &&
                reconciliation.discrepancies.length > 0 && (
                  <section
                    className="card"
                    style={{
                      border: "1px solid var(--red)",
                      marginBottom: 24,
                    }}
                  >
                    <div className="section-title">
                      <h2 style={{ color: "var(--red)" }}>
                        Cuentas con Discrepancia Detectada
                      </h2>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>CUENTA ID</th>
                            <th>USUARIO</th>
                            <th>TIPO</th>
                            <th>SALDO EN CACHÉ</th>
                            <th>SALDO CALCULADO LEDGER</th>
                            <th>VARIANZA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconciliation.discrepancies.map((d: any) => (
                            <tr key={d.accountId}>
                              <td className="mono">{shortId(d.accountId)}</td>
                              <td>{d.userEmail || "Sistema"}</td>
                              <td>{d.accountType}</td>
                              <td>{d.cachedBalance} LIVORA</td>
                              <td>{d.calculatedLedgerBalance} LIVORA</td>
                              <td
                                style={{
                                  color: "var(--red)",
                                  fontWeight: 700,
                                }}
                              >
                                {d.variance}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              {/* Explorador de Libro Mayor (Ledger Entries) */}
              <section className="card">
                <div className="section-title">
                  <h2>Explorador del Libro Mayor (Ledger Entries)</h2>
                  <span className="live">Trazabilidad Inmutable</span>
                </div>

                {/* Filtros de búsqueda */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                    <Search
                      size={16}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        color: "var(--muted)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Buscar por descripción, correo de usuario o hash..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 36px",
                        background: "var(--input-bg)",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        color: "var(--text)",
                        fontSize: 13,
                      }}
                    />
                  </div>

                  <div style={{ width: 280 }}>
                    <input
                      type="text"
                      placeholder="Filtrar por Correlation ID exacto..."
                      value={ledgerCorrelationId}
                      onChange={(e) => setLedgerCorrelationId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "var(--input-bg)",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        color: "var(--text)",
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>FECHA</th>
                        <th>TIPO</th>
                        <th>MONTO</th>
                        <th>USUARIO / CUENTA</th>
                        <th>DESCRIPCIÓN</th>
                        <th>CORRELATION ID</th>
                        <th>HASH STELLAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLedger ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: "center",
                              padding: 24,
                              color: "var(--muted)",
                            }}
                          >
                            Cargando asientos del libro mayor...
                          </td>
                        </tr>
                      ) : !ledgerData?.items || ledgerData.items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: "center",
                              padding: 24,
                              color: "var(--muted)",
                            }}
                          >
                            No se encontraron asientos contables con los filtros especificados.
                          </td>
                        </tr>
                      ) : (
                        ledgerData.items.map((entry: any) => (
                          <tr key={entry.id}>
                            <td style={{ fontSize: 12 }}>
                              {formatDateTime(entry.createdAt)}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background:
                                    entry.entryType === "CREDIT"
                                      ? "rgba(85, 230, 165, 0.15)"
                                      : "rgba(255, 125, 125, 0.15)",
                                  color:
                                    entry.entryType === "CREDIT"
                                      ? "var(--green)"
                                      : "var(--red)",
                                }}
                              >
                                {entry.entryType === "CREDIT" ? (
                                  <ArrowDownRight size={12} />
                                ) : (
                                  <ArrowUpRight size={12} />
                                )}
                                {entry.entryType}
                              </span>
                            </td>
                            <td
                              style={{
                                fontWeight: 700,
                                color:
                                  entry.entryType === "CREDIT"
                                    ? "var(--green)"
                                    : "var(--red)",
                              }}
                            >
                              {entry.entryType === "CREDIT" ? "+" : "-"}
                              {Number(entry.amount).toFixed(4)} LIVORA
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                {entry.account?.user?.email || "Sistema"}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--muted)",
                                }}
                              >
                                {entry.account?.accountType}
                              </div>
                            </td>
                            <td style={{ fontSize: 13 }}>{entry.description}</td>
                            <td className="mono" style={{ fontSize: 11 }}>
                              {shortId(entry.correlationId)}
                            </td>
                            <td className="mono" style={{ fontSize: 11 }}>
                              {entry.txHash ? shortId(entry.txHash) : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COLAS BULLMQ, DLQ Y TRANSACTIONAL OUTBOX */}
      {/* ========================================================================= */}
      {activeTab === "queues" && (
        <>
          {loadingQueues ? (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              Consultando estado de Redis BullMQ y Dead-Letter Queue...
            </div>
          ) : (
            <>
              {/* KPIs de Colas */}
              <div className="grid kpis" style={{ marginBottom: 24 }}>
                <div className="card kpi">
                  <div className="kpi-label">EN ESPERA (WAITING)</div>
                  <div className="kpi-value">
                    {queueData?.queueStats?.waiting ?? 0}
                  </div>
                  <div className="trend">Pendientes de ejecución</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">EN EJECUCIÓN (ACTIVE)</div>
                  <div className="kpi-value" style={{ color: "var(--blue)" }}>
                    {queueData?.queueStats?.active ?? 0}
                  </div>
                  <div className="trend">Procesándose actualmente</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">COMPLETADOS</div>
                  <div className="kpi-value" style={{ color: "var(--green)" }}>
                    {queueData?.queueStats?.completed ?? 0}
                  </div>
                  <div className="trend">Éxitos recientes</div>
                </div>

                <div className="card kpi">
                  <div className="kpi-label">DEAD LETTER QUEUE (DLQ)</div>
                  <div
                    className="kpi-value"
                    style={{
                      color:
                        (queueData?.queueStats?.dlqCount ?? 0) > 0
                          ? "var(--red)"
                          : "var(--muted)",
                    }}
                  >
                    {queueData?.queueStats?.dlqCount ?? 0}
                  </div>
                  <div className="trend">Fallos agotados requiriendo acción</div>
                </div>
              </div>

              {/* Trabajos Fallidos en BullMQ / DLQ */}
              <section className="card" style={{ marginBottom: 24 }}>
                <div className="section-title">
                  <h2>Trabajos Fallidos en Colas Blockchain (BullMQ & DLQ)</h2>
                  <span className="live">Capacidad de Reintento 1-Click</span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>COLA</th>
                        <th>NOMBRE DE TAREA</th>
                        <th>MOTIVO DE FALLO</th>
                        <th>FECHA</th>
                        <th>ACCIÓN DE SOPORTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!queueData?.failedJobs || queueData.failedJobs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              textAlign: "center",
                              padding: 24,
                              color: "var(--green)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                              }}
                            >
                              <CheckCircle2 size={16} /> No hay trabajos fallidos ni acumulados en la Dead-Letter Queue.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        queueData.failedJobs.map((job: any, idx: number) => (
                          <tr key={idx}>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background:
                                    job.queue === "blockchain-dlq"
                                      ? "rgba(255, 125, 125, 0.15)"
                                      : "rgba(255, 205, 112, 0.15)",
                                  color:
                                    job.queue === "blockchain-dlq"
                                      ? "var(--red)"
                                      : "var(--amber)",
                                }}
                              >
                                {job.queue}
                              </span>
                            </td>
                            <td className="mono">{job.name}</td>
                            <td
                              style={{
                                fontSize: 12,
                                color: "var(--red)",
                                maxWidth: 300,
                                wordBreak: "break-word",
                              }}
                            >
                              {job.failedReason || "Error no especificado"}
                            </td>
                            <td style={{ fontSize: 12 }}>
                              {formatDateTime(job.timestamp)}
                            </td>
                            <td>
                              <button
                                className="btn"
                                onClick={() =>
                                  job.id && retryJobMutation.mutate(job.id)
                                }
                                disabled={retryJobMutation.isPending}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 12,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <RotateCcw size={12} /> Reintentar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Eventos Transactional Outbox */}
              <section className="card" style={{ marginBottom: 24 }}>
                <div className="section-title">
                  <h2>Eventos en Transactional Outbox (PostgreSQL)</h2>
                  <span className="live">
                    Pendientes: {queueData?.outboxStats?.pending ?? 0} | Fallidos:{" "}
                    {queueData?.outboxStats?.failed ?? 0}
                  </span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>TIPO DE AGREGADO</th>
                        <th>TIPO DE EVENTO</th>
                        <th>ESTADO</th>
                        <th>REINTENTOS</th>
                        <th>ERROR</th>
                        <th>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!queueData?.outboxStats?.recentEvents ||
                      queueData.outboxStats.recentEvents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              textAlign: "center",
                              padding: 24,
                              color: "var(--muted)",
                            }}
                          >
                            No hay eventos pendientes ni fallidos en la tabla outbox_events.
                          </td>
                        </tr>
                      ) : (
                        queueData.outboxStats.recentEvents.map((evt: any) => (
                          <tr key={evt.id}>
                            <td>{evt.aggregateType}</td>
                            <td className="mono">{evt.eventType}</td>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background:
                                    evt.status === "FAILED"
                                      ? "rgba(255, 125, 125, 0.15)"
                                      : "rgba(255, 205, 112, 0.15)",
                                  color:
                                    evt.status === "FAILED"
                                      ? "var(--red)"
                                      : "var(--amber)",
                                }}
                              >
                                {evt.status}
                              </span>
                            </td>
                            <td>{evt.retryCount}</td>
                            <td
                              style={{
                                fontSize: 12,
                                color: "var(--red)",
                                maxWidth: 280,
                                wordBreak: "break-word",
                              }}
                            >
                              {evt.errorMessage || "—"}
                            </td>
                            <td>
                              <button
                                className="btn"
                                onClick={() =>
                                  retryOutboxMutation.mutate(evt.id)
                                }
                                disabled={retryOutboxMutation.isPending}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 12,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <RotateCcw size={12} /> Reprocesar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Pagos Fiduciarios con Minteo Pendiente */}
              {queueData?.pendingPayments &&
                queueData.pendingPayments.length > 0 && (
                  <section className="card">
                    <div className="section-title">
                      <h2>Pagos Confirmados con Minteo de Tokens Pendiente</h2>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ORDEN DE COMPRA</th>
                            <th>USUARIO</th>
                            <th>MONTO PEN</th>
                            <th>TOKENS A ENTREGAR</th>
                            <th>ESTADO BLOCKCHAIN</th>
                            <th>ACCIÓN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queueData.pendingPayments.map((p: any) => (
                            <tr key={p.id}>
                              <td className="mono">{p.purchaseNumber}</td>
                              <td>{p.user?.email}</td>
                              <td>S/ {Number(p.amountPen).toFixed(2)}</td>
                              <td style={{ color: "var(--green)", fontWeight: 700 }}>
                                {Number(p.tokenAmount).toFixed(4)} LIVORA
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    background: "rgba(255, 205, 112, 0.15)",
                                    color: "var(--amber)",
                                  }}
                                >
                                  {p.blockchainStatus}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn"
                                  onClick={() => retryMintMutation.mutate(p.id)}
                                  disabled={retryMintMutation.isPending}
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <Zap size={12} /> Forzar Minteo
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONSOLA DE LOGS DEL SERVIDOR */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <section className="card">
          <div className="section-title">
            <h2>Visor de Eventos del Servidor (Ring Buffer 1,000 registros)</h2>
            <span className="live">
              Total en buffer: {serverLogs?.stats?.totalBuffered ?? 0} | Errores:{" "}
              {serverLogs?.stats?.errors ?? 0} | Advertencias:{" "}
              {serverLogs?.stats?.warnings ?? 0}
            </span>
          </div>

          {/* Filtros de Logs */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: 140 }}>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  color: "var(--text)",
                  fontSize: 13,
                }}
              >
                <option value="ALL">Todos (ALL)</option>
                <option value="ERROR">Solo Errores (ERROR)</option>
                <option value="WARN">Advertencias (WARN)</option>
                <option value="INFO">Informativos (INFO)</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "var(--muted)",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por mensaje o módulo..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  color: "var(--text)",
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ width: 280 }}>
              <input
                type="text"
                placeholder="Filtrar por Correlation ID..."
                value={logCorrelationId}
                onChange={(e) => setLogCorrelationId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  color: "var(--text)",
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>HORA</th>
                  <th>NIVEL</th>
                  <th>MÓDULO</th>
                  <th>MENSAJE</th>
                  <th>CORRELATION ID</th>
                  <th>PAYLOAD</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "var(--muted)",
                      }}
                    >
                      Cargando registros del buffer...
                    </td>
                  </tr>
                ) : !serverLogs?.items || serverLogs.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "var(--muted)",
                      }}
                    >
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  serverLogs.items.map((log: any) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr>
                          <td style={{ fontSize: 12 }}>
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background:
                                  log.level === "ERROR"
                                    ? "rgba(255, 125, 125, 0.15)"
                                    : log.level === "WARN"
                                    ? "rgba(255, 205, 112, 0.15)"
                                    : "rgba(114, 167, 255, 0.15)",
                                color:
                                  log.level === "ERROR"
                                    ? "var(--red)"
                                    : log.level === "WARN"
                                    ? "var(--amber)"
                                    : "var(--blue)",
                              }}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>
                            {log.context}
                          </td>
                          <td style={{ fontSize: 13 }}>{log.message}</td>
                          <td className="mono" style={{ fontSize: 11 }}>
                            {log.correlationId ? shortId(log.correlationId) : "—"}
                          </td>
                          <td>
                            {log.data ? (
                              <button
                                className="btn"
                                onClick={() =>
                                  setExpandedLogId(isExpanded ? null : log.id)
                                }
                                style={{
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Eye size={12} /> {isExpanded ? "Ocultar" : "Ver"}
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--muted)",
                                }}
                              >
                                Ninguno
                              </span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && log.data && (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                background: "var(--panel2)",
                                padding: 12,
                              }}
                            >
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "var(--green)",
                                  overflowX: "auto",
                                  fontFamily: "monospace",
                                }}
                              >
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
