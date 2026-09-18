"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";

/**
 * Barra superior de progreso no invasiva (Top Loading Bar) en verde esmeralda.
 * Provee retroalimentación inmediata durante:
 * 1. Transiciones entre páginas y rutas de la aplicación.
 * 2. Consultas y mutaciones asíncronas en segundo plano.
 * Garantiza que el usuario nunca perciba que la pantalla se congeló.
 */
function TopLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFetching = useIsFetching();

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reacciona a cambios de ruta
  useEffect(() => {
    setActive(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(75), 100);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname, searchParams]);

  // Reacciona a consultas TanStack Query en background
  useEffect(() => {
    if (isFetching > 0 && !active) {
      setActive(true);
      setProgress(45);
    } else if (isFetching === 0 && active && progress < 100) {
      setProgress(100);
      const timer = setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isFetching, active, progress]);

  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99999,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #059669, #10B981, #34D399)",
          boxShadow: "0 0 10px rgba(16, 185, 129, 0.7), 0 0 5px rgba(16, 185, 129, 0.4)",
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}

export function TopLoadingBar() {
  return (
    <React.Suspense fallback={null}>
      <TopLoadingBarInner />
    </React.Suspense>
  );
}
