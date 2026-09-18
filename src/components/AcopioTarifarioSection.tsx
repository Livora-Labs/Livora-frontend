"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCenterPrices, updateCenterPrices } from "@/lib/api";
import { showToast } from "@/components/ToastNotification";
import { DollarSign, Save, RefreshCw } from "lucide-react";

const DEFAULT_MATERIALS = [
  { code: "PET", name: "Plástico PET (Botellas)", defaultPrice: 1.00 },
  { code: "CARTON", name: "Cartón y Papel Kraft", defaultPrice: 0.50 },
  { code: "VIDRIO", name: "Vidrio (Botellas y Frascos)", defaultPrice: 0.30 },
  { code: "PLASTICO", name: "Plástico Rígido (HDPE/PP)", defaultPrice: 1.00 },
  { code: "ALUMINIO", name: "Aluminio y Metales", defaultPrice: 1.50 },
  { code: "TETRAPAK", name: "Tetra Pak", defaultPrice: 0.40 },
  { code: "PAPEL", name: "Papel Mixto y Periódico", defaultPrice: 0.50 },
];

interface AcopioTarifarioSectionProps {
  centerId: string;
}

export function AcopioTarifarioSection({ centerId }: AcopioTarifarioSectionProps) {
  const queryClient = useQueryClient();
  const [rates, setRates] = useState<Record<string, number>>({});

  const { data: priceData, isLoading, refetch } = useQuery({
    queryKey: ["centerPrices", centerId],
    queryFn: () => fetchCenterPrices(centerId),
    enabled: Boolean(centerId),
  });

  useEffect(() => {
    const initial: Record<string, number> = {};
    DEFAULT_MATERIALS.forEach((m) => {
      initial[m.code] = m.defaultPrice;
    });

    if (priceData?.prices && Array.isArray(priceData.prices)) {
      priceData.prices.forEach((p: any) => {
        initial[p.materialType] = p.pricePerKg;
      });
    }

    setRates(initial);
  }, [priceData]);

  const updateMutation = useMutation({
    mutationFn: (pricesList: { materialType: string; pricePerKg: number }[]) =>
      updateCenterPrices(pricesList),
    onSuccess: () => {
      showToast("Tarifario Actualizado", "success", "Tus precios por kg han sido publicados.");
      queryClient.invalidateQueries({ queryKey: ["centerPrices", centerId] });
      queryClient.invalidateQueries({ queryKey: ["allCenterPrices"] });
    },
    onError: (err: any) => {
      showToast("Error al guardar tarifario", "error", err?.response?.data?.message || err.message);
    },
  });

  const handlePriceChange = (code: string, val: number) => {
    const rounded = Number(val.toFixed(2));
    setRates((prev) => ({
      ...prev,
      [code]: rounded,
    }));
  };

  const hasInvalidPrice = Object.values(rates).some((p) => Number(p) < 0.05);

  const handleSave = () => {
    for (const [mat, price] of Object.entries(rates)) {
      if (Number(price) < 0.05) {
        showToast(
          "Tarifa inválida",
          "error",
          `El precio de compra para ${mat} debe ser de al menos 0.05 PEN`
        );
        return;
      }
    }
    const pricesList = Object.entries(rates).map(([materialType, pricePerKg]) => ({
      materialType,
      pricePerKg: Number(Number(pricePerKg).toFixed(2)),
    }));
    updateMutation.mutate(pricesList);
  };

  return (
    <div className="bg-[#0e1a17] border border-[#20332d] shadow-lg rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#20332d]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#142921] border border-[#235843] text-[#55e6a5] rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#f2f7f5]">Tarifario de Compra por kg</h2>
          </div>
          <p className="text-sm text-[#8fa49d] mt-1">
            Configura tus precios en Soles (PEN) por cada material. Estos precios se utilizan para calcular la ganancia del Hogar (40%), el margen del Recolector (50%) y la comisión de Livora (10%).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || hasInvalidPrice}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#55e6a5] hover:bg-[#43cb8f] text-[#06110d] font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {updateMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Tarifario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {DEFAULT_MATERIALS.map((mat) => {
          const currentPrice = rates[mat.code] !== undefined ? rates[mat.code] : mat.defaultPrice;
          const hogarShare = (currentPrice * 0.40).toFixed(2);
          const collectorShare = (currentPrice * 0.50).toFixed(2);
          const livoraShare = (currentPrice * 0.10).toFixed(2);

          return (
            <div
              key={mat.code}
              className="p-4 rounded-xl border border-[#20332d] bg-[#12231e] hover:border-[#3b6656] transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#55e6a5] bg-[#173a2d] border border-[#245b46] px-2 py-0.5 rounded-md">
                    {mat.code}
                  </span>
                  <h4 className="text-sm font-semibold text-[#f2f7f5] mt-1">{mat.name}</h4>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8fa49d] font-medium block mb-1">
                  Precio Total Compra (PEN/kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[#8fa49d]">S/</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={currentPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handlePriceChange(mat.code, parseFloat(e.target.value) || 0)
                    }
                    className={`w-full pl-8 pr-3 py-2 text-sm font-bold text-[#f2f7f5] bg-[#0d1c18] border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      currentPrice < 0.05
                        ? "border-red-500/80 focus:ring-red-500/30"
                        : "border-[#20332d] focus:border-[#55e6a5] focus:ring-[#55e6a5]/20"
                    }`}
                  />
                </div>
                {currentPrice < 0.05 && (
                  <span className="text-[11px] text-[#ff7d7d] font-semibold block mt-1">
                    El precio mínimo aceptado es 0.05 PEN/kg
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#20332d] grid grid-cols-3 gap-1 text-[11px] text-[#8fa49d]">
                <div className="bg-[#0d1c18] p-1.5 rounded-lg border border-[#20332d] text-center">
                  <span className="block text-[10px] text-[#8fa49d]">Hogar (40%)</span>
                  <span className="font-bold text-[#55e6a5]">S/ {hogarShare}</span>
                </div>
                <div className="bg-[#0d1c18] p-1.5 rounded-lg border border-[#20332d] text-center">
                  <span className="block text-[10px] text-[#8fa49d]">Recolector (50%)</span>
                  <span className="font-bold text-[#72a7ff]">S/ {collectorShare}</span>
                </div>
                <div className="bg-[#0d1c18] p-1.5 rounded-lg border border-[#20332d] text-center">
                  <span className="block text-[10px] text-[#8fa49d]">Livora (10%)</span>
                  <span className="font-bold text-[#ffcd70]">S/ {livoraShare}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
