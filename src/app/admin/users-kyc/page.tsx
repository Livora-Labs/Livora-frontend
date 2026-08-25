"use client";

import React, { useState, useEffect } from "react";
import { PageHead, Status } from "@/components/Shell";
import { fetchKycApplications, updateKycStatus } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

const date = (value: string) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function KycSkeleton() {
  return (
    <>
      <div className="grid kpis">
        {[1, 2, 3].map((x) => (
          <div key={x} className="card kpi animate-pulse" style={{ height: 110, background: "#112240", border: "1px solid #1E293B", borderRadius: 12 }}>
            <div style={{ height: 12, width: "50%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 24, width: "70%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <section className="card animate-pulse" style={{ height: 240, background: "#112240", border: "1px solid #1E293B", borderRadius: 12, marginTop: 24 }} />
    </>
  );
}

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async () => {
    setLoading(true);
    try {
      const data = await fetchKycApplications();
      setItems(data || []);
    } catch (err: any) {
      showToast("Error al cargar solicitudes KYC", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateKycStatus(userId, status);
      showToast(`Solicitud KYC ${status === "APPROVED" ? "aprobada" : "rechazada"} exitosamente`, "success");
      loadKyc();
    } catch (err: any) {
      showToast("Error al actualizar estado KYC", "error", err.message);
    }
  };

  const pendingCount = items.filter((x) => x.status === "PENDING").length;
  const approvedCount = items.filter((x) => x.status === "APPROVED").length;

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Confianza en la red"
        title="Usuarios y verificación KYC"
        description="Revisa la identidad y formaliza la participación de recicladores de base."
        action={<button onClick={loadKyc} className="btn">Refrescar ↻</button>}
      />

      {loading ? (
        <KycSkeleton />
      ) : (
        <>
          <div className="grid kpis">
            <div className="card kpi">
              <div className="kpi-label">PENDIENTES</div>
              <div className="kpi-value">{pendingCount}</div>
              <div className="trend">Esperando revisión</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">APROBADOS TOTALES</div>
              <div className="kpi-value">{approvedCount}</div>
              <div className="trend">Verificados</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">RECICLADORES TOTALES</div>
              <div className="kpi-value">{items.length}</div>
              <div className="trend">En base de datos</div>
            </div>
          </div>

          <section className="card">
            <div className="section-title">
              <h2>Solicitudes recientes</h2>
              <span className="live">En vivo</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>USUARIO</th>
                    <th>FECHA DE REGISTRO</th>
                    <th>DOCUMENTO</th>
                    <th>ESTADO</th>
                    <th>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                        <div>No hay solicitudes KYC registradas.</div>
                      </td>
                    </tr>
                  ) : (
                    items.map((k) => (
                      <tr key={k.id}>
                        <td>
                          <strong>{k.user?.email || "—"}</strong>
                          <div className="mono" style={{ fontSize: 10, marginTop: 4 }}>
                            {k.userId?.slice(0, 12)}…
                          </div>
                        </td>
                        <td>{date(k.createdAt)}</td>
                        <td>
                          <a
                            className="btn"
                            href={k.documentUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 11, padding: "4px 8px" }}
                          >
                            Ver documento
                          </a>
                        </td>
                        <td>
                          <Status value={k.status} />
                        </td>
                        <td>
                          {k.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: 7 }}>
                              <button
                                className="btn primary"
                                onClick={() => handleUpdateStatus(k.userId, "APPROVED")}
                                style={{ fontSize: 11, padding: "4px 10px" }}
                              >
                                Aprobar
                              </button>
                              <button
                                className="btn"
                                onClick={() => handleUpdateStatus(k.userId, "REJECTED")}
                                style={{ fontSize: 11, padding: "4px 10px" }}
                              >
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="muted">Revisado</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
