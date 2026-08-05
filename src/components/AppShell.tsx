"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/agenda", label: "Agenda" },
  { href: "/clientes", label: "Clientes" },
  { href: "/planos", label: "Planos" },
  { href: "/financeiro", label: "Financeiro" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null && pathname !== "/login") {
      router.replace("/login");
    }
  }, [session, pathname, router]);

  if (pathname === "/login") {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-[#029cd9]">Flip Wash</span>
        <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-slate-100">
          Sair
        </button>
      </header>
      <nav className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-slate-800">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
              pathname === item.href
                ? "bg-[#029cd9] text-white font-medium"
                : "bg-slate-900 text-slate-300"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
