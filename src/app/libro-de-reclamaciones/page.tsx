"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, CheckCircle2, Mail, Scale, Printer, AlertTriangle } from "lucide-react";
import { Footer, IndecopiBookLogo } from "@/components/Footer";
import { api } from "@/lib/api";

type DocumentType = "DNI" | "CE" | "PASAPORTE" | "RUC";
type GoodType = "PRODUCTO" | "SERVICIO";
type ClaimType = "RECLAMO" | "QUEJA";

interface ComplaintResponse {
  id: string;
  correlativeNumber: string;
  status: string;
  createdAt: string;
}

export default function LibroDeReclamacionesPage() {
  const [formData, setFormData] = useState({
    documentType: "DNI" as DocumentType,
    documentNumber: "",
    fullName: "",
    address: "",
    phone: "",
    email: "",
    isMinor: false,
    representativeName: "",
    representativeDoc: "",
    goodType: "SERVICIO" as GoodType,
    goodDescription: "",
    amount: "",
    claimType: "RECLAMO" as ClaimType,
    claimDetail: "",
    consumerRequest: "",
    affidavitConsent: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ComplaintResponse | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!formData.documentNumber.trim() || !formData.fullName.trim()) {
      setErrorMessage("Por favor, ingrese su documento de identidad y nombre completo.");
      return;
    }

    if (!formData.address.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setErrorMessage("Por favor, complete su dirección, teléfono y correo electrónico.");
      return;
    }

    if (!formData.goodDescription.trim()) {
      setErrorMessage("Por favor, detalle el producto o servicio contratado.");
      return;
    }

    if (!formData.claimDetail.trim() || !formData.consumerRequest.trim()) {
      setErrorMessage("Por favor, complete el detalle de los hechos y su pedido concreto.");
      return;
    }

    if (formData.isMinor && !formData.representativeName.trim()) {
      setErrorMessage("Por favor, ingrese el nombre del padre, madre o apoderado.");
      return;
    }

    if (!formData.affidavitConsent) {
      setErrorMessage("Debe aceptar la declaración jurada de veracidad para enviar el reclamo.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        fullName: formData.fullName.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        isMinor: formData.isMinor,
        representativeName: formData.isMinor ? formData.representativeName.trim() : undefined,
        representativeDoc: formData.isMinor && formData.representativeDoc.trim() ? formData.representativeDoc.trim() : undefined,
        goodType: formData.goodType,
        goodDescription: formData.goodDescription.trim(),
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        claimType: formData.claimType,
        claimDetail: formData.claimDetail.trim(),
        consumerRequest: formData.consumerRequest.trim(),
      };

      // Timeout extendido a 30s: el backend genera un PDF y envía un correo
      const response = await api.post<ComplaintResponse>("/complaints", payload, { timeout: 30000 });
      setSuccessData(response.data);
    } catch (err: any) {
      console.error("Error submitting complaint:", err);
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(". ")
        : err.response?.data?.message || "Ocurrió un error al registrar la reclamación. Intente nuevamente.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #07110f)", color: "var(--text, #f2f7f5)", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted, #8fa49d)", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ color: "var(--green, #55e6a5)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
            <span>/</span>
            <span>Libro de Reclamaciones Virtual</span>
          </div>
          <Link
            href="/libro-de-reclamaciones/seguimiento"
            style={{
              fontSize: 12,
              color: "#55e6a5",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: "#0c1915",
              border: "1px solid #1c352b",
              borderRadius: 8,
            }}
          >
            <Search size={12} /> Consultar seguimiento de reclamo existente
          </Link>
        </div>

        {/* Success Confirmation View */}
        {successData ? (
          <div
            className="card"
            style={{
              background: "linear-gradient(145deg, #0d211b, #071410)",
              border: "1px solid #234f3e",
              borderRadius: 18,
              padding: "40px 32px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(85, 230, 165, 0.15)",
                border: "2px solid #55e6a5",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={32} style={{ color: "#55e6a5" }} />
            </div>

            <span className="eyebrow" style={{ color: "#55e6a5", fontWeight: 700 }}>
              Registro Exitoso conforme a Ley N° 29571
            </span>
            <h1 style={{ fontSize: 28, margin: "8px 0 16px", color: "#f2f7f5" }}>
              Hoja de Reclamación Registrada
            </h1>

            {/* Correlative Number Badge */}
            <div
              style={{
                display: "inline-block",
                background: "#081813",
                border: "2px solid #55e6a5",
                padding: "16px 32px",
                borderRadius: 14,
                margin: "12px 0 24px",
              }}
            >
              <small style={{ display: "block", color: "#8fa49d", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Número Correlativo Único
              </small>
              <strong style={{ fontSize: 32, color: "#55e6a5", letterSpacing: 1, fontFamily: "monospace" }}>
                {successData.correlativeNumber}
              </strong>
            </div>

            {/* Summary Details */}
            <div
              style={{
                background: "#060f0d",
                border: "1px solid #1c382d",
                borderRadius: 12,
                padding: 20,
                textAlign: "left",
                maxWidth: 600,
                margin: "0 auto 28px",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #162a22", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "#8fa49d" }}>Fecha y hora de registro:</span>
                <strong>{new Date(successData.createdAt).toLocaleString("es-PE")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #162a22", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "#8fa49d" }}>Consumidor:</span>
                <strong>{formData.fullName} ({formData.documentType} {formData.documentNumber})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #162a22", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "#8fa49d" }}>Tipo de Solicitud:</span>
                <strong style={{ color: formData.claimType === "RECLAMO" ? "#55e6a5" : "#ffcd70" }}>
                  {formData.claimType} — {formData.goodType}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8fa49d" }}>Correo de Notificación:</span>
                <strong>{formData.email}</strong>
              </div>
            </div>

            {/* Notification Notice */}
            <div
              style={{
                background: "rgba(85, 230, 165, 0.08)",
                border: "1px solid rgba(85, 230, 165, 0.3)",
                borderRadius: 12,
                padding: "16px 20px",
                maxWidth: 600,
                margin: "0 auto 30px",
                color: "#d8e4df",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <Mail size={16} style={{ color: "#55e6a5", marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>Copia Digital Remitida:</strong> Se ha enviado automáticamente una copia oficial en formato PDF de su Hoja de Reclamación a su correo electrónico <strong>{formData.email}</strong>.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Scale size={16} style={{ color: "#55e6a5", marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>Plazo Legal de Respuesta:</strong> Conforme al D.S. 011-2011-PCM y la Ley N° 29571, Livora S.A.C. emitirá su respuesta formal en un plazo máximo de <strong>quince (15) días hábiles improrrogables</strong>.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn"
                style={{ background: "#172e25", borderColor: "#2d5746", color: "#f2f7f5", padding: "12px 22px", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Printer size={16} /> Imprimir Constancia
              </button>
              <Link
                href={`/libro-de-reclamaciones/seguimiento?n=${successData.correlativeNumber}`}
                className="btn"
                style={{ padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#172e25", borderColor: "#2d5746", color: "#55e6a5" }}
              >
                <Search size={16} /> Consultar Seguimiento
              </Link>
              <Link
                href="/"
                className="btn primary"
                style={{ padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                Finalizar y Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          /* Complaint Filing Form View */
          <div
            className="card"
            style={{
              background: "linear-gradient(145deg, #0e1c18, #091310)",
              border: "1px solid var(--line, #20332d)",
              borderRadius: 18,
              padding: "36px 30px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header with Indecopi Badge & Corporate Info */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, borderBottom: "1px solid #1c352b", paddingBottom: 24, marginBottom: 28 }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--green, #55e6a5)" }}>
                  República del Perú — Indecopi
                </span>
                <h1 style={{ fontSize: 26, margin: "6px 0 10px", color: "#f2f7f5", letterSpacing: -0.5 }}>
                  Libro de Reclamaciones Virtual
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #8fa49d)", maxWidth: 540, lineHeight: 1.5 }}>
                  Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571) y Ley N° 32495.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <IndecopiBookLogo width={130} height={80} />
              </div>
            </div>

            {/* Corporate Identification Banner */}
            <div
              style={{
                background: "#081512",
                border: "1px solid #1a332a",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 32,
                fontSize: 12,
                color: "#8fa49d",
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div>
                  <strong style={{ color: "#c6d7d1", display: "block" }}>Razón Social:</strong>
                  Livora S.A.C.
                </div>
                <div>
                  <strong style={{ color: "#c6d7d1", display: "block" }}>RUC:</strong>
                  20608912345
                </div>
                <div>
                  <strong style={{ color: "#c6d7d1", display: "block" }}>Domicilio Legal:</strong>
                  Av. Javier Prado Este 4200, Surco, Lima, Perú
                </div>
                <div>
                  <strong style={{ color: "#c6d7d1", display: "block" }}>Plazo de Respuesta:</strong>
                  15 días hábiles improrrogables
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: "#3d1818",
                  border: "1px solid #6b2d2d",
                  color: "#ff9e9e",
                  padding: "14px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 32 }}>

              {/* SECCIÓN 1: Identificación del Consumidor */}
              <fieldset style={{ border: "1px solid #1c352b", borderRadius: 14, padding: "22px 20px", margin: 0 }}>
                <legend style={{ padding: "0 10px", color: "#55e6a5", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  1. Identificación del Consumidor Reclamante
                </legend>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 10 }}>
                  <div className="field">
                    <label>Tipo de Documento *</label>
                    <select
                      name="documentType"
                      value={formData.documentType}
                      onChange={handleChange}
                      style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white" }}
                    >
                      <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                      <option value="CE">Carnet de Extranjería (CE)</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Número de Documento *</label>
                    <input
                      type="text"
                      name="documentNumber"
                      value={formData.documentNumber}
                      onChange={handleChange}
                      placeholder="Ej. 74839201"
                      required
                    />
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label>Nombres y Apellidos Completos / Razón Social *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Ingrese su nombre completo"
                      required
                    />
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label>Domicilio (Dirección, Distrito, Provincia y Departamento) *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Ej. Av. Los Laureles 123, San Borja, Lima"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Teléfono o Celular *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Ej. 987654321"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Correo Electrónico (Para recibir copia PDF) *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                {/* Checkbox Menor de Edad */}
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #162922" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#d8e4df" }}>
                    <input
                      type="checkbox"
                      name="isMinor"
                      checked={formData.isMinor}
                      onChange={handleChange}
                      style={{ width: 17, height: 17, accentColor: "#55e6a5" }}
                    />
                    <span>El reclamante es menor de edad</span>
                  </label>

                  {formData.isMinor && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 14, background: "#081512", padding: 16, borderRadius: 10, border: "1px solid #1c352b" }}>
                      <div className="field">
                        <label>Nombre del Padre, Madre o Apoderado *</label>
                        <input
                          type="text"
                          name="representativeName"
                          value={formData.representativeName}
                          onChange={handleChange}
                          placeholder="Nombre completo del apoderado"
                          required={formData.isMinor}
                        />
                      </div>
                      <div className="field">
                        <label>Documento de Identidad del Apoderado</label>
                        <input
                          type="text"
                          name="representativeDoc"
                          value={formData.representativeDoc}
                          onChange={handleChange}
                          placeholder="DNI / CE del apoderado"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* SECCIÓN 2: Identificación del Bien Contratado */}
              <fieldset style={{ border: "1px solid #1c352b", borderRadius: 14, padding: "22px 20px", margin: 0 }}>
                <legend style={{ padding: "0 10px", color: "#55e6a5", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  2. Identificación del Bien Contratado
                </legend>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 10 }}>
                  <div className="field">
                    <label>Tipo de Bien Contratado *</label>
                    <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "#0c1915", padding: "10px 16px", borderRadius: 10, border: "1px solid var(--line)", flex: 1 }}>
                        <input
                          type="radio"
                          name="goodType"
                          value="PRODUCTO"
                          checked={formData.goodType === "PRODUCTO"}
                          onChange={handleChange}
                          style={{ accentColor: "#55e6a5" }}
                        />
                        <span>Producto</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "#0c1915", padding: "10px 16px", borderRadius: 10, border: "1px solid var(--line)", flex: 1 }}>
                        <input
                          type="radio"
                          name="goodType"
                          value="SERVICIO"
                          checked={formData.goodType === "SERVICIO"}
                          onChange={handleChange}
                          style={{ accentColor: "#55e6a5" }}
                        />
                        <span>Servicio</span>
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label>Monto Reclamado (Opcional - S/. o ECO)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label>Descripción del Producto o Servicio Contratado *</label>
                    <textarea
                      name="goodDescription"
                      value={formData.goodDescription}
                      onChange={handleChange}
                      placeholder="Ej. Canje de 50 EcoTokens por producto en tienda aliada / Servicio de recolección domiciliaria de botellas PET"
                      rows={3}
                      style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white", resize: "vertical" }}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              {/* SECCIÓN 3: Detalle de la Reclamación */}
              <fieldset style={{ border: "1px solid #1c352b", borderRadius: 14, padding: "22px 20px", margin: 0 }}>
                <legend style={{ padding: "0 10px", color: "#55e6a5", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  3. Detalle de la Reclamación
                </legend>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "var(--muted, #8fa49d)", fontSize: 12, marginBottom: 8 }}>
                    Tipo de Reclamación *
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <label
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: formData.claimType === "RECLAMO" ? "1px solid #55e6a5" : "1px solid var(--line)",
                        background: formData.claimType === "RECLAMO" ? "#122a21" : "#0c1915",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          name="claimType"
                          value="RECLAMO"
                          checked={formData.claimType === "RECLAMO"}
                          onChange={handleChange}
                          style={{ accentColor: "#55e6a5" }}
                        />
                        <strong style={{ color: "#55e6a5" }}>RECLAMO</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#8fa49d", lineHeight: 1.4 }}>
                        Disconformidad relacionada a los productos o servicios ofrecidos.
                      </p>
                    </label>

                    <label
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: formData.claimType === "QUEJA" ? "1px solid #ffcd70" : "1px solid var(--line)",
                        background: formData.claimType === "QUEJA" ? "#2a2212" : "#0c1915",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          name="claimType"
                          value="QUEJA"
                          checked={formData.claimType === "QUEJA"}
                          onChange={handleChange}
                          style={{ accentColor: "#ffcd70" }}
                        />
                        <strong style={{ color: "#ffcd70" }}>QUEJA</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "#8fa49d", lineHeight: 1.4 }}>
                        Disconformidad no relacionada a los productos/servicios; malestar o descontento respecto a la atención al público.
                      </p>
                    </label>
                  </div>
                </div>

                <div className="field">
                  <label>Detalle de la Reclamación (Hechos) *</label>
                  <textarea
                    name="claimDetail"
                    value={formData.claimDetail}
                    onChange={handleChange}
                    placeholder="Describa con claridad y precisión los hechos ocurridos..."
                    rows={4}
                    style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white", resize: "vertical" }}
                    required
                  />
                </div>

                <div className="field">
                  <label>Pedido Concreto del Consumidor *</label>
                  <textarea
                    name="consumerRequest"
                    value={formData.consumerRequest}
                    onChange={handleChange}
                    placeholder="Indique con claridad cuál es la solución o pedido que solicita..."
                    rows={3}
                    style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white", resize: "vertical" }}
                    required
                  />
                </div>
              </fieldset>

              {/* SECCIÓN 4: Declaración Jurada y Advertencia Legal */}
              <div
                style={{
                  background: "#081310",
                  border: "1px solid #1c352b",
                  borderRadius: 14,
                  padding: "20px 22px",
                }}
              >
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="affidavitConsent"
                    checked={formData.affidavitConsent}
                    onChange={handleChange}
                    style={{ width: 20, height: 20, marginTop: 2, accentColor: "#55e6a5" }}
                    required
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: "#d8e4df" }}>
                    <strong style={{ color: "#55e6a5" }}>Declaración Jurada:</strong> Declaro bajo fe de juramento que la información y hechos expresados en la presente Hoja de Reclamación son verídicos y corresponden a la realidad. Entiendo que se enviará una copia en PDF al correo indicado y que Livora responderá en un plazo máximo de 15 días hábiles conforme a la Ley N° 29571.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn primary"
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Registrando Hoja de Reclamación..." : "Enviar Reclamación Virtual"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <div style={{ marginTop: 60 }}>
        <Footer />
      </div>
    </main>
  );
}
