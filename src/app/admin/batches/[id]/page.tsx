"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHead, Status } from "@/components/Shell";
import { fetchBatchById } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

// Local formatting helpers to avoid importing lib/data
const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export default function Detail() {
  const params = useParams();
  const id = params?.id as string;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBatch();
    }
  }, [id]);

  const loadBatch = async () => {
    setLoading(true);
    try {
      const data = await fetchBatchById(id);
      setBatch(data);
    } catch (err: any) {
      showToast("Error al cargar detalle del lote", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "#94A3B8" }}>
        Cargando detalle del lote...
      </div>
    );
  }

  if (!batch) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <p style={{ color: "#94A3B8" }}>Lote no encontrado.</p>
        <Link href="/admin/batches" className="btn" style={{ marginTop: 18 }}>
          ← Volver al explorador
        </Link>
      </div>
    );
  }

  const weight = Object.values(batch.materialsActual || {}).reduce((a: any, c: any) => a + Number(c), 0) as number;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Lote verificable"
        title={`Lote #${shortId(batch.id)}`}
        description="Registro de origen, composición y validación del material."
        action={<Status value={batch.status} />}
      />
      <div className="grid detail-grid">
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="hero-art" />
          <div style={{ padding: 20 }}>
            <div className="section-title">
              <h2>Composición</h2>
              <strong>{weight ? kg(weight) : "Por pesar"}</strong>
            </div>
            {Object.entries(batch.materialsActual || {}).map(([m, v]: any) => (
              <div className="data-row" key={m}>
                <span>{m}</span>
                <strong>{kg(v)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-panel">
          <div className="card">
            <span className="eyebrow">Identidad del activo</span>
            <h1>{Object.keys(batch.materialsActual || {}).join(" + ") || "Lote en tránsito"}</h1>
            <div className="chips">
              <span className="chip">◈ {batch.requests?.length || 0} recolecciones</span>
              <span className="chip">✓ Origen verificado</span>
              <span className="chip">Red de Trazabilidad Digital</span>
            </div>
            <div className="data-list">
              <div className="data-row">
                <span>ID del lote</span>
                <strong className="mono">{batch.id}</strong>
              </div>
              <div className="data-row">
                <span>Recolector</span>
                <strong>{batch.collector?.email || "—"}</strong>
              </div>
              <div className="data-row">
                <span>Centro de destino</span>
                <strong>{batch.destinationCenter?.email || "Pendiente"}</strong>
              </div>
              <div className="data-row">
                <span>Creado</span>
                <strong>{date(batch.createdAt)}</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">
              <h2>Cadena de custodia</h2>
              <span className="live">Verificada</span>
            </div>
            <div className="trace">
              {["Creado", "Recolectado", "En tránsito", "Pesado", "Registrado"].map((x, i) => (
                <div className="trace-step" key={x}>
                  <strong>{x}</strong>
                  <span>{i < 4 ? date(batch.updatedAt) : batch.txHash ? "On-chain" : "Pendiente"}</span>
                </div>
              ))}
            </div>
          </div>

          {batch.txHash && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="section-title">
                <h2>Prueba blockchain</h2>
                <span style={{ color: "var(--green)" }}>✓ Confirmada</span>
              </div>
              <div className="data-row">
                <span>IPFS CID</span>
                <strong className="mono">{shortId(batch.ipfsCid)}</strong>
              </div>
              <div className="data-row">
                <span>Transacción</span>
                <strong className="mono">{shortId(batch.txHash)}</strong>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <a className="btn" href={`https://ipfs.io/ipfs/${batch.ipfsCid}`} target="_blank" rel="noreferrer">
                  Ver manifiesto ↗
                </a>
                <a className="btn primary" href={`https://stellar.expert/explorer/testnet/tx/${batch.txHash}`} target="_blank" rel="noreferrer">
                  Ver recibo digital ↗
                </a>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">
              <h2>Evidencias de recolección</h2>
              <span className="muted">{batch.requests?.length || 0} registros</span>
            </div>
            {batch.requests?.length ? (
              batch.requests.map((r: any) => (
                <div className="network-row" key={r.id}>
                  <div>
                    <strong>{r.description}</strong>
                    <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>
                      {r.latitude}, {r.longitude} · Hogar #{r.householdId?.slice(0, 6)}
                    </div>
                  </div>
                  <Status value={r.status} />
                </div>
              ))
            ) : (
              <p className="muted">Las evidencias originales pertenecen al lote consolidado.</p>
            )}
          </div>
        </section>
      </div>
      <Link href="/admin/batches" className="btn" style={{ display: "inline-block", marginTop: 18 }}>
        ← Volver al explorador
      </Link>
    </>
  );
}
