"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { LivoraLogo } from "@/components/LivoraLogo";

export function IndecopiBookLogo({ className = "", width = 140, height = 90 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Libro de Reclamaciones - Indecopi Perú"
    >
      {/* Background Badge Container */}
      <rect x="2" y="2" width="156" height="96" rx="8" fill="#0c1915" stroke="#25483b" strokeWidth="2" />
      
      {/* Peruvian Flag Ribbon Top Banner */}
      <path d="M 12 12 L 148 12 L 148 20 L 12 20 Z" fill="#D91023" />
      <path d="M 57 12 L 103 12 L 103 20 L 57 20 Z" fill="#FFFFFF" />
      
      {/* Book Icon Graphic */}
      <g transform="translate(18, 28)">
        {/* Left Page */}
        <path
          d="M 2 8 C 12 4, 22 4, 30 7 L 30 42 C 22 39, 12 39, 2 43 Z"
          fill="#1b362c"
          stroke="#55e6a5"
          strokeWidth="1.5"
        />
        {/* Right Page */}
        <path
          d="M 30 7 C 38 4, 48 4, 58 8 L 58 43 C 48 39, 38 39, 30 42 Z"
          fill="#132720"
          stroke="#55e6a5"
          strokeWidth="1.5"
        />
        {/* Book Spine Center */}
        <line x1="30" y1="6" x2="30" y2="43" stroke="#55e6a5" strokeWidth="2" />
        {/* Text Lines on pages */}
        <line x1="8" y1="16" x2="24" y2="15" stroke="#8fa49d" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="22" x2="24" y2="21" stroke="#8fa49d" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="20" y2="27" stroke="#8fa49d" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="36" y1="15" x2="52" y2="16" stroke="#8fa49d" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="36" y1="21" x2="52" y2="22" stroke="#8fa49d" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="36" y1="27" x2="48" y2="28" stroke="#8fa49d" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      
      {/* Title Text */}
      <text x="82" y="38" fill="#F2F7F5" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.3">
        LIBRO DE
      </text>
      <text x="82" y="50" fill="#55E6A5" fontSize="8.5" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.2">
        RECLAMACIONES
      </text>
      <text x="82" y="61" fill="#8FA49D" fontSize="6.5" fontFamily="Arial, sans-serif">
        Livora S.A.C.
      </text>
      <text x="82" y="70" fill="#8FA49D" fontSize="6" fontFamily="Arial, sans-serif">
        RUC: 20608912345
      </text>
      
      {/* Legal Subtitle Bottom */}
      <rect x="10" y="78" width="140" height="14" rx="3" fill="#132720" />
      <text x="80" y="87.5" fill="#C6D7D1" fontSize="6" fontWeight="600" fontFamily="Arial, sans-serif" textAnchor="middle">
        Conforme a Ley N° 29571 y Ley N° 32495
      </text>
    </svg>
  );
}

