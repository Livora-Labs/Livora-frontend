"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CertificateDetail } from "@/components/CertificateDetail";
import { Shell } from "@/components/Shell";
import { fetchCertificateById } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";

export default function Page() {
  const params = useParams();
  const id = params?.id as string;

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCert();
    }
  }, [id]);

  const loadCert = async () => {
    setLoading(true);
    try {
      const data = await fetchCertificateById(id);
      setCert(data);
    } catch (err: any) {
      showToast("Error al cargar certificado", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Shell role="company">
        <div style={{ padding: "80px 0", textAlign: "center", color: "#94A3B8" }}>
          Cargando detalle del certificado...
        </div>
      </Shell>
    );
  }

  if (!cert) {
    return (
      <Shell role="company">
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <p style={{ color: "#94A3B8" }}>Certificado no encontrado.</p>
          <Link href="/company/certificates" className="btn" style={{ marginTop: 18 }}>
            ← Volver a certificados
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell role="company">
      <ToastContainer />
      <CertificateDetail certificate={cert} admin={false} />
    </Shell>
  );
}
