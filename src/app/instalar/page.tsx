"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstalarPage() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setInstalado(true);
      setPromptEvent(null);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function instalar() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setInstalado(true);
    }
    setPromptEvent(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-white/20">
          <Image src={`${basePath}/logo.png`} alt="Flip Wash" fill className="object-cover" />
        </div>
        <h1 className="mt-3 text-lg font-semibold">Instalar o Flip Wash</h1>
        <p className="text-sm text-slate-400">
          Deixa um atalho fixo no computador ou celular, como se fosse um aplicativo — abre direto, sem precisar
          digitar o link.
        </p>
      </div>

      <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
        {instalado ? (
          <p className="text-emerald-400">✓ Instalado! Já pode fixar o ícone na barra de tarefas.</p>
        ) : promptEvent ? (
          <button
            onClick={instalar}
            className="w-full rounded-lg bg-[#029cd9] py-3 font-medium text-white"
          >
            Instalar agora
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            Seu navegador ainda não liberou a instalação automática nesta página. Siga as instruções abaixo pro seu
            aparelho.
          </p>
        )}
      </div>

      <div className="mx-auto max-w-md space-y-4 text-sm text-slate-300">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="font-medium text-white">💻 Computador (Chrome ou Edge)</p>
          <p className="mt-1 text-slate-400">
            Clica no botão &quot;Instalar agora&quot; acima. Se não aparecer, procura o ícone de instalar (
            <span className="rounded bg-slate-800 px-1">⊕</span> ou uma tela com seta) do lado direito da barra de
            endereço, clica nele e depois em &quot;Instalar&quot;. Depois é só clicar com o botão direito no ícone
            que aparece na barra de tarefas e escolher &quot;Fixar na barra de tarefas&quot;.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="font-medium text-white">📱 Celular Android (Chrome)</p>
          <p className="mt-1 text-slate-400">
            Toca nos 3 pontinhos (⋮) no canto superior direito → &quot;Adicionar à tela inicial&quot; → &quot;Instalar&quot;.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="font-medium text-white">📱 iPhone (Safari)</p>
          <p className="mt-1 text-slate-400">
            Toca no botão de compartilhar (o quadrado com a seta para cima) → &quot;Adicionar à Tela de Início&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
