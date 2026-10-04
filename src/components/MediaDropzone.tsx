"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Image as ImageIcon,
  RotateCw,
} from "lucide-react";
import { uploadFile } from "@/lib/api";

export type DropzoneState =
  | "IDLE"
  | "DRAGGING"
  | "COMPRESSING"
  | "UPLOADING"
  | "SUCCESS"
  | "ERROR";

export interface MediaDropzoneProps {
  label?: string;
  description?: string;
  purpose?: "collection" | "kyc" | "receipt";
  accept?: string;
  maxSizeMB?: number;
  compressImages?: boolean;
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function MediaDropzone({
  label = "Adjuntar comprobante o archivo",
  description = "Formatos permitidos: JPEG, PNG o PDF (Máx. 10MB)",
  purpose = "receipt",
  accept = "image/jpeg,image/png,application/pdf",
  maxSizeMB = 10,
  compressImages = true,
  value,
  onChange,
  disabled = false,
}: MediaDropzoneProps) {
  const [state, setState] = useState<DropzoneState>(value ? "SUCCESS" : "IDLE");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Guardamos el archivo original en memoria para permitir reintentos sin volver a abrir el diálogo de archivos
  const cachedFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compresión en cliente para imágenes utilizando Canvas
  const compressImage = async (file: File): Promise<File | Blob> => {
    if (!compressImages || file.type === "application/pdf") {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxWidth = 1920;
        const maxHeight = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          file.type === "image/png" ? "image/png" : "image/jpeg",
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = objectUrl;
    });
  };

