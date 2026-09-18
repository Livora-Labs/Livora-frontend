"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ArrowRight, LogIn, UserPlus, Eye, EyeOff, Check, X } from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const { user, token, role, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  React.useEffect(() => {
    if (token && role) {
      if (role === "ADMIN") router.replace("/admin");
      else if (role === "EMPRESA_B2B") router.replace("/company");
      else if (role === "CENTRO_ACOPIO") router.replace("/centro");
    }
  }, [token, role, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("CENTRO_ACOPIO");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validaciones reactivas de contraseña
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Campos requeridos", "error", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    if (isRegister && !isPasswordValid) {
      showToast("Contraseña no válida", "error", "La contraseña no cumple con los requisitos mínimos de seguridad.");
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
        } else if (loggedUser.role === "TIENDA") {
          showToast("Acceso concedido", "success", `Bienvenido al Terminal POS, ${email}`);
          router.push("/store");
        } else if (["HOGAR", "RECOLECTOR"].includes(loggedUser.role)) {
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
      const errMsg = err.response?.data?.message || err.message || "Ocurrió un error inesperado.";
      showToast(isRegister ? "Error de Registro" : "Error de Autenticación", "error", Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <ToastContainer />
      <section
        className="login-art"
        style={{
          background: "radial-gradient(circle at 70% 30%, rgba(5, 150, 105, 0.12), transparent 45%), var(--panel2)",
          borderRight: "1px solid var(--line)",
        }}
      >
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LivoraFullLogo width={160} height={44} />
        </div>

        <div>
          <span className="eyebrow" style={{ color: "var(--blue)" }}>Trazabilidad Verde Verificable</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0", color: "var(--text)" }}>
            Economía Circular <em style={{ color: "var(--green)", fontStyle: "normal" }}>Verificable.</em>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
            Accede a la plataforma para registrar recolecciones, validar entregas físicas on-chain, procesar pesajes y redimir EcoTokens en comercios locales.
          </p>
        </div>

        <small className="muted" style={{ color: "var(--muted)" }}>Ecosistema de Reciclaje y Recompensas Circulares Livora</small>
      </section>

      <section className="login-form" style={{ background: "var(--panel)" }}>
        <div className="login-card" style={{ maxWidth: 460 }}>
          <span className="eyebrow" style={{ color: "var(--green)" }}>Acceso de Usuarios</span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 16px", color: "var(--text)" }}>
            {isRegister ? "Crear cuenta Livora" : "Iniciar sesión"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>
                Correo electrónico
              </label>
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
                  transition: "border-color 0.15s ease",
                }}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>
                Contraseña
              </label>
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
                    transition: "border-color 0.15s ease",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 4,
                  }}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {isRegister && (
                <div style={{ marginTop: 10, padding: 10, background: "var(--panel2)", borderRadius: 8, border: "1px solid var(--line)", fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Requisitos de seguridad:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: hasMinLen ? "var(--green)" : "var(--muted)" }}>
                      {hasMinLen ? <Check size={11} /> : <X size={11} />} Mín. 8 caracteres
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: hasUpper ? "var(--green)" : "var(--muted)" }}>
                      {hasUpper ? <Check size={11} /> : <X size={11} />} Una mayúscula
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: hasLower ? "var(--green)" : "var(--muted)" }}>
                      {hasLower ? <Check size={11} /> : <X size={11} />} Una minúscula
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: hasNumber ? "var(--green)" : "var(--muted)" }}>
                      {hasNumber ? <Check size={11} /> : <X size={11} />} Un número
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: hasSpecial ? "var(--green)" : "var(--muted)", gridColumn: "span 2" }}>
                      {hasSpecial ? <Check size={11} /> : <X size={11} />} Un símbolo (!@#$%^&*...)
                    </span>
                  </div>
                </div>
              )}

              {!isRegister && (
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <a
                    href="/recuperar-contrasena"
                    style={{
                      fontSize: 12,
                      color: "var(--blue)",
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
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>
                    Rol en el ecosistema
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "var(--panel2)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      color: "var(--text)",
                      fontSize: 13,
                      outline: "none",
                      cursor: "pointer",
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
                      color: "var(--text)",
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
                        accentColor: "var(--green)",
                        width: 16,
                        height: 16,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      required
                    />
                    <span>
                      Acepto los{" "}
                      <a
                        href="/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--green)", textDecoration: "underline", fontWeight: 700 }}
                      >
                        Términos y Condiciones
                      </a>{" "}
                      y la{" "}
                      <a
                        href="/privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--green)", textDecoration: "underline", fontWeight: 700 }}
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
                      color: "var(--muted)",
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
                        accentColor: "var(--green)",
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

                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.45 }}>
                  Tus datos serán recopilados por Livora para gestionar tu cuenta y monedero. Conoce más en nuestra{" "}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--green)", textDecoration: "underline", fontWeight: 700 }}
                  >
                    Política de Privacidad
                  </a>.
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (isRegister && !isPasswordValid)}
              style={{
                width: "100%",
                background: "var(--green)",
                color: "#06110d",
                border: "none",
                padding: 14,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 800,
                cursor: loading || (isRegister && !isPasswordValid) ? "not-allowed" : "pointer",
                opacity: loading || (isRegister && !isPasswordValid) ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 10,
                transition: "opacity 0.2s",
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
                color: "var(--blue)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {isRegister ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
