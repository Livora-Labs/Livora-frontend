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
    <div className="card tarifario">
      <div className="panel-head">
        <div className="panel-title">
          <div className="panel-icon">
            <DollarSign size={18} />
          </div>
          <div>
            <h2>Tarifario de Compra por kg</h2>
            <p>
              Configura tus precios en Soles (PEN) por cada material. Estos precios se utilizan para calcular la ganancia del Hogar (40%), el margen del Recolector (50%) y la comisión de Livora (10%).
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || hasInvalidPrice}
          className="btn primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
        >
          {updateMutation.isPending ? (
            <RefreshCw size={16} className="spin" />
          ) : (
            <Save size={16} />
          )}
          Guardar Tarifario
        </button>
      </div>

      <div className="grid tarifario-grid">
        {DEFAULT_MATERIALS.map((mat) => {
          const currentPrice = rates[mat.code] !== undefined ? rates[mat.code] : mat.defaultPrice;
          const isInvalid = currentPrice < 0.05;
          const hogarShare = (currentPrice * 0.40).toFixed(2);
          const collectorShare = (currentPrice * 0.50).toFixed(2);
          const livoraShare = (currentPrice * 0.10).toFixed(2);

          return (
            <div key={mat.code} className={`rate-card${isInvalid ? " invalid" : ""}`}>
              <div>
                <span className="chip">{mat.code}</span>
                <h4 className="rate-name">{mat.name}</h4>
              </div>

              <div>
                <label className="rate-label">Precio Total Compra (PEN/kg)</label>
                <div className="rate-input-wrap">
                  <span>S/</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(mat.code, parseFloat(e.target.value) || 0)}
                    className={`rate-input${isInvalid ? " invalid" : ""}`}
                  />
                </div>
                {isInvalid && (
                  <span className="rate-error">El precio mínimo aceptado es 0.05 PEN/kg</span>
                )}
              </div>

              <div className="rate-split">
                <div>
                  <span>Hogar (40%)</span>
                  <strong style={{ color: "var(--green)" }}>S/ {hogarShare}</strong>
                </div>
                <div>
                  <span>Recolector (50%)</span>
                  <strong style={{ color: "var(--blue)" }}>S/ {collectorShare}</strong>
                </div>
                <div>
                  <span>Livora (10%)</span>
                  <strong style={{ color: "var(--muted)" }}>S/ {livoraShare}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
