"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Certificate } from "@/lib/types";
import { PageHead, Status } from "./Shell";
import { fetchSales } from "@/lib/api";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export function CertificateDetail({ certificate, admin = false }: { certificate: Certificate; admin?: boolean }) {
  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
    enabled: Boolean(certificate.saleId),
  });

  const sale = sales.find((x: any) => x.id === certificate.saleId);

  return (
    <>
      <PageHead
        eyebrow="Certificado de impacto"
        title={`Certificado #${shortId(certificate.id)}`}
        description="Constancia ambiental verificable emitida sobre material recuperado."
        action={<Status value={certificate.status} />}
      />
      <div className="grid detail-grid">
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="hero-art" style={{ height: 440 }} />
          <div style={{ padding: 20 }}>
            <span className="eyebrow">Activo ambiental</span>
            <h2>{certificate.esgImpact?.recycledMaterial}</h2>
            <p className="muted">Emitido por Livora · {date(certificate.createdAt)}</p>
          </div>
        </section>

        <section>
          <div className="card detail-panel">
            <span className="eyebrow">Impacto certificado</span>
            <h1>{certificate.esgImpact?.recycledKg ? kg(certificate.esgImpact.recycledKg) : "0 kg"} recuperados</h1>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", margin: "20px 0" }}>
              <div className="card">
                <div className="kpi-label">CO₂ EVITADO</div>
                <div className="kpi-value" style={{ fontSize: 24 }}>
                  {certificate.esgImpact?.co2SavedKg ? kg(certificate.esgImpact.co2SavedKg) : "0 kg"}
                </div>
              </div>
              <div className="card">
                <div className="kpi-label">AGUA AHORRADA</div>
                <div className="kpi-value" style={{ fontSize: 24 }}>
                  {certificate.esgImpact?.waterSavedLiters ? certificate.esgImpact.waterSavedLiters.toLocaleString("es-PE") : "0"} L
                </div>
              </div>
            </div>
            <div className="data-row">
              <span>Material</span>
              <strong>{certificate.esgImpact?.recycledMaterial}</strong>
            </div>
            <div className="data-row">
              <span>Beneficiario</span>
              <strong>{(certificate as any).buyer?.name || (certificate as any).buyer?.email || "Empresa Asociada B2B"}</strong>
            </div>
            <div className="data-row">
              <span>Venta de origen</span>
              <strong className="mono">#{shortId(certificate.saleId)}</strong>
            </div>
            <div className="data-row">
              <span>Centro de acopio</span>
              <strong>{sale?.center?.email || "Centro de Acopio"}</strong>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">
              <h2>Verificación inmutable</h2>
              <span className="live">On-chain</span>
            </div>
            <div className="data-row">
              <span>IPFS CID</span>
              <strong className="mono">{shortId(certificate.ipfsHash)}</strong>
            </div>
            <div className="data-row">
              <span>Transacción</span>
              <strong className="mono">{shortId(certificate.txHash)}</strong>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <a className="btn" href={`https://ipfs.io/ipfs/${certificate.ipfsHash.replace("ipfs://", "")}`} target="_blank" rel="noreferrer">
                Metadata IPFS ↗
              </a>
              <a className="btn primary" href={`https://stellar.expert/explorer/testnet/tx/${certificate.txHash}`} target="_blank" rel="noreferrer">
                Ver recibo digital ↗
              </a>
            </div>
          </div>
        </section>
      </div>
      <Link href={admin ? "/admin/certificates" : "/company/certificates"} className="btn" style={{ display: "inline-block", marginTop: 18 }}>
        ← Volver a certificados
      </Link>
    </>
  );
}
