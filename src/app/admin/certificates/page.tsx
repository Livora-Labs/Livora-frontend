"use client";

import React, { useState, useEffect } from "react";
import { CertificateCard } from "@/components/Assets";
import { PageHead } from "@/components/Shell";
import { fetchCertificates } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

function CertsSkeleton() {
  return (
    <div className="grid collection-grid">
      {[1, 2, 3].map((x) => (
        <div key={x} className="card asset-card animate-pulse" style={{ height: 180, background: "#112240", border: "1px solid #1E293B", borderRadius: 12, padding: 0 }}>
          <div style={{ height: 80, background: "rgba(30, 41, 59, 0.4)", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
          <div style={{ padding: 16 }}>
            <div style={{ height: 16, width: "65%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 12, width: "45%", background: "rgba(30, 41, 59, 0.6)", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCerts();
  }, []);

  const loadCerts = async () => {
    setLoading(true);
    try {
      const data = await fetchCertificates();
      setCerts(data || []);
    } catch (err: any) {
      showToast("Error al cargar certificados", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Credenciales ESG"
        title="Certificados emitidos"
        description="Administra las constancias de impacto asociadas a compras corporativas."
        action={
          <button onClick={loadCerts} className="btn secondary">
            Refrescar ↻
          </button>
        }
      />
      <div className="toolbar">
        <div className="search">
          <input placeholder="Buscar empresa, ID o material..." disabled />
        </div>
        <select disabled>
          <option>Todos</option>
        </select>
      </div>

      <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
        {loading ? "Cargando..." : `${certs.length} certificados encontrados`}
      </p>

      {loading ? (
        <CertsSkeleton />
      ) : certs.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
          <h3>Sin Certificados Emitidos</h3>
          <p className="muted" style={{ fontSize: 13, maxWidth: 300, margin: "6px auto 0" }}>
            No se han registrado certificados de impacto en el sistema.
          </p>
        </div>
      ) : (
        <div className="grid collection-grid">
          {certs.map((c) => (
            <CertificateCard certificate={c} admin={true} key={c.id} />
          ))}
        </div>
      )}
    </>
  );
}
