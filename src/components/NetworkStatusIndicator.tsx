"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Indicador visual no invasivo de estado de conectividad online/offline y registro de PWA
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Registro de Service Worker para PWA
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("PWA ServiceWorker registration skipped:", err));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "#EF4444",
          color: "#FFFFFF",
          padding: "10px 18px",
          borderRadius: 30,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.4)",
          fontSize: 13,
          fontWeight: 700,
        }}
        role="status"
        aria-live="polite"
      >
        <WifiOff size={18} />
        <span>Sin conexión a internet (Modo Offline)</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "#10B981",
          color: "#0A192F",
          padding: "10px 18px",
          borderRadius: 30,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
          fontSize: 13,
          fontWeight: 800,
        }}
        role="status"
        aria-live="polite"
      >
        <Wifi size={18} />
        <span>Conexión restablecida</span>
      </div>
    );
  }

  return null;
}
