import React from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function CookiesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #07110f)", color: "var(--text, #f2f7f5)", padding: "48px 20px 80px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted, #8fa49d)" }}>
          <Link href="/" style={{ color: "var(--green, #55e6a5)", textDecoration: "none" }}>
            ← Volver al inicio
          </Link>
          <span>/</span>
          <span>Política de Cookies y Tecnologías de Seguimiento</span>
        </div>

        <div
          className="card"
          style={{
            background: "linear-gradient(145deg, #0e1c18, #091310)",
            border: "1px solid var(--line, #20332d)",
            borderRadius: 18,
            padding: "40px 36px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            lineHeight: 1.7,
            fontSize: 14,
            color: "#d8e4df",
          }}
        >
          <div style={{ borderBottom: "1px solid #1c352b", paddingBottom: 20, marginBottom: 28 }}>
            <span className="eyebrow" style={{ color: "var(--green, #55e6a5)" }}>
              Cumplimiento de la Ley N° 29733 - ANPD Perú
            </span>
            <h1 style={{ fontSize: 32, margin: "8px 0 10px", color: "#f2f7f5", letterSpacing: -0.8 }}>
              Política de Cookies y Tecnologías de Seguimiento
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #8fa49d)" }}>
              Última actualización: 24 de agosto de 2026 | Versión: 1.0.0 (Cumplimiento Regulatorio)
            </p>
          </div>

          {/* Section 1: Definición */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              1. ¿Qué son las Cookies y Almacenamiento Local?
            </h2>
            <p style={{ margin: 0 }}>
              Las cookies y tecnologías de almacenamiento local (como <code>localStorage</code> y <code>sessionStorage</code>) son pequeños archivos de datos o variables de estado que se almacenan en su navegador web cuando visita o interactúa con la Plataforma <strong>Livora</strong>. Estas tecnologías nos permiten recordar sus accesos, mantener la seguridad de sus transacciones, almacenar sus preferencias y optimizar el rendimiento técnico de nuestros servicios de reciclaje y recompensas de tokens ecológicos.
            </p>
          </section>

          {/* Section 2: Clasificación de Cookies */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              2. Clasificación y Tecnologías Utilizadas en Livora
            </h2>
            <p style={{ margin: "0 0 16px" }}>
              Clasificamos las tecnologías de almacenamiento y cookies que utilizamos en las siguientes categorías, de acuerdo con las directrices de la Autoridad Nacional de Protección de Datos Personales (ANPD):
            </p>

            <div style={{ display: "grid", gap: 18 }}>
              {/* Estrictamente Necesarias */}
              <div style={{ background: "#081613", padding: "20px", borderRadius: 12, border: "1px solid #1c3d30" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                  <strong style={{ color: "#f2f7f5", fontSize: 15 }}>A. Tecnologías Estrictamente Necesarias (Técnicas)</strong>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#55e6a5", background: "#12392b", padding: "2px 8px", borderRadius: 10, textTransform: "uppercase" }}>Siempre Activas</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8fa49d" }}>
                  Estas variables son obligatorias para posibilitar la navegación segura, mantener la autenticación del usuario y permitir la ejecución técnica de transacciones Web3 de EcoTokens. Si se bloquean, la Plataforma no podrá funcionar correctamente.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1c382d", color: "#c6d7d1" }}>
                        <th style={{ padding: "6px 8px" }}>Identificador / Clave</th>
                        <th style={{ padding: "6px 8px" }}>Proveedor</th>
                        <th style={{ padding: "6px 8px" }}>Propósito</th>
                        <th style={{ padding: "6px 8px" }}>Duración</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #0d221c" }}>
                        <td style={{ padding: "8px", fontFamily: "monospace" }}>livora_token</td>
                        <td style={{ padding: "8px" }}>Livora (Supabase Auth)</td>
                        <td style={{ padding: "8px" }}>Almacena el Token JWT de autenticación para mantener la sesión del usuario iniciada de forma segura.</td>
                        <td style={{ padding: "8px" }}>Local (Persistente hasta cierre de sesión)</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #0d221c" }}>
                        <td style={{ padding: "8px", fontFamily: "monospace" }}>livora_user</td>
                        <td style={{ padding: "8px" }}>Livora</td>
                        <td style={{ padding: "8px" }}>Almacena los datos básicos de perfil del usuario logueado (nombres, correo, rol) para renderizar la interfaz.</td>
                        <td style={{ padding: "8px" }}>Local (Persistente hasta cierre de sesión)</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #0d221c" }}>
                        <td style={{ padding: "8px", fontFamily: "monospace" }}>livora_role</td>
                        <td style={{ padding: "8px" }}>Livora</td>
                        <td style={{ padding: "8px" }}>Registra el rol operativo asignado (e.g. centro, empresa, admin) para habilitar las vistas específicas.</td>
                        <td style={{ padding: "8px" }}>Local (Persistente hasta cierre de sesión)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", fontFamily: "monospace" }}>livora_cookie_consent</td>
                        <td style={{ padding: "8px" }}>Livora</td>
                        <td style={{ padding: "8px" }}>Registra las preferencias del usuario sobre el uso de cookies analíticas y de marketing.</td>
                        <td style={{ padding: "8px" }}>Local (Persistente, re-evaluado tras cambios)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Estadísticas/Rendimiento */}
              <div style={{ background: "#081613", padding: "20px", borderRadius: 12, border: "1px solid #1c3d30" }}>
                <strong style={{ color: "#f2f7f5", fontSize: 15, display: "block", marginBottom: 8 }}>B. Cookies de Estadísticas y Rendimiento (Analíticas)</strong>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8fa49d" }}>
                  Nos permiten cuantificar las visitas, analizar el origen del tráfico, detectar fallas técnicas y medir el volumen total de reciclaje procesado con el fin de optimizar el rendimiento y la escalabilidad de la Plataforma.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1c382d", color: "#c6d7d1" }}>
                        <th style={{ padding: "6px 8px" }}>Identificador / Clave</th>
                        <th style={{ padding: "6px 8px" }}>Proveedor</th>
                        <th style={{ padding: "6px 8px" }}>Propósito</th>
                        <th style={{ padding: "6px 8px" }}>Duración</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px", fontFamily: "monospace" }}>Sentry SDK / DSN</td>
                        <td style={{ padding: "8px" }}>Sentry.io</td>
                        <td style={{ padding: "8px" }}>Reporte y rastreo en tiempo real de errores de software y excepciones críticas del frontend para garantizar la estabilidad.</td>
                        <td style={{ padding: "8px" }}>De sesión / Técnica (Exenta de consentimiento para fallos técnicos puros, pero configurable)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Marketing/Tiendas Aliadas */}
              <div style={{ background: "#081613", padding: "20px", borderRadius: 12, border: "1px solid #1c3d30" }}>
                <strong style={{ color: "#f2f7f5", fontSize: 15, display: "block", marginBottom: 8 }}>C. Cookies de Publicidad y Tiendas Aliadas (Marketing)</strong>
                <p style={{ margin: 0, fontSize: 13, color: "#8fa49d" }}>
                  Estas tecnologías permiten personalizar promociones, beneficios ecológicos exclusivos, catálogos de canjes en su localidad y ofertas patrocinadas por las tiendas asociadas y comercios de reciclaje de nuestro ecosistema. Requieren el consentimiento expreso del usuario antes de activarse.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Gestión y Consentimiento */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              3. ¿Cómo Administrar o Revocar su Consentimiento?
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              Usted tiene el control total sobre las cookies no esenciales. En cumplimiento de la regulación peruana de protección de datos, Livora le permite:
            </p>
            <ul style={{ paddingLeft: 20, margin: "0 0 14px", display: "grid", gap: 8 }}>
              <li>
                <strong>Centro de Preferencias:</strong> Modificar sus preferencias de cookies analíticas y de marketing en cualquier momento abriendo el Centro de Configuración disponible en el enlace directo en el pie de página de la Plataforma.
              </li>
              <li>
                <strong>Configuración del Navegador:</strong> Desactivar, restringir o borrar las cookies del navegador desde el panel de configuración de su software de navegación (e.g. Google Chrome, Mozilla Firefox, Safari, Microsoft Edge). Tenga en cuenta que si desactiva el almacenamiento local de variables esenciales, no podrá iniciar sesión ni firmar operaciones Web3 en Livora.
              </li>
            </ul>
          </section>

          {/* Section 4: Transferencia de Datos */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              4. Transferencia de Datos y Terceros
            </h2>
            <p style={{ margin: 0 }}>
              Livora no vende ni transfiere a terceros ajenos al servicio la información contenida en las cookies o en el almacenamiento local. Las cookies técnicas son utilizadas estrictamente bajo el control de Livora S.A.C. como titular de la plataforma y del banco de datos personales registrado ante la ANPD.
            </p>
          </section>

          {/* Footer inside card */}
          <div style={{ borderTop: "1px solid #1c352b", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#8fa49d" }}>
            Livora S.A.C. — Cumplimiento Normativo ANPD & Indecopi &copy; 2026. Todos los derechos reservados.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 60 }}>
        <Footer />
      </div>
    </main>
  );
}
