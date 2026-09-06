"use client";

import { useReportWebVitals } from "next/web-vitals";
import * as Sentry from "@sentry/nextjs";

/**
 * Componente de Telemetría RUM (Real User Monitoring) para Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // 1. Envío a Sentry como breadcrumb y medición
    try {
      Sentry.addBreadcrumb({
        category: "web-vitals",
        message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
        level: metric.rating === "good" ? "info" : "warning",
        data: {
          id: metric.id,
          name: metric.name,
          startTime: metric.startTime,
          value: metric.value,
          rating: metric.rating,
        },
      });
    } catch {
      // Ignorar errores de telemetría en offline
    }

    // 2. Registro en consola en modo desarrollo
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Web-Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
      });
    }
  });

  return null;
}
