import { CopyValue } from "@/components/CopyValue";
import { PageHead, Status } from "@/components/Shell";
import { batches, date } from "@/lib/data";
export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Infraestructura Web3"
        title="Monitor blockchain"
        description="Estado de la red, procesamiento de lotes y evidencia inmutable."
        action={<button className="btn">Actualizar ↻</button>}
      />
      <div className="grid kpis">
        <div className="card kpi">
          <div className="kpi-label">ESTADO DE RED</div>
          <div className="kpi-value" style={{ color: "var(--green)" }}>
            Saludable
          </div>
          <div className="trend">Arbitrum Sepolia</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">LATENCIA RPC</div>
          <div className="kpi-value">45 ms</div>
          <div className="trend">Dentro del objetivo</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">ÚLTIMO BLOQUE</div>
          <div className="kpi-value">12.89M</div>
          <div className="trend">Confirmado hace 4 s</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">JOBS EN COLA</div>
          <div className="kpi-value">1</div>
          <div className="trend">Sin errores críticos</div>
        </div>
      </div>
      <div className="grid split">
        <section className="card">
          <div className="section-title">
            <h2>Últimas transacciones</h2>
            <span className="live">En vivo</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>JOB</th>
                  <th>LOTE</th>
                  <th>TX HASH</th>
                  <th>ESTADO</th>
                  <th>FECHA</th>
                </tr>
              </thead>
              <tbody>
                {batches
                  .filter((b) => b.trace)
                  .map((b) => (
                    <tr key={b.id}>
                      <td className="mono">{b.trace?.jobId}</td>
                      <td>
                        <CopyValue value={b.id} prefix="#" />
                      </td>
                      <td>
                        <CopyValue value={b.trace!.txHash} />
                      </td>
                      <td>
                        <Status value="RECEIVED" />
                      </td>
                      <td>{date(b.trace!.processedAt)}</td>
                    </tr>
                  ))}
                <tr>
                  <td className="mono">JOB-2842</td>
                  <td>
                    <CopyValue value={batches[1].id} prefix="#" />
                  </td>
                  <td className="muted">Esperando minado</td>
                  <td>
                    <Status value="PROCESSING" />
                  </td>
                  <td>{date(batches[1].updatedAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <aside className="card">
          <div className="section-title">
            <h2>Servicios</h2>
          </div>
          {[
            ["API Gateway", "Operativo"],
            ["Redis / BullMQ", "Operativo"],
            ["IPFS Gateway", "Operativo"],
            ["Smart Contract", "Operativo"],
          ].map((x) => (
            <div className="network-row" key={x[0]}>
              <strong>{x[0]}</strong>
              <span className="live">{x[1]}</span>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
