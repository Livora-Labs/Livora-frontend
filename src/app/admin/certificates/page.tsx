import { CertificateCard } from "@/components/Assets";
import { PageHead } from "@/components/Shell";
import { certificates } from "@/lib/data";
export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Credenciales ESG"
        title="Certificados emitidos"
        description="Administra las constancias de impacto asociadas a compras corporativas."
        action={<button className="btn primary">+ Emitir certificado</button>}
      />
      <div className="toolbar">
        <div className="search">
          <input placeholder="Buscar empresa, ID o material..." />
        </div>
        <select>
          <option>Todos</option>
          <option>ACTIVE</option>
          <option>REVOKED</option>
        </select>
      </div>
      <div className="grid collection-grid">
        {certificates.map((c) => (
          <CertificateCard certificate={c} admin key={c.id} />
        ))}
      </div>
    </>
  );
}
