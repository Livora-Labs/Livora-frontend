"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHead, Status } from "@/components/Shell";
import { fetchBatchById, resolveBatchDispute } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { CardSkeleton } from "@/components/skeletons/SkeletonUI";
import { ErrorState, EmptyState } from "@/components/StateFeedback";
import { Check, ExternalLink } from "lucide-react";

// Local formatting helpers to avoid importing lib/data
const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export default function Detail() {
  const params = useParams();
  const id = params?.id as string;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolutionChoice, setResolutionChoice] = useState<"ACCEPT_REVISION" | "REJECT_DISPUTE">("ACCEPT_REVISION");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [adjustedWeights, setAdjustedWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) {
      loadBatch();
    }
  }, [id]);

  const loadBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatchById(id);
      setBatch(data);
      if (data?.materialsActual) {
        setAdjustedWeights({ ...data.materialsActual });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error al cargar detalle del lote";
      setError(msg);
      showToast("Error al cargar lote", "error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!batch) return;
    setResolving(true);
    try {
      await resolveBatchDispute(batch.id, {
        resolution: resolutionChoice,
        adjustedWeights: resolutionChoice === "ACCEPT_REVISION" ? adjustedWeights : undefined,
        notes: disputeNotes,
      });
      showToast("Disputa resuelta con éxito", "success");
      await loadBatch();
    } catch (err: any) {
      showToast("Error al resolver la disputa", "error", err.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <ErrorState
          title="Error al consultar el lote"
          message={error}
          onRetry={loadBatch}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/admin/batches" className="btn ghost">
            ← Volver a lotes
          </Link>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <EmptyState
          title="Lote no encontrado"
          description="El identificador de lote no corresponde a ningún registro activo o fue consolidado."
          actionHref="/admin/batches"
          actionLabel="Volver al explorador de lotes"
        />
      </div>
    );
  }

  const weight = Object.values(batch.materialsActual || {}).reduce((a: any, c: any) => a + Number(c), 0) as number;
  const stellarTx = batch.stellarTxHash || batch.txHash;

  // Cálculo dinámico de los 5 estados de la Cadena de Custodia
  const isCreated = Boolean(batch.createdAt);
  const isCollected = (batch.requests?.length || 0) > 0 || isCreated;
  const isTransit = batch.status === "IN_TRANSIT" || batch.status === "PROCESSING" || batch.status === "RECEIVED" || batch.status === "CONSOLIDATED";
  const isWeighed = batch.status === "PROCESSING" || batch.status === "RECEIVED" || batch.status === "CONSOLIDATED" || weight > 0;
  const isNotarized = Boolean(stellarTx);

  const steps = [
    {
      num: 1,
      name: "Recolección Urbana",
      desc: "Generación en hogares y trazabilidad de origen",
      done: isCollected,
      active: batch.status === "OPEN",
      details: `${batch.requests?.length || 0} domicilios registrados · Origen verificado`,
      date: date(batch.createdAt),
    },
    {
      num: 2,
      name: "Logística y Tránsito",
      desc: "Transporte seguro hacia el centro de acopio",
      done: isTransit,
      active: batch.status === "IN_TRANSIT",
      details: batch.destinationCenter?.email ? `Destino: ${batch.destinationCenter.name || batch.destinationCenter.email}` : "Centro asignado",
      date: batch.updatedAt ? date(batch.updatedAt) : "—",
    },
    {
      num: 3,
      name: "Báscula Industrial",
      desc: "Validación de peso neto, materiales y merma",
      done: isWeighed,
      active: batch.status === "PROCESSING",
      details: weight > 0 ? `${kg(weight)} neto registrado` : "A la espera de balanza",
      date: batch.updatedAt ? date(batch.updatedAt) : "—",
    },
    {
      num: 4,
      name: "Liquidación Contable Dual",
      desc: "Acreditación de tokens ECO y pago fiat en soles",
      done: Boolean(batch.fiatSettled) || isNotarized,
      active: !batch.fiatSettled && isWeighed,
      details: batch.fiatSettled ? `Liquidado en soles (${batch.fiatSettledAt ? date(batch.fiatSettledAt) : "Confirmado"})` : "Pendiente de pago físico",
      date: batch.fiatSettledAt ? date(batch.fiatSettledAt) : "—",
    },
    {
      num: 5,
      name: "Notarización On-Chain",
      desc: "Inmutabilidad en el Ledger de Stellar e IPFS",
      done: isNotarized,
      active: !isNotarized && isWeighed,
      details: isNotarized ? `Tx: ${shortId(stellarTx)}` : "Encolado para minting",
      date: isNotarized ? date(batch.updatedAt) : "Pendiente",
    },
  ];

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Pasaporte Digital de Trazabilidad"
        title={`Lote #${shortId(batch.id)}`}
        description="Ficha técnica de trazabilidad inmutable, custodia física y certificación en la red Stellar."
        action={<Status value={batch.status} />}
      />

      {/* Tarjeta de Resumen Ejecutivo y Composición */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Peso Total Certificado
          </span>
          <div style={{ fontSize: 30, fontWeight: 800, color: weight ? "var(--green)" : "var(--text)", marginTop: 6 }}>
            {weight ? kg(weight) : (batch.usefulWeightKg ? kg(Number(batch.usefulWeightKg)) : "Por pesar")}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Merma/descarte: {batch.wasteWeightKg ? kg(Number(batch.wasteWeightKg)) : "0.0 kg"}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Actores de la Cadena
          </span>
          <div style={{ fontSize: 13, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <strong style={{ color: "var(--muted)" }}>Recolector: </strong>
              <span>{batch.collector?.name || batch.collector?.email || "Sin asignar"}</span>
            </div>
            <div>
              <strong style={{ color: "var(--muted)" }}>Centro Receptor: </strong>
              <span>{batch.destinationCenter?.name || batch.destinationCenter?.email || "En tránsito"}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Inmutabilidad Criptográfica
          </span>
          <div style={{ fontSize: 12, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <strong style={{ color: "var(--muted)" }}>Stellar Tx: </strong>
              {stellarTx ? (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${stellarTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <span>{shortId(stellarTx)}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ color: "var(--muted)" }}>Pendiente de emisión</span>
              )}
            </div>
            <div>
              <strong style={{ color: "var(--muted)" }}>IPFS CID: </strong>
              {batch.ipfsCid ? (
                <a
                  href={`https://ipfs.io/ipfs/${batch.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <span>{shortId(batch.ipfsCid)}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ color: "var(--muted)" }}>Pendiente</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cadena de Custodia Interactiva de 5 Fases */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Cadena de Custodia Paso a Paso</h2>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0 0" }}>
              Trazabilidad física y digital en tiempo real con evidencia auditable de cada fase.
            </p>
          </div>
          <span className="live" style={{ fontSize: 12 }}>Protocolo ISO 14044</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            position: "relative",
          }}
        >
          {steps.map((s) => {
            const isCompleted = s.done;
            const isCurrent = s.active;
            const borderColor = isCompleted
              ? "var(--green)"
              : isCurrent
              ? "var(--blue)"
              : "var(--line)";
            const bgBadge = isCompleted
              ? "var(--green)"
              : isCurrent
              ? "var(--blue)"
              : "var(--panel2)";
            const textBadgeColor = isCompleted || isCurrent ? "#ffffff" : "var(--muted)";

            return (
              <div
                key={s.num}
                style={{
                  background: isCurrent ? "rgba(114, 167, 255, 0.05)" : "var(--panel2)",
                  border: `2px solid ${borderColor}`,
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: bgBadge,
                      color: textBadgeColor,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {isCompleted ? <Check size={13} /> : s.num}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: isCompleted
                        ? "rgba(5, 150, 105, 0.1)"
                        : isCurrent
                        ? "rgba(114, 167, 255, 0.1)"
                        : "var(--panel)",
                      color: isCompleted
                        ? "var(--green)"
                        : isCurrent
                        ? "var(--blue)"
                        : "var(--muted)",
                    }}
                  >
                    {isCompleted ? "Completado" : isCurrent ? "En Progreso" : "Pendiente"}
                  </span>
                </div>

                <div>
                  <strong style={{ fontSize: 14, color: "var(--text)", display: "block" }}>{s.name}</strong>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0 0", lineHeight: 1.4 }}>{s.desc}</p>
                </div>

                <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--line)", fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>{s.details}</div>
                  <div style={{ color: "var(--muted)", marginTop: 2 }}>{s.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de Detalle: Desglose de Materiales y Evidencias de Origen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {/* Desglose de Materiales */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Desglose de Materiales Verificados</h2>
            <strong style={{ color: "var(--green)" }}>{weight ? kg(weight) : "Pendiente"}</strong>
          </div>

          {Object.entries(batch.materialsActual || {}).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(batch.materialsActual || {}).map(([m, v]: any) => (
                <div
                  key={m}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--panel2)",
                    borderRadius: 10,
                  }}
                >
                  <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 13 }}>{m}</span>
                  <strong style={{ fontSize: 14 }}>{kg(Number(v))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              Este lote aún se encuentra en recolección o tránsito. Los materiales se desglosarán al ingresar a la báscula del centro de acopio.
            </p>
          )}

          {/* Liquidación Fiat en Centro */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Liquidación en Soles (Fiat)</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: batch.fiatSettled ? "rgba(5, 150, 105, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  color: batch.fiatSettled ? "var(--green)" : "#F59E0B",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {batch.fiatSettled ? (
                  <>
                    <span>Liquidado</span>
                    <Check size={12} />
                  </>
                ) : (
                  "Pendiente de pago"
                )}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0 0" }}>
              {batch.fiatSettled
                ? `Monto entregado al recolector en ventanilla física${batch.fiatSettledAt ? ` el ${date(batch.fiatSettledAt)}` : ""}.`
                : "El centro receptor aún no liquida el contravalor físico al recolector."}
            </p>
          </div>
        </div>

        {/* Evidencias de Recolección en Domicilio */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Evidencias de Origen Domiciliario</h2>
            <span className="muted" style={{ fontSize: 12 }}>{batch.requests?.length || 0} solicitudes asociadas</span>
          </div>

          {batch.requests?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
              {batch.requests.map((r: any) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    background: "var(--panel2)",
                    borderRadius: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, display: "block" }}>{r.description || "Recolección de reciclables"}</strong>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      Coordenadas GPS: {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      Hogar: {r.household?.email || `#${r.householdId?.slice(0, 6)}`}
                    </div>
                  </div>
                  <Status value={r.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              Este lote no cuenta con recolecciones individuales vinculadas directamente o proviene de una consolidación mayor.
            </p>
          )}
        </div>
      </div>

      {/* Panel de Arbitraje si el lote está en disputa */}
      {batch.status === "DISPUTED" && (
        <div className="card" style={{ marginTop: 20, border: "2px solid #A855F7", background: "rgba(168, 85, 247, 0.04)", padding: 24 }}>
          <div className="section-title">
            <h2 style={{ color: "#A855F7", fontSize: 18, margin: 0 }}>Panel de Arbitraje Administrativo B2B</h2>
            <span style={{ background: "#A855F7", color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
              En Impugnación
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
            El recolector ha impugnado formalmente la medición de este lote al detectar una diferencia de pesaje con respecto a lo recolectado.
          </p>
          {batch.disputeReason && (
            <div style={{ background: "var(--panel)", padding: 14, borderRadius: 10, margin: "14px 0", borderLeft: "4px solid #A855F7" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>MOTIVO DE LA IMPUGNACIÓN:</div>
              <div style={{ fontSize: 14, marginTop: 4, color: "var(--text)", fontWeight: 500 }}>{batch.disputeReason}</div>
              {batch.disputedAt && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                  Registrada el: {date(batch.disputedAt)}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
                Decisión Arbitral Definitiva:
              </label>
              <select
                value={resolutionChoice}
                onChange={(e) => setResolutionChoice(e.target.value as any)}
                style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--panel)", border: "1px solid var(--line)", color: "var(--text)" }}
              >
                <option value="ACCEPT_REVISION">Aceptar Revisión y Reajustar Pesaje Oficial</option>
                <option value="REJECT_DISPUTE">Rechazar Disputa y Mantener Pesaje Registrado por el Centro</option>
              </select>
            </div>

            {resolutionChoice === "ACCEPT_REVISION" && (
              <div style={{ background: "var(--panel)", padding: 14, borderRadius: 10, border: "1px solid var(--line)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
                  Pesaje Definitivo Arbitrado (kg):
                </div>
                {Object.keys(batch.materialsActual || {}).map((m) => (
                  <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, textTransform: "uppercase" }}>{m}:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={adjustedWeights[m] ?? batch.materialsActual[m]}
                      onChange={(e) =>
                        setAdjustedWeights({ ...adjustedWeights, [m]: parseFloat(e.target.value) || 0 })
                      }
                      style={{ width: 110, padding: "6px 10px", borderRadius: 6, background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--text)", textAlign: "right" }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "block", marginBottom: 6 }}>
                Dictamen y Justificación Técnica de Auditoría:
              </label>
              <textarea
                rows={3}
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                placeholder="Ingresa la fundamentación técnica y normativa de esta resolución..."
                style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--panel)", border: "1px solid var(--line)", color: "var(--text)" }}
              />
            </div>

            <button
              type="button"
              onClick={handleResolveDispute}
              disabled={resolving}
              className="btn primary"
              style={{ width: "100%", background: "#A855F7", borderColor: "#A855F7", padding: "10px 16px" }}
            >
              {resolving ? "Firmando resolución..." : "Ejecutar Resolución de Disputa"}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link href="/admin/batches" className="btn secondary" style={{ fontSize: 13 }}>
          ← Volver al Explorador de Lotes
        </Link>
      </div>
    </>
  );
}
