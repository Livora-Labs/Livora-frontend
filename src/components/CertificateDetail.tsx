"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Certificate } from "@/lib/types";
import { PageHead, Status } from "./Shell";
import { fetchSales } from "@/lib/api";
import { Check, ExternalLink } from "lucide-react";

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

  const stellarTx = certificate.sorobanTxHash || certificate.stellarTxHash || certificate.txHash;
  const ipfsHash = certificate.ipfsHash || (certificate as any).ipfsCid;

  return (
    <>
      <PageHead
        eyebrow="Pasaporte de Impacto Ambiental"
        title={`Certificado #${shortId(certificate.id)}`}
        description="Constancia técnica verificable de mitigación ambiental y recuperación de materiales en la red Stellar."
        action={<Status value={certificate.status} />}
      />

      {/* Tarjetas Superiores de Indicadores de Mitigación */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Material Recuperado
          </span>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--green)", marginTop: 6 }}>
            {certificate.esgImpact?.recycledKg ? kg(certificate.esgImpact.recycledKg) : "0 kg"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 4 }}>
            {certificate.esgImpact?.recycledMaterial || "PET Industrial"}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Huella de Carbono Evitada
          </span>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--blue)", marginTop: 6 }}>
            {certificate.esgImpact?.co2SavedKg ? kg(certificate.esgImpact.co2SavedKg) : "0 kg"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Equivalente EPA para reciclaje de polímeros
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Agua Preservada
          </span>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", marginTop: 6 }}>
            {certificate.esgImpact?.waterSavedLiters ? certificate.esgImpact.waterSavedLiters.toLocaleString("es-PE") : "0"} L
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Ahorro hídrico en proceso de transformación
          </div>
        </div>
      </div>

      {/* Grid de Detalle: Ficha Legal B2B y Notarización Blockchain */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Titularidad y Cadena de Suministro</h2>
            <span className="live">Auditado</span>
          </div>
          <div className="data-list">
            <div className="data-row">
              <span>ID Certificado</span>
              <strong className="mono">{certificate.id}</strong>
            </div>
            <div className="data-row">
              <span>Empresa Beneficiaria</span>
              <strong>{(certificate as any).buyer?.name || (certificate as any).buyer?.email || "Empresa Asociada B2B"}</strong>
            </div>
            <div className="data-row">
              <span>Fecha de Emisión</span>
              <strong>{date(certificate.createdAt)}</strong>
            </div>
            <div className="data-row">
              <span>Transacción Comercial</span>
              <strong className="mono">#{shortId(certificate.saleId)}</strong>
            </div>
            <div className="data-row">
              <span>Centro de Acopio Origen</span>
              <strong>{sale?.center?.email || "Centro de Acopio Formalizado"}</strong>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Evidencia Criptográfica Inmutable</h2>
            <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Check size={13} /> On-Chain
            </span>
          </div>
          <div className="data-list">
            <div className="data-row">
              <span>Protocolo Ledger</span>
              <strong>Stellar Soroban Smart Contract</strong>
            </div>
            <div className="data-row">
              <span>Transacción On-Chain</span>
              {stellarTx ? (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${stellarTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  {shortId(stellarTx)} <ExternalLink size={12} />
                </a>
              ) : (
                <span className="muted">Pendiente de confirmación</span>
              )}
            </div>
            <div className="data-row">
              <span>Manifiesto IPFS (CID)</span>
              {ipfsHash ? (
                <a
                  href={`https://ipfs.io/ipfs/${ipfsHash.replace("ipfs://", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  {shortId(ipfsHash.replace("ipfs://", ""))} <ExternalLink size={12} />
                </a>
              ) : (
                <span className="muted">Pendiente de anclaje</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            {ipfsHash && (
              <a
                className="btn secondary"
                href={`https://ipfs.io/ipfs/${ipfsHash.replace("ipfs://", "")}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, flex: 1, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                Auditar Manifiesto IPFS <ExternalLink size={12} />
              </a>
            )}
            {stellarTx && (
              <a
                className="btn primary"
                href={`https://stellar.expert/explorer/testnet/tx/${stellarTx}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, flex: 1, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                Ver en Stellar Expert <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href={admin ? "/admin/certificates" : "/company/certificates"} className="btn secondary" style={{ fontSize: 13 }}>
          ← Volver a Certificados
        </Link>
      </div>
    </>
  );
}
