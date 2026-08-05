"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Agendamento, Cliente, Veiculo } from "@/lib/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STATUS_LABEL: Record<Agendamento["status"], string> = {
  agendado: "Agendado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COR: Record<Agendamento["status"], string> = {
  agendado: "border-l-[#029cd9]",
  em_andamento: "border-l-amber-400",
  concluido: "border-l-emerald-400",
  cancelado: "border-l-slate-600 opacity-60",
};

const TIPO_VEICULO_LABEL: Record<NonNullable<Veiculo["tipo"]>, string> = {
  hatch: "Hatch",
  sedan: "Sedã",
  suv_picape: "SUV/Picape",
};

const CONFIRMADO_LABEL: Record<Agendamento["confirmado"], string> = {
  pendente: "Confirmação pendente",
  confirmado: "Confirmou presença",
  recusado: "Não vai comparecer",
};

const CONFIRMADO_COR: Record<Agendamento["confirmado"], string> = {
  pendente: "bg-slate-500/20 text-slate-400",
  confirmado: "bg-emerald-500/20 text-emerald-300",
  recusado: "bg-red-500/20 text-red-300",
};

function agoraLocalISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function paraDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AgendaPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [inicio, setInicio] = useState("");
  const [duracaoMin, setDuracaoMin] = useState(30);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [remarcandoId, setRemarcandoId] = useState<string | null>(null);
  const [novoInicio, setNovoInicio] = useState("");
  const [novaDuracao, setNovaDuracao] = useState(30);
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null);

  async function carregar() {
    const [{ data: agendamentosData }, { data: clientesData }, { data: veiculosData }] =
      await Promise.all([
        supabase.from("agendamentos").select("*").order("inicio"),
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("veiculos").select("*"),
      ]);
    setAgendamentos(agendamentosData ?? []);
    setClientes(clientesData ?? []);
    setVeiculos(veiculosData ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o Supabase ao montar
    carregar();
  }, []);

  async function criarAgendamento(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!clienteId || !inicio) return;

    const dataInicio = new Date(inicio);
    const dataFim = new Date(dataInicio.getTime() + duracaoMin * 60_000);

    setSalvando(true);
    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: clienteId,
      veiculo_id: veiculoId || null,
      inicio: dataInicio.toISOString(),
      fim: dataFim.toISOString(),
    });
    setSalvando(false);

    if (error) {
      setErro(
        error.code === "23P01"
          ? "Já existe um agendamento nesse horário."
          : error.message
      );
      return;
    }

    setClienteId("");
    setVeiculoId("");
    setInicio("");
    carregar();
  }

  async function mudarStatus(id: string, status: Agendamento["status"]) {
    await supabase.from("agendamentos").update({ status }).eq("id", id);
    carregar();
  }

  async function marcarCompareceu(id: string, compareceu: boolean) {
    await supabase.from("agendamentos").update({ compareceu }).eq("id", id);
    carregar();
  }

  function abrirRemarcar(a: Agendamento) {
    setRemarcandoId(a.id);
    setNovoInicio(paraDatetimeLocal(a.inicio));
    setNovaDuracao(Math.round((new Date(a.fim).getTime() - new Date(a.inicio).getTime()) / 60_000));
  }

  async function confirmarRemarcacao(e: React.FormEvent) {
    e.preventDefault();
    if (!remarcandoId || !novoInicio) return;
    const novoInicioDate = new Date(novoInicio);
    const novoFimDate = new Date(novoInicioDate.getTime() + novaDuracao * 60_000);
    const { error } = await supabase
      .from("agendamentos")
      .update({ inicio: novoInicioDate.toISOString(), fim: novoFimDate.toISOString() })
      .eq("id", remarcandoId);
    if (error) {
      setErro(error.code === "23P01" ? "Já existe um agendamento nesse horário." : error.message);
      return;
    }
    setRemarcandoId(null);
    carregar();
  }

  async function copiarLinkConfirmacao(a: Agendamento) {
    const link = `${window.location.origin}${basePath}/confirmar?t=${a.confirmacao_token}`;
    await navigator.clipboard.writeText(link);
    setLinkCopiadoId(a.id);
    setTimeout(() => setLinkCopiadoId((atual) => (atual === a.id ? null : atual)), 2000);
  }

  function nomeCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nome ?? "—";
  }

  function veiculoDoAgendamento(id: string | null) {
    if (!id) return null;
    return veiculos.find((v) => v.id === id) ?? null;
  }

  const agendamentosOrdenados = [...agendamentos].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Agenda</h1>
        <p className="text-sm text-slate-400">Marque horários e acompanhe os atendimentos do dia</p>
      </div>

      <form
        onSubmit={criarAgendamento}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs text-slate-400">Cliente</label>
          <select
            className="w-full rounded-lg bg-slate-800 px-3 py-2"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            <option value="">Selecione</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Veículo (opcional)</label>
          <select
            className="w-full rounded-lg bg-slate-800 px-3 py-2"
            value={veiculoId}
            onChange={(e) => setVeiculoId(e.target.value)}
          >
            <option value="">Nenhum</option>
            {veiculos
              .filter((v) => v.cliente_id === clienteId)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Data e horário</label>
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2"
            type="datetime-local"
            value={inicio}
            min={agoraLocalISO()}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Duração (minutos)</label>
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg bg-slate-800 px-3 py-2"
              type="number"
              min={10}
              step={5}
              value={duracaoMin}
              onChange={(e) => setDuracaoMin(Number(e.target.value))}
            />
            <button
              disabled={salvando}
              className="whitespace-nowrap rounded-lg bg-[#029cd9] px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {salvando ? "..." : "Agendar"}
            </button>
          </div>
        </div>

        {erro && <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-4">{erro}</p>}
      </form>

      <div className="space-y-2">
        {agendamentosOrdenados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            Nenhum agendamento ainda. Use o formulário acima ou compartilhe o link público de agendamento.
          </p>
        ) : (
          agendamentosOrdenados.map((a) => {
            const veiculo = veiculoDoAgendamento(a.veiculo_id);
            return (
              <div
                key={a.id}
                className={`space-y-2 rounded-xl border border-slate-800 border-l-4 bg-slate-900 p-3 text-sm ${STATUS_COR[a.status]}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {nomeCliente(a.cliente_id)}
                      {veiculo && (
                        <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                          {veiculo.placa}
                          {veiculo.tipo && ` · ${TIPO_VEICULO_LABEL[veiculo.tipo]}`}
                        </span>
                      )}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${CONFIRMADO_COR[a.confirmado]}`}>
                        {CONFIRMADO_LABEL[a.confirmado]}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      {new Date(a.inicio).toLocaleString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {a.compareceu !== null && (
                        <span className={a.compareceu ? "ml-2 text-emerald-400" : "ml-2 text-red-400"}>
                          {a.compareceu ? "· Compareceu" : "· Não compareceu"}
                        </span>
                      )}
                    </p>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => mudarStatus(a.id, e.target.value as Agendamento["status"])}
                    className="rounded-lg bg-slate-800 px-2 py-1.5"
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => marcarCompareceu(a.id, true)}
                    className="rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-300"
                  >
                    Veio
                  </button>
                  <button
                    onClick={() => marcarCompareceu(a.id, false)}
                    className="rounded-lg bg-red-500/20 px-2 py-1 text-red-300"
                  >
                    Não veio
                  </button>
                  <button
                    onClick={() => abrirRemarcar(a)}
                    className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300"
                  >
                    Remarcar
                  </button>
                  <button
                    onClick={() => copiarLinkConfirmacao(a)}
                    className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300"
                  >
                    {linkCopiadoId === a.id ? "Link copiado!" : "Copiar link de confirmação"}
                  </button>
                </div>

                {remarcandoId === a.id && (
                  <form
                    onSubmit={confirmarRemarcacao}
                    className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2"
                  >
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Novo horário</label>
                      <input
                        type="datetime-local"
                        className="rounded-lg bg-slate-800 px-2 py-1.5 text-sm"
                        value={novoInicio}
                        min={agoraLocalISO()}
                        onChange={(e) => setNovoInicio(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Duração (min)</label>
                      <input
                        type="number"
                        min={10}
                        step={5}
                        className="w-20 rounded-lg bg-slate-800 px-2 py-1.5 text-sm"
                        value={novaDuracao}
                        onChange={(e) => setNovaDuracao(Number(e.target.value))}
                      />
                    </div>
                    <button className="rounded-lg bg-[#029cd9] px-3 py-1.5 text-sm font-medium text-white">
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemarcandoId(null)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
