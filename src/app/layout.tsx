import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CookieBanner } from "@/components/CookieBanner";

export const metadata = {
  title: "Livora — Trazabilidad que transforma",
  description: "Plataforma de trazabilidad de reciclaje, canje Web3 y cumplimiento ESG",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
