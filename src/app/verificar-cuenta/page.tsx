"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { KeyRound, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { getErrorMessage } from "@/lib/api";

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
        } else if (["HOGAR", "RECOLECTOR", "TIENDA"].includes(loggedUser.role)) {
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
      const errMsg = getErrorMessage(err, "Código incorrecto o expirado.");
      showToast("Error de Verificación", "error", errMsg);
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
      const errMsg = getErrorMessage(err, "No se pudo reenviar el código.");
      showToast("Error de reenvío", "error", errMsg);
    }
  };

  return (
    <div className="login-card" style={{ maxWidth: 460 }}>
      <span className="eyebrow" style={{ color: "#10B981" }}>Verificación de Seguridad</span>
      <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 16px" }}>
        Verifica tu cuenta
      </h2>
      <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Hemos enviado un código numérico de 6 dígitos a <strong style={{ color: "#F8FAFC" }}>{email}</strong>. Por favor, ingrésalo a continuación.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field" style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Código OTP de 6 dígitos</label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            style={{
              width: "100%",
              padding: 12,
              background: "#0A192F",
              border: "1px solid #1E293B",
              borderRadius: 10,
              color: "#F8FAFC",
              fontSize: 24,
              textAlign: "center",
              letterSpacing: 8,
              outline: "none",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#0A192F",
            border: "none",
            padding: 14,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
            opacity: code.length === 6 ? 1 : 0.6,
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
              color: "#06B6D4",
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
          <span style={{ color: "#94A3B8" }}>
            Reenviar código en <strong style={{ color: "#06B6D4" }}>{cooldown}s</strong>
          </span>
        )}
      </div>

      <div style={{ marginTop: 18, textAlign: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#94A3B8",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
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
          <span className="eyebrow" style={{ color: "#06B6D4" }}>Seguridad de Nivel Producción</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0" }}>
            Verificación de <em style={{ color: "#10B981", fontStyle: "normal" }}>Identidad.</em>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.6 }}>
            Valida tu correo electrónico mediante el código transaccional de un solo uso para activar tu billetera y comenzar a operar de forma segura en Stellar.
          </p>
        </div>

        <small className="muted" style={{ color: "#94A3B8" }}>Protección Anti-Spam · Criptografía SHA-256 · Livora Core</small>
      </section>

      <section className="login-form" style={{ background: "#0D1117" }}>
        <Suspense fallback={<div style={{ color: "#94A3B8" }}>Cargando formulario...</div>}>
          <VerifyAccountForm />
        </Suspense>
      </section>
    </div>
  );
}
