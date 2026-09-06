"use client";

import React from "react";
import { Wrench, ShieldCheck } from "lucide-react";

/**
 * Pantalla informativa de modo mantenimiento
 */
export function MaintenanceMode() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0A192F 0%, #061220 100%)",
        color: "#F8FAFC",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          background: "#112240",
          border: "1px solid #1E293B",
          borderRadius: 24,
          padding: 40,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.15)",
            border: "2px solid #F59E0B",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 24px",
          }}
        >
          <Wrench size={36} style={{ color: "#F59E0B" }} />
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#F59E0B",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            display: "block",
            marginBottom: 8,
          }}
        >
          Mantenimiento Programado
        </span>

        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 16px", color: "#F8FAFC" }}>
          Mejorando la Plataforma Livora
        </h1>

        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 28px" }}>
          Estamos realizando actualizaciones en la infraestructura de trazabilidad y nodos Stellar Soroban para brindarte un servicio más rápido y seguro. Volveremos en breve.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 30,
            background: "#0A192F",
            border: "1px solid #1E293B",
            fontSize: 12,
            color: "#10B981",
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={16} />
          <span>Custodia y fondos protegidos en blockchain</span>
        </div>
      </div>
    </div>
  );
}
