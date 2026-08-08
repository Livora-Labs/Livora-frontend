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

export function showToast(title: string, type: "success" | "error" | "info" = "info", description?: string) {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      description,
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
