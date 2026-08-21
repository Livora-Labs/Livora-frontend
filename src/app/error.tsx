"use client";

import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry or internal service
    console.error("Fallo capturado en error.tsx:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A192F",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "rgba(239, 68, 68, 0.1)",
          color: "#EF4444",
          display: "grid",
          placeItems: "center",
          fontSize: 36,
          fontWeight: 900,
          marginBottom: 24,
        }}
      >
        !
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: "-1px" }}>
        Algo salió mal
      </h1>
      <p style={{ color: "#94A3B8", fontSize: 16, maxWidth: 460, lineHeight: 1.6, marginBottom: 24 }}>
        Ha ocurrido un error inesperado al procesar la solicitud. Hemos registrado el incidente para solucionarlo lo antes posible.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#0A192F",
            border: "none",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            background: "transparent",
            color: "#94A3B8",
            border: "1px solid #1E293B",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}
