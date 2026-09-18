"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export interface CookieConsentSettings {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
  version: string;
}

const STORAGE_KEY = "livora_cookie_consent";
const CURRENT_VERSION = "1.0.0";

export function getStoredCookieConsent(): CookieConsentSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentSettings;
  } catch {
    return null;
  }
}

export function saveCookieConsent(settings: Omit<CookieConsentSettings, "essential" | "consentedAt" | "version">): CookieConsentSettings {
  const fullSettings: CookieConsentSettings = {
    essential: true,
    analytics: Boolean(settings.analytics),
    marketing: Boolean(settings.marketing),
    consentedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullSettings));
    window.dispatchEvent(new CustomEvent("livora:cookie-consent-updated", { detail: fullSettings }));
    
    // Apply script gating
    if (fullSettings.analytics) {
      (window as any).__livora_analytics_enabled = true;
    } else {
      (window as any).__livora_analytics_enabled = false;
    }
  }
  return fullSettings;
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    const saved = getStoredCookieConsent();
    if (!saved) {
      setIsVisible(true);
    } else {
      setAnalyticsAllowed(saved.analytics);
      setMarketingAllowed(saved.marketing);
      if (saved.analytics) {
        (window as any).__livora_analytics_enabled = true;
      }
    }

    const handleOpenSettings = () => {
      const current = getStoredCookieConsent();
      if (current) {
        setAnalyticsAllowed(current.analytics);
        setMarketingAllowed(current.marketing);
      }
      setIsModalOpen(true);
    };

    window.addEventListener("livora:open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("livora:open-cookie-settings", handleOpenSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true, marketing: true });
    setAnalyticsAllowed(true);
    setMarketingAllowed(true);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleRejectNonEssential = () => {
    saveCookieConsent({ analytics: false, marketing: false });
    setAnalyticsAllowed(false);
    setMarketingAllowed(false);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent({ analytics: analyticsAllowed, marketing: marketingAllowed });
    setIsVisible(false);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Banner */}
      {isVisible && !isModalOpen && (
        <aside
          aria-label="Consentimiento de cookies"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "linear-gradient(180deg, rgba(9, 20, 17, 0.96) 0%, rgba(6, 14, 12, 0.98) 100%)",
            borderTop: "1px solid #204537",
            boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(14px)",
            padding: "20px 24px",
            color: "#f2f7f5",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ flex: "1 1 500px", minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#55e6a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <strong style={{ fontSize: 15, color: "#55e6a5" }}>
                  Aviso de Cookies y Privacidad — Livora
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#8fa49d" }}>
                Utilizamos cookies propias y de terceros técnicas y analíticas para garantizar el funcionamiento seguro de la plataforma, gestionar sesiones Web3 en Stellar y mejorar la experiencia de reciclaje bajo la Ley N° 29733 de Protección de Datos Personales del Perú. Puede aceptar todas, rechazar las no esenciales o personalizar sus preferencias. Lea nuestra{" "}
                <Link href="/privacidad" style={{ color: "#55e6a5", textDecoration: "underline" }}>
                  Política de Privacidad
                </Link>{" "}
                y nuestra{" "}
                <Link href="/cookies" style={{ color: "#55e6a5", textDecoration: "underline" }}>
                  Política de Cookies
                </Link>
                .
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: "#14241f",
                  border: "1px solid #284c3e",
                  color: "#d8e4df",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Configurar cookies
              </button>

              <button
                type="button"
                onClick={handleRejectNonEssential}
                style={{
                  background: "#1c2c26",
                  border: "1px solid #37574b",
                  color: "#ffcd70",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Rechazar no esenciales
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  background: "#55e6a5",
                  border: "1px solid #55e6a5",
                  color: "#06110d",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(85, 230, 165, 0.25)",
                }}
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Configuration Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(3, 8, 7, 0.8)",
            backdropFilter: "blur(10px)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#0d1b17",
              border: "1px solid #244b3c",
              borderRadius: 16,
              maxWidth: 640,
              width: "100%",
              padding: "28px 24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
              color: "#f2f7f5",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 id="cookie-modal-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#55e6a5" }}>
                Centro de Preferencias de Cookies
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8fa49d",
                  fontSize: 22,
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                }}
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#8fa49d", marginBottom: 20 }}>
              En Livora respetamos su derecho a la privacidad según la Ley N° 29733. Puede configurar qué categorías de cookies y tecnologías de seguimiento consiente almacenar en su navegador.
            </p>

            <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
              {/* Essential Cookies */}
              <div
                style={{
                  background: "#081310",
                  border: "1px solid #1c382d",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "#f2f7f5" }}>Cookies Técnicas y Esenciales</strong>
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#55e6a5",
                        background: "#12392b",
                        padding: "3px 8px",
                        borderRadius: 12,
                        textTransform: "uppercase",
                      }}
                    >
                      Siempre Activas
                    </span>
                  </div>
                  <input type="checkbox" checked disabled style={{ width: 18, height: 18, accentColor: "#55e6a5" }} />
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#8fa49d" }}>
                  Necesarias para la autenticación segura, mantenimiento de sesión JWT, validaciones Web3 y prevención de fraudes. No pueden desactivarse.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div
                style={{
                  background: "#081310",
                  border: "1px solid #1c382d",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "#f2f7f5" }}>Cookies Analíticas y de Rendimiento</strong>
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 10,
                        color: analyticsAllowed ? "#55e6a5" : "#8fa49d",
                      }}
                    >
                      {analyticsAllowed ? "Habilitadas" : "Deshabilitadas"}
                    </span>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "#55e6a5" }}
                    />
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#8fa49d" }}>
                  Nos permiten cuantificar el volumen de reciclaje, velocidad de respuesta y monitoreo técnico para optimizar la plataforma.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div
                style={{
                  background: "#081310",
                  border: "1px solid #1c382d",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "#f2f7f5" }}>Cookies de Publicidad y Tiendas Aliadas</strong>
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 10,
                        color: marketingAllowed ? "#55e6a5" : "#8fa49d",
                      }}
                    >
                      {marketingAllowed ? "Habilitadas" : "Deshabilitadas"}
                    </span>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={marketingAllowed}
                      onChange={(e) => setMarketingAllowed(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "#55e6a5" }}
                    />
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#8fa49d" }}>
                  Permiten personalizar promociones, beneficios ecológicos y catálogo de canjes en comercios asociados de su localidad.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={handleRejectNonEssential}
                style={{
                  background: "transparent",
                  border: "1px solid #284c3e",
                  color: "#8fa49d",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  background: "#142c23",
                  border: "1px solid #55e6a5",
                  color: "#55e6a5",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Guardar preferencias
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  background: "#55e6a5",
                  border: "1px solid #55e6a5",
                  color: "#06110d",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieBanner;
