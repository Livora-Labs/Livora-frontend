import Link from "next/link";
import { CopyValue } from "@/components/CopyValue";
import { Kpi, PageHead, Status } from "@/components/Shell";
import { certificates, date, kg, money, sales } from "@/lib/data";
export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Abastecimiento circular"
        title="Historial de compras"
        description="Material adquirido a centros de acopio formalizados y su estado de certificación."
        action={<button className="btn">Exportar CSV ↓</button>}
      />
      <div className="grid kpis">
        <Kpi
          label="VOLUMEN TOTAL"
          value={kg(sales.reduce((a, c) => a + c.weightKg, 0))}
          trend="3 operaciones registradas"
        />
        <Kpi
          label="INVERSIÓN CIRCULAR"
          value={money(sales.reduce((a, c) => a + c.totalAmount, 0))}
          trend="Acumulado 2026"
          accent="var(--blue)"
        />
        <Kpi label="CENTROS PROVEEDORES" value="2" trend="100% formalizados" />
        <Kpi
          label="TASA CERTIFICADA"
          value="100%"
          trend="Todas las compras verificadas"
        />
      </div>
      <section className="card">
        <div className="section-title">
          <h2>Operaciones registradas</h2>
          <span className="live">Datos verificados</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>COMPRA</th>
                <th>FECHA</th>
                <th>MATERIAL</th>
                <th>CENTRO DE ACOPIO</th>
                <th>PESO</th>
                <th>MONTO</th>
                <th>CERTIFICADO</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const c = certificates.find((x) => x.saleId === s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <CopyValue value={s.id} prefix="#" />
                    </td>
                    <td>{date(s.createdAt)}</td>
                    <td>
                      <strong>{s.materialType}</strong>
                    </td>
                    <td>{s.center.email}</td>
                    <td>{kg(s.weightKg)}</td>
                    <td>{money(s.totalAmount)}</td>
                    <td>
                      {c ? (
                        <Link href={`/company/certificates/${c.id}`}>
                          <Status value="ACTIVE" />
                        </Link>
                      ) : (
                        <span className="muted">Pendiente</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
