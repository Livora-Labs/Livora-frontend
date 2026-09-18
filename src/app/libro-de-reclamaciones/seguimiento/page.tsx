"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, CheckCircle2, AlertTriangle, FileText, Inbox, Settings, Lock, Scale, Info } from "lucide-react";
import { Footer, IndecopiBookLogo } from "@/components/Footer";
import { api } from "@/lib/api";

type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface ComplaintRecord {
  id: string;
  correlativeNumber: string;
  fullName: string;
  email: string;
  documentType?: string;
  documentNumberMasked?: string;
  claimType: string;
  goodType: string;
  goodDescription: string;
  claimDetail: string;
  consumerRequest: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<ComplaintStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any>; description: string }> = {
  OPEN: {
    label: "Recibido",
    color: "#55e6a5",
    bg: "#0d2118",
    icon: Inbox,
    description: "Su reclamación ha sido registrada y está pendiente de revisión por el equipo de Livora.",
  },
  IN_PROGRESS: {
    label: "En Proceso",
    color: "#ffcd70",
    bg: "#221c08",
    icon: Settings,
    description: "Su reclamación está siendo evaluada activamente por nuestro equipo de atención al consumidor.",
  },
  RESOLVED: {
    label: "Resuelta",
    color: "#55e6a5",
    bg: "#0d2118",
    icon: CheckCircle2,
    description: "Su reclamación ha sido resuelta. Se le ha notificado la respuesta al correo registrado.",
  },
  CLOSED: {
    label: "Cerrada",
    color: "#8fa49d",
    bg: "#0d1614",
    icon: Lock,
    description: "Su reclamación ha sido cerrada tras completarse el plazo legal de atención.",
  },
};

