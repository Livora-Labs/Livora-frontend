import React from "react";
import Link from "next/link";

export default function NotFound() {
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
          background: "rgba(16, 185, 129, 0.1)",
          color: "#10B981",
          display: "grid",
          placeItems: "center",
          fontSize: 36,
          fontWeight: 900,
          marginBottom: 24,
        }}
      >
        ?
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: "-1px" }}>
        Página no encontrada
      </h1>
      <p style={{ color: "#94A3B8", fontSize: 16, maxWidth: 460, lineHeight: 1.6, marginBottom: 24 }}>
        Lo sentimos, la página que buscas no existe o ha sido movida. Verifica la URL o regresa al inicio.
      </p>
      <Link
        href="/"
        style={{
          background: "linear-gradient(135deg, #10B981, #059669)",
          color: "#0A192F",
          textDecoration: "none",
          padding: "12px 24px",
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 15,
          transition: "opacity 0.2s",
        }}
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
