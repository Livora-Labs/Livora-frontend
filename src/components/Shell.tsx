"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/components/ToastNotification";
import { LivoraLogo, LivoraBrand } from "@/components/LivoraLogo";
import { TopLoadingBar } from "@/components/TopLoadingBar";
import { useIsFetching } from "@tanstack/react-query";
import { getSecureCookie } from "@/lib/cookies";

import {
  LayoutDashboard,
  Boxes,
  Award,
  Warehouse,
  Users,
  Activity,
  UserCircle,
  ShoppingBag,
  GitCommit,
  PackagePlus,
  RefreshCw,
  LogOut,
  Scale,
  Coins,
  Truck,
  BookOpen,
  QrCode,
  Receipt,
  Banknote,
  Store,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
};

const MENUS: Record<string, Item[]> = {
  admin: [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/batches", label: "Lotes", icon: Boxes },
    { href: "/admin/certificates", label: "Certificados", icon: Award },
    { href: "/admin/inventory", label: "Inventario", icon: Warehouse },
    { href: "/admin/users-kyc", label: "Usuarios y KYC", icon: Users },
    { href: "/admin/blockchain", label: "Blockchain", icon: Activity },
    { href: "/admin/reclamaciones", label: "Reclamaciones", icon: BookOpen },
    { href: "/admin/liquidaciones", label: "Liquidaciones", icon: Banknote },
    { href: "/perfil", label: "Mi Perfil", icon: UserCircle },
  ],
  company: [
    { href: "/company", label: "Resumen ESG", icon: LayoutDashboard },
    { href: "/company/catalogo", label: "Catálogo Acopios", icon: Warehouse },
    { href: "/company/purchases", label: "Compras y Despachos", icon: ShoppingBag },
    { href: "/company/certificates", label: "Certificados", icon: Award },
    { href: "/company/traceability", label: "Trazabilidad", icon: GitCommit },
    { href: "/perfil", label: "Mi Perfil", icon: UserCircle },
  ],
  centro: [
    { href: "/centro", label: "Báscula y Pesaje", icon: Scale },
    { href: "/centro/lotes", label: "Gestión de Lotes", icon: Boxes },
    { href: "/centro/inventario", label: "Inventario Local", icon: Warehouse },
    { href: "/centro/tarifario", label: "Tarifario de Compra", icon: Coins },
    { href: "/centro/despachos", label: "Despachos B2B", icon: Truck },
    { href: "/perfil", label: "Mi Perfil", icon: UserCircle },
  ],
  store: [
    { href: "/store", label: "Terminal POS", icon: QrCode },
    { href: "/store/canjes", label: "Historial Canjes", icon: Receipt },
    { href: "/store/liquidaciones", label: "Liquidaciones FIAT", icon: Banknote },
    { href: "/store/perfil", label: "Datos Comercio", icon: Store },
    { href: "/perfil", label: "Mi Perfil", icon: UserCircle },
  ],
};

const WORKSPACES: Record<string, string> = {
  admin: "Livora Operaciones",
  company: "Portal Corporativo ESG",
  centro: "Centro de Acopio",
  store: "Comercio Aliado POS",
};

const EYEBROWS: Record<string, string> = {
  admin: "Control de operaciones",
  company: "Portal corporativo",
  centro: "Dashboard industrial",
  store: "Punto de Venta Oficial",
};

import { Footer } from "@/components/Footer";

export function Shell({
  role,
  children,
}: {
  role: "admin" | "company" | "centro" | "store";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, balance, refreshBalance } = useAuth();
  const isFetching = useIsFetching();

  const [workspaceName, setWorkspaceName] = React.useState(WORKSPACES[role] || "Livora");
  const [eyebrowText, setEyebrowText] = React.useState(EYEBROWS[role] || "Plataforma Livora");

  useEffect(() => {
    const savedToken =
      getSecureCookie("livora_token") || localStorage.getItem("livora_token");
    if (!savedToken) {
      router.push("/login");
      return;
    }

    const currentRole = user?.role || localStorage.getItem("livora_role") || "";

    // 1. Bloquear y expulsar roles exclusivamente móviles de la Web
    if (["HOGAR", "RECOLECTOR"].includes(currentRole)) {
      logout();
      showToast(
        "Acceso no disponible en Web",
        "error",
        "Tu cuenta opera exclusivamente desde la app móvil Livora. Descárgala para continuar."
      );
      router.push("/login");
      return;
    }

    // 2. Control estricto con privilegio de auditoría para ADMIN
    if (currentRole === "ADMIN") {
      // ADMIN tiene libre acceso de auditoría a /admin, /company, /centro, /store y /perfil
      return;
    }

    if (currentRole === "EMPRESA_B2B") {
      if (pathname.startsWith("/admin") || pathname.startsWith("/centro") || pathname.startsWith("/store")) {
        showToast(
          "Acceso restringido",
          "error",
          "Acceso restringido: Redirigiendo a tu panel corporativo ESG."
        );
        router.push("/company");
      }
      return;
    }

    if (currentRole === "CENTRO_ACOPIO") {
      if (pathname.startsWith("/admin") || pathname.startsWith("/company") || pathname.startsWith("/store")) {
        showToast(
          "Acceso restringido",
          "error",
          "Acceso restringido: Redirigiendo a tu terminal de centro de acopio."
        );
        router.push("/centro");
      }
      return;
    }

    if (currentRole === "TIENDA") {
      if (pathname.startsWith("/admin") || pathname.startsWith("/company") || pathname.startsWith("/centro")) {
        showToast(
          "Acceso restringido",
          "error",
          "Acceso restringido: Redirigiendo a tu terminal POS de comercio."
        );
        router.push("/store");
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
      <TopLoadingBar />
      <aside className="sidebar">
        <Link className="brand" href={`/${role}`} style={{ textDecoration: "none" }}>
          <LivoraBrand size={36} />
        </Link>
        <div className="workspace">
          <small>Espacio de trabajo</small>
          <strong>{workspaceName}⌄</strong>
        </div>
        <nav className="nav">
          {items.map((i) => {
            const isActive =
              i.href === `/${role}`
                ? pathname === i.href
                : pathname === i.href || pathname.startsWith(`${i.href}/`);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={isActive ? "active" : ""}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <i.icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span>{i.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <Link className="user hover-glow" href="/perfil" style={{ display: "flex", gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="avatar">{initials}</span>
            <div>
              <strong>{email.split("@")[0]}</strong>
              <small>{user?.role || role.toUpperCase()}</small>
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
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={12} />
            <span>Cerrar sesión</span>
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
            {isFetching > 0 ? (
              <span
                className="live"
                style={{
                  borderColor: "rgba(16, 185, 129, 0.4)",
                  color: "#059669",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#059669",
                    display: "inline-block",
                    animation: "pulse-subtle 1.2s infinite ease-in-out",
                  }}
                />
                Sincronizando...
              </span>
            ) : (
              <span className="live">Red operativa</span>
            )}
            <button
              className="btn ghost"
              onClick={refreshBalance}
              title="Actualizar saldo"
              style={{ display: "grid", placeItems: "center", padding: 8 }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>
        <div className="content" style={{ flex: "1 0 auto", paddingBottom: "5rem" }}>{children}</div>
        <Footer />
      </main>

      <nav className="mobile-nav">
        {items.slice(0, 4).map((i) => {
          const isActive =
            i.href === `/${role}`
              ? pathname === i.href
              : pathname === i.href || pathname.startsWith(`${i.href}/`);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={isActive ? "active" : ""}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <i.icon size={16} />
              <span>{i.label}</span>
            </Link>
          );
        })}
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
