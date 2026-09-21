"use client";

import React, { useState, useEffect } from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { fetchStoreProfile, updateStoreProfile } from "@/lib/api";
import { showToast, ToastContainer } from "@/components/ToastNotification";
import {
  Store,
  Building2,
  MapPin,
  CreditCard,
  Save,
  RefreshCw,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/SkeletonUI";

export default function StorePerfilPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [businessName, setBusinessName] = useState<string>("");
  const [ruc, setRuc] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchStoreProfile();
      if (data) {
        setProfile(data);
        setBusinessName(data.businessName || "");
        setRuc(data.ruc || "");
        setAddress(data.address || "");
        setBankAccount(data.bankAccount || "");
      }
    } catch (err: any) {
      // Si aún no tiene perfil creado, permitir completarlo
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      showToast("Nombre Requerido", "error", "Ingresa el nombre o razón social del comercio.");
      return;
    }
    if (ruc.trim().length !== 11) {
      showToast("RUC Inválido", "error", "El RUC debe tener exactamente 11 dígitos numéricos.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateStoreProfile({
        businessName: businessName.trim(),
        ruc: ruc.trim(),
        address: address.trim(),
        bankAccount: bankAccount.trim(),
      });
      setProfile(updated);
      showToast(
        "Perfil Comercial Guardado",
        "success",
        "Tus datos de comercio y facturación han sido actualizados."
      );
    } catch (err: any) {
      showToast(
        "Error al guardar perfil",
        "error",
        err.response?.data?.message || err.message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Identidad de Comercio"
        title="Datos del Establecimiento Comercial"
        description="Gestiona la información legal de tu negocio, dirección del local y cuenta bancaria predeterminada para el pago de liquidaciones."
        action={
          <button
            onClick={loadProfile}
            disabled={loading}
            className="btn secondary"
            style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refrescar</span>
          </button>
        }
      />

      <div className="grid kpis" style={{ marginBottom: 24 }}>
        <Kpi
          label="ESTADO DEL COMERCIO"
          value={profile?.ruc ? "HOMOLOGADO" : "PENDIENTE DATOS"}
          trend="Habilitado para canjes"
          accent="var(--green)"
        />
        <Kpi
          label="TIPO DE PERSONERÍA"
          value={ruc.startsWith("20") ? "RUC 20 Jurídica" : "RUC 10 Natural"}
          trend="Fiscalización Sunat Perú"
          accent="var(--blue)"
        />
        <Kpi
          label="CUENTA ASIGNADA"
          value={bankAccount ? "REGISTRADA" : "NO ASIGNADA"}
          trend="Abonos automáticos"
          accent={bankAccount ? "var(--green)" : "var(--amber)"}
        />
      </div>

      <div className="grid split" style={{ gap: 24 }}>
        {/* Formulario de Datos */}
        <section className="card">
          <div className="section-title">
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16 }}>
              <Store size={18} style={{ color: "var(--green)" }} />
              <span>Ficha Comercial de la Tienda</span>
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "grid", gap: 16, marginTop: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted, #64748b)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Razón Social / Nombre Comercial
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Ej: Bodega y Minimarket San Isidro E.I.R.L."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 13,
                    borderRadius: 10,
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "var(--bg, #f8fafc)",
                    color: "var(--text, #0f172a)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted, #64748b)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                RUC (11 Dígitos)
              </label>
              <input
                type="text"
                maxLength={11}
                placeholder="Ej: 20601234567"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--bg, #f8fafc)",
                  color: "var(--text, #0f172a)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted, #64748b)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Dirección Física del Local / Punto de Venta
              </label>
              <input
                type="text"
                placeholder="Ej: Av. Conquistadores 450, San Isidro, Lima"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: 10,
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--bg, #f8fafc)",
                  color: "var(--text, #0f172a)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted, #64748b)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Cuenta Bancaria Predeterminada (CCI o N° de Cuenta)
              </label>
              <input
                type="text"
                placeholder="Ej: BCP CCI 002-194-001234567890-12 en soles"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: 10,
                  border: "1px solid var(--line, #cbd5e1)",
                  background: "var(--bg, #f8fafc)",
                  color: "var(--text, #0f172a)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn primary"
              style={{
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 10,
                marginTop: 6,
              }}
            >
              <Save size={15} />
              <span>{saving ? "Guardando..." : "Guardar Datos del Comercio"}</span>
            </button>
          </form>
        </section>

        {/* Políticas y Beneficios de Tienda Aliada */}
        <section className="card" style={{ background: "var(--panel2, #f8fafc)", border: "1px solid var(--line, #e2e8f0)" }}>
          <div className="section-title">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15 }}>
              <ShieldCheck size={18} style={{ color: "var(--green)" }} />
              <span>Beneficios de la Red de Tiendas Aliadas</span>
            </h3>
          </div>

          <div style={{ fontSize: 13, color: "var(--muted, #64748b)", lineHeight: 1.6, display: "grid", gap: 10 }}>
            <p style={{ margin: 0 }}>
              • <strong>Atracción de Clientes Ecológicos:</strong> Miles de ciudadanos y familias de tu distrito acumulan LIVOs por reciclar y buscan comercios cercanos donde canjearlos por productos y servicios reales.
            </p>
            <p style={{ margin: 0 }}>
              • <strong>Liquidación Garantizada a Tu Banco:</strong> No asumes riesgo de tipo de cambio ni comisiones abusivas de pasarela. Los LIVOs se liquidan 1:1 a S/ 0.20 por LIVO mediante transferencia bancaria regular.
            </p>
            <p style={{ margin: 0 }}>
              • <strong>Distintivo Comercial Sostenible:</strong> Tu establecimiento aparece en el mapa georreferenciado de la aplicación móvil de Livora como punto de canje oficial.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
