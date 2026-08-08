"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchStoreRedemptions, fetchStoreSettlements } from "@/lib/api";
import { Shell, PageHead, Status } from "@/components/Shell";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import { ArrowLeft, Search, RefreshCw, FileText, Banknote, Tag, Calendar, ExternalLink } from "lucide-react";

export default function TiendaHistorialPage() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"redemptions" | "settlements">("redemptions");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const red = await fetchStoreRedemptions();
      setRedemptions(red || []);

      const setts = await fetchStoreSettlements();
      setSettlements(setts || []);
    } catch (err: any) {
      showToast("Error al cargar historial", "error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRedemptions = redemptions.filter((r) => {
    const userEmail = r.user?.email?.toLowerCase() || "";
    const refCode = r.qrCodeRef?.toLowerCase() || "";
    const matchesSearch = userEmail.includes(searchQuery.toLowerCase()) || refCode.includes(searchQuery.toLowerCase()) || r.id.includes(searchQuery);
    return matchesSearch;
  });

  const filteredSettlements = settlements.filter((s) => {
    return s.id.includes(searchQuery) || s.status.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Shell role="tienda">
      <ToastContainer />
      <PageHead
        eyebrow="Trazabilidad financiera"
        title="Historial de Transacciones"
        description="Revisa tus canjes recibidos y el estado de tus retiros bancarios de EcoTokens a soles."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/tienda" className="btn" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} />
              <span>Volver</span>
            </Link>
            <button onClick={loadData} className="btn ghost" style={{ display: "grid", placeItems: "center", padding: 10 }}>
              <RefreshCw size={18} />
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1E293B", marginBottom: 20 }}>
        <button
          onClick={() => { setActiveTab("redemptions"); setSearchQuery(""); }}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            color: activeTab === "redemptions" ? "#10B981" : "#94A3B8",
            borderBottom: activeTab === "redemptions" ? "2px solid #10B981" : "none",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Canjes Recibidos ({redemptions.length})
        </button>
        <button
          onClick={() => { setActiveTab("settlements"); setSearchQuery(""); }}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            color: activeTab === "settlements" ? "#10B981" : "#94A3B8",
            borderBottom: activeTab === "settlements" ? "2px solid #10B981" : "none",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Liquidaciones / Retiros ({settlements.length})
        </button>
      </div>

      {/* Search toolbar */}
      <div className="toolbar" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div className="search" style={{ flex: 1, minWidth: 200, position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: "#94A3B8" }} />
          <input
            placeholder={activeTab === "redemptions" ? "Buscar por código de referencia o cliente..." : "Buscar por ID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "#0A192F",
              border: "1px solid #1E293B",
              borderRadius: 10,
              padding: "10px 12px 10px 38px",
              color: "#F8FAFC",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {activeTab === "redemptions" ? (
        <section className="card">
          <div className="section-title">
            <h2>Registro de Canjes</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Cargando canjes...</div>
          ) : filteredRedemptions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              No se encontraron registros de canjes.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>REFERENCIA CANJE</th>
                    <th>FECHA CANJE</th>
                    <th>CIUDADANO / CLIENTE</th>
                    <th>MONTO RECIBIDO</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRedemptions.map((r) => (
                    <tr key={r.id}>
                      <td className="mono" style={{ color: "#06B6D4" }}>{r.qrCodeRef}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString()} · {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{r.user?.email || "Escaneado por Ciudadano"}</td>
                      <td>
                        <strong style={{ color: "var(--green)" }}>+{r.tokenAmount.toFixed(1)} ECO</strong>
                      </td>
                      <td>
                        <Status value={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <div className="section-title">
            <h2>Registro de Liquidaciones (Retiros Bancarios)</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>Cargando liquidaciones...</div>
          ) : filteredSettlements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              No se encontraron registros de retiros bancarios.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>RETIRADO ID</th>
                    <th>FECHA RETIRO</th>
                    <th>CANTIDAD CANJEADA</th>
                    <th>FIAT RECIBIDO</th>
                    <th>ESTADO</th>
                    <th>COMPROBANTE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettlements.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">#{s.id.slice(0, 8)}</td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong style={{ color: "#F59E0B" }}>-{s.tokenAmount.toFixed(1)} ECO</strong>
                      </td>
                      <td>
                        <strong>S/. {s.fiatAmount.toFixed(2)} PEN</strong>
                      </td>
                      <td>
                        <Status value={s.status} />
                      </td>
                      <td>
                        {s.receiptUrl ? (
                          <a
                            href={s.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#06B6D4",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              textDecoration: "underline",
                            }}
                          >
                            <span>Ver Recibo</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: 12 }}>Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </Shell>
  );
}
