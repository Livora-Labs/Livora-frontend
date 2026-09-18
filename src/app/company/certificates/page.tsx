"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CertificateCard } from "@/components/Assets";
import { PageHead, Status } from "@/components/Shell";
import { fetchCertificates } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ViewStatesContainer } from "@/components/ui/view-states-container";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { LayoutGrid, List, RefreshCw, ExternalLink } from "lucide-react";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function CompanyCertsGridSkeleton() {
  return (
    <div className="grid collection-grid">
      {[1, 2, 3, 4].map((x) => (
        <div
          key={x}
          className="card animate-pulse"
          style={{
            height: 180,
            background: "var(--panel, #ffffff)",
            border: "1px solid var(--line, #e2e8f0)",
            borderRadius: 14,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: 16, width: "45%", background: "var(--line, #e2e8f0)", borderRadius: 4 }} />
            <div style={{ height: 16, width: "25%", background: "var(--line, #e2e8f0)", borderRadius: 10 }} />
          </div>
          <div style={{ height: 50, background: "var(--panel2, #f1f5f9)", borderRadius: 8 }} />
          <div style={{ height: 14, width: "60%", background: "var(--line, #e2e8f0)", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    loadCerts();
  }, []);

  const loadCerts = async () => {
    setLoading(true);
    setIsError(false);
    try {
      const data = await fetchCertificates();
      setCerts(data || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Error al cargar certificados");
      showToast("Error al cargar certificados", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certs.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.id?.toLowerCase().includes(q) ||
      c.esgImpact?.recycledMaterial?.toLowerCase().includes(q) ||
      c.ipfsCid?.toLowerCase().includes(q) ||
      c.ipfsHash?.toLowerCase().includes(q) ||
      c.sorobanTxHash?.toLowerCase().includes(q) ||
      c.stellarTxHash?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCerts.length / limit));
  const paginatedCerts = filteredCerts.slice((page - 1) * limit, page * limit);

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Portafolio ambiental"
        title="Certificados ESG"
        description="Explora y verifica las credenciales emitidas por tus compras de material reciclado en la red Stellar."
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                display: "inline-flex",
                background: "var(--panel2, #f1f5f9)",
                padding: 4,
                borderRadius: 10,
                border: "1px solid var(--line, #e2e8f0)",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  background: viewMode === "grid" ? "var(--panel, #ffffff)" : "transparent",
                  color: viewMode === "grid" ? "var(--text, #0f172a)" : "var(--muted, #64748b)",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <LayoutGrid size={13} />
                <span>Cuadrícula</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  background: viewMode === "list" ? "var(--panel, #ffffff)" : "transparent",
                  color: viewMode === "list" ? "var(--text, #0f172a)" : "var(--muted, #64748b)",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <List size={13} />
                <span>Lista</span>
              </button>
            </div>
            <button
              onClick={loadCerts}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search" style={{ width: "100%" }}>
          <input
            placeholder="Buscar por material, ID, hash Stellar o CID IPFS..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
        {loading
          ? "Cargando credenciales..."
          : `Página ${page} de ${totalPages} · ${filteredCerts.length} activo(s) ambiental(es) encontrado(s)`}
      </p>

      <ViewStatesContainer
        isLoading={loading}
        error={errorMessage || (isError ? "Error al cargar certificados" : null)}
        isEmpty={!loading && !isError && filteredCerts.length === 0}
        onRetry={loadCerts}
        skeleton={viewMode === "grid" ? <CompanyCertsGridSkeleton /> : <TableSkeleton rows={4} columns={6} />}
        emptyTitle={certs.length === 0 ? "Sin Certificados ESG Emitidos" : "Sin Coincidencias"}
        emptyDescription={
          certs.length === 0
            ? "Aún no se han emitido certificados ambientales para tus compras registradas."
            : "No hay certificados que coincidan con los términos de búsqueda ingresados."
        }
        emptyActionLabel={certs.length === 0 ? "Actualizar Lista" : "Limpiar Búsqueda"}
        onEmptyAction={() => {
          if (certs.length === 0) {
            loadCerts();
          } else {
            setSearchQuery("");
            setPage(1);
          }
        }}
      >
        {viewMode === "grid" ? (
          <div className="grid collection-grid">
            {paginatedCerts.map((c) => (
              <CertificateCard certificate={c} key={c.id} />
            ))}
          </div>
        ) : (
          <div className="table-wrap" style={{ background: "var(--panel)", borderRadius: 14, border: "1px solid var(--line)", overflow: "hidden" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--panel2)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>ID Certificado</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Material</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Peso Recuperado</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>CO₂ Evitado</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Agua Ahorrada</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCerts.map((c) => {
                  const recycledMaterial = c.esgImpact?.recycledMaterial || "PET";
                  const recycledKg = c.esgImpact?.recycledKg || 0;
                  const co2SavedKg = c.esgImpact?.co2SavedKg || 0;
                  const waterSavedLiters = c.esgImpact?.waterSavedLiters || 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        <Link href={`/company/certificates/${c.id}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                          #{shortId(c.id)}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: "rgba(5, 150, 105, 0.1)", color: "var(--green)", borderRadius: 6, textTransform: "uppercase" }}>
                          {recycledMaterial}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "var(--green)" }}>{kg(recycledKg)}</strong>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "var(--blue)" }}>{kg(co2SavedKg)}</strong>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: "var(--text)" }}>{waterSavedLiters.toLocaleString("es-PE")} L</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Status value={c.status} />
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{date(c.createdAt)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <Link
                          href={`/company/certificates/${c.id}`}
                          className="btn ghost"
                          style={{ fontSize: 12, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <span>Ver Pasaporte</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ViewStatesContainer>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            padding: "16px 20px",
            background: "var(--panel)",
            borderRadius: 12,
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({filteredCerts.length} certificados en total)
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="btn secondary"
              style={{ fontSize: 12, padding: "7px 14px", opacity: page <= 1 || loading ? 0.5 : 1 }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              className="btn secondary"
              style={{ fontSize: 12, padding: "7px 14px", opacity: page >= totalPages || loading ? 0.5 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
