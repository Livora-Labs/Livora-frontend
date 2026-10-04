"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { fetchSecureBlob } from "@/lib/api";

export interface MediaItem {
  url: string;
  title: string;
  subtitle?: string;
  type?: "image" | "pdf" | "document";
}

export interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  initialIndex?: number;
}

const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

export function MediaViewerModal({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Synchronize index when opened or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1)));
      setZoom(1);
      setRotation(0);
      setLoading(true);
      setHasError(false);
      setGatewayIndex(0);
      setBlobUrl(null);
    }
  }, [isOpen, initialIndex, items.length]);

  const currentItem: MediaItem | undefined = items[currentIndex];

  // Resolve safe URL with IPFS gateway, relative path fix and retry bypass
  const resolvedUrl = useMemo(() => {
    if (!currentItem?.url) return "";
    let raw = currentItem.url.trim();

    // Check if it's an IPFS hash or ipfs:// uri
    if (raw.startsWith("ipfs://")) {
      const cid = raw.replace(/^ipfs:\/\//, "").replace(/^ipfs\//, "");
      const base = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
      raw = `${base}${cid}`;
    } else if (/^Qm[1-9A-HJ-NP-za-km-z]{44}/.test(raw) || /^bafy[a-z0-9]{55}/.test(raw)) {
      const base = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
      raw = `${base}${raw}`;
    } else if (raw.startsWith("/") && !raw.startsWith("//")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const cleanApi = apiUrl.replace(/\/$/, "");
      raw = `${cleanApi}${raw}`;
    }

    if (retryKey > 0) {
      const separator = raw.includes("?") ? "&" : "?";
      return `${raw}${separator}_retry=${retryKey}`;
    }

    return raw;
  }, [currentItem?.url, gatewayIndex, retryKey]);

  // Carga autenticada mediante stream seguro / blob si la URL es interna/protegida
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (!resolvedUrl || !isOpen) {
      setBlobUrl(null);
      return;
    }

    // Si es del backend de Livora o del storage protegido de Supabase
    const isInternalProtected =
      resolvedUrl.includes("/uploads/secure-view") ||
      resolvedUrl.includes("supabase.co") ||
      resolvedUrl.includes("livora-kyc-private") ||
      (resolvedUrl.includes("/uploads") && !resolvedUrl.startsWith("http"));

    if (isInternalProtected) {
      setLoading(true);
      fetchSecureBlob(resolvedUrl)
        .then((url) => {
          if (!active) return;
          createdUrl = url;
          setBlobUrl(url);
          setLoading(false);
          setHasError(false);
        })
        .catch(() => {
          if (!active) return;
          // Fallback a la URL resuelta si la obtención de blob falla
          setBlobUrl(resolvedUrl);
        });
    } else {
      setBlobUrl(resolvedUrl);
    }

    return () => {
      active = false;
      if (createdUrl && createdUrl.startsWith("blob:")) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [resolvedUrl, isOpen, retryKey]);

  // Determine media type
  const isPdf = useMemo(() => {
    if (currentItem?.type === "pdf") return true;
    if (!resolvedUrl) return false;
    const cleanUrl = resolvedUrl.split("?")[0].toLowerCase();
    return cleanUrl.endsWith(".pdf");
  }, [currentItem?.type, resolvedUrl]);

  // Reset transforms on item change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setLoading(true);
    setHasError(false);
  }, [currentIndex, resolvedUrl]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(z + 0.25, 4));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(z - 0.25, 0.5));
      } else if (e.key === "0") {
        setZoom(1);
        setRotation(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || !currentItem) return null;

  const handleRetry = () => {
    setLoading(true);
    setHasError(false);
    setRetryKey((k) => k + 1);
  };

  const handleSwitchGateway = () => {
    setLoading(true);
    setHasError(false);
    setGatewayIndex((g) => g + 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentItem.title || "Visor Multimedia"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(10, 15, 29, 0.92)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        color: "#ffffff",
        userSelect: "none",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Barra Superior de Control */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.75)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(5, 150, 105, 0.2)",
              color: "#34d399",
              display: "grid",
              placeItems: "center",
            }}
          >
            {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: "-0.01em",
              }}
            >
              {currentItem.title || "Evidencia Multimedia"}
            </h3>
            <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 8, marginTop: 2 }}>
              {currentItem.subtitle && <span>{currentItem.subtitle}</span>}
              {items.length > 1 && (
                <span>
                  • Archivo {currentIndex + 1} de {items.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir enlace original en pestaña nueva"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e2e8f0",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ExternalLink size={14} />
            <span>Abrir enlace</span>
          </a>

          <a
            href={resolvedUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            title="Descargar archivo"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e2e8f0",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Download size={14} />
            <span>Descargar</span>
          </a>

          <button
            onClick={onClose}
            aria-label="Cerrar visor"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              marginLeft: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Área Central de Visualización */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          padding: 24,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Navegación Anterior */}
        {items.length > 1 && currentIndex > 0 && (
          <button
            onClick={handlePrev}
            aria-label="Archivo anterior"
            style={{
              position: "absolute",
              left: 20,
              zIndex: 20,
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Navegación Siguiente */}
        {items.length > 1 && currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            aria-label="Siguiente archivo"
            style={{
              position: "absolute",
              right: 20,
              zIndex: 20,
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Indicador de Carga */}
        {loading && !hasError && (
          <div
            style={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              color: "#34d399",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                border: "3px solid rgba(52, 211, 153, 0.2)",
                borderTopColor: "#34d399",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>
              Cargando archivo multimedia...
            </span>
          </div>
        )}

        {/* Estado de Error Seguro (Sin Pantallas Negras sin Salida) */}
        {hasError && (
          <div
            style={{
              maxWidth: 480,
              background: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: 16,
              padding: 28,
              textAlign: "center",
              color: "#f8fafc",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h4 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>
              No se pudo visualizar el archivo multimedia
            </h4>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              La imagen o documento no pudo ser cargado directamente en el navegador. Esto puede deberse a
              que la firma de seguridad temporal ha expirado, el enlace de almacenamiento privado requiere
              re-autenticación, o la conexión con el nodo IPFS está demorando.
            </p>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 11,
                fontFamily: "monospace",
                color: "#cbd5e1",
                wordBreak: "break-all",
                marginBottom: 20,
                textAlign: "left",
                maxHeight: 60,
                overflowY: "auto",
              }}
            >
              {resolvedUrl}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleRetry}
                style={{
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} />
                <span>Reintentar Carga</span>
              </button>

              {(currentItem.url.startsWith("ipfs://") ||
                /^Qm/.test(currentItem.url) ||
                /^bafy/.test(currentItem.url)) && (
                <button
                  onClick={handleSwitchGateway}
                  style={{
                    background: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                    color: "#60a5fa",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Alternar Gateway IPFS ({gatewayIndex + 1})
                </button>
              )}

              <a
                href={blobUrl || resolvedUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ExternalLink size={14} />
                <span>Abrir en pestaña nueva</span>
              </a>
            </div>
          </div>
        )}

        {/* Renderizado de PDF */}
        {!hasError && isPdf && (
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              height: "100%",
              maxHeight: "80vh",
              background: "#1e293b",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <iframe
              src={blobUrl || resolvedUrl}
              title={currentItem.title}
              style={{ width: "100%", height: "100%", border: "none" }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
            />
          </div>
        )}

        {/* Renderizado de Imagen con Zoom y Rotación */}
        {!hasError && !isPdf && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <img
              src={blobUrl || resolvedUrl}
              alt={currentItem.title}
              style={{
                maxWidth: "88vw",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 8,
                boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.7)",
                display: loading ? "none" : "block",
              }}
              onLoad={() => {
                setLoading(false);
                setHasError(false);
              }}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Barra Inferior de Herramientas y Miniaturas */}
      <footer
        style={{
          padding: "14px 24px",
          background: "rgba(15, 23, 42, 0.8)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* Controles de Zoom y Rotación */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            disabled={isPdf || hasError}
            title="Reducir Zoom (-)"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: isPdf || hasError ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: isPdf || hasError ? "not-allowed" : "pointer",
            }}
          >
            <ZoomOut size={16} />
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setRotation(0);
            }}
            disabled={isPdf || hasError}
            title="Restablecer tamaño (0)"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: isPdf || hasError ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              borderRadius: 8,
              padding: "0 10px",
              height: 36,
              fontSize: 12,
              fontWeight: 700,
              cursor: isPdf || hasError ? "not-allowed" : "pointer",
            }}
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
            disabled={isPdf || hasError}
            title="Aumentar Zoom (+)"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: isPdf || hasError ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: isPdf || hasError ? "not-allowed" : "pointer",
            }}
          >
            <ZoomIn size={16} />
          </button>

          <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.15)", margin: "0 4px" }} />

          <button
            onClick={() => setRotation((r) => (r - 90) % 360)}
            disabled={isPdf || hasError}
            title="Girar a la izquierda"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: isPdf || hasError ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: isPdf || hasError ? "not-allowed" : "pointer",
            }}
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            disabled={isPdf || hasError}
            title="Girar a la derecha"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: isPdf || hasError ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              cursor: isPdf || hasError ? "not-allowed" : "pointer",
            }}
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* Miniaturas de selección múltiple */}
        {items.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: "45vw", padding: "4px 0" }}>
            {items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  background: idx === currentIndex ? "rgba(5, 150, 105, 0.3)" : "rgba(255, 255, 255, 0.06)",
                  border: idx === currentIndex ? "2px solid #34d399" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  color: idx === currentIndex ? "#ffffff" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: idx === currentIndex ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {it.title || `Doc #${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          <span>Usa Esc para salir • Flechas para navegar</span>
        </div>
      </footer>
    </div>
  );
}
