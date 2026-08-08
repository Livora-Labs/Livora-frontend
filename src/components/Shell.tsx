"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BatchIcon,
  BlockchainIcon,
  CertificateIcon,
  DashboardIcon,
  InventoryIcon,
  PurchaseIcon,
  TraceIcon,
  UsersIcon,
} from "./Icons";
type Item = {
  href: string;
  label: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
};
const admin: Item[] = [
  { href: "/admin", label: "Resumen", icon: DashboardIcon },
  { href: "/admin/batches", label: "Lotes", icon: BatchIcon },
  { href: "/admin/certificates", label: "Certificados", icon: CertificateIcon },
  { href: "/admin/inventory", label: "Inventario", icon: InventoryIcon },
  { href: "/admin/users-kyc", label: "Usuarios y KYC", icon: UsersIcon },
  { href: "/admin/blockchain", label: "Blockchain", icon: BlockchainIcon },
];
const company: Item[] = [
  { href: "/company", label: "Resumen ESG", icon: DashboardIcon },
  {
    href: "/company/certificates",
    label: "Certificados",
    icon: CertificateIcon,
  },
  { href: "/company/purchases", label: "Compras", icon: PurchaseIcon },
  { href: "/company/traceability", label: "Trazabilidad", icon: TraceIcon },
];
function isActive(path: string, href: string) {
  return (
    path === href ||
    (href !== "/admin" && href !== "/company" && path.startsWith(href + "/"))
  );
}
export function Shell({
  role,
  children,
}: {
  role: "admin" | "company";
  children: ReactNode;
}) {
  const path = usePathname();
  const items = role === "admin" ? admin : company;
  const name = role === "admin" ? "Livora Operaciones" : "Coca-Cola Perú";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href={role === "admin" ? "/admin" : "/company"}>
          <span className="brandmark" />
          Livora
        </Link>
        <div className="workspace">
          <small>Espacio de trabajo</small>
          <strong>
            {name}
            <span>⌄</span>
          </strong>
        </div>
        <nav className="nav">
          {items.map((i) => {
            const Icon = i.icon;
            return (
              <Link
                className={isActive(path, i.href) ? "active" : ""}
                key={i.href}
                href={i.href}
              >
                <Icon />
                <span>{i.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="user">
            <span className="avatar">{role === "admin" ? "LM" : "CC"}</span>
            <div>
              <strong>
                {role === "admin" ? "Lucía Mendoza" : "Equipo ESG"}
              </strong>
              <small>
                {role === "admin" ? "Administradora" : "empresa@cocacola.pe"}
              </small>
            </div>
          </div>
          <Link href="/" className="muted logout">
            ← Cambiar perfil
          </Link>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <Link
            className="mobile-brand brand"
            href={role === "admin" ? "/admin" : "/company"}
          >
            <span className="brandmark" />
            Livora
          </Link>
          <span className="eyebrow desktop-title">
            {role === "admin" ? "Control de operaciones" : "Portal corporativo"}
          </span>
          <div className="top-actions">
            <span className="live">Red operativa</span>
            <button className="btn ghost" aria-label="Notificaciones">
              ●
            </button>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
      <nav className="mobile-nav">
        {items.map((i) => {
          const Icon = i.icon;
          return (
            <Link
              className={isActive(path, i.href) ? "active" : ""}
              key={i.href}
              href={i.href}
            >
              <Icon />
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
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-action">{action}</div>}
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
    <div
      className="card kpi"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="trend">{trend}</div>
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status ${value}`}>{value.replaceAll("_", " ")}</span>
  );
}
