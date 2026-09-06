import React from "react";
import Image from "next/image";

interface LivoraLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Isotipo oficial de Livora sin fondo para barras de navegación, encabezados y footer.
 */
export function LivoraLogo({
  size = 32,
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

/**
 * Logotipo de marca Livora (Isotipo + Nombre de texto).
 */
export function LivoraBrand({
  size = 32,
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
      <span>Livora</span>
    </div>
  );
}
