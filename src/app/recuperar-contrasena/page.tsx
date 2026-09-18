"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";

export default function RecuperarContrasenaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Campo requerido", "error", "Por favor ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
      showToast("Enlace enviado", "success", "Se ha enviado un enlace de recuperación a tu correo.");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Ocurrió un error inesperado.";
      showToast("Error de solicitud", "error", Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "grid", placeItems: "center", padding: 20 }}>
      <ToastContainer />
      <div style={{ width: "100%", maxWidth: 460, background: "var(--panel)", padding: "34px 40px", borderRadius: 16, border: "1px solid var(--line)", boxShadow: "0 18px 40px rgba(0,0,0,0.06)" }}>
        
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          <LivoraFullLogo width={140} height={36} />
        </div>

        {!submitted ? (
          <>
            <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Seguridad de cuenta</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 16px", color: "var(--text)" }}>¿Olvidaste tu contraseña?</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace de recuperación para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>Correo electrónico</label>
                <input
                  type="email"
                  placeholder="ejemplo@livora.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--panel2)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "var(--green)",
                  color: "#06110d",
                  border: "none",
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                {loading ? "Procesando..." : "Enviar enlace de recuperación"}
                <Mail size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Correo enviado</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 16px", color: "var(--text)" }}>Revisa tu bandeja</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Si la dirección <strong style={{ color: "var(--text)" }}>{email}</strong> está registrada en Livora, recibirás un enlace de recuperación de contraseña válido por 1 hora.
            </p>
            <div style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, fontSize: 12, color: "var(--muted)", textAlign: "left", marginBottom: 20, lineHeight: 1.5 }}>
              Si no encuentras el mensaje en unos minutos, revisa tu carpeta de correo no deseado o spam.
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 16, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "var(--green)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
