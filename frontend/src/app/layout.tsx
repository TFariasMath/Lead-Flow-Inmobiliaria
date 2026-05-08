import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./fonts.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lead Flow — Gestión de Leads Inmobiliarios",
  description:
    "Plataforma de inversión inmobiliaria para centralizar y gestionar contactos de diversas fuentes con resolución de identidad inteligente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