  const executeUpload = useCallback(
    async (file: File) => {
      cachedFileRef.current = file;
      setErrorMessage(null);

      // Verificación de tamaño máximo
      if (file.size > maxSizeMB * 1024 * 1024) {
        setState("ERROR");
        setErrorMessage(`El archivo supera el límite máximo de ${maxSizeMB} MB`);
        return;
      }

      setFileName(file.name);
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (!isPdf) {
        const previewUrl = URL.createObjectURL(file);
        setPreviewBlob(previewUrl);
      } else {
        setPreviewBlob(null);
      }

      try {
        setState("COMPRESSING");
        setProgress(15);
        const processedFile = await compressImage(file);

        setState("UPLOADING");
        setProgress(25);

        const result = await uploadFile(processedFile, purpose, (pct) => {
          setProgress(Math.max(25, pct));
        });

        setProgress(100);
        setState("SUCCESS");
        onChange(result.url);
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Error de red o procesamiento al subir el archivo";
        setState("ERROR");
        setErrorMessage(msg);
      }
    },
    [maxSizeMB, compressImages, purpose, onChange]
  );

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cachedFileRef.current) {
      executeUpload(cachedFileRef.current);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && state !== "UPLOADING" && state !== "COMPRESSING") {
      setState("DRAGGING");
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === "DRAGGING") {
      setState(value ? "SUCCESS" : "IDLE");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || state === "UPLOADING" || state === "COMPRESSING") return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      executeUpload(e.dataTransfer.files[0]);
    } else {
      setState(value ? "SUCCESS" : "IDLE");
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      executeUpload(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewBlob) URL.revokeObjectURL(previewBlob);
    setPreviewBlob(null);
    setFileName(null);
    setErrorMessage(null);
    cachedFileRef.current = null;
    setState("IDLE");
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isCurrentFilePdf =
    value?.toLowerCase().endsWith(".pdf") || fileName?.toLowerCase().endsWith(".pdf");

  const isBusy = state === "COMPRESSING" || state === "UPLOADING";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted, #64748b)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !isBusy && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${
            state === "DRAGGING"
              ? "var(--primary, #10B981)"
              : state === "ERROR"
              ? "#EF4444"
              : state === "SUCCESS" || Boolean(value)
              ? "rgba(16, 185, 129, 0.4)"
              : "var(--line, #cbd5e1)"
          }`,
          borderRadius: 14,
          padding: value || previewBlob ? "14px 18px" : "24px 20px",
          background:
            state === "DRAGGING"
              ? "rgba(16, 185, 129, 0.08)"
              : state === "ERROR"
              ? "rgba(239, 68, 68, 0.04)"
              : state === "SUCCESS" || Boolean(value)
              ? "rgba(16, 185, 129, 0.03)"
              : "var(--bg, #f8fafc)",
          cursor: disabled || isBusy ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={onFileInputChange}
          disabled={disabled || isBusy}
        />

        {value || previewBlob ? (
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 14 }}>
            {/* Miniatura */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--panel2, #e2e8f0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid var(--line, #cbd5e1)",
              }}
            >
              {isCurrentFilePdf ? (
                <FileText size={24} color="#EF4444" />
              ) : previewBlob ? (
                <img
                  src={previewBlob}
                  alt="Previsualización"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : value ? (
                <img
                  src={value}
                  alt="Archivo guardado"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <ImageIcon size={24} color="var(--muted, #64748b)" />
              )}
            </div>

            {/* Info del archivo */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {state === "ERROR" ? (
                  <AlertCircle size={16} color="#EF4444" />
                ) : (
                  <CheckCircle2 size={16} color="#10B981" />
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text, #0f172a)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {fileName || "Archivo adjuntado correctamente"}
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted, #64748b)",
                  display: "block",
                  marginTop: 2,
                }}
              >
                {state === "ERROR"
                  ? "Ocurrió un error al procesar el archivo. Puedes reintentar."
                  : "Haz clic o arrastra para reemplazar este archivo"}
              </span>
            </div>

            {/* Acciones contextuales */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {state === "ERROR" && !isBusy && (
                <button
                  type="button"
                  onClick={handleRetry}
                  title="Reintentar subida"
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "none",
                    borderRadius: 8,
                    padding: 8,
                    cursor: "pointer",
                    color: "var(--primary, #10B981)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <RotateCw size={14} />
                  <span>Reintentar</span>
                </button>
              )}

              {!disabled && !isBusy && (
                <button
                  type="button"
                  onClick={handleRemove}
                  title="Eliminar archivo"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none",
                    borderRadius: 8,
                    padding: 8,
                    cursor: "pointer",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background:
                  state === "ERROR"
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(16, 185, 129, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: state === "ERROR" ? "#EF4444" : "var(--primary, #10B981)",
              }}
            >
              {state === "ERROR" ? <AlertCircle size={24} /> : <UploadCloud size={24} />}
            </div>

            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text, #0f172a)",
                  display: "block",
                }}
              >
                {state === "DRAGGING"
                  ? "Suelta el archivo para iniciar la carga"
                  : state === "ERROR"
                  ? "Error en la subida anterior"
                  : "Haz clic para subir o arrastra y suelta aquí"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted, #64748b)",
                  display: "block",
                  marginTop: 3,
                }}
              >
                {description}
              </span>
            </div>
          </>
        )}

        {/* Barra de progreso de carga o compresión */}
        {isBusy && (
          <div style={{ width: "100%", marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              <span style={{ color: "var(--primary, #10B981)", fontWeight: 600 }}>
                {state === "COMPRESSING"
                  ? "Optimizando y comprimiendo imagen..."
                  : "Subiendo de forma segura al almacenamiento..."}
              </span>
              <span style={{ color: "var(--muted, #64748b)", fontWeight: 700 }}>
                {progress}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 4,
                background: "var(--line, #e2e8f0)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "var(--primary, #10B981)",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error con botón de reintento */}
      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#EF4444",
            fontSize: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
          {cachedFileRef.current && !isBusy && (
            <button
              type="button"
              onClick={handleRetry}
              style={{
                background: "transparent",
                border: "none",
                color: "#EF4444",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
                padding: "2px 6px",
                fontSize: 12,
              }}
            >
              Reintentar ahora
            </button>
          )}
        </div>
      )}
    </div>
  );
}
