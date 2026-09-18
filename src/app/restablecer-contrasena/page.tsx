"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Check, X } from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";

function RestablecerContrasenaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reglas de contraseña en tiempo real
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]/.test(password);
  const allRulesMet = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast("Token faltante", "error", "El token de recuperación no está presente en la URL.");
      return;
    }

    if (!allRulesMet) {
      showToast("Contraseña débil", "error", "La contraseña debe cumplir con todos los requisitos de seguridad.");
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
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
          Este enlace de recuperación es inválido, ha expirado o ya ha sido utilizado anteriormente.
        </p>
        <button
          onClick={() => router.push("/recuperar-contrasena")}
          style={{
            background: "var(--green)",
            color: "#06110d",
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
        <CheckCircle2 size={48} color="var(--green)" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 12px", color: "var(--text)" }}>¡Contraseña actualizada!</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
          Tu contraseña ha sido restablecida con éxito. Serás redirigido al inicio de sesión en unos segundos...
        </p>
      </div>
    );
  }

  return (
    <>
      <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Seguridad de cuenta</span>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "6px 0 16px", color: "var(--text)" }}>Restablecer contraseña</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
        Ingresa tu nueva contraseña a continuación. Asegúrate de que cumpla con los requisitos de seguridad.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>Nueva contraseña</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 42px 12px 14px",
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        {password.length > 0 && (
          <div style={{ marginBottom: 14, padding: "10px 12px", background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)", fontSize: 11 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: hasMinLength ? "var(--green)" : "var(--muted)" }}>
                {hasMinLength ? <Check size={12} /> : <X size={12} />} Mínimo 8 caracteres
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: hasUpper ? "var(--green)" : "var(--muted)" }}>
                {hasUpper ? <Check size={12} /> : <X size={12} />} Una mayúscula
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: hasLower ? "var(--green)" : "var(--muted)" }}>
                {hasLower ? <Check size={12} /> : <X size={12} />} Una minúscula
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: hasNumber ? "var(--green)" : "var(--muted)" }}>
                {hasNumber ? <Check size={12} /> : <X size={12} />} Un número
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: hasSpecial ? "var(--green)" : "var(--muted)", gridColumn: "1 / -1" }}>
                {hasSpecial ? <Check size={12} /> : <X size={12} />} Un símbolo especial (!@#$%...)
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>Confirmar contraseña</label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 42px 12px 14px",
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
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <span style={{ display: "block", fontSize: 11, color: "#EF4444", marginTop: 4 }}>
              Las contraseñas no coinciden
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !allRulesMet || !passwordsMatch}
          style={{
            width: "100%",
            background: "var(--green)",
            color: "#06110d",
            border: "none",
            padding: 14,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            cursor: loading || !allRulesMet || !passwordsMatch ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: allRulesMet && passwordsMatch && !loading ? 1 : 0.6,
            transition: "opacity 0.2s ease",
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
    <div className="login" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <ToastContainer />
      <section className="login-art" style={{ background: "radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.08), transparent 50%), var(--bg)" }}>
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LivoraFullLogo width={160} height={44} />
        </div>

        <div>
          <span className="eyebrow" style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Protección de Credenciales</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0", color: "var(--text)" }}>
            Restablecer <em style={{ color: "var(--green)", fontStyle: "normal" }}>Contraseña.</em>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
            Define una nueva contraseña segura utilizando tu enlace de verificación transaccional. Esta acción se aplica de forma inmediata.
          </p>
        </div>

        <small className="muted" style={{ color: "var(--muted)" }}>Encriptación AES-256 · Tokens Expirables · Seguridad Web3</small>
      </section>

      <section className="login-form" style={{ background: "var(--panel)", borderLeft: "1px solid var(--line)" }}>
        <div className="login-card" style={{ maxWidth: 460, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "32px 36px" }}>
          <Suspense fallback={<div style={{ color: "var(--muted)" }}>Cargando formulario...</div>}>
            <RestablecerContrasenaForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