function formatCorrelative(raw: string): string {
  // Normaliza el input del usuario: acepta R00001-2026, R-00001-2026, r-00001-2026
  const cleaned = raw.trim().toUpperCase().replace(/\s/g, "");
  // Si ya tiene el formato correcto, lo devuelve tal cual
  if (/^[RQ]-\d{5}-\d{4}$/.test(cleaned)) return cleaned;
  // Intenta reconstruir si falta el guión después del prefijo
  const match = cleaned.match(/^([RQ])[-]?(\d{5})[-]?(\d{4})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return cleaned;
}

function SeguimientoPageContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("n") ?? "");
  const [documentNumber, setDocumentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Si viene con ?n=R-00001-2026 desde la pantalla de confirmación, rellena el campo
  useEffect(() => {
    const n = searchParams.get("n");
    if (n) {
      setInput(n);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setComplaint(null);

    const correlative = formatCorrelative(input);

    if (!/^[RQ]-\d{5}-\d{4}$/.test(correlative)) {
      setErrorMessage(
        "Formato inválido. Ingrese el número correlativo tal como aparece en su correo de confirmación. Ejemplo: R-00001-2026"
      );
      return;
    }

    if (!documentNumber.trim() || documentNumber.trim().length < 4) {
      setErrorMessage(
        "Ingrese el número de documento de identidad (DNI, CE, Pasaporte o RUC) registrado con la reclamación."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<ComplaintRecord>(
        `/complaints/track`,
        {
          correlativeNumber: correlative,
          documentNumber: documentNumber.trim(),
        }
      );
      setComplaint(response.data);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setErrorMessage(
          `No se encontró ninguna reclamación con los datos proporcionados. Verifique el número correlativo y su documento de identidad.`
        );
      } else {
        setErrorMessage(
          "Ocurrió un error al consultar su reclamación. Intente nuevamente en unos momentos."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!complaint) return;
    setDownloadingPdf(true);
    try {
      const response = await api.post(
        '/complaints/track/pdf',
        {
          correlativeNumber: complaint.correlativeNumber,
          documentNumber: documentNumber.trim(),
        },
        { responseType: 'blob' },
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hoja-Reclamacion-${complaint.correlativeNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Error al descargar la hoja de reclamación en PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const statusInfo = complaint ? STATUS_LABELS[complaint.status] ?? STATUS_LABELS.OPEN : null;

  // Calcula días hábiles transcurridos (aprox.) desde la fecha de creación
  const calcBusinessDays = (from: string): number => {
    const start = new Date(from);
    const now = new Date();
    let count = 0;
    const current = new Date(start);
    while (current < now) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return Math.min(count, 15);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--green)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <ArrowLeft size={14} /> Inicio
          </Link>
          <span>/</span>
          <Link href="/libro-de-reclamaciones" style={{ color: "var(--green)", textDecoration: "none" }}>Libro de Reclamaciones</Link>
          <span>/</span>
          <span>Consulta de Seguimiento</span>
        </div>

        {/* Header */}
        <div
          className="card"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "32px 28px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                República del Perú — Indecopi
              </span>
              <h1 style={{ fontSize: 24, margin: "6px 0 8px", color: "var(--text)", letterSpacing: -0.5, fontWeight: 800 }}>
                Consulta de Seguimiento
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 500, lineHeight: 1.5 }}>
                Ingrese el número correlativo recibido en su correo de confirmación para consultar el estado de su reclamación.
              </p>
            </div>
            <IndecopiBookLogo width={110} height={68} />
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="N° Correlativo (Ej. R-00001-2026)"
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: "12px 14px",
                  background: "var(--panel2)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                  outline: "none",
                }}
                required
              />
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="N° Documento (DNI / CE / RUC)"
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "12px 14px",
                  background: "var(--panel2)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 14,
                  letterSpacing: 1,
                  outline: "none",
                }}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn primary"
                style={{
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 800,
                  borderRadius: 10,
                  background: "var(--green)",
                  color: "#06110d",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loading ? "Consultando..." : (
                  <>
                    <Search size={14} /> Consultar Estado
                  </>
                )}
              </button>
            </div>

            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
              Por su seguridad y cumplimiento de la Ley N° 29733 (Protección de Datos Personales), se requiere validar el número correlativo junto con el documento de identidad registrado.
            </p>
          </form>

          {/* Error message */}
          {errorMessage && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                padding: "14px 18px",
                borderRadius: 10,
                fontSize: 13,
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Result Card */}
        {complaint && statusInfo && (
          <div
            className="card"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "32px 28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            {/* Status Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  background: statusInfo.bg,
                  border: `1px solid ${statusInfo.color}`,
                  borderRadius: 30,
                }}
              >
                <statusInfo.icon size={18} style={{ color: statusInfo.color }} />
                <strong style={{ color: statusInfo.color, fontSize: 14 }}>{statusInfo.label}</strong>
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 20,
                  color: "#55e6a5",
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {complaint.correlativeNumber}
              </div>
            </div>

            {/* Status description */}
            <div
              style={{
                background: "rgba(85,230,165,0.07)",
                border: "1px solid rgba(85,230,165,0.2)",
                borderRadius: 10,
                padding: "14px 18px",
                fontSize: 13,
                color: "#d8e4df",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              {statusInfo.description}
            </div>

            {/* Timeline progress */}
            {(() => {
              const days = calcBusinessDays(complaint.createdAt);
              const pct = Math.min((days / 15) * 100, 100);
              return (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8fa49d", marginBottom: 6 }}>
                    <span>Días hábiles transcurridos</span>
                    <span>
                      <strong style={{ color: days >= 15 ? "#ff9e9e" : "#55e6a5" }}>{days}</strong>
                      {" / 15 días hábiles"}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#0c1915", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: days >= 13 ? "#ff9e9e" : "#55e6a5",
                        borderRadius: 6,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  {days >= 15 && (
                    <p style={{ fontSize: 11, color: "#ff9e9e", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                      <span>
                        El plazo legal de 15 días hábiles ha vencido. Puede comunicarse con nosotros a{" "}
                        <a href="mailto:privacidad@livora.pe" style={{ color: "#ff9e9e" }}>privacidad@livora.pe</a>.
                      </span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Summary details */}
            <div
              style={{
                background: "#060f0d",
                border: "1px solid #1c382d",
                borderRadius: 12,
                padding: 20,
                fontSize: 13,
                lineHeight: 1.8,
                display: "grid",
                gap: 2,
              }}
            >
              {[
                { label: "Tipo de Solicitud", value: `${complaint.claimType} — ${complaint.goodType}`, highlight: complaint.claimType === "RECLAMO" ? "#55e6a5" : "#ffcd70" },
                { label: "Consumidor", value: complaint.fullName },
                { label: "Correo registrado", value: complaint.email },
                { label: "Producto / Servicio", value: complaint.goodDescription },
                { label: "Fecha de registro", value: new Date(complaint.createdAt).toLocaleString("es-PE") },
                { label: "Última actualización", value: new Date(complaint.updatedAt).toLocaleString("es-PE") },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 8,
                    marginBottom: 8,
                    borderBottom: "1px solid #162a22",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ color: "#8fa49d", flexShrink: 0 }}>{label}:</span>
                  <strong style={{ color: highlight || "#f2f7f5", textAlign: "right" }}>{value}</strong>
                </div>
              ))}
            </div>

            {/* Legal note */}
            <div
              style={{
                marginTop: 20,
                background: "rgba(85,230,165,0.06)",
                border: "1px solid rgba(85,230,165,0.18)",
                borderRadius: 10,
                padding: "14px 18px",
                fontSize: 12,
                color: "#aec2bb",
                lineHeight: 1.6,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Scale size={14} style={{ color: "#55e6a5", marginTop: 2, flexShrink: 0 }} />
              <span>
                Conforme a la Ley N° 29571 y Ley N° 32495, Livora S.A.C. debe responder dentro de{" "}
                <strong>15 días hábiles improrrogables</strong> desde la fecha de registro de su reclamación.
                La formulación de este reclamo no impide acudir a otras vías ni es requisito previo para
                interponer una denuncia ante{" "}
                <a
                  href="https://www.indecopi.gob.pe"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#55e6a5" }}
                >
                  Indecopi
                </a>.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="btn"
                style={{
                  background: "#172e25",
                  borderColor: "#2d5746",
                  color: "#f2f7f5",
                  padding: "11px 20px",
                  cursor: downloadingPdf ? "not-allowed" : "pointer",
                  opacity: downloadingPdf ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  borderRadius: 10,
                }}
              >
                <FileText size={16} /> {downloadingPdf ? "Descargando..." : "Descargar Hoja de Reclamación (PDF)"}
              </button>
              <button
                type="button"
                onClick={() => { setComplaint(null); setInput(""); setDocumentNumber(""); }}
                className="btn"
                style={{ background: "#0c1915", borderColor: "#1c352b", color: "#8fa49d", padding: "11px 20px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, cursor: "pointer" }}
              >
                Nueva Consulta
              </button>
            </div>
          </div>
        )}

        {/* Info box when no search yet */}
        {!complaint && !errorMessage && (
          <div
            style={{
              background: "#081310",
              border: "1px solid #1a2e27",
              borderRadius: 14,
              padding: "22px 24px",
              fontSize: 13,
              color: "#8fa49d",
              lineHeight: 1.7,
            }}
          >
            <h3 style={{ color: "#c6d7d1", marginTop: 0, fontSize: 15 }}>¿Cómo encontrar su número correlativo?</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>El número correlativo fue enviado automáticamente a su correo electrónico al registrar la reclamación.</li>
              <li>Tiene el formato <strong style={{ fontFamily: "monospace", color: "#55e6a5" }}>R-XXXXX-AAAA</strong> (Reclamo) o <strong style={{ fontFamily: "monospace", color: "#ffcd70" }}>Q-XXXXX-AAAA</strong> (Queja).</li>
              <li>Si no recibió el correo, revise su carpeta de spam o contáctenos a <a href="mailto:privacidad@livora.pe" style={{ color: "#55e6a5" }}>privacidad@livora.pe</a>.</li>
            </ul>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #162922" }}>
              ¿Desea registrar una nueva reclamación?{" "}
              <Link href="/libro-de-reclamaciones" style={{ color: "#55e6a5", textDecoration: "underline" }}>
                Ir al formulario del Libro de Reclamaciones
              </Link>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 60 }}>
        <Footer />
      </div>
    </main>
  );
}

export default function SeguimientoPage() {
  return (
    <React.Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#060d0b", color: "#eaf4f0", padding: "40px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#55e6a5", fontSize: 16, fontFamily: "sans-serif" }}>Cargando consulta...</div>
      </main>
    }>
      <SeguimientoPageContent />
    </React.Suspense>
  );
}
