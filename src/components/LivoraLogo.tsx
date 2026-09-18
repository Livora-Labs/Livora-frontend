import React from "react";
import Image from "next/image";

interface LivoraLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Isotipo oficial de Livora sin fondo para barras de navegación, encabezados y avatares.
 */
export function LivoraLogo({
  size = 36,
  className = "",
  style,
  alt = "Livora",
}: LivoraLogoProps) {
  return (
    <Image
      src="/images/livora_isotipo.png"
      alt={alt}
      width={size}
      height={size}
      priority
      className={className}
      style={{
        objectFit: "contain",
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

interface LivoraFullLogoProps {
  height?: number;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Logotipo oficial completo de Livora (Isotipo + Marca tipográfica integrada).
 * Ideal para pantallas de autenticación, landing page, footers y reportes impresos.
 */
export function LivoraFullLogo({
  height = 40,
  width = 160,
  className = "",
  style,
  alt = "Livora — Trazabilidad y Reciclaje Circular",
}: LivoraFullLogoProps) {
  return (
    <Image
      src="/images/livora-logotipo.png"
      alt={alt}
      width={width}
      height={height}
      priority
      className={className}
      style={{
        objectFit: "contain",
        height: height,
        width: "auto",
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * Logotipo de marca Livora (Isotipo + Nombre de texto).
 */
export function LivoraBrand({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`brand ${className}`}
      style={{ display: "flex", alignItems: "center", gap: 11 }}
    >
      <LivoraLogo size={size} />
      <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Livora</span>
    </div>
  );
}
