"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shell, PageHead, Status } from "@/components/Shell";
import { fetchCertificates, fetchSales, fetchBatches } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export default function Page() {
  const [cert, setCert] = useState<any>(null);
  const [sale, setSale] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraceability();
  }, []);

  const loadTraceability = async () => {
    setLoading(true);
    try {
      const [certsData, salesData, batchesData] = await Promise.all([
        fetchCertificates(),
        fetchSales(),
        fetchBatches()
      ]);

      if (certsData && certsData.length > 0) {
        setCert(certsData[0]);
      }
      if (salesData && salesData.length > 0) {
        setSale(salesData[0]);
      }
      if (batchesData && batchesData.length > 0) {
        // Find a batch that belongs to this center or has actual materials
        const processedBatch = batchesData.find((b: any) => b.status === "RECEIVED" || b.txHash) || batchesData[0];
        setBatch(processedBatch);
      }
    } catch (err: any) {
      showToast("Error al cargar trazabilidad", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasData = cert && sale && batch;

  return (
    <Shell role="company">
      <ToastContainer />
      <PageHead
        eyebrow="Cadena de custodia"
        title="Trazabilidad de punta a punta"
        description="Comprueba cómo una compra se conecta con el material, sus recolectores y evidencias de origen."
      />

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8" }}>
          Reconstruyendo cadena de trazabilidad digital...
        </div>
      ) : !hasData ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <h3>Sin Historial de Trazabilidad</h3>
          <p className="muted" style={{ maxWidth: 460, margin: "8px auto 20px", fontSize: 13, lineHeight: 1.6 }}>
            Aún no has adquirido materiales a los centros de acopio o no se han emitido certificados ESG para tu cuenta. Visita la sección de compras para ver tus transacciones en curso.
          </p>
          <Link href="/company/purchases" className="btn primary">
            Ver mis compras
          </Link>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="section-title">
              <h2>Ruta de trazabilidad activa</h2>
              <span className="live">Cadena íntegra</span>
            </div>
            <div className="trace" style={{ margin: "22px 0 10px" }}>
              {["Certificado ESG", "Compra B2B", "Lote de origen", "Evidencias"].map((x, i) => (
                <div className="trace-step" key={x}>
                  <strong>{x}</strong>
                  <span>Paso {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid" style={{ gap: 12, marginTop: 16 }}>
            <Link href={`/company/certificates/${cert.id}`} className="card network-row">
              <div>
                <span className="eyebrow">1 · Certificado ESG</span>
                <h3>
                  {cert.esgImpact?.recycledMaterial || "PET"} ·{" "}
                  {cert.esgImpact?.recycledKg ? kg(cert.esgImpact.recycledKg) : "0 kg"}
                </h3>
                <span className="mono">#{shortId(cert.id)}</span>
              </div>
              <Status value={cert.status} />
            </Link>

            <div className="card network-row">
              <div>
                <span className="eyebrow">2 · Compra corporativa</span>
                <h3>{sale.center?.email || "Centro de Acopio"}</h3>
                <span className="muted">
                  {date(sale.createdAt)} · {kg(sale.weightKg)}
                </span>
              </div>
              <span style={{ color: "var(--green)", fontWeight: 700 }}>✓ Formalizada</span>
            </div>

            <div className="card network-row">
              <div>
                <span className="eyebrow">3 · Lote de origen consolidado</span>
                <h3>
                  {Object.keys(batch.materialsActual || {}).join(" + ") || "PET"}
                </h3>
                <span className="muted">Recolector de base: {batch.collector?.email || "—"}</span>
              </div>
              <Status value={batch.status} />
            </div>

            <div className="card">
              <span className="eyebrow">4 · Evidencia y registros</span>
              <h3>{batch.requests?.length || 1} recolecciones participantes</h3>
              <p className="muted" style={{ fontSize: 12, margin: "8px 0 16px" }}>
                Las solicitudes originales se vinculan al lote y preservan ubicación, material estimado y firma digital.
              </p>
              <div className="data-row">
                <span>Manifiesto IPFS CID</span>
                <strong className="mono">{shortId(batch.ipfsCid || "—")}</strong>
              </div>
              <div className="data-row">
                <span>Registro Blockchain (Stellar)</span>
                <strong className="mono">{shortId(batch.txHash || "—")}</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
