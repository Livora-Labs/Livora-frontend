"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import {
  ArrowRight,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Check,
  X,
  Mail,
  Lock,
  ShieldCheck,
  Cpu,
  Database,
  Warehouse,
  Building2,
  Store,
  Scale,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { LivoraFullLogo } from "@/components/LivoraLogo";

export default function LoginPage() {
  const router = useRouter();
  const { user, token, role, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (token && role) {
      if (role === "ADMIN") router.replace("/admin");
      else if (role === "EMPRESA_B2B") router.replace("/company");
      else if (role === "CENTRO_ACOPIO") router.replace("/centro");
      else if (role === "TIENDA") router.replace("/store");
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
    <div className="min-h-screen w-full bg-[#040807] text-[#eaf4f0] flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      <ToastContainer />

      {/* Main Grid: Split Screen Enterprise */}
      <div className="flex-1 grid lg:grid-cols-12 w-full max-w-[1580px] mx-auto min-h-0">
        
        {/* LADO IZQUIERDO: Branding Corporativo de Alto Impacto */}
        <div className="lg:col-span-6 xl:col-span-7 p-8 lg:p-14 xl:p-20 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#061510] via-[#040d0a] to-[#030706] border-b lg:border-b-0 lg:border-r border-emerald-900/25">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

          {/* Top Header con Logotipo Oficial Grande */}
          <div className="relative z-10">
            <Link href="/" className="inline-block transition-transform duration-200 hover:scale-[1.02]">
              <LivoraFullLogo width={260} height={66} />
            </Link>
          </div>

          {/* Value Proposition Core */}
          <div className="relative z-10 my-10 lg:my-0 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Trazabilidad Circular · Stellar Web3
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Infraestructura de Reciclaje y Compensación{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Verificable.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-emerald-100/70 leading-relaxed font-light">
              Plataforma industrial para centros de acopio, empresas B2B y comercios. Registra entregas físicas, concilia saldos en el libro mayor y valida certificados ESG respaldados criptográficamente.
            </p>

            {/* Enterprise Feature Cards */}
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <div className="bg-[#081713]/80 border border-emerald-900/35 rounded-xl p-3.5 backdrop-blur-sm">
                <Cpu className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-xs font-semibold text-white">Smart Contracts</h4>
                <p className="text-[11px] text-emerald-200/60 mt-1 leading-snug">
                  Soroban RPC con liquidación irreversible on-chain.
                </p>
              </div>

              <div className="bg-[#081713]/80 border border-emerald-900/35 rounded-xl p-3.5 backdrop-blur-sm">
                <Database className="w-5 h-5 text-teal-400 mb-2" />
                <h4 className="text-xs font-semibold text-white">Doble Partida</h4>
                <p className="text-[11px] text-emerald-200/60 mt-1 leading-snug">
                  Transactional Outbox y conciliación financiera auditada.
                </p>
              </div>

              <div className="bg-[#081713]/80 border border-emerald-900/35 rounded-xl p-3.5 backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-cyan-400 mb-2" />
                <h4 className="text-xs font-semibold text-white">Certificación ESG</h4>
                <p className="text-[11px] text-emerald-200/60 mt-1 leading-snug">
                  Hash inmutable en IPFS con validez de cumplimiento.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-emerald-300/60 font-mono border-t border-emerald-900/20">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Red Stellar Soroban Testnet · Activa
            </span>
            <span>Alta Disponibilidad 99.9%</span>
          </div>
        </div>

        {/* LADO DERECHO: Tarjeta de Autenticación */}
        <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-10 lg:p-12 xl:p-16 flex items-center justify-center relative">
          <div className="w-full max-w-md bg-[#091512]/95 border border-emerald-500/20 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-md">
            
            {/* Segmented Control Tabs [ Iniciar Sesión | Registrarse ] */}
            <div className="grid grid-cols-2 p-1 bg-[#050e0b] border border-emerald-950 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isRegister
                    ? "bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 text-emerald-300 shadow-sm"
                    : "text-emerald-100/50 hover:text-emerald-200"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>

              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  isRegister
                    ? "bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 text-emerald-300 shadow-sm"
                    : "text-emerald-100/50 hover:text-emerald-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Registrarse
              </button>
            </div>

            {/* Encabezado del Formulario */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isRegister ? "Crear cuenta corporativa" : "Bienvenido a Livora"}
              </h2>
              <p className="text-xs text-emerald-200/60 mt-1">
                {isRegister
                  ? "Selecciona tu perfil industrial y regístrate en la red."
                  : "Ingresa tus credenciales para acceder a tu panel de control."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Correo Electrónico */}
              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@livora.pe"
                    className="w-full bg-[#050e0b] border border-emerald-900/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl text-sm py-2.5 pl-10 pr-4 transition-all duration-150 outline-none placeholder:text-emerald-300/25"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-emerald-200/80">
                    Contraseña
                  </label>
                  {!isRegister && (
                    <Link
                      href="/recuperar-contrasena"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050e0b] border border-emerald-900/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl text-sm py-2.5 pl-10 pr-10 transition-all duration-150 outline-none placeholder:text-emerald-300/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/60 hover:text-emerald-300 transition-colors p-1"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Controles Exclusivos de Registro */}
              {isRegister && (
                <div className="space-y-4 pt-1">
                  {/* Selector de Rol Profesional */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-200/80 mb-2">
                      Tipo de Organización en Livora
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("CENTRO_ACOPIO")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedRole === "CENTRO_ACOPIO"
                            ? "bg-emerald-500/15 border-emerald-400 text-white"
                            : "bg-[#050e0b] border-emerald-950 text-emerald-200/50 hover:border-emerald-900"
                        }`}
                      >
                        <Warehouse className="w-4 h-4 text-emerald-400 mb-1" />
                        <div className="text-xs font-semibold">Acopio</div>
                        <div className="text-[10px] text-emerald-200/50">Báscula</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole("EMPRESA_B2B")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedRole === "EMPRESA_B2B"
                            ? "bg-emerald-500/15 border-emerald-400 text-white"
                            : "bg-[#050e0b] border-emerald-950 text-emerald-200/50 hover:border-emerald-900"
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-teal-400 mb-1" />
                        <div className="text-xs font-semibold">Empresa</div>
                        <div className="text-[10px] text-emerald-200/50">Compras</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole("TIENDA")}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedRole === "TIENDA"
                            ? "bg-emerald-500/15 border-emerald-400 text-white"
                            : "bg-[#050e0b] border-emerald-950 text-emerald-200/50 hover:border-emerald-900"
                        }`}
                      >
                        <Store className="w-4 h-4 text-cyan-400 mb-1" />
                        <div className="text-xs font-semibold">Comercio</div>
                        <div className="text-[10px] text-emerald-200/50">Canjes POS</div>
                      </button>
                    </div>
                  </div>

                  {/* Checklist Reactivo de Contraseña */}
                  <div className="p-3 bg-[#050e0b] border border-emerald-950 rounded-xl space-y-1.5 text-[11px]">
                    <div className="font-medium text-emerald-300/80 mb-1">Requisitos de seguridad:</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-emerald-100/60">
                      <span className={`flex items-center gap-1.5 ${hasMinLen ? "text-emerald-400" : ""}`}>
                        {hasMinLen ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-400/60" />}
                        Mínimo 8 caracteres
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400" : ""}`}>
                        {hasUpper ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-400/60" />}
                        Una mayúscula
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : ""}`}>
                        {hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-400/60" />}
                        Un número
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-400" : ""}`}>
                        {hasSpecial ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-400/60" />}
                        Un carácter especial
                      </span>
                    </div>
                  </div>

                  {/* Checkboxes de Consentimiento Legal (Ley 29733 ANPD) */}
                  <div className="space-y-2 pt-1 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer text-emerald-100/70">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-emerald-900/60 bg-[#050e0b] text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span>
                        Acepto los{" "}
                        <Link href="/terminos" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
                          Términos y Condiciones
                        </Link>{" "}
                        y la{" "}
                        <Link href="/privacidad" target="_blank" className="text-emerald-400 underline hover:text-emerald-300">
                          Política de Privacidad
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={marketingAccepted}
                        onChange={(e) => setMarketingAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-emerald-900/60 bg-[#050e0b] text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span>Deseo recibir actualizaciones comerciales y comunicados sobre el token.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Botón Principal de Acción */}
              <button
                type="submit"
                disabled={loading || (isRegister && (!isPasswordValid || !acceptedTerms))}
                className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : isRegister ? (
                  <>
                    <span>Registrar e Ingresar</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Ingresar a la Plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Alternador inferior */}
            <div className="mt-6 pt-5 border-t border-emerald-900/20 text-center text-xs text-emerald-200/60">
              {isRegister ? (
                <p>
                  ¿Ya tienes una cuenta registrada?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-emerald-400 font-semibold hover:text-emerald-300 ml-1 transition-colors"
                  >
                    Inicia sesión
                  </button>
                </p>
              ) : (
                <p>
                  ¿No tienes una cuenta aún?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-emerald-400 font-semibold hover:text-emerald-300 ml-1 transition-colors"
                  >
                    Regístrate aquí
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER COMPACTO DE UNA SOLA LÍNEA (Sin Desbordar) */}
      <footer className="w-full border-t border-emerald-950/60 bg-[#020504] py-3.5 px-6">
        <div className="max-w-[1580px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300/60 font-light">
          <div>
            © {new Date().getFullYear()} Livora S.A.C. · RUC 20608912345 · Todos los derechos reservados.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-normal">
            <Link href="/terminos" target="_blank" className="hover:text-emerald-300 transition-colors">
              Términos
            </Link>
            <span className="text-emerald-900">·</span>
            <Link href="/privacidad" target="_blank" className="hover:text-emerald-300 transition-colors">
              Privacidad
            </Link>
            <span className="text-emerald-900">·</span>
            <Link href="/cookies" target="_blank" className="hover:text-emerald-300 transition-colors">
              Cookies
            </Link>
            <span className="text-emerald-900">·</span>
            <Link
              href="/libro-de-reclamaciones"
              target="_blank"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              Libro de Reclamaciones
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
