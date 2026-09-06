"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Cpu, ShieldCheck, ArrowUpRight } from "lucide-react";

interface AsyncProcessingModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  batchId?: string;
  status: "QUEUED" | "PROCESSING" | "MINING" | "COMPLETED" | "FAILED";
  txHash?: string;
  onClose: () => void;
}

/**
 * Modal reactivo visual para respuestas HTTP 202 Accepted (Procesamiento Asíncrono on-chain)
 */
export function AsyncProcessingModal({
  isOpen,
  title,
  description,
  batchId,
  status,
  txHash,
  onClose,
}: AsyncProcessingModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (status === "QUEUED") setCurrentStep(1);
    else if (status === "PROCESSING") setCurrentStep(2);
    else if (status === "MINING") setCurrentStep(3);
    else if (status === "COMPLETED") setCurrentStep(4);
  }, [status]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 25, 47, 0.88)",
        backdropFilter: "blur(10px)",
        display: "grid",
        placeItems: "center",
        zIndex: 150,
        padding: 20,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="async-modal-title"
    >
      <div
        style={{
          background: "#112240",
          border: "1px solid #1E293B",
          borderRadius: 24,
          padding: 28,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: status === "COMPLETED" ? "rgba(16, 185, 129, 0.15)" : "rgba(6, 182, 212, 0.15)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            border: `1px solid ${status === "COMPLETED" ? "#10B981" : "#06B6D4"}`,
          }}
        >
          {status === "COMPLETED" ? (
            <CheckCircle2 size={32} style={{ color: "#10B981" }} />
          ) : (
            <Loader2 size={32} style={{ color: "#06B6D4", animation: "spin 2s linear infinite" }} />
          )}
        </div>

        <h3 id="async-modal-title" style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", margin: "0 0 8px" }}>
          {status === "COMPLETED" ? "¡Procesamiento Completado!" : title}
        </h3>
        <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 24px" }}>
          {status === "COMPLETED"
            ? "Los datos han sido minados en la blockchain Stellar y el balance ha sido actualizado."
            : description}
        </p>

        {/* Steps Tracker */}
        <div style={{ display: "grid", gap: 12, textAlign: "left", marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              background: currentStep >= 1 ? "#0A192F" : "transparent",
              border: `1px solid ${currentStep >= 1 ? "#1E293B" : "transparent"}`,
            }}
          >
            <Cpu size={18} style={{ color: currentStep >= 1 ? "#10B981" : "#475569" }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              <strong style={{ display: "block", color: currentStep >= 1 ? "#F8FAFC" : "#64748B" }}>
                1. Recepción en Cola (HTTP 202)
              </strong>
              <small style={{ color: "#94A3B8" }}>Petición aceptada por el nodo Livora</small>
            </div>
            {currentStep > 1 && <CheckCircle2 size={16} style={{ color: "#10B981" }} />}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              background: currentStep >= 2 ? "#0A192F" : "transparent",
              border: `1px solid ${currentStep >= 2 ? "#1E293B" : "transparent"}`,
            }}
          >
            <ShieldCheck size={18} style={{ color: currentStep >= 2 ? "#06B6D4" : "#475569" }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              <strong style={{ display: "block", color: currentStep >= 2 ? "#F8FAFC" : "#64748B" }}>
                2. Validación Criptográfica & IPFS
              </strong>
              <small style={{ color: "#94A3B8" }}>Generando manifiesto inmutable</small>
            </div>
            {currentStep > 2 && <CheckCircle2 size={16} style={{ color: "#10B981" }} />}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              background: currentStep >= 3 ? "#0A192F" : "transparent",
              border: `1px solid ${currentStep >= 3 ? "#1E293B" : "transparent"}`,
            }}
          >
            <ArrowUpRight size={18} style={{ color: currentStep >= 3 ? "#3B82F6" : "#475569" }} />
            <div style={{ flex: 1, fontSize: 12 }}>
              <strong style={{ display: "block", color: currentStep >= 3 ? "#F8FAFC" : "#64748B" }}>
                3. Liquidación en Blockchain Stellar
              </strong>
              <small style={{ color: "#94A3B8" }}>Ejecutando contrato Soroban</small>
            </div>
            {currentStep >= 4 && <CheckCircle2 size={16} style={{ color: "#10B981" }} />}
          </div>
        </div>

        {status === "COMPLETED" && txHash && (
          <div style={{ background: "#0A192F", padding: 12, borderRadius: 12, border: "1px solid #1E293B", marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: "#94A3B8", display: "block", marginBottom: 4 }}>Transacción Stellar</span>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#10B981", fontSize: 12, fontWeight: 700, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span>Ver en Stellar Expert ({txHash.slice(0, 10)}...)</span>
              <ArrowUpRight size={12} />
            </a>
          </div>
        )}

        <button
          onClick={onClose}
          disabled={status !== "COMPLETED" && status !== "FAILED"}
          className="btn primary"
          style={{
            width: "100%",
            padding: 12,
            fontWeight: 800,
            opacity: status === "COMPLETED" || status === "FAILED" ? 1 : 0.5,
            cursor: status === "COMPLETED" || status === "FAILED" ? "pointer" : "not-allowed",
          }}
        >
          {status === "COMPLETED" ? "Entendido y Cerrar" : "Procesando en segundo plano..."}
        </button>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
