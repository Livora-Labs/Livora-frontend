"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, X, ArrowRight } from "lucide-react";

export interface Web3ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  tokenAmount: number | string;
  tokenSymbol?: string;
  destinationName: string;
  destinationAddress?: string;
  actionDescription?: string;
  concept?: string;
  warningText?: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function Web3ConfirmModal({
  isOpen,
  title = "Confirmar Transacción Blockchain",
  tokenAmount,
  tokenSymbol = "LIVO",
  destinationName,
  destinationAddress,
  actionDescription = "Canje de LIVOs en Comercio Aliado",
  concept,
  warningText = "Al confirmar, autorizas a Livora a firmar la transacción en la blockchain Stellar. Esta acción es irreversible.",
  isLoading = false,
  onConfirm,
  onCancel,
}: Web3ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 25, 47, 0.88)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#0D1B2A",
          border: "1px solid #1E293B",
          borderRadius: 20,
          padding: 24,
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          color: "#F8FAFC",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(16, 185, 129, 0.15)",
                display: "grid",
                placeItems: "center",
                color: "#10B981",
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#F8FAFC" }}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: 4,
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount & Destination Card */}
        <div
          style={{
            background: "#0A192F",
            border: "1px solid #1E293B",
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#94A3B8" }}>Monto a debitar</span>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#10B981", margin: "4px 0 12px" }}>
            {tokenAmount} {tokenSymbol}
          </div>

          <div
            style={{
              borderTop: "1px solid #1E293B",
              paddingTop: 12,
              display: "grid",
              gap: 8,
              fontSize: 13,
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94A3B8" }}>Destino / Comercio:</span>
              <strong style={{ color: "#F8FAFC", maxWidth: 220, textAlign: "right", wordBreak: "break-word" }}>
                {destinationName}
              </strong>
            </div>

            {destinationAddress && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94A3B8" }}>Billetera Stellar:</span>
                <span style={{ color: "#06B6D4", fontFamily: "monospace", fontSize: 11 }}>
                  {destinationAddress.length > 16
                    ? `${destinationAddress.slice(0, 8)}...${destinationAddress.slice(-8)}`
                    : destinationAddress}
                </span>
              </div>
            )}

            {concept && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94A3B8" }}>Concepto:</span>
                <span style={{ color: "#F8FAFC" }}>{concept}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94A3B8" }}>Operación:</span>
              <span style={{ color: "#F8FAFC" }}>{actionDescription}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#94A3B8" }}>Comisión de Red:</span>
              <span style={{ color: "#10B981", fontWeight: 600 }}>0.00 LIVO (Cubierto por Livora)</span>
            </div>
          </div>
        </div>

        {/* Mandatory Statutory Warning Banner */}
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 20,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={20} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 12, color: "#FDE68A", lineHeight: 1.45, fontWeight: 500 }}>
            {warningText}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#F8FAFC",
              padding: "12px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1.2,
              background: "linear-gradient(135deg, #10B981, #059669)",
              border: "none",
              color: "#0A192F",
              padding: "12px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <span>{isLoading ? "Firmando en Stellar..." : "Confirmar y Delegar"}</span>
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Web3ConfirmModal;
