"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCollectionRequests, submitAcopioBid, withdrawAcopioBid, claimAutomaticCollection } from "@/lib/api";
import { CollectionRequest, AcopioBid } from "@/lib/types";
import { showToast } from "@/components/ToastNotification";
import { Gavel, CheckCircle2, RefreshCw, MapPin, XCircle } from "lucide-react";

interface AcopioSubastasPanelProps {
  centerId: string;
}

export function AcopioSubastasPanel({ centerId }: AcopioSubastasPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"AUCTION" | "AUTOMATIC">("AUCTION");
  const [biddingReqId, setBiddingReqId] = useState<string | null>(null);

  const { data: requests = [], isLoading, refetch } = useQuery<CollectionRequest[]>({
    queryKey: ["acopioOpenRequests"],
    queryFn: () => fetchCollectionRequests(),
  });

  const submitBidMutation = useMutation({
    mutationFn: ({ requestId }: { requestId: string }) => submitAcopioBid(requestId),
    onSuccess: () => {
      showToast("Propuesta Enviada", "success", "Tu oferta con tarifario vigente fue enviada al Hogar.");
      queryClient.invalidateQueries({ queryKey: ["acopioOpenRequests"] });
      setBiddingReqId(null);
    },
    onError: (err: any) => {
      showToast("Error al ofertar", "error", err?.response?.data?.message || err.message);
      setBiddingReqId(null);
    },
  });

  const withdrawBidMutation = useMutation({
    mutationFn: ({ requestId, bidId }: { requestId: string; bidId?: string }) =>
      withdrawAcopioBid(requestId, bidId),
    onSuccess: () => {
      showToast("Propuesta Retirada", "info", "Has retirado tu oferta de la subasta.");
      queryClient.invalidateQueries({ queryKey: ["acopioOpenRequests"] });
    },
    onError: (err: any) => {
      showToast("Error al retirar propuesta", "error", err?.response?.data?.message || err.message);
    },
  });

  const claimAutoMutation = useMutation({
    mutationFn: (requestId: string) => claimAutomaticCollection(requestId),
    onSuccess: () => {
      showToast("Solicitud Asignada", "success", "Has tomado la solicitud con tu tarifario registrado.");
      queryClient.invalidateQueries({ queryKey: ["acopioOpenRequests"] });
    },
    onError: (err: any) => {
      showToast("Error al tomar solicitud", "error", err?.response?.data?.message || err.message);
    },
  });

  const auctionRequests = requests.filter(
    (r) => r.status === "PENDING" && r.assignmentMode === "AUCTION"
  );
  const automaticRequests = requests.filter(
    (r) => r.status === "PENDING" && r.assignmentMode === "AUTOMATIC" && !r.assignedCenterId
  );

  const displayedRequests = activeTab === "AUCTION" ? auctionRequests : automaticRequests;

  return (
    <div className="card tarifario">
      <div className="panel-head">
        <div className="panel-title">
          <div className="panel-icon">
            <Gavel size={18} />
          </div>
          <div>
            <h2>Mercado de Solicitudes y Subastas</h2>
            <p>
              Explora las solicitudes publicadas por hogares para enviar propuestas de tarifas o tomar órdenes automáticas.
            </p>
          </div>
        </div>

        <div className="tabs">
          <button
            onClick={() => setActiveTab("AUCTION")}
            className={activeTab === "AUCTION" ? "active" : undefined}
          >
            Subastas ({auctionRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("AUTOMATIC")}
            className={activeTab === "AUTOMATIC" ? "active" : undefined}
          >
            Asignación Directa ({automaticRequests.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <RefreshCw size={18} className="spin" /> Cargando solicitudes...
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="empty-state">
          No hay solicitudes disponibles en {activeTab === "AUCTION" ? "modo Subasta" : "modo Asignación Directa"} en este momento.
        </div>
      ) : (
        <div className="grid subastas-grid">
          {displayedRequests.map((req) => {
            const items = req.itemsEstimated || {};
            const totalKg = Object.values(items).reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );

            const myBid = (req.bids || []).find((b) => b.centerId === centerId);

            return (
              <div key={req.id} className="request-card">
                <div>
                  <div className="request-top">
                    <span className="request-id">#{req.id.slice(0, 8)}</span>
                    <span className="request-kg">{totalKg.toFixed(1)} kg estimados</span>
                  </div>

                  <div className="request-meta">
                    <MapPin size={13} />
                    <span>{req.household?.name || req.household?.email || "Hogar"}</span>
                  </div>
                  {req.description && (
                    <p className="request-note">&quot;{req.description}&quot;</p>
                  )}

                  <div className="request-materials">
                    {Object.entries(items).map(([mat, wt]) => (
                      <span key={mat}>
                        {mat}: <strong>{wt} kg</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="request-footer">
                  {activeTab === "AUCTION" ? (
                    myBid ? (
                      <>
                        <div className="request-bid-info">
                          <span className="ok">
                            <CheckCircle2 size={14} /> Oferta enviada: S/ {myBid.totalEstimatedPenn.toFixed(2)} PEN
                          </span>
                          <small>Hogar gana: {myBid.totalEstimatedEco.toFixed(2)} ECO</small>
                        </div>
                        <button
                          onClick={() => withdrawBidMutation.mutate({ requestId: req.id, bidId: myBid.id })}
                          disabled={withdrawBidMutation.isPending}
                          className="btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "var(--red)",
                            fontSize: 12,
                          }}
                        >
                          <XCircle size={14} /> Retirar
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          Postula con tu tarifario registrado
                        </span>
                        <button
                          onClick={() => submitBidMutation.mutate({ requestId: req.id })}
                          disabled={submitBidMutation.isPending}
                          className="btn primary"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                        >
                          {submitBidMutation.isPending ? (
                            <RefreshCw size={14} className="spin" />
                          ) : (
                            <Gavel size={14} />
                          )}
                          Enviar Oferta
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>
                        Asignación automática inmediata
                      </span>
                      <button
                        onClick={() => claimAutoMutation.mutate(req.id)}
                        disabled={claimAutoMutation.isPending}
                        className="btn primary"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                      >
                        {claimAutoMutation.isPending ? (
                          <RefreshCw size={14} className="spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Tomar Orden
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
