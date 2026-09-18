"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Kpi, PageHead } from "@/components/Shell";
import { fetchB2bTransfers, receiveB2bTransfer, fetchCertificates } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ViewStatesContainer } from "@/components/ui/view-states-container";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { Web3ConfirmModal } from "@/components/Web3ConfirmModal";
import {
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Warehouse,
  ShieldCheck,
  Plus,
} from "lucide-react";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function CompanyPurchasesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "REQUESTED" | "ACCEPTED" | "DELIVERED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [confirmTransferId, setConfirmTransferId] = useState<string | null>(null);
  const [selectedTransferForWeb3, setSelectedTransferForWeb3] = useState<any | null>(null);

  const {
    data: transfersData,
    isLoading: loadingTransfers,
    isError: isTransfersError,
    error: transfersError,
    refetch: refetchTransfers,
  } = useQuery({
    queryKey: ["b2bTransfers", activeTab, page],
    queryFn: () =>
      fetchB2bTransfers({
        status: activeTab === "ALL" ? undefined : activeTab,
        page,
        limit,
      }),
  });

  const { data: certs = [] } = useQuery({
    queryKey: ["companyCertificates"],
    queryFn: fetchCertificates,
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => receiveB2bTransfer(id),
    onSuccess: (data) => {
      showToast(
        "¡Recepción Directa Confirmada!",
        "success",
        "El lote fue recibido con conformidad y el Certificado ESG fue emitido on-chain."
      );
      setSelectedTransferForWeb3(null);
      setConfirmTransferId(null);
      queryClient.invalidateQueries({ queryKey: ["b2bTransfers"] });
      queryClient.invalidateQueries({ queryKey: ["companyCertificates"] });
    },
    onError: (err: any) => {
      showToast(
        "Error al confirmar recepción",
        "error",
        err.response?.data?.message || err.message
      );
    },
  });

  const transfersList = transfersData?.data || [];
  const totalItems = transfersData?.total || 0;
  const totalPages = transfersData?.totalPages || 1;

  const filteredTransfers = transfersList.filter((t: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const centerMatch =
      t.center?.name?.toLowerCase().includes(q) ||
      t.center?.email?.toLowerCase().includes(q) ||
      t.center?.address?.toLowerCase().includes(q);
    const idMatch = t.id?.toLowerCase().includes(q);
    const notesMatch = t.notes?.toLowerCase().includes(q);
    return centerMatch || idMatch || notesMatch;
  });

  const handleOpenReceiveModal = (transfer: any) => {
    setSelectedTransferForWeb3(transfer);
    setConfirmTransferId(transfer.id);
  };

  const handleConfirmReceiveWeb3 = () => {
    if (confirmTransferId) {
      receiveMutation.mutate(confirmTransferId);
    }
  };

  const getMaterialsSummary = (materialsObj: Record<string, number> | null) => {
    if (!materialsObj) return "Sin datos";
    return Object.entries(materialsObj)
      .map(([mat, weight]) => `${mat}: ${kg(Number(weight))}`)
      .join(", ");
  };

  const getTotalKgFromMaterials = (materialsObj: Record<string, number> | null) => {
    if (!materialsObj) return 0;
    return Object.values(materialsObj).reduce((sum, w) => sum + Number(w || 0), 0);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 8px",
              background: "rgba(245, 158, 11, 0.12)",
              color: "#d97706",
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Clock size={12} /> Solicitado por Empresa
          </span>
        );
      case "ACCEPTED":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 8px",
              background: "rgba(37, 99, 235, 0.12)",
              color: "#2563eb",
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Warehouse size={12} /> Aceptado por Acopio
          </span>
        );
      case "DELIVERED":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 8px",
              background: "rgba(5, 150, 105, 0.12)",
              color: "#059669",
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CheckCircle2 size={12} /> Entregado y Certificado
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Abastecimiento circular B2B"
        title="Compras y Despachos de Material"
        description="Gestión integral de pedidos a centros de acopio: solicitud, confirmación de pesaje real y recepción en planta con certificación ESG."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/company/catalogo"
              className="btn primary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} />
              <span>Nueva Solicitud al Catálogo</span>
            </Link>
            <button
              onClick={() => refetchTransfers()}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      {/* Tarjetas KPI */}
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi
          label="PEDIDOS TOTALES"
          value={String(totalItems)}
          trend="Operaciones registradas"
          accent="var(--blue)"
        />
        <Kpi
          label="ESTRUCTURA DE CICLO"
          value="3 ESTADOS"
          trend="Solicitud → Despacho → Recepción"
        />
        <Kpi
          label="CERTIFICADOS ON-CHAIN"
          value={String(certs.length)}
          trend="Stellar ESG Passport"
          accent="var(--purple, #8b5cf6)"
        />
        <Kpi
          label="TRAZABILIDAD AUDITADA"
          value="100%"
          trend="Sin intermediarios opacos"
          accent="var(--green)"
        />
      </div>

      {/* Pestañas de Estados */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: "1px solid var(--line, #cbd5e1)",
          paddingBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("ALL");
            setPage(1);
          }}
          className={`btn ${activeTab === "ALL" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          Todas las Operaciones
        </button>
        <button
          onClick={() => {
            setActiveTab("REQUESTED");
            setPage(1);
          }}
          className={`btn ${activeTab === "REQUESTED" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          1. Solicitado por Empresa
        </button>
        <button
          onClick={() => {
            setActiveTab("ACCEPTED");
            setPage(1);
          }}
          className={`btn ${activeTab === "ACCEPTED" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          2. Aceptado por Acopio (Por Recibir)
        </button>
        <button
          onClick={() => {
            setActiveTab("DELIVERED");
            setPage(1);
          }}
          className={`btn ${activeTab === "DELIVERED" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          3. Entregado y Certificado
        </button>
      </div>

      {/* Búsqueda */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search" style={{ width: "100%", maxWidth: 500 }}>
          <input
            placeholder="Buscar por ID, centro de acopio o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla con los 4 Estados */}
      <ViewStatesContainer
        isLoading={loadingTransfers}
        error={isTransfersError ? (transfersError as any)?.message || "Error al cargar órdenes" : null}
        isEmpty={!loadingTransfers && !isTransfersError && filteredTransfers.length === 0}
        onRetry={() => refetchTransfers()}
        skeleton={<TableSkeleton rows={5} columns={6} />}
        emptyTitle={transfersList.length === 0 ? "Sin Pedidos Registrados" : "Sin Coincidencias"}
        emptyDescription={
          transfersList.length === 0
            ? "Aún no has emitido solicitudes de compra de material a los centros de acopio."
            : "No encontramos transferencias que coincidan con la búsqueda."
        }
        emptyActionLabel={transfersList.length === 0 ? "Ir al Catálogo de Acopios" : "Limpiar Filtro"}
        onEmptyAction={() => {
          if (transfersList.length === 0) {
            window.location.href = "/company/catalogo";
          } else {
            setSearchQuery("");
          }
        }}
      >
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="section-title"
            style={{
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Operaciones de Abastecimiento ({totalItems})
            </h2>
            <span className="live">Trazabilidad Stellar</span>
          </div>
          <div className="table-wrap">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--panel2, #f8fafc)", borderBottom: "1px solid var(--line, #cbd5e1)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>ID Pedido</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Centro de Acopio</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Materiales y Pesos</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado de Ciclo</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((t: any) => {
                  const totalKg = getTotalKgFromMaterials(t.materials);
                  const isAccepted = t.status === "ACCEPTED";
                  const isDelivered = t.status === "DELIVERED";

                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        <span className="mono">#{shortId(t.id)}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted, #64748b)" }}>
                        {date(t.createdAt)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{t.center?.name || t.center?.email}</div>
                        {t.center?.address && (
                          <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                            {t.center.address}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text, #0f172a)" }}>
                          {getMaterialsSummary(t.materials)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted, #64748b)", marginTop: 2 }}>
                          Total lote: <strong>{kg(totalKg)}</strong>
                          {t.totalAmount && ` • ${money(Number(t.totalAmount))}`}
                        </div>
                        {t.notes && (
                          <div style={{ fontSize: 11, color: "var(--blue, #2563eb)", marginTop: 2 }}>
                            Nota: {t.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>{renderStatusBadge(t.status)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        {isAccepted && (
                          <button
                            onClick={() => handleOpenReceiveModal(t)}
                            disabled={receiveMutation.isPending}
                            className="btn primary"
                            style={{
                              fontSize: 12,
                              padding: "6px 12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <ShieldCheck size={13} />
                            <span>Confirmar Recepción</span>
                          </button>
                        )}
                        {isDelivered && (
                          <Link
                            href="/company/certificates"
                            className="btn ghost"
                            style={{
                              fontSize: 12,
                              padding: "5px 10px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>Ver Certificado ESG</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                        {t.status === "REQUESTED" && (
                          <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                            Esperando despacho del acopio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </ViewStatesContainer>

      {/* Paginación */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            padding: "14px 18px",
            background: "var(--panel, #ffffff)",
            borderRadius: 12,
            border: "1px solid var(--line, #cbd5e1)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalItems} transferencias)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn secondary"
              style={{ fontSize: 12, padding: "6px 12px", opacity: page <= 1 ? 0.5 : 1 }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="btn secondary"
              style={{ fontSize: 12, padding: "6px 12px", opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal Web3 para confirmación de recepción directa */}
      {selectedTransferForWeb3 && (
        <Web3ConfirmModal
          isOpen={!!selectedTransferForWeb3}
          title="Confirmación de Recepción en Planta"
          tokenAmount={getTotalKgFromMaterials(selectedTransferForWeb3.materials).toFixed(1)}
          tokenSymbol="KG MATERIAL RECICLADO"
          destinationName={selectedTransferForWeb3.center?.name || selectedTransferForWeb3.center?.email}
          actionDescription="Recepción física con conformidad y emisión de Certificado ESG on-chain"
          warningText="Al confirmar la recepción física, autorizas la emisión definitiva e inmutable del Certificado de Trazabilidad ESG en la red descentralizada Stellar."
          isLoading={receiveMutation.isPending}
          onConfirm={handleConfirmReceiveWeb3}
          onCancel={() => {
            setSelectedTransferForWeb3(null);
            setConfirmTransferId(null);
          }}
        />
      )}
    </>
  );
}
