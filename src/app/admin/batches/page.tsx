"use client";

import React, { useState, useEffect } from "react";
import { PageHead } from "@/components/Shell";
import { BatchCard } from "@/components/Assets";
import { fetchBatches } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

function BatchesSkeleton() {
  return (
    <div className="grid collection-grid">
      {[1, 2, 3].map((x) => (
        <div key={x} className="card asset-card animate-pulse" style={{ height: 180, background: "#112240", border: "1px solid #1E293B", borderRadius: 12, padding: 0 }}>
          <div style={{ height: 80, background: "rgba(30, 41, 59, 0.4)", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
          <div style={{ padding: 16 }}>
            <div style={{ height: 16, width: "60%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 12, width: "40%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Batches() {
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await fetchBatches();
      setBatchesList(data || []);
    } catch (err: any) {
      showToast("Error al cargar lotes", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Activos trazables"
        title="Explorador de lotes"
        description="Sigue cada lote desde la recolección hasta su registro verificable en la blockchain."
        action={
          <button onClick={loadBatches} className="btn secondary">
            Refrescar ↻
          </button>
        }
      />
      <div className="toolbar">
        <div className="search">
          <input placeholder="Buscar por ID, recolector o centro..." disabled />
        </div>
        <select defaultValue="all" disabled>
          <option value="all">Todos los estados</option>
        </select>
        <select disabled>
          <option>Más recientes</option>
        </select>
      </div>

      <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
        {loading ? "Cargando lotes..." : `${batchesList.length} lotes encontrados`}
      </p>

      {loading ? (
        <BatchesSkeleton />
      ) : batchesList.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <h3>Sin Lotes Registrados</h3>
          <p className="muted" style={{ fontSize: 13, maxWidth: 300, margin: "6px auto 0" }}>
            No se encontraron lotes activos en el sistema actualmente.
          </p>
        </div>
      ) : (
        <div className="grid collection-grid">
          {batchesList.map((b) => (
            <BatchCard batch={b} key={b.id} />
          ))}
        </div>
      )}
    </>
  );
}
