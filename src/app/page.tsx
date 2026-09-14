"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { LivoraLogo } from "@/components/LivoraLogo";
import { getErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("CENTRO_ACOPIO");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Campos requeridos", "error", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    if (isRegister && !acceptedTerms) {
      showToast("Consentimiento requerido", "error", "Debes aceptar los Términos y Condiciones y la Política de Privacidad para registrarte.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, selectedRole, {
          termsVersion: "2.0.0",
          privacyVersion: "2.0.0",
          marketingAccepted,
        });
        showToast("Código enviado", "success", "Por favor introduce el código OTP enviado a tu correo.");
        router.push(`/verificar-cuenta?email=${encodeURIComponent(email.trim())}`);
      } else {
        const loggedUser = await login(email.trim(), password);

        // Redirect based on authorized web roles
        if (loggedUser.role === "ADMIN") {
          showToast("Acceso concedido", "success", `Bienvenido de nuevo, ${email}`);
          router.push("/admin");
        } else if (loggedUser.role === "EMPRESA_B2B") {
          showToast("Acceso concedido", "success", `Bienvenido de nuevo, ${email}`);
          router.push("/company");
        } else if (loggedUser.role === "CENTRO_ACOPIO") {
          showToast("Acceso concedido", "success", `Bienvenido de nuevo, ${email}`);
          router.push("/centro");
        } else if (["HOGAR", "RECOLECTOR", "TIENDA"].includes(loggedUser.role)) {
          logout();
          showToast(
            "Acceso no disponible en Web",
            "error",
            "Tu cuenta opera exclusivamente desde la app móvil Livora. Descárgala para continuar."
          );
        } else {
          logout();
          showToast("Rol no autorizado", "error", "Tu rol no cuenta con acceso a la plataforma web.");
        }
      }
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      showToast(isRegister ? "Error de Registro" : "Error de Autenticación", "error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login" style={{ minHeight: "100vh", background: "#0A192F", color: "#F8FAFC" }}>
      <ToastContainer />
      <section className="login-art" style={{ background: "radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.2), transparent 40%), #0A192F" }}>
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LivoraLogo size={38} />
          <strong style={{ fontSize: 22, color: "#F8FAFC" }}>Livora</strong>
        </div>

        <div>
          <span className="eyebrow" style={{ color: "#06B6D4" }}>Trazabilidad Verde Verificable</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0" }}>
            Economía Circular <em style={{ color: "#10B981", fontStyle: "normal" }}>Verificable.</em>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.6 }}>
            Accede a la plataforma para registrar recolecciones, validar entregas físicas on-chain, procesar pesajes y redimir EcoTokens en comercios locales.
          </p>
        </div>

        <small className="muted" style={{ color: "#94A3B8" }}>Ecosistema de Reciclaje y Recompensas Circulares Livora</small>
      </section>

      <section className="login-form" style={{ background: "#0D1117" }}>
        <div className="login-card" style={{ maxWidth: 460 }}>
          <span className="eyebrow" style={{ color: "#10B981" }}>Acceso de Usuarios</span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 16px" }}>
            {isRegister ? "Crear cuenta Livora" : "Iniciar sesión"}
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field" style={{ marginBottom: 14 }}>
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
              />
            </div>

            <div className="field" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Contraseña</label>
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
              {isRegister && (
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 6, lineHeight: 1.5 }}>
                  Mínimo 8 caracteres · una mayúscula · una minúscula · un número · un símbolo{" "}
                  <span style={{ color: "#94A3B8" }}>(ej: Ejemplo1!)</span>
                </p>
              )}
              {!isRegister && (
                <div style={{ textAlign: "right", marginTop: 6 }}>
                  <a
                    href="/recuperar-contrasena"
                    style={{
                      fontSize: 12,
                      color: "#06B6D4",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              )}
            </div>

            {isRegister && (
              <>
                <div className="field" style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>Rol en el ecosistema</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
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
                  >
                    <option value="CENTRO_ACOPIO">Centro de Acopio</option>
                    <option value="EMPRESA_B2B">Empresa B2B / Compradora</option>
                  </select>
                </div>

                {/* Consent Checkboxes */}
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 12.5,
                      color: "#CBD5E1",
                      cursor: "pointer",
                      lineHeight: 1.45,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      style={{
                        marginTop: 2,
                        accentColor: "#10B981",
                        width: 16,
                        height: 16,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      Acepto los{" "}
                      <a
                        href="/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#10B981", textDecoration: "underline", fontWeight: 700 }}
                      >
                        Términos y Condiciones
                      </a>{" "}
                      y la{" "}
                      <a
                        href="/privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#10B981", textDecoration: "underline", fontWeight: 700 }}
                      >
                        Política de Privacidad
                      </a>{" "}
                      de Livora.
                    </span>
                  </label>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 12,
                      color: "#94A3B8",
                      cursor: "pointer",
                      lineHeight: 1.4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={marketingAccepted}
                      onChange={(e) => setMarketingAccepted(e.target.checked)}
                      style={{
                        marginTop: 2,
                        accentColor: "#10B981",
                        width: 16,
                        height: 16,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      Autorizo el envío de publicidad y promociones sobre tiendas asociadas y beneficios comerciales (Opcional).
                    </span>
                  </label>
                </div>

                <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16, lineHeight: 1.45 }}>
                  Tus datos serán recopilados por Livora para gestionar tu cuenta y monedero. Conoce más en nuestra{" "}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#10B981", textDecoration: "underline", fontWeight: 700 }}
                  >
                    Política de Privacidad
                  </a>.
                </p>
              </>
            )}

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
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 10,
              }}
            >
              <span>{loading ? "Procesando..." : isRegister ? "Registrar e Ingresar" : "Ingresar"}</span>
              {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 13 }}>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={{
                background: "none",
                border: "none",
                color: "#06B6D4",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {isRegister ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
