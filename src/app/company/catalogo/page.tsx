"use client";

import React, { useState } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCenterPools, createB2bPurchaseRequest } from "@/lib/api";
import { ViewStatesContainer } from "@/components/ui/view-states-container";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import {
  Warehouse,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface CenterPool {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  reputationScore?: number;
  totalRatings?: number;
  inventory: Array<{
    materialType: string;
    stockKg: number;
    updatedAt: string;
  }>;
  tariffs: Array<{
    materialType: string;
    pricePerKg: number;
  }>;
}

interface RequestLine {
  material: string;
  weightKg: number;
}

const kg = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

export default function CatalogoAcopiosPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<CenterPool | null>(null);
  const [requestLines, setRequestLines] = useState<RequestLine[]>([
    { material: "PET", weightKg: 100 },
  ]);
  const [notes, setNotes] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const {
    data: centers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CenterPool[]>({
    queryKey: ["centerPools"],
    queryFn: fetchCenterPools,
  });

  const purchaseMutation = useMutation({
    mutationFn: createB2bPurchaseRequest,
    onSuccess: () => {
      showToast(
        "Solicitud Emitida con Éxito",
        "success",
        "El Centro de Acopio fue notificado para cerrar el trato y programar el pesaje."
      );
      setSelectedCenter(null);
      setRequestLines([{ material: "PET", weightKg: 100 }]);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["centerPools"] });
      queryClient.invalidateQueries({ queryKey: ["b2bTransfers"] });
    },
    onError: (err: any) => {
      showToast(
        "Error al emitir solicitud",
        "error",
        err.response?.data?.message || err.message
      );
    },
  });

  const filteredCenters = centers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = c.name?.toLowerCase().includes(q);
    const matchAddress = c.address?.toLowerCase().includes(q);
    const matchEmail = c.email?.toLowerCase().includes(q);
    const matchMaterial = c.inventory?.some((inv) =>
      inv.materialType?.toLowerCase().includes(q)
    );
    return matchName || matchAddress || matchEmail || matchMaterial;
  });

  const totalStockInNetwork = centers.reduce((acc, c) => {
    return acc + c.inventory.reduce((sub, inv) => sub + Number(inv.stockKg || 0), 0);
  }, 0);

  const totalPages = Math.max(1, Math.ceil(filteredCenters.length / limit));
  const paginatedCenters = filteredCenters.slice((page - 1) * limit, page * limit);

  const handleOpenModal = (center: CenterPool) => {
    setSelectedCenter(center);
    // Preset default line with available material in that center
    const firstMat = center.inventory.find((i) => i.stockKg > 0)?.materialType || "PET";
    setRequestLines([{ material: firstMat, weightKg: 100 }]);
    setNotes("");
  };

  const handleAddLine = () => {
    setRequestLines((prev) => [...prev, { material: "HDPE", weightKg: 50 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (requestLines.length <= 1) return;
    setRequestLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, field: keyof RequestLine, val: any) => {
    setRequestLines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const calculateEstimatedTotal = () => {
    if (!selectedCenter) return 0;
    return requestLines.reduce((acc, line) => {
      const tariff = selectedCenter.tariffs.find(
        (t) => t.materialType.toUpperCase().trim() === line.material.toUpperCase().trim()
      );
      const rate = tariff ? Number(tariff.pricePerKg) : 0;
      return acc + rate * Number(line.weightKg || 0);
    }, 0);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;

    const validLines = requestLines.filter((l) => Number(l.weightKg) > 0);
    if (validLines.length === 0) {
      showToast("Volumen Inválido", "error", "Ingresa al menos un material con peso mayor a 0 kg.");
      return;
    }

    purchaseMutation.mutate({
      centerId: selectedCenter.id,
      materials: validLines,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Abastecimiento circular industrial"
        title="Catálogo de Centros de Acopio"
        description="Explora el stock físico en tiempo real de los centros formalizados, revisa sus tarifarios y solicita lotes de reciclaje con trazabilidad Stellar."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/company/purchases"
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ShoppingBag size={14} />
              <span>Ver Mis Solicitudes</span>
            </Link>
            <button
              onClick={() => refetch()}
              className="btn secondary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} />
              <span>Refrescar</span>
            </button>
          </div>
        }
      />

      {/* Indicadores Clave */}
      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi
          label="CENTROS DISPONIBLES"
          value={String(centers.length)}
          trend="100% Homologados"
          accent="var(--blue)"
        />
        <Kpi
          label="STOCK EN RED"
          value={kg(totalStockInNetwork)}
          trend="Inventario agregado"
          accent="var(--green)"
        />
        <Kpi
          label="ESTADOS DE COMPRA"
          value="3 ETAPAS"
          trend="Solicitud → Despacho → Recepción"
        />
        <Kpi
          label="CERTIFICACIÓN ESG"
          value="STELLAR ON-CHAIN"
          trend="Inmutable y verificable"
          accent="var(--purple, #8b5cf6)"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="toolbar" style={{ marginBottom: 20 }}>
        <div className="search" style={{ width: "100%", maxWidth: 600, position: "relative" }}>
          <input
            placeholder="Buscar centro por nombre, distrito o material disponible (ej. PET, Cartón)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Contenedor de 4 Estados */}
      <ViewStatesContainer
        isLoading={isLoading}
        error={isError ? (error as any)?.message || "Error al conectar con centros de acopio" : null}
        isEmpty={!isLoading && !isError && filteredCenters.length === 0}
        onRetry={() => refetch()}
        skeleton={<TableSkeleton rows={4} columns={4} />}
        emptyTitle={centers.length === 0 ? "Sin Centros Registrados" : "Sin Resultados"}
        emptyDescription={
          centers.length === 0
            ? "Aún no hay centros de acopio con stock publicado en la red."
            : "No encontramos centros que coincidan con los criterios de búsqueda."
        }
        emptyActionLabel={centers.length === 0 ? "Actualizar" : "Limpiar Filtro"}
        onEmptyAction={() => {
          if (centers.length === 0) refetch();
          else {
            setSearchQuery("");
            setPage(1);
          }
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {paginatedCenters.map((center) => {
            const availableStockKg = center.inventory.reduce(
              (sum, i) => sum + Number(i.stockKg || 0),
              0
            );

            return (
              <div
                key={center.id}
                className="card"
                style={{
                  padding: 20,
                  display: "grid",
                  gap: 16,
                  border: "1px solid var(--line, #cbd5e1)",
                  borderRadius: 16,
                  background: "var(--panel, #ffffff)",
                }}
              >
                {/* Cabecera del Centro */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(16, 185, 129, 0.1)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Warehouse size={22} style={{ color: "#059669" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                        {center.name}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          gap: 14,
                          fontSize: 12,
                          color: "var(--muted, #64748b)",
                          marginTop: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={12} /> {center.address}
                        </span>
                        {center.phone && center.phone !== "-" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Phone size={12} /> {center.phone}
                          </span>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Mail size={12} /> {center.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenModal(center)}
                    className="btn primary"
                    style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <ShoppingBag size={14} />
                    <span>Solicitar Abastecimiento</span>
                  </button>
                </div>

                {/* Pool de Inventario Físico */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--muted, #64748b)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    Stock Físico Disponible (Total: {kg(availableStockKg)})
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {center.inventory.length === 0 ? (
                      <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
                        Inventario en consolidación
                      </span>
                    ) : (
                      center.inventory.map((inv) => {
                        const tariff = center.tariffs.find(
                          (t) =>
                            t.materialType.toUpperCase().trim() ===
                            inv.materialType.toUpperCase().trim()
                        );
                        return (
                          <div
                            key={inv.materialType}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 10,
                              background: "var(--bg, #f8fafc)",
                              border: "1px solid var(--line, #e2e8f0)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 12,
                            }}
                          >
                            <span style={{ fontWeight: 700, color: "var(--text, #0f172a)" }}>
                              {inv.materialType}:
                            </span>
                            <span style={{ color: "var(--green, #059669)", fontWeight: 700 }}>
                              {kg(inv.stockKg)}
                            </span>
                            {tariff && (
                              <span style={{ color: "var(--muted, #64748b)", fontSize: 11 }}>
                                • {money(tariff.pricePerKg)}/kg
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({filteredCenters.length} centros)
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

      {/* Modal de Solicitud de Compra B2B */}
      {selectedCenter && (
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
                    background: "rgba(37, 99, 235, 0.12)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ShoppingBag size={20} style={{ color: "var(--blue, #2563eb)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                    Solicitar Abastecimiento
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                    Proveedor: <strong>{selectedCenter.name}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCenter(null)}
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

            <form onSubmit={handleSubmitRequest} style={{ display: "grid", gap: 16 }}>
              {/* Materiales Solicitados */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 700 }}>
                    Materiales y Cantidades Solicitadas
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
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
                  {requestLines.map((line, idx) => {
                    const inv = selectedCenter.inventory.find(
                      (i) => i.materialType.toUpperCase() === line.material.toUpperCase()
                    );
                    const stock = inv ? Number(inv.stockKg) : 0;
                    const tariff = selectedCenter.tariffs.find(
                      (t) => t.materialType.toUpperCase() === line.material.toUpperCase()
                    );

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
                            onChange={(e) => handleUpdateLine(idx, "material", e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--line, #cbd5e1)",
                              background: "var(--panel, #ffffff)",
                              color: "var(--text, #0f172a)",
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
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--muted, #64748b)",
                              display: "block",
                              marginTop: 2,
                            }}
                          >
                            Stock disponible: {stock.toFixed(1)} kg {tariff && `(${money(tariff.pricePerKg)}/kg)`}
                          </span>
                        </div>
                        <div>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Kg solicitados"
                            value={line.weightKg || ""}
                            onChange={(e) =>
                              handleUpdateLine(idx, "weightKg", parseFloat(e.target.value) || 0)
                            }
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--line, #cbd5e1)",
                              background: "var(--panel, #ffffff)",
                              color: "var(--text, #0f172a)",
                              fontSize: 12,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={requestLines.length === 1}
                          style={{
                            background: "none",
                            border: "none",
                            color: requestLines.length === 1 ? "var(--line, #cbd5e1)" : "#ef4444",
                            cursor: requestLines.length === 1 ? "not-allowed" : "pointer",
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

              {/* Resumen Indicativo */}
              <div
                style={{
                  background: "var(--bg, #f8fafc)",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid var(--line, #e2e8f0)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                    Total Volumen Solicitado
                  </div>
                  <strong style={{ fontSize: 14 }}>
                    {kg(requestLines.reduce((a, b) => a + Number(b.weightKg || 0), 0))}
                  </strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
                    Importe Estimado (Tarifario)
                  </div>
                  <strong style={{ fontSize: 15, color: "var(--green, #059669)" }}>
                    {money(calculateEstimatedTotal())}
                  </strong>
                </div>
              </div>

              {/* Notas de Coordinación */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Notas Operativas / Coordinación de Transporte
                </label>
                <input
                  type="text"
                  placeholder="Ej: Recepción en Planta Ate viernes 10 AM, camión propio con placa ABC-123"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  onClick={() => setSelectedCenter(null)}
                  className="btn secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseMutation.isPending}
                  className="btn primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{purchaseMutation.isPending ? "Emitiendo..." : "Emitir Solicitud B2B"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
