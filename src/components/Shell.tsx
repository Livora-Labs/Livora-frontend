"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Item = { href: string; label: string };

const MENUS: Record<string, Item[]> = {
  admin: [
    { href: "/admin", label: "⌂  Resumen" },
    { href: "/admin/batches", label: "◇  Lotes" },
    { href: "/admin/certificates", label: "▣  Certificados" },
    { href: "/admin/inventory", label: "▤  Inventario" },
    { href: "/admin/users-kyc", label: "♙  Usuarios y KYC" },
    { href: "/admin/blockchain", label: "⌁  Blockchain" },
  ],
  company: [
    { href: "/company", label: "⌂  Resumen ESG" },
    { href: "/company/certificates", label: "▣  Certificados" },
    { href: "/company/purchases", label: "⇄  Compras" },
    { href: "/company/traceability", label: "⌁  Trazabilidad" },
  ],
  hogar: [
    { href: "/hogar", label: "⌂  Mi Hogar" },
    { href: "/hogar/transfers", label: "⇄  Historial ECO" },
  ],
  recolector: [
    { href: "/recolector", label: "⌂  Mi Ruta" },
    { href: "/recolector/transfers", label: "⇄  Historial ECO" },
  ],
  centro: [
    { href: "/centro", label: "⌂  Recepción Lotes" },
  ],
  tienda: [
    { href: "/tienda", label: "⌂  POS & Cobros" },
  ],
};

const WORKSPACES: Record<string, string> = {
  admin: "Livora Operaciones",
  company: "Coca-Cola Perú",
  hogar: "Hogar Ecológico",
  recolector: "Unidad Recolectora",
  centro: "Centro de Acopio",
  tienda: "Comercio Aliado",
};

const EYEBROWS: Record<string, string> = {
  admin: "Control de operaciones",
  company: "Portal corporativo",
  hogar: "Portal ciudadano",
  recolector: "Radar de campo",
  centro: "Dashboard industrial",
  tienda: "Punto de Venta POS",
};

export function Shell({
  role,
  children,
}: {
  role: "admin" | "company" | "hogar" | "recolector" | "centro" | "tienda";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, balance, refreshBalance } = useAuth();

  const [workspaceName, setWorkspaceName] = React.useState(WORKSPACES[role] || "Livora");
  const [eyebrowText, setEyebrowText] = React.useState(EYEBROWS[role] || "Plataforma Livora");

  useEffect(() => {
    const savedToken = localStorage.getItem("livora_token");
    if (!savedToken) {
      router.push("/");
    }
    const dbRole = localStorage.getItem("livora_role");
    if (dbRole === "ALMACEN") {
      setWorkspaceName("Almacén Central");
      setEyebrowText("Operación de inventario");
    }
  }, [router]);

  const items = MENUS[role] || [];

  const email = user?.email || "";
  const initials = email.split("@")[0].substring(0, 2).toUpperCase() || "LV";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href={`/${role}`}>
          <span className="brandmark" />
          Livora
        </Link>
        <div className="workspace">
          <small>Espacio de trabajo</small>
          <strong>{workspaceName}⌄</strong>
        </div>
        <nav className="nav">
          {items.map((i) => (
            <Link key={i.href} href={i.href}>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{email.split("@")[0]}</strong>
              <small>{user?.role || role.toUpperCase()}</small>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="muted"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 11,
              display: "block",
              marginTop: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span className="eyebrow">{eyebrowText}</span>
          <div className="top-actions" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "5px 12px", borderRadius: 12 }}>
              <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>{balance} ECO</span>
            </div>
            <span className="live">Red operativa</span>
            <button className="btn ghost" onClick={refreshBalance} style={{ display: "grid", placeItems: "center", padding: 8 }}>
              ◉
            </button>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>

      <nav className="mobile-nav">
        {items.slice(0, 4).map((i) => (
          <Link key={i.href} href={i.href}>
            {i.label.replace(/^\S+\s+/, "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Kpi({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: string;
  trend: string;
  accent?: string;
}) {
  return (
    <div className="card kpi" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="trend">{trend}</div>
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return <span className={`status ${value}`}>{value.replaceAll("_", " ")}</span>;
}
