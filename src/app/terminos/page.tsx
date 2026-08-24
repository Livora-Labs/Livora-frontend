"use client";

import React from "react";
import Link from "next/link";
import { Footer, IndecopiBookLogo } from "@/components/Footer";

export default function TerminosPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #07110f)", color: "var(--text, #f2f7f5)", padding: "48px 20px 80px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "var(--muted, #8fa49d)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ color: "var(--green, #55e6a5)", textDecoration: "none" }}>
              ← Volver al inicio
            </Link>
            <span>/</span>
            <span>Términos y Condiciones de Uso</span>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              background: "#081310",
              border: "1px solid var(--green, #55e6a5)",
              color: "var(--green, #55e6a5)",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            🖨️ Imprimir / Descargar T&C
          </button>
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
              Marco Contractual y Regulatorio
            </span>
            <h1 style={{ fontSize: 32, margin: "8px 0 10px", color: "#f2f7f5", letterSpacing: -0.8 }}>
              Términos y Condiciones de Uso
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted, #8fa49d)" }}>
              Última actualización: 24 de agosto de 2026 | Versión: 2.0.0 (Stellar & Soroban Network)
            </p>
          </div>

          {/* Section 1: Identificación y Aceptación */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              1. Identificación del Titular y Aceptación de los Términos
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              El presente contrato regula el acceso y uso de la plataforma digital, aplicación web y aplicaciones móviles de <strong>Livora</strong> (en adelante, la &ldquo;Plataforma&rdquo;), operada por <strong>Livora S.A.C.</strong>, con RUC N° 20608912345, con domicilio legal en la ciudad de Lima, República del Perú.
            </p>
            <p style={{ margin: 0 }}>
              Al registrarse, iniciar sesión o interactuar con la Plataforma, el usuario declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones, así como la Política de Privacidad de Livora. Si no está de acuerdo con estos términos, deberá abstenerse de utilizar la Plataforma.
            </p>
          </section>

          {/* Section 2: Roles en la Plataforma */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              2. Roles y Participantes en el Ecosistema
            </h2>
            <ul style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 10 }}>
              <li>
                <strong style={{ color: "#f2f7f5" }}>Generadores / Hogares Ciudadanos:</strong> Usuarios que clasifican, registran y entregan material reciclable valorizable (plástico PET, cartón, metales, etc.), recibiendo tokens de recompensa (EcoTokens) tras la validación física en los centros de acopio autorizados.
              </li>
              <li>
                <strong style={{ color: "#f2f7f5" }}>Recolectores Urbanos:</strong> Operadores logísticos independientes que recogen el material reciclable en las rutas domiciliarias asignadas y lo transportan hacia los centros de acopio.
              </li>
              <li>
                <strong style={{ color: "#f2f7f5" }}>Centros de Acopio Autorizados:</strong> Instalaciones industriales que reciben, pesan, clasifican, consolidan y emiten lotes de material reciclado, liquidando recompensas a recolectores y ciudadanos.
              </li>
              <li>
                <strong style={{ color: "#f2f7f5" }}>Tiendas Aliadas / Comercios Asociados:</strong> Establecimientos comerciales que aceptan EcoTokens como medio de canje por productos, descuentos o servicios ecológicos.
              </li>
              <li>
                <strong style={{ color: "#f2f7f5" }}>Empresas B2B / Transformadores:</strong> Empresas compradoras de lotes consolidados y certificaciones de impacto ESG.
              </li>
            </ul>
          </section>

          {/* Section 3: Monedero Web3 y Custodia Delegada en Stellar */}
          <section style={{ marginBottom: 28, background: "#081613", padding: "20px 22px", borderRadius: 14, border: "1px solid #1c3d30" }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              3. Monedero Web3 y Custodia de Claves Privadas (Stellar / Soroban)
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>3.1 Declaración de Custodia:</strong> La Plataforma implementa una infraestructura de billeteras digitales custodiales desplegadas sobre la red pública descentralizada <strong>Stellar Blockchain</strong> e interactúa mediante contratos inteligentes (Smart Contracts) en <strong>Soroban</strong>. El backend de Livora genera y custodia las claves criptográficas privadas de forma segura, cifradas con el estándar militar AES-256.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>3.2 Mandato de Delegación de Firma:</strong> El usuario otorga a Livora S.A.C. un mandato de delegación irrevocable para firmar transacciones on-chain en la blockchain Stellar en su nombre y representación, ejecutadas exclusivamente tras la confirmación e instrucción expresa del usuario en la interfaz gráfica (mediante la pantalla de confirmación Web3 correspondiente).
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "#f2f7f5" }}>3.3 Límite de Responsabilidad de Acceso:</strong> El usuario es el único responsable de la confidencialidad de su contraseña, correo electrónico y dispositivos autorizados. Livora S.A.C. queda exenta de responsabilidad ante cualquier débito no autorizado o pérdida originada por negligencia del usuario en la custodia de sus credenciales.
            </p>
          </section>

          {/* Section 4: Transacciones Blockchain e Inmutabilidad */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              4. Transacciones Blockchain, Irreversibilidad y Naturaleza de los Tokens
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>4.1 Irreversibilidad Absoluta:</strong> Debido a la arquitectura inmutable y descentralizada de la red Stellar, una vez que una transacción de canje o transferencia de EcoTokens es firmada y confirmada en el libro mayor distribuido (ledger), <strong>la operación no puede ser cancelada, revertida ni modificada</strong> bajo ninguna circunstancia.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>4.2 Naturaleza de los EcoTokens (ECO):</strong> Los EcoTokens son unidades de incentivo y recompensa digital otorgadas por actividades de reciclaje valorizable. <strong>No constituyen moneda de curso legal (fiat), valores mobiliarios, instrumentos financieros ni activos de inversión</strong>. Los EcoTokens no son reembolsables por dinero fiat ante Livora ni son transferibles en mercados financieros no autorizados.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "#f2f7f5" }}>4.3 Riesgo Tecnológico:</strong> El usuario asume el riesgo inherente a la tecnología blockchain, incluyendo fluctuaciones de conectividad, mantenimiento de nodos de red Stellar, congestión de validadores y eventuales retrasos técnicos ajenos al control directo de Livora.
            </p>
          </section>

          {/* Section 5: E-commerce y Tiendas Asociadas */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              5. Marketplace, Tiendas Asociadas y Garantías (Indecopi)
            </h2>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>5.1 Rol de Intermediador Tecnológico:</strong> Livora actúa exclusivamente como operador de la plataforma tecnológica que facilita el canje de tokens por productos y beneficios en tiendas asociadas.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>5.2 Responsabilidad Directa del Proveedor:</strong> Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571), la tienda asociada o comercio aliado es el <strong>único y directo responsable</strong> de la idoneidad, calidad, disponibilidad física, entrega y garantía legal de los productos o servicios canjeados.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>5.3 Políticas de Despacho y Tiempos de Entrega Estimados:</strong> La entrega física de los bienes o servicios canjeados se coordinará directamente en el establecimiento de la Tienda Aliada (recojo presencial inmediato) o bajo las condiciones de despacho a domicilio informadas por el comercio. El tiempo estimado de entrega a domicilio no superará los cinco (5) días hábiles desde la confirmación de la transacción, salvo indicación expresa de la tienda en el momento del canje.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: "#f2f7f5" }}>5.4 Mecanismos de Garantías Aplicables:</strong> Todos los productos y servicios canjeados a través de la Plataforma cuentan con la garantía legal mínima establecida por la normativa peruana. Ante cualquier disconformidad con el bien o servicio, el usuario podrá ejercer la garantía directamente frente al comercio proveedor.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: "#f2f7f5" }}>5.5 Derecho de Arrepentimiento (Retracto Legal):</strong> De conformidad con la regulación peruana de protección al consumidor, el usuario tiene derecho legal de arrepentirse de la transacción dentro de un plazo de siete (7) días calendario posteriores a la recepción del bien, siempre que se trate de bienes no perecibles, no presenten signos de uso y sean devueltos en su empaque original sellado. El retracto se tramitará ante la Tienda Aliada y, tras confirmarse la devolución exitosa sin penalidades, Livora procederá a la devolución de los EcoTokens correspondientes en el monedero del usuario de forma irreversible.
            </p>
          </section>

          {/* Section 6: Libro de Reclamaciones y Legislación Aplicable */}
          <section style={{ marginBottom: 28, background: "#0c1a16", padding: "20px 22px", borderRadius: 14, border: "1px solid #204537" }}>
            <h2 style={{ fontSize: 18, color: "var(--green, #55e6a5)", marginBottom: 12 }}>
              6. Libro de Reclamaciones y Solución de Controversias
            </h2>
            <p style={{ margin: "0 0 14px" }}>
              En estricto cumplimiento de la Ley N° 29571 y la Ley N° 32495, Livora cuenta con un <strong>Libro de Reclamaciones Virtual</strong> a disposición de todos los consumidores y usuarios, accesible de manera permanente a través del enlace visible en el pie de página de la Plataforma o en:
            </p>
            <div style={{ marginBottom: 16 }}>
              <Link
                href="/libro-de-reclamaciones"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  background: "#081310",
                  border: "1px solid #55e6a5",
                  borderRadius: 10,
                  color: "#55e6a5",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                📖 Ir al Libro de Reclamaciones Virtual
              </Link>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#8fa49d" }}>
              El plazo legal máximo para la atención de reclamaciones es de <strong>quince (15) días hábiles improrrogables</strong>. Para controversias no resueltas por las vías directas, las partes se someten a la legislación de la República del Perú y a la jurisdicción de los jueces y tribunales del Distrito Judicial de Lima.
            </p>
          </section>

          {/* Footer inside card */}
          <div style={{ borderTop: "1px solid #1c352b", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#8fa49d" }}>
            Livora S.A.C. — RUC: 20608912345 — Lima, Perú &copy; 2026. Todos los derechos reservados.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 60 }}>
        <Footer />
      </div>
    </main>
  );
}
