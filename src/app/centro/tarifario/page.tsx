"use client";

import React from "react";
import { PageHead, Kpi } from "@/components/Shell";
import { useAuth } from "@/context/AuthContext";
import { AcopioTarifarioSection } from "@/components/AcopioTarifarioSection";
import { ToastContainer } from "@/components/ToastNotification";
import { Tag, HelpCircle, ShieldCheck, Scale } from "lucide-react";

export default function CentroTarifarioPage() {
  const { user } = useAuth();

  return (
    <>
      <ToastContainer />
      <PageHead
        eyebrow="Configuración Comercial"
        title="Tarifario Oficial de Compra"
        description="Define los precios por kilogramo pagados a recolectores y ciudadanos por cada tipo de material reciclable."
      />

      <div className="grid kpis" style={{ marginBottom: 20 }}>
        <Kpi
          label="ESTADO DEL TARIFARIO"
          value="PUBLICADO"
          trend="Visible en App Móvil y Red"
          accent="var(--green)"
        />
        <Kpi
          label="MONEDA DE LIQUIDACIÓN"
          value="ECO / PEN"
          trend="Paridad indexada en tiempo real"
          accent="var(--blue)"
        />
        <Kpi
          label="FRECUENCIA DE AJUSTE"
          value="Inmediata"
          trend="Sincronizado con Stellar Blockchain"
          accent="var(--purple, #8b5cf6)"
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <AcopioTarifarioSection centerId={user?.id || ""} />
      </div>

      {/* Normativa y Transparencia */}
      <section className="card" style={{ background: "var(--panel2, #f8fafc)", border: "1px solid var(--line, #e2e8f0)" }}>
        <div className="section-title">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15 }}>
            <HelpCircle size={18} style={{ color: "var(--green)" }} />
            <span>Reglas del Tarifario Dinámico</span>
          </h3>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted, #64748b)", lineHeight: 1.6, display: "grid", gap: 10 }}>
          <p style={{ margin: 0 }}>
            • <strong>Transparencia hacia Recolectores:</strong> Los valores guardados en este panel se reflejan automáticamente en la aplicación móvil de los recolectores al momento de iniciar un lote hacia este centro.
          </p>
          <p style={{ margin: 0 }}>
            • <strong>Liquidación en Báscula:</strong> Al confirmar el pesaje industrial, la plataforma calcula el monto a transferir en tokens ECO multiplicando los kilogramos netos recibidos por el precio unitario fijado en este tarifario.
          </p>
          <p style={{ margin: 0 }}>
            • <strong>Inmutabilidad On-Chain:</strong> Una vez emitida la orden de pago y firmada en la red Stellar, el valor de liquidación queda registrado en el pasaporte digital del lote sin posibilidad de alteración posterior.
          </p>
        </div>
      </section>
    </>
  );
}
