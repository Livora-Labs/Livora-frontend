"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/components/ToastNotification";
import { LivoraLogo } from "@/components/LivoraLogo";
import { getSecureCookie } from "@/lib/cookies";
import { formatRole } from "@/lib/format";
import {
  Home,
  Package,
  FileText,
  BarChart3,
  Users,
  Link2,
  Settings,
  Leaf,
  ShoppingCart,
  Scale,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon };

const MENUS: Record<string, Item[]> = {
  admin: [
    { href: "/admin", label: "Resumen", icon: Home },
    { href: "/admin/batches", label: "Lotes", icon: Package },
    { href: "/admin/certificates", label: "Certificados", icon: FileText },
    { href: "/admin/inventory", label: "Inventario", icon: BarChart3 },
    { href: "/admin/users-kyc", label: "Usuarios y KYC", icon: Users },
    { href: "/admin/blockchain", label: "Blockchain", icon: Link2 },
    { href: "/perfil", label: "Mi Perfil", icon: Settings },
  ],
  company: [
    { href: "/company", label: "Resumen ESG", icon: Leaf },
    { href: "/company/certificates", label: "Certificados", icon: FileText },
    { href: "/company/purchases", label: "Compras", icon: ShoppingCart },
    { href: "/company/traceability", label: "Trazabilidad", icon: Link2 },
    { href: "/perfil", label: "Mi Perfil", icon: Settings },
  ],
  centro: [
    { href: "/centro", label: "Recepción Lotes", icon: Scale },
    { href: "/perfil", label: "Mi Perfil", icon: Settings },
  ],
};

const WORKSPACES: Record<string, string> = {
  admin: "Livora Operaciones",
  company: "Portal Corporativo ESG",
  centro: "Centro de Acopio",
};

const EYEBROWS: Record<string, string> = {
  admin: "Control de operaciones",
  company: "Portal corporativo",
  centro: "Dashboard industrial",
};

import { Footer } from "@/components/Footer";

export function Shell({
  role,
  children,
}: {
  role: "admin" | "company" | "centro";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, balance, refreshBalance } = useAuth();

  const [workspaceName, setWorkspaceName] = React.useState(WORKSPACES[role] || "Livora");
  const [eyebrowText, setEyebrowText] = React.useState(EYEBROWS[role] || "Plataforma Livora");

  useEffect(() => {
    const savedToken = getSecureCookie("livora_token") || localStorage.getItem("livora_token");
    if (!savedToken) {
      router.push("/");
      return;
    }

    const currentRole = user?.role || localStorage.getItem("livora_role") || "";

    // 1. Bloquear y expulsar roles móviles de la Web
    if (["HOGAR", "RECOLECTOR", "TIENDA"].includes(currentRole)) {
      logout();
      showToast(
        "Acceso no disponible en Web",
        "error",
        "Tu cuenta opera exclusivamente desde la app móvil Livora. Descárgala para continuar."
      );
      router.push("/");
      return;
    }

    // 2. Control estricto con privilegio de auditoría para ADMIN
    if (currentRole === "ADMIN") {
      // ADMIN tiene libre acceso de auditoría a /admin, /company, /centro y /perfil
      return;
    }

    if (currentRole === "EMPRESA_B2B") {
      if (pathname.startsWith("/admin") || pathname.startsWith("/centro")) {
        showToast(
          "Acceso restringido",
          "error",
          "Acceso restringido: Redirigiendo a tu panel autorizado."
        );
        router.push("/company");
      }
      return;
    }

    if (currentRole === "CENTRO_ACOPIO") {
      if (pathname.startsWith("/admin") || pathname.startsWith("/company")) {
        showToast(
          "Acceso restringido",
          "error",
          "Acceso restringido: Redirigiendo a tu panel autorizado."
        );
        router.push("/centro");
      }
      return;
    }
  }, [router, pathname, user, logout]);

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
          <LivoraLogo size={32} />
          Livora
        </Link>
        <div className="workspace">
          <small>Espacio de trabajo</small>
          <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {workspaceName}
            <ChevronDown size={14} />
          </strong>
        </div>
        <nav className="nav">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={pathname === i.href ? "active" : undefined}
            >
              <i.icon size={16} />
              <span>{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link className="user hover-glow" href="/perfil" style={{ display: "flex", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="avatar">{initials}</span>
            <div>
              <strong>{email.split("@")[0]}</strong>
              <small>{formatRole(user?.role) || role.toUpperCase()}</small>
            </div>
          </Link>
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

      <main className="main" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
        <div className="content" style={{ flex: "1 0 auto" }}>{children}</div>
        <Footer />
      </main>

      <nav className="mobile-nav">
        {items.slice(0, 4).map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={pathname === i.href ? "active" : undefined}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
          >
            <i.icon size={16} />
            <span>{i.label}</span>
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
