"use client";

import React, { useState, useEffect } from "react";
import { CertificateCard } from "@/components/Assets";
import { Shell, PageHead } from "@/components/Shell";
import { fetchCertificates } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

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
    <Shell role="company">
      <ToastContainer />
      <PageHead
        eyebrow="Portafolio ambiental"
        title="Certificados ESG"
        description="Explora y verifica las credenciales emitidas por tus compras de material reciclado."
        action={
          <button onClick={loadCerts} className="btn secondary">
            Refrescar ↻
          </button>
        }
      />
      <div className="toolbar">
        <div className="search">
          <input placeholder="Buscar por material, fecha o identificador..." disabled />
        </div>
      </div>
      
      <p className="muted" style={{ fontSize: 12 }}>
        {loading ? "Cargando..." : `${certs.length} activos ambientales`}
      </p>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8" }}>
          Cargando tus certificados ESG...
        </div>
      ) : certs.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8" }}>
          No se encontraron certificados ESG asociados a tu cuenta.
        </div>
      ) : (
        <div className="grid collection-grid">
          {certs.map((c) => (
            <CertificateCard certificate={c} key={c.id} />
          ))}
        </div>
      )}
    </Shell>
  );
}
