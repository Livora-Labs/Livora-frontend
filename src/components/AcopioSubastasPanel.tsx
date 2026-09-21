"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, submitAcopioBid, withdrawAcopioBid, claimAutomaticCollection } from "@/lib/api";
import { CollectionRequest } from "@/lib/types";
import { showToast } from "@/components/ToastNotification";
import { Gavel, CheckCircle2, RefreshCw, MapPin, XCircle } from "lucide-react";

interface AcopioSubastasPanelProps {
  centerId: string;
}

export function AcopioSubastasPanel({ centerId }: AcopioSubastasPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"AUCTION" | "AUTOMATIC">("AUCTION");
  const [biddingReqId, setBiddingReqId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery<CollectionRequest[]>({
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
    <div className="bg-[#0e1a17] border border-[#20332d] shadow-lg rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#20332d]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#17253b] border border-[#23406b] text-[#72a7ff] rounded-xl">
              <Gavel className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#f2f7f5]">Mercado de Solicitudes y Subastas</h2>
          </div>
          <p className="text-sm text-[#8fa49d] mt-1">
            Explora las solicitudes publicadas por hogares para enviar propuestas de tarifas o tomar órdenes automáticas.
          </p>
        </div>

        <div className="flex items-center p-1 bg-[#0d1c18] border border-[#20332d] rounded-xl">
          <button
            onClick={() => setActiveTab("AUCTION")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "AUCTION"
                ? "bg-[#183127] text-[#55e6a5] border border-[#2d5f4c] shadow-sm"
                : "text-[#8fa49d] hover:text-[#f2f7f5]"
            }`}
          >
            Subastas ({auctionRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("AUTOMATIC")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "AUTOMATIC"
                ? "bg-[#183127] text-[#55e6a5] border border-[#2d5f4c] shadow-sm"
                : "text-[#8fa49d] hover:text-[#f2f7f5]"
            }`}
          >
            Asignación Directa ({automaticRequests.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-[#8fa49d]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Cargando solicitudes...
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="py-12 text-center text-[#8fa49d]">
          <p className="text-sm font-medium">
            No hay solicitudes disponibles en {activeTab === "AUCTION" ? "modo Subasta" : "modo Asignación Directa"} en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {displayedRequests.map((req) => {
            const items = req.itemsEstimated || {};
            const totalKg: number = Object.values(items).reduce(
              (sum: number, val: number) => sum + (Number(val) || 0),
              0
            );

            const myBid = (req.bids || []).find((b) => b.centerId === centerId);

            return (
              <div
                key={req.id}
                className="p-5 rounded-xl border border-[#20332d] bg-[#12231e] hover:border-[#3b6656] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#8fa49d] bg-[#172a24] border border-[#20332d] px-2 py-0.5 rounded-md">
                      #{req.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold text-[#55e6a5] bg-[#12392b] border border-[#205e46] px-2.5 py-0.5 rounded-full">
                      {totalKg.toFixed(1)} kg estimados
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#8fa49d]">
                      <MapPin className="w-3.5 h-3.5 text-[#55e6a5]" />
                      <span className="text-[#d8e4df]">{req.household?.name || req.household?.email || "Hogar"}</span>
                    </div>
                    {req.description && (
                      <p className="text-xs text-[#aec2bb] italic mt-1 bg-[#0d1c18] p-2 rounded-lg border border-[#20332d]">
                        &quot;{req.description}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(items).map(([mat, wt]) => (
                      <span
                        key={mat}
                        className="text-[11px] font-medium text-[#8fa49d] bg-[#0d1c18] border border-[#20332d] px-2 py-0.5 rounded-md"
                      >
                        {mat}: <strong className="text-[#f2f7f5]">{wt} kg</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#20332d] flex items-center justify-between">
                  {activeTab === "AUCTION" ? (
                    myBid ? (
                      <div className="w-full flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-[#55e6a5] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Oferta enviada: S/ {myBid.totalEstimatedPenn.toFixed(2)} PEN
                          </span>
                          <span className="text-[11px] text-[#8fa49d] block">
                            Hogar gana: {myBid.totalEstimatedEco.toFixed(2)} LIVO
                          </span>
                        </div>
                        <button
                          onClick={() => withdrawBidMutation.mutate({ requestId: req.id, bidId: myBid.id })}
                          disabled={withdrawBidMutation.isPending}
                          className="text-xs text-[#ff7d7d] hover:text-red-300 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-900/50 bg-red-950/20 hover:bg-red-950/40 transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Retirar
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-[#8fa49d]">Postula con tu tarifario registrado</span>
                        <button
                          onClick={() => {
                            setBiddingReqId(req.id);
                            submitBidMutation.mutate({ requestId: req.id });
                          }}
                          disabled={submitBidMutation.isPending}
                          className="px-4 py-1.5 bg-[#55e6a5] hover:bg-[#43cb8f] text-[#06110d] text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {submitBidMutation.isPending && biddingReqId === req.id ? (
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
                      <span className="text-xs text-[#8fa49d]">Asignación automática inmediata</span>
                      <button
                        onClick={() => claimAutoMutation.mutate(req.id)}
                        disabled={claimAutoMutation.isPending}
                        className="px-4 py-1.5 bg-[#55e6a5] hover:bg-[#43cb8f] text-[#06110d] text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
