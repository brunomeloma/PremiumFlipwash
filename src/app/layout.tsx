import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Flip Wash | Gestão do Lava-Jato",
  description: "Sistema de gestão da Flip Wash: clientes, veículos, planos mensais, agenda e financeiro.",
  icons: {
    icon: `${basePath}/icon-512.png`,
    apple: `${basePath}/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flip Wash",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100">
        <RegistrarServiceWorker />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
