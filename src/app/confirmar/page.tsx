"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Detalhe = {
  nome_cliente: string;
  inicio: string;
  fim: string;
  status: string;
  confirmado: "pendente" | "confirmado" | "recusado";
};

function ConfirmarConteudo() {
  const params = useSearchParams();
  const token = params.get("t");

  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!token) {
        setCarregando(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .rpc("obter_agendamento_confirmacao_publico", { p_token: token })
          .single();
        if (error || !data) {
          setErro("Agendamento não encontrado.");
          return;
        }
        setDetalhe(data as Detalhe);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [token]);

  async function responder(confirmar: boolean) {
    if (!token) return;
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.rpc("confirmar_presenca_publico", {
      p_token: token,
      p_confirmado: confirmar,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setDetalhe((atual) => (atual ? { ...atual, confirmado: confirmar ? "confirmado" : "recusado" } : atual));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full ring-1 ring-white/20">
          <Image src={`${basePath}/logo.png`} alt="Flip Wash" fill className="object-cover" />
        </div>

        {carregando ? (
          <p className="mt-4 text-sm text-slate-400">Carregando...</p>
        ) : !detalhe ? (
          <p className="mt-4 text-sm text-red-400">{erro ?? "Link inválido."}</p>
        ) : (
          <>
            <h1 className="mt-4 text-lg font-semibold text-[#029cd9]">Confirme sua presença</h1>
            <p className="mt-2 text-sm text-slate-300">Olá, {detalhe.nome_cliente}!</p>
            <p className="mt-1 text-sm text-slate-400">
              Seu agendamento é dia{" "}
              {new Date(detalhe.inicio).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}{" "}
              às{" "}
              {new Date(detalhe.inicio).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              . Você vai comparecer?
            </p>

            {detalhe.confirmado !== "pendente" ? (
              <p
                className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
                  detalhe.confirmado === "confirmado"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {detalhe.confirmado === "confirmado"
                  ? "Presença confirmada! Te esperamos."
                  : "Você informou que não vai comparecer."}
              </p>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  disabled={enviando}
                  onClick={() => responder(true)}
                  className="flex-1 rounded-lg bg-emerald-500 py-2 font-medium text-white disabled:opacity-50"
                >
                  Vou comparecer
                </button>
                <button
                  disabled={enviando}
                  onClick={() => responder(false)}
                  className="flex-1 rounded-lg bg-red-500 py-2 font-medium text-white disabled:opacity-50"
                >
                  Não vou
                </button>
              </div>
            )}

            {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarConteudo />
    </Suspense>
  );
}
