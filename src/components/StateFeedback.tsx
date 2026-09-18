"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, FolderOpen, ArrowRight, LucideIcon } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  statusCode?: number | string;
  onRetry?: () => void | Promise<any>;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Estado 3 Canónico: Error con Reintento (Error onRetry)
 * Muestra información transparente sobre el fallo sin degradar ni romper el layout.
 */
export function ErrorState({
  title = "Error al cargar la información",
  message = "No pudimos conectar con el servidor para obtener los datos más recientes. Por favor verifica tu conexión o intenta nuevamente.",
  statusCode,
  onRetry,
  className = "",
  style = {},
}: ErrorStateProps) {
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      className={`card ${className}`}
      style={{
        padding: "36px 24px",
        textAlign: "center",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        background: "rgba(239, 68, 68, 0.03)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        ...style,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.12)",
          display: "grid",
          placeItems: "center",
          color: "var(--red, #ef4444)",
        }}
      >
        <AlertTriangle size={26} />
      </div>

      <div style={{ maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            {title}
          </h3>
          {statusCode && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.15)",
                color: "var(--red, #ef4444)",
              }}
            >
              HTTP {statusCode}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--text)",
            fontWeight: 600,
            cursor: retrying ? "not-allowed" : "pointer",
            padding: "9px 18px",
            borderRadius: 10,
          }}
        >
          <RefreshCw size={15} style={{ animation: retrying ? "spin 1s linear infinite" : "none" }} />
          <span>{retrying ? "Reintentando..." : "Reintentar conexión"}</span>
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Estado 4 Canónico: Vacío con Micro-Onboarding y Llamada a la Acción (Empty con CTA)
 * Guía constructivamente al usuario cuando no existen datos para poblar la vista.
 */
export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
  style = {},
}: EmptyStateProps) {
  return (
    <div
      className={`card ${className}`}
      style={{
        padding: "44px 24px",
        textAlign: "center",
        border: "1px dashed var(--line)",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        ...style,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--panel2)",
          display: "grid",
          placeItems: "center",
          color: "var(--green)",
          border: "1px solid var(--line)",
        }}
      >
        <Icon size={26} />
      </div>

      <div style={{ maxWidth: 440 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="btn primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            fontWeight: 700,
            fontSize: 13,
            padding: "10px 20px",
            borderRadius: 10,
          }}
        >
          <span>{actionLabel}</span>
          <ArrowRight size={15} />
        </Link>
      )}

      {!actionHref && onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="btn primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            fontWeight: 700,
            fontSize: 13,
            padding: "10px 20px",
            borderRadius: 10,
          }}
        >
          <span>{actionLabel}</span>
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
