"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { KeyRound, RefreshCw, ArrowRight } from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";

function VerifyAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, resendOtp, logout } = useAuth();

  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      showToast("Código inválido", "error", "El código debe tener exactamente 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await verifyEmail(email, code);
      showToast("¡Cuenta verificada!", "success", "Tu correo ha sido verificado con éxito.");
      
      // Redirigir según el rol autorizado
      setTimeout(() => {
        if (loggedUser.role === "ADMIN") {
          router.push("/admin");
        } else if (loggedUser.role === "EMPRESA_B2B") {
          router.push("/company");
        } else if (loggedUser.role === "CENTRO_ACOPIO") {
          router.push("/centro");
        } else if (loggedUser.role === "TIENDA") {
          router.push("/store");
        } else if (["HOGAR", "RECOLECTOR"].includes(loggedUser.role)) {
          logout();
          showToast(
            "Acceso no disponible en Web",
            "error",
            "Tu cuenta opera exclusivamente desde la app móvil Livora. Descárgala para continuar."
          );
          router.push("/");
        } else {
          logout();
          router.push("/");
        }
      }, 1000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Código incorrecto o expirado.";
      showToast("Error de Verificación", "error", Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp(email);
      showToast("Código reenviado", "success", "Se ha enviado un nuevo código OTP a tu correo.");
      setCooldown(60);
      setCanResend(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "No se pudo reenviar el código.";
      showToast("Error de reenvío", "error", errMsg);
    }
  };

  return (
    <div className="login-card" style={{ maxWidth: 460, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "32px 36px" }}>
      <span className="eyebrow" style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Verificación de Seguridad</span>
      <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 16px", color: "var(--text)" }}>
        Verifica tu cuenta
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Hemos enviado un código numérico de 6 dígitos a <strong style={{ color: "var(--text)" }}>{email}</strong>. Por favor, ingrésalo a continuación.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field" style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>Código OTP de 6 dígitos</label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            style={{
              width: "100%",
              padding: 12,
              background: "var(--panel2)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 24,
              textAlign: "center",
              letterSpacing: 8,
              outline: "none",
              boxSizing: "border-box",
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            width: "100%",
            background: "var(--green)",
            color: "#06110d",
            border: "none",
            padding: 14,
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 800,
            cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
            opacity: code.length === 6 && !loading ? 1 : 0.6,
            transition: "opacity 0.2s ease",
          }}
        >
          <span>{loading ? "Verificando..." : "Confirmar Código"}</span>
          <ArrowRight size={18} />
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 13 }}>
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            style={{
              background: "none",
              border: "none",
              color: "var(--green)",
              cursor: "pointer",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={14} />
            Reenviar código de verificación
          </button>
        ) : (
          <span style={{ color: "var(--muted)" }}>
            Reenviar código en <strong style={{ color: "var(--green)" }}>{cooldown}s</strong>
          </span>
        )}
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <div className="login" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <ToastContainer />
      <section className="login-art" style={{ background: "radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.08), transparent 50%), var(--bg)" }}>
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LivoraFullLogo width={160} height={44} />
        </div>

        <div>
          <span className="eyebrow" style={{ color: "var(--green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Seguridad de Nivel Producción</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0", color: "var(--text)" }}>
            Verificación de <em style={{ color: "var(--green)", fontStyle: "normal" }}>Identidad.</em>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
            Valida tu correo electrónico mediante el código transaccional de un solo uso para activar tu billetera y comenzar a operar de forma segura en Stellar.
          </p>
        </div>

        <small className="muted" style={{ color: "var(--muted)" }}>Protección Anti-Spam · Criptografía SHA-256 · Livora Core</small>
      </section>

      <section className="login-form" style={{ background: "var(--panel)", borderLeft: "1px solid var(--line)" }}>
        <Suspense fallback={<div style={{ color: "var(--muted)" }}>Cargando formulario...</div>}>
          <VerifyAccountForm />
        </Suspense>
      </section>
    </div>
  );
}
