"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CertificateDetail } from "@/components/CertificateDetail";
import { fetchCertificateById } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { CardSkeleton } from "@/components/skeletons/SkeletonUI";
import { ErrorState, EmptyState } from "@/components/StateFeedback";

export default function Page() {
  const params = useParams();
  const id = params?.id as string;

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCert();
    }
  }, [id]);

  const loadCert = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCertificateById(id);
      setCert(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error al cargar certificado";
      setError(msg);
      showToast("Error al cargar certificado", "error", msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <ErrorState
          title="Error al consultar el certificado"
          message={error}
          onRetry={loadCert}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/company/certificates" className="btn ghost">
            ← Volver a certificados
          </Link>
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <EmptyState
          title="Certificado no encontrado"
          description="El certificado digital solicitado no existe en la red o el identificador es incorrecto."
          actionHref="/company/certificates"
          actionLabel="Volver a certificados"
        />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <CertificateDetail certificate={cert} admin={false} />
    </>
  );
}
