"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";

const PUBLIC_ROUTES = ["/login", "/agendar"];

const NAV_ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/agenda", label: "Agenda" },
  { href: "/clientes", label: "Clientes" },
  { href: "/planos", label: "Planos" },
  { href: "/financeiro", label: "Financeiro", adminOnly: true },
  { href: "/instalar", label: "Instalar" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const role = useRole();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (session === null && !isPublicRoute) {
      router.replace("/login");
    }
  }, [session, isPublicRoute, router]);

  useEffect(() => {
    if (pathname === "/financeiro" && role === "funcionario") {
      router.replace("/");
    }
  }, [pathname, role, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        Carregando...
      </div>
    );
  }

  if (session === null) {
    return null;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-[#029cd9]">Flip Wash</span>
        <div className="flex items-center gap-4">
          <Link href="/perfil" className="text-sm text-slate-400 hover:text-slate-100">
            Meu perfil
          </Link>
          <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-slate-100">
            Sair
          </button>
        </div>
      </header>
      <nav className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-slate-800">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
              pathname === item.href
                ? "bg-[#029cd9] text-white font-medium"
                : "bg-slate-900 text-slate-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
