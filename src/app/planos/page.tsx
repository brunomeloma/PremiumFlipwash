"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import type { Assinatura, Cliente, Plano } from "@/lib/types";

export default function PlanosPage() {
  const role = useRole();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);

  const [nome, setNome] = useState("");
  const [lavagens, setLavagens] = useState(4);
  const [preco, setPreco] = useState(0);
  const [erroPlano, setErroPlano] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [erroAssinatura, setErroAssinatura] = useState<string | null>(null);
  const [criandoCobranca, setCriandoCobranca] = useState(false);
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null);

  async function carregar() {
    const [{ data: planosData }, { data: clientesData }, { data: assinaturasData }] =
      await Promise.all([
        supabase.from("planos").select("*").eq("ativo", true).order("preco_mensal"),
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("assinaturas").select("*").eq("status", "ativo"),
      ]);
    setPlanos(planosData ?? []);
    setClientes(clientesData ?? []);
    setAssinaturas(assinaturasData ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o Supabase ao montar
    carregar();
  }, []);

  async function criarPlano(e: React.FormEvent) {
    e.preventDefault();
    setErroPlano(null);
    if (!nome.trim() || lavagens <= 0 || preco < 0) return;
    const { error } = await supabase
      .from("planos")
      .insert({ nome, lavagens_por_mes: lavagens, preco_mensal: preco });
    if (error) {
      setErroPlano(error.message);
      return;
    }
    setNome("");
    setLavagens(4);
    setPreco(0);
    carregar();
  }

  async function assinarPlano(e: React.FormEvent) {
    e.preventDefault();
    setErroAssinatura(null);
    setLinkPagamento(null);
    if (!clienteId || !planoId) return;
    const dataRenovacao = new Date();
    dataRenovacao.setMonth(dataRenovacao.getMonth() + 1);
    const { data: novaAssinatura, error } = await supabase
      .from("assinaturas")
      .insert({
        cliente_id: clienteId,
        plano_id: planoId,
        data_renovacao: dataRenovacao.toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) {
      setErroAssinatura(error.message);
      return;
    }

    setCriandoCobranca(true);
    const { data: cobranca, error: cobrancaErro } = await supabase.functions.invoke(
      "asaas-subscription",
      { body: { assinaturaId: novaAssinatura.id } }
    );
    setCriandoCobranca(false);

    if (cobrancaErro || cobranca?.error) {
      setErroAssinatura(
        `Assinatura criada, mas a cobrança recorrente falhou: ${cobranca?.error ?? cobrancaErro?.message}`
      );
    } else if (cobranca?.linkPagamento) {
      setLinkPagamento(cobranca.linkPagamento);
    }

    setClienteId("");
    setPlanoId("");
    carregar();
  }

  function nomeCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nome ?? "—";
  }
  function planoDoAssinante(id: string) {
    return planos.find((p) => p.id === id);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Planos e Combos Mensais</h1>

      {role === "admin" && (
        <form onSubmit={criarPlano} className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <input
            className="flex-1 min-w-[150px] rounded-lg bg-slate-800 px-3 py-2"
            placeholder="Nome do combo (ex: 4 lavagens/mês)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            className="w-28 rounded-lg bg-slate-800 px-3 py-2"
            type="number"
            min={1}
            placeholder="Lavagens/mês"
            value={lavagens}
            onChange={(e) => setLavagens(Number(e.target.value))}
          />
          <input
            className="w-28 rounded-lg bg-slate-800 px-3 py-2"
            type="number"
            min={0}
            step="0.01"
            placeholder="Preço R$"
            value={preco}
            onChange={(e) => setPreco(Number(e.target.value))}
          />
          <button className="rounded-lg bg-[#029cd9] px-4 py-2 font-medium text-white">
            Criar combo
          </button>
          {erroPlano && <p className="w-full text-sm text-red-400">{erroPlano}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {planos.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="font-medium">{p.nome}</p>
            <p className="text-sm text-slate-400">
              {p.lavagens_por_mes}x/mês · R$ {Number(p.preco_mensal).toFixed(2)} · R${" "}
              {(Number(p.preco_mensal) / p.lavagens_por_mes).toFixed(2)}/lavagem
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={assinarPlano} className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <select
          className="flex-1 min-w-[150px] rounded-lg bg-slate-800 px-3 py-2"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
        >
          <option value="">Selecione o cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          className="flex-1 min-w-[150px] rounded-lg bg-slate-800 px-3 py-2"
          value={planoId}
          onChange={(e) => setPlanoId(e.target.value)}
        >
          <option value="">Selecione o combo</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button disabled={criandoCobranca} className="rounded-lg bg-[#029cd9] px-4 py-2 font-medium text-white disabled:opacity-50">
          {criandoCobranca ? "Gerando cobrança..." : "Assinar plano"}
        </button>
        {erroAssinatura && <p className="w-full text-sm text-red-400">{erroAssinatura}</p>}
        {linkPagamento && (
          <p className="w-full text-sm text-emerald-400">
            Assinatura criada! Envie o link de pagamento pro cliente:{" "}
            <a href={linkPagamento} target="_blank" rel="noopener noreferrer" className="underline">
              {linkPagamento}
            </a>
          </p>
        )}
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-400">Assinaturas ativas</h2>
        {assinaturas.map((a) => {
          const plano = planoDoAssinante(a.plano_id);
          return (
            <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
              <span className="font-medium">{nomeCliente(a.cliente_id)}</span> — {plano?.nome} ·{" "}
              {a.lavagens_usadas}/{plano?.lavagens_por_mes} usadas · renova em{" "}
              {new Date(a.data_renovacao).toLocaleDateString("pt-BR")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
