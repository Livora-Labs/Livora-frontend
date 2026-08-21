"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fallo crítico global capturado en global-error.tsx:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0A192F",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
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
          ☠
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: "-1px" }}>
          Error Crítico del Sistema
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 16, maxWidth: 460, lineHeight: 1.6, marginBottom: 24 }}>
          La aplicación experimentó un fallo crítico a nivel de sistema. Por favor reintenta restablecer la aplicación.
        </p>
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
          Restablecer Aplicación
        </button>
      </body>
    </html>
  );
}
