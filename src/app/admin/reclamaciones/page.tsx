"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import {
  fetchAdminComplaints,
  updateAdminComplaintStatus,
} from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  FileText,
  Send,
  Eye,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Calendar,
} from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { EmptyState } from "@/components/StateFeedback";
import { IndecopiBookLogo } from "@/components/Footer";

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

// Cálculo de días hábiles transcurridos (Lunes a Viernes)
function getBusinessDaysRemaining(createdDateStr: string, limitDays: number = 15): number {
  const created = new Date(createdDateStr);
  const now = new Date();
  let count = 0;
  const cur = new Date(created);

  while (cur < now) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return limitDays - count;
}

export default function AdminReclamacionesPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [claimTypeFilter, setClaimTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal / Detail state
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [responseStatus, setResponseStatus] = useState("RESOLVED");
  const [legalNote, setLegalNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter, claimTypeFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminComplaints({
        page,
        limit,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        claimType: claimTypeFilter === "ALL" ? undefined : claimTypeFilter,
        search: search.trim() || undefined,
      });

      if (res && res.data) {
        setComplaints(res.data);
        setTotalCount(res.total || 0);
      } else if (Array.isArray(res)) {
        setComplaints(res);
        setTotalCount(res.length);
      } else {
        setComplaints([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      showToast("Error al cargar reclamaciones", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComplaints();
  };

  const handleOpenDetail = (complaint: any) => {
    setSelectedComplaint(complaint);
    setResponseStatus(complaint.status || "RESOLVED");
    setLegalNote(complaint.legalResponseNote || "");
  };

  const handleSaveStatus = async () => {
    if (!selectedComplaint) return;
    setSavingStatus(true);
    try {
      await updateAdminComplaintStatus(selectedComplaint.id, {
        status: responseStatus,
        legalResponseNote: legalNote,
      });
      showToast(
        "Resolución Guardada",
        "success",
        `Reclamo ${selectedComplaint.correlativeNumber} actualizado a ${responseStatus}`
      );
      setSelectedComplaint(null);
      loadComplaints();
    } catch (err: any) {
      showToast(
        "Error al actualizar estado",
        "error",
        err.response?.data?.message || err.message
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // KPIs
  const pendingCount = complaints.filter((c) => c.status === "PENDING" || c.status === "INVESTIGATING").length;
  const criticalCount = complaints.filter((c) => {
    if (c.status === "RESOLVED" || c.status === "REJECTED") return false;
    const remaining = getBusinessDaysRemaining(c.createdAt, 15);
    return remaining <= 3;
  }).length;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Cumplimiento Normativo Indecopi"
        title="Libro de Reclamaciones Virtual"
        description="Auditoría legal y resolución de quejas y reclamos conforme al Código de Protección y Defensa del Consumidor (Ley 29571 / Ley 32495)."
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--panel2, #f8fafc)", borderRadius: 10, border: "1px solid var(--line, #e2e8f0)" }}>
              <IndecopiBookLogo width={22} height={22} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text, #0f172a)" }}>
                Registro Oficial Indecopi
              </span>
            </div>
            <button
              onClick={loadComplaints}
              disabled={loading}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      <div className="grid kpis" style={{ marginBottom: 20 }}>
        <Kpi
          label="TOTAL EN LIBRO"
          value={String(totalCount)}
          trend="Hojas de reclamación registradas"
          accent="var(--blue)"
        />
        <Kpi
          label="EN TRÁMITE"
          value={String(pendingCount)}
          trend="Pendientes o en investigación"
          accent="var(--amber)"
        />
        <Kpi
          label="PLAZO MÁXIMO LEGAL"
          value="15 Días Hábiles"
          trend="Plazo no prorrogable (Ley 32495)"
          accent="var(--purple, #8b5cf6)"
        />
        <Kpi
          label="PLAZO CRÍTICO (≤ 3 DÍAS)"
          value={String(criticalCount)}
          trend={criticalCount > 0 ? "¡Riesgo de sanción!" : "Bajo control legal"}
          accent={criticalCount > 0 ? "var(--red, #ef4444)" : "var(--green)"}
        />
      </div>

      {/* Alerta de Plazos Legales */}
      {criticalCount > 0 && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 14,
            padding: "14px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ShieldAlert size={22} style={{ color: "#ef4444", flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#991b1b" }}>
            <strong>Atención requerida:</strong> Hay {criticalCount} reclamación(es) con 3 días hábiles o menos para vencer el plazo perentorio de 15 días hábiles establecido por Indecopi. Responde con urgencia para evitar multas administrativas.
          </div>
        </div>
      )}

      {/* Tabla de Reclamaciones */}
      <section className="card">
        <div
          className="section-title"
          style={{
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={18} style={{ color: "var(--green)" }} />
            <span>Hojas de Reclamación Registradas ({totalCount})</span>
          </h2>

          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted, #64748b)",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por correlativo o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32,
                  paddingRight: 12,
                  paddingTop: 6,
                  paddingBottom: 6,
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--bg, #f8fafc)",
                  color: "var(--text, #0f172a)",
                  minWidth: 220,
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--line, #cbd5e1)",
                background: "var(--bg, #f8fafc)",
                color: "var(--text, #0f172a)",
              }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="INVESTIGATING">En Investigación</option>
              <option value="RESOLVED">Resuelto</option>
              <option value="REJECTED">Rechazado</option>
            </select>

            <select
              value={claimTypeFilter}
              onChange={(e) => {
                setClaimTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--line, #cbd5e1)",
                background: "var(--bg, #f8fafc)",
                color: "var(--text, #0f172a)",
              }}
            >
              <option value="ALL">Todos los tipos</option>
              <option value="RECLAMO">Reclamo</option>
              <option value="QUEJA">Queja</option>
            </select>

            <button type="submit" className="btn secondary" style={{ fontSize: 12, padding: "6px 12px" }}>
              Filtrar
            </button>
          </form>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No se encontraron hojas de reclamación"
            description="El libro no cuenta con registros que coincidan con los filtros seleccionados."
          />
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto", marginTop: 14 }}>
            <table className="table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>N° Correlativo</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Tipo</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Consumidor</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Fecha de Envío</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Plazo Legal (15 Días)</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)" }}>Estado</th>
                  <th style={{ padding: "10px 12px", color: "var(--muted, #64748b)", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const daysRemaining = getBusinessDaysRemaining(c.createdAt, 15);
                  const isClosed = c.status === "RESOLVED" || c.status === "REJECTED";

                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--line, #f1f5f9)" }}>
                      <td style={{ padding: "12px", fontWeight: 700, fontFamily: "monospace", color: "var(--green)" }}>
                        {c.correlativeNumber}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: c.claimType === "RECLAMO" ? "rgba(245, 158, 11, 0.12)" : "rgba(59, 130, 246, 0.12)",
                            color: c.claimType === "RECLAMO" ? "#d97706" : "#2563eb",
                          }}
                        >
                          {c.claimType}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <strong style={{ color: "var(--text, #0f172a)", display: "block" }}>{c.consumerName}</strong>
                        <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                          {c.consumerDocumentType}: {c.consumerDocumentNumber} · {c.consumerEmail}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 12, color: "var(--muted, #64748b)" }}>
                        {formatDate(c.createdAt)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {isClosed ? (
                          <span style={{ fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={13} /> Atendido en plazo
                          </span>
                        ) : daysRemaining <= 0 ? (
                          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertTriangle size={13} /> Plazo vencido
                          </span>
                        ) : daysRemaining <= 3 ? (
                          <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={13} /> Quedan {daysRemaining} días hábiles
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--muted, #64748b)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={13} /> Quedan {daysRemaining} días hábiles
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          className={`status ${c.status}`}
                          style={{ fontSize: 10, textTransform: "uppercase" }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="btn secondary"
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Eye size={12} />
                          <span>Auditar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                  Página {page} de {totalPages} ({totalCount} hojas en total)
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

      {/* Modal de Detalle y Resolución Legal */}
      {selectedComplaint && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
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
              borderRadius: 20,
              padding: 26,
              maxWidth: 680,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                borderBottom: "1px solid var(--line, #e2e8f0)",
                paddingBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IndecopiBookLogo width={30} height={30} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text, #0f172a)" }}>
                    Hoja de Reclamación N° {selectedComplaint.correlativeNumber}
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
                    Tipo: <strong>{selectedComplaint.claimType}</strong> | Fecha: {formatDate(selectedComplaint.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: "var(--bg, #f1f5f9)",
                  border: "none",
                  color: "var(--muted, #64748b)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 18, fontSize: 13 }}>
              {/* Datos del Consumidor */}
              <div style={{ background: "var(--panel2, #f8fafc)", padding: 14, borderRadius: 12, border: "1px solid var(--line, #e2e8f0)" }}>
                <strong style={{ fontSize: 12, color: "var(--muted, #64748b)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  1. Identificación del Consumidor Reclamante
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><strong>Nombre:</strong> {selectedComplaint.consumerName}</div>
                  <div><strong>Documento:</strong> {selectedComplaint.consumerDocumentType} {selectedComplaint.consumerDocumentNumber}</div>
                  <div><strong>Email:</strong> {selectedComplaint.consumerEmail}</div>
                  <div><strong>Teléfono:</strong> {selectedComplaint.consumerPhone || "No especificado"}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Domicilio:</strong> {selectedComplaint.consumerAddress || "No especificado"}</div>
                </div>
              </div>

              {/* Identificación del Bien */}
              <div style={{ background: "var(--panel2, #f8fafc)", padding: 14, borderRadius: 12, border: "1px solid var(--line, #e2e8f0)" }}>
                <strong style={{ fontSize: 12, color: "var(--muted, #64748b)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  2. Identificación del Bien Contratado
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><strong>Tipo de Bien:</strong> {selectedComplaint.goodType || "Servicio"}</div>
                  <div><strong>Monto Reclamado:</strong> {selectedComplaint.claimedAmount ? `S/ ${selectedComplaint.claimedAmount}` : "No aplica"}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Descripción del Bien:</strong> {selectedComplaint.goodDescription || "Servicio de plataforma"}</div>
                </div>
              </div>

              {/* Detalle y Pedido */}
              <div style={{ background: "var(--panel2, #f8fafc)", padding: 14, borderRadius: 12, border: "1px solid var(--line, #e2e8f0)" }}>
                <strong style={{ fontSize: 12, color: "var(--muted, #64748b)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  3. Detalle de la Reclamación y Pedido Concreto
                </strong>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)", display: "block", fontWeight: 700 }}>HECHOS:</span>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text, #0f172a)", whiteSpace: "pre-wrap" }}>
                    {selectedComplaint.claimDetail}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)", display: "block", fontWeight: 700 }}>PEDIDO DEL CONSUMIDOR:</span>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text, #0f172a)", whiteSpace: "pre-wrap" }}>
                    {selectedComplaint.consumerRequest || "Resolución conforme a ley"}
                  </p>
                </div>
              </div>

              {/* Acciones y Respuesta del Proveedor */}
              <div style={{ borderTop: "1px solid var(--line, #e2e8f0)", paddingTop: 14 }}>
                <strong style={{ fontSize: 13, color: "var(--text, #0f172a)", display: "block", marginBottom: 10 }}>
                  4. Acciones y Respuesta Oficial de Livora (Proveedor)
                </strong>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted, #64748b)", marginBottom: 4, fontWeight: 700 }}>
                      Estado del Expediente
                    </label>
                    <select
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--line, #cbd5e1)",
                        background: "var(--bg, #f8fafc)",
                        color: "var(--text, #0f172a)",
                        fontSize: 13,
                      }}
                    >
                      <option value="PENDING">PENDING - Pendiente de revisión</option>
                      <option value="INVESTIGATING">INVESTIGATING - En investigación interna</option>
                      <option value="RESOLVED">RESOLVED - Atendido y Resuelto a favor o conforme</option>
                      <option value="REJECTED">REJECTED - Desestimado / No procedente con sustento</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted, #64748b)", marginBottom: 4, fontWeight: 700 }}>
                      Nota / Dictamen de Respuesta Legal (Notificada al consumidor)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Redacta la fundamentación de la respuesta o acciones tomadas respecto al reclamo formulado..."
                      value={legalNote}
                      onChange={(e) => setLegalNote(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1px solid var(--line, #cbd5e1)",
                        background: "var(--bg, #f8fafc)",
                        color: "var(--text, #0f172a)",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="btn primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Send size={15} />
                  <span>{savingStatus ? "Guardando..." : "Guardar Resolución"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
