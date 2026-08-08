import Link from "next/link";
import { CopyValue } from "@/components/CopyValue";
import { PageHead, Status } from "@/components/Shell";
import {
  batches,
  certificates,
  consolidated,
  date,
  kg,
  sales,
  shortId,
} from "@/lib/data";
export default function Page() {
  const c = certificates[0],
    sale = sales[0],
    con = consolidated[0],
    batch = batches.find((x) => x.id === con.batchIds[0])!;
  return (
    <>
      <PageHead
        eyebrow="Cadena de custodia"
        title="Trazabilidad de punta a punta"
        description="Comprueba cómo una compra se conecta con el material, sus recolectores y evidencias de origen."
      />
      <div className="card">
        <div className="section-title">
          <h2>Ruta del certificado más reciente</h2>
          <span className="live">Cadena íntegra</span>
        </div>
        <div className="trace" style={{ margin: "22px 0 10px" }}>
          {[
            "Certificado ESG",
            "Compra B2B",
            "Lote consolidado",
            "Lote de origen",
            "Recolecciones",
          ].map((x, i) => (
            <div className="trace-step" key={x}>
              <strong>{x}</strong>
              <span>Paso {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gap: 12, marginTop: 16 }}>
        <Link
          href={`/company/certificates/${c.id}`}
          className="card network-row"
        >
          <div>
            <span className="eyebrow">1 · Certificado ESG</span>
            <h3>
              {c.esgImpact.recycledMaterial} · {kg(c.esgImpact.recycledKg)}
            </h3>
            <CopyValue value={c.id} prefix="#" />
          </div>
          <Status value={c.status} />
        </Link>
        <div className="card network-row">
          <div>
            <span className="eyebrow">2 · Compra corporativa</span>
            <h3>{sale.center.email}</h3>
            <span className="muted">
              {date(sale.createdAt)} · {kg(sale.weightKg)}
            </span>
          </div>
          <span style={{ color: "var(--green)" }}>✓ Formalizada</span>
        </div>
        <div className="card network-row">
          <div>
            <span className="eyebrow">3 · Lote consolidado</span>
            <h3>Consolidación #{shortId(con.id)}</h3>
            <CopyValue value={con.id} />
            <span className="muted">
              {" "}
              · {con.batchIds.length} lotes · {kg(con.totalWeight)}
            </span>
          </div>
          <Status value={con.status} />
        </div>
        <div className="card network-row">
          <div>
            <span className="eyebrow">4 · Lote de origen</span>
            <h3>{Object.keys(batch.materialsActual || {}).join(" + ")}</h3>
            <CopyValue value={batch.id} />
            <span className="muted">
              {" "}
              · Recolector: {batch.collector.email}
            </span>
          </div>
          <Status value={batch.status} />
        </div>
        <div className="card">
          <span className="eyebrow">5 · Evidencia y participantes</span>
          <h3>{batch.requests.length || 2} hogares participantes</h3>
          <p className="muted">
            Las solicitudes originales se vinculan al lote y preservan
            ubicación, fecha, material estimado y evidencia fotográfica.
          </p>
          <div className="data-row">
            <span>Manifiesto IPFS</span>
            <CopyValue value={batch.trace?.ipfsCid || ""} />
          </div>
          <div className="data-row">
            <span>Transacción Arbitrum</span>
            <CopyValue value={batch.trace?.txHash || ""} />
          </div>
        </div>
      </div>
    </>
  );
}
