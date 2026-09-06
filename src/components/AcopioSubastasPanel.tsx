"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, submitAcopioBid, withdrawAcopioBid, claimAutomaticCollection } from "@/lib/api";
import { CollectionRequest, AcopioBid } from "@/lib/types";
import { showToast } from "@/components/ToastNotification";
import { Gavel, CheckCircle2, RefreshCw, MapPin, Scale, ArrowRight, XCircle } from "lucide-react";

interface AcopioSubastasPanelProps {
  centerId: string;
}

export function AcopioSubastasPanel({ centerId }: AcopioSubastasPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"AUCTION" | "AUTOMATIC">("AUCTION");
  const [biddingReqId, setBiddingReqId] = useState<string | null>(null);

  const { data: requests = [], isLoading, refetch } = useQuery<CollectionRequest[]>({
    queryKey: ["acopioOpenRequests"],
    queryFn: async () => {
      const res = await api.get("/collection-requests");
      return res.data;
    },
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
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Gavel className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Mercado de Solicitudes y Subastas</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Explora las solicitudes publicadas por hogares para enviar propuestas de tarifas o tomar órdenes automáticas.
          </p>
        </div>

        <div className="flex items-center p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab("AUCTION")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "AUCTION"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Subastas ({auctionRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("AUTOMATIC")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "AUTOMATIC"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Asignación Directa ({automaticRequests.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Cargando solicitudes...
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm font-medium">
            No hay solicitudes disponibles en {activeTab === "AUCTION" ? "modo Subasta" : "modo Asignación Directa"} en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {displayedRequests.map((req) => {
            const items = req.itemsEstimated || {};
            const totalKg = Object.values(items).reduce(
              (sum, val) => sum + (Number(val) || 0),
              0
            );

            const myBid = (req.bids || []).find((b) => b.centerId === centerId);

            return (
              <div
                key={req.id}
                className="p-5 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-gray-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-md">
                      #{req.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      {totalKg.toFixed(1)} kg estimados
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{req.household?.name || req.household?.email || "Hogar"}</span>
                    </div>
                    {req.description && (
                      <p className="text-xs text-gray-600 italic mt-1 bg-white p-2 rounded-lg border border-gray-100">
                        &quot;{req.description}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(items).map(([mat, wt]) => (
                      <span
                        key={mat}
                        className="text-[11px] font-medium text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md"
                      >
                        {mat}: <strong className="text-gray-900">{wt} kg</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {activeTab === "AUCTION" ? (
                    myBid ? (
                      <div className="w-full flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Oferta enviada: S/ {myBid.totalEstimatedPenn.toFixed(2)} PEN
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            Hogar gana: {myBid.totalEstimatedEco.toFixed(2)} ECO
                          </span>
                        </div>
                        <button
                          onClick={() => withdrawBidMutation.mutate({ requestId: req.id, bidId: myBid.id })}
                          disabled={withdrawBidMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Retirar
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-gray-500">Postula con tu tarifario registrado</span>
                        <button
                          onClick={() => submitBidMutation.mutate({ requestId: req.id })}
                          disabled={submitBidMutation.isPending}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          {submitBidMutation.isPending ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Gavel className="w-3.5 h-3.5" />
                          )}
                          Enviar Oferta
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs text-gray-500">Asignación automática inmediata</span>
                      <button
                        onClick={() => claimAutoMutation.mutate(req.id)}
                        disabled={claimAutoMutation.isPending}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
                      >
                        {claimAutoMutation.isPending ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Tomar Orden
                      </button>
                    </div>
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
