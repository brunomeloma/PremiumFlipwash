"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:grid lg:grid-cols-2">
      <CarWashHero />

      <div className="flex items-center justify-center p-4 py-8 lg:min-h-screen">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <h1 className="text-xl font-semibold text-white">Flip Wash</h1>
            <p className="text-sm text-slate-400">
              {mode === "login" ? "Entrar no sistema" : "Criar conta"}
            </p>
          </div>

          {mode === "signup" && (
            <input
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          )}
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
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
            className="w-full rounded-lg bg-white py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-sm text-slate-400"
          >
            {mode === "login" ? "Criar uma conta nova" : "Já tenho conta"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CarWashHero() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black px-6 pb-6 pt-8 lg:min-h-screen lg:justify-center lg:gap-10 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
      {/* Bolhas de sabão flutuando */}
      <div className="pointer-events-none absolute inset-0">
        {SUDS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full border border-white/10 bg-white/5"
            style={{
              width: s.size,
              height: s.size,
              left: s.left,
              top: s.top,
              animation: `flip-wash-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center lg:text-left">
        <span className="text-lg font-semibold tracking-widest text-white">FLIP WASH</span>
        <p className="mt-1 text-sm text-slate-400">Premium Barbearia · Lava-Jato</p>
      </div>

      <div className="relative z-10">
        <p className="mb-5 text-center text-lg font-semibold leading-snug text-white lg:mb-6 lg:max-w-xs lg:text-left lg:text-2xl">
          Gestão completa do seu lava-jato, do agendamento ao caixa.
        </p>
        <CarIllustration />
        {/* Linha da água / piso molhado */}
        <div className="mt-2 h-2 w-full rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent blur-[2px]" />
        <div className="mt-1 flex justify-center gap-1.5 lg:justify-start">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-white/40"
              style={{ animation: `flip-wash-drop 1.6s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes flip-wash-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-14px) scale(1.08); opacity: 0.9; }
        }
        @keyframes flip-wash-drop {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(3px); }
        }
      `}</style>
    </div>
  );
}

function CarIllustration() {
  return (
    <svg viewBox="0 0 400 170" className="w-full max-w-sm mx-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)] lg:max-w-none lg:mx-0">
      {/* jato de água lavando o carro */}
      <g stroke="white" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round">
        <path d="M20 20 L70 70" strokeDasharray="6 6" />
        <path d="M15 45 L65 85" strokeDasharray="6 6" />
      </g>
      {/* bico da mangueira */}
      <circle cx="14" cy="14" r="6" fill="white" fillOpacity="0.9" />

      {/* respingos de água ao redor do carro */}
      <g stroke="white" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round">
        <line x1="34" y1="70" x2="12" y2="60" />
        <line x1="34" y1="92" x2="8" y2="92" />
        <line x1="38" y1="112" x2="16" y2="124" />
        <line x1="366" y1="65" x2="390" y2="54" />
        <line x1="368" y1="92" x2="394" y2="92" />
        <line x1="364" y1="114" x2="386" y2="126" />
      </g>

      {/* corpo do carro */}
      <path
        d="M40 128 C40 110 55 106 75 102 L110 78 C120 70 135 65 150 65 L250 65 C265 65 280 70 290 78 L322 102 C342 106 358 112 360 128 L360 138 C360 143 356 146 351 146 L49 146 C44 146 40 143 40 138 Z"
        fill="white"
      />
      <path
        d="M118 78 L145 68 C150 66 156 65 162 65 L238 65 C246 65 253 67 259 71 L286 88 Z"
        fill="#0f172a"
        opacity="0.85"
      />
      {/* faixa preta lateral */}
      <path d="M40 126 L360 126 L360 132 L40 132 Z" fill="#0f172a" opacity="0.9" />

      {/* rodas */}
      <circle cx="112" cy="142" r="18" fill="#0f172a" />
      <circle cx="112" cy="142" r="8" fill="white" />
      <circle cx="288" cy="142" r="18" fill="#0f172a" />
      <circle cx="288" cy="142" r="8" fill="white" />

      {/* bolhas de espuma sobre o carro */}
      <g fill="white" fillOpacity="0.9">
        <circle cx="150" cy="58" r="5" />
        <circle cx="165" cy="50" r="7" />
        <circle cx="182" cy="56" r="4" />
        <circle cx="205" cy="48" r="6" />
        <circle cx="225" cy="56" r="4" />
        <circle cx="245" cy="50" r="5" />
        <circle cx="130" cy="52" r="4" />
      </g>
    </svg>
  );
}

const SUDS = [
  { size: 40, left: "8%", top: "12%", duration: 6, delay: 0 },
  { size: 24, left: "22%", top: "28%", duration: 5, delay: 0.6 },
  { size: 60, left: "70%", top: "8%", duration: 7, delay: 0.3 },
  { size: 28, left: "82%", top: "30%", duration: 5.5, delay: 1 },
  { size: 18, left: "60%", top: "18%", duration: 4.5, delay: 0.8 },
  { size: 34, left: "12%", top: "45%", duration: 6.5, delay: 1.2 },
];
