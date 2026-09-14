"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";

function RestablecerContrasenaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast("Token faltante", "error", "El token de recuperación no está presente en la URL.");
      return;
    }

    if (password.length < 8) {
      showToast("Contraseña corta", "error", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    // Regla de contraseña fuerte
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/])[A-Za-z\d!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]{8,}$/;
    if (!passwordRegex.test(password)) {
      showToast(
        "Contraseña débil",
        "error",
        "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial."
      );
      return;
    }

    if (password !== confirmPassword) {
      showToast("Contraseñas no coinciden", "error", "Las contraseñas ingresadas no son idénticas.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      showToast("Contraseña restablecida", "success", "Tu contraseña ha sido actualizada correctamente.");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Error al restablecer la contraseña.";
      showToast("Error de restablecimiento", "error", Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#EF4444", marginBottom: 12 }}>Enlace no válido</h2>
        <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
          Este enlace de recuperación es inválido, ha expirado o ya ha sido utilizado anteriormente.
        </p>
        <button
          onClick={() => router.push("/recuperar-contrasena")}
          style={{
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#0A192F",
            border: "none",
            padding: "12px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Solicitar nuevo enlace
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: "center" }}>
        <CheckCircle2 size={48} color="#10B981" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 12px" }}>¡Contraseña actualizada!</h2>
        <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
          Tu contraseña ha sido restablecida con éxito. Serás redirigido al inicio de sesión en unos segundos...
        </p>
      </div>
    );
  }

  return (
    <>
      <span style={{ color: "#10B981", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Seguridad de cuenta</span>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 16px" }}>Restablecer contraseña</h2>
      <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
        Ingresa tu nueva contraseña a continuación. Asegúrate de que cumpla con los requisitos mínimos de seguridad.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Nueva contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Confirmar contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Actualizando..." : "Restablecer contraseña"}
          <Lock size={16} />
        </button>
      </form>
    </>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <div className="login" style={{ minHeight: "100vh", background: "#0A192F", color: "#F8FAFC" }}>
      <ToastContainer />
      <section className="login-art" style={{ background: "radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.2), transparent 40%), #0A192F" }}>
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              color: "#0A192F",
              fontSize: 20,
            }}
          >
            L
          </div>
          <strong style={{ fontSize: 22, color: "#F8FAFC" }}>Livora</strong>
        </div>

        <div>
          <span className="eyebrow" style={{ color: "#06B6D4" }}>Protección de Credenciales</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0" }}>
            Restablecer <em style={{ color: "#10B981", fontStyle: "normal" }}>Contraseña.</em>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.6 }}>
            Define una nueva contraseña segura utilizando tu enlace de verificación transaccional. Esta acción se aplica de forma inmediata.
          </p>
        </div>

        <small className="muted" style={{ color: "#94A3B8" }}>Encriptación AES-256 · Tokens Expirables · Seguridad Web3</small>
      </section>

      <section className="login-form" style={{ background: "#0D1117" }}>
        <div className="login-card" style={{ maxWidth: 460 }}>
          <Suspense fallback={<div style={{ color: "#94A3B8" }}>Cargando formulario...</div>}>
            <RestablecerContrasenaForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
