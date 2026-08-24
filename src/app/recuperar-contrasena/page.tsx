"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { Mail, ArrowLeft } from "lucide-react";

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
    <div style={{ minHeight: "100vh", background: "#0A192F", color: "#F8FAFC", display: "grid", placeItems: "center", padding: 20 }}>
      <ToastContainer />
      <div style={{ width: "100%", maxWidth: 460, background: "#0D1117", padding: "30px 40px", borderRadius: 16, border: "1px solid #1E293B" }}>
        
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30, justifyContent: "center" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              color: "#0A192F",
              fontSize: 16,
            }}
          >
            L
          </div>
          <strong style={{ fontSize: 18, color: "#F8FAFC" }}>Livora</strong>
        </div>

        {!submitted ? (
          <>
            <span style={{ color: "#10B981", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Seguridad de cuenta</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 16px" }}>¿Olvidaste tu contraseña?</h2>
            <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace de recuperación para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Correo electrónico</label>
                <input
                  type="email"
                  placeholder="ejemplo@livora.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "#0A192F",
                    border: "1px solid #1E293B",
                    borderRadius: 10,
                    color: "#F8FAFC",
                    fontSize: 13,
                    outline: "none",
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#0A192F",
                  border: "none",
                  padding: 14,
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? "Procesando..." : "Enviar enlace de recuperación"}
                <Mail size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#10B981", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Correo enviado</span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 16px" }}>Revisa tu bandeja</h2>
            <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Si la dirección <strong>{email}</strong> está registrada en Livora, recibirás un enlace de recuperación de contraseña válido por 1 hora.
            </p>
            <div style={{ background: "#1E293B", borderRadius: 8, padding: 12, fontSize: 12, color: "#94A3B8", textAlign: "left", marginBottom: 20 }}>
              Si no encuentras el mensaje en unos minutos, revisa tu carpeta de correo no deseado o spam.
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, borderTop: "1px solid #1E293B", paddingTop: 16, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "#06B6D4",
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
