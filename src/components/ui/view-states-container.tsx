"use client";

import React from "react";
import { ErrorState, EmptyState } from "../StateFeedback";
import { LucideIcon, FolderOpen } from "lucide-react";

interface ViewStatesContainerProps {
  isLoading: boolean;
  error?: string | Error | null;
  isEmpty?: boolean;
  onRetry?: () => void | Promise<any>;
  skeleton?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyActionHref?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Contenedor Unificado de 4 Estados Canónicos para Vistas Web
 * Garantiza que toda sección de datos maneje obligatoriamente:
 * 1. Loading / Skeleton
 * 2. Success / Data
 * 3. Error con Reintento
 * 4. Empty State con CTA
 */
export function ViewStatesContainer({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  skeleton,
  emptyTitle = "Sin elementos registrados",
  emptyDescription = "No hay registros disponibles en este momento.",
  emptyIcon = FolderOpen,
  emptyActionLabel,
  onEmptyAction,
  emptyActionHref,
  children,
  className = "",
}: ViewStatesContainerProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {skeleton || (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const errorMsg = typeof error === "string" ? error : error.message;
    return (
      <div className={className}>
        <ErrorState
          title="No pudimos cargar la información"
          message={errorMsg || "Ocurrió un inconveniente al consultar los datos del servidor."}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
          actionHref={emptyActionHref}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
