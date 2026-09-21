"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Search, CheckCircle2, Mail, Scale, Printer, AlertTriangle } from "lucide-react";
import { Footer, IndecopiBookLogo } from "@/components/Footer";
import { api } from "@/lib/api";
import { complaintSchema, ComplaintFormData } from "@/lib/schemas/complaint";

interface ComplaintResponse {
  id: string;
  correlativeNumber: string;
  status: string;
  createdAt: string;
}

export default function LibroDeReclamacionesPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ComplaintResponse | null>(null);
  const [submittedValues, setSubmittedValues] = useState<ComplaintFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      documentType: "DNI",
      documentNumber: "",
      fullName: "",
      address: "",
      phone: "",
      email: "",
      isMinor: false,
      representativeName: "",
      representativeDoc: "",
      goodType: "SERVICIO",
      goodDescription: "",
      amount: "",
      claimType: "RECLAMO",
      claimDetail: "",
      consumerRequest: "",
      affidavitConsent: false as unknown as true,
    },
  });

  const isMinor = watch("isMinor");
  const claimType = watch("claimType");

  const onSubmit = async (data: ComplaintFormData) => {
    setErrorMessage(null);

    try {
      const payload = {
        documentType: data.documentType,
        documentNumber: data.documentNumber.trim(),
        fullName: data.fullName.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        isMinor: data.isMinor,
        representativeName: data.isMinor && data.representativeName ? data.representativeName.trim() : undefined,
        representativeDoc: data.isMinor && data.representativeDoc ? data.representativeDoc.trim() : undefined,
        goodType: data.goodType,
        goodDescription: data.goodDescription.trim(),
        amount: data.amount ? parseFloat(data.amount) : undefined,
        claimType: data.claimType,
        claimDetail: data.claimDetail.trim(),
        consumerRequest: data.consumerRequest.trim(),
      };

      const response = await api.post<ComplaintResponse>("/complaints", payload, { timeout: 30000 });
      setSubmittedValues(data);
      setSuccessData(response.data);
    } catch (err: any) {
      console.error("Error submitting complaint:", err);
      const msg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(". ")
        : err.response?.data?.message || "Ocurrió un error al registrar la reclamación. Intente nuevamente.";
      setErrorMessage(msg);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ color: "var(--green)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
            <span>/</span>
            <span>Libro de Reclamaciones Virtual</span>
          </div>
          <Link
            href="/libro-de-reclamaciones/seguimiento"
            style={{
              fontSize: 12,
              color: "var(--green)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            <Search size={12} /> Consultar seguimiento de reclamo existente
          </Link>
        </div>

        {/* Success Confirmation View */}
        {successData && submittedValues ? (
          <div
            className="card"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "40px 32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                border: "2px solid var(--green)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={32} style={{ color: "var(--green)" }} />
            </div>

            <span className="eyebrow" style={{ color: "var(--green)", fontWeight: 700 }}>
              Registro Exitoso conforme a Ley N° 29571
            </span>
            <h1 style={{ fontSize: 28, margin: "8px 0 16px", color: "var(--text)", fontWeight: 800 }}>
              Hoja de Reclamación Registrada
            </h1>

            {/* Correlative Number Badge */}
            <div
              style={{
                display: "inline-block",
                background: "var(--panel2)",
                border: "2px solid var(--green)",
                padding: "16px 32px",
                borderRadius: 14,
                margin: "12px 0 24px",
              }}
            >
              <small style={{ display: "block", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Número Correlativo Único
              </small>
              <strong style={{ fontSize: 32, color: "var(--green)", letterSpacing: 1, fontFamily: "monospace" }}>
                {successData.correlativeNumber}
              </strong>
            </div>

            {/* Summary Details */}
            <div
              style={{
                background: "var(--panel2)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 20,
                textAlign: "left",
                maxWidth: 600,
                margin: "0 auto 28px",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>Fecha y hora de registro:</span>
                <strong style={{ color: "var(--text)" }}>{new Date(successData.createdAt).toLocaleString("es-PE")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>Consumidor:</span>
                <strong style={{ color: "var(--text)" }}>{submittedValues.fullName} ({submittedValues.documentType} {submittedValues.documentNumber})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>Tipo de Solicitud:</span>
                <strong style={{ color: submittedValues.claimType === "RECLAMO" ? "var(--green)" : "#eab308" }}>
                  {submittedValues.claimType} — {submittedValues.goodType}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Correo de Notificación:</span>
                <strong style={{ color: "var(--text)" }}>{submittedValues.email}</strong>
              </div>
            </div>

            {/* Notification Notice */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "16px 20px",
                maxWidth: 600,
                margin: "0 auto 30px",
                color: "var(--text)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <Mail size={16} style={{ color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>Copia Digital Remitida:</strong> Se ha enviado automáticamente una copia oficial en formato PDF de su Hoja de Reclamación a su correo electrónico <strong style={{ color: "var(--text)" }}>{submittedValues.email}</strong>.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Scale size={16} style={{ color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
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
                style={{ background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--text)", padding: "12px 22px", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 10, fontWeight: 600 }}
              >
                <Printer size={16} /> Imprimir Constancia
              </button>
              <Link
                href={`/libro-de-reclamaciones/seguimiento?n=${successData.correlativeNumber}`}
                className="btn"
                style={{ padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--green)", borderRadius: 10, fontWeight: 600 }}
              >
                <Search size={16} /> Consultar Seguimiento
              </Link>
              <Link
                href="/"
                className="btn primary"
                style={{ padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green)", color: "#06110d", borderRadius: 10, fontWeight: 800 }}
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
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "36px 30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header with Indecopi Badge & Corporate Info */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, borderBottom: "1px solid var(--line)", paddingBottom: 24, marginBottom: 28 }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  República del Perú — Indecopi
                </span>
                <h1 style={{ fontSize: 26, margin: "6px 0 10px", color: "var(--text)", letterSpacing: -0.5, fontWeight: 800 }}>
                  Libro de Reclamaciones Virtual
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 540, lineHeight: 1.5 }}>
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
                background: "var(--panel2)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 32,
                fontSize: 12,
                color: "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Razón Social:</strong>
                  Livora S.A.C.
                </div>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>RUC:</strong>
                  20608912345
                </div>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Domicilio Legal:</strong>
                  Av. Javier Prado Este 4200, Surco, Lima, Perú
                </div>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Plazo de Respuesta:</strong>
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

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 32 }}>
              {/* SECCIÓN 1: Identificación del Consumidor */}
              <fieldset style={{ border: "1px solid #1c352b", borderRadius: 14, padding: "22px 20px", margin: 0 }}>
                <legend style={{ padding: "0 10px", color: "#55e6a5", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  1. Identificación del Consumidor Reclamante
                </legend>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 10 }}>
                  <div className="field">
                    <label htmlFor="documentType">Tipo de Documento *</label>
                    <select
                      id="documentType"
                      {...register("documentType")}
                      style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white" }}
                    >
                      <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                      <option value="CE">Carnet de Extranjería (CE)</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                    {errors.documentType && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.documentType.message}</small>}
                  </div>

                  <div className="field">
                    <label htmlFor="documentNumber">Número de Documento *</label>
                    <input
                      id="documentNumber"
                      type="text"
                      {...register("documentNumber")}
                      placeholder="Ej. 74839201"
                    />
                    {errors.documentNumber && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.documentNumber.message}</small>}
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="fullName">Nombres y Apellidos Completos / Razón Social *</label>
                    <input
                      id="fullName"
                      type="text"
                      {...register("fullName")}
                      placeholder="Ingrese su nombre completo"
                    />
                    {errors.fullName && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.fullName.message}</small>}
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="address">Domicilio (Dirección, Distrito, Provincia y Departamento) *</label>
                    <input
                      id="address"
                      type="text"
                      {...register("address")}
                      placeholder="Ej. Av. Los Laureles 123, San Borja, Lima"
                    />
                    {errors.address && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.address.message}</small>}
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Teléfono o Celular *</label>
                    <input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="Ej. 987654321"
                    />
                    {errors.phone && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.phone.message}</small>}
                  </div>

                  <div className="field">
                    <label htmlFor="email">Correo Electrónico (Para recibir copia PDF) *</label>
                    <input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="correo@ejemplo.com"
                    />
                    {errors.email && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.email.message}</small>}
                  </div>
                </div>

                {/* Checkbox Menor de Edad */}
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #162922" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#d8e4df" }}>
                    <input
                      type="checkbox"
                      {...register("isMinor")}
                      style={{ width: 17, height: 17, accentColor: "#55e6a5" }}
                    />
                    <span>El reclamante es menor de edad</span>
                  </label>

                  {isMinor && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 14, background: "#081512", padding: 16, borderRadius: 10, border: "1px solid #1c352b" }}>
                      <div className="field">
                        <label htmlFor="representativeName">Nombre del Padre, Madre o Apoderado *</label>
                        <input
                          id="representativeName"
                          type="text"
                          {...register("representativeName")}
                          placeholder="Nombre completo del apoderado"
                        />
                        {errors.representativeName && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.representativeName.message}</small>}
                      </div>
                      <div className="field">
                        <label htmlFor="representativeDoc">Documento de Identidad del Apoderado</label>
                        <input
                          id="representativeDoc"
                          type="text"
                          {...register("representativeDoc")}
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
                          value="PRODUCTO"
                          {...register("goodType")}
                          style={{ accentColor: "#55e6a5" }}
                        />
                        <span>Producto</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "#0c1915", padding: "10px 16px", borderRadius: 10, border: "1px solid var(--line)", flex: 1 }}>
                        <input
                          type="radio"
                          value="SERVICIO"
                          {...register("goodType")}
                          style={{ accentColor: "#55e6a5" }}
                        />
                        <span>Servicio</span>
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="amount">Monto Reclamado (Opcional - S/. o LIVO)</label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register("amount")}
                      placeholder="0.00"
                    />
                    {errors.amount && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.amount.message}</small>}
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="goodDescription">Descripción del Producto o Servicio Contratado *</label>
                    <textarea
                      id="goodDescription"
                      {...register("goodDescription")}
                      placeholder="Ej. Canje de 50 LIVOs por producto en tienda aliada / Servicio de recolección domiciliaria de botellas PET"
                      rows={3}
                      style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white", resize: "vertical" }}
                    />
                    {errors.goodDescription && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.goodDescription.message}</small>}
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
                        border: claimType === "RECLAMO" ? "1px solid #55e6a5" : "1px solid var(--line)",
                        background: claimType === "RECLAMO" ? "#122a21" : "#0c1915",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          value="RECLAMO"
                          {...register("claimType")}
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
                        border: claimType === "QUEJA" ? "1px solid #ffcd70" : "1px solid var(--line)",
                        background: claimType === "QUEJA" ? "#2a2212" : "#0c1915",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          value="QUEJA"
                          {...register("claimType")}
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
                  <label htmlFor="claimDetail">Detalle de la Reclamación (Hechos) *</label>
                  <textarea
                    id="claimDetail"
                    {...register("claimDetail")}
                    placeholder="Describa con claridad y precisión los hechos ocurridos..."
                    rows={4}
                    style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white", resize: "vertical" }}
                  />
                  {errors.claimDetail && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.claimDetail.message}</small>}
                </div>

                <div className="field">
                  <label htmlFor="consumerRequest">Pedido Concreto del Consumidor *</label>
                  <textarea
                    id="consumerRequest"
                    {...register("consumerRequest")}
                    placeholder="Indique con claridad cuál es la solución o pedido que solicita..."
                    rows={3}
                    style={{ width: "100%", padding: 12, background: "#0c1915", border: "1px solid var(--line)", borderRadius: 10, color: "white", resize: "vertical" }}
                  />
                  {errors.consumerRequest && <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.consumerRequest.message}</small>}
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
                <label htmlFor="affidavitConsent" style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input
                    id="affidavitConsent"
                    type="checkbox"
                    {...register("affidavitConsent")}
                    style={{ width: 20, height: 20, marginTop: 2, accentColor: "#55e6a5" }}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: "#d8e4df" }}>
                    <strong style={{ color: "#55e6a5" }}>Declaración Jurada:</strong> Declaro bajo fe de juramento que la información y hechos expresados en la presente Hoja de Reclamación son verídicos y corresponden a la realidad. Entiendo que se enviará una copia en PDF al correo indicado y que Livora responderá en un plazo máximo de 15 días hábiles conforme a la Ley N° 29571.
                  </span>
                </label>
                {errors.affidavitConsent && (
                  <div style={{ marginTop: 8 }}>
                    <small style={{ color: "#ff9e9e", fontSize: 11 }}>{errors.affidavitConsent.message}</small>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn primary"
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 12,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? "Registrando Hoja de Reclamación..." : "Enviar Reclamación Virtual"}
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
