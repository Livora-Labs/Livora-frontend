import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function PrivacidadPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "48px 20px 80px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--green)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
          <span>/</span>
          <span>Política de Privacidad y Protección de Datos</span>
        </div>

        <div
          className="card"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "40px 36px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            lineHeight: 1.7,
            fontSize: 14,
            color: "var(--text)",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 20, marginBottom: 28 }}>
            <span className="eyebrow" style={{ color: "var(--green)" }}>
              Ley N° 29733 y D.S. 003-2013-JUS (ANPD Perú)
            </span>
            <h1 style={{ fontSize: 32, margin: "8px 0 10px", color: "var(--text)", letterSpacing: -0.8, fontWeight: 800 }}>
              Política de Privacidad y Tratamiento de Datos Personales
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Última actualización: 24 de agosto de 2026 | Versión: 2.0.0 (Cumplimiento ANPD & Stellar Web3)
            </p>
          </div>

          {/* Section 1: Titular del Banco de Datos */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green)", marginBottom: 12 }}>
              1. Titular del Banco de Datos Personales
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              En cumplimiento de la <strong>Ley N° 29733 (Ley de Protección de Datos Personales del Perú)</strong> y su Reglamento aprobado mediante <strong>Decreto Supremo N° 003-2013-JUS</strong>, se informa que los datos personales recopilados a través de la plataforma web y aplicaciones móviles de Livora serán incorporados y tratados en el banco de datos personales denominado:
            </p>
            <div style={{ background: "var(--panel2)", padding: "16px 20px", borderRadius: 12, border: "1px solid var(--line)", margin: "14px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Nombre del Banco de Datos:</strong>
                  &ldquo;Usuarios de la Plataforma&rdquo;
                </div>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Titular:</strong>
                  Livora S.A.C. (RUC 20608912345)
                </div>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Registro ANPD:</strong>
                  Registro Nacional de Protección de Datos Personales
                </div>
                <div>
                  <strong style={{ color: "var(--text)", display: "block" }}>Domicilio:</strong>
                  Lima, República del Perú
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Datos Personales Recopilados */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green)", marginBottom: 12 }}>
              2. Datos Personales que Recopilamos
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              Para la prestación integral de los servicios de trazabilidad de reciclaje y recompensas Web3, recopilamos las siguientes categorías de datos:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 10 }}>
              <li>
                <strong style={{ color: "var(--text)" }}>Datos de Identificación y Contacto:</strong> Correo electrónico, nombres y apellidos, documento de identidad (DNI, CE, etc.), número de teléfono/celular y dirección domiciliaria (en solicitudes de recojo o reclamos).
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Datos de Geolocalización (GPS):</strong> Ubicación geográfica precisa del dispositivo móvil para coordinar rutas de recolección domiciliaria en tiempo real y localizar centros de acopio y comercios aliados cercanos.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Datos de Trazabilidad y Blockchain:</strong> Historial de pesajes de residuos valorizables, transacciones de transferencia y canje de LIVOs, y dirección pública de billetera en la red Stellar.
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Datos de Auditoría Digital y Navegación:</strong> Dirección IP, tipo de navegador (User-Agent), registros de fecha/hora de aceptación de términos y versiones de consentimiento para auditoría legal.
              </li>
            </ul>
          </section>

          {/* Section 3: Finalidad del Tratamiento */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green)", marginBottom: 12 }}>
              3. Finalidades del Tratamiento de Datos
            </h2>
            <p style={{ margin: "0 0 10px" }}>
              <strong style={{ color: "var(--text)" }}>3.1 Finalidades Necesarias para la Ejecución del Servicio:</strong>
            </p>
            <ul style={{ paddingLeft: 20, margin: "0 0 16px", display: "grid", gap: 8 }}>
              <li>Autenticación de usuarios y validación de seguridad mediante códigos de verificación de un solo uso (OTP vía correo electrónico).</li>
              <li>Gestión y trazabilidad logística de recojo, pesaje, consolidación y certificación de materiales reciclables.</li>
              <li>Generación, custodia y firma delegada de transacciones on-chain de LIVOs en la red Stellar.</li>
              <li>Gestión del Libro de Reclamaciones Virtual y atención de quejas y reclamos conforme a la Ley N° 29571.</li>
            </ul>
            <p style={{ margin: "0 0 10px" }}>
              <strong style={{ color: "var(--text)" }}>3.2 Finalidades Adicionales (Opcionales):</strong>
            </p>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Envío de boletines informativos, promociones comerciales de tiendas aliadas y beneficios de sostenibilidad. Estas comunicaciones son estrictamente opcionales y están sujetas a la autorización previa e independiente del usuario durante el registro, pudiendo ser revocadas en cualquier momento.
            </p>
          </section>

          {/* Section 4: Derechos ARCO */}
          <section style={{ marginBottom: 28, background: "var(--panel2)", padding: "20px 22px", borderRadius: 14, border: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 18, color: "var(--green)", marginBottom: 12 }}>
              4. Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              Como titular de sus datos personales, usted tiene el derecho legal de ejercer en cualquier momento sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>, previstos en la Ley N° 29733.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "var(--text)" }}>Canal de Atención Oficial:</strong> Puede remitir su solicitud formal al correo electrónico:
            </p>
            <div style={{ marginBottom: 16 }}>
              <a
                href="mailto:privacidad@livora.pe"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  background: "var(--panel)",
                  border: "1px solid var(--green)",
                  borderRadius: 10,
                  color: "var(--green)",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: 13,
                }}
              >
                <Mail size={16} />
                privacidad@livora.pe
              </a>
            </div>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "var(--text)" }}>Plazos Legales de Respuesta (D.S. 003-2013-JUS):</strong>
            </p>
            <ul style={{ paddingLeft: 20, margin: "0 0 14px", display: "grid", gap: 6 }}>
              <li><strong>Derecho de Acceso:</strong> Plazo máximo de diez (10) días hábiles contados desde el día siguiente de presentada la solicitud.</li>
              <li><strong>Derechos de Rectificación, Cancelación u Oposición:</strong> Plazo máximo de cinco (5) días hábiles.</li>
            </ul>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              La solicitud debe contener: Nombres y apellidos, copia del DNI/CE, descripción clara del derecho que desea ejercer y documentos sustentatorios pertinentes.
            </p>
          </section>

          {/* Section 5: Seguridad de la Información */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green)", marginBottom: 12 }}>
              5. Seguridad y Custodia de la Información
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              Livora adopta medidas de seguridad técnicas, legales y organizativas de nivel industrial para proteger sus datos personales contra acceso no autorizado, pérdida o alteración:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 8 }}>
              <li>Cifrado simétrico de alta seguridad <strong>AES-256-GCM</strong> para las claves privadas de las billeteras custodiales en el backend.</li>
              <li>Comunicaciones cifradas de extremo a extremo mediante protocolos <strong>TLS / HTTPS</strong>.</li>
              <li>Procedimiento de eliminación segura y anonimización irreversible de cuentas personales al tramitar una cancelación.</li>
            </ul>
          </section>

          {/* Section 6: Cookies */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green)", marginBottom: 12 }}>
              6. Cookies y Tecnologías de Seguimiento
            </h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Utilizamos cookies técnicas necesarias para el funcionamiento del sistema y cookies analíticas/marketing que requieren su consentimiento previo. Puede gestionar o modificar sus preferencias en cualquier momento a través del banner de configuración de cookies o haciendo clic en el enlace &ldquo;Configuración de Cookies&rdquo; ubicado en el pie de página.
            </p>
          </section>

          {/* Footer inside card */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            Livora S.A.C. — Banco de Datos &ldquo;Usuarios de la Plataforma&rdquo; &copy; 2026. Todos los derechos reservados.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 60 }}>
        <Footer />
      </div>
    </main>
  );
}
