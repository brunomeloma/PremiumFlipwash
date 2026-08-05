"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import type { Assinatura, Cliente, Plano } from "@/lib/types";
import { liquidoCartaoAVista, liquidoPix } from "@/lib/taxasAsaas";

const STATUS_ASSINATURA_LABEL: Record<Assinatura["status"], string> = {
  pendente: "Aguardando 1º pagamento",
  ativo: "Ativa",
  vencido: "Cartão recusado",
  cancelado: "Cancelada",
};

const STATUS_ASSINATURA_COR: Record<Assinatura["status"], string> = {
  pendente: "bg-amber-500/20 text-amber-300",
  ativo: "bg-emerald-500/20 text-emerald-300",
  vencido: "bg-red-500/20 text-red-300",
  cancelado: "bg-slate-500/20 text-slate-400",
};

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
        supabase.from("assinaturas").select("*").neq("status", "cancelado"),
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
      <div>
        <h1 className="text-lg font-semibold">Planos e Combos Mensais</h1>
        <p className="text-sm text-slate-400">Pacotes de lavagem recorrente e assinaturas de clientes</p>
      </div>

      {role === "admin" && (
        <form
          onSubmit={criarPlano}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Nome do combo</label>
            <input
              className="w-full rounded-lg bg-slate-800 px-3 py-2"
              placeholder="Ex: Completa 4x/mês"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Lavagens/mês</label>
            <input
              className="w-full rounded-lg bg-slate-800 px-3 py-2"
              type="number"
              min={1}
              value={lavagens}
              onChange={(e) => setLavagens(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Preço mensal (R$)</label>
            <input
              className="w-full rounded-lg bg-slate-800 px-3 py-2"
              type="number"
              min={0}
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end lg:col-span-4">
            <button className="rounded-lg bg-[#029cd9] px-4 py-2 font-medium text-white">
              Criar combo
            </button>
          </div>
          {erroPlano && <p className="text-sm text-red-400 lg:col-span-4">{erroPlano}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {planos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 sm:col-span-2">
            Nenhum combo cadastrado ainda.
          </p>
        ) : (
          planos.map((p) => {
            const preco = Number(p.preco_mensal);
            return (
              <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="font-medium">{p.nome}</p>
                <p className="text-sm text-slate-400">
                  {p.lavagens_por_mes}x/mês · R$ {preco.toFixed(2)} · R${" "}
                  {(preco / p.lavagens_por_mes).toFixed(2)}/lavagem
                </p>
                {role === "admin" && (
                  <p className="mt-2 text-xs text-slate-500">
                    Você recebe: <span className="text-emerald-400">Pix R$ {liquidoPix(preco).toFixed(2)}</span> (na
                    hora) · <span className="text-amber-400">Cartão R$ {liquidoCartaoAVista(preco).toFixed(2)}</span>{" "}
                    (em 32 dias)
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={assinarPlano}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-xs text-slate-400">Cliente</label>
          <select
            className="w-full rounded-lg bg-slate-800 px-3 py-2"
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
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Combo</label>
          <select
            className="w-full rounded-lg bg-slate-800 px-3 py-2"
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
        </div>
        <div className="flex items-end">
          <button
            disabled={criandoCobranca}
            className="w-full rounded-lg bg-[#029cd9] px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {criandoCobranca ? "Gerando cobrança..." : "Assinar plano"}
          </button>
        </div>
        {erroAssinatura && <p className="text-sm text-red-400 sm:col-span-3">{erroAssinatura}</p>}
        {linkPagamento && (
          <p className="text-sm text-emerald-400 sm:col-span-3">
            Assinatura criada! Envie o link de pagamento pro cliente:{" "}
            <a href={linkPagamento} target="_blank" rel="noopener noreferrer" className="underline">
              {linkPagamento}
            </a>
          </p>
        )}
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-400">Assinaturas</h2>
        <p className="text-xs text-slate-500">
          Uma assinatura só fica &quot;Ativa&quot; depois que a Asaas confirma o primeiro pagamento. Enquanto isso,
          não libere as lavagens do combo.
        </p>
        {assinaturas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            Nenhuma assinatura ainda.
          </p>
        ) : (
          assinaturas.map((a) => {
            const plano = planoDoAssinante(a.plano_id);
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{nomeCliente(a.cliente_id)}</span> — {plano?.nome} ·{" "}
                  {a.lavagens_usadas}/{plano?.lavagens_por_mes} usadas · renova em{" "}
                  {new Date(a.data_renovacao).toLocaleDateString("pt-BR")}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_ASSINATURA_COR[a.status]}`}>
                  {STATUS_ASSINATURA_LABEL[a.status]}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
