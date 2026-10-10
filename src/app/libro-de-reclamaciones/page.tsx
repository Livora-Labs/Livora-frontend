"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Mail,
  Scale,
  Printer,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Footer, IndecopiBookLogo } from "@/components/Footer";
import { TurnstileWidget } from "@/components/TurnstileWidget";
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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
  const goodType = watch("goodType");

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

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
        turnstileToken: turnstileToken || undefined,
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    color: "#0f172a",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    marginBottom: 6,
  };

  const fieldsetStyle: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "24px 22px",
    margin: 0,
    background: "#ffffff",
  };

  const legendStyle: React.CSSProperties = {
    padding: "0 10px",
    color: "#059669",
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  };

  const errorTextStyle: React.CSSProperties = {
    color: "#dc2626",
    fontSize: 11,
    marginTop: 4,
    display: "block",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ color: "#059669", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
            <span>/</span>
            <span style={{ color: "#334155", fontWeight: 500 }}>Libro de Reclamaciones Virtual</span>
          </div>
          <Link
            href="/libro-de-reclamaciones/seguimiento"
            style={{
              fontSize: 12,
              color: "#059669",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Search size={13} /> Consultar seguimiento de reclamo existente
          </Link>
        </div>

        {/* Success Confirmation View */}
        {successData && submittedValues ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
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
                background: "#dcfce7",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={34} style={{ color: "#059669" }} />
            </div>

            <span style={{ color: "#059669", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
              Registro Exitoso conforme a Ley N° 29571
            </span>
            <h1 style={{ fontSize: 28, margin: "8px 0 16px", color: "#0f172a", fontWeight: 800 }}>
              Hoja de Reclamación Registrada
            </h1>

            {/* Correlative Number Badge */}
            <div
              style={{
                display: "inline-block",
                background: "#f0fdf4",
                border: "2px solid #059669",
                padding: "16px 32px",
                borderRadius: 14,
                margin: "12px 0 24px",
              }}
            >
              <small style={{ display: "block", color: "#065f46", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>
                Número Correlativo Único
              </small>
              <strong style={{ fontSize: 32, color: "#059669", letterSpacing: 1, fontFamily: "monospace" }}>
                {successData.correlativeNumber}
              </strong>
            </div>

            {/* Summary Details */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 22,
                textAlign: "left",
                maxWidth: 600,
                margin: "0 auto 28px",
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Fecha y hora de registro:</span>
                <strong style={{ color: "#0f172a" }}>{new Date(successData.createdAt).toLocaleString("es-PE")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Consumidor:</span>
                <strong style={{ color: "#0f172a" }}>{submittedValues.fullName} ({submittedValues.documentType} {submittedValues.documentNumber})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Tipo de Solicitud:</span>
                <strong style={{ color: submittedValues.claimType === "RECLAMO" ? "#059669" : "#d97706" }}>
                  {submittedValues.claimType} — {submittedValues.goodType}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Correo de Notificación:</span>
                <strong style={{ color: "#0f172a" }}>{submittedValues.email}</strong>
              </div>
            </div>

            {/* Notification Notice */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                padding: "16px 20px",
                maxWidth: 600,
                margin: "0 auto 30px",
                color: "#1e293b",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <Mail size={16} style={{ color: "#059669", marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>Copia Digital Remitida:</strong> Se ha enviado automáticamente una copia oficial en formato PDF de su Hoja de Reclamación a su correo electrónico <strong style={{ color: "#0f172a" }}>{submittedValues.email}</strong>.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Scale size={16} style={{ color: "#059669", marginTop: 2, flexShrink: 0 }} />
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
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#334155", padding: "12px 22px", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 10, fontWeight: 600, fontSize: 14 }}
              >
                <Printer size={16} /> Imprimir Constancia
              </button>
              <Link
                href={`/libro-de-reclamaciones/seguimiento?n=${successData.correlativeNumber}`}
                style={{ padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#ffffff", border: "1px solid #059669", color: "#059669", borderRadius: 10, fontWeight: 600, fontSize: 14 }}
              >
                <Search size={16} /> Consultar Seguimiento
              </Link>
              <Link
                href="/"
                style={{ padding: "12px 24px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#059669", color: "#ffffff", borderRadius: 10, fontWeight: 700, fontSize: 14 }}
              >
                Finalizar y Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          /* Complaint Filing Form View */
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: "36px 30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            {/* Header with Indecopi Badge & Corporate Info */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 28 }}>
              <div>
                <span style={{ color: "#059669", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  República del Perú — Indecopi
                </span>
                <h1 style={{ fontSize: 26, margin: "6px 0 10px", color: "#0f172a", letterSpacing: -0.5, fontWeight: 800 }}>
                  Libro de Reclamaciones Virtual
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", maxWidth: 540, lineHeight: 1.5 }}>
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
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 32,
                fontSize: 12,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div>
                  <strong style={{ color: "#0f172a", display: "block" }}>Razón Social:</strong>
                  Livora S.A.C.
                </div>
                <div>
                  <strong style={{ color: "#0f172a", display: "block" }}>RUC:</strong>
                  20608912345
                </div>
                <div>
                  <strong style={{ color: "#0f172a", display: "block" }}>Domicilio Legal:</strong>
                  Av. Javier Prado Este 4200, Surco, Lima, Perú
                </div>
                <div>
                  <strong style={{ color: "#0f172a", display: "block" }}>Plazo de Respuesta:</strong>
                  15 días hábiles improrrogables
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
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

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 28 }}>
              {/* SECCIÓN 1: Identificación del Consumidor */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>
                  1. Identificación del Consumidor Reclamante
                </legend>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 10 }}>
                  <div>
                    <label htmlFor="documentType" style={labelStyle}>Tipo de Documento *</label>
                    <select
                      id="documentType"
                      {...register("documentType")}
                      style={inputStyle}
                    >
                      <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                      <option value="CE">Carnet de Extranjería (CE)</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                    {errors.documentType && <small style={errorTextStyle}>{errors.documentType.message}</small>}
                  </div>

                  <div>
                    <label htmlFor="documentNumber" style={labelStyle}>Número de Documento *</label>
                    <input
                      id="documentNumber"
                      type="text"
                      {...register("documentNumber")}
                      placeholder="Ej. 74839201"
                      style={inputStyle}
                    />
                    {errors.documentNumber && <small style={errorTextStyle}>{errors.documentNumber.message}</small>}
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="fullName" style={labelStyle}>Nombres y Apellidos Completos / Razón Social *</label>
                    <input
                      id="fullName"
                      type="text"
                      {...register("fullName")}
                      placeholder="Ingrese su nombre completo"
                      style={inputStyle}
                    />
                    {errors.fullName && <small style={errorTextStyle}>{errors.fullName.message}</small>}
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="address" style={labelStyle}>Domicilio (Dirección, Distrito, Provincia y Departamento) *</label>
                    <input
                      id="address"
                      type="text"
                      {...register("address")}
                      placeholder="Ej. Av. Los Laureles 123, San Borja, Lima"
                      style={inputStyle}
                    />
                    {errors.address && <small style={errorTextStyle}>{errors.address.message}</small>}
                  </div>

                  <div>
                    <label htmlFor="phone" style={labelStyle}>Teléfono o Celular *</label>
                    <input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="Ej. 987654321"
                      style={inputStyle}
                    />
                    {errors.phone && <small style={errorTextStyle}>{errors.phone.message}</small>}
                  </div>

                  <div>
                    <label htmlFor="email" style={labelStyle}>Correo Electrónico (Para recibir copia PDF) *</label>
                    <input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="correo@ejemplo.com"
                      style={inputStyle}
                    />
                    {errors.email && <small style={errorTextStyle}>{errors.email.message}</small>}
                  </div>
                </div>

                {/* Checkbox Menor de Edad */}
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#334155" }}>
                    <input
                      type="checkbox"
                      {...register("isMinor")}
                      style={{ width: 17, height: 17, accentColor: "#059669" }}
                    />
                    <span>El reclamante es menor de edad</span>
                  </label>

                  {isMinor && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 14, background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                      <div>
                        <label htmlFor="representativeName" style={labelStyle}>Nombre del Padre, Madre o Apoderado *</label>
                        <input
                          id="representativeName"
                          type="text"
                          {...register("representativeName")}
                          placeholder="Nombre completo del apoderado"
                          style={inputStyle}
                        />
                        {errors.representativeName && <small style={errorTextStyle}>{errors.representativeName.message}</small>}
                      </div>
                      <div>
                        <label htmlFor="representativeDoc" style={labelStyle}>Documento de Identidad del Apoderado</label>
                        <input
                          id="representativeDoc"
                          type="text"
                          {...register("representativeDoc")}
                          placeholder="DNI / CE del apoderado"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* SECCIÓN 2: Identificación del Bien Contratado */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>
                  2. Identificación del Bien Contratado
                </legend>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 10 }}>
                  <div>
                    <label style={labelStyle}>Tipo de Bien Contratado *</label>
                    <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          background: goodType === "PRODUCTO" ? "#f0fdf4" : "#ffffff",
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: goodType === "PRODUCTO" ? "2px solid #059669" : "1px solid #cbd5e1",
                          flex: 1,
                          fontWeight: goodType === "PRODUCTO" ? 700 : 500,
                          color: goodType === "PRODUCTO" ? "#065f46" : "#334155",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <input
                          type="radio"
                          value="PRODUCTO"
                          {...register("goodType")}
                          style={{ accentColor: "#059669" }}
                        />
                        <span>Producto</span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          background: goodType === "SERVICIO" ? "#f0fdf4" : "#ffffff",
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: goodType === "SERVICIO" ? "2px solid #059669" : "1px solid #cbd5e1",
                          flex: 1,
                          fontWeight: goodType === "SERVICIO" ? 700 : 500,
                          color: goodType === "SERVICIO" ? "#065f46" : "#334155",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <input
                          type="radio"
                          value="SERVICIO"
                          {...register("goodType")}
                          style={{ accentColor: "#059669" }}
                        />
                        <span>Servicio</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="amount" style={labelStyle}>Monto Reclamado (Opcional - S/. o LIVO)</label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register("amount")}
                      placeholder="0.00"
                      style={inputStyle}
                    />
                    {errors.amount && <small style={errorTextStyle}>{errors.amount.message}</small>}
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="goodDescription" style={labelStyle}>Descripción del Producto o Servicio Contratado *</label>
                    <textarea
                      id="goodDescription"
                      {...register("goodDescription")}
                      placeholder="Ej. Canje de 50 LIVOs por producto en tienda aliada / Servicio de recolección domiciliaria de botellas PET"
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                    {errors.goodDescription && <small style={errorTextStyle}>{errors.goodDescription.message}</small>}
                  </div>
                </div>
              </fieldset>

              {/* SECCIÓN 3: Detalle de la Reclamación */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>
                  3. Detalle de la Reclamación
                </legend>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    Tipo de Reclamación *
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <label
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: claimType === "RECLAMO" ? "2px solid #059669" : "1px solid #e2e8f0",
                        background: claimType === "RECLAMO" ? "#f0fdf4" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          value="RECLAMO"
                          {...register("claimType")}
                          style={{ accentColor: "#059669" }}
                        />
                        <strong style={{ color: "#059669", fontSize: 14 }}>RECLAMO</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                        Disconformidad relacionada a los productos o servicios ofrecidos.
                      </p>
                    </label>

                    <label
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: claimType === "QUEJA" ? "2px solid #d97706" : "1px solid #e2e8f0",
                        background: claimType === "QUEJA" ? "#fffbeb" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input
                          type="radio"
                          value="QUEJA"
                          {...register("claimType")}
                          style={{ accentColor: "#d97706" }}
                        />
                        <strong style={{ color: "#d97706", fontSize: 14 }}>QUEJA</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                        Disconformidad no relacionada a los productos/servicios; malestar o descontento respecto a la atención al público.
                      </p>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="claimDetail" style={labelStyle}>Detalle de la Reclamación (Hechos) *</label>
                  <textarea
                    id="claimDetail"
                    {...register("claimDetail")}
                    placeholder="Describa con claridad y precisión los hechos ocurridos..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  {errors.claimDetail && <small style={errorTextStyle}>{errors.claimDetail.message}</small>}
                </div>

                <div>
                  <label htmlFor="consumerRequest" style={labelStyle}>Pedido Concreto del Consumidor *</label>
                  <textarea
                    id="consumerRequest"
                    {...register("consumerRequest")}
                    placeholder="Indique con claridad cuál es la solución o pedido que solicita..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  {errors.consumerRequest && <small style={errorTextStyle}>{errors.consumerRequest.message}</small>}
                </div>
              </fieldset>

              {/* SECCIÓN 4: Declaración Jurada y Advertencia Legal */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 14,
                  padding: "20px 22px",
                }}
              >
                <label htmlFor="affidavitConsent" style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input
                    id="affidavitConsent"
                    type="checkbox"
                    {...register("affidavitConsent")}
                    style={{ width: 20, height: 20, marginTop: 2, accentColor: "#059669" }}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: "#1e293b" }}>
                    <strong style={{ color: "#059669" }}>Declaración Jurada:</strong> Declaro bajo fe de juramento que la información y hechos expresados en la presente Hoja de Reclamación son verídicos y corresponden a la realidad. Entiendo que se enviará una copia en PDF al correo indicado y que Livora responderá en un plazo máximo de 15 días hábiles conforme a la Ley N° 29571.
                  </span>
                </label>
                {errors.affidavitConsent && (
                  <div style={{ marginTop: 8 }}>
                    <small style={errorTextStyle}>{errors.affidavitConsent.message}</small>
                  </div>
                )}
              </div>

              {/* Contenedor Institucional de Seguridad Cloudflare Turnstile */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "16px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 10,
                    color: turnstileToken ? "#059669" : "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={18} style={{ color: turnstileToken ? "#059669" : "#64748b" }} />
                  <span>
                    {turnstileToken
                      ? "Verificación de Seguridad Completada"
                      : "Verificación de Seguridad Cloudflare"}
                  </span>
                </div>

                <TurnstileWidget
                  theme="light"
                  onVerify={handleTurnstileVerify}
                  onExpire={handleTurnstileExpire}
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={!turnstileToken || isSubmitting}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 12,
                    cursor: !turnstileToken || isSubmitting ? "not-allowed" : "pointer",
                    background: turnstileToken ? "#059669" : "#94a3b8",
                    color: "#ffffff",
                    border: "none",
                    boxShadow: turnstileToken ? "0 4px 14px rgba(5, 150, 105, 0.3)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  {isSubmitting
                    ? "Registrando Hoja de Reclamación..."
                    : !turnstileToken
                    ? "Complete la verificación de seguridad para enviar"
                    : "Enviar Reclamación Virtual"}
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
