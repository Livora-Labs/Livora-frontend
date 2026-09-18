import Link from "next/link";
import type { Batch, Certificate } from "@/lib/types";
import { Status } from "./Shell";
import { ArrowUpRight, Check } from "lucide-react";

const shortId = (id: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "");
const kg = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) + " kg";
const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export function BatchCard({ batch }: { batch: Batch }) {
  const weight = Object.values(batch.materialsActual || {}).reduce((a, b) => a + Number(b), 0);
  const materialsList = Object.keys(batch.materialsActual || batch.requests?.[0]?.itemsEstimated || {});
  return (
    <Link
      href={`/admin/batches/${batch.id}`}
      className="card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted)", textTransform: "uppercase" }}>
            Lote de Trazabilidad
          </span>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <span>#{shortId(batch.id)}</span>
            <ArrowUpRight size={14} style={{ color: "var(--muted)" }} />
          </div>
        </div>
        <Status value={batch.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px", background: "var(--panel2)", borderRadius: 10 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", display: "block" }}>PESO REGISTRADO</span>
          <strong style={{ fontSize: 16, color: weight ? "var(--green)" : "var(--text)" }}>
            {weight ? kg(weight) : "Por pesar"}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", display: "block" }}>FECHA RECEPCIÓN</span>
          <strong style={{ fontSize: 13, color: "var(--text)" }}>{date(batch.createdAt)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>Recolector:</span>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>
            {batch.collector?.name || batch.collector?.email || "Sin asignar"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>Centro Destino:</span>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>
            {batch.destinationCenter?.name || batch.destinationCenter?.email || "En tránsito"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        {materialsList.length > 0 ? (
          materialsList.map((m) => (
            <span key={m} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(5, 150, 105, 0.1)", color: "var(--green)", borderRadius: 6, textTransform: "uppercase" }}>
              {m}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Sin desglose aún</span>
        )}
        {batch.stellarTxHash && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(114, 167, 255, 0.1)", color: "var(--blue)", borderRadius: 6 }}>
            Stellar Notarizado
          </span>
        )}
      </div>
    </Link>
  );
}

export function CertificateCard({ certificate, admin = false }: { certificate: Certificate; admin?: boolean }) {
  const recycledMaterial = certificate.esgImpact?.recycledMaterial || "PET";
  const recycledKg = certificate.esgImpact?.recycledKg || 0;
  const co2SavedKg = certificate.esgImpact?.co2SavedKg || 0;
  const waterSavedLiters = certificate.esgImpact?.waterSavedLiters || 0;
  const buyerName = (certificate as any).buyer?.name || (certificate as any).buyer?.email || "Corporativo Livora";
  const stellarTx = certificate.sorobanTxHash || certificate.stellarTxHash || certificate.txHash;

  return (
    <Link
      href={`${admin ? "/admin" : "/company"}/certificates/${certificate.id}`}
      className="card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted)", textTransform: "uppercase" }}>
            Certificado ESG Verificado
          </span>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <span>#{shortId(certificate.id)}</span>
            <Check size={14} style={{ color: "var(--green)" }} />
          </div>
        </div>
        <Status value={certificate.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px", background: "var(--panel2)", borderRadius: 10 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", display: "block" }}>MATERIAL RECICLADO</span>
          <strong style={{ fontSize: 16, color: "var(--green)" }}>{kg(recycledKg)}</strong>
        </div>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", display: "block" }}>CO₂ EVITADO</span>
          <strong style={{ fontSize: 16, color: "var(--blue)" }}>{kg(co2SavedKg)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>Empresa Titular:</span>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{buyerName}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
          <span>Fecha de Emisión:</span>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{date(certificate.createdAt)}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(5, 150, 105, 0.1)", color: "var(--green)", borderRadius: 6, textTransform: "uppercase" }}>
          {recycledMaterial}
        </span>
        {waterSavedLiters > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(114, 167, 255, 0.1)", color: "var(--blue)", borderRadius: 6 }}>
            {waterSavedLiters.toLocaleString("es-PE")} L AGUA
          </span>
        )}
        {stellarTx && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(114, 167, 255, 0.1)", color: "var(--blue)", borderRadius: 6 }}>
            Stellar Minted
          </span>
        )}
      </div>
    </Link>
  );
}