export function Footer() {
  const handleOpenCookieSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("livora:open-cookie-settings"));
    }
  };

  return (
    <footer className="livora-footer" style={{ borderTop: "1px solid var(--line, #20332d)", background: "#060e0c", marginTop: "auto", color: "#8fa49d", fontSize: 13 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 34px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32, marginBottom: 32 }}>
          {/* Col 1: Brand & Indecopi Reclamaciones Badge */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <LivoraLogo size={28} />
              <strong style={{ color: "#f2f7f5", fontSize: 17, letterSpacing: -0.3 }}>Livora S.A.C.</strong>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "#8fa49d", margin: "0 0 16px" }}>
              Plataforma de trazabilidad de reciclaje con canje Web3 en la blockchain Stellar y cumplimiento integral de normativas ambientales y de protección al consumidor en el Perú.
            </p>
            {/* Indecopi Legal Warning */}
            <p style={{ fontSize: 9.5, lineHeight: 1.4, color: "#aec2bb", margin: "0 0 12px", fontWeight: 600, maxWidth: 300 }}>
              CONFORME A LO ESTABLECIDO EN EL CÓDIGO DE PROTECCIÓN Y DEFENSA DEL CONSUMIDOR, ESTE ESTABLECIMIENTO CUENTA CON UN LIBRO DE RECLAMACIONES A SU DISPOSICIÓN.
            </p>
            {/* Libro de Reclamaciones Link with Official Badge */}
            <Link
              href="/libro-de-reclamaciones"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: "#0a1714",
                border: "1px solid #204034",
                borderRadius: 12,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              className="libro-badge-link"
              title="Libro de Reclamaciones Virtual - Livora"
            >
              <IndecopiBookLogo width={110} height={68} />
              <div>
                <span style={{ display: "block", color: "#55e6a5", fontSize: 12, fontWeight: 700 }}>
                  Libro de Reclamaciones
                </span>
                <span style={{ display: "block", color: "#aec2bb", fontSize: 10, marginTop: 2 }}>
                  Hoja de Reclamación Virtual
                </span>
                <span style={{ display: "block", color: "#6e847d", fontSize: 9, marginTop: 2 }}>
                  Plazo legal: 15 días hábiles
                </span>
              </div>
            </Link>
          </div>

          {/* Col 2: Legal & Compliance Links */}
          <div>
            <h4 style={{ color: "#f2f7f5", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 14 }}>
              Marco Legal y Regulatorio
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              <li>
                <Link href="/terminos" style={{ color: "#b8cbc4", textDecoration: "none", transition: "color 0.2s" }} className="hover-green">
                  Términos y Condiciones de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidad" style={{ color: "#b8cbc4", textDecoration: "none", transition: "color 0.2s" }} className="hover-green">
                  Política de Privacidad (Ley 29733)
                </Link>
              </li>
              <li>
                <Link href="/cookies" style={{ color: "#b8cbc4", textDecoration: "none", transition: "color 0.2s" }} className="hover-green">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link href="/libro-de-reclamaciones" style={{ color: "#b8cbc4", textDecoration: "none", transition: "color 0.2s" }} className="hover-green">
                  Libro de Reclamaciones Virtual
                </Link>
              </li>
              <li>
                <Link href="/libro-de-reclamaciones/seguimiento" style={{ color: "#55e6a5", textDecoration: "none", transition: "color 0.2s", display: "inline-flex", alignItems: "center", gap: 6 }} className="hover-green">
                  <Search size={14} /> Consultar Seguimiento de Reclamo
                </Link>
              </li>
              <li>
                <button
                  onClick={handleOpenCookieSettings}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#55e6a5",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                    textDecoration: "underline",
                  }}
                >
                  Configuración de Cookies y Privacidad
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Proteccion de Datos y Contacto */}
          <div>
            <h4 style={{ color: "#f2f7f5", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 14 }}>
              Protección de Datos & Contacto
            </h4>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "#8fa49d", margin: "0 0 10px" }}>
              <strong style={{ color: "#c6d7d1" }}>Banco de Datos:</strong> &ldquo;Usuarios de la Plataforma&rdquo; — Registro Nacional de Protección de Datos Personales (ANPD).
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "#8fa49d", margin: "0 0 10px" }}>
              <strong style={{ color: "#c6d7d1" }}>Derechos ARCO:</strong> Envíe su solicitud formal a{" "}
              <a href="mailto:privacidad@livora.pe" style={{ color: "#55e6a5", textDecoration: "underline" }}>
                privacidad@livora.pe
              </a>
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "#8fa49d", margin: 0 }}>
              <strong style={{ color: "#c6d7d1" }}>Sede Operativa:</strong> Lima, República del Perú.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Corporate Details */}
        <div
          style={{
            borderTop: "1px solid #162621",
            paddingTop: 20,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            fontSize: 11,
            color: "#6e847d",
          }}
        >
          <div>
            &copy; 2026 Livora S.A.C. — RUC: 20608912345. Todos los derechos reservados.
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <span>Infraestructura Blockchain Livora</span>
            <span>Ley N° 29571 & Ley N° 32495 (Indecopi)</span>
            <span>Ley N° 29733 (ANPD)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
