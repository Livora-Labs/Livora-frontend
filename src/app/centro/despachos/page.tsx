"use client";

import React, { useState } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventory,
  fetchB2bCompanies,
  createB2bTransfer,
  fetchB2bTransfers,
  acceptB2bTransfer,
} from "@/lib/api";
import { AcopioSubastasPanel } from "@/components/AcopioSubastasPanel";
import { Web3ConfirmModal } from "@/components/Web3ConfirmModal";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ViewStatesContainer } from "@/components/ui/view-states-container";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import {
  Truck,
  Factory,
  ArrowUpRight,
  Plus,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Warehouse,
  FileText,
} from "lucide-react";

interface SaleLine {
  material: string;
  weightKg: number;
}

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

export default function CentroDespachosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"REQUESTED" | "ACCEPTED" | "DELIVERED" | "ALL">("REQUESTED");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Direct Dispatch Modal State
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [directBuyerId, setDirectBuyerId] = useState("");
  const [directNotes, setDirectNotes] = useState("");
  const [directLines, setDirectLines] = useState<SaleLine[]>([
    { material: "PET", weightKg: 0 },
  ]);

  // Accept Order Modal State
  const [acceptingTransfer, setAcceptingTransfer] = useState<any | null>(null);
  const [actualLines, setActualLines] = useState<SaleLine[]>([]);
  const [dispatchNote, setDispatchNote] = useState("");

  // Web3 Confirm Modal
  const [isWeb3ConfirmOpen, setIsWeb3ConfirmOpen] = useState(false);
  const [web3Payload, setWeb3Payload] = useState<{
    type: "DIRECT" | "ACCEPT";
    buyerName: string;
    totalKg: number;
  } | null>(null);

  // Queries
  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });

  const { data: b2bCompanies = [] } = useQuery({
    queryKey: ["b2bCompanies"],
    queryFn: fetchB2bCompanies,
  });

  const {
    data: transfersData,
    isLoading: loadingTransfers,
    isError: isTransfersError,
    error: transfersError,
    refetch: refetchTransfers,
  } = useQuery({
    queryKey: ["centerB2bTransfers", activeTab, page],
    queryFn: () =>
      fetchB2bTransfers({
        status: activeTab === "ALL" ? undefined : activeTab,
        page,
        limit,
      }),
  });

  const transfersList = transfersData?.data || [];
  const totalTransfers = transfersData?.total || 0;
  const totalPages = transfersData?.totalPages || 1;

  // Direct dispatch mutation
  const directDispatchMutation = useMutation({
    mutationFn: createB2bTransfer,
    onSuccess: () => {
      showToast("¡Despacho Registrado!", "success", "Lote descontado del inventario exitosamente.");
      setIsDirectModalOpen(false);
      setIsWeb3ConfirmOpen(false);
      setDirectLines([{ material: "PET", weightKg: 0 }]);
      setDirectNotes("");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["centerB2bTransfers"] });
    },
    onError: (err: any) => {
      showToast("Error en despacho", "error", err.response?.data?.message || err.message);
    },
  });

  // Accept transfer mutation
  const acceptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => acceptB2bTransfer(id, data),
    onSuccess: () => {
      showToast(
        "¡Trato Cerrado y Lote Despachado!",
        "success",
        "El stock fue descontado y la orden pasó a estado Aceptado por Acopio."
      );
      setAcceptingTransfer(null);
      setIsWeb3ConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["centerB2bTransfers"] });
    },
    onError: (err: any) => {
      showToast("Error al despachar pedido", "error", err.response?.data?.message || err.message);
    },
  });

  // Open Accept Modal for an incoming request
  const handleOpenAcceptModal = (transfer: any) => {
    setAcceptingTransfer(transfer);
    setDispatchNote("");

    // Initialize actual lines from requested materials
    const req = transfer.requestedMaterials || transfer.materials || {};
    const lines: SaleLine[] = Object.entries(req).map(([mat, w]) => ({
      material: mat,
      weightKg: Number(w || 0),
    }));
    setActualLines(lines.length > 0 ? lines : [{ material: "PET", weightKg: 0 }]);
  };

  const handleValidateAndOpenAcceptWeb3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingTransfer) return;

    const validLines = actualLines.filter((l) => Number(l.weightKg) > 0);
    if (validLines.length === 0) {
      showToast("Peso Inválido", "error", "Ingresa al menos un material con peso mayor a 0 kg.");
      return;
    }

    // Validate local stock
    for (const line of validLines) {
      const invItem = inventory.find(
        (i: any) =>
          i.materialType?.toUpperCase() === line.material.toUpperCase() ||
          (line.material === "CARTON" && i.materialType?.toUpperCase() === "CARTÓN")
      );
      const stock = invItem ? Number(invItem.quantityKg) : 0;
      if (line.weightKg > stock) {
        showToast(
          "Stock Físico Insuficiente",
          "error",
          `Stock de ${line.material} es ${stock} kg. No puedes despachar ${line.weightKg} kg.`
        );
        return;
      }
    }

    const totalKg = validLines.reduce((acc, l) => acc + l.weightKg, 0);
    setWeb3Payload({
      type: "ACCEPT",
      buyerName: acceptingTransfer.buyer?.name || acceptingTransfer.buyer?.email,
      totalKg,
    });
    setIsWeb3ConfirmOpen(true);
  };

  const handleValidateAndOpenDirectWeb3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directBuyerId) {
      showToast("Falta Comprador", "error", "Selecciona una empresa B2B compradora.");
      return;
    }

    const validLines = directLines.filter((l) => Number(l.weightKg) > 0);
    if (validLines.length === 0) {
      showToast("Peso Inválido", "error", "Ingresa al menos una línea con peso mayor a 0 kg.");
      return;
    }

    for (const line of validLines) {
      const invItem = inventory.find(
        (i: any) =>
          i.materialType?.toUpperCase() === line.material.toUpperCase() ||
          (line.material === "CARTON" && i.materialType?.toUpperCase() === "CARTÓN")
      );
      const stock = invItem ? Number(invItem.quantityKg) : 0;
      if (line.weightKg > stock) {
        showToast(
          "Stock Insuficiente",
          "error",
          `Stock de ${line.material} es ${stock} kg. No puedes despachar ${line.weightKg} kg.`
        );
        return;
      }
    }

    const totalKg = validLines.reduce((acc, l) => acc + l.weightKg, 0);
    const buyer = b2bCompanies.find((c: any) => c.id === directBuyerId);
    setWeb3Payload({
      type: "DIRECT",
      buyerName: buyer?.name || buyer?.email || "Empresa B2B",
      totalKg,
    });
    setIsWeb3ConfirmOpen(true);
  };

  const handleExecuteWeb3Action = () => {
    if (!web3Payload) return;

    if (web3Payload.type === "ACCEPT" && acceptingTransfer) {
      const validLines = actualLines.filter((l) => Number(l.weightKg) > 0);
      acceptMutation.mutate({
        id: acceptingTransfer.id,
        data: {
          actualMaterials: validLines,
          notes: dispatchNote.trim() || undefined,
        },
      });
    } else if (web3Payload.type === "DIRECT") {
      const validLines = directLines.filter((l) => Number(l.weightKg) > 0);
      directDispatchMutation.mutate({
        buyerId: directBuyerId,
        materials: validLines,
        notes: directNotes,
      });
    }
  };

  const totalStockKg = inventory.reduce((a: number, c: any) => a + Number(c.quantityKg || 0), 0);

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
            <Clock size={12} /> Solicitud Entrante B2B
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
            <Truck size={12} /> Despachado (Por Recibir)
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
        eyebrow="Comercialización circular B2B"
        title="Despachos Industriales y Subastas"
        description="Recepción de pedidos de empresas recicladoras, pesaje real en báscula, descuento atómico de stock y emisión de trazabilidad."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (b2bCompanies.length > 0 && !directBuyerId) {
                  setDirectBuyerId(b2bCompanies[0].id);
                }
                setIsDirectModalOpen(true);
              }}
              className="btn primary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowUpRight size={14} />
              <span>Nuevo Despacho Directo</span>
            </button>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["inventory"] });
                refetchTransfers();
              }}
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
          label="STOCK FÍSICO TOTAL"
          value={kg(totalStockKg)}
          trend="Disponible en báscula"
          accent="var(--green)"
        />
        <Kpi
          label="EMPRESAS CONECTADAS"
          value={String(b2bCompanies.length)}
          trend="Compradores homologados"
          accent="var(--blue)"
        />
        <Kpi
          label="OPERACIONES B2B"
          value={String(totalTransfers)}
          trend="3 estados de trazabilidad"
        />
        <Kpi
          label="CERTIFICACIÓN ESG"
          value="STELLAR ON-CHAIN"
          trend="Custodia inmutable"
          accent="var(--purple, #8b5cf6)"
        />
      </div>

      {/* Subastas Panel */}
      <div style={{ marginBottom: 28 }}>
        <AcopioSubastasPanel centerId={user?.id || ""} />
      </div>

      {/* Pestañas de Filtro de Despachos */}
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
            setActiveTab("REQUESTED");
            setPage(1);
          }}
          className={`btn ${activeTab === "REQUESTED" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          1. Solicitudes Entrantes B2B
        </button>
        <button
          onClick={() => {
            setActiveTab("ACCEPTED");
            setPage(1);
          }}
          className={`btn ${activeTab === "ACCEPTED" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          2. Despachados (Esperando Recepción)
        </button>
        <button
          onClick={() => {
            setActiveTab("DELIVERED");
            setPage(1);
          }}
          className={`btn ${activeTab === "DELIVERED" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          3. Entregados y Certificados
        </button>
        <button
          onClick={() => {
            setActiveTab("ALL");
            setPage(1);
          }}
          className={`btn ${activeTab === "ALL" ? "primary" : "secondary"}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          Ver Todos
        </button>
      </div>

      {/* Tabla de Operaciones */}
      <ViewStatesContainer
        isLoading={loadingTransfers}
        error={isTransfersError ? (transfersError as any)?.message || "Error al cargar despachos" : null}
        isEmpty={!loadingTransfers && !isTransfersError && transfersList.length === 0}
        onRetry={() => refetchTransfers()}
        skeleton={<TableSkeleton rows={5} columns={6} />}
        emptyTitle={
          activeTab === "REQUESTED"
            ? "Sin Solicitudes Entrantes"
            : "Sin Despachos en Esta Sección"
        }
        emptyDescription={
          activeTab === "REQUESTED"
            ? "No tienes pedidos de compra pendientes emitidos por empresas B2B en este momento."
            : "No hay registros que coincidan con la vista seleccionada."
        }
        emptyActionLabel="Actualizar Lista"
        onEmptyAction={() => refetchTransfers()}
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
              Operaciones B2B ({totalTransfers})
            </h2>
            <span className="live">Trazabilidad Stellar</span>
          </div>
          <div className="table-wrap">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--panel2, #f8fafc)", borderBottom: "1px solid var(--line, #cbd5e1)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>ID Pedido</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Fecha</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Empresa Compradora</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Materiales Solicitados / Despachados</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transfersList.map((t: any) => {
                  const reqMaterials = t.requestedMaterials || {};
                  const actMaterials = t.materials || {};
                  const isRequested = t.status === "REQUESTED";
                  const isAccepted = t.status === "ACCEPTED";
                  const isDelivered = t.status === "DELIVERED";

                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--line, #cbd5e1)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        <span className="mono">#{t.id.slice(0, 8)}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--muted, #64748b)" }}>
                        {date(t.createdAt)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{t.buyer?.name || t.buyer?.email}</div>
                        <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                          {t.buyer?.email}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {isRequested ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text, #0f172a)" }}>
                              {Object.entries(reqMaterials)
                                .map(([m, w]) => `${m}: ${kg(Number(w))}`)
                                .join(", ")}
                            </div>
                            {t.notes && (
                              <div style={{ fontSize: 11, color: "var(--blue, #2563eb)", marginTop: 2 }}>
                                Nota B2B: {t.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--green, #059669)" }}>
                              {Object.entries(actMaterials)
                                .map(([m, w]) => `${m}: ${kg(Number(w))}`)
                                .join(", ")}
                            </div>
                            {t.notes && (
                              <div style={{ fontSize: 11, color: "var(--muted, #64748b)", marginTop: 2 }}>
                                {t.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>{renderStatusBadge(t.status)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        {isRequested && (
                          <button
                            onClick={() => handleOpenAcceptModal(t)}
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
                            <span>Cerrar Trato y Despachar</span>
                          </button>
                        )}
                        {isAccepted && (
                          <span style={{ fontSize: 11, color: "var(--blue, #2563eb)", fontWeight: 600 }}>
                            Esperando confirmación en planta
                          </span>
                        )}
                        {isDelivered && (
                          <span style={{ fontSize: 11, color: "var(--green, #059669)", fontWeight: 600 }}>
                            Recepción confirmada con conformidad
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
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalTransfers} despachos)
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

      {/* Modal: Cerrar Trato y Despachar Pedido B2B Entrante */}
      {acceptingTransfer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--panel, #ffffff)",
              border: "1px solid var(--line, #cbd5e1)",
              borderRadius: 20,
              padding: 26,
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(16, 185, 129, 0.12)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Warehouse size={20} style={{ color: "#059669" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                    Cerrar Trato y Despachar Lote
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                    Empresa: <strong>{acceptingTransfer.buyer?.name || acceptingTransfer.buyer?.email}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAcceptingTransfer(null)}
                style={{
                  background: "var(--bg, #f1f5f9)",
                  border: "none",
                  color: "var(--muted, #64748b)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleValidateAndOpenAcceptWeb3} style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  padding: 12,
                  background: "rgba(37, 99, 235, 0.06)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "var(--text, #0f172a)",
                }}
              >
                Ingresa los <strong>kg reales pesados en báscula</strong> que saldrán en el transporte. El sistema descontará atómicamente estas cantidades de tu inventario local.
              </div>

              {/* Materiales y Pesos Reales */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  Pesos Reales a Despachar
                </label>
                <div style={{ display: "grid", gap: 10 }}>
                  {actualLines.map((line, idx) => {
                    const invItem = inventory.find(
                      (i: any) =>
                        i.materialType?.toUpperCase() === line.material.toUpperCase() ||
                        (line.material === "CARTON" && i.materialType?.toUpperCase() === "CARTÓN")
                    );
                    const stock = invItem ? Number(invItem.quantityKg) : 0;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1fr",
                          gap: 10,
                          alignItems: "center",
                          background: "var(--bg, #f8fafc)",
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--line, #e2e8f0)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {line.material}
                          </div>
                          <span style={{ fontSize: 10, color: "var(--muted, #64748b)" }}>
                            Stock disponible: {stock.toFixed(1)} kg
                          </span>
                        </div>
                        <div>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            placeholder="Kg pesados"
                            value={line.weightKg || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setActualLines((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], weightKg: val };
                                return copy;
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--line, #cbd5e1)",
                              background: "var(--panel, #ffffff)",
                              color: "var(--text, #0f172a)",
                              fontSize: 13,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guía de Remisión / Notas */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Guía de Remisión / Datos del Transporte
                </label>
                <input
                  type="text"
                  placeholder="Ej: Guía GR-001-9842, Chofer Carlos Gómez, Placa ABC-123"
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    color: "var(--text, #0f172a)",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setAcceptingTransfer(null)}
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Proceder a Firma On-Chain</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Despacho Directo */}
      {isDirectModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--panel, #ffffff)",
              border: "1px solid var(--line, #cbd5e1)",
              borderRadius: 20,
              padding: 26,
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(16, 185, 129, 0.12)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Factory size={20} style={{ color: "#059669" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                    Despacho Directo a Empresa B2B
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                    Salida física y traslado de material
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDirectModalOpen(false)}
                style={{
                  background: "var(--bg, #f1f5f9)",
                  border: "none",
                  color: "var(--muted, #64748b)",
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleValidateAndOpenDirectWeb3} style={{ display: "grid", gap: 16 }}>
              {/* Comprador */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Empresa B2B Destino
                </label>
                {b2bCompanies.length === 0 ? (
                  <div style={{ padding: 10, background: "rgba(239, 68, 68, 0.08)", borderRadius: 10, fontSize: 12, color: "#dc2626" }}>
                    No hay empresas B2B registradas para despachar.
                  </div>
                ) : (
                  <select
                    value={directBuyerId}
                    onChange={(e) => setDirectBuyerId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--line, #cbd5e1)",
                      background: "var(--bg, #f8fafc)",
                      fontSize: 13,
                    }}
                  >
                    {b2bCompanies.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.email} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Líneas */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>
                    Líneas de Despacho
                  </label>
                  <button
                    type="button"
                    onClick={() => setDirectLines((prev) => [...prev, { material: "HDPE", weightKg: 0 }])}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--green, #059669)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={14} /> Añadir material
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {directLines.map((line, idx) => {
                    const invItem = inventory.find(
                      (i: any) =>
                        i.materialType?.toUpperCase() === line.material.toUpperCase() ||
                        (line.material === "CARTON" && i.materialType?.toUpperCase() === "CARTÓN")
                    );
                    const stock = invItem ? Number(invItem.quantityKg) : 0;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1fr auto",
                          gap: 10,
                          alignItems: "center",
                          background: "var(--bg, #f8fafc)",
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--line, #e2e8f0)",
                        }}
                      >
                        <div>
                          <select
                            value={line.material}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDirectLines((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], material: val };
                                return copy;
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--line, #cbd5e1)",
                              fontSize: 12,
                            }}
                          >
                            <option value="PET">Plástico PET</option>
                            <option value="HDPE">Plástico HDPE</option>
                            <option value="CARTON">Cartón / Papel</option>
                            <option value="VIDRIO">Vidrio</option>
                            <option value="ALUMINIO">Aluminio</option>
                            <option value="TETRAPAK">Tetra Pak</option>
                          </select>
                          <span style={{ fontSize: 10, color: "var(--muted, #64748b)", display: "block", marginTop: 2 }}>
                            Stock: {stock.toFixed(1)} kg
                          </span>
                        </div>
                        <div>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="Kg a transferir"
                            value={line.weightKg || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setDirectLines((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], weightKg: val };
                                return copy;
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--line, #cbd5e1)",
                              fontSize: 12,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (directLines.length > 1) {
                              setDirectLines((prev) => prev.filter((_, i) => i !== idx));
                            }
                          }}
                          disabled={directLines.length === 1}
                          style={{
                            background: "none",
                            border: "none",
                            color: directLines.length === 1 ? "var(--line, #cbd5e1)" : "#ef4444",
                            cursor: directLines.length === 1 ? "not-allowed" : "pointer",
                            padding: 4,
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Guía de Remisión / Notas Adicionales
                </label>
                <input
                  type="text"
                  placeholder="Ej: Guía GR-001-9842, precintos intactos"
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsDirectModalOpen(false)}
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Proceder a Firma On-Chain</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Web3 Confirmation Modal */}
      {web3Payload && (
        <Web3ConfirmModal
          isOpen={isWeb3ConfirmOpen}
          title={
            web3Payload.type === "ACCEPT"
              ? "Confirmar Despacho y Aceptación On-Chain"
              : "Confirmar Despacho Directo On-Chain"
          }
          tokenAmount={web3Payload.totalKg.toFixed(1)}
          tokenSymbol="KG MATERIAL RECICLADO"
          destinationName={web3Payload.buyerName}
          actionDescription="Descuento atómico de stock en inventario y registro de lote en Stellar"
          warningText="Al confirmar, autorizas a Livora a emitir la orden de transferencia en la blockchain Stellar y descontar el inventario local."
          isLoading={acceptMutation.isPending || directDispatchMutation.isPending}
          onConfirm={handleExecuteWeb3Action}
          onCancel={() => {
            setIsWeb3ConfirmOpen(false);
            setWeb3Payload(null);
          }}
        />
      )}
    </>
  );
}
