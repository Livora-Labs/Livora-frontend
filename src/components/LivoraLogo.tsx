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
 * Logotipo oficial completo de Livora (Isotipo + Marca tipográfica horizontal integrada).
 * Ideal para barras de navegación, landing page, footers y reportes impresos.
 */
export function LivoraFullLogo({
  height = 48,
  width = 190,
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
 * Logotipo oficial completo en disposición vertical/apilada (Isotipo arriba, texto abajo).
 * Ideal para pantallas de autenticación, splash y presentaciones de gran formato.
 */
export function LivoraStackedLogo({
  height = 120,
  width = 120,
  className = "",
  style,
  alt = "Livora — Trazabilidad y Reciclaje Circular",
}: LivoraFullLogoProps) {
  return (
    <Image
      src="/images/livora-logotipo-vertical.png"
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
