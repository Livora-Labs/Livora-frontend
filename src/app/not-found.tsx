import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <LivoraFullLogo width={160} height={42} />
      </div>

      <div
        className="card"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "40px 32px",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          boxShadow: "var(--card-shadow)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "var(--green)",
            display: "grid",
            placeItems: "center",
            marginBottom: 20,
          }}
        >
          <FileQuestion size={36} />
        </div>

        <span className="eyebrow" style={{ color: "var(--green)" }}>Error 404 · Ruta no localizada</span>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "8px 0 12px", letterSpacing: "-0.5px" }}>
          Página no encontrada
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24, margin: "0 0 24px" }}>
          Lo sentimos, el recurso que buscas no existe o ha sido reubicado en la red Livora. Verifica la dirección web o vuelve al panel principal.
        </p>

        <Link
          href="/"
          className="btn primary"
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
}
