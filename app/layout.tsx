// app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LegalFlow - Gestão Jurídica Inteligente com IA",
  description:
    "Gerencie processos, prazos e clientes com IA. A plataforma que advogados modernos usam para economizar horas de trabalho manual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" className="scroll-smooth">
        <body className={`${dmSans.variable} ${plusJakarta.variable} font-sans`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
