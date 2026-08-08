import Link from "next/link";
import type { Batch, Certificate } from "@/lib/types";
import { date, kg } from "@/lib/data";
import { Status } from "./Shell";
import { CopyValue } from "./CopyValue";
export function BatchCard({ batch }: { batch: Batch }) {
  const weight = Object.values(batch.materialsActual || {}).reduce(
    (a, b) => a + b,
    0,
  );
  const material =
    Object.keys(
      batch.materialsActual || batch.requests[0]?.itemsEstimated || {},
    ).join(" + ") || "Por pesar";
  return (
    <Link href={`/admin/batches/${batch.id}`} className="card asset-card">
      <div className="asset-art">
        <Status value={batch.status} />
        <div className="material">{material}</div>
      </div>
      <div className="asset-body">
        <div className="asset-top">
          <div>
            <div className="asset-name">Lote</div>
            <div className="asset-sub">
              <CopyValue value={batch.id} prefix="#" />
            </div>
            <div className="asset-sub">
              {batch.destinationCenter?.email || "Sin centro asignado"}
            </div>
          </div>
          <span className="muted">↗</span>
        </div>
        <div className="asset-stats">
          <div>
            <span>PESO REAL</span>
            <strong>{weight ? kg(weight) : "Pendiente"}</strong>
          </div>
          <div>
            <span>CREADO</span>
            <strong>{date(batch.createdAt)}</strong>
          </div>
        </div>
      </div>
    </Link>
  );
}
export function CertificateCard({
  certificate,
  admin = false,
}: {
  certificate: Certificate;
  admin?: boolean;
}) {
  return (
    <Link
      href={`${admin ? "/admin" : "/company"}/certificates/${certificate.id}`}
      className="card asset-card"
    >
      <div
        className="asset-art"
        style={{
          background: certificate.esgImpact.recycledMaterial.includes(
            "ALUMINIO",
          )
            ? "linear-gradient(140deg,#293544,#101b22)"
            : "linear-gradient(140deg,#173e31,#0c211b)",
        }}
      >
        <Status value={certificate.status} />
        <div className="material">{certificate.esgImpact.recycledMaterial}</div>
      </div>
      <div className="asset-body">
        <div className="asset-top">
          <div>
            <div className="asset-name">Certificado</div>
            <div className="asset-sub">
              <CopyValue value={certificate.id} prefix="#" />
            </div>
            <div className="asset-sub">Verificación ambiental Livora</div>
          </div>
          <span style={{ color: "var(--green)" }}>✓</span>
        </div>
        <div className="asset-stats">
          <div>
            <span>MATERIAL</span>
            <strong>{kg(certificate.esgImpact.recycledKg)}</strong>
          </div>
          <div>
            <span>CO₂ EVITADO</span>
            <strong>{kg(certificate.esgImpact.co2SavedKg)}</strong>
          </div>
        </div>
      </div>
    </Link>
  );
}
