"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shell, PageHead } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { api, updateProfile, changePassword } from "@/lib/api";
import { MapPin, KeyRound, Copy, ExternalLink, ShieldAlert, Trash2, Sun, Moon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "@/context/ThemeContext";

export default function PerfilPage() {
  const router = useRouter();
  const { token, logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Data States
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Danger zone / Delete states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [resolvedRole, setResolvedRole] = useState<"admin" | "company" | "centro">("centro");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawRole = user?.role?.toUpperCase() || localStorage.getItem("livora_role")?.toUpperCase();
      if (rawRole === "ADMIN") {
        setResolvedRole("admin");
      } else if (rawRole === "EMPRESA_B2B") {
        setResolvedRole("company");
      } else if (rawRole === "CENTRO_ACOPIO") {
        setResolvedRole("centro");
      }
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/me");
      const data = res.data;
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setLat(data.latitude ?? null);
      setLng(data.longitude ?? null);
      setMarketingAccepted(data.marketingAccepted || false);
    } catch (err: any) {
      showToast("Error al cargar perfil", "error", err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocalización no soportada", "error", "Tu navegador no permite detectar la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        showToast("Coordenadas obtenidas", "success", `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        showToast("Error de ubicación", "error", "No se pudo obtener tu geolocalización.");
      }
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await updateProfile({
        name,
        phone,
        address: address || undefined,
        marketingAccepted,
      });
      showToast("Perfil actualizado", "success", "Tus datos personales fueron guardados con éxito.");
      loadProfile();
    } catch (err: any) {
      showToast("Error al actualizar", "error", err?.response?.data?.message || err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Error de validación", "error", "Las contraseñas no coinciden.");
      return;
    }

    // Complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/])[A-Za-z\d!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      showToast("Contraseña débil", "error", "Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await changePassword({ newPassword });
      showToast("Contraseña cambiada", "success", "Tu contraseña se ha cambiado correctamente.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast("Error al cambiar contraseña", "error", err?.response?.data?.message || err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCopyWallet = () => {
    if (profile?.walletAddress) {
      navigator.clipboard.writeText(profile.walletAddress);
      showToast("Copiado", "info", "Dirección de billetera copiada al portapapeles.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "ELIMINAR MI CUENTA") {
      showToast("Texto incorrecto", "error", "Debes escribir exactamente 'ELIMINAR MI CUENTA' para confirmar.");
      return;
    }

    setDeletingAccount(true);
    try {
      await api.delete("/users/me");
      showToast("Cuenta eliminada", "success", "Tu cuenta y datos personales han sido anonimizados de acuerdo a la Ley N.° 29733.");
      setTimeout(() => {
        logout();
        router.push("/");
      }, 2000);
    } catch (err: any) {
      showToast("Error al eliminar cuenta", "error", err?.response?.data?.message || err.message);
      setDeletingAccount(false);
    }
  };

  return (
    <Shell role={resolvedRole}>
      <ToastContainer />
      <PageHead
        eyebrow="Configuración de cuenta"
        title="Mi Perfil"
        description="Administra tus datos personales, preferencias de privacidad de acuerdo a la Ley N.° 29733, y seguridad."
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--muted)" }}>Cargando datos de perfil...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: 40 }}>
          {/* Columna Izquierda: Datos Personales e Impacto */}
          <div style={{ display: "grid", gap: 24 }}>
            {/* Datos Personales */}
            <section className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Datos Personales</h2>
              </div>
              <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Nombre Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, color: "var(--input-color)", fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Correo Electrónico</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      style={{ flex: 1, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, color: "var(--muted)", fontSize: 14, cursor: "not-allowed" }}
                    />
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", color: "#10B981", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      Verificado
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Teléfono / Celular</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +51 987654321"
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, color: "var(--input-color)", fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Dirección Fiscal / Operativa</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Número, Distrito, Ciudad"
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, color: "var(--input-color)", fontSize: 14 }}
                  />
                </div>

                <button type="submit" disabled={updatingProfile} className="btn primary" style={{ width: "100%", marginTop: 10, padding: 12 }}>
                  {updatingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
              </form>
            </section>

            {/* Billetera Stellar */}
            <section className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Billetera Digital Livora</h2>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                  Tu monedero custodial en Stellar. Las claves privadas están cifradas de forma segura. Autorizas a Livora a firmar transacciones con tu delegación de firma.
                </p>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Dirección Pública (Clave Pública)</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="text"
                      value={profile?.walletAddress || "No generada"}
                      readOnly
                      style={{ flex: 1, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 10, padding: 10, color: "var(--text)", fontFamily: "monospace", fontSize: 12 }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyWallet}
                      style={{ background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--text)", padding: 10, borderRadius: 10, cursor: "pointer" }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {profile?.walletAddress && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 16 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Código QR de tu Dirección Pública</span>
                      <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 10, background: theme === "dark" ? "#0e1a17" : "#ffffff", boxShadow: "var(--card-shadow)" }}>
                        <QRCodeSVG
                          value={profile.walletAddress}
                          size={130}
                          bgColor={theme === "dark" ? "#0e1a17" : "#ffffff"}
                          fgColor={theme === "dark" ? "#f2f7f5" : "#0f172a"}
                        />
                      </div>
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${profile.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--green)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontWeight: 600, width: "fit-content", margin: "10px auto 0" }}
                    >
                      <span>Ver en el explorador digital</span>
                      <ExternalLink size={14} />
                    </a>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Columna Derecha: Seguridad, Preferencias y Zona de Peligro */}
          <div style={{ display: "grid", gap: 24 }}>
            {/* Seguridad (Contraseña) */}
            <section className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Seguridad y Contraseña</h2>
              </div>
              <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos"
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, color: "var(--input-color)", fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña exactamente"
                    style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, color: "var(--input-color)", fontSize: 14 }}
                  />
                </div>

                <button type="submit" disabled={updatingPassword} className="btn secondary" style={{ width: "100%", padding: 12 }}>
                  {updatingPassword ? "Cambiando contraseña..." : "Actualizar Contraseña"}
                </button>
              </form>
            </section>

            {/* Preferencia de Interfaz y Tema */}
            <section className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                  {theme === "dark" ? <Moon size={20} style={{ color: "var(--green)" }} /> : <Sun size={20} style={{ color: "var(--amber)" }} />}
                  <span>Preferencia de Interfaz y Tema</span>
                </h2>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
                Personaliza la apariencia visual del portal. Puedes alternar entre Modo Oscuro y Modo Claro con alto contraste WCAG AA.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "14px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    border: theme === "dark" ? "2px solid var(--green)" : "1px solid var(--line)",
                    background: theme === "dark" ? "var(--panel2)" : "transparent",
                    color: theme === "dark" ? "var(--green)" : "var(--muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Moon size={18} />
                  <span>Modo Oscuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "14px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    border: theme === "light" ? "2px solid var(--green)" : "1px solid var(--line)",
                    background: theme === "light" ? "var(--panel2)" : "transparent",
                    color: theme === "light" ? "var(--green)" : "var(--muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Sun size={18} />
                  <span>Modo Claro</span>
                </button>
              </div>
            </section>

            {/* Preferencias y Consentimientos (Privacidad) */}
            <section className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Consentimientos y Privacidad</h2>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gap: 6, padding: 14, background: "var(--panel2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>Términos y Condiciones:</span>
                    <strong style={{ color: "var(--green)" }}>Aceptado v{profile?.termsVersion || "2.0.0"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>Política de Privacidad (Ley N.° 29733):</span>
                    <strong style={{ color: "var(--green)" }}>Aceptado v{profile?.privacyVersion || "2.0.0"}</strong>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={marketingAccepted}
                    onChange={(e) => setMarketingAccepted(e.target.checked)}
                    style={{ marginTop: 3, accentColor: "var(--green)" }}
                  />
                  <span style={{ lineHeight: 1.4, color: "var(--muted)" }}>
                    Autorizo el envío de publicidad y promociones sobre tiendas asociadas y beneficios comerciales de la plataforma de reciclaje (Opcional, regulado por la Ley N.° 29733).
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={updatingProfile}
                  className="btn"
                  style={{ width: "100%", padding: 10, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--green)" }}
                >
                  Guardar Preferencias de Privacidad
                </button>
              </div>
            </section>

            {/* Zona de Peligro */}
            <section className="card" style={{ padding: 24, border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.03)" }}>
              <div className="section-title" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#EF4444", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldAlert size={20} />
                  <span>Zona de Peligro</span>
                </h2>
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 16 }}>
                Eliminar tu cuenta implica la anonimización de tus datos y la desactivación irreversible de tu billetera Stellar. Conforme al derecho de cancelación ARCO (Ley N.° 29733).
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="btn danger"
                style={{
                  width: "100%",
                  padding: 12,
                  background: "#EF4444",
                  border: "none",
                  borderRadius: 10,
                  color: "#FFFFFF",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <Trash2 size={16} />
                <span>Eliminar mi cuenta definitivamente</span>
              </button>
            </section>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación ARCO */}
      {isDeleteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20
          }}
        >
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              boxShadow: "var(--card-shadow)",
              borderRadius: 20,
              padding: 24,
              maxWidth: 460,
              width: "100%"
            }}
          >
            <h3 style={{ color: "#EF4444", fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert />
              <span>Confirmar Eliminación ARCO</span>
            </h3>
            <p style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
              Esta acción es <strong>totalmente irreversible</strong>. Se destruirá la clave digital de tu monedero Stellar (pérdida permanente de EcoTokens) y se anonimizarán tus datos en la base de datos de Livora.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 14 }}>
              Para confirmar, escribe a continuación exactamente la frase: <br />
              <strong style={{ color: "var(--text)" }}>ELIMINAR MI CUENTA</strong>
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Escribe aquí para confirmar..."
              style={{
                width: "100%",
                background: "var(--input-bg)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 12,
                color: "var(--input-color)",
                fontSize: 14,
                marginBottom: 20,
                textAlign: "center"
              }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText("");
                }}
                className="btn"
                style={{ flex: 1, padding: 12, background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--line)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmationText !== "ELIMINAR MI CUENTA"}
                className="btn danger"
                style={{
                  flex: 1,
                  padding: 12,
                  background: deleteConfirmationText === "ELIMINAR MI CUENTA" ? "#EF4444" : "rgba(239, 68, 68, 0.4)",
                  color: "#FFFFFF",
                  cursor: deleteConfirmationText === "ELIMINAR MI CUENTA" ? "pointer" : "not-allowed"
                }}
              >
                {deletingAccount ? "Eliminando..." : "Eliminar Permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
