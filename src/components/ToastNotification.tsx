"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

function sanitizeErrorDescription(description?: string): string | undefined {
  if (!description) return undefined;

  const descLower = description.toLowerCase();

  // 401 Unauthorized
  if (descLower.includes("401") || descLower.includes("unauthorized")) {
    return "Credenciales incorrectas o sesión expirada. Por favor, inicia sesión de nuevo.";
  }

  // 403 Forbidden
  if (descLower.includes("403") || descLower.includes("forbidden")) {
    return "No tienes permisos para realizar esta acción.";
  }

  // 404 Not Found
  if (descLower.includes("404") || descLower.includes("not found")) {
    return "El recurso solicitado no fue encontrado o la ruta es inválida.";
  }

  // 400 Bad Request
  if (descLower.includes("400") || descLower.includes("bad request")) {
    return "Los datos de la solicitud son incorrectos. Por favor, verifica la información ingresada.";
  }

  // 500 / 502 / 503 / 504 Server Error
  if (
    descLower.includes("500") ||
    descLower.includes("502") ||
    descLower.includes("503") ||
    descLower.includes("504") ||
    descLower.includes("internal server error")
  ) {
    return "Error interno en el servidor. Por favor, inténtalo de nuevo más tarde.";
  }

  // Network Error / Connection refused
  if (descLower.includes("network error") || descLower.includes("enotfound") || descLower.includes("econnrefused")) {
    return "No se pudo conectar con el servidor. Verifica tu conexión a internet o la disponibilidad del servicio.";
  }

  // Timeout
  if (descLower.includes("timeout") || descLower.includes("exceeded")) {
    return "La solicitud tardó demasiado tiempo en responder. Inténtalo de nuevo.";
  }

  // Axios default "Request failed with status code XYZ"
  const match = description.match(/Request failed with status code (\d+)/i);
  if (match) {
    const statusCode = parseInt(match[1], 10);
    switch (statusCode) {
      case 400:
        return "Los datos proporcionados no son válidos. Por favor, verifica la información.";
      case 401:
        return "Acceso denegado. Credenciales incorrectas o sesión expirada.";
      case 403:
        return "No tienes autorización para acceder a este recurso.";
      case 404:
        return "El servicio solicitado no existe.";
      default:
        return `El servidor respondió con un error (código ${statusCode}).`;
    }
  }

  return description;
}

export function showToast(title: string, type: "success" | "error" | "info" = "info", description?: string) {
  if (toastListener) {
    const finalDescription = type === "error" ? sanitizeErrorDescription(description) : description;
    toastListener({
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      description: finalDescription,
    });
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380, width: "100%" }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === "success" ? "#064e3b" : toast.type === "error" ? "#7f1d1d" : "#0e2a38",
            border: `1px solid ${toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#06b6d4"}`,
            color: "#F8FAFC",
            padding: "12px 16px",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          {toast.type === "success" && <CheckCircle2 style={{ color: "#10b981", minWidth: 20, marginTop: 2 }} size={20} />}
          {toast.type === "error" && <AlertCircle style={{ color: "#ef4444", minWidth: 20, marginTop: 2 }} size={20} />}
          {toast.type === "info" && <Info style={{ color: "#06b6d4", minWidth: 20, marginTop: 2 }} size={20} />}
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{toast.title}</strong>
            {toast.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#cbd5e1" }}>{toast.description}</p>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 2 }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
