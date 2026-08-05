"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const WHATSAPP_LAVA_JATO = "5599991883093";

const HORA_ABERTURA = 8;
const HORA_FECHAMENTO = 18;
const INTERVALO_MIN = 30;
const DURACAO_PADRAO = 60;

const TIPOS_VEICULO = [
  { value: "hatch", label: "Hatch" },
  { value: "sedan", label: "Sedã" },
  { value: "suv_picape", label: "SUV / Picape" },
] as const;

const FUSO_LOJA = "America/Sao_Paulo";

function hojeISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_LOJA }).format(new Date());
}

type Ocupado = { inicio: string; fim: string };

export default function AgendarPage() {
  const [data, setData] = useState(hojeISO());
  const duracao = DURACAO_PADRAO;
  const [tipoVeiculo, setTipoVeiculo] = useState<"" | (typeof TIPOS_VEICULO)[number]["value"]>("");
  const [horario, setHorario] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [ocupados, setOcupados] = useState<Ocupado[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o Supabase ao trocar de data
    setCarregandoHorarios(true);
    setHorario("");
    supabase
      .rpc("horarios_ocupados_publico", { dia: data })
      .then(({ data: rows }) => {
        setOcupados((rows as Ocupado[]) ?? []);
        setCarregandoHorarios(false);
      });
  }, [data]);

  const horariosDisponiveis = useMemo(() => {
    const opcoes: { horario: string; concorrido: boolean }[] = [];
    const agora = new Date();
    for (let h = HORA_ABERTURA * 60; h < HORA_FECHAMENTO * 60; h += INTERVALO_MIN) {
      const horas = Math.floor(h / 60);
      const minutos = h % 60;
      const inicio = new Date(
        `${data}T${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00-03:00`
      );
      const fim = new Date(inicio.getTime() + duracao * 60_000);

      if (h + duracao > HORA_FECHAMENTO * 60) continue;
      if (inicio < agora) continue;

      const concorrido = ocupados.some((o) => {
        const oInicio = new Date(o.inicio);
        const oFim = new Date(o.fim);
        return inicio < oFim && fim > oInicio;
      });
      opcoes.push({ horario: `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`, concorrido });
    }
    return opcoes;
  }, [data, duracao, ocupados]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!horario) {
      setErro("Escolha um horário disponível.");
      return;
    }
    setEnviando(true);

    const inicio = new Date(`${data}T${horario}:00-03:00`);
    const { error } = await supabase.rpc("criar_agendamento_publico", {
      p_nome: nome,
      p_telefone: telefone,
      p_placa: placa || null,
      p_inicio: inicio.toISOString(),
      p_duracao_min: duracao,
      p_tipo_veiculo: tipoVeiculo || null,
    });

    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setConfirmado(true);
  }

  if (confirmado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full ring-1 ring-white/20">
            <Image src={`${basePath}/logo.png`} alt="Flip Wash" fill className="object-cover" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[#029cd9]">Agendamento confirmado!</h1>
          <p className="mt-2 text-sm text-slate-400">
            {new Date(`${data}T${horario}:00-03:00`).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}{" "}
            às {horario}. Te esperamos na Flip Wash!
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_LAVA_JATO}?text=${encodeURIComponent(
              `Oi! Acabei de agendar uma lavagem para ${new Date(`${data}T${horario}:00-03:00`).toLocaleDateString(
                "pt-BR"
              )} às ${horario}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block w-full rounded-lg bg-emerald-500 py-2 font-medium text-white"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <div className="mx-auto max-w-sm space-y-6 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-white/20">
            <Image src={`${basePath}/logo.png`} alt="Flip Wash" fill className="object-cover" />
          </div>
          <h1 className="mt-3 text-xl font-semibold text-white">Agende sua lavagem</h1>
          <p className="text-sm text-slate-400">Escolha o melhor dia e horário</p>
          <a
            href={`https://wa.me/${WHATSAPP_LAVA_JATO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm text-emerald-400 underline"
          >
            Dúvidas? Fale no WhatsApp
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Data</label>
            <input
              type="date"
              className="w-full rounded-lg bg-slate-800 px-3 py-2"
              value={data}
              min={hojeISO()}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Tipo do veículo</label>
            <select
              className="w-full rounded-lg bg-slate-800 px-3 py-2"
              value={tipoVeiculo}
              onChange={(e) => setTipoVeiculo(e.target.value as typeof tipoVeiculo)}
            >
              <option value="">Não sei / prefiro não informar</option>
              {TIPOS_VEICULO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Horário</label>
            {carregandoHorarios ? (
              <p className="text-sm text-slate-500">Carregando horários...</p>
            ) : horariosDisponiveis.length === 0 ? (
              <p className="text-sm text-slate-500">Sem horários dentro do funcionamento nesse dia.</p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {horariosDisponiveis.map(({ horario: h, concorrido }) => (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setHorario(h)}
                      className={`relative rounded-lg py-2 text-sm ${
                        horario === h
                          ? "bg-[#029cd9] text-white font-medium"
                          : concorrido
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {h}
                      {concorrido && horario !== h && <span className="ml-1 text-[10px]">●</span>}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="text-amber-400">●</span> já tem gente marcada nesse horário — pode escolher
                  mesmo assim, se estiver cheio a gente confirma com você por mensagem.
                </p>
              </>
            )}
          </div>

          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            placeholder="Telefone / WhatsApp"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            placeholder="Placa do veículo (opcional)"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
          />

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-[#029cd9] py-2 font-medium text-white disabled:opacity-50"
          >
            {enviando ? "Agendando..." : "Confirmar agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
