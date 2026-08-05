"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Agendamento, Cliente, Veiculo } from "@/lib/types";

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

function agoraLocalISO() {
  const d = new Date();
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

  function nomeCliente(id: string) {
    return clientes.find((c) => c.id === id)?.nome ?? "—";
  }

  function placaVeiculo(id: string | null) {
    if (!id) return null;
    return veiculos.find((v) => v.id === id)?.placa ?? null;
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
            const placa = placaVeiculo(a.veiculo_id);
            return (
              <div
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 border-l-4 bg-slate-900 p-3 text-sm ${STATUS_COR[a.status]}`}
              >
                <div>
                  <p className="font-medium">
                    {nomeCliente(a.cliente_id)}
                    {placa && <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{placa}</span>}
                  </p>
                  <p className="text-slate-400">
                    {new Date(a.inicio).toLocaleString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
            );
          })
        )}
      </div>
    </div>
  );
}
