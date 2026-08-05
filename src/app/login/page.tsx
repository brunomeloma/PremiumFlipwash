"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { nome } },
          });

    setLoading(false);

    if (result.error) {
      setErro(result.error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-slate-100">
      {/* Foto real do lava-jato ao fundo */}
      <Image
        src={`${basePath}/hero-car.jpg`}
        alt="Veículo detalhado na Flip Wash"
        fill
        priority
        className="object-cover"
      />
      {/* Gradiente pra dar contraste e cobrir a marca-d'água original da foto */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-md"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-1 ring-white/20">
            <Image src={`${basePath}/logo.png`} alt="Flip Wash" fill className="object-cover" />
          </div>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-slate-300">
            {mode === "login" ? "Entrar no sistema" : "Criar conta"}
          </p>
        </div>

        {mode === "signup" && (
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-white/30"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        )}
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-white/30"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-white/30"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
        />

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white py-2 font-medium text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
        >
          {mode === "login" ? "Criar uma conta nova" : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}
