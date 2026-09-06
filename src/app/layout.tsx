import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CookieBanner } from "@/components/CookieBanner";
import { QueryProvider } from "@/lib/queryClient";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { isMaintenanceMode } from "@/lib/flags";
import { MaintenanceMode } from "@/components/MaintenanceMode";

export const viewport: Viewport = {
  themeColor: "#0A192F",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Livora — Trazabilidad que transforma",
  description: "Plataforma de trazabilidad de reciclaje, canje Web3 y cumplimiento ESG sobre Stellar/Soroban",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Livora",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const maintenance = isMaintenanceMode();

  return (
    <html lang="es">
      <body>
        <WebVitalsReporter />
        {maintenance ? (
          <MaintenanceMode />
        ) : (
          <QueryProvider>
            <AuthProvider>
              {children}
              <CookieBanner />
              <NetworkStatusIndicator />
            </AuthProvider>
          </QueryProvider>
        )}
      </body>
    </html>
  );
}
