"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("HOGAR");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Campos requeridos", "error", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, selectedRole);
        showToast("Código enviado", "success", "Por favor introduce el código OTP enviado a tu correo.");
        router.push(`/verificar-cuenta?email=${encodeURIComponent(email.trim())}`);
      } else {
        const loggedUser = await login(email.trim(), password);
        showToast("Acceso concedido", "success", `Bienvenido de nuevo, ${email}`);

        // Redirect based on role
        if (loggedUser.role === "ADMIN") router.push("/admin");
        else if (loggedUser.role === "EMPRESA_B2B") router.push("/company");
        else if (loggedUser.role === "HOGAR") router.push("/hogar");
        else if (loggedUser.role === "RECOLECTOR") router.push("/recolector");
        else if (loggedUser.role === "CENTRO_ACOPIO" || loggedUser.role === "ALMACEN") router.push("/centro");
        else if (loggedUser.role === "TIENDA") router.push("/tienda");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Ocurrió un error inesperado.";
      showToast(isRegister ? "Error de Registro" : "Error de Autenticación", "error", Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    } finally {
      setLoading(false);
    }
  };

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
          <span className="eyebrow" style={{ color: "#06B6D4" }}>Trazabilidad Verde Verificable</span>
          <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", margin: "12px 0" }}>
            Economía Circular <em style={{ color: "#10B981", fontStyle: "normal" }}>Verificable.</em>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.6 }}>
            Accede a la plataforma para registrar recolecciones, validar entregas físicas on-chain, procesar pesajes y redimir EcoTokens en comercios locales.
          </p>
        </div>

        <small className="muted" style={{ color: "#94A3B8" }}>Arbitrum Sepolia · IPFS · WebSockets · NestJS DB</small>
      </section>

      <section className="login-form" style={{ background: "#0D1117" }}>
        <div className="login-card" style={{ maxWidth: 460 }}>
          <span className="eyebrow" style={{ color: "#10B981" }}>Acceso de Usuarios</span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 16px" }}>
            {isRegister ? "Crear cuenta Livora" : "Iniciar sesión"}
          </h2>

          <form onSubmit={handleSubmit}>
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
                required
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
                required
              />
            </div>

            {isRegister && (
              <div className="field" style={{ marginBottom: 20 }}>
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
                  <option value="HOGAR">Hogar / Ciudadano</option>
                  <option value="RECOLECTOR">Recolector Urbano</option>
                  <option value="CENTRO_ACOPIO">Centro de Acopio</option>
                  <option value="ALMACEN">Operador de Almacén</option>
                  <option value="TIENDA">Tienda / Comercio Aliado</option>
                  <option value="EMPRESA_B2B">Empresa B2B / Compradora</option>
                </select>
              </div>
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
