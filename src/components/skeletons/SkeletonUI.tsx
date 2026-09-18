import React from "react";

/**
 * Componente base de animación Shimmer para evitar CLS
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style = {},
  className = "",
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--panel2, #f1f5f9) 25%, var(--line, #e2e8f0) 50%, var(--panel2, #f1f5f9) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton para tarjetas KPI superiores
 */
export function KpiSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid kpis"
      style={{
        gridTemplateColumns: `repeat(${count}, 1fr)`,
        gap: 16,
        marginBottom: 24,
      }}
      aria-busy="true"
      aria-label="Cargando indicadores clave"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--panel, #ffffff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 16,
            padding: 20,
            display: "grid",
            gap: 10,
          }}
        >
          <Skeleton width="40%" height={12} />
          <Skeleton width="70%" height={28} borderRadius={6} />
          <Skeleton width="50%" height={14} />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para tablas de datos
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      style={{
        background: "var(--panel, #ffffff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: 16,
        padding: 20,
        width: "100%",
      }}
      aria-busy="true"
      aria-label="Cargando datos de la tabla"
    >
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns}%`} height={16} />
        ))}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} width={`${100 / columns}%`} height={24} borderRadius={6} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para tarjetas individuales o items de lista
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gap: 12 }} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--panel, #ffffff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gap: 8, flex: 1 }}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="60%" height={18} />
            <Skeleton width="45%" height={12} />
          </div>
          <Skeleton width={80} height={32} borderRadius={8} />
        </div>
      ))}
    </div>
  );
}
