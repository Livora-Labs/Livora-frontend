"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fallo capturado en error.tsx:", error);
  }, [error]);

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
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--red)",
            display: "grid",
            placeItems: "center",
            marginBottom: 20,
          }}
        >
          <AlertTriangle size={36} />
        </div>

        <span className="eyebrow" style={{ color: "var(--red)" }}>Incidente de Ejecución</span>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "8px 0 12px", letterSpacing: "-0.5px" }}>
          Algo no salió como esperábamos
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24, margin: "0 0 24px" }}>
          Ha ocurrido una excepción controlada durante la operación. El incidente ha sido notificado al sistema para su resolución.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => reset()}
            className="btn primary"
            style={{
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={15} />
            <span>Reintentar</span>
          </button>
          <Link
            href="/"
            className="btn secondary"
            style={{
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <Home size={15} />
            <span>Ir al Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
