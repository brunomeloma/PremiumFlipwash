"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSenha("");
    setConfirmarSenha("");
    setSucesso(true);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Meu Perfil</h1>

      <form onSubmit={trocarSenha} className="max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-medium text-slate-400">Trocar senha</h2>
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
        />
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          minLength={6}
          required
        />

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {sucesso && <p className="text-sm text-emerald-400">Senha atualizada com sucesso.</p>}

        <button
          type="submit"
          disabled={salvando}
          className="w-full rounded-lg bg-[#029cd9] py-2 font-medium text-white disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
