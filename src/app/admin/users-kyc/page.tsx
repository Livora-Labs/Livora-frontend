"use client";
import { useState } from "react";
import { CopyValue } from "@/components/CopyValue";
import { PageHead, Status } from "@/components/Shell";
import { date, kycApplications } from "@/lib/data";
export default function Page() {
  const [items, setItems] = useState(kycApplications);
  const set = (id: string, status: "APPROVED" | "REJECTED") =>
    setItems((v) => v.map((x) => (x.id === id ? { ...x, status } : x)));
  return (
    <>
      <PageHead
        eyebrow="Confianza en la red"
        title="Usuarios y verificación KYC"
        description="Revisa la identidad y formaliza la participación de recicladores de base."
      />
      <div className="grid kpis">
        <div className="card kpi">
          <div className="kpi-label">PENDIENTES</div>
          <div className="kpi-value">
            {items.filter((x) => x.status === "PENDING").length}
          </div>
          <div className="trend">Tiempo medio: 8 h</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">APROBADOS ESTE MES</div>
          <div className="kpi-value">24</div>
          <div className="trend">↑ 18% vs. julio</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">RECICLADORES ACTIVOS</div>
          <div className="kpi-value">156</div>
          <div className="trend">98.2% verificados</div>
        </div>
      </div>
      <section className="card">
        <div className="section-title">
          <h2>Solicitudes recientes</h2>
          <span className="muted">Actualización simulada localmente</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>ROL</th>
                <th>FECHA</th>
                <th>DOCUMENTO</th>
                <th>ESTADO</th>
                <th>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {items.map((k) => (
                <tr key={k.id}>
                  <td>
                    <strong>{k.user.email}</strong>
                    <div style={{ fontSize: 10, marginTop: 4 }}>
                      <CopyValue value={k.userId} />
                    </div>
                  </td>
                  <td>{k.user.role}</td>
                  <td>{date(k.createdAt)}</td>
                  <td>
                    <button className="btn">Ver documento</button>
                  </td>
                  <td>
                    <Status value={k.status} />
                  </td>
                  <td>
                    {k.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: 7 }}>
                        <button
                          className="btn primary"
                          onClick={() => set(k.id, "APPROVED")}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn"
                          onClick={() => set(k.id, "REJECTED")}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="muted">Revisado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
