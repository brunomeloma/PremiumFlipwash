"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PainelPage() {
  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
  const [planosAtivos, setPlanosAtivos] = useState(0);
  const [atendimentosHoje, setAtendimentosHoje] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const inicioDoDia = new Date();
      inicioDoDia.setHours(0, 0, 0, 0);

      try {
        const [vendasRes, assinaturasRes, agendamentosRes] = await Promise.all([
          supabase
            .from("vendas")
            .select("valor")
            .gte("created_at", inicioDoDia.toISOString()),
          supabase
            .from("assinaturas")
            .select("id", { count: "exact", head: true })
            .eq("status", "ativo"),
          supabase
            .from("agendamentos")
            .select("id", { count: "exact", head: true })
            .gte("inicio", inicioDoDia.toISOString()),
        ]);

        const total = (vendasRes.data ?? []).reduce((sum, v) => sum + Number(v.valor), 0);
        setFaturamentoHoje(total);
        setPlanosAtivos(assinaturasRes.count ?? 0);
        setAtendimentosHoje(agendamentosRes.count ?? 0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Faturamento hoje", value: `R$ ${faturamentoHoje.toFixed(2)}` },
    { label: "Planos ativos", value: planosAtivos },
    { label: "Atendimentos hoje", value: atendimentosHoje },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Painel</h1>
      {loading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#029cd9]">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
